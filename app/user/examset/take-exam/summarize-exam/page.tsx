"use client"
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { ChevronRight, Loader2, AlertCircle } from 'lucide-react';

// Types
interface ExamResult {
    session_id: number;
    item_bank_name: string;
    status: string;
    start_time: string;
    end_time: string;
    total_questions: number;
    correct_count: number;
    final_score: number;
}

const API_URL = 'http://localhost:5000';

function Summarize() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get('session_id');

    const [examResult, setExamResult] = useState<ExamResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (sessionId) {
            fetchExamResult();
        } else {
            setError('ไม่พบรหัส session');
            setLoading(false);
        }
    }, [sessionId]);

    const fetchExamResult = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/items-bank/exam/${sessionId}/result`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setExamResult(data);
            } else {
                throw new Error('ไม่สามารถโหลดผลสอบได้');
            }
        } catch (error) {
            console.error('Error fetching exam result:', error);
            setError('เกิดข้อผิดพลาดในการโหลดผลสอบ');
        } finally {
            setLoading(false);
        }
    };

    const calculateTimeUsed = () => {
        if (!examResult) return '00:00:00';
        
        const start = new Date(examResult.start_time);
        const end = new Date(examResult.end_time);
        const diffMs = end.getTime() - start.getTime();
        
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <>
                <Navbar_user />
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">กำลังโหลดผลสอบ...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (error || !examResult) {
        return (
            <>
                <Navbar_user />
                <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
                        <p className="text-gray-600 mb-6">{error || 'ไม่พบผลสอบ'}</p>
                        <Link
                            href="/user/examset"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                        >
                            กลับไปหน้าคลังข้อสอบ
                        </Link>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const percentage = Math.round((examResult.correct_count / examResult.total_questions) * 100);
    const timeUsed = calculateTimeUsed();

    return (
        <>
            <Navbar_user />

            <div className="min-h-screen bg-gray-100 py-8">
                <div className="container mx-auto px-4 max-w-6xl">
                    {/* Breadcrumb */}
                    <div className="flex items-center text-xs text-gray-500 mb-6">
                        <Link href="/user" className="hover:text-blue-600 transition">หน้าหลัก</Link>
                        <span className="mx-1 sm:mx-2 flex items-center">
                            <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </span>
                        <Link href="/user/examset" className="hover:text-blue-600 transition">คลังข้อสอบ</Link>
                        <span className="mx-1 sm:mx-2 flex items-center">
                            <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </span>
                        <span className="hidden sm:inline-flex items-center">
                            {examResult.item_bank_name}
                        </span>
                        <span className="mx-1 sm:mx-2 flex items-center">
                            <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                        </span>
                        <span className="text-gray-700 font-medium whitespace-nowrap">สรุปผลการสอบ</span>
                    </div>

                    {/* Header */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{examResult.item_bank_name}</h1>
                        <p className="text-gray-600">จำนวน {examResult.total_questions} ข้อ</p>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Left Column - Score */}
                        <div className="bg-white rounded-2xl shadow-sm p-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">ผลการทดสอบ</h2>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 mb-2">{examResult.item_bank_name}</p>
                                    <p className="text-gray-500 text-sm mb-4">จำนวน {examResult.total_questions} ข้อ</p>
                                    <div className="text-5xl font-bold text-gray-900">
                                        {examResult.correct_count} <span className="text-gray-400">/ {examResult.total_questions}</span>
                                    </div>
                                </div>
                                <div className="relative">
                                    <svg className="w-32 h-32 transform -rotate-90">
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke="#e5e7eb"
                                            strokeWidth="12"
                                            fill="none"
                                        />
                                        <circle
                                            cx="64"
                                            cy="64"
                                            r="56"
                                            stroke={percentage >= 80 ? "#22c55e" : percentage >= 60 ? "#eab308" : "#ef4444"}
                                            strokeWidth="12"
                                            fill="none"
                                            strokeDasharray={`${2 * Math.PI * 56}`}
                                            strokeDashoffset={`${2 * Math.PI * 56 * (1 - percentage / 100)}`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className={`text-2xl font-bold ${
                                            percentage >= 80 ? 'text-green-600' : 
                                            percentage >= 60 ? 'text-yellow-600' : 
                                            'text-red-600'
                                        }`}>
                                            {percentage}%
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Time */}
                        <div className="bg-white rounded-2xl shadow-sm p-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">เวลาที่ใช้ในการสอบ</h2>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="text-4xl font-bold text-gray-900">{timeUsed}</div>
                            </div>
                            
                            {/* Additional Stats */}
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">ตอบถูก</p>
                                        <p className="text-2xl font-bold text-green-600">{examResult.correct_count}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">ตอบผิด</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {examResult.total_questions - examResult.correct_count}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link 
                            href={`/user/examset/take-exam/summarize-exam/answer?session_id=${sessionId}`}
                            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors inline-block text-center"
                        >
                            ดูเฉลยคำตอบ
                        </Link>
                        <Link 
                            href="/user/examset" 
                            className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors inline-block text-center"
                        >
                            กลับไปคลังข้อสอบ
                        </Link>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}

export default Summarize;