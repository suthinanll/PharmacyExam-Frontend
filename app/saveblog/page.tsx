"use client"
import { useState } from 'react';
import Navbar from '@/components/Navbar_user';
import Footer from '@/components/Footer';
import Search from '@/components/SearchBar';

import Image from 'next/image';

function SaveBlog() {
  // ข้อมูลข่าวที่บันทึกไว้ (ตัวอย่าง)
  const [savedNews, setSavedNews] = useState([
    {
      id: 1,
      title: "HARMA TIPS EP.04 Survival Guide for Pharmacist",
      desc: "Survival Guide for Pharmacist เภสัชกรต้องรู้!! กฎหมายฝ่ายบุคคล รู้ทัน เข้าใจ และปฏิบัติได้อย่างถูกต้อง...",
      img: "/img/news1.jpg",
      badge: "ข่าวใหม่",
      link: "#",
      savedDate: '2024-01-20T10:30:00',
      category: 'กฎหมาย'
    },
    {
      id: 2,
      title: "PHARMA TALK EP.05 บทบาทเภสัชกรในสถานการณ์ภัยพิบัติ",
      desc: "ในยามเกิดภัยพิบัติ…เภสัชกรอยู่ตรงไหน? มาฟังมุมมองและประสบการณ์...",
      img: "/img/news2.jpg",
      badge: "อัปเดต",
      link: "#",
      savedDate: '2024-01-19T14:20:00',
      category: 'สาธารณสุข'
    },
    {
      id: 3,
      title: "Pharma TRENDS EP.07: The Art of Being Positive",
      desc: "ในวันที่โลกหมุนเร็ว งานถาโถม และความคิดลบเข้ามาไม่หยุด...",
      img: "/img/news3.jpg",
      badge: "",
      link: "#",
      savedDate: '2024-01-18T09:15:00',
      category: 'แรงบันดาลใจ'
    },
    {
      id: 4,
      title: "Clinical Practice Guidelines for Insomnia 2025",
      desc: "ฉบับใหม่ล่าสุด มาเจาะลึกการจัดการทางเภสัชวิทยาอย่างบูรณาการ ทั้งในผู้ใหญ่...",
      img: "/img/news4.jpg",
      badge: "",
      link: "#",
      savedDate: '2024-01-17T16:45:00',
      category: 'แนวทางการรักษา'
    },
  ]);

  // ฟังก์ชันลบข่าว
  const removeNews = (id: number) => {
    setSavedNews(savedNews.filter(news => news.id !== id));
  };

  // ฟังก์ชันลบทั้งหมด
  const clearAll = () => {
    if (confirm('คุณต้องการลบข่าวที่บันทึกทั้งหมดหรือไม่?')) {
      setSavedNews([]);
    }
  };

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-gray-50  py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">

          <Search /><br />

          {/* Header */}
          <div className="mb-8">
            <div className="text-sm text-gray-500 mb-2">
              หน้าหลัก › ข่าวที่บันทึกไว้
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                  ข่าวที่บันทึกไว้
                </h1>
                <p className="text-gray-600">
                  คุณมีข่าวที่บันทึกไว้ทั้งหมด <span className="font-bold text-blue-600">{savedNews.length}</span> รายการ
                </p>
              </div>

              {savedNews.length > 0 && (
                <button
                  onClick={clearAll}
                  className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-medium transition shadow-lg hover:shadow-xl flex items-center gap-2 self-start sm:self-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  ลบทั้งหมด
                </button>
              )}
            </div>
          </div>

          {/* News Grid */}
          {savedNews.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {savedNews.map((news) => (
                <div key={news.id} className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col h-full group hover:shadow-2xl transition-all duration-300">

                  {/* Image */}
                  <div className="relative overflow-hidden">
                    {news.badge && (
                      <div className="absolute top-3 right-3 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 z-10">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                        </svg>
                        {news.badge}
                      </div>
                    )}
                    <a href={news.link}>
                      <Image
                        src={news.img}
                        alt={news.title}
                        width={500}
                        height={300}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </a>
                  </div>

                  {/* Content */}
                  <div className="p-5 flex flex-col flex-1">

                    {/* Category & Date */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                        {news.category}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(news.savedDate).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>

                    <a href={news.link}>
                      <h5 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition">
                        {news.title}
                      </h5>
                    </a>

                    <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1 line-clamp-3">
                      {news.desc}
                    </p>

                    {/* Buttons */}
                    <div className="flex gap-2 mt-auto">
                      <a
                        href={news.link}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl text-center"
                      >
                        อ่านเพิ่มเติม
                      </a>

                      <button
                        onClick={() => removeNews(news.id)}
                        className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                        title="ลบออกจากรายการ"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            // Empty State
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="inline-block p-6 bg-gray-100 rounded-full mb-4">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                ยังไม่มีข่าวที่บันทึกไว้
              </h3>
              <p className="text-gray-600 mb-6">
                เริ่มต้นบันทึกข่าวที่สนใจเพื่ออ่านภายหลัง
              </p>
              <a
                href="/news"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                ไปดูข่าวทั้งหมด
              </a>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  );
}

export default SaveBlog;