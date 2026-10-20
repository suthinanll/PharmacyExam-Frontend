"use client";

import React, { useState, useEffect, useCallback, useRef, Suspense } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { BookOpen, Loader2, Clock, Hash, Award, AlertTriangle, FlaskConical, X, Activity, Sparkles } from "lucide-react";
import Swal from "@/utils/sweetalert";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatScientificText } from "@/utils/formatText";
import { resolveImageUrl } from "@/utils/imageUrl";
import RichText from "@/components/RichText";

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

  const getAbilityBadge = (val: number) => {
    if (val >= 1.5) return { label: "ระดับสูง", color: "text-emerald-700 bg-emerald-50 border-emerald-200" };
    if (val >= 0.0) return { label: "ระดับปานกลาง", color: "text-blue-700 bg-blue-50 border-blue-200" };
    if (val >= -1.5) return { label: "ระดับพื้นฐาน", color: "text-amber-700 bg-amber-50 border-amber-200" };
    return { label: "ระดับเริ่มต้น", color: "text-slate-700 bg-slate-100 border-slate-200" };
  };

  const abilityBadge = getAbilityBadge(displayedTheta);

  return (
    <div className="select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-medium text-gray-800">ระดับความสามารถ</h3>
            <p className="text-sm text-gray-600">ประเมินแบบเรียลไทม์ (CAT)</p>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${abilityBadge.color}`}>
          {abilityBadge.label}
        </span>
      </div>

      {/* SVG Beaker */}
      <svg viewBox="0 0 230 380" className="w-full max-h-[350px] mx-auto drop-shadow-sm" role="img" aria-label="beaker progress">
        <defs>
          <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#eff6ff" />
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
            <stop offset="0%" stopColor="white" stopOpacity="0.45" />
            <stop offset="35%" stopColor="white" stopOpacity="0.1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <clipPath id="beakerClip">
            <path d="M 80,72 L 72,338 Q 72,352 84,352 L 136,352 Q 148,352 148,338 L 140,72 Z" />
          </clipPath>
          <clipPath id="liquidBodyClip">
            <rect x="50" y={liquidTop} width="120" height={360} />
          </clipPath>
          <filter id="pillShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.12" />
          </filter>
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
        </defs>

        {/* Zero baseline guideline inside card */}
        <line
          x1="55"
          y1={thetaToLiquidTop(0.0)}
          x2="165"
          y2={thetaToLiquidTop(0.0)}
          stroke="#94a3b8"
          strokeWidth="1"
          strokeDasharray="3 3"
          opacity="0.45"
        />

        {/* === BEAKER GLASS (Cylinder) === */}
        {/* Left & right glass walls */}
        <line x1="80" y1="72" x2="72" y2="338" stroke="#cbd5e1" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="140" y1="72" x2="148" y2="338" stroke="#cbd5e1" strokeWidth="3.5" strokeLinecap="round" />
        {/* Curved bottom */}
        <path d="M 72,338 Q 72,352 84,352 L 136,352 Q 148,352 148,338" fill="none" stroke="#cbd5e1" strokeWidth="3.5" strokeLinecap="round" />
        {/* Top Rim */}
        <ellipse cx="110" cy="72" rx="32" ry="5.5" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="3" />

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
            opacity="0.9"
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
        <rect x="73" y={liquidTop} width="36" height={352 - liquidTop}
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

        {/* Glass wall highlights */}
        <line x1="77" y1="85" x2="74" y2="330" stroke="white" strokeWidth="2.5" opacity="0.6" strokeLinecap="round" />
        <line x1="82" y1="90" x2="79" y2="325" stroke="white" strokeWidth="1" opacity="0.35" strokeLinecap="round" />

        {/* === Minor sub-ticks (precision markings) === */}
        {[+2.25, +0.75, -0.75, -2.25].map((val) => {
          const y = thetaToLiquidTop(val);
          return (
            <line
              key={val}
              x1="148"
              y1={y}
              x2="153"
              y2={y}
              stroke="#cbd5e1"
              strokeWidth="1"
            />
          );
        })}

        {/* === Major Tick marks on right (Theta Scale) === */}
        {[+3.0, +1.5, 0.0, -1.5, -3.0].map((val) => {
          const y = thetaToLiquidTop(val);
          const isZero = val === 0.0;
          return (
            <g key={val}>
              <line
                x1="148"
                y1={y}
                x2={isZero ? "162" : "157"}
                y2={y}
                stroke={isZero ? "#3b82f6" : "#94a3b8"}
                strokeWidth={isZero ? "2" : "1.2"}
              />
              <text
                x="166"
                y={y + 3.5}
                fontSize={isZero ? "9.5" : "9"}
                fill={isZero ? "#1d4ed8" : "#64748b"}
                fontFamily="sans-serif"
                fontWeight="500"
              >
                {val > 0 ? `+${val.toFixed(1)}` : val === 0 ? "0.0" : val.toFixed(1)}
              </text>
            </g>
          );
        })}

        {/* === THETA LABEL floating on liquid === */}
        <g filter="url(#pillShadow)">
          <rect
            x="70"
            y={liquidTop - 25}
            width="80"
            height="22"
            rx="11"
            fill="white"
            stroke="#e2e8f0"
            strokeWidth="1"
          />
          <text
            x="110"
            y={liquidTop - 10.5}
            fontSize="11"
            fill="#1e40af"
            textAnchor="middle"
            fontWeight="500"
            fontFamily="sans-serif"
          >
            θ = {displayedTheta >= 0 ? `+${displayedTheta.toFixed(2)}` : displayedTheta.toFixed(2)}
          </text>
        </g>

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

      {/* Footer info bar */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
        <span>ค่าความสามารถ (Theta)</span>
        <span className=" font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
          {displayedTheta >= 0 ? `+${displayedTheta.toFixed(2)}` : displayedTheta.toFixed(2)}
        </span>
      </div>
    </div>
  );
}


/** หน้าระหว่างโหลดข้อสอบ ใช้ทั้งในคอมโพเนนต์นี้และเป็น fallback ของ Suspense ใน page.tsx */
export function CATExamLoading() {
  return (
    <>
      <Navbar_user />
      <div className="min-h-screen flex items-start justify-center pt-24">
        <LoadingSpinner size="lg" text="กำลังโหลดข้อสอบ CAT..." />
      </div>
      <Footer />
    </>
  );
}

// ==================== MAIN COMPONENT ====================
/**
 * initialSession = ข้อสอบข้อปัจจุบันที่เซิร์ฟเวอร์ดึงมาให้แล้ว (page.tsx)
 * ถ้าเป็น null (เริ่มสอบใหม่ ไม่มีคุกกี้ หรือดึงไม่สำเร็จ) จะหา session ฝั่งไคลเอนต์เหมือนเดิม
 */
function CATExamPageContent({ initialSession }: { initialSession: CATSession | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const itemBankId = searchParams?.get("item_bank_id");
  const urlSessionId = searchParams?.get("session_id");

  const [loading, setLoading] = useState(initialSession === null);
  const [session, setSession] = useState<CATSession | null>(initialSession);
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

  // ดักจับการกดปุ่ม Back ของเบราว์เซอร์ (Popstate) ระหว่างสอบ CAT
  useEffect(() => {
    if (isFinished || loading) return;
    window.history.pushState(null, "", window.location.href);

    const handlePopState = (e: PopStateEvent) => {
      if (submittedRef.current || isFinished) return;
      e.preventDefault();
      window.history.pushState(null, "", window.location.href);

      Swal.fire({
        title: "ต้องการออกจากห้องสอบ CAT ใช่หรือไม่?",
        text: "หากคุณออกจากห้องสอบ การทำข้อสอบครั้งนี้จะถูกยกเลิกและข้อมูลจะไม่ถูกบันทึก",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "ออกจากห้องสอบ",
        cancelButtonText: "ทำข้อสอบต่อ",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          submittedRef.current = false;
          const sid = sessionIdRef.current;
          const token = getToken();
          if (sid && token) {
            fetch(`${process.env.NEXT_PUBLIC_API_URL}/cat/session/${sid}/cancel`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${token}` },
              keepalive: true,
            }).finally(() => {
              router.push("/user/cat-exam");
            });
          } else {
            router.push("/user/cat-exam");
          }
        }
      });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [isFinished, loading, getToken, router]);

  // ดักจับการคลิกลิงก์เมนูต่าง ๆ (เช่น Navbar) ระหว่างสอบ CAT
  useEffect(() => {
    if (isFinished || loading) return;

    const handleDocClick = (e: MouseEvent) => {
      if (submittedRef.current || isFinished) return;
      const target = (e.target as HTMLElement).closest("a");
      if (target && target.href && !target.href.startsWith("javascript:") && !target.getAttribute("href")?.startsWith("#")) {
        const targetUrl = target.href;
        const currentUrl = window.location.href;
        if (targetUrl !== currentUrl) {
          e.preventDefault();
          e.stopPropagation();

          Swal.fire({
            title: "ต้องการออกจากห้องสอบ CAT ใช่หรือไม่?",
            text: "หากคุณออกจากห้องสอบ การทำข้อสอบครั้งนี้จะถูกยกเลิกและข้อมูลจะไม่ถูกบันทึก",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "ออกจากห้องสอบ",
            cancelButtonText: "ทำข้อสอบต่อ",
            reverseButtons: true,
          }).then((result) => {
            if (result.isConfirmed) {
              submittedRef.current = false;
              const sid = sessionIdRef.current;
              const token = getToken();
              if (sid && token) {
                fetch(`${process.env.NEXT_PUBLIC_API_URL}/cat/session/${sid}/cancel`, {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                  keepalive: true,
                }).finally(() => {
                  window.location.href = targetUrl;
                });
              } else {
                window.location.href = targetUrl;
              }
            }
          });
        }
      }
    };

    document.addEventListener("click", handleDocClick, true);
    return () => document.removeEventListener("click", handleDocClick, true);
  }, [isFinished, loading, getToken]);

  // Start / Resume exam
  useEffect(() => {
    async function initCATSession() {
      let sId: number | null = null;

      // 1. Try reading from sessionStorage
      const cached = sessionStorage.getItem("active_cat_session");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed.session_id) sId = Number(parsed.session_id);
        } catch (e) {}
      }

      // เซิร์ฟเวอร์ดึงข้อปัจจุบันมาให้แล้ว ใช้ได้เลยถ้าเป็น session เดียวกับที่แท็บนี้กำลังสอบอยู่
      if (initialSession && (!sId || sId === initialSession.session_id)) {
        sessionIdRef.current = initialSession.session_id;
        sessionStorage.setItem("active_cat_session", JSON.stringify({ session_id: initialSession.session_id }));
        setExamStartTime(Date.now());
        return;
      }

      // 2. Fallback to URL searchParams
      if (!sId && urlSessionId) {
        sId = parseInt(urlSessionId);
      }

      // 3. Fallback to Active Session API from server (e.g. on direct refresh)
      if (!sId) {
        try {
          const token = getToken();
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cat/active-session`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const active = await res.json();
            if (active && active.session_id) {
              sId = Number(active.session_id);
              sessionStorage.setItem("active_cat_session", JSON.stringify({ session_id: sId }));
            }
          }
        } catch (e) {}
      }

      if (sId) {
        resumeCATSession(sId);
      } else if (itemBankId) {
        startCATExam();
      } else {
        Swal.fire({ title: "เกิดข้อผิดพลาด", text: "ไม่พบเซสชันการสอบ CAT ที่กำลังดำเนินการอยู่", icon: "error", confirmButtonColor: "#ef4444" }).then(() => {
          router.push("/user/cat-exam");
        });
      }
    }

    initCATSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      Swal.fire({ title: "กรุณาเลือกคำตอบ", icon: "warning", confirmButtonColor: "#5EA500", confirmButtonText: "ตกลง" });
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
  if (loading && !session) return <CATExamLoading />;

  if (!session) return null;

  const progressPct = Math.min((session.num_items / session.max_items) * 100, 100);

  // ─── UI ──────────────────────────────────────────
  return (
    <>
      <Navbar_user />

      <div className={`min-h-screen py-5 transition-colors duration-[1500ms] ${finalStatus === "passed"
        ? "bg-green-50/60"
        : finalStatus === "failed"
          ? "bg-red-50/60"
          : "bg-gray-50"
        }`}>
        <div className="container mx-auto px-4 max-w-7xl">

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
                  {/* Header/Title Banner */}
                  <div className="p-6 text-center border-b border-gray-100  ">
                    <h2 className="text-2xl font-medium text-gray-800">การประเมินผลการสอบเสร็จสิ้น</h2>
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
                          <h3 className="text-lg font-medium text-blue-800">กำลังประมวลผลและสรุปคะแนน...</h3>
                          <p className="text-sm text-gray-500 mt-1">ปฏิกิริยาเคมีกำลังสรุปผลลัพธ์สุดท้าย</p>
                        </div>
                      </div>
                    ) : finalStatus === "passed" ? (
                      /* Passed State */
                      <div className="bg-green-50 border border-green-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 animate-scale-up shadow-sm">
                        <div className="w-16 h-16 shrink-0 rounded-full bg-green-500 flex items-center justify-center text-white shadow-md shadow-green-200">
                          <Award className="w-8 h-8" />
                        </div>
                        <div className="text-center sm:text-left">
                          <h3 className="text-xl font-medium text-green-800">มีโอกาสสูงที่จะสอบผ่าน!</h3>
                          <p className="text-sm text-green-600 font-medium mt-0.5">ระดับความสามารถของคุณผ่านเกณฑ์มาตรฐานการประเมิน</p>
                        </div>
                      </div>
                    ) : (
                      /* Failed State */
                      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4 animate-scale-up shadow-sm">
                        <div className="w-16 h-16 shrink-0 rounded-full bg-rose-500 flex items-center justify-center text-white shadow-md shadow-rose-200">
                          <AlertTriangle className="w-8 h-8" />
                        </div>
                        <div className="text-center sm:text-left">
                          <h3 className="text-xl font-medium text-rose-800">การสอบเสร็จสิ้น (ยังไม่ผ่านเกณฑ์)</h3>
                          <p className="text-sm text-rose-600 font-medium mt-0.5">ระดับความสามารถของคุณในปัจจุบันยังไม่ผ่านเกณฑ์ขั้นต่ำ</p>
                        </div>
                      </div>
                    )}

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                      {/* 1. Ability Level (Theta) */}
                      <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 flex flex-col justify-between text-center transition-all hover:border-gray-200">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mb-2">
                          <Activity className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">ระดับความสามารถ (θ)</span>
                        </div>
                        <div>
                          <div className={`text-2xl font-medium ${
                            finalStatus === "passed" ? "text-green-600" : finalStatus === "failed" ? "text-rose-600" : "text-blue-600"
                          }`}>
                            {session.current_theta >= 0 ? `+${session.current_theta.toFixed(3)}` : session.current_theta.toFixed(3)}
                          </div>
                          <div className="text-[0.6875rem] text-gray-600 mt-0.5 font-normal">
                            {session.current_theta >= 1.5 ? "ระดับสูง" : session.current_theta >= 0 ? "ระดับปานกลาง" : "ระดับเริ่มต้น"}
                          </div>
                        </div>
                      </div>

                      {/* 2. Items Answered */}
                      <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 flex flex-col justify-between text-center transition-all hover:border-gray-200">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mb-2">
                          <Hash className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">จำนวนข้อที่ตอบ</span>
                        </div>
                        <div>
                          <div className="text-2xl font-medium text-gray-800">
                            {session.num_items}
                          </div>
                          <div className="text-[0.6875rem] text-gray-600 mt-0.5 font-normal">
                            จากสูงสุด {session.max_items} ข้อ
                          </div>
                        </div>
                      </div>

                      {/* 3. Time Elapsed */}
                      <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 flex flex-col justify-between text-center transition-all hover:border-gray-200">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mb-2">
                          <Clock className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                          <span className="truncate">เวลาที่ใช้ทั้งหมด</span>
                        </div>
                        <div>
                          <div className="text-2xl font-medium text-blue-600 ">
                            {formatTime(elapsedTime)}
                          </div>
                          <div className="text-[0.6875rem] text-gray-600 mt-0.5 font-normal">
                            นาที : วินาที
                          </div>
                        </div>
                      </div>

                      {/* 4. Standard Error (SE) */}
                      <div className="bg-gray-50/80 rounded-xl p-4 border border-gray-100 flex flex-col justify-between text-center transition-all hover:border-gray-200">
                        <div className="flex items-center justify-center gap-1.5 text-xs text-gray-500 mb-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                          <span className="truncate">ความคลาดเคลื่อน (SE)</span>
                        </div>
                        <div>
                          <div className="text-2xl font-medium text-purple-600">
                            {session.current_se.toFixed(3)}
                          </div>
                          <div className="text-[0.6875rem] text-gray-600 mt-0.5 font-normal">
                            {session.current_se <= 0.35 ? "ความแม่นยำสูง" : "ความแม่นยำปานกลาง"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Additional details */}
                    {finalStatus !== null && (
                      <div className="text-center p-4 bg-gray-50/50 rounded-xl text-sm text-gray-600 leading-relaxed max-w-lg mx-auto border border-dashed border-gray-200">
                        * ผลลัพธ์นี้คำนวณตามทฤษฎีการตอบสนองข้อสอบ (IRT) ความคลาดเคลื่อนมาตรฐานต่ำกว่าเกณฑ์ขั้นต่ำ (SE &le; 0.35) หรือทำข้อสอบถึงจำนวนข้อสูงสุดแล้ว
                      </div>
                    )}

                    {/* CTA Button */}
                    <div className="pt-2 flex justify-center">
                      <button
                        onClick={() => {
                          if (finishedSessionId) {
                            setNavigating(true);
                            sessionStorage.removeItem("active_cat_session");
                            sessionStorage.setItem("cat_result_session", JSON.stringify({ session_id: finishedSessionId }));
                            router.push('/user/cat-exam/result');
                          }
                        }}
                        disabled={finalStatus === null || navigating}
                        className={`w-full max-w-sm py-4 px-6 rounded-2xl font-medium text-white shadow-sm hover:shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer ${finalStatus === "passed"
                          ? "bg-primary hover:bg-primary-hover"
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
                          "สรุปผลการสอบ"
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
                        <span className="text-sm font-medium text-blue-700">สถานการณ์</span>
                      </div>
                      <div className="p-5">
                        {session.current_item.situation.situation_title && (
                          <RichText
                            className="font-medium text-gray-800 mb-2"
                            html={session.current_item.situation.situation_title}
                          />
                        )}
                        <RichText
                          className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm lg:text-base"
                          html={formatScientificText(session.current_item.situation.situation_text)}
                        />
                        {session.current_item.situation.situation_image_url && (
                          <img
                            src={resolveImageUrl(session.current_item.situation.situation_image_url)}
                            alt="situation"
                            className="mt-4 rounded-lg max-w-full border border-gray-200 cursor-zoom-in hover:opacity-90 transition-opacity"
                            onClick={() => {
                              const url = session.current_item.situation?.situation_image_url;
                              if (url) {
                                setPreviewImage(
                                  resolveImageUrl(url)
                                );
                              }
                            }}
                          />
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Question + STEP 3: Options (same card) */}
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-clip">

                    {/* Question header */}
                    <div className="px-6 pt-5 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-medium text-white bg-gray-500 px-2.5 py-1 rounded-full">
                          ข้อ {session.num_items + 1}
                        </span>
                        {/* ไม่แสดงหัวข้อย่อยระหว่างสอบ เพราะชื่อหัวข้อมักบอกใบ้คำตอบ — ดูได้ในหน้าเฉลย */}
                      </div>

                      {/* Question text */}
                      <RichText
                        className="text-base lg:text-lg text-gray-800 leading-relaxed font-medium whitespace-pre-wrap"
                        html={formatScientificText(session.current_item.question_text)}
                      />
                      {session.current_item.question_image_url && (
                        <div className="mt-4">
                          <img
                            src={resolveImageUrl(session.current_item.question_image_url)}
                            alt="question"
                            className="max-h-72 rounded-xl object-contain border border-gray-200 shadow-sm bg-white cursor-zoom-in hover:opacity-90 transition-opacity"
                            onClick={() => {
                              const url = session.current_item.question_image_url;
                              if (url) {
                                setPreviewImage(
                                  resolveImageUrl(url)
                                );
                              }
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Options */}
                    <div className="px-6 py-5">
                      <p className="text-sm font-medium text-gray-500  mb-3">เลือกคำตอบ</p>
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
                              <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 mt-0.5 transition-colors ${isSelected ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-700"
                                }`}>
                                {label}
                              </span>

                              <div className="flex-1 text-left">
                                {option.option_text && option.option_text.replace(/<[^>]*>/g, '').trim() !== '' && (
                                  <RichText
                                    as="span"
                                    className="text-gray-800 text-sm lg:text-base leading-relaxed block"
                                    html={formatScientificText(option.option_text)}
                                  />
                                )}
                                {option.option_image_url && option.option_image_url.trim() !== '' && (
                                  <div className={option.option_text && option.option_text.replace(/<[^>]*>/g, '').trim() !== '' ? "mt-2" : ""}>
                                    <img
                                      src={resolveImageUrl(option.option_image_url)}
                                      alt={`ตัวเลือก ${label}`}
                                      className="max-h-40 rounded-lg border border-gray-200 bg-white cursor-pointer hover:opacity-90 transition-opacity object-contain"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const url = resolveImageUrl(option.option_image_url);
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

                      {/* ปุ่มส่งคำตอบ วางใต้ตัวเลือกให้กดต่อได้ทันที (เดิมอยู่ท้าย sidebar ต้องเลื่อนไกล)
                          บนมือถือติดขอบล่างจอไว้ตลอด */}
                      {!isFinished && (
                        <div className="sticky bottom-0 z-20 -mx-6 -mb-5 mt-5 px-6 py-3 bg-white/95 backdrop-blur border-t border-gray-100 lg:static lg:mx-0 lg:mb-0 lg:px-0 lg:pb-0 lg:bg-transparent lg:backdrop-blur-none">
                          <button
                            onClick={submitAnswer}
                            disabled={!selectedOptionId || loading}
                            className="w-full py-3.5 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {loading ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                กำลังคำนวณ...
                              </>
                            ) : (
                              "ข้อถัดไป"
                            )}
                          </button>
                          {!selectedOptionId && !loading && (
                            <p className="mt-1.5 text-xs text-center text-gray-600">เลือกคำตอบก่อนกดส่ง</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* ─── Sidebar (Right) ─── */}
            <div className="lg:col-span-5">
              <div className="sticky top-5 space-y-4">

                {/* Beaker progress card */}
                <div className="bg-gradient-to-b from-slate-50 via-blue-50/20 to-blue-50/40 rounded-2xl border border-gray-200 shadow-sm p-4">
                  <LabBeaker theta={session.current_theta} dropTrigger={dropTrigger} finalStatus={finalStatus} />
                </div>

                {/* Stats card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-4 space-y-3">
                  {/* Answered / Timer */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Hash className="w-3.5 h-3.5 text-gray-600" />
                        <span className="text-xs text-gray-500">ตอบแล้ว</span>
                      </div>
                      <p className="text-xl font-medium text-gray-800">{session.num_items}</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <div className="flex items-center justify-center gap-1 mb-0.5">
                        <Clock className="w-3.5 h-3.5 text-gray-600" />
                        <span className="text-xs text-gray-500">เวลา</span>
                      </div>
                      <p className="text-xl font-medium text-blue-600">{formatTime(elapsedTime)}</p>
                    </div>
                  </div>

                  {/* Mountain progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                      <span>ความคืบหน้า</span>
                      <span className="font-medium text-gray-700">{session.num_items} / {session.max_items} ข้อ</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[0.625rem] text-gray-600 mt-1">
                      <span>เริ่ม</span>
                      <span>สูงสุด {session.max_items} ข้อ</span>
                    </div>
                  </div>
                </div>
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

export type { CATSession };

export default function CATExamClient({ initialSession }: { initialSession: CATSession | null }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="กำลังโหลดข้อสอบ CAT..." />
      </div>
    }>
      <CATExamPageContent initialSession={initialSession} />
    </Suspense>
  );
}
