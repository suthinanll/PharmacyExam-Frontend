'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar_admin from "@/components/Navbar_admin";
import { useParams, useRouter } from 'next/navigation';
import { Plus, Trash2, Save, FileText, AlertCircle, ChevronLeft, ChevronRight, Loader2, ChevronDown, ChevronUp, ArrowUp, ArrowDown, ArrowLeft, Settings, Clock, Calendar, CheckCircle, XCircle, Tag, Layers, X, List, HelpCircle, LayoutList, TableProperties } from 'lucide-react';
import Swal from "@/utils/sweetalert";
import Link from 'next/link';
import { div } from 'framer-motion/client';
import TableOfContents from './components/TableOfContents';
import ItemBankHeader from './components/ItemBankHeader';
import AddSubTopicModal from './components/AddSubTopicModal';
import SubTopicSearchDropdown from './components/SubTopicSearchDropdown';
import SituationViewer from './components/SituationViewer';
import QuestionTableView from './components/QuestionTableView';
import CATGuideModal from '../../cat_management/components/CATGuideModal';
import DashboardView from './components/DashboardView';
import SettingsModal from './components/SettingsModal';
import ImportExcelModal from './components/ImportExcelModal';
import { useAuth } from "@/contexts/AuthContext";
import TiptapEditor from '@/components/TiptapEditor';
import { formatScientificText } from '@/utils/formatText';
import { sanitizeHtml } from "@/utils/sanitize";

// Types
interface AnswerOption {
    option_id?: number;
    option_text: string;
    is_correct: boolean;
}

interface Question {
    item_id?: number;
    question_text: string;
    question_image_url?: string;
    explanation: string;
    sub_topic_id?: number;
    sub_topic_ids?: number[];
    irt_a_discrimination?: number;
    irt_b_difficulty?: number;
    irt_c_guessing?: number;
    answer_options: AnswerOption[];
    display_order?: number;
}

interface Situation {
    situation_id?: number;
    temporary_id?: string; // Unique ID for React key management
    situation_text: string;
    situation_image_url?: string;
    display_order?: number;
    is_standalone?: boolean;
    questions: Question[];
}

interface Topic {
    topic_id: number;
    topic_name: string;
}

interface SubTopic {
    sub_topic_id: number;
    topic_id: number;
    sub_topic_name: string;
}

interface ItemBankDetails {
    item_bank_id: number;
    bank_name: string;
    description: string;
    duration: number;
    is_active: boolean;
    created_at: string;
    categories: {
        category_id: number;
        category_name: string;
    }[];
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function ItemBankEditPage() {
    const params = useParams();
    const router = useRouter();
    const { getToken } = useAuth();
    
    // Resolve itemBankId from params or sessionStorage (เหมือนหน้า user/examset/take-exam)
    const [itemBankId, setItemBankId] = useState<string | null>(() => {
        if (params?.item_bank_id) return params.item_bank_id as string;
        if (typeof window !== 'undefined') {
            return sessionStorage.getItem('selected_item_bank_id');
        }
        return null;
    });

    const [situations, setSituations] = useState<Situation[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
    const [itemBankInfo, setItemBankInfo] = useState<ItemBankDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [collapsedSituations, setCollapsedSituations] = useState<Set<number>>(new Set());
    const [collapsedQuestions, setCollapsedQuestions] = useState<Set<string>>(new Set());
    const initialSituationsHash = useRef<string>(JSON.stringify([]));

    // States for Add SubTopic Modal
    const [showAddSubTopicModal, setShowAddSubTopicModal] = useState(false);
    const [newSubTopicName, setNewSubTopicName] = useState('');
    const [newSubTopicTopicId, setNewSubTopicTopicId] = useState<number | ''>('');
    const [addingSubTopic, setAddingSubTopic] = useState(false);

    // Editing State
    const [viewMode, setViewMode] = useState<'dashboard' | 'editor'>('dashboard');
    const [isEditing, setIsEditing] = useState(false); // Default to view-only, must click edit button to edit
    const [readViewMode, setReadViewMode] = useState<'accordion' | 'table'>('accordion');
    const [editViewMode, setEditViewMode] = useState<'accordion' | 'card'>('accordion');
    const [expandedCardIndex, setExpandedCardIndex] = useState<number | null>(null);

    // States for TOC
    const [activeSituationIndex, setActiveSituationIndex] = useState<number>(0);
    const [showTOC, setShowTOC] = useState(true);
    const situationRefs = useRef<(HTMLDivElement | null)[]>([]);

    // State for CAT Guide Modal
    const [showCATGuide, setShowCATGuide] = useState(false);

    // State for Settings Modal
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // State for Import Excel Modal
    const [showImportExcelModal, setShowImportExcelModal] = useState(false);

    // Ref to track if data has been initially loaded to avoid autosaving initial fetch
    const isInitialLoad = useRef(true);
    const hasUnsavedChanges = useRef(false);
    const hasInitialized = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI PDF Upload State
    const [uploadingPdf, setUploadingPdf] = useState(false);

    // Sync itemBankId from sessionStorage or params
    useEffect(() => {
        if (params?.item_bank_id) {
            const pid = params.item_bank_id as string;
            setItemBankId(pid);
            if (typeof window !== 'undefined') {
                sessionStorage.setItem('selected_item_bank_id', pid);
            }
        } else if (typeof window !== 'undefined') {
            const storedId = sessionStorage.getItem('selected_item_bank_id');
            if (storedId) {
                setItemBankId(storedId);
            } else {
                router.push('/admin/manage_examset');
            }
        }
    }, [params, router]);

    useEffect(() => {
        if (itemBankId) {
            initData();
        }

        // Beforeunload listener
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (hasUnsavedChanges.current) {
                e.preventDefault();
                e.returnValue = '';
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [itemBankId]);

    const initialSituationHashes = useRef<Map<number, string>>(new Map());
    const initialQuestionHashes = useRef<Map<number, string>>(new Map());

    // Helper to check if HTML text is truly empty
    const isContentEmpty = (htmlOrText?: string) => {
        if (!htmlOrText) return true;
        return htmlOrText.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim() === '';
    };

    const getSituationHash = (sit: Situation) => {
        return JSON.stringify({
            situation_text: (sit.situation_text || '').trim(),
            situation_image_url: (sit.situation_image_url || '').trim()
        });
    };

    const getQuestionHash = (q: Question) => {
        return JSON.stringify({
            question_text: (q.question_text || '').trim(),
            question_image_url: (q.question_image_url || '').trim(),
            explanation: (q.explanation || '').trim(),
            sub_topic_ids: (q.sub_topic_ids || []).slice().sort(),
            irt_a_discrimination: q.irt_a_discrimination != null ? Number(q.irt_a_discrimination) : null,
            irt_b_difficulty: q.irt_b_difficulty != null ? Number(q.irt_b_difficulty) : null,
            irt_c_guessing: q.irt_c_guessing != null ? Number(q.irt_c_guessing) : null,
            answer_options: (q.answer_options || []).map(opt => ({
                option_text: (opt.option_text || '').trim(),
                is_correct: Boolean(opt.is_correct)
            }))
        });
    };

    // Helper to check if a situation or standalone question has actual user-entered content
    const isSituationMeaningful = (sit: Situation) => {
        if (sit.situation_id) return true;
        if (!isContentEmpty(sit.situation_text) || (sit.situation_image_url && sit.situation_image_url.trim() !== '')) {
            return true;
        }
        return sit.questions.some(q =>
            q.item_id ||
            !isContentEmpty(q.question_text) ||
            (q.question_image_url && q.question_image_url.trim() !== '') ||
            !isContentEmpty(q.explanation) ||
            q.answer_options.some(opt => !isContentEmpty(opt.option_text))
        );
    };

    // Cleanup draft on success is handled in handleSubmit
    // Save draft when situations change (only if meaningful content exists)
    useEffect(() => {
        if (!loading && !isInitialLoad.current && itemBankId) {
            const currentHash = JSON.stringify(situations);
            const draftKey = `item_bank_draft_${itemBankId}`;

            // Check if any new item has actual content or existing items were modified
            const hasMeaningfulChanges = situations.some(sit => isSituationMeaningful(sit));

            if (initialSituationsHash.current !== currentHash && hasMeaningfulChanges) {
                // Verify if all new items aren't just blank placeholders
                const newItems = situations.filter(sit => !sit.situation_id);
                const hasRealNewContent = newItems.some(isSituationMeaningful);
                const hasModifiedExisting = situations.some(sit => sit.situation_id);

                if (hasRealNewContent || hasModifiedExisting) {
                    localStorage.setItem(draftKey, currentHash);
                    hasUnsavedChanges.current = true;
                } else {
                    localStorage.removeItem(draftKey);
                    hasUnsavedChanges.current = false;
                }
            } else if (!hasMeaningfulChanges || initialSituationsHash.current === currentHash) {
                localStorage.removeItem(draftKey);
                hasUnsavedChanges.current = false;
            }
        }
    }, [situations, loading, itemBankId]);

    const initData = async () => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        setLoading(true);
        await Promise.all([
            fetchItemBankInfo(),
            fetchSubTopics(),
            fetchExistingItems()
        ]);

        // Check for local draft
        const draftKey = `item_bank_draft_${itemBankId}`;
        const savedDraft = localStorage.getItem(draftKey);

        if (savedDraft) {
            try {
                const parsedDraft: Situation[] = JSON.parse(savedDraft);
                // Filter out empty/blank situations that have no content
                const meaningfulDraft = Array.isArray(parsedDraft) ? parsedDraft.filter(isSituationMeaningful) : [];

                if (meaningfulDraft.length === 0 || JSON.stringify(meaningfulDraft) === initialSituationsHash.current) {
                    localStorage.removeItem(draftKey);
                } else {
                    const result = await Swal.fire({
                        title: 'พบข้อมูลที่ยังไม่ได้บันทึก',
                        text: 'คุณต้องการกู้คืนข้อมูลล่าสุดที่แก้ไขค้างไว้หรือไม่?',
                        icon: 'info',
                        showCancelButton: true,
                        confirmButtonColor: '#16a34a',
                        cancelButtonColor: '#6b7280',
                        confirmButtonText: 'กู้คืนข้อมูล',
                        cancelButtonText: 'ละทิ้งฉบับร่าง'
                    });

                    if (result.isConfirmed) {
                        setSituations(parsedDraft);
                        hasUnsavedChanges.current = true;
                        setViewMode('editor');

                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'success',
                            title: 'กู้คืนข้อมูลสำเร็จ',
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true
                        });

                        setTimeout(() => {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }, 500);
                    } else if (result.dismiss === Swal.DismissReason.cancel as any) {
                        localStorage.removeItem(draftKey);
                        hasUnsavedChanges.current = false;

                        Swal.fire({
                            toast: true,
                            position: 'top-end',
                            icon: 'info',
                            title: 'ละทิ้งฉบับร่างแล้ว',
                            showConfirmButton: false,
                            timer: 2000,
                            timerProgressBar: true
                        });
                    }
                }
            } catch (e) {
                console.error('Error parsing draft:', e);
                localStorage.removeItem(draftKey);
            }
        }

        setLoading(false);
        isInitialLoad.current = false;
    };

    const fetchItemBankInfo = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/items-bank/${itemBankId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setItemBankInfo(data);
            }
        } catch (error) {
            console.error('Error fetching item bank info:', error);
        }
    };

    const fetchSubTopics = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/topics/sub-topics`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setTopics(data.topics || []);
                setSubTopics(data.sub_topics || []);
            }
        } catch (error) {
            console.error('Error fetching sub topics:', error);
        }
    };

    const fetchExistingItems = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/items-bank/${itemBankId}/items`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                const situationsMap = new Map<number, Situation>();
                // standalone items (situation === null) — each gets its own wrapper
                const standaloneItems: Situation[] = [];

                if (data.items && Array.isArray(data.items)) {
                    data.items.forEach((item: any) => {
                        if (item.situation) {
                            const sitId = item.situation.situation_id;
                            const itemOrder = item.display_order ?? 0;

                            if (!situationsMap.has(sitId)) {
                                situationsMap.set(sitId, {
                                    situation_id: sitId,
                                    temporary_id: `existing_${sitId}`,
                                    situation_text: item.situation.situation_text,
                                    situation_image_url: item.situation.situation_image_url,
                                    is_standalone: false,
                                    questions: [],
                                    // ใช้ display_order ของ item แรกใน situation (จาก item_bank_items)
                                    // เพื่อให้ sort บน scale เดียวกับ standalone items
                                    display_order: itemOrder
                                });
                            } else {
                                // ถ้า item นี้มี display_order น้อยกว่า ให้ใช้แทน (เอา minimum)
                                const existing = situationsMap.get(sitId)!;
                                if (itemOrder < (existing.display_order ?? 0)) {
                                    existing.display_order = itemOrder;
                                }
                            }

                            situationsMap.get(sitId)!.questions.push({
                                item_id: item.item_id,
                                question_text: item.question_text,
                                question_image_url: item.question_image_url || '',
                                explanation: item.explanation,
                                sub_topic_id: item.sub_topics?.[0]?.sub_topic_id,
                                sub_topic_ids: item.sub_topics?.map((st: { sub_topic_id: number }) => st.sub_topic_id) || [],
                                irt_a_discrimination: item.irt_a_discrimination,
                                irt_b_difficulty: item.irt_b_difficulty,
                                irt_c_guessing: item.irt_c_guessing,
                                answer_options: item.answer_options || [],
                                display_order: item.display_order
                            });
                        } else {
                            // standalone question — ไม่มี situation ให้ wrap เป็น Situation ว่าง
                            standaloneItems.push({
                                temporary_id: `existing_standalone_${item.item_id}`,
                                situation_text: '',
                                situation_image_url: '',
                                is_standalone: true,
                                questions: [{
                                    item_id: item.item_id,
                                    question_text: item.question_text,
                                    question_image_url: item.question_image_url || '',
                                    explanation: item.explanation,
                                    sub_topic_id: item.sub_topics?.[0]?.sub_topic_id,
                                    sub_topic_ids: item.sub_topics?.map((st: { sub_topic_id: number }) => st.sub_topic_id) || [],
                                    irt_a_discrimination: item.irt_a_discrimination,
                                    irt_b_difficulty: item.irt_b_difficulty,
                                    irt_c_guessing: item.irt_c_guessing,
                                    answer_options: item.answer_options || [],
                                    display_order: item.display_order
                                }],
                                // ใช้ display_order จาก item_bank_items ตรงๆ (scale เดียวกับ situation groups)
                                display_order: item.display_order ?? 0
                            });
                        }
                    });
                }

                // เรียงทุก group รวมกันตาม display_order จาก item_bank_items (scale เดียวกัน)
                const sortedSituations = [
                    ...Array.from(situationsMap.values()),
                    ...standaloneItems
                ].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));

                setSituations(sortedSituations);
                initialSituationsHash.current = JSON.stringify(sortedSituations);

                // Store baseline hashes for precise change detection
                initialSituationHashes.current.clear();
                initialQuestionHashes.current.clear();
                sortedSituations.forEach(sit => {
                    if (sit.situation_id) {
                        initialSituationHashes.current.set(sit.situation_id, getSituationHash(sit));
                    }
                    sit.questions.forEach(q => {
                        if (q.item_id) {
                            initialQuestionHashes.current.set(q.item_id, getQuestionHash(q));
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Error fetching existing items:', error);
        }
    };

    const handleExcelImportSuccess = async () => {
        setLoading(true);
        const draftKey = `item_bank_draft_${itemBankId}`;
        localStorage.removeItem(draftKey);
        await Promise.all([
            fetchItemBankInfo(),
            fetchExistingItems(),
            fetchSubTopics(),
        ]);
        setLoading(false);
    };

    const addSituation = () => {
        const newSituation: Situation = {
            temporary_id: `temp_situation_${Date.now()}_${Math.random()}`,
            situation_text: '',
            situation_image_url: '',
            is_standalone: false,
            questions: [
                {
                    question_text: '',
                    explanation: '',
                    answer_options: [
                        { option_text: '', is_correct: true },
                        { option_text: '', is_correct: false },
                        { option_text: '', is_correct: false },
                        { option_text: '', is_correct: false },
                        { option_text: '', is_correct: false },
                    ],
                    sub_topic_ids: []
                }
            ]
        };
        const newSituations = [...situations, newSituation];
        setSituations(newSituations);

        // Scroll to the new situation
        setTimeout(() => {
            const index = newSituations.length - 1;
            const element = situationRefs.current[index];
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }, 100);
    };

    const addStandaloneQuestion = () => {
        const newStandaloneSituation: Situation = {
            temporary_id: `temp_standalone_${Date.now()}_${Math.random()}`,
            situation_text: '',
            situation_image_url: '',
            is_standalone: true,
            questions: [
                {
                    question_text: '',
                    explanation: '',
                    answer_options: [
                        { option_text: '', is_correct: true },
                        { option_text: '', is_correct: false },
                        { option_text: '', is_correct: false },
                        { option_text: '', is_correct: false },
                        { option_text: '', is_correct: false },
                    ],
                    sub_topic_ids: []
                }
            ]
        };
        const newSituations = [...situations, newStandaloneSituation];
        setSituations(newSituations);

        setTimeout(() => {
            const index = newSituations.length - 1;
            const element = situationRefs.current[index];
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const removeSituation = async (index: number) => {
        const situation = situations[index];

        const result = await Swal.fire({
            title: 'คุณแน่ใจหรือไม่?',
            html: `ต้องการลบสถานการณ์นี้ใช่หรือไม่?<br/>${situation.situation_id ? '<span class="text-red-600">จะลบออกจากฐานข้อมูลทันที พร้อมคำถามทั้งหมด</span>' : ''}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        if (situation.situation_id) {
            try {
                const token = getToken();
                const response = await fetch(`${API_URL}/items-bank/situation/${situation.situation_id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include'
                });

                if (response.ok) {
                    const result = await response.json();
                    await Swal.fire({
                        title: 'ลบสำเร็จ!',
                        text: `ลบคำถามทั้งหมด ${result.deleted_items} ข้อ`,
                        icon: 'success',
                        confirmButtonColor: '#22c55e'
                    });
                    setSituations(situations.filter((_, i) => i !== index));
                } else {
                    throw new Error('ไม่สามารถลบได้');
                }
            } catch (error) {
                console.error('Error deleting situation:', error);
                Swal.fire({
                    title: 'เกิดข้อผิดพลาด',
                    text: 'เกิดข้อผิดพลาดในการลบสถานการณ์',
                    icon: 'error',
                    confirmButtonColor: '#ef4444'
                });
            }
        } else {
            setSituations(situations.filter((_, i) => i !== index));
        }
    };

    const updateSituation = (index: number, field: keyof Situation, value: any) => {
        const newSituations = [...situations];
        newSituations[index] = { ...newSituations[index], [field]: value };
        setSituations(newSituations);
    };

    const addQuestion = (situationIndex: number) => {
        const newQuestion: Question = {
            question_text: '',
            explanation: '',
            answer_options: [
                { option_text: '', is_correct: true },
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
            ],
            sub_topic_ids: []
        };
        const newSituations = [...situations];
        newSituations[situationIndex].questions.push(newQuestion);
        setSituations(newSituations);

        // Scroll to the new question
        setTimeout(() => {
            const qIdx = newSituations[situationIndex].questions.length - 1;
            const element = document.getElementById(`question-${situationIndex}-${qIdx}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 100);
    };

    const removeQuestion = async (situationIndex: number, questionIndex: number) => {
        const question = situations[situationIndex].questions[questionIndex];

        const result = await Swal.fire({
            title: 'คุณแน่ใจหรือไม่?',
            text: 'ต้องการลบคำถามนี้หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        try {
            // ถ้าคำถามมี item_id แสดงว่าเป็นคำถามที่บันทึกแล้ว ต้องลบจากฐานข้อมูล
            if (question.item_id) {
                const token = getToken();
                const response = await fetch(`${API_URL}/items-bank/item/${question.item_id}`, {
                    method: 'DELETE',
                    credentials: 'include',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'ไม่สามารถลบคำถามได้');
                }

                await Swal.fire({
                    icon: 'success',
                    title: 'ลบสำเร็จ!',
                    text: 'ลบคำถามเรียบร้อยแล้ว',
                    timer: 1500,
                    showConfirmButton: false
                });
            }

            // ลบออกจาก state
            const newSituations = [...situations];
            newSituations[situationIndex].questions = newSituations[situationIndex].questions.filter((_, i) => i !== questionIndex);
            setSituations(newSituations);

        } catch (error: any) {
            console.error('Error deleting question:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถลบคำถามได้'
            });
        }
    };

    const updateQuestion = (situationIndex: number, questionIndex: number, field: keyof Question, value: any) => {
        const newSituations = [...situations];
        newSituations[situationIndex].questions[questionIndex] = {
            ...newSituations[situationIndex].questions[questionIndex],
            [field]: value
        };
        setSituations(newSituations);
    };

    const updateAnswerOption = (situationIndex: number, questionIndex: number, optionIndex: number, field: keyof AnswerOption, value: any) => {
        const newSituations = [...situations];
        const options = [...newSituations[situationIndex].questions[questionIndex].answer_options];

        if (field === 'is_correct' && value === true) {
            options.forEach((opt, idx) => {
                opt.is_correct = idx === optionIndex;
            });
        } else {
            options[optionIndex] = { ...options[optionIndex], [field]: value };
        }

        newSituations[situationIndex].questions[questionIndex].answer_options = options;
        setSituations(newSituations);
    };

    const moveSituation = (index: number, direction: 'up' | 'down') => {
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= situations.length) return;

        const newSituations = [...situations];
        [newSituations[index], newSituations[newIndex]] = [newSituations[newIndex], newSituations[index]];
        setSituations(newSituations);
    };

    const moveQuestion = (situationIndex: number, questionIndex: number, direction: 'up' | 'down') => {
        const newQuestionIndex = direction === 'up' ? questionIndex - 1 : questionIndex + 1;
        const questions = situations[situationIndex].questions;
        if (newQuestionIndex < 0 || newQuestionIndex >= questions.length) return;

        const newSituations = [...situations];
        const newQuestions = [...questions];
        [newQuestions[questionIndex], newQuestions[newQuestionIndex]] = [newQuestions[newQuestionIndex], newQuestions[questionIndex]];
        newSituations[situationIndex].questions = newQuestions;
        setSituations(newSituations);
    };

    const toggleSituationCollapse = (index: number) => {
        const newCollapsed = new Set(collapsedSituations);
        if (newCollapsed.has(index)) {
            newCollapsed.delete(index);
        } else {
            newCollapsed.add(index);
        }
        setCollapsedSituations(newCollapsed);
    };

    const toggleQuestionCollapse = (sitIdx: number, qIdx: number) => {
        const key = `${sitIdx}-${qIdx}`;
        const newCollapsed = new Set(collapsedQuestions);
        if (newCollapsed.has(key)) {
            newCollapsed.delete(key);
        } else {
            newCollapsed.add(key);
        }
        setCollapsedQuestions(newCollapsed);
    };

    const collapseAllSituations = () => {
        setCollapsedSituations(new Set(situations.map((_, i) => i)));
    };

    const expandAllSituations = () => {
        setCollapsedSituations(new Set());
    };

    const expandSituation = (index: number) => {
        setCollapsedSituations(prev => {
            const next = new Set(prev);
            next.delete(index);
            return next;
        });
    };

    const handleCancel = async () => {
        if (hasUnsavedChanges.current) {
            const result = await Swal.fire({
                title: 'ยืนยันการยกเลิก?',
                text: 'การเปลี่ยนแปลงที่ยังไม่ได้บันทึกจะสูญหาย คุณแน่ใจหรือไม่?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#6b7280',
                cancelButtonColor: '#ef4444',
                confirmButtonText: 'ใช่, ทิ้งการแก้ไข',
                cancelButtonText: 'กลับไปแก้ไข',
                reverseButtons: true
            });

            if (!result.isConfirmed) return;
        }

        // 1. Disable autosave and set loading
        isInitialLoad.current = true;
        setLoading(true);

        // 2. Clear local draft
        const draftKey = `item_bank_draft_${itemBankId}`;
        localStorage.removeItem(draftKey);
        hasUnsavedChanges.current = false;

        // 3. Re-fetch data to revert state
        try {
            await Promise.all([
                fetchItemBankInfo(),
                fetchExistingItems()
            ]);

            // 4. Exit edit mode
            setIsEditing(false);
        } catch (error) {
            console.error('Error reverting changes:', error);
        } finally {
            setLoading(false);
            // 5. Re-enable autosave after a short delay
            setTimeout(() => {
                isInitialLoad.current = false;
            }, 500);
        }
    };

    const handleUploadPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf') {
            Swal.fire({
                title: 'ไฟล์ไม่ถูกต้อง',
                text: 'กรุณาอัปโหลดไฟล์ PDF เท่านั้น',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
            return;
        }

        setUploadingPdf(true);
        Swal.fire({
            title: 'กำลังสกัดข้อสอบด้วย AI...',
            text: 'ระบบกำลังอ่านไฟล์ PDF และดึงข้อมูลข้อสอบที่มีไฮไลท์สีเหลือง กรุณารอสักครู่',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        try {
            const formData = new FormData();
            formData.append('file', file);

            const token = getToken();
            const response = await fetch(`${API_URL}/items-bank/${itemBankId}/upload-pdf`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (response.ok) {
                const result = await response.json();

                await Swal.fire({
                    title: 'สำเร็จ!',
                    text: `สกัดข้อสอบสำเร็จทั้งหมด ${result.items_count} ข้อ`,
                    icon: 'success',
                    confirmButtonColor: '#22c55e'
                });

                // Refresh data
                await fetchExistingItems();

                // Switch to editor if not already
                if (!isEditing) {
                    setIsEditing(true);
                    setViewMode('editor');
                }
            } else {
                let errorMsg = 'ไม่สามารถสกัดข้อสอบได้';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch (e) {
                    errorMsg = `เกิดข้อผิดพลาดจากเซิร์ฟเวอร์ (Status: ${response.status})`;
                }
                throw new Error(errorMsg);
            }
        } catch (error: any) {
            console.error('Error uploading PDF:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถสกัดข้อสอบได้ กรุณาลองใหม่อีกครั้ง',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setUploadingPdf(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (situations.length === 0) {
            Swal.fire({
                title: 'กรุณาเพิ่มข้อมูล',
                text: 'กรุณาเพิ่มสถานการณ์หรือคำถามอย่างน้อย 1 รายการ',
                icon: 'warning',
                confirmButtonColor: '#16a34a'
            });
            return;
        }

        // Validation
        let sitCount = 0;
        for (let i = 0; i < situations.length; i++) {
            const sit = situations[i];
            const isSituation = sit.is_standalone !== true;
            if (isSituation) {
                sitCount++;
            }
            const sitNumber = isSituation ? sitCount : 0;
            const questionStartIndex = situations.slice(0, i).reduce((acc, s) => acc + s.questions.length, 0);

            const hasSituationContent = Boolean(
                (sit.situation_text && sit.situation_text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim() !== '') ||
                (sit.situation_image_url && sit.situation_image_url.trim() !== '')
            );

            // บังคับถ้าเป็นสถานการณ์ ต้องมีรายละเอียดสถานการณ์หรือรูปภาพ
            if (isSituation && !hasSituationContent) {
                Swal.fire({
                    title: 'กรุณากรอกรายละเอียดสถานการณ์',
                    text: `กรุณากรอกรายละเอียดสถานการณ์ที่ ${sitNumber} ก่อนทำการบันทึก`,
                    icon: 'warning',
                    confirmButtonColor: '#16a34a'
                });
                return;
            }

            if (sit.questions.length === 0) {
                Swal.fire({
                    title: 'กรุณาเพิ่มคำถาม',
                    text: isSituation
                        ? `กรุณาเพิ่มคำถามในสถานการณ์ที่ ${sitNumber} อย่างน้อย 1 ข้อ`
                        : `กรุณาเพิ่มคำถามอย่างน้อย 1 ข้อ`,
                    icon: 'warning',
                    confirmButtonColor: '#16a34a'
                });
                return;
            }

            for (let j = 0; j < sit.questions.length; j++) {
                const q = sit.questions[j];
                const hasQuestionText = Boolean(
                    q.question_text && q.question_text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim() !== ''
                );
                if (!hasQuestionText) {
                    Swal.fire({
                        title: 'กรุณากรอกโจทย์คำถาม',
                        text: isSituation
                            ? `กรุณากรอกโจทย์คำถามที่ ${questionStartIndex + j + 1} ในสถานการณ์ที่ ${sitNumber}`
                            : `กรุณากรอกโจทย์คำถามสำหรับข้อที่ ${questionStartIndex + j + 1}`,
                        icon: 'warning',
                        confirmButtonColor: '#16a34a'
                    });
                    return;
                }
            }
        }

        setSubmitting(true);

        try {
            const token = getToken();
            let updatedSituationCount = 0;
            let updatedQuestionCount = 0;
            let createdSituationCount = 0;
            let createdStandaloneCount = 0;
            let addedQuestionCount = 0;

            // สร้าง copy ของ situations เพื่ออัพเดต
            const updatedSituations: Situation[] = JSON.parse(JSON.stringify(situations));

            for (let sitIdx = 0; sitIdx < situations.length; sitIdx++) {
                const situation = situations[sitIdx];
                if (situation.situation_id) {
                    // แยกคำถามที่มีอยู่แล้ว และคำถามใหม่
                    const existingQuestions = situation.questions.filter(q => q.item_id);
                    const newQuestions = situation.questions.filter(q => !q.item_id);

                    // ตรวจสอบว่า situation มีการแก้ไขจริงหรือไม่
                    const currentSitHash = getSituationHash(situation);
                    const initialSitHash = initialSituationHashes.current.get(situation.situation_id);
                    const isSitModified = currentSitHash !== initialSitHash;

                    if (isSitModified) {
                        await fetch(`${API_URL}/items-bank/situation/${situation.situation_id}`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                situation_text: situation.situation_text,
                                situation_image_url: situation.situation_image_url || ''
                            })
                        });
                        updatedSituationCount++;
                    }

                    // อัพเดทคำถามที่มีอยู่แล้วเฉพาะข้อที่มีการเปลี่ยนแปลงจริง
                    for (const question of existingQuestions) {
                        const currentQHash = getQuestionHash(question);
                        const initialQHash = initialQuestionHashes.current.get(question.item_id!);
                        const isQModified = currentQHash !== initialQHash;

                        if (isQModified) {
                            await fetch(`${API_URL}/items-bank/item/${question.item_id}`, {
                                method: 'PATCH',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`
                                },
                                credentials: 'include',
                                body: JSON.stringify({
                                    question_text: question.question_text,
                                    question_image_url: question.question_image_url || '',
                                    explanation: question.explanation,
                                    sub_topic_id: question.sub_topic_id ? Number(question.sub_topic_id) : undefined,
                                    sub_topic_ids: question.sub_topic_ids ? question.sub_topic_ids.map(Number) : [],
                                    irt_a_discrimination: question.irt_a_discrimination != null ? Number(question.irt_a_discrimination) : null,
                                    irt_b_difficulty: question.irt_b_difficulty != null ? Number(question.irt_b_difficulty) : null,
                                    irt_c_guessing: question.irt_c_guessing != null ? Number(question.irt_c_guessing) : null,
                                    answer_options: question.answer_options
                                })
                            });
                            updatedQuestionCount++;
                        }
                    }

                    // เพิ่มคำถามใหม่เข้าใน situation ที่มีอยู่แล้ว
                    if (newQuestions.length > 0) {
                        const response = await fetch(`${API_URL}/items-bank/situation/${situation.situation_id}/questions`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                item_bank_id: Number(itemBankId),
                                questions: newQuestions.map(q => ({
                                    question_text: q.question_text,
                                    question_image_url: q.question_image_url || '',
                                    explanation: q.explanation,
                                    sub_topic_id: q.sub_topic_id ? Number(q.sub_topic_id) : undefined,
                                    sub_topic_ids: q.sub_topic_ids ? q.sub_topic_ids.map(Number) : [],
                                    irt_a_discrimination: q.irt_a_discrimination != null ? Number(q.irt_a_discrimination) : null,
                                    irt_b_difficulty: q.irt_b_difficulty != null ? Number(q.irt_b_difficulty) : null,
                                    irt_c_guessing: q.irt_c_guessing != null ? Number(q.irt_c_guessing) : null,
                                    answer_options: q.answer_options
                                }))
                            })
                        });

                        if (!response.ok) {
                            const result = await response.json();
                            throw new Error(Array.isArray(result.message) ? result.message.join(', ') : result.message);
                        }

                        // อัพเดท item_ids ของคำถามใหม่ที่เพิ่ม
                        const addedData = await response.json();
                        if (addedData.items && Array.isArray(addedData.items)) {
                            const newQuestionIndices = updatedSituations[sitIdx].questions
                                .map((q, idx) => !q.item_id ? idx : -1)
                                .filter(idx => idx !== -1);

                            addedData.items.forEach((item: any, idx: number) => {
                                const qIdx = newQuestionIndices[idx];
                                if (qIdx !== undefined && updatedSituations[sitIdx].questions[qIdx]) {
                                    updatedSituations[sitIdx].questions[qIdx].item_id = item.item_id;
                                }
                            });
                        }

                        addedQuestionCount += newQuestions.length;
                    }
                } else {
                    // Situation/Question ที่ไม่มี situation_id
                    const existingQuestions = situation.questions.filter(q => q.item_id);
                    const newQuestions = situation.questions.filter(q => !q.item_id);

                    if (existingQuestions.length > 0 && newQuestions.length === 0) {
                        // ทุก question มี item_id → เป็น existing standalone ที่โหลดมา → update เฉพาะข้อที่มีการแก้ไข
                        for (const question of existingQuestions) {
                            const currentQHash = getQuestionHash(question);
                            const initialQHash = initialQuestionHashes.current.get(question.item_id!);
                            const isQModified = currentQHash !== initialQHash;

                            if (isQModified) {
                                await fetch(`${API_URL}/items-bank/item/${question.item_id}`, {
                                    method: 'PATCH',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    credentials: 'include',
                                    body: JSON.stringify({
                                        question_text: question.question_text,
                                        question_image_url: question.question_image_url || '',
                                        explanation: question.explanation,
                                        sub_topic_id: question.sub_topic_id ? Number(question.sub_topic_id) : undefined,
                                        sub_topic_ids: question.sub_topic_ids ? question.sub_topic_ids.map(Number) : [],
                                        irt_a_discrimination: question.irt_a_discrimination != null ? Number(question.irt_a_discrimination) : null,
                                        irt_b_difficulty: question.irt_b_difficulty != null ? Number(question.irt_b_difficulty) : null,
                                        irt_c_guessing: question.irt_c_guessing != null ? Number(question.irt_c_guessing) : null,
                                        answer_options: question.answer_options
                                    })
                                });
                                updatedQuestionCount++;
                            }
                        }
                    } else {
                        // มี new questions → สร้างใหม่ผ่าน bulk-questions
                        for (const question of existingQuestions) {
                            const currentQHash = getQuestionHash(question);
                            const initialQHash = initialQuestionHashes.current.get(question.item_id!);
                            const isQModified = currentQHash !== initialQHash;

                            if (isQModified) {
                                await fetch(`${API_URL}/items-bank/item/${question.item_id}`, {
                                    method: 'PATCH',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${token}`
                                    },
                                    credentials: 'include',
                                    body: JSON.stringify({
                                        question_text: question.question_text,
                                        question_image_url: question.question_image_url || '',
                                        explanation: question.explanation,
                                        sub_topic_id: question.sub_topic_id ? Number(question.sub_topic_id) : undefined,
                                        sub_topic_ids: question.sub_topic_ids ? question.sub_topic_ids.map(Number) : [],
                                        irt_a_discrimination: question.irt_a_discrimination != null ? Number(question.irt_a_discrimination) : null,
                                        irt_b_difficulty: question.irt_b_difficulty != null ? Number(question.irt_b_difficulty) : null,
                                        irt_c_guessing: question.irt_c_guessing != null ? Number(question.irt_c_guessing) : null,
                                        answer_options: question.answer_options
                                    })
                                });
                                updatedQuestionCount++;
                            }
                        }

                        // สร้าง situation/standalone ใหม่พร้อมคำถามใหม่
                        const data = {
                            item_bank_id: Number(itemBankId),
                            situation_text: situation.situation_text,
                            situation_image_url: situation.situation_image_url || '',
                            questions: newQuestions.map(q => ({
                                question_text: q.question_text,
                                question_image_url: q.question_image_url || '',
                                explanation: q.explanation,
                                sub_topic_id: q.sub_topic_id ? Number(q.sub_topic_id) : undefined,
                                sub_topic_ids: q.sub_topic_ids ? q.sub_topic_ids.map(Number) : [],
                                irt_a_discrimination: q.irt_a_discrimination != null ? Number(q.irt_a_discrimination) : null,
                                irt_b_difficulty: q.irt_b_difficulty != null ? Number(q.irt_b_difficulty) : null,
                                irt_c_guessing: q.irt_c_guessing != null ? Number(q.irt_c_guessing) : null,
                                answer_options: q.answer_options
                            }))
                        };

                        const response = await fetch(`${API_URL}/items-bank/bulk-questions`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            credentials: 'include',
                            body: JSON.stringify(data)
                        });

                        if (!response.ok) {
                            const result = await response.json();
                            throw new Error(Array.isArray(result.message) ? result.message.join(', ') : result.message);
                        }

                        const createdData = await response.json();

                        if (createdData.situation_id) {
                            updatedSituations[sitIdx].situation_id = createdData.situation_id;
                            updatedSituations[sitIdx].temporary_id = `existing_${createdData.situation_id}`;
                            if (createdData.items && Array.isArray(createdData.items)) {
                                // map new questions เข้ากับ item_ids ที่สร้างใหม่
                                const newQuestionIndices = updatedSituations[sitIdx].questions
                                    .map((q, idx) => !q.item_id ? idx : -1)
                                    .filter(idx => idx !== -1);
                                createdData.items.forEach((item: any, idx: number) => {
                                    const qIdx = newQuestionIndices[idx];
                                    if (qIdx !== undefined && updatedSituations[sitIdx].questions[qIdx]) {
                                        updatedSituations[sitIdx].questions[qIdx].item_id = item.item_id;
                                        console.log(`  ✅ Question ${qIdx + 1} assigned item_id: ${item.item_id}`);
                                    }
                                });
                            }
                        }

                        createdSituationCount++;
                    }
                }
            }

            // อัพเดท state ด้วยข้อมูลใหม่
            console.log('📝 Updating state with:', updatedSituations);

            // Disable autosave before state updates
            isInitialLoad.current = true;

            setSituations(updatedSituations);

            // สร้างข้อความแสดงผลที่ละเอียดขึ้น
            let message = 'บันทึกสำเร็จ!';
            const details = [];
            if (updatedSituationCount > 0) details.push(`อัพเดท ${updatedSituationCount} สถานการณ์`);
            if (createdSituationCount > 0) details.push(`สร้างใหม่ ${createdSituationCount} สถานการณ์`);
            if (addedQuestionCount > 0) details.push(`เพิ่ม ${addedQuestionCount} คำถามใหม่`);

            if (details.length > 0) {
                message = details.join(', ');
            }

            await Swal.fire({
                title: 'สำเร็จ!',
                text: message,
                icon: 'success',
                confirmButtonColor: '#22c55e'
            });

            setIsEditing(false);

            // บันทึกลำดับของสถานการณ์และคำถาม
            await saveOrdering();

            // รีเฟรชข้อมูลเพื่ออัพเดท situation_id และ item_id
            await fetchExistingItems();
            await fetchItemBankInfo();

            // Clear local draft and unsaved changes flag
            const draftKey = `item_bank_draft_${itemBankId}`;
            localStorage.removeItem(draftKey);
            hasUnsavedChanges.current = false;

            // Re-enable autosave after a small delay to ensure all state updates are finished
            setTimeout(() => {
                isInitialLoad.current = false;
            }, 500);

        } catch (error: any) {
            console.error('Error:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'เกิดข้อผิดพลาดในการบันทึก',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // ฟังก์ชันบันทึกลำดับสถานการณ์และคำถาม
    const saveOrdering = async () => {
        try {
            const token = getToken();
            // 1. บันทึกลำดับสถานการณ์
            const situationIds = situations
                .filter(s => s.situation_id) // เอาเฉพาะที่มี ID (บันทึกแล้ว)
                .map(s => s.situation_id!);

            if (situationIds.length > 0) {
                await fetch(`${API_URL}/items-bank/reorder-situations`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        item_bank_id: Number(itemBankId),
                        sorted_situation_ids: situationIds
                    })
                });
            }

            // 2. บันทึกลำดับคำถาม (รวมทุกข้อในทุกสถานการณ์)
            const allQuestionIds: number[] = [];
            situations.forEach(situation => {
                situation.questions.forEach(question => {
                    if (question.item_id) {
                        allQuestionIds.push(question.item_id);
                    }
                });
            });

            if (allQuestionIds.length > 0) {
                await fetch(`${API_URL}/items-bank/reorder`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        item_bank_id: Number(itemBankId),
                        sorted_item_ids: allQuestionIds
                    })
                });
            }

            console.log('✅ บันทึกลำดับสำเร็จ');
        } catch (error) {
            console.error('⚠️ เกิดข้อผิดพลาดในการบันทึกลำดับ:', error);
            // ไม่ให้ error นี้หยุดการทำงาน เพราะข้อมูลหลักบันทึกสำเร็จแล้ว
        }
    };

    const handleAddSubTopic = async () => {
        if (!newSubTopicName.trim() || !newSubTopicTopicId) {
            await Swal.fire({
                title: 'กรุณากรอกข้อมูล',
                text: 'กรุณากรอกชื่อหัวข้อย่อยและเลือกหัวข้อหลัก',
                icon: 'warning',
                confirmButtonColor: '#3b82f6'
            });
            return;
        }

        setAddingSubTopic(true);
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/topics/${newSubTopicTopicId}/sub-topics`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({ sub_topic_name: newSubTopicName })
            });

            if (response.ok) {
                const newSubTopic = await response.json();
                setSubTopics([...subTopics, newSubTopic]);
                setShowAddSubTopicModal(false);
                setNewSubTopicName('');
                setNewSubTopicTopicId('');
                await Swal.fire({
                    title: 'สำเร็จ!',
                    text: 'เพิ่มหัวข้อย่อยใหม่แล้ว',
                    icon: 'success',
                    confirmButtonColor: '#22c55e'
                });
            } else {
                const error = await response.json();
                throw new Error(error.message || 'ไม่สามารถเพิ่มหัวข้อย่อยได้');
            }
        } catch (error: any) {
            console.error('Error adding sub topic:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'เกิดข้อผิดพลาดในการเพิ่มหัวข้อย่อย',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setAddingSubTopic(false);
        }
    };

    const scrollToSituation = (index: number) => {
        // If the situation is collapsed, expand it first then scroll
        if (collapsedSituations.has(index)) {
            const newCollapsed = new Set(collapsedSituations);
            newCollapsed.delete(index);
            setCollapsedSituations(newCollapsed);
            // Wait for DOM to re-render after expanding
            setTimeout(() => {
                const element = situationRefs.current[index];
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    setActiveSituationIndex(index);
                }
            }, 150);
        } else {
            const element = situationRefs.current[index];
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                setActiveSituationIndex(index);
            }
        }
    };

    if (loading || !itemBankId) {
        return (
            <Navbar_admin>
                <div className="flex items-center justify-center min-h-screen bg-gray-50">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">กำลังโหลดข้อมูล...</p>
                    </div>
                </div>
            </Navbar_admin>
        );
    }

    if (viewMode === 'dashboard') {
        return (
            <Navbar_admin>
                <DashboardView
                    itemBankId={itemBankId}
                    onManageExams={() => {
                        setViewMode('editor');
                        setIsEditing(false); // Start in read-only mode
                    }}
                    onUpdate={fetchItemBankInfo}
                />
            </Navbar_admin>
        );
    }



    return (
        <Navbar_admin>
            <div className="max-w-7xl mx-auto w-full space-y-6 relative" suppressHydrationWarning>

                <ItemBankHeader
                    itemBankInfo={itemBankInfo}
                    situations={situations}
                    itemBankId={itemBankId}
                    onAddSituation={addSituation}
                    onAddStandaloneQuestion={addStandaloneQuestion}
                    onImportExcel={() => setShowImportExcelModal(true)}
                    onSettingsClick={() => setShowSettingsModal(true)}
                    onCATGuideClick={() => setShowCATGuide(true)}
                    isEditing={isEditing}
                    onToggleEdit={() => setIsEditing(true)}
                    onCancel={handleCancel}
                    onSave={handleSubmit}
                    onUploadPdf={() => fileInputRef.current?.click()}
                    submitting={submitting || uploadingPdf}
                    onBack={async () => {
                        if (hasUnsavedChanges.current) {
                            const result = await Swal.fire({
                                title: 'มีข้อมูลยังไม่ได้บันทึก',
                                text: 'คุณต้องการบันทึกการเปลี่ยนแปลงก่อนกลับหรือไม่?',
                                icon: 'question',
                                showCancelButton: true,
                                showDenyButton: true,
                                confirmButtonColor: '#22c55e',
                                denyButtonColor: '#ef4444',
                                cancelButtonColor: '#6b7280',
                                confirmButtonText: 'บันทึก',
                                denyButtonText: 'ไม่บันทึก (ทิ้งการแก้ไข)',
                                cancelButtonText: 'ยกเลิก',
                                reverseButtons: true
                            });

                            if (result.isConfirmed) {
                                await handleSubmit(new Event('submit') as any);
                                setViewMode('dashboard');
                            } else if (result.isDenied) {
                                // Discard changes
                                isInitialLoad.current = true;
                                const draftKey = `item_bank_draft_${itemBankId}`;
                                localStorage.removeItem(draftKey);
                                hasUnsavedChanges.current = false;
                                await fetchExistingItems();
                                setViewMode('dashboard');
                                setTimeout(() => { isInitialLoad.current = false; }, 500);
                            }
                            // if cancelled, do nothing
                        } else {
                            setViewMode('dashboard');
                        }
                    }}
                />

                {/* Hidden File Input for PDF Upload */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleUploadPdf}
                    accept=".pdf"
                    className="hidden"
                />

                {/* TOC — read accordion view OR edit accordion view */}
                {((!isEditing && readViewMode === 'accordion') || (isEditing && editViewMode === 'accordion')) && (
                    <TableOfContents
                        situations={situations}
                        activeSituationIndex={activeSituationIndex}
                        showTOC={showTOC}
                        setShowTOC={setShowTOC}
                        scrollToSituation={scrollToSituation}
                        collapsedSituations={collapsedSituations}
                        onExpandSituation={expandSituation}
                        onAddSituation={isEditing ? addSituation : undefined}
                        onAddStandaloneQuestion={isEditing ? addStandaloneQuestion : undefined}
                    />
                )}

                {/* View Mode Toggle + Content */}
                {!isEditing && (
                    <div className="space-y-4">
                        {/* Toggle Bar */}
                        <SituationViewer
                            situations={situations}
                            collapsedSituations={collapsedSituations}
                            collapsedQuestions={collapsedQuestions}
                            toggleSituationCollapse={toggleSituationCollapse}
                            toggleQuestionCollapse={toggleQuestionCollapse}
                            situationRefs={situationRefs}
                            onCollapseAll={collapseAllSituations}
                            onExpandAll={expandAllSituations}
                        />
                    </div>
                )}

                {/* Edit Mode Content */}
                {isEditing && (
                    <form onSubmit={handleSubmit} className="space-y-4 pb-8">

                        {/* Edit View Mode Toggle */}


                        {situations.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 sm:p-16 text-center">
                                <FileText className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg sm:text-xl font-medium text-gray-700 mb-2">ยังไม่มีสถานการณ์</h3>
                                <p className="text-gray-500 mb-6 text-sm sm:text-base">เริ่มต้นสร้างข้อสอบโดยการเพิ่มสถานการณ์ใหม่</p>
                            </div>

                        ) : (
                            /* ── Accordion View ─────────────────────────────────────── */
                            <>
                                {situations.map((situation, sitIdx) => {
                                    const isCollapsed = collapsedSituations.has(sitIdx);
                                    // Calculate the starting question number for this situation
                                    const questionStartIndex = situations.slice(0, sitIdx).reduce((acc, s) => acc + s.questions.length, 0);
                                    const isSituation = situation.is_standalone !== true;
                                    const situationSeqNumber = situations.slice(0, sitIdx + 1).filter(s => s.is_standalone !== true).length;

                                    return (
                                        <div
                                            key={situation.temporary_id || situation.situation_id || sitIdx}
                                            ref={(el) => { situationRefs.current[sitIdx] = el; }}
                                            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden scroll-mt-32 transition-shadow hover:shadow-md"
                                        >
                                            {/* Card Header (Identical Unified Layout for Situation & Standalone Question) */}
                                            <div className="flex items-center justify-between px-5 py-4 select-none group">
                                                {/* Left: badge + title — click to collapse */}
                                                <div
                                                    className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                                                    onClick={() => isSituation ? toggleSituationCollapse(sitIdx) : toggleQuestionCollapse(sitIdx, 0)}
                                                >
                                                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-medium text-sm shadow-sm shrink-0 ${
                                                        isSituation
                                                            ? 'bg-gradient-to-br from-green-500 to-green-600'
                                                            : 'bg-gradient-to-br from-blue-500 to-blue-600'
                                                    }`}>
                                                        {isSituation ? situationSeqNumber : (questionStartIndex + 1)}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-medium text-gray-800">
                                                                {isSituation ? `สถานการณ์ที่ ${situationSeqNumber}` : 'คำถามเดี่ยว'}
                                                            </span>
                                                            {isSituation ? (
                                                                situation.situation_id
                                                                    ? <span className="text-sm text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-medium">บันทึกแล้ว</span>
                                                                    : <span className="text-sm text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">ใหม่</span>
                                                            ) : (
                                                                (situation.questions[0]?.item_id || situation.situation_id)
                                                                    ? <span className="text-sm text-green-600 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-medium">บันทึกแล้ว</span>
                                                                    : <span className="text-sm text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">ใหม่</span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-gray-500 mt-0.5">
                                                            {isSituation ? `${situation.questions.length} คำถาม` : '1 คำถาม'}
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Right: action buttons */}
                                                <div className="flex items-center gap-2 shrink-0">
                                                    <div className="hidden sm:flex items-center gap-1 py-1 px-2 bg-gray-50 rounded-lg border border-gray-100">
                                                        <button
                                                            type="button"
                                                            onClick={() => moveSituation(sitIdx, 'up')}
                                                            disabled={sitIdx === 0}
                                                            className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                            title="ย้ายขึ้น"
                                                        >
                                                            <ArrowUp className="w-4 h-4" />
                                                        </button>
                                                        <div className="w-[1px] h-3 bg-gray-200" />
                                                        <button
                                                            type="button"
                                                            onClick={() => moveSituation(sitIdx, 'down')}
                                                            disabled={sitIdx === situations.length - 1}
                                                            className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                            title="ย้ายลง"
                                                        >
                                                            <ArrowDown className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeSituation(sitIdx)}
                                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                        title={isSituation ? "ลบสถานการณ์" : "ลบคำถามเดี่ยว"}
                                                    >
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => isSituation ? toggleSituationCollapse(sitIdx) : toggleQuestionCollapse(sitIdx, 0)}
                                                        className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                                                    >
                                                        {(isSituation ? isCollapsed : collapsedQuestions.has(`${sitIdx}-0`))
                                                            ? <ChevronDown className="w-4 h-4 text-gray-500" />
                                                            : <ChevronUp className="w-4 h-4 text-gray-500" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Situation Body + Questions */}
                                            {((isSituation && !isCollapsed) || (!isSituation && !collapsedQuestions.has(`${sitIdx}-0`))) && (
                                                <div className="border-t border-gray-100">
                                                    {/* Situation text & image */}
                                                    {isSituation && (
                                                        <div className="bg-gradient-to-b from-slate-50 to-white px-5 py-5 border-b border-gray-100">
                                                            <div className="flex items-start gap-3 mb-4">
                                                                <div className="w-1 self-stretch rounded-full bg-gradient-to-b from-green-400 to-green-600 shrink-0" />
                                                                <div className="flex-1 space-y-3">
                                                                    <TiptapEditor
                                                                        value={situation.situation_text}
                                                                        onChange={(html) => updateSituation(sitIdx, 'situation_text', html)}
                                                                        placeholder="รายละเอียดสถานการณ์..."
                                                                        minHeight="80px"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* Question area header (Only when situation) */}
                                                    {isSituation && (
                                                        <div className="flex items-center justify-between px-5 py-3 bg-gray-50 border-b border-gray-100">
                                                            <h4 className="text-sm font-medium text-gray-700">คำถามในสถานการณ์นี้</h4>
                                                            <button
                                                                type="button"
                                                                onClick={() => addQuestion(sitIdx)}
                                                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg font-medium text-sm transition-all active:scale-95 cursor-pointer shadow-xs"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                                เพิ่มคำถาม
                                                            </button>
                                                        </div>
                                                    )}

                                                    {situation.questions.length === 0 ? (
                                                        <div className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-8 text-center mx-5 my-4">
                                                            <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                                            <p className="text-gray-400 text-sm mb-3">ยังไม่มีคำถามในสถานการณ์นี้</p>
                                                            <button
                                                                type="button"
                                                                onClick={() => addQuestion(sitIdx)}
                                                                className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all cursor-pointer shadow-xs"
                                                            >
                                                                <Plus className="w-3.5 h-3.5" />
                                                                เพิ่มคำถามแรกในสถานการณ์นี้
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="divide-y divide-gray-100">
                                                            {situation.questions.map((question, qIdx) => {
                                                                const isQCollapsed = collapsedQuestions.has(`${sitIdx}-${qIdx}`);
                                                                return (
                                                                    <div id={`question-${sitIdx}-${qIdx}`} key={qIdx} className="scroll-mt-32">
                                                                        {/* Question Header (Only inside a situation with multiple questions) */}
                                                                        {isSituation && (
                                                                            <div className="flex items-center gap-3 px-5 py-4 transition-colors group hover:bg-gray-50/70">
                                                                                {/* number badge */}
                                                                                <div
                                                                                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-medium text-sm shrink-0 cursor-pointer border-blue-200 bg-blue-50 text-blue-700"
                                                                                    onClick={() => toggleQuestionCollapse(sitIdx, qIdx)}
                                                                                >
                                                                                    {questionStartIndex + qIdx + 1}
                                                                                </div>

                                                                                {/* question text preview */}
                                                                                <div
                                                                                    className="flex-1 min-w-0 cursor-pointer"
                                                                                    onClick={() => toggleQuestionCollapse(sitIdx, qIdx)}
                                                                                >
                                                                                    <div
                                                                                        className="text-gray-800 font-medium text-sm leading-relaxed line-clamp-1 prose-preview flex-1"
                                                                                        dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatScientificText(question.question_text) || 'คำถามใหม่') }}
                                                                                    />
                                                                                </div>

                                                                                {/* action buttons */}
                                                                                <div className="flex items-center gap-1 shrink-0">
                                                                                    <div className="flex items-center gap-0.5 py-0.5 px-1 bg-gray-50 rounded border border-gray-100">
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => moveQuestion(sitIdx, qIdx, 'up')}
                                                                                            disabled={qIdx === 0}
                                                                                            className="p-1 text-gray-400 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                                                            title="ย้ายขึ้น"
                                                                                        >
                                                                                            <ArrowUp className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => moveQuestion(sitIdx, qIdx, 'down')}
                                                                                            disabled={qIdx === situation.questions.length - 1}
                                                                                            className="p-1 text-gray-400 hover:text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                                                            title="ย้ายลง"
                                                                                        >
                                                                                            <ArrowDown className="w-3.5 h-3.5" />
                                                                                        </button>
                                                                                    </div>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => removeQuestion(sitIdx, qIdx)}
                                                                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                                        title="ลบคำถาม"
                                                                                    >
                                                                                        <Trash2 className="w-4 h-4" />
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => toggleQuestionCollapse(sitIdx, qIdx)}
                                                                                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                                                                                    >
                                                                                        {isQCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                        )}

                                                                        {/* Question Content */}
                                                                        {(!isSituation || !isQCollapsed) && (
                                                                            <div className="px-5 pb-5 pt-2 space-y-4 bg-gray-50/40">
                                                                                {/* Question Text */}
                                                                                <div className="space-y-2">
                                                                                    <label className="text-base font-medium text-gray-700 mb-2 mb-2">โจทย์คำถาม <span className="text-red-500">*</span></label>
                                                                                    <TiptapEditor
                                                                                        value={question.question_text}
                                                                                        onChange={(html) => updateQuestion(sitIdx, qIdx, 'question_text', html)}
                                                                                        placeholder="กรอกโจทย์คำถาม..."
                                                                                        minHeight="72px"
                                                                                    />
                                                                                </div>

                                                                                {/* Image Upload for Question */}
                                                                                <div className="space-y-2">
                                                                                    <label className="text-base font-medium text-gray-700 mb-2">รูปภาพประกอบ (Optional)</label>
                                                                                    <div className="flex items-center gap-4">
                                                                                        {question.question_image_url ? (
                                                                                            <div className="relative w-48 h-32 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center group">
                                                                                                <img
                                                                                                    src={question.question_image_url.startsWith("http")
                                                                                                        ? question.question_image_url
                                                                                                        : `${process.env.NEXT_PUBLIC_API_URL}${question.question_image_url}`}
                                                                                                    alt="Question image"
                                                                                                    className="w-full h-full object-contain"
                                                                                                />
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => updateQuestion(sitIdx, qIdx, 'question_image_url', '')}
                                                                                                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow hover:bg-red-600 transition-colors"
                                                                                                >
                                                                                                    <X className="w-4 h-4" />
                                                                                                </button>
                                                                                            </div>
                                                                                        ) : (
                                                                                            <label className="flex flex-col items-center justify-center w-48 h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-green-500 transition-all mt-2">
                                                                                                <div className="flex flex-col items-center justify-center pt-5 pb-6 text-gray-400">
                                                                                                    <Plus className="w-6 h-6 mb-2 text-gray-400" />
                                                                                                    <p className="text-sm font-medium text-gray-600">คลิกเพื่ออัปโหลดรูปภาพ</p>
                                                                                                    <p className="text-sm text-gray-400 mt-1">PNG, JPG ไม่เกิน 5MB</p>
                                                                                                </div>
                                                                                                <input
                                                                                                    type="file"
                                                                                                    accept="image/*"
                                                                                                    onChange={async (e) => {
                                                                                                        const file = e.target.files?.[0];
                                                                                                        if (!file) return;

                                                                                                        if (file.size > 5 * 1024 * 1024) {
                                                                                                            Swal.fire({
                                                                                                                title: 'ไฟล์มีขนาดใหญ่เกินไป',
                                                                                                                text: 'กรุณาอัปโหลดไฟล์ขนาดไม่เกิน 5MB',
                                                                                                                icon: 'warning',
                                                                                                                confirmButtonColor: '#3b82f6'
                                                                                                            });
                                                                                                            return;
                                                                                                        }

                                                                                                        Swal.fire({
                                                                                                            title: 'กำลังอัปโหลดรูปภาพ...',
                                                                                                            allowOutsideClick: false,
                                                                                                            didOpen: () => {
                                                                                                                Swal.showLoading();
                                                                                                            }
                                                                                                        });

                                                                                                        try {
                                                                                                            const uploadData = new FormData();
                                                                                                            uploadData.append("file", file);

                                                                                                            const token = getToken();
                                                                                                            const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news/upload`, {
                                                                                                                method: 'POST',
                                                                                                                headers: {
                                                                                                                    'Authorization': `Bearer ${token}`
                                                                                                                },
                                                                                                                body: uploadData
                                                                                                            });

                                                                                                            if (!uploadRes.ok) throw new Error("อัปโหลดรูปภาพไม่สำเร็จ");
                                                                                                            const uploadJson = await uploadRes.json();
                                                                                                            if (uploadJson && uploadJson.url) {
                                                                                                                updateQuestion(sitIdx, qIdx, 'question_image_url', uploadJson.url);
                                                                                                                Swal.close();
                                                                                                                Swal.fire({
                                                                                                                    toast: true,
                                                                                                                    position: 'top-end',
                                                                                                                    icon: 'success',
                                                                                                                    title: 'อัปโหลดรูปภาพสำเร็จ',
                                                                                                                    showConfirmButton: false,
                                                                                                                    timer: 1500
                                                                                                                });
                                                                                                            } else {
                                                                                                                throw new Error("ข้อมูลตอบกลับจากการอัปโหลดไม่ถูกต้อง");
                                                                                                            }
                                                                                                        } catch (err: any) {
                                                                                                            console.error('Upload error:', err);
                                                                                                            Swal.close();
                                                                                                            Swal.fire({
                                                                                                                title: 'เกิดข้อผิดพลาด',
                                                                                                                text: err.message || 'ไม่สามารถอัปโหลดรูปภาพได้',
                                                                                                                icon: 'error',
                                                                                                                confirmButtonColor: '#ef4444'
                                                                                                            });
                                                                                                        }
                                                                                                    }}
                                                                                                    className="hidden"
                                                                                                />
                                                                                            </label>
                                                                                        )}
                                                                                    </div>
                                                                                </div>

                                                                                {/* Answer Options */}
                                                                                <div className="space-y-3">
                                                                                    <label className="text-base font-medium text-gray-800">ตัวเลือกคำตอบ </label>
                                                                                    <div className="space-y-2.5 mt-2">
                                                                                        {question.answer_options.map((option, optIdx) => (
                                                                                            <div key={optIdx} className="space-y-1">
                                                                                                <div className="flex gap-2 sm:gap-3 items-center">
                                                                                                    <div className="flex-none flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 text-sm font-medium text-gray-600">
                                                                                                        {['ก', 'ข', 'ค', 'ง', 'จ'][optIdx] || String.fromCharCode(65 + optIdx)}
                                                                                                    </div>
                                                                                                    <input
                                                                                                        type="text"
                                                                                                        value={option.option_text}
                                                                                                        onChange={(e) => updateAnswerOption(sitIdx, qIdx, optIdx, 'option_text', e.target.value)}
                                                                                                        className="flex-1 px-3 sm:px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-base"
                                                                                                        placeholder={`ตัวเลือกที่ ${optIdx + 1}`}
                                                                                                        required
                                                                                                    />
                                                                                                    <input
                                                                                                        type="radio"
                                                                                                        name={`correct-${sitIdx}-${qIdx}`}
                                                                                                        checked={option.is_correct}
                                                                                                        onChange={() => updateAnswerOption(sitIdx, qIdx, optIdx, 'is_correct', true)}
                                                                                                        className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 focus:ring-green-500 cursor-pointer flex-shrink-0"
                                                                                                        required
                                                                                                    />
                                                                                                </div>
                                                                                                {option.option_text && (option.option_text.includes('<') || option.option_text.includes('^') || option.option_text.includes('_') || /[A-Z][a-z]?[0-9]/.test(option.option_text) || /[+-]/.test(option.option_text)) && (
                                                                                                    <div className="pl-9 sm:pl-11 text-xs text-gray-500 flex items-center gap-1.5">
                                                                                                        <span className="text-gray-400">แสดงผลจริง:</span>
                                                                                                        <span className="font-medium text-gray-800 bg-white px-2 py-0.5 rounded border border-gray-200" dangerouslySetInnerHTML={{ __html: sanitizeHtml(formatScientificText(option.option_text)) }} />
                                                                                                    </div>
                                                                                                )}
                                                                                            </div>
                                                                                        ))}
                                                                                    </div>
                                                                                </div>

                                                                                {/* Advanced Options */}
                                                                                <details className="group">
                                                                                    <summary className="cursor-pointer list-none">
                                                                                        <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                                                                            <span className="text-sm font-medium text-gray-700 flex items-center gap-2">
                                                                                                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                                                </svg>
                                                                                                ตัวเลือกขั้นสูง
                                                                                            </span>
                                                                                            <span className="text-sm text-gray-500">คำอธิบาย, หัวข้อย่อย, IRT</span>
                                                                                        </div>
                                                                                    </summary>

                                                                                    <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-4">
                                                                                        {/* Explanation - Moved back to advanced options and made optional */}
                                                                                        <div className="space-y-2 mt-2">
                                                                                            <label className="text-base font-medium text-gray-700 mb-2">คำอธิบายเฉลย</label>
                                                                                            <TiptapEditor
                                                                                                value={question.explanation}
                                                                                                onChange={(html) => updateQuestion(sitIdx, qIdx, 'explanation', html)}
                                                                                                placeholder="อธิบายที่มาของคำตอบ (ถ้ามี)..."
                                                                                                minHeight="90px"
                                                                                            />
                                                                                        </div>

                                                                                        {/* หัวข้อย่อย (Searchable Multi-select) */}
                                                                                        <SubTopicSearchDropdown
                                                                                            selectedIds={question.sub_topic_ids || []}
                                                                                            topics={topics}
                                                                                            subTopics={subTopics}
                                                                                            onChange={(updatedIds) => {
                                                                                                updateQuestion(sitIdx, qIdx, 'sub_topic_ids', updatedIds);
                                                                                                // Keep sub_topic_id in sync with first item
                                                                                                updateQuestion(sitIdx, qIdx, 'sub_topic_id', updatedIds[0] || null);
                                                                                            }}
                                                                                            onOpenAddSubTopicModal={() => setShowAddSubTopicModal(true)}
                                                                                        />

                                                                                        {/* IRT Parameters */}
                                                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white rounded-lg border border-gray-200">
                                                                                            <div className="space-y-1">
                                                                                                <label className="text-sm  font-medium text-gray-500"> อำนาจจำแนก (a)</label>
                                                                                                <input
                                                                                                    type="number"
                                                                                                    step="0.01"
                                                                                                    value={question.irt_a_discrimination || ''}
                                                                                                    onChange={(e) => updateQuestion(sitIdx, qIdx, 'irt_a_discrimination', e.target.value)}
                                                                                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                                                                                />
                                                                                            </div>
                                                                                            <div className="space-y-1">
                                                                                                <label className="text-sm  font-medium text-gray-500">ความยาก (b)</label>
                                                                                                <input
                                                                                                    type="number"
                                                                                                    step="0.01"
                                                                                                    value={question.irt_b_difficulty || ''}
                                                                                                    onChange={(e) => updateQuestion(sitIdx, qIdx, 'irt_b_difficulty', e.target.value)}
                                                                                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                                                                                />
                                                                                            </div>
                                                                                            <div className="space-y-1">
                                                                                                <label className="text-sm  font-medium text-gray-500">การเดา (c)</label>
                                                                                                <input
                                                                                                    type="number"
                                                                                                    step="0.01"
                                                                                                    value={question.irt_c_guessing || ''}
                                                                                                    onChange={(e) => updateQuestion(sitIdx, qIdx, 'irt_c_guessing', e.target.value)}
                                                                                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                                                                                />
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </details>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Submit Button */}
                                {/* Submit Button (Only in Edit Mode) */}
                                <div
                                    className="fixed bottom-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 z-30 transition-all duration-300"
                                    style={{ left: 'var(--sidebar-width)' }}
                                >
                                    <div className="max-w-7xl mx-auto flex justify-end gap-3 px-4 sm:px-6 lg:px-8">
                                        <button
                                            type="button"
                                            onClick={handleCancel}
                                            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                        >
                                            ยกเลิก
                                        </button>

                                        {/* Save as Draft Button (if currently published) */}
                                        {itemBankInfo?.is_active && (
                                            <button
                                                type="button"
                                                disabled={submitting}
                                                onClick={async () => {
                                                    // This will save content AND set is_active to false
                                                    const token = getToken();
                                                    setSubmitting(true);
                                                    try {
                                                        // 1. Update item bank to draft
                                                        await fetch(`${API_URL}/items-bank/${itemBankId}`, {
                                                            method: 'PATCH',
                                                            headers: {
                                                                'Content-Type': 'application/json',
                                                                'Authorization': `Bearer ${token}`
                                                            },
                                                            credentials: 'include',
                                                            body: JSON.stringify({ is_active: false })
                                                        });
                                                        // 2. Submit situational data
                                                        await handleSubmit(new Event('submit') as any);
                                                    } catch (error) {
                                                        console.error(error);
                                                    } finally {
                                                        setSubmitting(false);
                                                    }
                                                }}
                                                className="px-6 py-2.5 rounded-lg border border-amber-300 text-amber-700 font-medium hover:bg-amber-50 transition-colors flex items-center gap-2"
                                            >
                                                <FileText className="w-4 h-4" />
                                                บันทึกเป็นแบบร่าง
                                            </button>
                                        )}

                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="bg-green-600 hover:bg-green-700 text-white font-medium px-8 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                        >
                                            {submitting ? (
                                                <>
                                                    <Loader2 className="w-5 h-5 animate-spin" />
                                                    กำลังบันทึก...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="w-5 h-5" />
                                                    {itemBankInfo?.is_active ? 'บันทึกการแก้ไข' : 'บันทึกร่าง'}
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </>
                        )}
                    </form>
                )}

            </div>

            <AddSubTopicModal
                isOpen={showAddSubTopicModal}
                onClose={() => {
                    setShowAddSubTopicModal(false);
                    setNewSubTopicName('');
                    setNewSubTopicTopicId('');
                }}
                topics={topics}
                onAddSubTopic={handleAddSubTopic}
                isAdding={addingSubTopic}
                newSubTopicName={newSubTopicName}
                setNewSubTopicName={setNewSubTopicName}
                newSubTopicTopicId={newSubTopicTopicId}
                setNewSubTopicTopicId={setNewSubTopicTopicId}
            />



            <CATGuideModal
                isOpen={showCATGuide}
                onClose={() => setShowCATGuide(false)}
            />

            <SettingsModal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                itemBankId={itemBankId}
                onUpdate={() => {
                    fetchItemBankInfo();
                    initData();
                }}
            />

            <ImportExcelModal
                isOpen={showImportExcelModal}
                onClose={() => setShowImportExcelModal(false)}
                itemBankId={itemBankId}
                itemBankName={itemBankInfo?.bank_name}
                onSuccess={handleExcelImportSuccess}
            />
        </Navbar_admin>
    );
}
