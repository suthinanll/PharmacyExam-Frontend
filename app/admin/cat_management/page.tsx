'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar_admin from "@/components/Navbar_admin";
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, Cell, AreaChart, Area, PieChart, Pie, Legend,
    LabelList,
} from 'recharts';
import {
    BrainCircuit, Users, Award, BookOpen, TrendingUp, Sparkles,
    RefreshCw, CheckCircle2, AlertCircle, ChevronDown, SlidersHorizontal,
    Target, ArrowRight, HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import Swal from "@/utils/sweetalert";
import { useAuth } from "@/contexts/AuthContext";
import Pagination from "@/components/Pagination";

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

    // Pagination for Recent CAT Sessions
    const [sessionPage, setSessionPage] = useState(1);
    const SESSIONS_PER_PAGE = 10;

    // Mobile / Click Tooltip state
    const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

    useEffect(() => {
        const handleClickOutside = () => setActiveTooltip(null);
        if (activeTooltip) {
            window.addEventListener('click', handleClickOutside);
            return () => window.removeEventListener('click', handleClickOutside);
        }
    }, [activeTooltip]);

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
            <div className="max-w-7xl mx-auto w-full space-y-6" suppressHydrationWarning>

                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">

                            จัดการและวิเคราะห์ข้อสอบ CAT
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            วิเคราะห์ผลการสอบแบบปรับเหมาะตามความสามารถ (Computerized Adaptive Testing) และประเมินความพร้อมของคลังข้อสอบ
                        </p>
                    </div>
                    <div className="flex items-start gap-2">

                        <button
                            onClick={handleRefreshAll}
                            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-sm font-medium text-gray-700 rounded-xl shadow-xs transition cursor-pointer"
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
                            <span className="text-sm font-medium text-gray-600">จำนวนการสอบทั้งหมด</span>
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-medium text-gray-900 mt-2">
                            {analytics?.total_sessions ?? 0}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">ครั้ง</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">อัตราการสอบผ่าน</span>
                            <Award className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-medium text-green-600 mt-2">
                            {analytics?.pass_rate ?? 0}%
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                            ผ่าน {analytics?.passed ?? 0} / {analytics?.total_sessions ?? 0} คน
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-gray-600">ค่าเฉลี่ยความสามารถ (θ)</span>
                                <div className="relative group/tooltip inline-flex items-center" onClick={e => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTooltip(prev => prev === 'theta' ? null : 'theta')}
                                        className="p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                                        aria-label="คำอธิบายค่าเฉลี่ยความสามารถ"
                                    >
                                        <HelpCircle className="w-3.5 h-3.5 text-gray-600 hover:text-gray-600 transition-colors" />
                                    </button>
                                    <div className={`absolute bottom-full left-0 sm:left-1/2 sm:-translate-x-1/2 mb-2 w-64 max-w-[calc(100vw-2.5rem)] p-3 bg-white/98 backdrop-blur-md border border-slate-200 text-slate-700 text-sm rounded-xl shadow-xl z-50 transition-all ${activeTooltip === 'theta' ? 'block' : 'hidden group-hover/tooltip:block pointer-events-none'
                                        }`}>
                                        <p className="font-medium text-purple-700 mb-1">ค่าเฉลี่ยความสามารถ (θ - Theta)</p>
                                        <p className="text-slate-600">
                                            ระดับความสามารถเฉลี่ยของผู้สอบตามทฤษฎี IRT โดยค่ามาตรฐานอยู่ที่ 0.00 (ค่าบวก = เก่งกว่าค่าเฉลี่ย, ค่าลบ = ต่ำกว่าค่าเฉลี่ย)
                                        </p>
                                        <div className="absolute top-full left-3 sm:left-1/2 sm:-translate-x-1/2 border-4 border-transparent border-t-white" />
                                    </div>
                                </div>
                            </div>
                            <TrendingUp className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-medium text-purple-700 mt-2">
                            {analytics?.avg_theta !== undefined ? (analytics.avg_theta > 0 ? `+${analytics.avg_theta}` : analytics.avg_theta) : '-'}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Average Ability Score</div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                                <span className="text-sm font-medium text-gray-600">ค่าความคลาดเคลื่อน (SE)</span>
                                <div className="relative group/tooltip inline-flex items-center" onClick={e => e.stopPropagation()}>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTooltip(prev => prev === 'se' ? null : 'se')}
                                        className="p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                                        aria-label="คำอธิบายความคลาดเคลื่อนมาตรฐาน"
                                    >
                                        <HelpCircle className="w-3.5 h-3.5 text-gray-600 hover:text-gray-600 transition-colors" />
                                    </button>
                                    <div className={`absolute bottom-full right-0 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 mb-2 w-64 max-w-[calc(100vw-2.5rem)] p-3 bg-white/98 backdrop-blur-md border border-slate-200 text-slate-700 text-sm rounded-xl shadow-xl z-50 transition-all ${activeTooltip === 'se' ? 'block' : 'hidden group-hover/tooltip:block pointer-events-none'
                                        }`}>
                                        <p className="font-medium text-blue-700 mb-1">ความคลาดเคลื่อนมาตรฐาน (SE)</p>
                                        <p className="text-slate-600">
                                            ค่าความคลาดเคลื่อนในการประเมินระดับความสามารถ ค่ายิ่งน้อยแปลว่าการประเมินยิ่งมีความแม่นยำสูง (เกณฑ์ CAT ทั่วไป SE ≤ 0.30 - 0.40)
                                        </p>
                                        <div className="absolute top-full right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 border-4 border-transparent border-t-white" />
                                    </div>
                                </div>
                            </div>
                            <BrainCircuit className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-medium text-blue-700 mt-2">
                            {analytics?.avg_se ?? '-'}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">Standard Error</div>
                    </div>
                </div>

                {/* ── Item Bank Readiness Checker Card ── */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 font-medium">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-base font-medium text-gray-900">
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
                                    className="w-full appearance-none px-4 py-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                                >
                                    <option value="">เลือกคลังข้อสอบเพื่อตรวจสอบ...</option>
                                    {banks.map((b) => (
                                        <option key={b.item_bank_id} value={b.item_bank_id}>
                                            {b.bank_name}
                                        </option>
                                    ))}
                                </select>
                                <ChevronDown className="w-4 h-4 text-gray-600 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                            </div>

                            {selectedBankId && (
                                <button
                                    onClick={() => fetchTIF(selectedBankId, banks.find(b => b.item_bank_id === selectedBankId)?.bank_name || '')}
                                    className="shrink-0 flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl transition cursor-pointer"
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
                                ? 'bg-green-50/70 border-green-200 text-green-900'
                                : 'bg-amber-50/70 border-amber-200 text-amber-900'
                                }`}>
                                <div className="flex items-center gap-2 font-medium text-sm">
                                    {readiness.is_ready ? (
                                        <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                                    )}
                                    <span>{readiness.is_ready ? 'พร้อมใช้กับการสอบ CAT' : 'ยังไม่พร้อมใช้กับ CAT'}</span>
                                </div>
                                <p className="text-sm mt-1.5  opacity-90">
                                    {readiness.message}
                                </p>
                            </div>

                            {/* Stats Breakdown */}
                            <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                                <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                                    <span className="text-sm font-medium text-gray-500">ข้อสอบทั้งหมด</span>
                                    <div className="text-xl font-medium text-gray-800 mt-0.5">{readiness.total_items} ข้อ</div>
                                </div>

                                <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                                    <span className="text-sm font-medium text-green-700">ระบุ IRT ครบ</span>
                                    <div className="text-xl font-medium text-green-700 mt-0.5">
                                        {readiness.valid_items} ข้อ
                                    </div>
                                </div>

                                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl">
                                    <span className="text-sm font-medium text-rose-700">ยังไม่ระบุ IRT</span>
                                    <div className="text-xl font-medium text-rose-700 mt-0.5">
                                        {readiness.invalid_items} ข้อ
                                    </div>
                                </div>

                                <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                    <span className="text-sm font-medium text-blue-700">ความพร้อม</span>
                                    <div className="text-xl font-medium text-blue-700 mt-0.5">
                                        {readiness.readiness_percentage}%
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        <div className="py-6 text-center text-sm text-gray-600">
                            กรุณาเลือกคลังข้อสอบด้านบนเพื่อตรวจสอบความพร้อม
                        </div>
                    )}
                </div>

                {/* ── Analytics Charts (2 Columns) ── */}
                {/* ── Visual Analytics Section ── */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Left: Termination Criteria Breakdown (Donut Chart) */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-auto min-h-[340px] sm:h-[340px]">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                                    <h2 className="text-base font-medium text-gray-900 truncate">
                                        เกณฑ์การสิ้นสุดการสอบ (Stopping Criteria)
                                    </h2>
                                    <div className="relative group/tooltip inline-flex items-center" onClick={e => e.stopPropagation()}>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTooltip(prev => prev === 'stopping' ? null : 'stopping')}
                                            className="p-0.5 rounded-full hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                                            aria-label="คำอธิบายเกณฑ์การสิ้นสุดการสอบ"
                                        >
                                            <HelpCircle className="w-3.5 h-3.5 text-gray-600 hover:text-gray-600 transition-colors" />
                                        </button>
                                        <div className={`absolute bottom-full right-[-10px] sm:left-0 md:left-1/2 sm:right-auto md:-translate-x-1/2 mb-2 w-72 sm:w-80 max-w-[calc(100vw-2.5rem)] p-3.5 bg-white/98 backdrop-blur-md border border-slate-200 text-slate-700 text-sm rounded-xl shadow-xl z-50 transition-all ${activeTooltip === 'stopping' ? 'block' : 'hidden group-hover/tooltip:block pointer-events-none'
                                            }`}>
                                            <p className="font-medium text-emerald-700 mb-2 border-b border-slate-100 pb-1">
                                                เกณฑ์การสิ้นสุดการสอบแบบปรับเหมาะ (CAT)
                                            </p>
                                            <div className="space-y-2 text-slate-600">
                                                <div>
                                                    <span className="font-medium text-gray-900">1. ความแม่นยำ (SE Threshold):</span>
                                                    <p className="text-sm text-gray-500">หยุดเมื่อค่า SE &le; 0.35 (ได้ระดับความสามารถที่แม่นยำตามเป้าหมาย)</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-900">2. ช่วงความเชื่อมั่น (95% CI):</span>
                                                    <p className="text-sm text-gray-500">หยุดเมื่อมั่นใจ 95% ว่าคะแนนผ่านหรือตกเกณฑ์ Cut-Score</p>
                                                </div>
                                                <div>
                                                    <span className="font-medium text-gray-900">3. จำนวนข้อสอบ (Item Limits):</span>
                                                    <p className="text-sm text-gray-500">หยุดเมื่อทำครบจำนวนข้อสูงสุด (Max Items) หรือข้อสอบในคลังหมด</p>
                                                </div>
                                            </div>
                                            <div className="absolute top-full right-4 sm:left-4 md:left-1/2 md:right-auto md:-translate-x-1/2 border-4 border-transparent border-t-white" />
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs font-medium bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200 shrink-0">
                                    ทั้งหมด {analytics?.total_sessions ?? 0} ครั้ง
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">
                                สัดส่วนเหตุผลที่ระบบ CAT ยุติการสอบของผู้เข้าสอบ
                            </p>
                        </div>

                        {analytics && analytics.stop_reason_breakdown && Object.keys(analytics.stop_reason_breakdown).length > 0 ? (
                            <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 min-h-0">
                                {/* Donut Chart on the Left */}
                                <div className="relative w-full sm:w-5/12 h-[180px] sm:h-full flex items-center justify-center shrink-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload;
                                                        return (
                                                            <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl shadow-lg border border-slate-100 text-xs space-y-1 z-50">
                                                                <p className="font-medium text-gray-900">{data.name}</p>
                                                                <p className="text-gray-600 font-medium">
                                                                    จำนวน: <span className="font-medium text-gray-900">{data.value} คน</span> ({data.percentage}%)
                                                                </p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
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
                                                innerRadius={48}
                                                outerRadius={74}
                                                paddingAngle={3}
                                                cornerRadius={4}
                                            >
                                                {Object.entries(analytics.stop_reason_breakdown).map((_, index) => {
                                                    const colors = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];
                                                    return (
                                                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="#ffffff" strokeWidth={2} />
                                                    );
                                                })}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-2xl font-medium text-gray-900 leading-tight">{analytics?.total_sessions ?? 0}</span>
                                        <span className="text-xs text-gray-600">การสอบทั้งหมด</span>
                                    </div>
                                </div>

                                {/* Custom Legend List on the Right */}
                                <div className="w-full sm:w-7/12 space-y-2 overflow-y-auto max-h-[190px] pr-1">
                                    {Object.entries(analytics.stop_reason_breakdown).map(([reasonKey, count], idx) => {
                                        const colors = ['#10b981', '#6366f1', '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6'];
                                        const color = colors[idx % colors.length];
                                        const total = analytics.total_sessions || 1;
                                        const pct = Math.round((count / total) * 100);
                                        const name = formatStopReason(reasonKey);

                                        return (
                                            <div
                                                key={reasonKey}
                                                className="p-2.5 rounded-xl bg-slate-50/90 border border-slate-100 hover:bg-slate-100/80 transition-colors text-xs space-y-1.5"
                                            >
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="flex items-center gap-2 min-w-0 flex-1">
                                                        <span className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: color }} />
                                                        <span className="text-gray-800 font-medium truncate text-xs" title={name}>{name}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 shrink-0">
                                                        <span className="text-gray-900 font-medium">{count} คน</span>
                                                        <span className="bg-white text-gray-600 px-1.5 py-0.5 rounded-md border border-slate-200 font-medium text-[0.6875rem]">
                                                            {pct}%
                                                        </span>
                                                    </div>
                                                </div>
                                                {/* Mini Progress Bar */}
                                                <div className="w-full bg-slate-200/60 rounded-full h-1 overflow-hidden">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-300"
                                                        style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-16 text-sm text-gray-600">
                                ยังไม่มีข้อมูลเหตุผลการยุติการสอบจากการสอบที่เสร็จสมบูรณ์
                            </div>
                        )}
                    </div>

                    {/* Right: Theta Ability Distribution Chart */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs flex flex-col justify-between h-auto min-h-[340px] sm:h-[340px]">
                        <div>
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2 min-w-0">
                                    <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shrink-0" />
                                    <h2 className="text-base font-medium text-gray-900 truncate">
                                        การกระจายตัวของระดับความสามารถ (Theta Distribution)
                                    </h2>
                                </div>
                                <span className="text-xs font-medium bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full border border-purple-200 shrink-0">
                                    เฉลี่ย θ = {analytics?.avg_theta !== undefined && analytics?.avg_theta !== null ? (analytics.avg_theta > 0 ? `+${analytics.avg_theta.toFixed(2)}` : analytics.avg_theta.toFixed(2)) : '0.00'}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">
                                ความถี่ของค่าความสามารถ θ ที่ประเมินได้จากผู้สอบทั้งหมด
                            </p>
                        </div>

                        <div className="flex-1 w-full min-h-0 pt-2">
                            {analytics && analytics.theta_distribution ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics.theta_distribution} margin={{ top: 22, right: 10, left: -22, bottom: 5 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis
                                            dataKey="range"
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                            axisLine={{ stroke: '#e2e8f0' }}
                                            tickLine={false}
                                            tickFormatter={(val: string) => val.replace('~', '..')}
                                        />
                                        <YAxis
                                            allowDecimals={false}
                                            tick={{ fontSize: 10, fill: '#64748b' }}
                                            axisLine={{ stroke: '#e2e8f0' }}
                                            tickLine={false}
                                        />
                                        <Tooltip
                                            content={({ active, payload }) => {
                                                if (active && payload && payload.length) {
                                                    const entry = payload[0].payload;
                                                    const val = parseFloat(entry.range.split('~')[0]);
                                                    const total = analytics?.total_sessions || 1;
                                                    const pct = Math.round(((entry.count || 0) / total) * 100);
                                                    const levelLabel = val >= 1.0 ? "ระดับความสามารถสูงมาก" : val >= 0 ? "ระดับความสามารถปานกลาง (ผ่านเกณฑ์)" : val >= -1.0 ? "ระดับความสามารถค่อนข้างต่ำ" : "ระดับความสามารถต่ำมาก";
                                                    const levelColor = val >= 0 ? "text-emerald-600" : val >= -1.0 ? "text-amber-600" : "text-rose-600";

                                                    return (
                                                        <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl shadow-lg border border-slate-100 text-xs space-y-1 z-50">
                                                            <p className="font-medium text-gray-900 border-b border-slate-100 pb-1">
                                                                ช่วงความสามารถ (θ): <span className="font-medium">{entry.range}</span>
                                                            </p>
                                                            <div className="flex justify-between gap-3 text-gray-600">
                                                                <span>จำนวนผู้สอบ:</span>
                                                                <span className="font-medium text-gray-900">{entry.count} คน</span>
                                                            </div>
                                                            <div className="flex justify-between gap-3 text-gray-500">
                                                                <span>สัดส่วน:</span>
                                                                <span className="font-medium text-purple-600">{pct}%</span>
                                                            </div>
                                                            <div className={`text-xs font-medium pt-0.5 ${levelColor}`}>
                                                                ● {levelLabel}
                                                            </div>
                                                        </div>
                                                    );
                                                }
                                                return null;
                                            }}
                                        />
                                        <Bar dataKey="count" radius={[6, 6, 0, 0]} maxBarSize={28}>
                                            {analytics.theta_distribution.map((entry, index) => {
                                                const val = parseFloat(entry.range.split('~')[0]);
                                                const color = val >= 1.0 ? '#10b981' : val >= 0 ? '#34d399' : val >= -1.0 ? '#fbbf24' : '#f43f5e';
                                                return (
                                                    <Cell key={`theta-cell-${index}`} fill={color} />
                                                );
                                            })}
                                            <LabelList
                                                dataKey="count"
                                                position="top"
                                                formatter={(val: any) => val > 0 ? `${val} คน` : ''}
                                                style={{ fontSize: 10, fill: '#475569', fontWeight: 500 }}
                                            />
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-sm text-gray-600">
                                    กำลังโหลดข้อมูล...
                                </div>
                            )}
                        </div>
                    </div>

                </div>

                {/* ── Recent CAT Sessions Table ── */}
                {(() => {
                    const allSessions = analytics?.recent_sessions || [];
                    const totalSessions = allSessions.length;
                    const totalSessionPages = Math.max(1, Math.ceil(totalSessions / SESSIONS_PER_PAGE));
                    const paginatedSessions = allSessions.slice((sessionPage - 1) * SESSIONS_PER_PAGE, sessionPage * SESSIONS_PER_PAGE);

                    return (
                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs space-y-4 p-6">
                            <div className="flex items-center justify-between">
                                <h2 className="text-base font-medium text-gray-900 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-green-600" />
                                    ประวัติการสอบ CAT ล่าสุด
                                </h2>
                                {totalSessions > 0 && (
                                    <span className="text-sm text-gray-500 font-medium">
                                        ทั้งหมด {totalSessions} รายการ
                                    </span>
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead>
                                        <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 text-sm">
                                            <th className="py-3 px-4 font-medium">Session ID</th>
                                            <th className="py-3 px-4 font-medium">ผู้สอบ</th>
                                            <th className="py-3 px-4 font-medium text-center">จำนวนข้อที่ทำ</th>
                                            <th className="py-3 px-4 font-medium text-center">ระดับความสามารถ (θ)</th>
                                            <th className="py-3 px-4 font-medium text-center">ความคลาดเคลื่อน (SE)</th>
                                            <th className="py-3 px-4 font-medium text-center">ผลการสอบ</th>
                                            <th className="py-3 px-4 font-medium">เหตุผลการสิ้นสุด</th>
                                            <th className="py-3 px-4 font-medium">วันที่ / เวลา</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {paginatedSessions.length > 0 ? (
                                            paginatedSessions.map((s) => (
                                                <tr key={s.session_id} className="hover:bg-slate-50/60 transition">
                                                    <td className="py-3.5 px-4 font-medium text-gray-500">#{s.session_id}</td>
                                                    <td className="py-3.5 px-4 text-gray-900 font-medium">{s.user_name || `ผู้สอบ #${s.user_id}`}</td>
                                                    <td className="py-3.5 px-4 text-center font-medium text-gray-700">{s.num_items} ข้อ</td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        <span className="font-medium text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-sm">
                                                            {s.final_theta !== null && s.final_theta !== undefined ? (s.final_theta > 0 ? `+${s.final_theta.toFixed(2)}` : s.final_theta.toFixed(2)) : '-'}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center text-gray-600">
                                                        {s.final_se !== null && s.final_se !== undefined ? s.final_se.toFixed(3) : '-'}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-center">
                                                        {s.passed ? (
                                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2.5 py-0.5 rounded-full border border-green-200">
                                                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" /> ผ่าน
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                                                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> ไม่ผ่าน
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="py-3.5 px-4 text-gray-600">
                                                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                                                            {formatStopReason(s.stop_reason)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3.5 px-4 text-gray-500 text-sm">
                                                        {s.end_time ? new Date(s.end_time).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="py-8 text-center text-sm text-gray-600">
                                                    ยังไม่มีประวัติการสอบ CAT ในระบบ
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card List View */}
                            <div className="block md:hidden space-y-3">
                                {paginatedSessions.length > 0 ? (
                                    paginatedSessions.map((s) => (
                                        <div
                                            key={s.session_id}
                                            className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 space-y-2.5 shadow-2xs"
                                        >
                                            {/* Top Row: User & Result Badge */}
                                            <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-xs font-medium text-gray-600">#{s.session_id}</span>
                                                        <span className="text-sm font-medium text-gray-900 truncate">
                                                            {s.user_name || `ผู้สอบ #${s.user_id}`}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="shrink-0">
                                                    {s.passed ? (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200">
                                                            <CheckCircle2 className="w-3 h-3 text-green-600" /> ผ่าน
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                                                            <AlertCircle className="w-3 h-3 text-rose-600" /> ไม่ผ่าน
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Metric Grid (3 cols) */}
                                            <div className="grid grid-cols-3 gap-1.5 bg-white p-2.5 rounded-lg border border-slate-100 text-center">
                                                <div>
                                                    <div className="text-[0.625rem] text-gray-500 font-medium">จำนวนข้อ</div>
                                                    <div className="text-xs font-medium text-gray-800 mt-0.5">{s.num_items} ข้อ</div>
                                                </div>
                                                <div>
                                                    <div className="text-[0.625rem] text-gray-500 font-medium">ความสามารถ (θ)</div>
                                                    <div className="mt-0.5">
                                                        <span className="font-medium text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded text-xs">
                                                            {s.final_theta !== null && s.final_theta !== undefined ? (s.final_theta > 0 ? `+${s.final_theta.toFixed(2)}` : s.final_theta.toFixed(2)) : '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <div className="text-[0.625rem] text-gray-500 font-medium">ความคลาดเคลื่อน (SE)</div>
                                                    <div className="text-xs font-medium text-gray-700 mt-0.5">
                                                        {s.final_se !== null && s.final_se !== undefined ? s.final_se.toFixed(3) : '-'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Footer: Reason & Date */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-[0.6875rem] text-gray-500 pt-0.5">
                                                <div className="flex items-center gap-1 text-slate-700 truncate">
                                                    <span className="text-gray-600">เหตุผล:</span>
                                                    <span className="font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200 truncate">
                                                        {formatStopReason(s.stop_reason)}
                                                    </span>
                                                </div>
                                                <div className="text-gray-600 text-right">
                                                    {s.end_time ? new Date(s.end_time).toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center text-sm text-gray-600">
                                        ยังไม่มีประวัติการสอบ CAT ในระบบ
                                    </div>
                                )}
                            </div>

                            {totalSessions > 0 && (
                                <div className="pt-2 border-t border-slate-100">
                                    <Pagination
                                        currentPage={sessionPage}
                                        totalPages={totalSessionPages}
                                        totalItems={totalSessions}
                                        perPage={SESSIONS_PER_PAGE}
                                        onPageChange={setSessionPage}
                                        itemLabel="รายการ"
                                        className="mt-0 pt-0 border-t-0"
                                    />
                                </div>
                            )}
                        </div>
                    );
                })()}

                {/* ── Banner link to IRT Calibration Matrix ── */}
                <div className="bg-gradient-to-r from-green-50 to-green-50 border border-green-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                    <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-green-600 text-white flex items-center justify-center font-medium shrink-0 shadow-xs">
                            <SlidersHorizontal className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-base font-medium text-gray-900">
                                จัดการพารามิเตอร์ IRT รายข้อ
                            </h3>
                            <p className="text-sm text-gray-600 mt-0.5">
                                กำหนดค่าความยาก (b), อำนาจจำแนก (a), การเดา (c) พร้อมกราฟ ICC Curve
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/admin/irt_management"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
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
                                <h3 className="text-base font-medium text-gray-900">ฟังก์ชันสารสนเทศของแบบทดสอบ (TIF)</h3>
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
                            <p className="font-medium">💡 ข้อมูล TIF (Test Information Function)</p>
                            <p className="opacity-90">กราฟแสดงปริมาณสารสนเทศ I(θ) ที่คลังข้อสอบนี้วัดได้ในแต่ละระดับความสามารถ ความสูงของกราฟบอกถึงความแม่นยำในการวัดผล</p>
                        </div>
                    </div>
                </div>
            )}
        </Navbar_admin>
    );
}
