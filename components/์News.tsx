'use client';

import { useState, useEffect } from 'react'; 
import Image from "next/image";

export default function NewsCard({
  id,
  title,
  desc,
  img,
  link,
  initialIsSaved = false, // 1. รับค่าสถานะเริ่มต้นจากหน้า Page
  onBookmark,
}: {
  id: number;
  title: string;
  desc: string;
  img: string;
  badge?: string;
  link: string;
  initialIsSaved?: boolean; // เพิ่ม Type ตรงนี้ด้วย
  onBookmark?: (id: number) => void;
}) {
  // 2. ตั้งค่า State เริ่มต้นตามที่ได้รับมาจาก Props
  const [isSaved, setIsSaved] = useState(initialIsSaved);

  // 3. สำคัญมาก: เมื่อหน้า Page (ตัวแม่) โหลดข้อมูล Bookmark เสร็จและส่งค่ามาใหม่ 
  // ตัว NewsCard (ตัวลูก) ต้องอัปเดตสีตามด้วย
  useEffect(() => {
    setIsSaved(initialIsSaved);
  }, [initialIsSaved]);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault(); 
    
    // อัปเดต UI ทันทีเพื่อให้รู้ว่ากดแล้ว (Optimistic Update)
    setIsSaved(!isSaved);

    if (onBookmark) {
      onBookmark(id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
      <div className="relative">
        <a href={link}>
          <Image
            src={img}
            alt={title}
            width={500}
            height={300}
            unoptimized
            className="w-full h-48 object-cover"
          />
        </a>
      </div>
      
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <a href={link}>
          <h5 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
            {title}
          </h5>
        </a>

        <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1 line-clamp-3">
          {desc}
        </p>

        <div className="flex flex-row items-center gap-3 mt-auto">
          <a
            href={link}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 
                       rounded-xl text-xs sm:text-sm font-medium hover:from-blue-700 
                       hover:to-blue-800 transition-all text-center shadow-md"
          >
            อ่านข่าวเพิ่มเติม
          </a>
          <button
            onClick={handleBookmarkClick}
            type="button"
            className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-all duration-300 
              ${isSaved 
                ? "bg-blue-600 border-blue-600 text-white scale-110 shadow-blue-200 shadow-lg" 
                : "bg-white border-blue-100 text-blue-600 hover:border-blue-600 hover:bg-blue-50"
              }`}
          >
            <svg
              className={`w-5 h-5 transition-transform duration-300 ${isSaved ? "scale-110" : "scale-100"}`}
              fill={isSaved ? "currentColor" : "none"} 
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}