/* eslint-disable react-hooks/rules-of-hooks */

"use client"
import { useState } from 'react';
import Navbar from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import Link from 'next/link';

function examhis() {
    // ข้อมูลประวัติการสอบ (ในอนาคตจะดึงจาก API/Database)
    const [examHistory] = useState([
        {
            id: 1,
            title: "MCQ ปี 2554 ชุดที่ 1",
            subject: "วิชาอายุรศาสตร์",
            totalQuestions: 110,
            score: 110,
            percentage: 100,
            timeUsed: "01:00:51",
            date: "2025-10-20",
            time: "14:30"
        },

    ]);

    const [filterSubject] = useState("ทั้งหมด");

    // ดึงรายการวิชาทั้งหมด

    // กรองข้อมูลตามวิชา
    const filteredHistory = filterSubject === "ทั้งหมด"
        ? examHistory
        : examHistory.filter(exam => exam.subject === filterSubject);

    // ฟังก์ชันแปลงวันที่เป็นภาษาไทย
    const formatDateThai = (dateString: string | number | Date) => {
        const date = new Date(dateString);
        const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
            "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
    };

    // ฟังก์ชันกำหนดสีตามเปอร์เซ็นต์
    const getScoreColor = (percentage: number) => {
        if (percentage >= 80) return "text-green-600 bg-green-50";
        if (percentage >= 60) return "text-yellow-600 bg-yellow-50";
        return "text-red-600 bg-red-50";
    };

    const getScoreBadgeColor = (percentage: number) => {
        if (percentage >= 80) return "bg-green-500";
        if (percentage >= 60) return "bg-yellow-500";
        return "bg-red-500";
    };

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-100 py-8">
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Breadcrumb */}
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                        <a href="/user" className="hover:text-blue-600">หน้าหลัก</a>
                        <span className="mx-2">›</span>
                        <span className="text-gray-700 font-medium">ประวัติการสอบ</span>
                    </div>

                    {/* History List */}
                    <div className="space-y-4">
                        {filteredHistory.map((exam) => (
                            <div key={exam.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                    {/* Left Section */}
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3">
                                            <div className={`w-2 h-2 rounded-full mt-2 ${getScoreBadgeColor(exam.percentage)}`}></div>
                                            <div className="flex-1">
                                                <h3 className="text-lg font-bold text-gray-900 mb-1">{exam.title}</h3>
                                                <p className="text-sm text-gray-600 mb-2">{exam.subject}</p>
                                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                        {formatDateThai(exam.date)} เวลา {exam.time} น.
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        {exam.timeUsed}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                        </svg>
                                                        {exam.totalQuestions} ข้อ
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Section */}
                                    <div className="flex items-center gap-6">
                                        <div className="text-center">
                                            <div className={`text-3xl font-bold ${getScoreColor(exam.percentage).split(' ')[0]}`}>
                                                {exam.score}/{exam.totalQuestions}
                                            </div>
                                            <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${getScoreColor(exam.percentage)}`}>
                                                {exam.percentage}%
                                            </div>
                                        </div>
                                        <Link
                                            href="/user/examset/take-exam/summarize-exam"
                                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg inline-block"
                                        >
                                            ดูรายละเอียด
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {filteredHistory.length === 0 && (
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-600 text-lg">ไม่พบประวัติการสอบในหมวดนี้</p>
                        </div>
                    )}

                </div>
            </div>
            <Footer />
        </>
    );
}
export default examhis;