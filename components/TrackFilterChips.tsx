"use client";

import { TRACK_FILTERS, type TrackFilter } from "@/lib/schedule";

/** ปุ่มเลือกสายการสอบ PLE (ทุกสาย / CC / IP / PC / PHCP) ใช้ทั้งหน้าแรกและหน้าปฏิทิน */
export default function TrackFilterChips({
  value,
  onChange,
  className = "",
}: {
  value: TrackFilter;
  onChange: (value: TrackFilter) => void;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`} role="group" aria-label="กรองตามสายการสอบ">
      <span className="text-xs sm:text-sm font-medium text-gray-500 mr-1">สายการสอบ</span>
      {TRACK_FILTERS.map((t) => (
        <button
          key={t.value}
          type="button"
          aria-pressed={value === t.value}
          title={t.hint}
          onClick={() => onChange(t.value)}
          className={`px-3 py-1 rounded-full text-xs sm:text-sm font-medium border transition-colors cursor-pointer ${
            value === t.value
              ? "bg-primary text-on-primary border-primary"
              : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:text-gray-900"
          }`}
        >
          {t.label}
        </button>
      ))}
      {value !== "all" && value !== "CC" && (
        <span className="text-xs text-gray-500">รวมกำหนดการ CC ที่ทุกคนต้องสอบ</span>
      )}
    </div>
  );
}
