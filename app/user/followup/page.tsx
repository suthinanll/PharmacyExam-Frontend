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
  SlidersHorizontal,
  Award,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/LoadingSpinner";

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
  const { getToken } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Radar Chart Filtering States ──────────────────────────────────────────
  const [radarFilterMode, setRadarFilterMode] = useState<"all" | "strengths" | "weaknesses">("all");
  const [radarLimit, setRadarLimit] = useState<number>(6);

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
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [getToken]);

  // ── Filtered Radar Data ───────────────────────────────────────────────────
  const filteredRadarData = useMemo(() => {
    if (!data?.radar_data || data.radar_data.length === 0) return [];

    let list = [...data.radar_data];

    // เรียงลำดับตามโหมดที่เลือก
    if (radarFilterMode === "strengths") {
      list.sort((a, b) => b.score - a.score);
    } else if (radarFilterMode === "weaknesses") {
      list.sort((a, b) => a.score - b.score);
    }

    // ตัดจำนวนหัวข้อตาม Limit (ถ้าไม่ใช่ 0 หรือ -1)
    if (radarLimit > 0 && radarLimit < list.length) {
      list = list.slice(0, radarLimit);
    }

    return list;
  }, [data?.radar_data, radarFilterMode, radarLimit]);

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
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700 transition-colors font-medium text-sm shadow-sm"
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
              {/* Radar Chart Section with Filters */}
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-2xs">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-medium text-gray-800">
                        วิเคราะห์จุดแข็ง - จุดอ่อน
                      </h2>
                      <p className="text-xs sm:text-sm text-gray-500">กราฟเรดาร์แสดงระดับคะแนนรายหัวข้อ</p>
                    </div>
                  </div>

                  {/* Limit Filter Pill Controls */}
                  {totalRadarCount > 0 && (
                    <div className="flex items-center gap-1.5 self-start sm:self-auto bg-gray-100 p-1 rounded-xl">
                      <span className="text-xs text-gray-500 font-medium px-2 flex items-center gap-1">
                        <SlidersHorizontal className="w-3 h-3" /> แสดง:
                      </span>
                      {[
                        { label: "5", val: 5 },
                        { label: "7", val: 7 },
                        { label: "10", val: 10 },
                        { label: "ทั้งหมด", val: 0 },
                      ].map((item) => {
                        const isSelected = item.val === 0 ? radarLimit >= totalRadarCount || radarLimit === 0 : radarLimit === item.val;
                        return (
                          <button
                            key={item.label}
                            onClick={() => setRadarLimit(item.val === 0 ? totalRadarCount : item.val)}
                            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer
                              ${isSelected
                                ? "bg-white text-indigo-700 shadow-xs ring-1 ring-black/5"
                                : "text-gray-600 hover:text-gray-900"
                              }`}
                          >
                            {item.label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Filter Mode Selector (ทั้งหมด / จุดแข็ง / จุดอ่อน) */}
                {totalRadarCount > 0 && (
                  <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1">
                    <button
                      onClick={() => setRadarFilterMode("all")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer shrink-0
                        ${radarFilterMode === "all"
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                          : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                        }`}
                    >
                      ทั้งหมด
                    </button>
                    <button
                      onClick={() => setRadarFilterMode("strengths")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer shrink-0 flex items-center gap-1.5
                        ${radarFilterMode === "strengths"
                          ? "bg-teal-600 text-white border-teal-600 shadow-xs"
                          : "bg-white text-teal-700 border-teal-200 hover:bg-teal-50"
                        }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      ⭐ จุดแข็งสูงสุด (Top Strengths)
                    </button>
                    <button
                      onClick={() => setRadarFilterMode("weaknesses")}
                      className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium border transition-all cursor-pointer shrink-0 flex items-center gap-1.5
                        ${radarFilterMode === "weaknesses"
                          ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                          : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
                        }`}
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      ⚠️ จุดที่ควรพัฒนา (Needs Improvement)
                    </button>
                  </div>
                )}

                {/* Subtitle indicator */}
                {totalRadarCount > 0 && (
                  <div className="flex justify-between items-center text-xs text-gray-500 mb-2 px-1">
                    <span>
                      กำลังแสดง <b className="text-indigo-600 font-medium">{filteredRadarData.length}</b> จากทั้งหมด {totalRadarCount} หัวข้อ
                    </span>
                    {radarFilterMode !== "all" && (
                      <span className="text-gray-400">
                        {radarFilterMode === "strengths" ? "เรียงจากคะแนนสูงสุดไปน้อยสุด" : "เรียงจากคะแนนที่ควรปรับปรุง"}
                      </span>
                    )}
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
                ) : (
                  <div className="w-full h-[360px] bg-gray-50/40 rounded-2xl p-2 border border-gray-100">
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
                          stroke={radarFilterMode === "weaknesses" ? "#D97706" : radarFilterMode === "strengths" ? "#0D9488" : "#4F46E5"}
                          fill={radarFilterMode === "weaknesses" ? "#F59E0B" : radarFilterMode === "strengths" ? "#14B8A6" : "#6366F1"}
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
                )}
              </div>

              {/* Weak Topics List Section */}
              <div className="lg:border-l lg:border-gray-200 lg:pl-8 flex flex-col justify-start">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-2xs">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-medium text-gray-800">
                      หัวข้อที่ควรทบทวนเพิ่มเติม
                    </h2>
                    <p className="text-xs sm:text-sm text-gray-500">ลำดับความสำคัญและเวลาทบทวนที่แนะนำ</p>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : (data?.weak_topics?.length ?? 0) === 0 ? (
                  <div className="text-gray-400 text-sm text-center py-16 border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center">
                    <CheckCircle2 className="w-10 h-10 text-teal-500 mb-2" />
                    <p className="font-medium text-gray-600">ยินดีด้วย! คุณทำผลงานได้ดีเยี่ยม</p>
                    <p className="text-xs text-gray-400 mt-0.5">ยังไม่มีหัวข้อที่ต้องเร่งทบทวนเพิ่มเติมในขณะนี้</p>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[440px] overflow-y-auto pr-1 custom-scrollbar">
                    {data!.weak_topics.map((topic, index) => {
                      const style =
                        priorityStyles[
                          topic.priority as keyof typeof priorityStyles
                        ] || defaultPriorityStyle;
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
                            </div>
                          </div>
                        </div>
                      );
                    })}
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