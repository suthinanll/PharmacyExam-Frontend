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
                `http://localhost:3001/cat/session/${sessionId}/result`,
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
                        <p className="text-xl opacity-90">{result.item_bank_name}</p>
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
            </div>

            <Footer />
        </div>
    );
}
