'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Navbar_admin from "@/components/Navbar_admin";
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    ReferenceLine, AreaChart, Area,
} from 'recharts';
import {
    Search, Eye, X, ChevronLeft, ChevronRight, TrendingUp,
    LayoutGrid, List, ArrowUpDown,
    SlidersHorizontal, CheckCircle2, AlertCircle, Save, ChevronDown,
    BrainCircuit, ArrowRight, Download, Upload, Sparkles, FileSpreadsheet,
    RefreshCw, CheckSquare, Square, FileCheck, HelpCircle, Loader2,
    RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { useAuth } from "@/contexts/AuthContext";
import Pagination from "@/components/Pagination";

// ======================== TYPES ========================
interface AnswerOption { option_id: number; option_text: string; is_correct: boolean; }
interface ItemBank { item_bank_id: number; bank_name: string; description?: string; }
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

interface AutoCalibItem {
    item_id: number;
    question_text: string;
    item_bank_id: number;
    bank_name: string;
    attempts: number;
    correct_count: number;
    p_value: number;
    r_pb: number;
    current_a: number | null;
    current_b: number | null;
    current_c: number | null;
    estimated_a: number;
    estimated_b: number;
    estimated_c: number;
    data_quality: 'HIGH' | 'MEDIUM' | 'LOW' | 'NO_DATA';
}

interface ImportParsedRow {
    item_id: number;
    a: number;
    b: number;
    c: number;
    valid: boolean;
    error?: string;
    item_text?: string;
}

// ======================== CONSTANTS ========================
const API = `${process.env.NEXT_PUBLIC_API_URL}`;
const THETA_RANGE = Array.from({ length: 81 }, (_, i) => +(-4 + i * 0.1).toFixed(2));

const PRESETS = [
    { label: 'ง่ายมาก', b: -2.0, c: 0.20, color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
    { label: 'ง่าย', b: -1.0, c: 0.20, color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
    { label: 'ปานกลาง', b: 0.0, c: 0.20, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
    { label: 'ยาก', b: 1.0, c: 0.20, color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
    { label: 'ยากมาก', b: 2.0, c: 0.20, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
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
    if (b <= -0.5) return { label: 'ง่าย', color: '#2563eb' };
    if (b <= 0.5) return { label: 'ปานกลาง', color: '#d97706' };
    if (b <= 1.5) return { label: 'ยาก', color: '#ea580c' };
    return { label: 'ยากมาก', color: '#dc2626' };
}

function getDifficultyCategory(b: number | null, calibrated: boolean): string {
    if (!calibrated || b === null) return 'unspecified';
    if (b <= -1.5) return 'very_easy';
    if (b <= -0.5) return 'easy';
    if (b <= 0.5) return 'medium';
    if (b <= 1.5) return 'hard';
    return 'very_hard';
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
                    <span className="ml-2 text-sm text-gray-400">{sublabel}</span>
                </div>
                <input
                    type="number" step={step} value={value}
                    onChange={e => {
                        const v = parseFloat(e.target.value);
                        if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
                    }}
                    className="w-20 text-center border border-gray-200 rounded-lg px-2 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:border-transparent"
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
            <div className="flex justify-between text-sm text-gray-400 mt-1.5">
                <span>{fmt(min)}</span>
                <span>{fmt((min + max) / 2)}</span>
                <span>{fmt(max)}</span>
            </div>
        </div>
    );
}

// ======================== MAIN PAGE ========================
export default function IRTManagementPage() {
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
    const checkedIdsRef = useRef<Set<number>>(new Set());

    useEffect(() => { checkedIdsRef.current = checkedIds; }, [checkedIds]);

    const [searchTerm, setSearchTerm] = useState('');
    const [catFilter, setCatFilter] = useState<'all' | 'set' | 'unset'>('all');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
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

    // Response Matrix Export state
    const [isExporting, setIsExporting] = useState(false);

    // Auto-calibration modal state
    const [showAutoCalibModal, setShowAutoCalibModal] = useState(false);
    const [autoCalibLoading, setAutoCalibLoading] = useState(false);
    const [autoCalibData, setAutoCalibData] = useState<{ total_sessions: number; total_items: number; items: AutoCalibItem[] } | null>(null);
    const [autoCalibSelected, setAutoCalibSelected] = useState<Set<number>>(new Set());
    const [autoCalibQualityFilter, setAutoCalibQualityFilter] = useState<'all' | 'high_med' | 'high'>('all');

    // Import Calibrated CSV modal state
    const [showImportModal, setShowImportModal] = useState(false);
    const [importParsedItems, setImportParsedItems] = useState<ImportParsedRow[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const importFileInputRef = useRef<HTMLInputElement | null>(null);

    // Action Dropdown Menu state
    const [showActionMenu, setShowActionMenu] = useState(false);
    const actionMenuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (actionMenuRef.current && !actionMenuRef.current.contains(event.target as Node)) {
                setShowActionMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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

    const difficultyCounts = {
        all: bankItems.length,
        very_easy: bankItems.filter(i => i.irt_calibrated && i.irt_b_difficulty !== null && i.irt_b_difficulty <= -1.5).length,
        easy: bankItems.filter(i => i.irt_calibrated && i.irt_b_difficulty !== null && i.irt_b_difficulty > -1.5 && i.irt_b_difficulty <= -0.5).length,
        medium: bankItems.filter(i => i.irt_calibrated && i.irt_b_difficulty !== null && i.irt_b_difficulty > -0.5 && i.irt_b_difficulty <= 0.5).length,
        hard: bankItems.filter(i => i.irt_calibrated && i.irt_b_difficulty !== null && i.irt_b_difficulty > 0.5 && i.irt_b_difficulty <= 1.5).length,
        very_hard: bankItems.filter(i => i.irt_calibrated && i.irt_b_difficulty !== null && i.irt_b_difficulty > 1.5).length,
    };

    const bankList = allBanks.length > 0 ? allBanks
        : Array.from(new Map(allItems.filter(i => i.item_bank).map(i => [i.item_bank.item_bank_id, i.item_bank])).values());

    const filtered = bankItems.filter(item => {
        const text = stripHTML(item.question_text).toLowerCase();
        const q = searchTerm.toLowerCase();
        if (q && !text.includes(q) && !(item.item_bank?.bank_name || '').toLowerCase().includes(q)) return false;
        if (catFilter === 'set' && !item.irt_calibrated) return false;
        if (catFilter === 'unset' && item.irt_calibrated) return false;
        if (difficultyFilter !== 'all') {
            const diffCat = getDifficultyCategory(item.irt_b_difficulty, item.irt_calibrated);
            if (diffCat !== difficultyFilter) return false;
        }
        return true;
    }).sort((a, b) => (sortOrder === 'desc' ? b.item_id - a.item_id : a.item_id - b.item_id));

    const perPage = viewMode === 'card' ? 9 : 10;
    const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));

    // Reset to page 1 on filter/search change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedBankId, catFilter, difficultyFilter, sortOrder, viewMode]);

    // Keep currentPage within valid bounds
    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [totalPages, currentPage]);

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

    // Reset single item IRT to null
    async function handleResetSingleToNull(targetItem?: ItemWithIRT) {
        const itemToReset = targetItem || editItem;
        if (!itemToReset) return;
        const ok = await Swal.fire({
            title: 'ยืนยันการล้างค่า IRT',
            html: `<p class="text-sm text-gray-600">ต้องการล้างค่าพารามิเตอร์ IRT ของข้อ <b>#${itemToReset.item_id}</b> ให้กลับเป็นค่าว่าง เหมือนเดิมหรือไม่?</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ใช่, ล้างค่า',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#6b7280',
            reverseButtons: true,
        });
        if (!ok.isConfirmed) return;
        try {
            setIsSaving(true);
            const r = await fetch(`${API}/items-bank/cat/batch-update-irt`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({
                    updates: [{
                        item_id: itemToReset.item_id,
                        irt_a_discrimination: null,
                        irt_b_difficulty: null,
                        irt_c_guessing: null,
                    }]
                }),
            });
            if (!r.ok) throw new Error();
            await Swal.fire({ title: 'ล้างค่า IRT เรียบร้อย', icon: 'success', timer: 1200, showConfirmButton: false });
            setShowEditModal(false);
            fetchItems();
        } catch {
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถล้างค่าได้', 'error');
        } finally {
            setIsSaving(false);
        }
    }

    // Reset bulk items IRT to null
    async function handleBulkResetToNull() {
        const ids = Array.from(checkedIdsRef.current);
        if (!ids.length) return;
        const ok = await Swal.fire({
            title: `ล้างค่า IRT — ${ids.length} ข้อ`,
            html: `<div class="text-left text-sm text-gray-600 space-y-2">
                <p>ต้องการล้างค่าพารามิเตอร์ IRT ของข้อสอบที่เลือกทั้ง <b>${ids.length} ข้อ</b> ให้กลับเป็นค่าว่าง หรือไม่?</p>
                <div class="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800 text-sm">
                    ข้อสอบเหล่านี้จะถูกเปลี่ยนสถานะเป็น "ยังไม่ระบุค่า IRT" และจะไม่ถูกนำไปใช้ใน Adaptive Test จนกว่าจะระบุค่าใหม่
                </div>
            </div>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'ใช่, ล้างค่าทั้งหมด',
            cancelButtonText: 'ยกเลิก',
            confirmButtonColor: '#e11d48',
            cancelButtonColor: '#6b7280',
            reverseButtons: true,
        });
        if (!ok.isConfirmed) return;
        try {
            setIsSaving(true);
            const updates = ids.map(id => ({
                item_id: id,
                irt_a_discrimination: null,
                irt_b_difficulty: null,
                irt_c_guessing: null,
            }));
            const r = await fetch(`${API}/items-bank/cat/batch-update-irt`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ updates }),
            });
            if (!r.ok) throw new Error();
            await Swal.fire({ title: `ล้างค่า IRT ${ids.length} ข้อสำเร็จ`, icon: 'success', timer: 1500, showConfirmButton: false });
            setShowBulkModal(false);
            setCheckedIds(new Set());
            fetchItems();
        } catch {
            Swal.fire('ข้อผิดพลาด', 'ไม่สามารถล้างค่าได้', 'error');
        } finally {
            setIsSaving(false);
        }
    }

    // Save bulk
    async function handleBulkSave(bVal?: number, cVal?: number) {
        const ids = Array.from(checkedIdsRef.current);
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

    // Export Response Matrix CSV
    async function handleExportResponseMatrix() {
        try {
            setIsExporting(true);
            const url = `${API}/items-bank/cat/export-response-matrix${selectedBankId ? `?item_bank_id=${selectedBankId}` : ''}`;
            const r = await fetch(url, { headers: authHeaders() });
            if (!r.ok) {
                const errData = await r.json().catch(() => ({}));
                throw new Error(errData.message || `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (HTTP ${r.status})`);
            }
            const data = await r.json();
            if (!data.csv) throw new Error('ไม่พบข้อมูล CSV');

            const blob = new Blob(["\uFEFF" + data.csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const bankName = selectedBankId
                ? (bankList.find(b => b.item_bank_id === selectedBankId)?.bank_name || `bank_${selectedBankId}`)
                : 'all_banks';
            const cleanName = bankName.replace(/[^a-zA-Z0-9_\u0E00-\u0E7F]/g, '_');
            const filename = `response_matrix_${cleanName}_${new Date().toISOString().slice(0, 10)}.csv`;

            const downloadUrl = URL.createObjectURL(blob);
            link.href = downloadUrl;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);

            Swal.fire({
                title: 'ส่งออกสำเร็จ',
                html: `ดาวน์โหลดไฟล์ <b>${filename}</b> เรียบร้อยแล้ว<br/><span class="text-sm text-gray-500">จำนวน ${data.total_sessions} sessions (${data.total_items} ข้อ)</span>`,
                icon: 'success',
                timer: 2200,
                showConfirmButton: false
            });
        } catch (err: any) {
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                html: `ไม่สามารถส่งออก CSV ได้<br/><span class="text-sm text-red-500  mt-1 block">${err.message || 'Network error'}</span>`,
                icon: 'error'
            });
        } finally {
            setIsExporting(false);
        }
    }

    // Open Auto-Calibration Modal
    async function handleOpenAutoCalib() {
        setShowAutoCalibModal(true);
        setAutoCalibLoading(true);
        try {
            const url = `${API}/items-bank/cat/auto-calibration-stats${selectedBankId ? `?item_bank_id=${selectedBankId}` : ''}`;
            const r = await fetch(url, { headers: authHeaders() });
            if (!r.ok) {
                const errData = await r.json().catch(() => ({}));
                throw new Error(errData.message || `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (HTTP ${r.status} ${r.statusText})`);
            }
            const data = await r.json();
            setAutoCalibData(data);
            const selectable = new Set<number>((data.items || []).filter((i: AutoCalibItem) => i.attempts > 0).map((i: AutoCalibItem) => i.item_id));
            setAutoCalibSelected(selectable);
        } catch (err: any) {
            Swal.fire({
                title: 'ข้อผิดพลาด',
                html: `ไม่สามารถดึงข้อมูลสถิติการสอบได้<br/><span class="text-sm text-red-500  mt-1 block">${err.message || 'Network error'}</span>`,
                icon: 'error'
            });
        } finally {
            setAutoCalibLoading(false);
        }
    }

    // Apply Auto Calibration
    async function handleApplyAutoCalib(applyAll: boolean) {
        if (!autoCalibData || !autoCalibData.items) return;
        const targets = applyAll
            ? autoCalibData.items.filter(i => i.attempts > 0)
            : autoCalibData.items.filter(i => autoCalibSelected.has(i.item_id));

        if (!targets.length) {
            return Swal.fire('ยังไม่ได้เลือกข้อสอบ', 'กรุณาเลือกข้อสอบที่มีประวัติการทำเพื่อปรับค่า IRT', 'warning');
        }

        const ok = await Swal.fire({
            title: `บันทึกค่า IRT ${targets.length} ข้อ?`,
            html: `<div style="text-align:left;font-size:13px;line-height:1.8">
                <p>ระบบจะอัปเดตค่าพารามิเตอร์ <b>a, b, c</b> ตามสถิติผลสอบจริง (CTT Approximation)</p>
                <span style="color:#d97706;font-size:12px">⚠️ ข้อสอบที่มีจำนวนครั้งการทำน้อย อาจมีค่าประมาณการที่คลาดเคลื่อน</span>
            </div>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#059669',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ยืนยันบันทึก',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
        });

        if (!ok.isConfirmed) return;

        try {
            setIsSaving(true);
            const updates = targets.map(t => ({
                item_id: t.item_id,
                irt_a_discrimination: t.estimated_a,
                irt_b_difficulty: t.estimated_b,
                irt_c_guessing: t.estimated_c,
            }));

            const r = await fetch(`${API}/items-bank/cat/batch-update-irt`, {
                method: 'PATCH',
                headers: authHeaders(),
                body: JSON.stringify({ updates }),
            });

            if (!r.ok) throw new Error();
            await Swal.fire({
                title: 'บันทึกสำเร็จ!',
                text: `อัปเดตพารามิเตอร์ IRT สำเร็จ ${updates.length} ข้อ`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
            });
            setShowAutoCalibModal(false);
            fetchItems();
        } catch {
            Swal.fire('ข้อผิดพลาด', 'บันทึกไม่สำเร็จ', 'error');
        } finally {
            setIsSaving(false);
        }
    }

    // CSV Parse for Import
    function handleParseCSV(csvText: string) {
        const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length < 2) {
            Swal.fire('ไฟล์ว่างเปล่า', 'ไม่พบข้อมูลในไฟล์ CSV', 'warning');
            return;
        }

        const headerLine = lines[0].toLowerCase();
        const headers = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

        let idIdx = headers.findIndex(h => h === 'item_id' || h === 'itemid' || h === 'id');
        let aIdx = headers.findIndex(h => h === 'a' || h === 'irt_a' || h === 'irt_a_discrimination' || h === 'discrimination');
        let bIdx = headers.findIndex(h => h === 'b' || h === 'irt_b' || h === 'irt_b_difficulty' || h === 'difficulty');
        let cIdx = headers.findIndex(h => h === 'c' || h === 'irt_c' || h === 'irt_c_guessing' || h === 'guessing');

        if (idIdx === -1) idIdx = 0;
        if (bIdx === -1 && headers.length >= 2) bIdx = 1;

        const itemDict = new Map(allItems.map(i => [i.item_id, i]));
        const parsed: ImportParsedRow[] = [];

        for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split(',').map(c => c.trim().replace(/^["']|["']$/g, ''));
            if (!cols || cols.length === 0 || cols[0] === '') continue;

            const id = parseInt(cols[idIdx]);
            if (isNaN(id)) {
                parsed.push({ item_id: 0, a: 1, b: 0, c: 0.2, valid: false, error: `แถวที่ ${i + 1}: item_id ไม่ถูกต้อง` });
                continue;
            }

            const item = itemDict.get(id);
            const a = aIdx !== -1 && !isNaN(parseFloat(cols[aIdx])) ? parseFloat(cols[aIdx]) : 1.0;
            const b = bIdx !== -1 && !isNaN(parseFloat(cols[bIdx])) ? parseFloat(cols[bIdx]) : 0.0;
            const c = cIdx !== -1 && !isNaN(parseFloat(cols[cIdx])) ? parseFloat(cols[cIdx]) : 0.20;

            let error = '';
            if (!item) {
                error = 'ไม่พบข้อสอบ ID นี้ในระบบ';
            } else if (a <= 0 || a > 5) {
                error = 'ค่า a ควรอยู่ระหว่าง 0.1 ถึง 5.0';
            } else if (b < -5 || b > 5) {
                error = 'ค่า b ควรอยู่ระหว่าง -5.0 ถึง +5.0';
            } else if (c < 0 || c >= 1) {
                error = 'ค่า c ควรอยู่ระหว่าง 0.00 ถึง 0.99';
            }

            parsed.push({
                item_id: id,
                a: Math.round(a * 100) / 100,
                b: Math.round(b * 100) / 100,
                c: Math.round(c * 100) / 100,
                valid: !error,
                error: error || undefined,
                item_text: item?.question_text,
            });
        }

        setImportParsedItems(parsed);
    }

    // Confirm CSV Import
    async function handleConfirmImport() {
        const validRows = importParsedItems.filter(r => r.valid);
        if (!validRows.length) {
            return Swal.fire('ไม่มีข้อมูลที่ถูกต้อง', 'กรุณาตรวจสอบไฟล์ CSV', 'warning');
        }

        try {
            setIsImporting(true);
            const updates = validRows.map(r => ({
                item_id: r.item_id,
                irt_a_discrimination: r.a,
                irt_b_difficulty: r.b,
                irt_c_guessing: r.c,
            }));

            const r = await fetch(`${API}/items-bank/cat/import-calibrated-irt`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ updates }),
            });

            if (!r.ok) throw new Error();
            const res = await r.json();

            await Swal.fire({
                title: 'นำเข้าสำเร็จ!',
                html: `อัปเดตพารามิเตอร์ IRT เรียบร้อยแล้ว <b>${res.success_count || updates.length}</b> ข้อ`,
                icon: 'success',
                timer: 1500,
                showConfirmButton: false,
            });
            setShowImportModal(false);
            setImportParsedItems([]);
            fetchItems();
        } catch {
            Swal.fire('ข้อผิดพลาด', 'นำเข้าพารามิเตอร์ไม่สำเร็จ', 'error');
        } finally {
            setIsImporting(false);
        }
    }

    function downloadSampleCSV() {
        const sampleContent = "item_id,irt_a_discrimination,irt_b_difficulty,irt_c_guessing\n" +
            (allItems.slice(0, 5).map(i => `${i.item_id},1.20,0.45,0.20`).join("\n") || "101,1.20,-0.50,0.20\n102,1.50,0.80,0.20");
        const blob = new Blob(["\uFEFF" + sampleContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', 'sample_irt_calibration_template.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
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
            <div className="max-w-7xl mx-auto w-full space-y-6" suppressHydrationWarning>

                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">
                            การจัดการพารามิเตอร์ IRT
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            กำหนดค่าความยาก (b), อำนาจจำแนก (a) และการเดา (c) ตามโมเดล 3PL สำหรับใช้ในการสอบ Adaptive (CAT)
                        </p>
                    </div>

                </div>

                {/* ── Bank Selector Card ── */}
                <div className="bg-white border border-gray-200 rounded-2xl shadow-2xs relative z-30">
                    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-6">
                        <div className="flex-1 relative">
                            <label className="block text-sm font-medium text-gray-500 mb-1.5">คลังข้อสอบ</label>
                            <div className="relative">
                                <select
                                    value={selectedBankId ?? ''}
                                    onChange={e => { setSelectedBankId(e.target.value ? +e.target.value : null); setCurrentPage(1); setCheckedIds(new Set()); }}
                                    className="w-full appearance-none border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 cursor-pointer"
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
                                <p className="text-xl font-medium text-gray-900">{bankItems.length}</p>
                                <p className="text-sm text-gray-400">ทั้งหมด</p>
                            </div>
                            <div className="w-px bg-gray-100" />
                            <div className="text-center">
                                <p className="text-xl font-medium text-green-600">{calibratedCount}</p>
                                <p className="text-sm text-gray-400">ระบุ IRT แล้ว</p>
                            </div>
                            <div className="w-px bg-gray-100" />
                            <div className="text-center">
                                <p className="text-xl font-medium text-amber-500">{uncalibratedCount}</p>
                                <p className="text-sm text-gray-400">ยังไม่ระบุ</p>
                            </div>
                            <div className="w-px bg-gray-100" />
                            <div className="text-center">
                                {isReady
                                    ? <p className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-lg mt-0.5">พร้อมสอบ CAT</p>
                                    : <p className="text-sm font-medium text-amber-600 bg-amber-50 px-2 py-1 rounded-lg mt-0.5">ต้องการอีก {Math.max(0, 20 - calibratedCount)} ข้อ</p>}
                                <p className="text-sm text-gray-400 mt-0.5">สถานะคลัง</p>
                            </div>
                        </div>

                        {/* Action buttons (Dropdown to save space) */}
                        <div className="relative flex items-center sm:pt-5 shrink-0 z-40" ref={actionMenuRef}>
                            <button
                                onClick={() => setShowActionMenu(prev => !prev)}
                                className="flex items-center gap-2 px-3.5 py-2.5 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl transition-all shadow-xs cursor-pointer active:scale-95"
                                title="เครื่องมือจัดการพารามิเตอร์ IRT"
                            >
                                <SlidersHorizontal size={14} className="text-gray-600" />
                                <span className='text-sm'>เครื่องมือจัดการ</span>
                                <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${showActionMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {showActionMenu && (
                                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-gray-200 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                    <button
                                        onClick={() => { setShowActionMenu(false); handleOpenAutoCalib(); }}
                                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-amber-50/80 flex items-center gap-3 transition-colors group cursor-pointer"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <Sparkles size={16} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-800">Auto-Calibrate (CTT)</p>
                                            <p className="text-sm text-gray-500 truncate">คำนวณค่า IRT จากผลสอบจริง</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { setShowActionMenu(false); handleExportResponseMatrix(); }}
                                        disabled={isExporting}
                                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-blue-50/80 flex items-center gap-3 transition-colors group cursor-pointer disabled:opacity-50"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            {isExporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-800">ส่งออก Matrix (CSV)</p>
                                            <p className="text-sm text-gray-500 truncate">ส่งออก 0/1 Matrix วิเคราะห์ต่อ</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => { setShowActionMenu(false); setImportParsedItems([]); setShowImportModal(true); }}
                                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-green-50/80 flex items-center gap-3 transition-colors group cursor-pointer"
                                    >
                                        <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <Upload size={16} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-gray-800">นำเข้า CSV</p>
                                            <p className="text-sm text-gray-500 truncate">อัปเดตค่า IRT (a, b, c) จากไฟล์</p>
                                        </div>
                                    </button>

                                    {selectedBankId && (
                                        <>
                                            <div className="my-1 border-t border-gray-100" />
                                            <button
                                                onClick={() => { setShowActionMenu(false); fetchTIF(selectedBankId, bankList.find(b => b.item_bank_id === selectedBankId)?.bank_name || ''); }}
                                                className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-purple-50/80 flex items-center gap-3 transition-colors group cursor-pointer"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                    <TrendingUp size={16} />
                                                </div>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium text-gray-800">ดู TIF</p>
                                                    <p className="text-sm text-gray-500 truncate">กราฟ Test Information Function</p>
                                                </div>
                                            </button>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
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
                        <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 text-sm">
                            {[
                                { k: 'all', l: `ทั้งหมด`, n: bankItems.length },
                                { k: 'set', l: `ระบุแล้ว`, n: calibratedCount },
                                { k: 'unset', l: `ยังไม่ระบุ`, n: uncalibratedCount },
                            ].map(f => (
                                <button key={f.k}
                                    onClick={() => { setCatFilter(f.k as any); setCurrentPage(1); }}
                                    className={`flex items-center gap-1 px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${catFilter === f.k ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {f.l}
                                    <span className={`text-sm px-1.5 py-0.5 rounded ${catFilter === f.k ? 'bg-gray-100 text-gray-600' : 'bg-gray-200/60 text-gray-500'}`}>{f.n}</span>
                                </button>
                            ))}
                        </div>

                        {/* Difficulty filter dropdown */}
                        <div className="relative">
                            <select
                                value={difficultyFilter}
                                onChange={e => { setDifficultyFilter(e.target.value); setCurrentPage(1); }}
                                className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm font-medium bg-white text-gray-700 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer shadow-2xs"
                            >
                                <option value="all">ทุกระดับความยาก ({bankItems.length})</option>
                                <option value="very_easy">ง่ายมาก ({difficultyCounts.very_easy})</option>
                                <option value="easy">ง่าย ({difficultyCounts.easy})</option>
                                <option value="medium">ปานกลาง ({difficultyCounts.medium})</option>
                                <option value="hard">ยาก ({difficultyCounts.hard})</option>
                                <option value="very_hard">ยากมาก ({difficultyCounts.very_hard})</option>
                            </select>
                            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Sort */}
                        <button onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
                            className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-600 hover:text-gray-900 hover:border-gray-300 text-sm font-medium transition-colors cursor-pointer">
                            <ArrowUpDown size={12} />
                            {sortOrder === 'desc' ? 'ใหม่' : 'เก่า'}
                        </button>
                    </div>

                    {/* View toggle */}
                    <div className="flex bg-gray-100 rounded-lg p-0.5 gap-0.5 shrink-0">
                        {(['table', 'card'] as const).map(m => (
                            <button key={m} onClick={() => { setViewMode(m); localStorage.setItem('cat_viewmode', m); }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all cursor-pointer ${viewMode === m ? 'bg-white shadow-sm text-green-700' : 'text-gray-500 hover:text-gray-700'}`}>
                                {m === 'table' ? <List size={13} /> : <LayoutGrid size={13} />}
                                {m === 'table' ? 'ตาราง' : 'การ์ด'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Bulk Action Bar ── */}
                <div className={`rounded-xl mb-4 transition-all ${checkedIds.size > 0
                    ? 'bg-blue-50 border border-blue-200 p-3'
                    : 'bg-gray-50 border border-gray-200 p-2.5'}`}>
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Select controls */}
                        <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 cursor-pointer transition-colors select-none">
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
                                    <span className="text-gray-300 text-sm">|</span>
                                    <button onClick={() => setCheckedIds(new Set(filtered.map(i => i.item_id)))}
                                        className="text-sm text-blue-600 hover:text-blue-800 font-medium cursor-pointer">
                                        เลือกทั้งหมด ({filtered.length})
                                    </button>
                                </>
                            )}
                            {checkedIds.size > 0 && (
                                <>
                                    <span className="text-gray-300 text-sm">|</span>
                                    <button onClick={() => setCheckedIds(new Set())}
                                        className="text-sm text-gray-400 hover:text-gray-600 font-medium cursor-pointer">
                                        ล้าง
                                    </button>
                                </>
                            )}
                        </div>

                        {/* Selected count badge */}
                        {checkedIds.size > 0 && (
                            <span className="text-sm font-medium text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full">
                                {checkedIds.size} ข้อที่เลือก
                            </span>
                        )}

                        {/* Preset quick-set */}
                        {checkedIds.size > 0 && (
                            <div className="flex items-center gap-1.5 flex-wrap ml-1">
                                <span className="text-sm text-gray-500 font-medium">ตั้งค่าทันที:</span>
                                {PRESETS.map(p => (
                                    <button key={p.label}
                                        onClick={() => handleBulkSave(p.b, p.c)}
                                        disabled={isSaving}
                                        className="flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium rounded-lg border transition-all hover:opacity-90 disabled:opacity-40 cursor-pointer"
                                        style={{ backgroundColor: p.bg, borderColor: p.border, color: p.color }}
                                    >
                                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                                        {p.label}
                                    </button>
                                ))}
                                <button onClick={() => setShowBulkModal(true)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
                                    <SlidersHorizontal size={12} /> กำหนดเอง
                                </button>
                                <button onClick={handleBulkResetToNull}
                                    disabled={isSaving}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-sm font-medium rounded-lg transition-colors cursor-pointer"
                                    title="ล้างค่าพารามิเตอร์ IRT ของทุกข้อที่เลือกให้เป็นค่าว่าง">
                                    <RotateCcw size={12} /> ล้างค่า
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── Content ── */}
                {loading ? (
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        {[1, 2, 3, 4, 5].map(i => (
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
                    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-2xs">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="border-b border-gray-200 bg-gray-50">
                                        <th className="pl-4 pr-2 py-3.5 w-10">
                                            <input
                                                type="checkbox"
                                                checked={allPageChecked}
                                                onChange={toggleCheckAll}
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600"
                                            />
                                        </th>
                                        <th className="px-3 py-3.5 text-left text-sm font-medium text-gray-500 whitespace-nowrap w-16">ID</th>
                                        <th className="px-3 py-3.5 text-left text-sm font-medium text-gray-500 whitespace-nowrap min-w-[140px]">คลังข้อสอบ</th>
                                        <th className="px-4 py-3.5 text-left text-sm font-medium text-gray-500 min-w-[220px]">คำถาม</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium text-gray-600 whitespace-nowrap">อำนาจจำแนก (a)</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium text-gray-600 whitespace-nowrap">ความยาก (b)</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium text-gray-600 whitespace-nowrap">การเดา (c)</th>
                                        <th className="px-4 py-3.5 text-center text-sm font-medium text-gray-500 whitespace-nowrap">ระดับ</th>
                                        <th className="pr-4 pl-2 py-3.5 text-center text-sm font-medium text-gray-500 whitespace-nowrap w-20">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="py-16 text-center text-gray-400 text-sm">
                                                ไม่พบข้อสอบ
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map(item => {
                                            const { label, color } = diffLabel(item.irt_b_difficulty);
                                            const isChecked = checkedIds.has(item.item_id);
                                            return (
                                                <tr
                                                    key={item.item_id}
                                                    className={`hover:bg-gray-50/70 transition-colors ${isChecked ? 'bg-blue-50/40' : ''}`}
                                                >
                                                    <td className="pl-4 pr-2 py-3.5">
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => toggleCheck(item.item_id)}
                                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600"
                                                        />
                                                    </td>
                                                    <td className="px-3 py-3.5 text-sm text-gray-400 ">#{item.item_id}</td>
                                                    <td className="px-3 py-3.5">
                                                        <span className="text-sm font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md line-clamp-1">
                                                            {item.item_bank?.bank_name || '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <p className="text-sm text-gray-800 line-clamp-2 leading-relaxed">
                                                            {stripHTML(item.question_text)}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center text-sm font-medium whitespace-nowrap" style={{ color: '#2563eb' }}>
                                                        {item.irt_a_discrimination !== null ? item.irt_a_discrimination.toFixed(2) : <span className="text-gray-300 font-normal">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center text-sm font-medium whitespace-nowrap" style={{ color: '#7c3aed' }}>
                                                        {item.irt_b_difficulty !== null ? `${item.irt_b_difficulty > 0 ? '+' : ''}${item.irt_b_difficulty.toFixed(2)}` : <span className="text-gray-300 font-normal">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center text-sm font-medium whitespace-nowrap" style={{ color: '#be185d' }}>
                                                        {item.irt_c_guessing !== null ? item.irt_c_guessing.toFixed(2) : <span className="text-gray-300 font-normal">—</span>}
                                                    </td>
                                                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                                        <span className="text-sm font-medium px-2 py-0.5 rounded-md inline-block"
                                                            style={{ color, backgroundColor: color + '15' }}>
                                                            {label}
                                                        </span>
                                                    </td>
                                                    <td className="pr-4 pl-2 py-3.5 text-center">
                                                        <div className="flex items-center justify-center gap-1">
                                                            <button
                                                                onClick={() => openEdit(item)}
                                                                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                                                                title="แก้ไขค่า IRT"
                                                            >
                                                                <Eye size={15} />
                                                            </button>
                                                            {(item.irt_b_difficulty !== null || item.irt_a_discrimination !== null || item.irt_c_guessing !== null) && (
                                                                <button
                                                                    onClick={() => handleResetSingleToNull(item)}
                                                                    className="p-1.5 hover:bg-rose-50 rounded-lg text-gray-300 hover:text-rose-600 transition-colors cursor-pointer"
                                                                    title="ล้างค่า IRT (กลับเป็น null)"
                                                                >
                                                                    <RotateCcw size={14} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : (

                    /* ── CARD VIEW ── */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {currentItems.map(item => {
                            const { label, color } = diffLabel(item.irt_b_difficulty);
                            const isChecked = checkedIds.has(item.item_id);
                            return (
                                <div
                                    key={item.item_id}
                                    className={`bg-white rounded-2xl border p-5 flex flex-col justify-between transition-all shadow-2xs ${isChecked ? 'border-blue-400 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between gap-2 mb-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="checkbox"
                                                    checked={isChecked}
                                                    onChange={() => toggleCheck(item.item_id)}
                                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 accent-blue-600"
                                                />
                                                <span className="text-sm text-gray-400">#{item.item_id}</span>
                                                <span className="text-sm font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md truncate max-w-[120px]">
                                                    {item.item_bank?.bank_name}
                                                </span>
                                            </div>
                                        </div>
                                        <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed mb-4">
                                            {stripHTML(item.question_text)}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <div className="flex gap-3">
                                                <div>
                                                    <p className="text-sm text-gray-400 mb-0.5">อำนาจจำแนก a</p>
                                                    <p className="text-sm font-medium" style={{ color: '#3b82f6' }}>
                                                        {item.irt_a_discrimination !== null ? `${item.irt_a_discrimination > 0 ? '+' : ''}${item.irt_a_discrimination.toFixed(2)}` : '—'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400 mb-0.5">ความยาก b</p>
                                                    <p className="text-sm font-medium" style={{ color: '#7c3aed' }}>
                                                        {item.irt_b_difficulty !== null ? `${item.irt_b_difficulty > 0 ? '+' : ''}${item.irt_b_difficulty.toFixed(2)}` : '—'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-sm text-gray-400 mb-0.5">การเดา c</p>
                                                    <p className="text-sm font-medium" style={{ color: '#be185d' }}>
                                                        {item.irt_c_guessing !== null ? item.irt_c_guessing.toFixed(2) : '—'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-sm font-medium px-2 py-1 rounded-md"
                                                style={{ color, backgroundColor: color + '18' }}>
                                                {label}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <button
                                            onClick={() => openEdit(item)}
                                            className="flex-1 flex items-center justify-center gap-1 text-sm text-gray-500 hover:text-green-600 font-medium px-2 py-1.5 rounded-lg hover:bg-gray-50 border border-gray-200 transition-colors cursor-pointer"
                                        >
                                            <Eye size={12} /> แก้ไข
                                        </button>
                                        {(item.irt_b_difficulty !== null || item.irt_a_discrimination !== null || item.irt_c_guessing !== null) && (
                                            <button
                                                onClick={() => handleResetSingleToNull(item)}
                                                className="px-3 text-rose-500 hover:bg-rose-50 border border-gray-100 rounded-lg transition-colors cursor-pointer"
                                                title="ล้างค่า IRT (กลับเป็น null)"
                                            >
                                                <RotateCcw size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* ── Pagination ── */}
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={filtered.length}
                    perPage={perPage}
                    onPageChange={setCurrentPage}
                    itemLabel="ข้อ"
                />
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
                                    <h3 className="text-base font-medium text-gray-900">แก้ไขพารามิเตอร์ IRT</h3>
                                    <p className="text-sm text-gray-400 mt-0.5">
                                        ข้อสอบ #{editItem.item_id} · {editItem.item_bank?.bank_name}
                                    </p>
                                </div>
                                <button onClick={() => setShowEditModal(false)}
                                    className="text-gray-300 hover:text-gray-500 p-1 hover:bg-gray-100 rounded-lg transition-all cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-5 space-y-6 flex-1">
                            {/* Question preview */}
                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <p className="text-sm font-medium text-gray-400  mb-2">คำถาม</p>
                                <div className="text-sm text-gray-700 leading-relaxed line-clamp-4"
                                    dangerouslySetInnerHTML={{ __html: editItem.question_text }} />
                            </div>

                            {/* Difficulty presets */}
                            <div>
                                <p className="text-sm font-medium text-gray-800 mb-2.5">ระดับความยากสำเร็จรูป</p>
                                <div className="flex gap-2 flex-wrap">
                                    {PRESETS.map(p => {
                                        const active = Math.abs(editIRT.b - p.b) < 0.01 && Math.abs(editIRT.c - p.c) < 0.01;
                                        return (
                                            <button key={p.label}
                                                onClick={() => setEditIRT(prev => ({ ...prev, b: p.b, c: p.c }))}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer"
                                                style={{
                                                    backgroundColor: active ? p.color : p.bg,
                                                    borderColor: active ? p.color : p.border,
                                                    color: active ? '#fff' : p.color,
                                                    boxShadow: active ? `0 0 0 3px ${p.color}22` : 'none',
                                                }}>
                                                <span className="w-1.5 h-1.5 rounded-full shrink-0"
                                                    style={{ backgroundColor: active ? '#fff' : p.color }} />
                                                {p.label}
                                                <span className="opacity-70 text-sm">
                                                    b={p.b > 0 ? `+${p.b}` : p.b}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Sliders */}
                            <div className="space-y-5">
                                <p className="text-sm font-medium text-gray-800">ปรับค่าพารามิเตอร์</p>
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
                                    <p className="text-sm font-medium text-gray-800">กราฟ ICC</p>
                                    <div className="flex gap-3 text-sm">
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
                        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center gap-3">
                            {(editItem.irt_b_difficulty !== null || editItem.irt_a_discrimination !== null || editItem.irt_c_guessing !== null) && (
                                <button
                                    type="button"
                                    onClick={() => handleResetSingleToNull()}
                                    disabled={isSaving}
                                    className="px-4 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                                    title="ล้างค่าพารามิเตอร์ IRT กลับเป็นค่าว่าง"
                                >
                                    <RotateCcw size={14} />
                                    <span>ล้างค่า</span>
                                </button>
                            )}
                            <button onClick={() => setShowEditModal(false)}
                                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                                ยกเลิก
                            </button>
                            <button onClick={handleSaveSingle} disabled={isSaving}
                                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors cursor-pointer">
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
                                <h3 className="text-base font-medium text-gray-900">ตั้งค่า IRT — {checkedIds.size} ข้อ</h3>
                                <p className="text-sm text-gray-400 mt-0.5">อัปเดตพร้อมกันทุกข้อที่เลือก</p>
                            </div>
                            <button onClick={() => setShowBulkModal(false)}
                                className="text-gray-300 hover:text-gray-500 p-1 hover:bg-gray-100 rounded-lg transition-all cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="px-6 py-5 space-y-6">
                            {/* Presets */}
                            <div>
                                <p className="text-sm font-medium text-gray-800 mb-2.5">ระดับสำเร็จรูป</p>
                                <div className="flex gap-2 flex-wrap">
                                    {PRESETS.map(p => {
                                        const active = Math.abs(bulkIRT.b - p.b) < 0.01;
                                        return (
                                            <button key={p.label}
                                                onClick={() => setBulkIRT({ b: p.b, c: p.c })}
                                                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-sm font-medium transition-all cursor-pointer"
                                                style={{
                                                    backgroundColor: active ? p.color : p.bg,
                                                    borderColor: active ? p.color : p.border,
                                                    color: active ? '#fff' : p.color,
                                                }}>
                                                {p.label}
                                                <span className="opacity-70 text-sm">b={p.b > 0 ? `+${p.b}` : p.b}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Sliders */}
                            <div className="space-y-4">
                                <SliderField
                                    label="ความยาก b" sublabel="กำหนดเอง"
                                    value={bulkIRT.b} min={-4} max={4} step={0.1}
                                    color="#7c3aed"
                                    onChange={v => setBulkIRT(p => ({ ...p, b: v }))}
                                    format={v => (v > 0 ? `+${v.toFixed(1)}` : v.toFixed(1))}
                                />
                                <SliderField
                                    label="การเดา c" sublabel="กำหนดเอง"
                                    value={bulkIRT.c} min={0.01} max={0.5} step={0.01}
                                    color="#be185d"
                                    onChange={v => setBulkIRT(p => ({ ...p, c: v }))}
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                            <button
                                type="button"
                                onClick={() => { setShowBulkModal(false); handleBulkResetToNull(); }}
                                disabled={isSaving}
                                className="px-4 py-2.5 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-sm font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                                title="ล้างค่าพารามิเตอร์ IRT ของทุกข้อที่เลือกให้เป็น null"
                            >
                                <RotateCcw size={14} />
                                <span>ล้างค่า</span>
                            </button>
                            <button onClick={() => setShowBulkModal(false)}
                                className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors cursor-pointer">
                                ยกเลิก
                            </button>
                            <button onClick={() => handleBulkSave()} disabled={isSaving}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-colors cursor-pointer">
                                {isSaving ? 'กำลังบันทึก...' : `บันทึก ${checkedIds.size} ข้อ`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
                                <p className="text-sm text-gray-400 mt-0.5">{tifBankName}</p>
                            </div>
                            <button onClick={() => setShowTIF(false)}
                                className="text-gray-300 hover:text-gray-500 p-1 hover:bg-gray-100 rounded-lg transition-all cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="h-64">
                            {tifData ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={tifData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                                        <XAxis dataKey="theta" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                                        <Tooltip
                                            contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }}
                                            formatter={(v: any, name: any) => [
                                                Number(v).toFixed(2),
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
            {/* ══════════════════════════════════════════
                MODAL — Auto-Calibration from Real Exam Data (CTT)
            ══════════════════════════════════════════ */}
            {showAutoCalibModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
                    style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}>
                    <div className="bg-white rounded-3xl w-full max-w-5xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-amber-50/70 via-white to-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-600 shadow-xs">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                        Auto-Calibrate พารามิเตอร์ IRT จากผลสอบจริง (CTT)
                                        <span className="text-sm px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">Beta</span>
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        คำนวณค่าความยาก (p-value) และอำนาจจำแนก (Point-Biserial) จากประวัติการสอบจริง แล้วประมาณการเป็นค่า a, b, c
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowAutoCalibModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-5 flex-1">
                            {autoCalibLoading ? (
                                <div className="py-20 text-center space-y-3">
                                    <Loader2 className="w-10 h-10 animate-spin text-amber-500 mx-auto" />
                                    <p className="text-sm font-medium text-gray-600">กำลังรวบรวมประวัติการตอบและคำนวณสถิติจิตมิติ...</p>
                                </div>
                            ) : autoCalibData ? (
                                <>
                                    {/* Stats & Guide banner */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 flex items-center gap-3">
                                            <div className="text-2xl font-black text-amber-700">{autoCalibData.total_sessions}</div>
                                            <div className="text-sm text-amber-900">
                                                <p className="font-medium">Sessions ที่นำมาวิเคราะห์</p>
                                                <p className="text-amber-700/80">การสอบปกติที่มีการส่งคำตอบแล้ว</p>
                                            </div>
                                        </div>
                                        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 flex items-center gap-3">
                                            <div className="text-2xl font-black text-blue-700">{autoCalibData.total_items}</div>
                                            <div className="text-sm text-blue-900">
                                                <p className="font-medium">จำนวนข้อสอบทั้งหมด</p>
                                                <p className="text-blue-700/80">
                                                    {autoCalibData.items.filter(i => i.attempts >= 10).length} ข้อ มีข้อมูลเพียงพอ (&ge;10 ครั้ง)
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-green-50/70 border border-green-200/80 rounded-2xl p-4 flex items-center gap-3">
                                            <div className="text-2xl font-black text-green-700">
                                                {autoCalibSelected.size}
                                            </div>
                                            <div className="text-sm text-green-900">
                                                <p className="font-medium">ข้อที่เลือกปรับค่า</p>
                                                <p className="text-green-700/80">พร้อมนำไปบันทึกลงระบบ</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Formula explanation box */}
                                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 space-y-1.5">
                                        <div className="font-medium text-slate-900 flex items-center gap-1.5">
                                            <HelpCircle size={14} className="text-indigo-600" /> หลักการคำนวณ CTT to IRT Approximation:
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                                            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                                                <span className="font-medium text-gray-800">1. ความยาก (b):</span><br />
                                                <span className="text-gray-500  text-sm">b ≈ ln((1 - p) / p)</span><br />
                                                <span className="text-sm text-gray-400">จากค่า p-value สัดส่วนคนตอบถูก</span>
                                            </div>
                                            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                                                <span className="font-medium text-gray-800">2. อำนาจจำแนก (a):</span><br />
                                                <span className="text-gray-500  text-sm">a ≈ 1.7 · r_pb / √(1 - r_pb²)</span><br />
                                                <span className="text-sm text-gray-400">จาก Point-Biserial Correlation (r_pb)</span>
                                            </div>
                                            <div className="bg-white p-2.5 rounded-xl border border-slate-200/60">
                                                <span className="font-medium text-gray-800">3. การเดา (c):</span><br />
                                                <span className="text-gray-500  text-sm">c = 0.20</span><br />
                                                <span className="text-sm text-gray-400">ค่ามาตรฐานสำหรับ 5 ตัวเลือก</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Table Filters & Actions */}
                                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm font-medium text-gray-700">กรองคุณภาพข้อมูล:</span>
                                            <div className="flex bg-gray-100 rounded-lg p-0.5 text-sm">
                                                {[
                                                    { id: 'all', label: 'ทั้งหมด' },
                                                    { id: 'high_med', label: 'ปานกลาง+สูง (≥10 ครั้ง)' },
                                                    { id: 'high', label: 'สูงเท่านั้น (≥30 ครั้ง)' },
                                                ].map(q => (
                                                    <button
                                                        key={q.id}
                                                        onClick={() => setAutoCalibQualityFilter(q.id as any)}
                                                        className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${autoCalibQualityFilter === q.id ? 'bg-white shadow-2xs text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                                                    >
                                                        {q.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    const withData = autoCalibData.items.filter(i => i.attempts > 0).map(i => i.item_id);
                                                    setAutoCalibSelected(new Set(withData));
                                                }}
                                                className="text-sm text-blue-600 hover:text-blue-800 font-medium px-2 py-1 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                            >
                                                เลือกทั้งหมดที่มีข้อมูล
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setAutoCalibSelected(new Set())}
                                                className="text-sm text-gray-500 hover:text-gray-700 font-medium px-2 py-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                                            >
                                                ล้างการเลือก
                                            </button>
                                        </div>
                                    </div>

                                    {/* Data Table */}
                                    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                                        <div className="overflow-x-auto max-h-96">
                                            <table className="w-full text-left border-collapse text-sm">
                                                <thead className="bg-gray-50 sticky top-0 z-10 border-b border-gray-200 font-medium text-gray-700">
                                                    <tr>
                                                        <th className="p-3 w-10 text-center">
                                                            <input
                                                                type="checkbox"
                                                                checked={autoCalibData.items.length > 0 && autoCalibSelected.size === autoCalibData.items.filter(i => i.attempts > 0).length}
                                                                onChange={e => {
                                                                    if (e.target.checked) {
                                                                        setAutoCalibSelected(new Set(autoCalibData.items.filter(i => i.attempts > 0).map(i => i.item_id)));
                                                                    } else {
                                                                        setAutoCalibSelected(new Set());
                                                                    }
                                                                }}
                                                                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                                            />
                                                        </th>
                                                        <th className="p-3 w-16">ID</th>
                                                        <th className="p-3 min-w-[200px]">ข้อสอบ</th>
                                                        <th className="p-3 text-center">คนทำ (N)</th>
                                                        <th className="p-3 text-center">ความยาก p</th>
                                                        <th className="p-3 text-center">อำนาจจำแนก r_pb</th>
                                                        <th className="p-3 text-center bg-gray-100/70">IRT ปัจจุบัน (a, b, c)</th>
                                                        <th className="p-3 text-center bg-amber-50/80 text-amber-900 font-medium">IRT คำนวณได้ (a, b, c)</th>
                                                        <th className="p-3 text-center">คุณภาพ</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100">
                                                    {autoCalibData.items
                                                        .filter(item => {
                                                            if (autoCalibQualityFilter === 'high') return item.data_quality === 'HIGH';
                                                            if (autoCalibQualityFilter === 'high_med') return item.data_quality === 'HIGH' || item.data_quality === 'MEDIUM';
                                                            return true;
                                                        })
                                                        .map(item => {
                                                            const isChecked = autoCalibSelected.has(item.item_id);
                                                            const hasData = item.attempts > 0;
                                                            return (
                                                                <tr
                                                                    key={item.item_id}
                                                                    className={`hover:bg-amber-50/30 transition-colors ${isChecked ? 'bg-amber-50/20' : ''}`}
                                                                >
                                                                    <td className="p-3 text-center">
                                                                        <input
                                                                            type="checkbox"
                                                                            disabled={!hasData}
                                                                            checked={isChecked}
                                                                            onChange={() => {
                                                                                setAutoCalibSelected(prev => {
                                                                                    const next = new Set(prev);
                                                                                    next.has(item.item_id) ? next.delete(item.item_id) : next.add(item.item_id);
                                                                                    return next;
                                                                                });
                                                                            }}
                                                                            className="rounded border-gray-300 text-amber-600 focus:ring-amber-500 disabled:opacity-30 cursor-pointer"
                                                                        />
                                                                    </td>
                                                                    <td className="p-3  font-medium text-gray-500">#{item.item_id}</td>
                                                                    <td className="p-3 text-gray-800 font-medium max-w-xs truncate" title={stripHTML(item.question_text)}>
                                                                        {stripHTML(item.question_text) || '—'}
                                                                    </td>
                                                                    <td className="p-3 text-center font-medium text-gray-700">
                                                                        {item.attempts} <span className="text-sm text-gray-400 font-normal">({item.correct_count} ถูก)</span>
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <span className={`px-2 py-0.5 rounded  font-medium ${item.p_value >= 0.8 ? 'bg-green-100 text-green-700' : item.p_value <= 0.3 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>
                                                                            {item.p_value.toFixed(2)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        <span className={`px-2 py-0.5 rounded  font-medium ${item.r_pb >= 0.3 ? 'bg-green-100 text-green-700' : item.r_pb >= 0.15 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                                                                            {item.r_pb.toFixed(2)}
                                                                        </span>
                                                                    </td>
                                                                    <td className="p-3 text-center bg-gray-50/50  text-gray-500">
                                                                        {item.current_a !== null
                                                                            ? `${item.current_a.toFixed(2)}, ${item.current_b !== null ? (item.current_b > 0 ? `+${item.current_b.toFixed(2)}` : item.current_b.toFixed(2)) : '0.00'}, ${item.current_c !== null ? item.current_c.toFixed(2) : '0.20'}`
                                                                            : <span className="text-gray-300">ยังไม่ระบุ</span>
                                                                        }
                                                                    </td>
                                                                    <td className="p-3 text-center bg-amber-50/40  font-medium text-amber-900">
                                                                        {hasData ? (
                                                                            <span>
                                                                                a={item.estimated_a.toFixed(2)}, b={item.estimated_b > 0 ? `+${item.estimated_b.toFixed(2)}` : item.estimated_b.toFixed(2)}, c={item.estimated_c.toFixed(2)}
                                                                            </span>
                                                                        ) : (
                                                                            <span className="text-gray-400 font-normal">ไม่มีข้อมูลสอบ</span>
                                                                        )}
                                                                    </td>
                                                                    <td className="p-3 text-center">
                                                                        {item.data_quality === 'HIGH' && <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 text-sm font-medium">🟢 สูง (≥30)</span>}
                                                                        {item.data_quality === 'MEDIUM' && <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-sm font-medium">🟡 กลาง (≥10)</span>}
                                                                        {item.data_quality === 'LOW' && <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-sm font-medium">🟠 ต่ำ (&lt;10)</span>}
                                                                        {item.data_quality === 'NO_DATA' && <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-sm">⚪ ไม่มีข้อมูล</span>}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            ) : null}
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex flex-wrap items-center justify-between gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowAutoCalibModal(false)}
                                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-white transition-colors cursor-pointer"
                            >
                                ปิดหน้าต่าง
                            </button>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleApplyAutoCalib(false)}
                                    disabled={isSaving || autoCalibSelected.size === 0}
                                    className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-medium transition-all shadow-xs cursor-pointer disabled:opacity-40"
                                >
                                    {isSaving ? 'กำลังบันทึก...' : `บันทึกค่า ${autoCalibSelected.size} ข้อที่เลือก`}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleApplyAutoCalib(true)}
                                    disabled={isSaving || !autoCalibData || autoCalibData.items.filter(i => i.attempts > 0).length === 0}
                                    className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-all shadow-xs cursor-pointer disabled:opacity-40"
                                >
                                    {isSaving ? 'กำลังบันทึก...' : `บันทึกทุกข้อที่มีผลสอบ (${autoCalibData?.items.filter(i => i.attempts > 0).length || 0} ข้อ)`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════
                MODAL — Import Calibrated IRT Parameters (CSV)
            ══════════════════════════════════════════ */}
            {showImportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6"
                    style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}>
                    <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">
                        {/* Header */}
                        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-green-50/70 via-white to-white shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 shadow-xs">
                                    <Upload size={20} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-gray-900">นำเข้าพารามิเตอร์ IRT (Calibrated CSV)</h3>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        อัปเดตค่าพารามิเตอร์ a, b, c จากไฟล์ผลลัพธ์ที่ได้จากการ Calibrate ใน R, Python, หรือ BILOG-MG
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setShowImportModal(false)}
                                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-xl transition-all cursor-pointer">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 overflow-y-auto space-y-5 flex-1">
                            {/* Upload Area */}
                            <div
                                onClick={() => importFileInputRef.current?.click()}
                                className="border-2 border-dashed border-green-300 hover:border-green-500 bg-green-50/30 hover:bg-green-50/60 rounded-2xl p-8 text-center cursor-pointer transition-all space-y-2 group"
                            >
                                <input
                                    type="file"
                                    ref={importFileInputRef}
                                    accept=".csv,.txt"
                                    className="hidden"
                                    onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = ev => {
                                                const text = ev.target?.result as string;
                                                if (text) handleParseCSV(text);
                                            };
                                            reader.readAsText(file);
                                        }
                                    }}
                                />
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mx-auto text-green-600 shadow-xs group-hover:scale-110 transition-transform">
                                    <FileSpreadsheet size={24} />
                                </div>
                                <p className="text-sm font-medium text-gray-800">คลิกเพื่อเลือกไฟล์ CSV หรือลากไฟล์มาวางที่นี่</p>
                                <p className="text-sm text-gray-500">รองรับไฟล์ .csv ที่มีคอลัมน์ <code className="bg-green-100 text-green-800 px-1 py-0.5 rounded ">item_id, a, b, c</code></p>
                            </div>

                            {/* Format Guide & Download Sample */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm">
                                <div className="space-y-0.5">
                                    <p className="font-medium text-slate-800">📋 รูปแบบคอลัมน์ในไฟล์ CSV:</p>
                                    <p className="text-slate-500 ">item_id, irt_a_discrimination, irt_b_difficulty, irt_c_guessing</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={downloadSampleCSV}
                                    className="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 bg-white hover:bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl transition-all shadow-2xs shrink-0 cursor-pointer"
                                >
                                    <Download size={13} /> ดาวน์โหลดไฟล์ Template
                                </button>
                            </div>

                            {/* Parsed Preview Table */}
                            {importParsedItems.length > 0 && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium text-gray-800">
                                            ตัวอย่างข้อมูลที่อ่านได้ ({importParsedItems.filter(r => r.valid).length} ข้อถูกต้อง / {importParsedItems.filter(r => !r.valid).length} ไม่ถูกต้อง)
                                        </h4>
                                    </div>
                                    <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                                        <div className="overflow-x-auto max-h-60">
                                            <table className="w-full text-left border-collapse text-sm">
                                                <thead className="bg-gray-50 sticky top-0 border-b border-gray-200 font-medium text-gray-700">
                                                    <tr>
                                                        <th className="p-2.5">Item ID</th>
                                                        <th className="p-2.5">โจทย์คำถาม</th>
                                                        <th className="p-2.5 text-center">a (Discrim)</th>
                                                        <th className="p-2.5 text-center">b (Diff)</th>
                                                        <th className="p-2.5 text-center">c (Guess)</th>
                                                        <th className="p-2.5 text-center">สถานะ</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 ">
                                                    {importParsedItems.map((row, idx) => (
                                                        <tr key={idx} className={row.valid ? 'hover:bg-green-50/20' : 'bg-red-50/40 text-red-700'}>
                                                            <td className="p-2.5 font-medium">#{row.item_id}</td>
                                                            <td className="p-2.5 font-sans max-w-xs truncate text-gray-700 font-medium" title={stripHTML(row.item_text || '')}>
                                                                {stripHTML(row.item_text || '') || '—'}
                                                            </td>
                                                            <td className="p-2.5 text-center font-medium text-indigo-700">{row.a.toFixed(2)}</td>
                                                            <td className="p-2.5 text-center font-medium text-amber-700">{row.b > 0 ? `+${row.b.toFixed(2)}` : row.b.toFixed(2)}</td>
                                                            <td className="p-2.5 text-center font-medium text-rose-700">{row.c.toFixed(2)}</td>
                                                            <td className="p-2.5 text-center font-sans">
                                                                {row.valid ? (
                                                                    <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-800 font-medium text-sm">พร้อมนำเข้า</span>
                                                                ) : (
                                                                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-medium text-sm">{row.error}</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowImportModal(false)}
                                className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-white transition-colors cursor-pointer"
                            >
                                ยกเลิก
                            </button>

                            <button
                                type="button"
                                onClick={handleConfirmImport}
                                disabled={isImporting || importParsedItems.filter(r => r.valid).length === 0}
                                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-medium transition-all shadow-xs cursor-pointer disabled:opacity-40"
                            >
                                {isImporting ? 'กำลังนำเข้า...' : `ยืนยันนำเข้า ${importParsedItems.filter(r => r.valid).length} ข้อ`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Navbar_admin>
    );
}
