import React, { useState } from 'react';
import {
    ChevronDown,
    ChevronUp,
    ChevronsDownUp,
    ChevronsUpDown,
    FileText,
    CheckCircle,
    BookOpen,
    HelpCircle,
    Lightbulb,
    Eye,
    EyeOff,
} from 'lucide-react';

interface AnswerOption {
    option_id?: number;
    option_text: string;
    is_correct: boolean;
}

interface Question {
    item_id?: number;
    question_text: string;
    explanation: string;
    sub_topic_id?: number;
    answer_options: AnswerOption[];
    display_order?: number;
}

interface Situation {
    situation_id?: number;
    situation_text: string;
    situation_image_url?: string;
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

    const totalQuestions = situations.reduce((acc, s) => acc + s.questions.length, 0);

    if (situations.length === 0) {
        return (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-200">
                    <FileText className="w-10 h-10 text-gray-300" />
                </div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">ยังไม่มีข้อสอบ</h3>
                <p className="text-gray-400 text-sm">กดปุ่ม <span className="font-medium text-blue-500">แก้ไขข้อมูล</span> แล้วกด <span className="font-medium text-green-500">เพิ่มสถานการณ์</span> เพื่อเริ่มสร้างข้อสอบ</p>
            </div>
        );
    }

    return (
        <div className="space-y-5 pb-10">

            {/* ── Summary Bar ───────────────────────────────── */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-gray-200 rounded-xl px-5 py-3.5 shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                            <BookOpen className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 leading-none mb-0.5">สถานการณ์</p>
                            <p className="text-base font-bold text-gray-800 leading-none">{situations.length}</p>
                        </div>
                    </div>
                    <div className="w-px h-8 bg-gray-100" />
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
                            <HelpCircle className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 leading-none mb-0.5">คำถามทั้งหมด</p>
                            <p className="text-base font-bold text-gray-800 leading-none">{totalQuestions} ข้อ</p>
                        </div>
                    </div>
                </div>

                {/* Right-side action buttons */}
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Collapse / Expand all */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1 gap-1">
                        <button
                            onClick={onExpandAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-sm transition-all"
                            title="เปิดทุกสถานการณ์"
                        >
                            <ChevronsUpDown className="w-3.5 h-3.5" />
                            เปิดทั้งหมด
                        </button>
                        <button
                            onClick={onCollapseAll}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-gray-600 hover:bg-white hover:text-gray-800 hover:shadow-sm transition-all"
                            title="ยุบทุกสถานการณ์"
                        >
                            <ChevronsDownUp className="w-3.5 h-3.5" />
                            ยุบทั้งหมด
                        </button>
                    </div>

                    {/* Toggle show answers */}
                    <button
                        onClick={() => setShowAnswers(v => !v)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all
                            ${showAnswers
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                            }`}
                    >
                        {showAnswers ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        {showAnswers ? 'ซ่อนเฉลย' : 'แสดงเฉลย'}
                    </button>
                </div>
            </div>

            {/* ── Situations ───────────────────────────────── */}
            {situations.map((situation, sitIdx) => {
                const isCollapsed = collapsedSituations.has(sitIdx);
                const questionStartIndex = situations.slice(0, sitIdx).reduce((acc, s) => acc + s.questions.length, 0);

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
                                {/* index badge */}
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                    {sitIdx + 1}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-gray-800">สถานการณ์ที่ {sitIdx + 1}</span>
                                        {situation.situation_id && (
                                            <span className="text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">บันทึกแล้ว</span>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-0.5">{situation.questions.length} คำถาม</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="text-xs text-gray-400 group-hover:text-gray-600 transition-colors hidden sm:inline">
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
                                    <div className="flex items-start gap-3">
                                        <div className="w-1 self-stretch rounded-full bg-gradient-to-b from-emerald-400 to-emerald-600 shrink-0" />
                                        {situation.situation_text ? (
                                            <div
                                                className="prose prose-sm max-w-none text-gray-700 leading-relaxed text-[15px]"
                                                dangerouslySetInnerHTML={{ __html: situation.situation_text }}
                                            />
                                        ) : (
                                            <span className="text-gray-400 italic text-sm">ไม่มีรายละเอียดสถานการณ์</span>
                                        )}
                                    </div>
                                    {situation.situation_image_url && (
                                        <div className="mt-4 pl-4">
                                            <img
                                                src={situation.situation_image_url}
                                                alt="สถานการณ์"
                                                className="max-h-72 rounded-xl object-contain border border-gray-200 shadow-sm"
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
                                                    {/* number */}
                                                    <div className="w-8 h-8 rounded-full border-2 border-blue-200 bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-xs shrink-0 mt-0.5">
                                                        {globalNum}
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div
                                                            className="text-gray-800 font-medium text-sm leading-relaxed line-clamp-2 pr-2 prose prose-sm max-w-none"
                                                            dangerouslySetInnerHTML={{ __html: question.question_text || 'คำถามใหม่' }}
                                                        />
                                                        {!isQCollapsed && showAnswers && correctIndex >= 0 && (
                                                            <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-600">
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
                                                        {/* full question text */}
                                                        {/* <div className="mb-4 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
                                                            <p className="text-gray-800 whitespace-pre-wrap leading-relaxed text-sm">
                                                                {question.question_text}
                                                            </p>
                                                        </div> */}

                                                        {/* Answer Options */}
                                                        <div className="space-y-2">
                                                            {question.answer_options.map((option, oIdx) => {
                                                                const label = OPTION_LABELS[oIdx] || String.fromCharCode(65 + oIdx);
                                                                const isCorrect = option.is_correct;
                                                                const revealCorrect = showAnswers && isCorrect;

                                                                return (
                                                                    <div
                                                                        key={oIdx}
                                                                        className={`flex items-start gap-3 p-3.5 rounded-xl border transition-colors
                                                                            ${revealCorrect
                                                                                ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                                                                                : 'bg-white border-gray-200'
                                                                            }`}
                                                                    >
                                                                        {/* label */}
                                                                        <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border
                                                                            ${revealCorrect
                                                                                ? 'bg-emerald-500 text-white border-emerald-500'
                                                                                : 'bg-gray-100 text-gray-600 border-gray-200'
                                                                            }`}>
                                                                            {label}
                                                                        </span>

                                                                        <span className={`text-sm leading-relaxed flex-1 break-words
                                                                            ${revealCorrect ? 'text-emerald-800 font-medium' : 'text-gray-700'}`}>
                                                                            {option.option_text || (
                                                                                <span className="text-gray-400 italic">ไม่มีข้อมูลตัวเลือก</span>
                                                                            )}
                                                                        </span>

                                                                        {revealCorrect && (
                                                                            <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>

                                                        {/* Explanation */}
                                                        {question.explanation && (
                                                            <div className="mt-4 flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                                                                <Lightbulb className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                                                <div>
                                                                    <p className="text-xs font-bold text-amber-700 mb-1 uppercase tracking-wide">คำอธิบายเฉลย</p>
                                                                    <div
                                                                        className="prose prose-sm max-w-none text-amber-800 leading-relaxed"
                                                                        dangerouslySetInnerHTML={{ __html: question.explanation }}
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
        </div>
    );
}
