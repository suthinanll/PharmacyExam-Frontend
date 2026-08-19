'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar_admin from '@/components/Navbar_admin';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts';
import {
    Layers,
    Users,
    CheckCircle2,
    XCircle,
    TrendingUp,
    Sparkles,
    BookOpen,
    BrainCircuit,
    ChevronDown,
    RefreshCw,
    Award,
    AlertCircle,
    ArrowRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';

interface ItemBank {
    item_bank_id: number;
    bank_name: string;
}

interface MSTAdminAnalytics {
    total_sessions: number;
    passed: number;
    failed: number;
    pass_rate: number;
    avg_theta: number;
    avg_se: number;
    avg_items: number;
    pathway_distribution: Record<string, number>;
    theta_distribution: Array<{ range: string; count: number }>;
    recent_sessions: Array<{
        session_id: number;
        user_id: number;
        user_name: string;
        final_theta: number;
        final_se: number;
        total_items: number;
        total_correct: number;
        passed: boolean;
        routing_path: string[];
        end_time: string;
    }>;
}

interface ReadinessData {
    item_bank_id: number | null;
    bank_name: string;
    total_items: number;
    total_situations: number;
    difficulty_breakdown: {
        easy: number;
        medium: number;
        hard: number;
    };
    is_ready: boolean;
    readiness_percentage: number;
    message: string;
}

export default function MSTAdminManagementPage() {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [analytics, setAnalytics] = useState<MSTAdminAnalytics | null>(null);

    // Readiness Checker
    const [banks, setBanks] = useState<ItemBank[]>([]);
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
    const [readiness, setReadiness] = useState<ReadinessData | null>(null);
    const [loadingReadiness, setLoadingReadiness] = useState(false);

    const authHeaders = useCallback(() => ({
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
    }), [getToken]);

    const fetchAnalytics = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mst/admin/analytics`, {
                headers: authHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                setAnalytics(data);
            }
        } catch (error) {
            console.error('Failed to load MST analytics:', error);
        } finally {
            setLoading(false);
        }
    }, [authHeaders]);

    const fetchBanks = useCallback(async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items-bank`, {
                headers: authHeaders(),
            });
            if (res.ok) {
                const data = await res.json();
                setBanks(data);
            }
        } catch (error) {
            console.error('Failed to load banks:', error);
        }
    }, [authHeaders]);

    const fetchReadiness = useCallback(async (bankId: number | null) => {
        try {
            setLoadingReadiness(true);
            const url = bankId
                ? `${process.env.NEXT_PUBLIC_API_URL}/mst/admin/readiness?item_bank_id=${bankId}`
                : `${process.env.NEXT_PUBLIC_API_URL}/mst/admin/readiness`;
            const res = await fetch(url, { headers: authHeaders() });
            if (res.ok) {
                const data = await res.json();
                setReadiness(data);
            }
        } catch (error) {
            console.error('Failed to load readiness:', error);
        } finally {
            setLoadingReadiness(false);
        }
    }, [authHeaders]);

    useEffect(() => {
        fetchAnalytics();
        fetchBanks();
        fetchReadiness(null);
    }, [fetchAnalytics, fetchBanks, fetchReadiness]);

    const handleBankChange = (bankId: number | null) => {
        setSelectedBankId(bankId);
        fetchReadiness(bankId);
    };

    return (
        <Navbar_admin>
            <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">

                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2.5">
                            <Layers className="w-6 h-6 text-indigo-600" />
                            MST Management & Analytics
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            วิเคราะห์ผลการสอบแบบปรับเหมาะรายด่าน (Multistage Adaptive Testing) และประเมินความพร้อมของคลังข้อสอบ
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            fetchAnalytics();
                            fetchReadiness(selectedBankId);
                        }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-gray-700 rounded-xl shadow-xs transition"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        รีเฟรชข้อมูล
                    </button>
                </div>

                {/* ── Top Metric Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">จำนวนการสอบทั้งหมด</span>
                            <Users className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div className="text-2xl font-bold text-gray-900 mt-2">
                            {analytics?.total_sessions ?? 0}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">MST Sessions</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">อัตราการสอบผ่าน</span>
                            <Award className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div className="text-2xl font-bold text-emerald-600 mt-2">
                            {analytics?.pass_rate ?? 0}%
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">
                            ผ่าน {analytics?.passed ?? 0} / {analytics?.total_sessions ?? 0} คน
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">ค่าเฉลี่ยความสามารถ (θ)</span>
                            <TrendingUp className="w-4 h-4 text-purple-600" />
                        </div>
                        <div className="text-2xl font-bold text-purple-700 mt-2">
                            {analytics?.avg_theta !== undefined ? (analytics.avg_theta > 0 ? `+${analytics.avg_theta}` : analytics.avg_theta) : '-'}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">Average Ability Score</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">ค่าความคลาดเคลื่อน (SE)</span>
                            <BrainCircuit className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-2xl font-bold text-blue-700 mt-2">
                            {analytics?.avg_se ?? '-'}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">Standard Error</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-gray-500">เฉลี่ยจำนวนข้อที่ทำ</span>
                            <BookOpen className="w-4 h-4 text-amber-600" />
                        </div>
                        <div className="text-2xl font-bold text-slate-800 mt-2">
                            {analytics?.avg_items ?? '-'}
                        </div>
                        <div className="text-[11px] text-gray-400 mt-1">ข้อ / Session</div>
                    </div>
                </div>

                {/* ── Item Bank Readiness Checker Card ── */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">
                                    การตรวจสอบความพร้อมของคลังข้อสอบ (MST Readiness Check)
                                </h2>
                                <p className="text-xs text-gray-500">
                                    วิเคราะห์การกระจายตัวของระดับความยาก (Easy / Medium / Hard) และกลุ่มสถานการณ์
                                </p>
                            </div>
                        </div>

                        {/* Bank Selector Dropdown */}
                        <div className="relative min-w-[240px]">
                            <select
                                value={selectedBankId ?? ''}
                                onChange={(e) => handleBankChange(e.target.value ? Number(e.target.value) : null)}
                                className="w-full appearance-none px-4 py-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            >
                                <option value="">คลังข้อสอบรวม (Global Pool)</option>
                                {banks.map((b) => (
                                    <option key={b.item_bank_id} value={b.item_bank_id}>
                                        {b.bank_name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                    </div>

                    {loadingReadiness ? (
                        <div className="h-24 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
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
                                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                                    )}
                                    <span>{readiness.is_ready ? 'พร้อมใช้กับระบบ MST' : 'ยังไม่พร้อมเต็มรูปแบบ'}</span>
                                </div>
                                <p className="text-xs mt-1.5 leading-relaxed opacity-90">
                                    {readiness.message}
                                </p>
                            </div>

                            {/* Tiers Breakdown */}
                            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <span className="text-[11px] font-semibold text-gray-400">ข้อสอบทั้งหมด</span>
                                    <div className="text-lg font-bold text-gray-800 mt-0.5">{readiness.total_items} ข้อ</div>
                                </div>

                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                    <span className="text-[11px] font-semibold text-blue-600">ง่าย (Easy: b &lt; -0.4)</span>
                                    <div className="text-lg font-bold text-blue-700 mt-0.5">
                                        {readiness.difficulty_breakdown.easy} ข้อ
                                    </div>
                                </div>

                                <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl">
                                    <span className="text-[11px] font-semibold text-amber-600">ปานกลาง (Med: -0.4..0.4)</span>
                                    <div className="text-lg font-bold text-amber-700 mt-0.5">
                                        {readiness.difficulty_breakdown.medium} ข้อ
                                    </div>
                                </div>

                                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                                    <span className="text-[11px] font-semibold text-rose-600">ยาก (Hard: b &gt; 0.4)</span>
                                    <div className="text-lg font-bold text-rose-700 mt-0.5">
                                        {readiness.difficulty_breakdown.hard} ข้อ
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : null}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* ── Routing Pathway Distribution (Left) ── */}
                    <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <Layers className="w-4 h-4 text-indigo-600" />
                            การกระจายตัวของเส้นทางด่าน (Routing Pathway)
                        </h2>
                        <p className="text-xs text-gray-500">
                            สัดส่วนผู้สอบที่ถูกจัดสรรไปในแต่ละระดับความยากหลังจบ Stage 1 (Routing Stage)
                        </p>

                        <div className="space-y-3 pt-2">
                            {analytics && analytics.pathway_distribution && Object.keys(analytics.pathway_distribution).length > 0 ? (
                                Object.entries(analytics.pathway_distribution).map(([pathKey, count]) => {
                                    const total = analytics.total_sessions || 1;
                                    const pct = Math.round((count / total) * 100);

                                    return (
                                        <div key={pathKey} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                                            <div className="flex items-center justify-between text-xs font-semibold">
                                                <span className="text-gray-800 line-clamp-1">{pathKey}</span>
                                                <span className="text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md">
                                                    {count} คน ({pct}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-indigo-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${pct}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-10 text-xs text-gray-400">
                                    ยังไม่มีข้อมูลเส้นทางด่านจากการสอบที่เสร็จสมบูรณ์
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Theta Ability Distribution Chart (Right) ── */}
                    <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-indigo-600" />
                            การกระจายตัวของระดับความสามารถ (Theta Distribution)
                        </h2>
                        <p className="text-xs text-gray-500">
                            ความถี่ของค่า $\theta$ ที่ประเมินได้จากผู้สอบทั้งหมด
                        </p>

                        <div className="h-56 pt-2">
                            {analytics && analytics.theta_distribution ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.theta_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#64748b' }} />
                                        <Tooltip
                                            contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                            formatter={(value: any) => [`${value} คน`, 'จำนวนผู้สอบ']}
                                            labelFormatter={(label) => `ช่วงความสามารถ: ${label}`}
                                        />
                                        <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]}>
                                            {analytics.theta_distribution.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={parseFloat(entry.range.split('~')[0]) >= 0 ? '#10b981' : '#f43f5e'}
                                                />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-xs text-gray-400">
                                    กำลังโหลดข้อมูล...
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* ── Recent Sessions Table ── */}
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-6">
                    <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        ประวัติการสอบ MST ล่าสุด
                    </h2>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead>
                                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600">
                                    <th className="py-3 px-4 font-semibold">Session ID</th>
                                    <th className="py-3 px-4 font-semibold">ผู้สอบ</th>
                                    <th className="py-3 px-4 font-semibold">เส้นทางด่าน (Routing Path)</th>
                                    <th className="py-3 px-4 font-semibold text-center">ระดับความสามารถ (θ)</th>
                                    <th className="py-3 px-4 font-semibold text-center">คะแนน</th>
                                    <th className="py-3 px-4 font-semibold text-center">ผลการสอบ</th>
                                    <th className="py-3 px-4 font-semibold">วันที่ / เวลา</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {analytics && analytics.recent_sessions && analytics.recent_sessions.length > 0 ? (
                                    analytics.recent_sessions.map((s) => (
                                        <tr key={s.session_id} className="hover:bg-slate-50/60 transition">
                                            <td className="py-3.5 px-4  font-semibold text-gray-500">#{s.session_id}</td>
                                            <td className="py-3.5 px-4 font-semibold text-gray-900">{s.user_name}</td>
                                            <td className="py-3.5 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(s.routing_path || []).map((p, idx) => (
                                                        <span key={idx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                                            {p}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3.5 px-4 text-center  font-bold text-indigo-700">
                                                {s.final_theta !== null ? s.final_theta.toFixed(2) : '-'}
                                            </td>
                                            <td className="py-3.5 px-4 text-center text-gray-700 font-semibold">
                                                {s.total_correct}/{s.total_items}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${s.passed
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-rose-100 text-rose-700'
                                                    }`}>
                                                    {s.passed ? 'ผ่าน' : 'ไม่ผ่าน'}
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-gray-500 text-[11px]">
                                                {s.end_time ? new Date(s.end_time).toLocaleString('th-TH') : '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-gray-400">
                                            ยังไม่มีข้อมูลการสอบ MST
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </Navbar_admin>
    );
}
