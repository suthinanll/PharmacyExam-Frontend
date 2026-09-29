"use client";

import React, { useState, useEffect } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Area, AreaChart, ReferenceLine,
    ComposedChart,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { CheckCircle2, XCircle, HelpCircle, BookOpen, Info, Award, Target, AlertTriangle, BarChart3, ClipboardList, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";

const LABELS = ["ก", "ข", "ค", "ง", "จ", "ฉ", "ช", "ซ"];

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

/** Custom dot rendering for question points (Green = Correct, Red = Incorrect) */
const renderCustomThetaDot = (props: any) => {
    const { cx, cy, payload, index, key } = props;
    if (!cx || !cy) return <g key={key || `dot-${index}`} />;
    const isCorrect = payload?.is_correct;
    return (
        <circle
            key={key || `dot-${index}`}
            cx={cx}
            cy={cy}
            r={5}
            fill={isCorrect ? "#16a34a" : "#dc2626"}
            stroke="#ffffff"
            strokeWidth={2}
            className="transition-transform duration-200 hover:scale-125"
        />
    );
};

/** Tooltip for Theta Progress Chart */
const CustomThetaTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-200 text-xs space-y-1.5 min-w-[170px]">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                    <span className="font-semibold text-gray-800">ข้อที่ {data.item}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${data.is_correct ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700"
                        }`}>
                        {data.is_correct ? "✓ ตอบถูก" : "✗ ตอบผิด"}
                    </span>
                </div>
                <div className="flex justify-between items-center text-gray-600 pt-0.5">
                    <span>ระดับความสามารถ (θ):</span>
                    <span className="font-bold text-blue-600  text-sm">
                        {data.theta >= 0 ? `+${data.theta.toFixed(3)}` : data.theta.toFixed(3)}
                    </span>
                </div>
                {data.se != null && (
                    <div className="flex justify-between items-center text-gray-400 text-[11px]">
                        <span>ความคลาดเคลื่อน (SE):</span>
                        <span className="">{data.se.toFixed(3)}</span>
                    </div>
                )}
            </div>
        );
    }
    return null;
};

/** Chart 1: θ progress over items */
function ThetaProgressChart({ responses, cutScore }: { responses: Response[]; cutScore: number }) {
    const data = responses.map((r, i) => ({
        item: i + 1,
        theta: r.theta_after != null ? +r.theta_after.toFixed(3) : 0,
        se: r.se_after != null ? +r.se_after.toFixed(3) : null,
        is_correct: r.is_correct,
    }));

    const thetas = data.map(d => d.theta);
    const minTheta = Math.floor(Math.min(...thetas, cutScore - 0.5, -2));
    const maxTheta = Math.ceil(Math.max(...thetas, cutScore + 0.5, 2));

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                    <h3 className="text-base font-medium text-gray-800">ระดับความสามารถ (θ) ตลอดการสอบ</h3>
                    <p className="text-xs text-gray-400 mt-0.5">เส้นทางการประเมินความสามารถตามคำตอบในแต่ละข้อ</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-green-600 inline-block" /> ตอบถูก
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" /> ตอบผิด
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 border-t-2 border-dashed border-amber-500 inline-block" /> เกณฑ์ผ่าน (0.0)
                    </span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={270}>
                <AreaChart data={data} margin={{ top: 15, right: 20, left: 10, bottom: 20 }}>
                    <defs>
                        <linearGradient id="thetaFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                        dataKey="item"
                        label={{ value: "ข้อที่", position: "insideBottom", offset: -10, fill: "#94a3b8", fontSize: 12 }}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "#cbd5e1" }}
                    />
                    <YAxis
                        domain={[minTheta, maxTheta]}
                        label={{ value: "ค่าความสามารถ (θ)", angle: -90, position: "insideLeft", offset: 12, fill: "#94a3b8", fontSize: 11 }}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "#cbd5e1" }}
                        tickFormatter={(v) => v > 0 ? `+${v.toFixed(1)}` : v === 0 ? "0.0" : v.toFixed(1)}
                    />
                    <Tooltip content={<CustomThetaTooltip />} />
                    <ReferenceLine
                        y={cutScore}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{ value: `เกณฑ์ (${cutScore.toFixed(1)})`, fill: "#d97706", fontSize: 11, position: "insideTopRight" }}
                    />
                    <Area
                        type="monotone"
                        dataKey="theta"
                        stroke="#2563eb"
                        strokeWidth={2.5}
                        fill="url(#thetaFill)"
                        dot={renderCustomThetaDot}
                        activeDot={{ r: 7, strokeWidth: 2, stroke: "#fff" }}
                    />
                </AreaChart>
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                    <h3 className="text-base font-medium text-gray-800">ความแม่นยำของการวัด (SE)</h3>
                    <p className="text-xs text-gray-400 mt-0.5">ค่าความคลาดเคลื่อนมาตรฐานลดลงเรื่อยๆ — ยิ่งต่ำยิ่งแม่นยำ</p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" /> ค่า SE
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 border-t-2 border-dashed border-green-500 inline-block" /> เกณฑ์เป้าหมาย ({targetSE})
                    </span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={270}>
                <AreaChart data={data} margin={{ top: 15, right: 20, left: 10, bottom: 20 }}>
                    <defs>
                        <linearGradient id="seFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.18} />
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                        dataKey="item"
                        label={{ value: "ข้อที่", position: "insideBottom", offset: -10, fill: "#94a3b8", fontSize: 12 }}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "#cbd5e1" }}
                    />
                    <YAxis
                        domain={[0, 1.2]}
                        label={{ value: "SE", angle: -90, position: "insideLeft", offset: 12, fill: "#94a3b8", fontSize: 11 }}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "#cbd5e1" }}
                    />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-200 text-xs space-y-1">
                                        <p className="font-semibold text-gray-800">ข้อที่ {d.item}</p>
                                        <p className="text-purple-600 font-medium">SE: {d.se?.toFixed(3)}</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <ReferenceLine
                        y={targetSE}
                        stroke="#22c55e"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{ value: `เป้าหมาย (${targetSE})`, fill: "#16a34a", fontSize: 11, position: "insideTopRight" }}
                    />
                    <Area
                        type="monotone"
                        dataKey="se"
                        stroke="#8b5cf6"
                        strokeWidth={2.5}
                        fill="url(#seFill)"
                        dot={{ r: 4, fill: "#8b5cf6", stroke: "#fff", strokeWidth: 2 }}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

/** Chart 3: Posterior distribution N(θ, SE) */
function PosteriorChart({ finalTheta, finalSE, cutScore }: { finalTheta: number; finalSE: number; cutScore: number }) {
    const pointsCount = 120;
    const step = 8.0 / pointsCount;
    const data = [];
    for (let i = 0; i <= pointsCount; i++) {
        const xVal = +(-4.0 + i * step).toFixed(2);
        const yVal = +normalPDF(xVal, finalTheta, Math.max(0.1, finalSE)).toFixed(4);
        data.push({ x: xVal, y: yVal });
    }

    const isPassed = finalTheta >= cutScore;

    return (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                <div>
                    <h3 className="text-base font-medium text-gray-800">การกระจายความสามารถ (Posterior Distribution)</h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                        การแจกแจงระดับความสามารถของคุณ (θ = {finalTheta >= 0 ? `+${finalTheta.toFixed(2)}` : finalTheta.toFixed(2)}, SE = {finalSE.toFixed(3)})
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 border-t-2 border-blue-600 inline-block" /> ความสามารถ ({finalTheta >= 0 ? `+${finalTheta.toFixed(2)}` : finalTheta.toFixed(2)})
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-3 border-t-2 border-dashed border-amber-500 inline-block" /> เกณฑ์ผ่าน ({cutScore.toFixed(1)})
                    </span>
                </div>
            </div>

            <ResponsiveContainer width="100%" height={270}>
                <AreaChart data={data} margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                    <defs>
                        <linearGradient id="posteriorFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isPassed ? "#16a34a" : "#2563eb"} stopOpacity={0.25} />
                            <stop offset="95%" stopColor={isPassed ? "#16a34a" : "#2563eb"} stopOpacity={0.0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis
                        dataKey="x"
                        type="number"
                        domain={[-4, 4]}
                        ticks={[-4, -3, -2, -1, 0, 1, 2, 3, 4]}
                        label={{ value: "ระดับความสามารถ (θ)", position: "insideBottom", offset: -10, fill: "#94a3b8", fontSize: 12 }}
                        tick={{ fontSize: 11, fill: "#64748b" }}
                        axisLine={{ stroke: "#cbd5e1" }}
                        tickFormatter={(v) => v > 0 ? `+${v}` : `${v}`}
                    />
                    <YAxis hide />
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const d = payload[0].payload;
                                return (
                                    <div className="bg-white/95 backdrop-blur-sm p-3 rounded-xl shadow-lg border border-gray-200 text-xs space-y-1">
                                        <p className="font-semibold text-gray-800">θ = {d.x > 0 ? `+${d.x.toFixed(2)}` : d.x.toFixed(2)}</p>
                                        <p className="text-blue-600">ความน่าจะเป็นสัมพัทธ์: {d.y.toFixed(3)}</p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <ReferenceLine
                        x={cutScore}
                        stroke="#f59e0b"
                        strokeDasharray="4 4"
                        strokeWidth={1.5}
                        label={{ value: "เกณฑ์ (0.0)", fill: "#d97706", fontSize: 11, position: "top" }}
                    />
                    <ReferenceLine
                        x={finalTheta}
                        stroke="#2563eb"
                        strokeWidth={2}
                        label={{
                            value: `θ = ${finalTheta >= 0 ? `+${finalTheta.toFixed(2)}` : finalTheta.toFixed(2)}`,
                            fill: "#1d4ed8",
                            fontSize: 11,
                            fontWeight: 600,
                            position: "insideTopLeft",
                        }}
                    />
                    <Area
                        type="monotone"
                        dataKey="y"
                        stroke={isPassed ? "#16a34a" : "#2563eb"}
                        strokeWidth={2.5}
                        fill="url(#posteriorFill)"
                        name="ความน่าจะเป็น"
                    />
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
            <h2 className="text-base font-medium text-gray-800 mb-1">วิเคราะห์ตามหัวข้อ</h2>
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
                                                <p className="font-medium text-gray-800 mb-1">{d.fullName}</p>
                                                <p className="text-blue-600 font-medium">ความแม่นยำ: {d.Performance}%</p>
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
                    <h3 className="font-medium text-gray-800 mb-3 border-b pb-2">คะแนนรายหัวข้อ</h3>
                    <div className="space-y-3 max-h-[320px] overflow-y-auto pr-2 custom-scrollbar flex-1">
                        {topicAnalysis.map(topic => (
                            <div key={topic.topic_id} className="p-3.5 rounded-xl border border-gray-100 bg-white hover:bg-gray-50/50 transition-colors space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${topic.accuracy >= 70 ? 'bg-green-100 text-green-700' :
                                            topic.accuracy >= 50 ? 'bg-amber-100 text-amber-700' :
                                                'bg-red-100 text-red-600'
                                        }`}>
                                        {topic.accuracy >= 70 ? <Award className="w-5 h-5" /> : topic.accuracy >= 50 ? <Target className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-gray-800 text-sm truncate">{topic.topic_name}</p>
                                        <p className="text-xs text-gray-500">{topic.correct}/{topic.total} ข้อ</p>
                                    </div>
                                    <span className={`font-medium text-sm ${topic.accuracy >= 70 ? 'text-green-600' :
                                            topic.accuracy >= 50 ? 'text-amber-500' : 'text-red-500'
                                        }`}>{topic.accuracy}%</span>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-gray-100 rounded-full h-1">
                                    <div
                                        className={`h-1 rounded-full ${topic.accuracy >= 70 ? 'bg-green-500' :
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
                                                    className={`text-[10px] px-2 py-0.5 rounded-md border flex items-center gap-1 ${st.accuracy >= 70
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

    if (loading) {
        return (
            <>
                <Navbar_user />
                <div className="min-h-screen flex items-start justify-center pt-24">
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
        <>
            <Navbar_user />
            <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">

                    {/* ── Breadcrumb ───────────────────────────────── */}
                    <div className="flex items-center text-sm text-gray-500 mb-5">
                        <Link href="/user" className="hover:text-green-600 cursor-pointer transition">หน้าหลัก</Link>
                        <span className="mx-2">›</span>
                        <Link href="/user/cat-exam" className="hover:text-green-600 cursor-pointer transition">สอบแบบปรับตัว (CAT)</Link>
                        <span className="mx-2">›</span>
                        <span className="text-gray-600 font-medium">ผลการสอบ</span>
                    </div>

                    {/* ── Result Header ───────────────────────────────── */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
                            {/* Status icon */}
                            <div className={`w-16 h-16 shrink-0 rounded-2xl flex items-center justify-center ${result.passed ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                                }`}>
                                {result.passed ? <Award className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                    <h1 className="text-xl font-medium text-gray-900">
                                        {result.passed ? "ยินดีด้วย! คุณผ่านเกณฑ์การสอบ" : "การสอบเสร็จสิ้น"}
                                    </h1>
                                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${result.passed
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
                                    <div className={`text-2xl font-medium ${s.color}`}>{s.value}</div>
                                    <div className="text-xs text-gray-500 mt-1">{s.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── Analysis Charts ─────────────────────── */}
                    <div className="mb-6">
                        <h2 className="text-lg font-medium text-gray-800 mb-4 flex items-center gap-2">
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
                                <h2 className="text-base font-medium text-gray-800 mb-4 flex items-center gap-2">
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
                                            <span className={`font-medium text-lg ${s.color}`}>{s.value}</span>
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

                    {/* ── Actions ── */}
                    <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
                        <Link
                            href={`/user/cat-exam/result/${sessionId}/answer`}
                            className="flex-1 sm:flex-none px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl text-sm text-center transition-colors shadow-sm"
                        >
                            ดูเฉลยคำตอบ
                        </Link>
                        <Link
                            href="/user/cat-exam"
                            className="flex-1 sm:flex-none px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl text-sm text-center border border-gray-200 transition-colors flex items-center justify-center gap-2"
                        >
                            <RefreshCw size={16} />
                            สอบใหม่อีกครั้ง
                        </Link>
                        <Link
                            href="/user"
                            className="flex-1 sm:flex-none px-6 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-xl text-sm text-center border border-gray-200 transition-colors"
                        >
                            กลับหน้าหลัก
                        </Link>
                    </div>

                </div>
            </div>

            <Footer />
        </>
    );
}
