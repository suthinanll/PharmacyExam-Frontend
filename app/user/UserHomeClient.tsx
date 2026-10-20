"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar_user";
import { CountdownHero, CountdownHeroSkeleton } from "@/components/home/CountdownHero";
import UpcomingExamCard from "@/components/home/UpcomingExamCard";
import Footer from "@/components/Footer";
import Link from "next/link";
import NewsCard from "@/components/News";
import {
  LayoutGrid,
  Bookmark,
  Trophy,
  Medal,
  Users,
  ClipboardList,
  BookOpenCheck,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  deriveSchedule,
  EMPTY_SCHEDULE,
  readSavedTrack,
  saveTrack,
  type DerivedSchedule,
  type TrackFilter,
} from "@/lib/schedule";
import TrackFilterChips from "@/components/TrackFilterChips";

// ─── Leaderboard Types ──────────────────────────────────
// backend ไม่ส่งชื่อมหาวิทยาลัยมาเลย มีแค่ธง is_mine บอกว่าแถวไหนเป็นของผู้ใช้
interface LeaderboardEntry {
  rank: number;
  is_mine: boolean;
  avg_score: number;
  top_score: number;
  total_students: number;
  total_exams: number;
}

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
}: {
  entries: LeaderboardEntry[];
  loading: boolean;
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
              const isUserUni = entry.is_mine;
              const barWidth = maxScore > 0 ? (entry.avg_score / maxScore) * 100 : 0;

              return (
                <div
                  key={entry.rank}
                  className={`grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_1fr_7rem_5.5rem] gap-x-4 items-center
                    px-5 py-3.5 transition-colors duration-150 border-l-4
                    ${isTop3 ? `${style!.bg} ${style!.border}` : "bg-white border-l-transparent hover:bg-gray-50"}                  
                  `}
                >
                  {/* Rank */}
                  <div className="flex justify-center">
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-medium
                        ${isTop3 ? style!.badge : "bg-gray-100 text-gray-500"}
                      `}
                    >
                      {isTop3 ? style!.icon : `${entry.rank}`}
                    </span>
                  </div>

                  {/* Name + bar + tags */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium truncate max-w-[200px] sm:max-w-sm ${isUserUni ? "text-gray-800" : "text-gray-500"}`}>
                        {isUserUni ? "มหาวิทยาลัยของคุณ" : `มหาวิทยาลัยอันดับ ${entry.rank}`}
                      </span>
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
                    <div className="sm:hidden flex items-center gap-3 mt-1 text-[0.6875rem] text-gray-500">
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
              จัดอันดับจากคะแนนเฉลี่ย · ไม่เปิดเผยชื่อมหาวิทยาลัย
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
  // เก็บตารางสอบดิบไว้ คำนวณการ์ดนับถอยหลังใหม่ได้ทันทีเมื่อเปลี่ยนสาย ไม่ต้องดึงซ้ำ
  const [rawSchedules, setRawSchedules] = useState<unknown | null>(initialSchedules);
  const [trackFilter, setTrackFilter] = useState<TrackFilter>("all");
  const trackFilterRef = useRef<TrackFilter>("all");
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);


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

  // HTML จากเซิร์ฟเวอร์คำนวณแบบทุกสาย แล้วค่อยปรับตามสายที่จำไว้ในเครื่องหลัง hydrate
  useEffect(() => {
    const saved = readSavedTrack();
    if (saved === "all") return;
    trackFilterRef.current = saved;
    setTrackFilter(saved);
    if (initialSchedules !== null) applySchedule(deriveSchedule(initialSchedules, Date.now(), saved));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeTrackFilter = (value: TrackFilter) => {
    trackFilterRef.current = value;
    setTrackFilter(value);
    saveTrack(value);
    if (rawSchedules !== null) applySchedule(deriveSchedule(rawSchedules, Date.now(), value));
  };

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
        const raw = await resSched.json();
        setRawSchedules(raw);
        applySchedule(deriveSchedule(raw, now, trackFilterRef.current));
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

        const lbRes = await fetch(`${apiUrl}/universities/leaderboard`, { headers });

        if (lbRes && lbRes.ok) {
          const data = await lbRes.json();
          setLeaderboard(Array.isArray(data) ? data : []);
        } else {
          console.warn('Leaderboard response not ok:', lbRes?.status);
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
          <TrackFilterChips value={trackFilter} onChange={changeTrackFilter} className="mb-3" />
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
          {/* ── ทบทวนประจำวัน ── */}
          <Link
            href="/user/daily-review"
            className="mb-10 flex items-center gap-4 rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm transition-colors hover:border-green-200 hover:bg-green-50/40"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">
              <BookOpenCheck size={22} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-medium text-gray-800">ทบทวนประจำวัน</span>
              <span className="block text-sm text-gray-500">วันละ 5 ข้อ เน้นข้อที่เคยตอบผิด ใช้เวลาไม่กี่นาที</span>
            </span>
            <ArrowRight size={18} className="shrink-0 text-gray-400" />
          </Link>

          {/* ── University Leaderboard ── */}
          <UniversityLeaderboard
            entries={leaderboard}
            loading={loadingLeaderboard}
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
