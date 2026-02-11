"use client";
import React, { useState } from "react";
import Swal from "sweetalert2";
import { FcGoogle } from "react-icons/fc";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Page() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        await login(data.accessToken);
        await Swal.fire({
          icon: "success",
          title: "เข้าสู่ระบบสำเร็จ!",
          text: `ยินดีต้อนรับ ${data.user.first_name}`,
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#10b981",
        });

        const roleId = data.user.role_id;
        if (roleId === 1) router.push("/user");
        else if (roleId === 2) router.push("/admin");
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
    window.location.href = "http://localhost:5000/auth/google";
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-login.png')" }}>

      <div className="bg-white shadow-2xs rounded-2xl p-10 w-full max-w-md border border-white/60 backdrop-blur-sm relative">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-green-600 mb-2 tracking-tight">
            เภสัชพร้อมสอบ
          </h1>
          <p className="text-gray-500 font-medium">กรอกข้อมูลเพื่อเข้าสู่ระบบ</p>

        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-gray-700  ml-1 flex items-center gap-2">
              อีเมลผู้ใช้งาน
            </label>
            <input
              type="email"
              className="w-full border border-gray-200 rounded-2xl px-5 py-3.5 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all placeholder:text-gray-300 shadow-sm"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center ml-1">
              <label className="text-sm font-medium text-gray-800 flex items-center gap-2">
                รหัสผ่าน
              </label>
              <a href="/resetpassword" className="text-xs font-medium text-gray-400 hover:text-green-600 transition-colors">
                ลืมรหัสผ่าน?
              </a>
            </div>
            <div className="relative group">
              <input
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
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-green-600 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl shadow-lg shadow-green-100 transition-all duration-300 cursor-pointer">
            เข้าสู่ระบบ
          </button>
        </form>

        <div className="flex items-center my-8">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-4 text-gray-400 text-xs font-medium uppercase tracking-widest">หรือ</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="flex justify-center">
          <button
            onClick={handleGoogleLogin}
            className="flex items-center gap-3 border-2 border-gray-100 hover:border-green-100 hover:bg-green-50 px-8 py-3 rounded-2xl transition-all duration-300 group cursor-pointer"
          >
            <FcGoogle className="text-2xl group-hover:scale-110 transition-transform" />
            <span className="text-sm font-medium text-gray-600">เข้าสู่ระบบด้วย Google</span>
          </button>
        </div>

        {/* สมัครสมาชิก */}
        <div className="text-center mt-10 text-sm font-medium text-gray-500">
          ยังไม่มีบัญชีผู้ใช้งาน?{" "}
          <a href="/register" className="text-green-600 font-medium hover:underline underline-offset-4">
            สมัครสมาชิก
          </a>
        </div>
      </div>
    </div>
  );
}