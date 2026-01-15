"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect } from "react";
import { Search, ChevronLeft, ChevronRight, MessageSquare, Loader2 } from "lucide-react";
import Link from "next/link";

interface ChatSession {
    session_id: number;
    title: string;
    created_at: string;
    user?: {
        email: string;
    };
}

interface ChatLogDisplay {
    id: number;
    email: string;
    question: string;
    date: string;
    time: string;
}

const API_URL = 'http://localhost:5000';

// Component สำหรับ Pagination Button
interface PageButtonProps {
    page: number;
    isActive: boolean;
    setCurrentPage: (page: number) => void;
}

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

function Page() {
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [logs, setLogs] = useState<ChatLogDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const itemsPerPage = 10;

    const [stats, setStats] = useState({
        totalChatsThisMonth: 0,
        topQuestions: [] as { question: string; count: number }[]
    });

    useEffect(() => {
        fetchChatLogs();
    }, []);

    const fetchChatLogs = async () => {
        try {
            const response = await fetch(`${API_URL}/chat/sessions`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data: ChatSession[] = await response.json();

                // Calculate Stats
                const now = new Date();
                const currentMonth = now.getMonth();
                const currentYear = now.getFullYear();

                // 1. Total Chats This Month
                const monthlyChats = data.filter(session => {
                    const d = new Date(session.created_at);
                    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
                }).length;

                // 2. Top 5 Questions
                const questionMap = new Map<string, number>();
                data.forEach(session => {
                    const q = session.title?.trim() || 'ไม่มีหัวข้อ';
                    questionMap.set(q, (questionMap.get(q) || 0) + 1);
                });

                const top5 = Array.from(questionMap.entries())
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5)
                    .map(([question, count]) => ({ question, count }));

                setStats({
                    totalChatsThisMonth: monthlyChats,
                    topQuestions: top5
                });

                // แปลงข้อมูลจาก API เป็น Format ที่ใช้แสดงผล
                const formattedLogs: ChatLogDisplay[] = data.map(session => {
                    const dateObj = new Date(session.created_at);

                    // Format Date: DD/MM/YYYY
                    const date = dateObj.toLocaleDateString('th-TH', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    });

                    // Format Time: HH:MM:SS
                    const time = dateObj.toLocaleTimeString('th-TH', {
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });

                    return {
                        id: session.session_id,
                        email: session.user?.email || 'Unknown User',
                        question: session.title || 'ไม่มีหัวข้อ',
                        date: date,
                        time: time
                    };
                });

                setLogs(formattedLogs);
            }
        } catch (error) {
            console.error("Error fetching chat logs:", error);
        } finally {
            setLoading(false);
        }
    };

    // Filter Logic
    const filteredLogs = logs.filter(log =>
        log.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.question.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination Logic
    const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentLogs = filteredLogs.slice(startIndex, startIndex + itemsPerPage);

    const Pagination = () => {
        if (totalPages <= 1) return null;

        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

        return (
            <div className="flex items-center justify-end space-x-2 mt-6">
                <button
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {pages.map((page) => (
                    <PaginationButton
                        key={page}
                        page={page}
                        isActive={page === currentPage}
                        setCurrentPage={setCurrentPage}
                    />
                ))}

                <button
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        );
    };

    return (
        <Navbar_admin>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-12">
                {/* Header Section */}
                <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
                        Dashboard ภาพรวมการใช้งาน
                    </h1>
                    <p className="text-gray-500">
                        สรุปสถิติการใช้งานแชตบอตและคำถามยอดนิยมประจำเดือน
                    </p>
                </div>

                {/* Dashboard Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    {/* Card 1: Monthly Total Chats */}
                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <MessageSquare className="w-32 h-32" />
                        </div>
                        <div className="relative z-10 flex flex-col justify-between h-full">
                            <div>
                                <h2 className="text-green-100 text-lg font-medium mb-1">จำนวนแชตทั้งหมด (เดือนนี้)</h2>
                                <p className="text-4xl font-bold">{stats.totalChatsThisMonth}</p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-white/20">
                                <p className="text-sm text-green-100 flex items-center gap-2">
                                    <span className="bg-white/20 p-1 rounded">
                                        <ChevronRight className="w-4 h-4" />
                                    </span>
                                    ข้อมูลอัปเดตล่าสุด
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Top 5 Questions */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <span className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" /><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16" /><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" /><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" /><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" /></svg>
                                </span>
                                5 อันดับ คำถามยอดฮิต
                            </h2>
                        </div>
                        <div className="space-y-3">
                            {stats.topQuestions.length > 0 ? (
                                stats.topQuestions.map((item, index) => (
                                    <div key={index} className="flex items-center justify-between group">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <span className={`
                                                flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold
                                                ${index === 0 ? 'bg-yellow-100 text-yellow-700' :
                                                    index === 1 ? 'bg-gray-100 text-gray-700' :
                                                        index === 2 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-600'}
                                            `}>
                                                {index + 1}
                                            </span>
                                            <p className="text-sm text-gray-600 truncate group-hover:text-green-600 transition-colors">
                                                {item.question}
                                            </p>
                                        </div>
                                        <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-2 py-1 rounded-full">
                                            {item.count} ครั้ง
                                        </span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-gray-400 text-center py-4">ไม่มีข้อมูลคำถาม</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200 my-8"></div>

                {/* Table Header Section - Original */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">
                            ประวัติการสนทนาทั้งหมด
                        </h2>
                        <p className="text-sm text-gray-500 mt-1">
                            รายการประวัติการสนทนาทั้งหมด {logs.length} รายการ
                        </p>
                    </div>

                    {/* Search Bar - Moved here for better layout */}
                    <div className="relative max-w-md w-full sm:w-72">
                        <input
                            type="text"
                            placeholder="ค้นหา..."
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm transition-all shadow-sm"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex justify-center items-center h-64 bg-white rounded-xl border border-gray-200 shadow-sm">
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-2" />
                            <span className="text-sm text-gray-500">กำลังโหลดข้อมูล...</span>
                        </div>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="flex flex-col justify-center items-center h-64 bg-white rounded-xl border border-dashed border-gray-300 text-gray-500">
                        <div className="p-4 bg-gray-50 rounded-full mb-3">
                            <MessageSquare className="w-8 h-8 text-gray-400" />
                        </div>
                        <p className="font-medium">ไม่พบข้อมูลที่ค้นหา</p>
                        <p className="text-sm text-gray-400 mt-1">ลองเปลี่ยนคำค้นหาใหม่อีกครั้ง</p>
                    </div>
                ) : (
                    <>
                        <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-sm">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-16">
                                                ลำดับ
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">
                                                ผู้ใช้งาน
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/3">
                                                หัวข้อคำถาม
                                            </th>
                                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                เวลาที่ถาม
                                            </th>
                                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider w-32">
                                                ตัวเลือก
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {currentLogs.map((chat, index) => (
                                            <tr key={chat.id} className="hover:bg-gray-50 transition-colors group">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                    {startIndex + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{chat.email}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-600 max-w-xs truncate group-hover:text-green-600 transition-colors" title={chat.question}>
                                                        {chat.question}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{chat.date}</div>
                                                    <div className="text-xs text-gray-400">{chat.time}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <Link
                                                        href={`/admin/chatlog/${chat.id}`}
                                                        className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                                    >
                                                        ดูรายละเอียด
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <Pagination />
                    </>
                )}
            </div>
        </Navbar_admin>
    );
}

export default Page;