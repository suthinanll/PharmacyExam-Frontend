'use client';
import { useNotifications } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

export default function NotificationDebugPage() {
    const { user, getToken, isLoading: authLoading } = useAuth();
    const { notifications, unreadCount, isConnected, fetchNotifications } = useNotifications();
    const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';

    const [logs, setLogs] = useState<string[]>([]);

    const addLog = (msg: string) => {
        setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20));
    };

    const testFetch = async () => {
        const token = getToken();
        addLog(`Fetching notifications... (Token: ${token ? 'YES' : 'NO'})`);
        try {
            const res = await fetch(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const text = await res.text();
            addLog(`Status: ${res.status}`);
            console.log('GET Notifications:', text);
            fetchNotifications(); // Refresh context
        } catch (err: any) {
            addLog(`Error: ${err.message}`);
        }
    };

    const testCreate = async () => {
        const token = getToken();
        if (!user) return addLog('❌ Not logged in');
        
        addLog(`Creating test notification for user ${user.user_id}...`);
        try {
            const body = {
                user_id: user.user_id,
                title: '🔔 Test Notification',
                message: 'Test message at ' + new Date().toLocaleTimeString(),
                notification_type_id: 2, // News
                link_url: '/user/news'
            };
            
            const res = await fetch(`${API_URL}/notifications/send`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });
            
            const data = await res.json();
            addLog(`Create Status: ${res.status}`);
            if (!res.ok) addLog(`Error: ${JSON.stringify(data)}`);
            else addLog('✅ Created successfully! Check if WS received it.');
        } catch (err: any) {
            addLog(`Error: ${err.message}`);
        }
    };

    return (
        <div style={{ padding: 40, fontFamily: 'sans-serif', maxWidth: 800, margin: '0 auto' }}>
            <h1 style={{ color: '#10b981' }}>🔔 Notification Debug System</h1>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <div style={{ background: '#f9fafb', padding: 20, borderRadius: 16, border: '1px solid #e5e7eb' }}>
                    <h2 style={{ fontSize: 18, marginTop: 0 }}>Status</h2>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                        <li>Auth Loading: <b>{authLoading ? '⏳ YES' : '✅ NO'}</b></li>
                        <li>User: <b>{user ? `${user.first_name} (ID: ${user.user_id}, Role: ${user.role_id})` : 'None'}</b></li>
                        <li>WS Connected: <b style={{ color: isConnected ? '#10b981' : '#ef4444' }}>{isConnected ? 'online' : 'offline'}</b></li>
                        <li>Unread Count: <b>{unreadCount}</b></li>
                        <li>Total Loaded: <b>{notifications.length}</b></li>
                    </ul>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                        <button onClick={testFetch} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer' }}>Fetch DB Notifs</button>
                        <button onClick={testCreate} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#10b981', color: 'white', cursor: 'pointer' }}>Trigger Test Notif</button>
                    </div>
                </div>

                <div style={{ background: '#1f2937', color: '#10b981', padding: 20, borderRadius: 16, fontSize: 13, height: 200, overflowY: 'auto' }}>
                    <h2 style={{ fontSize: 14, marginTop: 0, color: 'white' }}>Log Trace</h2>
                    {logs.map((log, i) => <div key={i}>{log}</div>)}
                </div>
            </div>

            <h2 style={{ marginTop: 30 }}>Notifications List</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {notifications.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', background: '#f3f4f6', borderRadius: 12, color: '#9ca3af' }}>No notifications found</div>
                ) : (
                    notifications.map(n => (
                        <div key={n.notification_id} style={{ 
                            padding: 16, 
                            borderRadius: 12, 
                            border: '1px solid #e5e7eb',
                            background: n.is_read ? 'white' : '#ecfdf5',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontWeight: 500 }}>{n.title}</div>
                                <div style={{ fontSize: 14, color: '#4b5563' }}>{n.message}</div>
                                <small style={{ color: '#9ca3af' }}>ID: {n.notification_id} | Type: {n.notification_type_id} | Date: {new Date(n.created_at).toLocaleString()}</small>
                            </div>
                            {!n.is_read && <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '50%' }}></span>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
