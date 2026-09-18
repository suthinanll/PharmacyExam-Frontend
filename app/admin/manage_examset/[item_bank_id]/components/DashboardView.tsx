'use client';

import React, { useEffect, useState, useRef } from 'react';
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
    FileQuestion,
    BarChart2,
    CheckCircle,
    Clock,
    Calendar,
    Settings,
    PlusCircle,
    PlayCircle,
    ChevronRight,
    ChevronLeft,
    ChevronDown,
    Home,
    ArrowLeft,
    Eye,
    Download,
    AlertTriangle,
    Timer,
    Flame,
    TrendingDown,
    XCircle
} from 'lucide-react';

import ExamPreviewModal from './ExamPreviewModal';
import Link from 'next/link';
import SettingsModal from './SettingsModal';
import Swal from "@/utils/sweetalert";

// ─── Item Detail Modal ─────────────────────────────────
function ItemDetailModal({
    item,
    onClose,
}: {
    item: ItemPerformanceStat | null;
    onClose: () => void;
}) {
    if (!item) return null;
    const cleanText = (t: string) => (t ? t.replace(/<[^>]*>?/gm, '').trim() : '');

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-gray-700 text-sm font-bold">
                            {item.display_order}
                        </span>
                        <h2 className="text-base font-medium text-gray-800">รายละเอียดข้อสอบ</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
                    >
                        <XCircle className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">
                    {/* Situation */}
                    {item.situation_text && (
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 space-y-1">
                            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">สถานการณ์</p>
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                                {cleanText(item.situation_text)}
                            </p>
                        </div>
                    )}

                    {/* Question */}
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">คำถาม</p>
                        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                            {cleanText(item.question_text) || 'ไม่มีข้อความคำถาม'}
                        </p>
                    </div>

                    {/* Stats chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {[
                            {
                                label: 'อำนาจจำแนก (a)',
                                value: Number(item.irt_a_discrimination).toFixed(2),
                                color: 'bg-indigo-50 border-indigo-200 text-indigo-800'
                            },
                            {
                                label: 'ความยาก (b)',
                                value: '—',
                                color: 'bg-indigo-50 border-indigo-200 text-indigo-800'
                            },
                            {
                                label: 'โอกาสการเดา (c)',
                                value: '-',
                                color: 'bg-indigo-50 border-indigo-200 text-indigo-800'
                            }
                        ].map((s) => (
                            <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
                                <div className="text-base font-bold">{s.value}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                            </div>
                        ))}
                    </div>
                

                    {/* Stats chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { label: 'ทำทั้งหมด', value: `${item.total_attempts} ครั้ง`, color: 'bg-gray-50 border-gray-200' },
                            { label: 'ตอบผิด', value: `${item.incorrect_count} ครั้ง`, color: 'bg-rose-50 border-rose-200' },
                            { label: 'อัตราตอบผิด', value: `${item.error_rate}%`, color: 'bg-orange-50 border-orange-200' },
                            { label: 'เวลาเฉลี่ย/ข้อ', value: formatTimeSpent(item.avg_time_seconds), color: 'bg-amber-50 border-amber-200' },
                        ].map((s) => (
                            <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
                                <div className="text-base font-bold text-gray-800">{s.value}</div>
                                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Wrong users */}
                    <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            ผู้ที่ตอบข้อนี้ผิด ({item.wrong_users?.length ?? 0} คน)
                        </p>
                        {!item.wrong_users?.length ? (
                            <p className="text-sm text-gray-400">ไม่มีข้อมูล</p>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {item.wrong_users.map((u) => (
                                    <span
                                        key={u.user_id}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium"
                                    >
                                        <Users className="w-3 h-3" />
                                        {u.user_name}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-3 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                        ปิด
                    </button>
                </div>
            </div>
        </div>
    );
}


export interface ItemPerformanceStat {
    item_id: number;
    display_order: number;
    question_text: string;
    situation_text?: string | null;
    total_attempts: number;
    incorrect_count: number;
    correct_count: number;
    error_rate: number;
    avg_time_seconds: number;
    wrong_users?: { user_id: number; user_name: string }[];
    irt_a_discrimination: number | null;
    irt_b_difficulty: number | null;
    irt_c_guessing: number | null;
}

interface DashboardStats {
    item_bank: {
        id: number;
        name: string;
        description: string;
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
    item_analytics?: {
        most_missed: ItemPerformanceStat[];
        slowest: ItemPerformanceStat[];
    };
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
    const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
    const settingsMenuRef = useRef<HTMLDivElement>(null);
    const [selectedItem, setSelectedItem] = useState<ItemPerformanceStat | null>(null);
    const [pageMissed, setPageMissed] = useState(1);
    const [pageSlowest, setPageSlowest] = useState(1);
    const ITEMS_PER_PAGE = 5;

    useEffect(() => {
        setPageMissed(1);
        setPageSlowest(1);
        fetchDashboardData();
    }, [itemBankId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
                setIsSettingsMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

        if (newStatus && (!data.stats || data.stats.total_items === 0)) {
            Swal.fire({
                icon: 'warning',
                title: 'ไม่สามารถเปิดใช้งานได้',
                text: 'ต้องมีอย่างน้อย 1 คำถาม/สถานการณ์ ถึงจะสามารถเปิดใช้งานชุดข้อสอบได้',
                confirmButtonColor: '#059669'
            });
            return;
        }

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
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update status');
            }
        } catch (error: any) {
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
            Swal.fire({
                icon: 'warning',
                title: 'ไม่สามารถเปิดใช้งานได้',
                text: error.message || 'เกิดข้อผิดพลาดในการเปลี่ยนสถานะ',
                confirmButtonColor: '#059669'
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse" />
                            <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                            <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                        </div>
                    ))}
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    {[1, 2, 3].map((r) => (
                        <div key={r} className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-gray-200 animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3.5 w-3/4 animate-pulse rounded bg-gray-200" />
                                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                            </div>
                        </div>
                    ))}
                </div>
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
                <div className="space-y-1">
                    <h1 className="text-2xl md:text-3xl font-medium text-gray-900">
                        {item_bank.name}
                    </h1>
                    <p className="text-sm text-gray-500 leading-relaxed max-w-2xl">{item_bank.description || 'ไม่มีคำอธิบายชุดข้อสอบ'}</p>
                </div>
                <div className="flex items-center gap-3">
                    

                    {/* Settings Dropdown Button */}
                    <div className="relative" ref={settingsMenuRef}>
                        <button
                            onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50 text-sm font-medium shadow-2xs transition-all active:scale-95 cursor-pointer"
                        >
                            <Settings className="w-4 h-4 text-gray-500" />
                            <span>ตั้งค่า</span>
                            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isSettingsMenuOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isSettingsMenuOpen && (
                            <div className="absolute right-0 mt-2 w-56 origin-top-right rounded-2xl bg-white shadow-xl ring-1 ring-black/10 overflow-hidden z-50 py-1.5 border border-gray-100">
                                <button
                                    onClick={() => {
                                        setIsSettingsMenuOpen(false);
                                        setShowPreview(true);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-amber-50 hover:text-amber-800 transition-colors text-left cursor-pointer font-medium"
                                >
                                    <Eye className="w-4 h-4 text-amber-600" />
                                    <span>พรีวิวข้อสอบ</span>
                                </button>
                                <button
                                    onClick={async () => {
                                        setIsSettingsMenuOpen(false);
                                        try {
                                            const token = getToken();
                                            const r = await fetch(`${API_URL}/items-bank/cat/export-response-matrix?item_bank_id=${itemBankId}`, {
                                                headers: { 'Authorization': `Bearer ${token}` }
                                            });
                                            if (!r.ok) {
                                                const errData = await r.json().catch(() => ({}));
                                                throw new Error(errData.message || `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (HTTP ${r.status})`);
                                            }
                                            const res = await r.json();
                                            const blob = new Blob(["\uFEFF" + res.csv], { type: 'text/csv;charset=utf-8;' });
                                            const link = document.createElement('a');
                                            const cleanName = (item_bank?.name || 'bank').replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, '_');
                                            const downloadUrl = URL.createObjectURL(blob);
                                            link.href = downloadUrl;
                                            link.setAttribute('download', `response_matrix_${cleanName}_${new Date().toISOString().slice(0, 10)}.csv`);
                                            document.body.appendChild(link);
                                            link.click();
                                            document.body.removeChild(link);
                                            setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
                                            Swal.fire({
                                                title: 'ส่งออกสำเร็จ',
                                                html: `ดาวน์โหลดไฟล์ Response Matrix เรียบร้อยแล้ว<br/><span class="text-xs text-gray-500">จำนวน ${res.total_sessions} sessions (${res.total_items} ข้อ)</span>`,
                                                icon: 'success',
                                                timer: 2000,
                                                showConfirmButton: false
                                            });
                                        } catch (err: any) {
                                            Swal.fire({
                                                title: 'ข้อผิดพลาด',
                                                html: `ไม่สามารถส่งออก CSV ได้<br/><span class="text-xs text-red-500 mt-1 block">${err.message || 'Network error'}</span>`,
                                                icon: 'error',
                                                confirmButtonColor: '#16a34a'
                                            });
                                        }
                                    }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-800 transition-colors text-left cursor-pointer font-medium"
                                >
                                    <Download className="w-4 h-4 text-blue-600" />
                                    <span>ส่งออก Matrix (CSV)</span>
                                </button>
                                <div className="border-t border-gray-100 my-1" />
                                <button
                                    onClick={() => {
                                        setIsSettingsMenuOpen(false);
                                        setShowSettingsModal(true);
                                    }}
                                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-green-700 transition-colors text-left cursor-pointer font-medium"
                                >
                                    <Settings className="w-4 h-4 text-gray-500" />
                                    <span>ตั้งค่าชุดข้อสอบ</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onManageExams}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl text-white transition-all shadow-sm bg-green-600 hover:bg-green-700 active:scale-95 cursor-pointer"
                    >
                        <FileQuestion size={18} />
                        <span>จัดการคำถาม</span>
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
                            {item_bank.description && (
                                <div className="flex flex-col gap-1 pt-2 border-t border-gray-50 mt-2">
                                    <span className="text-gray-600 font-medium text-sm">คำอธิบาย</span>
                                    <p className="text-gray-700 text-sm leading-relaxed">{item_bank.description}</p>
                                </div>
                            )}
                            <div className="flex flex-col gap-2 pt-2 border-t border-gray-50 mt-2">
                                <span className="text-gray-600 font-medium text-sm">ประเภทข้อสอบ</span>
                                <div className="flex flex-wrap gap-1.5">
                                    {item_bank.categories && item_bank.categories.length > 0 ? (
                                        item_bank.categories.map((cat) => (
                                            <span
                                                key={cat.category_id}
                                                className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded-md border border-blue-100"
                                            >
                                                {cat.category_name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 text-sm italic">ไม่ได้ระบุประเภทข้อสอบ</span>
                                    )}
                                </div>
                            </div>
                            <div className="flex justify-between items-center text-md pt-2 border-t border-gray-50 mt-2">
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
                </div>


               

            </div>

            {/* Item Performance Analytics Section */}
            {(() => {
                const allMissed = data.item_analytics?.most_missed || [];
                const totalMissedPages = Math.max(1, Math.ceil(allMissed.length / ITEMS_PER_PAGE));
                const currentMissed = allMissed.slice((pageMissed - 1) * ITEMS_PER_PAGE, pageMissed * ITEMS_PER_PAGE);

                const allSlowest = data.item_analytics?.slowest || [];
                const totalSlowestPages = Math.max(1, Math.ceil(allSlowest.length / ITEMS_PER_PAGE));
                const currentSlowest = allSlowest.slice((pageSlowest - 1) * ITEMS_PER_PAGE, pageSlowest * ITEMS_PER_PAGE);

                const hasAnalytics = allMissed.length > 0 || allSlowest.length > 0;

                return (
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-4">
                            <div>
                                <h3 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                                    <span>การวิเคราะห์ข้อสอบเชิงลึก</span>
                                </h3>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    สถิติข้อสอบเรียงตามอัตราการตอบผิดสูงสุด และข้อที่ผู้เข้าสอบใช้เวลาทำนานที่สุด
                                </p>
                            </div>
                        </div>

                        {!hasAnalytics ? (
                            <div className="py-8 text-center text-gray-400 text-sm bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                                <p>ยังไม่มีข้อมูลสถิติรายข้อ</p>
                                <p className="text-xs text-gray-400 mt-1">จะแสดงผลอัตโนมัติเมื่อมีผู้เข้าสอบส่งข้อสอบเรียบร้อยแล้ว</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                {/* Most Missed Questions Card */}
                                <div className="bg-rose-50/40 rounded-xl p-4 border border-rose-100/80 space-y-3.5 flex flex-col justify-between">
                                    <div className="space-y-3.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-rose-100 text-rose-600 rounded-lg">
                                                    <AlertTriangle className="w-4 h-4" />
                                                </div>
                                                <div className="flex items-baseline gap-1.5">
                                                    <h4 className="text-sm font-medium text-gray-800">
                                                        ตอบผิดบ่อยที่สุด
                                                    </h4>
                                                    <span className="text-xs text-gray-500 font-normal">
                                                        ({allMissed.length} ข้อ)
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-sm font-medium text-rose-600 bg-rose-100/80 px-2 py-0.5 rounded-full">
                                                อัตราตอบผิด
                                            </span>
                                        </div>

                                        <div className="space-y-2.5">
                                            {currentMissed.map((item, idx) => {
                                                const globalRank = (pageMissed - 1) * ITEMS_PER_PAGE + idx + 1;
                                                return (
                                                    <div
                                                        key={item.item_id}
                                                        onClick={() => setSelectedItem(item)}
                                                        className="bg-white p-3 rounded-lg border border-rose-100/70 shadow-2xs hover:shadow-xs hover:border-rose-300 transition-all cursor-pointer space-y-2"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-700 text-sm font-bold shrink-0">
                                                                    {globalRank}
                                                                </span>
                                                                <span className="text-xs font-medium text-gray-700 shrink-0">
                                                                    ข้อ {item.display_order || globalRank}
                                                                </span>
                                                                <p className="text-xs text-gray-600 truncate font-normal" title={cleanQuestionText(item.question_text)}>
                                                                    {cleanQuestionText(item.question_text) || 'ไม่มีข้อความคำถาม'}
                                                                </p>
                                                            </div>
                                                            <span className="text-xs font-bold text-rose-600 shrink-0">
                                                                {item.error_rate}%
                                                            </span>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className="bg-orange-500 h-1.5 rounded-full transition-all duration-500"
                                                                style={{ width: `${Math.min(item.error_rate, 100)}%` }}
                                                            />
                                                        </div>

                                                        <div className="flex items-center justify-between text-sm text-gray-500 pt-0.5">
                                                            <span>ตอบผิด {item.incorrect_count}/{item.total_attempts} ครั้ง</span>
                                                            <span className="flex items-center gap-1 text-rose-400 text-xs">ดูรายละเอียด <ChevronRight className="w-3.5 h-3.5" /></span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalMissedPages > 1 && (
                                        <div className="flex items-center justify-between pt-2 border-t border-rose-100/70 text-xs text-gray-500">
                                            <span>หน้า {pageMissed} จาก {totalMissedPages}</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    disabled={pageMissed <= 1}
                                                    onClick={() => setPageMissed((p) => Math.max(1, p - 1))}
                                                    className="p-1 rounded-md bg-white border border-rose-200 text-gray-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                    title="ก่อนหน้า"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={pageMissed >= totalMissedPages}
                                                    onClick={() => setPageMissed((p) => Math.min(totalMissedPages, p + 1))}
                                                    className="p-1 rounded-md bg-white border border-rose-200 text-gray-600 hover:bg-rose-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                    title="ถัดไป"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Slowest Questions Card */}
                                <div className="bg-amber-50/40 rounded-xl p-4 border border-amber-100/80 space-y-3.5 flex flex-col justify-between">
                                    <div className="space-y-3.5">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
                                                    <Clock className="w-4 h-4" />
                                                </div>
                                                <div className="flex items-baseline gap-1.5">
                                                    <h4 className="text-sm font-medium text-gray-800">
                                                        ใช้เวลานานที่สุด
                                                    </h4>
                                                    <span className="text-xs text-gray-500 font-normal">
                                                        ({allSlowest.length} ข้อ)
                                                    </span>
                                                </div>
                                            </div>
                                            <span className="text-sm font-medium text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-full">
                                                เวลาเฉลี่ย/ข้อ
                                            </span>
                                        </div>

                                        <div className="space-y-2.5">
                                            {currentSlowest.map((item, idx) => {
                                                const globalRank = (pageSlowest - 1) * ITEMS_PER_PAGE + idx + 1;
                                                const maxSlowestTime = allSlowest[0]?.avg_time_seconds || 1;
                                                const relativePercent = Math.min(100, Math.max(15, (item.avg_time_seconds / maxSlowestTime) * 100));

                                                return (
                                                    <div
                                                        key={item.item_id}
                                                        onClick={() => setSelectedItem(item)}
                                                        className="bg-white p-3 rounded-lg border border-amber-100/70 shadow-2xs hover:shadow-xs hover:border-amber-300 transition-all cursor-pointer space-y-2"
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-sm font-bold shrink-0">
                                                                    {globalRank}
                                                                </span>
                                                                <span className="text-xs font-medium text-gray-700 shrink-0">
                                                                    ข้อ {item.display_order || globalRank}
                                                                </span>
                                                                <p className="text-xs text-gray-600 truncate font-normal" title={cleanQuestionText(item.question_text)}>
                                                                    {cleanQuestionText(item.question_text) || 'ไม่มีข้อความคำถาม'}
                                                                </p>
                                                            </div>
                                                            <span className="text-xs font-bold text-amber-700 shrink-0">
                                                                {formatTimeSpent(item.avg_time_seconds)}
                                                            </span>
                                                        </div>

                                                        {/* Progress Bar */}
                                                        <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                            <div
                                                                className="bg-yellow-500 h-1.5 rounded-full transition-all duration-500"
                                                                style={{ width: `${relativePercent}%` }}
                                                            />
                                                        </div>

                                                        <div className="flex items-center justify-between text-sm text-gray-500 pt-0.5">
                                                            <span>ทำทั้งหมด {item.total_attempts} ครั้ง</span>
                                                            <span className="flex items-center gap-1 text-amber-500 text-xs">ดูรายละเอียด <ChevronRight className="w-3.5 h-3.5" /></span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Pagination Controls */}
                                    {totalSlowestPages > 1 && (
                                        <div className="flex items-center justify-between pt-2 border-t border-amber-100/70 text-xs text-gray-500">
                                            <span>หน้า {pageSlowest} จาก {totalSlowestPages}</span>
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    disabled={pageSlowest <= 1}
                                                    onClick={() => setPageSlowest((p) => Math.max(1, p - 1))}
                                                    className="p-1 rounded-md bg-white border border-amber-200 text-gray-600 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                    title="ก่อนหน้า"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </button>
                                                <button
                                                    type="button"
                                                    disabled={pageSlowest >= totalSlowestPages}
                                                    onClick={() => setPageSlowest((p) => Math.min(totalSlowestPages, p + 1))}
                                                    className="p-1 rounded-md bg-white border border-amber-200 text-gray-600 hover:bg-amber-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                                    title="ถัดไป"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}

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
                            {(() => {
                                const completedActivities = recent_activity.filter(
                                    (session) => session.status === 'COMPLETED' || session.end_time != null
                                );

                                if (completedActivities.length === 0) {
                                    return (
                                        <tr>
                                            <td colSpan={4} className="py-8 text-center text-gray-400 text-sm">
                                                ไม่มีข้อมูลกิจกรรมล่าสุดในขณะนี้
                                            </td>
                                        </tr>
                                    );
                                }

                                return completedActivities.map((session) => (
                                    <tr key={session.session_id} className="hover:bg-gray-50 transition-colors">
                                        <td className="py-4 text-sm font-medium text-gray-900">
                                            {session.user_name || `ผู้เข้าสอบ #${session.user_id}`}
                                        </td>
                                        <td className="py-4 text-sm text-gray-500">
                                            {new Date(session.end_time || session.start_time).toLocaleDateString('th-TH', {
                                                month: 'short', day: 'numeric', year: 'numeric'
                                            })}
                                        </td>
                                        <td className="py-4 text-sm font-medium text-gray-900">
                                            {session.score != null
                                                ? `${Number(Number(session.score).toFixed(2))}%`
                                                : '-'}
                                        </td>
                                        <td className="py-4">
                                            <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${(session.score ?? 0) >= 50
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {(session.score ?? 0) >= 50 ? 'ผ่าน' : 'ไม่ผ่าน'}
                                            </span>
                                        </td>
                                    </tr>
                                ));
                            })()}
                        </tbody>
                    </table>
                </div>
            </div>

            <ItemDetailModal item={selectedItem} onClose={() => setSelectedItem(null)} />

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

function formatTimeSpent(seconds: number) {
    if (!seconds || seconds <= 0) return '0 วิ';
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    if (m > 0) {
        return `${m} นาที ${s > 0 ? `${s} วิ` : ''}`;
    }
    return `${s} วิ`;
}

function cleanQuestionText(text: string) {
    if (!text) return '';
    return text.replace(/<[^>]*>?/gm, '').trim();
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
