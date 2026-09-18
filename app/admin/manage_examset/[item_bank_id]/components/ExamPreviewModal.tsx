'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
    X,
    Loader2,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Eye,
    BookOpen,
    ListCheck,
    Bookmark,
    Clock,
} from 'lucide-react';
import ImagePreviewModal from '@/components/ImagePreviewModal';
import Swal from "@/utils/sweetalert";
import { sanitizeHtml } from "@/utils/sanitize";

// ─── Types ──────────────────────────────────────────────────
interface AnswerOption {
    option_id: number;
    option_text: string;
    is_correct: boolean;
    option_image_url?: string;
}

interface SubTopic {
    sub_topic_id: number;
    sub_topic_name: string;
    topic?: { topic_id: number; topic_name: string };
}

interface Situation {
    situation_id: number;
    situation_title?: string;
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

interface ExamPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemBankId: string;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;
const OPTION_LABELS = ['ก', 'ข', 'ค', 'ง', 'จ'];

export default function ExamPreviewModal({ isOpen, onClose, itemBankId }: ExamPreviewModalProps) {
    const { getToken } = useAuth();

    const [itemBank, setItemBank] = useState<ItemBank | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    // ── Fetch when opened ──────────────────────────────────
    useEffect(() => {
        if (isOpen && itemBankId) {
            fetchExamData();
        }
        if (!isOpen) {
            setCurrentIndex(0);
            setSelectedAnswer(null);
            setAnswers({});
            setFlaggedQuestions({});
            setError(null);
            setItemBank(null);
            setQuestions([]);
        }
    }, [isOpen, itemBankId]);

    // ── Sync selected answer when navigating ──────────────
    useEffect(() => {
        if (questions.length > 0 && currentIndex < questions.length) {
            const q = questions[currentIndex];
            setSelectedAnswer(answers[q.item_id] ?? null);
        }
    }, [currentIndex, questions]);

    const fetchExamData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/items-bank/${itemBankId}/items`, {
                headers: { 'Authorization': `Bearer ${token}` },
                credentials: 'include',
            });

            if (!response.ok) throw new Error('ไม่สามารถโหลดข้อสอบได้');

            const data: ItemBank = await response.json();
            setItemBank(data);

            // Sort exactly like take-exam page
            const sorted = (data.items || []).sort((a, b) => {
                if (!a.situation && !b.situation) {
                    return Number(a.display_order || 0) - Number(b.display_order || 0);
                }
                if (!a.situation || !b.situation) {
                    return Number(a.display_order || 0) - Number(b.display_order || 0);
                }
                const sitIdA = a.situation.situation_id;
                const sitIdB = b.situation.situation_id;
                if (sitIdA !== sitIdB) {
                    const sitA = Number(a.situation?.display_order ?? 0);
                    const sitB = Number(b.situation?.display_order ?? 0);
                    return sitA !== sitB ? sitA - sitB : sitIdA - sitIdB;
                }
                return Number(a.display_order || 0) - Number(b.display_order || 0);
            });
            setQuestions(sorted);
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อสอบ');
        } finally {
            setLoading(false);
        }
    };

    // ── Handlers ───────────────────────────────────────────
    const handleSelectAnswer = (optionIndex: number) => {
        const q = questions[currentIndex];
        setSelectedAnswer(optionIndex);
        setAnswers(prev => ({ ...prev, [q.item_id]: optionIndex }));
    };

    const toggleFlagQuestion = (itemId: number) => {
        setFlaggedQuestions(prev => ({
            ...prev,
            [itemId]: !prev[itemId]
        }));
    };

    const goTo = (index: number) => {
        if (index < 0 || index >= questions.length) return;
        setCurrentIndex(index);
        const q = questions[index];
        setSelectedAnswer(answers[q.item_id] ?? null);
    };

   

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowRight') {
                if (currentIndex < questions.length - 1) goTo(currentIndex + 1);
            } else if (e.key === 'ArrowLeft') {
                if (currentIndex > 0) goTo(currentIndex - 1);
            } else if (e.key === 'Escape') {
                onClose();
            }
        },
        [isOpen, currentIndex, questions.length],
    );

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    if (!isOpen) return null;

    // ── Rendering helpers ──────────────────────────────────
    const answeredCount = Object.keys(answers).length;
    const progress = questions.length > 0 ? (answeredCount / questions.length) * 100 : 0;
    const currentQuestion = questions[currentIndex];
    const durationMinutes = itemBank?.duration || 60;
    const formattedDuration = `${String(Math.floor(durationMinutes / 60)).padStart(2, '0')}:${String(durationMinutes % 60).padStart(2, '0')}:00`;

    return (
        /* ── Backdrop ── */
        <div className="fixed inset-0 z-50 flex items-stretch justify-center">
            {/* overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Panel */}
            <div className="relative z-10 flex flex-col w-full max-w-6xl bg-gray-50 overflow-hidden shadow-2xl">

                {/* ── Top Bar ────────────────────────────────── */}
                <div className="flex items-center justify-between px-6 py-3.5 bg-white border-b border-gray-200 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full">
                            <Eye className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-medium text-amber-700">โหมดพรีวิวเสมือนจริง</span>
                        </div>
                        <span className="text-sm font-medium text-gray-800 hidden sm:block truncate max-w-md">
                            {itemBank?.bank_name || '...'}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm sm:text-sm text-gray-500 font-medium">
                            ข้อ <strong className="text-gray-800">{questions.length > 0 ? currentIndex + 1 : 0}</strong> จากทั้งหมด {questions.length} ข้อ
                        </span>
                        <button
                            onClick={onClose}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                            title="ปิดพรีวิว (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ── Body ────────────────────────────────────── */}
                {loading ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gray-50">
                        <Loader2 className="w-10 h-10 animate-spin text-green-600 mb-3" />
                        <p className="text-gray-600 text-sm font-medium">กำลังเตรียมแบบทดสอบเสมือนจริง...</p>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
                        <div className="text-center max-w-sm">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                            <p className="text-gray-700 font-medium mb-4 text-sm">{error}</p>
                            <button
                                onClick={fetchExamData}
                                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                                ลองใหม่อีกครั้ง
                            </button>
                        </div>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
                        <div className="text-center max-w-sm">
                            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">ยังไม่มีคำถามในชุดข้อสอบนี้</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto lg:overflow-hidden block lg:flex bg-gray-50">

                        {/* ── Left: Question Area (Matches take-exam page) ── */}
                        <div className="lg:flex-1 lg:overflow-y-auto p-4 sm:p-6 lg:p-7 space-y-6">

                            {/* Situation (if exists) */}
                            {currentQuestion?.situation && Boolean(
                                (currentQuestion.situation.situation_text && currentQuestion.situation.situation_text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim() !== '') ||
                                (currentQuestion.situation.situation_image_url && currentQuestion.situation.situation_image_url.trim() !== '')
                            ) && (
                                <div className="bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-medium text-blue-700">สถานการณ์</span>
                                    </div>
                                    <div className="p-5">
                                        {currentQuestion.situation.situation_title && (
                                            <p
                                                className="font-medium text-gray-800 mb-2 text-sm lg:text-base"
                                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentQuestion.situation.situation_title) }}
                                            />
                                        )}
                                        {currentQuestion.situation.situation_text && (
                                            <p
                                                className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm lg:text-base"
                                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentQuestion.situation.situation_text) }}
                                            />
                                        )}
                                        {currentQuestion.situation.situation_image_url && (
                                            <img
                                                src={currentQuestion.situation.situation_image_url.startsWith("http")
                                                    ? currentQuestion.situation.situation_image_url
                                                    : `${process.env.NEXT_PUBLIC_API_URL}${currentQuestion.situation.situation_image_url}`}
                                                alt="situation"
                                                className="mt-4 rounded-lg max-w-full border border-gray-200 cursor-zoom-in hover:opacity-90 transition-opacity"
                                                onClick={() => {
                                                    const url = currentQuestion.situation?.situation_image_url;
                                                    if (url) {
                                                        setPreviewImage(url.startsWith("http") ? url : `${process.env.NEXT_PUBLIC_API_URL}${url}`);
                                                    }
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Main Question Card */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 sm:p-6">
                                {/* Question Header: Number & Flag button */}
                                <div className="mb-4 pb-3 border-b border-gray-100 flex justify-between items-center">
                                    <div className="flex items-center gap-2.5">
                                        <span className="inline-flex items-center justify-center bg-blue-50 text-blue-700 font-medium text-sm sm:text-base px-3.5 py-1 rounded-lg border border-blue-100">
                                            คำถามที่ {currentIndex + 1}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => toggleFlagQuestion(currentQuestion.item_id)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm sm:text-sm font-medium transition-all border shrink-0 cursor-pointer ${
                                            flaggedQuestions[currentQuestion.item_id]
                                                ? "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-300 shadow-sm"
                                                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700 border-gray-200"
                                        }`}
                                    >
                                        <Bookmark className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${flaggedQuestions[currentQuestion.item_id] ? "fill-amber-600 text-amber-600" : ""}`} />
                                        <span>{flaggedQuestions[currentQuestion.item_id] ? "มาร์คไว้ทบทวนแล้ว" : "มาร์คไว้ทบทวน"}</span>
                                    </button>
                                </div>

                                {/* Question Text */}
                                <div className="mb-4">
                                    <p
                                        className="text-lg sm:text-xl font-medium text-gray-900 leading-relaxed whitespace-pre-wrap"
                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(currentQuestion.question_text) }}
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

                                {/* Topic / Sub-topics */}
                                {currentQuestion.sub_topics && currentQuestion.sub_topics.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2 mb-6 pt-1">
                                        {currentQuestion.sub_topics.map((st) => (
                                            <span
                                                key={st.sub_topic_id}
                                                className="text-sm sm:text-sm font-medium bg-[#e6f7ec] text-[#2e8555] border border-green-200/60 px-3 py-1 rounded-md"
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
                                                key={option.option_id || index}
                                                type="button"
                                                onClick={() => handleSelectAnswer(index)}
                                                className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-150 flex items-center gap-4 group cursor-pointer ${
                                                    isSelected
                                                        ? 'border-green-500 bg-green-50 shadow-sm'
                                                        : 'border-gray-200 hover:border-green-300 bg-white hover:bg-green-50/30'
                                                }`}
                                            >
                                                {/* radio button */}
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                                                    isSelected ? 'border-green-500' : 'border-gray-300 group-hover:border-green-400'
                                                }`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                                                </div>

                                                {/* label badge */}
                                                <span className={`text-sm font-medium px-2 py-0.5 rounded shrink-0 transition-colors ${
                                                    isSelected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-700'
                                                }`}>
                                                    {OPTION_LABELS[index] || String.fromCharCode(65 + index)}
                                                </span>

                                                <div className="flex-1 text-left">
                                                    {option.option_text && option.option_text.replace(/<[^>]*>/g, '').trim() !== '' && (
                                                        <span
                                                            className="text-gray-800 text-sm lg:text-base leading-relaxed block"
                                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(option.option_text) }}
                                                        />
                                                    )}
                                                    {option.option_image_url && option.option_image_url.trim() !== '' && (
                                                        <div className={option.option_text && option.option_text.replace(/<[^>]*>/g, '').trim() !== '' ? "mt-2" : ""}>
                                                            <img
                                                                src={option.option_image_url.startsWith("http")
                                                                    ? option.option_image_url
                                                                    : `${process.env.NEXT_PUBLIC_API_URL}${option.option_image_url}`}
                                                                alt={`ตัวเลือก ${OPTION_LABELS[index] || index + 1}`}
                                                                className="max-h-40 rounded-lg border border-gray-200 bg-white cursor-zoom-in hover:opacity-90 transition-opacity object-contain"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const url = option.option_image_url!.startsWith("http")
                                                                        ? option.option_image_url!
                                                                        : `${process.env.NEXT_PUBLIC_API_URL}${option.option_image_url}`;
                                                                    setPreviewImage(url);
                                                                }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* ── Right Sidebar (Matches take-exam page exactly) ── */}
                        <div className="w-full lg:w-80 xl:w-88 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col shrink-0 lg:overflow-y-auto">
                            <div className="p-5 sm:p-6 space-y-5">
                                {/* Stats Box */}
                                <div className="flex justify-between items-center pb-5 border-b border-gray-100">
                                    <div className="text-center flex-1">
                                        <p className="text-2xl font-bold text-gray-800 tracking-tight">
                                            {questions.length}
                                        </p>
                                        <p className="text-sm font-medium text-gray-500 mt-0.5">ข้อทั้งหมด</p>
                                    </div>
                                    <div className="w-px h-8 bg-gray-200" />
                                    <div className="text-center flex-1">
                                        <p className="text-2xl font-bold tracking-tight text-blue-600 flex items-center justify-center gap-1">
                                            <Clock className="w-5 h-5 text-blue-500 inline" />
                                            <span>{formattedDuration}</span>
                                        </p>
                                        <p className="text-sm font-medium text-gray-500 mt-0.5">เวลาจำลอง (นาที)</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div>
                                    <div className="flex justify-between mb-2 text-sm font-medium">
                                        <span className="text-gray-600">
                                            ตอบแล้ว {answeredCount}/{questions.length} ข้อ
                                        </span>
                                        <span className="text-green-600">
                                            {Math.round(progress)}%
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                        <div
                                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Question Grid */}
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <ListCheck className="w-4 h-4 text-gray-500" />
                                        <h3 className="text-sm font-medium text-gray-700">เลือกข้อ</h3>
                                    </div>
                                    <div className="grid grid-cols-7 gap-2 max-h-72 overflow-y-auto p-1">
                                        {questions.map((q, index) => {
                                            const isActive = currentIndex === index;
                                            const isAnswered = answers[q.item_id] !== undefined;

                                            // แสดง ring เฉพาะข้อที่อยู่ใน situation เดียวกับข้อปัจจุบัน
                                            const currentSituationId = questions[currentIndex]?.situation?.situation_id;
                                            const isInCurrentSituationGroup =
                                                currentSituationId !== undefined &&
                                                q.situation?.situation_id === currentSituationId;

                                            const bgClass = isActive
                                                ? "bg-green-500 text-white font-bold"
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
                                                        type="button"
                                                        onClick={() => goTo(index)}
                                                        title={q.situation ? `สถานการณ์เดียวกัน` : undefined}
                                                        className={`w-full aspect-square rounded-lg font-medium text-sm sm:text-sm transition-all cursor-pointer flex items-center justify-center ${bgClass} ${ringClass}`}
                                                    >
                                                        {index + 1}
                                                    </button>
                                                    {flaggedQuestions[q.item_id] && (
                                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 border border-white text-[9px] text-white font-black shadow-sm pointer-events-none">
                                                            ★
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Legend (คำอธิบายสัญลักษณ์เหมือนหน้าจริง) */}
                                <div className="text-[11px] flex flex-wrap items-center gap-x-3.5 gap-y-2 justify-center pt-2 border-t border-gray-100">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3.5 h-3.5 bg-green-500 rounded"></div>
                                        <span className="text-gray-600">ข้อปัจจุบัน</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3.5 h-3.5 bg-green-100 rounded"></div>
                                        <span className="text-gray-600">ตอบแล้ว</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3.5 h-3.5 bg-gray-100 rounded"></div>
                                        <span className="text-gray-600">ยังไม่ตอบ</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white font-bold">★</span>
                                        <span className="text-gray-600">ทบทวน</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3.5 h-3.5 bg-gray-100 rounded border border-dotted border-green-500"></div>
                                        <span className="text-gray-600">สถานการณ์เดียวกัน</span>
                                    </div>
                                </div>

                                {/* Navigation Buttons */}
                                <div className="flex justify-between items-center gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => currentIndex > 0 && goTo(currentIndex - 1)}
                                        disabled={currentIndex === 0}
                                        className="flex-1 py-2.5 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-sm sm:text-sm text-center border border-green-200/60 cursor-pointer"
                                    >
                                        ← ย้อนกลับ
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => currentIndex < questions.length - 1 && goTo(currentIndex + 1)}
                                        disabled={currentIndex === questions.length - 1}
                                        className="flex-1 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium text-sm sm:text-sm text-center shadow-sm cursor-pointer"
                                    >
                                        ถัดไป →
                                    </button>
                                </div>

                                
                            </div>
                        </div>
                    </div>
                )}
            </div>
            <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
        </div>
    );
}
