"use client"
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import {
    ChevronRight, AlertCircle,
    Target, Award, AlertTriangle, Clock, CheckCircle,
    XCircle, BookOpen, BarChart2, FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    Radar, RadarChart, PolarGrid, PolarAngleAxis,
    PolarRadiusAxis, ResponsiveContainer, Tooltip
} from 'recharts';

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
    responses?: QuestionResponse[];
}

interface SubTopic {
    sub_topic_id: number;
    sub_topic_name: string;
    topic?: { topic_id: number; topic_name: string };
}

interface QuestionResponse {
    item_id: number;
    question_text: string;
    is_correct: boolean;
    sub_topics?: SubTopic[];
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

function Summarize() {
    const searchParams = useSearchParams();
    const { getToken } = useAuth();
    const [sessionId, setSessionId] = useState<string | null>(null);
    // const sessionId = searchParams.get('session_id');

    const [examResult, setExamResult] = useState<ExamResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let sId: string | null = null;
        const cached = sessionStorage.getItem("summarize-exam_session");
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                if (parsed.session_id) sId = String(parsed.session_id);
            } catch (e) {}
        }

        if (!sId) {
            const urlSession = searchParams.get('session_id');
            if (urlSession) sId = urlSession;
        }
        
        if (sId) {
            setSessionId(sId);
            fetchExamResult(sId);
        } else {
            setError('ไม่พบรหัส session');
            setLoading(false);
        }

        
    },[]);


    const fetchExamResult = async (targetSessionId: string) => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/items-bank/exam/${targetSessionId}/result`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) setExamResult(await res.json());
            else throw new Error('ไม่สามารถโหลดผลสอบได้');
        } catch {
            setError('เกิดข้อผิดพลาดในการโหลดผลสอบ');
        } finally {
            setLoading(false);
        }
    };

    const analyzeTopicPerformance = () => {
        if (!examResult?.responses) return [];
        const topicStats: Record<string, { total: number; correct: number; topicName: string; subTopics: Record<string, { total: number; correct: number; name: string }> }> = {};

        examResult.responses.forEach(r => {
            r.sub_topics?.forEach(st => {
                const tid = st.topic?.topic_id;
                if (!tid) return;
                const tname = st.topic?.topic_name || 'ไม่ระบุหัวข้อ';
                if (!topicStats[tid]) topicStats[tid] = { total: 0, correct: 0, topicName: tname, subTopics: {} };
                topicStats[tid].total++;
                if (r.is_correct) topicStats[tid].correct++;
                if (!topicStats[tid].subTopics[st.sub_topic_id]) topicStats[tid].subTopics[st.sub_topic_id] = { total: 0, correct: 0, name: st.sub_topic_name };
                topicStats[tid].subTopics[st.sub_topic_id].total++;
                if (r.is_correct) topicStats[tid].subTopics[st.sub_topic_id].correct++;
            });
        });

        return Object.entries(topicStats).map(([topicId, s]) => ({
            topicId, topicName: s.topicName, total: s.total, correct: s.correct,
            percentage: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
            subTopics: Object.entries(s.subTopics).map(([sid, ss]) => ({
                subTopicId: sid, name: ss.name, total: ss.total, correct: ss.correct,
                percentage: ss.total > 0 ? Math.round((ss.correct / ss.total) * 100) : 0
            })).sort((a, b) => a.percentage - b.percentage)
        })).sort((a, b) => b.percentage - a.percentage);
    };

    const calculateTimeUsed = () => {
        if (!examResult) return '—';
        const diffMs = new Date(examResult.end_time).getTime() - new Date(examResult.start_time).getTime();
        const h = Math.floor(diffMs / 3600000);
        const m = Math.floor((diffMs % 3600000) / 60000);
        const s = Math.floor((diffMs % 60000) / 1000);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) {
        return (
            <>
                <Navbar_user />
                <div className="min-h-[60vh] flex items-center justify-center">
                    <LoadingSpinner size="lg" text="กำลังโหลดผลการสอบ..." />
                </div>
                <Footer />
            </>
        );
    }

    if (error || !examResult) {
        return (
            <>
                <Navbar_user />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center max-w-sm">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h2 className="text-xl font-semibold text-gray-800 mb-2">ไม่พบข้อมูลผลสอบ</h2>
                        <p className="text-gray-500 mb-6 text-sm">{error || 'ลองโหลดใหม่อีกครั้ง'}</p>
                        <Link href="/user/examset" className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                            กลับไปคลังข้อสอบ
                        </Link>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const percentage = Math.round((examResult.correct_count / examResult.total_questions) * 100);
    const wrong = examResult.total_questions - examResult.correct_count;
    const timeUsed = calculateTimeUsed();
    const topicPerformance = analyzeTopicPerformance();

    // Score colour thresholds
    const scoreColor = percentage >= 80 ? 'text-green-600' : percentage >= 60 ? 'text-yellow-500' : 'text-red-500';
    const strokeColor = percentage >= 80 ? '#22c55e' : percentage >= 60 ? '#eab308' : '#ef4444';
    const scoreLabel = percentage >= 80 ? 'ยอดเยี่ยม' : percentage >= 60 ? 'ผ่านเกณฑ์' : 'ต้องพัฒนา';
    const scoreLabelColor = percentage >= 80 ? 'bg-green-100 text-green-700' : percentage >= 60 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600';

    const circumference = 2 * Math.PI * 52;

    return (
        <>
            <Navbar_user />

            <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">

                    {/* Breadcrumb */}
                    <div className="flex items-center text-sm text-gray-500 mb-5">
                        <Link href="/user" className="hover:text-green-600 cursor-pointer transition">หน้าหลัก</Link>
                        <span className="mx-2">›</span>
                        <Link href="/user/examset" className="hover:text-green-600 cursor-pointer transition">คลังข้อสอบ</Link>
                        <span className="mx-2">›</span>
                        <span className="text-gray-600 font-medium">สรุปผลสอบ</span>
                    </div>

                    {/* Page Title */}
                    <div className="mb-6">
                        <h1 className="text-3xl md:text-3xl font-medium text-[#1C2033]">{examResult.item_bank_name}</h1>
                        <p className="text-md text-gray-500 mt-0.5">สรุปผลการทำข้อสอบ</p>
                    </div>

                    {/* ── Score Hero Card ── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-5">
                        <div className="flex flex-col sm:flex-row items-center gap-8">

                            {/* Donut */}
                            <div className="relative shrink-0">
                                <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
                                    <circle cx="60" cy="60" r="52" stroke="#f3f4f6" strokeWidth="12" fill="none" />
                                    <circle
                                        cx="60" cy="60" r="52"
                                        stroke={strokeColor} strokeWidth="12" fill="none"
                                        strokeDasharray={circumference}
                                        strokeDashoffset={circumference * (1 - percentage / 100)}
                                        strokeLinecap="round"
                                        style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                                    />
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className={`text-3xl font-black ${scoreColor}`}>{percentage}%</span>
                                    <span className={`text-sm font-medium px-2 py-0.5 rounded-full mt-1 ${scoreLabelColor}`}>{scoreLabel}</span>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="flex-1 w-full">
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    {/* Total */}
                                    <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                                        <FileText className="w-4 h-4 text-gray-400 mx-auto mb-1.5" />
                                        <p className="text-2xl font-black text-gray-800">{examResult.total_questions}</p>
                                        <p className="text-sm text-gray-500 mt-0.5">จำนวนข้อ</p>
                                    </div>
                                    {/* Correct */}
                                    <div className="bg-green-50 rounded-xl p-4 text-center border border-green-100">
                                        <CheckCircle className="w-4 h-4 text-green-500 mx-auto mb-1.5" />
                                        <p className="text-2xl font-black text-green-600">{examResult.correct_count}</p>
                                        <p className="text-sm text-green-600 mt-0.5">ตอบถูก</p>
                                    </div>
                                    {/* Wrong */}
                                    <div className="bg-red-50 rounded-xl p-4 text-center border border-red-100">
                                        <XCircle className="w-4 h-4 text-red-400 mx-auto mb-1.5" />
                                        <p className="text-2xl font-black text-red-500">{wrong}</p>
                                        <p className="text-sm text-red-500 mt-0.5">ตอบผิด</p>
                                    </div>
                                    {/* Time */}
                                    <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-100">
                                        <Clock className="w-4 h-4 text-blue-500 mx-auto mb-1.5" />
                                        <p className="text-xl font-black text-blue-600 leading-tight">{timeUsed}</p>
                                        <p className="text-sm text-blue-500 mt-0.5">เวลาที่ใช้</p>
                                    </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm text-gray-400 mb-1.5">
                                        <span>จำนวนข้อที่ถูกต้อง</span>
                                        <span>{examResult.correct_count} / {examResult.total_questions} ข้อ</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2.5">
                                        <div
                                            className="h-2.5 rounded-full transition-all duration-700"
                                            style={{ width: `${percentage}%`, backgroundColor: strokeColor }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Topic Analysis ── */}
                    <div className="mb-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center gap-3 pb-4 mb-5 border-b border-gray-100">
                            <div className="w-9 h-9 rounded-xl bg-green-100 flex items-center justify-center text-green-600 shrink-0">
                                <BarChart2 className="w-4 h-4 text-green-600" />
                            </div>
                            <div className="text-left">
                                <h2 className="text-base font-semibold text-gray-800">วิเคราะห์จุดแข็ง — จุดอ่อน</h2>
                                <p className="text-sm text-gray-400">คะแนนแยกตามหัวข้อ</p>
                            </div>
                        </div>

                        {topicPerformance.length > 0 ? (
                            <div className="flex flex-col lg:flex-row gap-6">
                                {/* Radar Chart */}
                                <div className="w-full lg:w-5/12 h-72">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <RadarChart cx="50%" cy="50%" outerRadius="75%"
                                            data={topicPerformance.map(t => ({
                                                subject: t.topicName.length > 14 ? t.topicName.substring(0, 14) + '…' : t.topicName,
                                                fullName: t.topicName,
                                                Performance: t.percentage,
                                                fullMark: 100
                                            }))}>
                                            <PolarGrid stroke="#e5e7eb" />
                                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 11 }} />
                                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                                            <Tooltip
                                                content={({ active, payload }) => {
                                                    if (active && payload?.length) {
                                                        const d = payload[0].payload;
                                                        return (
                                                            <div className="bg-white border border-gray-100 shadow-lg rounded-xl px-3 py-2 text-sm">
                                                                <p className="font-semibold text-gray-800">{d.fullName}</p>
                                                                <p className="text-green-600 font-medium">{d.Performance}%</p>
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                }}
                                            />
                                            <Radar name="Performance" dataKey="Performance"
                                                stroke="#22c55e" fill="#22c55e" fillOpacity={0.25}
                                                dot={{ r: 3, fill: '#22c55e' }} />
                                        </RadarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Topic list */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-700 mb-3 pb-2 border-b border-gray-100">คะแนนรายหัวข้อ</p>
                                    <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                                        {topicPerformance.map(topic => {
                                            const isStrength = topic.percentage >= 70;
                                            const isWeak = topic.percentage < 50;
                                            const color = isStrength ? 'text-green-600' : isWeak ? 'text-red-500' : 'text-yellow-600';
                                            const barColor = isStrength ? '#22c55e' : isWeak ? '#ef4444' : '#eab308';
                                            const Icon = isStrength ? Award : isWeak ? AlertTriangle : Target;
                                            const iconBg = isStrength ? 'bg-green-100 text-green-600' : isWeak ? 'bg-red-100 text-red-500' : 'bg-yellow-100 text-yellow-600';

                                            return (
                                                <div key={topic.topicId} className="rounded-xl border border-gray-100 p-3 space-y-2">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
                                                            <Icon className="w-3.5 h-3.5" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium text-gray-800 truncate">{topic.topicName}</p>
                                                            <p className="text-sm text-gray-400">{topic.correct}/{topic.total} ข้อ</p>
                                                        </div>
                                                        <span className={`text-sm font-medium shrink-0 ${color}`}>{topic.percentage}%</span>
                                                    </div>

                                                    {/* Bar */}
                                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${topic.percentage}%`, backgroundColor: barColor }} />
                                                    </div>

                                                    {/* Sub-topics */}
                                                    {topic.subTopics.length > 0 && (
                                                        <div className="flex flex-wrap gap-1 pt-1">
                                                            {topic.subTopics.map(st => {
                                                                const stColor = st.percentage >= 70
                                                                    ? 'bg-green-50 border-green-100 text-green-700'
                                                                    : st.percentage >= 50
                                                                        ? 'bg-yellow-50 border-yellow-100 text-yellow-700'
                                                                        : 'bg-red-50 border-red-100 text-red-600';
                                                                return (
                                                                    <span key={st.subTopicId} className={`text-sm px-2 py-0.5 rounded-md border font-medium ${stColor}`}>
                                                                        {st.name} ({st.correct}/{st.total})
                                                                    </span>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-10">
                                <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                <p className="text-sm font-medium text-gray-500">ไม่มีข้อมูลหัวข้อ</p>
                                <p className="text-sm text-gray-400 mt-1">ข้อสอบนี้ยังไม่ได้แท็กหัวข้อไว้</p>
                            </div>
                        )}
                    </div>

                    {/* ── Actions ── */}
                    <div className="flex flex-wrap gap-3">
                        <Link
                            href={`/user/examset/take-exam/summarize-exam/answer`}
                            className="flex-1 sm:flex-none px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl text-sm text-center transition-colors shadow-sm"
                        >
                            ดูเฉลยคำตอบ
                        </Link>
                        <Link
                            href="/user/examset"
                            className="flex-1 sm:flex-none px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl text-sm text-center border border-gray-200 transition-colors"
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

export default function SummarizePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <Summarize />
        </Suspense>
    );
}