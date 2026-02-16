"use client";

import React, { useState, useEffect } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
    ReferenceLine,
} from "recharts";
import {
    CheckCircle2,
    XCircle,
    ChevronDown,
    ChevronUp,
    HelpCircle,
    BookOpen,
    Info
} from "lucide-react";

// ==================== TYPES ====================
interface CATResult {
    session_id: number;
    item_bank_name: string;
    status: string;
    start_time: string;
    end_time: string;
    current_theta: number;
    current_se: number;
    final_theta: number;
    final_se: number;
    num_items: number;
    num_correct: number;
    passed: boolean;
    stop_reason: string;
    responses: any[];
    pass_percentile: number;
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
        if (sessionId) {
            fetchResult();
        }
    }, [sessionId]);

    async function fetchResult() {
        try {
            setLoading(true);
            const token = getToken();

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/cat/session/${sessionId}/result`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error("Failed to fetch result");
            }

            const data = await response.json();
            setResult(data);
        } catch (error) {
            console.error("Error fetching result:", error);
            alert("ไม่สามารถโหลดผลการสอบได้");
            router.push("/user");
        } finally {
            setLoading(false);
        }
    }

    // สร้างข้อมูลสำหรับกราฟ
    const chartData = result?.responses.map((resp, index) => ({
        item: index + 1,
        theta: resp.theta_after,
        cutScore: 0.0,
    })) || [];

    // สร้างข้อมูล Normal Distribution
    const generateNormalDistData = (mean: number, sd: number) => {
        const data = [];
        for (let x = -4; x <= 4; x += 0.1) {
            const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(sd, 2));
            const y = Math.exp(exponent) / (sd * Math.sqrt(2 * Math.PI));
            data.push({ x: x.toFixed(1), y: y });
        }
        return data;
    };

    const normalDistData = result
        ? generateNormalDistData(result.final_theta, result.final_se)
        : [];

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-lg text-green-800">กำลังโหลดผลการสอบ...</p>
                </div>
            </div>
        );
    }

    if (!result) {
        return null;
    }

    const examDuration = result.end_time
        ? Math.floor(
            (new Date(result.end_time).getTime() -
                new Date(result.start_time).getTime()) /
            1000
        )
        : 0;
    const minutes = Math.floor(examDuration / 60);
    const seconds = examDuration % 60;
    const accuracy = ((result.num_correct / result.num_items) * 100).toFixed(1);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
            <Navbar_user />

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Result Header */}
                <div
                    className={`rounded-2xl shadow-2xl p-8 mb-8 ${result.passed
                        ? "bg-gradient-to-r from-green-500 to-green-600"
                        : "bg-gradient-to-r from-red-500 to-red-600"
                        }`}
                >
                    <div className="text-center text-white">
                        <div className="text-7xl mb-4">
                            {result.passed ? "🎉" : "💪"}
                        </div>
                        <h1 className="text-4xl font-bold mb-2">
                            {result.passed ? "ยินดีด้วย! คุณสอบผ่าน" : "ยังไม่ผ่านการสอบ"}
                        </h1>
                        <p className="text-xl opacity-90">{result.item_bank_name || "คลังข้อสอบรวม (Global Pool)"}</p>
                        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-white/20 rounded-xl p-4">
                                <div className="text-sm opacity-80">ความสามารถ (θ)</div>
                                <div className="text-3xl font-bold">
                                    {result.final_theta.toFixed(2)}
                                </div>
                            </div>
                            <div className="bg-white/20 rounded-xl p-4">
                                <div className="text-sm opacity-80">จำนวนข้อ</div>
                                <div className="text-3xl font-bold">{result.num_items}</div>
                            </div>
                            <div className="bg-white/20 rounded-xl p-4">
                                <div className="text-sm opacity-80">ความแม่นยำ</div>
                                <div className="text-3xl font-bold">{accuracy}%</div>
                            </div>
                            <div className="bg-white/20 rounded-xl p-4">
                                <div className="text-sm opacity-80">เวลาที่ใช้</div>
                                <div className="text-3xl font-bold">
                                    {minutes}:{seconds.toString().padStart(2, "0")}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Theta Progress Chart */}
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            📈 การเปลี่ยนแปลงของความสามารถ (θ)
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis
                                    dataKey="item"
                                    label={{ value: "ข้อที่", position: "insideBottom", offset: -5 }}
                                />
                                <YAxis
                                    label={{ value: "θ", angle: -90, position: "insideLeft" }}
                                    domain={[-4, 4]}
                                />
                                <Tooltip />
                                <Legend />
                                <ReferenceLine
                                    y={0}
                                    stroke="#FFA500"
                                    strokeDasharray="3 3"
                                    label="เส้นผ่าน"
                                />
                                <Line
                                    type="monotone"
                                    dataKey="theta"
                                    stroke="#10B981"
                                    strokeWidth={2}
                                    name="Theta (θ)"
                                    dot={{ fill: "#10B981", r: 4 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Normal Distribution Chart */}
                    <div className="bg-white rounded-2xl shadow-xl p-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-4">
                            📊 การกระจายความสามารถ
                        </h2>
                        <ResponsiveContainer width="100%" height={300}>
                            <AreaChart data={normalDistData}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="x" label={{ value: "θ", position: "insideBottom", offset: -5 }} />
                                <YAxis hide />
                                <Tooltip />
                                <Area
                                    type="monotone"
                                    dataKey="y"
                                    stroke="#10B981"
                                    fill="#10B981"
                                    fillOpacity={0.6}
                                />
                                <ReferenceLine
                                    x={result.final_theta.toFixed(1)}
                                    stroke="#EF4444"
                                    strokeWidth={2}
                                    label={{
                                        value: `คุณ: ${result.final_theta.toFixed(2)}`,
                                        position: "top",
                                    }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                        <p className="text-center text-gray-600 text-sm mt-2">
                            SE = {result.final_se.toFixed(3)} | เปอร์เซ็นต์ไทล์: {result.pass_percentile.toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Statistics */}
                <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">📊 สถิติการสอบ</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-xl">
                            <div className="text-3xl font-bold text-green-600">
                                {result.num_correct}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">ตอบถูก</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-xl">
                            <div className="text-3xl font-bold text-red-600">
                                {result.num_items - result.num_correct}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">ตอบผิด</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-xl">
                            <div className="text-3xl font-bold text-blue-600">
                                {result.final_se.toFixed(3)}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">Standard Error</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 rounded-xl">
                            <div className="text-3xl font-bold text-purple-600">
                                {result.pass_percentile.toFixed(0)}%
                            </div>
                            <div className="text-sm text-gray-600 mt-1">เปอร์เซ็นต์ไทล์</div>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-gray-50 rounded-xl">
                        <p className="text-gray-700">
                            <strong>เหตุผลที่จบการสอบ:</strong> {result.stop_reason}
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-4 justify-center">
                    <button
                        onClick={() => router.push("/user")}
                        className="px-8 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all duration-200"
                    >
                        ← กลับหน้าหลัก
                    </button>
                    <button
                        onClick={() => router.push("/user/cat-exam")}
                        className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200"
                    >
                        🔄 สอบใหม่อีกครั้ง
                    </button>
                </div>

                {/* Answer Review Section */}
                <div className="mt-12">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                        <BookOpen className="text-green-600" />
                        รีวิวคำตอบและคำอธิบาย
                    </h2>
                    <div className="space-y-6">
                        {result.responses.map((resp, index) => (
                            <div key={index} className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                {/* Question Header */}
                                <div className={`px-6 py-4 flex items-center justify-between ${resp.is_correct ? 'bg-green-50' : 'bg-red-50'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${resp.is_correct ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                            }`}>
                                            {index + 1}
                                        </div>
                                        <span className={`font-bold ${resp.is_correct ? 'text-green-700' : 'text-red-700'}`}>
                                            {resp.is_correct ? 'ถูกต้อง' : 'ไม่ถูกต้อง'}
                                        </span>
                                    </div>
                                    <div className="text-sm font-medium text-gray-500">
                                        ระดับความยากข้อนี้: {resp.theta_before?.toFixed(2) || 'N/A'}
                                    </div>
                                </div>

                                <div className="p-6">
                                    {/* Situation (if any) */}
                                    {resp.situation && (
                                        <div className="mb-4 p-4 bg-gray-50 rounded-xl border-l-4 border-blue-400">
                                            <div className="flex items-center gap-2 text-blue-600 font-bold mb-2">
                                                <Info size={18} />
                                                สถานการณ์
                                            </div>
                                            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                                                {resp.situation.situation_text}
                                            </div>
                                        </div>
                                    )}

                                    <h3 className="text-lg font-bold text-gray-800 mb-6 leading-relaxed">
                                        {resp.question_text}
                                    </h3>

                                    {/* Options */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
                                        {resp.answer_options?.map((option: any) => {
                                            const isSelected = option.option_id === resp.selected_option_id;
                                            const isCorrect = option.is_correct;

                                            let borderClass = "border-gray-200";
                                            let bgClass = "bg-white";
                                            let icon = null;

                                            if (isSelected && isCorrect) {
                                                borderClass = "border-green-500 ring-2 ring-green-100";
                                                bgClass = "bg-green-50";
                                                icon = <CheckCircle2 className="text-green-500" size={20} />;
                                            } else if (isSelected && !isCorrect) {
                                                borderClass = "border-red-500 ring-2 ring-red-100";
                                                bgClass = "bg-red-50";
                                                icon = <XCircle className="text-red-500" size={20} />;
                                            } else if (isCorrect) {
                                                borderClass = "border-green-500";
                                                bgClass = "bg-green-50/30";
                                                icon = <CheckCircle2 className="text-green-400" size={20} />;
                                            }

                                            return (
                                                <div
                                                    key={option.option_id}
                                                    className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between ${borderClass} ${bgClass}`}
                                                >
                                                    <span className={`flex-1 ${isSelected ? 'font-bold' : ''}`}>
                                                        {option.option_text}
                                                    </span>
                                                    {icon}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Explanation */}
                                    <div className="p-5 bg-blue-50/50 rounded-2xl border border-blue-100">
                                        <div className="flex items-center gap-2 text-blue-700 font-bold mb-3">
                                            <HelpCircle size={20} />
                                            คำอธิบาย
                                        </div>
                                        <p className="text-gray-700 leading-relaxed">
                                            {resp.explanation || 'ไม่มีคำอธิบายเพิ่มเติมสำหรับข้อนี้'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
