"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Loader2, Clock, Hash } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";

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
    situation_title?: string;
    situation_text: string;
    situation_image_url?: string;
  };
  sub_topics?: Array<{
    sub_topic_id: number;
    sub_topic_name: string;
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
  target_se?: number;
}

interface StopModalData {
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

function thetaToPercent(theta: number): number {
  return Math.max(0, Math.min(100, ((theta - THETA_MIN) / (THETA_MAX - THETA_MIN)) * 100));
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

// ==================== MOUNTAIN COMPONENT ====================
function MountainClimb({ theta, direction }: { theta: number; direction: "up" | "down" | null }) {
  const pct = thetaToPercent(theta);

  // Climber position on left slope
  // Base of left slope: (28, 162), Peak: (100, 28)
  const climberX = 28 + (pct / 100) * 72;
  const climberY = 162 - (pct / 100) * 134;

  // Zone colour based on theta
  const getZone = (t: number) => {
    if (t >= 2) return { label: "ยอดภูเขา!", emoji: "🏆", fill: "#6366f1", text: "text-indigo-700" };
    if (t >= 1) return { label: "ระดับสูง", emoji: "⭐", fill: "#3b82f6", text: "text-blue-700" };
    if (t >= 0) return { label: "กำลังดี", emoji: "💪", fill: "#22c55e", text: "text-green-700" };
    if (t >= -1) return { label: "ปานกลาง", emoji: "🎯", fill: "#f59e0b", text: "text-amber-700" };
    if (t >= -2) return { label: "ต้องพัฒนา", emoji: "📚", fill: "#f97316", text: "text-orange-700" };
    return { label: "เริ่มต้นใหม่!", emoji: "🔄", fill: "#ef4444", text: "text-red-700" };
  };
  const zone = getZone(theta);

  return (
    <div className="text-center">
      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">ระดับความสามารถ</p>

      {/* SVG Mountain */}
      <svg viewBox="0 0 200 185" className="w-full max-h-[180px] mx-auto" role="img" aria-label="mountain progress">
        <defs>
          <linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#bfdbfe" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
          <clipPath id="mtClip">
            <path d="M 100,26 L 178,166 L 22,166 Z" />
          </clipPath>
        </defs>

        {/* Sky */}
        <rect width="200" height="185" fill="url(#skyG)" rx="10" />

        {/* Mountain base */}
        <path d="M 100,26 L 178,166 L 22,166 Z" fill="#94a3b8" />

        {/* Coloured fill up to climber height */}
        <rect
          x="0"
          y={climberY}
          width="200"
          height={166 - climberY}
          fill={zone.fill}
          opacity="0.72"
          clipPath="url(#mtClip)"
        />

        {/* Dashed trail on left slope */}
        <path d="M 28,162 L 100,26" stroke="white" strokeWidth="1.5" strokeDasharray="4,3" opacity="0.65" />

        {/* Snow cap */}
        <path d="M 100,26 L 118,62 L 82,62 Z" fill="white" opacity="0.92" />

        {/* Ground strip */}
        <rect x="0" y="166" width="200" height="19" fill="#86efac" rx="0" />

        {/* Height marker dotted line */}
        <line
          x1={climberX + 14}
          y1={climberY - 2}
          x2="178"
          y2={climberY - 2}
          stroke={zone.fill}
          strokeWidth="1"
          strokeDasharray="3,3"
          opacity="0.7"
        />

        {/* Direction arrow */}
        {direction === "up" && (
          <text x="160" y={climberY - 8} fontSize="16" fill="#16a34a" fontWeight="bold">↑</text>
        )}
        {direction === "down" && (
          <text x="160" y={climberY + 14} fontSize="16" fill="#dc2626" fontWeight="bold">↓</text>
        )}

        {/* Climber 🧗 */}
        <text
          x={climberX - 10}
          y={climberY + 5}
          fontSize="20"
          style={{ userSelect: "none" }}
        >
          🧗
        </text>

        {/* Theta label at climber */}
        <rect x={climberX + 10} y={climberY - 18} width="36" height="14" rx="3" fill="white" opacity="0.85" />
        <text x={climberX + 28} y={climberY - 7} fontSize="9" fill="#374151" textAnchor="middle" fontWeight="600">
          {theta.toFixed(2)}
        </text>
      </svg>

      {/* Zone label */}
      <div className="mt-2 space-y-0.5">
        <p className={`text-sm font-bold ${zone.text}`}>
          {zone.emoji} {zone.label}
        </p>
        {direction === "up" && (
          <p className="text-xs font-semibold text-green-600 animate-bounce">↑ ปีนขึ้น!</p>
        )}
        {direction === "down" && (
          <p className="text-xs font-semibold text-red-500 animate-bounce">↓ ตกลงมา...</p>
        )}
      </div>
    </div>
  );
}

// ==================== STOP MODAL ====================
function StopModal({ data, onContinue }: { data: StopModalData; onContinue: () => void }) {
  if (!data.show) return null;
  const passed = data.passed === true;
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center border-t-8 ${passed ? "border-green-500" : "border-blue-500"}`}>
        <div className="text-5xl mb-4">{passed ? "🎉" : "📊"}</div>
        <h2 className="text-2xl font-bold mb-2 text-gray-800">การสอบเสร็จสิ้น</h2>
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
          className={`w-full py-3 rounded-xl font-semibold text-white transition-all shadow-lg hover:shadow-xl ${passed ? "bg-green-600 hover:bg-green-700" : "bg-blue-600 hover:bg-blue-700"}`}
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
  const [thetaDirection, setThetaDirection] = useState<"up" | "down" | null>(null);
  const prevThetaRef = useRef<number | null>(null);
  const directionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [stopModal, setStopModal] = useState<StopModalData>({
    show: false, reason: "", passed: null, final_theta: 0, final_se: 0, num_items: 0, session_id: 0,
  });
  const sessionIdRef = useRef<number | null>(null);
  const submittedRef = useRef(false);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      if (examStartTime > 0) setElapsedTime(Math.floor((Date.now() - examStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [examStartTime]);

  // Detect theta direction change
  useEffect(() => {
    if (!session) return;
    const cur = session.current_theta;
    if (prevThetaRef.current !== null) {
      const diff = cur - prevThetaRef.current;
      if (Math.abs(diff) > 0.001) {
        setThetaDirection(diff > 0 ? "up" : "down");
        if (directionTimerRef.current) clearTimeout(directionTimerRef.current);
        directionTimerRef.current = setTimeout(() => setThetaDirection(null), 2500);
      }
    }
    prevThetaRef.current = cur;
  }, [session?.current_theta]);

  // Cancel session if user leaves without finishing
  useEffect(() => {
    if (!sessionIdRef.current) return;
    const sessionId = sessionIdRef.current;

    let cancelAllowed = false;
    const allowTimer = setTimeout(() => { cancelAllowed = true; }, 300);

    const doCancel = () => {
      if (submittedRef.current) return;
      if (!cancelAllowed) return;
      const token = getToken();
      if (!token) return;
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/cat/session/${sessionId}/cancel`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
        keepalive: true,
      }).catch(() => { });
    };

    window.addEventListener('beforeunload', doCancel);
    return () => {
      clearTimeout(allowTimer);
      doCancel();
      window.removeEventListener('beforeunload', doCancel);
    };
  }, [sessionIdRef.current, getToken]);

  // Start / Resume exam
  useEffect(() => {
    if (urlSessionId) {
      resumeCATSession(parseInt(urlSessionId));
    } else if (itemBankId) {
      startCATExam();
    } else {
      Swal.fire({ title: "เกิดข้อผิดพลาด", text: "ชื่อเซสชันไม่ถูกต้อง กรุณาเลือกการสอบใหม่", icon: "error", confirmButtonColor: "#ef4444" }).then(() => {
        router.push("/user/cat-exam");
      });
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
      sessionIdRef.current = data.session_id;
      setExamStartTime(Date.now());
    } catch {
      await Swal.fire({ title: "เกิดข้อผิดพลาด", text: "ไม่สามารถโหลดเซสชันการสอบเดิมได้", icon: "error", confirmButtonColor: "#ef4444" });
      router.push("/user/cat-exam");
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
        body: JSON.stringify({ item_bank_id: parseInt(itemBankId), min_items: 20, max_items: 50, target_se: 0.35, cut_score: 0.0, mode: "real" }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to start CAT exam");
      }
      const data = await res.json();
      setSession(data);
      sessionIdRef.current = data.session_id;
      setExamStartTime(Date.now());
    } catch (e: any) {
      await Swal.fire({ title: "เกิดข้อผิดพลาด", text: e.message || "ไม่สามารถเริ่มการสอบได้ กรุณาลองใหม่อีกครั้ง", icon: "error", confirmButtonColor: "#ef4444" });
      router.push("/user/cat-exam");
    } finally {
      setLoading(false);
    }
  }


  async function submitAnswer() {
    if (!selectedOptionId || !session) {
      Swal.fire({ title: "กรุณาเลือกคำตอบ", icon: "warning", confirmButtonColor: "#22c55e", confirmButtonText: "ตกลง" });
      return;
    }
    try {
      setLoading(true);
      const token = getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cat/submit-answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ session_id: session.session_id, item_id: session.current_item.item_id, selected_option_id: selectedOptionId, response_time_ms: elapsedTime * 1000 }),
      });
      if (!res.ok) throw new Error("Failed to submit answer");
      const data = await res.json();
      if (data.finished) {
        setStopModal({ show: true, reason: data.stop_reason || "การสอบเสร็จสิ้น", passed: data.passed ?? null, final_theta: data.final_theta ?? session.current_theta, final_se: data.final_se ?? session.current_se, num_items: data.num_items ?? session.num_items, session_id: session.session_id });
      } else {
        setSession(prev => prev ? { ...prev, current_item: data.next_item, current_theta: data.current_theta, current_se: data.current_se, num_items: data.num_items } : prev);
        setSelectedOptionId(null);
      }
    } catch {
      Swal.fire({ title: "เกิดข้อผิดพลาด", text: "เกิดข้อผิดพลาดในการส่งคำตอบ", icon: "error", confirmButtonColor: "#ef4444" });
    } finally {
      setLoading(false);
    }
  }

  const handleStopModalContinue = useCallback(() => {
    router.push(`/user/cat-exam/result/${stopModal.session_id}`);
  }, [router, stopModal.session_id]);

  // ─── Loading state ───────────────────────────────
  if (loading && !session) {
    return (
      <>
        <Navbar_user />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-600 font-medium">กำลังเริ่มการสอบ CAT...</p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (!session) return null;

  const progressPct = Math.min((session.num_items / session.max_items) * 100, 100);

  // ─── UI ──────────────────────────────────────────
  return (
    <>
      <Navbar_user />

      <div className="min-h-screen bg-gray-50 py-5">
        <div className="container mx-auto px-4 max-w-5xl">

          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Link href="/user" className="hover:text-green-600 transition">หน้าหลัก</Link>
            <span className="mx-2">›</span>
            <Link href="/user/cat-exam" className="hover:text-green-600 transition">สอบแบบปรับตัว</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-700 font-medium">กำลังสอบ</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

            {/* ─── Main Content (Left) ─── */}
            <div className="lg:col-span-2 space-y-4">

              {/* STEP 1: Situation */}
              {session.current_item.situation && (
                <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-blue-700">สถานการณ์</span>
                  </div>
                  <div className="p-5">
                    {session.current_item.situation.situation_title && (
                      <p className="font-bold text-gray-800 mb-2">
                        {session.current_item.situation.situation_title}
                      </p>
                    )}
                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm lg:text-base">
                      {session.current_item.situation.situation_text}
                    </p>
                    {session.current_item.situation.situation_image_url && (
                      <img
                        src={session.current_item.situation.situation_image_url.startsWith("http")
                          ? session.current_item.situation.situation_image_url
                          : `${process.env.NEXT_PUBLIC_API_URL}${session.current_item.situation.situation_image_url}`}
                        alt="situation"
                        className="mt-4 rounded-lg max-w-full border border-gray-200"
                      />
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: Question + STEP 3: Options (same card) */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                {/* Question header */}
                <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-xs font-bold text-white bg-gray-500 px-2.5 py-1 rounded-full">
                      ข้อ {session.num_items + 1}
                    </span>
                    {session.current_item.sub_topics && session.current_item.sub_topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {session.current_item.sub_topics.map(st => (
                          <span key={st.sub_topic_id} className="text-xs font-medium bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full border border-green-100">
                            {st.sub_topic_name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Question text */}
                  <p className="text-base lg:text-lg text-gray-800 leading-relaxed font-medium whitespace-pre-wrap">
                    {session.current_item.question_text}
                  </p>
                </div>

                {/* Options */}
                <div className="px-6 py-5">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">เลือกคำตอบ</p>
                  <div className="space-y-2.5">
                    {session.current_item.answer_options.map((option, index) => {
                      const isSelected = selectedOptionId === option.option_id;
                      const label = ["ก", "ข", "ค", "ง", "จ"][index] || String.fromCharCode(65 + index);
                      return (
                        <button
                          key={option.option_id}
                          onClick={() => setSelectedOptionId(option.option_id)}
                          disabled={loading}
                          className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-150 flex items-start gap-3 group ${isSelected
                            ? "border-green-500 bg-green-50 shadow-sm"
                            : "border-gray-200 hover:border-green-300 bg-white hover:bg-green-50/40"
                            } ${loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          {/* Radio dot */}
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${isSelected ? "border-green-500 bg-green-500" : "border-gray-300 group-hover:border-green-400"
                            }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                          </div>

                          {/* Label badge */}
                          <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 transition-colors ${isSelected ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-700"
                            }`}>
                            {label}
                          </span>

                          <span className="text-gray-800 text-sm lg:text-base leading-relaxed">
                            {option.option_text}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ─── Sidebar (Right) ─── */}
            <div className="lg:col-span-1">
              <div className="sticky top-5 space-y-4">

                {/* Mountain progress card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <MountainClimb theta={session.current_theta} direction={thetaDirection} />
                </div>

                {/* Stats card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-4 space-y-3">
                  {/* Answered / Timer */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Hash className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">ตอบแล้ว</span>
                      </div>
                      <p className="text-xl font-bold text-gray-800">{session.num_items}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-xs text-gray-500">เวลา</span>
                      </div>
                      <p className="text-xl font-bold text-blue-600 font-mono">{formatTime(elapsedTime)}</p>
                    </div>
                  </div>

                  {/* Mountain progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>ความคืบหน้า</span>
                      <span className="font-semibold text-gray-700">{session.num_items} / {session.max_items} ข้อ</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                      <span>เริ่ม</span>
                      <span>สูงสุด {session.max_items} ข้อ</span>
                    </div>
                  </div>
                </div>

                {/* Submit button */}
                <button
                  onClick={submitAnswer}
                  disabled={!selectedOptionId || loading}
                  className="w-full py-3.5 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-xl transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      กำลังคำนวณ...
                    </>
                  ) : (
                    "ส่งคำตอบและถัดไป →"
                  )}
                </button>

                {!selectedOptionId && !loading && (
                  <p className="text-xs text-center text-gray-400">เลือกคำตอบก่อนกดส่ง</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />

      {/* Loading Overlay */}
      {loading && session && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl p-6 text-center shadow-2xl">
            <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">กำลังคำนวณข้อถัดไปเพื่อคุณ...</p>
          </div>
        </div>
      )}

      {/* Stop Modal */}
      <StopModal data={stopModal} onContinue={handleStopModalContinue} />
    </>
  );
}
