"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
    CheckCircle2, XCircle, BookOpen, ChevronRight, AlertCircle,
    BarChart2, X, List, ChevronsUpDown, ChevronsDownUp,
    TrendingUp, ChevronDown, ChevronUp, Clock, ArrowLeft, RefreshCw
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import ImagePreviewModal from "@/components/ImagePreviewModal";

// ─── Types ───────────────────────────────────────────────────────────────────
interface AnswerOption {
    option_id: number;
    option_text: string;
    is_correct: boolean;
    option_image_url?: string;
}

interface Situation {
    situation_id?: number;
    situation_title?: string;
    situation_text: string;
    situation_image_url?: string;
}

interface QuestionResponse {
    item_id: number;
    question_text: string;
    explanation?: string;
    selected_option_id: number | null;
    is_correct: boolean;
    response_time_ms?: number;
    answer_options: AnswerOption[];
    situation?: Situation;
    question_image_url?: string;
    irt_a?: number | null;
    irt_b?: number | null;
    irt_c?: number | null;
    theta_after?: number;
    se_after?: number;
}

interface CatExamResult {
    session_id: number;
    item_bank_name?: string;
    status: string;
    start_time: string;
    end_time?: string;
    num_items: number;
    num_correct: number;
    final_theta: number;
    final_se: number;
    passed: boolean;
    stop_reason?: string;
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
const LABELS = ["ก", "ข", "ค", "ง", "จ", "ฉ", "ช", "ซ"];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function scrollToEl(id: string) {
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 88;
    window.scrollTo({ top, behavior: "smooth" });
}

// ─── QuestionCard ─────────────────────────────────────────────────────────────
function QuestionCard({
    question,
    index,
    onShowStats,
    setPreviewImage,
}: {
    question: QuestionResponse;
    index: number;
    onShowStats: (itemId: number) => void;
    setPreviewImage: (url: string) => void;
}) {
    const correct = question.is_correct;

    return (
        <div id={`question-${index}`} className="scroll-mt-24 bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
            {/* Header */}
            <div className={`flex items-center justify-between px-5 py-3.5 border-b ${correct ? "bg-green-50/70 border-green-100" : "bg-rose-50/70 border-rose-100"}`}>
                <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center font-medium text-xs sm:text-sm px-2.5 py-0.5 rounded-lg bg-white border border-gray-200/80 text-gray-800 shadow-2xs">
                        ข้อ {index + 1}
                    </span>
                    {correct ? (
                        <span className="text-xs sm:text-sm font-semibold text-green-700 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-green-600" /> ตอบถูกต้อง
                        </span>
                    ) : (
                        <span className="text-xs sm:text-sm font-semibold text-rose-600 flex items-center gap-1.5">
                            <XCircle className="w-4 h-4 text-rose-500" /> ตอบไม่ถูกต้อง
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {question.irt_b != null && (
                        <span className="hidden sm:inline-flex text-[11px] px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-100 font-medium">
                            ความยาก (b): {question.irt_b.toFixed(2)}
                        </span>
                    )}
                    <button
                        onClick={() => onShowStats(question.item_id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-gray-900 bg-white/80 hover:bg-white border border-gray-200/80 transition-all cursor-pointer shadow-2xs"
                    >
                        <BarChart2 className="w-3.5 h-3.5 text-gray-500" />
                        สถิติ
                    </button>
                </div>
            </div>

            <div className="p-5 space-y-5">
                {/* Question text */}
                <div
                    className="text-gray-900 text-md sm:text-base leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: question.question_text }}
                />
                {question.question_image_url && (
                    <img
                        src={question.question_image_url.startsWith("http")
                            ? question.question_image_url
                            : `${API_URL}${question.question_image_url}`}
                        alt="คำถาม"
                        className="max-h-64 rounded-xl border border-gray-200 object-contain cursor-zoom-in hover:opacity-90 transition-opacity bg-white"
                        onClick={() => {
                            const url = question.question_image_url!;
                            setPreviewImage(url.startsWith("http") ? url : `${API_URL}${url}`);
                        }}
                    />
                )}

                {/* Options */}
                <div className="space-y-2.5">
                    {(question.answer_options || []).map((opt, oIdx) => {
                        const isSelected = question.selected_option_id != null &&
                            String(opt.option_id) === String(question.selected_option_id);
                        const isCorrect = opt.is_correct;

                        let borderClass = "border-gray-100 bg-gray-50/50";
                        let labelClass = "bg-gray-100 text-gray-600 font-semibold";
                        let textClass = "text-gray-700";
                        let badge = null;
                        let trailingIcon = null;

                        if (isSelected && isCorrect) {
                            borderClass = "border-green-400 bg-green-50/60 shadow-2xs";
                            labelClass = "bg-green-600 text-white font-medium";
                            textClass = "text-green-950 font-semibold";
                            trailingIcon = <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />;
                            badge = (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-green-100 text-green-800 border border-green-200">
                                    คำตอบของคุณ (ถูกต้อง)
                                </span>
                            );
                        } else if (isSelected && !isCorrect) {
                            borderClass = "border-rose-300 bg-rose-50/60 shadow-2xs";
                            labelClass = "bg-rose-500 text-white font-medium";
                            textClass = "text-rose-950 font-semibold";
                            trailingIcon = <XCircle className="w-4 h-4 text-rose-500 shrink-0" />;
                            badge = (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 border border-rose-200">
                                    คำตอบของคุณ
                                </span>
                            );
                        } else if (isCorrect) {
                            borderClass = "border-green-300 bg-green-50/40";
                            labelClass = "bg-green-100 text-green-800 font-medium border border-green-300";
                            textClass = "text-green-900 font-medium";
                            trailingIcon = <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />;
                            badge = (
                                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-green-100 text-green-800 border border-green-200">
                                    คำตอบที่ถูกต้อง
                                </span>
                            );
                        }

                        return (
                            <div key={oIdx} className={`flex items-start gap-3 p-3.5 rounded-xl border transition-all ${borderClass}`}>
                                <span className={`text-xs px-2.5 py-1 rounded-lg shrink-0 mt-0.5 ${labelClass}`}>
                                    {LABELS[oIdx] || String.fromCharCode(65 + oIdx)}
                                </span>
                                <div className="flex-1 min-w-0">
                                    {opt.option_text?.replace(/<[^>]*>/g, "").trim() && (
                                        <div className={`text-sm lg:text-[15px] leading-relaxed ${textClass}`} dangerouslySetInnerHTML={{ __html: opt.option_text }} />
                                    )}
                                    {opt.option_image_url?.trim() && (
                                        <img
                                            src={opt.option_image_url.startsWith("http") ? opt.option_image_url : `${API_URL}${opt.option_image_url}`}
                                            alt={`ตัวเลือก ${LABELS[oIdx]}`}
                                            className="mt-2 max-h-36 rounded-lg border border-gray-200 bg-white object-contain cursor-zoom-in hover:opacity-90 transition-opacity"
                                            onClick={e => {
                                                e.stopPropagation();
                                                const url = opt.option_image_url!;
                                                setPreviewImage(url.startsWith("http") ? url : `${API_URL}${url}`);
                                            }}
                                        />
                                    )}
                                    {badge && <div className="mt-2">{badge}</div>}
                                </div>
                                {trailingIcon}
                            </div>
                        );
                    })}
                </div>

                {/* Explanation */}
                {question.explanation && (
                    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-4">
                        <p className="text-xs font-medium text-blue-800 mb-2 flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                            คำอธิบายเฉลย
                        </p>
                        <div
                            className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap"
                            dangerouslySetInnerHTML={{ __html: question.explanation }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CatAnswerPage() {
    const params = useParams();
    const sessionId = params?.session_id as string;
    const { getToken } = useAuth();

    const [examResult, setExamResult] = useState<CatExamResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showTOC, setShowTOC] = useState(true);
    const [collapsedGroups, setCollapsedGroups] = useState<Set<number>>(new Set());
    const [tocExpanded, setTocExpanded] = useState<Set<number>>(new Set([0]));
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [statsModal, setStatsModal] = useState<{ open: boolean; data: MasteryData | null }>({ open: false, data: null });
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        if (sessionId) {
            fetchCatResult();
        } else {
            setError("ไม่พบรหัส session");
            setLoading(false);
        }
    }, [sessionId]);

    const fetchCatResult = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/cat/session/${sessionId}/result`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                setExamResult(data);
            } else {
                throw new Error("Failed to load result");
            }
        } catch {
            setError("เกิดข้อผิดพลาดในการโหลดเฉลยคำตอบ");
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
            const sitText = q.situation?.situation_text;
            const existing = groups.find(g => g.situation?.situation_text === sitText && sitText !== undefined);
            if (existing && sitText) {
                existing.questions.push({ q, idx });
            } else {
                groups.push({ situation: q.situation || null, questions: [{ q, idx }] });
            }
        });
        return groups;
    };

    const toggleCollapse = (idx: number) =>
        setCollapsedGroups(prev => {
            const s = new Set(prev);
            s.has(idx) ? s.delete(idx) : s.add(idx);
            return s;
        });

    const toggleToc = (idx: number) =>
        setTocExpanded(prev => {
            const s = new Set(prev);
            s.has(idx) ? s.delete(idx) : s.add(idx);
            return s;
        });

    // ── Loading ──
    if (loading) {
        return (
            <>
                <Navbar_user />
                <div className="min-h-[60vh] flex items-center justify-center">
                    <LoadingSpinner size="lg" text="กำลังโหลดเฉลยข้อสอบ CAT..." />
                </div>
                <Footer />
            </>
        );
    }

    // ── Error ──
    if (error || !examResult) {
        return (
            <>
                <Navbar_user />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center max-w-sm">
                        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                        <h2 className="text-lg font-semibold text-gray-800 mb-2">ไม่พบข้อมูลเฉลย</h2>
                        <p className="text-gray-500 text-sm mb-6">{error}</p>
                        <Link href="/user/cat-exam" className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors">
                            กลับไปหน้าสอบ CAT
                        </Link>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const groups = groupBySituation();
    const wrong = examResult.num_items - examResult.num_correct;
    const accuracy = Math.round((examResult.num_correct / (examResult.num_items || 1)) * 100);

    return (
        <>
            <Navbar_user />
            <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">

                    {/* Breadcrumb */}
                    <div className="flex items-center text-sm text-gray-500 mb-5">
                        <Link href="/user" className="hover:text-green-600 cursor-pointer transition">หน้าหลัก</Link>
                        <span className="mx-2">›</span>
                        <Link href="/user/cat-exam" className="hover:text-green-600 cursor-pointer transition">สอบแบบปรับตัว (CAT)</Link>
                        <span className="mx-2">›</span>
                        <Link href={`/user/cat-exam/result/${sessionId}`} className="hover:text-green-600 cursor-pointer transition">สรุปผลสอบ</Link>
                        <span className="mx-2">›</span>
                        <span className="text-gray-600 font-medium">เฉลยคำตอบ</span>
                    </div>

                    {/* Page title */}
                    <div className="mb-6">
                        <h1 className="text-3xl font-medium text-[#1C2033]">
                            {examResult.item_bank_name || "การสอบแบบปรับตัว (CAT)"}
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">เฉลยคำตอบและคำอธิบายโดยละเอียดของระบบ Computerized Adaptive Testing</p>
                    </div>

                    {/* Score bar */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            {/* Stats */}
                            <div className="flex items-center gap-5 sm:gap-6 flex-wrap">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-gray-800">{examResult.num_items}</p>
                                    <p className="text-xs font-medium text-gray-400 mt-0.5">ข้อที่ทำ</p>
                                </div>
                                <div className="w-px h-8 bg-gray-100 hidden sm:block" />
                                <div className="text-center">
                                    <p className="text-2xl font-black text-green-600">{examResult.num_correct}</p>
                                    <p className="text-xs font-medium text-green-600 mt-0.5">ตอบถูก</p>
                                </div>
                                <div className="w-px h-8 bg-gray-100 hidden sm:block" />
                                <div className="text-center">
                                    <p className="text-2xl font-black text-rose-500">{wrong}</p>
                                    <p className="text-xs font-medium text-rose-500 mt-0.5">ตอบผิด</p>
                                </div>
                                <div className="w-px h-8 bg-gray-100 hidden sm:block" />
                                <div className="text-center">
                                    <p className="text-2xl font-black text-purple-600">θ {examResult.final_theta.toFixed(2)}</p>
                                    <p className="text-xs font-medium text-purple-600 mt-0.5">ความสามารถ</p>
                                </div>
                                <div className="w-px h-8 bg-gray-100 hidden sm:block" />
                                <div className="text-center">
                                    <p className={`text-2xl font-black ${accuracy >= 70 ? "text-green-600" : accuracy >= 50 ? "text-amber-500" : "text-rose-500"}`}>{accuracy}%</p>
                                    <p className="text-xs font-medium text-gray-400 mt-0.5">ความแม่นยำ</p>
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center bg-gray-100/80 rounded-xl p-1 gap-1">
                                    <button
                                        onClick={() => setCollapsedGroups(new Set())}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-2xs transition-all cursor-pointer"
                                    >
                                        <ChevronsUpDown className="w-3.5 h-3.5" /> เปิดทั้งหมด
                                    </button>
                                    <button
                                        onClick={() => setCollapsedGroups(new Set(groups.map((_, i) => i)))}
                                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-2xs transition-all cursor-pointer"
                                    >
                                        <ChevronsDownUp className="w-3.5 h-3.5" /> ยุบทั้งหมด
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Question Groups */}
                    <div className="space-y-6">
                        {groups.map((group, gIdx) => {
                            const correctInGroup = group.questions.filter(q => q.q.is_correct).length;
                            const isCollapsed = collapsedGroups.has(gIdx);
                            const hasSituation = !!group.situation;

                            return (
                                <div key={gIdx} id={`group-${gIdx}`} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden scroll-mt-24">
                                    {/* Group header */}
                                    <button
                                        onClick={() => toggleCollapse(gIdx)}
                                        className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50/80 transition-colors text-left cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            {hasSituation
                                                ? <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                                                    <BookOpen className="w-4 h-4" />
                                                </div>
                                                : <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
                                                    <List className="w-4 h-4" />
                                                </div>
                                            }
                                            <div>
                                                <p className="text-base font-semibold text-gray-800">
                                                    {hasSituation ? (group.situation?.situation_title || `สถานการณ์ที่ ${gIdx + 1}`) : "คำถามข้อสอบ CAT"}
                                                </p>
                                                <p className="text-sm text-gray-500 mt-0.5">{group.questions.length} ข้อ</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {/* Score pill */}
                                            <span className="text-md px-2.5 py-1 rounded-full bg-gray-100 text-gray-600">
                                                ถูก {correctInGroup}/{group.questions.length}
                                            </span>
                                            <div className="p-1 text-gray-400 hover:text-gray-600">
                                                {isCollapsed
                                                    ? <ChevronDown className="w-4 h-4" />
                                                    : <ChevronUp className="w-4 h-4" />}
                                            </div>
                                        </div>
                                    </button>

                                    {!isCollapsed && (
                                        <div className="p-5 pt-2 space-y-5 border-t border-gray-100 bg-gray-50/40">
                                            {/* Situation detail */}
                                            {group.situation && (
                                                <div className="my-1 bg-blue-50/40 rounded-xl border border-blue-200/80 p-5 mb-5">
                                                    <div className="flex items-center gap-2 mb-2.5">
                                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                                        <span className="text-sm font-medium text-blue-800">สถานการณ์</span>
                                                    </div>
                                                    {group.situation.situation_title && (
                                                        <p className="font-medium text-gray-900 mb-2 text-base" dangerouslySetInnerHTML={{ __html: group.situation.situation_title }} />
                                                    )}
                                                    <p className="text-sm lg:text-[15px] text-gray-700 leading-relaxed whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: group.situation.situation_text }} />
                                                    {group.situation.situation_image_url && (
                                                        <img
                                                            src={group.situation.situation_image_url}
                                                            alt="สถานการณ์"
                                                            className="mt-4 rounded-xl border border-blue-100 max-h-72 object-contain bg-white cursor-zoom-in hover:opacity-90 transition-opacity"
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

                    {/* Bottom actions */}
                    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href={`/user/cat-exam/result/${sessionId}`}
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl text-sm transition-all shadow-xs"
                        >
                            <ArrowLeft className="w-4 h-4" /> กลับไปหน้าสรุปผล
                        </Link>
                        <Link
                            href="/user/cat-exam"
                            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl text-sm transition-all shadow-2xs"
                        >
                            <RefreshCw className="w-4 h-4" /> สอบ CAT ใหม่อีกครั้ง
                        </Link>
                        <Link
                            href="/user"
                            className="px-6 py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-medium rounded-xl text-sm transition-all shadow-2xs"
                        >
                            หน้าหลัก
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Floating TOC ── */}
            <div className="fixed right-4 top-24 z-40 hidden lg:flex flex-col items-end gap-2">
                <button
                    onClick={() => setShowTOC(v => !v)}
                    className="bg-white p-2.5 rounded-full shadow-lg border border-gray-200 text-gray-500 hover:text-green-600 hover:border-green-200 transition-all active:scale-95 cursor-pointer"
                    title={showTOC ? "ซ่อนสารบัญ" : "แสดงสารบัญ"}
                >
                    {showTOC ? <ChevronRight className="w-4 h-4" /> : <List className="w-4 h-4" />}
                </button>

                {showTOC && (
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 w-64 overflow-hidden">
                        <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                            <List className="w-3.5 h-3.5 text-gray-400" />
                            <span className="text-sm font-semibold text-gray-700">สารบัญข้อสอบ CAT</span>
                        </div>
                        <div className="max-h-[55vh] overflow-y-auto p-2 space-y-0.5">
                            {groups.map((group, gIdx) => {
                                const correct = group.questions.filter(q => q.q.is_correct).length;
                                const isOpen = tocExpanded.has(gIdx);
                                const label = group.situation ? `สถานการณ์ ${gIdx + 1}` : "คำถามข้อสอบ";

                                return (
                                    <div key={gIdx}>
                                        <div className="flex items-center rounded-lg hover:bg-gray-50">
                                            <button onClick={() => toggleToc(gIdx)} className="p-2 text-gray-300 hover:text-gray-600 transition-colors cursor-pointer">
                                                {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                            </button>
                                            <button
                                                onClick={() => scrollToEl(`group-${gIdx}`)}
                                                className="flex-1 text-left py-2 text-xs font-medium text-gray-700 hover:text-green-700 transition-colors flex items-center justify-between cursor-pointer pr-2"
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
                                                        className={`w-full text-left flex items-center gap-1.5 py-1 px-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${q.is_correct ? "text-green-700 hover:bg-green-50" : "text-rose-600 hover:bg-rose-50"}`}
                                                    >
                                                        {q.is_correct
                                                            ? <CheckCircle2 className="w-3 h-3 shrink-0 text-green-600" />
                                                            : <XCircle className="w-3 h-3 shrink-0 text-rose-500" />}
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
                            <button onClick={() => setStatsModal({ open: false, data: null })} className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                                <X className="w-4 h-4 text-gray-400" />
                            </button>
                        </div>

                        <div className="p-5">
                            {loadingStats ? (
                                <div className="py-8 flex justify-center">
                                    <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : statsModal.data ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-gray-50 rounded-xl p-3 text-center">
                                            <p className="text-xl font-bold text-gray-800">{statsModal.data.total_attempts}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">ทำทั้งหมด (ครั้ง)</p>
                                        </div>
                                        <div className="bg-green-50 rounded-xl p-3 text-center">
                                            <p className="text-xl font-bold text-green-700">{statsModal.data.total_correct}</p>
                                            <p className="text-xs text-green-600 mt-0.5">ตอบถูก (ครั้ง)</p>
                                        </div>
                                        <div className="bg-rose-50 rounded-xl p-3 text-center">
                                            <p className="text-xl font-bold text-rose-600">{statsModal.data.total_incorrect}</p>
                                            <p className="text-xs text-rose-500 mt-0.5">ตอบผิด (ครั้ง)</p>
                                        </div>
                                        <div className="bg-blue-50 rounded-xl p-3 text-center">
                                            <p className="text-xl font-bold text-blue-700">{statsModal.data.correct_streak}</p>
                                            <p className="text-xs text-blue-600 mt-0.5">ตอบถูกต่อเนื่อง</p>
                                        </div>
                                    </div>
                                    {statsModal.data.total_attempts > 0 && (
                                        <div className="bg-gray-50 rounded-xl p-3.5">
                                            <div className="flex justify-between text-xs text-gray-600 mb-1.5">
                                                <span>อัตราตอบถูก</span>
                                                <span className="font-semibold">{Math.round((statsModal.data.total_correct / statsModal.data.total_attempts) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className="bg-green-500 h-2 rounded-full transition-all"
                                                    style={{ width: `${Math.round((statsModal.data.total_correct / statsModal.data.total_attempts) * 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-gray-400">
                                    <TrendingUp className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                    <p className="text-xs">ยังไม่มีสถิติสำหรับข้อนี้</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
            <Footer />
        </>
    );
}
