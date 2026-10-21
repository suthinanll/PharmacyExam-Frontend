"use client";
import React, { useState, useEffect } from "react";
import Swal from "@/utils/sweetalert";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, ArrowRight, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getSafeRedirect, withRedirect } from "@/utils/redirect";
import PrivacyNotice from "@/components/PrivacyNotice";

export default function Page() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [registerHref, setRegisterHref] = useState("/register");
  const router = useRouter();

  // อ่าน ?redirect= หลัง mount (ไม่อ่านตอน render เพื่อเลี่ยง hydration mismatch)
  useEffect(() => {
    const redirectTo = getSafeRedirect();
    if (redirectTo) setRegisterHref(withRedirect("/register", redirectTo));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // ส่ง user data ไปด้วยเลย ไม่ต้องรอ /auth/me อีกรอบ
        await login(data.accessToken, data.user);
        await Swal.fire({
          icon: "success",
          title: "เข้าสู่ระบบสำเร็จ!",
          text: `ยินดีต้อนรับ ${data.user.first_name}`,
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#5EA500",
        });

        // ถ้ามาจากหน้าที่ค้างไว้ (เช่น กดจ่ายเงินที่ /upgrade-admin) ให้กลับไปที่นั่นต่อ
        const redirectTo = getSafeRedirect();
        if (redirectTo) {
          router.push(redirectTo);
          return;
        }

        const roleId = data.user.role_id;
        if (roleId === 1) router.push("/user");
        else if (roleId === 2 || roleId === 3) router.push("/admin"); // 3 = Super Admin เข้าแผงแอดมินเหมือนกัน
        else router.push("/");
      } else {
        Swal.fire({
          icon: "error",
          title: "เข้าสู่ระบบไม่สำเร็จ",
          text: data.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
      });
      console.error(err);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google`;
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-login.png')" }}>

      <div className="bg-white shadow-2xs rounded-2xl p-10 w-full max-w-md border border-white/60 backdrop-blur-sm relative">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-medium text-green-700 mb-2 tracking-tight">
            เภสัชพร้อมสอบ
          </h1>
          <p className="text-gray-600 font-medium">กรอกข้อมูลเพื่อเข้าสู่ระบบ</p>
        </div>

        {/* ประกาศช่วงทดสอบระบบ — ปิดได้ด้วย NEXT_PUBLIC_TESTING_NOTICE=false เมื่อเปิดใช้งานจริง */}
        {process.env.NEXT_PUBLIC_TESTING_NOTICE !== "false" && (
          <div role="note" className="mb-6 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
            <Info className="w-5 h-5 shrink-0 text-amber-700 mt-0.5" aria-hidden="true" />
            <div>
              <p className="font-medium text-amber-800">ระบบอยู่ในช่วงทดสอบ</p>
              <p className="text-amber-700 mt-0.5 leading-relaxed">
                คะแนนและผลการทำข้อสอบในระบบนี้ใช้เพื่อฝึกฝนและทดสอบระบบเท่านั้น ไม่มีผลต่อคะแนนสอบจริง
              </p>
            </div>
          </div>
        )}

        <PrivacyNotice className="mb-6" />

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5">
            <label htmlFor="login-email" className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-2">
              อีเมลผู้ใช้งาน
            </label>
            <input
              id="login-email"
              type="email"
              className="w-full border border-gray-200 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all placeholder:text-gray-400 shadow-sm"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label htmlFor="login-password" className="text-sm font-medium text-gray-800 flex items-center gap-2">
                รหัสผ่าน
              </label>
              <a href="/resetpassword" className="text-xs font-medium text-gray-600 hover:text-green-700 underline-offset-2 hover:underline transition-colors">
                ลืมรหัสผ่าน?
              </a>
            </div>
            <div className="relative group">
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="w-full border border-gray-200 rounded-2xl pl-5 pr-12 py-3.5 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm group-hover:border-gray-300"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-500 hover:text-green-700 transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff size={20} aria-hidden="true" /> : <Eye size={20} aria-hidden="true" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            aria-label="เข้าสู่ระบบ"
            className="w-full bg-green-700 hover:bg-green-800 text-white font-medium py-3 rounded-xl shadow-lg shadow-green-100 transition-all duration-300 cursor-pointer"
          >
            เข้าสู่ระบบ
          </button>

          <a
            href="/upgrade-admin"
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 py-3 text-sm font-medium text-green-700 transition-all duration-300 hover:bg-green-100"
          >
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />
            <span>ดูข้อเสนอแผน Admin</span>
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>
        </form>

        <div className="flex items-center my-8">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-600 text-xs font-medium">หรือ</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleGoogleLogin}
            aria-label="เข้าสู่ระบบด้วยบัญชี Google"
            className="flex items-center gap-3 border-2 border-gray-200 hover:border-green-200 hover:bg-green-50 px-8 py-3 rounded-2xl transition-all duration-300 group cursor-pointer"
          >
            <FcGoogle className="text-2xl group-hover:scale-110 transition-transform" aria-hidden="true" />
            <span className="text-sm font-medium text-gray-700">เข้าสู่ระบบด้วย Google</span>
          </button>
        </div>

        {/* สมัครสมาชิก — ส่งปลายทางที่ค้างไว้ต่อไปด้วย จะได้ไม่หลุดตอนเปลี่ยนใจไปสมัครแทน */}
        <div className="text-center mt-10 text-sm font-medium text-gray-700">
          ยังไม่มีบัญชีผู้ใช้งาน?{" "}
          <a href={registerHref} className="text-green-700 font-medium hover:underline underline-offset-4">
            สมัครสมาชิก
          </a>
        </div>
      </div>
    </div>
  );
}
