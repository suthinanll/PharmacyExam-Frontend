
"use client"
import Navbar_user from "@/components/Navbar_user"
import Footer from "@/components/Footer"
import Link from "next/link"
import { CheckCircle, XCircle, BookOpen, ChevronRight } from 'lucide-react';

const examset = () => {

    const examData = {
        title: "MCQ ปี 2554 ชุดที่ 1",
        subtitle: "MCQ ปี 2554 ชุดที่ 1 จำนวน 110 ข้อ",
        totalQuestions: 110,
        // เพิ่มข้อมูลคำตอบที่ถูกและคำอธิบาย
        questions: [
            {
                id: 1, // เปลี่ยน ID เป็น 1 เพื่อใช้เป็น key ได้ง่าย
                text: "หญิงไทยคู่ อายุ 40 ปี มีลักษณะซีด อ่อนเพลีย น้ำหนักลด มาพบแพทย์ พบผลการตรวจห้องปฏิบัติการ Hb 9, Hct 27 %, MCV 67,TIBC 480, Serum ferritin 12 ผลการตรวจ smear เม็ดเลือดพบmicrocytic anemia แพทย์จึงวินิจฉัยว่าเป็นโลหิตจาง ผู้ป่วยรายนี้เป็น anemia แบบไหน",
                options: [
                    "ก.Iron deficiency",
                    "ข.Hemolytic anemia",
                    "ค.Megaloblastic anemia",
                    "ง.Sickle cell",
                    "จ.B12 deficiency"
                ],
                correctAnswerIndex: 0, // ก. (Iron deficiency)
                userAnswerIndex: 2, // สมมติว่าผู้ใช้ตอบ ค. (ตอบผิด)
                explanation: "จากผลการตรวจห้องปฏิบัติการ: MCV 67 (ต่ำ, microcytic), TIBC 480 (สูง), Serum ferritin 12 (ต่ำ) ซึ่งเป็นลักษณะเฉพาะของภาวะโลหิตจางจากการขาดธาตุเหล็ก (Iron deficiency anemia) ซึ่งเป็นภาวะโลหิตจางแบบ Microcytic hypochromic ที่พบบ่อยที่สุด"
            },
            {
                id: 2, // คำถามที่ 2 (สมมติว่ามี)
                text: "ยา Metformin ออกฤทธิ์หลักในการลดระดับน้ำตาลในเลือดได้อย่างไร?",
                options: [
                    "ก.เพิ่มการหลั่งอินซูลินจากตับอ่อน",
                    "ข.ลดการสร้างกลูโคสจากตับ",
                    "ค.เพิ่มการดูดซึมกลูโคสที่ลำไส้",
                    "ง.ปิดกั้นการทำงานของ Glucagon"
                ],
                correctAnswerIndex: 1, // ข. (ลดการสร้างกลูโคสจากตับ)
                userAnswerIndex: 1, // สมมติว่าผู้ใช้ตอบ ข. (ตอบถูก)
                explanation: "Metformin (ยาในกลุ่ม Biguanides) ออกฤทธิ์หลักโดยการลดการสร้างกลูโคสจากตับ (Hepatic Gluconeogenesis) และเพิ่มความไวของอินซูลินในเนื้อเยื่อส่วนปลาย"
            }
        ]
    };

    const QuestionCard = ({ question, index }: { question: typeof examData.questions[0], index: number }) => {
        const isCorrect = question.userAnswerIndex === question.correctAnswerIndex;

        return (
            <div
                key={question.id} // ใช้ ID ของคำถามเป็น key
                className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
            >
                <div className={`p-4 sm:p-5 flex items-center justify-between ${isCorrect ? 'bg-green-50 border-l-4 border-green-600' : 'bg-red-50 border-l-4 border-red-600'}`}>
                    <h3 className="text-lg font-bold text-gray-800">
                        คำถามข้อที่ {index + 1}
                    </h3>
                    <div className={`flex items-center text-sm font-medium ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                        {isCorrect ? (
                            <CheckCircle className="w-5 h-5 mr-1" />
                        ) : (
                            <XCircle className="w-5 h-5 mr-1" />
                        )}
                        {isCorrect ? 'ตอบถูก' : 'ตอบผิด'}
                    </div>
                </div>

                {/* Question Text */}
                <div className="p-4 sm:p-5 border-b border-gray-100">
                    <p className="text-gray-800 whitespace-pre-line">
                        {question.text}
                    </p>
                </div>

                {/* Options and Answers */}
                <div className="p-4 sm:p-5 space-y-2">
                    {question.options.map((option, optIndex) => {
                        const isUserAnswer = optIndex === question.userAnswerIndex;
                        const isCorrectAnswer = optIndex === question.correctAnswerIndex;

                        let className = "py-2 px-3 rounded-lg border text-gray-700";

                        if (isCorrectAnswer) {
                            // คำตอบที่ถูกต้อง
                            className = "py-2 px-3 rounded-lg border-2 border-green-600 bg-green-100 font-semibold text-green-800 relative";
                        } else if (isUserAnswer && !isCorrectAnswer) {
                            // คำตอบที่ผู้ใช้เลือกและผิด
                            className = "py-2 px-3 rounded-lg border-2 border-red-600 bg-red-100 font-semibold text-red-800 relative";
                        } else {
                            // ตัวเลือกอื่นๆ
                            className = "py-2 px-3 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition";
                        }

                        return (
                            <div key={optIndex} className={className}>
                                {option}
                                {isCorrectAnswer && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-600 font-bold">
                                        <CheckCircle className="w-5 h-5" />
                                    </span>
                                )}
                                {isUserAnswer && !isCorrectAnswer && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 font-bold">
                                        <XCircle className="w-5 h-5" />
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Explanation / เฉลย */}
                <div className="p-4 sm:p-5 bg-gray-100/70 border-t border-gray-200">
                    <div className="flex items-center text-lg font-semibold text-gray-800 mb-2">
                        <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                        คำอธิบาย
                    </div>
                    <p className="text-gray-700 whitespace-pre-line">
                        {question.explanation}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <>
            <Navbar_user />
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 mb-4">
                    <div className="max-w-7xl mx-auto">

                        <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-6 ">
                            <Link href="/user" className="hover:text-blue-600 transition">หน้าหลัก</Link>

                            <span className="mx-1 sm:mx-2 flex items-center">
                                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </span>

                            <Link href="/user/examset" className="hover:text-blue-600 transition">คลังข้อสอบ</Link>

                            <span className="mx-1 sm:mx-2 flex items-center">
                                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </span>
                            <span className="hidden sm:inline-flex items-center">
                                <Link href="/user/examset/take-exam" className="hover:text-blue-600 transition truncate max-w-[100px] md:max-w-none">
                                    {examData.title}
                                </Link>
                                <span className="mx-2 flex items-center">
                                    <ChevronRight className="w-3 h-3" />
                                </span>
                            </span>

                            <span className="inline-flex sm:hidden text-gray-400">
                                ...
                            </span>

                            <span className="hidden sm:inline-flex items-center">
                                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </span>
                            <Link href="/user/examset/take-exam/summarize-exam" className="hover:text-blue-600 transition whitespace-nowrap">สรุปผลการสอบ</Link>

                            <span className="mx-1 sm:mx-2 flex items-center">
                                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </span>
                            <span className="text-gray-700 font-medium whitespace-nowrap">เฉลยคำตอบ</span>
                        </div>


                        <div className="mb-8">
                            <h1 className="text-3xl font-medium text-gray-800 mb-1">
                                เฉลยคำตอบ: {examData.title}
                            </h1>

                            <div className="mt-3 text-sm text-gray-500">
                                <span>จำนวนทั้งหมด: {examData.totalQuestions} ข้อ</span>
                                <span className="mx-3">|</span>

                            </div>
                        </div>

                        <div className="space-y-6">
                            {examData.questions.map((question, index) => (
                                <QuestionCard key={question.id} question={question} index={index} />
                            ))}
                        </div>


                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default examset