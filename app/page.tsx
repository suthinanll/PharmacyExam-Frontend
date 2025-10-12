'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar_user';
import Footer from '@/components/Footer';
import NewsCard from '@/components/์News';
import SearchBar from "@/components/SearchBar";


const Page = () => {

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleSearch = (query: string) => {
    console.log("🔍 ค้นหา:", query);
    // ตรงนี้สามารถต่อ API หรือ filter ข้อมูลได้เลย
  };

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



  const [timeLeft, setTimeLeft] = useState({
    days: 21,
    hours: 15,
    minutes: 11,
    seconds: 5
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        let { days, hours, minutes, seconds } = prev;

        if (seconds > 0) {
          seconds--;
        } else if (minutes > 0) {
          minutes--;
          seconds = 59;
        } else if (hours > 0) {
          hours--;
          minutes = 59;
          seconds = 59;
        } else if (days > 0) {
          days--;
          hours = 23;
          minutes = 59;
          seconds = 59;
        }

        return { days, hours, minutes, seconds };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <Navbar />

      <div className='bg-gray-50 min-h-screen py-4 sm:py-6 md:py-8 px-3 sm:px-4 md:px-6'>
        <main className="max-w-8xl mx-auto mb-4 bg-white">
          <SearchBar placeholder="ค้นหาข้อมูล..." onSearch={(q) => console.log(q)} />
        </main>


        <div className='max-w-8xl mx-auto'>

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