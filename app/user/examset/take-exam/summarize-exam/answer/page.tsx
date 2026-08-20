"use client"
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar_user from "@/components/Navbar_user"
import Footer from "@/components/Footer"
import Link from "next/link"
import { CheckCircle, CheckCircle2, XCircle, BookOpen, ChevronRight, Loader2, AlertCircle, BarChart3, TrendingUp, X, List, HelpCircle, Info, ChevronsUpDown, ChevronsDownUp, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Types
interface AnswerOption {
    option_id: number;
    option_text: string;
    is_correct: boolean;
}

interface Situation {
    situation_id: number;
    situation_title: string;
    situation_text: string;
    situation_image_url?: string;
}

interface QuestionResponse {
    item_id: number;
    question_text: string;
    explanation: string;
    selected_option_id: number | null;
    is_correct: boolean;
    response_time_ms: number;
    answer_options: AnswerOption[];
    situation?: Situation;
    question_image_url?: string;
}

interface ExamResult {
    session_id: number;
    item_bank_name: string;
    status: string;
    start_time: string;
    end_time: string;
    total_questions: number;
    correct_count: number;
    final_score: number;
    responses: QuestionResponse[];
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

const AnswerPage = () => {
    const searchParams = useSearchParams();
    const { getToken } = useAuth();
    const sessionId = searchParams.get('session_id');

    const [examResult, setExamResult] = useState<ExamResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showStatsModal, setShowStatsModal] = useState(false);
    const [selectedQuestionStats, setSelectedQuestionStats] = useState<MasteryData | null>(null);
    const [loadingStats, setLoadingStats] = useState(false);
    const [showTOC, setShowTOC] = useState(true);
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
    const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [showAnswers, setShowAnswers] = useState(true);

    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            const offset = 80; // height of navbar
            const bodyRect = document.body.getBoundingClientRect().top;
            const elementRect = element.getBoundingClientRect().top;
            const elementPosition = elementRect - bodyRect;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    };

    const toggleGroupExpand = (idx: number) => {
        setExpandedGroups(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

    const toggleGroupCollapse = (idx: number) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    };

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
                throw new Error('ไม่สามารถโหลดเฉลยคำตอบได้');
            }
        } catch (error) {
            console.error('Error fetching exam result:', error);
            setError('เกิดข้อผิดพลาดในการโหลดเฉลยคำตอบ');
        } finally {
            setLoading(false);
        }
    };

    const fetchQuestionStats = async (itemId: number) => {
        setLoadingStats(true);
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/items-bank/mastery/${itemId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSelectedQuestionStats(data);
                setShowStatsModal(true);
            } else {
                setSelectedQuestionStats(null);
                setShowStatsModal(true);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
            setSelectedQuestionStats(null);
            setShowStatsModal(true);
        } finally {
            setLoadingStats(false);
        }
    };


    const QuestionCard = ({ question, index, showSituation = true }: { question: QuestionResponse, index: number, showSituation?: boolean }) => {
        const isCorrect = question.is_correct;

        return (
            <div id={`question-${index}`} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden scroll-mt-32 transition-all">
                {/* Question Header */}
                <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center transition-colors">
                    <div className="flex items-center gap-3 flex-1">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium text-white text-sm ${isCorrect ? "bg-green-500" : "bg-red-500"}`}>
                            {index + 1}
                        </div>
                        <span className={`font-medium text-sm ${isCorrect ? "text-green-700" : "text-red-700"}`}>
                            {isCorrect ? "✓ ถูกต้อง" : "✗ ไม่ถูกต้อง"}
                        </span>
                    </div>
                    <button
                        onClick={() => fetchQuestionStats(question.item_id)}
                        disabled={loadingStats}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-medium transition-all disabled:opacity-50 ${isCorrect
                            ? 'text-green-600 hover:text-white hover:bg-green-600 border border-green-200 bg-green-50/50'
                            : 'text-red-600 hover:text-white hover:bg-red-600 border border-red-200 bg-red-50/50'
                            }`}
                    >
                        <BarChart3 className="w-3.5 h-3.5" />
                        สถิติคำตอบ
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Question Content */}
                    <div>
                        <p 
                            className="text-gray-800 text-sm sm:text-base whitespace-pre-wrap leading-relaxed font-medium"
                            dangerouslySetInnerHTML={{ __html: question.question_text }}
                        />
                        {question.question_image_url && (
                            <div className="mt-4">
                                <img
                                    src={question.question_image_url.startsWith("http")
                                        ? question.question_image_url
                                        : `${process.env.NEXT_PUBLIC_API_URL}${question.question_image_url}`}
                                    alt="คำถาม"
                                    className="max-h-72 rounded-xl object-contain border border-gray-200 shadow-sm bg-white cursor-zoom-in hover:opacity-90 transition-opacity"
                                    onClick={() => {
                                        const url = question.question_image_url;
                                        if (url) {
                                            setPreviewImage(
                                                url.startsWith("http")
                                                    ? url
                                                    : `${process.env.NEXT_PUBLIC_API_URL}${url}`
                                            );
                                        }
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Options */}
                    <div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {question.answer_options.map((option, oIdx) => {
                                const selected = question.selected_option_id != null &&
                                    String(option.option_id) === String(question.selected_option_id);
                                const correct = option.is_correct;

                                let cls = "border-gray-200 bg-white";
                                let icon = null;
                                if (showAnswers) {
                                    if (selected && correct) { cls = "border-green-500 bg-green-50"; icon = <CheckCircle2 className="text-green-500 shrink-0" size={18} />; }
                                    else if (selected && !correct) { cls = "border-red-500 bg-red-50"; icon = <XCircle className="text-red-500 shrink-0" size={18} />; }
                                    else if (correct) { cls = "border-green-400 bg-green-50/40"; icon = <CheckCircle2 className="text-green-400 shrink-0" size={18} />; }
                                } else {
                                    if (selected) { cls = "border-green-600 bg-green-50/20"; }
                                }

                                return (
                                    <div
                                        key={oIdx}
                                        className={`p-3 rounded-xl border-2 flex items-center gap-3 transition-all ${cls}`}
                                    >
                                        <div className="flex-grow">
                                            <span 
                                                className={`text-sm break-words ${selected || (showAnswers && correct) ? 'font-medium' : 'text-gray-600'}`}
                                                dangerouslySetInnerHTML={{ __html: option.option_text }}
                                            />
                                            {selected && (
                                                <span className={`ml-2 py-0.5 px-1.5 rounded text-[10px] font-medium ${
                                                    showAnswers
                                                        ? (correct ? 'bg-green-150 text-green-800' : 'bg-red-150 text-red-800')
                                                        : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    คำตอบของคุณ
                                                </span>
                                            )}
                                        </div>
                                        {icon}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Explanation */}
                    {question.explanation && showAnswers && (
                        <div className="bg-indigo-50/60 p-4 rounded-xl border border-indigo-100">
                            <div className="flex items-center gap-2 mb-2">
                                <HelpCircle className="w-4 h-4 text-indigo-700" />
                                <h6 className="text-xs font-medium text-indigo-800 uppercase tracking-widest">คำอธิบาย</h6>
                            </div>
                            <p 
                                className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed"
                                dangerouslySetInnerHTML={{ __html: question.explanation }}
                            />
                        </div>
                    )}
                </div>
            </div>
        );
    };

    // Group questions by situation
    const groupQuestionsBySituation = () => {
        const groups: { situation: Situation | null, questions: { question: QuestionResponse, originalIndex: number }[] }[] = [];

        examResult?.responses.forEach((question, index) => {
            const situationId = question.situation?.situation_id;

            // Find existing group with same situation
            const existingGroup = groups.find(g =>
                g.situation?.situation_id === situationId && situationId !== undefined
            );

            if (existingGroup && situationId) {
                // Add to existing group
                existingGroup.questions.push({ question, originalIndex: index });
            } else {
                // Create new group
                groups.push({
                    situation: question.situation || null,
                    questions: [{ question, originalIndex: index }]
                });
            }
        });

        return groups;
    };


    if (loading) {
        return (
            <>
                <Navbar_user />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">กำลังโหลดเฉลยคำตอบ...</p>
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
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-medium text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
                        <p className="text-gray-600 mb-6">{error || 'ไม่พบเฉลยคำตอบ'}</p>
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

    return (
        <>
            <Navbar_user />
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 mb-4">
                    <div className="max-w-7xl mx-auto">
                        {/* Breadcrumb */}
                        <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-6">
                            <Link href="/user" className="hover:text-green-600 transition">หน้าหลัก</Link>
                            <span className="mx-1 sm:mx-2 flex items-center">
                                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </span>
                            <Link href="/user/examset" className="hover:text-green-600 transition">คลังข้อสอบ</Link>
                            <span className="mx-1 sm:mx-2 flex items-center">
                                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </span>
                            <span className="hidden sm:inline-flex items-center">
                                {examResult.item_bank_name}
                            </span>
                            <span className="mx-1 sm:mx-2 flex items-center">
                                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </span>
                            <Link
                                href={`/user/examset/take-exam/summarize-exam?session_id=${sessionId}`}
                                className="hover:text-green-600 transition whitespace-nowrap"
                            >
                                สรุปผลการสอบ
                            </Link>
                            <span className="mx-1 sm:mx-2 flex items-center">
                                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </span>
                            <span className="text-gray-700 font-medium whitespace-nowrap">เฉลยคำตอบ</span>
                        </div>

                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-medium text-gray-800 mb-1">
                                เฉลยคำตอบ: {examResult.item_bank_name}
                            </h1>
                            <div className="mt-3 text-sm text-gray-500">
                                <span>จำนวนทั้งหมด: {examResult.total_questions} ข้อ</span>
                                <span className="mx-3">|</span>
                                <span className="text-green-600 font-medium">ตอบถูก: {examResult.correct_count} ข้อ</span>
                                <span className="mx-3">|</span>
                                <span className="text-red-600 font-medium">
                                    ตอบผิด: {examResult.total_questions - examResult.correct_count} ข้อ
                                </span>
                            </div>
                        </div>

                        {/* Summary/Control Bar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-5 py-3.5 shadow-sm mb-6">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center border border-green-100">
                                        <BookOpen className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 leading-none mb-0.5">สถานการณ์</p>
                                        <p className="text-base font-medium text-gray-800 leading-none">{groupQuestionsBySituation().length}</p>
                                    </div>
                                </div>
                                <div className="w-px h-8 bg-gray-100" />
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center border border-green-100">
                                        <HelpCircle className="w-4 h-4 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 leading-none mb-0.5">คำถามทั้งหมด</p>
                                        <p className="text-base font-medium text-gray-800 leading-none">{examResult.total_questions} ข้อ</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Collapse / Expand all */}
                                <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                                    <button
                                        onClick={() => setCollapsedGroups(new Set())}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-sm transition-all"
                                        title="เปิดทุกสถานการณ์"
                                    >
                                        <ChevronsUpDown className="w-3.5 h-3.5" />
                                        เปิดทั้งหมด
                                    </button>
                                    <button
                                        onClick={() => setCollapsedGroups(new Set(groupQuestionsBySituation().map((_, idx) => idx)))}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-sm transition-all"
                                        title="ยุบทุกสถานการณ์"
                                    >
                                        <ChevronsDownUp className="w-3.5 h-3.5" />
                                        ยุบทั้งหมด
                                    </button>
                                </div>

                                {/* Toggle show answers */}
                                <button
                                    onClick={() => setShowAnswers(v => !v)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all
                                        ${showAnswers
                                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                        }`}
                                >
                                    {showAnswers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    {showAnswers ? 'ซ่อนเฉลย' : 'แสดงเฉลย'}
                                </button>
                            </div>
                        </div>

                        {/* Questions */}
                        <div className="space-y-8">
                            {groupQuestionsBySituation().map((group, groupIndex) => (
                                <div key={groupIndex} id={`group-${groupIndex}`} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                                    {/* Situation Header */}
                                    <div className="px-6 py-4.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => toggleGroupCollapse(groupIndex)}
                                                    className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                                                >
                                                    {collapsedGroups.has(groupIndex) ? (
                                                        <ChevronRight className="w-5 h-5 rotate-90 transition-transform" />
                                                    ) : (
                                                        <ChevronRight className="w-5 h-5 rotate-[-90deg] transition-transform" />
                                                    )}
                                                </button>

                                                <h3 className="text-base font-medium">
                                                    {group.situation ? `สถานการณ์ที่ ${groupIndex + 1}` : 'คำถามทั่วไป'}
                                                </h3>
                                            </div>
                                            <div className="text-xs font-medium bg-white/20 px-3 py-1.5 rounded-full uppercase tracking-wider">
                                                {group.questions.length} คำถาม
                                            </div>
                                        </div>
                                    </div>

                                    {!collapsedGroups.has(groupIndex) && (
                                        <div className="p-6 bg-gray-50 space-y-6">
                                            {/* Situation Detail (if exists) */}
                                            {group.situation && (
                                                <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 relative overflow-hidden">
                                                    <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
                                                    <h6 className="text-[10px] sm:text-xs font-medium text-blue-700 uppercase tracking-[0.2em] mb-3 flex items-center gap-1">
                                                        <Info size={14} /> รายละเอียดสถานการณ์
                                                    </h6>
                                                    {group.situation.situation_title && (
                                                        <p 
                                                            className="font-medium text-gray-800 mb-2"
                                                            dangerouslySetInnerHTML={{ __html: group.situation.situation_title }}
                                                        />
                                                    )}
                                                    <p 
                                                        className="text-gray-800 whitespace-pre-wrap leading-relaxed font-medium text-sm"
                                                        dangerouslySetInnerHTML={{ __html: group.situation.situation_text }}
                                                    />
                                                    {group.situation.situation_image_url && (
                                                        <img
                                                            src={group.situation.situation_image_url}
                                                            alt="Situation"
                                                            className="mt-6 rounded-xl border border-gray-100 shadow-sm max-h-80 object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                                                            onClick={() => {
                                                                const url = group.situation?.situation_image_url;
                                                                if (url) {
                                                                    setPreviewImage(url);
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {/* Questions Loop */}
                                            <div className="space-y-6">
                                                {group.questions.map(({ question, originalIndex }) => (
                                                    <QuestionCard
                                                        key={originalIndex}
                                                        question={question}
                                                        index={originalIndex}
                                                        showSituation={false}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Back Button */}
                        <div className="mt-8 flex justify-center">
                            <Link
                                href={`/user/examset/take-exam/summarize-exam?session_id=${sessionId}`}
                                className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors shadow-sm"
                            >
                                ← กลับไปหน้าสรุปผล
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Floating Table of Contents */}
            <div className="fixed right-4 top-28 z-40 hidden lg:flex flex-col items-end gap-2 transition-all">
                {/* Toggle Button */}
                <button
                    type="button"
                    onClick={() => setShowTOC(!showTOC)}
                    className={`bg-white p-2.5 rounded-full shadow-lg border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-200 transition-all active:scale-95`}
                    title={showTOC ? "ซ่อนสารบัญ" : "แสดงสารบัญ"}
                >
                    {showTOC ? <ChevronRight className="w-5 h-5" /> : <List className="w-5 h-5" />}
                </button>

                {showTOC && (
                    <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-64 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="p-3 bg-gray-50 border-b border-gray-200 font-medium text-gray-700 text-sm flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <List className="w-4 h-4" />
                                <span>สารบัญคำตอบ</span>
                            </div>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1 custom-scrollbar">
                            {groupQuestionsBySituation().map((group, gIdx) => {
                                const isExpanded = expandedGroups.has(gIdx);
                                const situationTitle = group.situation?.situation_title || (group.situation ? `สถานการณ์ที่ ${gIdx + 1}` : 'คำถามทั่วไป');
                                const correctCount = group.questions.filter(q => q.question.is_correct).length;

                                return (
                                    <div key={gIdx} className="space-y-1">
                                        <div className={`flex items-center w-full rounded-lg transition-colors pr-2 ${expandedGroups.has(gIdx) ? 'bg-emerald-50/50' : ''}`}>
                                            <button
                                                onClick={() => toggleGroupExpand(gIdx)}
                                                className="p-2 hover:bg-black/5 rounded-l-lg text-gray-400 hover:text-emerald-600 transition-colors"
                                            >
                                                {isExpanded ? (
                                                    <ChevronRight className="w-4 h-4 rotate-90" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </button>
                                            <button
                                                onClick={() => scrollToSection(`group-${gIdx}`)}
                                                className="flex-1 text-left py-2 text-xs font-medium text-gray-700 hover:text-emerald-700 transition-all truncate flex items-center justify-between"
                                                title={situationTitle}
                                            >
                                                <span className="truncate">{situationTitle}</span>
                                                <span className="ml-2 text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                                                    {correctCount}/{group.questions.length}
                                                </span>
                                            </button>
                                        </div>

                                        {isExpanded && (
                                            <div className="ml-4 pl-2 border-l-2 border-emerald-50 space-y-0.5 mb-2 animate-in slide-in-from-top-1 duration-200">
                                                {group.questions.map((q, qIdx) => (
                                                    <button
                                                        key={qIdx}
                                                        onClick={() => scrollToSection(`question-${q.originalIndex}`)}
                                                        className={`w-full text-left px-2 py-1.5 rounded text-[10px] flex items-center justify-between transition-all ${q.question.is_correct
                                                            ? 'text-green-600 hover:bg-green-50'
                                                            : 'text-red-600 hover:bg-red-50'
                                                            }`}
                                                        title={q.question.question_text}
                                                    >
                                                        <span className="truncate flex-1">ข้อที่ {q.originalIndex + 1}: {q.question.question_text.substring(0, 25)}...</span>
                                                        {q.question.is_correct ? (
                                                            <CheckCircle className="w-3 h-3 flex-shrink-0 ml-1" />
                                                        ) : (
                                                            <XCircle className="w-3 h-3 flex-shrink-0 ml-1" />
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            {/* Stats Modal */}
            {showStatsModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowStatsModal(false)}>
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="w-6 h-6 text-blue-600" />
                                    <h2 className="text-xl font-medium text-gray-800">สถิติการทำข้อสอบ</h2>
                                </div>
                                <button
                                    onClick={() => setShowStatsModal(false)}
                                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                >
                                    <X className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            {selectedQuestionStats ? (
                                <div className="space-y-4">
                                    {/* Main Stats Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-green-50 rounded-xl p-4 text-center">
                                            <p className="text-sm text-green-600 font-medium mb-1">จำนวนครั้ง</p>
                                            <p className="text-3xl font-medium text-green-700">{selectedQuestionStats.total_attempts}</p>
                                        </div>
                                        <div className="bg-emerald-50 rounded-xl p-4 text-center">
                                            <p className="text-sm text-emerald-600 font-medium mb-1">ตอบถูก</p>
                                            <p className="text-3xl font-medium text-emerald-700">{selectedQuestionStats.total_correct}</p>
                                        </div>
                                    </div>

                                    {/* Accuracy */}
                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-sm font-medium text-gray-700">ความแม่นยำ</span>
                                            <span className="text-2xl font-medium text-green-700">
                                                {selectedQuestionStats.total_attempts > 0
                                                    ? Math.round((selectedQuestionStats.total_correct / selectedQuestionStats.total_attempts) * 100)
                                                    : 0}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-white rounded-full h-3 overflow-hidden">
                                            <div
                                                className="bg-gradient-to-r from-green-500 to-emerald-500 h-full transition-all duration-500"
                                                style={{
                                                    width: `${selectedQuestionStats.total_attempts > 0
                                                        ? (selectedQuestionStats.total_correct / selectedQuestionStats.total_attempts) * 100
                                                        : 0}%`
                                                }}
                                            />
                                        </div>
                                    </div>

                                    {/* Streak & Incorrect */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="border-2 border-orange-200 rounded-xl p-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <TrendingUp className="w-4 h-4 text-orange-600" />
                                                <p className="text-xs text-orange-600 font-medium">ถูกติดกัน</p>
                                            </div>
                                            <p className="text-2xl font-medium text-orange-700">{selectedQuestionStats.correct_streak}</p>
                                        </div>
                                        <div className="border-2 border-red-200 rounded-xl p-4">
                                            <p className="text-xs text-red-600 font-medium mb-1">ตอบผิด</p>
                                            <p className="text-2xl font-medium text-red-700">{selectedQuestionStats.total_incorrect}</p>
                                        </div>
                                    </div>

                                    {/* Last Attempt */}
                                    <div className="text-center pt-4 border-t border-gray-200">
                                        <p className="text-xs text-gray-500">ทำล่าสุด</p>
                                        <p className="text-sm font-medium text-gray-700 mt-1">
                                            {new Date(selectedQuestionStats.last_answered_at).toLocaleDateString('th-TH', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                    <p className="text-gray-600 font-medium">ยังไม่มีประวัติการทำข้อนี้</p>
                                    <p className="text-sm text-gray-500 mt-1">นี่เป็นครั้งแรกที่คุณทำข้อนี้</p>
                                </div>
                            )}

                            <button
                                onClick={() => setShowStatsModal(false)}
                                className="w-full mt-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {previewImage && (
                <div 
                    className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300"
                    onClick={() => setPreviewImage(null)}
                >
                    <div 
                        className="relative max-w-5xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2 flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors z-10 shadow-md"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <img
                            src={previewImage}
                            alt="preview"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}

            <Footer />
        </>
    )
}

export default AnswerPage;