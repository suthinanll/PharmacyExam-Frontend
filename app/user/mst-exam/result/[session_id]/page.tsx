"use client";

import React, { useState, useEffect } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
    Award,
    AlertTriangle,
    Layers,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowRight,
    TrendingUp,
    BarChart3,
    BookOpen,
    HelpCircle,
    ChevronDown,
    ChevronUp,
    RefreshCw,
    X,
} from "lucide-react";
import Link from "next/link";

interface AnswerOption {
    option_id: number;
    option_text: string;
    is_correct: boolean;
    option_image_url?: string;
}

interface Situation {
    situation_id: number;
    situation_title?: string;
    situation_text: string;
    situation_image_url?: string;
}

interface ResponseItem {
    item_id: number;
    selected_option_id: number;
    is_correct: boolean;
    response_time_ms: number;
    question_text?: string;
    question_image_url?: string;
    explanation?: string;
    situation?: Situation | null;
    answer_options?: AnswerOption[];
    irt_a?: number;
    irt_b?: number;
    irt_c?: number;
}

interface StageResult {
    stage_number: number;
    stage_label: string;
    items: ResponseItem[];
}

interface TopicAnalysis {
    topic_id: number;
    topic_name: string;
    correct: number;
    total: number;
    accuracy: number;
    sub_topics: Array<{
        sub_topic_id: number;
        sub_topic_name: string;
        correct: number;
        total: number;
        accuracy: number;
    }>;
}

interface MSTResultData {
    session_id: number;
    item_bank_name: string;
    status: string;
    start_time: string;
    end_time: string;
    current_theta: number;
    current_se: number;
    final_theta: number;
    final_se: number;
    total_items_answered: number;
    total_correct: number;
    passed: boolean;
    routing_path: string[];
    stop_reason: string;
    stages: StageResult[];
    topic_analysis: TopicAnalysis[];
}

import { api } from "@/utils/api";
import { MSTRoutingPathVisualizer } from "@/components/mst/MSTRoutingPathVisualizer";

export default function MSTResultPage() {
    const params = useParams();
    const router = useRouter();
    const sessionId = params?.session_id as string;

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<MSTResultData | null>(null);

    // Filters for review
    const [selectedStageTab, setSelectedStageTab] = useState<number | "all">("all");
    const [filterCorrectness, setFilterCorrectness] = useState<"all" | "correct" | "incorrect">("all");
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        const fetchResult = async () => {
            if (!sessionId) return;
            setLoading(true);
            try {
                const data = await api.get<MSTResultData>(`/mst/session/${sessionId}/result`);
                setResult(data);
            } catch (error) {
                console.error("Error loading MST result:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchResult();
    }, [sessionId]);

    if (loading || !result) {
        return (
            <>
                <Navbar_user />
                <div className="min-h-screen bg-slate-50 py-12 flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">กำลังประมวลผลและสรุปรายงานคะแนน MST...</p>
                </div>
                <Footer />
            </>
        );
    }

    const accuracyPct =
        result.total_items_answered > 0
            ? Math.round((result.total_correct / result.total_items_answered) * 100)
            : 0;

    // Filter items for display
    const allItemsList = result.stages.flatMap((s) =>
        s.items.map((it) => ({ ...it, stage_number: s.stage_number, stage_label: s.stage_label })),
    );

    const filteredItems = allItemsList.filter((it) => {
        if (selectedStageTab !== "all" && it.stage_number !== selectedStageTab) return false;
        if (filterCorrectness === "correct" && !it.is_correct) return false;
        if (filterCorrectness === "incorrect" && it.is_correct) return false;
        return true;
    });

    return (
        <>
            <Navbar_user />

            <div className="min-h-screen bg-slate-50 py-8">
                <div className="max-w-6xl mx-auto px-4 space-y-8">
                    
                    {/* Breadcrumb */}
                    <div className="flex items-center text-sm text-gray-500">
                        <Link href="/user" className="hover:text-green-600 transition">หน้าหลัก</Link>
                        <span className="mx-2">›</span>
                        <Link href="/user/mst-exam" className="hover:text-green-600 transition">ข้อสอบ MST</Link>
                        <span className="mx-2">›</span>
                        <span className="text-gray-800 font-medium">รายงานผลการสอบ</span>
                    </div>

                    {/* ─── Hero Result Card ─── */}
                    <div className={`rounded-3xl border p-8 sm:p-10 shadow-sm transition-all ${
                        result.passed
                            ? "bg-gradient-to-br from-emerald-50 via-teal-50/60 to-white border-emerald-200"
                            : "bg-gradient-to-br from-rose-50 via-orange-50/60 to-white border-rose-200"
                    }`}>
                        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                                <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                                    result.passed
                                        ? "bg-emerald-600 shadow-emerald-200"
                                        : "bg-rose-600 shadow-rose-200"
                                }`}>
                                    {result.passed ? <Award className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                        ผลการประเมิน Multistage Adaptive Testing (MST)
                                    </span>
                                    <h1 className={`text-2xl sm:text-3xl font-bold ${
                                        result.passed ? "text-emerald-900" : "text-rose-900"
                                    }`}>
                                        {result.passed ? "ผ่านเกณฑ์มาตรฐานการประเมิน 🎉" : "ยังไม่ผ่านเกณฑ์มาตรฐานในรอบนี้ 💪"}
                                    </h1>
                                    <p className="text-sm text-gray-600 max-w-xl">
                                        {result.passed
                                            ? "ระดับความสามารถ (Ability Score) ของคุณผ่านเกณฑ์มาตรฐานการสอบวิชาชีพสภาเภสัชกรรม"
                                            : "ระดับความสามารถของคุณยังไม่ถึงเกณฑ์ขั้นต่ำ แนะนำให้ทบทวนหัวข้อที่มีคะแนนน้อยเพิ่มเติม"}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <Link
                                    href="/user/mst-exam"
                                    className="px-5 py-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 font-bold text-sm text-gray-700 shadow-sm flex items-center gap-2 transition"
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    สอบใหม่อีกครั้ง
                                </Link>
                            </div>
                        </div>

                        {/* Metric Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-8 border-t border-slate-200/60">
                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 text-center shadow-xs">
                                <div className="text-xs font-semibold text-gray-500">ระดับความสามารถ (θ)</div>
                                <div className={`text-2xl font-bold mt-1 ${
                                    result.passed ? "text-emerald-700" : "text-rose-700"
                                }`}>
                                    {result.final_theta?.toFixed(3) ?? "-"}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5">Scale: -4.0 ถึง +4.0</div>
                            </div>

                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 text-center shadow-xs">
                                <div className="text-xs font-semibold text-gray-500">ความแม่นยำรวม</div>
                                <div className="text-2xl font-bold text-indigo-700 mt-1">
                                    {accuracyPct}%
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5">
                                    ถูก {result.total_correct} จาก {result.total_items_answered} ข้อ
                                </div>
                            </div>

                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 text-center shadow-xs">
                                <div className="text-xs font-semibold text-gray-500">ความคลาดเคลื่อน (SE)</div>
                                <div className="text-2xl font-bold text-purple-700 mt-1">
                                    {result.final_se?.toFixed(3) ?? "-"}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5">Standard Error</div>
                            </div>

                            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-200/80 text-center shadow-xs">
                                <div className="text-xs font-semibold text-gray-500">จำนวนด่านที่ทำ</div>
                                <div className="text-2xl font-bold text-slate-800 mt-1">
                                    {result.stages.length} ด่าน
                                </div>
                                <div className="text-[10px] text-gray-400 mt-0.5">{result.stop_reason}</div>
                            </div>
                        </div>
                    </div>

                    {/* ─── Stage Routing Pathway Visualizer ─── */}
                    <div className="space-y-6">
                        <MSTRoutingPathVisualizer
                            routingPath={result.routing_path}
                            totalStages={result.stages.length}
                        />

                        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
                                    <Layers className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                                        รายละเอียดแต่ละด่านการสอบ (Stage Breakdown)
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-500">
                                        แสดงระดับความยากและจำนวนข้อที่ตอบถูกในแต่ละ Stage
                                    </p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                            {result.stages.map((stg, idx) => {
                                const stgCorrect = stg.items.filter((i) => i.is_correct).length;
                                const stgTotal = stg.items.length;
                                const stgPct = stgTotal > 0 ? Math.round((stgCorrect / stgTotal) * 100) : 0;

                                return (
                                    <div
                                        key={stg.stage_number}
                                        className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 relative"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold text-indigo-600 bg-indigo-100/70 px-2.5 py-0.5 rounded-full">
                                                Stage {stg.stage_number}
                                            </span>
                                            <span className="text-xs font-semibold text-gray-500">
                                                {stgCorrect}/{stgTotal} ข้อ
                                            </span>
                                        </div>

                                        <h3 className="font-bold text-gray-900 text-sm">
                                            {stg.stage_label}
                                        </h3>

                                        {/* Stage Progress Bar */}
                                        <div className="space-y-1">
                                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                                                <div
                                                    className="bg-indigo-600 h-2 rounded-full transition-all"
                                                    style={{ width: `${stgPct}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[11px] text-gray-400">
                                                <span>ความแม่นยำในด่านนี้</span>
                                                <span className="font-semibold text-indigo-700">{stgPct}%</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                    {/* ─── Topic Analysis ─── */}
                    {result.topic_analysis && result.topic_analysis.length > 0 && (
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold">
                                    <BarChart3 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-base sm:text-lg font-bold text-gray-900">
                                        วิเคราะห์ผลตามหมวดวิชา (Topic Mastery)
                                    </h2>
                                    <p className="text-xs sm:text-sm text-gray-500">
                                        คะแนนความแม่นยำแยกตามกลุ่มเนื้อหาและหัวข้อย่อย
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                {result.topic_analysis.map((topic) => (
                                    <div
                                        key={topic.topic_id}
                                        className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-bold text-sm text-gray-800">
                                                {topic.topic_name}
                                            </span>
                                            <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">
                                                {topic.correct}/{topic.total} ข้อ ({topic.accuracy}%)
                                            </span>
                                        </div>

                                        {/* Sub-topics list */}
                                        {topic.sub_topics && topic.sub_topics.length > 0 && (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                                                {topic.sub_topics.map((st) => (
                                                    <div
                                                        key={st.sub_topic_id}
                                                        className="text-xs flex items-center justify-between p-2 rounded-lg bg-white border border-slate-100"
                                                    >
                                                        <span className="text-gray-600 line-clamp-1">
                                                            {st.sub_topic_name}
                                                        </span>
                                                        <span className={`font-semibold ${
                                                            st.accuracy >= 70
                                                                ? "text-emerald-600"
                                                                : st.accuracy >= 50
                                                                ? "text-amber-600"
                                                                : "text-rose-600"
                                                        }`}>
                                                            {st.correct}/{st.total} ({st.accuracy}%)
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ─── Detailed Item Review ─── */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                            <div>
                                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                                    เฉลยและทบทวนข้อสอบรายข้อ
                                </h2>
                                <p className="text-xs text-gray-500">
                                    แสดง {filteredItems.length} จาก {allItemsList.length} ข้อ
                                </p>
                            </div>

                            {/* Filter Bar */}
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Stage Selector */}
                                <select
                                    value={selectedStageTab}
                                    onChange={(e) =>
                                        setSelectedStageTab(
                                            e.target.value === "all" ? "all" : Number(e.target.value),
                                        )
                                    }
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-gray-700"
                                >
                                    <option value="all">ทุก Stage</option>
                                    {result.stages.map((s) => (
                                        <option key={s.stage_number} value={s.stage_number}>
                                            Stage {s.stage_number}
                                        </option>
                                    ))}
                                </select>

                                {/* Correctness Selector */}
                                <select
                                    value={filterCorrectness}
                                    onChange={(e) =>
                                        setFilterCorrectness(e.target.value as any)
                                    }
                                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-gray-700"
                                >
                                    <option value="all">ทุกคำตอบ</option>
                                    <option value="correct">เฉพาะข้อที่ถูก</option>
                                    <option value="incorrect">เฉพาะข้อที่ผิด</option>
                                </select>
                            </div>
                        </div>

                        {/* Questions List */}
                        <div className="space-y-6">
                            {filteredItems.map((item, idx) => {
                                return (
                                    <div
                                        key={`${item.item_id}-${idx}`}
                                        className={`rounded-2xl border p-5 sm:p-6 space-y-4 ${
                                            item.is_correct
                                                ? "border-emerald-200 bg-emerald-50/20"
                                                : "border-rose-200 bg-rose-50/20"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-800 text-white">
                                                    {item.stage_label}
                                                </span>
                                                <span className="text-xs font-semibold text-gray-500">
                                                    ข้อสอบ #{item.item_id}
                                                </span>
                                            </div>

                                            <span
                                                className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                                                    item.is_correct
                                                        ? "bg-emerald-100 text-emerald-800"
                                                        : "bg-rose-100 text-rose-800"
                                                }`}
                                            >
                                                {item.is_correct ? (
                                                    <>
                                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                                        ตอบถูกต้อง
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-3.5 h-3.5" />
                                                        ตอบไม่ถูกต้อง
                                                    </>
                                                )}
                                            </span>
                                        </div>

                                        {/* Situation if exists */}
                                        {item.situation && (
                                            <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2 text-xs sm:text-sm">
                                                <div className="font-bold text-blue-900 flex items-center gap-1.5">
                                                    <BookOpen className="w-4 h-4 text-blue-600" />
                                                    สถานการณ์: {item.situation.situation_title || ""}
                                                </div>
                                                <div
                                                    className="text-gray-700 leading-relaxed whitespace-pre-wrap"
                                                    dangerouslySetInnerHTML={{
                                                        __html: item.situation.situation_text,
                                                    }}
                                                />
                                            </div>
                                        )}

                                        {/* Question Text */}
                                        <div
                                            className="font-medium text-sm sm:text-base text-gray-900 leading-relaxed"
                                            dangerouslySetInnerHTML={{
                                                __html: item.question_text || "",
                                            }}
                                        />

                                        {/* Options Breakdown */}
                                        {item.answer_options && (
                                            <div className="space-y-2 pt-2">
                                                {item.answer_options.map((opt, optIdx) => {
                                                    const isUserChoice =
                                                        item.selected_option_id === opt.option_id;
                                                    const isCorrectOpt = opt.is_correct;
                                                    const label =
                                                        ["ก", "ข", "ค", "ง", "จ"][optIdx] ||
                                                        String.fromCharCode(65 + optIdx);

                                                    return (
                                                        <div
                                                            key={opt.option_id}
                                                            className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-3 ${
                                                                isCorrectOpt
                                                                    ? "border-emerald-400 bg-emerald-50 text-emerald-900 font-semibold"
                                                                    : isUserChoice
                                                                    ? "border-rose-400 bg-rose-50 text-rose-900"
                                                                    : "border-slate-200 bg-white text-gray-700"
                                                            }`}
                                                        >
                                                            <span className="font-bold px-2 py-0.5 rounded bg-white/80 border border-slate-200 shrink-0">
                                                                {label}
                                                            </span>
                                                            <div className="flex-1">
                                                                <span
                                                                    dangerouslySetInnerHTML={{
                                                                        __html: opt.option_text,
                                                                    }}
                                                                />
                                                                {isCorrectOpt && (
                                                                    <span className="ml-2 text-xs font-bold text-emerald-700">
                                                                        (คำตอบที่ถูกต้อง)
                                                                    </span>
                                                                )}
                                                                {isUserChoice && !isCorrectOpt && (
                                                                    <span className="ml-2 text-xs font-bold text-rose-700">
                                                                        (คำตอบที่คุณเลือก)
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Explanation */}
                                        {item.explanation && (
                                            <div className="mt-3 p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 text-xs sm:text-sm space-y-1">
                                                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                                                    <HelpCircle className="w-4 h-4 text-amber-600" />
                                                    คำอธิบายเฉลย:
                                                </div>
                                                <div
                                                    className="text-gray-700 leading-relaxed"
                                                    dangerouslySetInnerHTML={{
                                                        __html: item.explanation,
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                </div>
            </div>

            <Footer />
        </>
    );
}
