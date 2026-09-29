'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Navbar_admin from "@/components/Navbar_admin";
import {
    Plus, Search, ChevronLeft, ChevronRight, ArrowUpDown,
    Trash2, X, Loader2, LayoutGrid, List,
    BookOpen, Calendar, ExternalLink, Tag, ChevronDown, ChevronUp,
    Edit2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Swal from "@/utils/sweetalert";
import { useAuth } from "@/contexts/AuthContext";
import Pagination from "@/components/Pagination";

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
function LinkedBanksDropdown({ banks }: { banks: LinkedBank[] }) {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    if (!banks || banks.length === 0) {
        return <span className="text-xs text-gray-400">ไม่มีชุดข้อสอบ</span>;
    }
    return (
        <div className="relative">
            <button onClick={() => setOpen(o => !o)}
                className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-0.5 rounded-full hover:bg-green-100 transition-colors font-medium cursor-pointer">
                <BookOpen size={11} /> {banks.length} ชุดข้อสอบ
                {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
            {open && (
                <div className="mt-1.5 space-y-1">
                    {banks.map(b => (
                        <button
                            key={b.item_bank_id}
                            onClick={() => {
                                if (typeof window !== 'undefined') {
                                    sessionStorage.setItem('selected_item_bank_id', String(b.item_bank_id));
                                }
                                router.push('/admin/manage_examset/detail');
                            }}
                            className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 hover:underline cursor-pointer text-left"
                        >
                            <ExternalLink size={10} />
                            <span className="truncate max-w-[180px]">{b.bank_name}</span>
                            {!b.is_active && <span className="text-gray-400">(ปิด)</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─── Category Card ────────────────────────────────────
const PALETTE = [
    'from-green-400 to-green-500',
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
    const router = useRouter();
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
                    <h3 className="text-base font-medium text-gray-900 leading-snug">{category.category_name}</h3>
                    <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(category)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="แก้ไข">
                            <Edit2 size={14} />
                        </button>
                        <button onClick={() => onDelete(category.category_id, category.category_name)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="ลบ">
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
                                <button
                                    key={b.item_bank_id}
                                    onClick={() => {
                                        if (typeof window !== 'undefined') {
                                            sessionStorage.setItem('selected_item_bank_id', String(b.item_bank_id));
                                        }
                                        router.push('/admin/manage_examset/detail');
                                    }}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gray-50 hover:bg-green-50 text-xs text-gray-700 hover:text-green-700 transition-colors group/bank cursor-pointer text-left"
                                >
                                    <ExternalLink size={11} className="shrink-0 text-gray-400 group-hover/bank:text-green-500" />
                                    <span className="truncate font-medium">{b.bank_name}</span>
                                    {!b.is_active && (
                                        <span className="ml-auto shrink-0 text-gray-400 text-xs">ปิด</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {/* Date */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Calendar size={12} />
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
        const cat = categories.find(c => c.category_id === id);
        const linkedCount = cat?.item_banks?.length ?? 0;

        const result = await Swal.fire({
            title: 'ยืนยันการลบประเภทข้อสอบ',
            html: linkedCount > 0
                ? `<div class="text-left text-sm text-gray-600 space-y-2">
                     <p>ต้องการลบประเภท <b>"${name}"</b> หรือไม่?</p>
                     <div class="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs leading-relaxed">
                       ⚠️ ประเภทนี้ผูกอยู่กับ <b>${linkedCount} ชุดข้อสอบ</b> หากยืนยันการลบ ระบบจะปลดประเภทนี้ออกจากชุดข้อสอบเหล่านั้นทั้งหมดโดยอัตโนมัติ <i>(ชุดข้อสอบยังคงอยู่ ไม่ได้ถูกลบ)</i>
                     </div>
                   </div>`
                : `<p class="text-sm text-gray-600">ต้องการลบประเภท <b>"${name}"</b> หรือไม่?</p>`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ใช่, ลบเลย',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            const res = await fetch(`${API_URL}/${id}`, {
                method: 'DELETE',
                headers: authHeaders(),
                credentials: 'include'
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'ไม่สามารถลบได้');
            }

            await Swal.fire({
                icon: 'success',
                title: 'สำเร็จ!',
                text: 'ลบประเภทข้อสอบและปลดการผูกชุดข้อสอบเรียบร้อยแล้ว',
                timer: 1500,
                showConfirmButton: false
            });
            fetchCategories();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error?.message || 'ไม่สามารถลบได้',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    const openCreate = () => { setEditingCategory(null); setCategoryName(''); setCategoryDesc(''); setShowModal(true); };
    const openEdit = (cat: Category) => { setEditingCategory(cat); setCategoryName(cat.category_name); setCategoryDesc(cat.category_description); setShowModal(true); };

    const submitCategory = async () => {
        const trimmedName = categoryName.trim();
        if (!trimmedName) {
            return Swal.fire({ icon: 'warning', title: 'กรุณากรอกข้อมูล', text: 'กรุณากรอกชื่อประเภทข้อสอบ' });
        }

        // Check for duplicate name locally first
        const isDuplicate = categories.some(
            c => c.category_name.trim().toLowerCase() === trimmedName.toLowerCase() &&
                (!editingCategory || c.category_id !== editingCategory.category_id)
        );

        if (isDuplicate) {
            return Swal.fire({
                icon: 'warning',
                title: 'ชื่อประเภทข้อสอบซ้ำ',
                text: `ชื่อประเภทข้อสอบ "${trimmedName}" มีอยู่ในระบบแล้ว ไม่สามารถตั้งซ้ำได้`,
                confirmButtonColor: '#16a34a',
            });
        }

        setSubmitting(true);
        try {
            const url = editingCategory ? `${API_URL}/${editingCategory.category_id}` : API_URL;
            const method = editingCategory ? 'PATCH' : 'POST';
            const res = await fetch(url, {
                method, headers: authHeaders(), credentials: 'include',
                body: JSON.stringify({ category_name: trimmedName, category_description: categoryDesc.trim() }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || 'ไม่สามารถบันทึกได้');
            }

            await Swal.fire({ icon: 'success', title: 'สำเร็จ!', text: editingCategory ? 'แก้ไขสำเร็จ' : 'สร้างสำเร็จ', timer: 1500, showConfirmButton: false });
            setShowModal(false);
            fetchCategories();
        } catch (error: any) {
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error?.message || 'ไม่สามารถบันทึกได้',
                confirmButtonColor: '#ef4444'
            });
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

    return (
        <Navbar_admin>
            <div className="max-w-7xl mx-auto w-full space-y-6" suppressHydrationWarning>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">จัดการประเภทข้อสอบ</h1>
                            <p className="text-sm text-gray-500">เพิ่ม แก้ไข ลบ และดูชุดข้อสอบที่เชื่อมโยง · {filtered.length} รายการ</p>
                        </div>
                        <button onClick={openCreate}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all hover:shadow-md">
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
                                                className={`px-5 py-3 text-left text-sm font-medium tracking-wide ${i === 0 ? 'w-12 text-center rounded-tl-2xl' : ''} ${i === 5 ? 'text-center rounded-tr-2xl' : ''}`}>
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
                                                <div className="text-sm font-medium text-gray-900">{cat.category_name}</div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <div className="text-sm text-gray-500 max-w-xs truncate">{cat.category_description || '—'}</div>
                                            </td>
                                            <td className="px-5 py-3.5">
                                                <LinkedBanksDropdown banks={cat.item_banks ?? []} />
                                            </td>
                                            <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(cat.created_at)}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => openEdit(cat)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer" title="แก้ไข">
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button onClick={() => handleDelete(cat.category_id, cat.category_name)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer" title="ลบ">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="px-5 py-4">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                totalItems={filtered.length}
                                perPage={perPage}
                                onPageChange={setCurrentPage}
                                itemLabel="ประเภท"
                                className="mt-0 pt-0 border-t-0"
                            />
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
                        <Pagination
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalItems={filtered.length}
                            perPage={perPage}
                            onPageChange={setCurrentPage}
                            itemLabel="ประเภท"
                        />
                    </>
                )}
            </div>

            {/* ─── Create / Edit Modal ─── */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        <div className="border-b border-gray-100 px-4 sm:px-6 py-3.5 sm:py-4 flex justify-between items-center">
                            <h3 className="text-base font-medium text-gray-900">
                                {editingCategory ? 'แก้ไขประเภทข้อสอบ' : 'เพิ่มประเภทข้อสอบใหม่'}
                            </h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-600 p-1 rounded-lg cursor-pointer">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">
                                    ชื่อประเภทข้อสอบ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={categoryName}
                                    onChange={e => setCategoryName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                    placeholder="เช่น เภสัชวิทยา (Pharmacology)"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">คำอธิบาย</label>
                                <textarea
                                    value={categoryDesc}
                                    onChange={e => setCategoryDesc(e.target.value)}
                                    rows={3}
                                    className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                                    placeholder="คำอธิบายรายละเอียดประเภทข้อสอบ..."
                                />
                            </div>
                        </div>
                        <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                            <button
                                onClick={() => setShowModal(false)}
                                disabled={submitting}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={submitCategory}
                                disabled={submitting}
                                className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                            >
                                {submitting && <Loader2 size={14} className="animate-spin" />} บันทึก
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Navbar_admin>
    );
}
