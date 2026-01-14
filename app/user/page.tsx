'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar_user';
import Footer from '@/components/Footer';
import NewsCard from '@/components/์News';
import SearchBar from "@/components/SearchBar";

// --- Leaderboard Section (คงเดิม) ---
const universityLeaderboardData = [
  { rank: 1, name: "มหาวิทยาลัยเชียงใหม่", score: 85.75 },
  { rank: 2, name: "มหาวิทยาลัยมหิดล", score: 84.30 },
  { rank: 3, name: "จุฬาลงกรณ์มหาวิทยาลัย", score: 83.99 },
  { rank: 4, name: "มหาวิทยาลัยสงขลานครินทร์", score: 81.12 },
  { rank: 5, name: "มหาวิทยาลัยขอนแก่น", score: 80.50 },
  { rank: 6, name: "มหาวิทยาลัยเกษตรศาสตร์", score: 79.88 },
  { rank: 7, name: "มหาวิทยาลัยธรรมศาสตร์", score: 78.90 },
];

interface UniversityLeaderboardProps {
  rank: number;
  name: string;
  score: number;
}

const UniversityLeaderboardCard = ({ rank, name, score }: UniversityLeaderboardProps) => {
  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-100 last:border-b-0 hover:bg-blue-50 transition-colors duration-150 rounded-lg">
      <div className="flex items-center space-x-4">
        <span className="text-lg font-bold w-6 text-center text-gray-500">{String(rank).padStart(2, '0')}</span>
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">{name.substring(0, 1)}</div>
        <span className="text-gray-700 font-medium truncate">{name}</span>
      </div>
      <div className="text-xl font-extrabold text-blue-700">{score.toFixed(2)}</div>
    </div>
  );
};

const UniversityLeaderboard = () => {
  const top3 = universityLeaderboardData.slice(0, 3);
  const remaining = universityLeaderboardData.slice(3);
  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;

  const podiumStyles = {
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
        <button className='px-4 py-2 text-sm text-blue-600 hover:text-white hover:bg-blue-600 font-medium rounded-xl border border-blue-600 transition-all'>ดูทั้งหมด</button>
      </div>
      <div className="relative bg-gray-50 rounded-2xl p-6 mb-8 overflow-hidden">
        <div className="flex justify-center items-end gap-3 sm:gap-6">
          {podiumOrder.map((uni) => {
            const style = podiumStyles[uni.rank as keyof typeof podiumStyles];
            const isFirst = uni.rank === 1;
            return (
              <div key={uni.rank} className={`relative flex flex-col items-center ${isFirst ? 'z-10' : 'z-0'}`}>
                <div className={`absolute -top-3 ${isFirst ? 'animate-bounce' : ''}`}>
                  <div className={`${style.bgColor} ${style.ring} rounded-full p-2 ${style.shadow}`}><span className='text-3xl sm:text-4xl'>{style.medal}</span></div>
                </div>
                <div className={`${style.bgColor} ${style.borderColor} border-2 ${style.shadow} rounded-2xl p-4 w-28 sm:w-36 md:w-40 mt-12`}>
                  <div className={`${style.textColor} text-2xl font-bold text-center mb-2`}>#{uni.rank}</div>
                  <div className='text-center mb-3'><p className='text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 min-h-[2.5rem]'>{uni.name}</p></div>
                  <div className={`bg-white rounded-xl p-2 border ${style.borderColor}`}>
                    <p className='text-xs text-gray-500 text-center'>คะแนนเฉลี่ย</p>
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
}

// --- Page Component ---
const Page = () => {
  const [targetDate, setTargetDate] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  
  // 1. เพิ่ม State สำหรับข้อมูลข่าวจริง
  const [realNews, setRealNews] = useState<any[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null;
      const headers = { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      };

      // --- ส่วนเคาท์ดาวน์ (ไม่แก้ Logic) ---
      const resSched = await fetch("http://localhost:5000/schedules", { headers });
      if (resSched.ok) {
        const data = await resSched.json();
        const publicExams = data.filter((item: any) => item.is_public === true || item.is_public === 1 || item.is_public === "true");
        const futureExams = publicExams
          .map((item: any) => ({ ...item, targetStamp: new Date(item.start_time).getTime() }))
          .filter((item: any) => !isNaN(item.targetStamp) && item.targetStamp > Date.now())
          .sort((a: any, b: any) => a.targetStamp - b.targetStamp);
        if (futureExams.length > 0) setTargetDate(futureExams[0].targetStamp);
      }

      // --- 2. ส่วนดึงข่าว (Blog) จาก DB ---
      setLoadingNews(true);
      const resNews = await fetch("http://localhost:5000/news", { headers });
      if (resNews.ok) {
        const newsData = await resNews.json();
        // กรองเฉพาะข่าวที่ไม่ได้ถูกซ่อน (ถ้ามีฟิลด์ status)
        setRealNews(Array.isArray(newsData) ? newsData.filter((n: any) => n.status !== 'HIDDEN') : []);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoadingNews(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Logic Countdown (คงเดิม) ---
  useEffect(() => {
    if (!targetDate) return;
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance <= 0) {
        clearInterval(timer);
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      } else {
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

  return (
    <>
      <Navbar />
      <div className='bg-gray-50 min-h-screen py-8 px-4 sm:px-6'>
        <div className='max-w-7xl mx-auto'>
          <main className="mb-4 bg-white rounded-xl shadow-sm overflow-hidden">
            <SearchBar placeholder="ค้นหาข้อมูล..." onSearch={(q) => console.log(q)} />
          </main>

          {/* Countdown Section (ไม่แก้ดีไซน์) */}
          <div className='bg-white rounded-3xl shadow-xl p-8 mb-6 border border-gray-100'>
            <div className='flex items-center justify-center gap-2 mb-6'>
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h1 className='text-xl md:text-2xl font-bold text-gray-800'>นับถอยหลังสู่วันสอบประกอบวิชาชีพ</h1>
            </div>
            <div className='flex justify-center items-center gap-4 flex-wrap'>
              {[
                { label: 'วัน', val: timeLeft.days },
                { label: 'ชั่วโมง', val: timeLeft.hours },
                { label: 'นาที', val: timeLeft.minutes },
                { label: 'วินาที', val: timeLeft.seconds }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-2xl shadow-lg p-4 min-w-[90px] text-center">
                      <div className="text-3xl font-bold">{String(item.val).padStart(2, '0')}</div>
                    </div>
                    <div className="text-sm text-gray-600 mt-2 font-medium">{item.label}</div>
                  </div>
                  {idx < 3 && <div className="text-3xl font-bold text-blue-600 mb-8 ml-4">:</div>}
                </div>
              ))}
            </div>
          </div>

          <UniversityLeaderboard />

          {/* --- 3. News Section (แสดงข่าวจาก DB) --- */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {loadingNews ? (
              <div className="col-span-full text-center py-20 text-gray-500">กำลังดึงข่าวสารล่าสุด...</div>
            ) : realNews.length > 0 ? (
              realNews.map((news) => (
                <NewsCard 
                  key={news.article_id}
                  id={news.article_id}
                  title={news.title}
                  desc={news.content?.replace(/<[^>]*>/g, '').substring(0, 100) + "..."} // ล้างแท็ก HTML และตัดคำ
                  img={news.cover_image_url || "/img/news1.jpg"} // ถ้าไม่มีรูปใน DB ให้ใช้รูป Default
                  badge={new Date(news.created_at).getTime() > Date.now() - (7 * 24 * 60 * 60 * 1000) ? "ใหม่" : ""}
                  link={`/news/${news.article_id}`} 
                />
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-gray-400">ยังไม่มีข่าวสารในขณะนี้</div>
            )}
          </div>
        </div>
      </div>
      <Footer />
      <style jsx>{`
        @keyframes bounce { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        .animate-bounce { animation: bounce 1.5s infinite; }
      `}</style>
    </>
  );
};

export default Page;