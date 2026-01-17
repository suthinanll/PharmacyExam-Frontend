import React, { useState, useEffect } from 'react';
import { List, ChevronRight, ChevronDown } from 'lucide-react';

interface Situation {
    questions: any[];
}

interface TableOfContentsProps {
    situations: Situation[];
    activeSituationIndex: number;
    showTOC: boolean;
    setShowTOC: (show: boolean) => void;
    scrollToSituation: (index: number) => void;
}

export default function TableOfContents({
    situations,
    activeSituationIndex,
    showTOC,
    setShowTOC,
    scrollToSituation
}: TableOfContentsProps) {
    // State to track expanded situations in TOC
    const [expandedSituations, setExpandedSituations] = useState<Set<number>>(new Set([0]));

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

    if (situations.length === 0) return null;

    return (
        <div className="fixed right-4 top-28 z-50 flex flex-col items-end gap-2 transition-all">
            {/* Toggle Button */}
            <button
                type="button"
                onClick={() => setShowTOC(!showTOC)}
                className={`bg-white p-2.5 rounded-full shadow-lg border border-gray-200 text-gray-600 hover:text-green-600 hover:border-green-200 transition-all active:scale-95`}
                title={showTOC ? "ซ่อนสารบัญ" : "แสดงสารบัญ"}
            >
                {showTOC ? <ChevronRight className="w-5 h-5" /> : <List className="w-5 h-5" />}
            </button>

            {/* Content List */}
            {showTOC && (
                <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-56 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200">
                    <div className="p-3 bg-gray-50 border-b border-gray-200 font-semibold text-gray-700 text-sm flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <List className="w-4 h-4" />
                            <span>สารบัญ</span>
                        </div>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
                        {situations.map((situation, idx) => {
                            const questionStartIndex = situations.slice(0, idx).reduce((acc, s) => acc + s.questions.length, 0);
                            const isExpanded = expandedSituations.has(idx);

                            return (
                                <div key={idx} className="space-y-1">
                                    <div className={`flex items-center w-full rounded-lg transition-colors pr-2 ${activeSituationIndex === idx
                                        ? 'bg-green-50 text-green-700'
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
                                            className="flex-1 text-left py-2 text-sm font-medium truncate"
                                        >
                                            สถานการณ์ที่ {idx + 1}
                                        </button>
                                    </div>

                                    {/* Questions Sub-list */}
                                    {isExpanded && situation.questions && situation.questions.length > 0 && (
                                        <div className="ml-4 pl-2 border-l-2 border-gray-100 space-y-0.5 mb-2">
                                            {situation.questions.map((q, qIdx) => (
                                                <button
                                                    key={qIdx}
                                                    type="button"
                                                    onClick={() => {
                                                        const el = document.getElementById(`question-${idx}-${qIdx}`);
                                                        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                    }}
                                                    className="w-full text-left px-2 py-1.5 rounded text-xs text-gray-500 hover:bg-gray-50 hover:text-green-600 transition-colors truncate block"
                                                    title={q.question_text}
                                                >
                                                    <span className="mr-1.5 inline-block min-w-[1.5em] text-gray-400">{questionStartIndex + qIdx + 1}.</span>
                                                    {q.question_text ? q.question_text.substring(0, 18) + (q.question_text.length > 18 ? '...' : '') : '(ไม่มีโจทย์)'}
                                                </button>
                                            ))}
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
}
