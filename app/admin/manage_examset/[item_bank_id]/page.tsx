'use client';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import Navbar_admin from "@/components/Navbar_admin";
import { useParams, useRouter } from 'next/navigation';
import { Plus, Trash2, Save, FileText, AlertCircle, ChevronLeft, ChevronRight, Loader2, ChevronDown, ChevronUp, ArrowUp, ArrowDown, ArrowLeft, Settings, Clock, Calendar, CheckCircle, XCircle, Tag, Layers, X, List, HelpCircle } from 'lucide-react';
import Swal from 'sweetalert2';
import Link from 'next/link';
import { div } from 'framer-motion/client';
import TableOfContents from './components/TableOfContents';
import ItemBankHeader from './components/ItemBankHeader';
import AddSubTopicModal from './components/AddSubTopicModal';
import SituationViewer from './components/SituationViewer';
import CATGuideModal from '../../cat_management/components/CATGuideModal';
import DashboardView from './components/DashboardView';
import SettingsModal from './components/SettingsModal';
import { useAuth } from "@/contexts/AuthContext";

// Types
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

const API_URL = 'http://localhost:5000';

export default function ItemBankEditPage() {
    const params = useParams();
    const router = useRouter();
    const { getToken } = useAuth();
    const itemBankId = params.item_bank_id as string;

    const [situations, setSituations] = useState<Situation[]>([]);
    const [topics, setTopics] = useState<Topic[]>([]);
    const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
    const [itemBankInfo, setItemBankInfo] = useState<ItemBankDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [collapsedSituations, setCollapsedSituations] = useState<Set<number>>(new Set());
    const [collapsedQuestions, setCollapsedQuestions] = useState<Set<string>>(new Set());

    // States for Add SubTopic Modal
    const [showAddSubTopicModal, setShowAddSubTopicModal] = useState(false);
    const [newSubTopicName, setNewSubTopicName] = useState('');
    const [newSubTopicTopicId, setNewSubTopicTopicId] = useState<number | ''>('');
    const [addingSubTopic, setAddingSubTopic] = useState(false);

    // Editing State
    const [viewMode, setViewMode] = useState<'dashboard' | 'editor'>('dashboard');
    const [isEditing, setIsEditing] = useState(true); // Default to editing when in editor mode



    // States for TOC
    const [activeSituationIndex, setActiveSituationIndex] = useState<number>(0);
    const [showTOC, setShowTOC] = useState(true);
    const situationRefs = useRef<(HTMLDivElement | null)[]>([]);

    // State for CAT Guide Modal
    const [showCATGuide, setShowCATGuide] = useState(false);

    // State for Settings Modal
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Ref to track if data has been initially loaded to avoid autosaving initial fetch
    const isInitialLoad = useRef(true);
    const hasUnsavedChanges = useRef(false);
    const hasInitialized = useRef(false);


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

    // Cleanup draft on success is handled in handleSubmit
    // Save draft when situations change
    useEffect(() => {
        if (!loading && !isInitialLoad.current && itemBankId) {
            const draftKey = `item_bank_draft_${itemBankId}`;
            localStorage.setItem(draftKey, JSON.stringify(situations));
            hasUnsavedChanges.current = true;
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
                const parsedDraft = JSON.parse(savedDraft);
                if (parsedDraft && parsedDraft.length > 0) {
                    const result = await Swal.fire({
                        title: 'พบข้อมูลที่ยังไม่ได้บันทึก',
                        text: 'คุณต้องการกู้คืนข้อมูลล่าสุดที่แก้ไขค้างไว้หรือไม่?',
                        icon: 'info',
                        showCancelButton: true,
                        confirmButtonColor: '#22c55e',
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

                        // Scroll to the top of the editor after values are set
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
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: 'กู้คืนข้อมูลไม่สำเร็จ',
                    showConfirmButton: false,
                    timer: 2000,
                    timerProgressBar: true
                });
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

                if (data.items && Array.isArray(data.items)) {
                    data.items.forEach((item: any) => {
                        if (item.situation) {
                            const sitId = item.situation.situation_id;

                            if (!situationsMap.has(sitId)) {
                                situationsMap.set(sitId, {
                                    situation_id: sitId,
                                    temporary_id: `existing_${sitId}`,
                                    situation_text: item.situation.situation_text,
                                    situation_image_url: item.situation.situation_image_url,
                                    questions: [],
                                    display_order: item.situation.display_order || 0 // เก็บ display_order ไว้ด้วย
                                });
                            }

                            situationsMap.get(sitId)!.questions.push({
                                item_id: item.item_id,
                                question_text: item.question_text,
                                explanation: item.explanation,
                                sub_topic_id: item.sub_topics?.[0]?.sub_topic_id,
                                irt_a_discrimination: item.irt_a_discrimination,
                                irt_b_difficulty: item.irt_b_difficulty,
                                irt_c_guessing: item.irt_c_guessing,
                                answer_options: item.answer_options || [],
                                display_order: item.display_order
                            });
                        }
                    });
                }

                // เรียงสถานการณ์ตาม display_order
                const sortedSituations = Array.from(situationsMap.values()).sort((a, b) => {
                    const orderA = a.display_order || 0;
                    const orderB = b.display_order || 0;
                    return orderA - orderB;
                });

                setSituations(sortedSituations);
            }
        } catch (error) {
            console.error('Error fetching existing items:', error);
        }
    };

    const addSituation = () => {
        const newSituation: Situation = {
            temporary_id: `temp_${Date.now()}_${Math.random()}`, // Unique temporary ID
            situation_text: '',
            situation_image_url: '',
            questions: []
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
            irt_a_discrimination: 1,
            irt_c_guessing: 0.25
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (situations.length === 0) {
            Swal.fire({
                title: 'กรุณาเพิ่มข้อมูล',
                text: 'กรุณาเพิ่มสถานการณ์อย่างน้อย 1 สถานการณ์',
                icon: 'warning',
                confirmButtonColor: '#3b82f6'
            });
            return;
        }

        // Validation
        for (let i = 0; i < situations.length; i++) {
            const sit = situations[i];
            if (!sit.situation_text.trim()) {
                Swal.fire({
                    title: 'กรุณากรอกข้อมูล',
                    text: `กรุณากรอกรายละเอียดสถานการณ์ที่ ${i + 1}`,
                    icon: 'warning',
                    confirmButtonColor: '#3b82f6'
                });
                return;
            }
            if (sit.questions.length === 0) {
                Swal.fire({
                    title: 'กรุณาเพิ่มคำถาม',
                    text: `กรุณาเพิ่มคำถามในสถานการณ์ที่ ${i + 1} อย่างน้อย 1 ข้อ`,
                    icon: 'warning',
                    confirmButtonColor: '#3b82f6'
                });
                return;
            }
            for (let j = 0; j < sit.questions.length; j++) {
                const q = sit.questions[j];
                if (!q.question_text.trim()) {
                    Swal.fire({
                        title: 'กรุณากรอกข้อมูล',
                        text: `กรุณากรอกโจทย์คำถามที่ ${j + 1} ในสถานการณ์ที่ ${i + 1}`,
                        icon: 'warning',
                        confirmButtonColor: '#3b82f6'
                    });
                    return;
                }
            }
        }

        setSubmitting(true);

        try {
            const token = getToken();
            let updatedSituationCount = 0;
            let createdSituationCount = 0;
            let addedQuestionCount = 0;
            // สร้าง copy ของ situations เพื่ออัพเดต
            const updatedSituations: Situation[] = JSON.parse(JSON.stringify(situations));

            for (let sitIdx = 0; sitIdx < situations.length; sitIdx++) {
                const situation = situations[sitIdx];
                if (situation.situation_id) {
                    // แยกคำถามที่มีอยู่แล้ว และคำถามใหม่
                    const existingQuestions = situation.questions.filter(q => q.item_id);
                    const newQuestions = situation.questions.filter(q => !q.item_id);

                    // อัพเดท situation ที่มีอยู่แล้ว (ทำเสมอเพื่อให้แน่ใจว่าข้อมูลถูกต้อง)
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

                    // อัพเดทคำถามที่มีอยู่แล้ว
                    for (const question of existingQuestions) {
                        await fetch(`${API_URL}/items-bank/item/${question.item_id}`, {
                            method: 'PATCH',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                question_text: question.question_text,
                                explanation: question.explanation,
                                sub_topic_id: question.sub_topic_id ? Number(question.sub_topic_id) : undefined,
                                irt_a_discrimination: question.irt_a_discrimination ? Number(question.irt_a_discrimination) : 0,
                                irt_b_difficulty: question.irt_b_difficulty ? Number(question.irt_b_difficulty) : 0,
                                irt_c_guessing: question.irt_c_guessing ? Number(question.irt_c_guessing) : 0,
                                answer_options: question.answer_options
                            })
                        });
                    }

                    // นับเฉพาะเมื่อมีคำถามใหม่
                    if (newQuestions.length > 0) {
                        updatedSituationCount++;
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
                                    explanation: q.explanation,
                                    sub_topic_id: q.sub_topic_id ? Number(q.sub_topic_id) : undefined,
                                    irt_a_discrimination: q.irt_a_discrimination ? Number(q.irt_a_discrimination) : 0,
                                    irt_b_difficulty: q.irt_b_difficulty ? Number(q.irt_b_difficulty) : 0,
                                    irt_c_guessing: q.irt_c_guessing ? Number(q.irt_c_guessing) : 0,
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
                            // หา index ของคำถามใหม่ใน situation
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

                    updatedSituationCount++;
                } else {
                    // สร้าง situation ใหม่พร้อมคำถาม
                    console.log(`🆕 Creating new situation ${sitIdx + 1}...`);
                    const data = {
                        item_bank_id: Number(itemBankId),
                        situation_text: situation.situation_text,
                        situation_image_url: situation.situation_image_url || '',
                        questions: situation.questions.map(q => ({
                            question_text: q.question_text,
                            explanation: q.explanation,
                            sub_topic_id: q.sub_topic_id ? Number(q.sub_topic_id) : undefined,
                            irt_a_discrimination: q.irt_a_discrimination ? Number(q.irt_a_discrimination) : 0,
                            irt_b_difficulty: q.irt_b_difficulty ? Number(q.irt_b_difficulty) : 0,
                            irt_c_guessing: q.irt_c_guessing ? Number(q.irt_c_guessing) : 0,
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

                    // อัพเดท state ด้วย situation_id และ item_ids ที่ได้จาก backend
                    const createdData = await response.json();
                    console.log(`✅ Created situation with ID: ${createdData.situation_id}`);

                    if (createdData.situation_id) {
                        updatedSituations[sitIdx].situation_id = createdData.situation_id;
                        // อัพเดท temporary_id ให้ตรงกับ situation_id เพื่อความ consistent
                        updatedSituations[sitIdx].temporary_id = `existing_${createdData.situation_id}`;
                        // อัพเดท item_ids ของคำถามด้วย
                        if (createdData.items && Array.isArray(createdData.items)) {
                            createdData.items.forEach((item: any, qIdx: number) => {
                                if (updatedSituations[sitIdx].questions[qIdx]) {
                                    updatedSituations[sitIdx].questions[qIdx].item_id = item.item_id;
                                    console.log(`  ✅ Question ${qIdx + 1} assigned item_id: ${item.item_id}`);
                                }
                            });
                        }
                    }

                    createdSituationCount++;
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
        const element = situationRefs.current[index];
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            setActiveSituationIndex(index);
        }
    };

    if (loading) {
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
                        setIsEditing(true);
                    }}
                    onUpdate={fetchItemBankInfo}
                />
            </Navbar_admin>
        );
    }



    return (
        <Navbar_admin>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 relative" suppressHydrationWarning>

                <ItemBankHeader
                    itemBankInfo={itemBankInfo}
                    situations={situations}
                    itemBankId={itemBankId}
                    onAddSituation={addSituation}
                    onSettingsClick={() => setShowSettingsModal(true)}
                    onCATGuideClick={() => setShowCATGuide(true)}
                    isEditing={isEditing}
                    onToggleEdit={() => setIsEditing(!isEditing)}
                    onSave={handleSubmit}
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

                <TableOfContents
                    situations={situations}
                    activeSituationIndex={activeSituationIndex}
                    showTOC={showTOC}
                    setShowTOC={setShowTOC}
                    scrollToSituation={scrollToSituation}
                />

                {/* View Mode */}
                {!isEditing && (
                    <SituationViewer
                        situations={situations}
                        collapsedSituations={collapsedSituations}
                        collapsedQuestions={collapsedQuestions}
                        toggleSituationCollapse={toggleSituationCollapse}
                        toggleQuestionCollapse={toggleQuestionCollapse}
                        situationRefs={situationRefs}
                    />
                )}

                {/* Edit Mode Content */}
                {isEditing && (
                    <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8 pb-8">
                        {situations.length === 0 ? (
                            <div className="bg-white border-2 border-dashed border-gray-300 rounded-2xl p-12 sm:p-16 text-center">
                                <FileText className="w-16 h-16 sm:w-20 sm:h-20 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">ยังไม่มีสถานการณ์</h3>
                                <p className="text-gray-500 mb-6 text-sm sm:text-base">เริ่มต้นสร้างข้อสอบโดยการเพิ่มสถานการณ์ใหม่</p>

                            </div>
                        ) : (
                            <>
                                {situations.map((situation, sitIdx) => {
                                    const isCollapsed = collapsedSituations.has(sitIdx);
                                    // Calculate the starting question number for this situation
                                    const questionStartIndex = situations.slice(0, sitIdx).reduce((acc, s) => acc + s.questions.length, 0);
                                    return (
                                        <div
                                            key={situation.temporary_id || situation.situation_id || sitIdx}
                                            ref={(el) => { situationRefs.current[sitIdx] = el; }}
                                            className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden scroll-mt-32"
                                        >
                                            {/* Situation Header */}
                                            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-white border-b border-gray-100 transition-colors duration-200">
                                                <div className="flex items-center justify-between gap-3 sm:gap-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-1.5 h-6 rounded-full ${situation.situation_id ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                                                        <h5 className="font-bold text-gray-800 text-base sm:text-lg">สถานการณ์ที่ {sitIdx + 1}</h5>

                                                        <div className="hidden sm:flex items-center gap-1 ml-4 py-1 px-2 bg-gray-50 rounded-lg border border-gray-100">
                                                            <button
                                                                type="button"
                                                                onClick={() => moveSituation(sitIdx, 'up')}
                                                                disabled={sitIdx === 0}
                                                                className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                                title="ย้ายขึ้น"
                                                            >
                                                                <ArrowUp className="w-4 h-4" />
                                                            </button>
                                                            <div className="w-[1px] h-3 bg-gray-200"></div>
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
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeSituation(sitIdx)}
                                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                            title="ลบสถานการณ์"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleSituationCollapse(sitIdx)}
                                                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                                                        >
                                                            {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Questions */}
                                            {!isCollapsed && (
                                                <div className="p-4 sm:p-6 space-y-4 bg-gray-50/30">
                                                    {/* Situation Details */}
                                                    <div className="space-y-3 mb-6">
                                                        <div className="space-y-2">
                                                            <label className="text-base text-gray-700">รายละเอียดสถานการณ์ <span className="text-red-500">*</span></label>
                                                            <textarea
                                                                value={situation.situation_text}
                                                                onChange={(e) => updateSituation(sitIdx, 'situation_text', e.target.value)}
                                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-y text-base"
                                                                rows={3}
                                                                placeholder="รายละเอียดสถานการณ์..."
                                                                required
                                                            />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <label className="text-base font-medium text-gray-700">URL รูปภาพ (ถ้ามี)</label>
                                                            <input
                                                                type="text"
                                                                value={situation.situation_image_url || ''}
                                                                onChange={(e) => updateSituation(sitIdx, 'situation_image_url', e.target.value)}
                                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-base"
                                                                placeholder="https://example.com/image.jpg"
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className="sticky top-0 z-10 bg-gray-50 py-2 flex items-center justify-between flex-wrap gap-3">
                                                        <h4 className="text-base sm:text-lg font-bold text-gray-800">
                                                            คำถาม
                                                        </h4>
                                                        <button
                                                            type="button"
                                                            onClick={() => addQuestion(sitIdx)}
                                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-all active:scale-95"
                                                        >
                                                            <Plus className="w-4 h-4" />
                                                            เพิ่มคำถาม
                                                        </button>
                                                    </div>

                                                    {situation.questions.length === 0 ? (
                                                        <div className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-8 text-center">
                                                            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                                                            <p className="text-gray-500 text-sm">ยังไม่มีคำถามในสถานการณ์นี้</p>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-4">
                                                            {situation.questions.map((question, qIdx) => {
                                                                const isQCollapsed = collapsedQuestions.has(`${sitIdx}-${qIdx}`);
                                                                return (
                                                                    <div id={`question-${sitIdx}-${qIdx}`} key={qIdx} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden scroll-mt-32">
                                                                        {/* Question Header */}
                                                                        <div className="bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                                                                            <div className="flex items-center gap-3">
                                                                                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm border border-blue-100">
                                                                                    {questionStartIndex + qIdx + 1}
                                                                                </div>
                                                                                <h5 className="font-bold text-gray-700 text-sm sm:text-base">ข้อที่ {questionStartIndex + qIdx + 1}</h5>

                                                                                <div className="flex items-center gap-1 ml-2 py-0.5 px-1 bg-gray-50 rounded border border-gray-100">
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
                                                                            </div>

                                                                            <div className="flex items-center gap-1">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => removeQuestion(sitIdx, qIdx)}
                                                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                                    title="ลบคำถาม"
                                                                                >
                                                                                    <Trash2 className="w-4 h-4" />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => toggleQuestionCollapse(sitIdx, qIdx)}
                                                                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all"
                                                                                >
                                                                                    {isQCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        {/* Question Content */}
                                                                        {!isQCollapsed && (
                                                                            <div className="p-4 sm:p-5 space-y-4">
                                                                                {/* Question Text */}
                                                                                <div className="space-y-2">
                                                                                    <label className="text-base font-medium text-gray-700">โจทย์คำถาม <span className="text-red-500">*</span></label>
                                                                                    <textarea
                                                                                        value={question.question_text}
                                                                                        onChange={(e) => updateQuestion(sitIdx, qIdx, 'question_text', e.target.value)}
                                                                                        className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none text-base"
                                                                                        rows={2}
                                                                                        placeholder="กรอกโจทย์คำถาม..."
                                                                                        required
                                                                                    />
                                                                                </div>

                                                                                {/* Answer Options */}
                                                                                <div className="space-y-3">
                                                                                    <label className="text-base font-bold text-gray-800">ตัวเลือกคำตอบ </label>
                                                                                    <div className="space-y-2">
                                                                                        {question.answer_options.map((option, optIdx) => (
                                                                                            <div key={optIdx} className="flex gap-2 sm:gap-3 items-center">
                                                                                                <div className="flex-none flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 text-sm font-bold text-gray-600">
                                                                                                    {String.fromCharCode(65 + optIdx)}
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
                                                                                        ))}
                                                                                    </div>
                                                                                </div>

                                                                                {/* Advanced Options */}
                                                                                <details className="group">
                                                                                    <summary className="cursor-pointer list-none">
                                                                                        <div className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors">
                                                                                            <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                                                                <svg className="w-4 h-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                                                                </svg>
                                                                                                ตัวเลือกขั้นสูง
                                                                                            </span>
                                                                                            <span className="text-xs text-gray-500">คำอธิบาย, หัวข้อย่อย, IRT</span>
                                                                                        </div>
                                                                                    </summary>

                                                                                    <div className="mt-3 p-4 bg-gray-50 rounded-lg space-y-4">
                                                                                        {/* Explanation - Moved back to advanced options and made optional */}
                                                                                        <div className="space-y-2">
                                                                                            <label className="text-base font-medium text-gray-700">คำอธิบายเฉลย</label>
                                                                                            <textarea
                                                                                                value={question.explanation}
                                                                                                onChange={(e) => updateQuestion(sitIdx, qIdx, 'explanation', e.target.value)}
                                                                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none text-base"
                                                                                                rows={3}
                                                                                                placeholder="อธิบายที่มาของคำตอบ (ถ้ามี)..."
                                                                                            />
                                                                                        </div>

                                                                                        {/* Sub Topic */}
                                                                                        <div className="space-y-2">
                                                                                            <div className="flex items-center justify-between">
                                                                                                <label className="text-base font-medium text-gray-700">หัวข้อย่อย</label>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => setShowAddSubTopicModal(true)}
                                                                                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                                                                                >
                                                                                                    <Plus className="w-3 h-3" />
                                                                                                    เพิ่มหัวข้อย่อยใหม่
                                                                                                </button>
                                                                                            </div>
                                                                                            <select
                                                                                                value={question.sub_topic_id || ''}
                                                                                                onChange={(e) => updateQuestion(sitIdx, qIdx, 'sub_topic_id', e.target.value)}
                                                                                                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-white text-base"
                                                                                            >
                                                                                                <option value="">-- เลือกหัวข้อย่อย --</option>
                                                                                                {topics.map(topic => (
                                                                                                    <optgroup key={topic.topic_id} label={topic.topic_name}>
                                                                                                        {subTopics
                                                                                                            .filter(st => st.topic_id === topic.topic_id)
                                                                                                            .map(st => (
                                                                                                                <option key={st.sub_topic_id} value={st.sub_topic_id}>
                                                                                                                    {st.sub_topic_name}
                                                                                                                </option>
                                                                                                            ))
                                                                                                        }
                                                                                                    </optgroup>
                                                                                                ))}
                                                                                            </select>
                                                                                        </div>

                                                                                        {/* IRT Parameters */}
                                                                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white rounded-lg border border-gray-200">
                                                                                            <div className="space-y-1">
                                                                                                <label className="text-[10px] uppercase font-bold text-gray-500">Discrimination (a)</label>
                                                                                                <input
                                                                                                    type="number"
                                                                                                    step="0.01"
                                                                                                    value={question.irt_a_discrimination || ''}
                                                                                                    onChange={(e) => updateQuestion(sitIdx, qIdx, 'irt_a_discrimination', e.target.value)}
                                                                                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                                                                                />
                                                                                            </div>
                                                                                            <div className="space-y-1">
                                                                                                <label className="text-[10px] uppercase font-bold text-gray-500">Difficulty (b)</label>
                                                                                                <input
                                                                                                    type="number"
                                                                                                    step="0.01"
                                                                                                    value={question.irt_b_difficulty || ''}
                                                                                                    onChange={(e) => updateQuestion(sitIdx, qIdx, 'irt_b_difficulty', e.target.value)}
                                                                                                    className="w-full px-3 py-1.5 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-green-500 outline-none"
                                                                                                />
                                                                                            </div>
                                                                                            <div className="space-y-1">
                                                                                                <label className="text-[10px] uppercase font-bold text-gray-500">Guessing (c)</label>
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
                                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 py-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
        </Navbar_admin>
    );
}
