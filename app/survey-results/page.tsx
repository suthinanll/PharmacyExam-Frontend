"use client";

import { useCallback, useEffect, useState } from "react";
import { ClipboardList, Loader2, Lock, Mail } from "lucide-react";
import SurveyDashboard from "./SurveyDashboard";

/**
 * หน้าผลการประเมินแบบสอบถาม — แยกจากระบบหลัก ไม่มีลิงก์ในเมนูใด ๆ
 *
 * แบบประเมินเป็นเครื่องมือของงานวิจัย ไม่ใช่ฟังก์ชันที่ส่งมอบให้ผู้ใช้ระบบ
 * จึงย้ายออกจากเมนูแอดมิน แล้วให้เข้าผ่าน URL นี้โดยตรงด้วยบัญชี Super Admin เท่านั้น
 * (backend ตรวจสิทธิ์ซ้ำที่ @Roles(3) ของ /survey/admin/*)
 *
 * การเข้าสู่ระบบที่นี่แยกจากการเข้าสู่ระบบหลักของเว็บ: token เก็บใน sessionStorage ของแท็บนี้
 * ปิดแท็บแล้วต้องเข้าสู่ระบบใหม่ และไม่ไปทับบัญชีที่ล็อกอินค้างไว้ในเว็บหลัก
 */

const API = process.env.NEXT_PUBLIC_API_URL;
const SESSION_KEY = "survey-results-session";

type Session = { token: string; email: string };

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export default function SurveyResultsPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSession(readSession());
    setReady(true);
  }, []);

  const logout = useCallback(() => {
    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // ไม่เป็นไร
    }
    setSession(null);
    setPassword("");
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = Array.isArray(data.message) ? data.message[0] : data.message;
        throw new Error(message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
      if (data.user?.role_id !== 3) {
        throw new Error("บัญชีนี้ไม่มีสิทธิ์ดูผลการประเมิน (เฉพาะ Super Admin)");
      }
      const next: Session = { token: data.accessToken, email: data.user.email ?? email.trim() };
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
      } catch {
        // เบราว์เซอร์บางตัวเขียน sessionStorage ไม่ได้ — ใช้ได้จนกว่าจะรีเฟรช
      }
      setSession(next);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "เข้าสู่ระบบไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <span className="text-lg font-medium text-green-700">เภสัชพร้อมสอบ</span>
          <span className="text-xs text-gray-500">สำหรับผู้วิจัย</span>
        </div>
      </header>

      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {!ready ? null : session ? (
          <SurveyDashboard token={session.token} email={session.email} onLogout={logout} />
        ) : (
          <div className="max-w-md mx-auto mt-6 sm:mt-14">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 sm:p-8">
              <div className="w-12 h-12 rounded-xl bg-green-50 text-green-600 flex items-center justify-center mb-4">
                <ClipboardList className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-medium text-gray-900">ผลการประเมินแบบสอบถาม</h1>
              <p className="text-sm text-gray-500 mt-1 mb-6">
                เข้าสู่ระบบด้วยบัญชี Super Admin เพื่อดูผลการประเมินและเปิด/ปิดแบบประเมิน
              </p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="sr-email" className="text-sm font-medium text-gray-700">อีเมล</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      id="sr-email"
                      type="email"
                      autoComplete="username"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="example@email.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="sr-password" className="text-sm font-medium text-gray-700">รหัสผ่าน</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input
                      id="sr-password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm outline-none focus:border-green-600 focus:ring-2 focus:ring-green-100"
                    />
                  </div>
                </div>

                {error && (
                  <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white text-sm font-medium transition shadow-sm disabled:opacity-60 cursor-pointer"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  เข้าสู่ระบบ
                </button>
              </form>
            </div>
            <p className="text-xs text-gray-500 text-center mt-4">
              หน้านี้ไม่ใช่ส่วนหนึ่งของระบบที่ส่งมอบ และไม่มีลิงก์จากเมนูใด ๆ
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
