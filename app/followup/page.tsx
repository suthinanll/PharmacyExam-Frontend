"use client"
import { useState } from 'react';
import Navbar_user from "@/components/Navbar_user";
import { 
  LineChart, Line,PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const PharmacistDashboard = () => {
  // ข้อมูลสถิติการสอบ
  const [examStats] = useState({
    totalExams: 156,
    passedExams: 132,
    failedExams: 24,
    averageScore: 68.5,
    lastExamScore: 72,
    improvementRate: 8.3,
    daysUntilExam: 45,
    studyHours: 234
  });

  // ข้อมูลคะแนนย้อนหลัง 6 ครั้งล่าสุด
  const scoreHistory = [
    { month: 'มี.ค.', score: 62, passing: 60 },
    { month: 'เม.ย.', score: 65, passing: 60 },
    { month: 'พ.ค.', score: 64, passing: 60 },
    { month: 'มิ.ย.', score: 68, passing: 60 },
    { month: 'ก.ค.', score: 70, passing: 60 },
    { month: 'ส.ค.', score: 72, passing: 60 },
  ];


  // ข้อมูล Radar Chart - วิเคราะห์จุดแข็ง/จุดอ่อน
  const radarData = [
    { subject: 'เภสัชเคมี', score: 75, fullMark: 100 },
    { subject: 'เภสัชกรรมปฏิบัติ', score: 68, fullMark: 100 },
    { subject: 'เภสัชกรรมคลินิก', score: 72, fullMark: 100 },
    { subject: 'เภสัชกรรมชุมชน', score: 65, fullMark: 100 },
    { subject: 'เภสัชวิทยา', score: 70, fullMark: 100 },
    { subject: 'กฎหมายเภสัช', score: 78, fullMark: 100 },
  ];

  // สถิติการทำข้อสอบ
  const examTypeData = [
    { name: 'ผ่าน', value: examStats.passedExams, color: '#10b981' },
    { name: 'ไม่ผ่าน', value: examStats.failedExams, color: '#ef4444' },
  ];

  // หัวข้อที่ควรทบทวนเพิ่มเติม (จากคะแนนต่ำ)
  const weakTopics = [
    { 
      subject: 'พฤติกรรมสุขภาพ', 
      topic: 'การสื่อสารกับผู้ป่วย',
      score: 62,
      priority: 'สูงมาก',
      color: 'red',
      studyTime: '12 ชม.',
      resources: 3
    },
    { 
      subject: 'เภสัชกรรมชุมชน', 
      topic: 'การจัดการร้านขายยา',
      score: 65,
      priority: 'สูง',
      color: 'orange',
      studyTime: '10 ชม.',
      resources: 5
    },
    { 
      subject: 'เภสัชกรรมปฏิบัติ', 
      topic: 'การคำนวณยา IV admixture',
      score: 68,
      priority: 'ปานกลาง',
      color: 'yellow',
      studyTime: '8 ชม.',
      resources: 4
    },
    { 
      subject: 'เภสัชวิทยา', 
      topic: 'ยาต้านจุลชีพ',
      score: 70,
      priority: 'ปานกลาง',
      color: 'blue',
      studyTime: '6 ชม.',
      resources: 6
    },
  ];

 


  return (
    <>
      <Navbar_user />
      
      <div className="min-h-screen bg-gray-50 p-3 sm:p-4 md:p-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-2">
              <span className="hover:text-blue-600 cursor-pointer">หน้าหลัก</span>
              <span className="mx-2">›</span>
              <span className="text-gray-700 font-medium">ติดตามความคืบหน้า</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                  ติดตามความคืบหน้า
                </h1>
                
              </div>
              <div className="bg-white rounded-xl shadow-lg px-6 py-4 text-center border-2 border-blue-500">
                <p className="text-sm text-gray-600">สอบอีก</p>
                <p className="text-3xl font-bold text-blue-600">{examStats.daysUntilExam}</p>
                <p className="text-sm text-gray-600">วัน</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            {/* การ์ด 1 */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-blue-500 hover:shadow-xl transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">ข้อสอบที่ทำ</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-800">{examStats.totalExams}</p>
                  <p className="text-xs text-gray-500 mt-1">ชุด</p>
                </div>
                <div className="bg-blue-100 p-3 rounded-full">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* การ์ด 2 */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-green-500 hover:shadow-xl transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">ผ่านเกณฑ์</p>
                  <p className="text-2xl sm:text-3xl font-bold text-green-600">{examStats.passedExams}</p>
                  <p className="text-xs text-green-600 mt-1">
                    {((examStats.passedExams / examStats.totalExams) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="bg-green-100 p-3 rounded-full">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* การ์ด 3 */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-yellow-500 hover:shadow-xl transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">คะแนนเฉลี่ย</p>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-600">{examStats.averageScore}</p>
                  <p className="text-xs text-gray-500 mt-1">/ 100 คะแนน</p>
                </div>
                <div className="bg-yellow-100 p-3 rounded-full">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-l-4 border-purple-500 hover:shadow-xl transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">เวลาที่ทำข้อสอบ</p>
                  <p className="text-2xl sm:text-3xl font-bold text-purple-600">{examStats.studyHours}</p>
                  <p className="text-xs text-purple-600 mt-1">ชั่วโมง</p>
                </div>
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Section - Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
            {/* กราฟเส้น - พัฒนาการคะแนน */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="mr-2">📈</span> พัฒนาการคะแนน 6 เดือนล่าสุด
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={scoreHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="passing" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" name="เกณฑ์ผ่าน (60%)" />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} name="คะแนนของคุณ" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* กราฟวงกลม - สถิติผ่าน/ไม่ผ่าน */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="mr-2"></span> สถิติการสอบ
              </h2>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={examTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}\n${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {examTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">อัตราการผ่าน</p>
                <p className="text-2xl font-bold text-green-600">
                  {((examStats.passedExams / examStats.totalExams) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
         

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center">
                <span className="mr-2"></span> วิเคราะห์จุดแข็ง และ จุดอ่อน
              </h2>
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10 }} />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="คะแนนของคุณ" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>

             <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-4 flex items-center">
                ควรทบทวนเพิ่มเติม
              </h2>
              <div className="space-y-3">
                {weakTopics.map((topic, index) => (
                  <div 
                    key={index}
                    className={`p-4 rounded-lg border-l-4 transition-all hover:shadow-md ${
                      topic.priority === 'สูงมาก' 
                        ? 'bg-red-50 border-red-500' 
                        : topic.priority === 'สูง' 
                        ? 'bg-orange-50 border-orange-500'
                        : topic.priority === 'ปานกลาง' 
                        ? 'bg-yellow-50 border-yellow-500' 
                        : 'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-gray-800 text-sm sm:text-base">{topic.topic}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            topic.priority === 'สูงมาก' 
                              ? 'bg-red-200 text-red-700' 
                              : topic.priority === 'สูง' 
                              ? 'bg-orange-200 text-orange-700'
                              : topic.priority === 'ปานกลาง' 
                              ? 'bg-yellow-200 text-yellow-700' 
                              : 'bg-blue-200 text-blue-700'
                          }`}>
                            {topic.priority}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600">{topic.subject}</p>
                        <div className="flex items-center gap-3 mt-2 flex-wrap">
                          <span className="text-xs text-gray-500">
                            คะแนน: {topic.score}
                          </span>
                          <span className="text-xs text-gray-500">
                            ⏱แนะนำ: {topic.studyTime}
                          </span>
                          <span className="text-xs text-gray-500">
                            แหล่งเรียนรู้: {topic.resources} รายการ
                          </span>
                        </div>
                      </div>
                      
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recommended Topics & Recent Activities */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            {/* หัวข้อที่ควรทบทวนเพิ่มเติม */}
           

          </div>


        </div>
      </div>
    </>
  );
};

export default PharmacistDashboard;