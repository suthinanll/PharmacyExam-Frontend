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
  BookOpen,
  ExternalLink,
  Calendar,
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

  // ── Topic Selection States ────────────────────────────────────────────────
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isActionPlanModalOpen, setIsActionPlanModalOpen] = useState(false);
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
              {/* Radar Chart Section */}
              <div className="flex flex-col">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-2xs">
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
                      onClick={() => setIsFilterModalOpen(true)}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 text-xs sm:text-sm font-medium transition cursor-pointer self-start sm:self-auto shadow-2xs"
                    >
                      <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                      <span>เลือกหัวข้อแสดงผล</span>
                      <span className="bg-indigo-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        {selectedSubjects.length}
                      </span>
                    </button>
                  )}
                </div>

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
                    <Layers className="w-8 h-8 text-indigo-400 mb-2" />
                    <p className="font-medium text-gray-700">ยังไม่ได้เลือกหัวข้อแสดงผล</p>
                    <p className="text-xs text-gray-400 mt-1 mb-3">กดปุ่ม "เลือกหัวข้อแสดงผล" เพื่อเลือกหัวข้อที่ต้องการ</p>
                    <button
                      type="button"
                      onClick={() => setIsFilterModalOpen(true)}
                      className="px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-xl hover:bg-indigo-700 transition cursor-pointer shadow-xs"
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

                {/* Comparison Insight Box (เปรียบเทียบในหัวข้อที่เลือก อันไหนเยอะ/น้อยสุด - ซ่อน/แสดงได้) */}
                {sortedSelectedTopics.length > 0 && (
                  <div className="bg-indigo-50/40 rounded-2xl border border-indigo-100 p-4 mt-4 transition-all">
                    <div
                      onClick={() => setShowComparisonSummary(!showComparisonSummary)}
                      className="flex items-center justify-between gap-2 cursor-pointer select-none"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                        <span className="font-medium text-gray-700">
                          สรุปเปรียบเทียบ <span className="text-indigo-600 font-medium">{sortedSelectedTopics.length}</span> หัวข้อที่เลือก:
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
                        className="flex items-center gap-1 text-xs text-indigo-600 font-medium hover:text-indigo-800 transition shrink-0 p-1 cursor-pointer"
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
                      <div className="space-y-2 pt-3 border-t border-indigo-100/60 mt-3 animate-in fade-in duration-200">
                        {sortedSelectedTopics.map((topic, index) => {
                          const isHighest = index === 0 && sortedSelectedTopics.length > 1;
                          const isLowest = index === sortedSelectedTopics.length - 1 && sortedSelectedTopics.length > 1;
                          return (
                            <div key={topic.subject} className="bg-white/90 rounded-xl p-2.5 border border-indigo-100/80">
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
                    )}
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
                    <p className="text-[11px] text-gray-500">ระบบ AI กำลังวิเคราะห์ผลคะแนนและจัดทำแผนการทบทวนรายบุคคล</p>
                  </div>
                )}

                {/* AI Summary Banner (if loaded) */}
                {aiAnalysis && (aiAnalysis.summary || aiAnalysis.overall_feedback) && !aiLoading && (
                  <div className="p-4 bg-indigo-50/70 rounded-2xl border border-indigo-100 mb-3.5 space-y-1.5 animate-in fade-in duration-200 shadow-2xs">
                    <div className="flex items-center gap-2 text-xs font-medium text-indigo-700">
                      <Brain className="w-4 h-4" />
                      <span className="font-semibold">สรุปผลการประเมินโดย AI:</span>
                    </div>
                    {(() => {
                      const summaryData = aiAnalysis.summary || aiAnalysis.overall_feedback;
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
                              <div key={i} className="text-xs sm:text-sm text-gray-700 leading-relaxed bg-white p-2.5 rounded-xl border border-indigo-100/60 shadow-2xs">
                                <span className="font-medium text-indigo-900 block mb-0.5">
                                  {k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}:
                                </span>
                                <span>{typeof v === "string" ? v : JSON.stringify(v)}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return (
                        <div className="bg-white/80 p-3 rounded-xl border border-indigo-100/60 shadow-2xs">
                          <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
                            {String(content)}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* AI Action Plan (if loaded) */}
                {aiAnalysis && aiAnalysis.action_plan && !aiLoading && (
                  <div className="p-4 bg-teal-50/70 rounded-2xl border border-teal-100 mb-3.5 space-y-3 animate-in fade-in duration-200 shadow-2xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-teal-800">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        <span className="font-semibold">แผนการอ่านหนังสือที่แนะนำ (Action Plan):</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsActionPlanModalOpen(true)}
                        className="text-xs text-teal-700 hover:text-teal-900 font-medium inline-flex items-center gap-1 bg-white hover:bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-200 transition cursor-pointer shadow-2xs"
                      >
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        <span>ดูแผนการอ่านฉบับเต็ม ↗</span>
                      </button>
                    </div>

                    {(() => {
                      const unwrapParsedData = (data: any): any => {
                        if (typeof data === "string") {
                          const trimmed = data.trim();
                          if (
                            (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
                            (trimmed.startsWith("[") && trimmed.endsWith("]"))
                          ) {
                            try {
                              return unwrapParsedData(JSON.parse(trimmed));
                            } catch {
                              return data;
                            }
                          }
                        }
                        if (Array.isArray(data)) {
                          return data.map((item) => unwrapParsedData(item));
                        }
                        if (typeof data === "object" && data !== null) {
                          const res: Record<string, any> = {};
                          for (const [k, v] of Object.entries(data)) {
                            res[k] = unwrapParsedData(v);
                          }
                          return res;
                        }
                        return data;
                      };

                      const parsedPlan = unwrapParsedData(aiAnalysis.action_plan);

                      // If structured object with schedule & general_strategies
                      if (typeof parsedPlan === "object" && parsedPlan !== null) {
                        const schedule = Array.isArray(parsedPlan.schedule) ? parsedPlan.schedule : [];
                        const strategies = Array.isArray(parsedPlan.general_strategies)
                          ? parsedPlan.general_strategies
                          : Array.isArray(parsedPlan.strategies)
                          ? parsedPlan.strategies
                          : [];

                        return (
                          <div className="space-y-2.5">
                            {/* Schedule highlights (first 2 days preview) */}
                            {schedule.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 border border-teal-200">
                                  ตารางอ่านหนังสือ ({schedule.length} วัน)
                                </span>
                                <div className="grid grid-cols-1 gap-2">
                                  {schedule.slice(0, 2).map((item: any, sIdx: number) => (
                                    <div
                                      key={sIdx}
                                      className="bg-white p-3 rounded-xl border border-teal-100/90 shadow-2xs space-y-1"
                                    >
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-semibold text-xs text-teal-800">
                                          วันที่ {item.day ?? sIdx + 1}: {item.focus_area || "ทบทวนเนื้อหา"}
                                        </span>
                                        {item.study_hours && (
                                          <span className="text-[11px] font-medium text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                                            {item.study_hours} ชม.
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                        {item.activities || JSON.stringify(item)}
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* General Strategies highlights */}
                            {strategies.length > 0 && (
                              <div className="space-y-1.5">
                                <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 border border-indigo-200">
                                  เทคนิคและกลยุทธ์สำคัญ
                                </span>
                                <div className="bg-white p-3 rounded-xl border border-teal-100/90 shadow-2xs space-y-1.5">
                                  {strategies.slice(0, 2).map((strat: any, stIdx: number) => (
                                    <div key={stIdx} className="flex items-start gap-2 text-xs text-gray-700 leading-relaxed">
                                      <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1.5" />
                                      <p className="flex-1">{typeof strat === "string" ? strat : JSON.stringify(strat)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Other custom keys if not schedule/strategies */}
                            {schedule.length === 0 && strategies.length === 0 && (
                              <div className="space-y-2">
                                {Object.entries(parsedPlan).map(([key, val], idx) => {
                                  const text = typeof val === "string" ? val : JSON.stringify(val);
                                  return (
                                    <div key={idx} className="bg-white p-3 rounded-xl border border-teal-100/90 shadow-2xs space-y-1">
                                      <span className="inline-block text-[11px] font-medium px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                                        {key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                                      </span>
                                      <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">{text}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* View full plan button */}
                            <button
                              type="button"
                              onClick={() => setIsActionPlanModalOpen(true)}
                              className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                            >
                              <BookOpen className="w-3.5 h-3.5" />
                              <span>เปิดดูตารางและเทคนิคการอ่านฉบับเต็ม</span>
                            </button>
                          </div>
                        );
                      }

                      // If Array format
                      if (Array.isArray(parsedPlan)) {
                        return (
                          <div className="space-y-2">
                            {parsedPlan.slice(0, 2).map((step: any, idx: number) => {
                              const stepText = typeof step === "string" ? step : step.text || step.task || step.action || JSON.stringify(step);
                              return (
                                <div
                                  key={idx}
                                  className="flex items-start gap-2.5 text-xs sm:text-sm text-gray-700 font-medium bg-white p-3 rounded-xl border border-teal-100/80 shadow-2xs"
                                >
                                  <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 text-xs font-medium flex items-center justify-center shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <p className="leading-relaxed flex-1">{stepText}</p>
                                </div>
                              );
                            })}
                            {parsedPlan.length > 2 && (
                              <button
                                type="button"
                                onClick={() => setIsActionPlanModalOpen(true)}
                                className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white font-medium text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                              >
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>ดูแผนทั้งหมดอีก {parsedPlan.length - 2} รายการ ↗</span>
                              </button>
                            )}
                          </div>
                        );
                      }

                      // Plain string
                      return (
                        <div className="bg-white p-3.5 rounded-xl border border-teal-100 shadow-2xs">
                          <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
                            {String(parsedPlan)}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {loading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : weakTopicsList.length === 0 ? (
                  aiAnalysis && (Array.isArray(aiAnalysis.weak_topics_advice) || Array.isArray(aiAnalysis.analysis_points)) ? (
                    <div className="space-y-3.5">
                      {(aiAnalysis.weak_topics_advice || aiAnalysis.analysis_points)?.map((item: any, index: number) => {
                        const topicName = typeof item === "string" ? item : item.topic || item.title || `หัวข้อที่ ${index + 1}`;
                        const style = priorityStyles["ต้องรีบทบทวน!"] || defaultPriorityStyle;
                        return (
                          <div
                            key={index}
                            className={`relative pl-4 pr-4 py-3.5 rounded-xl border transition-all ${style.card}`}
                          >
                            <div className={`absolute left-0 top-3.5 bottom-3.5 w-1.5 rounded-full ${style.bar}`} />
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h3 className="font-medium text-gray-800 text-base">{topicName}</h3>
                                  <span className={`text-xs px-2.5 py-0.5 rounded-full ${style.badge}`}>
                                    {item.priority || "AI ตรวจพบจุดอ่อน"}
                                  </span>
                                </div>
                                {item.issue && (
                                  <p className="text-xs text-gray-600 font-medium mb-1.5">
                                    <span className="text-gray-400">จุดที่มักผิด:</span>{" "}
                                    {typeof item.issue === "string" ? item.issue : JSON.stringify(item.issue)}
                                  </p>
                                )}
                                {(item.recommendation || item.study_tip) && (
                                  <p className="text-xs sm:text-sm text-gray-700 font-medium bg-white p-2 rounded-lg border border-indigo-100/60 shadow-2xs mb-2">
                                    <span className="text-indigo-600">เทคนิค:</span>{" "}
                                    {typeof (item.recommendation || item.study_tip) === "string"
                                      ? (item.recommendation || item.study_tip)
                                      : JSON.stringify(item.recommendation || item.study_tip)}
                                  </p>
                                )}
                                <div className="pt-1">
                                  <a
                                    href={
                                      item.link || item.reference_url
                                        ? String(item.link || item.reference_url)
                                        : `https://www.google.com/search?q=${encodeURIComponent(
                                            `${topicName} แนวทางการรักษา เภสัชกรรม`
                                          )}`
                                    }
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-medium hover:underline transition"
                                  >
                                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>อ่านเนื้อหาและแนวทางทบทวนเพิ่มเติม</span>
                                    <ExternalLink className="w-3 h-3 text-indigo-400" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-gray-400 text-sm text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center">
                      <CheckCircle2 className="w-10 h-10 text-teal-500 mb-2" />
                      <p className="font-medium text-gray-600">
                        {data?.stats?.total_exams === 0
                          ? "ยังไม่มีประวัติการทำข้อสอบ"
                          : "ยินดีด้วย! คุณทำผลงานได้ดีเยี่ยม"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5 max-w-sm px-4">
                        {data?.stats?.total_exams === 0
                          ? "กรุณาเข้าไปฝึกทำข้อสอบก่อน เพื่อให้ระบบนำผลคะแนนมาวิเคราะห์จุดแข็ง-จุดอ่อนรายวิชา"
                          : "ยังไม่มีหัวข้อที่คะแนนต่ำกว่าเกณฑ์ในขณะนี้ หรือกดปุ่ม 'วิเคราะห์ด้วย AI' เพื่อประเมินเชิงลึก"}
                      </p>
                    </div>
                  )
                ) : (
                  <div className="space-y-2">
                    {displayedWeakTopics.map((topic, index) => {
                      const style =
                        priorityStyles[
                          topic.priority as keyof typeof priorityStyles
                        ] || defaultPriorityStyle;

                      const aiAdvice = (aiAnalysis?.weak_topics_advice || aiAnalysis?.analysis_points)?.find(
                        (a: any) => {
                          const aTopic = String(a?.topic || a?.title || "").toLowerCase();
                          const tTopic = topic.topic.toLowerCase();
                          return aTopic.includes(tTopic) || tTopic.includes(aTopic);
                        }
                      );

                      const isExpanded = expandedWeakTopics.has(index);
                      const hasDetail = aiAdvice && (aiAdvice.issue || aiAdvice.recommendation || (aiAdvice as any).study_tip);

                      return (
                        <div
                          key={index}
                          className={`relative rounded-xl border overflow-hidden transition-all ${style.card}`}
                        >
                          {/* Left accent bar */}
                          <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.bar}`} />

                          {/* Main row */}
                          <div className="flex items-center gap-3 pl-4 pr-3 py-3">
                            {/* Topic name + badge */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-medium text-gray-800 text-sm truncate">
                                  {topic.topic}
                                </span>
                                <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${style.badge}`}>
                                  {topic.priority}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span className="font-medium text-gray-600">{topic.subject}</span>
                                <span className="text-gray-300">·</span>
                                <span>
                                  คะแนน{" "}
                                  <span className="font-semibold text-gray-700">{topic.score}</span>
                                  <span className="text-gray-400">/100</span>
                                </span>
                              </div>
                            </div>

                            {/* Right actions */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {/* Link button */}
                              <a
                                href={`https://www.google.com/search?q=${encodeURIComponent(
                                  `${topic.subject} ${topic.topic} เภสัชกรรม แนวทาง`
                                )}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-7 h-7 rounded-lg flex items-center justify-center bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 text-gray-400 hover:text-indigo-600 transition"
                                title="ค้นหาบทความทบทวน"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>

                              {/* Expand toggle (only if AI advice exists) */}
                              {hasDetail && (
                                <button
                                  type="button"
                                  onClick={() => toggleWeakTopic(index)}
                                  className={`w-7 h-7 rounded-lg flex items-center justify-center border transition ${
                                    isExpanded
                                      ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                                      : "bg-white border-gray-200 text-gray-400 hover:bg-indigo-50 hover:border-indigo-300 hover:text-indigo-600"
                                  }`}
                                  title={isExpanded ? "ซ่อนเทคนิค AI" : "ดูเทคนิค AI"}
                                >
                                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Expandable AI detail */}
                          {hasDetail && isExpanded && (
                            <div className="pl-4 pr-3 pb-3 border-t border-indigo-100/50 bg-indigo-50/40 space-y-2 pt-2.5">
                              {aiAdvice.issue && (
                                <p className="text-xs text-gray-600 leading-relaxed">
                                  <span className="font-medium text-gray-500">จุดที่มักผิด: </span>
                                  {typeof aiAdvice.issue === "string" ? aiAdvice.issue : JSON.stringify(aiAdvice.issue)}
                                </p>
                              )}
                              {(aiAdvice.recommendation || (aiAdvice as any).study_tip) && (
                                <div className="flex items-start gap-1.5 text-xs text-indigo-800 bg-white p-2.5 rounded-lg border border-indigo-100 shadow-2xs">
                                  <Lightbulb className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                                  <p className="leading-relaxed font-medium">
                                    {typeof (aiAdvice.recommendation || (aiAdvice as any).study_tip) === "string"
                                      ? (aiAdvice.recommendation || (aiAdvice as any).study_tip)
                                      : JSON.stringify(aiAdvice.recommendation || (aiAdvice as any).study_tip)}
                                  </p>
                                </div>
                              )}
                            </div>
                          )}
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
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
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
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition cursor-pointer"
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
              {selectedSubjects.length > 0 && (
                <button
                  type="button"
                  onClick={clearSelection}
                  className="px-2.5 py-1.5 rounded-xl text-xs font-medium text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                >
                  ล้างการเลือก
                </button>
              )}
            </div>

            {/* Topic Checklist List */}
            <div className="space-y-2 overflow-y-auto pr-1 flex-1 py-1">
              {data?.radar_data?.map((item) => {
                const isChecked = selectedSubjects.includes(item.subject);
                return (
                  <button
                    key={item.subject}
                    type="button"
                    onClick={() => toggleSubject(item.subject)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all cursor-pointer text-left
                      ${isChecked
                        ? "bg-indigo-50/70 border-indigo-300 text-indigo-900 shadow-2xs"
                        : "bg-gray-50/50 border-gray-200 text-gray-600 hover:bg-gray-100/70"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors
                          ${isChecked
                            ? "bg-indigo-600 border-indigo-600 text-white"
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
                          ? "bg-indigo-100 text-indigo-700"
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
                เลือกแล้ว {selectedSubjects.length} จาก {totalRadarCount} หัวข้อ
              </span>
              <button
                type="button"
                onClick={() => setIsFilterModalOpen(false)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition cursor-pointer shadow-sm"
              >
                บันทึกและนำไปแสดงผล
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: แผนการอ่านหนังสือและการเตรียมสอบฉบับเต็ม (Action Plan Modal) ────── */}
      {isActionPlanModalOpen && aiAnalysis?.action_plan && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-gray-200 flex flex-col max-h-[85vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-2xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">
                    แผนการอ่านหนังสือและการเตรียมสอบรายบุคคล
                  </h3>
                  <p className="text-xs text-gray-500">
                    วิเคราะห์และวางแผนแบบเจาะจงตามจุดอ่อนจากผลคะแนนสอบของคุณ
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsActionPlanModalOpen(false)}
                className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="space-y-4 overflow-y-auto pr-1 flex-1 py-1">
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

                const plan = unwrap(aiAnalysis.action_plan);

                if (typeof plan === "object" && plan !== null) {
                  const schedule = Array.isArray(plan.schedule) ? plan.schedule : [];
                  const strategies = Array.isArray(plan.general_strategies)
                    ? plan.general_strategies
                    : Array.isArray(plan.strategies)
                    ? plan.strategies
                    : [];

                  return (
                    <div className="space-y-5">
                      {/* Full Timetable */}
                      {schedule.length > 0 && (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 text-sm font-semibold text-teal-800 pb-1 border-b border-teal-100">
                            <Clock className="w-4 h-4 text-teal-600" />
                            <span>ตารางอ่านหนังสือรายวัน (Daily Study Plan)</span>
                          </div>
                          <div className="space-y-2.5">
                            {schedule.map((item: any, idx: number) => (
                              <div
                                key={idx}
                                className="bg-gray-50/80 p-4 rounded-xl border border-gray-200/80 space-y-2"
                              >
                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                  <div className="flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-teal-600 text-white text-xs font-semibold flex items-center justify-center">
                                      {item.day ?? idx + 1}
                                    </span>
                                    <span className="font-semibold text-sm text-gray-800">
                                      {item.focus_area || "ทบทวนเนื้อหา"}
                                    </span>
                                  </div>
                                  {item.study_hours && (
                                    <span className="text-xs font-medium text-teal-700 bg-teal-100/70 px-2.5 py-0.5 rounded-full border border-teal-200">
                                      เป้าหมาย: {item.study_hours} ชั่วโมง
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs sm:text-sm text-gray-700 leading-relaxed bg-white p-3 rounded-lg border border-gray-100">
                                  <p className="font-medium text-gray-800 mb-0.5">กิจกรรมและเนื้อหาที่ต้องเน้น:</p>
                                  <p className="whitespace-pre-wrap">{item.activities || JSON.stringify(item)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Full Strategies */}
                      {strategies.length > 0 && (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900 pb-1 border-b border-indigo-100">
                            <Lightbulb className="w-4 h-4 text-indigo-600" />
                            <span>เทคนิคและกลยุทธ์การจำ (Key Strategies & Techniques)</span>
                          </div>
                          <div className="space-y-2">
                            {strategies.map((strat: any, sIdx: number) => (
                              <div
                                key={sIdx}
                                className="flex items-start gap-3 p-3 bg-indigo-50/50 rounded-xl border border-indigo-100/70 text-xs sm:text-sm text-gray-700"
                              >
                                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                                  {sIdx + 1}
                                </span>
                                <p className="leading-relaxed flex-1 font-medium">
                                  {typeof strat === "string" ? strat : JSON.stringify(strat)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Generic key values if not schedule */}
                      {schedule.length === 0 && strategies.length === 0 && (
                        <div className="space-y-3">
                          {Object.entries(plan).map(([k, v], idx) => (
                            <div key={idx} className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1.5">
                              <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-teal-100 text-teal-800">
                                {k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                              </span>
                              <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                                {typeof v === "string" ? v : JSON.stringify(v, null, 2)}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                if (Array.isArray(plan)) {
                  return (
                    <div className="space-y-2.5">
                      {plan.map((step: any, sIdx: number) => {
                        const stepText = typeof step === "string" ? step : JSON.stringify(step);
                        return (
                          <div
                            key={sIdx}
                            className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs sm:text-sm text-gray-700"
                          >
                            <span className="w-6 h-6 rounded-full bg-teal-600 text-white font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {sIdx + 1}
                            </span>
                            <p className="leading-relaxed flex-1 font-medium">{stepText}</p>
                          </div>
                        );
                      })}
                    </div>
                  );
                }

                return (
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-medium">
                      {String(plan)}
                    </p>
                  </div>
                );
              })()}
            </div>

            {/* Modal Footer */}
            <div className="pt-4 mt-3 border-t border-gray-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsActionPlanModalOpen(false)}
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-medium rounded-xl transition cursor-pointer shadow-sm"
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