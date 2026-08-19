import React, { useState, useEffect, useRef } from 'react';
import { List, ChevronRight, ChevronDown, GripVertical, Plus, ArrowUp } from 'lucide-react';
import { motion } from 'framer-motion';

/** Scroll page to top — handles window, documentElement, body, and any scrollable wrapper */
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.scrollTo({ top: 0, behavior: 'smooth' });
    // Navbar_admin / layout wrapper that might be the real scroll container
    const main = document.querySelector('main');
    if (main) main.scrollTo({ top: 0, behavior: 'smooth' });
    const wrapper = document.querySelector('#page-wrapper, [class*="overflow-y-auto"], [class*="overflow-auto"]');
    if (wrapper) (wrapper as HTMLElement).scrollTo({ top: 0, behavior: 'smooth' });
}

interface Situation {
    situation_text?: string;
    situation_image_url?: string;
    questions: any[];
}

interface TableOfContentsProps {
    situations: Situation[];
    activeSituationIndex: number;
    showTOC: boolean;
    setShowTOC: (show: boolean) => void;
    scrollToSituation: (index: number) => void;
    collapsedSituations: Set<number>;
    onExpandSituation: (index: number) => void;
    onAddSituation?: () => void;
    onAddStandaloneQuestion?: () => void;
}

function stripHtml(html?: string): string {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
}

export default function TableOfContents({
    situations,
    activeSituationIndex,
    showTOC,
    setShowTOC,
    scrollToSituation,
    collapsedSituations,
    onExpandSituation,
    onAddSituation,
    onAddStandaloneQuestion,
}: TableOfContentsProps) {
    // State to track expanded situations in TOC
    const [expandedSituations, setExpandedSituations] = useState<Set<number>>(new Set([0]));

    // Pre-calculate numbering for actual situations
    let sitCounter = 0;
    const situationIndexMap: { [idx: number]: number } = {};
    situations.forEach((sit, idx) => {
        const hasContent = Boolean(
            (sit.situation_text && sit.situation_text.replace(/<[^>]*>/g, '').trim() !== '') ||
            (sit.situation_image_url && sit.situation_image_url.trim() !== '')
        );
        if (hasContent) {
            sitCounter++;
            situationIndexMap[idx] = sitCounter;
        }
    });

    // Auto-expand the active situation when it changes
    useEffect(() => {
        setExpandedSituations(prev => {
            const next = new Set(prev);
            next.add(activeSituationIndex);
            return next;
        });
    }, [activeSituationIndex]);

    const toggleExpand = (idx: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedSituations(prev => {
            const next = new Set(prev);
            if (next.has(idx)) {
                next.delete(idx);
            } else {
                next.add(idx);
            }
            return next;
        });
    };

    const constraintsRef = useRef(null);

    if (situations.length === 0 && !onAddSituation) return null;

    return (
        <motion.div
            ref={constraintsRef}
            drag
            dragMomentum={false}
            dragListener={false}
            className="fixed right-4 top-28 z-50 flex flex-col items-end gap-2 transition-shadow w-fit h-fit"
            whileDrag={{ scale: 1.02, zIndex: 60 }}
        >
            {/* Toggle Button / Drag Handle / Back to Top */}
            <div className="flex items-center gap-2">
                <motion.div
                    drag
                    dragMomentum={false}
                    dragConstraints={constraintsRef}
                    className="cursor-grab active:cursor-grabbing p-1.5 bg-white rounded-full shadow-lg border border-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
                    title="ลากเพื่อย้าย"
                >
                    <GripVertical className="w-4 h-4" />
                </motion.div>
                <button
                    type="button"
                    onClick={scrollToTop}
                    className="bg-white p-2.5 rounded-full shadow-lg border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-200 transition-all active:scale-95"
                    title="กลับขึ้นข้างบน"
                >
                    <ArrowUp className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => setShowTOC(!showTOC)}
                    className="bg-white p-2.5 rounded-full shadow-lg border border-gray-200 text-gray-600 hover:text-emerald-600 hover:border-emerald-200 transition-all active:scale-95"
                    title={showTOC ? "ซ่อนสารบัญ" : "แสดงสารบัญ"}
                >
                    {showTOC ? <ChevronRight className="w-4 h-4" /> : <List className="w-4 h-4" />}
                </button>
            </div>

            {/* Content List */}
            {showTOC && (
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-64 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
                    <div className="p-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <List className="w-4 h-4 text-emerald-600" />
                            <span>สารบัญคำถาม</span>
                        </div>
                        <button
                            type="button"
                            onClick={scrollToTop}
                            className="text-xs text-emerald-600 hover:underline flex items-center gap-0.5"
                        >
                            <ArrowUp className="w-3 h-3" /> บนสุด
                        </button>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
                        {situations.map((situation, idx) => {
                            const questionStartIndex = situations.slice(0, idx).reduce((acc, s) => acc + s.questions.length, 0);
                            const isExpanded = expandedSituations.has(idx);

                            const hasSituationContent = Boolean(
                                (situation.situation_text && situation.situation_text.replace(/<[^>]*>/g, '').trim() !== '') ||
                                (situation.situation_image_url && situation.situation_image_url.trim() !== '')
                            );

                            if (!hasSituationContent) {
                                // Standalone question - render directly in TOC
                                return (
                                    <div key={idx} className="space-y-1">
                                        {situation.questions.map((q, qIdx) => {
                                            const globalNum = questionStartIndex + qIdx + 1;
                                            const plainText = stripHtml(q.question_text);
                                            const displayText = plainText
                                                ? (plainText.length > 18 ? plainText.substring(0, 18) + '...' : plainText)
                                                : 'คำถามเดี่ยว';

                                            return (
                                                <button
                                                    key={qIdx}
                                                    type="button"
                                                    onClick={() => {
                                                        const el = document.getElementById(`question-${idx}-${qIdx}`);
                                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }}
                                                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 truncate cursor-pointer ${
                                                        activeSituationIndex === idx
                                                            ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
                                                            : 'text-gray-700 hover:bg-gray-50 border border-transparent'
                                                    }`}
                                                    title={plainText || 'คำถามเดี่ยว'}
                                                >
                                                    <span className="shrink-0 px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-bold text-[10px]">
                                                        ข้อ {globalNum}
                                                    </span>
                                                    <span className="truncate">{displayText}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                );
                            }

                            // Standard Situation with Context
                            return (
                                <div key={idx} className="space-y-1">
                                    <div className={`flex items-center w-full rounded-lg transition-colors pr-2 ${activeSituationIndex === idx
                                        ? 'bg-emerald-50 text-emerald-700 font-medium'
                                        : 'text-gray-700 hover:bg-gray-50'
                                        }`}>
                                        <button
                                            type="button"
                                            onClick={(e) => toggleExpand(idx, e)}
                                            className="p-2 hover:bg-black/5 rounded-l-lg text-gray-400 hover:text-gray-600 transition-colors"
                                        >
                                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => scrollToSituation(idx)}
                                            className="flex-1 text-left py-2 text-sm font-medium truncate cursor-pointer"
                                        >
                                            สถานการณ์ที่ {situationIndexMap[idx] || idx + 1}
                                        </button>
                                    </div>

                                    {/* Questions Sub-list */}
                                    {isExpanded && situation.questions && situation.questions.length > 0 && (
                                        <div className="ml-4 pl-2 border-l-2 border-gray-100 space-y-0.5 mb-2">
                                            {situation.questions.map((q, qIdx) => {
                                                const plainText = stripHtml(q.question_text);
                                                const displayText = plainText
                                                    ? (plainText.length > 18 ? plainText.substring(0, 18) + '...' : plainText)
                                                    : '(ไม่มีโจทย์)';

                                                return (
                                                    <button
                                                        key={qIdx}
                                                        type="button"
                                                        onClick={() => {
                                                            const scrollToQuestion = () => {
                                                                const el = document.getElementById(`question-${idx}-${qIdx}`);
                                                                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                            };
                                                            if (collapsedSituations.has(idx)) {
                                                                onExpandSituation(idx);
                                                                setTimeout(scrollToQuestion, 200);
                                                            } else {
                                                                scrollToQuestion();
                                                            }
                                                        }}
                                                        className="w-full text-left px-2 py-1.5 rounded text-xs text-gray-500 hover:bg-gray-50 hover:text-emerald-600 transition-colors truncate block cursor-pointer"
                                                        title={plainText || '(ไม่มีโจทย์)'}
                                                    >
                                                        <span className="mr-1.5 inline-block min-w-[1.5em] text-gray-400 font-semibold">{questionStartIndex + qIdx + 1}.</span>
                                                        {displayText}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Action Buttons at the bottom of TOC */}
                        {(onAddSituation || onAddStandaloneQuestion) && (
                            <div className="pt-2 mt-2 border-t border-gray-100 sticky bottom-0 bg-white space-y-1">
                                {onAddSituation && (
                                    <button
                                        type="button"
                                        onClick={onAddSituation}
                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        เพิ่มสถานการณ์ใหม่
                                    </button>
                                )}
                                {onAddStandaloneQuestion && (
                                    <button
                                        type="button"
                                        onClick={onAddStandaloneQuestion}
                                        className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium text-xs transition-all shadow-sm active:scale-95 cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        เพิ่มคำถามเดี่ยว
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </motion.div>
    );
}
