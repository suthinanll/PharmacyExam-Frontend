"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { Users, BookOpen, Clock, BarChart3, Loader2 } from "lucide-react";
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
} from 'recharts';


interface DashboardStats {
  totalUsers: number;
  activeExams: number;
  averageScore: number;
  totalSessions: number;
}

// ข้อมูลจำลองสำหรับ Dashboard Card (ไม่มีการเปลี่ยนแปลง)
const initialStats: DashboardStats = {
  totalUsers: 1250,
  activeExams: 12,
  averageScore: 78.5,
  totalSessions: 8540,
};

// Component สำหรับแสดงค่าสถิติ (ไม่มีการเปลี่ยนแปลง)
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  description: string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, title, value, description, color }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 transition-transform duration-300 hover:shadow-xl">
    <div className={`p-3 w-12 h-12 rounded-full ${color} text-white mb-4 flex items-center justify-center`}>
      {icon}
    </div>
    <p className="text-sm font-medium text-gray-500 truncate">{title}</p>
    <div className="flex items-baseline space-x-2 mt-1">
      <h3 className="text-3xl font-extrabold text-gray-900">{value}</h3>
      <p className="text-xs text-gray-500">{description}</p>
    </div>
  </div>
);

const monthlyScoreData = [
    { name: 'ม.ค.', score: 70 },
    { name: 'ก.พ.', score: 72 },
    { name: 'มี.ค.', score: 75 },
    { name: 'เม.ย.', score: 73 },
    { name: 'พ.ค.', score: 78 },
    { name: 'มิ.ย.', score: 80 },
    { name: 'ก.ค.', score: 82 },
    { name: 'ส.ค.', score: 79 },
    { name: 'ก.ย.', score: 81 },
    { name: 'ต.ค.', score: 83 },
    { name: 'พ.ย.', score: 85 },
    { name: 'ธ.ค.', score: 84 },
];


function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 💡 จำลองการดึงข้อมูลจาก API
  useEffect(() => {
    // ในการใช้งานจริง: const response = await fetch('/api/admin/dashboard');
    setTimeout(() => {
      setStats(initialStats);
      setIsLoading(false);
    }, 1000);
  }, []);


  if (isLoading) {
    return (
      <Navbar_admin>
        <div className="flex items-center justify-center h-full min-h-[500px]">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
          <span className="ml-3 text-lg text-gray-600">กำลังโหลดข้อมูล Dashboard...</span>
        </div>
      </Navbar_admin>
    );
  }

  const data = stats as DashboardStats;

  return (
    <Navbar_admin>
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <p className="mt-1 text-base text-gray-500">
            สรุปสถิติสำคัญและการใช้งานในระบบ ณ ปัจจุบัน
          </p>
        </div>

        {/* 1. Stat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* 1.1 ผู้ใช้งานทั้งหมด */}
          <StatCard
            icon={<Users className="w-6 h-6" />}
            title="ผู้ใช้งานในระบบทั้งหมด"
            value={data.totalUsers.toLocaleString()} // 1,250
            description="คน"
            color="bg-indigo-500"
          />

          {/* 1.2 ธนาคารข้อสอบที่เปิดใช้งาน */}
          <StatCard
            icon={<BookOpen className="w-6 h-6" />}
            title="คลังข้อสอบที่เปิดใช้งาน"
            value={data.activeExams}
            description="คลัง"
            color="bg-green-500"
          />
          
          {/* 1.3 คะแนนเฉลี่ยของผู้เรียน (รวม) */}
          <StatCard
            icon={<BarChart3 className="w-6 h-6" />}
            title="คะแนนเฉลี่ยของผู้เรียน (รวม)"
            value={`${data.averageScore.toFixed(1)}%`}
            description="จากผู้เรียนทั้งหมด"
            color="bg-yellow-500"
          />

          {/* 1.4 จำนวนเซสชันการสอบ */}
          <StatCard
            icon={<Clock className="w-6 h-6" />}
            title="จำนวนเซสชันการสอบ"
            value={data.totalSessions.toLocaleString()} // 8,540
            description="ครั้ง"
            color="bg-red-500"
          />
        </div>

        {/* 2. Charts / Recent Activities */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* 2.1 Performance Summary Chart (ใช้ Recharts Line Chart) */}
            <div className="lg:col-span-3 bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                    แนวโน้มประสิทธิภาพของผู้เรียน (คะแนนเฉลี่ยรายเดือน)
                </h2>
                <div className="h-80 w-full"> {/* กำหนดความสูงของ Chart Container */}
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={monthlyScoreData}
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                            <XAxis dataKey="name" />
                            <YAxis 
                                tickFormatter={(value) => `${value}%`} // แสดง % ที่แกน Y
                                domain={[0, 100]} // กำหนดช่วงของแกน Y
                            />
                            <Tooltip 
                                formatter={(value: number) => [`${value}%`, "คะแนนเฉลี่ย"]} // จัดรูปแบบ Tooltip
                                contentStyle={{ borderRadius: '8px', border: '1px solid #ccc' }}
                            />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="score" 
                                stroke="#10B981" // emerald-500
                                strokeWidth={2}
                                dot={{ fill: '#059669' }} // emerald-600
                                activeDot={{ r: 8 }}
                                name="คะแนนเฉลี่ยรวม"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
      </div>
    </Navbar_admin>
  );
}

export default AdminDashboardPage;