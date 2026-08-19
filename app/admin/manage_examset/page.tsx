"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect } from "react";
import {
  Plus, Search, ChevronLeft, ChevronRight, ArrowUpDown,
  LayoutGrid, List, Clock, Tag, Calendar, CheckCircle, XCircle
} from "lucide-react";
import Link from "next/link";
import CreateItemBankModal from "./components/CreateItemBankModal";
import { useAuth } from "@/contexts/AuthContext";

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
  categories?: Category[];
}

// ─── Constants ───────────────────────────────────────
const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;
const ITEMS_PER_PAGE_TABLE = 8;
const ITEMS_PER_PAGE_CARD = 9;

// ─── Helpers ─────────────────────────────────────────
function formatDate(dateString: string) {
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
function BankCard({ bank }: { bank: ItemBank }) {
  const cats = bank.categories?.length
    ? bank.categories.map(c => c.category_name).join(", ")
    : "ไม่มีประเภท";

  return (
    <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col">
      {/* Top colour band */}
      <div className={`h-1.5 w-full ${bank.is_active ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gray-300"}`} />

      <div className="p-5 flex flex-col flex-1">
        {/* Status badge */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <h3 className="text-base font-semibold text-gray-900 leading-snug line-clamp-2">{bank.bank_name}</h3>
          <span className={`shrink-0 flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${bank.is_active
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-500"}`}>
            {bank.is_active
              ? <><CheckCircle size={11} /> เปิด</>
              : <><XCircle size={11} /> ปิด</>}
          </span>
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
            <span>{formatDate(bank.created_at)}</span>
          </div>
        </div>

        {/* CTA */}
        <Link
          href={`/admin/manage_examset/${bank.item_bank_id}`}
          className="mt-4 block w-full text-center bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2.5 rounded-xl transition-colors"
        >
          ดูรายละเอียด
        </Link>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────
function Page() {
  const { getToken } = useAuth();
  const [viewMode, setViewMode] = useState<"table" | "card">("table");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemBanks, setItemBanks] = useState<ItemBank[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Restore last view preference
  useEffect(() => {
    const saved = localStorage.getItem("examset_viewmode") as "table" | "card" | null;
    if (saved) setViewMode(saved);
    fetchItemBanks();
  }, []);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, sortOrder, viewMode]);

  const fetchItemBanks = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/items-bank`, {
        headers: { Authorization: `Bearer ${getToken()}` },
        credentials: "include",
      });
      if (res.ok) setItemBanks(await res.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  function switchView(mode: "table" | "card") {
    setViewMode(mode);
    localStorage.setItem("examset_viewmode", mode);
  }

  // Filter + sort
  const filtered = itemBanks
    .filter(b =>
      b.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      return sortOrder === "desc" ? -diff : diff;
    });

  const perPage = viewMode === "card" ? ITEMS_PER_PAGE_CARD : ITEMS_PER_PAGE_TABLE;
  const totalPages = Math.ceil(filtered.length / perPage);
  const currentItems = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Pagination
  const Pagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="flex items-center justify-end gap-2 mt-6">
        <button
          disabled={currentPage === 1}
          onClick={() => { setCurrentPage(p => p - 1); window.scrollTo({ top: 0 }); }}
          className="w-9 h-9 flex items-center justify-center border border-gray-300 rounded-lg disabled:opacity-40 hover:bg-gray-50">
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button key={p} onClick={() => { setCurrentPage(p); window.scrollTo({ top: 0 }); }}
            className={`w-9 h-9 text-sm font-medium border rounded-lg transition-colors ${p === currentPage
              ? "bg-green-600 text-white border-green-600"
              : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"}`}>
            {p}
          </button>
        ))}
        <button
          disabled={currentPage === totalPages}
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
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">คลังข้อสอบ</h1>
              <p className="text-sm text-gray-500">จัดการคลังข้อสอบ เพิ่ม แก้ไข ลบ · {filtered.length} รายการ</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all hover:shadow-md">
              <Plus size={18} /> สร้างข้อสอบใหม่
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex gap-3 flex-1 flex-wrap">
            {/* Search */}
            <div className="relative max-w-sm w-full">
              <input type="text" placeholder="ค้นหาคลังข้อสอบ..." value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-green-500 focus:border-green-500" />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            {/* Sort */}
            <button onClick={() => setSortOrder(s => s === "desc" ? "asc" : "desc")}
              className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 text-sm font-medium">
              <ArrowUpDown size={15} />
              {sortOrder === "desc" ? "ใหม่สุด" : "เก่าสุด"}
            </button>
          </div>

          {/* View toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            {(["table", "card"] as const).map(mode => (
              <button key={mode} onClick={() => switchView(mode)}
                title={mode === "table" ? "มุมมอง Table" : "มุมมอง Card"}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${viewMode === mode
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
          viewMode === "table" ? (
            <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
              <div className="bg-gray-100 px-5 py-3.5 grid gap-6 border-b border-gray-200" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                  <div key={i} className="h-3 w-16 animate-pulse rounded bg-gray-200" />
                ))}
              </div>
              <div className="divide-y divide-gray-100">
                {[1, 2, 3, 4, 5, 6].map((r) => (
                  <div key={r} className="px-5 py-4 grid gap-6 items-center" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                    {[1, 2, 3, 4, 5, 6, 7].map((c) => (
                      <div key={c} className={`h-3.5 animate-pulse rounded bg-gray-200 ${c === 1 ? "w-3/4" : "w-1/2"}`} />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
                  <div className="h-1.5 w-full bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                    <div className="h-2.5 w-full animate-pulse rounded bg-gray-200" />
                    <div className="h-2.5 w-5/6 animate-pulse rounded bg-gray-200" />
                    <div className="h-9 w-full animate-pulse rounded-xl bg-gray-200 mt-2" />
                  </div>
                </div>
              ))}
            </div>
          )
        ) : viewMode === "table" ? (

          /* ── TABLE VIEW ── */
          <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-green-600 text-white">
                  <tr>
                    {["#", "ชื่อข้อสอบ", "ระยะเวลา", "สถานะ", "วันที่สร้าง", "ประเภท", "จัดการ"].map((h, i) => (
                      <th key={h} className={`px-5 py-3 text-left text-xs font-semibold tracking-wide ${i === 0 ? "w-12 text-center rounded-tl-2xl" : ""} ${i === 6 ? "rounded-tr-2xl" : ""}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-gray-400">
                        {searchTerm ? "ไม่พบข้อมูลที่ค้นหา" : "ยังไม่มีคลังข้อสอบ"}
                      </td>
                    </tr>
                  ) : currentItems.map((bank, idx) => {
                    const cats = bank.categories?.length
                      ? bank.categories.map(c => c.category_name).join(", ")
                      : "ไม่มีประเภท";
                    return (
                      <tr key={bank.item_bank_id} className="hover:bg-gray-50 transition-colors">
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
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${bank.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"}`}>
                            {bank.is_active ? <CheckCircle size={11} /> : <XCircle size={11} />}
                            {bank.is_active ? "เปิด" : "ปิด"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">{formatDate(bank.created_at)}</td>
                        <td className="px-5 py-3.5 text-xs text-gray-500 max-w-[160px] truncate">{cats}</td>
                        <td className="px-5 py-3.5">
                          <Link href={`/admin/manage_examset/${bank.item_bank_id}`}
                            className="text-sm text-green-600 hover:text-green-800 font-medium hover:underline">
                            ดูรายละเอียด
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
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
                <p>{searchTerm ? "ไม่พบข้อมูลที่ค้นหา" : "ยังไม่มีคลังข้อสอบ"}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentItems.map(bank => <BankCard key={bank.item_bank_id} bank={bank} />)}
              </div>
            )}
            <Pagination />
          </>
        )}
      </div>

      <CreateItemBankModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchItemBanks}
      />
    </Navbar_admin>
  );
}

export default Page;