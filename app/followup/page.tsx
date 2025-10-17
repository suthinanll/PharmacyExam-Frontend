"use client";
import { useState } from 'react';
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import {
  LineChart, Line, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart,
} from 'recharts';
import { FileText, CheckCircle, Star, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import Link from 'next/link';


interface ExamStats {
  totalExams: number;
  passedExams: number;
  failedExams: number;
  averageScore: number;
  lastExamScore: number;
  improvementRate: number;
  daysUntilExam: number;
  studyHours: number;
}

interface ScoreHistory {
  month: string;
  score: number;
  passing: number;
}

interface RadarData {
  subject: string;
  score: number;
  fullMark: number;
}

interface WeakTopic {
  subject: string;
  topic: string;
  score: number;
  priority: 'ต้องรีบทบทวน!' | 'ควรทบทวนเพิ่มเติม' | 'พอใช้ แต่ควรฝึกฝนเพิ่มเติม' | 'ทำได้ดี';
  color: string;
  studyTime: string;
  resources: number;
}

interface ExamTypeData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number; // ✅ อนุญาตให้เข้าถึง key อื่นได้

}
interface RankingInfo {
  currentRank: number;
  totalUsers: number;
  percentile: number;
  rankChange: number;
  scoreRange: {
    top: number;
    userScore: number;
    average: number;
  };
}


const PharmacistDashboard = () => {
  const [examStats] = useState<ExamStats>({
    totalExams: 156,
    passedExams: 132,
    failedExams: 24,
    averageScore: 68.5,
    lastExamScore: 72,
    improvementRate: 8.3,
    daysUntilExam: 45,
    studyHours: 234
  });

  const [rankingInfo] = useState<RankingInfo>({
    currentRank: 342,
    totalUsers: 1520,
    percentile: 77.5,
    rankChange: 23,
    scoreRange: {
      top: 95,
      userScore: 68.5,
      average: 62
    }
  });

  const scoreHistory: ScoreHistory[] = [
    { month: 'มี.ค.', score: 62, passing: 60 },
    { month: 'เม.ย.', score: 65, passing: 60 },
    { month: 'พ.ค.', score: 64, passing: 60 },
    { month: 'มิ.ย.', score: 68, passing: 60 },
    { month: 'ก.ค.', score: 70, passing: 60 },
    { month: 'ส.ค.', score: 72, passing: 60 },
  ];

  const radarData: RadarData[] = [
    { subject: 'เภสัชเคมี', score: 75, fullMark: 100 },
    { subject: 'เภสัชกรรมปฏิบัติ', score: 68, fullMark: 100 },
    { subject: 'เภสัชกรรมคลินิก', score: 72, fullMark: 100 },
    { subject: 'เภสัชกรรมชุมชน', score: 65, fullMark: 100 },
    { subject: 'เภสัชวิทยา', score: 70, fullMark: 100 },
    { subject: 'กฎหมายเภสัช', score: 78, fullMark: 100 },
  ];

  const examTypeData: ExamTypeData[] = [
    { name: 'ผ่าน', value: examStats.passedExams, color: '#10b981' },
    { name: 'ไม่ผ่าน', value: examStats.failedExams, color: '#ef4444' },
  ];

  const weakTopics: WeakTopic[] = [
    {
      subject: 'พฤติกรรมสุขภาพ',
      topic: 'การสื่อสารกับผู้ป่วย',
      score: 62,
      priority: 'ต้องรีบทบทวน!',
      color: 'red',
      studyTime: '12 ชม.',
      resources: 3
    },
    {
      subject: 'เภสัชกรรมชุมชน',
      topic: 'การจัดการร้านขายยา',
      score: 65,
      priority: 'ควรทบทวนเพิ่มเติม',
      color: 'orange',
      studyTime: '10 ชม.',
      resources: 5
    },
    {
      subject: 'เภสัชกรรมปฏิบัติ',
      topic: 'การคำนวณยา IV admixture',
      score: 68,
      priority: 'พอใช้ แต่ควรฝึกฝนเพิ่มเติม',
      color: 'yellow',
      studyTime: '8 ชม.',
      resources: 4
    },
    {
      subject: 'เภสัชวิทยา',
      topic: 'ยาต้านจุลชีพ',
      score: 70,
      priority: 'ทำได้ดี',
      color: 'green',
      studyTime: '6 ชม.',
      resources: 6
    },
  ];



  const passRate = ((examStats.passedExams / examStats.totalExams) * 100).toFixed(1);

  return (
    <>
      <Navbar_user />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center text-sm text-gray-500 mb-3">
              <Link href="/" className="hover:text-blue-600 cursor-pointer transition">
                หน้าหลัก
              </Link>
              <span className="mx-2">›</span>
              <span className="text-gray-700 font-medium">คลังข้อสอบ</span>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
                  ติดตามความคืบหน้า
                </h1>
                <p className="text-gray-600">ภาพรวมการเตรียมสอบใบประกอบวิชาชีพเภสัชกรรม</p>
              </div>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-xl px-8 py-5 text-center text-white">
                <p className="text-sm opacity-90 mb-1">วันสอบเหลืออีก</p>
                <p className="text-5xl font-bold">{examStats.daysUntilExam}</p>
                <p className="text-sm opacity-90 mt-1">วัน</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 mb-8 border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-indigo-100 p-3 rounded-xl">
                <TrendingUp className="w-6 h-6 text-indigo-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">อันดับของคุณ</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Current Rank */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">อันดับปัจจุบัน</p>
                <div className="flex items-end gap-2">
                  <p className="text-5xl font-bold text-indigo-600">#{rankingInfo.currentRank}</p>
                  <p className="text-lg text-gray-500 mb-2">/ {rankingInfo.totalUsers.toLocaleString()}</p>
                </div>
                {rankingInfo.rankChange > 0 && (
                  <div className="flex items-center gap-1 mt-3 text-green-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-sm font-medium">เพิ่มขึ้น {rankingInfo.rankChange} อันดับ</span>
                  </div>
                )}
              </div>


              {/* Score Comparison */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <p className="text-sm text-gray-600 mb-4">เปรียบเทียบคะแนน</p>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1 text-gray-600">
                      <span>คะแนนสูงสุด</span>
                      <span className="font-semibold text-gray-800">{rankingInfo.scoreRange.top}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${rankingInfo.scoreRange.top}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1 text-gray-600">
                      <span>คะแนนของคุณ</span>
                      <span className="font-semibold text-gray-800">{rankingInfo.scoreRange.userScore}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${rankingInfo.scoreRange.userScore}%` }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1 text-gray-600">
                      <span>คะแนนเฉลี่ย</span>
                      <span className="font-semibold text-gray-800">{rankingInfo.scoreRange.average}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-indigo-600 h-2 rounded-full" style={{ width: `${rankingInfo.scoreRange.average}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </div>


          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-blue-100 p-3 rounded-xl">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  ทั้งหมด
                </span>
              </div>
              <p className="text-3xl font-bold text-gray-800 mb-1">{examStats.totalExams}</p>
              <p className="text-sm text-gray-600">ข้อสอบที่ทำ</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-green-100 p-3 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-xs font-medium text-green-700 bg-green-100 px-3 py-1 rounded-full">
                  {passRate}%
                </span>
              </div>
              <p className="text-3xl font-bold text-green-600 mb-1">{examStats.passedExams}</p>
              <p className="text-sm text-gray-600">ผ่านเกณฑ์</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-yellow-100 p-3 rounded-xl">
                  <Star className="w-6 h-6 text-yellow-600" />
                </div>
                <span className="text-xs font-medium text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                  เฉลี่ย
                </span>
              </div>
              <p className="text-3xl font-bold text-yellow-600 mb-1">{examStats.averageScore}</p>
              <p className="text-sm text-gray-600">คะแนนเฉลี่ย</p>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-purple-100 p-3 rounded-xl">
                  <Clock className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-xs font-medium text-purple-700 bg-purple-100 px-3 py-1 rounded-full">
                  ชั่วโมง
                </span>
              </div>
              <p className="text-3xl font-bold text-purple-600 mb-1">{examStats.studyHours}</p>
              <p className="text-sm text-gray-600">เวลาที่ทำข้อสอบ</p>
            </div>
          </div>

          {/* Ranking Overview Section */}

          {/* Charts Section - Combined */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Line Chart */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-bold text-gray-800">พัฒนาการคะแนน</h2>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={scoreHistory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 13, fill: '#6b7280' }} />
                    <YAxis tick={{ fontSize: 13, fill: '#6b7280' }} domain={[0, 100]} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Line
                      type="monotone"
                      dataKey="passing"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      name="เกณฑ์ผ่าน (60%)"
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#3b82f6"
                      strokeWidth={3}
                      name="คะแนนของคุณ"
                      dot={{ fill: '#3b82f6', r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="lg:border-l lg:border-gray-200 lg:pl-8">
                <h2 className="text-xl font-bold text-gray-800 mb-6">สถิติการสอบทั้งหมด</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={examTypeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props) => {
                        const name = props.name ?? '';
                        const percent = typeof props.percent === 'number' ? props.percent : 0;
                        return `${name} ${(percent * 100).toFixed(0)}%`;
                      }}
                      outerRadius={80}
                    >
                      {examTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>

                <div className="mt-6 pt-6 border-t border-gray-200 text-center">
                  <p className="text-sm text-gray-600 mb-1">อัตราการผ่าน</p>
                  <p className="text-3xl font-bold text-green-600">{passRate}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Analysis Section - Combined */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Radar Chart */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-6">วิเคราะห์จุดแข็ง-จุดอ่อน</h2>
                <ResponsiveContainer width="100%" height={350}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 11, fill: '#6b7280' }} />
                    <Radar
                      name="คะแนนของคุณ"
                      dataKey="score"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.5}
                      strokeWidth={2}
                    />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Weak Topics */}
              <div className="lg:border-l lg:border-gray-200 lg:pl-8">
                <div className="flex items-center gap-2 mb-6">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                  <h2 className="text-xl font-bold text-gray-800">ควรทบทวนเพิ่มเติม</h2>
                </div>
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {weakTopics.map((topic, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-xl border transition-all hover:shadow-md ${topic.priority === 'ต้องรีบทบทวน!'
                        ? 'bg-red-50 border-red-200 hover:border-red-300'
                        : topic.priority === 'ควรทบทวนเพิ่มเติม'
                          ? 'bg-orange-50 border-orange-200 hover:border-orange-300'
                          : topic.priority === 'พอใช้ แต่ควรฝึกฝนเพิ่มเติม'
                            ? 'bg-yellow-50 border-yellow-200 hover:border-yellow-300'
                            : 'bg-green-50 border-green-200 hover:border-green-300'
                        }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-bold text-gray-800 text-base">{topic.topic}</h3>
                            <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${topic.priority === 'ต้องรีบทบทวน!'
                              ? 'bg-red-200 text-red-700'
                              : topic.priority === 'ควรทบทวนเพิ่มเติม'
                                ? 'bg-orange-200 text-orange-700'
                                : topic.priority === 'พอใช้ แต่ควรฝึกฝนเพิ่มเติม'
                                  ? 'bg-yellow-200 text-yellow-700'
                                  : 'bg-green-200 text-green-700'
                              }`}>
                              {topic.priority}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{topic.subject}</p>
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <span className="font-medium">คะแนน:</span> {topic.score}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {topic.studyTime}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {topic.resources} รายการ
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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