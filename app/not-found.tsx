"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft, Search, BookOpen, Calendar, Bot, LogIn } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-6"
      style={{
        backgroundColor: "#76B25A",
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(255,255,255,0.12) 0%, transparent 45%),
          radial-gradient(circle at 80% 75%, rgba(0,0,0,0.08) 0%, transparent 45%)
        `,
        fontFamily: "var(--font-primary, 'Kanit', sans-serif)",
      }}
    >
      {/* ── White Card ─────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-8 sm:p-10 w-full max-w-md shadow-2xl border border-white/60 backdrop-blur-sm text-center relative overflow-hidden">
        
        {/* Top Decorative 404 Watermark */}
        <div className="text-7xl sm:text-8xl font-black text-green-600/10 tracking-widest select-none -mt-4 mb-2 leading-none">
          404
        </div>

        {/* Brand Name */}
        <h2 className="text-2xl font-bold text-green-600 mb-1 tracking-tight">
          เภสัชพร้อมสอบ
        </h2>

        {/* Status Badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium rounded-full mb-4">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span>Page Not Found</span>
        </div>

        {/* Main Title */}
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          ไม่พบหน้าที่คุณต้องการ
        </h1>

        {/* Subtitle */}
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          หน้าที่คุณกำลังค้นหาอาจถูกย้าย ลบออก หรือคุณอาจพิมพ์ URL ไม่ถูกต้อง กรุณาตรวจสอบลิงก์อีกครั้ง
        </p>

        {/* Divider */}
        <hr className="border-gray-100 my-6" />

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 py-3 px-4 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition shadow-md shadow-green-600/20 active:scale-[0.98] cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>กลับหน้าหลัก</span>
          </Link>
          
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-medium rounded-xl transition border border-gray-200 active:scale-[0.98] cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>ย้อนกลับ</span>
          </button>
        </div>

        {/* Quick Links Section */}
        <div className="pt-2">
          <p className="text-xs font-medium text-gray-400 mb-3">
            เมนูลัดที่อาจเป็นประโยชน์:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <Link
              href="/user/examset"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-green-50 hover:text-green-700 hover:border-green-300 text-gray-600 text-xs font-medium rounded-lg border border-gray-200 transition-all cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>คลังข้อสอบ</span>
            </Link>
            <Link
              href="/user/calendar"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-green-50 hover:text-green-700 hover:border-green-300 text-gray-600 text-xs font-medium rounded-lg border border-gray-200 transition-all cursor-pointer"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>ปฏิทินสอบ</span>
            </Link>
            <Link
              href="/user/chatbot"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-green-50 hover:text-green-700 hover:border-green-300 text-gray-600 text-xs font-medium rounded-lg border border-gray-200 transition-all cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>แชทบอท</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-50 hover:bg-green-50 hover:text-green-700 hover:border-green-300 text-gray-600 text-xs font-medium rounded-lg border border-gray-200 transition-all cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>เข้าสู่ระบบ</span>
            </Link>
          </div>
        </div>

      </div>

      {/* Footer */}
      <p className="mt-5 text-xs text-white/70 font-normal text-center">
        © 2025 เภสัชพร้อมสอบ · สงวนลิขสิทธิ์ทั้งหมด
      </p>
    </div>
  );
}
