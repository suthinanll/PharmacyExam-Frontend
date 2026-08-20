'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar_admin from "@/components/Navbar_admin";
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, AreaChart, Area, PieChart, Pie, Legend,
} from 'recharts';
import {
    BrainCircuit, Users, Award, BookOpen, TrendingUp, Sparkles,
    RefreshCw, CheckCircle2, AlertCircle, ChevronDown, SlidersHorizontal,
    Target, ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { useAuth } from "@/contexts/AuthContext";

// ======================== TYPES ========================
interface ItemBank { item_bank_id: number; bank_name: string; description?: string; }

interface CATAdminAnalytics {
    total_sessions: number;
    passed: number;
    failed: number;
    pass_rate: number;
    avg_theta: number;
    avg_se: number;
    avg_items: number;
    theta_distribution: Array<{ range: string; count: number }>;
    stop_reason_breakdown: Record<string, number>;
    recent_sessions: Array<{
        session_id: number;
        user_id: number;
        user_name?: string;
        final_theta: number;
        final_se: number;
        num_items: number;
        passed: boolean;
        stop_reason: string;
        end_time: string;
    }>;
}

interface CATReadinessData {
    item_bank_id: number;
    item_bank_name: string;
    is_ready: boolean;
    total_items: number;
    valid_items: number;
    invalid_items: number;
    readiness_percentage: number;
    min_items_required: number;
    message: string;
    items_without_irt?: Array<{
        item_id: number;
        question_text: string;
        missing_params: string[];
    }>;
}

interface TIFPoint { theta: number; info: number; se: number; }

const API = `${process.env.NEXT_PUBLIC_API_URL}`;

function formatStopReason(reason: string) {
    switch (reason) {
        case 'se_threshold': return 'ความแม่นยำถึงเกณฑ์ (SE ≤ Target)';
        case 'max_items': return 'ทำครบจำนวนข้อสูงสุด (Max Items)';
        case 'min_items': return 'ทำครบจำนวนข้อขั้นต่ำ';
        case 'no_more_items': return 'ข้อสอบในคลังหมด';
        case 'confidence_interval': return 'ช่วงความเชื่อมั่นผ่านเกณฑ์';
        default: return reason || 'เสร็จสมบูรณ์';
    }
}

export default function CATManagementPage() {
    const { getToken } = useAuth();
    const [analytics, setAnalytics] = useState<CATAdminAnalytics | null>(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);

    // Bank & Readiness
    const [banks, setBanks] = useState<ItemBank[]>([]);
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
    const [readiness, setReadiness] = useState<CATReadinessData | null>(null);
    const [loadingReadiness, setLoadingReadiness] = useState(false);

    // TIF modal
    const [showTIF, setShowTIF] = useState(false);
    const [tifData, setTifData] = useState<TIFPoint[] | null>(null);
    const [tifBankName, setTifBankName] = useState('');

    const authHeaders = useCallback(() => ({
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
    }), [getToken]);

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoadingAnalytics(true);
            const res = await fetch(`${API}/cat/admin/analytics`, { headers: authHeaders() });
            if (res.ok) {
                const data = await res.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Failed to load CAT analytics:', error);
        } finally {
            setLoadingAnalytics(false);
        }
    }, [authHeaders]);

    const fetchBanks = useCallback(async () => {
        try {
            const r = await fetch(`${API}/items-bank`, { headers: authHeaders() });
            if (r.ok) setBanks(await r.json());
        } catch { /* silent */ }
    }, [authHeaders]);

    const fetchReadiness = useCallback(async (bankId: number | null) => {
        if (!bankId) {
            setReadiness(null);
            return;
        }
        try {
            setLoadingReadiness(true);
            const res = await fetch(`${API}/cat/check-readiness/${bankId}`, { headers: authHeaders() });
            if (res.ok) {
                const data = await res.json();
                setReadiness(data);
            }
        } catch (error) {
            console.error('Failed to load CAT readiness:', error);
        } finally {
            setLoadingReadiness(false);
        }
    }, [authHeaders]);

    const fetchTIF = async (bankId: number, bankName: string) => {
        try {
            const r = await fetch(`${API}/cat/admin/bank/${bankId}/tif`, { headers: authHeaders() });
            if (!r.ok) throw new Error();
            const data = await r.json();
            setTifData(data.tif);
            setTifBankName(bankName);
            setShowTIF(true);
        } catch {
            Swal.fire('ข้อผิดพลาด', 'โหลด TIF ไม่ได้', 'error');
        }
    };

    useEffect(() => {
        fetchAnalytics();
        fetchBanks();
    }, [fetchAnalytics, fetchBanks]);

    useEffect(() => {
        if (selectedBankId) {
            fetchReadiness(selectedBankId);
        } else {
            setReadiness(null);
        }
    }, [fetchReadiness, selectedBankId]);

    const handleRefreshAll = () => {
        fetchAnalytics();
        fetchBanks();
        if (selectedBankId) {
            fetchReadiness(selectedBankId);
        }
    };

    return (
        <Navbar_admin>
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6" suppressHydrationWarning>

                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">

                            CAT Management & Analytics
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            วิเคราะห์ผลการสอบแบบปรับเหมาะตามความสามารถ (Computerized Adaptive Testing) และประเมินความพร้อมของคลังข้อสอบ
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/admin/irt_management"
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-sm font-semibold text-white rounded-xl shadow-xs transition cursor-pointer"
                        >
                            <SlidersHorizontal className="w-4 h-4" />
                            จัดการพารามิเตอร์ IRT
                        </Link>
                        <button
                            onClick={handleRefreshAll}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-sm font-semibold text-gray-700 rounded-xl shadow-xs transition cursor-pointer"
                        >
                            <RefreshCw className={`w-4 h-4 ${loadingAnalytics ? 'animate-spin' : ''}`} />
                            รีเฟรชข้อมูล
                        </button>
                    </div>
                </div>

                {/* ── Top Metric Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-600">จำนวนการสอบทั้งหมด</span>
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                            {analytics?.total_sessions ?? 0}
                        </div>
                        <div className="text-sm text-gray-400 mt-1">ครั้ง</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-600">อัตราการสอบผ่าน</span>
                            <Award className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2">
                            {analytics?.pass_rate ?? 0}%
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                            ผ่าน {analytics?.passed ?? 0} / {analytics?.total_sessions ?? 0} คน
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-600">ค่าเฉลี่ยความสามารถ (θ)</span>
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-purple-700 mt-2">
                            {analytics?.avg_theta !== undefined ? (analytics.avg_theta > 0 ? `+${analytics.avg_theta}` : analytics.avg_theta) : '-'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Average Ability Score</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-600">ค่าความคลาดเคลื่อน (SE)</span>
                            <BrainCircuit className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-bold text-blue-700 mt-2">
                            {analytics?.avg_se ?? '-'}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">Standard Error</div>
                    </div>
                </div>

                {/* ── Item Bank Readiness Checker Card ── */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 font-bold">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">
                                    การตรวจสอบความพร้อมของคลังข้อสอบ (CAT Readiness Check)
                                </h2>
                                <p className="text-sm text-gray-500">
                                    ประเมินจำนวนข้อสอบที่มีพารามิเตอร์ IRT ครบถ้วนตามเกณฑ์ขั้นต่ำสำหรับระบบ Adaptive Testing
                                </p>
                            </div>
                        </div>

                        {/* Bank Selector Dropdown */}
                        <div className="flex items-center gap-2">
                            <div className="relative min-w-[240px]">
                                <select
                                    value={selectedBankId ?? ''}
                                    onChange={(e) => {
                                        const bId = e.target.value ? Number(e.target.value) : null;
                                        setSelectedBankId(bId);
                                    }}
                                    className="w-full appearance-none px-4 py-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                                >
                                    <option value="">เลือกคลังข้อสอบเพื่อตรวจสอบ...</option>
                                    {banks.map((b) => (
                                        <option key={b.item_bank_id} value={b.item_bank_id}>
                                            {b.bank_name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            {selectedBankId && (
                                <button
                                    onClick={() => fetchTIF(selectedBankId, banks.find(b => b.item_bank_id === selectedBankId)?.bank_name || '')}
                                    className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition cursor-pointer"
                                    title="ดูฟังก์ชันสารสนเทศของแบบทดสอบ (TIF)"
                                >
                                    <TrendingUp size={16} /> ดู TIF
                                </button>
                            )}
                        </div>
                    </div>

                    {loadingReadiness ? (
                        <div className="h-24 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : readiness ? (
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

                            {/* Status box */}
                            <div className={`md:col-span-4 p-4 rounded-xl border flex flex-col justify-center ${readiness.is_ready
                                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                                : 'bg-amber-50/70 border-amber-200 text-amber-900'
                                }`}>
                                <div className="flex items-center gap-2 font-bold text-sm">
                                    {readiness.is_ready ? (
                                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                    )}
                                    <span>{readiness.is_ready ? 'พร้อมใช้กับการสอบ CAT' : 'ยังไม่พร้อมใช้กับ CAT'}</span>
                                </div>
                                <p className="text-sm mt-1.5 leading-relaxed opacity-90">
                                    {readiness.message}
                                </p>
                            </div>

                            {/* Stats Breakdown */}
                            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <span className="text-xs font-semibold text-gray-500">ข้อสอบทั้งหมด</span>
                                    <div className="text-xl font-bold text-gray-800 mt-0.5">{readiness.total_items} ข้อ</div>
                                </div>

                                <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl">
                                    <span className="text-xs font-semibold text-emerald-700">ระบุ IRT ครบ</span>
                                    <div className="text-xl font-bold text-emerald-700 mt-0.5">
                                        {readiness.valid_items} ข้อ
                                    </div>
                                </div>

                                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                                    <span className="text-xs font-semibold text-rose-700">ยังไม่ระบุ IRT</span>
                                    <div className="text-xl font-bold text-rose-700 mt-0.5">
                                        {readiness.invalid_items} ข้อ
                                    </div>
                                </div>

                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                    <span className="text-xs font-semibold text-blue-700">ความพร้อม</span>
                                    <div className="text-xl font-bold text-blue-700 mt-0.5">
                                        {readiness.readiness_percentage}%
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="py-6 text-center text-sm text-gray-400">
                            กรุณาเลือกคลังข้อสอบด้านบนเพื่อตรวจสอบความพร้อม
                        </div>
                    )}
                </div>

                {/* ── Analytics Charts (2 Columns) ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left: Termination Criteria Breakdown (Donut Chart) */}
                    <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4 flex flex-col justify-between">
                        <div>
                            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Target className="w-5 h-5 text-green-600" />
                                เกณฑ์การสิ้นสุดการสอบ (Stopping Criteria Distribution)
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                สัดส่วนเหตุผลที่ระบบ CAT ยุติการสอบของผู้เข้าสอบ
                            </p>
                        </div>

                        {analytics && analytics.stop_reason_breakdown && Object.keys(analytics.stop_reason_breakdown).length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center pt-2">
                                {/* Donut Chart */}
                                <div className="sm:col-span-5 relative h-48 flex items-center justify-center">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Tooltip
                                                contentStyle={{ fontSize: '13px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                                formatter={(value: any, name: any) => [`${value} คน`, name]}
                                            />
                                            <Pie
                                                data={Object.entries(analytics.stop_reason_breakdown).map(([reasonKey, count], idx) => {
                                                    const colors = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];
                                                    const total = analytics.total_sessions || 1;
                                                    const pct = Math.round((count / total) * 100);
                                                    return {
                                                        name: formatStopReason(reasonKey),
                                                        key: reasonKey,
                                                        value: count,
                                                        percentage: pct,
                                                        color: colors[idx % colors.length],
                                                    };
                                                })}
                                                dataKey="value"
                                                nameKey="name"
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={45}
                                                outerRadius={70}
                                                paddingAngle={3}
                                            >
                                                {Object.entries(analytics.stop_reason_breakdown).map((_, index) => {
                                                    const colors = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];
                                                    return (
                                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                                                    );
                                                })}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-xl font-bold text-gray-800">{analytics?.total_sessions ?? 0}</span>
                                        <span className="text-xs text-gray-400">การสอบ</span>
                                    </div>
                                </div>

                                {/* Custom Legend List */}
                                <div className="sm:col-span-7 space-y-2">
                                    {Object.entries(analytics.stop_reason_breakdown).map(([reasonKey, count], idx) => {
                                        const colors = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];
                                        const color = colors[idx % colors.length];
                                        const total = analytics.total_sessions || 1;
                                        const pct = Math.round((count / total) * 100);
                                        const name = formatStopReason(reasonKey);

                                        return (
                                            <div key={reasonKey} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-sm">
                                                <div className="flex items-center gap-2 min-w-0 pr-2">
                                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                                                    <span className="text-gray-700 font-medium truncate" title={name}>{name}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 shrink-0 font-semibold">
                                                    <span className="text-gray-900">{count} คน</span>
                                                    <span className="text-gray-400 text-xs">({pct}%)</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12 text-sm text-gray-400">
                                ยังไม่มีข้อมูลเหตุผลการยุติการสอบจากการสอบที่เสร็จสมบูรณ์
                            </div>
                        )}
                    </div>

                    {/* Right: Theta Ability Distribution Chart */}
                    <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-green-600" />
                            การกระจายตัวของระดับความสามารถ (Theta Distribution)
                        </h2>
                        <p className="text-sm text-gray-500">
                            ความถี่ของค่าความสามารถ θ ที่ประเมินได้จากผู้สอบทั้งหมด
                        </p>

                        <div className="h-56 pt-2">
                            {analytics && analytics.theta_distribution ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.theta_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                                        <Tooltip
                                            contentStyle={{ fontSize: '13px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                            formatter={(value: any) => [`${value} คน`, 'จำนวนผู้สอบ']}
                                            labelFormatter={(label) => `ช่วงความสามารถ (θ): ${label}`}
                                        />
                                        <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]}>
                                            {analytics.theta_distribution.map((entry, index) => {
                                                const val = parseFloat(entry.range.split('~')[0]);
                                                return (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={val >= 0 ? '#10b981' : '#f43f5e'}
                                                    />
                                                );
                                            })}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-gray-400">
                                    กำลังโหลดข้อมูล...
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* ── Recent CAT Sessions Table ── */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-green-600" />
                            ประวัติการสอบ CAT ล่าสุด
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-xs sm:text-sm">
                                    <th className="py-3 px-4 font-semibold">Session ID</th>
                                    <th className="py-3 px-4 font-semibold">ผู้สอบ</th>
                                    <th className="py-3 px-4 font-semibold text-center">จำนวนข้อที่ทำ</th>
                                    <th className="py-3 px-4 font-semibold text-center">ระดับความสามารถ (θ)</th>
                                    <th className="py-3 px-4 font-semibold text-center">ความคลาดเคลื่อน (SE)</th>
                                    <th className="py-3 px-4 font-semibold text-center">ผลการสอบ</th>
                                    <th className="py-3 px-4 font-semibold">เหตุผลการสิ้นสุด</th>
                                    <th className="py-3 px-4 font-semibold">วันที่ / เวลา</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {analytics && analytics.recent_sessions && analytics.recent_sessions.length > 0 ? (
                                    analytics.recent_sessions.map((s) => (
                                        <tr key={s.session_id} className="hover:bg-slate-50/60 transition">
                                            <td className="py-3.5 px-4 font-semibold text-gray-500">#{s.session_id}</td>
                                            <td className="py-3.5 px-4 font-semibold text-gray-900">{s.user_name || `ผู้สอบ #${s.user_id}`}</td>
                                            <td className="py-3.5 px-4 text-center font-medium text-gray-700">{s.num_items} ข้อ</td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-xs sm:text-sm">
                                                    {s.final_theta !== null && s.final_theta !== undefined ? (s.final_theta > 0 ? `+${s.final_theta.toFixed(2)}` : s.final_theta.toFixed(2)) : '-'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-center text-gray-600">
                                                {s.final_se !== null && s.final_se !== undefined ? s.final_se.toFixed(3) : '-'}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                {s.passed ? (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> ผ่าน
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                                                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> ไม่ผ่าน
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-600">
                                                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                                    {formatStopReason(s.stop_reason)}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-500 text-xs sm:text-sm">
                                                {s.end_time ? new Date(s.end_time).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="py-8 text-center text-sm text-gray-400">
                                            ยังไม่มีประวัติการสอบ CAT ในระบบ
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* ── Banner link to IRT Calibration Matrix ── */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-green-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                            <SlidersHorizontal className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-900">
                                จัดการพารามิเตอร์ IRT รายข้อ
                            </h3>
                            <p className="text-sm text-gray-600 mt-0.5">
                                กำหนดค่าความยาก (b), อำนาจจำแนก (a), การเดา (c) พร้อมกราฟ ICC Curve
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/admin/irt_management"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
                    >
                        <span>ไปยังหน้าจัดการ IRT</span>
                        <ArrowRight size={16} />
                    </Link>
                </div>

            </div>

            {/* ══════════════════════════════════════════
                MODAL — TIF (Test Information Function)
            ══════════════════════════════════════════ */}
            {showTIF && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
                    <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl p-6 space-y-4">
                        <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">ฟังก์ชันสารสนเทศของแบบทดสอบ (TIF)</h3>
                                <p className="text-sm text-gray-500 mt-0.5">{tifBankName}</p>
                            </div>
                            <button onClick={() => setShowTIF(false)}
                                className="text-gray-300 hover:text-gray-500 p-1 hover:bg-gray-100 rounded-lg transition-all cursor-pointer">
                                ✕
                            </button>
                        </div>

                        <div className="h-64">
                            {tifData ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={tifData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="theta" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                                        <Tooltip
                                            contentStyle={{ fontSize: 13, borderRadius: 8, border: '1px solid #e5e7eb' }}
                                            formatter={(v: any, name: any) => [
                                                name === 'info' ? Number(v).toFixed(2) : Number(v).toFixed(3),
                                                name === 'info' ? 'สารสนเทศ I(θ)' : 'SE(θ)',
                                            ]}
                                            labelFormatter={l => `θ = ${l}`}
                                        />
                                        <Area type="monotone" dataKey="info" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.1} strokeWidth={2} name="info" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : null}
                        </div>

                        <div className="bg-purple-50 p-3.5 rounded-xl border border-purple-100 text-sm text-purple-800 space-y-1">
                            <p className="font-semibold">💡 ข้อมูล TIF (Test Information Function)</p>
                            <p className="opacity-90">กราฟแสดงปริมาณสารสนเทศ I(θ) ที่คลังข้อสอบนี้วัดได้ในแต่ละระดับความสามารถ ความสูงของกราฟบอกถึงความแม่นยำในการวัดผล</p>
                        </div>
                    </div>
                </div>
            )}
        </Navbar_admin>
    );
}
