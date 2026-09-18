'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, ExternalLink, Calendar, Newspaper, BookOpen, Info } from 'lucide-react';
import { useNotifications, AppNotification } from '../contexts/NotificationContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from "@/utils/sweetalert";

const NOTIFICATION_TYPE_ICONS: Record<number, React.ReactNode> = {
    1: <Calendar className="w-4 h-4 text-blue-500" />,      // ปฏิทิน
    2: <Newspaper className="w-4 h-4 text-orange-500" />,   // ข่าวสาร
    3: <BookOpen className="w-4 h-4 text-green-600" />,     // ชุดข้อสอบ
    4: <Info className="w-4 h-4 text-purple-500" />,        // ทั่วไป
};

const TYPE_LABEL: Record<number, string> = {
    1: 'ปฏิทิน',
    2: 'ข่าวสาร',
    3: 'ชุดข้อสอบ',
    4: 'อัปเดต',
};

const TYPE_COLORS: Record<number, string> = {
    1: 'bg-blue-50 border-blue-200',
    2: 'bg-orange-50 border-orange-200',
    3: 'bg-green-50 border-green-200',
    4: 'bg-purple-50 border-purple-200',
};

function timeAgo(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const diffMs = Date.now() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60) return 'เมื่อกี้';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
    return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

function NotificationItem({
    notification,
    onRead,
    onDelete,
    onClose,
}: {
    notification: AppNotification;
    onRead: (id: number) => void;
    onDelete: (id: number) => void;
    onClose: () => void;
}) {
    const router = useRouter();
    const typeId = notification.notification_type_id ?? 4;
    const icon = NOTIFICATION_TYPE_ICONS[typeId] ?? <Info className="w-4 h-4 text-gray-400" />;
    const colorClass = TYPE_COLORS[typeId] ?? 'bg-gray-50 border-gray-200';

    const handleClick = () => {
        // ทำเครื่องหมายว่าอ่านแล้ว (ถ้ายังไม่อ่าน)
        if (!notification.is_read) {
            onRead(notification.notification_id);
        }
        
        // ถ้ามีลิงก์ ให้พาไปที่ลิงก์นั้น
        if (notification.link_url) {
            router.push(notification.link_url);
            onClose(); // ปิด Dropdown
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`group relative flex gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md active:scale-[0.98] ${
                notification.is_read ? 'bg-white border-gray-100' : `${colorClass}`
            }`}
        >
            {/* Unread dot */}
            {!notification.is_read && (
                <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            )}

            {/* Icon */}
            <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${notification.is_read ? 'bg-gray-100' : 'bg-white shadow-sm'}`}>
                {icon}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-4">
                <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium leading-tight ${notification.is_read ? 'text-gray-600' : 'text-gray-900'}`}>
                        {notification.title}
                    </p>
                </div>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                    {notification.message}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                    {notification.notification_type_id && (
                        <span className="text-xs font-medium text-gray-400">
                            {TYPE_LABEL[notification.notification_type_id]}
                        </span>
                    )}
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-400">{timeAgo(notification.created_at)}</span>
                </div>
            </div>

            {/* Actions (hover) */}
            <div className="absolute right-2 top-2 hidden group-hover:flex items-center gap-1 bg-white rounded-lg shadow-md border border-gray-100 p-1">
                {/* ปุ่มลบ */}
                <button
                    onClick={(e) => {
                        e.stopPropagation(); // กันไม่ให้ไปคลิกโดน handleClick ของตัวการ์ด
                        onDelete(notification.notification_id);
                    }}
                    title="ลบ"
                    className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                >
                    <Trash2 className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}

export default function NotificationBell() {
    const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead, removeNotification, removeAllNotifications } =
        useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close when clicked outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const filtered = filter === 'unread' ? notifications.filter((n) => !n.is_read) : notifications;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                id="notification-bell-btn"
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 rounded-xl transition-all duration-200 ${isOpen ? 'bg-green-50 text-green-700' : 'text-gray-500 hover:bg-gray-100 hover:text-green-700'}`}
                title="การแจ้งเตือน"
            >
                <Bell className="w-5 h-5" />
                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-medium rounded-full leading-none animate-bounce">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
                {/* WS connected dot */}
                <span
                    className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-300'}`}
                />
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden"
                    style={{ maxHeight: '520px' }}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-green-700" />
                            <h3 className="font-semibold text-gray-900 text-sm">การแจ้งเตือน</h3>
                            {unreadCount > 0 && (
                                <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-xs font-medium rounded-full">
                                    {unreadCount} ใหม่
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    title="อ่านทั้งหมด"
                                    className="flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium px-2 py-1 rounded-lg hover:bg-green-50 transition-colors"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    อ่านทั้งหมด
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button
                                    onClick={async () => {
                                        const result = await Swal.fire({
                                            title: 'ลบการแจ้งเตือนทั้งหมด?',
                                            text: 'คุณแน่ใจหรือไม่ว่าต้องการลบการแจ้งเตือนทั้งหมด?',
                                            icon: 'warning',
                                            showCancelButton: true,
                                            confirmButtonText: 'ลบทั้งหมด',
                                            cancelButtonText: 'ยกเลิก',
                                            confirmButtonColor: '#ef4444',
                                            cancelButtonColor: '#6b7280',
                                            reverseButtons: true,
                                        });
                                        if (result.isConfirmed) {
                                            await removeAllNotifications();
                                        }
                                    }}
                                    title="ลบทั้งหมด"
                                    className="flex items-center gap-1 text-xs text-red-600 hover:text-red-700 font-medium px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    ลบทั้งหมด
                                </button>
                            )}
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors ml-1"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex border-b border-gray-100 px-4 pt-2">
                        {(['all', 'unread'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setFilter(tab)}
                                className={`pb-2 px-3 text-xs font-medium border-b-2 transition-colors ${filter === tab
                                    ? 'border-green-600 text-green-700'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                {tab === 'all' ? 'ทั้งหมด' : 'ยังไม่ได้อ่าน'}
                                {tab === 'unread' && unreadCount > 0 && (
                                    <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] rounded-full font-medium">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto p-3 space-y-2" style={{ maxHeight: '370px' }}>
                        {filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center">
                                <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mb-3">
                                    <Bell className="w-7 h-7 text-gray-300" />
                                </div>
                                <p className="text-sm font-medium text-gray-500">
                                    {filter === 'unread' ? 'อ่านครบแล้ว!' : 'ยังไม่มีการแจ้งเตือน'}
                                </p>
                                <p className="text-xs text-gray-400 mt-1">
                                    การแจ้งเตือนใหม่จะปรากฏที่นี่
                                </p>
                            </div>
                        ) : (
                            filtered.map((n) => (
                                <NotificationItem
                                    key={n.notification_id}
                                    notification={n}
                                    onRead={markAsRead}
                                    onDelete={removeNotification}
                                    onClose={() => setIsOpen(false)}
                                />
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex items-center justify-center py-2 border-t border-gray-100 bg-gray-50/50">
                        <span className={`flex items-center gap-1 text-xs ${isConnected ? 'text-green-500' : 'text-gray-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400' : 'bg-gray-300'}`} />
                            {isConnected ? 'เชื่อมต่อแบบ Real-time' : 'ไม่ได้เชื่อมต่อ'}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
