"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect } from "react";
import {
  Plus, Search, ChevronLeft, ChevronRight, ArrowUpDown,
  LayoutGrid, List, Clock, Tag, Calendar, CheckCircle, XCircle,
  Trash2, RotateCcw, Layers, Eye
} from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";
import CreateItemBankModal from "./components/CreateItemBankModal";
import { useAuth } from "@/contexts/AuthContext";
import Pagination from "@/components/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";

// ─── Types ───────────────────────────────────────────
interface Category {
  category_id: number;
  category_name: string;
  category_description: string;
}

interface ItemBank {
  item_bank_id: number;
  bank_name: string;
  description: string;
  duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  categories?: Category[];
  total_items?: number;
}

// ─── Constants ───────────────────────────────────────
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;
const ITEMS_PER_PAGE_TABLE = 8;
const ITEMS_PER_PAGE_CARD = 9;

// ─── Helpers ─────────────────────────────────────────
function formatDate(dateString?: string | null) {
  if (!dateString) return "—";
  const d = new Date(dateString);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear() + 543;
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${day}/${month}/${year} ${h}:${m}`;
}

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0 && m > 0) return `${h} ชม. ${m} นาที`;
  if (h > 0) return `${h} ชั่วโมง`;
  return `${m} นาที`;
}

// ─── Card component ───────────────────────────────────
function BankCard({
  bank,
  isDeletedView,
  onDelete,
  onRestore,
  onHardDelete
}: {
  bank: ItemBank;
  isDeletedView: boolean;
  onDelete?: (id: number, name: string) => void;
  onRestore?: (id: number, name: string) => void;
  onHardDelete?: (id: number, name: string) => void;
}) {
  const cats = bank.categories?.length
    ? bank.categories.map(c => c.category_name).join(", ")
    : "ไม่มีประเภท";

  return (
    <div className={`group bg-white border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col ${isDeletedView ? "border-amber-200 bg-amber-50/20" : "border-gray-200"}`}>
      {/* Top colour band */}
      <div className={`h-1.5 w-full ${isDeletedView ? "bg-amber-400" : bank.is_active ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gray-300"}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Status badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2">{bank.bank_name}</h3>
          {isDeletedView ? (
            <span className="shrink-0 flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700">
              <Trash2 size={11} /> ถูกลบแล้ว
            </span>
          ) : (
            <span className={`shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${bank.is_active
              ? "bg-green-100 text-green-700"
              : "bg-gray-100 text-gray-500"}`}>
              {bank.is_active
                ? <><CheckCircle size={11} /> เปิด</>
                : <><XCircle size={11} /> ปิด</>}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-gray-500 line-clamp-2 mb-4 leading-relaxed">{bank.description || "ไม่มีคำอธิบาย"}</p>

        {/* Meta */}
        <div className="mt-auto space-y-1.5">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={13} className="shrink-0 text-gray-400" />
            <span>{formatDuration(bank.duration)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Tag size={13} className="shrink-0 text-gray-400" />
            <span className="truncate">{cats}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Calendar size={13} className="shrink-0" />
            <span>สร้างเมื่อ: {formatDate(bank.created_at)}</span>
          </div>
          {isDeletedView && bank.deleted_at && (
            <div className="flex items-center gap-2 text-xs text-red-500 font-medium pt-1">
              <Trash2 size={13} className="shrink-0" />
              <span>ลบเมื่อ: {formatDate(bank.deleted_at)}</span>
            </div>
          )}
        </div>

        {/* CTA */}
        {isDeletedView ? (
          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => onRestore?.(bank.item_bank_id, bank.bank_name)}
              className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-colors cursor-pointer shadow-xs"
            >
              <RotateCcw size={14} />
              กู้คืนคลังข้อสอบ
            </button>
            <button
              onClick={() => onHardDelete?.(bank.item_bank_id, bank.bank_name)}
              title="ลบออกจากระบบอย่างถาวร"
              className="p-2.5 text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200 cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2">
            <Link
              href={`/admin/manage_examset/${bank.item_bank_id}`}
              className="flex-1 text-center bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
            >
              ดูรายละเอียด
            </Link>
            <button
              onClick={() => onDelete?.(bank.item_bank_id, bank.bank_name)}
              title="ลบคลังข้อสอบ (ย้ายไปถังขยะ)"
              className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-gray-200 hover:border-red-200 cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
function Page() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<"active" | "deleted">("active");
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemBanks, setItemBanks] = useState<ItemBank[]>([]);
  const [deletedBanks, setDeletedBanks] = useState<ItemBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Restore last view preference
  useEffect(() => {
    const saved = localStorage.getItem("examset_viewmode") as "table" | "card" | null;
    if (saved) setViewMode(saved);
    fetchAllData();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, sortOrder, viewMode, tab]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const [activeRes, deletedRes] = await Promise.all([
        fetch(`${API_URL}/items-bank`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        }),
        fetch(`${API_URL}/items-bank/deleted`, {
          headers: { Authorization: `Bearer ${token}` },
          credentials: "include",
        })
      ]);

      if (activeRes.ok) setItemBanks(await activeRes.json());
      if (deletedRes.ok) setDeletedBanks(await deletedRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // ── Soft Delete ──
  const handleDeleteBank = async (bankId: number, bankName: string) => {
    const result = await Swal.fire({
      title: 'ย้ายไปถังขยะ?',
      html: `คุณต้องการลบคลังข้อสอบ <b>"${bankName}"</b> ใช่หรือไม่?<br/><span class="text-xs text-gray-500 mt-2 block">คลังข้อสอบจะถูกย้ายไปยัง "คลังข้อสอบที่ลบแล้ว" และสามารถกู้คืนได้ทุกเมื่อ</span>`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ใช่, ย้ายไปถังขยะ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/items-bank/${bankId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` },
          credentials: 'include'
        });

        if (res.ok) {
          await Swal.fire({
            title: 'ย้ายไปถังขยะแล้ว!',
            text: 'คลังข้อสอบถูกย้ายไปยังแท็บที่ลบแล้วเรียบร้อย',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
          fetchAllData();
        } else {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'ไม่สามารถลบคลังข้อสอบได้');
        }
      } catch (error: any) {
        Swal.fire('เกิดข้อผิดพลาด!', error.message || 'ไม่สามารถลบคลังข้อสอบได้', 'error');
      }
    }
  };

  // ── Restore Bank ──
  const handleRestoreBank = async (bankId: number, bankName: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันการกู้คืน?',
      html: `คุณต้องการกู้คืนคลังข้อสอบ <b>"${bankName}"</b> พร้อมคำถามและสถานการณ์ทั้งหมดกลับมาใช้งานใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ใช่, กู้คืน',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/items-bank/${bankId}/restore`, {
          method: 'PATCH',
          headers: { Authorization: `Bearer ${getToken()}` },
          credentials: 'include'
        });

        if (res.ok) {
          await Swal.fire({
            title: 'กู้คืนสำเร็จ!',
            text: 'คลังข้อสอบถูกกู้คืนกลับมาพร้อมใช้งานแล้ว',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
          fetchAllData();
        } else {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'ไม่สามารถกู้คืนคลังข้อสอบได้');
        }
      } catch (error: any) {
        Swal.fire('เกิดข้อผิดพลาด!', error.message || 'ไม่สามารถกู้คืนได้', 'error');
      }
    }
  };

  // ── Hard Permanent Delete ──
  const handleHardDeleteBank = async (bankId: number, bankName: string) => {
    const result = await Swal.fire({
      title: 'ยืนยันลบถาวร?',
      html: `คุณต้องการลบคลังข้อสอบ <b>"${bankName}"</b> ออกจากฐานข้อมูลอย่างถาวรใช่หรือไม่?<br/><br/><span class="text-red-500 text-xs font-semibold">⚠️ การกระทำนี้ไม่สามารถกู้คืนได้อีกต่อไป</span>`,
      icon: 'error',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'ลบถาวร',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });

    if (result.isConfirmed) {
      try {
        const res = await fetch(`${API_URL}/items-bank/${bankId}/permanent`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getToken()}` },
          credentials: 'include'
        });

        if (res.ok) {
          await Swal.fire({
            title: 'ลบถาวรสำเร็จ!',
            text: 'คลังข้อสอบถูกลบออกจากฐานข้อมูลเรียบร้อยแล้ว',
            icon: 'success',
            timer: 1500,
            showConfirmButton: false
          });
          fetchAllData();
        } else {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'ไม่สามารถลบถาวรได้');
        }
      } catch (error: any) {
        Swal.fire('เกิดข้อผิดพลาด!', error.message || 'ไม่สามารถลบถาวรได้', 'error');
      }
    }
  };

  function switchView(mode: "table" | "card") {
    setViewMode(mode);
    localStorage.setItem("examset_viewmode", mode);
  }

  const activeList = tab === "active" ? itemBanks : deletedBanks;

  // Filter + sort
  const filtered = activeList
    .filter(b =>
      b.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const timeA = new Date(tab === "deleted" ? (a.deleted_at || a.updated_at) : a.created_at).getTime();
      const timeB = new Date(tab === "deleted" ? (b.deleted_at || b.updated_at) : b.created_at).getTime();
      return sortOrder === "desc" ? timeB - timeA : timeA - timeB;
    });

  const perPage = viewMode === "card" ? ITEMS_PER_PAGE_CARD : ITEMS_PER_PAGE_TABLE;
  const totalPages = Math.ceil(filtered.length / perPage);
  const currentItems = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  return (
    <Navbar_admin>
      <div className="max-w-6xl mx-auto px-4 py-6" suppressHydrationWarning>

        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">คลังข้อสอบ</h1>
              <p className="text-sm text-gray-500">จัดการคลังข้อสอบ เพิ่ม แก้ไข ลบ และกู้คืนข้อมูล</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all hover:shadow-md cursor-pointer">
              <Plus size={18} /> สร้างข้อสอบใหม่
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex items-center gap-2 mb-4 border-b border-gray-200 pb-3">
          <button
            onClick={() => setTab("active")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${tab === "active"
              ? "bg-green-600 text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Layers size={16} />
            <span>คลังข้อสอบทั้งหมด</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${tab === "active" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-700"}`}>
              {itemBanks.length}
            </span>
          </button>

          <button
            onClick={() => setTab("deleted")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all cursor-pointer ${tab === "deleted"
              ? "bg-amber-600 text-white shadow-xs"
              : "text-gray-600 hover:bg-gray-100"}`}
          >
            <Trash2 size={16} />
            <span>คลังข้อสอบที่ลบไปแล้ว</span>
            <span className={`px-2 py-0.5 text-xs rounded-full ${tab === "deleted" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"}`}>
              {deletedBanks.length}
            </span>
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex gap-3 flex-1 flex-wrap">
            {/* Search */}
            <div className="relative max-w-sm w-full">
              <input type="text" placeholder={tab === "deleted" ? "ค้นหาคลังที่ถูกลบ..." : "ค้นหาคลังข้อสอบ..."} value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            {/* Sort */}
            <button onClick={() => setSortOrder(s => s === "desc" ? "asc" : "desc")}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium cursor-pointer">
              <ArrowUpDown size={15} />
              {sortOrder === "desc" ? (tab === "deleted" ? "ลบล่าสุด" : "ใหม่สุด") : (tab === "deleted" ? "ลบนานสุด" : "เก่าสุด")}
            </button>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            {(["table", "card"] as const).map(mode => (
              <button key={mode} onClick={() => switchView(mode)}
                title={mode === "table" ? "มุมมอง Table" : "มุมมอง Card"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${viewMode === mode
                  ? "bg-white shadow-sm text-green-700"
                  : "text-gray-500 hover:text-gray-700"}`}>
                {mode === "table" ? <List size={16} /> : <LayoutGrid size={16} />}
                {mode === "table" ? "ตาราง" : "การ์ด"}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-16 flex items-center justify-center">
            <LoadingSpinner size="lg" text="กำลังโหลดคลังข้อสอบ..." />
          </div>
        ) : viewMode === "table" ? (

          /* ── TABLE VIEW ── */
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className={tab === "deleted" ? "bg-amber-600 text-white" : "bg-green-600 text-white"}>
                  <tr>
                    {["#", "ชื่อข้อสอบ", "ระยะเวลา", tab === "deleted" ? "วันที่ลบ" : "สถานะ", "วันที่สร้าง", "ประเภท", "จัดการ"].map((h, i) => (
                      <th key={h} className={`px-5 py-3 text-left text-xs font-semibold tracking-wide ${i === 0 ? "w-12 text-center rounded-tl-2xl" : ""} ${i === 6 ? "rounded-tr-2xl" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-gray-400">
                        {searchTerm ? "ไม่พบข้อมูลที่ค้นหา" : tab === "deleted" ? "ไม่มีคลังข้อสอบที่ถูกลบ" : "ยังไม่มีคลังข้อสอบ"}
                      </td>
                    </tr>
                  ) : currentItems.map((bank, idx) => {
                    const cats = bank.categories?.length
                      ? bank.categories.map(c => c.category_name).join(", ")
                      : "ไม่มีประเภท";
                    return (
                      <tr key={bank.item_bank_id} className={`transition-colors ${tab === "deleted" ? "hover:bg-amber-50/40" : "hover:bg-gray-50"}`}>
                        <td className="px-5 py-3.5 text-sm text-gray-500 text-center">
                          {(currentPage - 1) * perPage + idx + 1}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="text-sm font-medium text-gray-900">{bank.bank_name}</div>
                          <div className="text-xs text-gray-400 truncate max-w-xs" title={bank.description}>
                            {bank.description?.substring(0, 50) || "—"}{bank.description?.length > 50 ? "…" : ""}
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{formatDuration(bank.duration)}</td>
                        <td className="px-5 py-3.5">
                          {tab === "deleted" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-700">
                              <Trash2 size={11} /> {formatDate(bank.deleted_at)}
                            </span>
                          ) : (
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${bank.is_active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"}`}>
                              {bank.is_active ? <CheckCircle size={11} /> : <XCircle size={11} />}
                              {bank.is_active ? "เปิด" : "ปิด"}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(bank.created_at)}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500 max-w-[160px] truncate">{cats}</td>
                        <td className="px-5 py-3.5">
                          {tab === "deleted" ? (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleRestoreBank(bank.item_bank_id, bank.bank_name)}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                                title="กู้คืนคลังข้อสอบ"
                              >
                                <RotateCcw size={13} />
                                <span>กู้คืน</span>
                              </button>
                              <button
                                onClick={() => handleHardDeleteBank(bank.item_bank_id, bank.bank_name)}
                                className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200 cursor-pointer"
                                title="ลบออกจากระบบอย่างถาวร"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/admin/manage_examset/${bank.item_bank_id}`}
                                title="ดูรายละเอียดคลังข้อสอบ"
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                              >
                                <Eye size={16} />
                              </Link>
                              <button
                                onClick={() => handleDeleteBank(bank.item_bank_id, bank.bank_name)}
                                title="ลบคลังข้อสอบ"
                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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
                itemLabel="ชุดข้อสอบ"
                activeColor={tab === "deleted" ? "bg-amber-600 text-white shadow-xs" : "bg-green-600 text-white shadow-xs"}
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
                <p>{searchTerm ? "ไม่พบข้อมูลที่ค้นหา" : tab === "deleted" ? "ไม่มีคลังข้อสอบที่ถูกลบ" : "ยังไม่มีคลังข้อสอบ"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentItems.map(bank => (
                  <BankCard
                    key={bank.item_bank_id}
                    bank={bank}
                    isDeletedView={tab === "deleted"}
                    onDelete={handleDeleteBank}
                    onRestore={handleRestoreBank}
                    onHardDelete={handleHardDeleteBank}
                  />
                ))}
              </div>
            )}
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              perPage={perPage}
              onPageChange={setCurrentPage}
              itemLabel="ชุดข้อสอบ"
              activeColor={tab === "deleted" ? "bg-amber-600 text-white shadow-xs" : "bg-green-600 text-white shadow-xs"}
            />
          </>
        )}
      </div>

      <CreateItemBankModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchAllData}
      />
    </Navbar_admin>
  );
}

export default Page;