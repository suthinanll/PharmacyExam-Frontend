"use client";
import React, { useState } from "react";
import Swal from "sweetalert2";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { useRouter } from "next/navigation";

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "เข้าสู่ระบบสำเร็จ!",
          text: `ยินดีต้อนรับ ${data.user.first_name}`,
          confirmButtonText: "ตกลง",
        });


        const roleId = data.user.role_id;

        if (roleId === 1) {
          router.push("/user");
        } else if (roleId === 2) {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } else {
        Swal.fire({
          icon: "error",
          title: "เข้าสู่ระบบไม่สำเร็จ",
          text: data.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง",
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
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-login.png')" }}>
      <div className="bg-white shadow-2xs rounded-2xl p-8 w-[90%] max-w-md">
        <h1 className="text-3xl font-semibold text-center mb-6 text-green-600">
          เภสัชพร้อมสอบ
        </h1>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 mb-2">อีเมลผู้ใช้งาน</label>
            <input
              type="email"
              className="w-full border border-gray-200 rounded-xl pl-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all placeholder:text-gray-300 shadow-sm"
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">รหัสผ่าน</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg transition-all duration-200  cursor-pointer">
            เข้าสู่ระบบ

          </button>

          <div className="text-right text-sm text-gray-600">
            <a href="/resetpassword" className="text-gray-400 hover:text-gray-600">ลืมรหัสผ่าน</a>
          </div>

        </form>

        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-3 text-gray-500 text-sm">หรือเข้าสู่ระบบด้วย</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <div className="flex justify-center space-x-6 text-3xl">
          <button className="text-blue-600 hover:scale-110 transition-transform cursor-pointer"
            onClick={handleGoogleLogin}>

            <FcGoogle />
          </button>
          {/* <button
            onClick={() => handleSocialLogin("Facebook")}
            className="text-blue-600 hover:scale-110 transition-transform cursor-pointer"
          >
            <FaFacebook />
          </button> */}
        </div>

        <div className="text-center mt-6 text-sm text-gray-600">
          ยังไม่มีบัญชี ?{" "}
          <a href="/register" className="text-green-600 hover:underline">
            สมัครสมาชิก
          </a>
        </div>

      </div>
    </div>
  );
}
