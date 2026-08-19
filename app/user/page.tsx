"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import NewsCard from "@/components/News";
import { LayoutGrid, Bookmark } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CountdownHero } from "@/components/home/CountdownHero";
import { LoadingSpinner } from "@/components/LoadingSpinner";

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
        // แก้ไขในฟังก์ชัน fetchData
        const allExams = data
          .filter(
            (item: any) => item.is_public === true || item.is_public === 1,
          )
          .map((item: any) => {
            // สร้าง Date Object จาก string ที่ได้มา
            const dateObj = new Date(item.start_time);
            // บังคับให้เป็นเวลา 00:00:00.000 (เที่ยงคืนตรง) ของวันนั้น
            dateObj.setHours(0, 0, 0, 0);
            return {
              ...item,
              targetStamp: dateObj.getTime(), // ใช้ Timestamp ที่เป็นเที่ยงคืนแล้ว
            };
          })
          .sort((a: any, b: any) => a.targetStamp - b.targetStamp);
        const examToday = allExams.find(
          (exam: any) => new Date(exam.targetStamp).toDateString() === todayStr,
        );
        if (examToday) {
          setTargetDate(examToday.targetStamp);
          setTargetTitle(examToday.title);
          setTargetDesc(
            examToday.description || "เข้าร่วมการทดสอบตามกำหนดการวันนี้",
          );
          const remaining = allExams.filter(
            (e: any) => e.id !== examToday.id && e.targetStamp > now,
          );
          setUpcomingExams(remaining.slice(0, 4));
        } else {
          const futureExams = allExams.filter(
            (exam: any) => exam.targetStamp > now,
          );
          if (futureExams.length > 0) {
            setTargetDate(futureExams[0].targetStamp);
            setTargetTitle(futureExams[0].title);
            setTargetDesc(
              futureExams[0].description ||
                "เตรียมตัวให้พร้อมสำหรับการสอบที่กำลังจะมาถึง",
            );
            setUpcomingExams(futureExams.slice(1, 5));
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
          Array.isArray(newsData)
            ? newsData.filter((n: any) => n.status === "PUBLISHED")
            : [],
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
        clearInterval(timer);
      } else {
        // ใช้สูตรคำนวณที่เข้าใจง่ายและลดโอกาสพลาดเรื่องเศษส่วน
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
  }, [targetDate]);
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
          />
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2">
              <LayoutGrid className="text-blue-600" size={28} />{" "}
              ข่าวสารและประกาศ
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {loadingNews ? (
              <div className="col-span-full py-8">
                <LoadingSpinner text="กำลังโหลดข่าวสารและประกาศ..." size="md" />
              </div>
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
                      // ไม่ต้องรับ e เพราะตัวลูก (NewsCard) จัดการ stopPropagation ให้แล้ว
                      handleBookmarkToggle(Number(news.article_id));
                    }}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 bg-white rounded-[3rem] text-center border-2 border-dashed border-gray-200">
                <Bookmark className="mx-auto text-gray-200 mb-4" size={60} />
                <p className="text-gray-400 font-bold text-xl">
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
