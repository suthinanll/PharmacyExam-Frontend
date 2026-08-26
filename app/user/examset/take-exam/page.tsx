"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import Swal from 'sweetalert2';
import { Loader2, BookOpen, Clock, AlertCircle, ListCheck, X, Bookmark } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

import ImagePreviewModal from '@/components/ImagePreviewModal';
import LoadingSpinner from "@/components/LoadingSpinner";
import { formatScientificText } from "@/utils/formatText";

// Types
interface AnswerOption {
    option_id: number;
    option_text: string;
    is_correct: boolean;
    option_image_url?: string;
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
    question_image_url?: string;
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
    const [sessionId, setSessionId] = useState<string | null>(null);
    const [itemBankId, setItemBankId] = useState<string | null>(null);

    const [itemBank, setItemBank] = useState<ItemBank | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{
        [key: number]: { option_index: number; start_time: number };
    }>({});
    const [questionStartTime, setQuestionStartTime] = useState<number>(
        Date.now(),
    );
    const [timeLeft, setTimeLeft] = useState(0);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [flaggedQuestions, setFlaggedQuestions] = useState<{ [key: number]: boolean }>({});
    // Track whether exam was properly submitted (don't cancel on submit)
    const submittedRef = useRef(false);

    const toggleFlagQuestion = (itemId: number) => {
        setFlaggedQuestions(prev => {
            const next = {
                ...prev,
                [itemId]: !prev[itemId]
            };
            if (sessionId) {
                localStorage.setItem(`exam_flags_${sessionId}`, JSON.stringify(next));
            }
            return next;
        });
    };

    // Initialize session from sessionStorage, URL params fallback, or active-session API
    useEffect(() => {
        const initSession = async () => {
            setLoading(true);
            let sId: string | null = null;
            let bId: string | null = null;

            // 1. Try reading from sessionStorage
            const cached = sessionStorage.getItem("active_exam_session");
            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (parsed.session_id && parsed.item_bank_id) {
                        sId = String(parsed.session_id);
                        bId = String(parsed.item_bank_id);
                    }
                } catch (e) {}
            }

            // 2. Fallback to URL searchParams (backward compatibility)
            if (!sId || !bId) {
                const urlSession = searchParams.get("session_id");
                const urlBankId = searchParams.get("id");
                if (urlSession && urlBankId) {
                    sId = urlSession;
                    bId = urlBankId;
                }
            }

            // 3. Fallback to Active Session API from server (e.g. on direct refresh)
            if (!sId || !bId) {
                try {
                    const token = getToken();
                    const res = await fetch(`${API_URL}/items-bank/exam/active-session`, {
                        headers: { Authorization: `Bearer ${token}` },
                    });
                    if (res.ok) {
                        const active = await res.json();
                        if (active && active.session_id && active.item_bank_id) {
                            sId = String(active.session_id);
                            bId = String(active.item_bank_id);
                            sessionStorage.setItem("active_exam_session", JSON.stringify({
                                session_id: active.session_id,
                                item_bank_id: active.item_bank_id
                            }));
                        }
                    }
                } catch (err) {
                    console.error("Error fetching active session fallback:", err);
                }
            }

            if (sId && bId) {
                setSessionId(sId);
                setItemBankId(bId);
                await fetchExamData(bId, sId);
            } else {
                setError("ไม่พบการสอบที่กำลังดำเนินการอยู่");
                setLoading(false);
            }
        };

        initSession();
    }, []);

    // Track question start time
    useEffect(() => {
        setQuestionStartTime(Date.now());
    }, [currentQuestionIndex]);

    const fetchExamData = async (targetBankId: string, targetSessionId: string) => {
        setLoading(true);
        try {
            const token = getToken();
            const response = await fetch(
                `${API_URL}/items-bank/${targetBankId}/items`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                },
            );

            if (response.ok) {
                const data = await response.json();
                setItemBank(data);

                // Sort questions by their actual display_order in item_bank_items
                const sortedQuestions = (data.items || []).sort(
                    (a: Question, b: Question) => {
                        if (!a.situation && !b.situation) {
                            return Number(a.display_order || 0) - Number(b.display_order || 0);
                        }
                        if (!a.situation || !b.situation) {
                            return Number(a.display_order || 0) - Number(b.display_order || 0);
                        }
                        const sitIdA = a.situation.situation_id;
                        const sitIdB = b.situation.situation_id;
                        if (sitIdA !== sitIdB) {
                            return Number(a.display_order || 0) - Number(b.display_order || 0);
                        }
                        return Number(a.display_order || 0) - Number(b.display_order || 0);
                    },
                );
                setQuestions(sortedQuestions);

                // Restore saved answers from previous session if any (Resume support)
                let loadedAnswers: { [key: number]: { option_index: number; start_time: number } } = {};
                const savedAnswers = localStorage.getItem(`exam_answers_${targetSessionId}`);
                if (savedAnswers) {
                    try {
                        loadedAnswers = JSON.parse(savedAnswers);
                        setAnswers(loadedAnswers);
                    } catch (e) {}
                }

                // Restore saved flags
                const savedFlags = localStorage.getItem(`exam_flags_${targetSessionId}`);
                if (savedFlags) {
                    try {
                        setFlaggedQuestions(JSON.parse(savedFlags));
                    } catch (e) {}
                }

                // Calculate real-time countdown based on start time
                const now = Date.now();
                let realStartTime = now;
                const savedStartTime = localStorage.getItem(`exam_start_time_${targetSessionId}`);
                if (savedStartTime) {
                    realStartTime = Number(savedStartTime);
                } else {
                    localStorage.setItem(`exam_start_time_${targetSessionId}`, String(now));
                }

                const totalDuration = data.duration || 3600;
                const elapsedSec = Math.floor((now - realStartTime) / 1000);
                const remaining = Math.max(1, totalDuration - elapsedSec);
                setTimeLeft(remaining);

                // Set selected answer for the first question
                if (sortedQuestions.length > 0) {
                    const firstQId = sortedQuestions[0].item_id;
                    setSelectedAnswer(loadedAnswers[firstQId]?.option_index ?? null);
                }

                setLoading(false);
            } else {
                throw new Error("ไม่สามารถโหลดข้อสอบได้");
            }
        } catch (error) {
            console.error("Error fetching exam:", error);
            setError("เกิดข้อผิดพลาดในการโหลดข้อสอบ");
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
            title: "หมดเวลาสอบ!",
            text: "ระบบจะทำการส่งข้อสอบของคุณโดยอัตโนมัติ",
            icon: "warning",
            confirmButtonText: "ตกลง",
            confirmButtonColor: "#16a34a",
            allowOutsideClick: false,
        }).then(() => {
            submitExam();
        });
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    };

    const handleAnswerSelect = (optionIndex: number) => {
        setSelectedAnswer(optionIndex);
        const currentQuestion = questions[currentQuestionIndex];
        const responseTime = Date.now() - questionStartTime;

        setAnswers(prev => {
            const next = {
                ...prev,
                [currentQuestion.item_id]: {
                    option_index: optionIndex,
                    start_time: responseTime,
                },
            };
            if (sessionId) {
                localStorage.setItem(`exam_answers_${sessionId}`, JSON.stringify(next));
            }
            return next;
        });
    };

    const goToQuestionByIndex = (index: number) => {
        setCurrentQuestionIndex(index);
        const question = questions[index];
        setSelectedAnswer(answers[question.item_id]?.option_index ?? null);
    };

    const handleDebugAutoFill = () => {
        const newAnswers = { ...answers };
        questions.forEach((q) => {
            if (newAnswers[q.item_id] === undefined) {
                newAnswers[q.item_id] = {
                    option_index: 0,
                    start_time: 1000 // dummy time
                };
            }
        });
        setAnswers(newAnswers);
        // Refresh selected answer for current view
        const currentQ = questions[currentQuestionIndex];
        setSelectedAnswer(newAnswers[currentQ.item_id]?.option_index ?? null);

        Swal.fire({
            title: 'Debug Active',
            text: 'เลือกคำตอบให้ครบทุกข้อแล้ว (ข้อ ก.)',
            icon: 'info',
            timer: 1500,
            showConfirmButton: false
        });
    };

    const submitExam = async () => {
        if (submitting) return;

        setSubmitting(true);

        try {
            // Prepare answers for API
            const answersArray = questions.map((q) => {
                const answer = answers[q.item_id];
                const selectedOptionId = answer
                    ? q.answer_options[answer.option_index]?.option_id
                    : null;

                return {
                    item_id: Number(q.item_id),
                    selected_option_id: selectedOptionId
                        ? Number(selectedOptionId)
                        : null,
                    response_time_ms: Number(answer?.start_time || 0),
                };
            });

            // Submit to API
            const token = getToken();
            const response = await fetch(
                `${API_URL}/items-bank/exam/${sessionId}/submit`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ answers: answersArray }),
                },
            );

            if (response.ok) {
                const result = await response.json();

                submittedRef.current = true; // ✅ เซ็ตก่อนเลย ป้องกัน cancel

                // ล้างแคชคำตอบของเซสชันที่ส่งแล้ว
                localStorage.removeItem(`exam_answers_${sessionId}`);
                localStorage.removeItem(`exam_flags_${sessionId}`);
                localStorage.removeItem(`exam_start_time_${sessionId}`);

                await Swal.fire({
                    title: "ส่งข้อสอบสำเร็จ!",
                    html: `คะแนนของคุณ: <strong>${result.correct_count}/${result.total_questions}</strong><br/>
               <span class="text-2xl font-medium">${result.percentage.toFixed(2)}%</span>`,
                    icon: "success",
                    confirmButtonColor: "#22c55e",
                    confirmButtonText: "ดูผลสอบ",
                });
                sessionStorage.removeItem('active_exam_session');
                sessionStorage.setItem('summarize-exam_session', JSON.stringify({
                    session_id: result.session_id,
                }));
                router.push('/user/examset/take-exam/summarize-exam');

                // router.push(
                //     `/user/examset/take-exam/summarize-exam?session_id=${sessionId}`,
                // );
            } else {
                // Try to parse error message
                let errorMessage = "ไม่สามารถส่งข้อสอบได้";
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
            console.error("Error submitting exam:", error);
            Swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: error.message || "ไม่สามารถส่งข้อสอบได้ กรุณาลองใหม่อีกครั้ง",
                icon: "error",
                confirmButtonColor: "#ef4444",
            });
            setSubmitting(false);
        }
    };

    const handleSubmit = () => {
        const unansweredCount = questions.length - Object.keys(answers).length;

        // ตรวจสอบว่าตอบครบทุกข้อหรือยัง
        if (unansweredCount > 0) {
            Swal.fire({
                title: "ยังตอบไม่ครบ!",
                html: `คุณยังไม่ได้ตอบ <strong class="text-red-600">${unansweredCount}</strong> ข้อ<br/>กรุณาตอบให้ครบทุกข้อก่อนส่งข้อสอบ`,
                icon: "warning",
                confirmButtonColor: "#3b82f6",
                confirmButtonText: "ตกลง",
            });
            return; // หยุดการทำงาน ไม่ให้ส่งข้อสอบ
        }

        // ถ้าตอบครบแล้ว ให้ยืนยันการส่ง
        Swal.fire({
            title: "ยืนยันการส่งข้อสอบ",
            text: "คุณได้ตอบครบทุกข้อแล้ว ต้องการส่งข้อสอบใช่หรือไม่?",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#16a34a",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "ส่งข้อสอบ",
            cancelButtonText: "ยกเลิก",
            reverseButtons: true,
        }).then((result) => {
            if (result.isConfirmed) {
                submitExam();
            }
        });
    };

    // ดักจับการกดปุ่ม Back ของเบราว์เซอร์ (Popstate)
    useEffect(() => {
        if (loading || questions.length === 0) return;
        window.history.pushState(null, "", window.location.href);

        const handlePopState = (e: PopStateEvent) => {
            if (submittedRef.current) return;
            e.preventDefault();
            window.history.pushState(null, "", window.location.href);

            Swal.fire({
                title: "ต้องการออกจากห้องสอบใช่หรือไม่?",
                text: "หากคุณออกจากห้องสอบ การทำข้อสอบครั้งนี้จะถูกยกเลิกและข้อมูลจะไม่ถูกบันทึก",
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#ef4444",
                cancelButtonColor: "#6b7280",
                confirmButtonText: "ออกจากห้องสอบ",
                cancelButtonText: "ทำข้อสอบต่อ",
                reverseButtons: true,
            }).then((result) => {
                if (result.isConfirmed) {
                    submittedRef.current = false;
                    const token = getToken();
                    if (token && sessionId) {
                        fetch(`${API_URL}/items-bank/exam/${sessionId}/cancel`, {
                            method: "DELETE",
                            headers: { Authorization: `Bearer ${token}` },
                            keepalive: true,
                        }).finally(() => {
                            router.push("/user/examset");
                        });
                    } else {
                        router.push("/user/examset");
                    }
                }
            });
        };

        window.addEventListener("popstate", handlePopState);
        return () => window.removeEventListener("popstate", handlePopState);
    }, [loading, questions, sessionId, getToken, router]);

    // ดักจับการคลิกลิงก์เมนูต่าง ๆ (เช่น Navbar) ระหว่างทำข้อสอบ
    useEffect(() => {
        if (loading || questions.length === 0) return;

        const handleDocClick = (e: MouseEvent) => {
            if (submittedRef.current || submitting) return;
            const target = (e.target as HTMLElement).closest("a");
            if (target && target.href && !target.href.startsWith("javascript:") && !target.getAttribute("href")?.startsWith("#")) {
                const targetUrl = target.href;
                const currentUrl = window.location.href;
                if (targetUrl !== currentUrl) {
                    e.preventDefault();
                    e.stopPropagation();

                    Swal.fire({
                        title: "ต้องการออกจากห้องสอบใช่หรือไม่?",
                        text: "หากคุณออกจากห้องสอบ การทำข้อสอบครั้งนี้จะถูกยกเลิกและข้อมูลจะไม่ถูกบันทึก",
                        icon: "warning",
                        showCancelButton: true,
                        confirmButtonColor: "#ef4444",
                        cancelButtonColor: "#6b7280",
                        confirmButtonText: "ออกจากห้องสอบ",
                        cancelButtonText: "ทำข้อสอบต่อ",
                        reverseButtons: true,
                    }).then((result) => {
                        if (result.isConfirmed) {
                            submittedRef.current = false;
                            const token = getToken();
                            if (token && sessionId) {
                                fetch(`${API_URL}/items-bank/exam/${sessionId}/cancel`, {
                                    method: "DELETE",
                                    headers: { Authorization: `Bearer ${token}` },
                                    keepalive: true,
                                }).finally(() => {
                                    window.location.href = targetUrl;
                                });
                            } else {
                                window.location.href = targetUrl;
                            }
                        }
                    });
                }
            }
        };

        document.addEventListener("click", handleDocClick, true);
        return () => document.removeEventListener("click", handleDocClick, true);
    }, [loading, questions, sessionId, submitting, getToken]);

    if (loading) {
        return (
            <>
                <Navbar_user />
                <div className="min-h-[60vh] flex items-center justify-center">
                    <LoadingSpinner size="lg" text="กำลังโหลดข้อสอบ..." />
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
                        <h2 className="text-2xl font-medium text-gray-800 mb-2">
                            เกิดข้อผิดพลาด
                        </h2>
                        <p className="text-gray-600 mb-6">
                            {error || "ไม่พบข้อสอบหรือ session"}
                        </p>
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
                                    <div className="mb-6 bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                                        <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                                            <BookOpen className="w-4 h-4 text-blue-600" />
                                            <span className="text-md font-medium text-blue-700">สถานการณ์</span>
                                        </div>
                                        <div className="p-5">
                                            {currentQuestion.situation.situation_title && (
                                                <p
                                                    className="font-medium text-gray-800 mb-2"
                                                    dangerouslySetInnerHTML={{ __html: currentQuestion.situation.situation_title }}
                                                />
                                            )}
                                            <p
                                                className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm lg:text-base"
                                                dangerouslySetInnerHTML={{ __html: formatScientificText(currentQuestion.situation.situation_text) }}
                                            />
                                            {currentQuestion.situation.situation_image_url && (
                                                <img
                                                    src={currentQuestion.situation.situation_image_url}
                                                    alt="situation"
                                                    className="mt-4 rounded-lg max-w-full border border-gray-200 cursor-zoom-in hover:opacity-90 transition-opacity"
                                                    onClick={() => {
                                                        const url = currentQuestion.situation?.situation_image_url;
                                                        if (url) {
                                                            setPreviewImage(url);
                                                        }
                                                    }}
                                                />
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Question */}
                                <div className="mb-6">
                                    {/* Question Header: Number & Flag button */}
                                    <div className="mb-4 pb-3 border-b border-gray-100 flex justify-between items-center">
                                        <div className="flex items-center gap-2.5">
                                            <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 font-medium text-sm sm:text-base px-3.5 py-1 rounded-lg border border-blue-100">
                                                คำถามที่ {currentQuestionIndex + 1}
                                            </span>
                                        </div>
                                        <button
                                            onClick={() => toggleFlagQuestion(currentQuestion.item_id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all border shrink-0 cursor-pointer ${flaggedQuestions[currentQuestion.item_id]
                                                ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-300 shadow-sm"
                                                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 border-gray-200"
                                                }`}
                                        >
                                            <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${flaggedQuestions[currentQuestion.item_id] ? "fill-amber-600 text-amber-600" : ""}`} />
                                            {flaggedQuestions[currentQuestion.item_id] ? "มาร์คไว้ทบทวนแล้ว" : "มาร์คไว้ทบทวน"}
                                        </button>
                                    </div>

                                    {/* Question Text (อ่านคำถามทันที) */}
                                    <div className="mb-4">
                                        <p
                                            className="text-lg sm:text-xl font-medium text-gray-900 leading-relaxed whitespace-pre-wrap"
                                            dangerouslySetInnerHTML={{ __html: formatScientificText(currentQuestion.question_text) }}
                                        />
                                        {currentQuestion.question_image_url && (
                                            <div className="mt-4 mb-2">
                                                <img
                                                    src={currentQuestion.question_image_url.startsWith("http")
                                                        ? currentQuestion.question_image_url
                                                        : `${process.env.NEXT_PUBLIC_API_URL}${currentQuestion.question_image_url}`}
                                                    alt="question"
                                                    className="max-h-72 rounded-xl object-contain border border-gray-200 shadow-sm bg-white cursor-zoom-in hover:opacity-90 transition-opacity"
                                                    onClick={() => {
                                                        const url = currentQuestion.question_image_url;
                                                        if (url) {
                                                            setPreviewImage(
                                                                url.startsWith("http")
                                                                    ? url
                                                                    : `${process.env.NEXT_PUBLIC_API_URL}${url}`
                                                            );
                                                        }
                                                    }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    {/* Topic / Sub-topics (อ่านหัวข้อต่อท้ายคำถาม) */}
                                    {currentQuestion.sub_topics && currentQuestion.sub_topics.length > 0 && (
                                        <div className="flex flex-wrap items-center gap-2 mb-6 pt-1">

                                            {currentQuestion.sub_topics.map((st) => (
                                                <span
                                                    key={st.sub_topic_id}
                                                    className="text-xs sm:text-sm font-medium bg-[#e6f7ec] text-[#2e8555] border border-green-200/60 px-3 py-1 rounded-md"
                                                >
                                                    {st.sub_topic_name}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Options */}
                                    <div className="space-y-3">
                                        {currentQuestion.answer_options.map((option, index) => {
                                            const isSelected = selectedAnswer === index;
                                            return (
                                                <button
                                                    key={option.option_id}
                                                    onClick={() => handleAnswerSelect(index)}
                                                    disabled={submitting}
                                                    className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-150 flex items-center gap-4 group ${isSelected
                                                        ? 'border-green-500 bg-green-50 shadow-sm'
                                                        : 'border-gray-200 hover:border-green-300 bg-white hover:bg-green-50/30'
                                                        } ${submitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {/* radio */}
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isSelected ? 'border-green-500' : 'border-gray-300 group-hover:border-green-400'
                                                        }`}>
                                                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                                                    </div>

                                                    {/* label badge */}
                                                    <span className={`text-xs font-medium px-2 py-0.5 rounded shrink-0 transition-colors ${isSelected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-700'
                                                        }`}>
                                                        {['ก', 'ข', 'ค', 'ง', 'จ'][index] || String.fromCharCode(65 + index)}
                                                    </span>

                                                    <div className="flex-1 text-left">
                                                        {option.option_text && option.option_text.replace(/<[^>]*>/g, '').trim() !== '' && (
                                                            <span
                                                                className="text-gray-800 text-sm lg:text-base leading-relaxed block"
                                                                dangerouslySetInnerHTML={{ __html: formatScientificText(option.option_text) }}
                                                            />
                                                        )}
                                                        
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar - Right Side */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
                                {/* Stats */}
                                <div className="flex justify-between items-center mb-5 pb-5 border-b border-gray-100">
                                    <div className="text-center flex-1">
                                        <p className="text-2xl font-medium text-gray-800 tracking-tight">
                                            {questions.length}
                                        </p>
                                        <p className="text-xs font-medium text-gray-500 mt-0.5">ข้อทั้งหมด</p>
                                    </div>
                                    <div className="w-px h-8 bg-gray-200/60" />
                                    <div className="text-center flex-1">
                                        <p
                                            className={`text-2xl font-medium  tracking-tight ${timeLeft < 300 ? "text-rose-500 animate-pulse" : "text-blue-600"}`}
                                        >
                                            {formatTime(timeLeft)}
                                        </p>
                                        <p className="text-xs font-medium text-gray-500 mt-0.5">เวลาคงเหลือ</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-6">
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm text-gray-600">
                                            ตอบแล้ว {Object.keys(answers).length}/{questions.length}{" "}
                                            ข้อ
                                        </span>
                                        <span className="text-sm text-green-600 font-medium">
                                            {Math.round(progress)}%
                                        </span>
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
                                    <div className="flex items-center gap-2 mb-3">
                                        <ListCheck className="w-4 h-4 text-gray-500" />
                                        <h3 className="text-sm font-medium text-gray-700">เลือกข้อ</h3>
                                    </div>
                                    <div className="grid grid-cols-7 gap-2 max-h-96 overflow-y-auto p-1">
                                        {questions.map((q, index) => {
                                            const isActive = currentQuestionIndex === index;
                                            const isAnswered = answers[q.item_id] !== undefined;

                                            // แสดง ring เฉพาะข้อที่อยู่ใน situation เดียวกับข้อปัจจุบัน
                                            const currentSituationId = questions[currentQuestionIndex]?.situation?.situation_id;
                                            const isInCurrentSituationGroup =
                                                currentSituationId !== undefined &&
                                                q.situation?.situation_id === currentSituationId;

                                            const bgClass = isActive
                                                ? "bg-green-500 text-white"
                                                : isAnswered
                                                    ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200";

                                            const ringClass = isActive
                                                ? "ring-2 ring-green-300 border-2 border-transparent"
                                                : isInCurrentSituationGroup
                                                    ? "border-2 border-dotted border-green-500"
                                                    : "border-2 border-transparent";

                                            return (
                                                <div key={q.item_id} className="relative">
                                                    <button
                                                        onClick={() => goToQuestionByIndex(index)}
                                                        disabled={submitting}
                                                        title={q.situation ? `สถานการณ์เดียวกัน` : undefined}
                                                        className={`w-full aspect-square rounded-lg font-medium text-sm transition-all ${bgClass} ${ringClass} ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
                                                    >
                                                        {index + 1}
                                                    </button>
                                                    {flaggedQuestions[q.item_id] && (
                                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 border border-white text-[9px] text-white font-black shadow-sm animate-in zoom-in-50 duration-200">
                                                            ★
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="mb-6 text-xs flex flex-wrap items-center gap-x-4 gap-y-2 justify-center">
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
                                    <div className="flex items-center gap-1.5">
                                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 border border-amber-600/10 text-[9px] text-white font-medium">★</span>
                                        <span className="text-gray-600">ทบทวน</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 bg-gray-100 rounded border-2 border-dotted border-green-500"></div>
                                        <span className="text-gray-600">สถานการณ์เดียวกัน</span>
                                    </div>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex justify-between items-center pb-6">
                                    <button
                                        onClick={() =>
                                            currentQuestionIndex > 0 &&
                                            goToQuestionByIndex(currentQuestionIndex - 1)
                                        }
                                        disabled={currentQuestionIndex === 0 || submitting}
                                        className="px-6 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ← ย้อนกลับ
                                    </button>
                                    <button
                                        onClick={() =>
                                            currentQuestionIndex < questions.length - 1 &&
                                            goToQuestionByIndex(currentQuestionIndex + 1)
                                        }
                                        disabled={
                                            currentQuestionIndex === questions.length - 1 ||
                                            submitting
                                        }
                                        className="px-6 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        ถัดไป →
                                    </button>
                                </div>

                                {/* {process.env.NODE_ENV === 'development' && (
                                    <button
                                        onClick={handleDebugAutoFill}
                                        className="w-full py-2 mb-3 bg-gray-100 hover:bg-gray-200 text-gray-500 text-xs font-medium rounded-lg border border-dashed border-gray-300 transition-colors flex items-center justify-center gap-2"
                                    >
                                        [Debug] Auto-fill ทุกข้อ
                                    </button>
                                )} */}

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
                                        "ส่งข้อสอบ"
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {previewImage && (
                <div
                    className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative max-w-5xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2 flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors z-10 shadow-md"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <img
                            src={previewImage}
                            alt="preview"
                            className="max-w-full max-h-[85vh] object-contain rounded-lg"
                        />
                    </div>
                </div>
            )}

            <Footer />
        </>
    );
}

export default function TakeExamPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <LoadingSpinner size="lg" text="กำลังโหลดข้อสอบ..." />
            </div>
        }>
            <TakeExam />
        </Suspense>
    );
}
