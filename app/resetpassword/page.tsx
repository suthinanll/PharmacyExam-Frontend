"use client";
import React, { useState } from "react";
import { Mail, ArrowLeft } from "lucide-react";

export default function Page() {
    const [email, setEmail] = useState("");
    const [] = useState("");

    const handlesendemail = async (e: React.FormEvent) => {
        e.preventDefault();
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-slate-50 px-4"
            style={{
                backgroundImage: " url('/bg-login.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>

            <div className="bg-white shadow-2xs rounded-2xl p-8 w-full max-w-md border border-gray-100 transition-all">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-green-600 mb-2">
                        เภสัชพร้อมสอบ
                    </h1>

                    <h2 className="text-xl font-semibold text-gray-800">ลืมรหัสผ่าน ?</h2>
                    <p className="text-gray-500 text-sm mt-2 px-4">
                        ไม่ต้องกังวล! กรอกอีเมลของคุณด้านล่าง เพื่อรับรหัสสำหรับการตั้งค่ารหัสผ่านใหม่
                    </p>
                </div>

                <form onSubmit={handlesendemail} className="space-y-6">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                            อีเมลผู้ใช้งาน
                        </label>
                        <div>

                            <input
                                type="email"
                                className="w-full border border-gray-200 rounded-xl pl-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all placeholder:text-gray-300 shadow-sm"
                                placeholder="example@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-2 rounded-lg transition-all duration-200  cursor-pointer"
                    >
                        ส่งรหัสยืนยันเข้าอีเมล
                    </button>

                    <div className="pt-4 text-center">
                        <a
                            href="/login"
                            className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-green-600 transition-colors group"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            กลับไปหน้าเข้าสู่ระบบ
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}