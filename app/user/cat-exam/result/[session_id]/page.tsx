"use client";

import React, { useState, useEffect } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Area, AreaChart, ReferenceLine,
    ComposedChart,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { CheckCircle2, XCircle, HelpCircle, BookOpen, Info, Award, Target, AlertTriangle, BarChart3, ClipboardList, RefreshCw } from "lucide-react";

// ==================== TYPES ====================
import ImagePreviewModal from '@/components/ImagePreviewModal';
import LoadingSpinner from '@/components/LoadingSpinner';

interface Response {
    item_id: number;
    question_number: number;
    theta_estimate: number;
    sem: number;
    is_correct: boolean;
    theta_before?: number;
    theta_after?: number;
    se_after?: number;
    response_time_ms?: number;
    response_time_seconds?: number;
    selected_option_id: number;
    topic_name: string;
    sub_topic_name: string;
    question_text: string;
    explanation: string;
    situation?: { situation_text: string; situation_image_url?: string };
    answer_options: Array<{ option_id: number; option_text: string; is_correct: boolean; option_image_url?: string }>;
    irt_a: number | null;
    irt_b: number | null;
    irt_c: number | null;
    question_image_url?: string;
}

interface SubTopicStat {
    sub_topic_id: number;
    sub_topic_name: string;
    correct: number;
    total: number;
    accuracy: number;
}

interface TopicStat {
    topic_id: number;
    topic_name: string;
    correct: number;
    total: number;
    accuracy: number;
    sub_topics: SubTopicStat[];
}

interface CATResult {
    session_id: number;
    item_bank_name: string;
    status: string;
    start_time: string;
    end_time: string;
    final_theta: number;
    final_se: number;
    num_items: number;
    num_correct: number;
    passed: boolean;
    stop_reason: string;
    responses: Response[];
    topic_analysis: TopicStat[];
    pass_percentile: number;
}

// ==================== HELPERS ====================
function normalPDF(x: number, mean: number, sd: number): number {
    return Math.exp(-Math.pow(x - mean, 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));
}

const THETA_RANGE = Array.from({ length: 81 }, (_, i) => -4 + i * 0.1);

// ==================== CHART COMPONENTS ====================

/** Chart 1: θ progress + CI band over items */
function ThetaProgressChart({ responses, cutScore }: { responses: Response[]; cutScore: number }) {
    const data = responses.map((r, i) => ({
        item: i + 1,
        theta: r.theta_after != null ? +r.theta_after.toFixed(3) : null,
        ci_low: r.theta_after != null && r.se_after != null ? +(r.theta_after - 1.96 * r.se_after).toFixed(3) : null,
        ci_high: r.theta_after != null && r.se_after != null ? +(r.theta_after + 1.96 * r.se_after).toFixed(3) : null,
        correct: r.is_correct ? 1 : 0,
    }));

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-1">ระดับความสามารถ (θ) ตลอดการสอบ</h2>
            <p className="text-xs text-gray-400 mb-4">เส้นแสดงระดับ θ พร้อมช่วงความเชื่อมั่น 95% ที่แคบลงเมื่อตอบข้อมากขึ้น</p>
            <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="item" label={{ value: "ข้อที่", position: "insideBottom", offset: -10 }} tick={{ fontSize: 11 }} />
                    <YAxis domain={[-4, 4]} label={{ value: "θ", angle: -90, position: "insideLeft", offset: 10 }} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => v?.toFixed(3)} />
                    <ReferenceLine y={cutScore} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "เกณฑ์", fill: "#f59e0b", fontSize: 11 }} />
                    <Area dataKey="ci_high" stroke="none" fill="#3b82f6" fillOpacity={0.12} name="CI Upper" legendType="none" />
                    <Area dataKey="ci_low" stroke="none" fill="#fff" fillOpacity={1} name="CI Lower" legendType="none" />
                    <Line type="monotone" dataKey="theta" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 4, fill: "#2563eb" }} name="θ" />
                    <Line type="monotone" dataKey="ci_high" stroke="#93c5fd" strokeDasharray="3 3" strokeWidth={1} dot={false} name="95% CI" />
                    <Line type="monotone" dataKey="ci_low" stroke="#93c5fd" strokeDasharray="3 3" strokeWidth={1} dot={false} legendType="none" />
                    <Legend verticalAlign="top" height={24} />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
}

/** Chart 2: SE Convergence */
function SEConvergenceChart({ responses, targetSE }: { responses: Response[]; targetSE: number }) {
    const data = responses.map((r, i) => ({
        item: i + 1,
        se: r.se_after != null ? +r.se_after.toFixed(3) : null,
    }));
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-1">ความแม่นยำของการวัด (SE)</h2>
            <p className="text-xs text-gray-400 mb-4">ค่าความคลาดเคลื่อนมาตรฐานลดลงเรื่อยๆ — ยิ่งต่ำยิ่งแม่นยำ</p>
            <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="item" label={{ value: "ข้อที่", position: "insideBottom", offset: -10 }} tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 1.5]} label={{ value: "SE", angle: -90, position: "insideLeft", offset: 10 }} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => v?.toFixed(3)} />
                    <ReferenceLine y={targetSE} stroke="#22c55e" strokeDasharray="4 4"
                        label={{ value: `เกณฑ์ (${targetSE})`, fill: "#16a34a", fontSize: 11, position: "right" }} />
                    <Line type="monotone" dataKey="se" stroke="#8b5cf6" strokeWidth={2.5}
                        dot={{ r: 4, fill: "#8b5cf6" }} name="SE(θ)" />
                    <Legend verticalAlign="top" height={24} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

/** Chart 3: Posterior distribution N(θ, SE) */
function PosteriorChart({ finalTheta, finalSE, cutScore }: { finalTheta: number; finalSE: number; cutScore: number }) {
    const data = THETA_RANGE.map(x => ({
        x: +x.toFixed(1),
        y: +normalPDF(x, finalTheta, finalSE).toFixed(4),
    }));
    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-base font-bold text-gray-800 mb-1">การกระจายความสามารถ</h2>
            <p className="text-xs text-gray-400 mb-4">
                การแจกแจงระดับความสามารถหลังการสอบ — ยิ่งแคบ ยิ่งแม่นยำ (SE = {finalSE.toFixed(3)})
            </p>
            <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="x" label={{ value: "θ", position: "insideBottom", offset: -10 }} tick={{ fontSize: 11 }}
                        tickFormatter={(v) => Number(v) % 1 === 0 ? v : ""} />
                    <YAxis hide />
                    <Tooltip formatter={(v: any) => v?.toFixed(4)} labelFormatter={(l) => `θ = ${l}`} />
                    <ReferenceLine x={cutScore.toFixed(1)} stroke="#f59e0b" strokeDasharray="4 4"
                        label={{ value: "เกณฑ์", fill: "#f59e0b", fontSize: 11 }} />
                    <ReferenceLine x={finalTheta.toFixed(1)} stroke="#2563eb" strokeWidth={2}
                        label={{ value: `θ=${finalTheta.toFixed(2)}`, fill: "#2563eb", fontSize: 11, position: "top" }} />
                    <Area type="monotone" dataKey="y" stroke="#3b82f6" fill="#bfdbfe" fillOpacity={0.8} name="P(θ|data)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

/** Topic Analysis Section */
function TopicAnalysisSection({ topicAnalysis }: { topicAnalysis: TopicStat[] }) {
    if (!topicAnalysis || topicAnalysis.length === 0) return null;

    const radarData = topicAnalysis.map(t => ({
        subject: t.topic_name.length > 15 ? t.topic_name.substring(0, 15) + '...' : t.topic_name,
        fullName: t.topic_name,
        Performance: t.accuracy,
        fullMark: 100,
    }));

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
            <h2 className="text-base font-bold text-gray-800 mb-1">วิเคราะห์ตามหัวข้อ</h2>
            <p className="text-xs text-gray-400 mb-5">เปอร์เซ็นต์ความถูกต้องในแต่ละหัวข้อหลักและหัวข้อย่อย</p>

            <div className="flex flex-col lg:flex-row gap-8 items-stretch mb-2">
                {/* Radar Chart */}
                <div className="w-full lg:w-1/2 h-[350px] flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="#e5e7eb" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                            <Tooltip
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const d = payload[0].payload;
                                        return (
                                            <div className="bg-white p-3 shadow-xl border border-gray-100 rounded-xl">
                                                <p className="font-bold text-gray-800 mb-1">{d.fullName}</p>
                                                <p className="text-blue-600 font-bold">ความแม่นยำ: {d.Performance}%</p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Radar
                                name="Performance"
                                dataKey="Performance"
                                stroke="#22c55e"
                                fill="#22c55e"
                                fillOpacity={0.35}
                                dot={{ r: 4, fill: '#22c55e' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Score List (Unified nested cards) */}
                <div className="w-full lg:w-1/2 flex flex-col">
                    <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">คะแนนรายหัวข้อ</h3>
                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {topicAnalysis.map(topic => (
                            <div key={topic.topic_id} className="p-3.5 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/50 transition-colors space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                        topic.accuracy >= 70 ? 'bg-green-100 text-green-700' :
                                        topic.accuracy >= 50 ? 'bg-amber-100 text-amber-700' :
                                        'bg-red-100 text-red-600'
                                    }`}>
                                        {topic.accuracy >= 70 ? <Award className="w-5 h-5" /> : topic.accuracy >= 50 ? <Target className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-800 text-sm truncate">{topic.topic_name}</p>
                                        <p className="text-xs text-gray-500">{topic.correct}/{topic.total} ข้อ</p>
                                    </div>
                                    <span className={`font-bold text-sm ${
                                        topic.accuracy >= 70 ? 'text-green-600' :
                                        topic.accuracy >= 50 ? 'text-amber-500' : 'text-red-500'
                                    }`}>{topic.accuracy}%</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-100 rounded-full h-1">
                                    <div
                                        className={`h-1 rounded-full ${
                                            topic.accuracy >= 70 ? 'bg-green-500' :
                                            topic.accuracy >= 50 ? 'bg-amber-400' : 'bg-red-400'
                                        }`}
                                        style={{ width: `${topic.accuracy}%` }}
                                    />
                                </div>

                                {/* Subtopics */}
                                {topic.sub_topics && topic.sub_topics.length > 0 && (
                                    <div className="pt-2 border-t border-gray-50">
                                        <div className="flex flex-wrap gap-1.5">
                                            {topic.sub_topics.map(st => (
                                                <div
                                                    key={st.sub_topic_id}
                                                    className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${
                                                        st.accuracy >= 70
                                                            ? 'bg-green-50 border-green-200 text-green-700'
                                                            : st.accuracy >= 50
                                                            ? 'bg-amber-50 border-amber-200 text-amber-700'
                                                            : 'bg-red-50 border-red-200 text-red-600'
                                                    }`}
                                                >
                                                    <span className="font-medium">{st.sub_topic_name}</span>
                                                    <span className="opacity-60">({st.correct}/{st.total})</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ==================== MAIN COMPONENT ====================
export default function CATResultPage() {
    const params = useParams();
    const router = useRouter();
    const { getToken } = useAuth();
    const sessionId = params?.session_id as string;

    const [loading, setLoading] = useState(true);
    const [result, setResult] = useState<CATResult | null>(null);
    const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    useEffect(() => {
        if (sessionId) fetchResult();

        // Prevent going back to exam page
        window.history.pushState(null, "", window.location.href);
        const handlePopState = () => {
            router.replace("/user/cat-exam");
        };
        window.addEventListener("popstate", handlePopState);

        return () => {
            window.removeEventListener("popstate", handlePopState);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionId]);

    async function fetchResult() {
        try {
            setLoading(true);
            const token = getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cat/session/${sessionId}/result`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to fetch result");
            setResult(await res.json());
        } catch {
            alert("ไม่สามารถโหลดผลการสอบได้");
            router.push("/user");
        } finally {
            setLoading(false);
        }
    }

    const toggleItem = (i: number) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            next.has(i) ? next.delete(i) : next.add(i);
            return next;
        });
    };

    if (loading) {
        return (
            <>
                <Navbar_user />
                <div className="min-h-[60vh] flex items-center justify-center">
                    <LoadingSpinner size="lg" text="กำลังโหลดผลการสอบ CAT..." />
                </div>
                <Footer />
            </>
        );
    }

    if (!result) return null;

    const examDuration = result.end_time
        ? Math.floor((new Date(result.end_time).getTime() - new Date(result.start_time).getTime()) / 1000)
        : 0;
    const mins = Math.floor(examDuration / 60);
    const secs = examDuration % 60;
    const accuracy = result.num_items > 0 ? ((result.num_correct / result.num_items) * 100).toFixed(1) : "0.0";

    const TARGET_SE = 0.35;
    const CUT_SCORE = 0.0;

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar_user />

            <div className="container mx-auto px-4 py-8 max-w-5xl">

                {/* ── Breadcrumb ───────────────────────────────── */}
                <div className="flex items-center text-sm text-gray-500 mb-6">
                    <button onClick={() => router.push("/user")} className="hover:text-green-600 transition">หน้าหลัก</button>
                    <span className="mx-2">›</span>
                    <button onClick={() => router.push("/user/cat-exam")} className="hover:text-green-600 transition">สอบแบบปรับตัว</button>
                    <span className="mx-2">›</span>
                    <span className="text-gray-700 font-medium">ผลการสอบ</span>
                </div>

                {/* ── Result Header ───────────────────────────────── */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                        {/* Status icon */}
                        <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center ${
                            result.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                        }`}>
                            {result.passed ? <Award className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <h1 className="text-xl font-bold text-gray-900">
                                    {result.passed ? "ยินดีด้วย! คุณผ่านเกณฑ์การสอบ" : "การสอบเสร็จสิ้น"}
                                </h1>
                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                    result.passed
                                        ? "bg-green-100 text-green-700"
                                        : "bg-red-100 text-red-700"
                                }`}>
                                    {result.passed ? "ผ่าน" : "ยังไม่ผ่านเกณฑ์"}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500">{result.item_bank_name || "คลังข้อสอบรวม (Global Pool)"}</p>
                        </div>
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                            { label: "ตอบถูก", value: `${result.num_correct} / ${result.num_items} ข้อ`, color: "text-green-600", bg: "bg-green-50 border-green-100" },
                            { label: "ความแม่นยำ", value: `${accuracy}%`, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
                            { label: "ระดับความสามารถ (θ)", value: result.final_theta.toFixed(2), color: result.passed ? "text-green-600" : "text-rose-600", bg: result.passed ? "bg-green-50 border-green-100" : "bg-rose-50 border-rose-100" },
                            { label: "ความคลาดเคลื่อน (SE)", value: result.final_se.toFixed(3), color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
                        ].map(s => (
                            <div key={s.label} className={`rounded-xl border p-4 text-center ${s.bg}`}>
                                <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
                                <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* ── Analysis Charts ─────────────────────── */}
                <div className="mb-6">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <BarChart3 className="text-green-600" size={20} />
                        วิเคราะห์ผลการสอบ
                    </h2>

                    {/* Row 1: Theta + SE */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
                        <ThetaProgressChart responses={result.responses} cutScore={CUT_SCORE} />
                        <SEConvergenceChart responses={result.responses} targetSE={TARGET_SE} />
                    </div>

                    {/* Topic Analysis */}
                    <TopicAnalysisSection topicAnalysis={result.topic_analysis} />

                    {/* Row 2: Posterior + Summary Stats */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <PosteriorChart finalTheta={result.final_theta} finalSE={result.final_se} cutScore={CUT_SCORE} />

                        {/* Summary stats card */}
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h2 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <ClipboardList className="text-green-600" size={18} />
                                สรุปสถิติ
                            </h2>
                            <div className="space-y-3">
                                {[
                                    { label: "ตอบถูก", value: `${result.num_correct} ข้อ`, color: "text-green-600" },
                                    { label: "ตอบผิด", value: `${result.num_items - result.num_correct} ข้อ`, color: "text-red-500" },
                                    { label: "ความคลาดเคลื่อนมาตรฐาน (SE)", value: result.final_se.toFixed(3), color: "text-purple-600" },
                                    { label: "เปอร์เซนไทล์", value: `${result.pass_percentile?.toFixed(1) ?? "N/A"}%`, color: "text-blue-600" },
                                    { label: "เวลาที่ใช้", value: `${mins}:${secs.toString().padStart(2, "0")}`, color: "text-gray-700" },
                                ].map(s => (
                                    <div key={s.label} className="flex justify-between items-center py-2 border-b border-dashed border-gray-100">
                                        <span className="text-gray-500 text-sm">{s.label}</span>
                                        <span className={`font-bold text-lg ${s.color}`}>{s.value}</span>
                                    </div>
                                ))}
                                <div className="pt-2">
                                    <p className="text-xs text-gray-400">เหตุผลที่จบการสอบ:</p>
                                    <p className="text-sm font-medium text-gray-700 mt-1">{result.stop_reason}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Actions ──────────────────────────────────────── */}
                <div className="flex gap-4 justify-center mb-10">
                    <button
                        onClick={() => router.push("/user")}
                        className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        ← กลับหน้าหลัก
                    </button>
                    <button
                        onClick={() => router.push("/user/cat-exam")}
                        className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold transition-colors shadow-sm flex items-center gap-2"
                    >
                        <RefreshCw size={18} />
                        สอบใหม่อีกครั้ง
                    </button>
                </div>

                {/* ── Answer Review ─────────────────────────────────── */}
                <div className="mb-8">
                    <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <BookOpen className="text-green-600" size={20} />
                        รีวิวคำตอบ ({result.num_items} ข้อ)
                    </h2>
                    <div className="space-y-3">
                        {result.responses.map((resp, index) => (
                            <div key={index} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                {/* Collapsed header */}
                                <button
                                    className={`w-full px-5 py-4 flex items-center justify-between text-left transition-colors ${resp.is_correct ? "hover:bg-green-50" : "hover:bg-red-50"}`}
                                    onClick={() => toggleItem(index)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${resp.is_correct ? "bg-green-500" : "bg-red-500"}`}>
                                            {index + 1}
                                        </div>
                                        <span className={`font-semibold text-sm ${resp.is_correct ? "text-green-700" : "text-red-700"}`}>
                                            {resp.is_correct ? "✓ ถูกต้อง" : "✗ ไม่ถูกต้อง"}
                                        </span>
                                        <span className="text-gray-400 text-xs line-clamp-1 max-w-xs hidden md:block">
                                            {resp.question_text?.substring(0, 60)}...
                                        </span>
                                    </div>
                                    <span className="text-blue-400 text-sm">{expandedItems.has(index) ? "▲" : "▼"}</span>
                                </button>

                                {/* Expanded content */}
                                {expandedItems.has(index) && (
                                    <div className="p-6 border-t border-gray-100">
                                        {resp.situation && (
                                            <div className="mb-4 p-4 bg-blue-50 rounded-xl border-l-4 border-blue-400">
                                                <div className="flex items-center gap-2 text-blue-600 font-bold mb-2 text-sm">
                                                    <Info size={16} /> สถานการณ์
                                                </div>
                                                <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                                                    {resp.situation.situation_text}
                                                </p>
                                            </div>
                                        )}

                                        <h3 className="text-base font-bold text-gray-800 mb-4 leading-relaxed">
                                            {resp.question_text}
                                        </h3>
                                        {resp.question_image_url && (
                                            <div className="mb-4">
                                                <img
                                                    src={resp.question_image_url.startsWith("http")
                                                        ? resp.question_image_url
                                                        : `${process.env.NEXT_PUBLIC_API_URL}${resp.question_image_url}`}
                                                    alt="question"
                                                    className="max-h-72 rounded-xl object-contain border border-gray-200 shadow-sm bg-white"
                                                />
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-5">
                                            {resp.answer_options?.map(opt => {
                                                const selected = opt.option_id === resp.selected_option_id;
                                                const correct = opt.is_correct;
                                                let cls = "border-gray-200 bg-white";
                                                let icon = null;
                                                if (selected && correct) { cls = "border-green-500 bg-green-50"; icon = <CheckCircle2 className="text-green-500 shrink-0" size={18} />; }
                                                else if (selected && !correct) { cls = "border-red-500 bg-red-50"; icon = <XCircle className="text-red-500 shrink-0" size={18} />; }
                                                else if (correct) { cls = "border-green-400 bg-green-50/40"; icon = <CheckCircle2 className="text-green-400 shrink-0" size={18} />; }
                                                return (
                                                    <div key={opt.option_id} className={`p-3 rounded-xl border-2 flex items-center gap-2 ${cls}`}>
                                                        <div className="flex-1 text-sm">
                                                            {opt.option_text && opt.option_text.replace(/<[^>]*>/g, '').trim() !== '' && (
                                                                <span>{opt.option_text}</span>
                                                            )}
                                                            {opt.option_image_url && opt.option_image_url.trim() !== '' && (
                                                                <div className={opt.option_text && opt.option_text.replace(/<[^>]*>/g, '').trim() !== '' ? "mt-2" : ""}>
                                                                    <img
                                                                        src={opt.option_image_url.startsWith("http")
                                                                            ? opt.option_image_url
                                                                            : `${process.env.NEXT_PUBLIC_API_URL}${opt.option_image_url}`}
                                                                        alt="option image"
                                                                        className="max-h-32 rounded-lg border border-gray-200 bg-white cursor-pointer hover:opacity-90 transition-opacity object-contain"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            const url = opt.option_image_url!.startsWith("http")
                                                                                ? opt.option_image_url!
                                                                                : `${process.env.NEXT_PUBLIC_API_URL}${opt.option_image_url}`;
                                                                            setPreviewImage(url);
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}
                                                        </div>
                                                        {icon}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100">
                                            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm mb-2">
                                                <HelpCircle size={16} /> คำอธิบาย
                                            </div>
                                            <p className="text-gray-700 text-sm leading-relaxed">
                                                {resp.explanation || "ไม่มีคำอธิบายเพิ่มเติมสำหรับข้อนี้"}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

            </div>

            <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
            <Footer />
        </div>
    );
}
