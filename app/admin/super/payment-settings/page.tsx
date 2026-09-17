"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Navbar_admin from "@/components/Navbar_admin";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Settings2,
  ChevronLeft,
  Save,
  CheckCircle2,
  AlertTriangle,
  Power,
} from "lucide-react";

// ต้นทุนจริงของระบบ ใช้เป็นตัวช่วยคำนวณราคาแนะนำในหน้านี้
const HOSTING_PER_MONTH = 185;
const DOMAIN_PER_YEAR = 500;
const SUGGESTED_PRICE = HOSTING_PER_MONTH * 12 + DOMAIN_PER_YEAR;

export default function PaymentSettingsPage() {
  const { user, getToken, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [annualPrice, setAnnualPrice] = useState<string>("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);

  useEffect(() => {
    if (!authLoading && user && user.role_id !== 3) {
      router.replace("/admin");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const load = async () => {
      if (!user || user.role_id !== 3) return;
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/settings`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (!res.ok) throw new Error("ไม่สามารถโหลดการตั้งค่าได้");
        const data = await res.json();
        setAnnualPrice(String(data.annualPrice));
        setIsEnabled(data.isEnabled);
      } catch (err: any) {
        setError(err.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, getToken]);

  const handleSave = async () => {
    const price = Number(annualPrice);
    if (!Number.isFinite(price) || price < 1) {
      setError("กรุณากรอกราคาให้ถูกต้อง (ต้องมากกว่า 0 บาท)");
      return;
    }
    try {
      setSaving(true);
      setError(null);
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/settings`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ annualPrice: price, isEnabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "บันทึกไม่สำเร็จ");
      setSavedAt(new Date());
    } catch (err: any) {
      setError(err.message || "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading || (user && user.role_id !== 3)) {
    return (
      <Navbar_admin>
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="lg" text="กำลังโหลดการตั้งค่า..." />
        </div>
      </Navbar_admin>
    );
  }

  return (
    <Navbar_admin>
      <div className="max-w-3xl mx-auto w-full space-y-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 text-sm font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> กลับสู่หน้าแดชบอร์ด
        </Link>

        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <Settings2 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900">
              ตั้งค่าระบบชำระเงิน
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              กำหนดราคาสิทธิ์ผู้ดูแลระบบรายปี และเปิด/ปิดการรับชำระเงิน
            </p>
          </div>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {savedAt && !error && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4 text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>
              บันทึกการตั้งค่าเรียบร้อยแล้ว เมื่อ{" "}
              {savedAt.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} น.
            </span>
          </div>
        )}

        {/* ราคา */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
          <div>
            <h2 className="text-base font-medium text-gray-800">ราคาสิทธิ์ผู้ดูแลระบบ</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              ราคานี้จะแสดงในหน้าอัปเกรดสิทธิ์และใช้ตรวจสอบยอดเงินในสลิปทันทีที่บันทึก
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              value={annualPrice}
              onChange={(e) => setAnnualPrice(e.target.value)}
              className="w-44 px-4 py-3 border border-gray-200 rounded-xl text-lg font-semibold text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <span className="text-sm text-gray-500">บาท / ปี</span>
          </div>

          <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 text-xs text-gray-600 space-y-1">
            <p className="font-medium text-gray-700">ราคาแนะนำจากต้นทุนจริง</p>
            <p>
              ค่า Hosting {HOSTING_PER_MONTH} บาท/เดือน × 12 ={" "}
              {(HOSTING_PER_MONTH * 12).toLocaleString()} บาท
            </p>
            <p>ค่า Domain {DOMAIN_PER_YEAR.toLocaleString()} บาท/ปี</p>
            <p className="pt-1 border-t border-gray-200 mt-1.5">
              รวม <span className="font-semibold text-gray-900">{SUGGESTED_PRICE.toLocaleString()} บาท/ปี</span>{" "}
              <button
                type="button"
                onClick={() => setAnnualPrice(String(SUGGESTED_PRICE))}
                className="ml-1 text-indigo-600 hover:text-indigo-700 font-medium underline cursor-pointer"
              >
                ใช้ราคานี้
              </button>
            </p>
          </div>
        </div>



        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition shadow-sm cursor-pointer"
        >
          <Save className="w-4 h-4" />
          {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
        </button>
      </div>
    </Navbar_admin>
  );
}
