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
  CheckCircle,
  Star,
  Clock,
  TrendingUp,
  AlertCircle,
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

// ── Helper Functions & Styles ───────────────────────────────────────────────

const formatStudyTime = (totalMinutes: number | undefined) => {
  if (totalMinutes === undefined || totalMinutes <= 0) return "0 นาที";
  if (totalMinutes < 60) return `${totalMinutes} นาที`;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  return mins > 0 ? `${hours} ชม. ${mins} นาที` : `${hours} ชม.`;
};

const priorityStyles = {
  "ต้องรีบทบทวน!": {
    card: "bg-red-50 border-red-200 hover:border-red-300",
    badge: "bg-red-200 text-red-700",
  },
  ควรทบทวนเพิ่มเติม: {
    card: "bg-orange-50 border-orange-200 hover:border-orange-300",
    badge: "bg-orange-200 text-orange-700",
  },
  "พอใช้ แต่ควรฝึกฝนเพิ่มเติม": {
    card: "bg-yellow-50 border-yellow-200 hover:border-yellow-300",
    badge: "bg-yellow-200 text-yellow-700",
  },
  ทำได้ดี: {
    card: "bg-green-50 border-green-200 hover:border-green-300",
    badge: "bg-green-200 text-green-700",
  },
} as const;

const defaultPriorityStyle = {
  card: "bg-gray-50 border-gray-200",
  badge: "bg-gray-200 text-gray-700",
};

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-200 rounded-xl ${className}`} />
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

  if (error) {
    return (
      <>
        <Navbar_user />
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-800 mb-2">
              โหลดข้อมูลไม่สำเร็จ
            </h2>
            <p className="text-gray-500 text-sm mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-indigo-600 text-white px-6 py-2 rounded-xl hover:bg-indigo-700 transition"
            >
              ลองใหม่อีกครั้ง
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const passRate = data
    ? data.stats.total_exams > 0 
      ? ((data.stats.passed_exams / data.stats.total_exams) * 100).toFixed(1)
      : "0"
    : "0";

  return (
    <>
      <Navbar_user />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="mb-8">
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <Link
                href="/user"
                className="hover:text-blue-600 cursor-pointer transition"
              >
                หน้าหลัก
              </Link>
              <span className="mx-2">›</span>
              <span className="text-gray-700 font-medium">ติดตามความคืบหน้า</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-medium text-gray-800 mb-2">
                  ติดตามความคืบหน้า
                </h1>
              </div>
            </div>
          </div>

          {/* ── Ranking card ────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-100 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-medium text-gray-800">อันดับของคุณ</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-lg text-gray-600 mb-2">อันดับปัจจุบัน</p>
                {loading ? (
                  <Skeleton className="h-12 w-40 mb-3" />
                ) : (
                  <>
                    <div className="flex items-end gap-2">
                      <p className="text-5xl font-medium text-indigo-600">
                        #{data?.ranking?.current_rank || "-"}
                      </p>
                      <p className="text-lg text-gray-500 mb-2">
                        / {data?.ranking?.total_users?.toLocaleString() || "-"}
                      </p>
                    </div>
                    {data?.ranking && (
                      <div className="mt-3">
                        {data.ranking.rank_change > 0 ? (
                          <span className="text-green-600 text-lg font-medium flex items-center gap-1">
                            ↑ ดีขึ้น {data.ranking.rank_change} อันดับ
                          </span>
                        ) : data.ranking.rank_change < 0 ? (
                          <span className="text-red-500 text-lg font-medium flex items-center gap-1">
                            ↓ ลดลง {Math.abs(data.ranking.rank_change)} อันดับ
                          </span>
                        ) : (
                          <span className="text-gray-400 text-lg font-medium">อันดับคงที่</span>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-lg text-gray-600 mb-4">เปรียบเทียบคะแนน</p>
                {loading ? (
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {[
                      { label: "คะแนนสูงสุด", value: data?.ranking.score_range.top ?? 0 },
                      { label: "คะแนนของคุณ", value: data?.ranking.score_range.user_score ?? 0 },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <div className="flex justify-between text-lg mb-1 text-gray-600">
                          <span>{label}</span>
                          <span className="font-normal text-gray-800">{value}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-700"
                            style={{ width: `${Math.min(value, 100)}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Stats cards ──────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            {[
              {
                icon: <FileText className="w-6 h-6 text-blue-600" />,
                bg: "bg-blue-100",
                value: data?.stats.total_exams,
                label: "ข้อสอบที่ทำ",
                badge: "ทั้งหมด",
                badgeClass: "text-gray-500 bg-gray-100",
                valueClass: "text-gray-800",
              },
              {
                icon: <CheckCircle className="w-6 h-6 text-green-600" />,
                bg: "bg-green-100",
                value: data?.stats.passed_exams,
                label: "ผ่านเกณฑ์",
                badge: `${passRate}%`,
                badgeClass: "text-green-700 bg-green-100",
                valueClass: "text-green-600",
              },
              {
                icon: <Star className="w-6 h-6 text-yellow-600" />,
                bg: "bg-yellow-100",
                value: data?.stats.average_score,
                label: "คะแนนเฉลี่ย",
                badge: "เฉลี่ย",
                badgeClass: "text-gray-500 bg-gray-100",
                valueClass: "text-yellow-600",
              },
              {
                icon: <Clock className="w-6 h-6 text-purple-600" />,
                bg: "bg-purple-100",
                value: formatStudyTime(data?.stats.study_minutes),
                label: "เวลาที่ทำข้อสอบ",
                badge: "สะสม",
                badgeClass: "text-purple-700 bg-purple-100",
                valueClass: "text-purple-600 text-2xl",
              },
            ].map(({ icon, bg, value, label, badge, badgeClass, valueClass }) => (
              <div
                key={label}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`${bg} p-3 rounded-xl`}>{icon}</div>
                  <span className={`text-xs font-medium px-3 py-1 rounded-full ${badgeClass}`}>
                    {badge}
                  </span>
                </div>
                {loading ? (
                  <Skeleton className="h-9 w-24 mb-1" />
                ) : (
                  <p className={`font-medium mb-1 ${valueClass} ${typeof value === 'string' && value.length > 8 ? 'text-xl' : 'text-3xl'}`}>
                    {value ?? "—"}
                  </p>
                )}
                <p className="text-sm text-gray-600">{label}</p>
              </div>
            ))}
          </div>

          {/* ── Analysis section ─────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h2 className="text-xl font-medium text-gray-800 mb-6">วิเคราะห์จุดแข็ง-จุดอ่อน</h2>
                {loading ? (
                  <Skeleton className="h-[350px] w-full" />
                ) : (data?.radar_data?.length ?? 0) === 0 ? (
                  <div className="h-[350px] flex items-center justify-center text-gray-400 text-sm">
                    ยังไม่มีข้อมูลเพียงพอ
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={350}>
                    <RadarChart data={data!.radar_data}>
                      <PolarGrid stroke="#e5e7eb" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11, fill: "#6b7280" }} />
                      <Radar
                        name="คะแนนของคุณ"
                        dataKey="score"
                        stroke="#3b82f6"
                        fill="#3b82f6"
                        fillOpacity={0.5}
                        strokeWidth={2}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "none",
                          boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                        }}
                      />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="lg:border-l lg:border-gray-200 lg:pl-8">
                <div className="flex items-center gap-2 mb-6">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                  <h2 className="text-xl font-medium text-gray-800">ควรทบทวนเพิ่มเติม</h2>
                </div>
                {loading ? (
                  <div className="space-y-3">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 w-full" />)}
                  </div>
                ) : (data?.weak_topics?.length ?? 0) === 0 ? (
                  <div className="text-gray-400 text-sm text-center py-12">ยังไม่มีข้อมูล</div>
                ) : (
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {data!.weak_topics.map((topic, index) => {
                      // แก้ไข Error: ตรวจสอบว่ามี Key ใน priorityStyles หรือไม่
                      const style = priorityStyles[topic.priority as keyof typeof priorityStyles] || defaultPriorityStyle;
                      return (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border transition-all hover:shadow-md ${style.card}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h3 className="font-medium text-gray-800 text-base">{topic.topic}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${style.badge}`}>
                                  {topic.priority}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mb-3">{topic.subject}</p>
                              <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <span className="font-medium">คะแนน:</span> {topic.score}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {topic.study_time}
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