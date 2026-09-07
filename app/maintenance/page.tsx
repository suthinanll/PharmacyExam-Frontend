import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ปิดปรับปรุงชั่วคราว — เภสัชพร้อมสอบ",
  description: "เว็บไซต์อยู่ระหว่างการปรับปรุงระบบ จะกลับมาให้บริการในเร็วๆ นี้",
};

export default function MaintenancePage() {
  return (
    <main className="maintenance-body">
      {/* ── Card ─────────────────────────────────────── */}
      <div className="maintenance-card">

        {/* Icon */}
        <div className="maintenance-icon-wrap">
          <svg
            className="maintenance-gear-svg"
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z" />
            <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        </div>

        {/* Brand */}
        <p className="text-2xl font-bold text-[#76B25A] mb-1.5 tracking-wide">เภสัชพร้อมสอบ</p>

        {/* Badge */}
        <div className="maintenance-badge">
          <span className="maintenance-badge-dot" />
          กำลังดำเนินการปรับปรุง
        </div>

        <h1 className="text-2xl font-bold text-gray-900 leading-tight mb-2.5">
          เว็บไซต์ปิดปรับปรุง<br />ชั่วคราว
        </h1>

        <p className="text-sm text-gray-500 leading-relaxed mb-8">
          ทีมงานกำลังอัปเกรดระบบเพื่อมอบประสบการณ์<br />
          การเรียนรู้ที่ดียิ่งขึ้น กรุณารอสักครู่
        </p>

        <hr className="border-0 border-t border-gray-100 mb-6" />

        {/* Progress */}
        <div className="flex justify-between items-center text-xs text-gray-500 font-medium mb-2.5">
          <span>ความคืบหน้า</span>
          <span className="text-green-600 font-bold">75%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
          <div className="maintenance-progress-fill" />
        </div>

        {/* Step checklist */}
        <div className="flex flex-col gap-2.5 text-left mb-8 text-xs text-gray-500">
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center bg-green-100 text-green-600">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-gray-700">สำรองข้อมูลระบบเรียบร้อย</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center bg-green-100 text-green-600">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <span className="text-gray-700">อัปเดตโครงสร้างฐานข้อมูล</span>
          </div>
          <div className="flex items-center gap-2.5">
            <div className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center bg-amber-100 text-amber-600">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <span className="text-gray-700 font-semibold">
              ทดสอบและตรวจสอบระบบ <span className="font-normal text-amber-600">(กำลังดำเนินการ)</span>
            </span>
          </div>
        </div>

        {/* Contact */}
        <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5 mb-2.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          ติดต่อแอดมิน:&nbsp;
          <a href="mailto:admin@pharmexam.com" className="text-[#76B25A] font-semibold hover:underline">
            admin@pharmexam.com
          </a>
        </p>
      </div>

      {/* Footer below card */}
      <p className="mt-5 text-xs text-white/60 text-center">© 2025 เภสัชพร้อมสอบ · All rights reserved</p>
    </main>
  );
}
