"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar_admin from "@/components/Navbar_admin";
import LoadingSpinner from "@/components/LoadingSpinner";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/contexts/AuthContext";
import SuggestInput from '@/components/SuggestInput';
import {
  Receipt,
  Search,
  ChevronLeft,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  Landmark,
  Users,
  Banknote,
  ShieldAlert,
} from "lucide-react";

const PER_PAGE = 10;

type SubscriptionRow = {
  id: number;
  status: "pending" | "successful" | "failed";
  amount: number;
  method: "promptpay" | "truewallet";
  methodLabel: string;
  transactionRef: string | null;
  createdAt: string;
  expiresAt: string | null;
  isActive: boolean;
  user: {
    id: number;
    name: string;
    email: string;
    roleId: number;
    lastLoginAt: string | null;
  } | null;
};

const STATUS_STYLES: Record<string, { label: string; className: string; icon: any }> = {
  successful: {
    label: "สำเร็จ",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    icon: CheckCircle2,
  },
  pending: {
    label: "รอตรวจสอบ",
    className: "bg-amber-50 text-amber-700 border-amber-200",
    icon: Clock,
  },
  failed: {
    label: "ไม่สำเร็จ",
    className: "bg-rose-50 text-rose-700 border-rose-200",
    icon: XCircle,
  },
};

const formatDateTime = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("th-TH", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

export default function SuperSubscriptionsPage() {
  const { user, getToken, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [rows, setRows] = useState<SubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "successful" | "pending" | "failed">("all");
  const [page, setPage] = useState(1);

  // ชั้นป้องกันซ้ำ — admin/layout ปล่อย role 2 เข้ามาได้ หน้านี้ต้อง role 3 เท่านั้น
  useEffect(() => {
    if (!authLoading && user && user.role_id !== 3) {
      router.replace("/admin");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const load = async () => {
      if (!user || user.role_id !== 3) return;
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/payment/admin/subscriptions`,
          { headers: { Authorization: `Bearer ${getToken()}` } },
        );
        if (!res.ok) throw new Error("ไม่สามารถดึงข้อมูลการชำระเงินได้");
        setRows(await res.json());
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, getToken]);

  const stats = useMemo(() => {
    const successful = rows.filter((r) => r.status === "successful");
    return {
      totalRevenue: successful.reduce((sum, r) => sum + Number(r.amount), 0),
      totalPaid: successful.length,
      activeNow: rows.filter((r) => r.isActive).length,
      uniqueUsers: new Set(successful.map((r) => r.user?.id).filter(Boolean)).size,
    };
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchStatus = statusFilter === "all" || r.status === statusFilter;
      const matchQuery =
        !q ||
        r.user?.name.toLowerCase().includes(q) ||
        r.user?.email.toLowerCase().includes(q) ||
        r.transactionRef?.toLowerCase().includes(q);
      return matchStatus && matchQuery;
    });
  }, [rows, query, statusFilter]);

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));

  const downloadReceipt = async (id: number) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/payment/receipt/${id}`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      if (!res.ok) throw new Error("ไม่สามารถดาวน์โหลดใบเสร็จได้");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(err.message || "ดาวน์โหลดใบเสร็จไม่สำเร็จ");
    }
  };

  if (authLoading || (user && user.role_id !== 3)) {
    return (
      <Navbar_admin>
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="lg" text="กำลังตรวจสอบสิทธิ์..." />
        </div>
      </Navbar_admin>
    );
  }

  return (
    <Navbar_admin>
      <div className="max-w-7xl mx-auto w-full space-y-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> กลับสู่หน้าแดชบอร์ด
        </Link>

        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900">
              ประวัติการชำระเงิน
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              รายการชำระเงินของผู้ใช้ทุกคน พร้อมสถานะสิทธิ์และการเข้าใช้งานล่าสุด
            </p>
          </div>
        </div>

        {/* สถิติรวม */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "รายได้รวม", value: `${stats.totalRevenue.toLocaleString()} ฿`, icon: Banknote, color: "text-emerald-600 bg-emerald-50" },
            { label: "ชำระสำเร็จ", value: `${stats.totalPaid} รายการ`, icon: CheckCircle2, color: "text-indigo-600 bg-indigo-50" },
            { label: "สิทธิ์ที่ยังใช้งานได้", value: `${stats.activeNow} รายการ`, icon: ShieldAlert, color: "text-amber-600 bg-amber-50" },
            { label: "ผู้ใช้ที่จ่ายเงิน", value: `${stats.uniqueUsers} คน`, icon: Users, color: "text-sky-600 bg-sky-50" },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${s.color}`}>
                <s.icon className="w-4.5 h-4.5" />
              </div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="text-lg font-medium text-gray-900 mt-0.5">{s.value}</p>
            </div>
          ))}
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl p-4">
            {error}
          </div>
        )}

        {/* ตัวกรอง */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-600" />
              <SuggestInput
                value={query}
                aria-label="ค้นหาชื่อ อีเมล หรือรหัสอ้างอิงธุรกรรม"
                onValueChange={(v) => {
                  setQuery(v);
                  setPage(1);
                }}
                suggestions={rows.flatMap((r) => [r.user?.name, r.user?.email, r.transactionRef])}
                placeholder="ค้นหาชื่อ อีเมล หรือรหัสอ้างอิงธุรกรรม..."
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
            <div className="flex gap-1.5">
              {[
                { value: "all", label: "ทั้งหมด" },
                { value: "successful", label: "สำเร็จ" },
                { value: "pending", label: "รอตรวจสอบ" },
                { value: "failed", label: "ไม่สำเร็จ" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setStatusFilter(opt.value as typeof statusFilter);
                    setPage(1);
                  }}
                  className={`px-3 py-2 text-sm font-medium rounded-xl transition cursor-pointer ${
                    statusFilter === opt.value
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ตาราง */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner size="md" text="กำลังโหลดข้อมูล..." />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-sm text-gray-600">
              ไม่พบรายการที่ตรงกับเงื่อนไข
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[820px]">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100 text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4 font-medium">ผู้ใช้งาน</th>
                      <th className="py-3.5 px-4 font-medium">ยอด / ช่องทาง</th>
                      <th className="py-3.5 px-4 font-medium">สถานะ</th>
                      <th className="py-3.5 px-4 font-medium">วันที่ชำระ</th>
                      <th className="py-3.5 px-4 font-medium">หมดอายุ</th>
                      <th className="py-3.5 px-4 font-medium">เข้าใช้ล่าสุด</th>
                      <th className="py-3.5 px-4 font-medium">ใบเสร็จ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                    {paginated.map((row) => {
                      const status = STATUS_STYLES[row.status];
                      const MethodIcon = row.method === "truewallet" ? Wallet : Landmark;
                      return (
                        <tr key={row.id} className="hover:bg-gray-50/60 transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-medium text-gray-900">{row.user?.name || "-"}</p>
                            <p className="text-xs text-gray-600">{row.user?.email || "-"}</p>
                          </td>
                          <td className="py-3.5 px-4">
                            <p className="font-medium text-gray-900">
                              {Number(row.amount).toLocaleString()} ฿
                            </p>
                            <p className="text-xs text-gray-600 flex items-center gap-1">
                              <MethodIcon className="w-3 h-3" /> {row.methodLabel}
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${status.className}`}
                            >
                              <status.icon className="w-3.5 h-3.5" />
                              {status.label}
                            </span>
                            {row.isActive && (
                              <span className="block text-[0.6875rem] text-emerald-600 mt-1">
                                กำลังใช้งานอยู่
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 text-xs">
                            {formatDateTime(row.createdAt)}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 text-xs">
                            {formatDateTime(row.expiresAt)}
                          </td>
                          <td className="py-3.5 px-4 text-gray-600 text-xs">
                            {formatDateTime(row.user?.lastLoginAt ?? null)}
                          </td>
                          <td className="py-3.5 px-4">
                            {row.status === "successful" ? (
                              <button
                                onClick={() => downloadReceipt(row.id)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50 hover:text-indigo-600 transition cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" /> PDF
                              </button>
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="px-4">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  totalItems={filtered.length}
                  perPage={PER_PAGE}
                  onPageChange={setPage}
                  itemLabel="รายการ"
                  activeColor="bg-indigo-600 text-white shadow-xs"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Navbar_admin>
  );
}
