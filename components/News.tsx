"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export default function NewsCard({
  id,
  title,
  desc,
  img,
  link,
  initialIsSaved = false,
  onBookmark,
}: {
  id: number;
  title: string;
  desc: string;
  img: string;
  badge?: string;
  link: string;
  initialIsSaved?: boolean;
  onBookmark?: (id: number) => void;
}) {
  const [isSaved, setIsSaved] = useState(initialIsSaved);
  const [imgSrc, setImgSrc] = useState(img || "/img/news1.jpg");

  useEffect(() => {
    setIsSaved(initialIsSaved);
  }, [initialIsSaved]);

  useEffect(() => {
    setImgSrc(img || "/img/news1.jpg");
  }, [img]);

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsSaved(!isSaved);

    if (onBookmark) {
      onBookmark(id);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 flex flex-col h-full hover:shadow-xl transition-shadow duration-300">
      <div className="relative">
        <a href={link} target="_blank" rel="noopener noreferrer">
          {/* ไม่ใส่ unoptimized เพื่อให้ Next.js ย่อรูปตามขนาดที่แสดงจริงและแปลงเป็น WebP
              รูปต้นทางบางไฟล์ใหญ่ถึง 500KB ทั้งที่การ์ดกว้างไม่เกิน 400px */}
          <Image
            src={imgSrc || "/img/news1.jpg"}
            alt={title}
            width={500}
            height={300}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
            onError={() => setImgSrc("/img/news1.jpg")}
            className="w-full h-48 object-cover hover:scale-105 transition-transform duration-300"
          />
        </a>
      </div>
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <a href={link} target="_blank" rel="noopener noreferrer">
          {/* h3 ต่อจากหัวข้อ "ข่าวสารและประกาศ" ที่เป็น h2 — ใช้ h5 จะข้ามลำดับหัวข้อ */}
          <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {title}
          </h3>
        </a>
        <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1 line-clamp-3">
          {desc}
        </p>
        <div className="flex flex-row items-center gap-3 mt-auto">
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 
                       rounded-xl text-xs sm:text-sm font-medium hover:from-blue-700 
                       hover:to-blue-800 transition-all text-center shadow-md"
          >
            อ่านข่าวเพิ่มเติม
          </a>
          <button
            onClick={handleBookmarkClick}
            type="button"
            aria-label={isSaved ? `เอาข่าว ${title} ออกจากรายการที่บันทึก` : `บันทึกข่าว ${title}`}
            aria-pressed={isSaved}
            className={`w-10 h-10 flex items-center justify-center rounded-xl border-2 transition-all duration-300 
              ${
                isSaved
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
