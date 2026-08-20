"use client"
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { ChevronRight, Loader2, AlertCircle, ChevronDown, ChevronUp, BarChart3, TrendingUp, Target, Award, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
    Radar,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    ResponsiveContainer,
    Tooltip
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
    topic?: {
        topic_id: number;
        topic_name: string;
    };
}

interface QuestionResponse {
    item_id: number;
    question_text: string;
    is_correct: boolean;
    sub_topics?: SubTopic[];
}

interface MasteryData {
    user_id: number;
    item_id: number;
    total_attempts: number;
    total_correct: number;
    total_incorrect: number;
    correct_streak: number;
    last_answered_at: string;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

function Summarize() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { getToken } = useAuth();
    const sessionId = searchParams.get('session_id');

    const [examResult, setExamResult] = useState<ExamResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAnalysis, setShowAnalysis] = useState(false);

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
            const token = getToken();
            const response = await fetch(`${API_URL}/items-bank/exam/${sessionId}/result`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
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


    // Analyze strengths and weaknesses by topic
    const analyzeTopicPerformance = () => {
        if (!examResult?.responses) return [];

        const topicStats: { [key: string]: { total: number, correct: number, topicName: string, subTopics: { [key: string]: { total: number, correct: number, name: string } } } } = {};

        examResult.responses.forEach(response => {
            if (response.sub_topics && response.sub_topics.length > 0) {
                response.sub_topics.forEach(subTopic => {
                    const topicId = subTopic.topic?.topic_id;
                    const topicName = subTopic.topic?.topic_name || 'ไม่ระบุหัวข้อ';
                    const subTopicId = subTopic.sub_topic_id;
                    const subTopicName = subTopic.sub_topic_name;

                    if (!topicId) return;

                    // Initialize topic if not exists
                    if (!topicStats[topicId]) {
                        topicStats[topicId] = { total: 0, correct: 0, topicName, subTopics: {} };
                    }

                    // Update topic stats
                    topicStats[topicId].total++;
                    if (response.is_correct) topicStats[topicId].correct++;

                    // Initialize sub-topic if not exists
                    if (!topicStats[topicId].subTopics[subTopicId]) {
                        topicStats[topicId].subTopics[subTopicId] = { total: 0, correct: 0, name: subTopicName };
                    }

                    // Update sub-topic stats
                    topicStats[topicId].subTopics[subTopicId].total++;
                    if (response.is_correct) topicStats[topicId].subTopics[subTopicId].correct++;
                });
            }
        });

        // Convert to array and calculate percentages
        return Object.entries(topicStats).map(([topicId, stats]) => ({
            topicId,
            topicName: stats.topicName,
            total: stats.total,
            correct: stats.correct,
            percentage: stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0,
            subTopics: Object.entries(stats.subTopics).map(([subTopicId, subStats]) => ({
                subTopicId,
                name: subStats.name,
                total: subStats.total,
                correct: subStats.correct,
                percentage: subStats.total > 0 ? Math.round((subStats.correct / subStats.total) * 100) : 0
            })).sort((a, b) => a.percentage - b.percentage) // Sort by percentage ascending (weakest first)
        })).sort((a, b) => b.percentage - a.percentage); // Sort by percentage descending (strongest first)
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
                        <h2 className="text-2xl font-medium text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
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
                        <h1 className="text-3xl font-medium text-gray-900 mb-2">{examResult.item_bank_name}</h1>
                        <p className="text-gray-600">จำนวน {examResult.total_questions} ข้อ</p>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Left Column - Score */}
                        <div className="bg-white rounded-2xl shadow-sm p-8">
                            <h2 className="text-lg font-medium text-gray-900 mb-6">ผลการทดสอบ</h2>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-600 mb-2">{examResult.item_bank_name}</p>
                                    <p className="text-gray-500 text-sm mb-4">จำนวน {examResult.total_questions} ข้อ</p>
                                    <div className="text-5xl font-medium text-gray-900">
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
                                        <span className={`text-2xl font-medium ${percentage >= 80 ? 'text-green-600' :
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
                            <h2 className="text-lg font-medium text-gray-900 mb-6">เวลาที่ใช้ในการสอบ</h2>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="text-4xl font-medium text-gray-900">{timeUsed}</div>
                            </div>

                            {/* Additional Stats */}
                            <div className="mt-8 pt-6 border-t border-gray-200">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">ตอบถูก</p>
                                        <p className="text-2xl font-medium text-green-600">{examResult.correct_count}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">ตอบผิด</p>
                                        <p className="text-2xl font-medium text-red-600">
                                            {examResult.total_questions - examResult.correct_count}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    {/* Topic Analysis Section */}
                    <div className="mb-6">
                        <button
                            onClick={() => setShowAnalysis(!showAnalysis)}
                            className="w-full bg-white rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                                    <Target className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="text-left">
                                    <h2 className="text-lg font-medium text-gray-800">วิเคราะห์จุดแข็ง - จุดอ่อน</h2>
                                    <p className="text-sm text-gray-500">ตามหัวข้อและหัวข้อย่อย</p>
                                </div>
                            </div>
                            {showAnalysis ? (
                                <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                                <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                        </button>

                        {/* Analysis Content */}
                        {showAnalysis && (() => {
                            const topicPerformance = analyzeTopicPerformance();
                            const hasData = topicPerformance.length > 0;

                            return (
                                <div className="mt-4 bg-white rounded-2xl shadow-sm p-6 space-y-8 min-h-[400px]">
                                    {hasData ? (
                                        <div className="flex flex-col lg:flex-row gap-8 items-stretch mb-2">
                                            {/* Radar Chart */}
                                            <div className="w-full lg:w-1/2 h-[350px] flex items-center justify-center">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={topicPerformance.map(t => ({
                                                        subject: t.topicName.length > 15 ? t.topicName.substring(0, 15) + '...' : t.topicName,
                                                        fullName: t.topicName,
                                                        Performance: t.percentage,
                                                        fullMark: 100
                                                    }))}>
                                                        <PolarGrid stroke="#e5e7eb" />
                                                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                                                        <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                                                        <Tooltip
                                                            content={({ active, payload }) => {
                                                                if (active && payload && payload.length) {
                                                                    const data = payload[0].payload;
                                                                    return (
                                                                        <div className="bg-white p-3 shadow-xl border border-gray-100 rounded-xl">
                                                                            <p className="font-medium text-gray-800 mb-1">{data.fullName}</p>
                                                                            <p className="text-blue-600 font-medium">ความแม่นยำ: {data.Performance}%</p>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            }}
                                                        />
                                                        <Radar
                                                            name="Performance"
                                                            dataKey="Performance"
                                                            stroke="#3b82f6"
                                                            fill="#3b82f6"
                                                            fillOpacity={0.4}
                                                            dot={{ r: 4, fill: '#3b82f6' }}
                                                        />
                                                    </RadarChart>
                                                </ResponsiveContainer>
                                            </div>

                                            {/* Score List (Unified nested cards) */}
                                            <div className="w-full lg:w-1/2 flex flex-col">
                                                <h3 className="font-medium text-gray-800 mb-3 border-b pb-2">คะแนนรายหัวข้อ</h3>
                                                <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                                                    {topicPerformance.map((topic) => {
                                                        const isStrength = topic.percentage >= 70;
                                                        const isWeakness = topic.percentage < 50;

                                                        return (
                                                            <div key={topic.topicId} className="p-3.5 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/50 transition-colors space-y-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${isStrength ? 'bg-green-100 text-green-600' :
                                                                        isWeakness ? 'bg-red-100 text-red-600' :
                                                                            'bg-yellow-100 text-yellow-600'
                                                                        }`}>
                                                                        {isStrength ? <Award className="w-5 h-5" /> :
                                                                            isWeakness ? <AlertTriangle className="w-5 h-5" /> :
                                                                                <Target className="w-5 h-5" />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <p className="font-medium text-gray-800 text-sm truncate">{topic.topicName}</p>
                                                                        <p className="text-xs text-gray-500">{topic.correct}/{topic.total} ข้อ</p>
                                                                    </div>
                                                                    <span className={`font-medium text-sm ${isStrength ? 'text-green-600' :
                                                                        isWeakness ? 'text-red-600' :
                                                                            'text-yellow-600'
                                                                        }`}>{topic.percentage}%</span>
                                                                </div>

                                                                {/* Progress Bar */}
                                                                <div className="w-full bg-gray-100 rounded-full h-1">
                                                                    <div
                                                                        className={`h-1 rounded-full ${
                                                                            topic.percentage >= 70 ? 'bg-green-500' :
                                                                            topic.percentage >= 50 ? 'bg-yellow-400' : 'bg-red-400'
                                                                        }`}
                                                                        style={{ width: `${topic.percentage}%` }}
                                                                    />
                                                                </div>

                                                                {/* Subtopics */}
                                                                {topic.subTopics && topic.subTopics.length > 0 && (
                                                                    <div className="pt-2 border-t border-gray-50">
                                                                        <div className="flex flex-wrap gap-1.5">
                                                                            {topic.subTopics.map(st => (
                                                                                <div
                                                                                    key={st.subTopicId}
                                                                                    className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                                                                        st.percentage >= 70
                                                                                            ? 'bg-green-50 border-green-200 text-green-700'
                                                                                            : st.percentage >= 50
                                                                                            ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                                                                                            : 'bg-red-50 border-red-200 text-red-600'
                                                                                    }`}
                                                                                >
                                                                                    <span className="font-medium">{st.name}</span>
                                                                                    <span className="opacity-60">({st.correct}/{st.total})</span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                            <p className="text-gray-600 font-medium">ไม่มีข้อมูลหัวข้อ</p>
                                            <p className="text-sm text-gray-500 mt-1">ข้อสอบนี้ไม่ได้แท็กหัวข้อไว้</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
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