'use client';

import React, { useState, useEffect, useRef } from 'react';
import Navbar_admin from "@/components/Navbar_admin";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, ReferenceLine, AreaChart, Area, PieChart, Pie, Cell, Legend,
    ComposedChart,
} from 'recharts';
import {
    BarChart3, CheckCircle, AlertCircle, Search, Eye, X,
    ChevronLeft, ChevronRight, Filter, HelpCircle, Info,
    UploadCloud, RefreshCw, Zap, TrendingUp, Activity, AlertTriangle,
    Database, BookOpen, LayoutGrid, List, ListFilter, ArrowUpDown,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from "@/contexts/AuthContext";

// ======================== TYPES ========================
interface AnswerOption { option_id: number; option_text: string; is_correct: boolean; }
interface ItemBank { item_bank_id: number; bank_name: string; description: string; }
interface ItemWithIRT {
    item_id: number; question_text: string; question_type: string;
    irt_a_discrimination: number; irt_b_difficulty: number; irt_c_guessing: number;
    explanation: string; status: string; display_order: number;
    item_bank: ItemBank; answer_options: AnswerOption[];
    situation?: { situation_id: number; situation_text: string; situation_image_url: string };
}
interface Analytics {
    total_sessions: number; passed: number; failed: number; pass_rate: number;
    avg_theta: number; avg_se: number; avg_items: number;
    theta_distribution: { range: string; count: number }[];
    stop_reason_breakdown: Record<string, number>;
    recent_sessions: any[];
}
interface ExposureItem {
    item_id: number; exposure_count: number; exposure_rate: number;
    correct_rate: number; irt_b: number | null; question_preview: string;
    flag_overexposed: boolean;
}
interface ExposureReport { total_sessions: number; total_unique_items: number; overexposed_count: number; items: ExposureItem[]; }
interface TIFPoint { theta: number; info: number; se: number; }

// ======================== HELPERS ========================
const API = `${process.env.NEXT_PUBLIC_API_URL}`;
const ITEMS_PER_PAGE = 9;
const THETA = Array.from({ length: 81 }, (_, i) => +(-4 + i * 0.1).toFixed(2));

function irt3PL(theta: number, a: number, b: number, c: number) {
    return c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
}

const PIE_COLORS = ['#22c55e', '#ef4444', '#f59e0b', '#6366f1', '#14b8a6'];

function stripHTML(html: string) {
    if (typeof document === 'undefined') return html;
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

// ======================== ICC PREVIEW ========================
function ICCPreview({ a, b, c, theta }: { a: number; b: number; c: number; theta?: number }) {
    const data = THETA.map(t => ({
        theta: t,
        prob: +irt3PL(t, a, b, c).toFixed(4),
    }));
    return (
        <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -15, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="theta" tick={{ fontSize: 10 }} tickFormatter={v => Number(v) % 1 === 0 ? String(v) : ''} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: any) => v?.toFixed(3)} labelFormatter={l => `θ = ${l}`} />
                {theta !== undefined && (
                    <ReferenceLine x={theta} stroke="#2563eb" strokeWidth={2}
                        label={{ value: `θ=${theta.toFixed(2)}`, fill: '#2563eb', fontSize: 10, position: 'top' }} />
                )}
                <ReferenceLine x={b} stroke="#f59e0b" strokeDasharray="4 4"
                    label={{ value: `b=${b.toFixed(2)}`, fill: '#d97706', fontSize: 10, position: 'top' }} />
                <ReferenceLine y={0.5} stroke="#9ca3af" strokeDasharray="3 3" />
                <Area type="monotone" dataKey="prob" stroke="#6366f1" fill="#e0e7ff" fillOpacity={0.7} dot={false} name="P(θ)" />
            </AreaChart>
        </ResponsiveContainer>
    );
}

// ======================== TABS ========================
const TABS = [
    { id: 'items', label: 'Item Bank', icon: BookOpen },
    { id: 'analytics', label: 'Analytics', icon: Activity },
    { id: 'exposure', label: 'Exposure', icon: TrendingUp },
    { id: 'import', label: 'CSV Import', icon: UploadCloud },
    { id: 'calibration', label: 'Calibration', icon: Zap },
];

// ======================== MAIN COMPONENT ========================
export default function CATManagement() {
    const { getToken } = useAuth();
    const [activeTab, setActiveTab] = useState('items');

    // Item Bank tab
    const [itemsWithIRT, setItemsWithIRT] = useState<ItemWithIRT[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<ItemWithIRT | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
    const [viewMode, setViewMode] = useState<'table' | 'card'>('card');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [editIRT, setEditIRT] = useState({ a: 1.0, b: 0.0, c: 0.25 });
    const [isSaving, setIsSaving] = useState(false);
    const [showTIF, setShowTIF] = useState(false);
    const [tifData, setTifData] = useState<TIFPoint[] | null>(null);
    const [tifBankName, setTifBankName] = useState('');

    // Analytics tab
    const [analytics, setAnalytics] = useState<Analytics | null>(null);
    const [analyticsLoading, setAnalyticsLoading] = useState(false);

    // Exposure tab
    const [exposure, setExposure] = useState<ExposureReport | null>(null);
    const [exposureLoading, setExposureLoading] = useState(false);

    // Import tab
    const [csvText, setCsvText] = useState('');
    const [csvPreview, setCsvPreview] = useState<any[]>([]);
    const [importLoading, setImportLoading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    // Calibration tab
    const [calibBankId, setCalibBankId] = useState('');
    const [calibStatus, setCalibStatus] = useState<null | { status: string; message: string }>(null);
    const [calibLoading, setCalibLoading] = useState(false);

    const authHeaders = () => ({ 'Authorization': `Bearer ${getToken()}`, 'Content-Type': 'application/json' });

    // Fetch items
    useEffect(() => {
        const saved = localStorage.getItem('cat_viewmode') as 'table' | 'card';
        if (saved) setViewMode(saved);
        fetchItemsWithIRT();
    }, []);

    function switchView(mode: 'table' | 'card') {
        setViewMode(mode);
        localStorage.setItem('cat_viewmode', mode);
    }
    // Fetch analytics / exposure when tab opens
    useEffect(() => {
        if (activeTab === 'analytics' && !analytics) fetchAnalytics();
        if (activeTab === 'exposure' && !exposure) fetchExposure();
    }, [activeTab]);

    async function fetchItemsWithIRT() {
        try {
            setLoading(true);
            const res = await fetch(`${API}/items-bank/cat/items-with-irt`, { headers: authHeaders() });
            if (!res.ok) throw new Error();
            setItemsWithIRT(await res.json());
        } catch { Swal.fire('ข้อผิดพลาด', 'โหลดข้อมูลไม่ได้', 'error'); }
        finally { setLoading(false); }
    }

    async function fetchAnalytics() {
        try {
            setAnalyticsLoading(true);
            const res = await fetch(`${API}/cat/admin/analytics`, { headers: authHeaders() });
            if (!res.ok) throw new Error();
            setAnalytics(await res.json());
        } catch { Swal.fire('ข้อผิดพลาด', 'โหลด analytics ไม่ได้', 'error'); }
        finally { setAnalyticsLoading(false); }
    }

    async function fetchExposure() {
        try {
            setExposureLoading(true);
            const res = await fetch(`${API}/cat/admin/exposure`, { headers: authHeaders() });
            if (!res.ok) throw new Error();
            setExposure(await res.json());
        } catch { Swal.fire('ข้อผิดพลาด', 'โหลด exposure ไม่ได้', 'error'); }
        finally { setExposureLoading(false); }
    }

    async function fetchTIF(bankId: number, bankName: string) {
        try {
            const res = await fetch(`${API}/cat/admin/bank/${bankId}/tif`, { headers: authHeaders() });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setTifData(data.tif);
            setTifBankName(bankName);
            setShowTIF(true);
        } catch { Swal.fire('ข้อผิดพลาด', 'โหลด TIF ไม่ได้', 'error'); }
    }

    async function handleUpdateIRT() {
        if (!selectedItem) return;
        const { a, b, c } = editIRT;
        if (a <= 0 || a > 3 || b < -4 || b > 4 || c <= 0 || c >= 1) {
            return Swal.fire('ข้อมูลไม่ถูกต้อง', 'a: 0.1–3.0, b: -4–4, c: 0.01–0.99', 'error');
        }
        try {
            setIsSaving(true);
            const res = await fetch(`${API}/items-bank/cat/batch-update-irt`, {
                method: 'PATCH', headers: authHeaders(),
                body: JSON.stringify({ updates: [{ item_id: selectedItem.item_id, irt_a_discrimination: a, irt_b_difficulty: b, irt_c_guessing: c }] })
            });
            if (!res.ok) throw new Error();
            await Swal.fire({ title: 'บันทึกสำเร็จ!', icon: 'success', timer: 1500, showConfirmButton: false });
            setShowModal(false);
            fetchItemsWithIRT();
        } catch { Swal.fire('ข้อผิดพลาด', 'บันทึกไม่สำเร็จ', 'error'); }
        finally { setIsSaving(false); }
    }

    // CSV Import logic
    function parseCsv(text: string) {
        const lines = text.trim().split('\n').filter(l => l.trim());
        const preview: any[] = [];
        for (let i = 1; i < lines.length; i++) {
            const [item_id, a, b, c] = lines[i].split(',').map(s => s.trim());
            if (item_id && a && b && c) {
                preview.push({ item_id: +item_id, a: +a, b: +b, c: +c });
            }
        }
        return preview;
    }

    function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = ev => {
            const text = ev.target?.result as string;
            setCsvText(text);
            setCsvPreview(parseCsv(text));
        };
        reader.readAsText(file);
    }

    async function handleCSVImport() {
        if (!csvPreview.length) return;
        const invalidRows = csvPreview.filter(r => r.a <= 0 || r.a > 3 || r.b < -4 || r.b > 4 || r.c <= 0 || r.c >= 1);
        if (invalidRows.length > 0) {
            return Swal.fire('มีค่าไม่ถูกต้อง', `${invalidRows.length} แถวมีค่าเกินขอบเขต`, 'warning');
        }
        const confirm = await Swal.fire({
            title: `อัปเดต ${csvPreview.length} ข้อ?`, icon: 'question',
            showCancelButton: true, confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก'
        });
        if (!confirm.isConfirmed) return;
        try {
            setImportLoading(true);
            const updates = csvPreview.map(r => ({
                item_id: r.item_id, irt_a_discrimination: r.a, irt_b_difficulty: r.b, irt_c_guessing: r.c
            }));
            const res = await fetch(`${API}/items-bank/cat/batch-update-irt`, {
                method: 'PATCH', headers: authHeaders(),
                body: JSON.stringify({ updates })
            });
            if (!res.ok) throw new Error();
            await Swal.fire({ title: `อัปเดต ${csvPreview.length} ข้อสำเร็จ`, icon: 'success', timer: 2000, showConfirmButton: false });
            setCsvText(''); setCsvPreview([]);
            if (fileRef.current) fileRef.current.value = '';
            fetchItemsWithIRT();
        } catch { Swal.fire('ข้อผิดพลาด', 'Import ไม่สำเร็จ', 'error'); }
        finally { setImportLoading(false); }
    }

    async function handleTriggerCalibration() {
        const confirm = await Swal.fire({
            title: 'Trigger IRT Calibration?',
            text: calibBankId ? `เฉพาะ bank ${calibBankId}` : 'ทุก bank',
            icon: 'question', showCancelButton: true,
            confirmButtonText: 'ยืนยัน', cancelButtonText: 'ยกเลิก'
        });
        if (!confirm.isConfirmed) return;
        try {
            setCalibLoading(true);
            const res = await fetch(`${API}/cat/admin/trigger-calibration`, {
                method: 'POST', headers: authHeaders(),
                body: JSON.stringify({ bank_id: calibBankId ? +calibBankId : undefined })
            });
            const data = await res.json();
            setCalibStatus(data);
        } catch { setCalibStatus({ status: 'error', message: 'Network error' }); }
        finally { setCalibLoading(false); }
    }

    // Filter + pagination
    const filtered = itemsWithIRT.filter(item => {
        const q = stripHTML(item.question_text).toLowerCase();
        const ok1 = q.includes(searchTerm.toLowerCase()) || (item.item_bank?.bank_name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const ok2 = !selectedBankId || item.item_bank?.item_bank_id === selectedBankId;
        return ok1 && ok2;
    }).sort((a, b) => {
        const diff = a.item_id - b.item_id;
        return sortOrder === 'desc' ? -diff : diff;
    });

    const perPage = viewMode === 'card' ? 9 : 10;
    const totalPages = Math.ceil(filtered.length / perPage);
    const current = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    return (
        <Navbar_admin>
            <div className="max-w-6xl mx-auto px-4 py-6" suppressHydrationWarning>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">ข้อสอบ CAT Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Computerized Adaptive Testing — CATsim Admin Dashboard</p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1 flex-wrap">
                    {TABS.map(tab => (
                        <button key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white text-green-700 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'}`}>
                            <tab.icon size={16} />{tab.label}
                        </button>
                    ))}
                </div>

                {/* ─── Tab: Item Bank ─── */}
                {activeTab === 'items' && (
                    <>
                        {/* Toolbar */}
                        <div className="flex flex-col lg:flex-row gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm items-start lg:items-center justify-between">
                            <div className="flex flex-wrap gap-3 flex-1 w-full lg:w-auto">
                                <div className="relative flex-1 min-w-[240px] max-w-sm">
                                    <input type="text" placeholder="ค้นหาข้อสอบ..." value={searchTerm}
                                        onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                        className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-green-500 focus:border-green-500 bg-gray-50" />
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                                <select value={selectedBankId || ''} onChange={e => { setSelectedBankId(e.target.value ? +e.target.value : null); setCurrentPage(1); }}
                                    className="border border-gray-300 rounded-xl px-3 py-2 text-sm bg-gray-50 min-w-[180px] focus:ring-green-500">
                                    <option value="">ทุกคลังข้อสอบ</option>
                                    {Array.from(new Set(itemsWithIRT.map(i => i.item_bank?.item_bank_id)))
                                        .filter(Boolean).map(id => {
                                            const b = itemsWithIRT.find(i => i.item_bank?.item_bank_id === id)?.item_bank;
                                            return <option key={id} value={id}>{b?.bank_name}</option>;
                                        })}
                                </select>
                                <button onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium">
                                    <ArrowUpDown size={15} />
                                    {sortOrder === 'desc' ? 'ใหม่สุด' : 'เก่าสุด'}
                                </button>
                                {selectedBankId && (
                                    <button onClick={() => {
                                        const b = itemsWithIRT.find(i => i.item_bank?.item_bank_id === selectedBankId)?.item_bank;
                                        fetchTIF(selectedBankId, b?.bank_name || '');
                                    }}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 border border-purple-100 rounded-xl text-sm font-medium hover:bg-purple-100 transition-colors">
                                        <TrendingUp size={16} /> ดู TIF ของคลังนี้
                                    </button>
                                )}
                            </div>

                            {/* View toggle */}
                            <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1 shrink-0">
                                {(['table', 'card'] as const).map(mode => (
                                    <button key={mode} onClick={() => switchView(mode)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === mode
                                            ? 'bg-white shadow-sm text-green-700'
                                            : 'text-gray-500 hover:text-gray-700'}`}>
                                        {mode === 'table' ? <List size={16} /> : <LayoutGrid size={16} />}
                                        {mode === 'table' ? 'Table' : 'Card'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-16">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-3" />
                                    <p className="text-gray-500 text-sm">กำลังโหลดข้อมูลสถานะ IRT...</p>
                                </div>
                            </div>
                        ) : (
                            <>
                                {viewMode === 'table' ? (
                                    /* ── TABLE VIEW ── */
                                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-sm">
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-100">
                                                <thead className="bg-green-600 text-white">
                                                    <tr>
                                                        {['#', 'คลังข้อสอบ', 'คำถาม (preview)', 'a (Disc.)', 'b (Diff.)', 'c (Guess)', 'จัดการ'].map((h, i) => (
                                                            <th key={h} className={`px-5 py-3.5 text-left text-xs font-semibold tracking-wide ${i === 0 ? 'w-12 text-center' : ''} ${i === 6 ? 'text-center' : ''}`}>
                                                                {h}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-50">
                                                    {current.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={7} className="py-20 text-center text-gray-400">
                                                                <Database size={40} className="mx-auto mb-3 opacity-20" />
                                                                <p>{searchTerm ? 'ไม่พบข้อสอบที่ตรงกับเงื่อนไข' : 'ยังไม่มีข้อสอบในระบบที่ผ่านการ Calibrate'}</p>
                                                            </td>
                                                        </tr>
                                                    ) : current.map((item, idx) => (
                                                        <tr key={item.item_id} className="hover:bg-green-50/30 transition-colors group/row">
                                                            <td className="px-5 py-4 text-xs font-mono text-gray-400 text-center">
                                                                {item.item_id}
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-100">
                                                                    {item.item_bank?.bank_name || '—'}
                                                                </span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <div className="text-sm text-gray-700 line-clamp-1 max-w-sm" title={stripHTML(item.question_text)}>
                                                                    {stripHTML(item.question_text)}
                                                                </div>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className="text-sm font-bold text-blue-600 font-mono">{item.irt_a_discrimination?.toFixed(3)}</span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className="text-sm font-bold text-purple-600 font-mono">{(item.irt_b_difficulty > 0 ? '+' : '') + item.irt_b_difficulty?.toFixed(3)}</span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className="text-sm font-bold text-pink-600 font-mono">{item.irt_c_guessing?.toFixed(3)}</span>
                                                            </td>
                                                            <td className="px-5 py-4 text-center">
                                                                <button onClick={() => { setSelectedItem(item); setEditIRT({ a: item.irt_a_discrimination, b: item.irt_b_difficulty, c: item.irt_c_guessing }); setShowModal(true); }}
                                                                    className="p-2 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-all" title="ดูรายละเอียด / แก้ไข">
                                                                    <Eye size={18} />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                ) : (
                                    /* ── CARD VIEW ── */
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {current.length === 0 ? (
                                            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-3xl">
                                                <Database size={48} className="mx-auto mb-4 text-gray-300" />
                                                <p className="text-gray-500">ไม่พบข้อสอบที่ตรงกับเงื่อนไข</p>
                                            </div>
                                        ) : current.map(item => (
                                            <div key={item.item_id} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full shadow-sm">
                                                <div className="h-1.5 bg-gradient-to-r from-green-400 to-emerald-500" />
                                                <div className="p-6 flex flex-col flex-1">
                                                    <div className="flex justify-between items-start mb-4">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100 truncate max-w-[180px]">
                                                            {item.item_bank?.bank_name || 'ไม่ระบุ'}
                                                        </span>
                                                        <span className="text-[10px] font-mono text-gray-400">ID: {item.item_id}</span>
                                                    </div>

                                                    <p className="text-gray-800 text-sm font-medium mb-6 line-clamp-3 leading-relaxed flex-1">
                                                        {stripHTML(item.question_text)}
                                                    </p>

                                                    <div className="grid grid-cols-3 gap-3 mb-6">
                                                        {[
                                                            { label: 'Discrim. (a)', val: item.irt_a_discrimination, cls: 'bg-blue-50 text-blue-700', border: 'border-blue-100' },
                                                            { label: 'Diffic. (b)', val: item.irt_b_difficulty, cls: 'bg-purple-50 text-purple-700', border: 'border-purple-100' },
                                                            { label: 'Guess (c)', val: item.irt_c_guessing, cls: 'bg-pink-50 text-pink-700', border: 'border-pink-100' },
                                                        ].map(p => (
                                                            <div key={p.label} className={`rounded-xl p-2.5 text-center border ${p.border} ${p.cls}`}>
                                                                <p className="text-[10px] uppercase font-bold mb-1 opacity-70">{p.label}</p>
                                                                <p className="text-base font-bold font-mono">{p.val?.toFixed(2)}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <button onClick={() => { setSelectedItem(item); setEditIRT({ a: item.irt_a_discrimination, b: item.irt_b_difficulty, c: item.irt_c_guessing }); setShowModal(true); }}
                                                        className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-semibold transition-all shadow-lg hover:shadow-green-200 active:scale-95">
                                                        <Eye size={16} /> รายละเอียด IRT
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {totalPages > 1 && (
                                    <div className="flex justify-center items-center gap-2 mt-10">
                                        <button disabled={currentPage === 1} onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-white hover:shadow-md transition-all bg-gray-50 text-gray-600">
                                            <ChevronLeft size={20} />
                                        </button>
                                        <div className="flex gap-1">
                                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                                let p = currentPage - 2 + i;
                                                if (currentPage <= 2) p = i + 1;
                                                if (currentPage >= totalPages - 1) p = totalPages - 4 + i;
                                                const page = Math.max(1, Math.min(totalPages, p));
                                                if (i === 0 && page > 1) return <span key="start" className="w-10 h-10 flex items-center justify-center text-gray-400">...</span>;
                                                if (i === 4 && page < totalPages) return <span key="end" className="w-10 h-10 flex items-center justify-center text-gray-400">...</span>;
                                                return (
                                                    <button key={page} onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                        className={`w-10 h-10 text-sm font-bold border rounded-xl transition-all ${page === currentPage ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-200' : 'bg-white text-gray-600 border-gray-200 hover:border-green-600 hover:text-green-600'}`}>
                                                        {page}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        <button disabled={currentPage === totalPages} onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                            className="w-10 h-10 flex items-center justify-center border border-gray-200 rounded-xl disabled:opacity-30 hover:bg-white hover:shadow-md transition-all bg-gray-50 text-gray-600">
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}

                {/* ─── Tab: Analytics ─── */}
                {activeTab === 'analytics' && (
                    <div>
                        {analyticsLoading ? (
                            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" /></div>
                        ) : analytics ? (
                            <>
                                {/* KPI cards */}
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                    {[
                                        { label: 'สอบทั้งหมด', value: analytics.total_sessions, color: 'text-gray-800' },
                                        { label: 'Pass Rate', value: `${analytics.pass_rate}%`, color: 'text-green-600' },
                                        { label: 'Avg θ', value: analytics.avg_theta.toFixed(2), color: 'text-blue-600' },
                                        { label: 'Avg SE', value: analytics.avg_se.toFixed(3), color: 'text-purple-600' },
                                        { label: 'Avg Items', value: analytics.avg_items.toFixed(1), color: 'text-orange-600' },
                                        { label: 'ผ่าน', value: analytics.passed, color: 'text-green-600' },
                                        { label: 'ไม่ผ่าน', value: analytics.failed, color: 'text-red-500' },
                                    ].map(k => (
                                        <div key={k.label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
                                            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
                                            <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                    {/* Theta distribution */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <h3 className="font-bold text-gray-700 mb-3">📊 θ Distribution (ทุก session)</h3>
                                        <ResponsiveContainer width="100%" height={220}>
                                            <BarChart data={analytics.theta_distribution} margin={{ top: 5, right: 5, left: -15, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                                <XAxis dataKey="range" tick={{ fontSize: 9 }} />
                                                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                                                <Tooltip />
                                                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} name="จำนวน session" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>

                                    {/* Stop reason pie */}
                                    <div className="bg-white rounded-xl border border-gray-200 p-5">
                                        <h3 className="font-bold text-gray-700 mb-3">🛑 Stop Reason Breakdown</h3>
                                        {Object.keys(analytics.stop_reason_breakdown).length === 0 ? (
                                            <p className="text-gray-400 text-center pt-10">ยังไม่มีข้อมูล</p>
                                        ) : (
                                            <ResponsiveContainer width="100%" height={220}>
                                                <PieChart>
                                                    <Pie data={Object.entries(analytics.stop_reason_breakdown).map(([name, value]) => ({ name, value }))}
                                                        cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name"
                                                        label={(props: any) => `${(props.percent * 100).toFixed(0)}%`} labelLine={false}>
                                                        {Object.keys(analytics.stop_reason_breakdown).map((_, i) => (
                                                            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Legend fontSize={11} />
                                                    <Tooltip />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        )}
                                    </div>
                                </div>

                                {/* Recent sessions */}
                                <div className="bg-white rounded-xl border border-gray-200 p-5">
                                    <h3 className="font-bold text-gray-700 mb-3">🕒 Recent Sessions (10 ล่าสุด)</h3>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-100">
                                                    {['Session ID', 'User ID', 'θ', 'SE', 'Items', 'Result', 'Stop Reason'].map(h => (
                                                        <th key={h} className="text-left py-2 px-3 text-xs text-gray-400 font-medium">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {analytics.recent_sessions.map((s: any) => (
                                                    <tr key={s.session_id} className="border-b border-gray-50 hover:bg-gray-50">
                                                        <td className="py-2 px-3 font-mono text-xs">{s.session_id}</td>
                                                        <td className="py-2 px-3">{s.user_id}</td>
                                                        <td className="py-2 px-3 font-medium">{s.final_theta?.toFixed(2) ?? '-'}</td>
                                                        <td className="py-2 px-3">{s.final_se?.toFixed(3) ?? '-'}</td>
                                                        <td className="py-2 px-3">{s.num_items}</td>
                                                        <td className="py-2 px-3">
                                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${s.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                                                                {s.passed ? 'ผ่าน' : 'ไม่ผ่าน'}
                                                            </span>
                                                        </td>
                                                        <td className="py-2 px-3 text-xs text-gray-400 max-w-xs truncate">{s.stop_reason}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-3">
                                    <button onClick={() => { setAnalytics(null); fetchAnalytics(); }}
                                        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700">
                                        <RefreshCw size={14} /> รีเฟรช
                                    </button>
                                </div>
                            </>
                        ) : <p className="text-center text-gray-400 py-16">ไม่มีข้อมูล</p>}
                    </div>
                )}

                {/* ─── Tab: Exposure ─── */}
                {activeTab === 'exposure' && (
                    <div>
                        {exposureLoading ? (
                            <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" /></div>
                        ) : exposure ? (
                            <>
                                <div className="grid grid-cols-3 gap-4 mb-5">
                                    {[
                                        { label: 'Total Sessions', value: exposure.total_sessions },
                                        { label: 'Unique Items Used', value: exposure.total_unique_items },
                                        { label: 'Over-exposed Items', value: exposure.overexposed_count, alert: exposure.overexposed_count > 0 },
                                    ].map(k => (
                                        <div key={k.label} className={`rounded-xl border p-4 text-center ${k.alert ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
                                            <p className="text-xs text-gray-400 mb-1">{k.label}</p>
                                            <p className={`text-3xl font-bold ${k.alert ? 'text-red-600' : 'text-gray-800'}`}>{k.value}</p>
                                            {k.alert && <p className="text-xs text-red-500 mt-1">⚠ exposure rate &gt; 30%</p>}
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                    <div className="px-5 py-3 border-b border-gray-100 flex items-center gap-2">
                                        <AlertTriangle size={16} className="text-orange-500" />
                                        <span className="font-medium text-gray-700 text-sm">Item Exposure Report (เรียงจากมากไปน้อย)</span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-100 bg-gray-50">
                                                    {['Item ID', 'Exposure Count', 'Exposure Rate', 'b (Difficulty)', 'Correct Rate', 'คำถาม (preview)', 'Status'].map(h => (
                                                        <th key={h} className="text-left py-2 px-3 text-xs text-gray-500 font-medium">{h}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {exposure.items.map(item => (
                                                    <tr key={item.item_id} className={`border-b border-gray-50 ${item.flag_overexposed ? 'bg-red-50' : ''}`}>
                                                        <td className="py-2 px-3 font-mono text-xs">{item.item_id}</td>
                                                        <td className="py-2 px-3 font-medium">{item.exposure_count}</td>
                                                        <td className="py-2 px-3">
                                                            <div className="flex items-center gap-2">
                                                                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                    <div className={`h-full rounded-full ${item.flag_overexposed ? 'bg-red-500' : 'bg-green-500'}`}
                                                                        style={{ width: `${Math.min(item.exposure_rate * 100 / 0.3, 100)}%` }} />
                                                                </div>
                                                                <span className="text-xs">{(item.exposure_rate * 100).toFixed(1)}%</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-2 px-3 font-mono text-xs">{item.irt_b?.toFixed(2) ?? 'N/A'}</td>
                                                        <td className="py-2 px-3">{(item.correct_rate * 100).toFixed(0)}%</td>
                                                        <td className="py-2 px-3 text-xs text-gray-500 max-w-xs truncate">{item.question_preview}</td>
                                                        <td className="py-2 px-3">
                                                            {item.flag_overexposed
                                                                ? <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded font-medium">⚠ Over-exposed</span>
                                                                : <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded font-medium">✓ OK</span>}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </>
                        ) : <p className="text-center text-gray-400 py-16">ไม่มีข้อมูล</p>}
                    </div>
                )}

                {/* ─── Tab: CSV Import ─── */}
                {activeTab === 'import' && (
                    <div className="max-w-3xl">
                        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-5">
                            <h3 className="font-bold text-gray-800 mb-2">📤 Batch IRT Import (CSV)</h3>
                            <p className="text-sm text-gray-500 mb-4">อัปโหลด CSV ที่มีคอลัมน์: <code className="bg-gray-100 px-1 rounded">item_id, a, b, c</code></p>

                            {/* Sample download */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-4 font-mono text-xs text-gray-600 border border-gray-200">
                                item_id,a,b,c<br />
                                1,1.50,0.25,0.20<br />
                                2,1.20,-0.50,0.25<br />
                                3,2.00,1.00,0.15
                            </div>

                            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFileUpload}
                                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 mb-4" />

                            {csvPreview.length > 0 && (
                                <>
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-700">
                                        ✓ พบ {csvPreview.length} แถว พร้อม import
                                    </div>
                                    <div className="overflow-auto max-h-48 border border-gray-200 rounded-lg mb-4">
                                        <table className="w-full text-xs">
                                            <thead className="bg-gray-50 sticky top-0">
                                                <tr>{['item_id', 'a', 'b', 'c', 'Valid?'].map(h => <th key={h} className="text-left py-1.5 px-3 text-gray-500">{h}</th>)}</tr>
                                            </thead>
                                            <tbody>
                                                {csvPreview.map((r, i) => {
                                                    const valid = r.a > 0 && r.a <= 3 && r.b >= -4 && r.b <= 4 && r.c > 0 && r.c < 1;
                                                    return (
                                                        <tr key={i} className={`border-t ${!valid ? 'bg-red-50' : ''}`}>
                                                            <td className="py-1 px-3">{r.item_id}</td>
                                                            <td className="py-1 px-3">{r.a}</td>
                                                            <td className="py-1 px-3">{r.b}</td>
                                                            <td className="py-1 px-3">{r.c}</td>
                                                            <td className="py-1 px-3">{valid ? '✓' : <span className="text-red-500">✗ Out of range</span>}</td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <button onClick={handleCSVImport} disabled={importLoading}
                                        className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                                        {importLoading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> กำลัง Import...</> : <><UploadCloud size={18} /> Import {csvPreview.length} ข้อ</>}
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* ─── Tab: Calibration ─── */}
                {activeTab === 'calibration' && (
                    <div className="max-w-xl">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                                    <Zap className="text-yellow-600" size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800">IRT Calibration Trigger</h3>
                                    <p className="text-xs text-gray-400">เรียก irt_service ให้ re-calibrate ค่า a/b/c จาก response data</p>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5 text-sm text-amber-700">
                                <strong>หมายเหตุ:</strong> ต้องมีข้อมูลการตอบสอบสะสมมากพอก่อน (อย่างน้อย 200 responses ต่อข้อ) จึงจะ calibrate ได้แม่นยำ
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Bank ID (เว้นว่างเพื่อ calibrate ทุก bank)</label>
                                <input type="number" value={calibBankId} onChange={e => setCalibBankId(e.target.value)}
                                    placeholder="เช่น 1"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-yellow-500 focus:border-yellow-500" />
                            </div>

                            <button onClick={handleTriggerCalibration} disabled={calibLoading}
                                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50">
                                {calibLoading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Triggering...</> : <><Zap size={18} /> Trigger Calibration</>}
                            </button>

                            {calibStatus && (
                                <div className={`mt-4 rounded-lg p-4 text-sm ${calibStatus.status === 'triggered' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-600'}`}>
                                    <p className="font-medium">{calibStatus.status === 'triggered' ? '✅' : '❌'} {calibStatus.message}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ─── MODALS ─── */}

            {/* Item Detail Modal */}
            {showModal && selectedItem && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">รายละเอียดข้อสอบ — ID {selectedItem.item_id}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Question */}
                            {selectedItem.situation && (
                                <div className="bg-blue-50 rounded-xl p-4 border-l-4 border-blue-400">
                                    <p className="text-xs font-bold text-blue-600 mb-1">สถานการณ์</p>
                                    <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: selectedItem.situation.situation_text }} />
                                </div>
                            )}
                            <div>
                                <p className="text-xs font-medium text-gray-500 mb-1">คำถาม</p>
                                <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: selectedItem.question_text }} />
                            </div>

                            {/* Answer options */}
                            {selectedItem.answer_options?.length > 0 && (
                                <div className="space-y-2">
                                    {selectedItem.answer_options.map((opt, i) => (
                                        <div key={opt.option_id} className={`p-3 rounded-lg border ${opt.is_correct ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                                            <span className="text-sm font-medium mr-2">{i + 1}.</span>
                                            <span className="text-sm">{opt.option_text}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* IRT edit */}
                            <div>
                                <p className="text-sm font-bold text-gray-700 mb-3">✏️ แก้ไข IRT Parameters</p>
                                <div className="grid grid-cols-3 gap-3 mb-4">
                                    {[
                                        { key: 'a', label: 'a — Discrimination', hint: 'แนะนำ: 1.0–2.0', cls: 'border-blue-200 focus:ring-blue-400' },
                                        { key: 'b', label: 'b — Difficulty', hint: 'ช่วง: -4.0 ถึง 4.0', cls: 'border-purple-200 focus:ring-purple-400' },
                                        { key: 'c', label: 'c — Guessing', hint: 'แนะนำ: 0.20–0.25', cls: 'border-pink-200 focus:ring-pink-400' },
                                    ].map(f => (
                                        <div key={f.key}>
                                            <label className="block text-xs text-gray-500 mb-1">{f.label}</label>
                                            <input type="number" step="0.01"
                                                value={(editIRT as any)[f.key]}
                                                onChange={e => setEditIRT({ ...editIRT, [f.key]: +e.target.value })}
                                                className={`w-full border rounded-lg px-3 py-2 text-lg font-bold text-center focus:ring-2 outline-none ${f.cls}`} />
                                            <p className="text-[10px] text-gray-400 mt-0.5">{f.hint}</p>
                                        </div>
                                    ))}
                                </div>

                                {/* ICC Preview */}
                                <div className="bg-indigo-50 rounded-xl p-4">
                                    <p className="text-xs font-bold text-indigo-600 mb-2">📈 ICC Preview (กราฟ P(θ) ตามค่าที่กำหนด)</p>
                                    <ICCPreview a={editIRT.a} b={editIRT.b} c={editIRT.c} />
                                </div>
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex gap-3">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">ยกเลิก</button>
                            <button onClick={handleUpdateIRT} disabled={isSaving}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2">
                                {isSaving ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />กำลังบันทึก</> : 'บันทึก'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* TIF Modal */}
            {showTIF && tifData && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-3xl w-full">
                        <div className="border-b px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-semibold">📈 Test Information Function — {tifBankName}</h3>
                            <button onClick={() => setShowTIF(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>
                        <div className="p-6">
                            <p className="text-xs text-gray-400 mb-4">TIF แสดงว่า item bank วัดได้แม่นยำที่สุดที่ θ ใด (ยิ่งสูง ยิ่งดี) เส้น 1/√I(θ) = SE</p>
                            <ResponsiveContainer width="100%" height={300}>
                                <ComposedChart data={tifData.filter((_, i) => i % 2 === 0)} margin={{ top: 8, right: 30, left: -10, bottom: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                    <XAxis dataKey="theta" label={{ value: 'θ', position: 'insideBottom', offset: -10 }} tick={{ fontSize: 10 }}
                                        tickFormatter={v => Number(v) % 1 === 0 ? String(v) : ''} />
                                    <YAxis yAxisId="info" label={{ value: 'I(θ)', angle: -90, position: 'insideLeft', offset: 12 }} tick={{ fontSize: 10 }} />
                                    <YAxis yAxisId="se" orientation="right" label={{ value: 'SE', angle: 90, position: 'insideRight', offset: 12 }} tick={{ fontSize: 10 }} />
                                    <Tooltip formatter={(v: any, name: string) => [v?.toFixed(3), name]} labelFormatter={l => `θ = ${l}`} />
                                    <Area yAxisId="info" type="monotone" dataKey="info" fill="#c7d2fe" stroke="#6366f1" strokeWidth={2} name="I(θ)" fillOpacity={0.6} />
                                    <Line yAxisId="se" type="monotone" dataKey="se" stroke="#f59e0b" strokeWidth={2} dot={false} name="SE(θ)" />
                                    <Legend verticalAlign="top" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </Navbar_admin>
    );
}


