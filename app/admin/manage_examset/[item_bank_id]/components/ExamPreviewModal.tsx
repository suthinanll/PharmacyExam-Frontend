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
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────
interface AnswerOption {
    option_id: number;
    option_text: string;
    is_correct: boolean;
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

// ─── Option Label ────────────────────────────────────────────
const OPTION_LABELS = ['ก', 'ข', 'ค', 'ง', 'จ'];

export default function ExamPreviewModal({ isOpen, onClose, itemBankId }: ExamPreviewModalProps) {
    const { getToken } = useAuth();

    const [itemBank, setItemBank] = useState<ItemBank | null>(null);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // ── Fetch when opened ──────────────────────────────────
    useEffect(() => {
        if (isOpen && itemBankId) {
            fetchExamData();
        }
        // Reset when closed
        if (!isOpen) {
            setCurrentIndex(0);
            setSelectedAnswer(null);
            setAnswers({});
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
                const sitA = Number(a.situation?.display_order ?? 0);
                const sitB = Number(b.situation?.display_order ?? 0);
                if (sitA !== sitB) return sitA - sitB;
                const idA = a.situation?.situation_id ?? 0;
                const idB = b.situation?.situation_id ?? 0;
                if (idA !== idB) return idA - idB;
                return Number(a.display_order || 0) - Number(b.display_order || 0);
            });
            setQuestions(sorted);
        } catch (err: any) {
            setError(err.message || 'เกิดข้อผิดพลาด');
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

    const goTo = (index: number) => {
        setCurrentIndex(index);
        const q = questions[index];
        setSelectedAnswer(answers[q.item_id] ?? null);
    };

    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                if (currentIndex < questions.length - 1) goTo(currentIndex + 1);
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
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
    const prevSitId = currentIndex > 0 ? questions[currentIndex - 1]?.situation?.situation_id : null;
    const showSituation =
        currentQuestion?.situation &&
        currentQuestion.situation.situation_id !== prevSitId;

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
                <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-gray-200 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full">
                            <Eye className="w-4 h-4 text-amber-600" />
                            <span className="text-sm font-semibold text-amber-700">โหมดพรีวิว</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700 hidden sm:block">
                            {itemBank?.bank_name || '...'}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                            ข้อ <strong className="text-gray-800">{questions.length > 0 ? currentIndex + 1 : 0}</strong> / {questions.length}
                        </span>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="ปิด (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ── Body ────────────────────────────────────── */}
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-3" />
                            <p className="text-gray-500 font-medium">กำลังโหลดข้อสอบ...</p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center max-w-sm">
                            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
                            <p className="text-gray-700 font-medium mb-4">{error}</p>
                            <button
                                onClick={fetchExamData}
                                className="px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                            >
                                ลองใหม่
                            </button>
                        </div>
                    </div>
                ) : questions.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center max-w-sm">
                            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                            <p className="text-gray-500">ยังไม่มีคำถามในชุดข้อสอบนี้</p>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">

                        {/* ── Left: Question Area ────────────────── */}
                        <div className="flex-1 overflow-y-auto p-5 lg:p-8">

                            {/* Situation */}
                            {currentQuestion?.situation && (
                                <div className="mb-6 bg-white rounded-xl border border-blue-100 shadow-sm overflow-hidden">
                                    <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2">
                                        <BookOpen className="w-4 h-4 text-blue-600" />
                                        <span className="text-sm font-semibold text-blue-700">สถานการณ์</span>
                                    </div>
                                    <div className="p-5">
                                        {currentQuestion.situation.situation_title && (
                                            <p className="font-bold text-gray-800 mb-2">
                                                {currentQuestion.situation.situation_title}
                                            </p>
                                        )}
                                        <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm lg:text-base">
                                            {currentQuestion.situation.situation_text}
                                        </p>
                                        {currentQuestion.situation.situation_image_url && (
                                            <img
                                                src={currentQuestion.situation.situation_image_url}
                                                alt="situation"
                                                className="mt-4 rounded-lg max-w-full border border-gray-200"
                                            />
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Question Card */}
                            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 lg:p-7">
                                {/* question header */}
                                <div className="flex items-start gap-3 mb-5">
                                    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                                        {currentIndex + 1}
                                    </div>
                                    <div className="flex-1">
                                        {currentQuestion?.sub_topics && currentQuestion.sub_topics.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 mb-2">
                                                {currentQuestion.sub_topics.map(st => (
                                                    <span
                                                        key={st.sub_topic_id}
                                                        className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full"
                                                    >
                                                        {st.sub_topic_name}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                        <p className="text-gray-800 text-sm lg:text-base leading-relaxed whitespace-pre-wrap font-medium">
                                            {currentQuestion?.question_text}
                                        </p>
                                    </div>
                                </div>

                                {/* Options */}
                                <div className="space-y-3">
                                    {currentQuestion?.answer_options.map((option, idx) => {
                                        const isSelected = selectedAnswer === idx;
                                        return (
                                            <button
                                                key={option.option_id}
                                                onClick={() => handleSelectAnswer(idx)}
                                                className={`w-full p-4 text-left rounded-xl border-2 transition-all duration-150 flex items-center gap-4 group
                                                    ${isSelected
                                                        ? 'border-green-500 bg-green-50 shadow-sm'
                                                        : 'border-gray-200 hover:border-green-300 bg-white hover:bg-green-50/30'
                                                    }`}
                                            >
                                                {/* radio */}
                                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                                                    ${isSelected ? 'border-green-500' : 'border-gray-300 group-hover:border-green-400'}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                                                </div>

                                                {/* label badge */}
                                                <span className={`text-xs font-bold px-2 py-0.5 rounded shrink-0 transition-colors
                                                    ${isSelected ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-green-100 group-hover:text-green-700'}`}>
                                                    {OPTION_LABELS[idx] || String.fromCharCode(65 + idx)}
                                                </span>

                                                <span className="text-gray-800 text-sm lg:text-base leading-relaxed">
                                                    {option.option_text}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Preview notice */}
                                <p className="mt-5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 text-center">
                                    🔍 โหมดพรีวิว — การเลือกคำตอบจะไม่ถูกบันทึก
                                </p>
                            </div>

                            {/* Navigation - Bottom (mobile) */}
                            <div className="flex items-center justify-between mt-5 lg:hidden">
                                <button
                                    onClick={() => currentIndex > 0 && goTo(currentIndex - 1)}
                                    disabled={currentIndex === 0}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                >
                                    <ChevronLeft className="w-4 h-4" /> ย้อนกลับ
                                </button>
                                <button
                                    onClick={() => currentIndex < questions.length - 1 && goTo(currentIndex + 1)}
                                    disabled={currentIndex === questions.length - 1}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                >
                                    ถัดไป <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* ── Right Sidebar ──────────────────────── */}
                        <div className="w-full lg:w-72 xl:w-80 bg-white border-t lg:border-t-0 lg:border-l border-gray-200 flex flex-col shrink-0 overflow-y-auto">

                            {/* Progress */}
                            <div className="p-5 border-b border-gray-100">
                                <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                    <span>เลือกตอบแล้ว {answeredCount}/{questions.length} ข้อ</span>
                                    <span className="text-green-600 font-semibold">{Math.round(progress)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-2">
                                    <div
                                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>

                            {/* Question Grid */}
                            <div className="p-5 flex-1">
                                <div className="flex items-center gap-2 mb-3">
                                    <ListCheck className="w-4 h-4 text-gray-500" />
                                    <h3 className="text-sm font-semibold text-gray-700">เลือกข้อ</h3>
                                </div>
                                <div className="grid grid-cols-7 gap-1.5">
                                    {questions.map((q, idx) => {
                                        const isAnswered = answers[q.item_id] !== undefined;
                                        const isCurrent = idx === currentIndex;
                                        return (
                                            <button
                                                key={q.item_id}
                                                onClick={() => goTo(idx)}
                                                title={`ข้อ ${idx + 1}`}
                                                className={`aspect-square rounded-lg text-xs font-bold transition-all duration-150
                                                    ${isCurrent
                                                        ? 'bg-green-500 text-white ring-2 ring-green-300 ring-offset-1'
                                                        : isAnswered
                                                            ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                    }`}
                                            >
                                                {idx + 1}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Legend */}
                                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-500">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3.5 h-3.5 rounded bg-green-500" />
                                        <span>กำลังดู</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3.5 h-3.5 rounded bg-green-100" />
                                        <span>เลือกแล้ว</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-3.5 h-3.5 rounded bg-gray-100" />
                                        <span>ยังไม่เลือก</span>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation - Sidebar (desktop) */}
                            <div className="p-5 border-t border-gray-100 hidden lg:flex gap-2">
                                <button
                                    onClick={() => currentIndex > 0 && goTo(currentIndex - 1)}
                                    disabled={currentIndex === 0}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                >
                                    <ChevronLeft className="w-4 h-4" /> ย้อนกลับ
                                </button>
                                <button
                                    onClick={() => currentIndex < questions.length - 1 && goTo(currentIndex + 1)}
                                    disabled={currentIndex === questions.length - 1}
                                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                                >
                                    ถัดไป <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
