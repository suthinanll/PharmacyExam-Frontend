"use client"
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Check, ChevronDown, Plus } from 'lucide-react';

interface Topic {
    topic_id: number;
    topic_name: string;
}

interface SubTopic {
    sub_topic_id: number;
    topic_id: number;
    sub_topic_name: string;
}

interface SubTopicSearchDropdownProps {
    selectedIds: number[];
    topics: Topic[];
    subTopics: SubTopic[];
    onChange: (updatedIds: number[]) => void;
    onOpenAddSubTopicModal?: () => void;
}

export default function SubTopicSearchDropdown({
    selectedIds = [],
    topics = [],
    subTopics = [],
    onChange,
    onOpenAddSubTopicModal,
}: SubTopicSearchDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [mounted, setMounted] = useState(false);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean }>({
        top: 0,
        left: 0,
        width: 0,
        placeAbove: false
    });

    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Calculate fixed screen coordinates for the portal dropdown
    const updatePosition = () => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const estimatedHeight = 320;
        const placeAbove = spaceBelow < estimatedHeight && rect.top > estimatedHeight;

        setCoords({
            top: placeAbove ? rect.top - 6 : rect.bottom + 6,
            left: Math.max(8, rect.left),
            width: Math.min(rect.width, window.innerWidth - 16),
            placeAbove
        });
    };

    useEffect(() => {
        if (isOpen) {
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isOpen]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            if (
                triggerRef.current && !triggerRef.current.contains(target) &&
                menuRef.current && !menuRef.current.contains(target)
            ) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen]);

    // Focus search input on open
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [isOpen]);

    // SubTopic map for fast lookup
    const subTopicMap = useMemo(() => {
        const map = new Map<number, SubTopic>();
        subTopics.forEach(st => map.set(st.sub_topic_id, st));
        return map;
    }, [subTopics]);

    // Filtered and grouped subtopics by Topic
    const groupedResults = useMemo(() => {
        const query = searchTerm.trim().toLowerCase();

        return topics.map(topic => {
            const subsForTopic = subTopics.filter(st => st.topic_id === topic.topic_id);
            const filteredSubs = query
                ? subsForTopic.filter(st =>
                    st.sub_topic_name.toLowerCase().includes(query) ||
                    topic.topic_name.toLowerCase().includes(query)
                )
                : subsForTopic;

            return {
                topic,
                subTopics: filteredSubs
            };
        }).filter(group => group.subTopics.length > 0);
    }, [topics, subTopics, searchTerm]);

    const totalMatchingCount = useMemo(() => {
        return groupedResults.reduce((acc, g) => acc + g.subTopics.length, 0);
    }, [groupedResults]);

    const handleToggle = (subTopicId: number) => {
        if (selectedIds.includes(subTopicId)) {
            onChange(selectedIds.filter(id => id !== subTopicId));
        } else {
            onChange([...selectedIds, subTopicId]);
        }
    };

    const handleRemove = (e: React.MouseEvent, subTopicId: number) => {
        e.stopPropagation();
        onChange(selectedIds.filter(id => id !== subTopicId));
    };

    const handleClearAll = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange([]);
    };

    return (
        <div className="relative space-y-2">
            {/* Header / Action */}
            <div className="flex items-center justify-between">
                <label className="text-base font-medium text-gray-800 flex items-center gap-1.5">
                    <span>หัวข้อย่อย (เลือกได้หลายหัวข้อ)</span>
                    {selectedIds.length > 0 && (
                        <span className="text-sm font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                            {selectedIds.length}
                        </span>
                    )}
                </label>

                {onOpenAddSubTopicModal && (
                    <button
                        type="button"
                        onClick={onOpenAddSubTopicModal}
                        className="text-sm text-green-600 hover:text-green-700 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                    >
                        <Plus className="w-3.5 h-3.5" />
                        เพิ่มหัวข้อย่อยใหม่
                    </button>
                )}
            </div>

            {/* Selected Pills Display */}
            {selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 border border-slate-200/80 rounded-xl min-h-[42px] items-center">
                    {selectedIds.map(id => {
                        const st = subTopicMap.get(id);
                        if (!st) return null;
                        return (
                            <span
                                key={id}
                                className="inline-flex items-center gap-1.5 text-sm font-medium bg-white text-gray-800 px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs group"
                            >
                                <span className="text-green-700 font-medium truncate max-w-[200px]">
                                    {st.sub_topic_name}
                                </span>
                                <button
                                    type="button"
                                    onClick={(e) => handleRemove(e, id)}
                                    aria-label={`ลบหัวข้อย่อย ${st.sub_topic_name}`}
                                    className="text-gray-500 hover:text-red-500 hover:bg-red-50 p-0.5 rounded transition-colors"
                                    title="ลบหัวข้อนี้"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </span>
                        );
                    })}

                    {selectedIds.length > 1 && (
                        <button
                            type="button"
                            onClick={handleClearAll}
                            aria-label="ล้างหัวข้อย่อยทั้งหมด"
                            className="text-sm text-gray-500 hover:text-red-600 hover:bg-white px-2 py-1 rounded-lg transition-colors ml-auto font-medium cursor-pointer"
                        >
                            ล้างทั้งหมด
                        </button>
                    )}
                </div>
            )}

            {/* Dropdown Trigger Box */}
            <div
                ref={triggerRef}
                role="button"
                tabIndex={0}
                aria-haspopup="listbox"
                aria-expanded={isOpen}
                aria-label="เลือกหัวข้อย่อย"
                onClick={() => setIsOpen(!isOpen)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen(!isOpen); } }}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl flex items-center justify-between cursor-pointer transition-all ${isOpen
                        ? 'border-green-500 ring-2 ring-green-100 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
            >
                <div className="flex items-center gap-2 text-sm text-gray-500 truncate min-w-0">
                    <Search className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="truncate">
                        {selectedIds.length === 0
                            ? 'ค้นหาและเลือกหัวข้อย่อย...'
                            : `เลือกแล้ว ${selectedIds.length} หัวข้อย่อย (คลิกเพื่อค้นหาเพิ่ม)`}
                    </span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180 text-green-600' : ''}`} />
            </div>

            {/* Floating Dropdown Menu rendered via Portal into body to break out on top of all stacking contexts */}
            {mounted && isOpen && createPortal(
                <div
                    ref={menuRef}
                    style={{
                        position: 'fixed',
                        top: coords.placeAbove ? undefined : coords.top,
                        bottom: coords.placeAbove ? window.innerHeight - coords.top : undefined,
                        left: coords.left,
                        width: coords.width,
                        zIndex: 99999
                    }}
                    className="bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-80 animate-in fade-in zoom-in-95 duration-150"
                >
                    {/* Search Input Bar */}
                    <div className="p-2.5 border-b border-slate-100 bg-slate-50/70 flex items-center gap-2 shrink-0">
                        <Search className="w-4 h-4 text-gray-400 shrink-0 ml-1" />
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="พิมพ์ชื่อหัวข้อย่อยหรือหัวข้อหลัก..."
                            aria-label="ค้นหาหัวข้อย่อย"
                            className="w-full bg-transparent border-none text-sm text-gray-900 placeholder:text-gray-500 focus:outline-hidden"
                        />
                        {searchTerm && (
                            <button
                                type="button"
                                onClick={() => setSearchTerm('')}
                                aria-label="ล้างคำค้นหาหัวข้อย่อย"
                                className="p-1 text-gray-500 hover:text-gray-700 rounded-md hover:bg-slate-200/60 transition-colors"
                            >
                                <X className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Results List */}
                    <div className="overflow-y-auto p-2 space-y-3 flex-1">
                        {groupedResults.length > 0 ? (
                            groupedResults.map(({ topic, subTopics: groupSubs }) => (
                                <div key={topic.topic_id} className="space-y-1">
                                    {/* Topic Header */}
                                    <div className="px-2.5 py-1 text-sm font-medium text-gray-400  tracking-wider bg-slate-50/80 rounded-lg flex items-center justify-between">
                                        <span className="truncate">{topic.topic_name}</span>
                                        <span className="text-sm text-gray-400 font-normal shrink-0">({groupSubs.length})</span>
                                    </div>

                                    {/* SubTopic Options */}
                                    <div className="space-y-0.5 pt-0.5">
                                        {groupSubs.map(st => {
                                            const isChecked = selectedIds.includes(st.sub_topic_id);
                                            return (
                                                <div
                                                    key={st.sub_topic_id}
                                                    onClick={() => handleToggle(st.sub_topic_id)}
                                                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-sm cursor-pointer transition-colors ${isChecked
                                                            ? 'bg-green-50/70 text-green-900 font-medium'
                                                            : 'text-gray-700 hover:bg-slate-50'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                                        <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 border transition-all ${isChecked
                                                                ? 'bg-green-600 border-green-600 text-white'
                                                                : 'border-slate-300 bg-white'
                                                            }`}>
                                                            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                                                        </div>
                                                        <span className="truncate">{st.sub_topic_name}</span>
                                                    </div>

                                                    {isChecked && (
                                                        <span className="text-sm text-green-600 shrink-0 font-medium">
                                                            เลือกแล้ว
                                                        </span>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-6 text-sm text-gray-400 space-y-2">
                                <p>ไม่พบหัวข้อย่อยที่ตรงกับ "{searchTerm}"</p>
                                {onOpenAddSubTopicModal && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsOpen(false);
                                            onOpenAddSubTopicModal();
                                        }}
                                        className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 font-medium hover:underline cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        สร้างหัวข้อย่อยใหม่
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer helper */}
                    <div className="p-2 border-t border-slate-100 bg-slate-50/80 flex items-center justify-between text-sm text-gray-500 px-3 shrink-0">
                        <span>พบทั้งหมด {totalMatchingCount} รายการ</span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="text-green-600 hover:text-green-700 font-medium cursor-pointer"
                        >
                            เสร็จสิ้น
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
