"use client";

import { useState } from "react";
import { Calendar, ChevronDown, ExternalLink } from "lucide-react";
import type { CountdownExam } from "./CountdownHero";

// การ์ดกำหนดการถัดไป ใช้ร่วมกันระหว่างหน้าแรกของผู้ใช้ (/user) และหน้า guest (/)
// กล่องจำนวนวันชิดซ้าย สีตามความเร่งด่วน
// ชื่อเรื่องและรายละเอียดย่อไว้ก่อน กด "ดูเพิ่มเติม" เพื่ออ่านข้อความเต็ม
export default function UpcomingExamCard({ exam }: { exam: CountdownExam }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const daysLeft = Math.floor((exam.targetStamp - Date.now()) / (1000 * 60 * 60 * 24));

  // ใกล้ถึงกำหนด = แดง, ใกล้ ๆ = ส้ม, ยังอีกไกล = ฟ้า
  const dayBoxColor =
    daysLeft <= 1 ? "bg-red-600" : daysLeft <= 3 ? "bg-amber-700" : "bg-blue-600";

  // ข้อความยาวพอที่จะถูกตัด จึงค่อยมีปุ่มให้กางอ่าน
  const hasMore = Boolean(exam.description) || exam.title.length > 40;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div
        className={`flex h-14 w-14 flex-shrink-0 flex-col items-center justify-center rounded-lg text-white ${dayBoxColor}`}
      >
        <span className="text-xl font-medium leading-none tabular-nums">
          {daysLeft > 0 ? daysLeft : "0"}
        </span>
        <span className="mt-1 text-[0.625rem] font-medium leading-none">
          {daysLeft > 0 ? "วัน" : "วันนี้"}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <h3
          className={`text-sm font-medium text-gray-800 break-words ${isExpanded ? "" : "line-clamp-2"}`}
          title={exam.title}
        >
          {exam.title}
        </h3>
        <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-500">
          <Calendar size={12} />
          {new Date(exam.targetStamp).toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric",
            // ระบุเขตเวลาให้ตรงกันทั้งฝั่งเซิร์ฟเวอร์และเบราว์เซอร์ (ดู formatThaiDate ใน CountdownHero)
            timeZone: "Asia/Bangkok",
          })}
        </p>
        {exam.description && isExpanded && (
          <p className="mt-1.5 whitespace-pre-line text-xs leading-relaxed text-gray-600">
            {exam.description}
          </p>
        )}
        {hasMore && (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="mt-1 inline-flex items-center gap-0.5 text-[0.6875rem] font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
          >
            {isExpanded ? "ย่อข้อความ" : "ดูเพิ่มเติม"}
            <ChevronDown
              size={12}
              className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
            />
          </button>
        )}
        {exam.link_url && (
          <a
            href={exam.link_url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="mt-1 inline-flex w-fit items-center gap-1 rounded border border-blue-100 bg-blue-50/80 px-2 py-0.5 text-[0.6875rem] font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            <ExternalLink size={11} />
            ลิงก์แนบ
          </a>
        )}
      </div>
    </div>
  );
}
