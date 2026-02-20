'use client';

import React, { useState, useEffect } from 'react';
import Navbar_admin from "@/components/Navbar_admin";
import { Plus, Edit2, Trash2, ChevronDown, ChevronRight, BookOpen, List, Loader2, X } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from '@/contexts/AuthContext';

interface SubTopic {
    sub_topic_id: number;
    topic_id: number;
    sub_topic_name: string;
    description?: string;
}

interface Topic {
    topic_id: number;
    topic_name: string;
    description?: string;
    sub_topics: SubTopic[];
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function ManageTopicsPage() {
    const { isAuthenticated, isLoading: authLoading, getToken } = useAuth();
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());

    // Modal states
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [showSubTopicModal, setShowSubTopicModal] = useState(false);
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
    const [editingSubTopic, setEditingSubTopic] = useState<SubTopic | null>(null);
    const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

    // Form states
    const [topicName, setTopicName] = useState('');
    const [topicDescription, setTopicDescription] = useState('');
    const [subTopicName, setSubTopicName] = useState('');
    const [subTopicDescription, setSubTopicDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!authLoading && isAuthenticated) {
            fetchTopics();
        } else if (!authLoading && !isAuthenticated) {
            setLoading(false);
        }
    }, [authLoading, isAuthenticated]);

    const fetchTopics = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const response = await fetch(`${API_URL}/topics`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setTopics(data);
            }
        } catch (error) {
            console.error('Error fetching topics:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถโหลดข้อมูลหัวข้อได้'
            });
        } finally {
            setLoading(false);
        }
    };

    const toggleTopic = (topicId: number) => {
        const newExpanded = new Set(expandedTopics);
        if (newExpanded.has(topicId)) {
            newExpanded.delete(topicId);
        } else {
            newExpanded.add(topicId);
        }
        setExpandedTopics(newExpanded);
    };

    const handleCreateTopic = () => {
        setEditingTopic(null);
        setTopicName('');
        setTopicDescription('');
        setShowTopicModal(true);
    };

    const handleEditTopic = (topic: Topic) => {
        setEditingTopic(topic);
        setTopicName(topic.topic_name);
        setTopicDescription(topic.description || '');
        setShowTopicModal(true);
    };

    const handleCreateSubTopic = (topicId: number) => {
        setEditingSubTopic(null);
        setSelectedTopicId(topicId);
        setSubTopicName('');
        setSubTopicDescription('');
        setShowSubTopicModal(true);
    };

    const handleEditSubTopic = (subTopic: SubTopic) => {
        setEditingSubTopic(subTopic);
        setSelectedTopicId(subTopic.topic_id);
        setSubTopicName(subTopic.sub_topic_name);
        setSubTopicDescription(subTopic.description || '');
        setShowSubTopicModal(true);
    };

    const submitTopic = async () => {
        if (!topicName.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณากรอกข้อมูล',
                text: 'กรุณากรอกชื่อหัวข้อหลัก'
            });
            return;
        }

        setSubmitting(true);
        try {
            const url = editingTopic
                ? `${API_URL}/topics/${editingTopic.topic_id}`
                : `${API_URL}/topics`;

            const method = editingTopic ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    topic_name: topicName,
                    description: topicDescription || undefined
                })
            });

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'สำเร็จ!',
                    text: editingTopic ? 'แก้ไขหัวข้อหลักเรียบร้อย' : 'สร้างหัวข้อหลักเรียบร้อย',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowTopicModal(false);
                fetchTopics();
            } else {
                throw new Error('Failed to save topic');
            }
        } catch (error) {
            console.error('Error saving topic:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกหัวข้อได้'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const submitSubTopic = async () => {
        if (!subTopicName.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณากรอกข้อมูล',
                text: 'กรุณากรอกชื่อหัวข้อย่อย'
            });
            return;
        }

        setSubmitting(true);
        try {
            const url = editingSubTopic
                ? `${API_URL}/topics/sub-topic/${editingSubTopic.sub_topic_id}`
                : `${API_URL}/topics/${selectedTopicId}/sub-topics`;

            const method = editingSubTopic ? 'PATCH' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    sub_topic_name: subTopicName,
                    description: subTopicDescription || undefined
                })
            });

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'สำเร็จ!',
                    text: editingSubTopic ? 'แก้ไขหัวข้อย่อยเรียบร้อย' : 'สร้างหัวข้อย่อยเรียบร้อย',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowSubTopicModal(false);
                fetchTopics();
            } else {
                throw new Error('Failed to save subtopic');
            }
        } catch (error) {
            console.error('Error saving subtopic:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกหัวข้อย่อยได้'
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteTopic = async (topic: Topic) => {
        const result = await Swal.fire({
            title: 'คุณแน่ใจหรือไม่?',
            html: `ต้องการลบหัวข้อ "<strong>${topic.topic_name}</strong>" ใช่หรือไม่?<br/><span class="text-red-600">จะลบหัวข้อย่อยทั้งหมด (${topic.sub_topics.length} รายการ) ด้วย</span>`,
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
            const response = await fetch(`${API_URL}/topics/${topic.topic_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                },
                credentials: 'include'
            });

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'ลบสำเร็จ!',
                    text: 'ลบหัวข้อหลักเรียบร้อยแล้ว',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchTopics();
            } else {
                throw new Error('Failed to delete topic');
            }
        } catch (error) {
            console.error('Error deleting topic:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถลบหัวข้อได้'
            });
        }
    };

    const handleDeleteSubTopic = async (subTopic: SubTopic) => {
        const result = await Swal.fire({
            title: 'คุณแน่ใจหรือไม่?',
            text: `ต้องการลบหัวข้อย่อย "${subTopic.sub_topic_name}" ใช่หรือไม่?`,
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
            const response = await fetch(`${API_URL}/topics/sub-topic/${subTopic.sub_topic_id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${getToken()}`
                },
                credentials: 'include'
            });

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'ลบสำเร็จ!',
                    text: 'ลบหัวข้อย่อยเรียบร้อยแล้ว',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchTopics();
            } else {
                throw new Error('Failed to delete subtopic');
            }
        } catch (error) {
            console.error('Error deleting subtopic:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถลบหัวข้อย่อยได้'
            });
        }
    };

    if (loading) {
        return (
            <Navbar_admin>
                <div className="flex items-center justify-center min-h-screen">
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
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">
                                จัดการหัวข้อ
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600">
                                จัดการหัวข้อหลักและหัวข้อย่อยสำหรับข้อสอบ
                            </p>
                        </div>
                        <button
                            onClick={handleCreateTopic}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            เพิ่มหัวข้อหลัก
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6">
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 sm:p-6 border border-green-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-green-600 font-medium mb-1 text-sm sm:text-base">หัวข้อหลัก</p>
                                <p className="text-2xl sm:text-3xl font-bold text-green-700">{topics.length}</p>
                            </div>
                            <BookOpen className="w-10 h-10 sm:w-12 sm:h-12 text-green-600 opacity-50" />
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 sm:p-6 border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-600 font-medium mb-1 text-sm sm:text-base">หัวข้อย่อย</p>
                                <p className="text-2xl sm:text-3xl font-bold text-blue-700">
                                    {topics.reduce((sum, topic) => sum + topic.sub_topics.length, 0)}
                                </p>
                            </div>
                            <List className="w-10 h-10 sm:w-12 sm:h-12 text-blue-600 opacity-50" />
                        </div>
                    </div>
                </div>

                {/* Topics List */}
                {topics.length === 0 ? (
                    <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-8 sm:p-12 text-center">
                        <BookOpen className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-2">ยังไม่มีหัวข้อ</h3>
                        <p className="text-sm sm:text-base text-gray-500 mb-6">เริ่มต้นสร้างหัวข้อหลักเพื่อจัดระเบียบข้อสอบ</p>
                        <button
                            onClick={handleCreateTopic}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold inline-flex items-center gap-2 text-sm sm:text-base"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            เพิ่มหัวข้อแรก
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {topics.map((topic) => {
                            const isExpanded = expandedTopics.has(topic.topic_id);
                            return (
                                <div key={topic.topic_id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
                                    {/* Topic Header */}
                                    <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 sm:px-6 py-3 sm:py-4">
                                        <div className="flex items-center justify-between gap-2 sm:gap-4">
                                            <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                                <button
                                                    onClick={() => toggleTopic(topic.topic_id)}
                                                    className="p-1 sm:p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex-shrink-0"
                                                >
                                                    {isExpanded ? (
                                                        <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                    ) : (
                                                        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                    )}
                                                </button>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-base sm:text-lg font-bold text-white truncate">{topic.topic_name}</h3>
                                                    {topic.description && (
                                                        <p className="text-green-100 text-xs sm:text-sm mt-1 line-clamp-1">{topic.description}</p>
                                                    )}
                                                </div>
                                                <div className="bg-white/20 px-2 sm:px-3 py-1 rounded-full flex-shrink-0">
                                                    <span className="text-white text-xs sm:text-sm font-medium whitespace-nowrap">
                                                        {topic.sub_topics.length} หัวข้อย่อย
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                                                <button
                                                    onClick={() => handleCreateSubTopic(topic.topic_id)}
                                                    className="p-1.5 sm:p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                                    title="เพิ่มหัวข้อย่อย"
                                                >
                                                    <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                </button>
                                                <button
                                                    onClick={() => handleEditTopic(topic)}
                                                    className="p-1.5 sm:p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                                    title="แก้ไข"
                                                >
                                                    <Edit2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTopic(topic)}
                                                    className="p-1.5 sm:p-2 bg-red-500/80 hover:bg-red-600 rounded-lg transition-colors"
                                                    title="ลบ"
                                                >
                                                    <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* SubTopics */}
                                    {isExpanded && (
                                        <div className="p-4 sm:p-6">
                                            {topic.sub_topics.length === 0 ? (
                                                <div className="text-center py-6 sm:py-8 border-2 border-dashed border-gray-300 rounded-lg">
                                                    <List className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-3" />
                                                    <p className="text-sm sm:text-base text-gray-500 mb-4">ยังไม่มีหัวข้อย่อย</p>
                                                    <button
                                                        onClick={() => handleCreateSubTopic(topic.topic_id)}
                                                        className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1 text-sm sm:text-base"
                                                    >
                                                        <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
                                                        เพิ่มหัวข้อย่อย
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                                                    {topic.sub_topics.map((subTopic) => (
                                                        <div
                                                            key={subTopic.sub_topic_id}
                                                            className="bg-gray-50 border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow"
                                                        >
                                                            <div className="flex items-start justify-between gap-2 sm:gap-3">
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-semibold text-gray-900 mb-1 text-sm sm:text-base line-clamp-2">
                                                                        {subTopic.sub_topic_name}
                                                                    </h4>
                                                                    {subTopic.description && (
                                                                        <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{subTopic.description}</p>
                                                                    )}
                                                                </div>
                                                                <div className="flex items-center gap-1 flex-shrink-0">
                                                                    <button
                                                                        onClick={() => handleEditSubTopic(subTopic)}
                                                                        className="p-1 sm:p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                        title="แก้ไข"
                                                                    >
                                                                        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteSubTopic(subTopic)}
                                                                        className="p-1 sm:p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                                        title="ลบ"
                                                                    >
                                                                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Topic Modal */}
                {showTopicModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                            <div className="bg-green-600 px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl flex items-center justify-between">
                                <h3 className="text-lg sm:text-xl font-bold text-white">
                                    {editingTopic ? 'แก้ไขหัวข้อหลัก' : 'เพิ่มหัวข้อหลัก'}
                                </h3>
                                <button
                                    onClick={() => setShowTopicModal(false)}
                                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </button>
                            </div>
                            <div className="p-4 sm:p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        ชื่อหัวข้อหลัก <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={topicName}
                                        onChange={(e) => setTopicName(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                                        placeholder="เช่น เภสัชวิทยา"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        คำอธิบาย
                                    </label>
                                    <textarea
                                        value={topicDescription}
                                        onChange={(e) => setTopicDescription(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm sm:text-base"
                                        rows={3}
                                        placeholder="อธิบายเกี่ยวกับหัวข้อนี้"
                                    />
                                </div>
                            </div>
                            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                                <button
                                    onClick={() => setShowTopicModal(false)}
                                    className="px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors text-sm sm:text-base"
                                    disabled={submitting}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={submitTopic}
                                    className="px-4 sm:px-5 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 text-sm sm:text-base"
                                    disabled={submitting}
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* SubTopic Modal */}
                {showSubTopicModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                            <div className="bg-green-600 px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl flex items-center justify-between">
                                <h3 className="text-lg sm:text-xl font-bold text-white">
                                    {editingSubTopic ? 'แก้ไขหัวข้อย่อย' : 'เพิ่มหัวข้อย่อย'}
                                </h3>
                                <button
                                    onClick={() => setShowSubTopicModal(false)}
                                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </button>
                            </div>
                            <div className="p-4 sm:p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        ชื่อหัวข้อย่อย <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={subTopicName}
                                        onChange={(e) => setSubTopicName(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                                        placeholder="เช่น ยาต้านจุลชีพ"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        คำอธิบาย
                                    </label>
                                    <textarea
                                        value={subTopicDescription}
                                        onChange={(e) => setSubTopicDescription(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm sm:text-base"
                                        rows={3}
                                        placeholder="อธิบายเกี่ยวกับหัวข้อย่อยนี้"
                                    />
                                </div>
                            </div>
                            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                                <button
                                    onClick={() => setShowSubTopicModal(false)}
                                    className="px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors text-sm sm:text-base"
                                    disabled={submitting}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={submitSubTopic}
                                    className="px-4 sm:px-5 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 text-sm sm:text-base"
                                    disabled={submitting}
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Navbar_admin>
    );
}
