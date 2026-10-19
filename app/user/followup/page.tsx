"use client";
import { useState, useEffect, useMemo } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import LazyRecharts from "@/components/charts/LazyRecharts";
import {
  FileText,
  CheckCircle2,
  Star,
  Clock,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  RefreshCcw,
  Sparkles,
  Check,
  Award,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Trophy,
  X,
  Layers,
  Bot,
  Brain,
  Lightbulb,
  Loader2,
  Target,
  BookOpen,
  ExternalLink,
  Calendar,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { requestUserAIAnalysis, hasRenderableContent, AIAnalysisResult } from "@/utils/n8nService";
import ProgressSection, { type UserProgress } from "@/components/followup/ProgressSection";

interface DashboardData {
  stats: {
    total_exams: number;
    passed_exams: number;
    failed_exams: number;
    average_score: number;
    last_exam_score: number;
    improvement_rate: number;
    days_until_exam: number;
    study_minutes: number;
    cat_exams_count: number;
  };
  ranking: {
    current_rank: number;
    total_users: number;
    percentile: number;
    rank_change: number;
    is_ranked?: boolean;
    next_rank_score?: number | null;
    prev_rank_score?: number | null;
    gap_to_next?: number | null;
    lead_over_prev?: number | null;
    score_range: {
      top: number;
      user_score: number;
      average: number;
    };
  };
  radar_data: {
    subject: string;
    score: number;
    full_mark: number;
  }[];
  progress?: UserProgress;

  weak_topics: {
    subject: string;
    topic: string;
    score: number;
    priority:
      | "ต้องรีบทบทวน!"
      | "ควรทบทวนเพิ่มเติม"
      | "พอใช้ แต่ควรฝึกฝนเพิ่มเติม"
      | "ทำได้ดี";
    study_time: string;
    resources: number;
  }[];
}

// ── Helper Functions & Styles ───────────────────────────────────────────────

const formatStudyTime = (totalMinutes: number | undefined) => {
  if (totalMinutes === undefined || totalMinutes <= 0)
    return { value: "0", unit: "นาที" };
  if (totalMinutes < 60) return { value: `${totalMinutes}`, unit: "นาที" };
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0
    ? { value: `${hours} ชม. ${mins}`, unit: "นาที" }
    : { value: `${hours}`, unit: "ชม." };
};

const priorityStyles = {
  "ต้องรีบทบทวน!": {
    card: "bg-red-50/70 border-red-200",
    bar: "bg-red-500",
    badge: "bg-red-100 text-red-700 font-medium",
    dot: "bg-red-500",
  },
  ควรทบทวนเพิ่มเติม: {
    card: "bg-amber-50/70 border-amber-200",
    bar: "bg-amber-500",
    badge: "bg-amber-100 text-amber-800 font-medium",
    dot: "bg-amber-500",
  },
  "พอใช้ แต่ควรฝึกฝนเพิ่มเติม": {
    card: "bg-yellow-50/70 border-yellow-200",
    bar: "bg-yellow-500",
    badge: "bg-yellow-100 text-yellow-800 font-medium",
    dot: "bg-yellow-500",
  },
  ทำได้ดี: {
    card: "bg-teal-50/70 border-teal-200",
    bar: "bg-teal-500",
    badge: "bg-teal-100 text-teal-800 font-medium",
    dot: "bg-teal-500",
  },
} as const;

const defaultPriorityStyle = {
  card: "bg-gray-50 border-gray-200",
  bar: "bg-gray-400",
  badge: "bg-gray-100 text-gray-700 font-medium",
  dot: "bg-gray-400",
};

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200/70 rounded-xl ${className}`} />
);

// ── Stat row (horizontal list item) ─────────────────────────────────────
interface StatRowProps {
  icon: React.ReactNode;
  accent: string;
  accentSoft: string;
  value: React.ReactNode;
  unit: string;
  label: string;
  sublabel?: string;
  loading: boolean;
}

const StatRow = ({
  icon,
  accent,
  accentSoft,
  value,
  unit,
  label,
  sublabel,
  loading,
}: StatRowProps) => (
  <div className="flex items-center gap-4 px-5 py-4">
    <div
      // โหมดมืดใช้สีหลักของการ์ดแบบโปร่งแทนพื้นพาสเทล (พื้นพาสเทลบนพื้นมืดจะสว่างจ้า)
      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs bg-[var(--soft)] dark:bg-[color-mix(in_oklab,currentColor_16%,transparent)]"
      style={{ '--soft': accentSoft, color: accent } as React.CSSProperties}
    >
      {icon}
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-sm sm:text-base text-gray-600 font-medium truncate">{label}</p>
      {loading ? (
        <Skeleton className="h-7 w-24 mt-1" />
      ) : (
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-2xl sm:text-3xl font-medium tracking-tight text-gray-800">
            {value}
          </span>
          <span className="text-xs sm:text-sm font-medium text-gray-500 truncate">
            {unit}
          </span>
        </div>
      )}
    </div>

    {sublabel && !loading && (
      <span
        className="text-xs sm:text-sm font-medium px-3 py-1 rounded-full shrink-0 bg-[var(--soft)] dark:bg-[color-mix(in_oklab,currentColor_16%,transparent)]"
        style={{ '--soft': accentSoft, color: accent } as React.CSSProperties}
      >
        {sublabel}
      </span>
    )}
  </div>
);

/**
 * ส่วนหัวของหน้า แยกออกมาเพื่อให้แสดงได้ตั้งแต่ตอนยังโหลดข้อมูลไม่เสร็จ
 *
 * <h1> กับคำอธิบายใต้หัวข้อคือองค์ประกอบ LCP ของหน้านี้ เดิมอยู่หลัง if (loading)
 * ทำให้ HTML จากเซิร์ฟเวอร์มีแต่ spinner ต้องรอ JS ทำงานเสร็จก่อนถึงจะวาดหัวข้อ
 * (วัดได้เป็น render delay ราว 2.5 วินาที) ย้ายออกมาไว้ตรงนี้แล้วหัวข้อจะติดมากับ
 * HTML ตั้งแต่แรกและวาดพร้อมเฟรมแรกได้เลย
 */
function PageHeader() {
    return (
        <div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
                <Link
                    href="/user"
                    className="hover:text-blue-600 cursor-pointer transition"
                >
                    หน้าหลัก
                </Link>
                <span className="mx-2">›</span>
                <span className="text-gray-700 font-medium">
                    ติดตามความคืบหน้า
                </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-medium text-gray-800">
                ติดตามความคืบหน้า
            </h1>
            <p className="text-sm sm:text-base text-gray-600 mt-1">
                ภาพรวมผลการทำข้อสอบ จุดแข็ง-จุดอ่อน และหัวข้อที่ควรพัฒนาของคุณ
            </p>
        </div>
    );
}
const PharmacistDashboard = () => {
  const { getToken, user } = useAuth();
  // หัวข้อที่เลือกแสดงบนกราฟเรดาร์ จำไว้ในเบราว์เซอร์แยกตามผู้ใช้
  const subjectsKey = user ? `followup-subjects-${user.user_id}` : null;
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Topic Selection States ────────────────────────────────────────────────
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  // ร่างการเลือกในหน้าต่าง — กราฟเปลี่ยนเมื่อกด "บันทึกและนำไปแสดงผล" เท่านั้น ปิดหน้าต่างเฉย ๆ = ยกเลิก
  const [draftSubjects, setDraftSubjects] = useState<string[]>([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [showAllWeak, setShowAllWeak] = useState(false);
  const [showComparisonSummary, setShowComparisonSummary] = useState(true);

  // ── AI Analysis States (n8n Integration) ──────────────────────────────────
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [expandedWeakTopics, setExpandedWeakTopics] = useState<Set<number>>(new Set());

  const toggleWeakTopic = (index: number) => {
    setExpandedWeakTopics((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // ── Load cached AI Analysis from localStorage on mount ───────────────────
  useEffect(() => {
    if (!user?.user_id || typeof window === "undefined") return;
    try {
      const savedKey = `ai_analysis_user_${user.user_id}`;
      const savedData = localStorage.getItem(savedKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        // ผลเก่าที่ n8n เคยตอบว่างอาจค้างอยู่ใน localStorage ถ้าโหลดมาแสดงจะได้กล่องเปล่า
        if (parsed && typeof parsed === "object" && hasRenderableContent(parsed)) {
          setAiAnalysis(parsed);
        } else {
          localStorage.removeItem(savedKey);
        }
      }
    } catch (e) {
      console.warn("Failed to load cached AI analysis from localStorage:", e);
    }
  }, [user?.user_id]);

  const handleRunAIAnalysis = async () => {
    if (!user?.user_id) return;
    try {
      setAiLoading(true);
      setAiError(null);
      const result = await requestUserAIAnalysis(user.user_id, {
        stats: data?.stats,
        radar_data: data?.radar_data,
        weak_topics: data?.weak_topics,
      });
      setAiAnalysis(result);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`ai_analysis_user_${user.user_id}`, JSON.stringify(result));
        } catch (e) {
          console.warn("Failed to save AI analysis to localStorage:", e);
        }
      }
    } catch (err: any) {
      console.error("n8n AI Error:", err);
      setAiError(err?.message || "ไม่สามารถเชื่อมต่อกับระบบ AI ได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const token = getToken();
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/user/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const json: DashboardData = await res.json();
        setData(json);

        // ค่าเริ่มต้น: เลือก 5 หัวข้อแรก หรือทั้งหมด
        if (json.radar_data && json.radar_data.length > 0) {
          setSelectedSubjects(
            json.radar_data.slice(0, Math.min(5, json.radar_data.length)).map((d) => d.subject),
          );
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [getToken]);

  // ใช้หัวข้อที่บันทึกไว้ครั้งก่อนแทนค่าเริ่มต้น (เฉพาะหัวข้อที่ยังมีอยู่)
  useEffect(() => {
    if (!data?.radar_data?.length || !subjectsKey) return;
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(subjectsKey) ?? "[]");
      const available = data.radar_data.map((d) => d.subject);
      const restored = Array.isArray(saved) ? saved.filter((name) => available.includes(name)) : [];
      if (restored.length > 0) setSelectedSubjects(restored);
    } catch {
      // ค่าที่บันทึกเสียหรืออ่านไม่ได้ — ใช้ค่าเริ่มต้น
    }
  }, [data?.radar_data, subjectsKey]);

  // ── หน้าต่างเลือกหัวข้อแสดงผล ─────────────────────────────────────────────
  const openFilterModal = () => {
    setDraftSubjects(selectedSubjects);
    setIsFilterModalOpen(true);
  };

  const saveFilter = () => {
    setSelectedSubjects(draftSubjects);
    try {
      if (subjectsKey) localStorage.setItem(subjectsKey, JSON.stringify(draftSubjects));
    } catch {
      // บันทึกในเบราว์เซอร์ไม่ได้ก็ยังแสดงผลตามที่เลือกในหน้านี้
    }
    setIsFilterModalOpen(false);
  };

  // ── Toggle / Preset Helpers ───────────────────────────────────────────────
  const toggleSubject = (subjectName: string) => {
    setDraftSubjects((prev) =>
      prev.includes(subjectName)
        ? prev.filter((s) => s !== subjectName)
        : [...prev, subjectName],
    );
  };

  const selectTopStrengths = (count: number = 3) => {
    if (!data?.radar_data) return;
    const sorted = [...data.radar_data].sort((a, b) => b.score - a.score);
    setDraftSubjects(sorted.slice(0, count).map((d) => d.subject));
  };

  const selectTopWeaknesses = (count: number = 3) => {
    if (!data?.radar_data) return;
    const sorted = [...data.radar_data].sort((a, b) => a.score - b.score);
    setDraftSubjects(sorted.slice(0, count).map((d) => d.subject));
  };

  const selectAllSubjects = () => {
    if (!data?.radar_data) return;
    setDraftSubjects(data.radar_data.map((d) => d.subject));
  };

  const clearSelection = () => {
    setDraftSubjects([]);
  };

  // ── Filtered Radar Data & Ranking Comparison ──────────────────────────────
  const filteredRadarData = useMemo(() => {
    if (!data?.radar_data || data.radar_data.length === 0) return [];
    return data.radar_data.filter((item) => selectedSubjects.includes(item.subject));
  }, [data?.radar_data, selectedSubjects]);

  // เรียงลำดับหัวข้อที่เลือกจากคะแนนมากไปน้อย เพื่อเปรียบเทียบว่าอันไหนเยอะ/น้อยสุด
  const sortedSelectedTopics = useMemo(() => {
    return [...filteredRadarData].sort((a, b) => b.score - a.score);
  }, [filteredRadarData]);

  const highestTopic = sortedSelectedTopics.length > 0 ? sortedSelectedTopics[0] : null;
  const lowestTopic = sortedSelectedTopics.length > 1 ? sortedSelectedTopics[sortedSelectedTopics.length - 1] : null;

  if (loading) {
    return (
      <>
        <Navbar_user />
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            <PageHeader />
            <div className="flex items-start justify-center pt-12">
              <LoadingSpinner size="lg" text="กำลังโหลดข้อมูลสถิติและความก้าวหน้า..." />
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar_user />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-gray-200 shadow-sm text-center">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h2 className="text-xl font-medium text-gray-800 mb-2">
              เกิดข้อผิดพลาด
            </h2>
            <p className="text-sm text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm shadow-sm cursor-pointer"
            >
              <RefreshCcw className="w-4 h-4" />
              ลองอีกครั้ง
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const passRate = data
    ? data.stats.total_exams > 0
      ? Math.round((data.stats.passed_exams / data.stats.total_exams) * 100)
      : 0
    : 0;

  const studyTime = formatStudyTime(data?.stats.study_minutes);
  const rankChange = data?.ranking?.rank_change ?? 0;
  const totalRadarCount = data?.radar_data?.length ?? 0;

  // จัดการรายการหัวข้อที่ควรทบทวนเพิ่มเติมโดยไม่ใช้ Scrollbar (Toggle แสดงเพิ่ม)
  const weakTopicsList = data?.weak_topics ?? [];
  const displayedWeakTopics = showAllWeak ? weakTopicsList : weakTopicsList.slice(0, 4);

  return (
    <>
      <Navbar_user />

      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <PageHeader />

          {/* ── Ranking card ────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-2xs">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-medium text-gray-800">
                  อันดับของคุณ
                </h2>
                <p className="text-xs sm:text-sm text-gray-500">ผลการประเมินเทียบกับผู้ใช้งานทั้งหมดในระบบ</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50/80 rounded-xl p-5 border border-gray-100 flex flex-col justify-between">
                <p className="text-sm font-medium text-gray-600 mb-2">
                  อันดับปัจจุบัน (จากผู้ใช้ทั้งหมด)
                </p>
                {loading ? (
                  <Skeleton className="h-12 w-48 mb-3" />
                ) : (
                  <>
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-medium text-blue-600 tracking-tight">
                        #{data?.ranking?.current_rank ?? "-"}
                      </span>
                      <span className="text-base sm:text-lg font-medium text-gray-500">
                        จาก {data?.ranking?.total_users?.toLocaleString() ?? "-"} คน
                      </span>
                    </div>
                    {data?.ranking && (
                      <div className="mt-3 inline-flex items-center gap-1.5">
                        {rankChange > 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                            <TrendingUp className="w-4 h-4 text-teal-600" />
                            ดีขึ้น {rankChange} อันดับ
                          </span>
                        ) : rankChange < 0 ? (
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-200">
                            <TrendingDown className="w-4 h-4 text-red-500" />
                            ลดลง {Math.abs(rankChange)} อันดับ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                            <Minus className="w-4 h-4 text-gray-600" />
                            อันดับคงที่
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="bg-gray-50/80 rounded-xl p-5 border border-gray-100 flex flex-col justify-between">
                <p className="text-sm font-medium text-gray-600 mb-3">
                  เปรียบเทียบคะแนน (เต็ม 100 คะแนน)
                </p>
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-5 w-full" />
                    <Skeleton className="h-5 w-full" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {[
                      {
                        label: "คะแนนสูงสุดในระบบ",
                        value: data?.ranking.score_range.top ?? 0,
                        color: "#9CA3AF",
                      },
                      {
                        label: "คะแนนของคุณ",
                        value: data?.ranking.score_range.user_score ?? 0,
                        color: "#155DFC",
                      },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-sm sm:text-base mb-1.5 font-medium">
                          <span className="text-gray-700">{label}</span>
                          <span className="font-medium text-gray-800">
                            {value} คะแนน
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                          <div
                            className="h-2.5 rounded-full transition-all duration-700"
                            style={{
                              width: `${Math.min(value, 100)}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* ── Stats list ───────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden grid grid-cols-1 sm:grid-cols-2 divide-y divide-gray-100 sm:divide-y-0">
            <div className="sm:border-b sm:border-gray-100">
              <StatRow
                icon={<FileText className="w-6 h-6" />}
                accent="#155DFC"
                accentSoft="#EEF2FF"
                value={data?.stats.total_exams ?? "—"}
                unit="ชุด"
                label="จำนวนข้อสอบที่ทำไปแล้ว"
                sublabel="ทั้งหมด"
                loading={loading}
              />
            </div>
            <div className="sm:border-b sm:border-l sm:border-gray-100">
              <StatRow
                icon={<CheckCircle2 className="w-6 h-6" />}
                accent="#0D9488"
                accentSoft="#F0FDFA"
                value={data?.stats.passed_exams ?? "—"}
                unit={`ชุด จาก ${data?.stats.total_exams ?? 0} ชุด`}
                label="ชุดข้อสอบที่ผ่านเกณฑ์"
                sublabel={`${passRate}% ผ่าน`}
                loading={loading}
              />
            </div>
            <div>
              <StatRow
                icon={<Star className="w-6 h-6" />}
                accent="#D97706"
                accentSoft="#FFFBEB"
                value={data?.stats.average_score ?? "—"}
                unit="คะแนน / 100"
                label="คะแนนเฉลี่ยรวม"
                loading={loading}
              />
            </div>
            <div className="sm:border-l sm:border-gray-100">
              <StatRow
                icon={<Clock className="w-6 h-6" />}
                accent="#7C3AED"
                accentSoft="#F5F3FF"
                value={studyTime.value}
                unit={studyTime.unit}
                label="เวลาสะสมที่ทำข้อสอบ"
                loading={loading}
              />
            </div>
          </div>

          {/* ── CAT exams stat (แยกจากข้อสอบ Standard เพราะ CAT ไม่มี final_score แบบเดียวกัน) ── */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <StatRow
              icon={<Target className="w-6 h-6" />}
              accent="#0EA5E9"
              accentSoft="#F0F9FF"
              value={data?.stats.cat_exams_count ?? "—"}
              unit="ชุด"
              label="จำนวนข้อสอบ CAT ที่ทำไปแล้ว"
              sublabel="ปรับระดับความยากอัตโนมัติ"
              loading={loading}
            />
          </div>

          {/* ── Progress section — พัฒนาการ ระดับ สตรีค และแบดจ์ ──────────────── */}
          {!loading && data?.progress && (
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-2xs">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-medium text-gray-800">
                    พัฒนาการของคุณ
                  </h2>
                  <p className="text-xs text-gray-500">
                    ผลการทำข้อสอบแต่ละครั้ง ระดับ และความสำเร็จที่ปลดล็อกได้
                  </p>
                </div>
              </div>
              <ProgressSection progress={data.progress} />
            </div>
          )}

          {/* ── Analysis section ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Radar Chart Section */}
              <div className="flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-2xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-medium text-gray-800">
                        วิเคราะห์จุดแข็ง - จุดอ่อน
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500">
                        กราฟเรดาร์แสดงระดับคะแนนรายหัวข้อ
                      </p>
                    </div>
                  </div>

                  {totalRadarCount > 0 && (
                    <button
                      type="button"
                      onClick={openFilterModal}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-medium transition cursor-pointer self-start sm:self-auto shadow-2xs"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                      <span>เลือกหัวข้อแสดงผล</span>
                      <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        {selectedSubjects.length}
                      </span>
                    </button>
                  )}
                </div>

                {/* Radar Chart Display */}
                {loading ? (
                  <Skeleton className="h-[360px] w-full" />
                ) : totalRadarCount === 0 ? (
                  <div className="h-[360px] flex flex-col items-center justify-center text-gray-600 text-sm border-2 border-dashed border-gray-100 rounded-2xl">
                    <Sparkles className="w-8 h-8 text-gray-300 mb-2" />
                    ยังไม่มีข้อมูลเพียงพอสำหรับแสดงผลกราฟ
                  </div>
                ) : selectedSubjects.length === 0 ? (
                  <div className="h-[320px] flex flex-col items-center justify-center text-gray-600 text-sm border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center">
                    <Layers className="w-8 h-8 text-blue-400 mb-2" />
                    <p className="font-medium text-gray-700">ยังไม่ได้เลือกหัวข้อแสดงผล</p>
                    <p className="text-xs text-gray-600 mt-1 mb-3">กดปุ่ม "เลือกหัวข้อแสดงผล" เพื่อเลือกหัวข้อที่ต้องการ</p>
                    <button
                      type="button"
                      onClick={openFilterModal}
                      className="px-4 py-2 bg-blue-600 text-white text-xs font-medium rounded-xl hover:bg-blue-700 transition cursor-pointer shadow-xs"
                    >
                      เลือกหัวข้อ
                    </button>
                  </div>
                ) : (
                  <div className="w-full bg-gray-50/40 rounded-2xl p-3 border border-gray-100">
                    {selectedSubjects.length < 3 && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 mb-2 text-center font-medium flex items-center justify-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        เลือกตั้งแต่ 3 หัวข้อขึ้นไปเพื่อสร้างรูปกราฟเรดาร์หลายเหลี่ยม (ขณะนี้เลือก {selectedSubjects.length} หัวข้อ)
                      </p>
                    )}
                    <div className="w-full h-[320px] sm:h-[350px]">
                      <LazyRecharts height="100%">
                        {(R) => (
                          <R.ResponsiveContainer width="100%" height="100%">
                            <R.RadarChart data={filteredRadarData}>
                              <R.PolarGrid stroke="#E5E7EB" />
                              <R.PolarAngleAxis
                                dataKey="subject"
                                tick={{ fontSize: 12, fill: "#4B5563", fontWeight: 500 }}
                              />
                              <R.PolarRadiusAxis
                                angle={90}
                                domain={[0, 100]}
                                tick={{ fontSize: 11, fill: "#9CA3AF" }}
                              />
                              <R.Radar
                                name="คะแนนของคุณ"
                                dataKey="score"
                                stroke="#155DFC"
                                fill="#6366F1"
                                fillOpacity={0.35}
                                strokeWidth={2.5}
                              />
                              <R.Tooltip
                                contentStyle={{
                                  borderRadius: "14px",
                                  border: "1px solid #E5E7EB",
                                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                                  fontSize: "13px",
                                  fontWeight: 500,
                                }}
                                formatter={(val: any) => [`${val} คะแนน`, "คะแนนที่ได้"]}
                              />
                              <R.Legend
                                wrapperStyle={{
                                  fontSize: "13px",
                                  fontWeight: 500,
                                  paddingTop: "10px",
                                }}
                              />
                            </R.RadarChart>
                          </R.ResponsiveContainer>
                        )}
                      </LazyRecharts>
                    </div>
                  </div>
                )}

                {/* Comparison Insight Box (เปรียบเทียบในหัวข้อที่เลือก อันไหนเยอะ/น้อยสุด - ซ่อน/แสดงได้) */}
                {sortedSelectedTopics.length > 0 && (
                  <div className="bg-blue-50/40 rounded-2xl border border-blue-100 p-4 mt-4 transition-all">
                    <div
                      onClick={() => setShowComparisonSummary(!showComparisonSummary)}
                      className="flex items-center justify-between gap-2 cursor-pointer select-none"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                        <span className="font-medium text-gray-700">
                          สรุปเปรียบเทียบ <span className="text-blue-600 font-medium">{sortedSelectedTopics.length}</span> หัวข้อที่เลือก:
                        </span>
                        {highestTopic && (
                          <span className="inline-flex items-center gap-1.5 text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-full font-medium text-xs">
                            <Trophy className="w-3.5 h-3.5 text-teal-600" />
                            สูงสุด: {highestTopic.subject} ({highestTopic.score} คะแนน)
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:text-blue-800 transition shrink-0 p-1 cursor-pointer"
                      >
                        <span>{showComparisonSummary ? "ซ่อน" : "แสดงรายละเอียด"}</span>
                        <ChevronUp
                          className={`w-4 h-4 transition-transform duration-200 ${
                            !showComparisonSummary ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                    </div>

                    {/* Progress bars for each selected topic sorted highest to lowest */}
                    {showComparisonSummary && (
                      <div className="space-y-2 pt-3 border-t border-blue-100/60 mt-3 animate-in fade-in duration-200">
                        {sortedSelectedTopics.map((topic, index) => {
                          const isHighest = index === 0 && sortedSelectedTopics.length > 1;
                          const isLowest = index === sortedSelectedTopics.length - 1 && sortedSelectedTopics.length > 1;
                          return (
                            <div key={topic.subject} className="bg-white/90 rounded-xl p-2.5 border border-blue-100/80">
                              <div className="flex justify-between items-center text-xs sm:text-sm font-medium mb-1">
                                <div className="flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[0.6875rem] text-gray-600 font-medium shrink-0">
                                    {index + 1}
                                  </span>
                                  <span className="text-gray-800">{topic.subject}</span>
                                  {isHighest && (
                                    <span className="text-[0.625rem] bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.2 rounded font-medium">
                                      เยอะสุด
                                    </span>
                                  )}
                                  {isLowest && (
                                    <span className="text-[0.625rem] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
                                      น้อยสุด
                                    </span>
                                  )}
                                </div>
                                <span className="text-gray-800 font-medium">
                                  {topic.score} / 100
                                </span>
                              </div>
                              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    isHighest ? "bg-teal-500" : isLowest ? "bg-amber-500" : "bg-blue-500"
                                  }`}
                                  style={{ width: `${Math.min(topic.score, 100)}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Unified Weak Topics Section */}
              <div className="lg:border-l lg:border-gray-200 lg:pl-8 flex flex-col justify-start">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-2xs">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-medium text-gray-800 flex items-center gap-2">
                        หัวข้อที่ควรทบทวน
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500">
                        วิเคราะห์จุดที่ควรเน้นจากประวัติการทำข้อสอบ
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsAiModalOpen(true);
                      if (!aiAnalysis && !aiLoading) {
                        handleRunAIAnalysis();
                      }
                    }}
                    disabled={aiLoading}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl font-medium text-xs transition-all shadow-sm hover:shadow cursor-pointer self-start sm:self-auto shrink-0 active:scale-95"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังประมวลผล AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles
                          className={`w-3.5 h-3.5 ${aiAnalysis ? "text-blue-200" : "text-blue-200"}`}
                        />
                        <span>
                          {aiAnalysis ? "ดูรายงาน AI & แผนอ่านหนังสือ" : "วิเคราะห์ด้วย AI"}
                        </span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI Error Alert if any */}
                {aiError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center justify-between gap-2.5 mb-3.5">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                      <span>{aiError}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRunAIAnalysis()}
                      className="text-xs text-red-700 font-medium underline hover:text-red-900 cursor-pointer shrink-0"
                    >
                      ลองใหม่
                    </button>
                  </div>
                )}

                {/* Sleek AI Active Notification Banner (Single compact line) */}
                {aiAnalysis && !aiLoading && (
                  <div className="p-3 bg-gradient-to-r from-blue-50/90 to-teal-50/80 rounded-2xl border border-blue-100 mb-4 flex items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Brain className="w-4 h-4" />
                      </div>
                      <p className="text-xs text-gray-700 font-medium truncate">
                        AI วิเคราะห์จุดอ่อนและจัดทำแผนการอ่านหนังสือให้คุณแล้ว
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsAiModalOpen(true)}
                      className="px-4 py-2 bg-white hover:bg-gray-50   active:scale-95 text-blue-700 rounded-xl font-medium text-xs transition-all shadow-sm hover:shadow cursor-pointer shrink-0 flex items-center gap-1.5"
                    >
                      <span>เปิดดูรายงาน AI</span>
                      <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                    </button>
                  </div>
                )}

                {loading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-2xl" />
                    ))}
                  </div>
                ) : weakTopicsList.length === 0 ? (
                  <div className="text-gray-600 text-sm text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-teal-500 mb-2" />
                    <p className="font-medium text-gray-600">
                      {data?.stats?.total_exams === 0
                        ? "ยังไม่มีประวัติการทำข้อสอบ"
                        : "ยินดีด้วย! คุณทำผลงานได้ดีเยี่ยม"}
                    </p>
                    <p className="text-xs text-gray-600 mt-0.5 max-w-sm px-4">
                      {data?.stats?.total_exams === 0
                        ? "กรุณาเข้าไปฝึกทำข้อสอบก่อน เพื่อให้ระบบนำผลคะแนนมาวิเคราะห์จุดแข็ง-จุดอ่อนรายวิชา"
                        : "ยังไม่มีหัวข้อที่คะแนนต่ำกว่าเกณฑ์ในขณะนี้ หรือกดปุ่ม 'วิเคราะห์ด้วย AI' เพื่อประเมินเชิงลึก"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {displayedWeakTopics.map((topic, index) => {
                      // Color-coded review priority based on score
                      const getReviewStatus = (score: number) => {
                        if (score <= 20) {
                          return {
                            dotColor: "bg-rose-500",
                            tagText: "ต้องรีบทบทวนด่วน",
                            tagClass: "bg-rose-50 text-rose-700 border-rose-100",
                            scoreClass: "bg-rose-50 text-rose-700 border-rose-100",
                          };
                        }
                        if (score < 50) {
                          return {
                            dotColor: "bg-amber-500",
                            tagText: "ควรทบทวนเพิ่ม",
                            tagClass: "bg-amber-50 text-amber-700 border-amber-100",
                            scoreClass: "bg-amber-50 text-amber-700 border-amber-100",
                          };
                        }
                        if (score < 70) {
                          return {
                            dotColor: "bg-yellow-500",
                            tagText: "ทบทวนเสริมความแม่นยำ",
                            tagClass: "bg-yellow-50 text-yellow-800 border-yellow-100",
                            scoreClass: "bg-yellow-50 text-yellow-800 border-yellow-100",
                          };
                        }
                        return {
                          dotColor: "bg-emerald-500",
                          tagText: "ผ่านเกณฑ์แล้ว",
                          tagClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
                          scoreClass: "bg-emerald-50 text-emerald-700 border-emerald-100",
                        };
                      };

                      const status = getReviewStatus(topic.score);

                      return (
                        <div
                          key={index}
                          className="bg-white rounded-xl border border-gray-100/90 hover:border-gray-200 shadow-2xs transition-all px-3.5 py-3 flex items-start sm:items-center justify-between gap-3"
                        >
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            {/* Color-coded Status Dot */}
                            <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${status.dotColor}`} />

                            {/* Topic Name (2 lines max) & Subject */}
                            <div className="min-w-0 flex-1 space-y-0.5">
                              <h3 className="font-medium text-gray-800 text-xs sm:text-sm leading-snug line-clamp-2">
                                {topic.topic}
                              </h3>
                              <p className="text-[0.6875rem] text-gray-600 font-medium">
                                {topic.subject}
                              </p>
                            </div>
                          </div>

                          {/* Right: Review Status Tag & Score Pill */}
                          <div className="flex items-center gap-2 shrink-0 mt-0.5 sm:mt-0">
                            <span
                              className={`text-[0.6875rem] font-medium px-2.5 py-0.5 rounded-full border whitespace-nowrap ${status.tagClass}`}
                            >
                              {status.tagText}
                            </span>
                            <span
                              className={`text-[0.6875rem] font-medium px-2 py-0.5 rounded-md border whitespace-nowrap ${status.scoreClass}`}
                            >
                              คะแนน {topic.score}%
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Toggle show all weak topics button */}
                    {weakTopicsList.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setShowAllWeak(!showAllWeak)}
                        className="w-full py-2.5 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                      >
                        {showAllWeak ? (
                          <>
                            <ChevronUp size={16} /> แสดงน้อยลง
                          </>
                        ) : (
                          <>
                            <ChevronDown size={16} /> ดูหัวข้อที่ควรทบทวนทั้งหมดอีก {weakTopicsList.length - 4} รายการ
                          </>
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Modal: เลือกหัวข้อแสดงผลและเปรียบเทียบ (No backdrop-blur) ────────────── */}
      {isFilterModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-gray-200 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-800">
                    เลือกหัวข้อที่ต้องการแสดงผล
                  </h3>
                  <p className="text-xs text-gray-500">
                    เลือกหัวข้อเพื่อวิเคราะห์บนกราฟเรดาร์และเปรียบเทียบคะแนน
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Action Presets (No emojis) */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                type="button"
                onClick={() => selectTopStrengths(3)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Award className="w-3.5 h-3.5 text-teal-600" />
                3 จุดแข็งสูงสุด
              </button>
              <button
                type="button"
                onClick={() => selectTopWeaknesses(3)}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                3 จุดที่ควรพัฒนา
              </button>
              <button
                type="button"
                onClick={selectAllSubjects}
                className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                เลือกทั้งหมด
              </button>
              {draftSubjects.length > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-600 hover:text-red-500 transition-colors cursor-pointer"
                >
                  ล้างการเลือก
                </button>
              )}
            </div>

            {/* Topic Checklist List */}
            <div className="space-y-2 overflow-y-auto pr-1 flex-1 py-1">
              {data?.radar_data?.map((item) => {
                const isChecked = draftSubjects.includes(item.subject);
                return (
                  <button
                    key={item.subject}
                    type="button"
                    onClick={() => toggleSubject(item.subject)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer text-left
                      ${isChecked
                        ? "bg-blue-50/70 border-blue-300 text-blue-900 shadow-2xs"
                        : "bg-gray-50/50 border-gray-200 text-gray-600 hover:bg-gray-100/70"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors
                          ${isChecked
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "border-gray-300 bg-white"
                          }`}
                      >
                        {isChecked && <Check size={13} strokeWidth={3} />}
                      </div>
                      <span className="font-medium text-gray-800">{item.subject}</span>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-1 rounded-lg font-medium
                        ${isChecked
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-200/70 text-gray-600"
                        }`}
                    >
                      {item.score} / 100 คะแนน
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-xs text-gray-500 font-medium">
                เลือกแล้ว {draftSubjects.length} จาก {totalRadarCount} หัวข้อ
              </span>
              <button
                type="button"
                onClick={saveFilter}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition cursor-pointer shadow-sm"
              >
                บันทึกและนำไปแสดงผล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: รายงานการวิเคราะห์ผลสอบ & แผนเตรียมตัวรายบุคคลโดย AI (AI Report Modal) ────── */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl border border-gray-100 flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start sm:items-center justify-between pb-4 border-b border-gray-100 mb-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-medium text-gray-800 flex items-center gap-2">
                    รายงานผลการวิเคราะห์ และ แผนการเตรียมตัวจาก AI
                  </h3>
                  <p className="text-sm text-gray-500 font-medium">
                    วิเคราะห์ตามประวัติผลคะแนนและจุดอ่อนของคุณ
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {!aiLoading && (
                  <button
                    type="button"
                    onClick={() => handleRunAIAnalysis()}
                    className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-blue-200 text-sm font-medium text-gray-600 hover:text-blue-600 bg-white hover:bg-blue-50 transition cursor-pointer"
                  >
                    <RefreshCcw className="w-3.5 h-3.5 text-blue-500" />
                    <span>วิเคราะห์ใหม่</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(false)}
                  className="w-9 h-9 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-600 hover:text-gray-700 transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 py-1">
              {/* ⏳ Loading State */}
              {aiLoading && (
                <div className="py-12 px-4 text-center space-y-6">
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-sm animate-pulse">
                    <Brain className="w-8 h-8 animate-bounce" />
                  </div>
                  <div className="space-y-2 max-w-md mx-auto">
                    <h4 className="text-base font-medium text-gray-800">
                      ระบบ AI กำลังประมวลผลข้อมูลและจัดทำแผนส่วนบุคคล...
                    </h4>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      กำลังวิเคราะห์ข้อสอบที่ตอบผิด จุดที่มักสับสน และสร้างกลยุทธ์การจำแบบเจาะจง
                    </p>
                  </div>
                  <div className="max-w-xs mx-auto space-y-2 text-left bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                      <Check className="w-4 h-4 text-teal-600" />
                      <span>รวบรวมประวัติคะแนนสอบ 6 ครั้งล่าสุด</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-blue-700 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>วิเคราะห์สาเหตุข้อผิดพลาด & แนวทางรักษา</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                      <span className="w-4 h-4 rounded-full border border-gray-300 inline-block text-center text-sm leading-3.5">3</span>
                      <span>จัดตารางอ่านหนังสือและสูตรช่วยจำ</span>
                    </div>
                  </div>
                </div>
              )}

              {/* ⚠️ Error State */}
              {!aiLoading && aiError && (
                <div className="py-8 px-4 text-center space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-medium text-gray-800">เกิดข้อผิดพลาดในการวิเคราะห์</h4>
                    <p className="text-sm text-rose-600 max-w-md mx-auto font-medium">{aiError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRunAIAnalysis()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium transition cursor-pointer shadow-sm"
                  >
                    ลองใหม่อีกครั้ง
                  </button>
                </div>
              )}

              {/* ✨ Content State */}
              {!aiLoading && aiAnalysis && (
                <div className="space-y-4">
                  {/* 1. สรุปภาพรวม AI */}
                  {(aiAnalysis.summary || aiAnalysis.analysis_summary || aiAnalysis.overall_feedback) && (
                    <div className="p-4 sm:p-5 bg-blue-50/60 rounded-2xl border border-blue-100/90 space-y-2">
                      <div className="flex items-center gap-2 text-base font-medium text-blue-900">
                        <Brain className="w-4 h-4 text-blue-600" />
                        <span>สรุปผลการประเมินภาพรวม</span>
                      </div>
                      {(() => {
                        const summaryData = aiAnalysis.summary || aiAnalysis.analysis_summary || aiAnalysis.overall_feedback;
                        let content = summaryData;
                        if (typeof summaryData === "string") {
                          const trimmed = summaryData.trim();
                          if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
                            try { content = JSON.parse(trimmed); } catch { content = summaryData; }
                          }
                        }
                        if (typeof content === "object" && content !== null && !Array.isArray(content)) {
                          return (
                            <div className="space-y-2 mt-1.5">
                              {Object.entries(content).map(([k, v], i) => (
                                <div key={i} className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded-xl border border-blue-100 shadow-2xs">
                                  <span className="font-medium text-blue-950 block mb-0.5">
                                    {k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}:
                                  </span>
                                  <span>{typeof v === "string" ? v : JSON.stringify(v)}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return (
                          <div className="bg-white p-3.5 rounded-xl border border-blue-100/80 shadow-2xs">
                            <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
                              {String(content)}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                  {Array.isArray(aiAnalysis.memory_techniques) && aiAnalysis.memory_techniques.length > 0 && (
                    <div className="p-4 sm:p-5 bg-amber-50/60 rounded-2xl border border-amber-200/80 space-y-2.5">
                      <div className="flex items-center gap-2 text-base font-medium text-amber-900">
                        <Lightbulb className="w-4 h-4 text-amber-600" />
                        <span>สูตรลับและเทคนิคช่วยจำพิเศษ</span>
                      </div>
                      <div className="space-y-2">
                        {aiAnalysis.memory_techniques.map((item, idx) => (
                          <div key={idx} className="bg-white p-3.5 rounded-xl border border-amber-100 shadow-2xs space-y-1.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="font-medium text-sm text-amber-900">
                                {item.mnemonic_name || item.topic || `เทคนิคที่ ${idx + 1}`}
                              </span>
                              {item.topic && (
                                <span className="text-sm bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-medium">
                                  {item.topic}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
                              {item.mnemonic_detail || JSON.stringify(item)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {aiAnalysis.action_plan && (
                    <div className="p-4 sm:p-5 bg-teal-50/60 rounded-2xl border border-teal-100/90 space-y-3">
                      <div className="flex items-center gap-2 text-base font-medium text-teal-900">
                        <Calendar className="w-4 h-4 text-teal-600" />
                        <span>แผนการอ่านหนังสือและการเตรียมตัวรายบุคคล (Action Plan):</span>
                      </div>

                      {(() => {
                        const unwrap = (data: any): any => {
                          if (typeof data === "string") {
                            const trimmed = data.trim();
                            if (
                              (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
                              (trimmed.startsWith("[") && trimmed.endsWith("]"))
                            ) {
                              try {
                                return unwrap(JSON.parse(trimmed));
                              } catch {
                                return data;
                              }
                            }
                          }
                          if (Array.isArray(data)) return data.map(unwrap);
                          if (typeof data === "object" && data !== null) {
                            const res: Record<string, any> = {};
                            for (const [k, v] of Object.entries(data)) {
                              res[k] = unwrap(v);
                            }
                            return res;
                          }
                          return data;
                        };

                        const extractStepText = (s: any): string => {
                          if (typeof s === "string") return s;
                          if (!s || typeof s !== "object") return String(s);
                          if (s.action) return String(s.action);
                          if (s.text) return String(s.text);
                          if (s.task) return String(s.task);
                          if (s.description) return String(s.description);
                          if (s.details) return String(s.details);
                          if (s.focus_area) {
                            return `${s.focus_area}${s.activities ? `: ${typeof s.activities === "string" ? s.activities : Array.isArray(s.activities) ? s.activities.join(", ") : JSON.stringify(s.activities)}` : ""}`;
                          }
                          if (s.mnemonic_detail) {
                            return `${s.mnemonic_name ? `[${s.mnemonic_name}] ` : ""}${s.mnemonic_detail}`;
                          }
                          if (s.clinical_pearl) return String(s.clinical_pearl);
                          if (s.recommendation) return String(s.recommendation);
                          if (s.why_challenging) return String(s.why_challenging);
                          if (s.activities) {
                            return Array.isArray(s.activities) ? s.activities.join(", ") : String(s.activities);
                          }
                          const strVals = Object.entries(s)
                            .filter(([k, v]) => !["step", "id", "day", "priority", "index"].includes(k) && typeof v === "string" && v.trim().length > 0)
                            .map(([k, v]) => (k === "topic" || k === "subject" ? `${v}` : `${k.replace(/_/g, " ")}: ${v}`));
                          if (strVals.length > 0) return strVals.join(" | ");
                          return JSON.stringify(s);
                        };
                        const plan = unwrap(aiAnalysis.action_plan);
                        if (Array.isArray(plan)) {
                          const hasScheduleShape = plan.length > 0 &&
                            typeof plan[0] === "object" &&
                            ("day" in plan[0] || "focus_area" in plan[0] || "study_hours" in plan[0]);
                          if (hasScheduleShape) {
                            return (
                              <div className="space-y-2.5">
                                {plan.map((item: any, idx: number) => (
                                  <div
                                    key={idx}
                                    className="bg-white p-3.5 rounded-xl border border-teal-100 shadow-2xs space-y-2"
                                  >
                                    <div className="flex items-center justify-between gap-2 flex-wrap">
                                      <div className="flex items-center gap-2">
                                        <span className="w-6 h-6 rounded-lg bg-teal-600 text-white text-sm font-medium flex items-center justify-center shrink-0">
                                          {item.day ?? idx + 1}
                                        </span>
                                        <span className="font-medium text-sm text-gray-800">
                                          {item.focus_area || "ทบทวนเนื้อหา"}
                                        </span>
                                      </div>
                                      {item.study_hours && (
                                        <span className="text-sm font-medium text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-md border border-teal-100">
                                          เป้าหมาย: {item.study_hours} ชั่วโมง
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-700 leading-relaxed bg-gray-50/70 p-2.5 rounded-lg border border-gray-100 font-medium">
                                      {typeof item.activities === "string"
                                        ? item.activities
                                        : Array.isArray(item.activities)
                                        ? item.activities.join("\n")
                                        : item.action || item.task || item.description || ""}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          }

                          return (
                            <div className="space-y-2">
                              {plan.map((step: any, sIdx: number) => {
                                const stepText = extractStepText(step);
                                return (
                                  <div
                                    key={sIdx}
                                    className="flex items-start gap-3 p-3 bg-white rounded-xl border border-teal-100/90 text-sm text-gray-700 font-medium shadow-2xs"
                                  >
                                    <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-sm font-medium flex items-center justify-center shrink-0 mt-0.5">
                                      {sIdx + 1}
                                    </span>
                                    <p className="leading-relaxed flex-1">{stepText}</p>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }
                        if (typeof plan === "object" && plan !== null) {
                          const schedule = Array.isArray(plan.schedule) ? plan.schedule : [];
                          const strategies = Array.isArray(plan.general_strategies)
                            ? plan.general_strategies
                            : Array.isArray(plan.strategies)
                            ? plan.strategies
                            : [];

                          return (
                            <div className="space-y-4">
                              {schedule.length > 0 && (
                                <div className="space-y-2">
                                  <span className="text-sm font-medium text-teal-800 block">ตารางอ่านหนังสือรายวัน:</span>
                                  <div className="space-y-2">
                                    {schedule.map((item: any, idx: number) => (
                                      <div key={idx} className="bg-white p-3.5 rounded-xl border border-teal-100 shadow-2xs space-y-1.5">
                                        <div className="flex items-center justify-between gap-2 flex-wrap">
                                          <span className="font-medium text-sm text-teal-900">
                                            วันที่ {item.day ?? idx + 1}: {item.focus_area || "ทบทวนเนื้อหา"}
                                          </span>
                                          {item.study_hours && (
                                            <span className="text-sm font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                                              {item.study_hours} ชม.
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-600 leading-relaxed">
                                          {typeof item.activities === "string"
                                            ? item.activities
                                            : Array.isArray(item.activities)
                                            ? item.activities.join("\n")
                                            : ""}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {strategies.length > 0 && (
                                <div className="space-y-2">
                                  <span className="text-sm font-medium text-blue-900 block">กลยุทธ์สำคัญ:</span>
                                  <div className="space-y-1.5">
                                    {strategies.map((strat: any, sIdx: number) => (
                                      <div key={sIdx} className="flex items-start gap-2.5 p-2.5 bg-white rounded-xl border border-teal-100 text-sm text-gray-700 shadow-2xs font-medium">
                                        <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                                        <p className="flex-1 leading-relaxed">
                                          {typeof strat === "string" ? strat : strat.action || strat.text || JSON.stringify(strat)}
                                        </p>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        }

                        return (
                          <div className="bg-white p-3.5 rounded-xl border border-teal-100 shadow-2xs">
                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                              {String(plan)}
                            </p>
                          </div>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-between">
              <span className="text-base text-gray-600 font-medium hidden sm:inline">
                ผลการประเมินนี้บันทึกอัตโนมัติในเบราว์เซอร์ของคุณ
              </span>
              <button
                type="button"
                onClick={() => setIsAiModalOpen(false)}
                className="w-full sm:w-auto px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white dark:text-[#0f172a] text-sm font-medium rounded-xl transition cursor-pointer shadow-sm"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default PharmacistDashboard;