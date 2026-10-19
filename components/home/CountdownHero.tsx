"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlarmClock,
  Calendar,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// Countdown Hero — ใช้ร่วมกันระหว่างหน้าแรกของผู้ใช้และหน้า guest
// การ์ดพื้นขาวล้วน ไม่ไล่สี และมีจุดกระพริบเมื่อกำหนดการกำลังดำเนินอยู่
// ─────────────────────────────────────────────────────────────

export type CountdownExam = {
  id: number | string;
  title: string;
  description?: string | null;
  link_url?: string | null;
  targetStamp: number;
  endStamp?: number | null;
};

export type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

type CountdownHeroProps = {
  targetDate: number | null;
  targetTitle: string;
  targetDesc: string;
  targetLink?: string;
  timeLeft: TimeLeft;
  isExamStarted: boolean | number | null;
  upcomingExams: CountdownExam[];
  todayExams: CountdownExam[];
  calendarHref?: string;
  /** แต่ละหน้ามีการ์ด "กำหนดการถัดไป" คนละแบบ จึงให้ส่งตัว render เข้ามาเอง */
  renderUpcomingExam: (exam: CountdownExam, index: number) => ReactNode;
};

/**
 * ต้องระบุ timeZone ให้ชัดเจน เพราะการ์ดนี้ถูก render ทั้งฝั่งเซิร์ฟเวอร์และไคลเอนต์
 * เซิร์ฟเวอร์บน Railway รันที่ UTC ส่วนเบราว์เซอร์ผู้ใช้อยู่ UTC+7 ถ้าปล่อยให้ใช้
 * เขตเวลาของเครื่อง วันที่ที่ได้จะไม่ตรงกันเมื่อเวลาคาบเกี่ยวข้ามวัน แล้วเกิด
 * hydration mismatch (React error #418) ซึ่งทำให้ React ทิ้ง HTML แล้ววาดใหม่
 */
const formatThaiDate = (stamp: number | null | undefined) =>
  stamp
    ? new Date(stamp).toLocaleDateString("th-TH", {
        dateStyle: "long",
        timeZone: "Asia/Bangkok",
      })
    : "-";

// ── สถานะของกำหนดการ ─────────────────────────────────────────

type StatusTone = "ongoing" | "examStarted" | "upcoming";

const STATUS_STYLES: Record<StatusTone, { label: string; className: string; dot: string }> = {
  ongoing: {
    label: "กำลังดำเนินการอยู่",
    className: "bg-green-50 text-green-700 border-green-200",
    dot: "bg-green-500",
  },
  examStarted: {
    label: "กำลังดำเนินการสอบขณะนี้",
    className: "bg-red-50 text-red-600 border-red-200",
    dot: "bg-red-500",
  },
  upcoming: {
    label: "เป้าหมายที่กำลังจะมาถึง",
    className: "bg-blue-50 text-blue-700 border-blue-200",
    dot: "",
  },
};

const StatusBadge = ({ tone }: { tone: StatusTone }) => {
  const status = STATUS_STYLES[tone];
  const isLive = tone !== "upcoming";

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm border ${status.className}`}
    >
      {isLive ? (
        // จุดกระพริบเล็ก ๆ บอกว่ากำลังดำเนินการอยู่
        <span className="relative flex h-2 w-2" aria-hidden="true">
          <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping ${status.dot}`} />
          <span className={`relative inline-flex h-2 w-2 rounded-full ${status.dot}`} />
        </span>
      ) : (
        <AlarmClock size={16} />
      )}
      {status.label}
    </div>
  );
};

// ── ช่องตัวเลขนับถอยหลัง ──────────────────────────────────────

const TimeUnit = ({ label, value }: { label: string; value: number }) => (
  <div className="flex flex-col items-center">
    <div
      className="flex w-full sm:w-28 h-24 sm:h-28 items-center justify-center
      rounded-2xl bg-blue-600 shadow-sm"
    >
      <span className="text-4xl sm:text-5xl font-medium tabular-nums text-white">
        {String(value).padStart(2, "0")}
      </span>
    </div>
    <span className="mt-2 text-[0.6875rem] sm:text-sm font-medium uppercase tracking-wide text-gray-500">
      {label}
    </span>
  </div>
);

// ── รายการกำหนดการในวันเดียวกัน ──────────────────────────────

const TodayExamItem = ({ exam, index }: { exam: CountdownExam; index: number }) => (
  <div className="rounded-xl border border-blue-100 bg-white p-3.5 shadow-2xs">
    <div className="flex items-start gap-2.5">
      <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-sm font-medium text-white">
        {index + 1}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-medium leading-snug text-gray-800 break-words">{exam.title}</h3>
        {exam.description && (
          <p className="mt-1 text-sm leading-relaxed text-gray-500">{exam.description}</p>
        )}
        {exam.link_url && <AttachmentLink href={exam.link_url} label="ดูข้อมูลเพิ่มเติม / ลิงก์แนบ" />}
      </div>
    </div>
  </div>
);

const AttachmentLink = ({ href, label }: { href: string; label: string }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    className="group mt-2 inline-flex w-fit items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1 text-[0.6875rem] font-medium text-blue-700 transition-colors hover:bg-blue-100"
  >
    <ExternalLink size={12} className="text-blue-600 transition-transform group-hover:scale-110" />
    {label}
  </a>
);

// ── คอมโพเนนต์หลัก ───────────────────────────────────────────

export const CountdownHero = ({
  targetDate,
  targetTitle,
  targetDesc,
  targetLink,
  timeLeft,
  isExamStarted,
  upcomingExams,
  todayExams,
  calendarHref = "/user/calendar",
  renderUpcomingExam,
}: CountdownHeroProps) => {
  const units = [
    { label: "วัน", value: timeLeft.days },
    { label: "ชั่วโมง", value: timeLeft.hours },
    { label: "นาที", value: timeLeft.minutes },
    { label: "วินาที", value: timeLeft.seconds },
  ];

  // กำหนดการที่มีช่วงเวลาสิ้นสุด และตอนนี้กำลังนับถอยหลังไปยังวันสิ้นสุด = กำลังดำเนินอยู่
  const ongoingExam =
    todayExams.length === 1 && todayExams[0].endStamp && targetDate === todayExams[0].endStamp
      ? todayExams[0]
      : null;

  const statusTone: StatusTone = ongoingExam ? "ongoing" : isExamStarted ? "examStarted" : "upcoming";
  const hasMultipleToday = todayExams.length > 1;

  return (
    <div className="mb-12">
      <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-lg">
        <div className="grid grid-cols-1 gap-0 lg:grid-cols-3">
          {/* ซ้าย: นับถอยหลัง */}
          <div className="bg-white p-8 md:p-12 lg:col-span-2">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <StatusBadge tone={statusTone} />

              <Link
                href={calendarHref}
                className="group inline-flex items-center justify-center gap-1.5 rounded-lg border border-blue-200
                bg-white px-4 py-2 text-sm font-medium text-blue-600 shadow-sm transition-all duration-200
                hover:bg-blue-50 hover:shadow"
              >
                ดูปฏิทิน
                <ChevronRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </Link>
            </div>

            {hasMultipleToday ? (
              <div>
                <h1 className="mb-1 text-2xl font-medium text-blue-900 md:text-3xl">
                  กำหนดการที่ใกล้จะถึง ({todayExams.length} รายการ)
                </h1>
                <p className="mb-4 flex items-center gap-2 text-lg font-medium text-blue-700 sm:text-xl">
                  <Calendar size={22} className="shrink-0 text-blue-600" />
                  {formatThaiDate(targetDate)}
                </p>
                <div className="mb-6 max-h-[300px] space-y-2.5 overflow-y-auto pr-1">
                  {todayExams.map((exam, idx) => (
                    <TodayExamItem key={exam.id} exam={exam} index={idx} />
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h1 className="mb-1 text-2xl font-medium text-blue-900 md:text-3xl">
                  {targetTitle || "พร้อมรับมือทุกการสอบ"}
                </h1>
                <p className="mb-4 flex items-center gap-2 text-lg font-medium text-blue-700 sm:text-xl">
                  <Calendar
                    size={22}
                    className={`shrink-0 ${ongoingExam ? "text-green-600" : "text-blue-600"}`}
                  />
                  {ongoingExam
                    ? `${formatThaiDate(ongoingExam.targetStamp)} - ${formatThaiDate(ongoingExam.endStamp)}`
                    : formatThaiDate(targetDate)}
                </p>
              </div>
            )}

            <div className="mb-8 grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-5">
              {units.map((unit) => (
                <TimeUnit key={unit.label} label={unit.label} value={unit.value} />
              ))}
            </div>

            <div className="flex max-w-xl flex-col gap-2 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm font-medium leading-relaxed text-gray-700">{targetDesc}</p>
              {targetLink && (
                <div className="border-t border-blue-200/60 pt-2">
                  <a
                    href={targetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group inline-flex w-fit items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700"
                  >
                    <ExternalLink size={15} className="transition-transform group-hover:scale-110" />
                    ดูรายละเอียดเพิ่มเติม / ลิงก์แนบ
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* ขวา: กำหนดการถัดไป */}
          <div className="border-t border-gray-200 bg-gray-50 p-6 lg:col-span-1 lg:border-l lg:border-t-0">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="text-blue-600" size={20} />
              <h2 className="text-lg font-medium text-gray-800">กำหนดการถัดไป</h2>
            </div>
            <p className="mb-4 text-sm text-gray-500">
              {upcomingExams.length} รายการที่กำลังจะมาถึง
            </p>

            <div className="max-h-[500px] space-y-3 overflow-y-auto">
              {upcomingExams.length > 0 ? (
                upcomingExams.slice(0, 4).map((exam, index) => renderUpcomingExam(exam, index))
              ) : (
                <div className="py-8 text-center text-gray-500">
                  <CheckCircle2 className="mx-auto mb-2" size={32} />
                  <p className="text-sm">ไม่มีกำหนดการถัดไป</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/** โครงโหลดของ Countdown Hero — โทนขาวเหมือนการ์ดจริง */
export const CountdownHeroSkeleton = () => (
  <div className="mb-12">
    <div className="animate-pulse overflow-hidden rounded-3xl border border-blue-100 bg-white shadow-lg">
      <div className="grid grid-cols-1 gap-0 lg:grid-cols-3">
        <div className="bg-white p-8 md:p-12 lg:col-span-2">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div className="h-8 w-44 rounded-full bg-gray-200" />
            <div className="h-8 w-28 rounded-lg bg-gray-100" />
          </div>
          <div className="mb-4 h-9 w-3/4 rounded-xl bg-gray-200" />
          <div className="mb-8 h-5 w-48 rounded-lg bg-gray-100" />

          <div className="mb-8 grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex flex-col items-center">
                <div className="h-24 w-full rounded-2xl bg-gray-100 sm:h-28 sm:w-28" />
                <div className="mt-2 h-3 w-10 rounded bg-gray-100" />
              </div>
            ))}
          </div>
          <div className="h-14 w-full max-w-xl rounded-xl bg-gray-100" />
        </div>

        <div className="space-y-3 border-t border-gray-200 bg-gray-50 p-6 lg:col-span-1 lg:border-l lg:border-t-0">
          <div className="mb-2 h-6 w-36 rounded bg-gray-200" />
          <div className="mb-4 h-4 w-28 rounded bg-gray-100" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 rounded-xl border border-gray-200 bg-gray-50" />
          ))}
        </div>
      </div>
    </div>
  </div>
);
