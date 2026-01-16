'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar_user';
import Footer from '@/components/Footer';
import NewsCard from '@/components/์News';
import SearchBar from "@/components/SearchBar";
import { ChevronRight, AlarmClock, Flame, Info, Calendar } from 'lucide-react';

// --- Components ย่อย (University Leaderboard) ---
const universityLeaderboardData = [
  { rank: 1, name: "มหาวิทยาลัยเชียงใหม่", score: 85.75 },
  { rank: 2, name: "มหาวิทยาลัยมหิดล", score: 84.30 },
  { rank: 3, name: "จุฬาลงกรณ์มหาวิทยาลัย", score: 83.99 },
  { rank: 4, name: "มหาวิทยาลัยสงขลานครินทร์", score: 81.12 },
  { rank: 5, name: "มหาวิทยาลัยขอนแก่น", score: 80.50 },
  { rank: 6, name: "มหาวิทยาลัยเกษตรศาสตร์", score: 79.88 },
  { rank: 7, name: "มหาวิทยาลัยธรรมศาสตร์", score: 78.90 },
];

const UniversityLeaderboardCard = ({ rank, name, score }: any) => (
  <div className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors duration-150 rounded-lg">
    <div className="flex items-center space-x-4">
      <span className="text-lg font-bold w-6 text-center text-gray-500">{String(rank).padStart(2, '0')}</span>
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">{name.substring(0, 1)}</div>
      <span className="text-gray-700 font-medium truncate">{name}</span>
    </div>
    <div className="text-xl font-extrabold text-blue-700">{score.toFixed(2)}</div>
  </div>
);

const UniversityLeaderboard = () => {
  const top3 = universityLeaderboardData.slice(0, 3);
  const remaining = universityLeaderboardData.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]];

  const podiumStyles: any = {
    1: { medal: '🥇', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-400', textColor: 'text-yellow-600', height: 'h-40', shadow: 'shadow-2xl', ring: 'ring-4 ring-yellow-200' },
    2: { medal: '🥈', bgColor: 'bg-gray-50', borderColor: 'border-gray-400', textColor: 'text-gray-600', height: 'h-32', shadow: 'shadow-xl', ring: 'ring-4 ring-gray-200' },
    3: { medal: '🥉', bgColor: 'bg-orange-50', borderColor: 'border-orange-400', textColor: 'text-orange-600', height: 'h-28', shadow: 'shadow-xl', ring: 'ring-4 ring-orange-200' },
  };

  return (
    <div className='bg-white rounded-3xl shadow-lg p-6 sm:p-8 md:p-10 mb-6 border border-gray-200'>
      <div className='flex items-center justify-between gap-2 mb-8'>
        <div className='flex items-center gap-3'>
          <div className='bg-yellow-50 p-3 rounded-xl'><span className='text-2xl'>🏆</span></div>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-bold text-gray-800'>อันดับคะแนนเฉลี่ยสูงสุด <span className='block text-sm font-normal text-gray-500 mt-1'>มหาวิทยาลัย</span></h2>
        </div>
      </div>
      <div className="relative bg-gray-50 rounded-2xl p-6 mb-8 overflow-hidden">
        <div className="flex justify-center items-end gap-3 sm:gap-6">
          {podiumOrder.map((uni) => {
            const style = podiumStyles[uni.rank];
            return (
              <div key={uni.rank} className={`relative flex flex-col items-center ${uni.rank === 1 ? 'z-10' : 'z-0'}`}>
                <div className={`absolute -top-3 ${uni.rank === 1 ? 'animate-bounce' : ''}`}>
                  <div className={`${style.bgColor} ${style.ring} rounded-full p-2 ${style.shadow}`}><span className='text-3xl sm:text-4xl'>{style.medal}</span></div>
                </div>
                <div className={`${style.bgColor} ${style.borderColor} border-2 ${style.shadow} rounded-2xl p-4 w-28 sm:w-36 md:w-40 mt-12`}>
                  <div className={`${style.textColor} text-2xl font-bold text-center mb-2`}>#{uni.rank}</div>
                  <div className='text-center mb-3'><p className='text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 min-h-[2.5rem]'>{uni.name}</p></div>
                  <div className={`bg-white rounded-xl p-2 border ${style.borderColor}`}>
                    <p className='text-xs text-gray-500 text-center'>คะแนน</p>
                    <p className={`text-lg font-bold ${style.textColor} text-center`}>{uni.score.toFixed(2)}</p>
                  </div>
                </div>
                <div className={`${style.bgColor} ${style.borderColor} border-t-4 ${style.height} w-28 sm:w-36 md:w-40 rounded-b-2xl flex items-end justify-center pb-3 shadow-inner`}>
                  <span className={`text-4xl font-bold ${style.textColor} opacity-20`}>{uni.rank}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="space-y-2">{remaining.map((uni) => <UniversityLeaderboardCard key={uni.rank} {...uni} />)}</div>
    </div>
  );
};

// --- Main Page Component ---
const Page = () => {
  const [targetDate, setTargetDate] = useState<number | null>(null);
  const [targetTitle, setTargetTitle] = useState<string>("");
  const [targetDesc, setTargetDesc] = useState<string>("");
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [realNews, setRealNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [bookmarkIds, setBookmarkIds] = useState<number[]>([]);

  const handleBookmarkToggle = async (articleId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:5000/bookmark/toggle", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ articleId })
      });
      if (res.ok) {
        const result = await res.json();
        if (result.isBookmarked) setBookmarkIds(prev => [...prev, articleId]);
        else setBookmarkIds(prev => prev.filter(id => id !== articleId));
      }
    } catch (error) { console.error("Bookmark Error:", error); }
  };

  const fetchData = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null;
      const headers = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
      const now = Date.now();
      const todayStr = new Date().toDateString();

      const resSched = await fetch("http://localhost:5000/schedules", { headers });
      if (resSched.ok) {
        const data = await resSched.json();
        const allExams = data
          .filter((item: any) => item.is_public === true || item.is_public === 1)
          .map((item: any) => ({ ...item, targetStamp: new Date(item.start_time).getTime() }))
          .sort((a: any, b: any) => a.targetStamp - b.targetStamp);

        const examToday = allExams.find((exam: { targetStamp: string | number | Date; }) => new Date(exam.targetStamp).toDateString() === todayStr);

        if (examToday) {
          setTargetDate(examToday.targetStamp);
          setTargetTitle(examToday.title);
          setTargetDesc(examToday.description || "เข้าร่วมการทดสอบตามกำหนดการวันนี้");
          const remaining = allExams.filter(e => e.id !== examToday.id && e.targetStamp > now);
          setUpcomingExams(remaining.slice(0, 4));
        } else {
          const futureExams = allExams.filter(exam => exam.targetStamp > now);
          if (futureExams.length > 0) {
            setTargetDate(futureExams[0].targetStamp);
            setTargetTitle(futureExams[0].title);
            setTargetDesc(futureExams[0].description || "เตรียมตัวให้พร้อมสำหรับการสอบที่กำลังจะมาถึง");
            setUpcomingExams(futureExams.slice(1, 5));
          }
        }
      }

      setLoadingNews(true);
      const [resNews, resBookmarks] = await Promise.all([
        fetch("http://localhost:5000/news", { headers }),
        fetch("http://localhost:5000/bookmark", { headers })
      ]);
      if (resNews.ok) {
        const newsData = await resNews.json();
        setRealNews(Array.isArray(newsData) ? newsData.filter((n: any) => n.status === 'PUBLISHED') : []);
      }
      if (resBookmarks.ok) {
        const bookmarks = await resBookmarks.json();
        setBookmarkIds(bookmarks.map((b: any) => Number(b.news.article_id)));
      }
    } catch (error) { console.error("Fetch Error:", error); } finally { setLoadingNews(false); }
  }, []);

  useEffect(() => {
    if (!targetDate) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance <= 0) setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      else {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isExamStarted = targetDate && Date.now() >= targetDate;

  return (
    <>
      <Navbar />
      <div className='bg-gray-50 min-h-screen py-8 px-4 sm:px-6'>
        <div className='max-w-7xl mx-auto'>
          {/* <main className="mb-6 bg-white rounded-xl shadow-sm overflow-hidden border">
            <SearchBar placeholder="ค้นหาข้อมูล..." onSearch={(q) => console.log(q)} />
          </main> */}
          <div className={`relative overflow-hidden rounded-[2.5rem] shadow-xl mb-12 border-2 transition-all duration-700 bg-white ${isExamStarted ? 'border-red-500 shadow-red-50' : 'border-blue-600 shadow-blue-50'}`}>
            <div className="flex flex-col items-center justify-center  md:p-10 text-center">
              <div className={`inline-flex items-center gap-1 mb-4 px-4 py-1.5 rounded-full font-medium text-[15px] ${isExamStarted ? 'bg-red-600 text-white animate-bounce' : 'bg-blue-50 text-blue-600'}`}>
                <AlarmClock size={14} className={isExamStarted ? 'animate-spin' : ''} />
                {isExamStarted ? 'กำลังดำเนินการสอบขณะนี้' : 'เป้าหมายที่กำลังจะมาถึง'}
              </div>
              <h1 className={`text-3xl md:text-5xl font-black mb-3 leading-tight ${isExamStarted ? 'text-red-700' : 'text-gray-900'}`}>
                {targetTitle || "พร้อมรับมือทุกการสอบ"}
              </h1>
              <p className="text-gray-400 text-sm flex items-center justify-center gap-2 mb-8 font-bold">
                <Calendar size={18} className="text-blue-500" />
                {targetDate ? new Date(targetDate).toLocaleDateString('th-TH', { dateStyle: 'long' }) : '-'}
              </p>
              <div className='flex items-center justify-center gap-4 md:gap-10 mb-10 flex-wrap'>
                {[
                  { label: 'วัน', val: timeLeft.days },
                  { label: 'ชั่วโมง', val: timeLeft.hours },
                  { label: 'นาที', val: timeLeft.minutes },
                  { label: 'วินาที', val: timeLeft.seconds }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center min-w-[70px]">
                    <div className={`text-5xl md:text-7xl font-black tabular-nums leading-none tracking-tighter ${isExamStarted ? 'text-red-600' : 'text-blue-600'}`}>
                      {String(item.val).padStart(2, '0')}
                    </div>
                    <div className="text-[20px] font-medium u text-gray-600 mt-3 ml-1">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
              <div className={`max-w-2xl w-full p-4 rounded-2xl flex items-center justify-center gap-3 border-l-4 mb-8 ${isExamStarted ? 'bg-red-50 border-red-500 text-red-700' : 'bg-gray-50 border-blue-600 text-gray-600'}`}>
                <Info className="flex-shrink-0 text-blue-500" size={18} />
                <p className="text-sm md:text-base italic font-medium leading-relaxed">"{targetDesc}"</p>
              </div>
              <a
                href="/user/calendar"
                className="inline-flex items-center justify-center px-10 py-3.5 bg-gray-900 hover:bg-blue-700 text-white rounded-2xl font-black text-sm transition-all gap-2 group shadow-lg hover:scale-105 active:scale-95"
              >
                เปิดดูปฏิทินกิจกรรม <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </a>
            </div>
          </div>

          <UniversityLeaderboard />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {loadingNews ? (
              <div className="col-span-full text-center py-20 text-gray-500 font-bold">กำลังเตรียมข้อมูลข่าวสาร...</div>
            ) : (
              realNews.map((news) => (
                <NewsCard
                  key={news.article_id}
                  id={Number(news.article_id)}
                  title={news.title}
                  desc={news.content?.replace(/<[^>]*>/g, '').substring(0, 100) + "..."}
                  img={news.cover_image_url || "/img/news1.jpg"}
                  badge={new Date(news.created_at).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) ? "ใหม่" : ""}
                  link={`/user/newsdetail/${news.article_id}`}
                  initialIsSaved={bookmarkIds.includes(Number(news.article_id))}
                  onBookmark={handleBookmarkToggle}
                />
              ))
            )}
          </div>
        </div>
      </div>
      <Footer />
      <style jsx>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        .animate-bounce { animation: bounce 2s infinite; }
      `}</style>
    </>
  );
};

export default Page;