"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar_user";
import { CountdownHero, CountdownHeroSkeleton, type CountdownExam } from "@/components/home/CountdownHero";
import Footer from "@/components/Footer";
import NewsCard from "@/components/News";
import {
  Calendar,
  ChevronDown,
  LayoutGrid,
  Bookmark,
  ExternalLink,
  Trophy,
  Medal,
  Users,
  ClipboardList,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { deriveSchedule, EMPTY_SCHEDULE, type DerivedSchedule } from "@/lib/schedule";

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

// การ์ดกำหนดการถัดไป — กล่องจำนวนวันชิดซ้าย สีตามความเร่งด่วน
// ชื่อเรื่องและรายละเอียดย่อไว้ก่อน กด "ดูเพิ่มเติม" เพื่ออ่านข้อความเต็ม
const UpcomingExamCard = ({ exam }: { exam: CountdownExam }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const examDate = new Date(exam.targetStamp);
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
        <span className="mt-1 text-[10px] font-medium leading-none">
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
          {examDate.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric",
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
            className="mt-1 inline-flex items-center gap-0.5 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
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
            className="mt-1 inline-flex w-fit items-center gap-1 rounded border border-blue-100 bg-blue-50/80 px-2 py-0.5 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            <ExternalLink size={11} />
            ลิงก์แนบ
          </a>
        )}
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
    score: "text-amber-700",
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
    badge: "bg-orange-100 text-orange-700",
    bar: "from-orange-400 to-amber-400",
    score: "text-orange-700",
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
        <div className="hidden sm:grid grid-cols-[3rem_1fr_7rem_5.5rem] gap-4 px-5 py-2.5 bg-white border-b border-gray-100 text-sm font-medium text-gray-500">
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
            <div className="py-16 text-center text-gray-500">
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
                    <div className="sm:hidden flex items-center gap-3 mt-1 text-[11px] text-gray-500">
                      <span className="flex items-center gap-1"><Users size={10} />{entry.total_students} คน</span>
                      <span className="flex items-center gap-1"><ClipboardList size={10} />{entry.total_exams} ครั้ง</span>
                    </div>
                  </div>

                  {/* Desktop stats */}
                  <div className="hidden sm:flex flex-col text-sm text-gray-500 gap-0.5">
                    <span className="flex items-center gap-1"><Users size={11} />{entry.total_students} คน</span>
                    <span className="flex items-center gap-1"><ClipboardList size={11} />{entry.total_exams} ครั้ง</span>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className={`text-lg font-medium tabular-nums leading-tight
                      ${isTop3 ? style!.score : "text-green-700"}
                    `}>
                      {entry.avg_score.toFixed(1)}
                      <span className="text-sm font-medium text-gray-500 ml-0.5">%</span>
                    </div>
                    <div className="text-sm text-gray-500 hidden sm:block">คะแนนเฉลี่ย</div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {!loading && entries.length > 0 && (
          <div className="px-5 py-2.5 bg-white border-t border-gray-100">
            <p className="text-sm text-gray-500">
              จัดอันดับจากคะแนนเฉลี่ย
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Countdown Hero Skeleton Component

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

/**
 * initialSchedules = ข้อมูลดิบจาก GET /schedules ที่เซิร์ฟเวอร์ดึงมาให้แล้ว
 * ทำให้การ์ดนับถอยหลังถูกวาดมาพร้อม HTML ไม่ต้องรอ fetch หลัง hydrate
 * ถ้าเป็น null (ดึงไม่สำเร็จ) จะกลับไปแสดง skeleton แล้วดึงฝั่งไคลเอนต์เหมือนเดิม
 */
const UserHomeClient = ({ initialSchedules }: { initialSchedules: unknown | null }) => {
  const initialSchedule =
    initialSchedules === null ? null : deriveSchedule(initialSchedules, Date.now());
  const { getToken, user } = useAuth();
  const router = useRouter();
  const [loadingSchedule, setLoadingSchedule] = useState(initialSchedule === null);
  const seed = initialSchedule ?? EMPTY_SCHEDULE;
  const [targetDate, setTargetDate] = useState<number | null>(seed.targetDate);
  const [targetTitle, setTargetTitle] = useState<string>(seed.targetTitle);
  const [targetDesc, setTargetDesc] = useState<string>(seed.targetDesc);
  const [targetLink, setTargetLink] = useState<string>(seed.targetLink);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [realNews, setRealNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [bookmarkIds, setBookmarkIds] = useState<number[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<any[]>(seed.upcomingExams);
  const [todayExams, setTodayExams] = useState<any[]>(seed.todayExams);
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

  const applySchedule = useCallback((next: DerivedSchedule) => {
    setTargetDate(next.targetDate);
    setTargetTitle(next.targetTitle);
    setTargetDesc(next.targetDesc);
    setTargetLink(next.targetLink);
    setTodayExams(next.todayExams);
    setUpcomingExams(next.upcomingExams);
  }, []);

  const fetchData = useCallback(async () => {
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

      if (resSched.ok) {
        applySchedule(deriveSchedule(await resSched.json(), now));
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
  }, [getToken, applySchedule]);

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
    setTimeLeft(calculateTimeLeft(targetDate));
  }, [targetDate]);

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
              renderUpcomingExam={(exam) => (
                <UpcomingExamCard key={exam.id} exam={exam} />
              )}
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
                <p className="text-gray-500 font-medium text-xl">
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

export default UserHomeClient;
