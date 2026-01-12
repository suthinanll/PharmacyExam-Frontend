'use client';

import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar_user';
import Footer from '@/components/Footer';
import NewsCard from '@/components/์News';
import SearchBar from "@/components/SearchBar";


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
        <span className="text-lg font-bold w-6 text-center text-gray-500">
          {String(rank).padStart(2, '0')}
        </span>
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
          {name.substring(0, 1)}
        </div>
        <span className="text-gray-700 font-medium truncate">
          {name}
        </span>
      </div>
      <div className="text-xl font-extrabold text-blue-700">
        {score.toFixed(2)}
      </div>
    </div>
  );
};

const UniversityLeaderboard = () => {
  const top3 = universityLeaderboardData.slice(0, 3);
  const remaining = universityLeaderboardData.slice(3);

  const podiumOrder = top3.length === 3 ? [top3[1], top3[0], top3[2]] : top3;

  const podiumStyles = {
    1: {
      medal: '🥇',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-400',
      textColor: 'text-yellow-600',
      height: 'h-40', // สูงที่สุด
      scale: 'scale-110',
      shadow: 'shadow-2xl',
      ring: 'ring-4 ring-yellow-200',
    },
    2: {
      medal: '🥈',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-400',
      textColor: 'text-gray-600',
      height: 'h-32', // สูงรองลงมา
      scale: 'scale-100',
      shadow: 'shadow-xl',
      ring: 'ring-4 ring-gray-200',
    },
    3: {
      medal: '🥉',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-400',
      textColor: 'text-orange-600',
      height: 'h-28', // เตี้ยที่สุด
      scale: 'scale-100',
      shadow: 'shadow-xl',
      ring: 'ring-4 ring-orange-200',
    },
  };

  return (
    <div className='bg-white rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 sm:p-8 md:p-10 mb-6 border border-gray-200'>
      {/* Header */}
      <div className='flex items-center justify-between gap-2 mb-8'>
        <div className='flex items-center gap-3'>
          <div className='bg-yellow-50 p-3 rounded-xl'>
            <span className='text-2xl'>🏆</span>
          </div>
          <h2 className='text-xl sm:text-2xl md:text-3xl font-bold text-gray-800'>
            อันดับคะแนนเฉลี่ยสูงสุด
            <span className='block text-sm sm:text-base font-normal text-gray-500 mt-1'>
              มหาวิทยาลัย
            </span>
          </h2>
        </div>
        <button className='px-4 py-2 text-sm text-blue-600 hover:text-white hover:bg-blue-600 font-medium rounded-xl border border-blue-600 transition-all duration-200'>
          ดูทั้งหมด
        </button>
      </div>

      {/* Podium Section (1, 2, 3) */}
      <div className="relative bg-gray-50 rounded-2xl p-6 mb-8 overflow-hidden">
        <div className="flex justify-center items-end gap-3 sm:gap-6">
          {podiumOrder.map((uni) => {
            // ดึงสไตล์ตาม Rank
            const style = podiumStyles[uni.rank as keyof typeof podiumStyles];
            const isFirst = uni.rank === 1;

            return (
              <div
                key={uni.rank}
                className={`relative flex flex-col items-center transition-transform duration-300 ${isFirst ? 'z-10' : 'z-0'}`}
              >
                {/* Medal Badge (เหรียญ) */}
                <div className={`absolute -top-3 ${isFirst ? 'animate-bounce' : ''}`}>
                  <div className={`${style.bgColor} ${style.ring} rounded-full p-2 ${style.shadow} transition-all duration-300`}>
                    <span className='text-3xl sm:text-4xl'>{style.medal}</span>
                  </div>
                </div>

                {/* University Card (ข้อมูลมหาวิทยาลัย) */}
                <div className={`${style.bgColor} ${style.borderColor} border-2 ${style.shadow} rounded-2xl p-4 w-28 sm:w-36 md:w-40 mt-12 transition-all duration-300`}>

                  {/* Rank Number */}
                  <div className={`${style.textColor} text-2xl sm:text-3xl font-bold text-center mb-2`}>
                    #{uni.rank}
                  </div>

                  {/* University Name */}
                  <div className='text-center mb-3'>
                    <p className='text-xs sm:text-sm font-semibold text-gray-800 line-clamp-2 min-h-[2.5rem]'>
                      {uni.name}
                    </p>
                  </div>

                  {/* Score */}
                  <div className={`bg-white rounded-xl p-2 border ${style.borderColor}`}>
                    <p className='text-xs text-gray-500 text-center'>คะแนนเฉลี่ย</p>
                    <p className={`text-lg sm:text-xl font-bold ${style.textColor} text-center`}>
                      {uni.score.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Podium Base (แท่น) */}
                <div className={`${style.bgColor} ${style.borderColor} border-t-4 ${style.height} w-28 sm:w-36 md:w-40 rounded-b-2xl flex items-end justify-center pb-3 transition-all duration-300 shadow-inner`}>
                  <span className={`text-4xl sm:text-5xl font-bold ${style.textColor} opacity-20`}>
                    {uni.rank}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Divider */}
      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center">
          <span className="bg-white px-4 text-xs font-medium text-gray-400 uppercase tracking-wider">
            อันดับถัดไป
          </span>
        </div>
      </div>

      {/* The rest of the list (4+) */}
      <div className="space-y-2">
        {remaining.map((uni) => (
          <UniversityLeaderboardCard
            key={uni.rank}
            rank={uni.rank}
            name={uni.name}
            score={uni.score}
          />
        ))}
      </div>

      {/* Footer Note */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <p className="text-center text-xs text-gray-400 italic flex items-center justify-center gap-1">
          <span className="inline-block w-1 h-1 bg-gray-300 rounded-full"></span>
          ข้อมูลนี้เป็นเพียงตัวอย่างสมมติ
          <span className="inline-block w-1 h-1 bg-gray-300 rounded-full"></span>
        </p>
      </div>

      {/* CSS for Twinkle Animation */}
      <style jsx>{`
        @keyframes twinkle {
          0% { opacity: 0.5; transform: scale(1) rotate(0deg); }
          50% { opacity: 1; transform: scale(1.3) rotate(15deg); }
          100% { opacity: 0.5; transform: scale(1) rotate(0deg); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce {
            animation: bounce 1.5s infinite;
        }
      `}</style>
    </div>
  );
}


const Page = () => {
  const [targetDate, setTargetDate] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  const fetchExamCountdown = useCallback(async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem("access_token") : null;

      const res = await fetch("http://localhost:5000/schedules", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      console.log("1. ข้อมูลดิบจาก API:", data);

      if (!Array.isArray(data)) {
        console.warn("ข้อมูลที่ได้รับไม่ใช่ Array:", data);
        return;
      }
      const publicExams = data.filter((item: any) =>
        item.is_public === true || item.is_public === 1 || item.is_public === "true"
      );
      console.log("2. ผ่านเงื่อนไข is_public:", publicExams);
      const futureExams = publicExams
        .map((item: any) => ({
          ...item,
          targetStamp: new Date(item.start_time).getTime()
        }))
        .filter((item: any) => !isNaN(item.targetStamp) && item.targetStamp > Date.now())
        .sort((a: any, b: any) => a.targetStamp - b.targetStamp);

      console.log("3. เหลือรายการที่เป็นอนาคต (เรียงแล้ว):", futureExams);

      if (futureExams.length > 0) {
        setTargetDate(futureExams[0].targetStamp);
      } else {
        console.log("ไม่มีกำหนดการสอบในอนาคต");
      }

    } catch (error) {
      console.error("เกิดข้อผิดพลาดใน fetchExamCountdown:", error);
    }
  }, []);

  useEffect(() => {
    fetchExamCountdown();
  }, [fetchExamCountdown]);

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

  const newsData = [
    {
      id: 1,
      title: "HARMA TIPS EP.04 Survival Guide for Pharmacist",
      desc: "Survival Guide for Pharmacist เภสัชกรต้องรู้!! กฎหมายฝ่ายบุคคล รู้ทัน เข้าใจ และปฏิบัติได้อย่างถูกต้อง...",
      img: "/img/news1.jpg",
      badge: "ข่าวใหม่",
      link: "#",
    },
    {
      id: 2,
      title: "PHARMA TALK EP.05 บทบาทเภสัชกรในสถานการณ์ภัยพิบัติ",
      desc: "ในยามเกิดภัยพิบัติ…เภสัชกรอยู่ตรงไหน? มาฟังมุมมองและประสบการณ์...",
      img: "/img/news2.jpg",
      badge: "อัปเดต",
      link: "#",
    },
    {
      id: 3,
      title: "Pharma TRENDS EP.07: The Art of Being Positive",
      desc: "ในวันที่โลกหมุนเร็ว งานถาโถม และความคิดลบเข้ามาไม่หยุด...",
      img: "/img/news3.jpg",
      badge: "",
      link: "#",
    },
    {
      id: 4,
      title: "Clinical Practice Guidelines for Insomnia 2025",
      desc: "จฉบับใหม่ล่าสุด มาเจาะลึกการจัดการทางเภสัชวิทยาอย่างบูรณาการ ทั้งในผู้ใหญ่...",
      img: "/img/news4.jpg",
      badge: "",
      link: "#",
    },
  ];

  return (
    <>
      <Navbar />
      <div className='bg-gray-50 min-h-screen py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6'>
        <div className='max-w-7xl mx-auto'>
          <main className="max-w-7xl mx-auto mb-4 bg-white">
            <SearchBar placeholder="ค้นหาข้อมูล..." onSearch={(q) => console.log(q)} />
          </main>

          {/* Countdown Section */}
          <div className='bg-white rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 md:p-8 mb-6 border border-gray-100'>
            <div className='flex items-center justify-center gap-2 mb-4 sm:mb-6'>
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h1 className='text-lg sm:text-xl md:text-2xl font-bold text-gray-800 text-center'>
                นับถอยหลังสู่วันสอบประกอบวิชาชีพ
              </h1>
            </div>

            <div className='flex justify-center items-center gap-2 sm:gap-3 md:gap-4 flex-wrap'>
              {/* Days */}
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 min-w-[60px] sm:min-w-[75px] md:min-w-[90px] transform hover:scale-105 transition-transform duration-300">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">
                    {String(timeLeft.days).padStart(2, '0')}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3 font-medium">วัน</div>
              </div>

              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-6 sm:mb-8">:</div>

              {/* Hours */}
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 min-w-[60px] sm:min-w-[75px] md:min-w-[90px] transform hover:scale-105 transition-transform duration-300">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">
                    {String(timeLeft.hours).padStart(2, '0')}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3 font-medium">ชั่วโมง</div>
              </div>

              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-6 sm:mb-8">:</div>

              {/* Minutes */}
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 min-w-[60px] sm:min-w-[75px] md:min-w-[90px] transform hover:scale-105 transition-transform duration-300">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">
                    {String(timeLeft.minutes).padStart(2, '0')}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3 font-medium">นาที</div>
              </div>

              <div className="text-2xl sm:text-3xl font-bold text-blue-600 mb-6 sm:mb-8">:</div>

              {/* Seconds */}
              <div className="flex flex-col items-center">
                <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white rounded-xl sm:rounded-2xl shadow-lg p-3 sm:p-4 md:p-6 min-w-[60px] sm:min-w-[75px] md:min-w-[90px] transform hover:scale-105 transition-transform duration-300">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-center">
                    {String(timeLeft.seconds).padStart(2, '0')}
                  </div>
                </div>
                <div className="text-xs sm:text-sm text-gray-600 mt-2 sm:mt-3 font-medium">วินาที</div>
              </div>
            </div>
          </div>

          <UniversityLeaderboard />

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {newsData.map((news) => (
              <NewsCard key={news.id} {...news} />
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};
export default Page;