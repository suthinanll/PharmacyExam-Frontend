"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  User,
  Search,
  Award,
  Calendar,
  ChevronRight,
  TrendingUp,
  ArrowLeft,
  Layers,
  CheckCircle,
  ChevronLeft,
  ChevronRight as PageNext,
  Target,
  XCircle,
  Clock,
  ChevronDown,
} from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Pagination from "@/components/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";
const STUDENT_LIMIT = 10;

type Student = {
  id: number;
  name: string;
  email: string;
};

type StudentsResponse = {
  data: Student[];
  meta: {
    totalItems: number;
    totalPages: number;
    currentPage: number;
  };
};

type NormalExam = {
  id: number;
  name: string;
  score: number;
  total: number;
  totalQuestions: number;
  correctCount: number;
  date: string;
};

type CatExam = {
  id: number;
  name: string;
  totalQuestions: number;
  correctCount: number;
  theta: number;
  status: "ระดับสูง" | "ปานกลาง" | "ต้องปรับปรุง";
  date: string;
  responses?: Array<{
    questionNumber: number;
    isCorrect: boolean;
    thetaAfter: number;
    timeSpent: number;
  }>;
};

type ChartPoint = {
  date: string;
  theta: number;
  score?: number | null;
  examName?: string;
  name?: string;
  type: "CAT" | "Classical";
};

type StudentProgress = {
  studentId: number;
  currentTheta: number;
  totalExams: number;
  chart: ChartPoint[];
  normalExams: NormalExam[];
  catExams: CatExam[];
};

const emptyMeta = {
  totalItems: 0,
  totalPages: 1,
  currentPage: 1,
};

export default function StudentTrackingPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [meta, setMeta] = useState(emptyMeta);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState<"all" | "week" | "month" | "3months">("all");
  const [alphabetFilter, setAlphabetFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"CAT" | "NORMAL">("CAT");
  const [expandedCatExam, setExpandedCatExam] = useState<number | null>(null);
  const [activeData, setActiveData] = useState<StudentProgress | null>(null);
  const [isStudentsLoading, setIsStudentsLoading] = useState(false);
  const [isProgressLoading, setIsProgressLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedStudent = useMemo(() => {
    return students.find((student) => student.id === selectedStudentId) ?? null;
  }, [selectedStudentId, students]);

  const authHeaders = useCallback(() => {
    const token = getToken();
    return {
      Authorization: `Bearer ${token ?? ""}`,
    };
  }, [getToken]);

  const loadStudents = useCallback(async () => {
    try {
      setIsStudentsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(STUDENT_LIMIT),
      });

      if (searchQuery.trim()) {
        params.set("search", searchQuery.trim());
      }

      if (alphabetFilter !== "all") {
        params.set("alphabet", alphabetFilter);
      }

      if (dateFilter !== "all") {
        params.set("dateFilter", dateFilter);
      }

      const response = await fetch(`${API_URL}/admin/students?${params.toString()}`, {
        headers: authHeaders(),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("ไม่สามารถดึงรายชื่อนักเรียนได้");
      }

      const result: StudentsResponse = await response.json();
      setStudents(result.data);
      setMeta(result.meta);

      setSelectedStudentId((currentSelectedStudentId) => {
        if (result.data.length === 0) {
          return null;
        }

        const stillVisible = result.data.some(
          (student) => student.id === currentSelectedStudentId,
        );

        return currentSelectedStudentId && stillVisible
          ? currentSelectedStudentId
          : result.data[0].id;
      });

      if (result.data.length === 0) {
        setActiveData(null);
      }
    } catch (err) {
      setStudents([]);
      setMeta(emptyMeta);
      setSelectedStudentId(null);
      setActiveData(null);
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดรายชื่อนักเรียน");
    } finally {
      setIsStudentsLoading(false);
    }
  }, [authHeaders, page, searchQuery, alphabetFilter, dateFilter]);

  const loadProgress = useCallback(
    async (studentId: number) => {
      try {
        setIsProgressLoading(true);
        setError(null);

        const response = await fetch(`${API_URL}/admin/students/${studentId}/progress`, {
          headers: authHeaders(),
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error("ไม่สามารถดึงข้อมูลความคืบหน้าของนักเรียนได้");
        }

        const result: StudentProgress = await response.json();

        // Debug logs
        console.log("📊 [Student Progress] Full Response:", result);
        console.log("🎯 [CAT Exams] Count:", result.catExams?.length || 0, "Items:", result.catExams);
        console.log("📚 [Normal Exams] Count:", result.normalExams?.length || 0, "Items:", result.normalExams);
        console.log("📈 [Chart Data] Count:", result.chart?.length || 0, "Items:", result.chart);
        console.log("🎓 [Current Theta]:", result.currentTheta);
        console.log("🔢 [Total Exams]:", result.totalExams);
        console.log("🔗 [API URL]:", `${API_URL}/admin/students/${studentId}/progress`);
        console.log("📦 [Raw Response]:", JSON.stringify(result, null, 2));

        setActiveData(result);
      } catch (err) {
        setActiveData(null);
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาดในการโหลดผลการเรียน");
      } finally {
        setIsProgressLoading(false);
      }
    },
    [authHeaders],
  );

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (!selectedStudentId) {
      return;
    }
    loadProgress(selectedStudentId);
  }, [loadProgress, selectedStudentId]);

  const tabChartData = useMemo(() => {
    if (!activeData?.chart) return [];
    if (activeTab === "CAT") {
      return activeData.chart.filter((item) => item.type === "CAT");
    }
    return activeData.chart.filter((item) => item.type === "Classical");
  }, [activeData?.chart, activeTab]);

  const calculateThetaProgress = (theta: number) => {
    const clamped = Math.max(-3, Math.min(3, theta));
    return ((clamped + 3) / 6) * 100;
  };

  const getStatusColor = (status: CatExam["status"]) => {
    if (status === "ระดับสูง") return "text-green-700 bg-green-50";
    if (status === "ต้องปรับปรุง") return "text-rose-700 bg-rose-50";
    return "text-amber-700 bg-amber-50";
  };

  const canGoPrevious = meta.currentPage > 1 && !isStudentsLoading;
  const canGoNext = meta.currentPage < meta.totalPages && !isStudentsLoading;

  return (
    <Navbar_admin>
      <div className="max-w-7xl mx-auto w-full space-y-6">

        <Link href="/admin" className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 mb-5 text-sm font-medium transition-colors">
          <ChevronLeft className="w-4 h-4" /> กลับสู่หน้าแดชบอร์ด
        </Link>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">
              ระบบติดตามผลการเรียนรายบุคคล
            </h1>
            <p className="text-sm text-gray-500">
              จำแนกสถิติสอบปกติแบบดั้งเดิม และการประเมินความสามารถปรับเหมาะ (CAT)
            </p>
          </div>
        </div>

        {/* เลย์เอาต์หลัก: มือถือเรียงแนวตั้งดิ่ง (grid-cols-1), หน้าจอคอมพิวเตอร์แยกคอลัมน์ (lg:grid-cols-3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:grid-cols-1 sm:gap-6 items-start">

          {/* ฝั่งซ้าย: แผงรายชื่อผู้เรียน */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4 order-1">
            {/* Search bar */}
            <div className="relative">
              <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="ค้นหาชื่อหรืออีเมลนักเรียน..."
                value={searchQuery}
                onChange={(event) => {
                  setSearchQuery(event.target.value);
                  setPage(1);
                }}
                className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
              />
            </div>

            {/* Filter options */}
            <div className="space-y-3 pb-3 border-b border-gray-100">
              {/* Alphabet filter */}
              <div>
                <label className="text-sm font-medium text-gray-400  mb-2 block">ตัวอักษร</label>
                <div className="flex gap-1 flex-wrap">
                  <button
                    onClick={() => { setAlphabetFilter("all"); setPage(1); }}
                    className={`px-2 py-1 text-sm font-medium rounded-lg transition-all cursor-pointer ${alphabetFilter === "all"
                      ? "bg-green-600 text-white"
                      : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                  >
                    ทั้งหมด
                  </button>
                  {["ก-ฉ", "ช-ฎ", "ฏ-ณ", "ด-ฟ", "ภ-ฮ", "A-M", "N-Z"].map((range) => (
                    <button
                      key={range}
                      onClick={() => { setAlphabetFilter(range); setPage(1); }}
                      className={`px-2 py-1 text-sm font-medium rounded-lg transition-all cursor-pointer ${alphabetFilter === range
                        ? "bg-green-600 text-white"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date filter */}
              <div>
                <label className="text-sm font-medium text-gray-400  mb-2 block">ทำข้อสอบล่าสุด</label>
                <div className="flex gap-2">
                  {[
                    { value: "all", label: "ทั้งหมด" },
                    { value: "week", label: "7 วัน" },
                    { value: "month", label: "30 วัน" },
                    { value: "3months", label: "90 วัน" }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => { setDateFilter(opt.value as typeof dateFilter); setPage(1); }}
                      className={`flex-1 py-1.5 px-2 text-sm font-medium rounded-lg transition-all cursor-pointer ${dateFilter === opt.value
                        ? "bg-green-600 text-white"
                        : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* กล่องรายชื่อนักเรียนแบบเลื่อนได้ */}
            <div className="space-y-2 h-[320px] sm:h-[450px] lg:h-[480px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
              <p className="text-sm font-medium text-gray-400  px-1 sticky top-0 bg-white pb-2 z-10">
                รายชื่อนักเรียน ({meta.totalItems})
              </p>

              {isStudentsLoading ? (
                <div className="py-12 flex flex-col items-center justify-center">
                  <LoadingSpinner size="md" text="กำลังโหลดรายชื่อนักเรียน..." />
                </div>
              ) : students.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-8">ไม่พบรายชื่อดังกล่าว</p>
              ) : (
                students.map((student) => (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudentId(student.id)}
                    className={`p-3 rounded-xl border transition-all duration-200 cursor-pointer flex justify-between items-center
                      ${selectedStudentId === student.id
                        ? "bg-green-50 border-green-300 ring-1 ring-green-300 shadow-sm"
                        : "bg-white border-gray-100 hover:bg-gray-50"
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${selectedStudentId === student.id
                          ? "bg-green-600 text-white"
                          : "bg-gray-100 text-gray-500"
                          }`}
                      >
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-medium text-gray-800 truncate">{student.name}</h4>
                        <p className="text-sm text-gray-400 truncate">{student.email}</p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 ${selectedStudentId === student.id ? "text-green-600" : "text-gray-300"}`}
                    />
                  </div>
                ))
              )}
            </div>

            {/* ── Pagination Control ── */}
            <Pagination
              currentPage={meta.currentPage}
              totalPages={meta.totalPages}
              totalItems={meta.totalItems}
              perPage={STUDENT_LIMIT}
              onPageChange={setPage}
              itemLabel="คน"
              className="mt-2 pt-3 border-t border-gray-100"
              compact
            />
          </div>

          {/* ฝั่งขวา: รายละเอียดผลการเรียนเชิงลึก */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6 order-2">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm rounded-2xl p-4">
                {error}
              </div>
            )}

            {selectedStudent && activeData ? (
              <div className="relative space-y-4 sm:space-y-6">
                {isProgressLoading && (
                  <div className="absolute inset-0 z-20 bg-white/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                    <LoadingSpinner size="lg" text="กำลังโหลดผลการเรียน..." />
                  </div>
                )}

                {/* แผงข้อมูลสถิติภาพรวม (สลับเป็น grid-cols-1 บนโมบายล์เพื่อไม่ให้บีบอัด) */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="pb-3 sm:pb-0 border-b sm:border-b-0 border-gray-100">
                    <p className="text-sm font-medium text-gray-400">ผู้เรียนปัจจุบัน</p>
                    <h3 className="text-base sm:text-lg font-black text-gray-800 mt-1 truncate">
                      {selectedStudent.name}
                    </h3>
                    <p className="text-sm text-gray-500 truncate">{selectedStudent.email}</p>
                  </div>
                  <div className="flex flex-col justify-center pb-3 sm:pb-0 border-b sm:border-b-0 sm:border-l sm:pl-4 border-gray-100">
                    <p className="text-sm font-medium text-gray-400 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" /> ระดับความสามารถ CAT (θ)
                    </p>
                    <h3 className={`text-xl sm:text-2xl font-black mt-1 ${activeData.currentTheta >= 0 ? "text-green-600" : "text-rose-600"}`}>
                      {activeData.currentTheta > 0 ? `+${activeData.currentTheta}` : activeData.currentTheta}
                    </h3>
                  </div>
                  <div className="flex flex-col justify-center sm:border-l sm:pl-4 border-gray-100">
                    <p className="text-sm font-medium text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" /> ประวัติทดสอบรวม
                    </p>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-800 mt-1">
                      {activeData.totalExams} <span className="text-sm font-normal text-gray-500">ครั้ง</span>
                    </h3>
                  </div>
                </div>

                {/* แท็บสลับประเภทบาร์คะแนนสอบและไทม์ไลน์ */}
                <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm flex flex-row gap-1">
                  <button
                    onClick={() => setActiveTab("CAT")}
                    className={`flex-1 py-2.5 px-2 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer
                      ${activeTab === "CAT" ? "bg-green-600 text-white shadow-md shadow-green-600/10" : "text-gray-500 hover:bg-gray-50"}`}
                  >
                    <Layers className="w-4 h-4 shrink-0" />
                    <span className="truncate">ประเมินความสามารถ (CAT)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("NORMAL")}
                    className={`flex-1 py-2.5 px-2 text-sm font-medium rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer
                      ${activeTab === "NORMAL" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-gray-500 hover:bg-gray-50"}`}
                  >
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span className="truncate">เก็บคะแนนปกติ (Classical)</span>
                  </button>
                </div>

                {/* ไทม์ไลน์พัฒนาการในรูปแบบกราฟเส้น (แยกตามแท็บ CAT / Classical) */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${activeTab === "CAT" ? "bg-green-50 text-green-600" : "bg-indigo-50 text-indigo-600"}`}>
                        {activeTab === "CAT" ? <Layers className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                      </div>
                      <h3 className="text-sm font-medium text-gray-800">
                        {activeTab === "CAT" ? "ไทม์ไลน์การเติบโตระดับความสามารถ CAT (θ)" : "ไทม์ไลน์พัฒนาการการสอบปกติ (Classical)"}
                      </h3>
                    </div>
                    {tabChartData.length > 0 && (
                      <span className="text-xs text-gray-400">ประวัติสอบ {tabChartData.length} ครั้ง</span>
                    )}
                  </div>

                  <div className="h-56 sm:h-64 w-full">
                    {tabChartData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={tabChartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f5" />
                          <XAxis
                            dataKey="date"
                            tick={{ fill: "#9CA3AF", fontSize: 10 }}
                            axisLine={false}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis domain={[-3, 3]} tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} />
                          <Tooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-lg text-sm">
                                    <p className="font-medium text-gray-800 mb-1">{data.examName || data.name}</p>
                                    <p className="text-xs text-gray-500 mb-1.5">{data.date}</p>
                                    <div className="text-sm flex items-center gap-1.5">
                                      <span className={`inline-block w-2 h-2 rounded-full ${activeTab === "CAT" ? "bg-green-600" : "bg-indigo-600"}`} />
                                      {activeTab === "CAT" ? (
                                        <>
                                          <span className="text-gray-600">ระดับความสามารถ (θ):</span>
                                          <span className="font-medium text-green-700">
                                            {data.theta > 0 ? `+${data.theta.toFixed(2)}` : data.theta.toFixed(2)}
                                          </span>
                                        </>
                                      ) : (
                                        <>
                                          <span className="text-gray-600">คะแนน:</span>
                                          <span className="font-medium text-indigo-700">
                                            {data.score !== undefined && data.score !== null ? `${Number(data.score).toFixed(2)} คะแนน` : `ไม่มีคะแนนสอบ`}
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <ReferenceLine y={0} stroke="#E5E7EB" strokeDasharray="3 3" />
                          <Line
                            type="monotone"
                            dataKey="theta"
                            stroke={activeTab === "CAT" ? "#16a34a" : "#4f46e5"}
                            strokeWidth={2.5}
                            dot={{
                              r: 4,
                              fill: activeTab === "CAT" ? "#16a34a" : "#4f46e5",
                              stroke: "#fff",
                              strokeWidth: 2,
                            }}
                            name={activeTab === "CAT" ? "Theta (CAT)" : "Theta (Classical)"}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-sm text-gray-400">
                        {activeTab === "CAT" ? "ยังไม่มีประวัติการสอบ CAT ของผู้เรียนรายนี้" : "ยังไม่มีประวัติการสอบปกติของผู้เรียนรายนี้"}
                      </div>
                    )}
                  </div>

                  {/* Legend */}
                  {tabChartData.length > 0 && (
                    <div className="flex items-center justify-center gap-4 mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${activeTab === "CAT" ? "bg-green-600" : "bg-indigo-600"}`}></div>
                        <span className="text-sm text-gray-600">
                          {activeTab === "CAT" ? "ระดับความสามารถ CAT (θ)" : "พัฒนาการคะแนนสอบปกติ (Classical)"}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* ส่วนแสดงผล Score Bar ควบคุมความสูงพร้อมแถบเลื่อนแนวตั้ง */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col max-h-[480px]">
                  <h3 className="text-sm font-medium text-gray-800 border-b border-gray-100 pb-3 mb-4 shrink-0">
                    ดัชนีคะแนนสอบ {activeTab === "CAT" ? "แบบปรับเหมาะไออาร์ที (CAT)" : "แบบเกณฑ์คงที่ปกติ"}
                  </h3>

                  <div className="overflow-y-auto flex-1 pr-1 space-y-5 scrollbar-thin scrollbar-thumb-gray-200">

                    {/* ─── เรนเดอร์ฝั่ง CAT Mode ─── */}
                    {activeTab === "CAT" && (
                      activeData.catExams.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">ไม่มีประวัติสอบ CAT ของผู้เรียนรายนี้</p>
                      ) : (
                        activeData.catExams.map((exam, index) => {
                          const isExpanded = expandedCatExam === exam.id;
                          const accuracy = exam.totalQuestions > 0
                            ? ((exam.correctCount / exam.totalQuestions) * 100).toFixed(1)
                            : "0";

                          return (
                            <div key={exam.id} className="space-y-2.5">
                              {index > 0 && <hr className="border-gray-100/70 my-2" />}

                              {/* Header with expand button */}
                              <div
                                className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 text-sm cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2"
                                onClick={() => setExpandedCatExam(isExpanded ? null : exam.id)}
                              >
                                <span className="font-medium text-gray-800 break-words flex items-center gap-2">
                                  {exam.name}
                                  <span className="font-normal text-gray-400">({exam.correctCount}/{exam.totalQuestions} ข้อ • {accuracy}%)</span>
                                  <ChevronDown
                                    className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                  />
                                </span>
                                <span className={`font-medium px-2 py-0.5 rounded-md text-sm self-start sm:self-auto whitespace-nowrap mb-2 ${getStatusColor(exam.status)}`}>
                                  Theta: {exam.theta > 0 ? `+${exam.theta.toFixed(2)}` : exam.theta.toFixed(2)} ({exam.status})
                                </span>
                              </div>

                              {/* Progress bar */}
                              <div className="relative w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-green-600 rounded-full transition-all duration-500"
                                  style={{ width: `${calculateThetaProgress(exam.theta)}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-sm text-gray-400 font-medium">
                                <span>ต้องปรับปรุง (&lt; -1.0)</span>
                                <span>ปานกลาง</span>
                                <span>ระดับสูง (&gt; 1.0)</span>
                              </div>
                              <p className="text-sm text-gray-400 text-right">วันที่ทำรายการล่าสุด: {exam.date}</p>

                              {/* Expanded responses */}
                              {isExpanded && exam.responses && exam.responses.length > 0 && (
                                <div className="mt-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                                  <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                    <Target className="w-3.5 h-3.5 text-green-600" />
                                    การพัฒนา Theta แต่ละข้อ
                                  </h4>
                                  <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {exam.responses.map((resp: any, idx: number) => {
                                      const qNum = resp.questionNumber ?? resp.item_number ?? resp.question_number ?? (idx + 1);
                                      const isCorr = resp.isCorrect ?? resp.is_correct ?? false;
                                      const thetaVal = typeof resp.thetaAfter === 'number'
                                        ? resp.thetaAfter
                                        : typeof resp.theta_after === 'number'
                                          ? resp.theta_after
                                          : 0;
                                      const timeVal = resp.timeSpent ?? (resp.responseTime ? Math.round(resp.responseTime / 1000) : resp.response_time_ms ? Math.round(resp.response_time_ms / 1000) : 0);

                                      return (
                                        <div
                                          key={idx}
                                          className="flex items-center gap-2 bg-white rounded-lg p-2 border border-gray-100 text-sm"
                                        >
                                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-gray-100 text-gray-700 font-medium text-xs">
                                            {qNum}
                                          </div>
                                          <div
                                            className={`flex items-center justify-center w-6 h-6 rounded-full ${isCorr
                                              ? "bg-green-100 text-green-600"
                                              : "bg-red-100 text-red-600"
                                              }`}
                                          >
                                            {isCorr ? (
                                              <CheckCircle className="w-3.5 h-3.5" />
                                            ) : (
                                              <XCircle className="w-3.5 h-3.5" />
                                            )}
                                          </div>
                                          <div className="flex-1">
                                            <span className="font-medium text-gray-700">θ = {thetaVal.toFixed(2)}</span>
                                          </div>
                                          {timeVal > 0 && (
                                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                                              <Clock className="w-3 h-3" />
                                              {timeVal}s
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )
                    )}

                    {/* ─── เรนเดอร์ฝั่ง Classical Mode (สอบปกติ) ─── */}
                    {activeTab === "NORMAL" && (
                      activeData.normalExams.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">ไม่มีประวัติสอบปกติของผู้เรียนรายนี้</p>
                      ) : (
                        activeData.normalExams.map((exam, index) => (
                          <div key={exam.id} className="space-y-2">
                            {index > 0 && <hr className="border-gray-100/70 my-2" />}
                            <div className="flex justify-between items-start gap-2 text-sm">
                              <span className="font-medium text-gray-800 break-words">
                                {exam.name}{" "}
                                {exam.totalQuestions > 0 && (
                                  <span className="font-normal text-gray-400 block sm:inline">
                                    ({exam.correctCount}/{exam.totalQuestions} ข้อ)
                                  </span>
                                )}
                              </span>
                              <span className="font-black text-indigo-600 text-right whitespace-nowrap shrink-0">
                                {Number(exam.score).toFixed(2)} / {exam.total} คะแนน
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                style={{ width: `${(exam.score / exam.total) * 100}%` }}
                              />
                            </div>
                            <p className="text-sm text-gray-400 text-right">วันที่ทำรายการล่าสุด: {exam.date}</p>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white p-8 sm:p-12 text-center rounded-2xl border border-gray-100 text-gray-400 text-sm sm:text-sm">
                {isProgressLoading ? (
                  <LoadingSpinner size="md" text="กำลังโหลดผลการเรียน..." />
                ) : (
                  "กรุณาเลือกรายชื่อนักเรียนจากแถบด้านซ้ายเพื่อประมวลผล Score Bar"
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </Navbar_admin>
  );
}