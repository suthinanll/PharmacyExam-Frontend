"use client";
import React, { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { LockKeyhole, Eye, EyeOff } from "lucide-react"; // แนะนำให้ลง lucide-react

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return Swal.fire({
                icon: "warning",
                title: "รหัสผ่านไม่ตรงกัน",
                text: "กรุณาตรวจสอบการกรอกรหัสผ่านทั้งสองช่องอีกครั้ง",
                confirmButtonColor: "#10b981",
            });
        }

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ token, newPassword: password }),
            });

            const data = await res.json();
            if (res.ok) {
                await Swal.fire({
                    icon: "success",
                    title: "สำเร็จ!",
                    text: "รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว",
                    confirmButtonColor: "#10b981",
                });
                router.push("/login");
            } else {
                throw new Error(data.message || "ลิงก์หมดอายุหรือผิดพลาด");
            }
        } catch (err: any) {
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด",
                text: err.message,
                confirmButtonColor: "#ef4444",
            });
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4"
            style={{
                backgroundImage: " url('/bg-login.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>
            <div className="bg-white shadow-2xs rounded-2xl p-8 w-full max-w-md border border-white/60 backdrop-blur-sm relative overflow-hidden">

                <div className="relative">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-green-600 shadow-inner">
                        <LockKeyhole size={32} />
                    </div>

                    <h1 className="text-3xl font-extrabold text-center text-gray-800 mb-2">ตั้งรหัสผ่านใหม่</h1>
                    <p className="text-center text-gray-500 text-sm mb-8">
                        กรุณากำหนดรหัสผ่านใหม่ที่ปลอดภัยและจำได้ง่าย
                    </p>

                    <form onSubmit={handleReset} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1 flex items-center gap-2">
                                รหัสผ่านใหม่
                            </label>
                            <div className="relative group">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full border border-gray-200 rounded-2xl pl-4 pr-12 py-3.5 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm group-hover:border-gray-300"
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

                        {/* ยืนยันรหัสผ่าน */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">ยืนยันรหัสผ่านอีกครั้ง</label>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm hover:border-gray-300"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        {/* ข้อความแจ้งเตือนเล็กๆ */}
                        {password && confirmPassword && password !== confirmPassword && (
                            <p className="text-xs text-red-500 ml-1 italic animate-pulse">
                                * รหัสผ่านทั้งสองช่องยังไม่ตรงกัน
                            </p>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-4 rounded-xl shadow-lg shadow-green-200 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 cursor-pointer mt-2"
                        >
                            ยืนยันการเปลี่ยนรหัสผ่าน
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}