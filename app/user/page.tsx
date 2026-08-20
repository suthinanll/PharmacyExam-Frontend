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
  Clock,
  CheckCircle2,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Upcoming Exam Card Component
const UpcomingExamCard = ({ exam, index }: { exam: any; index: number }) => {
  const examDate = new Date(exam.targetStamp);
  const now = Date.now();
  const diffMs = exam.targetStamp - now;
  const daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // สีตามความเร่งด่วน: ใกล้ = แดง/ส้ม, ไกลออกไป = ฟ้า
  const urgency =
    daysLeft <= 1
      ? { box: "bg-red-500", text: "text-red-600", bg: "bg-red-50" }
      : daysLeft <= 3
        ? { box: "bg-amber-500", text: "text-amber-600", bg: "bg-amber-50" }
        : { box: "bg-blue-500", text: "text-blue-600", bg: "bg-blue-50" };

  return (
    <div className="flex items-center gap-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-200 border border-gray-200 p-3">
      {/* กล่องตัวเลขวันที่เหลือ - กระชับ ไม่กินพื้นที่แนวตั้ง */}
      <div
        className={`flex-shrink-0 flex flex-col items-center justify-center w-14 h-14 rounded-lg ${urgency.box} text-white`}
      >
        <span className="text-xl font-medium leading-none tabular-nums">
          {daysLeft > 0 ? daysLeft : "0"}
        </span>
        <span className="text-[10px] font-medium leading-none mt-1">
          {daysLeft > 0 ? "วัน" : "วันนี้"}
        </span>
      </div>

      {/* ข้อมูลรายการ */}
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-medium text-gray-800 line-clamp-1">
          {exam.title}
        </h3>
        <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
          <Calendar size={12} />
          {examDate.toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </p>
      </div>
    </div>
  );
};

// Simple Countdown Hero
const CountdownHero = ({
  targetDate,
  targetTitle,
  targetDesc,
  timeLeft,
  isExamStarted,
  upcomingExams,
  todayExams,
}: {
  targetDate: number | null;
  targetTitle: string;
  targetDesc: string;
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
          {/* Left: Countdown (2/3) */}
          <div className="lg:col-span-2 p-8 md:p-12 bg-gradient-to-br from-blue-50 to-white">
            {/* แถวบน: badge สถานะ + ปุ่มดูปฏิทิน อยู่คนละฝั่ง ไม่กินพื้นที่แนวตั้งเพิ่ม */}
            <div className="flex items-center justify-between flex-wrap gap-3 mb-5">
              <div
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm border
                ${
                  isOngoing
                    ? "bg-green-50 text-green-700 border-green-200"
                    : isExamStarted
                      ? "bg-red-50 text-red-600 border-red-200"
                      : "bg-blue-50 text-blue-700 border-blue-200"
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
                <h1 className="text-3xl md:text-4xl font-medium mb-3 text-blue-900">
                  กำหนดการวันนี้ ({todayExams.length} รายการ)
                </h1>
                <p className="text-gray-600 text-base flex items-center gap-2 mb-4 font-medium">
                  <Calendar size={18} className="text-blue-500" />
                  {targetDate
                    ? new Date(targetDate).toLocaleDateString("th-TH", {
                        dateStyle: "long",
                      })
                    : "-"}
                </p>
                <div className="mb-6 space-y-3">
                  {todayExams.map((exam: any, idx: number) => (
                    <div
                      key={exam.id}
                      className="bg-white rounded-xl p-4 border border-blue-200 shadow-sm"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-medium text-sm">
                          {idx + 1}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-800 mb-1">
                            {exam.title}
                          </h3>
                          {exam.description && (
                            <p className="text-sm text-gray-600">
                              {exam.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h1 className="text-3xl md:text-4xl font-medium mb-3 text-blue-900">
                  {targetTitle || "พร้อมรับมือทุกการสอบ"}
                </h1>
                {isOngoing && todayExams[0] ? (
                  <div className="mb-4">
                    <p className="text-gray-600 text-base flex items-center gap-2 font-medium">
                      <Calendar size={18} className="text-green-600" />
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
                  <p className="text-gray-600 text-base flex items-center gap-2 mb-8 font-medium">
                    <Calendar size={18} className="text-blue-500" />
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
                  <span className="text-[11px] sm:text-xs font-medium text-gray-500 mt-2 uppercase tracking-wide">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="max-w-xl p-4 rounded-xl flex items-start gap-3 bg-blue-50 border border-blue-100">
              <p className="text-sm font-medium leading-relaxed text-gray-700">
                {targetDesc}
              </p>
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

const Page = () => {
  const { getToken } = useAuth();
  const router = useRouter();
  const [targetDate, setTargetDate] = useState<number | null>(null);
  const [targetTitle, setTargetTitle] = useState<string>("");
  const [targetDesc, setTargetDesc] = useState<string>("");
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
    router.push(`/user/newsdetail/${articleId}`);
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
      const todayStr = new Date().toDateString();

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
          setTargetDate(ongoingExam.endStamp);
          setTargetTitle(ongoingExam.title);
          setTargetDesc(
            ongoingExam.description || "กำหนดการนี้กำลังดำเนินการอยู่",
          );
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

            setTargetDate(examToday.targetStamp);
            setTargetTitle(examToday.title);
            setTargetDesc(
              examToday.description || "เข้าร่วมการทดสอบตามกำหนดการวันนี้",
            );
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

              setTargetDate(firstExam.targetStamp);
              setTargetTitle(firstExam.title);
              setTargetDesc(
                firstExam.description ||
                  "เตรียมตัวให้พร้อมสำหรับการสอบที่กำลังจะมาถึง",
              );
              setTodayExams(sameDay); // เก็บทุกรายการในวันเดียวกัน

              // upcoming เอาเฉพาะที่ไม่ใช่วันเดียวกัน
              const remaining = futureExams.filter(
                (e: any) =>
                  new Date(e.targetStamp).toDateString() !== firstExamDateStr,
              );
              setUpcomingExams(remaining.slice(0, 4));
            }
          }
        }
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
      setLoadingNews(false);
    }
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
          <CountdownHero
            targetDate={targetDate}
            targetTitle={targetTitle}
            targetDesc={targetDesc}
            timeLeft={timeLeft}
            isExamStarted={isExamStarted}
            upcomingExams={upcomingExams}
            todayExams={todayExams}
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
