"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Navbar_admin from "@/components/Navbar_admin";
import {
    Plus, Edit2, Trash2, ChevronDown, ChevronRight,
    BookOpen, List, Loader2, X, PieChart as PieChartIcon,
    LayoutGrid, Search, ArrowUpDown, Filter, BarChart3,
    Layers, Columns, Maximize2, Minimize2, CheckCircle2,
    HelpCircle, FolderTree, Tag
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
const CHART_COLORS = [
    "#16a34a", "#2563eb", "#d97706", "#dc2626", "#7c3aed",
    "#059669", "#0284c7", "#ea580c", "#be185d", "#4f46e5"
];

export default function ManageTopicsPage() {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<TopicStats | null>(null);

    // View modes: 'accordion' | 'master_detail' | 'grid' | 'analytics'
    const [viewMode, setViewMode] = useState<"accordion" | "master_detail" | "grid" | "analytics">("accordion");

    // Search, Filter & Sort
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"items_desc" | "items_asc" | "name_asc" | "subtopics_desc">("items_desc");
    const [filterStatus, setFilterStatus] = useState<"all" | "has_items" | "empty">("all");

    // Selection for master-detail view
    const [selectedTopicId, setSelectedTopicId] = useState<number | null>(null);

    // Expanded set for accordion view
    const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());

    // Modal states
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [showSubTopicModal, setShowSubTopicModal] = useState(false);
    const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
    const [editingSubTopic, setEditingSubTopic] = useState<SubTopic | null>(null);
    const [targetTopicIdForSub, setTargetTopicIdForSub] = useState<number | null>(null);

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
                const data: TopicStats = await res.json();
                setStats(data);

                // Auto select first topic for master-detail if none selected
                if (data.by_topic.length > 0 && !selectedTopicId) {
                    setSelectedTopicId(data.by_topic[0].topic_id);
                }
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
            Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: "ไม่สามารถโหลดข้อมูลได้" });
        } finally {
            setLoading(false);
        }
    }, [getToken, selectedTopicId]);

    useEffect(() => {
        fetchStats();
        const savedView = localStorage.getItem("topic_dashboard_viewmode") as any;
        if (savedView && ["accordion", "master_detail", "grid", "analytics"].includes(savedView)) {
            setViewMode(savedView);
        }
    }, [fetchStats]);

    const switchView = (mode: "accordion" | "master_detail" | "grid" | "analytics") => {
        setViewMode(mode);
        localStorage.setItem("topic_dashboard_viewmode", mode);
    };

    // Toggle expand
    const toggleTopicExpand = (id: number) => {
        setExpandedTopics(prev => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const expandAll = () => {
        if (stats) setExpandedTopics(new Set(stats.by_topic.map(t => t.topic_id)));
    };

    const collapseAll = () => {
        setExpandedTopics(new Set());
    };

    // Derived Statistics
    const totalTopicsCount = stats?.by_topic.length || 0;
    const totalSubTopicsCount = useMemo(() => {
        return stats?.by_topic.reduce((sum, t) => sum + (t.sub_topics?.length || 0), 0) || 0;
    }, [stats]);

    const totalItemsCount = stats?.total_items || 0;

    const avgItemsPerTopic = useMemo(() => {
        if (totalTopicsCount === 0) return 0;
        return (totalItemsCount / totalTopicsCount).toFixed(1);
    }, [totalItemsCount, totalTopicsCount]);

    const maxTopicItems = useMemo(() => {
        if (!stats?.by_topic.length) return 1;
        return Math.max(...stats.by_topic.map(t => t.item_count || 0), 1);
    }, [stats]);

    // Filter & Sort Topics
    const processedTopics = useMemo(() => {
        if (!stats?.by_topic) return [];

        let result = stats.by_topic.filter(t => {
            // Search filter
            const query = searchTerm.toLowerCase().trim();
            const matchesTopic = t.topic_name.toLowerCase().includes(query) || (t.description || "").toLowerCase().includes(query);
            const matchesSub = t.sub_topics.some(st => st.sub_topic_name.toLowerCase().includes(query) || (st.description || "").toLowerCase().includes(query));
            if (query && !matchesTopic && !matchesSub) return false;

            // Status filter
            if (filterStatus === "has_items" && (t.item_count || 0) === 0) return false;
            if (filterStatus === "empty" && (t.item_count || 0) > 0) return false;

            return true;
        });

        // Sorting
        result.sort((a, b) => {
            if (sortBy === "items_desc") return (b.item_count || 0) - (a.item_count || 0);
            if (sortBy === "items_asc") return (a.item_count || 0) - (b.item_count || 0);
            if (sortBy === "name_asc") return a.topic_name.localeCompare(b.topic_name, 'th');
            if (sortBy === "subtopics_desc") return (b.sub_topics?.length || 0) - (a.sub_topics?.length || 0);
            return 0;
        });

        return result;
    }, [stats, searchTerm, filterStatus, sortBy]);

    // Currently Selected Topic for Master-Detail
    const activeSelectedTopic = useMemo(() => {
        if (!processedTopics.length) return null;
        const found = processedTopics.find(t => t.topic_id === selectedTopicId);
        return found || processedTopics[0];
    }, [processedTopics, selectedTopicId]);

    // Handlers for Modals & Actions
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

    const handleCreateSubTopic = (topicId: number) => {
        setEditingSubTopic(null);
        setTargetTopicIdForSub(topicId);
        setSubTopicName("");
        setSubTopicDesc("");
        setShowSubTopicModal(true);
    };

    const handleEditSubTopic = (st: SubTopic) => {
        setEditingSubTopic(st);
        setTargetTopicIdForSub(st.topic_id);
        setSubTopicName(st.sub_topic_name);
        setSubTopicDesc(st.description || "");
        setShowSubTopicModal(true);
    };

    const handleDeleteTopic = async (t: Topic) => {
        const confirm = await Swal.fire({
            title: "ยืนยันการลบหัวข้อหลัก?",
            html: `ต้องการลบหัวข้อ "<strong>${t.topic_name}</strong>" ใช่หรือไม่?<br/><span class="text-red-500 text-xs">หัวข้อย่อยทั้งหมดภายในหัวข้อนี้จะถูกลบไปด้วย</span>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            confirmButtonText: "ยืนยันลบ",
            cancelButtonText: "ยกเลิก"
        });

        if (confirm.isConfirmed) {
            try {
                const res = await fetch(`${API_URL}/topics/${t.topic_id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                if (!res.ok) throw new Error();
                fetchStats();
                Swal.fire({ title: "ลบสำเร็จ", text: "ลบหัวข้อเรียบร้อยแล้ว", icon: "success", timer: 1500, showConfirmButton: false });
            } catch {
                Swal.fire("ข้อผิดพลาด", "ไม่สามารถลบหัวข้อได้", "error");
            }
        }
    };

    const handleDeleteSubTopic = async (st: SubTopic) => {
        const confirm = await Swal.fire({
            title: "ยืนยันการลบหัวข้อย่อย?",
            text: `ต้องการลบหัวข้อย่อย "${st.sub_topic_name}" ใช่หรือไม่?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            confirmButtonText: "ยืนยันลบ",
            cancelButtonText: "ยกเลิก"
        });

        if (confirm.isConfirmed) {
            try {
                const res = await fetch(`${API_URL}/topics/sub-topic/${st.sub_topic_id}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${getToken()}` },
                });
                if (!res.ok) throw new Error();
                fetchStats();
                Swal.fire({ title: "ลบสำเร็จ", text: "ลบหัวข้อย่อยเรียบร้อยแล้ว", icon: "success", timer: 1500, showConfirmButton: false });
            } catch {
                Swal.fire("ข้อผิดพลาด", "ไม่สามารถลบหัวข้อย่อยได้", "error");
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
                body: JSON.stringify({ topic_name: topicName.trim(), description: topicDesc.trim() || undefined })
            });
            if (res.ok) {
                setShowTopicModal(false);
                fetchStats();
                Swal.fire({ title: "บันทึกสำเร็จ", icon: "success", timer: 1200, showConfirmButton: false });
            } else {
                const errorData = await res.json();
                Swal.fire("ข้อผิดพลาด", errorData.message || "บันทึกไม่สำเร็จ", "error");
            }
        } catch {
            Swal.fire("ข้อผิดพลาด", "บันทึกไม่สำเร็จ", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const submitSubTopic = async () => {
        if (!subTopicName.trim() || !targetTopicIdForSub) return;
        setSubmitting(true);
        try {
            const url = editingSubTopic
                ? `${API_URL}/topics/sub-topic/${editingSubTopic.sub_topic_id}`
                : `${API_URL}/topics/${targetTopicIdForSub}/sub-topics`;
            const method = editingSubTopic ? "PATCH" : "POST";
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
                body: JSON.stringify({ sub_topic_name: subTopicName.trim(), description: subTopicDesc.trim() || undefined })
            });
            if (res.ok) {
                setShowSubTopicModal(false);
                fetchStats();
                Swal.fire({ title: "บันทึกสำเร็จ", icon: "success", timer: 1200, showConfirmButton: false });
            } else {
                const errorData = await res.json();
                Swal.fire("ข้อผิดพลาด", errorData.message || "บันทึกไม่สำเร็จ", "error");
            }
        } catch {
            Swal.fire("ข้อผิดพลาด", "บันทึกไม่สำเร็จ", "error");
        } finally {
            setSubmitting(false);
        }
    };

    // Chart Data Preparation
    const analyticsTopicData = useMemo(() => {
        if (!stats?.by_topic) return [];
        return stats.by_topic
            .map(t => ({
                name: t.topic_name,
                count: t.item_count || 0,
                subCount: t.sub_topics?.length || 0,
            }))
            .sort((a, b) => b.count - a.count);
    }, [stats]);

    return (
        <Navbar_admin>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6" suppressHydrationWarning>

                {/* ── Page Header ── */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900">จัดการหัวข้อข้อสอบ</h1>
                        <p className="text-sm text-gray-500 mt-1">โครงสร้างหมวดหมู่ข้อสอบ Topic & Sub-Topic ทั้งหมดในระบบ</p>
                    </div>
                    <button
                        onClick={handleCreateTopic}
                        className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all shadow-sm shrink-0"
                    >
                        <Plus size={18} /> สร้างหัวข้อหลักใหม่
                    </button>
                </div>

                {/* ── 1. KPI Metric Dashboard Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl shrink-0">
                            <FolderTree size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">หัวข้อหลัก (Topic)</p>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-2xl font-bold text-gray-900">{totalTopicsCount}</span>
                                <span className="text-xs text-gray-500 font-medium">หัวข้อ</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <Tag size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">หัวข้อย่อย (Sub-Topic)</p>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-2xl font-bold text-gray-900">{totalSubTopicsCount}</span>
                                <span className="text-xs text-gray-500 font-medium">หัวข้อย่อย</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                            <Layers size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">จำนวนข้อสอบรวม</p>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-2xl font-bold text-gray-900">{totalItemsCount}</span>
                                <span className="text-xs text-gray-500 font-medium">ข้อ</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                            <BarChart3 size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">เฉลี่ยข้อ / หัวข้อ</p>
                            <div className="flex items-baseline gap-1.5 mt-0.5">
                                <span className="text-2xl font-bold text-gray-900">{avgItemsPerTopic}</span>
                                <span className="text-xs text-gray-500 font-medium">ข้อ/หัวข้อ</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 2. Navigation View Tabs ── */}
                <div className="bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm mb-4 flex items-center justify-between gap-2 overflow-x-auto">
                    <div className="flex gap-1.5 w-full">
                        {[
                            { id: "accordion", label: "รายการ (Accordion)", icon: List },
                            { id: "master_detail", label: "แยกข้าง (Master-Detail)", icon: Columns },
                            { id: "grid", label: "การ์ด (Grid)", icon: LayoutGrid },
                            { id: "analytics", label: "สถิติ (Analytics)", icon: PieChartIcon },
                        ].map(tab => {
                            const Icon = tab.icon;
                            const isActive = viewMode === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => switchView(tab.id as any)}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${isActive
                                            ? "bg-green-600 text-white shadow-md shadow-green-100"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                        }`}
                                >
                                    <Icon size={15} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ── 3. Filters & Search Bar ── */}
                <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm mb-6 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-[220px]">
                        <input
                            type="text"
                            placeholder="ค้นหาหัวข้อหลัก / ย่อย..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                        {/* Sort Selector */}
                        <div className="relative flex-1 sm:flex-initial">
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value as any)}
                                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-8 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="items_desc">เรียงตาม: ข้อสอบมากสุด</option>
                                <option value="items_asc">เรียงตาม: ข้อสอบน้อยสุด</option>
                                <option value="name_asc">เรียงตาม: ชื่อหัวข้อ (ก-ฮ)</option>
                                <option value="subtopics_desc">เรียงตาม: หัวข้อย่อยมากสุด</option>
                            </select>
                            <ArrowUpDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>

                        {/* Status Filter */}
                        <div className="relative flex-1 sm:flex-initial">
                            <select
                                value={filterStatus}
                                onChange={e => setFilterStatus(e.target.value as any)}
                                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pr-8 text-xs font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="all">สถานะ: ทุกหมวด</option>
                                <option value="has_items">สถานะ: มีข้อสอบ (&gt;0)</option>
                                <option value="empty">สถานะ: ยังไม่มีข้อสอบ (0)</option>
                            </select>
                            <Filter size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                </div>

                {/* ── 3. Main Views Content ── */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map(i => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse flex items-center justify-between">
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 w-1/3 bg-gray-200 rounded" />
                                    <div className="h-3 w-1/2 bg-gray-200 rounded" />
                                </div>
                                <div className="w-20 h-6 bg-gray-200 rounded-full" />
                            </div>
                        ))}
                    </div>
                ) : processedTopics.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-16 text-center">
                        <FolderTree size={40} className="mx-auto mb-3 text-gray-300" />
                        <h3 className="text-base font-semibold text-gray-700">ไม่พบหัวข้อที่ตรงตามเงื่อนไข</h3>
                        <p className="text-xs text-gray-400 mt-1">ลองเปลี่ยนคำค้นหา หรือสร้างหัวข้อหลักใหม่</p>
                    </div>
                ) : (
                    <>
                        {/* ── VIEW 1: ACCORDION VIEW ── */}
                        {viewMode === "accordion" && (
                            <div className="space-y-3">
                                {/* Expand/Collapse Controls */}
                                <div className="flex justify-between items-center text-xs text-gray-500 px-1 mb-1">
                                    <span>แสดงผล <strong>{processedTopics.length}</strong> หัวข้อหลัก</span>
                                    <div className="flex gap-3">
                                        <button onClick={expandAll} className="hover:text-green-600 flex items-center gap-1">
                                            <Maximize2 size={12} /> ขยายทั้งหมด
                                        </button>
                                        <button onClick={collapseAll} className="hover:text-gray-700 flex items-center gap-1">
                                            <Minimize2 size={12} /> หุบทั้งหมด
                                        </button>
                                    </div>
                                </div>

                                {processedTopics.map(t => {
                                    const isExpanded = expandedTopics.has(t.topic_id);
                                    const subCount = t.sub_topics?.length || 0;
                                    const itemCount = t.item_count || 0;

                                    return (
                                        <div key={t.topic_id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden transition-all">
                                            {/* Topic Row Header */}
                                            <div
                                                onClick={() => toggleTopicExpand(t.topic_id)}
                                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/80 transition-colors select-none"
                                            >
                                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                                    <div className={`p-1.5 rounded-lg transition-colors ${isExpanded ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <h3 className="text-base font-semibold text-gray-900 truncate">{t.topic_name}</h3>
                                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                                                                {itemCount} ข้อ
                                                            </span>
                                                            <span className="text-xs text-gray-400">
                                                                ({subCount} หัวข้อย่อย)
                                                            </span>
                                                        </div>
                                                        {t.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{t.description}</p>}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0 ml-3" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => handleCreateSubTopic(t.topic_id)}
                                                        className="text-xs text-green-600 hover:bg-green-50 font-medium px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-green-200"
                                                    >
                                                        <Plus size={13} /> เพิ่มหัวข้อย่อย
                                                    </button>
                                                    <button
                                                        onClick={() => handleEditTopic(t)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="แก้ไขหัวข้อหลัก"
                                                    >
                                                        <Edit2 size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTopic(t)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="ลบหัวข้อหลัก"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* SubTopics Body */}
                                            {isExpanded && (
                                                <div className="border-t border-gray-100 bg-gray-50/50 p-4">
                                                    {subCount === 0 ? (
                                                        <div className="text-center py-6 text-xs text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                                                            ยังไม่มีหัวข้อย่อยในหมวดนี้ —{" "}
                                                            <button
                                                                onClick={() => handleCreateSubTopic(t.topic_id)}
                                                                className="text-green-600 font-medium hover:underline"
                                                            >
                                                                สร้างหัวข้อย่อยแรก
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                                            <table className="min-w-full divide-y divide-gray-100">
                                                                <thead className="bg-gray-50">
                                                                    <tr>
                                                                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase w-12">#</th>
                                                                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase">ชื่อหัวข้อย่อย</th>
                                                                        <th className="px-4 py-2.5 text-left text-[11px] font-semibold text-gray-400 uppercase">คำอธิบาย</th>
                                                                        <th className="px-4 py-2.5 text-center text-[11px] font-semibold text-gray-400 uppercase w-28">จำนวนข้อสอบ</th>
                                                                        <th className="px-4 py-2.5 text-right text-[11px] font-semibold text-gray-400 uppercase w-24">จัดการ</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {t.sub_topics.map((st, idx) => (
                                                                        <tr key={st.sub_topic_id} className="hover:bg-gray-50/80 transition-colors">
                                                                            <td className="px-4 py-3 text-xs text-gray-400 ">{idx + 1}</td>
                                                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{st.sub_topic_name}</td>
                                                                            <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{st.description || "—"}</td>
                                                                            <td className="px-4 py-3 text-center">
                                                                                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                                                                    {st.item_count || 0} ข้อ
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-4 py-3 text-right">
                                                                                <div className="flex items-center justify-end gap-1">
                                                                                    <button
                                                                                        onClick={() => handleEditSubTopic(st)}
                                                                                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"
                                                                                        title="แก้ไขหัวข้อย่อย"
                                                                                    >
                                                                                        <Edit2 size={14} />
                                                                                    </button>
                                                                                    <button
                                                                                        onClick={() => handleDeleteSubTopic(st)}
                                                                                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                                                                        title="ลบหัวข้อย่อย"
                                                                                    >
                                                                                        <Trash2 size={14} />
                                                                                    </button>
                                                                                </div>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── VIEW 2: MASTER-DETAIL VIEW (Ideal for 20+ topics) ── */}
                        {viewMode === "master_detail" && activeSelectedTopic && (
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 min-h-[550px]">
                                {/* Left Pane: Topic Selection List */}
                                <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex flex-col max-h-[650px]">
                                    <div className="px-2 py-2 border-b border-gray-100 mb-2 flex justify-between items-center">
                                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                            รายการหัวข้อ ({processedTopics.length})
                                        </span>
                                    </div>
                                    <div className="overflow-y-auto space-y-1.5 flex-1 pr-1">
                                        {processedTopics.map(t => {
                                            const isSelected = t.topic_id === activeSelectedTopic.topic_id;
                                            return (
                                                <div
                                                    key={t.topic_id}
                                                    onClick={() => setSelectedTopicId(t.topic_id)}
                                                    className={`p-3 rounded-xl cursor-pointer border transition-all flex items-center justify-between ${isSelected
                                                            ? "bg-green-50 border-green-300 shadow-sm"
                                                            : "bg-white border-gray-100 hover:bg-gray-50"
                                                        }`}
                                                >
                                                    <div className="min-w-0 flex-1 pr-2">
                                                        <h4 className={`text-sm font-semibold truncate ${isSelected ? "text-green-900" : "text-gray-800"}`}>
                                                            {t.topic_name}
                                                        </h4>
                                                        <p className="text-[11px] text-gray-400 mt-0.5">
                                                            {t.sub_topics?.length || 0} หัวข้อย่อย
                                                        </p>
                                                    </div>
                                                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 ${isSelected ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"
                                                        }`}>
                                                        {t.item_count || 0} ข้อ
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Right Pane: Topic Details & Sub-Topics */}
                                <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col justify-between">
                                    <div>
                                        {/* Topic Header Card */}
                                        <div className="border-b border-gray-100 pb-5 mb-5 flex justify-between items-start">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h2 className="text-xl font-bold text-gray-900">{activeSelectedTopic.topic_name}</h2>
                                                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700">
                                                        {activeSelectedTopic.item_count || 0} ข้อสอบ
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-500 mt-1">{activeSelectedTopic.description || "ไม่มีคำอธิบาย"}</p>
                                            </div>

                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={() => handleEditTopic(activeSelectedTopic)}
                                                    className="px-3 py-1.5 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg font-medium transition-colors flex items-center gap-1"
                                                >
                                                    <Edit2 size={13} /> แก้ไขหัวข้อ
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteTopic(activeSelectedTopic)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Question Share Progress Bar */}
                                        <div className="mb-6 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                                <span>สัดส่วนในคลังข้อสอบทั้งหมด</span>
                                                <span className="font-semibold text-gray-800">
                                                    {totalItemsCount > 0 ? (((activeSelectedTopic.item_count || 0) / totalItemsCount) * 100).toFixed(1) : 0}%
                                                </span>
                                            </div>
                                            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-green-500 rounded-full transition-all duration-300"
                                                    style={{ width: `${totalItemsCount > 0 ? ((activeSelectedTopic.item_count || 0) / totalItemsCount) * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>

                                        {/* Sub-Topics Section */}
                                        <div className="flex justify-between items-center mb-3">
                                            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                                                <Tag size={14} className="text-green-600" />
                                                หัวข้อย่อย ({activeSelectedTopic.sub_topics?.length || 0})
                                            </h3>
                                            <button
                                                onClick={() => handleCreateSubTopic(activeSelectedTopic.topic_id)}
                                                className="text-xs text-green-600 hover:bg-green-50 font-medium px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 border border-green-200"
                                            >
                                                <Plus size={12} /> เพิ่มหัวข้อย่อย
                                            </button>
                                        </div>

                                        {activeSelectedTopic.sub_topics.length === 0 ? (
                                            <div className="text-center py-10 border border-dashed border-gray-200 rounded-xl">
                                                <p className="text-xs text-gray-400 mb-2">ยังไม่มีหัวข้อย่อยในหมวดนี้</p>
                                                <button
                                                    onClick={() => handleCreateSubTopic(activeSelectedTopic.topic_id)}
                                                    className="text-xs font-medium text-green-600 hover:underline"
                                                >
                                                    + เพิ่มหัวข้อย่อยแรก
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                                <table className="min-w-full divide-y divide-gray-100">
                                                    <thead className="bg-gray-50">
                                                        <tr>
                                                            <th className="px-3 py-2 text-left text-[11px] font-semibold text-gray-400 uppercase">ชื่อหัวข้อย่อย</th>
                                                            <th className="px-3 py-2 text-center text-[11px] font-semibold text-gray-400 uppercase w-24">ข้อสอบ</th>
                                                            <th className="px-3 py-2 text-right text-[11px] font-semibold text-gray-400 uppercase w-20">จัดการ</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-50">
                                                        {activeSelectedTopic.sub_topics.map(st => (
                                                            <tr key={st.sub_topic_id} className="hover:bg-gray-50/80 transition-colors">
                                                                <td className="px-3 py-2.5">
                                                                    <p className="text-xs font-medium text-gray-900">{st.sub_topic_name}</p>
                                                                    {st.description && <p className="text-[11px] text-gray-400 truncate">{st.description}</p>}
                                                                </td>
                                                                <td className="px-3 py-2.5 text-center">
                                                                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                                                        {st.item_count || 0} ข้อ
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-2.5 text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        <button
                                                                            onClick={() => handleEditSubTopic(st)}
                                                                            className="p-1 text-gray-400 hover:text-blue-600 rounded transition-all"
                                                                        >
                                                                            <Edit2 size={13} />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => handleDeleteSubTopic(st)}
                                                                            className="p-1 text-gray-400 hover:text-red-600 rounded transition-all"
                                                                        >
                                                                            <Trash2 size={13} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── VIEW 3: GRID CARDS VIEW ── */}
                        {viewMode === "grid" && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {processedTopics.map(t => {
                                    const subCount = t.sub_topics?.length || 0;
                                    const itemCount = t.item_count || 0;
                                    const pctOfMax = Math.round((itemCount / maxTopicItems) * 100);

                                    return (
                                        <div
                                            key={t.topic_id}
                                            className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                                        >
                                            <div className="p-5">
                                                <div className="flex justify-between items-start mb-3 gap-2">
                                                    <h3 className="text-base font-semibold text-gray-900 line-clamp-1">{t.topic_name}</h3>
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            onClick={() => handleEditTopic(t)}
                                                            className="p-1 text-gray-400 hover:text-blue-600 rounded transition-all"
                                                        >
                                                            <Edit2 size={14} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteTopic(t)}
                                                            className="p-1 text-gray-400 hover:text-red-600 rounded transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4 min-h-[32px]">
                                                    {t.description || "ไม่มีคำอธิบายเพิ่มเติม"}
                                                </p>

                                                {/* Subtopics Pills */}
                                                <div className="flex flex-wrap gap-1.5 mb-4 max-h-20 overflow-hidden">
                                                    {subCount === 0 ? (
                                                        <span className="text-[11px] text-gray-400 italic">ไม่มีหัวข้อย่อย</span>
                                                    ) : (
                                                        t.sub_topics.slice(0, 4).map(st => (
                                                            <span key={st.sub_topic_id} className="text-[10px] font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                                                                {st.sub_topic_name}
                                                            </span>
                                                        ))
                                                    )}
                                                    {subCount > 4 && (
                                                        <span className="text-[10px] font-semibold bg-green-50 text-green-700 px-2 py-0.5 rounded-md">
                                                            +{subCount - 4} เพิ่มเติม
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bottom Info Bar */}
                                            <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">จำนวนข้อสอบ</span>
                                                    <span className="text-sm font-bold text-green-700">{itemCount} ข้อ</span>
                                                </div>
                                                <button
                                                    onClick={() => handleCreateSubTopic(t.topic_id)}
                                                    className="text-xs text-green-600 hover:text-green-800 font-medium flex items-center gap-1"
                                                >
                                                    <Plus size={12} /> เพิ่มหัวข้อย่อย
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* ── VIEW 4: ANALYTICS & DASHBOARD VIEW ── */}
                        {viewMode === "analytics" && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Horizontal Bar Chart for Topic Question Distribution */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <BarChart3 size={16} className="text-green-600" />
                                            การกระจายตัวของจำนวนข้อสอบตามหัวข้อหลัก (Top Topics)
                                        </h3>
                                        <div className="h-[320px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={analyticsTopicData.slice(0, 10)} layout="vertical" margin={{ left: 20, right: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                                                    <XAxis type="number" tick={{ fontSize: 10 }} />
                                                    <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                                                    <Tooltip
                                                        formatter={(val: number) => [`${val} ข้อ`, "จำนวนข้อสอบ"]}
                                                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}
                                                    />
                                                    <Bar dataKey="count" fill="#16a34a" radius={[0, 6, 6, 0]}>
                                                        {analyticsTopicData.slice(0, 10).map((_, index) => (
                                                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Topic Share Pie Chart */}
                                    <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                                        <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                            <PieChartIcon size={16} className="text-blue-600" />
                                            สัดส่วนร้อยละของหัวข้อหลักที่มีข้อสอบ
                                        </h3>
                                        <div className="h-[320px]">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={analyticsTopicData.filter(d => d.count > 0)}
                                                        cx="50%" cy="50%"
                                                        innerRadius={55} outerRadius={95}
                                                        paddingAngle={3}
                                                        dataKey="count"
                                                    >
                                                        {analyticsTopicData.filter(d => d.count > 0).map((_, index) => (
                                                            <Cell key={`cell-pie-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(val: number) => [`${val} ข้อ`, "จำนวนข้อสอบ"]} />
                                                    <Legend wrapperStyle={{ fontSize: 11 }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ─── MODAL: Topic Modal (Create / Edit) ─── */}
                {showTopicModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                                <h3 className="text-base font-semibold text-gray-900">
                                    {editingTopic ? "แก้ไขหัวข้อหลัก" : "สร้างหัวข้อหลักใหม่"}
                                </h3>
                                <button onClick={() => setShowTopicModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        ชื่อหัวข้อหลัก <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={topicName}
                                        onChange={e => setTopicName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                        placeholder="เช่น เภสัชวิทยา (Pharmacology)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">คำอธิบาย</label>
                                    <textarea
                                        value={topicDesc}
                                        onChange={e => setTopicDesc(e.target.value)}
                                        rows={3}
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                                        placeholder="คำอธิบายรายละเอียดหัวข้อ..."
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                                <button
                                    onClick={() => setShowTopicModal(false)}
                                    className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={submitTopic}
                                    disabled={submitting}
                                    className="px-4 py-2 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-sm"
                                >
                                    {submitting && <Loader2 size={14} className="animate-spin" />} บันทึก
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── MODAL: SubTopic Modal (Create / Edit) ─── */}
                {showSubTopicModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                            <div className="border-b border-gray-100 px-6 py-4 flex justify-between items-center">
                                <h3 className="text-base font-semibold text-gray-900">
                                    {editingSubTopic ? "แก้ไขหัวข้อย่อย" : "สร้างหัวข้อย่อยใหม่"}
                                </h3>
                                <button onClick={() => setShowSubTopicModal(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                        ชื่อหัวข้อย่อย <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={subTopicName}
                                        onChange={e => setSubTopicName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                        placeholder="เช่น ยาต้านจุลชีพ (Antimicrobial agents)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">คำอธิบาย</label>
                                    <textarea
                                        value={subTopicDesc}
                                        onChange={e => setSubTopicDesc(e.target.value)}
                                        rows={3}
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                                        placeholder="คำอธิบายรายละเอียดหัวข้อย่อย..."
                                    />
                                </div>
                            </div>
                            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                                <button
                                    onClick={() => setShowSubTopicModal(false)}
                                    className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={submitSubTopic}
                                    disabled={submitting}
                                    className="px-4 py-2 text-xs font-medium bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-sm"
                                >
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
