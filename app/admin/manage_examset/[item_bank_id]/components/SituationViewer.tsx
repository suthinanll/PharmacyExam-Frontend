import React, { useState } from 'react';
import {
    ChevronDown,
    ChevronUp,
    ChevronsDownUp,
    ChevronsUpDown,
    FileText,
    FileQuestion,
    CheckCircle,
    BookOpen,
    HelpCircle,
    Lightbulb,
    Eye,
    EyeOff,
} from 'lucide-react';
import ImagePreviewModal from '@/components/ImagePreviewModal';
import { formatScientificText } from '@/utils/formatText';
import { sanitizeHtml } from "@/utils/sanitize";

interface AnswerOption {
    option_id?: number;
    option_text: string;
    is_correct: boolean;
    option_image_url?: string;
}

interface Question {
    item_id?: number;
    question_text: string;
    explanation: string;
    sub_topic_id?: number;
    answer_options: AnswerOption[];
    display_order?: number;
    question_image_url?: string;
}

interface Situation {
    situation_id?: number;
    situation_text: string;
    situation_image_url?: string;
    is_standalone?: boolean;
    questions: Question[];
    display_order?: number;
}

interface SituationViewerProps {
    situations: Situation[];
    collapsedSituations: Set<number>;
    collapsedQuestions: Set<string>;
    toggleSituationCollapse: (index: number) => void;
    toggleQuestionCollapse: (sitIdx: number, qIdx: number) => void;
    situationRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
    onCollapseAll?: () => void;
    onExpandAll?: () => void;
}

const OPTION_LABELS = ['ก', 'ข', 'ค', 'ง', 'จ'];

export default function SituationViewer({
    situations,
    collapsedSituations,
    collapsedQuestions,
    toggleSituationCollapse,
    toggleQuestionCollapse,
    situationRefs,
    onCollapseAll,
    onExpandAll,
}: SituationViewerProps) {
    const [showAnswers, setShowAnswers] = useState(true);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const totalQuestions = situations.reduce((acc, s) => acc + s.questions.length, 0);

    if (situations.length === 0) {
        return (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-200">
                    <FileText className="w-10 h-10 text-gray-300" />
                </div>
                <h2 className="text-xl font-medium text-gray-700 mb-2">ยังไม่มีข้อสอบ</h2>
                <p className="text-gray-600 text-sm">กดปุ่ม <span className="font-medium text-blue-500">แก้ไขข้อมูล</span> แล้วกด <span className="font-medium text-green-500">เพิ่มสถานการณ์</span> เพื่อเริ่มสร้างข้อสอบ</p>
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-10">

            {/* ── Prominent Summary / Stats Bar ───────────────────────────────── */}
            {(() => {
                const situationCount = situations.filter(s => s.is_standalone !== true).length;
                const standaloneCount = situations.filter(s => s.is_standalone === true).length;
                const totalQCount = situations.reduce((sum, s) => sum + (s.questions?.length || 0), 0);

                return (
                    <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm transition-all hover:shadow-md">
                        <div className="flex flex-wrap items-center justify-between gap-4">
                            {/* Left: Prominent Stat Badges */}
                            <div className="flex flex-wrap items-center gap-5 sm:gap-7">
                                {/* Situations Stat */}
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shadow-sm shrink-0">
                                        <BookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500  tracking-wider">สถานการณ์</p>
                                        <div className="flex items-baseline gap-1 mt-0.5">
                                            <span className="text-2xl font-bold text-gray-900 tracking-tight">{situationCount}</span>
                                            <span className="text-sm text-gray-500 font-medium">ชุด</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Standalone Questions Stat (if any) */}
                                {standaloneCount > 0 && (
                                    <>
                                        <div className="hidden sm:block w-px h-8 bg-gray-200" />
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
                                                <FileQuestion className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-500  tracking-wider">คำถามเดี่ยว</p>
                                                <div className="flex items-baseline gap-1 mt-0.5">
                                                    <span className="text-2xl font-bold text-gray-900 tracking-tight">{standaloneCount}</span>
                                                    <span className="text-sm text-gray-500 font-medium">ข้อ</span>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="hidden sm:block w-px h-8 bg-gray-200" />

                                {/* Total Questions Stat */}
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 rounded-xl bg-gray-200 flex items-center justify-center text-gray-700 shadow-sm shrink-0">
                                        <HelpCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-500  tracking-wider">คำถามทั้งหมด</p>
                                        <div className="flex items-baseline gap-1 mt-0.5">
                                            <span className="text-2xl font-bold text-gray-900 tracking-tight">{totalQCount}</span>
                                            <span className="text-sm text-gray-500 font-medium">ข้อ</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right-side action buttons */}
                            <div className="flex items-center gap-2.5 flex-wrap">
                                {/* Collapse / Expand all */}
                                <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1 border border-gray-200/60">
                                    <button
                                        type="button"
                                        onClick={onExpandAll}
                                        aria-label="เปิดทุกสถานการณ์"
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all cursor-pointer"
                                        title="เปิดทุกสถานการณ์"
                                    >
                                        <ChevronsUpDown className="w-4 h-4 text-gray-500" />
                                        <span>เปิดทั้งหมด</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onCollapseAll}
                                        aria-label="ยุบทุกสถานการณ์"
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-white hover:text-gray-900 hover:shadow-sm transition-all cursor-pointer"
                                        title="ยุบทุกสถานการณ์"
                                    >
                                        <ChevronsDownUp className="w-4 h-4 text-gray-500" />
                                        <span>ยุบทั้งหมด</span>
                                    </button>
                                </div>

                                {/* Toggle show answers */}
                                <button
                                    type="button"
                                    onClick={() => setShowAnswers(v => !v)}
                                    aria-label={showAnswers ? 'ซ่อนเฉลย' : 'แสดงเฉลย'}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer shadow-sm
                                        ${showAnswers
                                            ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                                        }`}
                                >
                                    {showAnswers ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                                    <span>{showAnswers ? 'ซ่อนเฉลย' : 'แสดงเฉลย'}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })()}

            {/* ── Situations ───────────────────────────────── */}
            {situations.map((situation, sitIdx) => {
                const isCollapsed = collapsedSituations.has(sitIdx);
                const questionStartIndex = situations.slice(0, sitIdx).reduce((acc, s) => acc + s.questions.length, 0);
                const hasSituationContent = Boolean(
                    (situation.situation_text && situation.situation_text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim() !== '') ||
                    (situation.situation_image_url && situation.situation_image_url.trim() !== '')
                );
                const situationSeqNumber = situations.slice(0, sitIdx + 1).filter(s => {
                    return Boolean(
                        (s.situation_text && s.situation_text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim() !== '') ||
                        (s.situation_image_url && s.situation_image_url.trim() !== '')
                    );
                }).length;

                if (!hasSituationContent) {
                    // Render questions directly without situation wrapper card if situation is empty
                    return (
                        <div key={sitIdx} className="space-y-4">
                            {situation.questions.map((question, qIdx) => {
                                const isQCollapsed = collapsedQuestions.has(`${sitIdx}-${qIdx}`);
                                const globalNum = questionStartIndex + qIdx + 1;
                                const correctIndex = question.answer_options.findIndex(o => o.is_correct);

                                return (
                                    <div
                                        id={`question-${sitIdx}-${qIdx}`}
                                        key={qIdx}
                                        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden scroll-mt-32"
                                    >
                                        <div
                                            className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50/70 transition-colors group"
                                            onClick={() => toggleQuestionCollapse(sitIdx, qIdx)}
                                        >
                                            <div className="w-8 h-8 rounded-full border-2 border-blue-200 bg-blue-50 flex items-center justify-center text-blue-700 font-medium text-sm shrink-0 mt-0.5">
                                                {globalNum}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div
                                                    className="text-gray-800 font-medium text-sm leading-relaxed line-clamp-2 pr-2 prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.question_text || 'คำถามใหม่') }}
                                                />
                                                {!isQCollapsed && showAnswers && correctIndex >= 0 && (
                                                    <div className="mt-1.5 flex items-center gap-1.5 text-sm text-green-600">
                                                        <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                                        <span className="font-medium">เฉลย: ข้อ {OPTION_LABELS[correctIndex] || correctIndex + 1}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="w-7 h-7 rounded-lg bg-transparent group-hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0">
                                                {isQCollapsed
                                                    ? <ChevronDown className="w-4 h-4 text-gray-400" />
                                                    : <ChevronUp className="w-4 h-4 text-gray-400" />
                                                }
                                            </div>
                                        </div>

                                        {!isQCollapsed && (
                                            <div className="px-5 pb-5 bg-gray-50/40 border-t border-gray-100">
                                                {question.question_image_url && question.question_image_url.trim() !== '' && question.question_image_url !== '-' && (
                                                    <div className="mb-4 mt-4">
                                                        <img
                                                            src={question.question_image_url.startsWith("http")
                                                                ? question.question_image_url
                                                                : `${process.env.NEXT_PUBLIC_API_URL}${question.question_image_url}`}
                                                            alt="คำถาม"
                                                            className="max-h-72 rounded-xl object-contain border border-gray-200 shadow-sm bg-white cursor-pointer hover:opacity-90 transition-opacity"
                                                            onClick={() => setPreviewImage(
                                                                question.question_image_url!.startsWith("http")
                                                                    ? question.question_image_url!
                                                                    : `${process.env.NEXT_PUBLIC_API_URL}${question.question_image_url}`
                                                            )}
                                                        />
                                                    </div>
                                                )}

                                                <div className="space-y-2 mt-4">
                                                    {question.answer_options.map((option, oIdx) => {
                                                        const label = OPTION_LABELS[oIdx] || String.fromCharCode(65 + oIdx);
                                                        const isCorrect = option.is_correct;
                                                        const revealCorrect = showAnswers && isCorrect;

                                                        return (
                                                            <div
                                                                key={oIdx}
                                                                className={`p-3.5 rounded-xl border transition-colors ${revealCorrect
                                                                    ? 'bg-green-50 border-green-300 shadow-sm'
                                                                    : 'bg-white border-gray-200'
                                                                    }`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-medium border ${revealCorrect
                                                                        ? 'bg-green-500 text-white border-green-500'
                                                                        : 'bg-gray-100 text-gray-600 border-gray-200'
                                                                        }`}>
                                                                        {label}
                                                                    </span>
                                                                    <div className="flex-1">
                                                                        {option.option_text && option.option_text.trim() !== '' && (
                                                                            <span
                                                                                className={`text-sm leading-relaxed break-words block ${revealCorrect ? 'text-green-800 font-medium' : 'text-gray-700'}`}
                                                                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatScientificText(option.option_text)) }}
                                                                            />
                                                                        )}
                                                                    </div>
                                                                    {revealCorrect && (
                                                                        <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {question.explanation && (
                                                    <div className="mt-4 flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                                        <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-medium text-amber-700 mb-1 ">คำอธิบายเฉลย</p>
                                                            <div
                                                                className="prose prose-sm max-w-none text-amber-800 leading-relaxed"
                                                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.explanation) }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    );
                }

                return (
                    <div
                        key={sitIdx}
                        ref={(el) => { situationRefs.current[sitIdx] = el; }}
                        className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden scroll-mt-32 transition-shadow hover:shadow-md"
                    >
                        {/* ── Situation Header ─────────────────── */}
                        <div
                            className="flex items-center justify-between px-5 py-4 cursor-pointer select-none group"
                            onClick={() => toggleSituationCollapse(sitIdx)}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white font-medium text-sm shadow-sm">
                                    {situationSeqNumber}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-gray-800">สถานการณ์ที่ {situationSeqNumber}</span>
                                        {situation.situation_id && (
                                            <span className="text-sm text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-medium">บันทึกแล้ว</span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 mt-0.5">{situation.questions.length} คำถาม</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 group-hover:text-gray-800 transition-colors hidden sm:inline">
                                    {isCollapsed ? 'คลิกเพื่อแสดง' : 'คลิกเพื่อย่อ'}
                                </span>
                                <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-gray-200 flex items-center justify-center transition-colors">
                                    {isCollapsed
                                        ? <ChevronDown className="w-4 h-4 text-gray-500" />
                                        : <ChevronUp className="w-4 h-4 text-gray-500" />
                                    }
                                </div>
                            </div>
                        </div>

                        {!isCollapsed && (
                            <div className="border-t border-gray-100">
                                {/* ── Situation Body ─────────────────── */}
                                <div className="bg-gradient-to-b from-slate-50 to-white px-5 py-5 border-b border-gray-100">
                                    {situation.situation_text && situation.situation_text.replace(/<[^>]*>/g, '').trim() !== '' && (
                                        <div className="flex items-start gap-3">
                                            <div className="w-1 self-stretch rounded-full bg-gradient-to-b from-green-400 to-green-600 shrink-0" />
                                            <div
                                                className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-[15px]"
                                                dangerouslySetInnerHTML={{ __html: sanitizeHtml(situation.situation_text) }}
                                            />
                                        </div>
                                    )}
                                    {situation.situation_image_url && situation.situation_image_url.trim() !== '' && (
                                        <div className={situation.situation_text && situation.situation_text.replace(/<[^>]*>/g, '').trim() !== '' ? "mt-4 pl-4" : "pl-4"}>
                                            <img
                                                src={situation.situation_image_url.startsWith("http")
                                                    ? situation.situation_image_url
                                                    : `${process.env.NEXT_PUBLIC_API_URL}${situation.situation_image_url}`}
                                                alt="สถานการณ์"
                                                className="max-h-72 rounded-xl object-contain border border-gray-200 shadow-sm cursor-pointer hover:opacity-90 transition-opacity"
                                                onClick={() => setPreviewImage(
                                                    situation.situation_image_url!.startsWith("http")
                                                        ? situation.situation_image_url!
                                                        : `${process.env.NEXT_PUBLIC_API_URL}${situation.situation_image_url}`
                                                )}
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* ── Questions ───────────────────────── */}
                                <div className="divide-y divide-gray-100">
                                    {situation.questions.map((question, qIdx) => {
                                        const isQCollapsed = collapsedQuestions.has(`${sitIdx}-${qIdx}`);
                                        const globalNum = questionStartIndex + qIdx + 1;
                                        const correctIndex = question.answer_options.findIndex(o => o.is_correct);

                                        return (
                                            <div
                                                id={`question-${sitIdx}-${qIdx}`}
                                                key={qIdx}
                                                className="scroll-mt-32"
                                            >
                                                {/* Question Header */}
                                                <div
                                                    className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50/70 transition-colors group"
                                                    onClick={() => toggleQuestionCollapse(sitIdx, qIdx)}
                                                >
                                                    <div className="w-8 h-8 rounded-full border-2 border-blue-200 bg-blue-50 flex items-center justify-center text-blue-700 font-medium text-sm shrink-0 mt-0.5">
                                                        {globalNum}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div
                                                            className="text-gray-800 font-medium text-sm leading-relaxed line-clamp-2 pr-2 prose prose-sm max-w-none"
                                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.question_text || 'คำถามใหม่') }}
                                                        />
                                                        {!isQCollapsed && showAnswers && correctIndex >= 0 && (
                                                            <div className="mt-1.5 flex items-center gap-1.5 text-sm text-green-600">
                                                                <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                                                                <span className="font-medium">เฉลย: ข้อ {OPTION_LABELS[correctIndex] || correctIndex + 1}</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="w-7 h-7 rounded-lg bg-transparent group-hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0">
                                                        {isQCollapsed
                                                            ? <ChevronDown className="w-4 h-4 text-gray-400" />
                                                            : <ChevronUp className="w-4 h-4 text-gray-400" />
                                                        }
                                                    </div>
                                                </div>

                                                {/* Question Detail */}
                                                {!isQCollapsed && (
                                                    <div className="px-5 pb-5 bg-gray-50/40">
                                                        {question.question_image_url && question.question_image_url.trim() !== '' && question.question_image_url !== '-' && (
                                                            <div className="mb-4">
                                                                <img
                                                                    src={question.question_image_url.startsWith("http")
                                                                        ? question.question_image_url
                                                                        : `${process.env.NEXT_PUBLIC_API_URL}${question.question_image_url}`}
                                                                    alt="คำถาม"
                                                                    className="max-h-72 rounded-xl object-contain border border-gray-200 shadow-sm bg-white cursor-pointer hover:opacity-90 transition-opacity"
                                                                    onClick={() => setPreviewImage(
                                                                        question.question_image_url!.startsWith("http")
                                                                            ? question.question_image_url!
                                                                            : `${process.env.NEXT_PUBLIC_API_URL}${question.question_image_url}`
                                                                    )}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Answer Options */}
                                                        <div className="space-y-2">
                                                            {question.answer_options.map((option, oIdx) => {
                                                                const label = OPTION_LABELS[oIdx] || String.fromCharCode(65 + oIdx);
                                                                const isCorrect = option.is_correct;
                                                                const revealCorrect = showAnswers && isCorrect;

                                                                return (
                                                                    <div
                                                                        key={oIdx}
                                                                        className={`p-3.5 rounded-xl border transition-colors ${revealCorrect
                                                                            ? 'bg-green-50 border-green-300 shadow-sm'
                                                                            : 'bg-white border-gray-200'
                                                                            }`}
                                                                    >
                                                                        <div className="flex items-start gap-3">
                                                                            <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-medium border ${revealCorrect
                                                                                ? 'bg-green-500 text-white border-green-500'
                                                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                                                                }`}>
                                                                                {label}
                                                                            </span>

                                                                            <div className="flex-1">
                                                                                {option.option_text && option.option_text.trim() !== '' && (
                                                                                    <span
                                                                                        className={`text-sm leading-relaxed break-words block ${revealCorrect ? 'text-green-800 font-medium' : 'text-gray-700'}`}
                                                                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatScientificText(option.option_text)) }}
                                                                                    />
                                                                                )}
                                                                            </div>

                                                                            {revealCorrect && (
                                                                                <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Explanation */}
                                                        {question.explanation && (
                                                            <div className="mt-4 flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                                                <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                                                <div>
                                                                    <p className="text-sm font-medium text-amber-700 mb-1 ">คำอธิบายเฉลย</p>
                                                                    <div
                                                                        className="prose prose-sm max-w-none text-amber-800 leading-relaxed"
                                                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(question.explanation) }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
            <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />
        </div>
    );
}
