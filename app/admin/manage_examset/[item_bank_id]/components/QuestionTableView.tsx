'use client';

import React, { useState, useMemo } from 'react';
import ImagePreviewModal from '@/components/ImagePreviewModal';
import {
    CheckCircle,
    X,
    Search,
    Filter,
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    BookOpen,
    Lightbulb,
    Tag,
    BarChart2,
    FileText,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────
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
    sub_topic_ids?: number[];
    irt_a_discrimination?: number;
    irt_b_difficulty?: number;
    irt_c_guessing?: number;
    answer_options: AnswerOption[];
    display_order?: number;
    question_image_url?: string;
}

interface Situation {
    situation_id?: number;
    situation_text: string;
    situation_image_url?: string;
    questions: Question[];
    display_order?: number;
}

interface SubTopic {
    sub_topic_id: number;
    topic_id: number;
    sub_topic_name: string;
}

interface Topic {
    topic_id: number;
    topic_name: string;
}

interface QuestionTableViewProps {
    situations: Situation[];
    subTopics: SubTopic[];
    topics: Topic[];
}

// ─── Flat row type ───────────────────────────────────────────
interface FlatRow {
    globalNum: number;
    sitIdx: number;
    qIdx: number;
    situation: Situation;
    question: Question;
    subTopicName: string;
    topicName: string;
}

const OPTION_LABELS = ['ก', 'ข', 'ค', 'ง', 'จ'];

type SortKey = 'globalNum' | 'sitIdx' | 'subTopicName' | 'irt_b' | 'irt_a' | 'irt_c';
type SortDir = 'asc' | 'desc';

// ─── Difficulty label ────────────────────────────────────────
function difficultyLabel(b?: number): { label: string; color: string } {
    if (b === undefined || b === null) return { label: '-', color: 'text-gray-400' };
    if (b <= -1.5) return { label: 'ง่ายมาก', color: 'text-blue-600' };
    if (b <= -0.5) return { label: 'ง่าย', color: 'text-cyan-600' };
    if (b <= 0.5) return { label: 'ปานกลาง', color: 'text-emerald-600' };
    if (b <= 1.5) return { label: 'ยาก', color: 'text-amber-600' };
    return { label: 'ยากมาก', color: 'text-red-600' };
}

// ─── Detail Modal ────────────────────────────────────────────
function QuestionDetailModal({ row, onClose }: { row: FlatRow; onClose: () => void }) {
    const { question, situation, globalNum, subTopicName, topicName } = row;
    const correctIndex = question.answer_options.findIndex(o => o.is_correct);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                            {globalNum}
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">คำถามที่ {globalNum}</p>
                            {subTopicName && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                    {subTopicName}
                                </span>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-5">
                    {/* Situation */}
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
                        <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="w-4 h-4 text-slate-500" />
                            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                                สถานการณ์ที่ {row.sitIdx + 1}
                            </span>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {situation.situation_text}
                        </p>
                        {situation.situation_image_url && (
                            <img src={situation.situation_image_url} alt="situation" className="mt-3 max-h-48 rounded-lg border border-slate-200" />
                        )}
                    </div>

                    {/* Question Text */}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">โจทย์คำถาม</p>
                        <div
                            className="prose prose-sm max-w-none text-gray-800 font-medium leading-relaxed bg-gray-50 p-4 rounded-xl border border-gray-200"
                            dangerouslySetInnerHTML={{ __html: question.question_text }}
                        />
                        {question.question_image_url && question.question_image_url.trim() !== '' && question.question_image_url !== '-' && (
                            <div className="mt-3">
                                <img
                                    src={question.question_image_url.startsWith("http")
                                        ? question.question_image_url
                                        : `${process.env.NEXT_PUBLIC_API_URL}${question.question_image_url}`}
                                    alt="question"
                                    className="max-h-48 rounded-lg border border-slate-200 bg-white cursor-pointer hover:opacity-90 transition-opacity object-contain"
                                    onClick={() => {
                                        const url = question.question_image_url!.startsWith("http")
                                            ? question.question_image_url!
                                            : `${process.env.NEXT_PUBLIC_API_URL}${question.question_image_url}`;
                                        setPreviewImage(url);
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    {/* Options */}
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">ตัวเลือกคำตอบ</p>
                        <div className="space-y-2">
                            {question.answer_options.map((opt, idx) => (
                                <div
                                    key={idx}
                                    className={`p-3 rounded-xl border transition-colors ${
                                        opt.is_correct
                                            ? 'bg-emerald-50 border-emerald-300'
                                            : 'bg-gray-50 border-gray-200'
                                    }`}
                                >
                                    <div className="flex items-start gap-3">
                                        <span className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                                            opt.is_correct ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-300'
                                        }`}>
                                            {OPTION_LABELS[idx] || idx + 1}
                                        </span>
                                        <div className="flex-1">
                                            {opt.option_text && opt.option_text.trim() !== '' && (
                                                <span className={`text-sm leading-relaxed block ${opt.is_correct ? 'text-emerald-800 font-medium' : 'text-gray-700'}`}>
                                                    {opt.option_text}
                                                </span>
                                            )}
                                            {opt.option_image_url && opt.option_image_url.trim() !== '' && (
                                                <div className={opt.option_text && opt.option_text.trim() !== '' ? "mt-2" : ""}>
                                                    <img
                                                        src={opt.option_image_url.startsWith("http")
                                                            ? opt.option_image_url
                                                            : `${process.env.NEXT_PUBLIC_API_URL}${opt.option_image_url}`}
                                                        alt={`Option ${idx + 1} image`}
                                                        className="max-h-28 rounded-lg border border-gray-200 bg-white cursor-pointer hover:opacity-90 transition-opacity object-contain"
                                                        onClick={() => {
                                                            const url = opt.option_image_url!.startsWith("http")
                                                                ? opt.option_image_url!
                                                                : `${process.env.NEXT_PUBLIC_API_URL}${opt.option_image_url}`;
                                                            setPreviewImage(url);
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                        {opt.is_correct && <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                        <div className="flex gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                            <Lightbulb className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-1">คำอธิบายเฉลย</p>
                                <p className="text-green-800 text-sm leading-relaxed whitespace-pre-wrap">{question.explanation}</p>
                            </div>
                        </div>
                    )}

                    {/* IRT Parameters */}
                    {(question.irt_a_discrimination !== undefined || question.irt_b_difficulty !== undefined) && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <BarChart2 className="w-4 h-4 text-gray-500" />
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">IRT Parameters</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {[
                                    { label: 'a (Discrimination)', value: question.irt_a_discrimination, bgClassName: 'bg-blue-50', borderClassName: 'border-blue-100', textValClassName: 'text-blue-700', textLblClassName: 'text-blue-500' },
                                    { label: 'b (Difficulty)', value: question.irt_b_difficulty, bgClassName: 'bg-purple-50', borderClassName: 'border-purple-100', textValClassName: 'text-purple-700', textLblClassName: 'text-purple-500' },
                                    { label: 'c (Guessing)', value: question.irt_c_guessing, bgClassName: 'bg-orange-50', borderClassName: 'border-orange-100', textValClassName: 'text-orange-700', textLblClassName: 'text-orange-500' },
                                ].map(({ label, value, bgClassName, borderClassName, textValClassName, textLblClassName }) => (
                                    <div key={label} className={`${bgClassName} border ${borderClassName} rounded-xl p-3 text-center`}>
                                        <p className={`text-xl font-bold ${textValClassName}`}>
                                            {value !== undefined && value !== null ? Number(value).toFixed(2) : '-'}
                                        </p>
                                        <p className={`text-xs ${textLblClassName} mt-0.5`}>{label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Sort Icon ───────────────────────────────────────────────
function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
    if (col !== sortKey) return <ChevronsUpDown className="w-3.5 h-3.5 text-gray-300" />;
    return sortDir === 'asc'
        ? <ChevronUp className="w-3.5 h-3.5 text-blue-500" />
        : <ChevronDown className="w-3.5 h-3.5 text-blue-500" />;
}

// ─── Main Component ──────────────────────────────────────────
export default function QuestionTableView({ situations, subTopics, topics }: QuestionTableViewProps) {
    const [selectedRow, setSelectedRow] = useState<FlatRow | null>(null);
    const [search, setSearch] = useState('');
    const [filterSitIdx, setFilterSitIdx] = useState<number | 'all'>('all');
    const [filterSubTopic, setFilterSubTopic] = useState<number | 'all'>('all');
    const [sortKey, setSortKey] = useState<SortKey>('globalNum');
    const [sortDir, setSortDir] = useState<SortDir>('asc');

    // Build flat rows
    const allRows = useMemo<FlatRow[]>(() => {
        const rows: FlatRow[] = [];
        let globalNum = 0;
        situations.forEach((situation, sitIdx) => {
            situation.questions.forEach((question, qIdx) => {
                globalNum++;
                const questionSubTopicIds = question.sub_topic_ids || (question.sub_topic_id ? [question.sub_topic_id] : []);
                const matchedSubTopics = subTopics.filter(s => questionSubTopicIds.includes(s.sub_topic_id));
                const subTopicName = matchedSubTopics.map(s => s.sub_topic_name).join(', ');
                
                const matchedTopicIds = Array.from(new Set(matchedSubTopics.map(s => s.topic_id)));
                const matchedTopics = topics.filter(t => matchedTopicIds.includes(t.topic_id));
                const topicName = matchedTopics.map(t => t.topic_name).join(', ');

                rows.push({
                    globalNum,
                    sitIdx,
                    qIdx,
                    situation,
                    question,
                    subTopicName,
                    topicName,
                });
            });
        });
        return rows;
    }, [situations, subTopics, topics]);

    // Unique sub-topics used
    const usedSubTopics = useMemo(() => {
        const subTopicMap = new Map<number, string>();
        allRows.forEach(row => {
            const questionSubTopicIds = row.question.sub_topic_ids || (row.question.sub_topic_id ? [row.question.sub_topic_id] : []);
            questionSubTopicIds.forEach(id => {
                const st = subTopics.find(s => s.sub_topic_id === id);
                if (st) {
                    subTopicMap.set(id, st.sub_topic_name);
                }
            });
        });
        return Array.from(subTopicMap.entries());
    }, [allRows, subTopics]);

    // Filter + sort
    const rows = useMemo(() => {
        let filtered = allRows;
        if (filterSitIdx !== 'all') filtered = filtered.filter(r => r.sitIdx === filterSitIdx);
        if (filterSubTopic !== 'all') {
            filtered = filtered.filter(r => {
                const questionSubTopicIds = r.question.sub_topic_ids || (r.question.sub_topic_id ? [r.question.sub_topic_id] : []);
                return questionSubTopicIds.includes(filterSubTopic);
            });
        }
        if (search.trim()) {
            const q = search.toLowerCase();
            filtered = filtered.filter(r => r.question.question_text.toLowerCase().includes(q));
        }
        return [...filtered].sort((a, b) => {
            let va: string | number = '';
            let vb: string | number = '';
            switch (sortKey) {
                case 'globalNum': va = a.globalNum; vb = b.globalNum; break;
                case 'sitIdx': va = a.sitIdx; vb = b.sitIdx; break;
                case 'subTopicName': va = a.subTopicName; vb = b.subTopicName; break;
                case 'irt_a': va = a.question.irt_a_discrimination ?? -Infinity; vb = b.question.irt_a_discrimination ?? -Infinity; break;
                case 'irt_b': va = a.question.irt_b_difficulty ?? -Infinity; vb = b.question.irt_b_difficulty ?? -Infinity; break;
                case 'irt_c': va = a.question.irt_c_guessing ?? -Infinity; vb = b.question.irt_c_guessing ?? -Infinity; break;
            }
            if (va < vb) return sortDir === 'asc' ? -1 : 1;
            if (va > vb) return sortDir === 'asc' ? 1 : -1;
            return 0;
        });
    }, [allRows, filterSitIdx, filterSubTopic, search, sortKey, sortDir]);

    const toggleSort = (key: SortKey) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('asc'); }
    };

    const ThBtn = ({ col, label }: { col: SortKey; label: string }) => (
        <button
            onClick={() => toggleSort(col)}
            className="flex items-center gap-1 text-xs font-semibold text-gray-500 uppercase tracking-wide hover:text-gray-700 transition-colors group"
        >
            {label}
            <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
        </button>
    );

    if (allRows.length === 0) {
        return (
            <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-16 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-1">ยังไม่มีคำถาม</h3>
                <p className="text-gray-400 text-sm">กดปุ่ม <span className="text-blue-500 font-medium">แก้ไขข้อมูล</span> เพื่อเพิ่มคำถาม</p>
            </div>
        );
    }

    return (
        <div className="pb-10 space-y-4">
            {/* ── Toolbar ─────────────────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm flex flex-wrap gap-3 items-center">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="ค้นหาโจทย์คำถาม..."
                        className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    />
                </div>

                {/* Filter: Situation */}
                <select
                    value={filterSitIdx === 'all' ? 'all' : String(filterSitIdx)}
                    onChange={e => setFilterSitIdx(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                    className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                >
                    <option value="all">ทุกสถานการณ์</option>
                    {situations.map((_, i) => (
                        <option key={i} value={i}>สถานการณ์ที่ {i + 1}</option>
                    ))}
                </select>

                {/* Filter: SubTopic */}
                {usedSubTopics.length > 0 && (
                    <select
                        value={filterSubTopic === 'all' ? 'all' : String(filterSubTopic)}
                        onChange={e => setFilterSubTopic(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                        className="text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                    >
                        <option value="all">ทุกหัวข้อย่อย</option>
                        {usedSubTopics.map(([id, name]) => (
                            <option key={id} value={id as number}>{name}</option>
                        ))}
                    </select>
                )}

                <span className="text-xs text-gray-400 ml-auto whitespace-nowrap">
                    แสดง <strong className="text-gray-700">{rows.length}</strong> / {allRows.length} ข้อ
                </span>
            </div>

            {/* ── Table ───────────────────────────────────────── */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-3 text-left w-12">
                                    <ThBtn col="globalNum" label="#" />
                                </th>
                                <th className="px-3 py-3 text-left w-20">
                                    <ThBtn col="sitIdx" label="สถานการณ์" />
                                </th>
                                <th className="px-4 py-3 text-left">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">โจทย์คำถาม</span>
                                </th>
                                <th className="px-3 py-3 text-left w-36">
                                    <ThBtn col="subTopicName" label="หัวข้อย่อย" />
                                </th>
                                <th className="px-3 py-3 text-center w-16">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">เฉลย</span>
                                </th>
                                <th className="px-3 py-3 text-center w-16">
                                    <ThBtn col="irt_a" label="a" />
                                </th>
                                <th className="px-3 py-3 text-center w-16">
                                    <ThBtn col="irt_b" label="b" />
                                </th>
                                <th className="px-3 py-3 text-center w-16">
                                    <ThBtn col="irt_c" label="c" />
                                </th>
                                <th className="px-3 py-3 text-center w-20">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">ระดับ</span>
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {rows.map((row) => {
                                const { question, globalNum, sitIdx, subTopicName } = row;
                                const correctIdx = question.answer_options.findIndex(o => o.is_correct);
                                const diff = difficultyLabel(question.irt_b_difficulty);

                                return (
                                    <tr
                                        key={`${sitIdx}-${row.qIdx}`}
                                        onClick={() => setSelectedRow(row)}
                                        className="hover:bg-blue-50/50 cursor-pointer transition-colors group"
                                    >
                                        {/* # */}
                                        <td className="px-4 py-3">
                                            <div className="w-7 h-7 rounded-full bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center text-xs font-bold text-gray-600 group-hover:text-blue-700 transition-colors">
                                                {globalNum}
                                            </div>
                                        </td>

                                        {/* สถานการณ์ */}
                                        <td className="px-3 py-3">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-600">
                                                #{sitIdx + 1}
                                            </span>
                                        </td>

                                        {/* โจทย์ */}
                                        <td className="px-4 py-3 max-w-xs">
                                            {question.question_text ? (
                                                <div
                                                    className="text-gray-800 line-clamp-2 text-sm leading-relaxed"
                                                    dangerouslySetInnerHTML={{ __html: question.question_text }}
                                                />
                                            ) : (
                                                <span className="text-gray-400 italic">ไม่มีโจทย์</span>
                                            )}
                                        </td>

                                        {/* หัวข้อย่อย */}
                                        <td className="px-3 py-3">
                                            {subTopicName ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 line-clamp-1">
                                                    <Tag className="w-3 h-3 shrink-0" />
                                                    {subTopicName}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 text-xs">-</span>
                                            )}
                                        </td>

                                        {/* เฉลย */}
                                        <td className="px-3 py-3 text-center">
                                            {correctIdx >= 0 ? (
                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-emerald-500 text-white font-bold text-xs">
                                                    {OPTION_LABELS[correctIdx] || correctIdx + 1}
                                                </span>
                                            ) : (
                                                <span className="text-gray-300 text-xs">-</span>
                                            )}
                                        </td>

                                        {/* IRT a */}
                                        <td className="px-3 py-3 text-center">
                                            <span className="text-xs text-blue-700">
                                                {question.irt_a_discrimination != null ? Number(question.irt_a_discrimination).toFixed(2) : <span className="text-gray-300">-</span>}
                                            </span>
                                        </td>

                                        {/* IRT b */}
                                        <td className="px-3 py-3 text-center">
                                            <span className="text-xs text-purple-700">
                                                {question.irt_b_difficulty != null ? Number(question.irt_b_difficulty).toFixed(2) : <span className="text-gray-300">-</span>}
                                            </span>
                                        </td>

                                        {/* IRT c */}
                                        <td className="px-3 py-3 text-center">
                                            <span className="text-xs text-orange-600">
                                                {question.irt_c_guessing != null ? Number(question.irt_c_guessing).toFixed(2) : <span className="text-gray-300">-</span>}
                                            </span>
                                        </td>

                                        {/* Level */}
                                        <td className="px-3 py-3 text-center">
                                            <span className={`text-xs font-semibold ${diff.color}`}>
                                                {diff.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {rows.length === 0 && (
                    <div className="py-16 text-center text-gray-400 text-sm">
                        ไม่พบคำถามที่ตรงกับเงื่อนไขการค้นหา
                    </div>
                )}
            </div>

            {/* ── Detail Modal ─────────────────────────────────── */}
            {selectedRow && (
                <QuestionDetailModal row={selectedRow} onClose={() => setSelectedRow(null)} />
            )}
        </div>
    );
}
