"use client"
import { useState, useEffect } from 'react';
import Navbar from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import Link from 'next/link';
import { Loader2, AlertCircle } from 'lucide-react';

// Types
interface ExamHistory {
    session_id: number;
    item_bank_id: number;
    item_bank_name: string;
    status: string;
    start_time: string;
    end_time: string;
    final_score: number;
}

const API_URL = 'http://localhost:5000';

function ExamHistory() {
    const [examHistory, setExamHistory] = useState<ExamHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchExamHistory();
    }, []);

    const fetchExamHistory = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/items-bank/exam/history`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                // เรียงจากใหม่ไปเก่า
                const sortedData = data.sort((a: ExamHistory, b: ExamHistory) => 
                    new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
                );
                setExamHistory(sortedData);
            } else {
                throw new Error('ไม่สามารถโหลดประวัติการสอบได้');
            }
        } catch (error) {
            console.error('Error fetching exam history:', error);
            setError('เกิดข้อผิดพลาดในการโหลดประวัติการสอบ');
        } finally {
            setLoading(false);
        }
    };

    // ฟังก์ชันแปลงวันที่เป็นภาษาไทย
    const formatDateThai = (dateString: string) => {
        const date = new Date(dateString);
        const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
            "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
        return `${date.getDate()} ${thaiMonths[date.getMonth()]} ${date.getFullYear() + 543}`;
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    };

    const calculateTimeUsed = (startTime: string, endTime: string) => {
        const start = new Date(startTime);
        const end = new Date(endTime);
        const diffMs = end.getTime() - start.getTime();
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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

    if (loading) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">กำลังโหลดประวัติการสอบ...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (error) {
        return (
            <>
                <Navbar />
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
                        <p className="text-gray-600 mb-6">{error}</p>
                        <button
                            onClick={fetchExamHistory}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                        >
                            ลองใหม่อีกครั้ง
                        </button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-gray-100 py-8">
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Breadcrumb */}
                    <div className="flex items-center text-sm text-gray-500 mb-6">
                        <Link href="/user" className="hover:text-blue-600">หน้าหลัก</Link>
                        <span className="mx-2">›</span>
                        <span className="text-gray-700 font-medium">ประวัติการสอบ</span>
                    </div>

                    {/* Header */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">ประวัติการสอบ</h1>
                        <p className="text-gray-600">ประวัติการทำข้อสอบทั้งหมดของคุณ ({examHistory.length} ครั้ง)</p>
                    </div>

                    {/* History List */}
                    {examHistory.length > 0 ? (
                        <div className="space-y-4">
                            {examHistory.map((exam) => {
                                const percentage = Math.round(exam.final_score);
                                const timeUsed = calculateTimeUsed(exam.start_time, exam.end_time);
                                
                                return (
                                    <div key={exam.session_id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                            {/* Left Section */}
                                            <div className="flex-1">
                                                <div className="flex items-start gap-3">
                                                    <div className={`w-2 h-2 rounded-full mt-2 ${getScoreBadgeColor(percentage)}`}></div>
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-bold text-gray-900 mb-1">{exam.item_bank_name}</h3>
                                                        <div className={`inline-block px-2 py-1 rounded text-xs font-medium mb-2 ${
                                                            exam.status === 'COMPLETED' 
                                                                ? 'bg-green-100 text-green-700' 
                                                                : 'bg-yellow-100 text-yellow-700'
                                                        }`}>
                                                            {exam.status === 'COMPLETED' ? 'เสร็จสิ้น' : 'กำลังทำ'}
                                                        </div>
                                                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                            <span className="flex items-center gap-1">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                {formatDateThai(exam.start_time)} เวลา {formatTime(exam.start_time)} น.
                                                            </span>
                                                            {exam.status === 'COMPLETED' && (
                                                                <span className="flex items-center gap-1">
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                    </svg>
                                                                    {timeUsed}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right Section */}
                                            <div className="flex items-center gap-6">
                                                {exam.status === 'COMPLETED' && (
                                                    <div className="text-center">
                                                        <div className={`inline-block px-4 py-2 rounded-full text-sm font-medium ${getScoreColor(percentage)}`}>
                                                            {percentage}%
                                                        </div>
                                                    </div>
                                                )}
                                                <Link
                                                    href={`/user/examset/take-exam/summarize-exam?session_id=${exam.session_id}`}
                                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors shadow-md hover:shadow-lg inline-block whitespace-nowrap"
                                                >
                                                    ดูรายละเอียด
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-gray-600 text-lg mb-4">ยังไม่มีประวัติการสอบ</p>
                            <Link
                                href="/user/examset"
                                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                            >
                                ไปทำข้อสอบ
                            </Link>
                        </div>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}

export default ExamHistory;