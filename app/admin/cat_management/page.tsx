'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar_admin from "@/components/Navbar_admin";
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Line, ReferenceLine, AreaChart, Area, Legend, ComposedChart,
} from 'recharts';
import {
    Search, Eye, X, ChevronLeft, ChevronRight, TrendingUp,
    Database, LayoutGrid, List, ArrowUpDown,
    SlidersHorizontal, CheckCircle2, AlertCircle, Save, ChevronDown,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from "@/contexts/AuthContext";

// ======================== TYPES ========================
interface AnswerOption { option_id: number; option_text: string; is_correct: boolean; }
interface ItemBank { item_bank_id: number; bank_name: string; description: string; }
interface ItemWithIRT {
    item_id: number; question_text: string; question_type: string;
    irt_a_discrimination: number | null;
    irt_b_difficulty: number | null;
    irt_c_guessing: number | null;
    irt_calibrated: boolean;
    explanation: string; status: string; display_order: number;
    item_bank: ItemBank; answer_options: AnswerOption[];
    situation?: { situation_id: number; situation_text: string; situation_image_url: string };
}
interface TIFPoint { theta: number; info: number; se: number; }

// ======================== CONSTANTS ========================
const API = `${process.env.NEXT_PUBLIC_API_URL}`;
const THETA_RANGE = Array.from({ length: 81 }, (_, i) => +(-4 + i * 0.1).toFixed(2));

const PRESETS = [
    { label: 'ง่ายมาก', b: -2.0, c: 0.20, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    { label: 'ง่าย',    b: -1.0, c: 0.20, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    { label: 'ปานกลาง', b:  0.0, c: 0.20, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    { label: 'ยาก',     b:  1.0, c: 0.20, color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
    { label: 'ยากมาก',  b:  2.0, c: 0.20, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
];

// ======================== HELPERS ========================
function irt3PL(theta: number, a: number, b: number, c: number) {
    return c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
}
function stripHTML(html: string) {
    if (typeof document === 'undefined') return html || '';
    const d = document.createElement('div');
    d.innerHTML = html || '';
    return d.textContent || d.innerText || '';
}
function diffLabel(b: number | null): { label: string; color: string } {
    if (b === null) return { label: 'ยังไม่ระบุ', color: '#9ca3af' };
    if (b <= -1.5) return { label: 'ง่ายมาก', color: '#059669' };
    if (b <= -0.5) return { label: 'ง่าย',    color: '#2563eb' };
    if (b <=  0.5) return { label: 'ปานกลาง', color: '#d97706' };
    if (b <=  1.5) return { label: 'ยาก',     color: '#ea580c' };
    return               { label: 'ยากมาก',   color: '#dc2626' };
}

// ======================== ICC CHART ========================
function ICCChart({ a, b, c }: { a: number; b: number; c: number }) {
    const data = THETA_RANGE.map(t => ({
        theta: t,
        prob: +irt3PL(t, Math.max(0.1, a), b, Math.min(0.99, Math.max(0.01, c))).toFixed(4),
    }));
    return (
        <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={data} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="theta" tick={{ fontSize: 10, fill: '#9ca3af' }}
                    tickFormatter={v => Number(v) % 2 === 0 ? String(v) : ''} />
                <YAxis domain={[0, 1]} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                <Tooltip
                    formatter={(v: any) => [v?.toFixed(3), 'P(θ)']}
                    labelFormatter={l => `θ = ${l}`}
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                />
                <ReferenceLine x={b} stroke="#d97706" strokeDasharray="4 3" strokeWidth={1.5} />
                <Area type="monotone" dataKey="prob" stroke="#6366f1" strokeWidth={2}
                    fill="#6366f1" fillOpacity={0.08} dot={false} />
            </AreaChart>
        </ResponsiveContainer>
    );
}

// ======================== SLIDER COMPONENT ========================
function SliderField({
    label, sublabel, value, min, max, step, unit,
    color, onChange, format,
}: {
    label: string; sublabel: string;
    value: number; min: number; max: number; step: number;
    unit?: string; color: string;
    onChange: (v: number) => void;
    format?: (v: number) => string;
}) {
    const pct = ((value - min) / (max - min)) * 100;
    const fmt = format ?? ((v: number) => v.toFixed(step < 0.1 ? 2 : 1));
    return (
        <div>
            <div className="flex items-center justify-between mb-3">
                <div>
                    <span className="text-sm font-medium text-gray-800">{label}</span>
                    <span className="ml-2 text-xs text-gray-400">{sublabel}</span>
                </div>
                <input
                    type="number" step={step} value={value}
                    onChange={e => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
                    }}
                    className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-mono font-semibold focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ color, '--tw-ring-color': color + '40' } as any}
                />
            </div>
            <div className="relative h-5 flex items-center">
                <div className="absolute inset-x-0 h-1.5 rounded-full bg-gray-100" />
                <div className="absolute h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
                <input
                    type="range" min={min} max={max} step={step} value={value}
                    onChange={e => onChange(parseFloat(e.target.value))}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    style={{ zIndex: 10 }}
                />
                <div
                    className="absolute w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
                    style={{ left: `calc(${pct}% - 8px)`, background: color }}
                />
            </div>
            <div className="flex justify-between text-[10px] text-gray-400 mt-1.5">
                <span>{fmt(min)}</span>
                <span>{fmt((min + max) / 2)}</span>
                <span>{fmt(max)}</span>
            </div>
        </div>
    );
}

// ======================== MAIN PAGE ========================
export default function CATManagement() {
    const { getToken } = useAuth();
    const authHeaders = useCallback(() => ({
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
    }), [getToken]);

    // Data
    const [allBanks, setAllBanks] = useState<ItemBank[]>([]);
    const [allItems, setAllItems] = useState<ItemWithIRT[]>([]);
    const [loading, setLoading] = useState(true);

    // UI state
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
    const [checkedIds, setCheckedIds] = useState<Set<number>>(new Set());
    const checkedIdsRef = useRef<Set<number>>(new Set()); // always holds latest checkedIds for async handlers

    // Keep ref in sync with state
    useEffect(() => { checkedIdsRef.current = checkedIds; }, [checkedIds]);

    const [searchTerm, setSearchTerm] = useState('');
    const [catFilter, setCatFilter] = useState<'all' | 'set' | 'unset'>('all');
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [currentPage, setCurrentPage] = useState(1);

    // Edit modal
    const [editItem, setEditItem] = useState<ItemWithIRT | null>(null);
    const [editIRT, setEditIRT] = useState({ a: 1.0, b: 0.0, c: 0.20 });
    const [showEditModal, setShowEditModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Bulk modal
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [bulkIRT, setBulkIRT] = useState({ b: 0.0, c: 0.20 });

    // TIF modal
    const [showTIF, setShowTIF] = useState(false);
    const [tifData, setTifData] = useState<TIFPoint[] | null>(null);
    const [tifBankName, setTifBankName] = useState('');

    const fetchBanks = useCallback(async () => {
        try {
            const r = await fetch(`${API}/items-bank`, { headers: authHeaders() });
            if (r.ok) setAllBanks(await r.json());
        } catch { /* silent */ }
    }, [authHeaders]);

    const fetchItems = useCallback(async () => {
        try {
            setLoading(true);
            const r = await fetch(`${API}/items-bank/cat/all-items`, { headers: authHeaders() });
            if (!r.ok) throw new Error();
            setAllItems(await r.json());
        } catch { Swal.fire('ข้อผิดพลาด', 'โหลดข้อมูลไม่ได้', 'error'); }
        finally { setLoading(false); }
    }, [authHeaders]);

    useEffect(() => {
        const saved = localStorage.getItem('cat_viewmode') as 'table' | 'card';
        if (saved) setViewMode(saved);
        fetchBanks();
        fetchItems();
    }, [fetchBanks, fetchItems]);

    // Derived
    const bankItems = selectedBankId
        ? allItems.filter(i => i.item_bank?.item_bank_id === selectedBankId)
        : allItems;
    const calibratedCount = bankItems.filter(i => i.irt_calibrated).length;
    const uncalibratedCount = bankItems.length - calibratedCount;
    const isReady = calibratedCount >= 20;

    const bankList = allBanks.length > 0 ? allBanks
        : Array.from(new Map(allItems.filter(i => i.item_bank).map(i => [i.item_bank.item_bank_id, i.item_bank])).values());

    const filtered = bankItems.filter(item => {
        const text = stripHTML(item.question_text).toLowerCase();
        const q = searchTerm.toLowerCase();
        if (q && !text.includes(q) && !(item.item_bank?.bank_name || '').toLowerCase().includes(q)) return false;
        if (catFilter === 'set' && !item.irt_calibrated) return false;
        if (catFilter === 'unset' && item.irt_calibrated) return false;
        return true;
    }).sort((a, b) => (sortOrder === 'desc' ? b.item_id - a.item_id : a.item_id - b.item_id));

    const perPage = viewMode === 'card' ? 9 : 10;
    const totalPages = Math.ceil(filtered.length / perPage);
    const currentItems = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);
    const allPageChecked = currentItems.length > 0 && currentItems.every(i => checkedIds.has(i.item_id));

    // Checkbox
    function toggleCheck(id: number) {
        setCheckedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
    }
    function toggleCheckAll() {
        const ids = currentItems.map(i => i.item_id);
        const allOn = ids.every(id => checkedIds.has(id));
        setCheckedIds(prev => { const n = new Set(prev); ids.forEach(id => allOn ? n.delete(id) : n.add(id)); return n; });
    }

    // Save single
    async function handleSaveSingle() {
        if (!editItem) return;
        const { a, b, c } = editIRT;
        if (a <= 0 || a > 3 || b < -4 || b > 4 || c <= 0 || c >= 1)
            return Swal.fire('ค่าไม่ถูกต้อง', 'a: 0.1–3.0  |  b: -4.0 ถึง +4.0  |  c: 0.01–0.99', 'warning');
        try {
            setIsSaving(true);
            const r = await fetch(`${API}/items-bank/cat/batch-update-irt`, {
                method: 'PATCH', headers: authHeaders(),
                body: JSON.stringify({ updates: [{ item_id: editItem.item_id, irt_a_discrimination: a, irt_b_difficulty: b, irt_c_guessing: c }] }),
            });
            if (!r.ok) throw new Error();
            await Swal.fire({ title: 'บันทึกสำเร็จ', icon: 'success', timer: 1200, showConfirmButton: false });
            setShowEditModal(false);
            fetchItems();
        } catch { Swal.fire('ข้อผิดพลาด', 'บันทึกไม่สำเร็จ', 'error'); }
        finally { setIsSaving(false); }
    }

    // Save bulk — ใช้ ref เพื่อไม่ติด stale closure
    async function handleBulkSave(bVal?: number, cVal?: number) {
        const ids = Array.from(checkedIdsRef.current);  // ← ref แทน state
        if (!ids.length) return;
        const b = bVal ?? bulkIRT.b;
        const c = cVal ?? bulkIRT.c;
        const preset = PRESETS.find(p => Math.abs(p.b - b) < 0.01);
        const ok = await Swal.fire({
            title: `ตั้งค่า IRT — ${ids.length} ข้อ`,
            html: `<div style="text-align:left;font-size:14px;line-height:1.8">
                <b>${preset ? preset.label : 'กำหนดเอง'}</b><br>
                ความยาก b = <b>${b > 0 ? '+' : ''}${b.toFixed(2)}</b>&nbsp;&nbsp;
                การเดา c = <b>${c.toFixed(2)}</b>
            </div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'ยืนยัน',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#16a34a',
        });
        if (!ok.isConfirmed) return;
        try {
            setIsSaving(true);
            const updates = ids.map(id => ({
                item_id: id,
                irt_a_discrimination: allItems.find(i => i.item_id === id)?.irt_a_discrimination ?? 1.0,
                irt_b_difficulty: b,
                irt_c_guessing: c,
            }));
            const r = await fetch(`${API}/items-bank/cat/batch-update-irt`, {
                method: 'PATCH', headers: authHeaders(),
                body: JSON.stringify({ updates }),
            });
            if (!r.ok) throw new Error();
            await Swal.fire({ title: `อัปเดต ${ids.length} ข้อสำเร็จ`, icon: 'success', timer: 1500, showConfirmButton: false });
            setShowBulkModal(false);
            setCheckedIds(new Set());
            fetchItems();
        } catch { Swal.fire('ข้อผิดพลาด', 'บันทึกไม่สำเร็จ', 'error'); }
        finally { setIsSaving(false); }
    }

    async function fetchTIF(bankId: number, bankName: string) {
        try {
            const r = await fetch(`${API}/cat/admin/bank/${bankId}/tif`, { headers: authHeaders() });
            if (!r.ok) throw new Error();
            const data = await r.json();
            setTifData(data.tif);
            setTifBankName(bankName);
            setShowTIF(true);
        } catch { Swal.fire('ข้อผิดพลาด', 'โหลด TIF ไม่ได้', 'error'); }
    }

    function openEdit(item: ItemWithIRT) {
        setEditItem(item);
        setEditIRT({
            a: (item.irt_a_discrimination && item.irt_a_discrimination > 0) ? item.irt_a_discrimination : 1.0,
            b: item.irt_b_difficulty ?? 0.0,
            c: item.irt_c_guessing ?? 0.20,
        });
        setShowEditModal(true);
    }

    return (
        <Navbar_admin>
            <div className="max-w-7xl mx-auto px-4 py-6" suppressHydrationWarning>

                {/* ── Page Header ── */}
                <div className="mb-6">
                    <h1 className="text-2xl font-semibold text-gray-900">CAT Management</h1>
                    <p className="text-sm text-gray-500 mt-0.5">ตั้งค่าพารามิเตอร์ IRT สำหรับ Computerized Adaptive Testing</p>
                </div>

                {/* ── Bank Selector Card ── */}
                <div className="bg-white border border-gray-200 rounded-2xl mb-5 overflow-hidden">
                    {/* selector row */}
                    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                        <div className="flex-1 relative">
                            <label className="block text-xs font-medium text-gray-500 mb-1.5">คลังข้อสอบ</label>
                            <div className="relative">
                                <select
                                    value={selectedBankId ?? ''}
                                    onChange={e => { setSelectedBankId(e.target.value ? +e.target.value : null); setCurrentPage(1); setCheckedIds(new Set()); }}
                                    className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                >
                                    <option value="">ทุกคลังข้อสอบ</option>
                                    {bankList.map(b => (
                                        <option key={b.item_bank_id} value={b.item_bank_id}>{b.bank_name}</option>
                                    ))}
                                </select>
                                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        {/* Stats inline */}
                        <div className="flex gap-4 sm:gap-6 shrink-0 pt-1 sm:pt-5">
                            <div className="text-center">
                                <p className="text-xl font-bold text-gray-900">{bankItems.length}</p>
                                <p className="text-[11px] text-gray-400">ทั้งหมด</p>
                            </div>
                            <div className="w-px bg-gray-100" />
                            <div className="text-center">
                                <p className="text-xl font-bold text-green-600">{calibratedCount}</p>
                                <p className="text-[11px] text-gray-400">ระบุ IRT แล้ว</p>
                            </div>
                            <div className="w-px bg-gray-100" />
                            <div className="text-center">
                                <p className="text-xl font-bold text-amber-500">{uncalibratedCount}</p>
                                <p className="text-[11px] text-gray-400">ยังไม่ระบุ</p>
                            </div>
                            <div className="w-px bg-gray-100" />
                            <div className="text-center">
                                {isReady
                                    ? <p className="text-[11px] font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-lg mt-0.5">พร้อมสอบ CAT</p>
                                    : <p className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg mt-0.5">ต้องการ {Math.max(0, 20 - calibratedCount)} ข้ออีก</p>}
                                <p className="text-[10px] text-gray-400 mt-0.5">สถานะ CAT</p>
                            </div>
                        </div>

                        {selectedBankId && (
                            <button
                                onClick={() => fetchTIF(selectedBankId, bankList.find(b => b.item_bank_id === selectedBankId)?.bank_name || '')}
                                className="shrink-0 flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-100 rounded-xl transition-colors sm:mt-5"
                            >
                                <TrendingUp size={15} /> ดู TIF
                            </button>
                        )}
                    </div>
                </div>

                {/* ── Toolbar ── */}
                <div className="flex flex-col sm:flex-row gap-3 mb-3 items-start sm:items-center justify-between">
                    <div className="flex flex-wrap gap-2 items-center flex-1">
                        {/* Search */}
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text" placeholder="ค้นหาข้อสอบ..." value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="pl-8 pr-4 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-green-500 w-52"
                            />
                        </div>

                        {/* Filter tabs */}
                        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 text-xs">
                            {[
                                { k: 'all',   l: `ทั้งหมด`, n: bankItems.length },
                                { k: 'set',   l: `ระบุแล้ว`, n: calibratedCount },
                                { k: 'unset', l: `ยังไม่ระบุ`, n: uncalibratedCount },
                            ].map(f => (
                                <button key={f.k}
                                    onClick={() => { setCatFilter(f.k as any); setCurrentPage(1); }}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-all ${catFilter === f.k ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {f.l}
                                    <span className={`text-[10px] px-1 py-0.5 rounded ${catFilter === f.k ? 'bg-gray-100 text-gray-600' : 'bg-gray-200/60 text-gray-500'}`}>{f.n}</span>
                                </button>
                            ))}
                        </div>

                        {/* Sort */}
                        <button onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
                            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 text-xs font-medium transition-colors">
                            <ArrowUpDown size={12} />
                            {sortOrder === 'desc' ? 'ใหม่ → เก่า' : 'เก่า → ใหม่'}
                        </button>
                    </div>

                    {/* View toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 shrink-0">
                        {(['table', 'card'] as const).map(m => (
                            <button key={m} onClick={() => { setViewMode(m); localStorage.setItem('cat_viewmode', m); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === m ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>
                                {m === 'table' ? <List size={13} /> : <LayoutGrid size={13} />}
                                {m === 'table' ? 'ตาราง' : 'การ์ด'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Bulk Action Bar (always visible, highlights when items selected) ── */}
                <div className={`rounded-xl mb-4 transition-all ${checkedIds.size > 0
                    ? 'bg-blue-50 border border-blue-200 p-3'
                    : 'bg-gray-50 border border-gray-200 p-2.5'}`}>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Select controls */}
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 cursor-pointer transition-colors select-none">
                                <input
                                    type="checkbox"
                                    checked={allPageChecked}
                                    onChange={toggleCheckAll}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600"
                                />
                                เลือกหน้านี้
                            </label>
                            {filtered.length > perPage && (
                                <>
                                    <span className="text-gray-300 text-xs">|</span>
                                    <button onClick={() => setCheckedIds(new Set(filtered.map(i => i.item_id)))}
                                        className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                                        เลือกทั้งหมด ({filtered.length})
                                    </button>
                                </>
                            )}
                            {checkedIds.size > 0 && (
                                <>
                                    <span className="text-gray-300 text-xs">|</span>
                                    <button onClick={() => setCheckedIds(new Set())}
                                        className="text-xs text-gray-400 hover:text-gray-600 font-medium">
                                        ล้าง
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Selected count badge */}
                        {checkedIds.size > 0 && (
                            <span className="text-xs font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                                {checkedIds.size} ข้อที่เลือก
                            </span>
                        )}

                        {/* Preset quick-set (only when selected) */}
                        {checkedIds.size > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap ml-1">
                                <span className="text-xs text-gray-500 font-medium">ตั้งค่าทันที:</span>
                                {PRESETS.map(p => (
                                    <button key={p.label}
                                        onClick={() => handleBulkSave(p.b, p.c)}
                                        disabled={isSaving}
                                        className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-all hover:opacity-90 disabled:opacity-40"
                                        style={{ backgroundColor: p.bg, borderColor: p.border, color: p.color }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                                        {p.label}
                                    </button>
                                ))}
                                <button onClick={() => setShowBulkModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-800 hover:bg-gray-900 text-white text-xs font-medium rounded-lg transition-colors">
                                    <SlidersHorizontal size={12} /> กำหนดเอง
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Content ── */}
                {loading ? (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        {[1,2,3,4,5].map(i => (
                            <div key={i} className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 animate-pulse">
                                <div className="w-4 h-4 bg-gray-200 rounded" />
                                <div className="w-10 h-3 bg-gray-200 rounded" />
                                <div className="w-24 h-5 bg-gray-200 rounded-full" />
                                <div className="flex-1 h-3 bg-gray-200 rounded" />
                                <div className="w-12 h-4 bg-gray-200 rounded" />
                                <div className="w-12 h-4 bg-gray-200 rounded" />
                                <div className="w-16 h-5 bg-gray-200 rounded-full" />
                                <div className="w-7 h-7 bg-gray-200 rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : viewMode === 'table' ? (

                    /* ── TABLE VIEW ── */
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="pl-4 pr-2 py-3 w-10">
                                            <input
                                                type="checkbox"
                                                checked={allPageChecked}
                                                onChange={toggleCheckAll}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer accent-blue-600"
                                            />
                                        </th>
                                        {['#', 'คลังข้อสอบ', 'คำถาม', 'ความยาก b', 'การเดา c', 'ระดับ', ''].map((h, i) => (
                                            <th key={i} className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide ${i === 0 ? 'w-12' : ''}`}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="py-20 text-center">
                                                <Database size={36} className="mx-auto mb-3 text-gray-200" />
                                                <p className="text-sm text-gray-400">
                                                    {searchTerm ? 'ไม่พบข้อสอบที่ตรงกับเงื่อนไข' : 'ยังไม่มีข้อสอบ'}
                                                </p>
                                            </td>
                                        </tr>
                                    ) : currentItems.map(item => {
                                        const checked = checkedIds.has(item.item_id);
                                        const { label, color } = diffLabel(item.irt_b_difficulty);
                                        return (
                                            <tr key={item.item_id}
                                                className={`transition-colors ${checked ? 'bg-blue-50/50' : 'hover:bg-gray-50/60'}`}>
                                                <td className="pl-4 pr-2 py-3.5">
                                                    <input
                                                        type="checkbox"
                                                        checked={checked}
                                                        onChange={() => toggleCheck(item.item_id)}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer accent-blue-600"
                                                    />
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-gray-400 font-mono">{item.item_id}</td>
                                                <td className="px-4 py-3.5">
                                                    <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-md whitespace-nowrap">
                                                        {item.item_bank?.bank_name || '—'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 max-w-xs">
                                                    <p className="text-sm text-gray-700 line-clamp-1">
                                                        {stripHTML(item.question_text)}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    {item.irt_b_difficulty !== null
                                                        ? <span className="text-sm font-semibold font-mono" style={{ color: '#7c3aed' }}>
                                                            {item.irt_b_difficulty > 0 ? '+' : ''}{item.irt_b_difficulty.toFixed(2)}
                                                        </span>
                                                        : <span className="text-xs text-gray-300">—</span>}
                                                </td>
                                                <td className="px-4 py-3.5 text-center">
                                                    {item.irt_c_guessing !== null
                                                        ? <span className="text-sm font-semibold font-mono" style={{ color: '#be185d' }}>
                                                            {item.irt_c_guessing.toFixed(2)}
                                                        </span>
                                                        : <span className="text-xs text-gray-300">—</span>}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="text-xs font-medium px-2 py-1 rounded-md"
                                                        style={{ color, backgroundColor: color + '18' }}>
                                                        {label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <button
                                                        onClick={() => openEdit(item)}
                                                        className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all"
                                                    >
                                                        <Eye size={15} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                ) : (

                    /* ── CARD VIEW ── */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentItems.length === 0 ? (
                            <div className="col-span-full py-20 text-center border-2 border-dashed border-gray-200 rounded-2xl">
                                <Database size={36} className="mx-auto mb-3 text-gray-200" />
                                <p className="text-sm text-gray-400">ไม่พบข้อสอบ</p>
                            </div>
                        ) : currentItems.map(item => {
                            const checked = checkedIds.has(item.item_id);
                            const { label, color } = diffLabel(item.irt_b_difficulty);
                            return (
                                <div key={item.item_id}
                                    className={`bg-white border rounded-2xl overflow-hidden shadow-sm transition-all hover:shadow-md ${checked ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200'}`}>
                                    <div className="p-5">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={checked}
                                                    onChange={() => toggleCheck(item.item_id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer accent-blue-600"
                                                />
                                                <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-md">
                                                    {item.item_bank?.bank_name || '—'}
                                                </span>
                                            </div>
                                            <button onClick={() => openEdit(item)}
                                                className="text-xs text-gray-400 hover:text-green-700 flex items-center gap-1 px-2 py-1 hover:bg-green-50 rounded-lg transition-all border border-gray-100">
                                                <Eye size={12} /> แก้ไข
                                            </button>
                                        </div>
                                        <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed mb-4">
                                            {stripHTML(item.question_text)}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-3">
                                                <div>
                                                    <p className="text-[10px] text-gray-400 mb-0.5">ความยาก b</p>
                                                    <p className="text-sm font-bold font-mono" style={{ color: '#7c3aed' }}>
                                                        {item.irt_b_difficulty !== null ? `${item.irt_b_difficulty > 0 ? '+' : ''}${item.irt_b_difficulty.toFixed(2)}` : '—'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] text-gray-400 mb-0.5">การเดา c</p>
                                                    <p className="text-sm font-bold font-mono" style={{ color: '#be185d' }}>
                                                        {item.irt_c_guessing !== null ? item.irt_c_guessing.toFixed(2) : '—'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-xs font-medium px-2 py-1 rounded-md"
                                                style={{ color, backgroundColor: color + '18' }}>
                                                {label}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Pagination ── */}
                {totalPages > 1 && (
                    <div className="flex justify-end items-center gap-1.5 mt-5">
                        <button disabled={currentPage === 1}
                            onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0 }); }}
                            className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 disabled:opacity-30 hover:bg-gray-50 bg-white text-sm">
                            <ChevronLeft size={15} />
                        </button>
                        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                            let p = currentPage <= 3 ? i + 1 : currentPage >= totalPages - 2 ? totalPages - 6 + i : currentPage - 3 + i;
                            p = Math.max(1, Math.min(totalPages, p));
                            return (
                                <button key={`${i}-${p}`} onClick={() => { setCurrentPage(p); window.scrollTo({ top: 0 }); }}
                                    className={`w-8 h-8 text-xs font-medium border rounded-lg transition-colors ${p === currentPage ? 'bg-green-600 text-white border-green-600' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}>
                                    {p}
                                </button>
                            );
                        })}
                        <button disabled={currentPage === totalPages}
                            onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0 }); }}
                            className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg text-gray-500 disabled:opacity-30 hover:bg-gray-50 bg-white">
                            <ChevronRight size={15} />
                        </button>
                    </div>
                )}
            </div>

            {/* ══════════════════════════════════════════
                MODAL — Single Item IRT Editor
            ══════════════════════════════════════════ */}
            {showEditModal && editItem && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                    style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}>
                    <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-xl max-h-[95vh] overflow-y-auto shadow-2xl flex flex-col">

                        {/* Header */}
                        <div className="sticky top-0 bg-white px-6 pt-6 pb-4 border-b border-gray-100 z-10">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900">แก้ไขพารามิเตอร์ IRT</h3>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        ข้อสอบ #{editItem.item_id} · {editItem.item_bank?.bank_name}
                                    </p>
                                </div>
                                <button onClick={() => setShowEditModal(false)}
                                    className="text-gray-300 hover:text-gray-500 p-1 hover:bg-gray-100 rounded-lg transition-all">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-6 flex-1">
                            {/* Question preview */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">คำถาม</p>
                                <div className="text-sm text-gray-700 leading-relaxed line-clamp-4"
                                    dangerouslySetInnerHTML={{ __html: editItem.question_text }} />
                            </div>

                            {/* Difficulty presets — horizontal pills */}
                            <div>
                                <p className="text-sm font-semibold text-gray-800 mb-2.5">ระดับความยากสำเร็จรูป</p>
                                <div className="flex gap-2 flex-wrap">
                                    {PRESETS.map(p => {
                                        const active = Math.abs(editIRT.b - p.b) < 0.01 && Math.abs(editIRT.c - p.c) < 0.01;
                                        return (
                                            <button key={p.label}
                                                onClick={() => setEditIRT(prev => ({ ...prev, b: p.b, c: p.c }))}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all"
                                                style={{
                                                    backgroundColor: active ? p.color : p.bg,
                                                    borderColor: active ? p.color : p.border,
                                                    color: active ? '#fff' : p.color,
                                                    boxShadow: active ? `0 0 0 3px ${p.color}22` : 'none',
                                                }}>
                                                <span className="w-1.5 h-1.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: active ? '#fff' : p.color }} />
                                                {p.label}
                                                <span className="opacity-70 font-mono text-[10px]">
                                                    b={p.b > 0 ? `+${p.b}` : p.b}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Sliders */}
                            <div className="space-y-5">
                                <p className="text-sm font-semibold text-gray-800">ปรับค่าพารามิเตอร์</p>
                                <SliderField
                                    label="ความยาก" sublabel="— b"
                                    value={editIRT.b} min={-4} max={4} step={0.1}
                                    color="#7c3aed"
                                    onChange={v => setEditIRT(p => ({ ...p, b: v }))}
                                    format={v => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
                                />
                                <SliderField
                                    label="อำนาจจำแนก" sublabel="— a"
                                    value={editIRT.a} min={0.1} max={3} step={0.1}
                                    color="#2563eb"
                                    onChange={v => setEditIRT(p => ({ ...p, a: v }))}
                                />
                                <SliderField
                                    label="การสุ่มเดา" sublabel="— c"
                                    value={editIRT.c} min={0.01} max={0.5} step={0.01}
                                    color="#be185d"
                                    onChange={v => setEditIRT(p => ({ ...p, c: v }))}
                                />
                            </div>

                            {/* ICC Curve */}
                            <div>
                                <div className="flex items-center justify-between mb-3">
                                    <p className="text-sm font-semibold text-gray-800">กราฟ ICC</p>
                                    <div className="flex gap-3 text-[11px]">
                                        <span style={{ color: '#7c3aed' }}>b = <b>{editIRT.b > 0 ? '+' : ''}{editIRT.b.toFixed(2)}</b></span>
                                        <span style={{ color: '#2563eb' }}>a = <b>{editIRT.a.toFixed(2)}</b></span>
                                        <span style={{ color: '#be185d' }}>c = <b>{editIRT.c.toFixed(2)}</b></span>
                                    </div>
                                </div>
                                <div className="bg-gray-50 rounded-xl border border-gray-100 px-3 pt-2 pb-1">
                                    <ICCChart a={editIRT.a} b={editIRT.b} c={editIRT.c} />
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3">
                            <button onClick={() => setShowEditModal(false)}
                                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
                                ยกเลิก
                            </button>
                            <button onClick={handleSaveSingle} disabled={isSaving}
                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors">
                                <Save size={14} />
                                {isSaving ? 'กำลังบันทึก...' : 'บันทึกค่า IRT'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════
                MODAL — Bulk IRT Setup
            ══════════════════════════════════════════ */}
            {showBulkModal && (
                <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
                    style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}>
                    <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl">
                        <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex justify-between items-start">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">ตั้งค่า IRT — {checkedIds.size} ข้อ</h3>
                                <p className="text-xs text-gray-400 mt-0.5">อัปเดตพร้อมกันทุกข้อที่เลือก</p>
                            </div>
                            <button onClick={() => setShowBulkModal(false)}
                                className="text-gray-300 hover:text-gray-500 p-1 hover:bg-gray-100 rounded-lg transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-6">
                            {/* Presets */}
                            <div>
                                <p className="text-sm font-semibold text-gray-800 mb-2.5">ระดับสำเร็จรูป</p>
                                <div className="flex gap-2 flex-wrap">
                                    {PRESETS.map(p => {
                                        const active = Math.abs(bulkIRT.b - p.b) < 0.01;
                                        return (
                                            <button key={p.label}
                                                onClick={() => setBulkIRT({ b: p.b, c: p.c })}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all"
                                                style={{
                                                    backgroundColor: active ? p.color : p.bg,
                                                    borderColor: active ? p.color : p.border,
                                                    color: active ? '#fff' : p.color,
                                                    boxShadow: active ? `0 0 0 3px ${p.color}22` : 'none',
                                                }}>
                                                <span className="w-1.5 h-1.5 rounded-full"
                                                    style={{ backgroundColor: active ? '#fff' : p.color }} />
                                                {p.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Sliders b & c */}
                            <div className="space-y-5">
                                <p className="text-sm font-semibold text-gray-800">ปรับค่าละเอียด</p>
                                <SliderField
                                    label="ความยาก" sublabel="— b"
                                    value={bulkIRT.b} min={-4} max={4} step={0.1}
                                    color="#7c3aed"
                                    onChange={v => setBulkIRT(p => ({ ...p, b: v }))}
                                    format={v => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
                                />
                                <SliderField
                                    label="การสุ่มเดา" sublabel="— c"
                                    value={bulkIRT.c} min={0.01} max={0.5} step={0.01}
                                    color="#be185d"
                                    onChange={v => setBulkIRT(p => ({ ...p, c: v }))}
                                />
                            </div>

                            {/* ICC preview */}
                            <div className="bg-gray-50 rounded-xl border border-gray-100 px-3 pt-3 pb-1">
                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">ตัวอย่าง ICC</p>
                                <ICCChart a={1.0} b={bulkIRT.b} c={bulkIRT.c} />
                            </div>
                        </div>

                        <div className="px-6 pb-6 flex gap-3 pt-2">
                            <button onClick={() => setShowBulkModal(false)}
                                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50">
                                ยกเลิก
                            </button>
                            <button onClick={() => handleBulkSave()} disabled={isSaving}
                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50">
                                <Save size={14} />
                                {isSaving ? 'กำลังบันทึก...' : `อัปเดต ${checkedIds.size} ข้อ`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════
                MODAL — TIF Chart
            ══════════════════════════════════════════ */}
            {showTIF && tifData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
                    style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}>
                    <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-base font-semibold text-gray-900">Test Information Function</h3>
                                <p className="text-xs text-gray-400 mt-0.5">{tifBankName}</p>
                            </div>
                            <button onClick={() => setShowTIF(false)}
                                className="text-gray-300 hover:text-gray-500 p-1 hover:bg-gray-100 rounded-lg">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-6">
                            <p className="text-xs text-gray-400 mb-4">กราฟแสดงความแม่นยำของ item bank ที่แต่ละระดับ θ — ยิ่งสูงยิ่งแม่นยำ</p>
                            <ResponsiveContainer width="100%" height={280}>
                                <ComposedChart data={tifData.filter((_, i) => i % 2 === 0)} margin={{ top: 8, right: 24, left: -8, bottom: 16 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                    <XAxis dataKey="theta" label={{ value: 'θ', position: 'insideBottom', offset: -8 }}
                                        tick={{ fontSize: 10 }} tickFormatter={v => Number(v) % 1 === 0 ? String(v) : ''} />
                                    <YAxis yAxisId="info" tick={{ fontSize: 10 }} />
                                    <YAxis yAxisId="se" orientation="right" tick={{ fontSize: 10 }} />
                                    <Tooltip formatter={(v: any, n: string) => [v?.toFixed(3), n]} labelFormatter={l => `θ = ${l}`} />
                                    <Area yAxisId="info" type="monotone" dataKey="info" fill="#c7d2fe"
                                        stroke="#6366f1" strokeWidth={2} name="I(θ)" fillOpacity={0.5} />
                                    <Line yAxisId="se" type="monotone" dataKey="se" stroke="#f59e0b"
                                        strokeWidth={2} dot={false} name="SE(θ)" />
                                    <Legend verticalAlign="top" iconSize={12} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </Navbar_admin>
    );
}
