"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { withRedirect } from "@/utils/redirect";

function apiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
}

export default function AdminPlanLoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${apiBaseUrl()}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }

      await login(data.accessToken, data.user);
      await Swal.fire({
        icon: "success",
        title: "เข้าสู่ระบบสำเร็จ",
        text: "ระบบจะพาคุณกลับไปหน้าซื้อแผนผู้ดูแลระบบ",
        showConfirmButton: false,
        timer: 1200,
      });

      router.push("/upgrade-admin");
    } catch (err: any) {
      Swal.fire({
        icon: "error",
        title: "เข้าสู่ระบบไม่สำเร็จ",
        text: err.message || "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="flex min-h-screen items-center justify-center bg-cover bg-center px-4 py-10"
      style={{ backgroundImage: "url('/bg-login.png')" }}
    >
      <div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[1fr_430px] lg:items-stretch">
        <section className="hidden rounded-2xl border border-white/70 bg-white/85 p-8 shadow-sm backdrop-blur-sm lg:flex lg:flex-col lg:justify-between">
          <Link
            href="/upgrade-admin"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-green-700 transition hover:text-green-800"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้าซื้อแผน
          </Link>

          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Plan Login
            </div>
            <h1 className="text-3xl font-medium tracking-normal text-gray-900">
              ล็อกอินเพื่อซื้อหรือต่ออายุแผน Admin
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-gray-600">
              หน้านี้ใช้สำหรับกลับไปชำระเงินที่หน้าอัปเกรด บัญชีสมาชิกทั่วไปสามารถเข้าสู่ระบบแล้วซื้อแผนได้ โดยระบบจะไม่พาเข้าแผงผู้ดูแลระบบอัตโนมัติ
            </p>
          </div>

          <div className="grid gap-3 text-sm text-gray-600">
            <div className="flex gap-3 rounded-xl bg-white p-4 shadow-sm">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">ล็อกอินแล้วกลับไป Checkout</p>
                <p className="mt-1">เหมาะกับสมาชิกที่ต้องการซื้อสิทธิ์ Admin เพิ่มจากบัญชีเดิม</p>
              </div>
            </div>
            <div className="flex gap-3 rounded-xl bg-white p-4 shadow-sm">
              <Crown className="mt-0.5 h-5 w-5 shrink-0 text-green-600" />
              <div>
                <p className="font-medium text-gray-900">สิทธิ์เปิดหลังชำระเงินสำเร็จ</p>
                <p className="mt-1">หลังตรวจสลิปผ่าน ให้ล็อกอินใหม่เพื่อรับ token สิทธิ์ล่าสุด</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/70 bg-white p-7 shadow-xl shadow-green-900/10 sm:p-9">
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-700">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h2 className="text-2xl font-medium text-gray-900">เข้าสู่ระบบเพื่อซื้อแผน</h2>
            <p className="mt-2 text-sm text-gray-500">กรอกบัญชีเดิมของคุณเพื่อไปต่อที่หน้า Admin Plan</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-1.5">
              <label className="ml-1 text-sm font-medium text-gray-700">อีเมลผู้ใช้งาน</label>
              <input
                type="email"
                className="w-full rounded-2xl border border-gray-200 px-5 py-3.5 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                placeholder="example@email.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="ml-1 flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">รหัสผ่าน</label>
                <Link
                  href="/resetpassword"
                  className="text-xs font-medium text-gray-400 transition hover:text-green-600"
                >
                  ลืมรหัสผ่าน?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded-2xl border border-gray-200 px-5 py-3.5 pr-12 outline-none transition focus:border-green-500 focus:ring-4 focus:ring-green-100"
                  placeholder="••••••••"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 transition hover:text-green-600"
                  aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white shadow-lg shadow-green-100 transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              เข้าสู่ระบบแล้วไปซื้อแผน
            </button>
          </form>

          <div className="mt-7 space-y-3 text-center text-sm">
            <p className="text-gray-500">
              ยังไม่มีบัญชี?{" "}
              <Link
                href={withRedirect("/register", "/upgrade-admin")}
                className="font-medium text-green-700 underline-offset-4 hover:underline"
              >
                สมัครสมาชิกเพื่อซื้อแผน
              </Link>
            </p>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 transition hover:text-green-700"
            >
              ไปหน้าเข้าสู่ระบบทั่วไป <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
