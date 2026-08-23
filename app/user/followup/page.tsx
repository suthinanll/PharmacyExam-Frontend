"use client";
import { useState, useEffect, useMemo } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
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
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";
import { requestUserAIAnalysis, AIAnalysisResult } from "@/utils/n8nService";

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
  };
  ranking: {
    current_rank: number;
    total_users: number;
    percentile: number;
    rank_change: number;
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
      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs"
      style={{ backgroundColor: accentSoft, color: accent }}
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
        className="text-xs sm:text-sm font-medium px-3 py-1 rounded-full shrink-0"
        style={{ backgroundColor: accentSoft, color: accent }}
      >
        {sublabel}
      </span>
    )}
  </div>
);

const PharmacistDashboard = () => {
  const { getToken, user } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Topic Checklist & Selection States ─────────────────────────────────────
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [showAllWeak, setShowAllWeak] = useState(false);

  // ── AI Analysis States (n8n Integration) ──────────────────────────────────
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

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

  // ── Toggle / Preset Helpers ───────────────────────────────────────────────
  const toggleSubject = (subjectName: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subjectName)
        ? prev.filter((s) => s !== subjectName)
        : [...prev, subjectName],
    );
  };

  const selectTopStrengths = (count: number = 3) => {
    if (!data?.radar_data) return;
    const sorted = [...data.radar_data].sort((a, b) => b.score - a.score);
    setSelectedSubjects(sorted.slice(0, count).map((d) => d.subject));
  };

  const selectTopWeaknesses = (count: number = 3) => {
    if (!data?.radar_data) return;
    const sorted = [...data.radar_data].sort((a, b) => a.score - b.score);
    setSelectedSubjects(sorted.slice(0, count).map((d) => d.subject));
  };

  const selectAllSubjects = () => {
    if (!data?.radar_data) return;
    setSelectedSubjects(data.radar_data.map((d) => d.subject));
  };

  const clearSelection = () => {
    setSelectedSubjects([]);
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
        <div className="min-h-[70vh] flex items-center justify-center">
          <LoadingSpinner size="lg" text="กำลังโหลดข้อมูลสถิติและความก้าวหน้า..." />
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
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm cursor-pointer"
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
          <div>
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <Link
                href="/user"
                className="hover:text-indigo-600 cursor-pointer transition"
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

          {/* ── Ranking card ────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-2xs">
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
                      <span className="text-4xl sm:text-5xl font-medium text-indigo-600 tracking-tight">
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
                            <Minus className="w-4 h-4 text-gray-400" />
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
                        color: "#4F46E5",
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
                accent="#4F46E5"
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

          {/* ── Analysis section ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Radar Chart & Topic Selector Section */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-2xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-medium text-gray-800">
                      วิเคราะห์จุดแข็ง - จุดอ่อน
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">
                      ติ๊กเลือกหัวข้อที่ต้องการเพื่อเปรียบเทียบคะแนนและแสดงบนกราฟ
                    </p>
                  </div>
                </div>

                {/* Quick Selection Presets */}
                {totalRadarCount > 0 && (
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <button
                      onClick={() => selectTopStrengths(3)}
                      type="button"
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5 text-teal-600" />
                      3 จุดแข็งสูงสุด
                    </button>
                    <button
                      onClick={() => selectTopWeaknesses(3)}
                      type="button"
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer flex items-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                      3 จุดที่ควรพัฒนา
                    </button>
                    <button
                      onClick={selectAllSubjects}
                      type="button"
                      className="px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
                    >
                      เลือกทั้งหมด
                    </button>
                    {selectedSubjects.length > 0 && (
                      <button
                        onClick={clearSelection}
                        type="button"
                        className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                      >
                        ล้างการเลือก
                      </button>
                    )}
                  </div>
                )}

                {/* Topic Checklist Chips (No scrollbar, wraps naturally) */}
                {totalRadarCount > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4 p-3 bg-gray-50/80 rounded-2xl border border-gray-100">
                    {data!.radar_data.map((item) => {
                      const isChecked = selectedSubjects.includes(item.subject);
                      return (
                        <button
                          key={item.subject}
                          type="button"
                          onClick={() => toggleSubject(item.subject)}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs sm:text-sm font-medium transition-all cursor-pointer select-none
                            ${isChecked
                              ? "bg-white border-indigo-300 text-indigo-800 shadow-2xs ring-1 ring-indigo-500/20"
                              : "bg-white/60 border-gray-200 text-gray-500 hover:border-gray-300 hover:text-gray-700"
                            }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-md border flex items-center justify-center transition-colors
                              ${isChecked
                                ? "bg-indigo-600 border-indigo-600 text-white"
                                : "border-gray-300 bg-white"
                              }`}
                          >
                            {isChecked && <Check size={11} strokeWidth={3} />}
                          </div>
                          <span>{item.subject}</span>
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded-md font-medium
                              ${isChecked
                                ? "bg-indigo-50 text-indigo-700"
                                : "bg-gray-100 text-gray-500"
                              }`}
                          >
                            {item.score}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Comparison Insight Box (เมื่อเลือกหัวข้อ จะสรุปว่าอันไหนเยอะสุด/คะแนนเป็นยังไง) */}
                {sortedSelectedTopics.length > 0 && (
                  <div className="bg-indigo-50/50 rounded-2xl border border-indigo-100 p-4 mb-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm">
                      <span className="font-medium text-gray-700">
                        เปรียบเทียบใน <b className="text-indigo-600 font-medium">{sortedSelectedTopics.length}</b> หัวข้อที่เลือก:
                      </span>
                      {highestTopic && (
                        <span className="inline-flex items-center gap-1.5 text-teal-800 bg-teal-100/70 px-2.5 py-0.5 rounded-full font-medium text-xs">
                          <Trophy className="w-3.5 h-3.5 text-teal-600" />
                          คะแนนสูงสุด: <b>{highestTopic.subject}</b> ({highestTopic.score} คะแนน)
                        </span>
                      )}
                    </div>

                    {/* Progress bars for each selected topic sorted highest to lowest */}
                    <div className="space-y-2 pt-1">
                      {sortedSelectedTopics.map((topic, index) => {
                        const isHighest = index === 0 && sortedSelectedTopics.length > 1;
                        const isLowest = index === sortedSelectedTopics.length - 1 && sortedSelectedTopics.length > 1;
                        return (
                          <div key={topic.subject} className="bg-white/80 rounded-xl p-2.5 border border-indigo-100/80">
                            <div className="flex justify-between items-center text-xs sm:text-sm font-medium mb-1">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[11px] text-gray-600 font-medium shrink-0">
                                  {index + 1}
                                </span>
                                <span className="text-gray-800">{topic.subject}</span>
                                {isHighest && (
                                  <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 px-1.5 py-0.2 rounded font-medium">
                                    เยอะสุด
                                  </span>
                                )}
                                {isLowest && (
                                  <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.2 rounded font-medium">
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
                                  isHighest ? "bg-teal-500" : isLowest ? "bg-amber-500" : "bg-indigo-500"
                                }`}
                                style={{ width: `${Math.min(topic.score, 100)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Radar Chart Display */}
                {loading ? (
                  <Skeleton className="h-[360px] w-full" />
                ) : totalRadarCount === 0 ? (
                  <div className="h-[360px] flex flex-col items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-2xl">
                    <Sparkles className="w-8 h-8 text-gray-300 mb-2" />
                    ยังไม่มีข้อมูลเพียงพอสำหรับแสดงผลกราฟ
                  </div>
                ) : selectedSubjects.length === 0 ? (
                  <div className="h-[320px] flex flex-col items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center">
                    <Sparkles className="w-8 h-8 text-indigo-400 mb-2" />
                    <p className="font-medium text-gray-700">กรุณาติ๊กเลือกหัวข้อด้านบน</p>
                    <p className="text-xs text-gray-400 mt-1">เลือกอย่างน้อย 3 หัวข้อขึ้นไปเพื่อดูรูปทรงกราฟเรดาร์</p>
                  </div>
                ) : (
                  <div className="w-full bg-gray-50/40 rounded-2xl p-3 border border-gray-100">
                    {selectedSubjects.length < 3 && (
                      <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 mb-2 text-center font-medium">
                        เลือกตั้งแต่ 3 หัวข้อขึ้นไปเพื่อสร้างรูปกราฟเรดาร์หลายเหลี่ยม (ขณะนี้เลือก {selectedSubjects.length} หัวข้อ)
                      </p>
                    )}
                    <div className="w-full h-[340px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart data={filteredRadarData}>
                          <PolarGrid stroke="#E5E7EB" />
                          <PolarAngleAxis
                            dataKey="subject"
                            tick={{ fontSize: 12, fill: "#4B5563", fontWeight: 500 }}
                          />
                          <PolarRadiusAxis
                            angle={90}
                            domain={[0, 100]}
                            tick={{ fontSize: 11, fill: "#9CA3AF" }}
                          />
                          <Radar
                            name="คะแนนของคุณ"
                            dataKey="score"
                            stroke="#4F46E5"
                            fill="#6366F1"
                            fillOpacity={0.35}
                            strokeWidth={2.5}
                          />
                          <Tooltip
                            contentStyle={{
                              borderRadius: "14px",
                              border: "1px solid #E5E7EB",
                              boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                              fontSize: "13px",
                              fontWeight: 500,
                            }}
                            formatter={(val: any) => [`${val} คะแนน`, "คะแนนที่ได้"]}
                          />
                          <Legend
                            wrapperStyle={{
                              fontSize: "13px",
                              fontWeight: 500,
                              paddingTop: "10px",
                            }}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}
              </div>

              {/* Unified Weak Topics & AI Analysis Section */}
              <div className="lg:border-l lg:border-gray-200 lg:pl-8 flex flex-col justify-start">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-2xs">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-medium text-gray-800 flex items-center gap-2">
                        หัวข้อที่ควรทบทวน & คำแนะนำ AI
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500">
                        วิเคราะห์จุดอ่อนและคำแนะนำรายบุคคลโดย AI
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunAIAnalysis}
                    disabled={aiLoading}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white rounded-xl font-medium text-xs transition-all shadow-sm cursor-pointer self-start sm:self-auto shrink-0"
                  >
                    {aiLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>กำลังวิเคราะห์...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-indigo-200" />
                        <span>{aiAnalysis ? "วิเคราะห์ใหม่" : "วิเคราะห์ด้วย AI"}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* AI Error Alert if any */}
                {aiError && (
                  <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-medium flex items-center gap-2.5 mb-3.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{aiError}</span>
                  </div>
                )}

                {/* AI Loading Banner */}
                {aiLoading && (
                  <div className="p-4 mb-3.5 text-center bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2 animate-pulse">
                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-indigo-700">
                      <Brain className="w-4 h-4 animate-bounce" />
                      <span>กำลังประมวลผลข้อมูลผลการสอบและจุดอ่อนด้วย AI...</span>
                    </div>
                    <p className="text-[11px] text-gray-500">ระบบ AI กำลังค้นคว้าแนวทางเสริมจุดอ่อนและวางแผนอ่านหนังสือ (ใช้เวลา 2-5 วินาที)</p>
                  </div>
                )}

                {/* AI Summary Banner (if loaded) */}
                {aiAnalysis && (aiAnalysis.summary || aiAnalysis.overall_feedback) && !aiLoading && (
                  <div className="p-3.5 bg-indigo-50/60 rounded-xl border border-indigo-100/80 mb-3.5 space-y-1 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-xs font-medium text-indigo-700">
                      <Brain className="w-4 h-4" />
                      <span>สรุปผลการประเมินโดย AI:</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
                      {typeof (aiAnalysis.summary || aiAnalysis.overall_feedback) === "string"
                        ? (aiAnalysis.summary || aiAnalysis.overall_feedback)
                        : JSON.stringify(aiAnalysis.summary || aiAnalysis.overall_feedback, null, 2)}
                    </p>
                  </div>
                )}

                {/* AI Action Plan (if loaded) */}
                {aiAnalysis && aiAnalysis.action_plan && !aiLoading && (
                  <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-100 mb-3.5 space-y-1 animate-in fade-in duration-200">
                    <div className="flex items-center gap-2 text-xs font-medium text-teal-800">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      <span>แผนการอ่านหนังสือที่แนะนำ (Action Plan):</span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
                      {Array.isArray(aiAnalysis.action_plan) ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          {aiAnalysis.action_plan.map((step: any, sIdx: number) => (
                            <li key={sIdx}>{typeof step === "string" ? step : JSON.stringify(step)}</li>
                          ))}
                        </ul>
                      ) : typeof aiAnalysis.action_plan === "string" ? (
                        <p className="whitespace-pre-wrap">{aiAnalysis.action_plan}</p>
                      ) : (
                        <p>{JSON.stringify(aiAnalysis.action_plan, null, 2)}</p>
                      )}
                    </div>
                  </div>
                )}

                {loading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : weakTopicsList.length === 0 ? (
                  <div className="text-gray-400 text-sm text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-teal-500 mb-2" />
                    <p className="font-medium text-gray-600">ยินดีด้วย! คุณทำผลงานได้ดีเยี่ยม</p>
                    <p className="text-xs text-gray-400 mt-0.5">ยังไม่มีหัวข้อที่ต้องเร่งทบทวนเพิ่มเติมในขณะนี้</p>
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {displayedWeakTopics.map((topic, index) => {
                      const style =
                        priorityStyles[
                          topic.priority as keyof typeof priorityStyles
                        ] || defaultPriorityStyle;

                      // Find matching AI advice for this topic
                      const aiAdvice = (aiAnalysis?.weak_topics_advice || aiAnalysis?.analysis_points)?.find(
                        (a: any) => {
                          const aTopic = String(a?.topic || a?.title || "").toLowerCase();
                          const tTopic = topic.topic.toLowerCase();
                          return aTopic.includes(tTopic) || tTopic.includes(aTopic);
                        }
                      );

                      return (
                        <div
                          key={index}
                          className={`relative pl-4 pr-4 py-3.5 rounded-xl border transition-all ${style.card}`}
                        >
                          <div
                            className={`absolute left-0 top-3.5 bottom-3.5 w-1.5 rounded-full ${style.bar}`}
                          />
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-medium text-gray-800 text-base">
                                  {topic.topic}
                                </h3>
                                <span
                                  className={`text-xs px-2.5 py-0.5 rounded-full ${style.badge}`}
                                >
                                  {topic.priority}
                                </span>
                              </div>
                              <p className="text-sm text-gray-500 mb-2 font-medium">
                                หมวดวิชา: {topic.subject}
                              </p>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                                <span className="inline-flex items-center gap-1.5">
                                  <span>คะแนนที่ได้:</span>
                                  <span className="font-medium text-gray-800">
                                    {topic.score}
                                  </span>
                                  <span>/ 100</span>
                                </span>
                                <span className="inline-flex items-center gap-1.5 text-gray-500">
                                  <Clock className="w-4 h-4 text-gray-400" />
                                  <span>เวลาทบทวนที่แนะนำ {topic.study_time}</span>
                                </span>
                              </div>

                              {/* AI advice integrated into weak topic card */}
                              {aiAdvice && (
                                <div className="mt-3 pt-2.5 border-t border-indigo-100/70 bg-indigo-50/50 -mx-4 -mb-3.5 p-3 rounded-b-xl space-y-1.5 animate-in fade-in duration-200">
                                  <div className="flex items-center gap-1.5 text-[11px] font-medium text-indigo-700">
                                    <Bot className="w-3.5 h-3.5" />
                                    <span>คำแนะนำและเทคนิคการจำจาก AI:</span>
                                  </div>
                                  {aiAdvice.issue && (
                                    <p className="text-xs text-gray-600 font-medium">
                                      <span className="text-gray-400">จุดที่มักผิด:</span>{" "}
                                      {typeof aiAdvice.issue === "string" ? aiAdvice.issue : JSON.stringify(aiAdvice.issue)}
                                    </p>
                                  )}
                                  {(aiAdvice.recommendation || (aiAdvice as any).study_tip) && (
                                    <p className="text-xs sm:text-sm text-gray-700 font-medium bg-white p-2 rounded-lg border border-indigo-100/60 shadow-2xs">
                                      <span className="text-indigo-600">เทคนิค:</span>{" "}
                                      {typeof (aiAdvice.recommendation || (aiAdvice as any).study_tip) === "string"
                                        ? (aiAdvice.recommendation || (aiAdvice as any).study_tip)
                                        : JSON.stringify(aiAdvice.recommendation || (aiAdvice as any).study_tip)}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
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
      <Footer />
    </>
  );
};

export default PharmacistDashboard;