"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Loader2, Clock, Hash, Award, AlertTriangle, FlaskConical, X } from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";

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
    option_image_url?: string;
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
  question_image_url?: string;
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

function stripHTML(html: string): string {
  if (typeof window === 'undefined') return html;
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

// ==================== BEAKER COMPONENT ====================
function LabBeaker({ theta, dropTrigger, finalStatus = null }: {
  theta: number;
  dropTrigger: { correct: boolean; id: number } | null;
  finalStatus?: "passed" | "failed" | null;
}) {
  const THETA_MIN = -4.0;
  const THETA_MAX = 4.0;
  const LIQUID_BOTTOM = 350;
  const LIQUID_TOP_MAX = 120;

  const thetaToLiquidTop = (t: number) => {
    const pct = Math.max(5, Math.min(95, ((t - THETA_MIN) / (THETA_MAX - THETA_MIN)) * 100));
    return LIQUID_BOTTOM - ((pct / 100) * (LIQUID_BOTTOM - LIQUID_TOP_MAX));
  };

  // ── displayedTheta ควบคุมระดับน้ำจริง (animate แยกจาก theta prop) ──
  const [displayedTheta, setDisplayedTheta] = React.useState(theta);
  const targetThetaRef = React.useRef(theta);   // theta ล่าสุดที่ได้รับ
  const fromThetaRef = React.useRef(theta);     // theta ก่อนตอบ (จุดเริ่ม animate level)

  // Track theta ใหม่เข้า ref โดยไม่ update ระดับน้ำทันที
  React.useEffect(() => {
    targetThetaRef.current = theta;
  }, [theta]);

  // liquidTop คำนวณจาก displayedTheta เท่านั้น
  const liquidTop = thetaToLiquidTop(displayedTheta);

  const [colorState, setColorState] = React.useState<"neutral" | "correct" | "incorrect">("neutral");

  const finalStatusRef = React.useRef(finalStatus);
  React.useEffect(() => {
    finalStatusRef.current = finalStatus;
  }, [finalStatus]);

  React.useEffect(() => {
    if (finalStatus === "passed") {
      setColorState("correct");
    } else if (finalStatus === "failed") {
      setColorState("incorrect");
    }
  }, [finalStatus]);

  let liquidLight = "#93c5fd";
  let liquidMid = "#60a5fa";
  let liquidDark = "#3b82f6";

  if (colorState === "correct") {
    liquidLight = "#a7f3d0";
    liquidMid = "#34d399";
    liquidDark = "#059669";
  } else if (colorState === "incorrect") {
    liquidLight = "#fecaca";
    liquidMid = "#f87171";
    liquidDark = "#dc2626";
  }

  const isFinal = finalStatus !== null;
  const transitionStyle = {
    transition: isFinal
      ? "stop-color 1.5s ease-in-out, fill 1.5s ease-in-out"
      : (colorState === "neutral" ? "stop-color 0.8s ease" : "stop-color 0.15s ease-out")
  };

  const DROP_START_Y = 55;
  const DROP_DURATION = 650;
  const SPLASH_DURATION = 450;
  const LEVEL_DURATION = 700; // animate ระดับน้ำขึ้น/ลง

  const [drop, setDrop] = React.useState<{
    y: number; opacity: number; color: string;
    splashRx: number; splashOpacity: number;
  } | null>(null);

  const rafRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    if (finalStatusRef.current !== null) {
      setColorState(finalStatusRef.current === "passed" ? "correct" : "incorrect");
      return;
    }
    if (!dropTrigger) {
      setColorState("neutral");
      return;
    }

    // จับ displayedTheta ณ ตอนนี้ (ก่อนตอบ) เป็นจุดเริ่ม animate level
    fromThetaRef.current = displayedTheta;

    const color = dropTrigger.correct ? "#22c55e" : "#ef4444";
    const dropEndY = liquidTop;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

    const startTime = performance.now();

    // ── Phase 1: Drop falls ──
    const animDrop = (now: number) => {
      const t = Math.min((now - startTime) / DROP_DURATION, 1);
      const eased = t * t;
      const y = DROP_START_Y + (dropEndY - DROP_START_Y) * eased;
      const opacity = t > 0.75 ? 0.9 * (1 - (t - 0.75) / 0.25) : 0.9;
      setDrop({ y, opacity, color, splashRx: 0, splashOpacity: 0 });

      if (t < 1) {
        rafRef.current = requestAnimationFrame(animDrop);
      } else {
        // ── Phase 2: Splash ──
        if (finalStatusRef.current) {
          setColorState(finalStatusRef.current === "passed" ? "correct" : "incorrect");
        } else {
          setColorState(dropTrigger.correct ? "correct" : "incorrect");
        }
        const splashStart = performance.now();
        const animSplash = (now2: number) => {
          const s = Math.min((now2 - splashStart) / SPLASH_DURATION, 1);
          setDrop({
            y: dropEndY, opacity: 0, color,
            splashRx: s * 26,
            splashOpacity: s < 0.35 ? s / 0.35 * 0.65 : 0.65 * (1 - (s - 0.35) / 0.65),
          });
          if (s < 1) {
            rafRef.current = requestAnimationFrame(animSplash);
          } else {
            setDrop(null);
            if (finalStatusRef.current) {
              setColorState(finalStatusRef.current === "passed" ? "correct" : "incorrect");
            } else {
              setColorState("neutral");
            }
            // ── Phase 3: Animate liquid level ──
            const from = fromThetaRef.current;
            const to = targetThetaRef.current;
            const levelStart = performance.now();
            const animLevel = (now3: number) => {
              const l = Math.min((now3 - levelStart) / LEVEL_DURATION, 1);
              // ease-in-out cubic
              const eL = l < 0.5 ? 4 * l * l * l : 1 - Math.pow(-2 * l + 2, 3) / 2;
              setDisplayedTheta(from + (to - from) * eL);
              if (l < 1) {
                rafRef.current = requestAnimationFrame(animLevel);
              } else {
                rafRef.current = null;
                setDisplayedTheta(to);
              }
            };
            rafRef.current = requestAnimationFrame(animLevel);
          }
        };
        rafRef.current = requestAnimationFrame(animSplash);
      }
    };

    rafRef.current = requestAnimationFrame(animDrop);

    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropTrigger]);


  const bubblesList = [
    { cx: 90, cy: 335, r: 3.5, className: "bubble-1", delay: "0s" },
    { cx: 110, cy: 345, r: 2.5, className: "bubble-2", delay: "0.8s" },
    { cx: 130, cy: 330, r: 4, className: "bubble-3", delay: "1.6s" },
    { cx: 100, cy: 340, r: 2, className: "bubble-1", delay: "2.4s" },
    { cx: 120, cy: 335, r: 3, className: "bubble-2", delay: "1.2s" },
  ];

  return (
    <div className="text-center select-none">
      <p className="text-[14px] text-gray-600 mb-1">ระดับความสามารถ</p>
      <svg viewBox="0 0 220 400" className="w-full max-h-[350px] mx-auto" role="img" aria-label="beaker progress">
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f0f9ff" />
            <stop offset="100%" stopColor="#dbeafe" />
          </linearGradient>
          <linearGradient id="liquidGrad" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="0%"
              stopColor={liquidLight}
              style={transitionStyle}
            />
            <stop
              offset="50%"
              stopColor={liquidMid}
              style={transitionStyle}
            />
            <stop
              offset="100%"
              stopColor={liquidDark}
              style={transitionStyle}
            />
          </linearGradient>
          <linearGradient id="glassSheen" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="0.35" />
            <stop offset="40%" stopColor="white" stopOpacity="0.08" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <clipPath id="beakerClip">
            <path d="M 80,82 L 70,358 L 150,358 L 140,82 Z" />
          </clipPath>
          <clipPath id="liquidBodyClip">
            <rect x="50" y={liquidTop} width="120" height={360} />
          </clipPath>
          <filter id="dropGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="labelGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <style>{`
            @keyframes slosh {
              0% { transform: translateX(-15px); }
              50% { transform: translateX(15px); }
              100% { transform: translateX(-15px); }
            }
            .wave-slosh {
              animation: slosh 4s ease-in-out infinite;
            }
            @keyframes rise-1 {
              0% { transform: translateY(0) translateX(0); opacity: 0; }
              10% { opacity: 0.45; }
              50% { transform: translateY(-100px) translateX(4px); }
              90% { opacity: 0.45; }
              100% { transform: translateY(-240px) translateX(-2px); opacity: 0; }
            }
            @keyframes rise-2 {
              0% { transform: translateY(0) translateX(0); opacity: 0; }
              15% { opacity: 0.4; }
              50% { transform: translateY(-110px) translateX(-3px); }
              85% { opacity: 0.4; }
              100% { transform: translateY(-250px) translateX(3px); opacity: 0; }
            }
            @keyframes rise-3 {
              0% { transform: translateY(0) translateX(0); opacity: 0; }
              10% { opacity: 0.55; }
              60% { transform: translateY(-120px) translateX(2px); }
              90% { opacity: 0.55; }
              100% { transform: translateY(-230px) translateX(-4px); opacity: 0; }
            }
            .bubble-1 { animation: rise-1 3.5s infinite linear; transform-origin: center; }
            .bubble-2 { animation: rise-2 2.8s infinite linear; transform-origin: center; }
            .bubble-3 { animation: rise-3 4s infinite linear; transform-origin: center; }
          `}</style>
        </defs>

        <rect width="220" height="400" fill="url(#bgGrad)" rx="12" />


        {/* === BEAKER GLASS === */}
        <line x1="80" y1="80" x2="70" y2="360" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <line x1="140" y1="80" x2="150" y2="360" stroke="#cbd5e1" strokeWidth="4" strokeLinecap="round" />
        <line x1="70" y1="360" x2="150" y2="360" stroke="#cbd5e1" strokeWidth="5" strokeLinecap="round" />
        {/* Rim */}
        <line x1="72" y1="82" x2="148" y2="82" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />


        {/* === LIQUID FILL === */}
        <g clipPath="url(#beakerClip)">
          <path
            d={`M 40,${liquidTop} 
                Q 65,${liquidTop - 4} 90,${liquidTop} 
                Q 115,${liquidTop + 4} 140,${liquidTop} 
                Q 165,${liquidTop - 4} 190,${liquidTop} 
                Q 215,${liquidTop + 4} 240,${liquidTop}
                L 240,358 L 40,358 Z`}
            fill="url(#liquidGrad)"
            opacity="0.88"
            className="wave-slosh"
          />

          {/* Liquid surface wave */}
          <path
            d={`M 40,${liquidTop} 
                Q 65,${liquidTop - 4} 90,${liquidTop} 
                Q 115,${liquidTop + 4} 140,${liquidTop} 
                Q 165,${liquidTop - 4} 190,${liquidTop} 
                Q 215,${liquidTop + 4} 240,${liquidTop}
                L 240,${liquidTop + 6} 
                Q 215,${liquidTop + 10} 190,${liquidTop + 6}
                Q 165,${liquidTop + 2} 140,${liquidTop + 6}
                Q 115,${liquidTop + 10} 90,${liquidTop + 6}
                Q 65,${liquidTop + 2} 40,${liquidTop + 6} Z`}
            fill={liquidMid}
            opacity="0.45"
            className="wave-slosh"
            style={transitionStyle}
          />
        </g>

        {/* Glass sheen */}
        <rect x="71" y={liquidTop} width="40" height={358 - liquidTop}
          fill="url(#glassSheen)" clipPath="url(#beakerClip)" />

        {/* Bubbles inside liquid */}
        <g clipPath="url(#beakerClip)">
          <g clipPath="url(#liquidBodyClip)">
            {bubblesList.map((b, i) => (
              <circle
                key={i}
                cx={b.cx}
                cy={b.cy}
                r={b.r}
                fill="white"
                className={b.className}
                style={{ animationDelay: b.delay }}
              />
            ))}
          </g>
        </g>

        {/* Glass wall highlight */}
        <line x1="83" y1="90" x2="76" y2="350" stroke="white" strokeWidth="3" opacity="0.35" strokeLinecap="round" />

        {/* === Tick marks on right === */}
        {[0, 25, 50, 75, 100].map((pct) => {
          const y = LIQUID_BOTTOM - ((pct / 100) * (LIQUID_BOTTOM - LIQUID_TOP_MAX));
          return (
            <g key={pct}>
              <line x1="150" y1={y} x2="162" y2={y} stroke="#94a3b8" strokeWidth="1.5" />
              <text x="165" y={y + 4} fontSize="9" fill="#94a3b8" fontFamily="monospace">{pct}%</text>
            </g>
          );
        })}

        {/* === THETA LABEL floating on liquid === */}
        <rect x="78" y={liquidTop - 23} width="64" height="18" rx="5" fill="white" opacity="0.92" />
        <text x="110" y={liquidTop - 10} fontSize="10" fill="#1d4ed8" textAnchor="middle" fontWeight="700">
          θ = {theta.toFixed(2)}
        </text>

        {/* === DROP (rendered last = on top of everything) === */}
        {drop && drop.opacity > 0 && (
          <g filter="url(#dropGlow)">
            <line
              x1="110" y1={drop.y - 12} x2="110" y2={drop.y - 1}
              stroke={drop.color} strokeWidth="2.5" strokeLinecap="round"
              opacity={drop.opacity * 0.6}
            />
            <ellipse
              cx="110" cy={drop.y}
              rx="5" ry="6.5"
              fill={drop.color}
              opacity={drop.opacity}
            />
          </g>
        )}

        {/* === SPLASH === */}
        {drop && drop.splashOpacity > 0 && (
          <g>
            <ellipse
              cx="110" cy={liquidTop}
              rx={drop.splashRx} ry={drop.splashRx * 0.22}
              fill={drop.color}
              opacity={drop.splashOpacity * 0.6}
              clipPath="url(#beakerClip)"
            />
            <ellipse
              cx="110" cy={liquidTop}
              rx={drop.splashRx * 1.4} ry={drop.splashRx * 0.18}
              fill="none" stroke={drop.color} strokeWidth="1.5"
              opacity={drop.splashOpacity * 0.4}
              clipPath="url(#beakerClip)"
            />
          </g>
        )}
      </svg>

    </div>
  );
}


// ==================== MAIN COMPONENT ====================
function CATExamPageContent() {
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
  const [dropTrigger, setDropTrigger] = useState<{ correct: boolean; id: number } | null>(null);
  const dropNRef = useRef(0);
  const [thetaDirection, setThetaDirection] = useState<"up" | "down" | null>(null);
  const prevThetaRef = useRef<number | null>(null);
  const directionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastCorrectTimerRef = useRef<NodeJS.Timeout | null>(null);


  const [isFinished, setIsFinished] = useState(false);
  const [finishedSessionId, setFinishedSessionId] = useState<number | null>(null);
  const [finalStatus, setFinalStatus] = useState<"passed" | "failed" | null>(null);
  const [navigating, setNavigating] = useState(false);
  const sessionIdRef = useRef<number | null>(null);
  const submittedRef = useRef(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Timer
  useEffect(() => {
    if (isFinished) return;
    const interval = setInterval(() => {
      if (examStartTime > 0) setElapsedTime(Math.floor((Date.now() - examStartTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [examStartTime, isFinished]);

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

      // Show correct/incorrect feedback on beaker
      // หา is_correct จาก option ที่เลือก (backend อาจไม่ return was_correct)
      const selectedOpt = session.current_item.answer_options.find(
        (o) => o.option_id === selectedOptionId
      );
      const wasCorrect = data.was_correct ?? (selectedOpt?.is_correct ?? null);
      if (wasCorrect !== null) {
        dropNRef.current += 1;
        setDropTrigger({ correct: wasCorrect, id: dropNRef.current });
        if (lastCorrectTimerRef.current) clearTimeout(lastCorrectTimerRef.current);
        lastCorrectTimerRef.current = setTimeout(() => setDropTrigger(null), 2500);
      }

      if (data.finished) {
        setIsFinished(true);
        setFinishedSessionId(session.session_id);
        setTimeout(() => {
          setFinalStatus(data.passed ? "passed" : "failed");
        }, 650);
        setSession(prev => prev ? {
          ...prev,
          current_theta: data.final_theta ?? prev.current_theta,
          current_se: data.final_se ?? prev.current_se,
          num_items: data.num_items ?? prev.num_items
        } : prev);
        setSelectedOptionId(null);
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


  // ─── Loading state ───────────────────────────────
  if (loading && !session) {
    return (
      <>
        <Navbar_user />
        <div className="min-h-[60vh] flex items-center justify-center">
          <LoadingSpinner size="lg" text="กำลังโหลดข้อสอบ CAT..." />
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

      <div className={`min-h-screen py-5 transition-all duration-[1500ms] ${finalStatus === "passed"
        ? "bg-green-50/60"
        : finalStatus === "failed"
          ? "bg-red-50/60"
          : "bg-gray-50"
        }`}>
        <div className="container mx-auto px-4 max-w-5xl">

          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-4">
            <Link href="/user" className="hover:text-green-600 transition">หน้าหลัก</Link>
            <span className="mx-2">›</span>
            <Link href="/user/cat-exam" className="hover:text-green-600 transition">สอบแบบปรับตัว</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-700 font-medium">กำลังสอบ</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

            {/* ─── Main Content (Left) ─── */}
            <div className="lg:col-span-7 space-y-4">

              {isFinished ? (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xl overflow-hidden transition-all duration-500">
                  <style>{`
                    @keyframes scaleUp {
                      from { transform: scale(0.96); opacity: 0; }
                      to { transform: scale(1); opacity: 1; }
                    }
                    .animate-scale-up {
                      animation: scaleUp 0.4s ease-out forwards;
                    }
                  `}</style>

                  {/* Header/Title Banner */}
                  <div className="p-6 text-center border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
                    <h2 className="text-2xl font-bold text-gray-800">การประเมินผลการสอบเสร็จสิ้น</h2>
                    <p className="text-gray-500 text-sm mt-1">ระบบได้ทำการประเมินระดับความสามารถเชิงปรับตัวของคุณเรียบร้อยแล้ว</p>
                  </div>

                  <div className="p-6 lg:p-8 space-y-6">
                    {/* Status Display */}
                    {finalStatus === null ? (
                      /* Analyzing / Processing state (plays during the 650ms beaker drop animation) */
                      <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-pulse">
                        <div className="w-16 h-16 rounded-full bg-blue-50 border-4 border-t-blue-500 border-blue-200 animate-spin flex items-center justify-center">
                          <FlaskConical className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="text-center">
                          <h3 className="text-lg font-semibold text-blue-800">กำลังประมวลผลและสรุปคะแนน...</h3>
                          <p className="text-sm text-gray-500 mt-1">ปฏิกิริยาเคมีกำลังสรุปผลลัพธ์สุดท้าย</p>
                        </div>
                      </div>
                    ) : finalStatus === "passed" ? (
                      /* Passed State */
                      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 animate-scale-up shadow-sm">
                        <div className="w-16 h-16 shrink-0 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md shadow-emerald-200">
                          <Award className="w-8 h-8" />
                        </div>
                        <div className="text-center sm:text-left">
                          <h3 className="text-xl font-bold text-emerald-800">มีโอกาสสูงที่จะสอบผ่าน!</h3>
                          <p className="text-sm text-emerald-600 font-medium mt-0.5">ระดับความสามารถของคุณผ่านเกณฑ์มาตรฐานการประเมิน</p>
                        </div>
                      </div>
                    ) : (
                      /* Failed State */
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 animate-scale-up shadow-sm">
                        <div className="w-16 h-16 shrink-0 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-200">
                          <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div className="text-center sm:text-left">
                          <h3 className="text-xl font-bold text-rose-800">การสอบเสร็จสิ้น (ยังไม่ผ่านเกณฑ์)</h3>
                          <p className="text-sm text-rose-600 font-medium mt-0.5">ระดับความสามารถของคุณในปัจจุบันยังไม่ผ่านเกณฑ์ขั้นต่ำ</p>
                        </div>
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">จำนวนข้อที่ตอบ</div>
                        <div className="text-2xl font-bold text-gray-800 mt-1">{session.num_items} ข้อ</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">ระดับความสามารถ (θ)</div>
                        <div className={`text-2xl font-bold mt-1 ${finalStatus === "passed" ? "text-emerald-600" : finalStatus === "failed" ? "text-rose-600" : "text-blue-600"
                          }`}>
                          {session.current_theta.toFixed(3)}
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">ค่าความคลาดเคลื่อน (SE)</div>
                        <div className="text-2xl font-bold text-purple-600 mt-1">{session.current_se.toFixed(3)}</div>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100 hover:shadow-md transition-shadow">
                        <div className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">เวลาที่ใช้ทั้งหมด</div>
                        <div className="text-2xl font-bold text-indigo-600 mt-1">{formatTime(elapsedTime)}</div>
                      </div>
                    </div>

                    {/* Additional details */}
                    {finalStatus !== null && (
                      <div className="text-center p-4 bg-gray-50/50 rounded-xl text-xs text-gray-400 leading-relaxed max-w-lg mx-auto border border-dashed border-gray-200">
                        * ผลลัพธ์นี้คำนวณตามทฤษฎีการตอบสนองข้อสอบ (IRT) ความคลาดเคลื่อนมาตรฐานต่ำกว่าเกณฑ์ขั้นต่ำ (SE &le; 0.35) หรือทำข้อสอบถึงจำนวนข้อสูงสุดแล้ว
                      </div>
                    )}

                    {/* CTA Button */}
                    <div className="pt-2 flex justify-center">
                      <button
                        onClick={() => {
                          if (finishedSessionId) {
                            setNavigating(true);
                            router.push(`/user/cat-exam/result/${finishedSessionId}`);
                          }
                        }}
                        disabled={finalStatus === null || navigating}
                        className={`w-full max-w-sm py-4 px-6 rounded-2xl font-bold text-white shadow-sm hover:shadow-md transition-colors flex items-center justify-center gap-2 ${finalStatus === "passed"
                          ? "bg-green-500 hover:bg-green-600"
                          : finalStatus === "failed"
                            ? "bg-red-500 hover:bg-red-600"
                            : "bg-gray-400 cursor-not-allowed opacity-50"
                          } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        {navigating ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            กำลังโหลด...
                          </>
                        ) : (
                          "สรุปผลการสอบ →"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* STEP 1: Situation */}
                  {session.current_item.situation && ((session.current_item.situation.situation_text && session.current_item.situation.situation_text.replace(/<[^>]*>/g, '').trim() !== '') || (session.current_item.situation.situation_image_url && session.current_item.situation.situation_image_url.trim() !== '') || (session.current_item.situation.situation_title && session.current_item.situation.situation_title.trim() !== '')) && (
                    <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                      <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-semibold text-blue-700">สถานการณ์</span>
                      </div>
                      <div className="p-5">
                        {session.current_item.situation.situation_title && (
                          <p
                            className="font-bold text-gray-800 mb-2"
                            dangerouslySetInnerHTML={{ __html: session.current_item.situation.situation_title }}
                          />
                        )}
                        <p
                          className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm lg:text-base"
                          dangerouslySetInnerHTML={{ __html: session.current_item.situation.situation_text }}
                        />
                        {session.current_item.situation.situation_image_url && (
                          <img
                            src={session.current_item.situation.situation_image_url.startsWith("http")
                              ? session.current_item.situation.situation_image_url
                              : `${process.env.NEXT_PUBLIC_API_URL}${session.current_item.situation.situation_image_url}`}
                            alt="situation"
                            className="mt-4 rounded-lg max-w-full border border-gray-200 cursor-zoom-in hover:opacity-90 transition-opacity"
                            onClick={() => {
                              const url = session.current_item.situation?.situation_image_url;
                              if (url) {
                                setPreviewImage(
                                  url.startsWith("http")
                                    ? url
                                    : `${process.env.NEXT_PUBLIC_API_URL}${url}`
                                );
                              }
                            }}
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
                      <p
                        className="text-base lg:text-lg text-gray-800 leading-relaxed font-medium whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{ __html: session.current_item.question_text }}
                      />
                      {session.current_item.question_image_url && (
                        <div className="mt-4">
                          <img
                            src={session.current_item.question_image_url.startsWith("http")
                              ? session.current_item.question_image_url
                              : `${process.env.NEXT_PUBLIC_API_URL}${session.current_item.question_image_url}`}
                            alt="question"
                            className="max-h-72 rounded-xl object-contain border border-gray-200 shadow-sm bg-white cursor-zoom-in hover:opacity-90 transition-opacity"
                            onClick={() => {
                              const url = session.current_item.question_image_url;
                              if (url) {
                                setPreviewImage(
                                  url.startsWith("http")
                                    ? url
                                    : `${process.env.NEXT_PUBLIC_API_URL}${url}`
                                );
                              }
                            }}
                          />
                        </div>
                      )}
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

                              <div className="flex-1 text-left">
                                {option.option_text && option.option_text.replace(/<[^>]*>/g, '').trim() !== '' && (
                                  <span
                                    className="text-gray-800 text-sm lg:text-base leading-relaxed block"
                                    dangerouslySetInnerHTML={{ __html: option.option_text }}
                                  />
                                )}
                                {option.option_image_url && option.option_image_url.trim() !== '' && (
                                  <div className={option.option_text && option.option_text.replace(/<[^>]*>/g, '').trim() !== '' ? "mt-2" : ""}>
                                    <img
                                      src={option.option_image_url.startsWith("http")
                                        ? option.option_image_url
                                        : `${process.env.NEXT_PUBLIC_API_URL}${option.option_image_url}`}
                                      alt={`ตัวเลือก ${label}`}
                                      className="max-h-40 rounded-lg border border-gray-200 bg-white cursor-pointer hover:opacity-90 transition-opacity object-contain"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const url = option.option_image_url!.startsWith("http")
                                          ? option.option_image_url!
                                          : `${process.env.NEXT_PUBLIC_API_URL}${option.option_image_url}`;
                                        setPreviewImage(url);
                                      }}
                                    />
                                  </div>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ─── Sidebar (Right) ─── */}
            <div className="lg:col-span-5">
              <div className="sticky top-5 space-y-4">

                {/* Beaker progress card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
                  <LabBeaker theta={session.current_theta} dropTrigger={dropTrigger} finalStatus={finalStatus} />
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
                      <p className="text-xl font-bold text-blue-600">{formatTime(elapsedTime)}</p>
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
                {!isFinished && (
                  <>
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
                  </>
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
          <div className="bg-white rounded-2xl p-8 shadow-2xl flex flex-col items-center justify-center">
            <LoadingSpinner size="lg" text="กำลังประมวลผลข้อถัดไป..." />
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/75 z-[110] flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300"
          onClick={() => setPreviewImage(null)}
        >
          <div 
            className="relative max-w-5xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors z-10 shadow-md"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}

export default function CATExamPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="กำลังโหลดข้อสอบ CAT..." />
      </div>
    }>
      <CATExamPageContent />
    </Suspense>
  );
}
