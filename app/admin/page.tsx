/* eslint-disable @next/next/no-img-element */
"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { Users, BookOpen, Clock, BarChart3, UserCheck, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation"; 
import React, { useState, useEffect } from "react";

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
}

const StatCard: React.FC<StatCardProps> = ({
  icon,
  title,
  value,
  description,
  color,
  subValue,
}) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">{title}</p>
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
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 bg-gray-50/50 min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">ภาพรวมระบบและสถิติ</h1>
            <p className="text-sm text-gray-500 mt-1">วิเคราะห์และติดตามผลประสิทธิภาพภาพรวมการทดสอบความรู้</p>
          </div>
          <button
            onClick={() => router.push("/admin/student-tracking")}
            className="inline-flex items-center gap-2 px-5 py-3 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-sm rounded-xl shadow-md shadow-green-600/10 transition-all w-full sm:w-auto justify-center cursor-pointer"
          >
            <UserCheck className="w-4 h-4" />
            <span>ติดตามผลการเรียนรายบุคคล</span>
          </button>
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
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5" />}
            title="คลังข้อสอบที่เปิดใช้งาน"
            value={stats?.activeExams ?? "-"}
            description="คลัง"
            color="bg-emerald-600"
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
              <h2 className="text-lg font-bold text-gray-800">
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
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0}/>
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

      </div>
    </Navbar_admin>
  );
}

export default AdminDashboardPage;