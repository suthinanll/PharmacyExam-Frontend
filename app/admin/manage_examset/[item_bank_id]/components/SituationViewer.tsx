
import React from 'react';
import { ChevronDown, ChevronUp, FileText, CheckCircle } from 'lucide-react';

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
}

export default function SituationViewer({
    situations,
    collapsedSituations,
    collapsedQuestions,
    toggleSituationCollapse,
    toggleQuestionCollapse,
    situationRefs
}: SituationViewerProps) {
    if (situations.length === 0) {
        return (
            <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 sm:p-16 text-center">
                <FileText className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">ยังไม่มีข้อมูล</h3>
                <p className="text-gray-500">กดปุ่ม "แก้ไขข้อมูล" แล้วกด "เพิ่มสถานการณ์" เพื่อเริ่มสร้างข้อสอบ</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8 pb-8">
            {situations.map((situation, sitIdx) => {
                const isCollapsed = collapsedSituations.has(sitIdx);
                const questionStartIndex = situations.slice(0, sitIdx).reduce((acc, s) => acc + s.questions.length, 0);

                return (
                    <div
                        key={sitIdx}
                        ref={(el) => { situationRefs.current[sitIdx] = el; }}
                        className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden scroll-mt-32"
                    >
                        {/* Situation Header (View Mode) */}
                        <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-100 transition-colors duration-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-1.5 h-6 rounded-full ${situation.situation_id ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                    <h5 className="font-bold text-gray-800 text-lg">สถานการณ์ที่ {sitIdx + 1}</h5>

                                    <div className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full border border-gray-200 ml-2">
                                        {situation.questions.length} คำถาม
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => toggleSituationCollapse(sitIdx)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                                >
                                    {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {!isCollapsed && (
                            <div className="p-6 bg-gray-50 space-y-6">
                                {/* Situation Content */}
                                <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                                    <h6 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">รายละเอียดสถานการณ์</h6>
                                    <div className="prose max-w-none text-gray-800 whitespace-pre-wrap leading-relaxed">
                                        {situation.situation_text || <span className="text-gray-400 italic">ไม่มีรายละเอียด</span>}
                                    </div>
                                    {situation.situation_image_url && (
                                        <div className="mt-4">
                                            <img src={situation.situation_image_url} alt="Situation" className="max-h-64 rounded-lg object-contain border border-gray-200" />
                                        </div>
                                    )}
                                </div>

                                {/* Questions List */}
                                <div className="space-y-4">
                                    {situation.questions.map((question, qIdx) => {
                                        const isQCollapsed = collapsedQuestions.has(`${sitIdx}-${qIdx}`);

                                        return (
                                            <div id={`question-${sitIdx}-${qIdx}`} key={qIdx} className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden scroll-mt-32">
                                                <div
                                                    className="p-4 bg-white border-b border-gray-50 flex justify-between items-center cursor-pointer hover:bg-gray-50 transition-colors"
                                                    onClick={() => toggleQuestionCollapse(sitIdx, qIdx)}
                                                >
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs border border-blue-100 flex-shrink-0">
                                                            {questionStartIndex + qIdx + 1}
                                                        </div>
                                                        <span className="font-medium text-gray-700 truncate pr-4">
                                                            {question.question_text || 'คำถามใหม่'}
                                                        </span>
                                                    </div>
                                                    {isQCollapsed ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronUp className="w-4 h-4 text-gray-400" />}
                                                </div>

                                                {!isQCollapsed && (
                                                    <div className="p-5 space-y-6">
                                                        {/* Question Text */}
                                                        <div>
                                                            <h6 className="text-sm font-semibold text-gray-900 mb-2">คำถาม</h6>
                                                            <p className="text-gray-800 whitespace-pre-wrap">{question.question_text}</p>
                                                        </div>

                                                        {/* Answers */}
                                                        <div className="grid grid-cols-1 gap-3">
                                                            {question.answer_options.map((option, oIdx) => (
                                                                <div
                                                                    key={oIdx}
                                                                    className={`p-3 rounded-lg border flex items-start gap-3 ${option.is_correct
                                                                        ? 'bg-green-50 border-green-200'
                                                                        : 'bg-white border-gray-200'
                                                                        }`}
                                                                >
                                                                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center border flex-shrink-0 ${option.is_correct ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
                                                                        }`}>
                                                                        {option.is_correct && <CheckCircle className="w-3.5 h-3.5" />}
                                                                    </div>
                                                                    <span className={`text-sm break-words ${option.is_correct ? 'text-green-800 font-medium' : 'text-gray-600'}`}>
                                                                        {option.option_text || <span className="text-gray-400 italic">ไม่มีข้อมูลตัวเลือก</span>}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Explanation */}
                                                        {question.explanation && (
                                                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                                                <h6 className="text-sm font-semibold text-blue-800 mb-1">คำอธิบายเฉลย</h6>
                                                                <p className="text-blue-700 text-sm">{question.explanation}</p>
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

