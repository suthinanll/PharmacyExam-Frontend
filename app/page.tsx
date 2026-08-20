"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import NavbarGuest from "@/components/Navbar_guest";
import Footer from "@/components/Footer";
import NewsCard from "@/components/News";
import { LayoutGrid, Bookmark, BookOpen, Brain, CalendarDays, MessageSquareText, TrendingUp } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CountdownHero } from "@/components/home/CountdownHero";
import { LoadingSpinner } from "@/components/LoadingSpinner";
import { useRequireLogin } from "@/utils/requireAuth";

function calculateTimeLeft(targetDate: number | null) {
  if (!targetDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  const now = Date.now();
  const distance = targetDate - now;
  if (distance <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((distance % (1000 * 60)) / 1000);
  return { days, hours, minutes, seconds };
}

const Page = () => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { requireLogin } = useRequireLogin();
  const [targetDate, setTargetDate] = useState<number | null>(null);
  const [targetTitle, setTargetTitle] = useState<string>("");
  const [targetDesc, setTargetDesc] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [realNews, setRealNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  // ถ้า login แล้วให้ไปหน้าของตัวเองตาม role อัตโนมัติ (admin → /admin, user → /user)
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(
        user?.role_id === 2 ? "/admin" : user?.role_id === 1 ? "/user" : "/login",
      );
    }
  }, [isLoading, isAuthenticated, user, router]);

  // บันทึกข่าว — ต้อง login ก่อน
  const handleBookmark = () => {
    requireLogin("บันทึกข่าว");
  };

  const fetchData = useCallback(async () => {
    try {
      setLoadingSchedule(true);
      const now = Date.now();
      const resSched = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules`);
      const todayStr = new Date().toDateString();

      if (resSched.ok) {
        const data = await resSched.json();
        const allExams = data
          .filter((item: any) => item.is_public === true || item.is_public === 1)
          .map((item: any) => {
            const dateObj = new Date(item.start_time);
            dateObj.setHours(0, 0, 0, 0);
            return { ...item, targetStamp: dateObj.getTime() };
          })
          .sort((a: any, b: any) => a.targetStamp - b.targetStamp);
        const examToday = allExams.find(
          (exam: any) => new Date(exam.targetStamp).toDateString() === todayStr,
        );
        if (examToday) {
          setTargetDate(examToday.targetStamp);
          setTargetTitle(examToday.title);
          setTargetDesc(examToday.description || "เข้าร่วมการทดสอบตามกำหนดการวันนี้");
          setTimeLeft(calculateTimeLeft(examToday.targetStamp));
        } else {
          const futureExams = allExams.filter((exam: any) => exam.targetStamp > now);
          if (futureExams.length > 0) {
            setTargetDate(futureExams[0].targetStamp);
            setTargetTitle(futureExams[0].title);
            setTargetDesc(futureExams[0].description || "เตรียมตัวให้พร้อมสำหรับการสอบที่กำลังจะมาถึง");
            setTimeLeft(calculateTimeLeft(futureExams[0].targetStamp));
          }
        }
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
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!targetDate) return;
    const timer = setInterval(() => {
      const calculated = calculateTimeLeft(targetDate);
      setTimeLeft(calculated);

      const now = Date.now();
      const distance = targetDate - now;
      if (distance <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        clearInterval(timer);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const isExamStarted = targetDate ? Date.now() >= targetDate : false;

  // ── Feature cards (บางหน้าเปิดให้ guest ดูได้ บางอันต้อง login) ──
  const features = [
    {
      icon: <BookOpen className="w-6 h-6 text-green-600" />,
      bg: "bg-green-50",
      title: "คลังข้อสอบ",
      desc: "ฝึกทำข้อสอบเภสัชศาสตร์หลากหลายหมวด",
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

          {/* Hero: คำเชิญชวนเข้าใช้งาน */}
          <div className="relative overflow-hidden rounded-3xl mb-12 bg-gradient-to-r from-green-600 to-green-700 shadow-lg">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 md:p-12">
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-extrabold text-white mb-3">
                  เภสัชพร้อมสอบ
                </h1>
                <p className="text-green-100 text-base md:text-lg leading-relaxed max-w-xl mx-auto md:mx-0">
                  แพลตฟอร์มเตรียมสอบใบประกอบวิชาชีพเภสัชกรรม — ฝึกข้อสอบ วัดความสามารถ
                  ติดตามความคืบหน้า ได้ทุกที่ทุกเวลา
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-3 mt-6">
                  <button
                    onClick={() => requireLogin("เริ่มทำข้อสอบ")}
                    className="w-full sm:w-auto px-8 py-3 bg-white text-green-700 font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-green-50 transition-all duration-200"
                  >
                    เริ่มทำข้อสอบเลย
                  </button>
                  <button
                    onClick={() => router.push("/register")}
                    className="w-full sm:w-auto px-8 py-3 text-white font-semibold border-2 border-white/60 rounded-xl hover:bg-white/10 transition-all duration-200"
                  >
                    สมัครสมาชิกฟรี
                  </button>
                </div>
              </div>
              <div className="hidden lg:flex items-center justify-center">
                <div className="w-40 h-40 rounded-3xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                  <span className="text-7xl">💊</span>
                </div>
              </div>
            </div>
          </div>

          <CountdownHero
            targetDate={targetDate}
            targetTitle={targetTitle}
            targetDesc={targetDesc}
            timeLeft={timeLeft}
            isExamStarted={isExamStarted}
            loading={loadingSchedule}
            calendarHref="/user/calendar"
          />

          {/* ── Feature cards (ต้อง login) ── */}
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="text-green-600" size={24} />
              <h2 className="text-2xl font-bold text-gray-800">ฟีเจอร์เด่น</h2>
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
                    <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                    <p className="text-xs text-gray-500">{f.desc}</p>
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
                    <h3 className="font-semibold text-gray-900 mb-1">{f.title}</h3>
                    <p className="text-xs text-gray-500">{f.desc}</p>
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
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
                    desc={news.description}
                    img={news.image_url}
                    badge={news.category_names}
                    link={`/user/newsdetail/${articleId}`}
                    initialIsSaved={false}
                    onBookmark={handleBookmark}
                  />
                );
              })
            ) : (
              <div className="col-span-full text-center py-12 text-gray-500 bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
                <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-semibold text-gray-700">ไม่มีข่าวสารและประกาศในขณะนี้</p>
                <p className="text-sm text-gray-400 mt-1">กรุณากลับมาตรวจสอบใหม่อีกครั้งในภายหลัง</p>
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
