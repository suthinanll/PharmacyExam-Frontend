"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { useAuth } from '@/contexts/AuthContext';
import {
    Bell,
    Clock,
    CheckCircle,
    AlertCircle,
    Info,
    Trash2,
    CheckSquare,
    ExternalLink
} from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

interface Notification {
    notification_id: number;
    title: string;
    message: string;
    notification_type_id: number | null;
    is_read: boolean;
    link_url: string | null;
    created_at: string;
}

export default function NotificationsPage() {
    const { getToken } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchNotifications = useCallback(async () => {
        try {
            setLoading(true);
            const token = getToken();
            const response = await fetch("http://localhost:5000/notifications", {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setNotifications(data);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const markAsRead = async (id: number) => {
        try {
            const token = getToken();
            const response = await fetch(`http://localhost:5000/notifications/${id}/read`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                setNotifications(prev =>
                    prev.map(n => n.notification_id === id ? { ...n, is_read: true } : n)
                );
            }
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const token = getToken();
            const response = await fetch("http://localhost:5000/notifications/read-all", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
            if (response.ok) {
                setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
                Swal.fire({
                    icon: 'success',
                    title: 'ทำเครื่องหมายอ่านแล้วทั้งหมด',
                    showConfirmButton: false,
                    timer: 1500
                });
            }
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const deleteNotification = async (id: number) => {
        const result = await Swal.fire({
            title: 'ลบการแจ้งเตือน?',
            text: 'คุณต้องการลบการแจ้งเตือนนี้ใช่หรือไม่',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'ลบ',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                const token = getToken();
                const response = await fetch(`http://localhost:5000/notifications/${id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (response.ok) {
                    setNotifications(prev => prev.filter(n => n.notification_id !== id));
                    Swal.fire({
                        icon: 'success',
                        title: 'ลบสำเร็จ',
                        showConfirmButton: false,
                        timer: 1000
                    });
                }
            } catch (error) {
                console.error("Error deleting notification:", error);
            }
        }
    };

    const getIcon = (typeId: number | null) => {
        switch (typeId) {
            case 2: return <CheckCircle className="text-green-500" />;
            case 3: return <AlertCircle className="text-amber-500" />;
            case 4: return <Trash2 className="text-red-500" />;
            default: return <Info className="text-blue-500" />;
        }
    };

    const getBgColor = (typeId: number | null) => {
        switch (typeId) {
            case 2: return 'bg-green-50';
            case 3: return 'bg-amber-50';
            case 4: return 'bg-red-50';
            default: return 'bg-blue-50';
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('th-TH', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar_user />

            <div className="max-w-4xl mx-auto px-4 py-12">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-600 text-white rounded-2xl shadow-lg shadow-green-200">
                            <Bell className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-800">การแจ้งเตือน</h1>
                            <p className="text-slate-500">รวมข่าวสารและการแจ้งเตือนทั้งหมดของคุณ</p>
                        </div>
                    </div>

                    {notifications.some(n => !n.is_read) && (
                        <button
                            onClick={markAllAsRead}
                            className="flex items-center gap-2 px-4 py-2 bg-white text-green-600 border border-green-200 rounded-xl hover:bg-green-50 transition-colors font-medium shadow-sm"
                        >
                            <CheckSquare size={18} />
                            อ่านแล้วทั้งหมด
                        </button>
                    )}
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mb-4"></div>
                        <p className="text-slate-500 animate-pulse">กำลังโหลดการแจ้งเตือน...</p>
                    </div>
                ) : notifications.length > 0 ? (
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <div
                                key={notification.notification_id}
                                className={`relative group bg-white border rounded-3xl p-6 transition-all hover:shadow-md ${notification.is_read ? 'border-slate-100 opacity-80' : 'border-green-200 shadow-sm ring-1 ring-green-100'
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-2xl flex-shrink-0 ${getBgColor(notification.notification_type_id)}`}>
                                        {getIcon(notification.notification_type_id)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className={`font-bold text-lg truncate ${notification.is_read ? 'text-slate-700' : 'text-slate-900'}`}>
                                                {notification.title}
                                            </h3>
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {!notification.is_read && (
                                                    <button
                                                        onClick={() => markAsRead(notification.notification_id)}
                                                        className="p-2 text-slate-400 hover:text-green-600 transition-colors"
                                                        title="ทำเครื่องหมายว่าอ่านแล้ว"
                                                    >
                                                        <CheckSquare size={18} />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => deleteNotification(notification.notification_id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                                                    title="ลบ"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                        <p className="text-slate-600 mb-4 leading-relaxed line-clamp-2">
                                            {notification.message}
                                        </p>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                                                <span className="flex items-center gap-1">
                                                    <Clock size={12} />
                                                    {formatDate(notification.created_at)}
                                                </span>
                                                {!notification.is_read && (
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-bold uppercase tracking-wider">
                                                        ใหม่
                                                    </span>
                                                )}
                                            </div>

                                            {notification.link_url && (
                                                <Link
                                                    href={notification.link_url}
                                                    className="flex items-center gap-1.5 text-sm font-bold text-green-600 hover:text-green-700"
                                                >
                                                    ดูรายละเอียด
                                                    <ExternalLink size={14} />
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white rounded-[2.5rem] shadow-sm border border-slate-100">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Bell className="w-12 h-12 text-slate-200" />
                        </div>
                        <h2 className="text-xl font-bold text-slate-800 mb-2">ไม่มีการแจ้งเตือน</h2>
                        <p className="text-slate-500 max-w-xs mx-auto">
                            เราจะแจ้งให้คุณทราบเมื่อมีการอัปเดตใหม่ๆ หรือสิ่งที่น่าสนใจสำหรับคุณ
                        </p>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    );
}
