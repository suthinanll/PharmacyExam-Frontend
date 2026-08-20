"use client";
import { useState, useEffect } from "react";
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
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

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

// ── Design tokens ────────────────────────────────────────────────────────
// bg page   #F6F7FB   surface #FFFFFF   surface muted #F1F2F8
// border    #E6E8F2   text primary #1C2033   text secondary #6B7089
// brand (indigo) #4C51E6   teal #0EA5A0   amber #F59E0B   red #EF4444
// Font: Kanit (headings, numbers, and body)

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
    card: "bg-red-50/60 border-red-100",
    bar: "bg-red-500",
    badge: "bg-red-100 text-red-600",
    dot: "bg-red-500",
  },
  ควรทบทวนเพิ่มเติม: {
    card: "bg-amber-50/60 border-amber-100",
    bar: "bg-amber-500",
    badge: "bg-amber-100 text-amber-700",
    dot: "bg-amber-500",
  },
  "พอใช้ แต่ควรฝึกฝนเพิ่มเติม": {
    card: "bg-yellow-50/60 border-yellow-100",
    bar: "bg-yellow-400",
    badge: "bg-yellow-100 text-yellow-700",
    dot: "bg-yellow-400",
  },
  ทำได้ดี: {
    card: "bg-teal-50/60 border-teal-100",
    bar: "bg-teal-500",
    badge: "bg-teal-100 text-teal-700",
    dot: "bg-teal-500",
  },
} as const;

const defaultPriorityStyle = {
  card: "bg-gray-50 border-gray-100",
  bar: "bg-gray-400",
  badge: "bg-gray-100 text-gray-600",
  dot: "bg-gray-400",
};

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-[#EEEFF6] rounded-xl ${className}`} />
);

// ── Stat row (horizontal list item) ─────────────────────────────────────
interface StatRowProps {
  icon: React.ReactNode;
  accent: string; // hex for icon bg + text
  accentSoft: string; // hex for icon bg tint
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
  <div className="flex items-center gap-3 px-4 py-3.5 sm:gap-4">
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
      style={{ backgroundColor: accentSoft, color: accent }}
    >
      {icon}
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-xs text-[#6B7089] leading-snug truncate">{label}</p>
      {loading ? (
        <Skeleton className="h-6 w-20 mt-1" />
      ) : (
        <div className="flex items-baseline gap-1.5 mt-0.5">
          <span
            className="text-xl leading-none font-medium tracking-tight text-[#1C2033]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {value}
          </span>
          <span className="text-xs font-medium text-[#8A8FA3] truncate">
            {unit}
          </span>
        </div>
      )}
    </div>

    {sublabel && !loading && (
      <span
        className="text-xs font-medium px-2 py-1 rounded-full shrink-0"
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

  const fontStyles = (
    <style jsx global>{`
      @import url("https://fonts.googleapis.com/css2?family=Kanit:wght@400;500;600;700;800&display=swap");
      :root {
        --font-display: "Kanit", ui-sans-serif, system-ui, sans-serif;
        --font-body: "Kanit", ui-sans-serif, system-ui, sans-serif;
      }
    `}</style>
  );

  if (error) {
    return (
      <>
        {fontStyles}
        <Navbar_user />
        <div
          className="min-h-screen bg-[#F6F7FB] flex items-center justify-center px-4"
          style={{ fontFamily: "var(--font-body)" }}
        >
          <div className="bg-white rounded-2xl p-8 max-w-md w-full border border-[#E6E8F2]">
            <div className="w-14 h-14 rounded-xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-7 h-7 text-red-500" />
            </div>
            <h2
              className="text-xl font-medium text-[#1C2033] text-center mb-2"
              style={{ fontFamily: "var(--font-display)" }}
            >
              เกิดข้อผิดพลาด
            </h2>
            <p className="text-sm text-[#6B7089] text-center mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="w-full flex items-center justify-center gap-2 bg-[#4C51E6] text-white py-3 rounded-xl hover:bg-[#3E42C9] transition-colors font-medium text-sm"
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

  return (
    <>
      {fontStyles}
      <Navbar_user />

      <div
        className="min-h-screen bg-[#F6F7FB] p-4 md:p-6 lg:p-8"
        style={{ fontFamily: "var(--font-body)" }}
      >
        <div className="max-w-7xl mx-auto">
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="mb-5">
            <div className="flex items-center text-sm text-[#9498AC] mb-2">
              <Link
                href="/user"
                className="hover:text-[#4C51E6] cursor-pointer transition"
              >
                หน้าหลัก
              </Link>
              <span className="mx-2">›</span>
              <span className="text-[#6B7089] font-medium">
                ติดตามความคืบหน้า
              </span>
            </div>

            <h1
              className="text-2xl md:text-3xl font-medium text-[#1C2033]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              ติดตามความคืบหน้า
            </h1>
            <p className="text-sm text-[#6B7089] mt-1">
              ภาพรวมผลการทำข้อสอบและจุดที่ควรพัฒนาของคุณ
            </p>
          </div>

          {/* ── Ranking card ────────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-[#E6E8F2] p-4 md:p-5 mb-4">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#EEEEFC] flex items-center justify-center text-[#4C51E6]">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h2
                className="text-base font-medium text-[#1C2033]"
                style={{ fontFamily: "var(--font-display)" }}
              >
                อันดับของคุณ
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-[#F6F7FB] rounded-lg p-4">
                <p className="text-xs text-[#6B7089] mb-2">
                  อันดับปัจจุบัน (จากผู้ใช้ทั้งหมด)
                </p>
                {loading ? (
                  <Skeleton className="h-11 w-40 mb-3" />
                ) : (
                  <>
                    <div className="flex items-end gap-1.5">
                      <span
                        className="text-4xl font-medium text-[#4C51E6] tracking-tight"
                        style={{ fontFamily: "var(--font-display)" }}
                      >
                        #{data?.ranking?.current_rank ?? "-"}
                      </span>
                      <span className="text-base text-[#9498AC] mb-1">
                        จาก {data?.ranking?.total_users?.toLocaleString() ?? "-"} คน
                      </span>
                    </div>
                    {data?.ranking && (
                      <div className="mt-2 inline-flex items-center gap-1.5">
                        {rankChange > 0 ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full">
                            <TrendingUp className="w-3.5 h-3.5" />
                            ดีขึ้น {rankChange} อันดับ
                          </span>
                        ) : rankChange < 0 ? (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-red-500 bg-red-50 px-2.5 py-1 rounded-full">
                            <TrendingDown className="w-3.5 h-3.5" />
                            ลดลง {Math.abs(rankChange)} อันดับ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-[#9498AC] bg-[#F1F2F8] px-2.5 py-1 rounded-full">
                            <Minus className="w-3.5 h-3.5" />
                            อันดับคงที่
                          </span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="bg-[#F6F7FB] rounded-lg p-4">
                <p className="text-xs text-[#6B7089] mb-3">
                  เปรียบเทียบคะแนน (เต็ม 100 คะแนน)
                </p>
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      {
                        label: "คะแนนสูงสุดในเว็บของเรา",
                        value: data?.ranking.score_range.top ?? 0,
                        color: "#9498AC",
                      },
                      {
                        label: "คะแนนของคุณ",
                        value: data?.ranking.score_range.user_score ?? 0,
                        color: "#4C51E6",
                      },
                    ].map(({ label, value, color }) => (
                      <div key={label}>
                        <div className="flex justify-between text-sm mb-1.5">
                          <span className="text-[#6B7089]">{label}</span>
                          <span className="font-medium text-[#1C2033]">
                            {value} คะแนน
                          </span>
                        </div>
                        <div className="w-full bg-[#E6E8F2] rounded-full h-2">
                          <div
                            className="h-2 rounded-full transition-all duration-700"
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
          <div className="bg-white rounded-xl border border-[#E6E8F2] mb-4 grid grid-cols-1 sm:grid-cols-2 divide-y divide-[#EEEFF6] sm:divide-y-0">
            <div className="sm:border-b sm:border-[#EEEFF6]">
              <StatRow
                icon={<FileText className="w-5 h-5" />}
                accent="#4C51E6"
                accentSoft="#EEEEFC"
                value={data?.stats.total_exams ?? "—"}
                unit="ชุด"
                label="จำนวนข้อสอบที่ทำไปแล้ว"
                sublabel="ทั้งหมด"
                loading={loading}
              />
            </div>
            <div className="sm:border-b sm:border-l sm:border-[#EEEFF6]">
              <StatRow
                icon={<CheckCircle2 className="w-5 h-5" />}
                accent="#0EA5A0"
                accentSoft="#E6F9F7"
                value={data?.stats.passed_exams ?? "—"}
                unit={`ชุด จาก ${data?.stats.total_exams ?? 0} ชุด`}
                label="จำนวนชุดข้อสอบที่ผ่านเกณฑ์"
                sublabel={`${passRate}%`}
                loading={loading}
              />
            </div>
            <div>
              <StatRow
                icon={<Star className="w-5 h-5" />}
                accent="#F59E0B"
                accentSoft="#FEF3E2"
                value={data?.stats.average_score ?? "—"}
                unit="คะแนน / 100"
                label="คะแนนเฉลี่ยรวม"
                loading={loading}
              />
            </div>
            <div className="sm:border-l sm:border-[#EEEFF6]">
              <StatRow
                icon={<Clock className="w-5 h-5" />}
                accent="#8B5CF6"
                accentSoft="#F3EEFD"
                value={studyTime.value}
                unit={studyTime.unit}
                label="เวลาสะสมที่ทำข้อสอบ"
                loading={loading}
              />
            </div>
          </div>

          {/* ── Analysis section ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-xl border border-[#E6E8F2] p-4 md:p-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <h2
                  className="text-base font-medium text-[#1C2033] mb-4"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  วิเคราะห์จุดแข็ง-จุดอ่อน
                </h2>
                {loading ? (
                  <Skeleton className="h-[350px] w-full" />
                ) : (data?.radar_data?.length ?? 0) === 0 ? (
                  <div className="h-[350px] flex items-center justify-center text-[#9498AC] text-sm">
                    ยังไม่มีข้อมูลเพียงพอ
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={data!.radar_data}>
                      <PolarGrid stroke="#E6E8F2" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 11, fill: "#6B7089" }}
                      />
                      <PolarRadiusAxis
                        angle={90}
                        domain={[0, 100]}
                        tick={{ fontSize: 11, fill: "#9498AC" }}
                      />
                      <Radar
                        name="คะแนนของคุณ"
                        dataKey="score"
                        stroke="#4C51E6"
                        fill="#4C51E6"
                        fillOpacity={0.35}
                        strokeWidth={2}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #E6E8F2",
                          boxShadow: "0 4px 12px rgba(28,32,51,0.08)",
                        }}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="lg:border-l lg:border-[#E6E8F2] lg:pl-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <h2
                    className="text-base font-medium text-[#1C2033]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    ควรทบทวนเพิ่มเติม
                  </h2>
                </div>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : (data?.weak_topics?.length ?? 0) === 0 ? (
                  <div className="text-[#9498AC] text-sm text-center py-12">
                    ยังไม่มีข้อมูล
                  </div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {data!.weak_topics.map((topic, index) => {
                      const style =
                        priorityStyles[
                          topic.priority as keyof typeof priorityStyles
                        ] || defaultPriorityStyle;
                      return (
                        <div
                          key={index}
                          className={`relative pl-3.5 pr-3.5 py-2.5 rounded-lg border ${style.card}`}
                        >
                          <div
                            className={`absolute left-0 top-3 bottom-3 w-1 rounded-full ${style.bar}`}
                          />
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                <h3 className="font-medium text-[#1C2033] text-sm">
                                  {topic.topic}
                                </h3>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full font-medium whitespace-nowrap ${style.badge}`}
                                >
                                  {topic.priority}
                                </span>
                              </div>
                              <p className="text-xs text-[#9498AC] mb-2.5">
                                {topic.subject}
                              </p>
                              <div className="flex flex-wrap gap-3 text-xs text-[#6B7089]">
                                <span className="inline-flex items-center gap-1">
                                  <span className="font-medium text-[#1C2033]">
                                    {topic.score}
                                  </span>
                                  คะแนน
                                </span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {topic.study_time}
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