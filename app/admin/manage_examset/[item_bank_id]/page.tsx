'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Navbar_admin from "@/components/Navbar_admin";
import { useParams, useRouter } from 'next/navigation';
import { Plus, Trash2, Save, FileText, AlertCircle, ChevronLeft, Loader2, ChevronDown, ChevronUp, ArrowUp, ArrowDown, ArrowLeft, Settings, Clock, Calendar, CheckCircle, XCircle, Tag, Layers } from 'lucide-react';
import Swal from 'sweetalert2';
import Link from 'next/link';

// Types
interface AnswerOption {
    option_id?: number;
    option_text: string;
    is_correct: boolean;
}

interface Question {
    item_id?: number;
    question_text: string;
    question_type: string;
    explanation: string;
    sub_topic_id?: number;
    irt_a_discrimination?: number;
    irt_b_difficulty?: number;
    irt_c_guessing?: number;
    answer_options: AnswerOption[];
}

interface Situation {
    situation_id?: number;
    situation_text: string;
    situation_image_url?: string;
    questions: Question[];
}

interface SubTopic {
    sub_topic_id: number;
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
    const itemBankId = params.item_bank_id as string;

    const [situations, setSituations] = useState<Situation[]>([]);
    const [subTopics, setSubTopics] = useState<SubTopic[]>([]);
    const [itemBankInfo, setItemBankInfo] = useState<ItemBankDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [collapsedSituations, setCollapsedSituations] = useState<Set<number>>(new Set());
    const [collapsedQuestions, setCollapsedQuestions] = useState<Set<string>>(new Set());


    useEffect(() => {
        if (itemBankId) {
            initData();
        }
    }, [itemBankId]);

    const initData = async () => {
        setLoading(true);
        await Promise.all([
            fetchItemBankInfo(),
            fetchSubTopics(),
            fetchExistingItems()
        ]);
        setLoading(false);
    };

    const fetchItemBankInfo = async () => {
        try {
            const response = await fetch(`${API_URL}/items-bank/${itemBankId}`, {
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
            const response = await fetch(`${API_URL}/sub-topics`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setSubTopics(data);
            }
        } catch (error) {
            console.error('Error fetching sub topics:', error);
        }
    };

    const fetchExistingItems = async () => {
        try {
            const response = await fetch(`${API_URL}/items-bank/${itemBankId}/items`, {
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
                                    situation_text: item.situation.situation_text,
                                    situation_image_url: item.situation.situation_image_url,
                                    questions: []
                                });
                            }

                            situationsMap.get(sitId)!.questions.push({
                                item_id: item.item_id,
                                question_text: item.question_text,
                                question_type: item.question_type,
                                explanation: item.explanation,
                                sub_topic_id: item.sub_topics?.[0]?.sub_topic_id,
                                irt_a_discrimination: item.irt_a_discrimination,
                                irt_b_difficulty: item.irt_b_difficulty,
                                irt_c_guessing: item.irt_c_guessing,
                                answer_options: item.answer_options || []
                            });
                        }
                    });
                }

                setSituations(Array.from(situationsMap.values()));
            }
        } catch (error) {
            console.error('Error fetching existing items:', error);
        }
    };

    const addSituation = () => {
        const newSituation: Situation = {
            situation_text: '',
            situation_image_url: '',
            questions: []
        };
        setSituations([...situations, newSituation]);
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
                const response = await fetch(`${API_URL}/items-bank/situation/${situation.situation_id}`, {
                    method: 'DELETE',
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
            question_type: 'multiple_choice',
            explanation: '',
            answer_options: [
                { option_text: '', is_correct: true },
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
                { option_text: '', is_correct: false },
            ]
        };
        const newSituations = [...situations];
        newSituations[situationIndex].questions.push(newQuestion);
        setSituations(newSituations);
    };

    const removeQuestion = async (situationIndex: number, questionIndex: number) => {
        const result = await Swal.fire({
            title: 'คุณแน่ใจหรือไม่?',
            text: 'ต้องการลบคำถามนี้หรือไม่?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true
        });

        if (result.isConfirmed) {
            const newSituations = [...situations];
            newSituations[situationIndex].questions = newSituations[situationIndex].questions.filter((_, i) => i !== questionIndex);
            setSituations(newSituations);
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
            let updatedSituationCount = 0;
            let createdSituationCount = 0;
            let addedQuestionCount = 0;
            const updatedSituations = [...situations];

            for (let sitIdx = 0; sitIdx < situations.length; sitIdx++) {
                const situation = situations[sitIdx];
                if (situation.situation_id) {
                    // อัพเดท situation ที่มีอยู่แล้ว
                    await fetch(`${API_URL}/items-bank/situation/${situation.situation_id}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({
                            situation_text: situation.situation_text,
                            situation_image_url: situation.situation_image_url || ''
                        })
                    });

                    // แยกคำถามที่มีอยู่แล้ว และคำถามใหม่
                    const existingQuestions = situation.questions.filter(q => q.item_id);
                    const newQuestions = situation.questions.filter(q => !q.item_id);

                    // อัพเดทคำถามที่มีอยู่แล้ว
                    for (const question of existingQuestions) {
                        await fetch(`${API_URL}/items-bank/item/${question.item_id}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                                question_text: question.question_text,
                                question_type: question.question_type,
                                explanation: question.explanation,
                                sub_topic_id: question.sub_topic_id ? Number(question.sub_topic_id) : undefined,
                                irt_a_discrimination: question.irt_a_discrimination ? Number(question.irt_a_discrimination) : 0,
                                irt_b_difficulty: question.irt_b_difficulty ? Number(question.irt_b_difficulty) : 0,
                                irt_c_guessing: question.irt_c_guessing ? Number(question.irt_c_guessing) : 0,
                                answer_options: question.answer_options
                            })
                        });
                    }

                    // เพิ่มคำถามใหม่เข้าใน situation ที่มีอยู่แล้ว
                    if (newQuestions.length > 0) {
                        const response = await fetch(`${API_URL}/items-bank/situation/${situation.situation_id}/questions`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                                item_bank_id: Number(itemBankId),
                                questions: newQuestions.map(q => ({
                                    question_text: q.question_text,
                                    question_type: q.question_type,
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
                    const data = {
                        item_bank_id: Number(itemBankId),
                        situation_text: situation.situation_text,
                        situation_image_url: situation.situation_image_url || '',
                        questions: situation.questions.map(q => ({
                            question_text: q.question_text,
                            question_type: q.question_type,
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
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify(data)
                    });

                    if (!response.ok) {
                        const result = await response.json();
                        throw new Error(Array.isArray(result.message) ? result.message.join(', ') : result.message);
                    }

                    // อัพเดท state ด้วย situation_id และ item_ids ที่ได้จาก backend
                    const createdData = await response.json();
                    if (createdData.situation_id) {
                        updatedSituations[sitIdx].situation_id = createdData.situation_id;
                        // อัพเดท item_ids ของคำถามด้วย
                        if (createdData.items && Array.isArray(createdData.items)) {
                            createdData.items.forEach((item: any, qIdx: number) => {
                                if (updatedSituations[sitIdx].questions[qIdx]) {
                                    updatedSituations[sitIdx].questions[qIdx].item_id = item.item_id;
                                }
                            });
                        }
                    }

                    createdSituationCount++;
                }
            }

            // อัพเดท state ด้วยข้อมูลใหม่
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

    return (
        <Navbar_admin>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                {/* Back Button */}
                <Link
                    href="/admin/manage_examset"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    กลับ
                </Link>
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-4">
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">
                                    {itemBankInfo?.bank_name || 'Loading...'}
                                </h1>
                                <p className="text-sm sm:text-base text-gray-600">
                                    {itemBankInfo?.description || 'กำลังโหลดข้อมูล...'}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-auto">
                            <button
                                type="button"
                                onClick={() => router.push(`/admin/manage_examset/${itemBankId}/setting`)}
                                className="flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm whitespace-nowrap"
                            >
                                <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                                การตั้งค่า
                            </button>
                            <button
                                onClick={addSituation}
                                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm whitespace-nowrap"
                            >
                                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                เพิ่มสถานการณ์
                            </button>
                        </div>
                    </div>

                    {/* Item Bank Info Grid */}
                    {itemBankInfo && (
                        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* Total Questions */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">จำนวนข้อทั้งหมด</p>
                                    <p className="text-gray-900 font-semibold text-lg">
                                        {situations.reduce((acc, s) => acc + s.questions.length, 0)} ข้อ
                                    </p>
                                </div>
                            </div>

                            {/* Duration */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                    <Clock className="w-6 h-6" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">ระยะเวลาสอบ</p>
                                    <p className="text-gray-900 font-semibold">
                                        {Math.floor(itemBankInfo.duration / 60)} นาที
                                    </p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                                <div className={`p-3 rounded-lg ${itemBankInfo.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                    {itemBankInfo.is_active ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">สถานะ</p>
                                    <p className={`font-semibold ${itemBankInfo.is_active ? 'text-green-700' : 'text-red-700'}`}>
                                        {itemBankInfo.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                    </p>
                                </div>
                            </div>


                            {/* Categories */}
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                                    <Layers className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">หมวดหมู่</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {itemBankInfo.categories && itemBankInfo.categories.length > 0 ? (
                                            itemBankInfo.categories.slice(0, 2).map((cat, idx) => (
                                                <span key={idx} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200 truncate max-w-full">
                                                    {cat.category_name}
                                                </span>
                                            ))
                                        ) : (
                                            <span className="text-gray-400 text-sm italic">- ไม่มี -</span>
                                        )}
                                        {itemBankInfo.categories && itemBankInfo.categories.length > 2 && (
                                            <span className="text-xs text-gray-500 ml-1">+{itemBankInfo.categories.length - 2}</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content */}
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
                                    <div key={sitIdx} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                                        {/* Situation Header */}
                                        <div className={`px-4 sm:px-6 py-4 sm:py-5 ${situation.situation_id ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-gray-500 to-gray-600'}`}>
                                            <div className="flex items-start justify-between gap-3 sm:gap-4">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSituationCollapse(sitIdx)}
                                                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                                        title={isCollapsed ? "ขยาย" : "หุบ"}
                                                    >
                                                        {isCollapsed ? <ChevronDown className="w-5 h-5 text-white" /> : <ChevronUp className="w-5 h-5 text-white" />}
                                                    </button>
                                                    <div className="flex flex-col gap-0.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => moveSituation(sitIdx, 'up')}
                                                            disabled={sitIdx === 0}
                                                            className="p-0.5 bg-white/20 hover:bg-white/30 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                            title="ย้ายขึ้น"
                                                        >
                                                            <ArrowUp className="w-3.5 h-3.5 text-white" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => moveSituation(sitIdx, 'down')}
                                                            disabled={sitIdx === situations.length - 1}
                                                            className="p-0.5 bg-white/20 hover:bg-white/30 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                            title="ย้ายลง"
                                                        >
                                                            <ArrowDown className="w-3.5 h-3.5 text-white" />
                                                        </button>
                                                    </div>
                                                    <h5 className="font-bold text-white text-base sm:text-lg ml-2">สถานการณ์ที่ {sitIdx + 1}</h5>
                                                </div>

                                                <div className="flex-1"></div>

                                                <button
                                                    type="button"
                                                    onClick={() => removeSituation(sitIdx)}
                                                    className="p-2 bg-white/20 hover:bg-red-500 rounded-lg transition-colors flex-shrink-0"
                                                    title="ลบสถานการณ์"
                                                >
                                                    <Trash2 className="w-5 h-5 text-white" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Questions */}
                                        {!isCollapsed && (
                                            <div className="p-4 sm:p-6 space-y-4 bg-gray-50">
                                                {/* Situation Details */}
                                                <div className="space-y-3 mb-6">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">รายละเอียดสถานการณ์ <span className="text-red-500">*</span></label>
                                                        <textarea
                                                            value={situation.situation_text}
                                                            onChange={(e) => updateSituation(sitIdx, 'situation_text', e.target.value)}
                                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                                                            rows={3}
                                                            placeholder="รายละเอียดสถานการณ์..."
                                                            required
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium text-gray-700">URL รูปภาพ (ถ้ามี)</label>
                                                        <input
                                                            type="text"
                                                            value={situation.situation_image_url || ''}
                                                            onChange={(e) => updateSituation(sitIdx, 'situation_image_url', e.target.value)}
                                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
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
                                                                <div key={qIdx} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                                                    {/* Question Header */}
                                                                    <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                                                                        <div className="flex items-center gap-2">
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => toggleQuestionCollapse(sitIdx, qIdx)}
                                                                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                                                                                title={isQCollapsed ? "ขยาย" : "หุบ"}
                                                                            >
                                                                                {isQCollapsed ? <ChevronDown className="w-4 h-4 text-gray-600" /> : <ChevronUp className="w-4 h-4 text-gray-600" />}
                                                                            </button>

                                                                            <div className="flex flex-col gap-0.5">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => moveQuestion(sitIdx, qIdx, 'up')}
                                                                                    disabled={qIdx === 0}
                                                                                    className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                                                    title="ย้ายขึ้น"
                                                                                >
                                                                                    <ArrowUp className="w-3 h-3 text-gray-600" />
                                                                                </button>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => moveQuestion(sitIdx, qIdx, 'down')}
                                                                                    disabled={qIdx === situation.questions.length - 1}
                                                                                    className="p-0.5 hover:bg-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                                                    title="ย้ายลง"
                                                                                >
                                                                                    <ArrowDown className="w-3 h-3 text-gray-600" />
                                                                                </button>
                                                                            </div>

                                                                            <h5 className="font-bold text-gray-800 text-sm sm:text-base">คำถามข้อที่ {questionStartIndex + qIdx + 1}</h5>
                                                                        </div>
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => removeQuestion(sitIdx, qIdx)}
                                                                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                                                            title="ลบคำถาม"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </button>
                                                                    </div>

                                                                    {/* Question Content */}
                                                                    {!isQCollapsed && (
                                                                        <div className="p-4 sm:p-5 space-y-4">
                                                                            {/* Question Text */}
                                                                            <div className="space-y-2">
                                                                                <label className="text-sm font-medium text-gray-700">โจทย์คำถาม <span className="text-red-500">*</span></label>
                                                                                <textarea
                                                                                    value={question.question_text}
                                                                                    onChange={(e) => updateQuestion(sitIdx, qIdx, 'question_text', e.target.value)}
                                                                                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                                                                                    rows={2}
                                                                                    placeholder="กรอกโจทย์คำถาม..."
                                                                                    required
                                                                                />
                                                                            </div>

                                                                            {/* Answer Options */}
                                                                            <div className="space-y-3">
                                                                                <label className="text-sm font-bold text-gray-800">ตัวเลือกคำตอบ (เลือกข้อที่ถูกต้อง)</label>
                                                                                <div className="space-y-2">
                                                                                    {question.answer_options.map((option, optIdx) => (
                                                                                        <div key={optIdx} className="flex gap-2 sm:gap-3 items-center">
                                                                                            <div className="flex-none flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                                                                                                {String.fromCharCode(65 + optIdx)}
                                                                                            </div>
                                                                                            <input
                                                                                                type="text"
                                                                                                value={option.option_text}
                                                                                                onChange={(e) => updateAnswerOption(sitIdx, qIdx, optIdx, 'option_text', e.target.value)}
                                                                                                className="flex-1 px-3 sm:px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all text-sm"
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
                                                                                        <label className="text-sm font-medium text-gray-700">คำอธิบายเฉลย</label>
                                                                                        <textarea
                                                                                            value={question.explanation}
                                                                                            onChange={(e) => updateQuestion(sitIdx, qIdx, 'explanation', e.target.value)}
                                                                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all resize-none text-sm"
                                                                                            rows={3}
                                                                                            placeholder="อธิบายที่มาของคำตอบ (ถ้ามี)..."
                                                                                        />
                                                                                    </div>

                                                                                    {/* Sub Topic */}
                                                                                    <div className="space-y-2">
                                                                                        <label className="text-sm font-medium text-gray-700">หัวข้อย่อย</label>
                                                                                        <select
                                                                                            value={question.sub_topic_id || ''}
                                                                                            onChange={(e) => updateQuestion(sitIdx, qIdx, 'sub_topic_id', e.target.value)}
                                                                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all bg-white text-sm"
                                                                                        >
                                                                                            <option value="">-- เลือกหัวข้อย่อย --</option>
                                                                                            {subTopics.map(st => (
                                                                                                <option key={st.sub_topic_id} value={st.sub_topic_id}>
                                                                                                    {st.sub_topic_name}
                                                                                                </option>
                                                                                            ))}
                                                                                        </select>
                                                                                    </div>

                                                                                    {/* IRT Parameters */}
                                                                                    <div className="grid grid-cols-3 gap-3 p-4 bg-white rounded-lg border border-gray-200">
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
                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-2.5 rounded-lg font-medium shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            กำลังบันทึก...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            บันทึกทั้งหมด
                                        </>
                                    )}
                                </button>
                            </div>
                        </>
                    )}
                </form>
            </div>
        </Navbar_admin >
    );
}
