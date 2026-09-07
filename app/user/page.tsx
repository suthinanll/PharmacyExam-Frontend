"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import NewsCard from "@/components/News";
import {
  ChevronRight,
  AlarmClock,
  Calendar,
  LayoutGrid,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Trophy,
  Medal,
  Users,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// ─── Leaderboard Types ──────────────────────────────────
interface LeaderboardEntry {
  rank: number;
  university_id: number;
  university_name: string;
  avg_score: number;
  top_score: number;
  total_students: number;
  total_exams: number;
}

// Upcoming Exam Card Component (Notification style with full title)
const UpcomingExamCard = ({ exam, index }: { exam: any; index: number }) => {
  const examDate = new Date(exam.targetStamp);
  const now = Date.now();
  const diffMs = exam.targetStamp - now;
  const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const urgency =
    daysLeft <= 1
      ? { badge: "bg-red-100 text-red-700 border-red-200" }
      : daysLeft <= 3
        ? { badge: "bg-amber-100 text-amber-700 border-amber-200" }
        : { badge: "bg-blue-100 text-blue-700 border-blue-200" };

  return (
    <div className="bg-white rounded-xl shadow-xs hover:shadow-md transition-all duration-200 border border-gray-200 p-3.5 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 text-sm font-medium text-blue-800">
          <Calendar size={13} className="text-blue-600 shrink-0" />
          <span>
            {examDate.toLocaleDateString("th-TH", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>

        <span className={`text-sm font-medium px-2 py-0.5 rounded-full border ${urgency.badge}`}>
          {daysLeft > 0 ? `อีก ${daysLeft} วัน` : "วันนี้"}
        </span>
      </div>

      {/* Full title displayed cleanly */}
      <h3 className="text-sm sm:text-sm font-medium text-gray-800 leading-snug break-words">
        {exam.title}
      </h3>

      {exam.link_url && (
        <a
          href={exam.link_url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 hover:underline mt-0.5 bg-blue-50/80 px-2 py-0.5 rounded border border-blue-100 font-medium w-fit"
        >
          <ExternalLink size={11} />
          ลิงก์แนบ
        </a>
      )}
    </div>
  );
};

// Simple Countdown Hero
const CountdownHero = ({
  targetDate,
  targetTitle,
  targetDesc,
  targetLink,
  timeLeft,
  isExamStarted,
  upcomingExams,
  todayExams,
}: {
  targetDate: number | null;
  targetTitle: string;
  targetDesc: string;
  targetLink?: string;
  timeLeft: { days: number; hours: number; minutes: number; seconds: number };
  isExamStarted: boolean | number | null;
  upcomingExams: any[];
  todayExams: any[];
}) => {
  const units = [
    { label: "วัน", val: timeLeft.days },
    { label: "ชั่วโมง", val: timeLeft.hours },
    { label: "นาที", val: timeLeft.minutes },
    { label: "วินาที", val: timeLeft.seconds },
  ];

  const isOngoing =
    todayExams.length === 1 &&
    todayExams[0].endStamp &&
    targetDate === todayExams[0].endStamp;

  return (
    <div className="mb-12">
      <div className="bg-white rounded-3xl shadow-lg border border-blue-100 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          <div className="lg:col-span-2 p-8 md:p-12 bg-gradient-to-br from-blue-50 to-white">
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm border
                ${
                  isOngoing
                    ? "bg-green-50 text-green-700 border-green-200"
                    : isExamStarted
                      ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                }`}
              >
                <AlarmClock size={16} />
                {isOngoing
                  ? "กำลังดำเนินการอยู่"
                  : isExamStarted
                    ? "กำลังดำเนินการสอบขณะนี้"
                    : "เป้าหมายที่กำลังจะมาถึง"}
              </div>

              <a
                href="/user/calendar"
                className="group inline-flex items-center justify-center px-4 py-2
                bg-white text-blue-600 hover:bg-blue-50
                border border-blue-200 rounded-lg font-medium text-sm gap-1.5
                shadow-sm hover:shadow transition-all duration-200"
              >
                ดูปฏิทิน
                <ChevronRight
                  size={16}
                  className="transition-transform duration-200 group-hover:translate-x-0.5"
                />
              </a>
            </div>

            {/* แสดงหลายกำหนดการในวันเดียวกัน */}
            {todayExams.length > 1 ? (
              <div>
                <h1 className="text-2xl md:text-3xl font-medium mb-1 text-blue-900">
                  กำหนดการที่ใกล้จะถึง ({todayExams.length} รายการ)
                </h1>
                <p className="text-blue-700 text-lg sm:text-xl font-medium flex items-center gap-2 mb-4">
                  <Calendar size={22} className="text-blue-600 shrink-0" />
                  {targetDate
                    ? new Date(targetDate).toLocaleDateString("th-TH", {
                        dateStyle: "long",
                      })
                    : "-"}
                </p>
                <div className="mb-6 space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                  {todayExams.map((exam: any, idx: number) => (
                    <div
                      key={exam.id}
                      className="bg-white rounded-xl p-3.5 border border-blue-100 shadow-2xs text-sm sm:text-sm"
                    >
                      <div className="flex items-start gap-2.5">
                        <div className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium text-sm mt-0.5">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-800 leading-snug break-words">
                            {exam.title}
                          </h3>
                          {exam.description && (
                            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                              {exam.description}
                            </p>
                          )}
                          {exam.link_url && (
                            <a
                              href={exam.link_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[11px] font-medium border border-blue-200 transition-colors w-fit group"
                            >
                              <ExternalLink size={12} className="text-blue-600 group-hover:scale-110 transition-transform" />
                              ดูข้อมูลเพิ่มเติม / ลิงก์แนบ
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-2xl md:text-3xl font-medium mb-1 text-blue-900">
                  {targetTitle || "พร้อมรับมือทุกการสอบ"}
                </h1>
                {isOngoing && todayExams[0] ? (
                  <div className="mb-4">
                    <p className="text-blue-700 text-lg sm:text-xl font-medium flex items-center gap-2">
                      <Calendar size={22} className="text-green-600 shrink-0" />
                      {new Date(todayExams[0].targetStamp).toLocaleDateString(
                        "th-TH",
                        { dateStyle: "long" },
                      )}
                      {" - "}
                      {new Date(todayExams[0].endStamp).toLocaleDateString(
                        "th-TH",
                        { dateStyle: "long" },
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-blue-700 text-lg sm:text-xl font-medium flex items-center gap-2 mb-4">
                    <Calendar size={22} className="text-blue-600 shrink-0" />
                    {targetDate
                      ? new Date(targetDate).toLocaleDateString("th-TH", {
                          dateStyle: "long",
                        })
                      : "-"}
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-5 mb-8">
              {units.map((item, idx) => (
                <div key={idx} className="flex flex-col items-center">
                  <div
                    className="relative flex flex-col items-center justify-center
        w-full sm:w-28 h-24 sm:h-28 rounded-2xl
        bg-gradient-to-br from-blue-600 via-blue-600 to-indigo-700
        shadow-lg shadow-blue-200/60
        ring-1 ring-white/10 overflow-hidden"
                  >
                    {/* highlight เงาบนเพื่อให้ดูมีมิติแบบกระจก */}
                    <div className="absolute top-0 left-0 right-0 h-1/2 bg-white/10 rounded-t-2xl" />
                    <span className="relative text-4xl sm:text-5xl font-medium tabular-nums text-white drop-shadow-sm">
                      {String(item.val).padStart(2, "0")}
                    </span>
                  </div>
                  <span className="text-[11px] sm:text-sm font-medium text-gray-500 mt-2 uppercase tracking-wide">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="max-w-xl p-4 rounded-xl flex flex-col gap-2 bg-blue-50 border border-blue-100">
              <p className="text-sm font-medium leading-relaxed text-gray-700">
                {targetDesc}
              </p>
              {targetLink && (
                <div className="pt-2 border-t border-blue-200/60">
                  <a
                    href={targetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm sm:text-sm font-medium shadow-sm transition-all group w-fit"
                  >
                    <ExternalLink size={15} className="group-hover:scale-110 transition-transform" />
                    ดูรายละเอียดเพิ่มเติม / ลิงก์แนบ
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-1 bg-gray-50 p-6 border-l border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="text-blue-600" size={20} />
              <h2 className="text-lg font-medium text-gray-800">
                กำหนดการถัดไป
              </h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              {upcomingExams.length} รายการที่กำลังจะมาถึง
            </p>

            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {upcomingExams.length > 0 ? (
                upcomingExams
                  .slice(0, 4)
                  .map((exam, index) => (
                    <UpcomingExamCard key={exam.id} exam={exam} index={index} />
                  ))
              ) : (
                <div className="text-center py-8 text-gray-400">
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

// ─── University Leaderboard Component ───────────────────
const RANK_STYLES = [
  {
    bg: "bg-amber-50",
    border: "border-l-amber-400",
    badge: "bg-amber-100 text-amber-700",
    bar: "from-amber-400 to-yellow-400",
    score: "text-amber-600",
    icon: "🥇",
  },
  {
    bg: "bg-slate-50",
    border: "border-l-slate-400",
    badge: "bg-slate-100 text-slate-600",
    bar: "from-slate-400 to-gray-400",
    score: "text-slate-600",
    icon: "🥈",
  },
  {
    bg: "bg-orange-50",
    border: "border-l-orange-400",
    badge: "bg-orange-100 text-orange-600",
    bar: "from-orange-400 to-amber-400",
    score: "text-orange-600",
    icon: "🥉",
  },
];

const UniversityLeaderboard = ({
  entries,
  loading,
  userUniversityId,
}: {
  entries: LeaderboardEntry[];
  loading: boolean;
  userUniversityId: number | null;
}) => {
  const maxScore = entries[0]?.avg_score ?? 100;

  return (
    <div className="mb-10">
      {/* Section header — same style as "ข่าวสารและประกาศ" */}
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="text-amber-500" size={26} />
        <h2 className="text-2xl font-medium text-gray-800">จัดอันดับมหาวิทยาลัย</h2>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Column headers */}
        <div className="hidden sm:grid grid-cols-[3rem_1fr_7rem_5.5rem] gap-4 px-5 py-2.5 bg-white border-b border-gray-100 text-sm font-medium text-gray-400">
          <div className="text-center">อันดับ</div>
          <div>มหาวิทยาลัย</div>
          <div className="flex items-center gap-1"><Users size={11} /> นักศึกษา / ครั้ง</div>
          <div className="text-right">คะแนนเฉลี่ย</div>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            Array(5).fill(0).map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4 animate-pulse">
                <div className="w-9 h-9 rounded-xl bg-white shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 w-52 bg-white rounded-full" />
                  <div className="h-1.5 w-full bg-gray-100 rounded-full" />
                </div>
                <div className="h-6 w-14 bg-white rounded-lg" />
              </div>
            ))
          ) : entries.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <Trophy size={40} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">ยังไม่มีข้อมูลคะแนน</p>
            </div>
          ) : (
            entries.map((entry) => {
              const isTop3 = entry.rank <= 3;
              const style = isTop3 ? RANK_STYLES[entry.rank - 1] : null;
              const isUserUni = userUniversityId === entry.university_id;
              const barWidth = maxScore > 0 ? (entry.avg_score / maxScore) * 100 : 0;

              return (
                <div
                  key={entry.university_id}
                  className={`grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_1fr_7rem_5.5rem] gap-x-4 items-center
                    px-5 py-3.5 transition-colors duration-150 border-l-4
                    ${isTop3 ? `${style!.bg} ${style!.border}` : "bg-white border-l-transparent hover:bg-gray-50"}                  
                  `}
                >
                  {/* Rank */}
                  <div className="flex justify-center">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold
                        ${isTop3 ? style!.badge : "bg-gray-100 text-gray-500"}
                      `}
                    >
                      {isTop3 ? style!.icon : `${entry.rank}`}
                    </span>
                  </div>

                  {/* Name + bar + tags */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800 truncate max-w-[200px] sm:max-w-sm">
                        {entry.university_name}
                      </span>
                      {isUserUni && (
                        <span className="shrink-0 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
                          มหาวิทยาลัยของคุณ
                        </span>
                      )}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-1.5 h-1.5 bg-gray-100 rounded-full overflow-hidden max-w-xs">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r transition-all duration-700
                          ${isTop3 ? style!.bar : "from-green-400 to-teal-400"}
                        `}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    {/* Mobile stats */}
                    <div className="sm:hidden flex items-center gap-3 mt-1 text-[11px] text-gray-400">
                      <span className="flex items-center gap-1"><Users size={10} />{entry.total_students} คน</span>
                      <span className="flex items-center gap-1"><ClipboardList size={10} />{entry.total_exams} ครั้ง</span>
                    </div>
                  </div>

                  {/* Desktop stats */}
                  <div className="hidden sm:flex flex-col text-sm text-gray-400 gap-0.5">
                    <span className="flex items-center gap-1"><Users size={11} />{entry.total_students} คน</span>
                    <span className="flex items-center gap-1"><ClipboardList size={11} />{entry.total_exams} ครั้ง</span>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className={`text-lg font-medium tabular-nums leading-tight
                      ${isTop3 ? style!.score : "text-green-700"}
                    `}>
                      {entry.avg_score.toFixed(1)}
                      <span className="text-sm font-medium text-gray-400 ml-0.5">%</span>
                    </div>
                    <div className="text-sm text-gray-400 hidden sm:block">คะแนนเฉลี่ย</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {!loading && entries.length > 0 && (
          <div className="px-5 py-2.5 bg-white border-t border-gray-100">
            <p className="text-sm text-gray-400">
              จัดอันดับจากคะแนนเฉลี่ย
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Countdown Hero Skeleton Component

const CountdownHeroSkeleton = () => {
  return (
    <div className="mb-12">
      <div className="bg-white rounded-3xl shadow-lg border border-blue-100 overflow-hidden animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
          {/* Left Skeleton */}
          <div className="lg:col-span-2 p-8 md:p-12 bg-gradient-to-br from-blue-50/60 to-white">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="h-8 w-44 bg-blue-200/60 rounded-full" />
              <div className="h-8 w-28 bg-white rounded-lg" />
            </div>
            <div className="h-9 w-3/4 bg-blue-200/60 rounded-xl mb-4" />
            <div className="h-5 w-48 bg-white rounded-lg mb-8" />

            <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-5 mb-8">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex flex-col items-center">
                  <div className="w-full sm:w-28 h-24 sm:h-28 rounded-2xl bg-blue-200/50" />
                  <div className="h-3 w-10 bg-white rounded mt-2" />
                </div>
              ))}
            </div>
            <div className="h-14 w-full max-w-xl bg-blue-100/50 rounded-xl" />
          </div>

          {/* Right Skeleton */}
          <div className="lg:col-span-1 bg-gray-50 p-6 border-l border-gray-200 space-y-3">
            <div className="h-6 w-36 bg-white rounded mb-2" />
            <div className="h-4 w-28 bg-white rounded mb-4" />
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 bg-white rounded-xl border border-gray-200"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const calculateTimeLeft = (targetStamp: number | null) => {
  if (!targetStamp) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const distance = targetStamp - Date.now();
  if (distance <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000),
  };
};

const Page = () => {
  const { getToken, user } = useAuth();
  const router = useRouter();
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [targetDate, setTargetDate] = useState<number | null>(null);
  const [targetTitle, setTargetTitle] = useState<string>("");
  const [targetDesc, setTargetDesc] = useState<string>("");
  const [targetLink, setTargetLink] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [realNews, setRealNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [bookmarkIds, setBookmarkIds] = useState<number[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [todayExams, setTodayExams] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [myUniversityId, setMyUniversityId] = useState<number | null>(null);


  const handleBookmarkToggle = async (articleId: number) => {
    try {
      const token = getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/bookmark/toggle`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ articleId }),
        },
      );
      if (res.ok) {
        const result = await res.json();
        setBookmarkIds((prev) =>
          result.isBookmarked
            ? [...prev, articleId]
            : prev.filter((id) => id !== articleId),
        );
      }
    } catch (error) {
      console.error("Bookmark Error:", error);
    }
  };

  const handleNewsClick = (articleId: number) => {
    window.open(`/user/newsdetail/${articleId}`, "_blank");
  };

  const fetchData = useCallback(async () => {
    setLoadingSchedule(true);
    try {
      const token = getToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
      const now = Date.now();
      const resSched = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schedules`,
        { headers },
      );
      const todayStr = new Date().toDateString();

      let calculatedTarget: number | null = null;

      if (resSched.ok) {
        const data = await resSched.json();
        const allExams = data
          .filter(
            (item: any) => item.is_public === true || item.is_public === 1,
          )
          .map((item: any) => {
            const startObj = new Date(item.start_time);
            startObj.setHours(0, 0, 0, 0);

            const endObj = item.end_time
              ? new Date(item.end_time)
              : new Date(item.start_time);
            endObj.setHours(23, 59, 59, 999);

            return {
              ...item,
              targetStamp: startObj.getTime(),
              endStamp: endObj.getTime(),
            };
          })
          .sort((a: any, b: any) => a.targetStamp - b.targetStamp);

        // เช็กว่ามีกำหนดการที่กำลังดำเนินการอยู่ไหม (now อยู่ระหว่าง start - end)
        const ongoingExam = allExams.find(
          (exam: any) => now >= exam.targetStamp && now <= exam.endStamp,
        );

        if (ongoingExam) {
          calculatedTarget = ongoingExam.endStamp;
          setTargetDate(ongoingExam.endStamp);
          setTargetTitle(ongoingExam.title);
          setTargetDesc(
            ongoingExam.description || "กำหนดการนี้กำลังดำเนินการอยู่",
          );
          setTargetLink(ongoingExam.link_url || "");
          setTodayExams([ongoingExam]);

          const futureExams = allExams.filter((e: any) => e.targetStamp > now);
          setUpcomingExams(futureExams.slice(0, 4));
        } else {
          const examToday = allExams.find(
            (exam: any) =>
              new Date(exam.targetStamp).toDateString() === todayStr,
          );

          if (examToday) {
            // หาว่ามีกำหนดการอื่นในวันเดียวกันไหม
            const allTodayExams = allExams.filter(
              (exam: any) =>
                new Date(exam.targetStamp).toDateString() === todayStr,
            );

            calculatedTarget = examToday.targetStamp;
            setTargetDate(examToday.targetStamp);
            setTargetTitle(examToday.title);
            setTargetDesc(
              examToday.description || "เข้าร่วมการทดสอบตามกำหนดการวันนี้",
            );
            setTargetLink(examToday.link_url || "");
            setTodayExams(allTodayExams);

            const remaining = allExams.filter(
              (e: any) =>
                new Date(e.targetStamp).toDateString() !== todayStr &&
                e.targetStamp > now,
            );
            setUpcomingExams(remaining.slice(0, 4));
          } else {
            const futureExams = allExams.filter(
              (exam: any) => exam.targetStamp > now,
            );
            if (futureExams.length > 0) {
              const firstExam = futureExams[0];
              const firstExamDateStr = new Date(
                firstExam.targetStamp,
              ).toDateString();

              // หาทุกกำหนดการที่อยู่ในวันเดียวกับกำหนดการแรก
              const sameDay = futureExams.filter(
                (exam: any) =>
                  new Date(exam.targetStamp).toDateString() ===
                  firstExamDateStr,
              );

              calculatedTarget = firstExam.targetStamp;
              setTargetDate(firstExam.targetStamp);
              setTargetTitle(firstExam.title);
              setTargetDesc(
                firstExam.description ||
                  "เตรียมตัวให้พร้อมสำหรับการสอบที่กำลังจะมาถึง",
              );
              setTargetLink(firstExam.link_url || "");
              setTodayExams(sameDay); // เก็บทุกรายการในวันเดียวกัน

              // upcoming เอาเฉพาะที่ไม่ใช่วันเดียวกัน
              const remaining = futureExams.filter(
                (e: any) =>
                  new Date(e.targetStamp).toDateString() !== firstExamDateStr,
              );
              setUpcomingExams(remaining.slice(0, 4));
            } else {
              setTargetDate(null);
              setTargetTitle("");
              setTargetDesc("");
              setTargetLink("");
              setTodayExams([]);
              setUpcomingExams([]);
            }
          }
        }
      }

      if (calculatedTarget) {
        setTimeLeft(calculateTimeLeft(calculatedTarget));
      }

      setLoadingNews(true);
      const [resNews, resBookmarks] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/news`, { headers }),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/bookmark`, { headers }),
      ]);

      if (resNews.ok) {
        const newsData = await resNews.json();
        setRealNews(
          Array.isArray(newsData) ? newsData : [],
        );
      }
      if (resBookmarks && resBookmarks.ok) {
        const bookmarks = await resBookmarks.json();
        setBookmarkIds(bookmarks.map((b: any) => Number(b.news.article_id)));
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoadingSchedule(false);
      setLoadingNews(false);
    }
  }, [getToken]);

  // ─── Fetch leaderboard + my university ─────────────────
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoadingLeaderboard(true);
        const token = getToken();
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
        };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const [lbRes, meRes] = await Promise.all([
          fetch(`${apiUrl}/universities/leaderboard`, { headers }),
          token
            ? fetch(`${apiUrl}/auth/me`, {
                headers,
                credentials: 'include',
              })
            : Promise.resolve(null),
        ]);

        if (lbRes && lbRes.ok) {
          const data = await lbRes.json();
          setLeaderboard(Array.isArray(data) ? data : []);
        } else {
          console.warn('Leaderboard response not ok:', lbRes?.status);
        }
        if (meRes && meRes.ok) {
          const me = await meRes.json();
          setMyUniversityId(me?.university_id ? Number(me.university_id) : null);
        }
      } catch (e) {
        console.error('Leaderboard fetch error:', e);
      } finally {
        setLoadingLeaderboard(false);
      }
    };
    fetchLeaderboard();
  }, [getToken]);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!targetDate) return;

    const timer = setInterval(() => {
      const now = Date.now();
      const distance = targetDate - now;

      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });

        setTimeout(() => {
          if (upcomingExams.length > 0) {
            const nextExam = upcomingExams[0];
            setTargetDate(nextExam.targetStamp);
            setTargetTitle(nextExam.title);
            setTargetDesc(
              nextExam.description ||
                "เตรียมตัวให้พร้อมสำหรับการสอบที่กำลังจะมาถึง",
            );
            setTimeLeft(calculateTimeLeft(nextExam.targetStamp));
            setUpcomingExams((prev) => prev.slice(1));
          } else {
            fetchData();
          }
        }, 2000);

        clearInterval(timer);
      } else {
        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
        );
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate, upcomingExams, fetchData]);

  const isExamStarted = targetDate && Date.now() >= targetDate;

  return (
    <>
      <Navbar />
      <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {loadingSchedule ? (
            <CountdownHeroSkeleton />
          ) : (
            <CountdownHero
              targetDate={targetDate}
              targetTitle={targetTitle}
              targetDesc={targetDesc}
              targetLink={targetLink}
              timeLeft={timeLeft}
              isExamStarted={isExamStarted}
              upcomingExams={upcomingExams}
              todayExams={todayExams}
            />
          )}
          {/* ── University Leaderboard ── */}
          <UniversityLeaderboard
            entries={leaderboard}
            loading={loadingLeaderboard}
            userUniversityId={myUniversityId}
          />


          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-medium text-gray-800 flex items-center gap-2">
              <LayoutGrid className="text-blue-600" size={28} />
              ข่าวสารและประกาศ
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loadingNews ? (
              Array(4)
                .fill(0)
                .map((_, i) => (
                  <div
                    key={i}
                    className="h-80 bg-white rounded-3xl animate-pulse border border-gray-100"
                  />
                ))
            ) : realNews.length > 0 ? (
              realNews.map((news) => (
                <div
                  key={news.article_id}
                  className="cursor-pointer"
                  onClick={() => handleNewsClick(Number(news.article_id))}
                >
                  <NewsCard
                    id={Number(news.article_id)}
                    title={news.title}
                    desc={
                      news.content?.replace(/<[^>]*>/g, "").substring(0, 100) +
                      "..."
                    }
                    img={news.cover_image_url || "/img/news1.jpg"}
                    badge={
                      new Date(news.created_at).getTime() >
                      Date.now() - 7 * 24 * 60 * 60 * 1000
                        ? "ใหม่"
                        : ""
                    }
                    link={`/user/newsdetail/${news.article_id}`}
                    initialIsSaved={bookmarkIds.includes(
                      Number(news.article_id),
                    )}
                    onBookmark={() => {
                      handleBookmarkToggle(Number(news.article_id));
                    }}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 bg-white rounded-[3rem] text-center border-2 border-dashed border-gray-200">
                <Bookmark className="mx-auto text-gray-200 mb-4" size={60} />
                <p className="text-gray-400 font-medium text-xl">
                  ไม่พบข้อมูลข่าวสารในขณะนี้
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Page;
