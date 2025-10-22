"use client";
import React, { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { FaFacebook,  } from "react-icons/fa";

export default function Page() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Email:", email);
    console.log("Password:", password);
  };

  const handleSocialLogin = (provider: string) => {
    console.log(`เข้าสู่ระบบด้วย ${provider}`);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-login.png')" }}
    >
      <div className="bg-white backdrop-blur-md shadow-xl rounded-2xl p-8 w-[90%] max-w-md">
        <h1 className="text-3xl font-semibold text-center mb-6 text-green-600">
          เภสัชพร้อมสอบ
        </h1>

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-gray-700 mb-2">อีเมล</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              placeholder="yourname@example.com"
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

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition-all duration-200"
          >
            เข้าสู่ระบบ
          </button>
        </form>

        {/* เส้นแบ่ง */}
        <div className="flex items-center my-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="mx-3 text-gray-500 text-sm">หรือเข้าสู่ระบบด้วย</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* ปุ่มไอคอนแนวนอน */}
        <div className="flex justify-center space-x-6 text-3xl">
          <button
            onClick={() => handleSocialLogin("Google")}
            className="hover:scale-110 transition-transform"
          >
            <FcGoogle />
          </button>
          <button
            onClick={() => handleSocialLogin("Facebook")}
            className="text-blue-600 hover:scale-110 transition-transform"
          >
            <FaFacebook />
          </button>
         
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
