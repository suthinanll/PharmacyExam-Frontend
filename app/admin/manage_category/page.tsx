'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar_admin from "@/components/Navbar_admin";
import {
    Plus, Search, ChevronLeft, ChevronRight, ArrowUpDown,
    Edit, Trash2, X, Loader2, LayoutGrid, List,
    BookOpen, Calendar, ExternalLink, Tag, ChevronDown, ChevronUp,
} from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';
import { useAuth } from "@/contexts/AuthContext";

// ─── Types ───────────────────────────────────────────
interface LinkedBank {
    item_bank_id: number;
    bank_name: string;
    description: string;
    is_active: boolean;
}
interface Category {
    category_id: number;
    category_name: string;
    category_description: string;
    created_at: string;
    updated_at: string;
    item_banks?: LinkedBank[];
}

// ─── Constants ───────────────────────────────────────
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/categories`;
const ITEMS_PER_TABLE = 10;
const ITEMS_PER_CARD = 9;

// ─── Helpers ─────────────────────────────────────────
function formatDate(dateString: string) {
    const d = new Date(dateString);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear() + 543;
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${h}:${m}`;
}

// ─── Linked Banks Inline (used in table row) ─────────
function LinkedBanksInline({ banks }: { banks: LinkedBank[] }) {
    const [open, setOpen] = useState(false);
    if (!banks || banks.length === 0)
        return <span className="text-gray-300 text-xs">—</span>;
    return (
        <div>
            <button onClick={() => setOpen(o => !o)}
                className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full hover:bg-green-100 transition-colors font-medium">
                <BookOpen size={11} /> {banks.length} ชุดข้อสอบ
                {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {open && (
                <div className="mt-1.5 space-y-1">
                    {banks.map(b => (
                        <Link key={b.item_bank_id} href={`/admin/manage_examset/${b.item_bank_id}`}
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline">
                            <ExternalLink size={10} />
                            <span className="truncate max-w-[180px]">{b.bank_name}</span>
                            {!b.is_active && <span className="text-gray-400">(ปิด)</span>}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Category Card ────────────────────────────────────
const PALETTE = [
    'from-green-400 to-emerald-500',
    'from-blue-400 to-indigo-500',
    'from-purple-400 to-fuchsia-500',
    'from-orange-400 to-amber-500',
    'from-rose-400 to-pink-500',
    'from-teal-400 to-cyan-500',
];

function CategoryCard({
    category, idx,
    onEdit, onDelete,
}: { category: Category; idx: number; onEdit: (c: Category) => void; onDelete: (id: number, name: string) => void; }) {
    const [expanded, setExpanded] = useState(false);
    const banks = category.item_banks ?? [];
    const gradient = PALETTE[idx % PALETTE.length];

    return (
        <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
            {/* Gradient band */}
            <div className={`h-1.5 bg-gradient-to-r ${gradient}`} />

            <div className="p-5 flex flex-col flex-1 gap-3">
                {/* Name + actions */}
                <div className="flex items-start justify-between gap-2">
                    <h3 className="text-base font-semibold text-gray-900 leading-snug">{category.category_name}</h3>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(category)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit size={14} />
                        </button>
                        <button onClick={() => onDelete(category.category_id, category.category_name)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={14} />
                        </button>
                    </div>
                </div>
                {/* Description */}
                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                    {category.category_description || 'ไม่มีคำอธิบาย'}
                </p>
                {/* Linked banks */}
                <div className="mt-auto pt-2 border-t border-gray-100">
                    <button onClick={() => setExpanded(e => !e)}
                        className="w-full flex items-center justify-between text-xs font-medium text-gray-600 hover:text-gray-800 transition-colors">
                        <span className="flex items-center gap-1.5">
                            <Tag size={13} className="text-gray-400" />
                            {banks.length > 0 ? `${banks.length} ชุดข้อสอบที่เชื่อมโยง` : 'ยังไม่มีชุดข้อสอบ'}
                        </span>
                        {banks.length > 0 && (expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />)}
                    </button>
                    {expanded && banks.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                            {banks.map(b => (
                                <Link key={b.item_bank_id} href={`/admin/manage_examset/${b.item_bank_id}`}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 hover:bg-green-50 text-xs text-gray-700 hover:text-green-700 transition-colors group/bank">
                                    <ExternalLink size={11} className="shrink-0 text-gray-400 group-hover/bank:text-green-500" />
                                    <span className="truncate font-medium">{b.bank_name}</span>
                                    {!b.is_active && (
                                        <span className="ml-auto shrink-0 text-gray-400 text-[10px]">ปิด</span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
                {/* Date */}
                <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                    <Calendar size={11} />
                    {formatDate(category.created_at)}
                </div>
            </div>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────
export default function CategoriesManagement() {
    const { getToken } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
    const [viewMode, setViewMode] = useState<'table' | 'card'>('table');

    // Modal
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryName, setCategoryName] = useState('');
    const [categoryDesc, setCategoryDesc] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const authHeaders = useCallback(() => ({
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
    }), [getToken]);

    const fetchCategories = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/with-banks`, {
                headers: authHeaders(), credentials: 'include',
            });
            if (!res.ok) throw new Error();
            const data = await res.json();
            setCategories(Array.isArray(data) ? data : []);
        } catch {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถดึงข้อมูลได้', confirmButtonColor: '#ef4444' });
        } finally { setLoading(false); }
    }, [authHeaders]);

    useEffect(() => {
        const saved = localStorage.getItem('category_viewmode') as 'table' | 'card' | null;
        if (saved) setViewMode(saved);
        fetchCategories();
    }, [fetchCategories]);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, sortOrder, viewMode]);

    function switchView(mode: 'table' | 'card') {
        setViewMode(mode);
        localStorage.setItem('category_viewmode', mode);
    }

    const handleDelete = async (id: number, name: string) => {
        const result = await Swal.fire({
            title: 'คุณแน่ใจหรือไม่?',
            text: `ต้องการลบ "${name}"?`,
            icon: 'warning', showCancelButton: true,
            confirmButtonColor: '#ef4444', cancelButtonColor: '#6b7280',
            confirmButtonText: 'ใช่, ลบเลย!', cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;
        try {
            const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE', headers: authHeaders(), credentials: 'include' });
            if (!res.ok) throw new Error();
            await Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: 'ลบประเภทข้อสอบสำเร็จ', timer: 1500, showConfirmButton: false });
            fetchCategories();
        } catch {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถลบได้', confirmButtonColor: '#ef4444' });
        }
    };

    const openCreate = () => { setEditingCategory(null); setCategoryName(''); setCategoryDesc(''); setShowModal(true); };
    const openEdit = (cat: Category) => { setEditingCategory(cat); setCategoryName(cat.category_name); setCategoryDesc(cat.category_description); setShowModal(true); };

    const submitCategory = async () => {
        if (!categoryName.trim()) {
            return Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูล', text: 'กรุณากรอกชื่อประเภทข้อสอบ' });
        }
        setSubmitting(true);
        try {
            const url = editingCategory ? `${API_URL}/${editingCategory.category_id}` : API_URL;
            const method = editingCategory ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method, headers: authHeaders(), credentials: 'include',
                body: JSON.stringify({ category_name: categoryName, category_description: categoryDesc }),
            });
            if (!res.ok) throw new Error();
            await Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: editingCategory ? 'แก้ไขสำเร็จ' : 'สร้างสำเร็จ', timer: 1500, showConfirmButton: false });
            setShowModal(false);
            fetchCategories();
        } catch {
            Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถบันทึกได้' });
        } finally { setSubmitting(false); }
    };

    // Filter + sort
    const filtered = categories
        .filter(c =>
            c.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (c.category_description || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
            return sortOrder === 'desc' ? -diff : diff;
        });

    const perPage = viewMode === 'card' ? ITEMS_PER_CARD : ITEMS_PER_TABLE;
    const totalPages = Math.ceil(filtered.length / perPage);
    const currentItems = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

    const Pagination = () => {
        if (totalPages <= 1) return null;
        return (
            <div className="flex items-center justify-end gap-2 mt-6">
                <button disabled={currentPage === 1}
                    onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0 }); }}
                    className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                    <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => { setCurrentPage(p); window.scrollTo({ top: 0 }); }}
                        className={`w-9 h-9 text-sm font-medium border rounded-lg transition-colors ${p === currentPage
                            ? 'bg-green-600 text-white border-green-600'
                            : 'text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                        {p}
                    </button>
                ))}
                <button disabled={currentPage === totalPages}
                    onClick={() => { setCurrentPage(p => p + 1); window.scrollTo({ top: 0 }); }}
                    className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
                    <ChevronRight size={16} />
                </button>
            </div>
        );
    };

    return (
        <Navbar_admin>
            <div className="max-w-6xl mx-auto px-4 py-6" suppressHydrationWarning>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">จัดการประเภทข้อสอบ</h1>
                            <p className="text-sm text-gray-500">เพิ่ม แก้ไข ลบ และดูชุดข้อสอบที่เชื่อมโยง · {filtered.length} รายการ</p>
                        </div>
                        <button onClick={openCreate}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all hover:shadow-md">
                            <Plus size={18} /> เพิ่มประเภทข้อสอบใหม่
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center bg-white p-4  rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex gap-3 flex-1 flex-wrap">
                        <div className="relative max-w-sm w-full">
                            <input type="text" placeholder="ค้นหาประเภทข้อสอบ..." value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-green-500 focus:border-green-500 bg-gray-50" />
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                        <button onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium">
                            <ArrowUpDown size={15} />
                            {sortOrder === 'desc' ? 'ใหม่สุด' : 'เก่าสุด'}
                        </button>
                    </div>

                    {/* View toggle */}
                    <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
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

                {/* Content */}
                {loading ? (
                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
                        <div className="bg-gray-100 px-5 py-3.5 grid gap-6 border-b border-gray-200" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-3 w-16 animate-pulse rounded bg-gray-200" />
                            ))}
                        </div>
                        <div className="divide-y divide-gray-100">
                            {[1, 2, 3, 4, 5].map((r) => (
                                <div key={r} className="px-5 py-4 grid gap-6 items-center" style={{ gridTemplateColumns: "repeat(4, 1fr)" }}>
                                    {[1, 2, 3, 4].map((c) => (
                                        <div key={c} className={`h-3.5 animate-pulse rounded bg-gray-200 ${c === 1 ? "w-3/4" : "w-1/2"}`} />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : viewMode === 'table' ? (

                    /* ── TABLE VIEW ── */
                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-green-600 text-white">
                                    <tr>
                                        {['#', 'ชื่อประเภทข้อสอบ', 'คำอธิบาย', 'ชุดข้อสอบที่เชื่อมโยง', 'วันที่สร้าง', 'จัดการ'].map((h, i) => (
                                            <th key={h}
                                                className={`px-5 py-3 text-left text-xs font-semibold tracking-wide ${i === 0 ? 'w-12 text-center rounded-tl-2xl' : ''} ${i === 5 ? 'text-center rounded-tr-2xl' : ''}`}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="py-16 text-center text-gray-400">
                                                {searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีประเภทข้อสอบ'}
                                            </td>
                                        </tr>
                                    ) : currentItems.map((cat, idx) => (
                                        <tr key={cat.category_id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3.5 text-sm text-gray-400 text-center">
                                                {(currentPage - 1) * perPage + idx + 1}
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="text-sm font-semibold text-gray-900">{cat.category_name}</div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="text-xs text-gray-500 max-w-xs truncate">{cat.category_description || '—'}</div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <LinkedBanksInline banks={cat.item_banks ?? []} />
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(cat.created_at)}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => openEdit(cat)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="แก้ไข">
                                                        <Edit size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(cat.category_id, cat.category_name)}
                                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="ลบ">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 py-4 border-t border-gray-100">
                            <Pagination />
                        </div>
                    </div>

                ) : (

                    /* ── CARD VIEW ── */
                    <>
                        {currentItems.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
                                <LayoutGrid size={40} className="mb-3 opacity-40" />
                                <p>{searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีประเภทข้อสอบ'}</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                                {currentItems.map((cat, i) => (
                                    <CategoryCard key={cat.category_id} category={cat} idx={i}
                                        onEdit={openEdit} onDelete={handleDelete} />
                                ))}
                            </div>
                        )}
                        <Pagination />
                    </>
                )}
            </div>

            {/* ─── Create / Edit Modal ─── */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full">
                        <div className="bg-green-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                            <h3 className="text-lg font-bold text-white">
                                {editingCategory ? 'แก้ไขประเภทข้อสอบ' : 'เพิ่มประเภทข้อสอบใหม่'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
                                <X size={20} className="text-white" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    ชื่อประเภทข้อสอบ <span className="text-red-500">*</span>
                                </label>
                                <input type="text" value={categoryName} onChange={e => setCategoryName(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                                    placeholder="เช่น เภสัชวิทยา" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">คำอธิบาย</label>
                                <textarea value={categoryDesc} onChange={e => setCategoryDesc(e.target.value)}
                                    className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm"
                                    rows={3} placeholder="อธิบายเกี่ยวกับประเภทข้อสอบนี้" />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                            <button onClick={() => setShowModal(false)} disabled={submitting}
                                className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 font-medium transition-colors text-sm">
                                ยกเลิก
                            </button>
                            <button onClick={submitCategory} disabled={submitting}
                                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium flex items-center gap-2 transition-colors disabled:opacity-50 text-sm">
                                {submitting && <Loader2 size={16} className="animate-spin" />}
                                {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Navbar_admin>
    );
}
