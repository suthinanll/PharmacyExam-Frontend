"use client";

import React, { useState, useEffect, useCallback } from "react";
import Navbar_admin from "@/components/Navbar_admin";
import {
    Plus, Edit2, Trash2, ChevronDown, ChevronRight,
    BookOpen, List, Loader2, X, PieChart as PieChartIcon,
    LayoutGrid, Table as TableIcon, Search, ArrowUpDown
} from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from "@/contexts/AuthContext";
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from "recharts";

// ─── Types ───────────────────────────────────────────
interface SubTopic {
    sub_topic_id: number;
    topic_id: number;
    sub_topic_name: string;
    description?: string;
    item_count?: number;
}

interface Topic {
    topic_id: number;
    topic_name: string;
    description?: string;
    sub_topics: SubTopic[];
    item_count?: number;
}

interface TopicStats {
    total_items: number;
    by_topic: Topic[];
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;
const COLORS = [
    "#10B981", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6",
    "#EC4899", "#6366F1", "#14B8A6", "#F97316", "#06B6D4"
];

export default function ManageTopicsPage() {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<TopicStats | null>(null);
    const [viewMode, setViewMode] = useState<"table" | "card">("table");
    const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());
    const [searchTerm, setSearchTerm] = useState("");

    // Modal states
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [showSubTopicModal, setShowSubTopicModal] = useState(false);
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
    const [editingSubTopic, setEditingSubTopic] = useState<SubTopic | null>(null);
    const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

    // Form states
    const [topicName, setTopicName] = useState("");
    const [topicDesc, setTopicDesc] = useState("");
    const [subTopicName, setSubTopicName] = useState("");
    const [subTopicDesc, setSubTopicDesc] = useState("");
    const [submitting, setSubmitting] = useState(false);

    // Fetch Data
    const fetchStats = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_URL}/topics/stats`, {
                headers: { Authorization: `Bearer ${getToken()}` },
                credentials: "include",
            });
            if (res.ok) {
                const data = await res.json();
                setStats(data);
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
            Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: "ไม่สามารถโหลดข้อมูลได้" });
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchStats();
        const savedView = localStorage.getItem("topic_viewmode") as "list" | "chart";
        if (savedView) setViewMode(savedView);
    }, [fetchStats]);

    const switchView = (mode: "table" | "card") => {
        setViewMode(mode);
        localStorage.setItem("topic_viewmode", mode);
    };

    const toggleTopic = (id: number) => {
        const newSet = new Set(expandedTopics);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedTopics(newSet);
    };

    // ─── Handlers ───
    const handleCreateTopic = () => {
        setEditingTopic(null);
        setTopicName("");
        setTopicDesc("");
        setShowTopicModal(true);
    };

    const handleEditTopic = (t: Topic) => {
        setEditingTopic(t);
        setTopicName(t.topic_name);
        setTopicDesc(t.description || "");
        setShowTopicModal(true);
    };

    const handleCreateSubTopic = (tid: number) => {
        setEditingSubTopic(null);
        setSelectedTopicId(tid);
        setSubTopicName("");
        setSubTopicDesc("");
        setShowSubTopicModal(true);
    };

    const handleEditSubTopic = (st: SubTopic) => {
        setEditingSubTopic(st);
        setSelectedTopicId(st.topic_id);
        setSubTopicName(st.sub_topic_name);
        setSubTopicDesc(st.description || "");
        setShowSubTopicModal(true);
    };

    const handleDeleteTopic = async (t: Topic) => {
        const result = await Swal.fire({
            title: "ยืนยันการลบ?",
            html: `ต้องการลบหัวข้อ "<strong>${t.topic_name}</strong>" หรือไม่?<br/><span class="text-red-500 text-sm">หัวข้อย่อยทั้งหมดจะถูกลบด้วย</span>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "ลบเลย",
            cancelButtonText: "ยกเลิก"
        });

        if (result.isConfirmed) {
            try {
                await fetch(`${API_URL}/topics/${t.topic_id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                fetchStats();
                Swal.fire("สำเร็จ", "ลบหัวข้อเรียบร้อย", "success");
            } catch (e) {
                Swal.fire("Error", "ไม่สามารถลบได้", "error");
            }
        }
    };

    const handleDeleteSubTopic = async (st: SubTopic) => {
        const result = await Swal.fire({
            title: "ยืนยันการลบ?",
            text: `ต้องการลบหัวข้อย่อย "${st.sub_topic_name}" หรือไม่?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            confirmButtonText: "ลบเลย",
            cancelButtonText: "ยกเลิก"
        });

        if (result.isConfirmed) {
            try {
                await fetch(`${API_URL}/topics/sub-topic/${st.sub_topic_id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                fetchStats();
                Swal.fire("สำเร็จ", "ลบหัวข้อย่อยเรียบร้อย", "success");
            } catch (e) {
                Swal.fire("Error", "ไม่สามารถลบได้", "error");
            }
        }
    };

    const submitTopic = async () => {
        if (!topicName.trim()) return;
        setSubmitting(true);
        try {
            const url = editingTopic ? `${API_URL}/topics/${editingTopic.topic_id}` : `${API_URL}/topics`;
            const method = editingTopic ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ topic_name: topicName, description: topicDesc || undefined })
            });
            if (res.ok) {
                setShowTopicModal(false);
                fetchStats();
                Swal.fire("สำเร็จ", "บันทึกข้อมูลเรียบร้อย", "success");
            }
        } catch {
            Swal.fire("Error", "บันทึกไม่สำเร็จ", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const submitSubTopic = async () => {
        if (!subTopicName.trim()) return;
        setSubmitting(true);
        try {
            const url = editingSubTopic
                ? `${API_URL}/topics/sub-topic/${editingSubTopic.sub_topic_id}`
                : `${API_URL}/topics/${selectedTopicId}/sub-topics`;
            const method = editingSubTopic ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ sub_topic_name: subTopicName, description: subTopicDesc || undefined })
            });
            if (res.ok) {
                setShowSubTopicModal(false);
                fetchStats();
                Swal.fire("สำเร็จ", "บันทึกข้อมูลเรียบร้อย", "success");
            }
        } catch {
            Swal.fire("Error", "บันทึกไม่สำเร็จ", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // Filter Data
    const filteredTopics = stats?.by_topic.filter(t =>
        t.topic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.sub_topics.some(st => st.sub_topic_name.toLowerCase().includes(searchTerm.toLowerCase()))
    ) || [];

    // Chart Data Preparation
    const topicPieData = stats?.by_topic.map(t => ({
        name: t.topic_name,
        value: t.item_count || 0
    })).filter(d => d.value > 0) || [];

    const subTopicPieData = stats?.by_topic.flatMap(t =>
        t.sub_topics.map(st => ({
            name: st.sub_topic_name,
            value: st.item_count || 0,
            topicName: t.topic_name
        }))
    ).filter(d => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 10) || []; // Top 10 subtopics

    return (
        <Navbar_admin>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" suppressHydrationWarning>

                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">จัดการหัวข้อข้อสอบ</h1>
                            <p className="text-gray-500 text-sm">
                                จัดการ Topic/Sub-Topic และดูสัดส่วนข้อสอบทั้งหมด ({stats?.total_items || 0} ข้อ)
                            </p>
                        </div>
                        <button onClick={handleCreateTopic}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all hover:shadow-md">
                            <Plus size={18} /> เพิ่มหัวข้อหลัก
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg"><BookOpen size={24} /></div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase">หัวข้อหลัก (Topic)</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats?.by_topic.length || 0}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><List size={24} /></div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase">หัวข้อย่อย (Sub-Topic)</p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {stats?.by_topic.reduce((a, b) => a + b.sub_topics.length, 0) || 0}
                            </h3>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><PieChartIcon size={24} /></div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase">จำนวนข้อสอบรวม</p>
                            <h3 className="text-2xl font-bold text-gray-900">{stats?.total_items || 0}</h3>
                        </div>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center bg-white p-3 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="relative w-full sm:w-80">
                        <input
                            type="text" placeholder="ค้นหาหัวข้อ..."
                            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-green-500 text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => switchView("list")}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "list" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                            <List size={16} /> รายการ
                        </button>
                        <button onClick={() => switchView("chart")}
                            className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === "chart" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}>
                            <PieChartIcon size={16} /> กราฟสัดส่วน
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="h-64 flex flex-col items-center justify-center text-gray-500">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-green-500" />
                        <p>กำลังโหลดข้อมูล...</p>
                    </div>
                ) : (
                    <>
                        {/* VIEW MODE: CHART */}
                        {viewMode === "chart" && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8 animate-in fade-in zoom-in duration-300">
                                {/* Topic Distribution */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <PieChartIcon className="text-green-500" size={20} /> สัดส่วนข้อสอบแยกตาม Topic
                                    </h3>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={topicPieData}
                                                    cx="50%" cy="50%"
                                                    innerRadius={60} outerRadius={100}
                                                    paddingAngle={2}
                                                    dataKey="value"
                                                >
                                                    {topicPieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <Tooltip formatter={(val: number) => [`${val} ข้อ`, "จำนวน"]} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* SubTopic Distribution (Bar Chart for top 10) */}
                                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                        <PieChartIcon className="text-blue-500" size={20} /> Top 10 Sub-Topics ที่มีข้อสอบมากที่สุด
                                    </h3>
                                    <div className="h-[300px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={subTopicPieData} layout="vertical" margin={{ left: 20 }}>
                                                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                                                <XAxis type="number" hide />
                                                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} />
                                                <Tooltip cursor={{ fill: '#f3f4f6' }} formatter={(val: number) => [`${val} ข้อ`, "จำนวน"]} />
                                                <Bar dataKey="value" fill="#3B82F6" radius={[0, 4, 4, 0]}>
                                                    {subTopicPieData.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* VIEW MODE: LIST (Always render filtered list if in list mode, or below charts) */}
                        <div className={`space-y-4 ${viewMode === "chart" ? "opacity-50 hover:opacity-100 transition-opacity" : ""}`}>
                            {filteredTopics.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                                    <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <p className="text-gray-500">ไม่พบหัวข้อที่ค้นหา</p>
                                </div>
                            ) : (
                                filteredTopics.map((topic) => {
                                    const isExpanded = expandedTopics.has(topic.topic_id);
                                    return (
                                        <div key={topic.topic_id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
                                            {/* Topic Header Row */}
                                            <div className="flex items-center p-4 gap-4 bg-gray-50/50 hover:bg-white transition-colors cursor-pointer"
                                                onClick={() => toggleTopic(topic.topic_id)}>
                                                <button className="p-1 text-gray-400 hover:text-green-600 transition-colors">
                                                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                                </button>
                                                <div className="flex-1">
                                                    <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                                                        {topic.topic_name}
                                                        <span className="text-xs font-normal px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                                            {topic.item_count || 0} ข้อ
                                                        </span>
                                                    </h3>
                                                    {topic.description && <p className="text-sm text-gray-500 mt-0.5">{topic.description}</p>}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={(e) => { e.stopPropagation(); handleEditTopic(topic); }}
                                                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTopic(topic); }}
                                                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* SubTopics List */}
                                            {isExpanded && (
                                                <div className="border-t border-gray-100 bg-white animate-in slide-in-from-top-2 duration-200">
                                                    {topic.sub_topics.length === 0 ? (
                                                        <div className="p-8 text-center">
                                                            <p className="text-sm text-gray-400 mb-3">ยังไม่มีหัวข้อย่อย</p>
                                                            <button onClick={() => handleCreateSubTopic(topic.topic_id)}
                                                                className="text-sm text-green-600 hover:underline font-medium inline-flex items-center gap-1">
                                                                <Plus size={14} /> เพิ่มหัวข้อย่อย
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="divide-y divide-gray-50">
                                                            <div className="grid grid-cols-12 px-6 py-2 bg-gray-50/30 text-xs font-medium text-gray-400 uppercase tracking-wider">
                                                                <div className="col-span-1">#</div>
                                                                <div className="col-span-5">ชื่อหัวข้อย่อย</div>
                                                                <div className="col-span-2 text-center">จำนวนข้อ</div>
                                                                <div className="col-span-4 text-right">จัดการ</div>
                                                            </div>
                                                            {topic.sub_topics.map((st, idx) => (
                                                                <div key={st.sub_topic_id} className="grid grid-cols-12 px-6 py-3.5 items-center hover:bg-green-50/30 transition-colors group/row">
                                                                    <div className="col-span-1 text-sm text-gray-400">{idx + 1}</div>
                                                                    <div className="col-span-5">
                                                                        <p className="text-sm font-medium text-gray-700">{st.sub_topic_name}</p>
                                                                        <p className="text-xs text-gray-400 truncate max-w-xs">{st.description}</p>
                                                                    </div>
                                                                    <div className="col-span-2 text-center">
                                                                        <span className="inline-block px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-md">
                                                                            {st.item_count || 0}
                                                                        </span>
                                                                    </div>
                                                                    <div className="col-span-4 flex justify-end gap-2">
                                                                        <button onClick={() => handleEditSubTopic(st)}
                                                                            className="p-1.5 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg">
                                                                            <Edit2 size={14} />
                                                                        </button>
                                                                        <button onClick={() => handleDeleteSubTopic(st)}
                                                                            className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg">
                                                                            <Trash2 size={14} />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                            <div className="p-3 bg-gray-50/50 flex justify-end border-t border-gray-100">
                                                                <button onClick={() => handleCreateSubTopic(topic.topic_id)}
                                                                    className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1 px-3 py-1.5 hover:bg-green-50 rounded-lg transition-colors">
                                                                    <Plus size={14} /> เพิ่มหัวข้อย่อย
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}

                {/* ─── Topic Modal ─── */}
                {showTopicModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="bg-green-600 px-6 py-4 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">{editingTopic ? "แก้ไขหัวข้อหลัก" : "เพิ่มหัวข้อหลัก"}</h3>
                                <button onClick={() => setShowTopicModal(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหัวข้อ <span className="text-red-500">*</span></label>
                                    <input type="text" value={topicName} onChange={e => setTopicName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-sm" placeholder="เช่น เภสัชวิทยา" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                                    <textarea value={topicDesc} onChange={e => setTopicDesc(e.target.value)} rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-sm resize-none" />
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                                <button onClick={() => setShowTopicModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">ยกเลิก</button>
                                <button onClick={submitTopic} disabled={submitting}
                                    className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2">
                                    {submitting && <Loader2 size={14} className="animate-spin" />} บันทึก
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── SubTopic Modal ─── */}
                {showSubTopicModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                            <div className="bg-green-600 px-6 py-4 flex justify-between items-center">
                                <h3 className="text-lg font-bold text-white">{editingSubTopic ? "แก้ไขหัวข้อย่อย" : "เพิ่มหัวข้อย่อย"}</h3>
                                <button onClick={() => setShowSubTopicModal(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อหัวข้อย่อย <span className="text-red-500">*</span></label>
                                    <input type="text" value={subTopicName} onChange={e => setSubTopicName(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-sm" placeholder="เช่น ยาต้านจุลชีพ" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                                    <textarea value={subTopicDesc} onChange={e => setSubTopicDesc(e.target.value)} rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 text-sm resize-none" />
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-gray-50 flex justify-end gap-3">
                                <button onClick={() => setShowSubTopicModal(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-200 rounded-lg transition-colors">ยกเลิก</button>
                                <button onClick={submitSubTopic} disabled={submitting}
                                    className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2">
                                    {submitting && <Loader2 size={14} className="animate-spin" />} บันทึก
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </Navbar_admin>
    );
}
