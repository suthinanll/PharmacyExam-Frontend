"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavbarGuest from "@/components/Navbar_guest";
import Footer from "@/components/Footer";
import { CountdownHero, CountdownHeroSkeleton } from "@/components/home/CountdownHero";
import UpcomingExamCard from "@/components/home/UpcomingExamCard";
import NewsCard from "@/components/News";
import {
  LayoutGrid,
  Bookmark,
  BookOpen,
  Brain,
  CalendarDays,
  MessageSquareText,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { deriveSchedule, EMPTY_SCHEDULE, type DerivedSchedule } from "@/lib/schedule";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRequireLogin } from "@/utils/requireAuth";

const calculateTimeLeft = (targetStamp: number | null) => {
  if (!targetStamp) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const distance = targetStamp - Date.now();
  if (distance <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000),
  };
};

/**
 * initialSchedules = ข้อมูลดิบจาก GET /schedules ที่เซิร์ฟเวอร์ดึงมาให้แล้ว
 * ทำให้การ์ดนับถอยหลังพร้อม <h1> ของหน้าอยู่ใน HTML ตั้งแต่แรก
 * ไม่ต้องรอ hydrate + fetch ซึ่งเดิมทำให้ LCP ช้าและเครื่องมือตรวจ SEO มองไม่เห็น h1
 */
const HomeClient = ({ initialSchedules }: { initialSchedules: unknown | null }) => {
  const initialSchedule =
    initialSchedules === null ? null : deriveSchedule(initialSchedules, Date.now());
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { requireLogin } = useRequireLogin();
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
  const [upcomingExams, setUpcomingExams] = useState<any[]>(seed.upcomingExams);
  const [todayExams, setTodayExams] = useState<any[]>(seed.todayExams);

  // ถ้า login แล้วให้ไปหน้าของตัวเองตาม role อัตโนมัติ (admin/super admin → /admin, user → /user)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(
        user?.role_id === 2 || user?.role_id === 3
          ? "/admin"
          : user?.role_id === 1
            ? "/user"
            : "/login",
      );
    }
  }, [isLoading, isAuthenticated, user, router]);

  // บันทึกข่าว — ต้อง login ก่อน
  const handleBookmark = () => {
    requireLogin("บันทึกข่าว");
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
      const now = Date.now();
      const resSched = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/schedules`,
      );

      if (resSched.ok) {
        applySchedule(deriveSchedule(await resSched.json(), now));
      }

      setLoadingNews(true);
      const resNews = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news`);
      if (resNews.ok) {
        const newsData = await resNews.json();
        setRealNews(
          Array.isArray(newsData) ? newsData.filter((n: any) => n.status === "PUBLISHED") : [],
        );
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoadingSchedule(false);
      setLoadingNews(false);
    }
  }, [applySchedule]);

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

  // ── Feature cards (บางหน้าเปิดให้ guest ดูได้ บางอันต้อง login) ──
  const features = [
    {
      icon: <BookOpen className="w-6 h-6 text-green-600" />,
      bg: "bg-green-50",
      title: "คลังข้อสอบ",
      desc: "ฝึกทำข้อสอบใบประกอบวิชาชีพเภสัชศาสตร์หลากหลายหมวด",
      href: "/user/examset",
    },
    {
      icon: <Brain className="w-6 h-6 text-purple-600" />,
      bg: "bg-purple-50",
      title: "ข้อสอบ CAT",
      desc: "ปรับระดับข้อสอบตามความสามารถของคุณ",
    },
    {
      icon: <CalendarDays className="w-6 h-6 text-blue-600" />,
      bg: "bg-blue-50",
      title: "ปฏิทินการสอบ",
      desc: "ดูตารางสอบและกิจกรรมสำคัญ",
      href: "/user/calendar",
    },
    {
      icon: <MessageSquareText className="w-6 h-6 text-orange-600" />,
      bg: "bg-orange-50",
      title: "แชตบอตผู้ช่วย",
      desc: "สอบถามข้อมูลเภสัชกรรมด้วย AI",
    },
    {
      icon: <TrendingUp className="w-6 h-6 text-indigo-600" />,
      bg: "bg-indigo-50",
      title: "ติดตามความคืบหน้า",
      desc: "ดูสถิติและความก้าวหน้าของตัวเอง",
    },
  ];

  return (
    <>
      <NavbarGuest />
      <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto">
          {/* ── Countdown Hero ── */}
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
              calendarHref="/user/calendar"
              renderUpcomingExam={(exam) => (
                <UpcomingExamCard key={exam.id} exam={exam} />
              )}
            />
          )}

          {/* ── Feature cards (ต้อง login) ── */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="text-green-600" size={24} />
              <h2 className="text-2xl font-medium text-gray-800 flex items-center gap-2">ฟีเจอร์เด่น</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {features.map((f) =>
                f.href ? (
                  <Link
                    key={f.title}
                    href={f.href}
                    className="block text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${f.bg}`}>
                      {f.icon}
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1 text-lg">{f.title}</h3>
                    <p className="text-sm text-gray-500">{f.desc}</p>
                  </Link>
                ) : (
                  <div
                    key={f.title}
                    onClick={() => requireLogin(f.title)}
                    className="text-left bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
                  >
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 ${f.bg}`}>
                      {f.icon}
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1 text-lg">{f.title}</h3>
                    <p className="text-sm text-gray-500">{f.desc}</p>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-medium text-gray-800 flex items-center gap-2">
              <LayoutGrid className="text-blue-600" size={28} />
              ข่าวสารและประกาศ
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loadingNews ? (
              <div className="col-span-full py-8">
                <LoadingSpinner text="กำลังโหลดข่าวสารและประกาศ..." size="md" />
              </div>
            ) : realNews.length > 0 ? (
              realNews.map((news) => {
                const articleId = Number(news.article_id);

                return (
                  <NewsCard
                    key={articleId}
                    id={articleId}
                    title={news.title}
                    desc={news.description || news.content?.replace(/<[^>]*>/g, "").substring(0, 100) + "..."}
                    img={news.image_url || news.cover_image_url || "/img/news1.jpg"}
                    badge={news.category_names || (new Date(news.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000 ? "ใหม่" : "")}
                    link={`/user/newsdetail/${articleId}`}
                    initialIsSaved={false}
                    onBookmark={handleBookmark}
                  />
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-medium text-gray-700 text-lg">ไม่มีข่าวสารและประกาศในขณะนี้</p>
                <p className="text-sm text-gray-500 mt-1">กรุณากลับมาตรวจสอบใหม่อีกครั้งในภายหลัง</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default HomeClient;
