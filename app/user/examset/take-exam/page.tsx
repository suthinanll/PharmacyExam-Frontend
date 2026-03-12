"use client"
import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import Swal from 'sweetalert2';
import { Loader2, BookOpen, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Types
interface AnswerOption {
    option_id: number;
    option_text: string;
    is_correct: boolean;
}

interface SubTopic {
    sub_topic_id: number;
    sub_topic_name: string;
    topic?: {
        topic_id: number;
        topic_name: string;
    };
}

interface Situation {
    situation_id: number;
    situation_title: string;
    situation_text: string;
    situation_image_url?: string;
    display_order?: number;
}

interface Question {
    item_id: number;
    question_text: string;
    question_type: string;
    explanation: string;
    status: string;
    display_order: number;
    situation?: Situation;
    answer_options: AnswerOption[];
    sub_topics?: SubTopic[];
}

interface ItemBank {
    item_bank_id: number;
    bank_name: string;
    description: string;
    duration: number;
    is_active: boolean;
    total_items: number;
    items: Question[];
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

function TakeExam() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { getToken } = useAuth();
    const sessionId = searchParams.get('session_id');
    const itemBankId = searchParams.get('id');

    const [itemBank, setItemBank] = useState<ItemBank | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [key: number]: { option_index: number, start_time: number } }>({});
    const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // Track whether exam was properly submitted (don't cancel on submit)
    const submittedRef = useRef(false);

    // Fetch exam data
    useEffect(() => {
        if (itemBankId && sessionId) {
            fetchExamData();
        } else {
            setError('ไม่พบรหัสข้อสอบหรือ session');
            setLoading(false);
        }
    }, [itemBankId, sessionId]);

    // Track question start time
    useEffect(() => {
        setQuestionStartTime(Date.now());
    }, [currentQuestionIndex]);

    // Cancel session if user leaves without submitting (closes tab / navigates away)
    useEffect(() => {
        if (!sessionId) return;
        const doCancel = () => {
            if (submittedRef.current) return;
            const token = getToken();
            if (!token) return;
            // Use sendBeacon so the request survives page unload
            const url = `${API_URL}/items-bank/exam/${sessionId}/cancel`;
            const blob = new Blob([], { type: 'application/json' });
            // sendBeacon doesn't support custom headers, so fall back to fetch w/ keepalive
            fetch(url, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
                keepalive: true
            }).catch(() => { });
        };
        window.addEventListener('beforeunload', doCancel);
        return () => {
            // Cleanup: called when component unmounts (route change via Next.js)
            doCancel();
            window.removeEventListener('beforeunload', doCancel);
        };
    }, [sessionId]);

    const fetchExamData = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/items-bank/${itemBankId}/items`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setItemBank(data);

                // Sort questions strictly by Situation Order and then Question Order
                const sortedQuestions = (data.items || []).sort(
                    (a: Question, b: Question) => {
                        // 1. Get numeric orders
                        const sitOrderA = Number(a.situation?.display_order ?? 0);
                        const sitOrderB = Number(b.situation?.display_order ?? 0);

                        // 2. Compare Situation display_order
                        if (sitOrderA !== sitOrderB) {
                            return sitOrderA - sitOrderB;
                        }

                        // 3. If situation display_order is same, MUST group by situation_id
                        // to prevent questions from different situations with same order from interleaving
                        const sitIdA = a.situation?.situation_id ?? 0;
                        const sitIdB = b.situation?.situation_id ?? 0;
                        if (sitIdA !== sitIdB) {
                            return sitIdA - sitIdB;
                        }

                        // 4. Finally sort by question display_order within that group
                        return Number(a.display_order || 0) - Number(b.display_order || 0);
                    }
                );
                setQuestions(sortedQuestions);

                // Set timer
                setTimeLeft(data.duration || 3600);

                setLoading(false);
            } else {
                throw new Error('ไม่สามารถโหลดข้อสอบได้');
            }
        } catch (error) {
            console.error('Error fetching exam:', error);
            setError('เกิดข้อผิดพลาดในการโหลดข้อสอบ');
            setLoading(false);
        }
    };

    // Timer
    useEffect(() => {
        if (timeLeft > 0 && !loading) {
            const timer = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        handleTimeUp();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }
    }, [timeLeft, loading]);

    const handleTimeUp = () => {
        Swal.fire({
            title: 'หมดเวลา!',
            text: 'เวลาในการทำข้อสอบหมดแล้ว ระบบจะส่งข้อสอบอัตโนมัติ',
            icon: 'warning',
            confirmButtonColor: '#22c55e',
            confirmButtonText: 'ตรวจสอบคำตอบ',
            allowOutsideClick: false
        }).then(() => {
            submitExam();
        });
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleAnswerSelect = (optionIndex: number) => {
        setSelectedAnswer(optionIndex);
        const currentQuestion = questions[currentQuestionIndex];
        const responseTime = Date.now() - questionStartTime;

        setAnswers({
            ...answers,
            [currentQuestion.item_id]: {
                option_index: optionIndex,
                start_time: responseTime
            }
        });
    };

    const goToQuestionByIndex = (index: number) => {
        setCurrentQuestionIndex(index);
        const question = questions[index];
        setSelectedAnswer(answers[question.item_id]?.option_index ?? null);
    };

    const submitExam = async () => {
        if (submitting) return;

        setSubmitting(true);

        try {
            // Prepare answers for API
            const answersArray = questions.map((q) => {
                const answer = answers[q.item_id];
                const selectedOptionId = answer ? q.answer_options[answer.option_index]?.option_id : null;

                return {
                    item_id: Number(q.item_id),
                    selected_option_id: selectedOptionId ? Number(selectedOptionId) : null,
                    response_time_ms: Number(answer?.start_time || 0)
                };
            });

            // Submit to API
            const token = getToken();
            const response = await fetch(`${API_URL}/items-bank/exam/${sessionId}/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ answers: answersArray })
            });

            if (response.ok) {
                const result = await response.json();

                // Show success message
                await Swal.fire({
                    title: 'ส่งข้อสอบสำเร็จ!',
                    html: `คะแนนของคุณ: <strong>${result.correct_count}/${result.total_questions}</strong><br/>
                       <span class="text-2xl font-bold">${result.percentage.toFixed(2)}%</span>`,
                    icon: 'success',
                    confirmButtonColor: '#22c55e',
                    confirmButtonText: 'ดูผลสอบ'
                });

                // Redirect to result page
                submittedRef.current = true;
                router.push(`/user/examset/take-exam/summarize-exam?session_id=${sessionId}`);
            } else {
                // Try to parse error message
                let errorMessage = 'ไม่สามารถส่งข้อสอบได้';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // If response is not JSON, use status text
                    errorMessage = `Server Error: ${response.status} ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
        } catch (error: any) {
            console.error('Error submitting exam:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถส่งข้อสอบได้ กรุณาลองใหม่อีกครั้ง',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
            setSubmitting(false);
        }
    };

    const handleSubmit = () => {
        const unansweredCount = questions.length - Object.keys(answers).length;

        // ตรวจสอบว่าตอบครบทุกข้อหรือยัง
        if (unansweredCount > 0) {
            Swal.fire({
                title: 'ยังตอบไม่ครบ!',
                html: `คุณยังไม่ได้ตอบ <strong class="text-red-600">${unansweredCount}</strong> ข้อ<br/>กรุณาตอบให้ครบทุกข้อก่อนส่งข้อสอบ`,
                icon: 'warning',
                confirmButtonColor: '#3b82f6',
                confirmButtonText: 'ตกลง'
            });
            return; // หยุดการทำงาน ไม่ให้ส่งข้อสอบ
        }

        // ถ้าตอบครบแล้ว ให้ยืนยันการส่ง
        Swal.fire({
            title: 'ยืนยันการส่งข้อสอบ',
            text: 'คุณได้ตอบครบทุกข้อแล้ว ต้องการส่งข้อสอบใช่หรือไม่?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#22c55e',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ส่งข้อสอบ',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true
        }).then((result) => {
            if (result.isConfirmed) {
                submitExam();
            }
        });
    };

    // Prevent accidental page close
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (!submitting && questions.length > 0) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [submitting, questions]);

    if (loading) {
        return (
            <>
                <Navbar_user />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">กำลังโหลดข้อสอบ...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (error || !itemBank || questions.length === 0 || !sessionId) {
        return (
            <>
                <Navbar_user />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center max-w-md">
                        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
                        <p className="text-gray-600 mb-6">{error || 'ไม่พบข้อสอบหรือ session'}</p>
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

    const currentQuestion = questions[currentQuestionIndex];
    const progress = (Object.keys(answers).length / questions.length) * 100;

    return (
        <>
            <Navbar_user />

            <div className="min-h-screen bg-gray-50 py-6">
                <div className="container mx-auto px-4">

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Main Content - Left Side */}
                        <div className="lg:col-span-2">
                            <div className="bg-white rounded-lg shadow-md p-6">
                                {/* Situation (if exists) */}
                                {currentQuestion.situation && (
                                    <div className="mb-6 p-4 pt-0 pb-0 border-l-4 border-gray-400">
                                        <h3 className="font-bold text-gray-800 mb-3 text-lg">
                                            {currentQuestion.situation.situation_title}
                                        </h3>
                                        <p className="text-gray-700 text-base whitespace-pre-wrap leading-relaxed">
                                            {currentQuestion.situation.situation_text}
                                        </p>
                                        {currentQuestion.situation.situation_image_url && (
                                            <img
                                                src={currentQuestion.situation.situation_image_url}
                                                alt="Situation"
                                                className="mt-3 rounded-lg max-w-full"
                                            />
                                        )}
                                    </div>
                                )}

                                {/* Question */}
                                <div className="mb-6">
                                    <div className="flex items-start gap-3 mb-4">
                                        <div className="flex-1">
                                            <h2 className="font-bold text-gray-800">
                                                คำถามที่ {currentQuestionIndex + 1}
                                            </h2>
                                            {currentQuestion.sub_topics && currentQuestion.sub_topics.length > 0 && (
                                                <div className="flex flex-wrap gap-2">
                                                    {currentQuestion.sub_topics.map((st) => (
                                                        <span
                                                            key={st.sub_topic_id}
                                                            className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                                                        >
                                                            {st.sub_topic_name}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <p className="text-gray-700 mb-6 leading-relaxed whitespace-pre-wrap">
                                        {currentQuestion.question_text}
                                    </p>

                                    {/* Options */}
                                    <div className="space-y-3">
                                        {currentQuestion.answer_options.map((option, index) => (
                                            <button
                                                key={option.option_id}
                                                onClick={() => handleAnswerSelect(index)}
                                                disabled={submitting}
                                                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${selectedAnswer === index
                                                    ? 'border-blue-500 bg-blue-50'
                                                    : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                                                    <span className="text-gray-800">{option.option_text}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Right Side */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                                {/* Stats */}
                                <div className="flex justify-between items-center mb-4 pb-4 border-b">
                                    <div className="text-center">
                                        <p className="text-2xl font-bold text-gray-800">{questions.length}</p>
                                        <p className="text-sm text-gray-600">ข้อ</p>
                                    </div>
                                    <div className="text-center">
                                        <p className={`text-2xl font-bold ${timeLeft < 300 ? 'text-red-500 animate-pulse' : 'text-blue-600'}`}>
                                            {formatTime(timeLeft)}
                                        </p>
                                        <p className="text-sm text-gray-600">เวลาคงเหลือ</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-6">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-600">
                                            ตอบแล้ว {Object.keys(answers).length}/{questions.length} ข้อ
                                        </span>
                                        <span className="text-sm text-green-600 font-medium">{Math.round(progress)}%</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Question Grid */}
                                <div className="mb-6">
                                    <h3 className="font-semibold text-gray-800 mb-3">เลือกข้อ</h3>
                                    <div className="grid grid-cols-7 gap-2 max-h-96 overflow-y-auto p-1">
                                        {questions.map((q, index) => (
                                            <button
                                                key={q.item_id}
                                                onClick={() => goToQuestionByIndex(index)}
                                                disabled={submitting}
                                                className={`aspect-square rounded-lg font-medium text-sm transition-all ${currentQuestionIndex === index
                                                    ? 'bg-green-500 text-white ring-2 ring-green-300'
                                                    : answers[q.item_id] !== undefined
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                            >
                                                {index + 1}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Legend */}
                                <div className="mb-6 text-xs flex items-center gap-4 justify-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                                        <span className="text-gray-600">ข้อปัจจุบัน</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-green-100 rounded"></div>
                                        <span className="text-gray-600">ตอบแล้ว</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-100 rounded"></div>
                                        <span className="text-gray-600">ยังไม่ตอบ</span>
                                    </div>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex justify-between items-center pb-6">
                                    <button
                                        onClick={() => currentQuestionIndex > 0 && goToQuestionByIndex(currentQuestionIndex - 1)}
                                        disabled={currentQuestionIndex === 0 || submitting}
                                        className="px-6 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ← ย้อนกลับ
                                    </button>
                                    <button
                                        onClick={() => currentQuestionIndex < questions.length - 1 && goToQuestionByIndex(currentQuestionIndex + 1)}
                                        disabled={currentQuestionIndex === questions.length - 1 || submitting}
                                        className="px-6 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ถัดไป →
                                    </button>
                                </div>

                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="w-full py-3 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            กำลังส่งข้อสอบ...
                                        </>
                                    ) : (
                                        'ส่งข้อสอบ'
                                    )}
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