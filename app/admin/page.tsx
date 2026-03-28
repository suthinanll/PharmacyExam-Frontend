"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { Users, BookOpen, Clock, BarChart3, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation"; 
import React, { useState, useEffect } from "react";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
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
    className={`bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition-transform duration-300 hover:shadow-xl
      ${onClick ? "cursor-pointer hover:border-green-300" : ""}`}
  >
    <div
      className={`p-3 w-12 h-12 rounded-full ${color} text-white mb-4 flex items-center justify-center`}
    >
      {icon}
    </div>
    <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
    <div className="flex items-baseline space-x-2 mt-1">
      <h3 className="text-3xl font-extrabold text-gray-900">{value}</h3>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
    {subValue && <p className="text-xs text-gray-400 mt-1">{subValue}</p>}
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
        console.log("Dashboard data:", data); // ดูข้อมูลดิบจาก API เพื่อ debug คะแนนเฉลี่ย

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
        <div className="flex items-center justify-center h-full min-h-[500px]">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          <span className="ml-3 text-lg text-gray-600">
            กำลังโหลดข้อมูล Dashboard...
          </span>
        </div>
      </Navbar_admin>
    );
  }

  return (
    <Navbar_admin>
      <div className="p-4 sm:p-6 lg:p-8">
        {error && (
          <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        <div className="mb-8">
          <p className="mt-1 text-base text-gray-500">
            สรุปสถิติสำคัญและการใช้งานในระบบ ณ ปัจจุบัน
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="ผู้ใช้งานในระบบทั้งหมด"
            value={stats?.totalUsers?.toLocaleString() ?? "-"}
            description="คน"
            color="bg-indigo-500"
          />
          <StatCard
            icon={<BookOpen className="w-6 h-6" />}
            title="คลังข้อสอบที่เปิดใช้งาน"
            value={stats?.activeExams ?? "-"}
            description="คลัง"
            color="bg-green-500"
            subValue={`จากทั้งหมด ${stats?.totalAllExams ?? "-"} คลัง`}
            onClick={() => router.push("/admin/manage_examset")}
          />
          <StatCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="คะแนนเฉลี่ยของผู้เรียน"
            value={`${stats?.averageScore?.toFixed(1) ?? "0"}%`}
            description="คะแนนเฉลี่ย"
            color="bg-yellow-500"
          />
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            title="จำนวนเซสชันการสอบ"
            value={stats?.totalSessions?.toLocaleString() ?? "-"}
            description="ครั้ง"
            color="bg-red-500"
          />
        </div>

        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              แนวโน้มประสิทธิภาพของผู้เรียน (คะแนนเฉลี่ยรายเดือน)
            </h2>
            <div className="h-80 w-full">
              {monthlyData.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  ยังไม่มีข้อมูลคะแนนในช่วงนี้
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={monthlyData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                    <XAxis dataKey="name" />
                    <YAxis tickFormatter={(value) => `${value}%`} domain={[0, 100]} />
                    <Tooltip formatter={(value: number) => [`${value}%`, "คะแนนเฉลี่ย"]} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#10B981"
                      strokeWidth={2}
                      dot={{ fill: "#059669" }}
                      activeDot={{ r: 8 }}
                      name="คะแนนเฉลี่ยรวม"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>
    </Navbar_admin>
  );
}

export default AdminDashboardPage;