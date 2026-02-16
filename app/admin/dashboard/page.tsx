"use client"
import React, { useState } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import {
  Home,
  FileText,
  Calendar,
  Newspaper,
  MessageSquare,
  Settings,
  LogOut,
  Users,
  ClipboardCheck,
  TrendingUp,
  Award,
  AlertCircle
} from 'lucide-react';

// ==================== MOCK DATA ====================
const mockDailyData = [
  { date: '01/04', visits: 245, exams: 89, passed: 67 },
  { date: '02/04', visits: 312, exams: 102, passed: 78 },
  { date: '03/04', visits: 289, exams: 95, passed: 71 },
  { date: '04/04', visits: 356, exams: 118, passed: 89 },
  { date: '05/04', visits: 401, exams: 134, passed: 98 },
  { date: '06/04', visits: 378, exams: 125, passed: 92 },
  { date: '07/04', visits: 423, exams: 145, passed: 107 },
];

const mockWeeklyData = [
  { week: 'สัปดาห์ 1', visits: 1845, exams: 645, passed: 478 },
  { week: 'สัปดาห์ 2', visits: 2103, exams: 723, passed: 534 },
  { week: 'สัปดาห์ 3', visits: 1967, exams: 689, passed: 512 },
  { week: 'สัปดาห์ 4', visits: 2234, exams: 767, passed: 571 },
];

const mockYearlyData = [
  { month: 'ม.ค.', visits: 8234, exams: 2845, passed: 2103 },
  { month: 'ก.พ.', visits: 7856, exams: 2678, passed: 1987 },
  { month: 'มี.ค.', visits: 9102, exams: 3124, passed: 2301 },
  { month: 'เม.ย.', visits: 8567, exams: 2934, passed: 2178 },
  { month: 'พ.ค.', visits: 9345, exams: 3201, passed: 2367 },
  { month: 'มิ.ย.', visits: 8912, exams: 3045, passed: 2256 },
];

const mockContentAreaPerformance = [
  { name: 'เภสัชวิทยา', avgScore: 72.5, exams: 1234 },
  { name: 'เภสัชกรรมคลินิก', avgScore: 68.3, exams: 987 },
  { name: 'เภสัชกรรมบริบาล', avgScore: 75.8, exams: 876 },
  { name: 'การปฏิบัติการเภสัชกรรม', avgScore: 71.2, exams: 765 },
  { name: 'เภสัชเคมี', avgScore: 69.7, exams: 654 },
  { name: 'เภสัชจลนศาสตร์', avgScore: 73.4, exams: 543 },
];

const mockDifficultyDistribution = [
  { name: 'ง่าย (b < -1)', value: 234, color: '#76b25a' },
  { name: 'ปานกลาง (-1 ≤ b < 0)', value: 456, color: '#9ac77f' },
  { name: 'ค่อนข้างยาก (0 ≤ b < 1)', value: 389, color: '#b8d9a1' },
  { name: 'ยาก (b ≥ 1)', value: 178, color: '#d6ebc3' },
];

const mockRecentExams = [
  { id: 'EX001', name: 'สมชาย ใจดี', score: 1.23, result: 'ผ่าน', time: '45:23', date: '2024-04-07 09:15' },
  { id: 'EX002', name: 'สมหญิง รักเรียน', score: -0.45, result: 'ไม่ผ่าน', time: '38:12', date: '2024-04-07 09:00' },
  { id: 'EX003', name: 'วิชัย มั่นคง', score: 0.87, result: 'ผ่าน', time: '42:56', date: '2024-04-07 08:45' },
  { id: 'EX004', name: 'นิภา สว่างใจ', score: 1.56, result: 'ผ่าน', time: '48:34', date: '2024-04-07 08:30' },
  { id: 'EX005', name: 'ประยุทธ์ ฉลาด', score: -0.12, result: 'ไม่ผ่าน', time: '35:28', date: '2024-04-07 08:15' },
];

const mockSystemAlerts = [
  { type: 'warning', message: 'ข้อสอบในหมวด "เภสัชจลนศาสตร์" เหลือน้อยกว่า 100 ข้อ', time: '2 ชั่วโมงที่แล้ว' },
  { type: 'info', message: 'มีผู้เข้าใช้งานพร้อมกัน 45 คน ในขณะนี้', time: '15 นาทีที่แล้ว' },
  { type: 'success', message: 'ระบบสำรองข้อมูลเสร็จสมบูรณ์', time: '3 ชั่วโมงที่แล้ว' },
];

// ==================== TYPES ====================
type MenuId = 'dashboard' | 'items' | 'calendar' | 'news' | 'chat' | 'settings';
type TimeRange = 'daily' | 'weekly' | 'yearly';

// ==================== MAIN COMPONENT ====================
export default function AdminDashboard() {
  const [activeMenu, setActiveMenu] = useState<MenuId>('dashboard');
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const menuItems = [
    { id: 'dashboard' as MenuId, icon: Home, label: 'หน้าหลัก' },
    { id: 'items' as MenuId, icon: FileText, label: 'คลังข้อสอบ' },
    { id: 'calendar' as MenuId, icon: Calendar, label: 'ปฏิทินกำหนดการ' },
    { id: 'news' as MenuId, icon: Newspaper, label: 'ข่าวสาร' },
    { id: 'chat' as MenuId, icon: MessageSquare, label: 'ประวัติการสนทนา' },
    { id: 'settings' as MenuId, icon: Settings, label: 'การตั้งค่า' },
  ];

  const getChartData = () => {
    switch (timeRange) {
      case 'daily': return mockDailyData;
      case 'weekly': return mockWeeklyData;
      case 'yearly': return mockYearlyData;
    }
  };

  const getTotalStats = () => {
    const data = getChartData();
    return {
      visits: data.reduce((sum, d) => sum + d.visits, 0),
      exams: data.reduce((sum, d) => sum + d.exams, 0),
      passed: data.reduce((sum, d) => sum + d.passed, 0),
    };
  };

  const stats = getTotalStats();
  const passRate = ((stats.passed / stats.exams) * 100).toFixed(1);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center border-b border-gray-200" style={{ backgroundColor: '#76b25a' }}>
            <div className="text-white font-bold text-xl">
              {sidebarOpen ? '🏥 Pharmacy CAT' : '🏥'}
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 py-6 px-3 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeMenu === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveMenu(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                    ? 'text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  style={isActive ? { backgroundColor: '#76b25a' } : {}}
                >
                  <Icon size={20} />
                  {sidebarOpen && <span className="font-medium">{item.label}</span>}
                </button>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="border-t border-gray-200 p-3">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-all">
              <LogOut size={20} />
              {sidebarOpen && <span className="font-medium">ออกจากระบบ</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
              <div className="w-5 h-0.5 bg-gray-600 mb-1"></div>
              <div className="w-5 h-0.5 bg-gray-600"></div>
            </button>
            <h1 className="text-xl font-bold text-gray-800">
              {menuItems.find(m => m.id === activeMenu)?.label}
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              ผู้ดูแลระบบ: <span className="font-semibold">Admin User</span>
            </div>
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold" style={{ backgroundColor: '#76b25a' }}>
              A
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        {activeMenu === 'dashboard' && (
          <main className="flex-1 overflow-auto p-6">
            {/* Time Range Selector */}
            <div className="flex gap-2 mb-6">
              {[
                { value: 'daily' as TimeRange, label: 'รายวัน' },
                { value: 'weekly' as TimeRange, label: 'รายสัปดาห์' },
                { value: 'yearly' as TimeRange, label: 'รายปี' }
              ].map(range => (
                <button
                  key={range.value}
                  onClick={() => setTimeRange(range.value)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${timeRange === range.value
                    ? 'text-white shadow-md'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                    }`}
                  style={timeRange === range.value ? { backgroundColor: '#76b25a' } : {}}
                >
                  {range.label}
                </button>
              ))}
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <StatCard
                icon={Users}
                title="ผู้เข้าใช้งาน"
                value={stats.visits.toLocaleString()}
                change="+12.5%"
                positive
              />
              <StatCard
                icon={ClipboardCheck}
                title="จำนวนการสอบ"
                value={stats.exams.toLocaleString()}
                change="+8.3%"
                positive
              />
              <StatCard
                icon={Award}
                title="สอบผ่าน"
                value={stats.passed.toLocaleString()}
                change="+15.2%"
                positive
              />
              <StatCard
                icon={TrendingUp}
                title="อัตราการผ่าน"
                value={`${passRate}%`}
                change="+3.1%"
                positive
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Visits & Exams Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">📊 สถิติการเข้าใช้งานและการสอบ</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey={timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'week' : 'month'}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="visits" stroke="#76b25a" strokeWidth={2} name="ผู้เข้าใช้งาน" />
                    <Line type="monotone" dataKey="exams" stroke="#4a7c3a" strokeWidth={2} name="จำนวนการสอบ" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Pass Rate Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">✅ อัตราการผ่านการสอบ</h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey={timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'week' : 'month'}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="exams" fill="#9ac77f" name="ทั้งหมด" />
                    <Bar dataKey="passed" fill="#76b25a" name="ผ่าน" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Content Area Performance */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">📚 ผลการสอบแยกตามหมวดวิชา</h2>
                <div className="space-y-3">
                  {mockContentAreaPerformance.map((area, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-gray-700">{area.name}</span>
                        <span className="text-gray-600">{area.avgScore}% ({area.exams} ครั้ง)</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${area.avgScore}%`,
                            backgroundColor: '#76b25a'
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Difficulty Distribution */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">🎯 การกระจายความยากของข้อสอบ</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={mockDifficultyDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }: { name: string; percent: number }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {mockDifficultyDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Exams & Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Exams */}
              <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">⏱️ การสอบล่าสุด</h2>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">รหัส</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">ชื่อผู้สอบ</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">คะแนน (θ)</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">ผล</th>
                        <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">เวลา</th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">วันที่</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mockRecentExams.map((exam, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-3 px-4 text-sm">{exam.id}</td>
                          <td className="py-3 px-4 text-sm font-medium">{exam.name}</td>
                          <td className="py-3 px-4 text-sm text-center font-mono">{exam.score.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${exam.result === 'ผ่าน'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                              }`}>
                              {exam.result}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-center font-mono">{exam.time}</td>
                          <td className="py-3 px-4 text-sm text-gray-600">{exam.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* System Alerts */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-bold text-gray-800 mb-4">🔔 แจ้งเตือนระบบ</h2>
                <div className="space-y-3">
                  {mockSystemAlerts.map((alert, i) => (
                    <div key={i} className={`p-4 rounded-lg border-l-4 ${alert.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                      alert.type === 'info' ? 'bg-blue-50 border-blue-500' :
                        'bg-green-50 border-green-500'
                      }`}>
                      <div className="flex items-start gap-2">
                        <AlertCircle size={16} className={
                          alert.type === 'warning' ? 'text-yellow-600' :
                            alert.type === 'info' ? 'text-blue-600' :
                              'text-green-600'
                        } />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        )}

        {/* Other Menu Placeholders */}
        {activeMenu !== 'dashboard' && (
          <main className="flex-1 overflow-auto p-6">
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                หน้า {menuItems.find(m => m.id === activeMenu)?.label}
              </h2>
              <p className="text-gray-600">กำลังพัฒนา...</p>
            </div>
          </main>
        )}
      </div>
    </div>
  );
}

// ==================== STAT CARD COMPONENT ====================
function StatCard({ icon: Icon, title, value, change, positive }: {
  icon: React.ElementType;
  title: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#76b25a' }}>
          <Icon size={24} className="text-white" />
        </div>
        <span className={`text-sm font-semibold ${positive ? 'text-green-600' : 'text-red-600'}`}>
          {change}
        </span>
      </div>
      <h3 className="text-gray-600 text-sm mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-800">{value}</p>
    </div>
  );
}