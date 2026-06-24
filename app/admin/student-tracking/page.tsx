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
  Loader2,
  ChevronLeft,
  ChevronRight as PageNext,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
  theta: number;
  status: "ระดับสูง" | "ปานกลาง" | "ต้องปรับปรุง";
  date: string;
};

type StudentProgress = {
  studentId: number;
  currentTheta: number;
  totalExams: number;
  chart: Array<{ attempt: string; theta: number }>;
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
  const [page, setPage] = useState(1);
  const [selectedStudentId, setSelectedStudentId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"CAT" | "NORMAL">("CAT");
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
  }, [authHeaders, page, searchQuery]);

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

  const calculateThetaProgress = (theta: number) => {
    const clamped = Math.max(-3, Math.min(3, theta));
    return ((clamped + 3) / 6) * 100;
  };

  const getStatusColor = (status: CatExam["status"]) => {
    if (status === "ระดับสูง") return "text-emerald-700 bg-emerald-50";
    if (status === "ต้องปรับปรุง") return "text-rose-700 bg-rose-50";
    return "text-amber-700 bg-amber-50";
  };

  const canGoPrevious = meta.currentPage > 1 && !isStudentsLoading;
  const canGoNext = meta.currentPage < meta.totalPages && !isStudentsLoading;

  return (
    <Navbar_admin>
      <div className="p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-4 sm:space-y-6 bg-gray-50/50 min-h-screen">
        
        {/* ส่วนหัวแสดงชื่อเพจ */}
        <div className="flex items-center gap-3 sm:gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
          <button
            onClick={() => router.push("/admin")}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="min-w-0">
            <h1 className="text-base sm:text-xl font-black text-gray-900 tracking-tight truncate">
              ระบบติดตามผลการเรียนรายบุคคล
            </h1>
            <p className="text-[11px] sm:text-xs text-gray-500 truncate">
              จำแนกสถิติสอบปกติแบบดั้งเดิม และการประเมินความสามารถปรับเหมาะ (CAT)
            </p>
          </div>
        </div>

        {/* เลย์เอาต์หลัก: มือถือเรียงแนวตั้งดิ่ง (grid-cols-1), หน้าจอคอมพิวเตอร์แยกคอลัมน์ (lg:grid-cols-3) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:grid-cols-1 sm:gap-6 items-start">
          
          {/* ฝั่งซ้าย: แผงรายชื่อผู้เรียน */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4 order-1">
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

            {/* กล่องรายชื่อนักเรียนแบบเลื่อนได้ */}
            <div className="space-y-2 h-[320px] sm:h-[450px] lg:h-[480px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-200">
              <p className="text-xs font-bold text-gray-400 uppercase px-1 sticky top-0 bg-white pb-2 z-10">
                รายชื่อนักเรียน ({meta.totalItems})
              </p>

              {isStudentsLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <Loader2 className="w-8 h-8 animate-spin text-green-600 mb-3" />
                  <p className="text-sm">กำลังโหลดรายชื่อนักเรียน...</p>
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
                        <h4 className="text-sm font-bold text-gray-800 truncate">{student.name}</h4>
                        <p className="text-[11px] text-gray-400 truncate">{student.email}</p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 shrink-0 ${selectedStudentId === student.id ? "text-green-600" : "text-gray-300"}`}
                    />
                  </div>
                ))
              )}
            </div>

            {/* ปุ่มเปลี่ยนหน้ารายชื่อ (Pagination Control) */}
            <div className="flex items-center justify-between border-t border-gray-100 pt-3">
              <button
                type="button"
                disabled={!canGoPrevious}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="text-center">
                <p className="text-xs font-bold text-gray-700">
                  หน้า {meta.currentPage} / {meta.totalPages}
                </p>
                <p className="text-[10px] text-gray-400">แสดงครั้งละ {STUDENT_LIMIT} รายการ</p>
              </div>
              <button
                type="button"
                disabled={!canGoNext}
                onClick={() => setPage((current) => current + 1)}
                className="h-9 w-9 rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <PageNext className="w-4 h-4" />
              </button>
            </div>
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
                  <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-[1px] rounded-2xl flex items-start justify-center pt-24">
                    <div className="flex items-center gap-3 bg-white border border-gray-100 shadow-sm rounded-2xl px-5 py-3 text-sm font-bold text-gray-600 shadow-lg">
                      <Loader2 className="w-5 h-5 animate-spin text-green-600" />
                      กำลังดึงข้อมูลผลการเรียน...
                    </div>
                  </div>
                )}

                {/* แผงข้อมูลสถิติภาพรวม (สลับเป็น grid-cols-1 บนโมบายล์เพื่อไม่ให้บีบอัด) */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="pb-3 sm:pb-0 border-b sm:border-b-0 border-gray-100">
                    <p className="text-xs font-semibold text-gray-400">ผู้เรียนปัจจุบัน</p>
                    <h3 className="text-base sm:text-lg font-black text-gray-800 mt-1 truncate">
                      {selectedStudent.name}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">{selectedStudent.email}</p>
                  </div>
                  <div className="flex flex-col justify-center pb-3 sm:pb-0 border-b sm:border-b-0 sm:border-l sm:pl-4 border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                      <Award className="w-3.5 h-3.5 text-amber-500" /> ระดับความสามารถ CAT ($\theta$)
                    </p>
                    <h3 className={`text-xl sm:text-2xl font-black mt-1 ${activeData.currentTheta >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                      {activeData.currentTheta > 0 ? `+${activeData.currentTheta}` : activeData.currentTheta}
                    </h3>
                  </div>
                  <div className="flex flex-col justify-center sm:border-l sm:pl-4 border-gray-100">
                    <p className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-indigo-500" /> ประวัติทดสอบรวม
                    </p>
                    <h3 className="text-xl sm:text-2xl font-black text-gray-800 mt-1">
                      {activeData.totalExams} <span className="text-xs font-normal text-gray-500">ครั้ง</span>
                    </h3>
                  </div>
                </div>

                {/* ไทม์ไลน์พัฒนาการในรูปแบบกราฟเส้น */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="p-1.5 bg-green-50 text-green-600 rounded-lg">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-gray-800">ไทม์ไลน์การเติบโตระดับความเข้าใจ (IRT Theta)</h3>
                  </div>
                  <div className="h-44 sm:h-48 w-full">
                    {activeData.chart.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activeData.chart} margin={{ top: 5, right: 5, left: -28, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#fcfcfc" />
                          <XAxis dataKey="attempt" tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} />
                          <YAxis domain={[-3, 3]} tick={{ fill: "#9CA3AF", fontSize: 9 }} axisLine={false} />
                          <Tooltip formatter={(value: number) => [value, "ระดับ Theta"]} />
                          <ReferenceLine y={0} stroke="#E5E7EB" />
                          <Line type="monotone" dataKey="theta" stroke="#10B981" strokeWidth={2.5} dot={{ fill: "#10B981", r: 3.5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-gray-400">
                        ยังไม่มีประวัติ Theta จากการสอบ CAT
                      </div>
                    )}
                  </div>
                </div>

                {/* แท็บสลับประเภทบาร์คะแนนสอบ (ปรับขนาด Font ให้เล็กลงบน Mobile) */}
                <div className="bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm flex flex-row gap-1">
                  <button
                    onClick={() => setActiveTab("CAT")}
                    className={`flex-1 py-2.5 px-2 text-[11px] sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5
                      ${activeTab === "CAT" ? "bg-green-600 text-white shadow-md shadow-green-600/10" : "text-gray-500 hover:bg-gray-50"}`}
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">ประเมินความสามารถ (CAT)</span>
                  </button>
                  <button
                    onClick={() => setActiveTab("NORMAL")}
                    className={`flex-1 py-2.5 px-2 text-[11px] sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5
                      ${activeTab === "NORMAL" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-gray-500 hover:bg-gray-50"}`}
                  >
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">เก็บคะแนนปกติ (Classical)</span>
                  </button>
                </div>

                {/* ส่วนแสดงผล Score Bar ควบคุมความสูงพร้อมแถบเลื่อนแนวตั้ง */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col max-h-[480px]">
                  <h3 className="text-xs sm:text-sm font-bold text-gray-800 border-b border-gray-100 pb-3 mb-4 shrink-0">
                    ดัชนีคะแนนสอบ {activeTab === "CAT" ? "แบบปรับเหมาะไออาร์ที (CAT)" : "แบบเกณฑ์คงที่ปกติ"}
                  </h3>

                  <div className="overflow-y-auto flex-1 pr-1 space-y-5 scrollbar-thin scrollbar-thumb-gray-200">
                    
                    {/* ─── เรนเดอร์ฝั่ง CAT Mode ─── */}
                    {activeTab === "CAT" && (
                      activeData.catExams.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-8">ไม่มีประวัติสอบ CAT ของผู้เรียนรายนี้</p>
                      ) : (
                        activeData.catExams.map((exam, index) => (
                          <div key={exam.id} className="space-y-2.5">
                            {index > 0 && <hr className="border-gray-100/70 my-2" />}
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 text-xs">
                              <span className="font-bold text-gray-800 break-words">
                                {exam.name} <span className="font-normal text-gray-400 block sm:inline">({exam.totalQuestions} ข้อ)</span>
                              </span>
                              <span className={`font-black px-2 py-0.5 rounded-md text-[11px] self-start sm:self-auto whitespace-nowrap ${getStatusColor(exam.status)}`}>
                                Theta: {exam.theta > 0 ? `+${exam.theta}` : exam.theta} ({exam.status})
                              </span>
                            </div>
                            <div className="relative w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                              <div className="absolute inset-0 flex">
                                <div className="w-1/3 h-full bg-red-400/10 border-r border-dashed border-gray-200" />
                                <div className="w-1/3 h-full bg-amber-400/10 border-r border-dashed border-gray-200" />
                                <div className="w-1/3 h-full bg-emerald-400/10" />
                              </div>
                              <div
                                className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-500"
                                style={{ width: `${calculateThetaProgress(exam.theta)}%` }}
                              />
                              <div
                                className="absolute top-1/2 h-5 w-1.5 -translate-y-1/2 rounded-full bg-gray-900 shadow-sm transition-all duration-500"
                                style={{ left: `calc(${calculateThetaProgress(exam.theta)}% - 3px)` }}
                              />
                            </div>
                            <div className="flex justify-between text-[9px] text-gray-400 font-medium px-0.5">
                              <span>ต้องปรับปรุง (&lt; -1.0)</span>
                              <span>ปานกลาง</span>
                              <span>ระดับสูง (&gt; 1.0)</span>
                            </div>
                            <p className="text-[9px] text-gray-400 text-right">วันที่ทำรายการล่าสุด: {exam.date}</p>
                          </div>
                        ))
                      )
                    )}

                    {/* ─── เรนเดอร์ฝั่ง Classical Mode (สอบปกติ) ─── */}
                    {activeTab === "NORMAL" && (
                      activeData.normalExams.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-8">ไม่มีประวัติสอบปกติของผู้เรียนรายนี้</p>
                      ) : (
                        activeData.normalExams.map((exam, index) => (
                          <div key={exam.id} className="space-y-2">
                            {index > 0 && <hr className="border-gray-100/70 my-2" />}
                            <div className="flex justify-between items-start gap-2 text-xs">
                              <span className="font-bold text-gray-800 break-words">
                                {exam.name}{" "}
                                {exam.totalQuestions > 0 && (
                                  <span className="font-normal text-gray-400 block sm:inline">
                                    ({exam.correctCount}/{exam.totalQuestions} ข้อ)
                                  </span>
                                )}
                              </span>
                              <span className="font-black text-indigo-600 text-right whitespace-nowrap shrink-0">
                                {exam.score} / {exam.total} คะแนน
                              </span>
                            </div>
                            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                                style={{ width: `${(exam.score / exam.total) * 100}%` }}
                              />
                            </div>
                            <p className="text-[9px] text-gray-400 text-right">วันที่ทำรายการล่าสุด: {exam.date}</p>
                          </div>
                        ))
                      )
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-white p-8 sm:p-12 text-center rounded-2xl border border-gray-100 text-gray-400 text-xs sm:text-sm">
                {isProgressLoading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-green-600" />
                    <span>กำลังโหลดผลการเรียน...</span>
                  </div>
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