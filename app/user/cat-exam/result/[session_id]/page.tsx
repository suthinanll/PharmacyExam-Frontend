"use client";

import React, { useState, useEffect, useMemo } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer, Area, AreaChart, ReferenceLine,
    BarChart, Bar, Cell, ComposedChart,
    Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
import { CheckCircle2, XCircle, HelpCircle, BookOpen, Info, ChevronLeft, ChevronRight } from "lucide-react";

// ==================== TYPES ====================
interface Response {
    item_id: number;
    is_correct: boolean;
    theta_before: number;
    theta_after: number;
    se_after: number;
    selected_option_id: number;
    response_time_ms: number;
    question_text: string;
    explanation: string;
    situation?: { situation_text: string; situation_image_url?: string };
    answer_options: Array<{ option_id: number; option_text: string; is_correct: boolean }>;
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
function irt3PL(theta: number, a: number, b: number, c: number): number {
    return c + (1 - c) / (1 + Math.exp(-a * (theta - b)));
}
function fisherInfo(theta: number, a: number, b: number, c: number): number {
    const P = irt3PL(theta, a, b, c);
    const num = Math.pow(a, 2) * Math.pow(P - c, 2) * (1 - P);
    const den = Math.pow(1 - c, 2) * P;
    return den > 0 ? num / den : 0;
}
function normalPDF(x: number, mean: number, sd: number): number {
    return Math.exp(-Math.pow(x - mean, 2) / (2 * sd * sd)) / (sd * Math.sqrt(2 * Math.PI));
}

const THETA_RANGE = Array.from({ length: 81 }, (_, i) => -4 + i * 0.1);

// ==================== CHART COMPONENTS ====================

/** Chart 1 (existing): θ progress + CI band over items */
function ThetaProgressChart({ responses, cutScore }: { responses: Response[]; cutScore: number }) {
    const data = responses.map((r, i) => ({
        item: i + 1,
        theta: r.theta_after != null ? +r.theta_after.toFixed(3) : null,
        ci_low: r.theta_after != null && r.se_after != null ? +(r.theta_after - 1.96 * r.se_after).toFixed(3) : null,
        ci_high: r.theta_after != null && r.se_after != null ? +(r.theta_after + 1.96 * r.se_after).toFixed(3) : null,
        correct: r.is_correct ? 1 : 0,
    }));

    return (
        <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">📈 Theta (θ) Trajectory + 95% CI</h2>
            <p className="text-xs text-gray-400 mb-4">เส้น theta พร้อม confidence band ที่แคบลงเมื่อข้อมูลมากขึ้น</p>
            <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="item" label={{ value: "ข้อที่", position: "insideBottom", offset: -10 }} tick={{ fontSize: 11 }} />
                    <YAxis domain={[-4, 4]} label={{ value: "θ", angle: -90, position: "insideLeft", offset: 10 }} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => v?.toFixed(3)} />
                    <ReferenceLine y={cutScore} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: "Cut", fill: "#f59e0b", fontSize: 11 }} />
                    {/* CI band using two lines + area approximation */}
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

/** Chart 2 (NEW — CATsim hallmark): SE Convergence */
function SEConvergenceChart({ responses, targetSE }: { responses: Response[]; targetSE: number }) {
    const data = responses.map((r, i) => ({
        item: i + 1,
        se: r.se_after != null ? +r.se_after.toFixed(3) : null,
    }));
    return (
        <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">📉 SE Convergence Plot</h2>
            <p className="text-xs text-gray-400 mb-4">Standard Error ลดลงเรื่อยๆ — hallmark การวัดแบบ CAT</p>
            <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="item" label={{ value: "ข้อที่", position: "insideBottom", offset: -10 }} tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 1.5]} label={{ value: "SE", angle: -90, position: "insideLeft", offset: 10 }} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => v?.toFixed(3)} />
                    <ReferenceLine y={targetSE} stroke="#22c55e" strokeDasharray="4 4"
                        label={{ value: `Target SE (${targetSE})`, fill: "#16a34a", fontSize: 11, position: "right" }} />
                    <Line type="monotone" dataKey="se" stroke="#8b5cf6" strokeWidth={2.5}
                        dot={{ r: 4, fill: "#8b5cf6" }} name="SE(θ)" />
                    <Legend verticalAlign="top" height={24} />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
}

/** Chart 3 (NEW — CATsim key): ICC Overlay + Individual ICC */
function ICCSection({ responses, finalTheta }: { responses: Response[]; finalTheta: number }) {
    const [selectedIdx, setSelectedIdx] = useState<number>(0);

    // Build a shared theta axis for all curves
    const thetaAxis = THETA_RANGE;

    // Overlay chart: all items overlaid, coloured by correct/incorrect
    const overlayData = thetaAxis.map(t => {
        const point: Record<string, number> = { theta: +t.toFixed(2) };
        responses.forEach((r, i) => {
            if (r.irt_a != null && r.irt_b != null && r.irt_c != null) {
                point[`item_${i + 1}`] = +irt3PL(t, r.irt_a, r.irt_b, r.irt_c).toFixed(4);
            }
        });
        return point;
    });

    // Individual ICC + user theta marker
    const sel = responses[selectedIdx];
    const individualData = thetaAxis.map(t => ({
        theta: +t.toFixed(2),
        prob: (sel?.irt_a != null && sel.irt_b != null && sel.irt_c != null)
            ? +irt3PL(t, sel.irt_a, sel.irt_b, sel.irt_c).toFixed(4)
            : null,
    }));
    const pAtTheta = (sel?.irt_a != null && sel.irt_b != null && sel.irt_c != null)
        ? irt3PL(finalTheta, sel.irt_a, sel.irt_b, sel.irt_c)
        : null;

    return (
        <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-1">📈 Item Characteristic Curves (ICC)</h2>
            <p className="text-xs text-gray-400 mb-4">กราฟ P(θ) ของแต่ละ item จากโมเดล 3PL — เส้นตรงกลางคือ θ สุดท้ายของคุณ</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* LEFT: Overlay — all curves */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <h3 className="text-sm font-bold text-gray-700 mb-3">ICC Overlay (ทุกข้อ)</h3>
                    <ResponsiveContainer width="100%" height={280}>
                        <LineChart data={overlayData} margin={{ top: 8, right: 8, left: -15, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="theta"
                                label={{ value: "θ", position: "insideBottom", offset: -10 }}
                                tick={{ fontSize: 10 }}
                                tickFormatter={v => Number(v) % 1 === 0 ? String(v) : ""} />
                            <YAxis domain={[0, 1]} label={{ value: "P(θ)", angle: -90, position: "insideLeft", offset: 12 }} tick={{ fontSize: 10 }} />
                            <Tooltip
                                formatter={(v: any, name: string) => [v?.toFixed(3), name]}
                                labelFormatter={l => `θ = ${l}`} />
                            <ReferenceLine x={finalTheta} stroke="#2563eb" strokeWidth={2}
                                label={{ value: `θ=${finalTheta.toFixed(2)}`, fill: "#2563eb", fontSize: 11, position: "top" }} />
                            <ReferenceLine y={0.5} stroke="#9ca3af" strokeDasharray="3 3" />
                            {responses.map((r, i) => (
                                <Line
                                    key={i}
                                    type="monotone"
                                    dataKey={`item_${i + 1}`}
                                    stroke={r.is_correct ? "#22c55e" : "#ef4444"}
                                    strokeWidth={i === selectedIdx ? 2.5 : 1}
                                    strokeOpacity={i === selectedIdx ? 1 : 0.35}
                                    dot={false}
                                    legendType="none"
                                    activeDot={false}
                                />
                            ))}
                        </LineChart>
                    </ResponsiveContainer>
                    <div className="flex gap-3 justify-center mt-2 text-xs">
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block" />ตอบถูก</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-400 inline-block" />ตอบผิด</span>
                        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 inline-block border-dashed" />θ คุณ</span>
                        <span className="flex items-center gap-1 text-gray-400">굵은 = ข้อที่เลือก</span>
                    </div>
                </div>

                {/* RIGHT: Individual item ICC */}
                <div className="bg-white rounded-2xl shadow p-6">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-gray-700">ICC รายข้อ</h3>
                        <div className="flex items-center gap-1">
                            <button onClick={() => setSelectedIdx(i => Math.max(0, i - 1))}
                                disabled={selectedIdx === 0}
                                className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm font-medium text-gray-700 w-20 text-center">
                                ข้อ {selectedIdx + 1} / {responses.length}
                            </span>
                            <button onClick={() => setSelectedIdx(i => Math.min(responses.length - 1, i + 1))}
                                disabled={selectedIdx === responses.length - 1}
                                className="p-1 rounded-lg hover:bg-gray-100 disabled:opacity-30">
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    {/* IRT params display */}
                    {sel && (
                        <div className="flex gap-2 mb-3">
                            {[
                                { label: "a (discrimination)", value: sel.irt_a, color: "text-orange-600" },
                                { label: "b (difficulty)", value: sel.irt_b, color: "text-red-600" },
                                { label: "c (guessing)", value: sel.irt_c, color: "text-gray-500" },
                            ].map(p => (
                                <div key={p.label} className="flex-1 bg-gray-50 rounded-xl p-2 text-center">
                                    <div className={`text-lg font-bold ${p.color}`}>
                                        {p.value?.toFixed(2) ?? "N/A"}
                                    </div>
                                    <div className="text-[10px] text-gray-400 leading-tight mt-0.5">{p.label}</div>
                                </div>
                            ))}
                            <div className="flex-1 bg-blue-50 rounded-xl p-2 text-center">
                                <div className="text-lg font-bold text-blue-600">
                                    {pAtTheta != null ? pAtTheta.toFixed(3) : "N/A"}
                                </div>
                                <div className="text-[10px] text-gray-400 leading-tight mt-0.5">P(θ={finalTheta.toFixed(1)})</div>
                            </div>
                        </div>
                    )}

                    <ResponsiveContainer width="100%" height={200}>
                        <AreaChart data={individualData} margin={{ top: 8, right: 8, left: -15, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="theta"
                                label={{ value: "θ", position: "insideBottom", offset: -10 }}
                                tick={{ fontSize: 10 }}
                                tickFormatter={v => Number(v) % 1 === 0 ? String(v) : ""} />
                            <YAxis domain={[0, 1]} label={{ value: "P(θ)", angle: -90, position: "insideLeft", offset: 12 }} tick={{ fontSize: 10 }} />
                            <Tooltip formatter={(v: any) => v?.toFixed(3)} labelFormatter={l => `θ = ${l}`} />
                            <ReferenceLine x={finalTheta} stroke="#2563eb" strokeWidth={2}
                                label={{ value: `θ=${finalTheta.toFixed(2)}`, fill: "#2563eb", fontSize: 11, position: "top" }} />
                            <ReferenceLine y={0.5} stroke="#9ca3af" strokeDasharray="3 3" />
                            {sel?.irt_b != null && (
                                <ReferenceLine x={sel.irt_b} stroke="#f59e0b" strokeDasharray="4 4"
                                    label={{ value: `b=${sel.irt_b.toFixed(2)}`, fill: "#d97706", fontSize: 11, position: "top" }} />
                            )}
                            <Area type="monotone" dataKey="prob"
                                stroke={sel?.is_correct ? "#22c55e" : "#ef4444"}
                                fill={sel?.is_correct ? "#dcfce7" : "#fee2e2"}
                                fillOpacity={0.6}
                                strokeWidth={2.5}
                                name="P(θ)" dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>

                    {/* Item selector grid */}
                    <div className="flex flex-wrap gap-1.5 mt-3">
                        {responses.map((r, i) => (
                            <button key={i}
                                onClick={() => setSelectedIdx(i)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${i === selectedIdx
                                        ? "ring-2 ring-offset-1 ring-blue-500 " + (r.is_correct ? "bg-green-500 text-white" : "bg-red-500 text-white")
                                        : r.is_correct ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-red-100 text-red-700 hover:bg-red-200"
                                    }`}>
                                {i + 1}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Chart 4 (NEW): Item Information Contribution per item */
function ItemInformationChart({ responses }: { responses: Response[] }) {
    const data = responses.map((r, i) => {
        const info = (r.irt_a != null && r.irt_b != null && r.irt_c != null)
            ? +fisherInfo(r.theta_before, r.irt_a, r.irt_b, r.irt_c).toFixed(3)
            : 0;
        return { item: i + 1, info, correct: r.is_correct };
    });
    return (
        <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">🎯 Fisher Information Contribution</h2>
            <p className="text-xs text-gray-400 mb-4">ข้อมูลที่แต่ละข้อสอบมอบให้ ณ theta ขณะนั้น (สีเขียว = ตอบถูก)</p>
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="item" label={{ value: "ข้อที่", position: "insideBottom", offset: -10 }} tick={{ fontSize: 11 }} />
                    <YAxis label={{ value: "I(θ)", angle: -90, position: "insideLeft", offset: 10 }} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => v?.toFixed(3)} />
                    <Bar dataKey="info" name="I(θ)" radius={[4, 4, 0, 0]}>
                        {data.map((d, i) => (
                            <Cell key={i} fill={d.correct ? "#22c55e" : "#ef4444"} />
                        ))}
                    </Bar>
                    <Legend verticalAlign="top" height={24}
                        content={() => (
                            <div className="flex gap-4 justify-center text-xs mt-1">
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-500 inline-block" />ตอบถูก</span>
                                <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-400 inline-block" />ตอบผิด</span>
                            </div>
                        )} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

/** Chart 4 (NEW): Item Difficulty Distribution (b-params selected) */
function ItemDifficultyDistChart({ responses, finalTheta }: { responses: Response[]; finalTheta: number }) {
    const bins: Record<string, number> = {
        "< -2": 0, "-2 to -1": 0, "-1 to 0": 0, "0 to 1": 0, "1 to 2": 0, "> 2": 0,
    };
    responses.forEach(r => {
        if (r.irt_b == null) return;
        const b = r.irt_b;
        if (b < -2) bins["< -2"]++;
        else if (b < -1) bins["-2 to -1"]++;
        else if (b < 0) bins["-1 to 0"]++;
        else if (b < 1) bins["0 to 1"]++;
        else if (b < 2) bins["1 to 2"]++;
        else bins["> 2"]++;
    });
    const data = Object.entries(bins).map(([range, count]) => ({ range, count }));

    return (
        <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">📊 Item Difficulty Distribution</h2>
            <p className="text-xs text-gray-400 mb-4">
                การกระจายความยาก (b) ของข้อที่ถูกเลือก — ควรกระจุกอยู่ใกล้ θ = {finalTheta.toFixed(2)}
            </p>
            <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="range" tick={{ fontSize: 10 }} label={{ value: "b-parameter range", position: "insideBottom", offset: -10 }} />
                    <YAxis allowDecimals={false} label={{ value: "จำนวนข้อ", angle: -90, position: "insideLeft", offset: 15 }} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="count" name="จำนวนข้อ" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}

/** Chart 5 (existing enhanced): Posterior distribution N(θ, SE) */
function PosteriorChart({ finalTheta, finalSE, cutScore }: { finalTheta: number; finalSE: number; cutScore: number }) {
    const data = THETA_RANGE.map(x => ({
        x: +x.toFixed(1),
        y: +normalPDF(x, finalTheta, finalSE).toFixed(4),
    }));
    return (
        <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">📐 Posterior Ability Distribution</h2>
            <p className="text-xs text-gray-400 mb-4">
                การแจกแจงความสามารถหลังการสอบ — ยิ่งแคบ ยิ่งแม่นยำ (SE = {finalSE.toFixed(3)})
            </p>
            <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="x" label={{ value: "θ", position: "insideBottom", offset: -10 }} tick={{ fontSize: 11 }}
                        tickFormatter={(v) => Number(v) % 1 === 0 ? v : ""} />
                    <YAxis hide />
                    <Tooltip formatter={(v: any) => v?.toFixed(4)} labelFormatter={(l) => `θ = ${l}`} />
                    <ReferenceLine x={cutScore.toFixed(1)} stroke="#f59e0b" strokeDasharray="4 4"
                        label={{ value: "Cut", fill: "#f59e0b", fontSize: 11 }} />
                    <ReferenceLine x={finalTheta.toFixed(1)} stroke="#2563eb" strokeWidth={2}
                        label={{ value: `θ=${finalTheta.toFixed(2)}`, fill: "#2563eb", fontSize: 11, position: "top" }} />
                    <Area type="monotone" dataKey="y" stroke="#3b82f6" fill="#bfdbfe" fillOpacity={0.8} name="P(θ|data)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}

/** Topic Analysis Chart — เหมือน normal exam */
function TopicAnalysisSection({ topicAnalysis }: { topicAnalysis: TopicStat[] }) {
    if (!topicAnalysis || topicAnalysis.length === 0) return null;

    const radarData = topicAnalysis.map(t => ({
        subject: t.topic_name.length > 15 ? t.topic_name.substring(0, 15) + '...' : t.topic_name,
        fullName: t.topic_name,
        Performance: t.accuracy,
        fullMark: 100,
    }));

    return (
        <div className="bg-white rounded-2xl shadow p-6 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-1">📚 วิเคราะห์ตามหัวข้อ</h2>
            <p className="text-xs text-gray-400 mb-5">เปอร์เซ็นต์ความถูกต้องในแต่ละหัวข้อ — สีเขียวคือเก่ง สีแดงคือต้องพัฒนา</p>

            {/* Radar Chart + Score List */}
            <div className="flex flex-col lg:flex-row gap-8 items-center lg:items-start mb-8">
                {/* Radar Chart */}
                <div className="w-full lg:w-1/2 h-[320px]">
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
                                stroke="#3b82f6"
                                fill="#3b82f6"
                                fillOpacity={0.4}
                                dot={{ r: 4, fill: '#3b82f6' }}
                            />
                        </RadarChart>
                    </ResponsiveContainer>
                </div>

                {/* Score List */}
                <div className="w-full lg:w-1/2 space-y-3">
                    <h3 className="font-bold text-gray-800 mb-3 border-b pb-2">คะแนนรายหัวข้อ</h3>
                    {topicAnalysis.map(topic => (
                        <div key={topic.topic_id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                                topic.accuracy >= 70 ? 'bg-green-100 text-green-700' :
                                topic.accuracy >= 50 ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-600'
                            }`}>
                                {topic.accuracy >= 70 ? '🏆' : topic.accuracy >= 50 ? '🎯' : '⚠️'}
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
                    ))}
                </div>
            </div>

            {/* Sub-topic detail cards */}
            <div className="border-t border-gray-100 pt-5 space-y-4">
                <h3 className="font-bold text-gray-700 text-sm mb-3">รายละเอียดหัวข้อย่อย</h3>
                {topicAnalysis.map(topic => (
                    <div key={topic.topic_id}>
                        <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-gray-700 text-sm">{topic.topic_name}</span>
                            <span className={`text-sm font-bold ${
                                topic.accuracy >= 70 ? 'text-green-600' :
                                topic.accuracy >= 50 ? 'text-amber-500' : 'text-red-500'
                            }`}>{topic.accuracy}%</span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5 mb-3">
                            <div
                                className={`h-1.5 rounded-full ${
                                    topic.accuracy >= 70 ? 'bg-green-500' :
                                    topic.accuracy >= 50 ? 'bg-amber-400' : 'bg-red-400'
                                }`}
                                style={{ width: `${topic.accuracy}%` }}
                            />
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {topic.sub_topics.map(st => (
                                <div
                                    key={st.sub_topic_id}
                                    className={`text-xs px-3 py-1.5 rounded-lg border flex items-center gap-1.5 ${
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
                ))}
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
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-lg text-blue-800">กำลังโหลดผลการสอบ...</p>
                </div>
            </div>
        );
    }

    if (!result) return null;

    const examDuration = result.end_time
        ? Math.floor((new Date(result.end_time).getTime() - new Date(result.start_time).getTime()) / 1000)
        : 0;
    const mins = Math.floor(examDuration / 60);
    const secs = examDuration % 60;
    const accuracy = result.num_items > 0 ? ((result.num_correct / result.num_items) * 100).toFixed(1) : "0.0";

    // Infer target SE from actual SE trajectory (use 0.35 default)
    const TARGET_SE = 0.35;
    const CUT_SCORE = 0.0;

    return (
        <div className="min-h-screen bg-slate-50">
            <Navbar_user />

            <div className="container mx-auto px-4 py-8 max-w-6xl">

                {/* ── Result Header ───────────────────────────────── */}
                <div className={`rounded-3xl shadow-2xl p-8 mb-8 text-white ${result.passed
                    ? "bg-gradient-to-r from-green-500 to-emerald-600"
                    : "bg-gradient-to-r from-slate-600 to-slate-700"}`}>
                    <div className="text-center">
                        <div className="text-6xl mb-3">{result.passed ? "🎉" : "📊"}</div>
                        <h1 className="text-3xl font-extrabold mb-1">
                            {result.passed ? "ยินดีด้วย! คุณสอบผ่าน" : "สอบเสร็จสิ้น"}
                        </h1>
                        <p className="opacity-80 mb-2">{result.item_bank_name || "คลังข้อสอบรวม (Global Pool)"}</p>
                        <div className="inline-block bg-white/20 rounded-xl px-4 py-1 text-sm font-medium mb-6">
                            ⚡ {result.stop_reason || "สอบเสร็จสิ้น"}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: "θ สุดท้าย", value: result.final_theta.toFixed(2) },
                                { label: "SE", value: result.final_se.toFixed(3) },
                                { label: "จำนวนข้อ", value: result.num_items },
                                { label: "ความแม่นยำ", value: `${accuracy}%` },
                            ].map(s => (
                                <div key={s.label} className="bg-white/20 rounded-xl p-4">
                                    <div className="text-xs opacity-70 mb-1">{s.label}</div>
                                    <div className="text-2xl font-bold">{s.value}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── CATsim Charts (6 charts) ─────────────────────── */}
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">
                        📊 CATsim Analysis Charts
                    </h2>

                    {/* Row 1 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <ThetaProgressChart responses={result.responses} cutScore={CUT_SCORE} />
                        <SEConvergenceChart responses={result.responses} targetSE={TARGET_SE} />
                    </div>

                    {/* Topic Analysis — เหมือน normal exam */}
                    <TopicAnalysisSection topicAnalysis={result.topic_analysis} />

                    {/* Row 2 — ICC (full width, prominent for instructors) */}
                    <ICCSection responses={result.responses} finalTheta={result.final_theta} />

                    {/* Row 3 */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        <ItemInformationChart responses={result.responses} />
                        <ItemDifficultyDistChart responses={result.responses} finalTheta={result.final_theta} />
                    </div>

                    {/* Row 4 — Posterior */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <PosteriorChart finalTheta={result.final_theta} finalSE={result.final_se} cutScore={CUT_SCORE} />

                        {/* Summary stats card */}
                        <div className="bg-white rounded-2xl shadow p-6">
                            <h2 className="text-lg font-bold text-gray-800 mb-4">📋 สรุปสถิติ</h2>
                            <div className="space-y-3">
                                {[
                                    { label: "ตอบถูก", value: result.num_correct, color: "text-green-600" },
                                    { label: "ตอบผิด", value: result.num_items - result.num_correct, color: "text-red-500" },
                                    { label: "Standard Error สุดท้าย", value: result.final_se.toFixed(3), color: "text-purple-600" },
                                    { label: "Percentile", value: `${result.pass_percentile?.toFixed(1) ?? "N/A"}%`, color: "text-blue-600" },
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
                <div className="flex gap-4 justify-center mb-12">
                    <button
                        onClick={() => router.push("/user")}
                        className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                    >
                        ← กลับหน้าหลัก
                    </button>
                    <button
                        onClick={() => router.push("/user/cat-exam/select")}
                        className="px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg"
                    >
                        🔄 สอบใหม่อีกครั้ง
                    </button>
                </div>

                {/* ── Answer Review ─────────────────────────────────── */}
                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                        <BookOpen className="text-blue-600" size={22} />
                        รีวิวคำตอบ ({result.num_items} ข้อ)
                    </h2>
                    <div className="space-y-3">
                        {result.responses.map((resp, index) => (
                            <div key={index} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                {/* Collapsed header */}
                                <button
                                    className={`w-full px-6 py-4 flex items-center justify-between text-left transition-colors ${resp.is_correct ? "bg-green-50 hover:bg-green-100" : "bg-red-50 hover:bg-red-100"}`}
                                    onClick={() => toggleItem(index)}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${resp.is_correct ? "bg-green-500" : "bg-red-500"}`}>
                                            {index + 1}
                                        </div>
                                        <span className={`font-semibold ${resp.is_correct ? "text-green-700" : "text-red-700"}`}>
                                            {resp.is_correct ? "✓ ถูกต้อง" : "✗ ไม่ถูกต้อง"}
                                        </span>
                                        <span className="text-gray-400 text-xs line-clamp-1 max-w-xs hidden md:block">
                                            {resp.question_text?.substring(0, 60)}...
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 text-xs text-gray-400">
                                        <span>b = {resp.irt_b?.toFixed(2) ?? "N/A"}</span>
                                        <span>θ → {resp.theta_after?.toFixed(2) ?? "N/A"}</span>
                                        <span className="text-blue-400">{expandedItems.has(index) ? "▲" : "▼"}</span>
                                    </div>
                                </button>

                                {/* Expanded content */}
                                {expandedItems.has(index) && (
                                    <div className="p-6">
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
                                                        <span className="flex-1 text-sm">{opt.option_text}</span>
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

                                        {/* IRT micro stats */}
                                        <div className="mt-3 flex gap-4 text-xs text-gray-400">
                                            <span>a = {resp.irt_a?.toFixed(2) ?? "N/A"}</span>
                                            <span>b = {resp.irt_b?.toFixed(2) ?? "N/A"}</span>
                                            <span>c = {resp.irt_c?.toFixed(2) ?? "N/A"}</span>
                                            <span>I(θ) = {(resp.irt_a != null && resp.irt_b != null && resp.irt_c != null)
                                                ? fisherInfo(resp.theta_before, resp.irt_a, resp.irt_b, resp.irt_c).toFixed(3)
                                                : "N/A"}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
