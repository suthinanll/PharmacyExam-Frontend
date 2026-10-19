"use client";

import { useEffect, useMemo, useState } from "react";
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
  Receipt,
  TrendingUp,
  Info,
} from "lucide-react";

/**
 * ต้นทุนจริงของระบบต่อปี (บาท) — ใช้แสดงรายละเอียดและคำนวณความคุ้มทุนในหน้านี้เท่านั้น
 * ราคาอ้างอิง ต.ค. 2569 (USD ≈ 35 บาท, EUR ≈ 38 บาท) ถ้าต้นทุนเปลี่ยนให้แก้ที่นี่
 * min = กรณีใช้แพ็กเกจฟรี/บัญชีของคณะ, max = กรณีจ่ายเองทั้งหมด
 */
const COST_ITEMS: { name: string; purpose: string; min: number; max: number; note: string }[] = [
  { name: "Hosting / VPS", purpose: "รันเว็บ, backend และฐานข้อมูล", min: 2220, max: 2220, note: "185 บาท/เดือน" },
  { name: "Domain pharmacyexamth.com", purpose: "ชื่อเว็บไซต์", min: 500, max: 500, note: "ต่ออายุรายปี" },
  { name: "Gemini API", purpose: "วิเคราะห์ด้วย AI, อ่าน PDF ปฏิทิน, แชตบอต", min: 0, max: 3000, note: "ฟรีตามโควตา / จ่ายตามการใช้งาน" },
  { name: "n8n Cloud", purpose: "workflow ของแชตบอต", min: 0, max: 9100, note: "บัญชีของคณะ / แพ็กเกจ Starter ~€20/เดือน" },
];

/** บริการที่ระบบใช้แต่ไม่มีค่าใช้จ่าย */
const FREE_SERVICES = [
  "Pinecone (แพ็กเกจฟรี)",
  "Gmail SMTP (อีเมลแจ้งเตือนและใบเสร็จ)",
  "Google OAuth (เข้าสู่ระบบด้วย Google)",
  "SSL Let's Encrypt",
  "PromptPay / TrueMoney (บัญชีส่วนตัว)",
];

const COST_MIN = COST_ITEMS.reduce((sum, i) => sum + i.min, 0);
const COST_MAX = COST_ITEMS.reduce((sum, i) => sum + i.max, 0);

/** ราคาแนะนำ: ครอบคลุมต้นทุนขั้นต่ำด้วยแอดมินคนเดียว และต้นทุนสูงสุดเมื่อมีแอดมิน 2 คน */
const SUGGESTED_PRICE = 10000;

const baht = (n: number) => n.toLocaleString("th-TH", { maximumFractionDigits: 0 });
const costRange = (min: number, max: number) => (min === max ? baht(min) : `${baht(min)}–${baht(max)}`);

type SubscriptionRow = {
  status: "pending" | "successful" | "failed";
  amount: number;
  paidAt: string | null;
  createdAt: string;
  isActive: boolean;
};

export default function PaymentSettingsPage() {
  const { user, getToken, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [annualPrice, setAnnualPrice] = useState<string>("");
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[] | null>(null);

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

      // รายได้จริงใช้สรุปความคุ้มทุน — โหลดไม่ได้ก็ยังตั้งค่าได้ตามปกติ
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/payment/admin/subscriptions`, {
          headers: { Authorization: `Bearer ${getToken()}` },
        });
        if (res.ok) setSubscriptions(await res.json());
      } catch {
        setSubscriptions(null);
      }
    };
    load();
  }, [user, getToken]);

  const price = Number(annualPrice);
  const validPrice = Number.isFinite(price) && price >= 1;

  const revenue = useMemo(() => {
    if (!subscriptions) return null;
    const year = new Date().getFullYear();
    const thisYear = subscriptions.filter(
      (s) => s.status === "successful" && new Date(s.paidAt ?? s.createdAt).getFullYear() === year,
    );
    return {
      total: thisYear.reduce((sum, s) => sum + Number(s.amount), 0),
      count: thisYear.length,
      activeNow: subscriptions.filter((s) => s.isActive).length,
    };
  }, [subscriptions]);

  const handleSave = async () => {
    if (!validPrice) {
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
      <div className="max-w-7xl mx-auto w-full space-y-6">
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
              กำหนดราคาสิทธิ์ผู้ดูแลระบบรายปี เปิด/ปิดการรับชำระเงิน และดูต้นทุนของระบบ
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

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
          {/* ── ซ้าย: ตั้งค่า ── */}
          <div className="lg:col-span-2 space-y-6">
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
                  aria-label="ราคาสิทธิ์ผู้ดูแลระบบต่อปี (บาท)"
                  className="w-44 px-4 py-3 border border-gray-200 rounded-xl text-lg font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <span className="text-sm text-gray-500">บาท / ปี</span>
              </div>

              <div className="bg-gray-50/80 border border-gray-100 rounded-xl p-4 text-xs text-gray-600 space-y-1">
                <p className="font-medium text-gray-700">ราคาแนะนำ {baht(SUGGESTED_PRICE)} บาท/ปี</p>
                <p>
                  ครอบคลุมต้นทุนขั้นต่ำ ({baht(COST_MIN)} บาท) ด้วยแอดมินคนเดียว
                  และต้นทุนสูงสุด ({baht(COST_MAX)} บาท) เมื่อมีแอดมิน {Math.ceil(COST_MAX / SUGGESTED_PRICE)} คน
                </p>
                {price !== SUGGESTED_PRICE && (
                  <button
                    type="button"
                    onClick={() => setAnnualPrice(String(SUGGESTED_PRICE))}
                    className="text-indigo-600 hover:text-indigo-700 font-medium underline cursor-pointer"
                  >
                    ใช้ราคาแนะนำ
                  </button>
                )}
              </div>
            </div>

            {/* เปิด/ปิดระบบ */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Power className={`w-5 h-5 mt-0.5 shrink-0 ${isEnabled ? "text-green-600" : "text-gray-500"}`} />
                  <div>
                    <h2 className="text-base font-medium text-gray-800">รับชำระเงิน</h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {isEnabled
                        ? "เปิดอยู่ ผู้ใช้อัปเกรดเป็นผู้ดูแลระบบได้"
                        : "ปิดอยู่ ผู้ใช้จะสร้าง QR ชำระเงินไม่ได้จนกว่าจะเปิดใหม่"}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={isEnabled}
                  aria-label="เปิด/ปิดการรับชำระเงิน"
                  onClick={() => setIsEnabled((v) => !v)}
                  className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 cursor-pointer ${isEnabled ? "bg-green-600" : "bg-gray-300"}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${isEnabled ? "translate-x-5" : ""}`}
                  />
                </button>
              </div>
              <p className="text-xs text-gray-500">การเปลี่ยนแปลงมีผลเมื่อกด &quot;บันทึกการตั้งค่า&quot;</p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition shadow-sm cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {saving ? "กำลังบันทึก..." : "บันทึกการตั้งค่า"}
            </button>
          </div>

          {/* ── ขวา: ค่าใช้จ่าย ── */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-5 sm:p-6 pb-3 flex items-start gap-3">
                <Receipt className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-base font-medium text-gray-800">รายละเอียดค่าใช้จ่ายของระบบต่อปี</h2>
                  <p className="text-xs text-gray-500 mt-0.5">ราคาอ้างอิง ต.ค. 2569 ช่วงตัวเลขคือกรณีใช้แพ็กเกจฟรี – จ่ายเองทั้งหมด</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 text-left text-xs text-gray-600">
                      <th className="px-5 sm:px-6 py-2.5">รายการ</th>
                      <th className="px-3 py-2.5 hidden sm:table-cell">หมายเหตุ</th>
                      <th className="px-5 sm:px-6 py-2.5 text-right whitespace-nowrap">บาท / ปี</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {COST_ITEMS.map((item) => (
                      <tr key={item.name}>
                        <td className="px-5 sm:px-6 py-3">
                          <p className="text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.purpose}</p>
                          <p className="text-xs text-gray-500 sm:hidden">{item.note}</p>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-600 hidden sm:table-cell">{item.note}</td>
                        <td className="px-5 sm:px-6 py-3 text-right text-gray-900 whitespace-nowrap">{costRange(item.min, item.max)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-indigo-50/60">
                      <td className="px-5 sm:px-6 py-3 font-medium text-gray-900" colSpan={2}>รวมต่อปี</td>
                      <td className="px-5 sm:px-6 py-3 text-right font-medium text-gray-900 whitespace-nowrap">{costRange(COST_MIN, COST_MAX)}</td>
                    </tr>
                    <tr>
                      <td className="px-5 sm:px-6 py-2 text-xs text-gray-500" colSpan={2}>เฉลี่ยต่อเดือน</td>
                      <td className="px-5 sm:px-6 py-2 text-right text-xs text-gray-600 whitespace-nowrap">
                        {costRange(Math.round(COST_MIN / 12), Math.round(COST_MAX / 12))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              <div className="p-5 sm:p-6 pt-4 space-y-3 border-t border-gray-100">
                <div>
                  <p className="text-xs font-medium text-gray-700 mb-1.5">บริการที่ใช้โดยไม่มีค่าใช้จ่าย</p>
                  <div className="flex flex-wrap gap-1.5">
                    {FREE_SERVICES.map((s) => (
                      <span key={s} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="flex items-start gap-2 text-xs text-gray-600 bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-px" />
                  <span>
                    ไม่รวมค่าตรวจสลิป Thunder — ผู้รับมอบระบบซื้อแพ็กเกจเอง (เริ่ม 99 บาท / 30 วัน)
                    และตั้งค่า THUNDER_API_KEY ไม่เช่นนั้นการอัปเกรดสิทธิ์จะตรวจสลิปไม่ได้
                  </span>
                </div>
              </div>
            </div>

            {/* ความคุ้มทุน */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6 space-y-4">
              <div className="flex items-start gap-3">
                <TrendingUp className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                <div>
                  <h2 className="text-base font-medium text-gray-800">ความคุ้มทุน</h2>
                  <p className="text-xs text-gray-500 mt-0.5">คำนวณจากราคาในช่องด้านซ้าย (ยังไม่ต้องบันทึก)</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                  <p className="text-xs text-gray-500">ต้องมีแอดมินจ่ายกี่คนถึงคุ้มทุน</p>
                  <p className="text-xl font-medium text-gray-900 mt-1">
                    {validPrice ? `${Math.ceil(COST_MIN / price)}–${Math.ceil(COST_MAX / price)} คน` : "—"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">ต้นทุนขั้นต่ำ – สูงสุด</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                  <p className="text-xs text-gray-500">ส่วนต่างเมื่อมีแอดมิน 1 คน</p>
                  <p className={`text-xl font-medium mt-1 ${validPrice && price - COST_MIN >= 0 ? "text-green-700" : "text-rose-600"}`}>
                    {validPrice ? `${price - COST_MIN >= 0 ? "+" : ""}${baht(price - COST_MIN)} บาท` : "—"}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {validPrice ? `กรณีจ่ายเองทั้งหมด ${price - COST_MAX >= 0 ? "+" : ""}${baht(price - COST_MAX)} บาท` : ""}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs font-medium text-gray-700 mb-2">รายได้จริงปี {new Date().getFullYear() + 543}</p>
                {revenue ? (
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div>
                      <p className="text-lg font-medium text-gray-900">{baht(revenue.total)}</p>
                      <p className="text-xs text-gray-500">บาท</p>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">{revenue.count}</p>
                      <p className="text-xs text-gray-500">รายการชำระ</p>
                    </div>
                    <div>
                      <p className="text-lg font-medium text-gray-900">{revenue.activeNow}</p>
                      <p className="text-xs text-gray-500">สิทธิ์ที่ยังไม่หมดอายุ</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-gray-500">ไม่สามารถโหลดข้อมูลรายได้ได้</p>
                )}
                <Link
                  href="/admin/super/subscriptions"
                  className="inline-block mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium underline"
                >
                  ดูประวัติการชำระเงินทั้งหมด
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Navbar_admin>
  );
}
