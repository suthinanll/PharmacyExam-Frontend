"use client";
import React, { useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import Swal from "sweetalert2"; // นำเข้า SweetAlert2

export default function Page() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handlesendemail = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (isLoading) return;

        setIsLoading(true);

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });

            if (!res.ok) {
                // กรณี Backend ตอบกลับมาว่าไม่สำเร็จ (เช่น ไม่พบอีเมล)
                const errorData = await res.json();
                throw new Error(errorData.message || "ไม่สามารถส่งอีเมลได้");
            }

            // แจ้งเตือนเมื่อสำเร็จ
            await Swal.fire({
                title: "ส่งอีเมลสำเร็จ!",
                text: "กรุณาตรวจสอบกล่องจดหมายของคุณ เพื่อตั้งรหัสผ่านใหม่",
                icon: "success",
                confirmButtonColor: "#22c55e", // สีเขียว green-500
                confirmButtonText: "รับทราบ",
                customClass: {
                    popup: 'rounded-3xl',
                    confirmButton: 'rounded-xl px-6 py-2'
                }
            });

            setEmail(""); // ล้างค่าอีเมลหลังส่งสำเร็จ

        } catch (error: any) {
            console.error(error);
            // แจ้งเตือนเมื่อเกิดข้อผิดพลาด
            Swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: error.message || "ไม่สามารถเชื่อมต่อกับระบบได้ กรุณาลองใหม่ภายหลัง",
                icon: "error",
                confirmButtonColor: "#ef4444",
                confirmButtonText: "ตกลง",
                customClass: {
                    popup: 'rounded-3xl',
                    confirmButton: 'rounded-xl px-6 py-2'
                }
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center bg-slate-50 px-4"
            style={{
                backgroundImage: " url('/bg-login.png')",
                backgroundSize: 'cover',
                backgroundPosition: 'center'
            }}>

            <div className="bg-white shadow-2xl rounded-3xl p-8 w-full max-w-md border border-gray-100 transition-all">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-medium text-green-600 mb-2">
                        เภสัชพร้อมสอบ
                    </h1>

                    <h2 className="text-xl font-medium text-gray-800">ลืมรหัสผ่าน ?</h2>
                    <p className="text-gray-500 text-sm mt-2 px-4">
                        ไม่ต้องกังวล! กรอกอีเมลของคุณด้านล่าง เพื่อรับรหัสสำหรับการตั้งค่ารหัสผ่านใหม่
                    </p>
                </div>

                <form onSubmit={handlesendemail} className="space-y-6">
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-2 ml-1">
                            อีเมลผู้ใช้งาน
                        </label>
                        <input
                            type="email"
                            className="w-full border border-gray-200 rounded-xl pl-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all placeholder:text-gray-300 shadow-sm disabled:bg-gray-50"
                            placeholder="example@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={isLoading}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full flex items-center justify-center gap-2 font-medium py-3 rounded-xl shadow-lg transition-all duration-300 ${
                            isLoading 
                                ? "bg-gray-400 cursor-not-allowed text-white" 
                                : "bg-green-500 hover:bg-green-600 text-white shadow-green-100 cursor-pointer"
                        }`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                กำลังส่งข้อมูล...
                            </>
                        ) : (
                            "ส่งรหัสยืนยันเข้าอีเมล"
                        )}
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