"use client"
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
    CheckCircle2, XCircle, BookOpen, ChevronRight, AlertCircle,
    BarChart2, X, List, ChevronsUpDown, ChevronsDownUp,
    Eye, EyeOff, TrendingUp, ChevronDown, ChevronUp, Clock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import ImagePreviewModal from '@/components/ImagePreviewModal';
import LoadingSpinner from '@/components/LoadingSpinner';

// ─── Types ───────────────────────────────────────────────────────────────────
interface AnswerOption {
    option_id: number;
    option_text: string;
    is_correct: boolean;
    option_image_url?: string;
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
const LABELS = ['ก', 'ข', 'ค', 'ง', 'จ'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function scrollToEl(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: 'smooth' });
}

// ─── QuestionCard ─────────────────────────────────────────────────────────────
function QuestionCard({
    question,
    index,
    showAnswers,
    onShowStats,
    setPreviewImage,
}: {
    question: QuestionResponse;
    index: number;
    showAnswers: boolean;
    onShowStats: (itemId: number) => void;
    setPreviewImage: (url: string) => void;
}) {
    const correct = question.is_correct;

    return (
        <div id={`question-${index}`} className="scroll-mt-24 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 border-b ${correct ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white ${correct ? 'bg-green-500' : 'bg-red-400'}`}>
                        {index + 1}
                    </div>
                    {correct
                        ? <span className="text-sm font-semibold text-green-700 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> ถูกต้อง</span>
                        : <span className="text-sm font-semibold text-red-600 flex items-center gap-1.5"><XCircle className="w-4 h-4" /> ไม่ถูกต้อง</span>
                    }
                </div>
                <button
                    onClick={() => onShowStats(question.item_id)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-800 hover:bg-white border border-transparent hover:border-gray-200 transition-all"
                >
                    <BarChart2 className="w-3.5 h-3.5" />
                    สถิติ
                </button>
            </div>

            <div className="p-5 space-y-5">
                {/* Question text */}
                <p
                    className="text-gray-800 text-sm leading-relaxed font-medium"
                    dangerouslySetInnerHTML={{ __html: question.question_text }}
                />
                {question.question_image_url && (
                    <img
                        src={question.question_image_url.startsWith('http')
                            ? question.question_image_url
                            : `${API_URL}${question.question_image_url}`}
                        alt="คำถาม"
                        className="max-h-64 rounded-lg border border-gray-100 object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                        onClick={() => {
                            const url = question.question_image_url!;
                            setPreviewImage(url.startsWith('http') ? url : `${API_URL}${url}`);
                        }}
                    />
                )}

                {/* Options */}
                <div className="space-y-2">
                    {question.answer_options.map((opt, oIdx) => {
                        const isSelected = question.selected_option_id != null &&
                            String(opt.option_id) === String(question.selected_option_id);
                        const isCorrect = opt.is_correct;

                        let borderClass = 'border-gray-100 bg-white';
                        let labelClass = 'bg-gray-100 text-gray-500';
                        let textClass = 'text-gray-700';
                        let trailingIcon = null;

                        if (showAnswers) {
                            if (isSelected && isCorrect) {
                                borderClass = 'border-green-300 bg-green-50';
                                labelClass = 'bg-green-500 text-white';
                                textClass = 'text-green-800 font-semibold';
                                trailingIcon = <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />;
                            } else if (isSelected && !isCorrect) {
                                borderClass = 'border-red-300 bg-red-50';
                                labelClass = 'bg-red-400 text-white';
                                textClass = 'text-red-700 font-semibold';
                                trailingIcon = <XCircle className="w-4 h-4 text-red-400 shrink-0" />;
                            } else if (isCorrect) {
                                borderClass = 'border-green-200 bg-green-50/50';
                                labelClass = 'bg-green-100 text-green-700';
                                textClass = 'text-green-700 font-semibold';
                                trailingIcon = <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />;
                            }
                        } else if (isSelected) {
                            borderClass = 'border-gray-300 bg-gray-50';
                            labelClass = 'bg-gray-600 text-white';
                        }

                        return (
                            <div key={oIdx} className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${borderClass}`}>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${labelClass}`}>
                                    {LABELS[oIdx] || String.fromCharCode(65 + oIdx)}
                                </span>
                                <div className="flex-1 min-w-0">
                                    {opt.option_text?.replace(/<[^>]*>/g, '').trim() && (
                                        <span className={`text-sm ${textClass}`} dangerouslySetInnerHTML={{ __html: opt.option_text }} />
                                    )}
                                    {opt.option_image_url?.trim() && (
                                        <img
                                            src={opt.option_image_url.startsWith('http') ? opt.option_image_url : `${API_URL}${opt.option_image_url}`}
                                            alt={`ตัวเลือก ${LABELS[oIdx]}`}
                                            className="mt-2 max-h-32 rounded-lg border border-gray-100 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                                            onClick={e => {
                                                e.stopPropagation();
                                                const url = opt.option_image_url!;
                                                setPreviewImage(url.startsWith('http') ? url : `${API_URL}${url}`);
                                            }}
                                        />
                                    )}
                                    {isSelected && (
                                        <span className="mt-1 ml-3 inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-gray-200 text-gray-600">
                                            คำตอบของคุณ
                                        </span>
                                    )}
                                </div>
                                {trailingIcon}
                            </div>
                        );
                    })}
                </div>

                {/* Explanation */}
                {question.explanation && showAnswers && (
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                        <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5" />
                            คำอธิบาย
                        </p>
                        <p
                            className="text-sm text-gray-700 leading-relaxed"
                            dangerouslySetInnerHTML={{ __html: question.explanation }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
function AnswerPageContent() {
    const searchParams = useSearchParams();
    const { getToken } = useAuth();
    const sessionId = searchParams.get('session_id');

    const [examResult, setExamResult] = useState<ExamResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAnswers, setShowAnswers] = useState(true);
    const [showTOC, setShowTOC] = useState(true);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());
    const [tocExpanded, setTocExpanded] = useState<Set<number>>(new Set([0]));
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [statsModal, setStatsModal] = useState<{ open: boolean; data: MasteryData | null }>({ open: false, data: null });
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        if (sessionId) fetchExamResult();
        else { setError('ไม่พบรหัส session'); setLoading(false); }
    }, [sessionId]);

    const fetchExamResult = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/items-bank/exam/${sessionId}/result`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setExamResult(await res.json());
            else throw new Error();
        } catch {
            setError('เกิดข้อผิดพลาดในการโหลดเฉลยคำตอบ');
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async (itemId: number) => {
        setLoadingStats(true);
        setStatsModal({ open: true, data: null });
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/items-bank/mastery/${itemId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setStatsModal({ open: true, data: res.ok ? await res.json() : null });
        } catch {
            setStatsModal({ open: true, data: null });
        } finally {
            setLoadingStats(false);
        }
    };

    const groupBySituation = () => {
        const groups: { situation: Situation | null; questions: { q: QuestionResponse; idx: number }[] }[] = [];
        examResult?.responses.forEach((q, idx) => {
            const sitId = q.situation?.situation_id;
            const existing = groups.find(g => g.situation?.situation_id === sitId && sitId !== undefined);
            if (existing && sitId) existing.questions.push({ q, idx });
            else groups.push({ situation: q.situation || null, questions: [{ q, idx }] });
        });
        return groups;
    };

    const toggleCollapse = (idx: number) =>
        setCollapsedGroups(prev => { const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s; });

    const toggleToc = (idx: number) =>
        setTocExpanded(prev => { const s = new Set(prev); s.has(idx) ? s.delete(idx) : s.add(idx); return s; });

    // ── Loading ──
    if (loading) return (
        <>
            <Navbar_user />
            <div className="min-h-[60vh] flex items-center justify-center">
                <LoadingSpinner size="lg" text="กำลังโหลดเฉลยข้อสอบ..." />
            </div>
            <Footer />
        </>
    );

    // ── Error ──
    if (error || !examResult) return (
        <>
            <Navbar_user />
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center max-w-sm">
                    <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">ไม่พบข้อมูลเฉลย</h2>
                    <p className="text-gray-500 text-sm mb-6">{error}</p>
                    <Link href="/user/examset" className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                        กลับไปคลังข้อสอบ
                    </Link>
                </div>
            </div>
            <Footer />
        </>
    );

    const groups = groupBySituation();
    const wrong = examResult.total_questions - examResult.correct_count;
    const pct = Math.round((examResult.correct_count / examResult.total_questions) * 100);

    return (
        <>
            <Navbar_user />
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4">

                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-6">
                        <Link href="/user" className="hover:text-gray-600 transition-colors">หน้าหลัก</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href="/user/examset" className="hover:text-gray-600 transition-colors">คลังข้อสอบ</Link>
                        <ChevronRight className="w-3 h-3" />
                        <Link href={`/user/examset/take-exam/summarize-exam?session_id=${sessionId}`} className="hover:text-gray-600 transition-colors">สรุปผลสอบ</Link>
                        <ChevronRight className="w-3 h-3" />
                        <span className="text-gray-600 font-medium">เฉลยคำตอบ</span>
                    </nav>

                    {/* Page title */}
                    <div className="mb-5">
                        <h1 className="text-xl font-bold text-gray-900">{examResult.item_bank_name}</h1>
                        <p className="text-sm text-gray-500 mt-0.5">เฉลยคำตอบ</p>
                    </div>

                    {/* Score bar */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-5 py-4 mb-5">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            {/* Stats */}
                            <div className="flex items-center gap-5">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-gray-800">{examResult.total_questions}</p>
                                    <p className="text-xs text-gray-400">ทั้งหมด</p>
                                </div>
                                <div className="w-px h-10 bg-gray-100" />
                                <div className="text-center">
                                    <p className="text-2xl font-black text-green-600">{examResult.correct_count}</p>
                                    <p className="text-xs text-green-500">ถูก</p>
                                </div>
                                <div className="w-px h-10 bg-gray-100" />
                                <div className="text-center">
                                    <p className="text-2xl font-black text-red-500">{wrong}</p>
                                    <p className="text-xs text-red-400">ผิด</p>
                                </div>
                                <div className="w-px h-10 bg-gray-100" />
                                <div className="text-center">
                                    <p className={`text-2xl font-black ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-500' : 'text-red-500'}`}>{pct}%</p>
                                    <p className="text-xs text-gray-400">คะแนน</p>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-2 flex-wrap">
                                {/* Expand/Collapse all */}
                                <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-0.5">
                                    <button
                                        onClick={() => setCollapsedGroups(new Set())}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-white hover:shadow-sm transition-all"
                                    >
                                        <ChevronsUpDown className="w-3 h-3" /> เปิดทั้งหมด
                                    </button>
                                    <button
                                        onClick={() => setCollapsedGroups(new Set(groups.map((_, i) => i)))}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-white hover:shadow-sm transition-all"
                                    >
                                        <ChevronsDownUp className="w-3 h-3" /> ยุบทั้งหมด
                                    </button>
                                </div>

                                {/* Toggle answers */}
                                <button
                                    onClick={() => setShowAnswers(v => !v)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${showAnswers
                                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                                >
                                    {showAnswers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                    {showAnswers ? 'ซ่อนเฉลย' : 'แสดงเฉลย'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Question Groups */}
                    <div className="space-y-5">
                        {groups.map((group, gIdx) => {
                            const correctInGroup = group.questions.filter(q => q.q.is_correct).length;
                            const isCollapsed = collapsedGroups.has(gIdx);
                            const hasSituation = !!group.situation;

                            return (
                                <div key={gIdx} id={`group-${gIdx}`} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-24">
                                    {/* Group header */}
                                    <button
                                        onClick={() => toggleCollapse(gIdx)}
                                        className="w-full flex items-center justify-between px-5 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors text-left"
                                    >
                                        <div className="flex items-center gap-3">
                                            {hasSituation
                                                ? <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                                    <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                                                </div>
                                                : <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                    <List className="w-3.5 h-3.5 text-gray-500" />
                                                </div>
                                            }
                                            <div>
                                                <p className="text-sm font-semibold text-gray-800">
                                                    {hasSituation ? `สถานการณ์ที่ ${gIdx + 1}` : 'คำถามทั่วไป'}
                                                </p>
                                                <p className="text-xs text-gray-400">{group.questions.length} ข้อ</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* Score pill */}
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-xs font-bold text-green-600">{correctInGroup}</span>
                                                <span className="text-xs text-gray-300">/</span>
                                                <span className="text-xs text-gray-400">{group.questions.length}</span>
                                            </div>
                                            {isCollapsed
                                                ? <ChevronDown className="w-4 h-4 text-gray-400" />
                                                : <ChevronUp className="w-4 h-4 text-gray-400" />}
                                        </div>
                                    </button>

                                    {!isCollapsed && (
                                        <div className="p-5 space-y-5 bg-gray-50">
                                            {/* Situation detail */}
                                            {group.situation && (
                                                <div className="bg-white rounded-lg border border-blue-100 p-4 relative overflow-hidden">
                                                    <div className="absolute left-0 top-0 w-1 h-full bg-blue-500 rounded-l-lg" />
                                                    <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-3 ml-1">สถานการณ์</p>
                                                    {group.situation.situation_title && (
                                                        <p className="font-semibold text-gray-800 mb-2 ml-1" dangerouslySetInnerHTML={{ __html: group.situation.situation_title }} />
                                                    )}
                                                    <p className="text-sm text-gray-700 leading-relaxed ml-1" dangerouslySetInnerHTML={{ __html: group.situation.situation_text }} />
                                                    {group.situation.situation_image_url && (
                                                        <img
                                                            src={group.situation.situation_image_url}
                                                            alt="สถานการณ์"
                                                            className="mt-4 rounded-lg border border-gray-100 max-h-72 object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                                                            onClick={() => setPreviewImage(group.situation!.situation_image_url!)}
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {/* Questions */}
                                            <div className="space-y-4">
                                                {group.questions.map(({ q, idx }) => (
                                                    <QuestionCard
                                                        key={idx}
                                                        question={q}
                                                        index={idx}
                                                        showAnswers={showAnswers}
                                                        onShowStats={fetchStats}
                                                        setPreviewImage={setPreviewImage}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Back */}
                    <div className="mt-8 flex justify-center">
                        <Link
                            href={`/user/examset/take-exam/summarize-exam?session_id=${sessionId}`}
                            className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl text-sm transition-colors shadow-sm"
                        >
                            กลับไปหน้าสรุปผล
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Floating TOC ── */}
            <div className="fixed right-4 top-24 z-40 hidden lg:flex flex-col items-end gap-2">
                <button
                    onClick={() => setShowTOC(v => !v)}
                    className="bg-white p-2.5 rounded-full shadow-lg border border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-200 transition-all active:scale-95"
                    title={showTOC ? 'ซ่อนสารบัญ' : 'แสดงสารบัญ'}
                >
                    {showTOC ? <ChevronRight className="w-4 h-4" /> : <List className="w-4 h-4" />}
                </button>

                {showTOC && (
                    <div className="bg-white rounded-xl shadow-xl border border-gray-100 w-60 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                            <List className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-xs font-semibold text-gray-700">สารบัญ</span>
                        </div>
                        <div className="max-h-[55vh] overflow-y-auto p-2 space-y-0.5">
                            {groups.map((group, gIdx) => {
                                const correct = group.questions.filter(q => q.q.is_correct).length;
                                const isOpen = tocExpanded.has(gIdx);
                                const label = group.situation ? `สถานการณ์ ${gIdx + 1}` : 'คำถามทั่วไป';

                                return (
                                    <div key={gIdx}>
                                        <div className="flex items-center rounded-lg">
                                            <button onClick={() => toggleToc(gIdx)} className="p-2 text-gray-300 hover:text-gray-600 transition-colors">
                                                {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                            </button>
                                            <button
                                                onClick={() => scrollToEl(`group-${gIdx}`)}
                                                className="flex-1 text-left py-2 text-xs font-medium text-gray-700 hover:text-green-700 transition-colors flex items-center justify-between"
                                            >
                                                <span className="truncate">{label}</span>
                                                <span className="ml-2 text-[10px] text-gray-400 shrink-0">{correct}/{group.questions.length}</span>
                                            </button>
                                        </div>

                                        {isOpen && (
                                            <div className="ml-7 mb-1 space-y-0.5 border-l border-gray-100 pl-2">
                                                {group.questions.map(({ q, idx }) => (
                                                    <button
                                                        key={idx}
                                                        onClick={() => scrollToEl(`question-${idx}`)}
                                                        className={`w-full text-left flex items-center gap-1.5 py-1 px-1 rounded text-[10px] transition-colors ${q.is_correct ? 'text-green-600 hover:bg-green-50' : 'text-red-500 hover:bg-red-50'}`}
                                                    >
                                                        {q.is_correct
                                                            ? <CheckCircle2 className="w-3 h-3 shrink-0" />
                                                            : <XCircle className="w-3 h-3 shrink-0" />}
                                                        <span className="truncate">ข้อ {idx + 1}</span>
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

            {/* ── Stats Modal ── */}
            {statsModal.open && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setStatsModal({ open: false, data: null })}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <BarChart2 className="w-4 h-4 text-gray-500" />
                                <h3 className="text-sm font-semibold text-gray-800">สถิติการตอบข้อนี้</h3>
                            </div>
                            <button onClick={() => setStatsModal({ open: false, data: null })} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-5">
                            {loadingStats ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : statsModal.data ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                                            <p className="text-xl font-black text-gray-800">{statsModal.data.total_attempts}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">ครั้งทั้งหมด</p>
                                        </div>
                                        <div className="bg-green-50 rounded-xl p-3 text-center border border-green-100">
                                            <p className="text-xl font-black text-green-600">{statsModal.data.total_correct}</p>
                                            <p className="text-xs text-green-500 mt-0.5">ตอบถูก</p>
                                        </div>
                                        <div className="bg-red-50 rounded-xl p-3 text-center border border-red-100">
                                            <p className="text-xl font-black text-red-500">{statsModal.data.total_incorrect}</p>
                                            <p className="text-xs text-red-400 mt-0.5">ตอบผิด</p>
                                        </div>
                                    </div>

                                    {/* Accuracy bar */}
                                    {statsModal.data.total_attempts > 0 && (() => {
                                        const acc = Math.round((statsModal.data!.total_correct / statsModal.data!.total_attempts) * 100);
                                        const barColor = acc >= 70 ? '#22c55e' : acc >= 50 ? '#eab308' : '#ef4444';
                                        return (
                                            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                                                <div className="flex justify-between text-xs mb-2">
                                                    <span className="text-gray-500">ความแม่นยำ</span>
                                                    <span className="font-bold" style={{ color: barColor }}>{acc}%</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div className="h-2 rounded-full transition-all" style={{ width: `${acc}%`, backgroundColor: barColor }} />
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Streak */}
                                    <div className="flex items-center justify-between bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4 text-orange-500" />
                                            <span className="text-sm text-orange-700 font-medium">ถูกติดกัน</span>
                                        </div>
                                        <span className="text-xl font-black text-orange-600">{statsModal.data.correct_streak}</span>
                                    </div>

                                    {/* Last attempt */}
                                    <div className="flex items-center gap-2 text-xs text-gray-400">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>ทำล่าสุด {new Date(statsModal.data.last_answered_at).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <AlertCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                                    <p className="text-sm text-gray-500">ยังไม่มีสถิติ</p>
                                    <p className="text-xs text-gray-400 mt-1">นี่เป็นครั้งแรกที่ทำข้อนี้</p>
                                </div>
                            )}
                        </div>

                        <div className="px-5 pb-5">
                            <button
                                onClick={() => setStatsModal({ open: false, data: null })}
                                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm font-medium rounded-xl transition-colors"
                            >
                                ปิด
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Preview */}
            {previewImage && (
                <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
                    <div className="relative max-w-5xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setPreviewImage(null)} className="absolute top-3 right-3 bg-black/60 hover:bg-black/80 text-white p-1.5 rounded-full transition-colors z-10">
                            <X className="w-4 h-4" />
                        </button>
                        <img src={previewImage} alt="preview" className="max-w-full max-h-[85vh] object-contain rounded-lg" />
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}

export default function AnswerPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-7 h-7 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
        }>
            <AnswerPageContent />
        </Suspense>
    );
}