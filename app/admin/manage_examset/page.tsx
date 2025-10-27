"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState } from "react";
import { Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";


// ข้อมูลจำลองสำหรับคลังข้อสอบ (Placeholder Data)
const examData = [
  { id: 1, name: "Cardiovascular disorder", thaiName: "(ความผิดปกติของหัวใจและหลอดเลือด)", count: 108, status: "เปิดให้ทำข้อสอบ", statusColor: "bg-green-100 text-green-700", createdDate: "02/04/2566 - 18:52" },
  { id: 2, name: "Respiratory disorder", thaiName: "(ความผิดปกติของระบบทางเดินหายใจ)", count: 52, status: "เปิดให้ทำข้อสอบ", statusColor: "bg-green-100 text-green-700", createdDate: "29/03/2566 - 11:22" },
  { id: 3, name: "Hematologic disorder", thaiName: "(ความผิดปกติของหัวใจและหลอดเลือด)", count: 38, status: "เปิดให้ทำข้อสอบ", statusColor: "bg-green-100 text-green-700", createdDate: "21/03/2566 - 18:52" },
  { id: 4, name: "Gastrointestinal disorder", thaiName: "(โรคทางเดินอาหาร)", count: 74, status: "เปิดให้ทำข้อสอบ", statusColor: "bg-green-100 text-green-700", createdDate: "18/03/2566 - 18:52" },
  { id: 5, name: "Rheumatologic disorder", thaiName: "(โรคข้ออักเสบ)", count: 61, status: "เปิดให้ทำข้อสอบ", statusColor: "bg-green-100 text-green-700", createdDate: "17/03/2566 - 18:52" },
  { id: 6, name: "Dermatologic disorder", thaiName: "(โรคผิวหนัง)", count: 63, status: "ปิดข้อสอบ", statusColor: "bg-gray-100 text-gray-700", createdDate: "02/03/2566 - 18:52" },
  { id: 7, name: "EENT disorder", thaiName: "(จักษุ หู คอ จมูก)", count: 22, status: "ปิดข้อสอบ", statusColor: "bg-gray-100 text-gray-700", createdDate: "27/02/2566 - 18:52" },
  { id: 8, name: "PLE-CC1 2564", thaiName: "(ข้อสอบใน MCQ ปี 2564)", count: 120, status: "ปิดข้อสอบ", statusColor: "bg-gray-100 text-gray-700", createdDate: "01/02/2566 - 18:52" },
];

// Interface สำหรับ props ของ PageButton
interface PageButtonProps {
  page: number;
  isActive: boolean;
  setCurrentPage: (page: number) => void;
}

function Page() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const Pagination = () => {
    const totalPages = 5;
    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

    const PageButton = ({ page, isActive, setCurrentPage }: PageButtonProps) => (
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

    return (
      <div className="flex items-center justify-end space-x-2 mt-6">
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
          <PageButton
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">
                คลังข้อสอบ
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                จัดการคลังข้อสอบ เพิ่ม แก้ไข ลบ
              </p>
            </div>

            <Link
              href="/admin/manage_examset/examadd"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              สร้างข้อสอบใหม่
            </Link>
          </div>
        </div>

        {/* Search Bar (แยกออกมาตามที่ต้องการ) */}
        <div className="mb-6"> {/* ปรับ mb-5 เป็น mb-6 เพื่อระยะห่าง */}
          <div className="relative max-w-sm">
            <input
              type="text"
              placeholder="ค้นหาข้อสอบ"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
        </div>

        <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">

              <thead className="bg-green-600 text-white">
                <tr>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-medium  tracking-wider w-16 rounded-tl-xl">ลำดับ</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider">ชื่อข้อสอบ</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider w-32">จำนวนข้อสอบ</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider w-32">สถานะ</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider w-40">วัน-เวลาที่สร้าง</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider w-20 rounded-tr-xl">จัดการ</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {examData.map((exam, index) => (
                  <tr key={exam.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-16 **text-center**">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{exam.name}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{exam.thaiName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-32">{exam.count} ข้อ</td>
                    <td className="px-6 py-4 whitespace-nowrap w-32">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${exam.statusColor}`}>{exam.status}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-40">{exam.createdDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium w-20">
                      <Link href={`/admin/manage_examset/examedit`} className="text-blue-600 hover:text-blue-900 text-sm">แก้ไข</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Section */}
          <div className="p-4 border-t border-gray-200">
            <Pagination />
          </div>
        </div>
      </div>
    </Navbar_admin>
  );
}

export default Page;