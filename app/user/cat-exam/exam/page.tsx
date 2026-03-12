"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

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
    situation?: {
        situation_id: number;
        situation_text: string;
        situation_image_url?: string;
    };
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
    target_se?: number;
}

interface StopModal {
    show: boolean;
    reason: string;
    passed: boolean | null;
    final_theta: number;
    final_se: number;
    num_items: number;
    session_id: number;
}

// ==================== HELPERS ====================
const THETA_MIN = -4.0;
const THETA_MAX = 4.0;
const DEFAULT_TARGET_SE = 0.35;

function thetaToPercent(theta: number): number {
    return Math.max(0, Math.min(100, ((theta - THETA_MIN) / (THETA_MAX - THETA_MIN)) * 100));
}

function formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// ==================== SUB-COMPONENTS ====================

/** Theta Track with CI Band — CATsim hallmark */
function ThetaTrack({ theta, se, cutScore = 0 }: { theta: number; se: number; cutScore?: number }) {
    const z = 1.96;
    const ciLow = thetaToPercent(theta - z * se);
    const ciHigh = thetaToPercent(theta + z * se);
    const thetaPct = thetaToPercent(theta);
    const cutPct = thetaToPercent(cutScore);

    return (
        <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>θ = {THETA_MIN}</span>
                <span className="font-semibold text-gray-700">ตำแหน่งความสามารถ (θ)</span>
                <span>θ = {THETA_MAX}</span>
            </div>

            {/* Track */}
            <div className="relative h-10 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                {/* Fail zone */}
                <div
                    className="absolute inset-y-0 left-0 bg-red-100"
                    style={{ width: `${cutPct}%` }}
                />
                {/* Pass zone */}
                <div
                    className="absolute inset-y-0 right-0 bg-green-100"
                    style={{ left: `${cutPct}%` }}
                />

                {/* 95% CI Band — CATsim standard */}
                <div
                    className="absolute inset-y-0 bg-blue-300/50 border-x-2 border-blue-400 transition-all duration-500"
                    style={{ left: `${ciLow}%`, width: `${ciHigh - ciLow}%` }}
                    title={`95% CI: [${(theta - z * se).toFixed(2)}, ${(theta + z * se).toFixed(2)}]`}
                />

                {/* Cut score line */}
                <div
                    className="absolute inset-y-0 w-0.5 bg-yellow-500 z-10"
                    style={{ left: `${cutPct}%` }}
                />

                {/* Theta marker */}
                <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 transition-all duration-500"
                    style={{ left: `${thetaPct}%` }}
                >
                    <div className="w-6 h-6 rounded-full bg-blue-600 border-2 border-white shadow-lg flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                </div>
            </div>

            {/* Labels */}
            <div className="flex justify-between mt-1 text-xs">
                <span className="text-red-500 font-medium">❌ ไม่ผ่าน</span>
                <span className="text-blue-600 font-medium">
                    θ = {theta.toFixed(2)} &nbsp;|&nbsp; 95% CI [{(theta - z * se).toFixed(2)}, {(theta + z * se).toFixed(2)}]
                </span>
                <span className="text-green-600 font-medium">✅ ผ่าน</span>
            </div>
        </div>
    );
}

/** SE Precision Gauge — shows how close current SE is to target */
function SEPrecisionGauge({ currentSE, targetSE }: { currentSE: number; targetSE: number }) {
    // SE starts at 999 (no info) and we want it to reach targetSE
    // Visual: invert — high SE = low fill, low SE = high fill
    const MAX_SE_DISPLAY = 1.5;
    const clamped = Math.min(currentSE, MAX_SE_DISPLAY);
    const fillPct = Math.max(0, Math.min(100, ((MAX_SE_DISPLAY - clamped) / (MAX_SE_DISPLAY - targetSE)) * 100));
    const isGood = currentSE <= targetSE;

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="text-xs text-gray-500 font-medium">ความแม่นยำ</div>
            <div className="relative w-16 h-16">
                {/* Background circle */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                    <circle
                        cx="18" cy="18" r="15.9" fill="none"
                        stroke={isGood ? "#22c55e" : "#3b82f6"}
                        strokeWidth="3"
                        strokeDasharray={`${fillPct} 100`}
                        strokeLinecap="round"
                        className="transition-all duration-700"
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className={`text-xs font-bold ${isGood ? "text-green-600" : "text-blue-600"}`}>
                        {isGood ? "✓" : `${Math.round(fillPct)}%`}
                    </span>
                </div>
            </div>
            <div className="text-xs text-gray-400">
                SE = {currentSE >= 999 ? "∞" : currentSE.toFixed(2)}
            </div>
            <div className="text-xs text-gray-400">
                เป้า ≤ {targetSE}
            </div>
        </div>
    );
}

/** Stopping Reason Modal */
function StopModal({ data, onContinue }: { data: StopModal; onContinue: () => void }) {
    if (!data.show) return null;

    const passed = data.passed === true;
    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border-t-8 ${passed ? "border-green-500" : "border-blue-500"}`}>
                <div className="text-5xl mb-4">{passed ? "🎉" : "📊"}</div>
                <h2 className="text-2xl font-bold mb-2 text-gray-800">การสอบเสร็จสิ้น</h2>

                {/* Stop reason */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6 ${passed ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                    <span>⚡</span>
                    <span>{data.reason}</span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                    <div className="bg-gray-50 rounded-xl p-3">
                        <div className="text-2xl font-bold text-gray-800">{data.num_items}</div>
                        <div className="text-xs text-gray-500 mt-1">ข้อที่ตอบ</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                        <div className="text-2xl font-bold text-blue-600">{data.final_theta.toFixed(2)}</div>
                        <div className="text-xs text-gray-500 mt-1">θ สุดท้าย</div>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3">
                        <div className="text-2xl font-bold text-purple-600">{data.final_se.toFixed(2)}</div>
                        <div className="text-xs text-gray-500 mt-1">SE สุดท้าย</div>
                    </div>
                </div>

                <button
                    onClick={onContinue}
                    className={`w-full py-3 rounded-xl font-semibold text-white transition-all duration-200 shadow-lg hover:shadow-xl ${passed ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
                >
                    ดูผลการสอบโดยละเอียด →
                </button>
            </div>
        </div>
    );
}

// ==================== MAIN COMPONENT ====================
export default function CATExamPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { getToken } = useAuth();
    const itemBankId = searchParams?.get("item_bank_id");
    const urlSessionId = searchParams?.get("session_id");

    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<CATSession | null>(null);
    const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
    const [examStartTime, setExamStartTime] = useState<number>(0);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [stopModal, setStopModal] = useState<StopModal>({
        show: false, reason: "", passed: null,
        final_theta: 0, final_se: 0, num_items: 0, session_id: 0,
    });

    // Timer
    useEffect(() => {
        const interval = setInterval(() => {
            if (examStartTime > 0) {
                setElapsedTime(Math.floor((Date.now() - examStartTime) / 1000));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [examStartTime]);

    // Start / Resume
    useEffect(() => {
        if (urlSessionId) {
            resumeCATSession(parseInt(urlSessionId));
        } else if (itemBankId) {
            startCATExam();
        } else {
            alert("ชื่อเซสชันไม่ถูกต้อง กรุณาเลือกการสอบใหม่");
            router.push("/user/cat-exam/select");
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [itemBankId, urlSessionId]);

    async function resumeCATSession(sessionId: number) {
        try {
            setLoading(true);
            const token = getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cat/session/${sessionId}/next-item`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error("Failed to resume");
            const data = await res.json();
            setSession(data);
            setExamStartTime(Date.now());
        } catch {
            alert("ไม่สามารถโหลดเซสชันการสอบเดิมได้");
            router.push("/user/cat-exam/select");
        } finally {
            setLoading(false);
        }
    }

    async function startCATExam() {
        if (!itemBankId) return;
        try {
            setLoading(true);
            const token = getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cat/start`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    item_bank_id: parseInt(itemBankId),
                    min_items: 20,
                    max_items: 50,
                    target_se: 0.35,
                    cut_score: 0.0,
                    mode: "real",
                }),
            });
            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "Failed to start CAT exam");
            }
            const data = await res.json();
            setSession(data);
            setExamStartTime(Date.now());
        } catch (e: any) {
            alert(e.message || "ไม่สามารถเริ่มการสอบได้ กรุณาลองใหม่อีกครั้ง");
            router.push("/user/cat-exam/select");
        } finally {
            setLoading(false);
        }
    }

    async function submitAnswer() {
        if (!selectedOptionId || !session) {
            alert("กรุณาเลือกคำตอบ");
            return;
        }

        try {
            setLoading(true);
            const token = getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cat/submit-answer`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    session_id: session.session_id,
                    item_id: session.current_item.item_id,
                    selected_option_id: selectedOptionId,
                    response_time_ms: elapsedTime * 1000,
                }),
            });

            if (!res.ok) throw new Error("Failed to submit answer");
            const data = await res.json();

            if (data.finished) {
                // Show stop reason modal before redirecting
                setStopModal({
                    show: true,
                    reason: data.stop_reason || "การสอบเสร็จสิ้น",
                    passed: data.passed ?? null,
                    final_theta: data.final_theta ?? session.current_theta,
                    final_se: data.final_se ?? session.current_se,
                    num_items: data.num_items ?? session.num_items,
                    session_id: session.session_id,
                });
            } else {
                setSession((prev) => prev ? {
                    ...prev,
                    current_item: data.next_item,
                    current_theta: data.current_theta,
                    current_se: data.current_se,
                    num_items: data.num_items,
                } : prev);
                setSelectedOptionId(null);
            }
        } catch {
            alert("เกิดข้อผิดพลาดในการส่งคำตอบ");
        } finally {
            setLoading(false);
        }
    }

    const handleStopModalContinue = useCallback(() => {
        router.push(`/user/cat-exam/result/${stopModal.session_id}`);
    }, [router, stopModal.session_id]);

    // ─── Loading state ───────────────────────────────────────────────
    if (loading && !session) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
                    <p className="text-lg text-blue-800">กำลังเริ่มการสอบ CAT...</p>
                </div>
            </div>
        );
    }

    if (!session) return null;

    const targetSE = session.target_se ?? DEFAULT_TARGET_SE;

    // ─── UI ─────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
            <Navbar_user />

            <div className="container mx-auto px-4 py-8 max-w-4xl">

                {/* ── Header ────────────────────────────────────────── */}
                <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-t-2xl px-6 py-5 text-white">
                    <div className="flex flex-wrap justify-between items-center gap-4">
                        <div>
                            <h1 className="text-xl font-bold">🧠 CAT — Computerized Adaptive Testing</h1>
                            <p className="text-blue-200 text-xs mt-0.5">ระบบเลือกข้อสอบอัตโนมัติตามความสามารถของคุณ&nbsp;·&nbsp;
                                <span className="font-semibold text-white">ไม่สามารถย้อนกลับแก้คำตอบได้</span>
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <Stat label="ข้อที่" value={`${session.num_items + 1}`} />
                            <Stat label="θ" value={session.current_theta.toFixed(2)} highlight />
                            <Stat label="เวลา" value={formatTime(elapsedTime)} />
                        </div>
                    </div>
                </div>

                {/* ── Measurement Panel (SE Gauge + Theta Track) ──── */}
                <div className="bg-white border-x border-b px-6 py-5">
                    <div className="flex gap-6 items-center">
                        {/* SE Precision Gauge */}
                        <SEPrecisionGauge currentSE={session.current_se} targetSE={targetSE} />

                        {/* Theta Track with CI Band */}
                        <div className="flex-1">
                            <ThetaTrack
                                theta={session.current_theta}
                                se={session.current_se}
                                cutScore={0}
                            />
                            {/* Item count progress */}
                            <div className="mt-3 flex items-center gap-2">
                                <span className="text-xs text-gray-400 w-28">ความคืบหน้าข้อสอบ</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                                    <div
                                        className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300"
                                        style={{ width: `${Math.min((session.num_items / session.max_items) * 100, 100)}%` }}
                                    />
                                </div>
                                <span className="text-xs text-gray-400">
                                    {session.num_items}/{session.max_items}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Question Card ────────────────────────────────── */}
                <div className="bg-white rounded-b-2xl shadow-xl px-8 py-8 border-x border-b">

                    {/* Situation */}
                    {session.current_item.situation && (
                        <div className="mb-6 p-5 bg-blue-50 rounded-xl border-l-4 border-blue-500">
                            <h3 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">สถานการณ์</h3>
                            <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                                {session.current_item.situation.situation_text}
                            </div>
                            {session.current_item.situation.situation_image_url && (
                                <div className="mt-4 flex justify-center">
                                    <img
                                        src={session.current_item.situation.situation_image_url.startsWith("http")
                                            ? session.current_item.situation.situation_image_url
                                            : `${process.env.NEXT_PUBLIC_API_URL}${session.current_item.situation.situation_image_url}`}
                                        alt="Situation"
                                        className="max-h-72 rounded-lg shadow object-contain"
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Question */}
                    <h2 className="text-lg font-semibold text-gray-800 mb-5 leading-relaxed">
                        {session.current_item.question_text}
                    </h2>

                    {/* Options */}
                    <div className="space-y-3 mb-8">
                        {session.current_item.answer_options.map((option, index) => (
                            <button
                                key={option.option_id}
                                onClick={() => setSelectedOptionId(option.option_id)}
                                disabled={loading}
                                className={`w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-150 flex items-center gap-4
                                    ${selectedOptionId === option.option_id
                                        ? "border-blue-500 bg-blue-50 shadow-sm"
                                        : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/40"
                                    } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                            >
                                <div className={`w-9 h-9 shrink-0 rounded-full flex items-center justify-center font-bold text-sm
                                    ${selectedOptionId === option.option_id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-600"}`}>
                                    {String.fromCharCode(65 + index)}
                                </div>
                                <span className="flex-1 text-gray-700">{option.option_text}</span>
                            </button>
                        ))}
                    </div>

                    {/* Submit */}
                    <button
                        onClick={submitAnswer}
                        disabled={!selectedOptionId || loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-xl font-semibold text-base hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                    >
                        {loading
                            ? <span className="flex items-center justify-center gap-2">
                                <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                                กำลังคำนวณข้อถัดไป...
                            </span>
                            : "ยืนยันคำตอบ →"
                        }
                    </button>
                </div>
            </div>

            <Footer />

            {/* Loading Overlay */}
            {loading && session && (
                <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-40">
                    <div className="bg-white rounded-2xl p-6 text-center shadow-2xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3" />
                        <p className="text-gray-700 font-medium">กำลังคำนวณข้อถัดไป...</p>
                    </div>
                </div>
            )}

            {/* Stopping Reason Modal */}
            <StopModal data={stopModal} onContinue={handleStopModalContinue} />
        </div>
    );
}

// Tiny stat card used in header
function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
    return (
        <div className="bg-white/20 rounded-xl px-5 py-2.5 text-center min-w-[80px]">
            <div className="text-xs opacity-80">{label}</div>
            <div className={`text-xl font-bold ${highlight ? "text-yellow-300" : ""}`}>{value}</div>
        </div>
    );
}
