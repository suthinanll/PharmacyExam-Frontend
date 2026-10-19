"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Swal from "@/utils/sweetalert";
import { LockKeyhole, Eye, EyeOff, Shield, Check, X } from "lucide-react";

function ChecklistItem({ checked, text }: { checked: boolean; text: string }) {
    return (
        <div className="flex items-center gap-2 text-xs">
            {checked ? (
                <Check className="w-3.5 h-3.5 text-green-500 shrink-0" />
            ) : (
                <X className="w-3.5 h-3.5 text-gray-400 shrink-0" />
            )}
            <span className={checked ? "text-gray-800 font-medium" : "text-gray-500"}>
                {text}
            </span>
        </div>
    );
}

function ResetPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    // Password Strength States
    const [passwordStrength, setPasswordStrength] = useState({
        minLength: false,
        has: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
    });

    // เช็คความแข็งแรงของรหัสผ่าน
    useEffect(() => {
        setPasswordStrength({
            minLength: password.length >= 8,
            has: /[A-Z]/.test(password),
            hasLowerCase: /[a-z]/.test(password),
            hasNumber: /[0-9]/.test(password),
            hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
        });
    }, [password]);

    // คำนวณ Password Strength Score
    const getPasswordScore = () => {
        const scores = Object.values(passwordStrength).filter(Boolean).length;
        return scores;
    };

    const getPasswordStrengthColor = () => {
        const score = getPasswordScore();
        if (score <= 2) return "bg-red-500";
        if (score <= 3) return "bg-yellow-500";
        if (score <= 4) return "bg-blue-500";
        return "bg-green-500";
    };

    const getPasswordStrengthText = () => {
        const score = getPasswordScore();
        if (score <= 2) return "อ่อนแอ";
        if (score <= 3) return "ปานกลาง";
        if (score <= 4) return "ดี";
        return "แข็งแรงมาก";
    };

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return Swal.fire({
                icon: "warning",
                title: "รหัสผ่านไม่ตรงกัน",
                text: "กรุณาตรวจสอบการกรอกรหัสผ่านทั้งสองช่องอีกครั้ง",
                confirmButtonColor: "#5EA500",
            });
        }

        try {
            const res = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/auth/reset-password`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token, newPassword: password }),
                },
            );

            const data = await res.json();
            if (res.ok) {
                await Swal.fire({
                    icon: "success",
                    title: "สำเร็จ!",
                    text: "รหัสผ่านของคุณถูกเปลี่ยนเรียบร้อยแล้ว",
                    confirmButtonColor: "#5EA500",
                });
                router.push("/login");
            } else {
                const errorMsg = Array.isArray(data.message) ? data.message[0] : data.message;
                throw new Error(errorMsg || "ลิงก์หมดอายุหรือไม่ถูกต้อง");
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
        <div
            className="min-h-screen flex items-center justify-center bg-slate-50 px-4"
            style={{
                backgroundImage: " url('/bg-login.png')",
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            <div className="bg-white shadow-2xs rounded-2xl p-8 w-full max-w-md border border-white/60 backdrop-blur-sm relative overflow-hidden">
                <div className="relative">
                    <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-green-600 shadow-inner">
                        <LockKeyhole size={32} />
                    </div>

                    <h1 className="text-3xl font-medium text-center text-gray-800 mb-2">
                        ตั้งรหัสผ่านใหม่
                    </h1>
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
                                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-green-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {password && (
                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                                                style={{ width: `${(getPasswordScore() / 5) * 100}%` }}
                                            ></div>
                                        </div>
                                        <span
                                            className={`text-xs font-medium ${getPasswordScore() < 4 ? "text-red-600" : "text-green-600"}`}
                                        >
                                            {getPasswordStrengthText()}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ยืนยันรหัสผ่าน */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 ml-1">
                                ยืนยันรหัสผ่านอีกครั้ง
                            </label>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="w-full border border-gray-200 rounded-2xl px-4 py-3.5 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm hover:border-gray-300"
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>
                        {/* Password Checklist */}
                        <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-4 h-4 text-gray-600" />
                                <p className="text-xs font-medium text-gray-700">
                                    ความปลอดภัยของรหัสผ่าน
                                </p>
                            </div>
                            <div className="space-y-2">
                                <ChecklistItem
                                    checked={passwordStrength.minLength}
                                    text="ความยาวอย่างน้อย 8 ตัวอักษร"
                                />
                                <ChecklistItem
                                    checked={passwordStrength.has}
                                    text="มีตัวอักษรพิมพ์ใหญ่ (A-Z)"
                                />
                                <ChecklistItem
                                    checked={passwordStrength.hasLowerCase}
                                    text="มีตัวอักษรพิมพ์เล็ก (a-z)"
                                />
                                <ChecklistItem
                                    checked={passwordStrength.hasNumber}
                                    text="มีตัวเลข (0-9)"
                                />
                                <ChecklistItem
                                    checked={passwordStrength.hasSpecialChar}
                                    text="มีอักขระพิเศษ (!@#$%...)"
                                />
                            </div>
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

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <p className="text-gray-500 font-medium">กำลังโหลด...</p>
            </div>
        }>
            <ResetPasswordContent />
        </Suspense>
    );
}