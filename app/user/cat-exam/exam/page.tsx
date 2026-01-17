"use client";

import React, { useState, useEffect } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { useRouter, useSearchParams } from "next/navigation";

// ==================== TYPES ====================
interface CATItem {
    item_id: number;
    question_text: string;
    question_type: string;
    irt_a_discrimination: number;
    irt_b_difficulty: number;
    irt_c_guessing: number;
    answer_options: Array<{
        option_id: number;
        option_text: string;
        is_correct: boolean;
    }>;
}

interface CATSession {
    session_id: number;
    item_bank_id: number;
    current_item: CATItem;
    current_theta: number;
    current_se: number;
    num_items: number;
    min_items: number;
    max_items: number;
}

// ==================== MAIN COMPONENT ====================
export default function CATExamPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const itemBankId = searchParams?.get("item_bank_id");

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<CATSession | null>(null);
    const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
    const [examStartTime, setExamStartTime] = useState<number>(0);
    const [elapsedTime, setElapsedTime] = useState(0);

    // Timer
    useEffect(() => {
        const interval = setInterval(() => {
            if (examStartTime > 0) {
                setElapsedTime(Math.floor((Date.now() - examStartTime) / 1000));
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [examStartTime]);

    // เริ่มการสอบ CAT
    useEffect(() => {
        if (!itemBankId) {
            alert("กรุณาเลือกชุดข้อสอบก่อน");
            router.push("/user/cat-exam/select");
            return;
        }
        startCATExam();
    }, [itemBankId]);

    async function startCATExam() {
        if (!itemBankId) return;

        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const response = await fetch("http://localhost:5000/cat/start", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    item_bank_id: parseInt(itemBankId),
                    min_items: 20,
                    max_items: 50,
                    target_se: 0.35,
                    cut_score: 0.0,
                    mode: "real",
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || "Failed to start CAT exam");
            }

            const data = await response.json();
            setSession(data);
            setExamStartTime(Date.now());
        } catch (error: any) {
            console.error("Error starting CAT exam:", error);
            alert(
                error.message || "ไม่สามารถเริ่มการสอบได้ กรุณาลองใหม่อีกครั้ง"
            );
            router.push("/user/cat-exam/select");
        } finally {
            setLoading(false);
        }
    }

    // ส่งคำตอบ
    async function submitAnswer() {
        if (!selectedOptionId || !session) {
            alert("กรุณาเลือกคำตอบ");
            return;
        }

        try {
            setLoading(true);
            const token = localStorage.getItem("token");

            const response = await fetch("http://localhost:5000/cat/submit-answer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    session_id: session.session_id,
                    item_id: session.current_item.item_id,
                    selected_option_id: selectedOptionId,
                    response_time_ms: elapsedTime * 1000,
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to submit answer");
            }

            const data = await response.json();

            if (data.finished) {
                // จบการสอบ - ไปหน้าผลการสอบ
                router.push(`/user/cat-exam/result/${session.session_id}`);
            } else {
                // ข้อถัดไป
                setSession({
                    ...session,
                    current_item: data.next_item,
                    current_theta: data.current_theta,
                    current_se: data.current_se,
                    num_items: data.num_items,
                });
                setSelectedOptionId(null);
            }
        } catch (error) {
            console.error("Error submitting answer:", error);
            alert("เกิดข้อผิดพลาดในการส่งคำตอบ");
        } finally {
            setLoading(false);
        }
    }

    // Format time
    function formatTime(seconds: number): string {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }

    // Calculate position for theta marker
    function calculateThetaPosition(theta: number): number {
        const minTheta = -4.0;
        const maxTheta = 4.0;
        const position = ((theta - minTheta) / (maxTheta - minTheta)) * 100;
        return Math.max(0, Math.min(100, position));
    }

    if (loading && !session) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-lg text-green-800">กำลังเริ่มการสอบ CAT...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
            <Navbar_user />

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-t-2xl px-8 py-6 text-white">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold mb-1">
                                🏥 การสอบแบบ CAT (Computerized Adaptive Testing)
                            </h1>
                            <p className="text-green-100 text-sm">
                                ระบบข้อสอบแบบปรับตัวตามความสามารถผู้สอบ
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-white/20 rounded-xl px-6 py-3 text-center">
                                <div className="text-xs opacity-90">ข้อที่</div>
                                <div className="text-2xl font-bold">{session.num_items}</div>
                            </div>

                            <div className="bg-white/20 rounded-xl px-6 py-3 text-center">
                                <div className="text-xs opacity-90">ความสามารถ (θ)</div>
                                <div className="text-2xl font-bold">
                                    {session.current_theta.toFixed(2)}
                                </div>
                            </div>

                            <div className="bg-white/20 rounded-xl px-6 py-3 text-center">
                                <div className="text-xs opacity-90">เวลา</div>
                                <div className="text-2xl font-bold">{formatTime(elapsedTime)}</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="bg-white px-8 py-6 border-b">
                    <div className="relative h-12">
                        <div className="absolute inset-0 flex">
                            <div className="flex-1 bg-gradient-to-r from-red-100 to-red-200 rounded-l-lg flex items-center justify-center border-2 border-red-300">
                                <span className="text-red-700 font-semibold text-sm">
                                    ❌ ไม่ผ่าน
                                </span>
                            </div>
                            <div className="flex-1 bg-gradient-to-r from-green-100 to-green-200 rounded-r-lg flex items-center justify-center border-2 border-green-300">
                                <span className="text-green-700 font-semibold text-sm">
                                    ✅ ผ่าน
                                </span>
                            </div>
                        </div>

                        {/* Cut Score Marker */}
                        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-yellow-500 transform -translate-x-1/2 z-10">
                            <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-yellow-500 text-white px-3 py-1 rounded text-xs font-bold whitespace-nowrap">
                                ⚡ เส้นผ่าน
                            </div>
                        </div>

                        {/* Theta Marker */}
                        <div
                            className="absolute top-1/2 transform -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-500"
                            style={{ left: `${calculateThetaPosition(session.current_theta)}%` }}
                        >
                            <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-white border-2 border-green-600 px-3 py-1 rounded-full text-xs font-bold text-green-700 whitespace-nowrap shadow-lg">
                                θ = {session.current_theta.toFixed(2)}
                            </div>
                            <div className="text-3xl filter drop-shadow-lg">
                                {session.current_theta >= 0 ? "✅" : "⚠️"}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-between text-sm text-gray-600">
                        <span>ข้อขั้นต่ำ: {session.min_items} ข้อ</span>
                        <span>ข้อสูงสุด: {session.max_items} ข้อ</span>
                    </div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{
                                width: `${Math.min((session.num_items / session.max_items) * 100, 100)}%`,
                            }}
                        ></div>
                    </div>
                </div>

                {/* Question Card */}
                <div className="bg-white rounded-b-2xl shadow-xl p-8">
                    <div className="mb-6">
                        <h2 className="text-xl font-semibold text-gray-800 mb-4">
                            {session.current_item.question_text}
                        </h2>
                    </div>

                    {/* Options */}
                    <div className="space-y-3 mb-8">
                        {session.current_item.answer_options.map((option, index) => (
                            <button
                                key={option.option_id}
                                onClick={() => setSelectedOptionId(option.option_id)}
                                disabled={loading}
                                className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${selectedOptionId === option.option_id
                                    ? "border-green-500 bg-green-50"
                                    : "border-gray-200 hover:border-green-300 hover:bg-green-50/50"
                                    } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                                <div
                                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${selectedOptionId === option.option_id
                                        ? "bg-green-500 text-white"
                                        : "bg-gray-100 text-gray-600"
                                        }`}
                                >
                                    {String.fromCharCode(65 + index)}
                                </div>
                                <span className="flex-1 text-gray-700">{option.option_text}</span>
                            </button>
                        ))}
                    </div>

                    {/* Submit Button */}
                    <button
                        onClick={submitAnswer}
                        disabled={!selectedOptionId || loading}
                        className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                กำลังประมวลผล...
                            </span>
                        ) : (
                            "ส่งคำตอบ →"
                        )}
                    </button>
                </div>
            </div>

            <Footer />

            {/* Loading Overlay */}
            {loading && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-8 text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                        <p className="text-lg text-gray-700">กำลังคำนวณข้อสอบถัดไป...</p>
                    </div>
                </div>
            )}
        </div>
    );
}
