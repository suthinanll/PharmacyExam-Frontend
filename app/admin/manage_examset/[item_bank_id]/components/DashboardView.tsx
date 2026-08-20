'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    AreaChart,
    Area
} from 'recharts';
import {
    Users,
    FileText,
    BarChart2,
    CheckCircle,
    Clock,
    Calendar,
    Settings,
    PlusCircle,
    PlayCircle,
    ChevronRight,
    Home,
    ArrowLeft,
    Eye
} from 'lucide-react';
import { Loader2 } from 'lucide-react';
import ExamPreviewModal from './ExamPreviewModal';
import Link from 'next/link';
import SettingsModal from './SettingsModal';
import Swal from 'sweetalert2';

interface DashboardStats {
    item_bank: {
        id: number;
        name: string;
        created_at: string;
        updated_at: string;
        duration: number;
        is_active: boolean;
        categories?: {
            category_id: number;
            category_name: string;
        }[];
    };
    stats: {
        total_items: number;
        total_attempts: number;
        completed_attempts: number;
        average_score: number;
        max_score: number;
        min_score: number;
        pass_rate: number;
    };
    charts: {
        score_distribution: {
            range: string;
            count: number;
        }[];
    };
    recent_activity: {
        session_id: number;
        user_id: number;
        user_name?: string;
        start_time: string;
        end_time: string | null;
        score: number;
        status: string;
    }[];
}

interface DashboardViewProps {
    itemBankId: string;
    onManageExams: () => void;
    onUpdate?: () => void;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function DashboardView({ itemBankId, onManageExams, onUpdate }: DashboardViewProps) {
    const { getToken } = useAuth();
    const [data, setData] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        fetchDashboardData();
    }, [itemBankId]);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/items-bank/${itemBankId}/dashboard`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (response.ok) {
                const result = await response.json();
                setData(result);
            } else {
                throw new Error('Failed to fetch dashboard data');
            }
        } catch (err: any) {
            console.error('Error fetching dashboard data:', err);
            setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูล');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!data) return;

        const previousStatus = data.item_bank.is_active;
        const newStatus = !previousStatus;

        // Optimistic update with functional state to ensure reliability
        setData(prev => {
            if (!prev) return null;
            return {
                ...prev,
                item_bank: {
                    ...prev.item_bank,
                    is_active: newStatus
                }
            };
        });

        const Toast = Swal.mixin({
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 2000,
            timerProgressBar: true,
            didOpen: (toast) => {
                toast.addEventListener('mouseenter', Swal.stopTimer)
                toast.addEventListener('mouseleave', Swal.resumeTimer)
            }
        });

        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/items-bank/${itemBankId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({ is_active: newStatus })
            });

            if (response.ok) {
                Toast.fire({
                    icon: 'success',
                    title: newStatus ? 'เปิดใช้งานชุดข้อสอบแล้ว' : 'ปิดใช้งานชุดข้อสอบแล้ว'
                });

                // Call onUpdate to sync with parent
                if (onUpdate) onUpdate();
            } else {
                throw new Error('Failed to update status');
            }
        } catch (error) {
            console.error('Error updating status:', error);
            // Revert on error
            setData(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    item_bank: {
                        ...prev.item_bank,
                        is_active: previousStatus
                    }
                };
            });
            Toast.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ'
            });
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 text-green-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
                <div className="bg-red-50 p-4 rounded-full mb-4">
                    <CheckCircle className="w-10 h-10 text-red-500" />
                </div>
                <h3 className="text-xl font-medium text-gray-800 mb-2">ไม่พบข้อมูล</h3>
                <p className="text-gray-500 mb-6">{error}</p>
                <button
                    onClick={fetchDashboardData}
                    className="px-6 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 font-medium transition-colors"
                >
                    ลองใหม่อีกครั้ง
                </button>
            </div>
        );
    }

    const { item_bank, stats, charts, recent_activity } = data;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 pb-24 bg-gray-50/50 min-h-screen">


            {/* Header Section */}
            <Link
                href="/admin/manage_examset"
                className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-4 h-4" />
                กลับ
            </Link>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <h1 className="text-2xl md:text-3xl font-medium text-gray-900">
                    <span className="text-gray-700 font-normal">{item_bank.name}</span>
                </h1>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowPreview(true)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-all shadow-sm active:scale-95 whitespace-nowrap"
                    >
                        <Eye className="w-4 h-4" />
                        พรีวิวข้อสอบ
                    </button>
                    <button
                        onClick={onManageExams}
                        className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg text-white transition-all shadow-md bg-green-600 hover:bg-green-700 active:scale-95"
                    >
                        จัดการคำถาม
                    </button>
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="p-2.5 bg-white border border-gray-200 rounded-lg text-gray-600 hover:text-green-700 hover:border-green-200 shadow-sm transition-all"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Stats Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <StatsCard
                    title="จำนวนคำถามทั้งหมด"
                    value={stats.total_items.toLocaleString()}
                    icon={<FileText className="w-8 h-8 text-green-600" />}
                />
                <StatsCard
                    title="จำนวนครั้งที่เข้าสอบ"
                    value={stats.total_attempts.toLocaleString()}
                    icon={<Users className="w-8 h-8 text-green-600" />}
                />
                <StatsCard
                    title="คะแนนเฉลี่ยรวม"
                    value={`${stats.average_score}%`}
                    icon={<BarChart2 className="w-8 h-8 text-green-600" />}
                />
                <StatsCard
                    title="อัตราร้อยละผ่าน (เกณฑ์ 50%)"
                    value={`${stats.pass_rate}%`}
                    icon={<CheckCircle className="w-8 h-8 text-green-600" />}
                />
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Score Distribution Chart */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-medium text-gray-800 mb-6">การกระจายตัวของคะแนน</h3>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={charts.score_distribution}
                                    margin={{ top: 10, right: 30, left: 10, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#15803d" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#15803d" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis
                                        dataKey="range"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 11, fill: '#6b7280' }}
                                        dy={10}
                                    />
                                    <YAxis hide domain={[0, 'auto']} />
                                    <Tooltip
                                        cursor={{ stroke: '#15803d', strokeWidth: 1, strokeDasharray: '3 3' }}
                                        contentStyle={{
                                            borderRadius: '12px',
                                            border: 'none',
                                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                            padding: '8px 12px'
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#15803d"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                        animationDuration={1500}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">กิจกรรมล่าสุด</h3>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="border-b border-gray-100">
                                        <th className="py-3 font-medium text-gray-600 text-sm">ผู้เข้าสอบ</th>
                                        <th className="py-3 font-medium text-gray-600 text-sm">วันที่</th>
                                        <th className="py-3 font-medium text-gray-600 text-sm">คะแนน</th>
                                        <th className="py-3 font-medium text-gray-600 text-sm">สถานะ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {recent_activity.length > 0 ? (
                                        recent_activity.map((session) => (
                                            <tr key={session.session_id} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-4 text-sm font-medium text-gray-900">
                                                    {session.user_name || `User: #${session.user_id}`}
                                                </td>
                                                <td className="py-4 text-sm text-gray-500">
                                                    {new Date(session.start_time).toLocaleDateString('th-TH', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="py-4 text-sm font-medium text-gray-900">
                                                    {session.status === 'COMPLETED' ? `${session.score}%` : '-'}
                                                </td>
                                                <td className="py-4">
                                                    <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${session.status === 'COMPLETED'
                                                        ? (session.score >= 50
                                                            ? 'bg-green-100 text-green-700' // Passed
                                                            : 'bg-red-100 text-red-700')    // Failed
                                                        : 'bg-yellow-100 text-yellow-700' // In Progress
                                                        }`}>
                                                        {session.status === 'COMPLETED'
                                                            ? (session.score >= 50 ? 'ผ่าน' : 'ไม่ผ่าน')
                                                            : 'กำลังทำ'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                                                ไม่มีข้อมูลกิจกรรมล่าสุดในขณะนี้
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column (Sidebar) */}
                <div className="space-y-6">
                    {/* Item Bank Details Card */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-medium text-gray-800 mb-6">รายละเอียดชุดข้อสอบ</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-medium">วันที่สร้าง</span>
                                <span className="text-gray-900">
                                    {new Date(item_bank.created_at).toLocaleDateString('th-TH', {
                                        month: 'short', day: 'numeric', year: 'numeric'
                                    })}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-medium">แก้ไขล่าสุด</span>
                                <span className="text-gray-900">
                                    {item_bank.updated_at ? new Date(item_bank.updated_at).toLocaleDateString('th-TH', {
                                        month: 'short', day: 'numeric', year: 'numeric'
                                    }) : '-'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 font-medium">ระยะเวลา</span>
                                <span className="text-gray-900">
                                    {Math.floor(item_bank.duration / 60)} นาที
                                </span>
                            </div>
                            <div className="flex flex-col gap-2 pt-2 border-t border-gray-50 mt-2">
                                <span className="text-gray-600 font-medium text-sm">ประเภทข้อสอบ</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {item_bank.categories && item_bank.categories.length > 0 ? (
                                        item_bank.categories.map((cat) => (
                                            <span
                                                key={cat.category_id}
                                                className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[11px] font-medium rounded-md border border-blue-100"
                                            >
                                                {cat.category_name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 text-xs italic">ไม่ได้ระบุประเภทข้อสอบ</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-sm pt-2 border-t border-gray-50 mt-2">
                                <span className="text-gray-600 font-medium">สถานะ</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs font-medium ${item_bank.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                                        {item_bank.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                    </span>
                                    <button
                                        onClick={handleToggleStatus}
                                        className={`w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out ${item_bank.is_active ? 'bg-green-600' : 'bg-gray-300'
                                            }`}
                                    >
                                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${item_bank.is_active ? 'translate-x-5' : 'translate-x-0'
                                            }`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Card */}
                    {/* <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-medium text-gray-800 mb-6">เมนูจัดการด่วน</h3>
                        <div className="space-y-3">
                            <button
                                onClick={onManageExams}
                                className="w-full flex items-center gap-3 text-left p-2 rounded-lg hover:bg-green-50 text-gray-700 hover:text-green-700 font-medium transition-colors group"
                            >
                                <PlusCircle className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                                เพิ่มสถานการณ์
                            </button>
                            <button className="w-full flex items-center gap-3 text-left p-2 rounded-lg hover:bg-green-50 text-gray-700 hover:text-green-700 font-medium transition-colors group">
                                <PlayCircle className="w-5 h-5 text-green-600 group-hover:scale-110 transition-transform" />
                                ตัวอย่างข้อสอบ
                            </button>
                        </div>
                    </div> */}
                </div>
            </div>

            <SettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                itemBankId={itemBankId}
                onUpdate={fetchDashboardData}
            />

            <ExamPreviewModal
                isOpen={showPreview}
                onClose={() => setShowPreview(false)}
                itemBankId={itemBankId}
            />
        </div>
    );
}

function StatsCard({ title, value, icon, subtext }: any) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center hover:shadow-md transition-shadow">
            <div className="mb-3 p-3 bg-green-50 rounded-full border border-green-100">
                {icon}
            </div>
            <h4 className="text-3xl font-medium text-green-700 mb-1">{value}</h4>
            <p className="text-sm font-medium text-gray-500">{title}</p>
            {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
        </div>
    );
}
