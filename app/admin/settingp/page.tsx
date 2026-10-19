"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect, useCallback } from "react";
import React from "react";
import Link from "next/link";
import { User, Mail, Phone, ShieldCheck, Loader2, Edit3, Save, X, KeyRound, LogIn, Palette } from "lucide-react";
import Swal from "@/utils/sweetalert";
import { SWAL_COLORS } from "@/utils/swal";
import { useAuth } from '@/contexts/AuthContext';
import DisplaySettingsPanel from "@/components/settings/DisplaySettingsPanel";

type SettingsTab = 'info' | 'security' | 'display';

const SETTINGS_TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: 'info', label: 'ข้อมูลส่วนตัว', icon: User },
  { id: 'security', label: 'ความปลอดภัย', icon: ShieldCheck },
  { id: 'display', label: 'การแสดงผล', icon: Palette },
];

const isSettingsTab = (v: string): v is SettingsTab => SETTINGS_TABS.some(t => t.id === v);

/** ข้อมูลบัญชีเพิ่มเติมจาก /auth/me ที่ AuthContext ไม่ได้เก็บไว้ */
type AccountInfo = {
  provider?: 'local' | 'google';
  has_password?: boolean;
  last_login_at?: string | null;
};

function formatThaiDateTime(value: string): string {
  return new Date(value).toLocaleString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok',
  });
}

function Page() {
  const { user, getToken } = useAuth();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    tel: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [account, setAccount] = useState<AccountInfo | null>(null);

  // แท็บที่เปิดอยู่ จำไว้ใน # ของ URL เช่น /admin/settingp#display
  const [tab, setTab] = useState<SettingsTab>('info');
  useEffect(() => {
    const syncFromHash = () => {
      const fromHash = window.location.hash.slice(1);
      setTab(isSettingsTab(fromHash) ? fromHash : 'info');
    };
    syncFromHash();
    window.addEventListener('hashchange', syncFromHash);
    return () => window.removeEventListener('hashchange', syncFromHash);
  }, []);
  const changeTab = useCallback((next: SettingsTab) => {
    setTab(next);
    window.history.replaceState(null, '', next === 'info' ? window.location.pathname : `#${next}`);
  }, []);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        tel: user.tel || "",
      });
    }
  }, [user]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => (res.ok ? res.json() : null))
      .then(data => data && setAccount({ provider: data.provider, has_password: data.has_password, last_login_at: data.last_login_at }))
      .catch(() => {});
  }, [getToken]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirmResult = await Swal.fire({
      title: "ยืนยันการบันทึก?",
      text: "คุณต้องการเปลี่ยนแปลงข้อมูลโปรไฟล์ใช่หรือไม่",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: SWAL_COLORS.confirm,
      cancelButtonColor: SWAL_COLORS.cancel,
      confirmButtonText: "ใช่, บันทึกเลย",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
    });

    if (!confirmResult.isConfirmed) return;

    setIsLoading(true);

    try {
      const token = getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "บันทึกสำเร็จ!",
          text: "ระบบจะทำการรีเฟรชหน้าจอเพื่ออัปเดตข้อมูล",
          timer: 1500,
          showConfirmButton: false,
        });

        // ✨ รีเฟรชหน้าจอหลังจากบันทึกสำเร็จ
        window.location.reload();
      } else {
        throw new Error("บันทึกไม่สำเร็จ");
      }
    } catch {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4 space-y-5">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-200" />
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );

  const roleLabel = user.role_id === 3 ? "Super Admin" : user.role_id === 2 ? "Admin" : "User";

  const inputClass = (editable: boolean) =>
    `w-full px-4 py-2.5 rounded-lg border text-sm transition-all outline-none ${editable
      ? "border-green-600 ring-2 ring-green-100 bg-white"
      : "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
    }`;

  // ─── แท็บ 1: ข้อมูลส่วนตัว ───────────────────────────────────────────────
  const infoTab = (
    <>
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center mb-6">
        <div>
          <h2 className="text-lg font-medium text-gray-900">ข้อมูลส่วนตัว</h2>
          <p className="text-sm text-gray-500">ชื่อและเบอร์โทรศัพท์ของบัญชีผู้ดูแลระบบ</p>
        </div>

        {!isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label="แก้ไขข้อมูลโปรไฟล์ผู้ดูแลระบบ"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition shadow-sm cursor-pointer"
          >
            <Edit3 className="w-4 h-4" aria-hidden="true" />
            <span>แก้ไข</span>
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              aria-label="ยกเลิกการแก้ไขโปรไฟล์"
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition cursor-pointer"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              <span>ยกเลิก</span>
            </button>
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isLoading}
              aria-label="บันทึกการเปลี่ยนแปลงโปรไฟล์"
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
              <span>บันทึก</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label htmlFor="admin-first-name" className="text-xs font-medium text-gray-700">ชื่อจริง</label>
          <input
            id="admin-first-name"
            type="text"
            value={formData.first_name}
            readOnly={!isEditing}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            className={inputClass(isEditing)}
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="admin-last-name" className="text-xs font-medium text-gray-700">นามสกุล</label>
          <input
            id="admin-last-name"
            type="text"
            value={formData.last_name}
            readOnly={!isEditing}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            className={inputClass(isEditing)}
          />
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="admin-email-field" className="text-xs font-medium text-gray-700">อีเมล (ไม่สามารถแก้ไขได้)</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
            <input
              id="admin-email-field"
              type="email"
              value={formData.email}
              readOnly
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 text-sm cursor-not-allowed"
            />
          </div>
        </div>

        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="admin-tel-field" className="text-xs font-medium text-gray-700">เบอร์โทรศัพท์</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
            <input
              id="admin-tel-field"
              type="tel"
              value={formData.tel}
              readOnly={!isEditing}
              onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
              placeholder="เช่น 0812345678"
              className={`${inputClass(isEditing)} pl-10`}
            />
          </div>
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-gray-100 flex items-center gap-2 text-sm text-gray-700">
        <ShieldCheck className="w-4 h-4 text-green-600" aria-hidden="true" />
        <span>
          สิทธิ์การใช้งาน: <strong className="font-medium text-gray-900">{roleLabel}</strong>
        </span>
      </div>
    </>
  );

  // ─── แท็บ 2: ความปลอดภัย ────────────────────────────────────────────────
  const securityTab = (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-gray-900">ความปลอดภัย</h2>
        <p className="text-sm text-gray-500">วิธีเข้าสู่ระบบและรหัสผ่านของบัญชีนี้</p>
      </div>

      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <dt className="text-xs md:text-sm font-medium text-gray-500 mb-1">บัญชีที่เชื่อมต่อ</dt>
          <dd className="flex items-center gap-2 text-sm text-gray-800">
            <LogIn className="w-4 h-4 text-gray-500" aria-hidden="true" />
            {account?.provider === 'google' ? "Google" : "อีเมลและรหัสผ่าน"}
          </dd>
          <dd className="text-xs text-gray-500 mt-1 break-all">{user.email}</dd>
        </div>
        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <dt className="text-xs md:text-sm font-medium text-gray-500 mb-1">รหัสผ่าน</dt>
          <dd className="flex items-center gap-2 text-sm text-gray-800">
            <KeyRound className="w-4 h-4 text-gray-500" aria-hidden="true" />
            {account?.has_password === false ? "ยังไม่ได้ตั้งรหัสผ่าน" : "ตั้งรหัสผ่านแล้ว"}
          </dd>
          {account?.last_login_at && (
            <dd className="text-xs text-gray-500 mt-1">เข้าสู่ระบบล่าสุด {formatThaiDateTime(account.last_login_at)}</dd>
          )}
        </div>
      </dl>

      {/* ยังไม่มี API เปลี่ยนรหัสผ่านโดยตรง จึงใช้ขั้นตอนลืมรหัสผ่าน (ส่งลิงก์ทางอีเมล) ที่มีอยู่แล้ว */}
      <div className="border-t border-gray-100 pt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-gray-900">เปลี่ยนรหัสผ่าน</h3>
          <p className="text-xs text-gray-500">ระบบจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปที่อีเมลของคุณ</p>
        </div>
        <Link
          href="/resetpassword"
          className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition shadow-sm"
        >
          <KeyRound className="w-4 h-4" aria-hidden="true" /> ขอลิงก์เปลี่ยนรหัสผ่าน
        </Link>
      </div>
    </div>
  );

  const tabPanels: Record<SettingsTab, React.ReactNode> = {
    info: infoTab,
    security: securityTab,
    // แอดมินไม่มีโหมดมืด จึงแสดงแค่ขนาดตัวอักษร
    // แผงนี้ใช้สีหลักของฝั่งผู้ใช้ (lime) จึงสลับตัวแปรสีเป็นเขียวโทนเดิมของฝั่งแอดมิน
    display: (
      <div className="[--color-primary:var(--color-green-600)] [--color-primary-soft:var(--color-green-50)]">
        <DisplaySettingsPanel showTheme={false} scopeLabel="ทั้งหน้าผู้ดูแลระบบ" />
      </div>
    ),
  };

  return (
    <Navbar_admin>
      <div className="max-w-7xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">การตั้งค่า</h1>
          <p className="text-sm text-gray-500">จัดการข้อมูลบัญชี ความปลอดภัย และการแสดงผล</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {/* ชื่อและสิทธิ์ */}
          <div className="px-5 py-6 md:px-8 border-b border-gray-100 flex items-center gap-4">
            <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center shrink-0">
              <User className="w-7 h-7 text-green-700" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-medium text-gray-900 truncate">{`${user.first_name ?? ''} ${user.last_name ?? ''}`}</p>
              <p className="text-sm text-gray-500 truncate">{user.email} · {roleLabel}</p>
            </div>
          </div>

          {/* แท็บ */}
          <div role="tablist" aria-label="การตั้งค่า" className="flex border-b border-gray-200 px-2 md:px-6 overflow-x-auto">
            {SETTINGS_TABS.map(({ id, label, icon: Icon }) => {
              const selected = tab === id;
              return (
                <button
                  key={id}
                  id={`settings-tab-${id}`}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  aria-controls={`settings-panel-${id}`}
                  onClick={() => changeTab(id)}
                  className={`flex items-center gap-2 whitespace-nowrap px-3 md:px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors cursor-pointer ${selected
                    ? "border-green-600 text-gray-900"
                    : "border-transparent text-gray-500 hover:text-gray-800"}`}
                >
                  <Icon className={`w-4 h-4 ${selected ? "text-green-600" : ""}`} aria-hidden="true" />
                  {label}
                </button>
              );
            })}
          </div>

          <div
            id={`settings-panel-${tab}`}
            role="tabpanel"
            aria-labelledby={`settings-tab-${tab}`}
            className="p-5 md:p-8"
          >
            {tabPanels[tab]}
          </div>
        </div>
      </div>
    </Navbar_admin>
  );
}

export default Page;
