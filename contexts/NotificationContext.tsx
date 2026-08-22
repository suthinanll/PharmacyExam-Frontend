'use client';

import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useRef,
    useCallback,
    ReactNode,
} from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

export interface AppNotification {
    notification_id: number;
    title: string;
    message: string;
    link_url?: string;
    notification_type_id?: number;
    created_at: Date;
    is_read: boolean;
}

interface NotificationContextType {
    notifications: AppNotification[];
    unreadCount: number;
    isConnected: boolean;
    fetchNotifications: () => Promise<void>;
    markAsRead: (id: number) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    removeNotification: (id: number) => Promise<void>;
    removeAllNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5000';
// WebSocket connects to the same base URL (no /api suffix needed for socket.io)
const WS_URL = API_URL.replace(/\/api$/, '');

export function NotificationProvider({ children }: { children: ReactNode }) {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef<Socket | null>(null);

    // ดึง user + token จาก AuthContext
    const { user, isLoading: authLoading, getToken } = useAuth();

    const fetchNotifications = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            const res = await fetch(`${API_URL}/notifications`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data: AppNotification[] = await res.json();
                setNotifications(data);
                setUnreadCount(data.filter((n) => !n.is_read).length);
            }
        } catch (err) {
            console.error('[Notifications] Failed to fetch:', err);
        }
    }, [getToken]);

    const markAsRead = useCallback(async (id: number) => {
        const token = getToken();
        if (!token) return;
        try {
            await fetch(`${API_URL}/notifications/${id}/read`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) =>
                prev.map((n) => (n.notification_id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error('[Notifications] Failed to mark as read:', err);
        }
    }, [getToken]);

    const markAllAsRead = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            await fetch(`${API_URL}/notifications/read-all`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('[Notifications] Failed to mark all as read:', err);
        }
    }, [getToken]);

    const removeNotification = useCallback(async (id: number) => {
        const token = getToken();
        if (!token) return;
        try {
            await fetch(`${API_URL}/notifications/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications((prev) => {
                const removed = prev.find((n) => n.notification_id === id);
                if (removed && !removed.is_read) {
                    setUnreadCount((c) => Math.max(0, c - 1));
                }
                return prev.filter((n) => n.notification_id !== id);
            });
        } catch (err) {
            console.error('[Notifications] Failed to delete:', err);
        }
    }, [getToken]);

    const removeAllNotifications = useCallback(async () => {
        const token = getToken();
        if (!token) return;
        try {
            await fetch(`${API_URL}/notifications/clear-all`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            setNotifications([]);
            setUnreadCount(0);
        } catch (err) {
            console.error('[Notifications] Failed to clear all:', err);
        }
    }, [getToken]);

    // เชื่อม WebSocket เมื่อ user login / ตัดเมื่อ logout
    useEffect(() => {
        // ⏳ รอ auth โหลดเสร็จก่อน ป้องกันการ disconnect ระหว่าง loading
        if (authLoading) return;

        // ❌ ไม่มี user (logout จริง) → ตัด socket + เคลียร์
        if (!user) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
            setIsConnected(false);
            setNotifications([]);
            setUnreadCount(0);
            return;
        }

        const token = getToken();
        if (!token) return;

        // ✅ มี user → ดึง notifications + connect WebSocket
        fetchNotifications();

        const socket = io(`${WS_URL}/notifications`, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 2000,
            reconnectionAttempts: 10,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setIsConnected(true);
            console.log('[Notifications WS] Connected:', socket.id);
        });

        socket.on('connect_error', (err) => {
            console.error('[Notifications WS] Connection error:', err.message);
        });

        socket.on('disconnect', (reason) => {
            setIsConnected(false);
            console.log('[Notifications WS] Disconnected:', reason);
        });

        socket.on('new_notification', (notification: AppNotification) => {
            console.log('[Notifications WS] New notification received:', notification);
            setNotifications((prev) => [notification, ...prev]);
            if (!notification.is_read) {
                setUnreadCount((prev) => prev + 1);
            }
        });

        return () => {
            console.log('[Notifications WS] Cleanup');
            socket.disconnect();
            socketRef.current = null;
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.user_id, authLoading]); // re-run เมื่อ auth state เปลี่ยน

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                isConnected,
                fetchNotifications,
                markAsRead,
                markAllAsRead,
                removeNotification,
                removeAllNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return ctx;
}
