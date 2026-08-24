"use client";

import Navbar_admin from "@/components/Navbar_admin";
import {
  Users,
  BookOpen,
  Clock,
  BarChart3,
  UserCheck,
  TrendingUp,
  Bot,
  Sparkles,
  Brain,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Lightbulb,
  ShieldAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { requestAdminAIAnalysis, AIAnalysisResult } from "@/utils/n8nService";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DashboardStats {
  totalUsers: number;
  activeExams: number;
  totalAllExams: number;
  averageScore: number;
  totalSessions: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  description: string;
  color: string;
  subValue?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  description,
  color,
  subValue,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
      onClick ? "cursor-pointer hover:border-green-200" : ""
    }`}
  >
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <p className="text-xs font-semibold  text-gray-400">{title}</p>
        <div className="flex items-baseline space-x-1.5">
          <h3 className="text-3xl font-black text-gray-900 tracking-tight">{value}</h3>
          <span className="text-sm font-medium text-gray-500">{description}</span>
        </div>
        {subValue && (
          <p className="text-xs font-medium text-gray-400 bg-gray-50 px-2.5 py-1 rounded-md inline-block mt-2">
            {subValue}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color} text-white shadow-md flex items-center justify-center`}>
        {icon}
      </div>
    </div>
  </div>
);

const thaiMonths: Record<string, string> = {
  "01": "ม.ค.", "02": "ก.พ.", "03": "มี.ค.", "04": "เม.ย.",
  "05": "พ.ค.", "06": "มิ.ย.", "07": "ก.ค.", "08": "ส.ค.",
  "09": "ก.ย.", "10": "ต.ค.", "11": "พ.ย.", "12": "ธ.ค.",
};

function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<{ name: string; score: number }[]>([]);

  // ── AI Analysis States (n8n Integration) ──────────────────────────────────
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // ── Load cached AI Analysis from localStorage on mount ───────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const savedData = localStorage.getItem("ai_analysis_admin");
      if (savedData) {
        const parsed = JSON.parse(savedData);
        if (parsed && typeof parsed === "object") {
          setAiAnalysis(parsed);
        }
      }
    } catch (e) {
      console.warn("Failed to load cached admin AI analysis from localStorage:", e);
    }
  }, []);

  const handleRunAdminAIAnalysis = async () => {
    try {
      setAiLoading(true);
      setAiError(null);
      const result = await requestAdminAIAnalysis({
        stats,
        monthly_scores: monthlyData,
      });
      setAiAnalysis(result);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("ai_analysis_admin", JSON.stringify(result));
        } catch (e) {
          console.warn("Failed to save admin AI analysis to localStorage:", e);
        }
      }
    } catch (err: any) {
      console.error("n8n Admin AI Error:", err);
      setAiError(err?.message || "ไม่สามารถเชื่อมต่อกับระบบ AI วิเคราะห์แนวโน้มได้ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const token = localStorage.getItem("access_token");

        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const text = await res.text();

        if (!res.ok) {
          console.error("API ERROR:", text);
          throw new Error("ไม่สามารถโหลด Dashboard ได้");
        }

        const data = JSON.parse(text);

        setStats({
          totalUsers: data.stats.total_users,
          activeExams: data.stats.total_item_banks,
          totalAllExams: data.stats.total_all_item_banks,
          averageScore: data.stats.average_score,
          totalSessions: data.stats.total_exam_sessions,
        });

        if (data.monthly_scores?.length > 0) {
          setMonthlyData(
            data.monthly_scores.map((m: { month: string; avg: number }) => ({
              name: thaiMonths[m.month.split("-")[1]] ?? m.month,
              score: Math.round(m.avg * 10) / 10,
            }))
          );
        }
      } catch (err) {
        console.error(err);
        setError("โหลดข้อมูล Dashboard ไม่สำเร็จ");
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (isLoading) {
    return (
      <Navbar_admin>
        <div className="h-full min-h-[500px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-gray-200 animate-pulse" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                {[1, 2, 3].map((r) => (
                  <div key={r} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-gray-200 animate-pulse" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3.5 w-3/4 animate-pulse rounded bg-gray-200" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Navbar_admin>
    );
  }

  return (
    <Navbar_admin>
      <div className="max-w-7xl mx-auto w-full space-y-6">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">ภาพรวมระบบและสถิติ</h1>
              <p className="text-sm text-gray-500">วิเคราะห์และติดตามผลประสิทธิภาพภาพรวมการทดสอบความรู้</p>
            </div>
            <button
              onClick={() => router.push("/admin/student-tracking")}
              className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all hover:shadow-md w-full sm:w-auto cursor-pointer"
            >
              <UserCheck size={18} />
              ติดตามผลการเรียนรายบุคคล
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Statistical Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<Users className="w-5 h-5" />}
            title="ผู้ใช้งานในระบบทั้งหมด"
            value={stats?.totalUsers?.toLocaleString() ?? "-"}
            description="คน"
            color="bg-indigo-600"
            subValue="คลิกเพื่อดูรายชื่อทั้งหมด →"
            onClick={() => router.push("/admin/manage_users")}
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            title="คลังข้อสอบที่เปิดใช้งาน"
            value={stats?.activeExams ?? "-"}
            description="คลัง"
            color="bg-green-600"
            subValue={`จากทั้งหมด ${stats?.totalAllExams ?? "-"} คลัง`}
          />
          <StatCard
            icon={<BarChart3 className="w-5 h-5" />}
            title="คะแนนเฉลี่ยของผู้เรียน"
            value={`${stats?.averageScore?.toFixed(1) ?? "0"}%`}
            description="เฉลี่ยรวม"
            color="bg-amber-500"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            title="จำนวนเซสชันการสอบ"
            value={stats?.totalSessions?.toLocaleString() ?? "-"}
            description="ครั้ง"
            color="bg-rose-500"
          />
        </div>

        {/* Visualized Report Section (Graph) */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-gray-800">
                แนวโน้มประสิทธิภาพของผู้เรียน
              </h2>
              <p className="text-xs text-gray-400">สรุปดัชนีคะแนนเฉลี่ยจำแนกตามรายเดือน</p>
            </div>
          </div>

          <div className="h-80 w-full mt-2">
            {monthlyData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400 font-medium text-sm">
                ยังไม่มีการบันทึกข้อมูลคะแนนสะสมในช่วงนี้
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyData}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 500 }}
                  />
                  <YAxis
                    tickFormatter={(value) => `${value}%`}
                    domain={[0, 100]}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#9CA3AF', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#fff',
                      border: '1px solid #f0f0f0',
                      borderRadius: '12px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: '#1F2937' }}
                    formatter={(value: number) => [`${value}%`, "คะแนนเฉลี่ยรวม"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#10B981"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorScore)"
                    dot={{ fill: "#10B981", stroke: "#fff", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* ── AI Cohort Performance & Trend Analysis ────────────────────── */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium text-gray-800 flex items-center gap-2">
                  การวิเคราะห์แนวโน้มและข้อเสนอแนะโดย AI
                </h2>
                <p className="text-xs text-gray-400">
                  ประเมินดัชนีผลการเรียนรู้ภาพรวมของผู้สอบทั้งหมดและระบุวิชาที่ต้องส่งเสริม
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRunAdminAIAnalysis}
              disabled={aiLoading}
              className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm shadow-sm transition-all hover:shadow-md w-full sm:w-auto cursor-pointer"
            >
              {aiLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังประมวลผล...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-200" />
                  <span>{aiAnalysis ? "วิเคราะห์แนวโน้มใหม่" : "วิเคราะห์แนวโน้มด้วย AI"}</span>
                </>
              )}
            </button>
          </div>

          {aiError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm font-medium flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{aiError}</span>
            </div>
          )}

          {aiLoading ? (
            <div className="p-8 text-center bg-gray-50/70 rounded-2xl border border-gray-100 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto animate-pulse">
                <Brain className="w-6 h-6 animate-bounce" />
              </div>
              <p className="text-sm font-medium text-gray-700">ระบบ AI กำลังวิเคราะห์สถิติภาพรวมของผู้สอบ...</p>
              <p className="text-xs text-gray-400">กำลังประมวลผลข้อมูลคะแนนเฉลี่ย สถิติรายเดือน และจัดทำข้อเสนอแนะเชิงนโยบาย</p>
            </div>
          ) : !aiAnalysis ? (
            <div className="p-8 text-center bg-gray-50/50 rounded-2xl border border-dashed border-gray-200 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <Lightbulb className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-600">ยังไม่มีการประมวลผลการวิเคราะห์แนวโน้ม</p>
              <p className="text-xs text-gray-400 max-w-lg mx-auto">
                กดปุ่ม "วิเคราะห์แนวโน้มด้วย AI" ด้านบนเพื่อส่งข้อมูลสถิติไปยัง n8n AI Agent เพื่อรับบทวิเคราะห์และข้อเสนอแนะเชิงลึก
              </p>
            </div>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-300">
              {/* Trend Summary */}
              {(aiAnalysis.trend_summary || aiAnalysis.summary || aiAnalysis.overall_feedback) && (
                <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-indigo-700">
                    <TrendingUp className="w-4 h-4" />
                    <span>สรุปแนวโน้มภาพรวมของผู้สอบ</span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
                    {typeof (aiAnalysis.trend_summary || aiAnalysis.summary || aiAnalysis.overall_feedback) === "string"
                      ? (aiAnalysis.trend_summary || aiAnalysis.summary || aiAnalysis.overall_feedback)
                      : JSON.stringify(aiAnalysis.trend_summary || aiAnalysis.summary || aiAnalysis.overall_feedback, null, 2)}
                  </p>
                </div>
              )}

              {/* Key Insights & High Risk Areas */}
              {(Array.isArray(aiAnalysis.key_insights) || Array.isArray(aiAnalysis.analysis_points)) && (
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    <span>ประเด็นสำคัญและจุดที่ควรให้ความสนใจ</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {(aiAnalysis.key_insights || aiAnalysis.analysis_points)?.map((item: any, i: number) => {
                      const titleText = typeof item === "string" ? item : item?.title || item?.topic || `ประเด็นที่ ${i + 1}`;
                      const descText = typeof (item?.description || item?.issue || item?.recommendation) === "string"
                        ? (item.description || item.issue || item.recommendation)
                        : (item?.description || item?.issue || item?.recommendation)
                        ? JSON.stringify(item.description || item.issue || item.recommendation)
                        : null;

                      return (
                        <div key={i} className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-medium text-gray-900">
                              {titleText}
                            </span>
                            {item?.severity && (
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                                  item.severity === "high"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : item.severity === "medium"
                                    ? "bg-amber-50 text-amber-700 border border-amber-200"
                                    : "bg-teal-50 text-teal-700 border border-teal-200"
                                }`}
                              >
                                ระดับ: {item.severity === "high" ? "สูง" : item.severity === "medium" ? "ปานกลาง" : "ปกติ"}
                              </span>
                            )}
                          </div>
                          {descText && (
                            <p className="text-xs sm:text-sm text-gray-600 font-medium">
                              {descText}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Strategic Recommendations */}
              {(aiAnalysis.recommendations || aiAnalysis.action_plan) && (() => {
                const raw = aiAnalysis.recommendations || aiAnalysis.action_plan;

                // Detect structured object with schedule + general_strategies
                const isStructured =
                  raw &&
                  typeof raw === "object" &&
                  !Array.isArray(raw) &&
                  (raw.schedule || raw.general_strategies);

                if (isStructured) {
                  return (
                    <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 space-y-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        <span>ข้อเสนอแนะเชิงกลยุทธ์สำหรับผู้ดูแลระบบ</span>
                      </div>

                      {/* General Strategies only */}
                      {Array.isArray(raw.general_strategies) && raw.general_strategies.length > 0 && (
                        <ul className="space-y-2">
                          {raw.general_strategies.map((s: string, idx: number) => (
                            <li key={idx} className="flex items-start gap-2.5">
                              <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                                {idx + 1}
                              </span>
                              <span className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">{s}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                }

                // Fallback: array of strings
                if (Array.isArray(raw)) {
                  return (
                    <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 space-y-2">
                      <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
                        <CheckCircle2 className="w-4 h-4 text-teal-600" />
                        <span>ข้อเสนอแนะเชิงกลยุทธ์สำหรับผู้ดูแลระบบ</span>
                      </div>
                      <ul className="space-y-2">
                        {raw.map((item: any, idx: number) => (
                          <li key={idx} className="flex items-start gap-2.5">
                            <span className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-teal-100 text-teal-700 flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed">
                              {typeof item === "string" ? item : JSON.stringify(item)}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                }

                // Fallback: plain string
                return (
                  <div className="p-4 bg-teal-50/50 rounded-xl border border-teal-100 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-teal-800">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      <span>ข้อเสนอแนะเชิงกลยุทธ์สำหรับผู้ดูแลระบบ</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700 font-medium leading-relaxed whitespace-pre-wrap">
                      {typeof raw === "string" ? raw : JSON.stringify(raw, null, 2)}
                    </p>
                  </div>
                );
              })()}

              {/* Plain text / output fallback */}
              {!aiAnalysis.summary && !aiAnalysis.trend_summary && !aiAnalysis.key_insights && !aiAnalysis.analysis_points && aiAnalysis.output && (
                <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 text-xs sm:text-sm text-gray-700 font-medium whitespace-pre-wrap">
                  {typeof aiAnalysis.output === "string" ? aiAnalysis.output : JSON.stringify(aiAnalysis.output, null, 2)}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </Navbar_admin>
  );
}

export default AdminDashboardPage;