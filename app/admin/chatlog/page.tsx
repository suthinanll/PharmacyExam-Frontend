"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react"; // เพิ่ม MessageSquare icon
import Link from "next/link"; 

// 1. Interface สำหรับโครงสร้างข้อมูลการสนทนา
interface ChatLog {
    id: number;
    email: string;
    question: string;
    date: string;
    time: string;
}

// 2. ข้อมูลจำลองสำหรับประวัติการสนทนา (Placeholder Data)
const chatData: ChatLog[] = [
    { id: 1, email: "gowon@gmail.com", question: "วันสอบใบประกอบวิชาชีพคือวันไหน ปี 2568", date: "14/08/2568", time: "16:25:20" },
    { id: 2, email: "kim@gmail.com", question: "ยาแก้อะไรไปสอบ?", date: "12/08/2568", time: "16:25:20" },
    { id: 3, email: "jennie@gmail.com", question: "คนเป็นโรคเบาหวานควรห้ามกินอะไรและห้ามกินอะไรบ้าง?", date: "12/08/2568", time: "12:35:03" },
    { id: 4, email: "boy@gmail.com", question: "มีข้อสอบที่ไหนบ้าง?", date: "07/08/2568", time: "18:31:07" },
    { id: 5, email: "kim@gmail.com", question: "เนื้อหาของเภสัชคืออะไรบ้าง", date: "07/08/2568", time: "15:25:22" },
    { id: 6, email: "maria@gmail.com", question: "ยาแก้แพ้หง่วงนอนมียี่ห้ออะไร", date: "05/08/2568", time: "22:55:10" },
    { id: 7, email: "lisa@gmail.com", question: "ขอแนวข้อสอบชุดแรก", date: "04/08/2568", time: "09:11:00" },
];


// 3. Interface สำหรับ props ของ PageButton (ใช้ซ้ำ)
interface PageButtonProps {
    page: number;
    isActive: boolean;
    setCurrentPage: (page: number) => void;
}

// 4. Component สำหรับ Pagination Button
const PaginationButton = ({ page, isActive, setCurrentPage }: PageButtonProps) => (
    <button
        className={`w-10 h-10 flex items-center justify-center text-sm font-medium border rounded-lg transition-colors ${
            isActive
                ? "bg-green-600 text-white border-green-600"
                : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
        }`}
        onClick={() => setCurrentPage(page)}
    >
        {page}
    </button>
);


function Page() {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const totalPages = 5;

    // คอมโพเนนต์ Pagination
    const Pagination = () => {
        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

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
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4"> {/* ปรับ pt-4 ให้สอดคล้องกับ Navbar_admin */}
                {/* Header Section */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">
                                ประวัติสนทนาแชตบอต
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600">
                                รวมประวัติการสนทนาแชตบอตของผู้ใช้ 
                            </p>
                        </div>
                    </div>
                </div>

                {/* Search Bar */}
                <div className="mb-8">
                    <div className="relative max-w-lg">
                        <input
                            type="text"
                            placeholder="ค้นหาชื่อผู้ใช้หรือคำถาม"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            {/* Table Header */}
                            <thead className="bg-green-600">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-16">
                                        ลำดับ
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-1/4">
                                        อีเมลผู้ใช้
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-1/3">
                                        คำถาม
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider">
                                        วันที่
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider w-24">
                                        จัดการ
                                    </th>
                                </tr>
                            </thead>
                            
                            {/* Table Body */}
                            <tbody className="bg-white divide-y divide-gray-200">
                                {chatData.map((chat, index) => (
                                    <tr key={chat.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {index + 1}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-700 font-medium">
                                            {chat.email}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                            {chat.question}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {`${chat.date} - ${chat.time}`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                                            <Link
                                                href={`/admin/chatlog/detail`}
                                                className="text-blue-600 hover:text-blue-800 transition-colors"
                                            >
                                                ดูบทสนทนา
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                <Pagination />

            </div>
        </Navbar_admin>
    );
}

export default Page;