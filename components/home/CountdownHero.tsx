"use client";

import { AlarmClock, Calendar, ChevronRight, Info } from "lucide-react";
import { LoadingSpinner } from "@/components/LoadingSpinner";

// ─────────────────────────────────────────────
// Countdown Hero — shared by /user and guest homepage
// ─────────────────────────────────────────────
export const CountdownHero = ({
  targetDate,
  targetTitle,
  targetDesc,
  timeLeft,
  isExamStarted,
  loading = false,
  calendarHref = "/user/calendar",
  onCalendarClick,
}: {
  targetDate: number | null;
  targetTitle: string;
  targetDesc: string;
  timeLeft: { days: number; hours: number; minutes: number; seconds: number };
  isExamStarted: boolean | number | null;
  loading?: boolean;
  calendarHref?: string;
  onCalendarClick?: () => void;
}) => {
  if (loading) {
    return (
      <div className="relative overflow-hidden rounded-3xl mb-12 bg-white border border-blue-100 shadow-lg min-h-[300px] flex items-center justify-center p-8">
        <LoadingSpinner size="lg" text="กำลังโหลดกำหนดการ..." />
      </div>
    );
  }

  const units = [
    { label: "วัน", val: timeLeft.days },
    { label: "ชั่วโมง", val: timeLeft.hours },
    { label: "นาที", val: timeLeft.minutes },
    { label: "วินาที", val: timeLeft.seconds },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl mb-12 bg-white border border-blue-100 shadow-lg">
      <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
        {/* Badge */}
        <div
          className={`inline-flex items-center gap-2 mb-5 px-4 py-1.5 rounded-full font-medium text-sm  border
          ${isExamStarted
              ? "bg-red-50 text-red-600 border-red-200"
              : "bg-blue-50 text-blue-700 border-blue-200"
            }`}
        >
          <AlarmClock size={14} />
          {isExamStarted
            ? "กำลังดำเนินการสอบขณะนี้"
            : "เป้าหมายที่กำลังจะมาถึง"}
        </div>

        {/* Title */}
        <h1 className="text-2xl md:text-4xl font-extrabold mb-2 text-blue-900">
          {targetTitle || "พร้อมรับมือทุกการสอบ"}
        </h1>

        {/* Date */}
        <p className="text-gray-500 text-lg flex items-center justify-center gap-2 mb-8 font-medium">
          <Calendar size={16} />
          {targetDate
            ? new Date(targetDate).toLocaleDateString("th-TH", {
              dateStyle: "long",
            })
            : "-"}
        </p>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-3 md:gap-5 mb-8 flex-wrap cursor-default">
          {units.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center">
              <div
                className="flex flex-col items-center justify-center
                bg-blue-50 border border-blue-100
                rounded-xl w-16 h-16 md:w-40 md:h-40 shadow-sm"
              >
                <span className="text-2xl md:text-6xl font-black tabular-nums text-blue-900">
                  {String(item.val).padStart(2, "0")}
                </span>
              </div>

              <span className="text-lg font-medium text-gray-500 mt-2 ">
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* Description */}
        <div className="max-w-xl w-full p-4 rounded-xl flex items-center gap-3 bg-blue-50 border border-blue-100 mb-7">
          <Info className="flex-shrink-0 text-blue-500" size={20} />
          <p className="text-left text-sm italic font-medium leading-relaxed text-gray-700">
            "{targetDesc}"
          </p>
        </div>

        {/* Button — ถ้ามี onCalendarClick (หน้า guest) ให้กดแล้วเด้ง login แทนการลิงก์ */}
        {onCalendarClick ? (
          <button
            onClick={onCalendarClick}
            className="inline-flex items-center justify-center px-8 py-3
            bg-blue-600 text-white hover:bg-blue-700
            rounded-xl font-medium text-sm transition-all gap-2
            shadow hover:scale-105 cursor-pointer"
          >
            เปิดดูปฏิทินกิจกรรม
            <ChevronRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </button>
        ) : (
          <a
            href={calendarHref}
            className="inline-flex items-center justify-center px-8 py-3
            bg-blue-600 text-white hover:bg-blue-700
            rounded-xl font-medium text-lg transition-all gap-2
            shadow hover:scale-105"
          >
            เปิดดูปฏิทินกิจกรรม
            <ChevronRight
              size={18}
              className="transition-transform group-hover:translate-x-1"
            />
          </a>
        )}
      </div>
    </div>
  );
};
