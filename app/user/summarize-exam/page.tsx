"use client"
import Link from 'next/link';
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";

function Summarize() {
    const examData = {
        title: "MCQ ปี 2554 ชุดที่ 1",
        subtitle: "MCQ ปี 2554 ชุดที่ 1 จำนวน 110 ข้อ",
        totalQuestions: 110,
        questions: [
            {
                id: 54,
                text: "หญิงไทยคู่ อายุ 40 ปี มีลักษณะซีด อ่อนเพลีย น้ำหนักลด มาพบแพทย์ พบผลการตรวจห้องปฏิบัติการ Hb 9, Hct 27 %, MCV 67,TIBC 480, Serum ferritin 12 ผลการตรวจ smear เม็ดเลือดพบmicrocytic anemia แพทย์จึงวินิจฉัยว่าเป็นโลหิตจาง ผู้ป่วยรายนี้เป็น anemia แบบไหน",
                options: [
                    "ก.Iron deficiency",
                    "ข.Hemolytic anemia",
                    "ค.Megaloblastic anemia",
                    "ง.Sickle cell",
                    "จ.B12 deficiency"
                ]
            }
        ]
    };

    const examResult = {
        title: "MCQ ปี 2554 ชุดที่ 1",
        subtitle: "จำนวน 110 ข้อ",
        score: 110,
        total: 110,
        percentage: 100,
        timeUsed: "01:00:51",
        correctAnswers: [
            "พื่อมารถการซักถอดเบื้อ คะเเนนผลพื้นมีอื่นจ่างบ่องเมื่อง",
            "การร้อยรู้ที่ในประดิกธรรพา : แหละจักความปุ่นและการวิธีการเรื่อนที่ถูกจ้อง",
            "ความคำด่านย้นอื่นฯ : ในใครการถอดเของนในสนบ"
        ],
        incorrectAnswers: [
            "ความเษน่าเสมอ รักการระดับการเรียนรู้กลุ่มน่าเเบบดิ่งเเชิน้นเป็น"
        ],
        chartData: [
            { attempt: "1", score: 45, color: "#3b82f6" },
            { attempt: "2", score: 55, color: "#3b82f6" },
            { attempt: "3", score: 70, color: "#3b82f6" },
            { attempt: "4", score: 80, color: "#3b82f6" },
            { attempt: "5", score: 100, color: "#22c55e" }
        ]
    };


    return (
        <>
            <Navbar_user />

            <div className="min-h-screen bg-gray-100 py-8">
                <div className="container mx-auto px-4 max-w-6xl">

                    <div className="flex items-center text-sm text-gray-500 mb-4">
                        <Link href="/" className="hover:text-blue-600">หน้าหลัก</Link>
                        <span className="mx-2">›</span>
                        <Link href="/examset" className="hover:text-blue-600">คลังข้อสอบ</Link>
                        <span className="mx-2">›</span>
                        <span>{examData.title}</span>
                        <span className="mx-2">›</span>
                        <span className="text-gray-700 font-medium">สรุปผลการสอบ</span>

                    </div>
                    {/* Title Section */}
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{examResult.title}</h1>
                        <p className="text-gray-600">{examResult.subtitle}</p>
                    </div>

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Left Column - Score and Time */}
                        <div className="space-y-6">
                            {/* Score Card */}
                            <div className="bg-white rounded-2xl shadow-sm p-8">
                                <h2 className="text-lg font-bold text-gray-900 mb-6">ผลการทดสอบ</h2>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-gray-600 mb-2">{examResult.title}</p>
                                        <p className="text-gray-500 text-sm mb-4">{examResult.subtitle}</p>
                                        <div className="text-5xl font-bold text-gray-900">
                                            {examResult.score} <span className="text-gray-400">/ {examResult.total}</span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <svg className="w-32 h-32 transform -rotate-90">
                                            <circle
                                                cx="64"
                                                cy="64"
                                                r="56"
                                                stroke="#e5e7eb"
                                                strokeWidth="12"
                                                fill="none"
                                            />
                                            <circle
                                                cx="64"
                                                cy="64"
                                                r="56"
                                                stroke="#22c55e"
                                                strokeWidth="12"
                                                fill="none"
                                                strokeDasharray={`${2 * Math.PI * 56}`}
                                                strokeDashoffset={`${2 * Math.PI * 56 * (1 - examResult.percentage / 100)}`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-2xl font-bold text-green-600">{examResult.percentage}%</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Time Card */}
                            <div className="bg-white rounded-2xl shadow-sm p-8">
                                <h2 className="text-lg font-bold text-gray-900 mb-6">เวลาที่ใช้ในการสอบ</h2>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div className="text-4xl font-bold text-gray-900">{examResult.timeUsed}</div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column - Chart */}
                        <div className="bg-white rounded-2xl shadow-sm p-8">
                            <h2 className="text-lg font-bold text-gray-900 mb-6">เปรียบเทียบคะแนนแต่ละครั้ง</h2>
                            <div className="bg-gray-50 rounded-xl p-6">
                                {/* Y-axis labels */}
                                <div className="flex justify-between text-xs text-gray-400 mb-2 px-2">
                                    <span>0</span>
                                    <span>20</span>
                                    <span>40</span>
                                    <span>60</span>
                                    <span>80</span>
                                    <span>100</span>
                                </div>

                                {/* Chart */}
                                <div className="h-64 flex items-end justify-around gap-4 relative">
                                    {examResult.chartData.map((data, index) => (
                                        <div key={index} className="flex flex-col items-center gap-3" style={{ height: '100%' }}>
                                            <div className="flex flex-col justify-end items-center" style={{ height: '100%', width: '60px' }}>
                                                <div
                                                    className="rounded-t-lg transition-all duration-500 hover:opacity-80 cursor-pointer flex items-end justify-center pb-2"
                                                    style={{
                                                        height: `${data.score}%`,
                                                        width: '100%',
                                                        backgroundColor: data.color
                                                    }}
                                                >
                                                    <span className="text-white font-bold text-sm">{data.score}</span>
                                                </div>
                                            </div>
                                            <span className="text-sm text-gray-600 font-medium">ครั้งที่ {data.attempt}</span>
                                        </div>
                                    ))}
                                </div>

                            </div>
                        </div>
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="bg-white rounded-2xl shadow-sm p-8 mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-6">จุดเด่น และ จุดที่ต้องพัฒนา</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Strengths */}
                            <div>
                                <h3 className="text-base font-bold text-gray-900 mb-4">จุดเด่น</h3>
                                <ul className="space-y-3">
                                    {examResult.correctAnswers.map((answer, index) => (
                                        <li key={index} className="flex gap-2 text-sm text-gray-700">
                                            <span className="text-green-600 font-bold">•</span>
                                            <span>{answer}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Weaknesses */}
                            <div>
                                <h3 className="text-base font-bold text-gray-900 mb-4">จุดที่ต้องพัฒนา</h3>
                                <ul className="space-y-3">
                                    {examResult.incorrectAnswers.map((answer, index) => (
                                        <li key={index} className="flex gap-2 text-sm text-gray-700">
                                            <span className="text-red-600 font-bold">•</span>
                                            <span>{answer}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-3 justify-center">
                        <Link href="/take-exam" className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors inline-block text-center">
                            ทำข้อสอบอีกครั้ง
                        </Link>
                        <Link href="/take-exam" className="px-8 py-3 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-300 transition-colors inline-block text-center">
                            ดูเฉลยคำตอบ
                        </Link>
                    </div>

                </div>
            </div>

            <Footer />
        </>
    );
}

export default Summarize;