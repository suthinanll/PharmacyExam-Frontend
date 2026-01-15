"use client"
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Navbar_user from "@/components/Navbar_user"
import Footer from "@/components/Footer"
import Link from "next/link"
import { CheckCircle, XCircle, BookOpen, ChevronRight, Loader2, AlertCircle } from 'lucide-react';

// Types
interface AnswerOption {
    option_id: number;
    option_text: string;
    is_correct: boolean;
}

interface Situation {
    situation_id: number;
    situation_title: string;
    situation_text: string;
    situation_image_url?: string;
}

interface QuestionResponse {
    item_id: number;
    question_text: string;
    explanation: string;
    selected_option_id: number | null;
    is_correct: boolean;
    response_time_ms: number;
    answer_options: AnswerOption[];
    situation?: Situation;
}

interface ExamResult {
    session_id: number;
    item_bank_name: string;
    status: string;
    start_time: string;
    end_time: string;
    total_questions: number;
    correct_count: number;
    final_score: number;
    responses: QuestionResponse[];
}

const API_URL = 'http://localhost:5000';

const AnswerPage = () => {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');

    const [examResult, setExamResult] = useState<ExamResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (sessionId) {
            fetchExamResult();
        } else {
            setError('ไม่พบรหัส session');
            setLoading(false);
        }
    }, [sessionId]);

    const fetchExamResult = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/items-bank/exam/${sessionId}/result`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setExamResult(data);
            } else {
                throw new Error('ไม่สามารถโหลดเฉลยคำตอบได้');
            }
        } catch (error) {
            console.error('Error fetching exam result:', error);
            setError('เกิดข้อผิดพลาดในการโหลดเฉลยคำตอบ');
        } finally {
            setLoading(false);
        }
    };


    const QuestionCard = ({ question, index, showSituation = true }: { question: QuestionResponse, index: number, showSituation?: boolean }) => {
        const correctOption = question.answer_options.find(opt => opt.is_correct);
        const userSelectedOption = question.answer_options.find(opt => opt.option_id === question.selected_option_id);
        const isCorrect = question.is_correct;

        return (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
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
                        {question.question_text}
                    </p>
                </div>

                {/* Options and Answers */}
                <div className="p-4 sm:p-5 space-y-2">
                    {question.answer_options.map((option) => {
                        const isUserAnswer = option.option_id === question.selected_option_id;
                        const isCorrectAnswer = option.is_correct;

                        let className = "py-2 px-3 rounded-lg border text-gray-700";

                        if (isCorrectAnswer) {
                            // คำตอบที่ถูกต้อง
                            className = "py-2 px-3 rounded-lg border-2 border-green-600 bg-green-100 font-semibold text-green-800 relative";
                        } else if (isUserAnswer && !isCorrectAnswer) {
                            // คำตอบที่ผู้ใช้เลือกและผิด
                            className = "py-2 px-3 rounded-lg border-2 border-red-600 bg-red-100 font-semibold text-red-800 relative";
                        } else {
                            // ตัวเลือกอื่นๆ
                            className = "py-2 px-3 rounded-lg border border-gray-200 text-gray-700";
                        }

                        return (
                            <div key={option.option_id} className={className}>
                                <div className="flex items-center justify-between">
                                    <span>{option.option_text}</span>
                                    {isCorrectAnswer && (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    )}
                                    {isUserAnswer && !isCorrectAnswer && (
                                        <XCircle className="w-5 h-5 text-red-600" />
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Explanation / เฉลย */}
                {question.explanation && (
                    <div className="p-4 sm:p-5 bg-blue-50 border-t border-blue-200">
                        <div className="flex items-center text-lg font-semibold text-gray-800 mb-2">
                            <BookOpen className="w-5 h-5 mr-2 text-blue-600" />
                            คำอธิบาย
                        </div>
                        <p className="text-gray-700 whitespace-pre-line">
                            {question.explanation}
                        </p>
                    </div>
                )}
            </div>
        );
    };

    // Group questions by situation
    const groupQuestionsBySituation = () => {
        const groups: { situation: Situation | null, questions: { question: QuestionResponse, originalIndex: number }[] }[] = [];

        examResult?.responses.forEach((question, index) => {
            const situationId = question.situation?.situation_id;

            // Find existing group with same situation
            const existingGroup = groups.find(g =>
                g.situation?.situation_id === situationId && situationId !== undefined
            );

            if (existingGroup && situationId) {
                // Add to existing group
                existingGroup.questions.push({ question, originalIndex: index });
            } else {
                // Create new group
                groups.push({
                    situation: question.situation || null,
                    questions: [{ question, originalIndex: index }]
                });
            }
        });

        return groups;
    };


    if (loading) {
        return (
            <>
                <Navbar_user />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">กำลังโหลดเฉลยคำตอบ...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (error || !examResult) {
        return (
            <>
                <Navbar_user />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
                        <p className="text-gray-600 mb-6">{error || 'ไม่พบเฉลยคำตอบ'}</p>
                        <Link
                            href="/user/examset"
                            className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
                        >
                            กลับไปหน้าคลังข้อสอบ
                        </Link>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Navbar_user />
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 mb-4">
                    <div className="max-w-7xl mx-auto">
                        {/* Breadcrumb */}
                        <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-6">
                            <Link href="/user" className="hover:text-blue-600 transition">หน้าหลัก</Link>
                            <span className="mx-1 sm:mx-2 flex items-center">
                                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </span>
                            <Link href="/user/examset" className="hover:text-blue-600 transition">คลังข้อสอบ</Link>
                            <span className="mx-1 sm:mx-2 flex items-center">
                                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </span>
                            <span className="hidden sm:inline-flex items-center">
                                {examResult.item_bank_name}
                            </span>
                            <span className="mx-1 sm:mx-2 flex items-center">
                                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </span>
                            <Link
                                href={`/user/examset/take-exam/summarize-exam?session_id=${sessionId}`}
                                className="hover:text-blue-600 transition whitespace-nowrap"
                            >
                                สรุปผลการสอบ
                            </Link>
                            <span className="mx-1 sm:mx-2 flex items-center">
                                <ChevronRight className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            </span>
                            <span className="text-gray-700 font-medium whitespace-nowrap">เฉลยคำตอบ</span>
                        </div>

                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-medium text-gray-800 mb-1">
                                เฉลยคำตอบ: {examResult.item_bank_name}
                            </h1>
                            <div className="mt-3 text-sm text-gray-500">
                                <span>จำนวนทั้งหมด: {examResult.total_questions} ข้อ</span>
                                <span className="mx-3">|</span>
                                <span className="text-green-600 font-medium">ตอบถูก: {examResult.correct_count} ข้อ</span>
                                <span className="mx-3">|</span>
                                <span className="text-red-600 font-medium">
                                    ตอบผิด: {examResult.total_questions - examResult.correct_count} ข้อ
                                </span>
                            </div>
                        </div>

                        {/* Questions */}
                        <div className="space-y-6">
                            {groupQuestionsBySituation().map((group, groupIndex) => (
                                <div key={groupIndex} className="space-y-4">
                                    {/* Situation Header (if exists) */}
                                    {group.situation && (
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-md border border-blue-200 overflow-hidden">
                                            <div className="p-5 sm:p-6">
                                                <div className="flex items-center gap-2 mb-3">
                                                    <BookOpen className="w-5 h-5 text-blue-600" />
                                                    <h3 className="text-lg font-bold text-blue-900">
                                                        {group.situation.situation_title}
                                                    </h3>
                                                </div>
                                                <p className="text-blue-800 whitespace-pre-wrap leading-relaxed">
                                                    {group.situation.situation_text}
                                                </p>
                                                {group.situation.situation_image_url && (
                                                    <img
                                                        src={group.situation.situation_image_url}
                                                        alt="Situation"
                                                        className="mt-4 rounded-lg max-w-full shadow-sm"
                                                    />
                                                )}
                                                
                                            </div>
                                        </div>
                                    )}

                                    {/* Questions in this group */}
                                    <div className="space-y-4 pl-0">
                                        {group.questions.map(({ question, originalIndex }) => (
                                            <QuestionCard
                                                key={question.item_id}
                                                question={question}
                                                index={originalIndex}
                                                showSituation={false}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Back Button */}
                        <div className="mt-8 flex justify-center">
                            <Link
                                href={`/user/examset/take-exam/summarize-exam?session_id=${sessionId}`}
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                                กลับไปหน้าสรุปผล
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
            <Footer />
        </>
    )
}

export default AnswerPage;