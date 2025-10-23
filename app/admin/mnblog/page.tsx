"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import Link from "next/link";


// Interface สำหรับโครงสร้างข้อมูล Blog แต่ละรายการ
interface BlogData {
  id: number;
  title: string;
  topic: string;
  createdDate: string;
  image: string;
  isLive: boolean;
}

// Interface สำหรับ Props ของ BlogCard
interface BlogCardProps {
  blog: BlogData;
}


// ข้อมูลจำลองสำหรับบล็อกข่าวสาร (Placeholder Data)
const blogData: BlogData[] = [ // กำหนด Type ให้กับ array ด้วย

  {
    id: 2,
    title: "PHARMA LAW EP.02",
    topic: "Topic: 'เภสัช review ยา/อาหารเสริม ใน social media - รุ่ง หรือ ร่วง?' เภสัชกรไม่ได้มีเวลามาทำอาหารเสริมเดินดินกินได้ไหม?",
    createdDate: "29 ตุลาคม 2568",
    image: "/img/news1.jpg",
    isLive: true,
  },

  {
    id: 4,
    title: "Policy Innovation",
    topic: "สถาบันเทคโนโลยีเพื่ออนาคต-การเรียนรู้แห่งชาติและนโยบายด้านนวัตกรรม 'Policy Innovation On Demand' เภสัชกรกับภาคธุรกิจนำไปสู่การเปลี่ยนแปลง...",
    createdDate: "31 กรกฎาคม 2568",
    image: "/img/news3.jpg",
    isLive: false,
  },
  {
    id: 5,
    title: "ขอเชิญชวนเข้าร่วมงานประชุมวิชาการผู้แทนครู/ผู้บริหารในด้านผลิตภัณฑ์สุขภาพและยาแห่งชาติ ประจำปี พ.ศ. 2568",
    topic: "National Thai FDA Forum 2025 'Digital Economy Challenge for Sustainability...",
    createdDate: "31 กรกฎาคม 2568",
    image: "/img/news4.jpg",
    isLive: true,
  },

];

interface PageButtonProps {
  page: number;
  isActive: boolean;
  setCurrentPage: (page: number) => void;
}

const BlogCard = ({ blog }: BlogCardProps) => {
  // 💡 แก้ไข: ใช้ Link แทน div และกำหนด URL แบบ Dynamic
  return (
    <Link
      href={`/admin/mnblog/blogdetail/`} // ส่ง ID ไปใน Path
      className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all bg-white cursor-pointer"
    >
      {/* Image and Live Tag (โค้ดส่วนนี้เหมือนเดิม) */}
      <div className="relative h-48 w-full">
        {/* ... โค้ดรูปภาพและ Live Tag เดิม ... */}
        <div
          className="h-full w-full bg-gray-300 flex items-center justify-center text-gray-500 text-sm"
          style={{ backgroundImage: `url(${blog.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
        >
          {!blog.image && "Image Placeholder"}
        </div>

        {blog.isLive && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-xs font-semibold px-2 py-0.5 rounded uppercase">
            Live
          </span>
        )}
      </div>

      {/* Content (โค้ดส่วนนี้เหมือนเดิม) */}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">
          {blog.title}
        </h3>
        <p className="text-xs text-gray-600 mb-3 line-clamp-3 flex-grow min-h-[3rem]">
          {blog.topic}
        </p>

        {/* Footer */}
        <div className="mt-auto pt-2 border-t border-gray-100 flex items-center text-xs text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          สร้างขึ้นเมื่อวันที่ {blog.createdDate}
        </div>
      </div>
    </Link> 
  );
};

function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 5;

  // คอมโพเนนต์ Pagination Button
  const PaginationButton = ({ page, isActive, setCurrentPage }: PageButtonProps) => (
    <button
      className={`w-10 h-10 flex items-center justify-center text-sm font-medium border rounded-lg transition-colors ${isActive
          ? "bg-green-600 text-white border-green-600"
          : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
        }`}
      onClick={() => setCurrentPage(page)}
    >
      {page}
    </button>
  );

  // คอมโพเนนต์ Pagination
  const Pagination = () => {
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    return (
      <div className="flex items-center justify-end space-x-2 mt-8">
        {/* Previous Button */}
        <button
          className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Page Numbers */}
        {pages.map((page) => (
          <PaginationButton
            key={page}
            page={page}
            isActive={page === currentPage}
            setCurrentPage={setCurrentPage}
          />
        ))}

        {/* Next Button */}
        <button
          className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  };


  return (
    <Navbar_admin>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="mb-8 pt-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">
                บล็อกข่าวสาร
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                จัดการบล็อกข่าวสาร เพิ่ม แก้ไข ลบ
              </p>
            </div>

            <div className="flex gap-2">
              <Link
                href="/admin/mnblog/addblog"
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                เพิ่มบล็อกข่าวสารใหม่
              </Link>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-lg">
            <input
              type="text"
              placeholder="ค้นหาบล็อกข่าวสาร"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        {/* Blog Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogData.map((blog) => (
            <BlogCard key={blog.id} blog={blog} />
          ))}
        </div>

        {/* Pagination */}
        <Pagination />

      </div>
    </Navbar_admin>
  );
}

export default Page;