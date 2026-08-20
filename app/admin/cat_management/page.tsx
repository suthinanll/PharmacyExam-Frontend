'use client';

import React, { useState, useEffect } from 'react';
import Navbar_admin from "@/components/Navbar_admin";
import {
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Line, ReferenceLine, AreaChart, Area, Legend,
    ComposedChart,
} from 'recharts';
import {
    Search, Eye, X,
    ChevronLeft, ChevronRight,
    TrendingUp,
    Database, LayoutGrid, List, ArrowUpDown,
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
interface TIFPoint { theta: number; info: number; se: number; }

// ======================== HELPERS ========================
const API = `${process.env.NEXT_PUBLIC_API_URL}`;
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



// ======================== MAIN COMPONENT ========================
export default function CATManagement() {
    const { getToken } = useAuth();

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


    async function fetchItemsWithIRT() {
        try {
            setLoading(true);
            const res = await fetch(`${API}/items-bank/cat/items-with-irt`, { headers: authHeaders() });
            if (!res.ok) throw new Error();
            setItemsWithIRT(await res.json());
        } catch { Swal.fire('ข้อผิดพลาด', 'โหลดข้อมูลไม่ได้', 'error'); }
        finally { setLoading(false); }
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
            <div className="max-w-7xl mx-auto px-4 py-6" suppressHydrationWarning>

                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">ข้อสอบ CAT Management</h1>
                    <p className="text-sm text-gray-500 mt-1">Computerized Adaptive Testing</p>
                </div>



                {/* Item Bank */}
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
                                        {mode === 'table' ? 'ตาราง' : 'การ์ด'}
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
                                                            <th key={h} className={`px-5 py-3.5 text-left text-xs font-medium tracking-wide ${i === 0 ? 'w-12 text-center' : ''} ${i === 6 ? 'text-center' : ''}`}>
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
                                                            <td className="px-5 py-4 text-xs text-gray-400 text-center">
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
                                                                <span className="text-sm font-medium text-blue-600">{item.irt_a_discrimination?.toFixed(3)}</span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className="text-sm font-medium text-purple-600">{(item.irt_b_difficulty > 0 ? '+' : '') + item.irt_b_difficulty?.toFixed(3)}</span>
                                                            </td>
                                                            <td className="px-5 py-4">
                                                                <span className="text-sm font-medium text-pink-600">{item.irt_c_guessing?.toFixed(3)}</span>
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
                                                        <span className="text-[10px] font-medium uppercase tracking-wider text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-100 truncate max-w-[180px]">
                                                            {item.item_bank?.bank_name || 'ไม่ระบุ'}
                                                        </span>
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
                                                                <p className="text-[10px] uppercase font-medium mb-1 opacity-70">{p.label}</p>
                                                                <p className="text-base font-medium">{p.val?.toFixed(2)}</p>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <button onClick={() => { setSelectedItem(item); setEditIRT({ a: item.irt_a_discrimination, b: item.irt_b_difficulty, c: item.irt_c_guessing }); setShowModal(true); }}
                                                        className="w-full flex items-center justify-center gap-2 bg-gray-400 hover:bg-green-600 text-white py-3 rounded-xl text-sm font-medium transition-all shadow-lg hover:shadow-green-200 active:scale-95">
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
                                                    <button key={`page-${i}-${page}`} onClick={() => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                                        className={`w-10 h-10 text-sm font-medium border rounded-xl transition-all ${page === currentPage ? 'bg-green-600 text-white border-green-600 shadow-lg shadow-green-200' : 'bg-white text-gray-600 border-gray-200 hover:border-green-600 hover:text-green-600'}`}>
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
            </div>

            {/* ─── MODALS ─── */}

            {/* Item Detail Modal */}
            {showModal && selectedItem && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">รายละเอียดข้อสอบ</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
                        </div>

                        <div className="p-6 space-y-5">
                            {/* Question */}
                            {selectedItem.situation && (
                                <div className="bg-blue-50 rounded-xl p-4">
                                    <p className="text-xs font-medium text-blue-600 mb-1">สถานการณ์</p>
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
                                <p className="text-sm font-medium text-gray-700 mb-3">✏️ แก้ไข IRT Parameters</p>
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
                                                className={`w-full border rounded-lg px-3 py-2 text-lg font-medium text-center focus:ring-2 outline-none ${f.cls}`} />
                                            <p className="text-[10px] text-gray-400 mt-0.5">{f.hint}</p>
                                        </div>
                                    ))}
                                </div>

                               
                            </div>
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex gap-3">
                            <button onClick={() => setShowModal(false)}
                                className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50">ยกเลิก</button>
                            <button onClick={handleUpdateIRT} disabled={isSaving}
                                className="flex-1 bg-green-600 hover:bg-green-700 active:scale-95 text-white py-2.5 rounded-lg font-medium disabled:opacity-50 flex items-center justify-center gap-2">
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
                            <h3 className="text-lg font-medium">📈 Test Information Function — {tifBankName}</h3>
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


