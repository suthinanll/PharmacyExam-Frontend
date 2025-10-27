"use client"
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import Swal from 'sweetalert2';

function TakeExam() {

    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState(1);
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});
    const [timeLeft, setTimeLeft] = useState(7199); // 1:59:59

    // ข้อมูลข้อสอบตัวอย่าง
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

    // Timer
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (optionIndex: number) => {
        setSelectedAnswer(optionIndex);
        setAnswers({ ...answers, [currentQuestion]: optionIndex });
    };

    const goToQuestion = (questionNum: number) => {
        setCurrentQuestion(questionNum);
        setSelectedAnswer(answers[questionNum] || null);
    };

    const progress = (Object.keys(answers).length / examData.totalQuestions) * 100;

    // สร้างกริดหมายเลขข้อ
    const questionNumbers = Array.from({ length: examData.totalQuestions }, (_, i) => i + 1);

    return (
        <>
            <Navbar_user />

            <div className="min-h-screen bg-gray-50 py-6">
                <div className="container mx-auto px-4">
                    {/* Breadcrumb */}
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                        <Link href="/user" className="hover:text-blue-600">หน้าหลัก</Link>
                        <span className="mx-2">›</span>
                        <Link href="/user/examset" className="hover:text-blue-600">คลังข้อสอบ</Link>
                        <span className="mx-2">›</span>
                        <span className="text-gray-700 font-medium">{examData.title}</span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content - Left Side */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                {/* Header */}
                                <h1 className="text-2xl font-bold text-gray-800 mb-1">
                                    {examData.title}
                                </h1>
                                <p className="text-gray-600 mb-4">{examData.subtitle}</p>

                                {/* Progress Bar */}
                                <div className="mb-6">
                                    <div className="flex justify-end mb-1">
                                        <span className="text-sm text-green-600 font-medium">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Question */}
                                <div className="mb-6">
                                    <h2 className="font-bold text-gray-800 mb-4">
                                        คำถามที่ {currentQuestion}
                                    </h2>
                                    <p className="text-gray-700 mb-6 leading-relaxed">
                                        {examData.questions[0].text}
                                    </p>

                                    {/* Options */}
                                    <div className="space-y-3">
                                        {examData.questions[0].options.map((option, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleAnswerSelect(index)}
                                                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${selectedAnswer === index
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    }`}
                                            >
                                                <div className="flex items-center">
                                                    <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${selectedAnswer === index
                                                        ? 'border-blue-500'
                                                        : 'border-gray-300'
                                                        }`}>
                                                        {selectedAnswer === index && (
                                                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                        )}
                                                    </div>
                                                    <span className="text-gray-800">{option}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex justify-between items-center pt-6 ">
                                    <button
                                        onClick={() => currentQuestion > 1 && goToQuestion(currentQuestion - 1)}
                                        disabled={currentQuestion === 1}
                                        className="px-6 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ← ย้อนกลับ
                                    </button>
                                    <button
                                        onClick={() => currentQuestion < examData.totalQuestions && goToQuestion(currentQuestion + 1)}
                                        disabled={currentQuestion === examData.totalQuestions}
                                        className="px-6 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ถัดไป →
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Right Side */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                                {/* Stats */}
                                <div className="flex justify-between items-center mb-6">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-800">{examData.totalQuestions} ข้อ</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-red-400">{formatTime(timeLeft)}</p>
                                        <p className="text-sm text-gray-600">เวลาคงเหลือ</p>
                                    </div>
                                </div>

                                {/* Question Grid */}
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-800 mb-3">เลือกข้อ</h3>
                                    <div className="grid grid-cols-7 gap-2 max-h-96 overflow-y-auto">
                                        {questionNumbers.map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => goToQuestion(num)}
                                                className={`aspect-square rounded-lg font-medium text-sm transition-all ${currentQuestion === num
                                                    ? 'bg-green-500 text-white ring-2 ring-green-300'
                                                    : answers[num]
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    onClick={() => {
                                        Swal.fire({
                                            title: 'ยืนยันการส่งข้อสอบ',
                                            text: 'คุณต้องการส่งข้อสอบใช่หรือไม่?',
                                            icon: 'question',
                                            showCancelButton: true,
                                            confirmButtonColor: '#22c55e',
                                            cancelButtonColor: '#6b7280',
                                            confirmButtonText: 'ส่งข้อสอบ',
                                            cancelButtonText: 'ยกเลิก',
                                            reverseButtons: true,
                                            customClass: {
                                                popup: 'rounded-lg',
                                                confirmButton: 'rounded-lg px-6 py-2',
                                                cancelButton: 'rounded-lg px-6 py-2'
                                            }
                                        }).then((result) => {
                                            if (result.isConfirmed) {
                                                // แสดง loading
                                                Swal.fire({
                                                    title: 'กำลังส่งข้อสอบ...',
                                                    allowOutsideClick: false,
                                                    didOpen: () => {
                                                        Swal.showLoading();
                                                    }
                                                });

                                                setTimeout(() => {
                                                    window.location.href = `/user/examset/take-exam/summarize-exam`;
                                                }, 1000);
                                            }
                                        });
                                    }}
                                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors"
                                >
                                    ส่งข้อสอบ
                                </button>


                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}

export default TakeExam;