"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Navbar_admin from "@/components/Navbar_admin";
import {
    Plus, Edit2, Trash2, ChevronDown, ChevronRight,
    List, Loader2, X, PieChart as PieChartIcon,
    LayoutGrid, Search, ArrowUpDown, Filter, BarChart3,
    Layers, Maximize2, Minimize2, FolderTree, Tag
} from "lucide-react";
import Swal from "@/utils/sweetalert";
import { useAuth } from "@/contexts/AuthContext";
import { SWAL_COLORS } from "@/utils/swal";
import Pagination from "@/components/Pagination";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList
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
    "#10b981", // Emerald
    "#3b82f6", // Blue
    "#8b5cf6", // Purple
    "#f59e0b", // Amber
    "#ec4899", // Pink
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#6366f1", // Indigo
];
const ITEMS_PER_PAGE_ACCORDION = 8;
const ITEMS_PER_PAGE_GRID = 9;

export default function ManageTopicsPage() {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<TopicStats | null>(null);

    // View modes: 'accordion' (ตาราง/รายการ) | 'grid' (การ์ด)
    const [viewMode, setViewMode] = useState<"accordion" | "grid">("accordion");

    // Search, Filter, Sort & Pagination
    const [searchTerm, setSearchTerm] = useState("");
    const [sortBy, setSortBy] = useState<"items_desc" | "items_asc" | "name_asc" | "subtopics_desc">("items_desc");
    const [filterStatus, setFilterStatus] = useState<"all" | "has_items" | "empty">("all");
    const [currentPage, setCurrentPage] = useState(1);

    // Expanded set for accordion view
    const [expandedTopics, setExpandedTopics] = useState<Set<number>>(new Set());

    // Modal states
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [showSubTopicModal, setShowSubTopicModal] = useState(false);
    const [showAnalyticsModal, setShowAnalyticsModal] = useState(false);
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
            }
        } catch (error) {
            console.error("Error fetching stats:", error);
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด",
                text: "ไม่สามารถโหลดข้อมูลได้",
                confirmButtonColor: SWAL_COLORS.confirm
            });
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => {
        fetchStats();
        const savedView = localStorage.getItem("topic_dashboard_viewmode") as any;
        if (savedView && ["accordion", "grid"].includes(savedView)) {
            setViewMode(savedView);
        }
    }, [fetchStats]);

    // Reset pagination when filter/search/sort/viewMode changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortBy, filterStatus, viewMode]);

    const switchView = (mode: "accordion" | "grid") => {
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
        if (totalTopicsCount === 0) return "0";
        return (totalItemsCount / totalTopicsCount).toFixed(1);
    }, [totalItemsCount, totalTopicsCount]);

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

    // Pagination calculations
    const perPage = viewMode === "grid" ? ITEMS_PER_PAGE_GRID : ITEMS_PER_PAGE_ACCORDION;
    const totalPages = Math.max(1, Math.ceil(processedTopics.length / perPage));
    const paginatedTopics = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return processedTopics.slice(start, start + perPage);
    }, [processedTopics, currentPage, perPage]);

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
            html: `ต้องการลบหัวข้อ "<strong>${t.topic_name}</strong>" ใช่หรือไม่?<br/><span class="text-red-500 text-sm">หัวข้อย่อยทั้งหมดภายในหัวข้อนี้จะถูกลบไปด้วย</span>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: SWAL_COLORS.danger,
            cancelButtonColor: SWAL_COLORS.cancel,
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
                Swal.fire({
                    title: "ลบสำเร็จ",
                    text: "ลบหัวข้อเรียบร้อยแล้ว",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch {
                Swal.fire({
                    title: "ข้อผิดพลาด",
                    text: "ไม่สามารถลบหัวข้อได้",
                    icon: "error",
                    confirmButtonColor: SWAL_COLORS.confirm
                });
            }
        }
    };

    const handleDeleteSubTopic = async (st: SubTopic) => {
        const confirm = await Swal.fire({
            title: "ยืนยันการลบหัวข้อย่อย?",
            text: `ต้องการลบหัวข้อย่อย "${st.sub_topic_name}" ใช่หรือไม่?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: SWAL_COLORS.danger,
            cancelButtonColor: SWAL_COLORS.cancel,
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
                Swal.fire({
                    title: "ลบสำเร็จ",
                    text: "ลบหัวข้อย่อยเรียบร้อยแล้ว",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });
            } catch {
                Swal.fire({
                    title: "ข้อผิดพลาด",
                    text: "ไม่สามารถลบหัวข้อย่อยได้",
                    icon: "error",
                    confirmButtonColor: SWAL_COLORS.confirm
                });
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
                Swal.fire({
                    title: "ข้อผิดพลาด",
                    text: errorData.message || "บันทึกไม่สำเร็จ",
                    icon: "error",
                    confirmButtonColor: SWAL_COLORS.confirm
                });
            }
        } catch {
            Swal.fire({
                title: "ข้อผิดพลาด",
                text: "บันทึกไม่สำเร็จ",
                icon: "error",
                confirmButtonColor: SWAL_COLORS.confirm
            });
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
                Swal.fire({
                    title: "ข้อผิดพลาด",
                    text: errorData.message || "บันทึกไม่สำเร็จ",
                    icon: "error",
                    confirmButtonColor: SWAL_COLORS.confirm
                });
            }
        } catch {
            Swal.fire({
                title: "ข้อผิดพลาด",
                text: "บันทึกไม่สำเร็จ",
                icon: "error",
                confirmButtonColor: SWAL_COLORS.confirm
            });
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
                percentage: totalItemsCount > 0 ? (((t.item_count || 0) / totalItemsCount) * 100).toFixed(1) : "0",
            }))
            .sort((a, b) => b.count - a.count);
    }, [stats, totalItemsCount]);

    // Pie Chart Data: Top 5 + Others group for clean readable slice breakdown
    const pieChartData = useMemo(() => {
        const activeTopics = analyticsTopicData.filter(d => d.count > 0);
        if (activeTopics.length <= 5) {
            return activeTopics.map((d, index) => ({
                ...d,
                color: CHART_COLORS[index % CHART_COLORS.length]
            }));
        }
        const top4 = activeTopics.slice(0, 4);
        const rest = activeTopics.slice(4);
        const restCount = rest.reduce((sum, d) => sum + d.count, 0);
        const restSubCount = rest.reduce((sum, d) => sum + d.subCount, 0);

        const result = top4.map((d, index) => ({
            ...d,
            color: CHART_COLORS[index % CHART_COLORS.length]
        }));

        if (restCount > 0) {
            result.push({
                name: `อื่น ๆ (${rest.length} หัวข้อ)`,
                count: restCount,
                subCount: restSubCount,
                percentage: totalItemsCount > 0 ? ((restCount / totalItemsCount) * 100).toFixed(1) : "0",
                color: "#94a3b8" // Slate 400
            });
        }
        return result;
    }, [analyticsTopicData, totalItemsCount]);

    return (
        <Navbar_admin>
            <div className="max-w-7xl mx-auto w-full space-y-4 sm:space-y-6" suppressHydrationWarning>

                {/* ── Page Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                    <div>
                        <h1 className="text-xl sm:text-3xl font-medium text-gray-900 mb-1">จัดการหัวข้อข้อสอบ</h1>
                        <p className="text-xs sm:text-sm text-gray-500">โครงสร้างหมวดหมู่ข้อสอบ Topic & Sub-Topic ทั้งหมดในระบบ</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
                        <button
                            onClick={() => setShowAnalyticsModal(true)}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
                        >
                            <BarChart3 size={16} className="text-green-600" />
                            <span>ดูรายงานสถิติ</span>
                        </button>
                        <button
                            onClick={handleCreateTopic}
                            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 sm:gap-2 bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                            <Plus size={16} />
                            <span>สร้างหัวข้อหลักใหม่</span>
                        </button>
                    </div>
                </div>

                {/* ── 1. KPI Metric Dashboard Cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-4 sm:mb-6">
                    <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-green-50 text-green-600 rounded-xl shrink-0">
                            <FolderTree className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">หัวข้อหลัก (Topic)</p>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-lg sm:text-2xl font-medium text-gray-900">{totalTopicsCount}</span>
                                <span className="text-xs sm:text-sm text-gray-500 font-medium">หัวข้อ</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <Tag className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">หัวข้อย่อย (Sub-Topic)</p>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-lg sm:text-2xl font-medium text-gray-900">{totalSubTopicsCount}</span>
                                <span className="text-xs sm:text-sm text-gray-500 font-medium">หัวข้อย่อย</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                            <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">จำนวนข้อสอบรวม</p>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-lg sm:text-2xl font-medium text-gray-900">{totalItemsCount}</span>
                                <span className="text-xs sm:text-sm text-gray-500 font-medium">ข้อ</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex items-center gap-3 sm:gap-4">
                        <div className="p-2 sm:p-3 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs sm:text-sm font-medium text-gray-500 truncate">เฉลี่ยข้อ / หัวข้อ</p>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-lg sm:text-2xl font-medium text-gray-900">{avgItemsPerTopic}</span>
                                <span className="text-xs sm:text-sm text-gray-500 font-medium">ข้อ</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── 2. Filters & Search Bar with View Switcher ── */}
                <div className="bg-white p-3 sm:p-3.5 rounded-2xl border border-gray-200 shadow-xs mb-4 sm:mb-6 flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between">
                    {/* Search Input */}
                    <div className="relative flex-1 min-w-0">
                        <input
                            type="text"
                            placeholder="ค้นหาหัวข้อหลัก / ย่อย..."
                            aria-label="ค้นหาหัวข้อหลัก หรือหัวข้อย่อย"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-all"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-3.5 h-3.5" />
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        {/* Dropdown Filters Group */}
                        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                            {/* Sort Selector */}
                            <div className="relative">
                                <select
                                    value={sortBy}
                                    aria-label="จัดเรียงหัวข้อตาม"
                                    onChange={e => setSortBy(e.target.value as any)}
                                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-2.5 sm:px-3 py-2 pr-7 text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                                >
                                    <option value="items_desc">ข้อสอบมากสุด</option>
                                    <option value="items_asc">ข้อสอบน้อยสุด</option>
                                    <option value="name_asc">ชื่อ (ก-ฮ)</option>
                                    <option value="subtopics_desc">หัวข้อย่อยมากสุด</option>
                                </select>
                                <ArrowUpDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>

                            {/* Status Filter */}
                            <div className="relative">
                                <select
                                    value={filterStatus}
                                    aria-label="กรองตามสถานะข้อสอบ"
                                    onChange={e => setFilterStatus(e.target.value as any)}
                                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-2.5 sm:px-3 py-2 pr-7 text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 cursor-pointer"
                                >
                                    <option value="all">ทุกหมวด</option>
                                    <option value="has_items">มีข้อสอบ (&gt;0)</option>
                                    <option value="empty">ยังไม่มีข้อสอบ (0)</option>
                                </select>
                                <Filter size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                            </div>
                        </div>

                        {/* View Switcher: ตาราง / การ์ด */}
                        <div className="bg-gray-100 p-1 rounded-xl flex items-center justify-center gap-0.5 border border-gray-200/50">
                            <button
                                onClick={() => switchView("accordion")}
                                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${viewMode === "accordion"
                                    ? "bg-white text-green-700 shadow-2xs"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                                title="แสดงแบบตาราง / รายการ"
                            >
                                <List size={14} />
                                <span>ตาราง</span>
                            </button>
                            <button
                                onClick={() => switchView("grid")}
                                className={`flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${viewMode === "grid"
                                    ? "bg-white text-green-700 shadow-2xs"
                                    : "text-gray-600 hover:text-gray-900"
                                    }`}
                                title="แสดงแบบการ์ด"
                            >
                                <LayoutGrid size={14} />
                                <span>การ์ด</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* ── 3. Content Section ── */}
                {loading ? (
                    <div className="py-20 bg-white rounded-2xl border border-gray-200">
                        <LoadingSpinner text="กำลังโหลดข้อมูลหัวข้อข้อสอบ..." />
                    </div>
                ) : processedTopics.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center">
                        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 mx-auto flex items-center justify-center mb-3">
                            <Search size={22} />
                        </div>
                        <h2 className="text-base font-medium text-gray-900 mb-1">ไม่พบหัวข้อข้อสอบ</h2>
                        <p className="text-sm text-gray-500 mb-4">ลองปรับเปลี่ยนคำค้นหา หรือสร้างหัวข้อหลักใหม่เพื่อเริ่มต้น</p>
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm("")}
                                className="text-sm text-green-600 font-medium hover:underline cursor-pointer"
                            >
                                ล้างคำค้นหา
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* ── VIEW 1: ACCORDION VIEW (ตาราง / รายการ) ── */}
                        {viewMode === "accordion" && (
                            <div className="space-y-3">
                                {/* Expand/Collapse Controls */}
                                <div className="flex justify-between items-center text-xs sm:text-sm text-gray-500 px-1 mb-2">
                                    <span>
                                        แสดง <strong>{paginatedTopics.length}</strong> จาก <strong>{processedTopics.length}</strong> หัวข้อหลัก
                                    </span>
                                    <div className="flex gap-3">
                                        <button onClick={expandAll} className="hover:text-green-600 flex items-center gap-1 cursor-pointer">
                                            <Maximize2 size={12} /> <span className="hidden sm:inline">ขยายทั้งหมด</span><span className="sm:hidden">ขยาย</span>
                                        </button>
                                        <button onClick={collapseAll} className="hover:text-gray-700 flex items-center gap-1 cursor-pointer">
                                            <Minimize2 size={12} /> <span className="hidden sm:inline">หุบทั้งหมด</span><span className="sm:hidden">หุบ</span>
                                        </button>
                                    </div>
                                </div>

                                {paginatedTopics.map(t => {
                                    const isExpanded = expandedTopics.has(t.topic_id);
                                    const subCount = t.sub_topics?.length || 0;
                                    const itemCount = t.item_count || 0;

                                    return (
                                        <div key={t.topic_id} className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden transition-all">
                                            {/* Topic Row Header */}
                                            <div
                                                onClick={() => toggleTopicExpand(t.topic_id)}
                                                className="p-3.5 sm:p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50/80 transition-colors select-none gap-2"
                                            >
                                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                                                    <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${isExpanded ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                                                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                            <h2 className="text-sm sm:text-base font-medium text-gray-900 truncate">{t.topic_name}</h2>
                                                            <span className="text-xs sm:text-sm font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100 shrink-0">
                                                                {itemCount} ข้อ
                                                            </span>
                                                            <span className="text-xs sm:text-sm text-gray-400 shrink-0">
                                                                ({subCount} ย่อย)
                                                            </span>
                                                        </div>
                                                        {t.description && <p className="text-xs sm:text-sm text-gray-500 mt-0.5 truncate">{t.description}</p>}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleCreateSubTopic(t.topic_id)}
                                                        className="text-xs sm:text-sm text-green-600 hover:bg-green-50 font-medium px-2 sm:px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 border border-green-200 cursor-pointer"
                                                    >
                                                        <Plus size={13} />
                                                        <span className="hidden sm:inline">เพิ่มหัวข้อย่อย</span>
                                                        <span className="sm:hidden">ย่อย</span>
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditTopic(t)}
                                                        aria-label={`แก้ไขหัวข้อหลัก ${t.topic_name}`}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                                                        title="แก้ไขหัวข้อหลัก"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDeleteTopic(t)}
                                                        aria-label={`ลบหัวข้อหลัก ${t.topic_name}`}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                                        title="ลบหัวข้อหลัก"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* SubTopics Body */}
                                            {isExpanded && (
                                                <div className="border-t border-gray-100 bg-gray-50/50 p-2.5 sm:p-4">
                                                    {subCount === 0 ? (
                                                        <div className="text-center py-5 sm:py-6 text-xs sm:text-sm text-gray-400 bg-white rounded-xl border border-dashed border-gray-200">
                                                            ยังไม่มีหัวข้อย่อยในหมวดนี้ —{" "}
                                                            <button
                                                                onClick={() => handleCreateSubTopic(t.topic_id)}
                                                                className="text-green-600 font-medium hover:underline cursor-pointer"
                                                            >
                                                                สร้างหัวข้อย่อยแรก
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="bg-white rounded-xl border border-gray-200 overflow-x-auto shadow-xs">
                                                            <table className="min-w-[500px] w-full divide-y divide-gray-100">
                                                                <thead className="bg-gray-50">
                                                                    <tr>
                                                                        <th scope="col" className="px-3 sm:px-4 py-2.5 text-left text-xs sm:text-sm font-medium text-gray-600 w-12">#</th>
                                                                        <th scope="col" className="px-3 sm:px-4 py-2.5 text-left text-xs sm:text-sm font-medium text-gray-600">ชื่อหัวข้อย่อย</th>
                                                                        <th scope="col" className="px-3 sm:px-4 py-2.5 text-left text-xs sm:text-sm font-medium text-gray-600">คำอธิบาย</th>
                                                                        <th scope="col" className="px-3 sm:px-4 py-2.5 text-center text-xs sm:text-sm font-medium text-gray-600 w-28">จำนวนข้อสอบ</th>
                                                                        <th scope="col" className="px-3 sm:px-4 py-2.5 text-right text-xs sm:text-sm font-medium text-gray-600 w-20">จัดการ</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-50">
                                                                    {t.sub_topics.map((st, idx) => (
                                                                        <tr key={st.sub_topic_id} className="hover:bg-gray-50/80 transition-colors">
                                                                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-600">{idx + 1}</td>
                                                                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-900">{st.sub_topic_name}</td>
                                                                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-500 max-w-xs truncate">{st.description || "—"}</td>
                                                                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-center">
                                                                                <span className="text-xs sm:text-sm font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                                                                    {st.item_count || 0} ข้อ
                                                                                </span>
                                                                            </td>
                                                                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-right">
                                                                                <div className="flex items-center justify-end gap-1">
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleEditSubTopic(st)}
                                                                                        aria-label={`แก้ไขหัวข้อย่อย ${st.sub_topic_name}`}
                                                                                        className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all cursor-pointer"
                                                                                        title="แก้ไขหัวข้อย่อย"
                                                                                    >
                                                                                        <Edit2 size={13} />
                                                                                    </button>
                                                                                    <button
                                                                                        type="button"
                                                                                        onClick={() => handleDeleteSubTopic(st)}
                                                                                        aria-label={`ลบหัวข้อย่อย ${st.sub_topic_name}`}
                                                                                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                                                                                        title="ลบหัวข้อย่อย"
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
                                            )}
                                        </div>
                                    );
                                })}

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={processedTopics.length}
                                    perPage={perPage}
                                    onPageChange={setCurrentPage}
                                    itemLabel="หัวข้อหลัก"
                                />
                            </div>
                        )}

                        {/* ── VIEW 2: GRID CARDS VIEW (การ์ด) ── */}
                        {viewMode === "grid" && (
                            <div className="space-y-4 sm:space-y-6">
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
                                    {paginatedTopics.map(t => {
                                        const subCount = t.sub_topics?.length || 0;
                                        const itemCount = t.item_count || 0;

                                        return (
                                            <div
                                                key={t.topic_id}
                                                className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                                            >
                                                <div className="p-4 sm:p-5">
                                                    <div className="flex justify-between items-start mb-2.5 sm:mb-3 gap-2">
                                                        <h2 className="text-sm sm:text-base font-medium text-gray-900 line-clamp-1">{t.topic_name}</h2>
                                                        <div className="flex items-center gap-1 shrink-0">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEditTopic(t)}
                                                                aria-label={`แก้ไขหัวข้อหลัก ${t.topic_name}`}
                                                                className="p-1 text-gray-500 hover:text-blue-600 rounded transition-all cursor-pointer"
                                                                title="แก้ไขหัวข้อหลัก"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteTopic(t)}
                                                                aria-label={`ลบหัวข้อหลัก ${t.topic_name}`}
                                                                className="p-1 text-gray-500 hover:text-red-600 rounded transition-all cursor-pointer"
                                                                title="ลบหัวข้อหลัก"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <p className="text-xs sm:text-sm text-gray-500 line-clamp-2 leading-relaxed mb-3 sm:mb-4 min-h-[30px] sm:min-h-[32px]">
                                                        {t.description || "ไม่มีคำอธิบายเพิ่มเติม"}
                                                    </p>

                                                    {/* Subtopics Pills */}
                                                    <div className="flex flex-wrap gap-1.5 mb-3 sm:mb-4 max-h-20 overflow-hidden">
                                                        {subCount === 0 ? (
                                                            <span className="text-xs sm:text-sm text-gray-500 italic">ไม่มีหัวข้อย่อย</span>
                                                        ) : (
                                                            t.sub_topics.slice(0, 4).map(st => (
                                                                <span key={st.sub_topic_id} className="text-xs sm:text-sm font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md truncate max-w-[140px]">
                                                                    {st.sub_topic_name}
                                                                </span>
                                                            ))
                                                        )}
                                                        {subCount > 4 && (
                                                            <span className="text-xs sm:text-sm font-medium bg-green-50 text-green-700 px-2 py-0.5 rounded-md">
                                                                +{subCount - 4} เพิ่มเติม
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Bottom Info Bar */}
                                                <div className="bg-gray-50 border-t border-gray-100 px-4 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between">
                                                    <div>
                                                        <span className="text-xs text-gray-500  font-medium block">จำนวนข้อสอบ</span>
                                                        <span className="text-xs sm:text-sm font-medium text-green-700">{itemCount} ข้อ</span>
                                                    </div>
                                                    <button
                                                        onClick={() => handleCreateSubTopic(t.topic_id)}
                                                        className="text-xs sm:text-sm text-green-600 hover:text-green-800 font-medium flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <Plus size={13} /> เพิ่มหัวข้อย่อย
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                <Pagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    totalItems={processedTopics.length}
                                    perPage={perPage}
                                    onPageChange={setCurrentPage}
                                    itemLabel="หัวข้อหลัก"
                                />
                            </div>
                        )}
                    </>
                )}

                {/* ─── MODAL: Topic Modal (Create / Edit) ─── */}
                {showTopicModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            <div className="border-b border-gray-100 px-4 sm:px-6 py-3.5 sm:py-4 flex justify-between items-center">
                                <h2 className="text-base font-medium text-gray-900">
                                    {editingTopic ? "แก้ไขหัวข้อหลัก" : "สร้างหัวข้อหลักใหม่"}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setShowTopicModal(false)}
                                    aria-label="ปิดหน้าต่างหัวข้อหลัก"
                                    className="text-gray-500 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
                                <div>
                                    <label htmlFor="topic-name-input" className="block text-sm font-medium text-gray-700 mb-1">
                                        ชื่อหัวข้อหลัก <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="topic-name-input"
                                        aria-label="ชื่อหัวข้อหลัก"
                                        type="text"
                                        value={topicName}
                                        onChange={e => setTopicName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                        placeholder="เช่น เภสัชวิทยา (Pharmacology)"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="topic-desc-input" className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                                    <textarea
                                        id="topic-desc-input"
                                        aria-label="คำอธิบายหัวข้อหลัก"
                                        value={topicDesc}
                                        onChange={e => setTopicDesc(e.target.value)}
                                        rows={3}
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                                        placeholder="คำอธิบายรายละเอียดหัวข้อ..."
                                    />
                                </div>
                            </div>
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                                <button
                                    onClick={() => setShowTopicModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={submitTopic}
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                                >
                                    {submitting && <Loader2 size={14} className="animate-spin" />} บันทึก
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── MODAL: SubTopic Modal (Create / Edit) ─── */}
                {showSubTopicModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-xs">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                            <div className="border-b border-gray-100 px-4 sm:px-6 py-3.5 sm:py-4 flex justify-between items-center">
                                <h2 className="text-base font-medium text-gray-900">
                                    {editingSubTopic ? "แก้ไขหัวข้อย่อย" : "สร้างหัวข้อย่อยใหม่"}
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => setShowSubTopicModal(false)}
                                    aria-label="ปิดหน้าต่างหัวข้อย่อย"
                                    className="text-gray-500 hover:text-gray-600 p-1 rounded-lg cursor-pointer"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <div className="p-4 sm:p-6 space-y-3.5 sm:space-y-4">
                                <div>
                                    <label htmlFor="subtopic-name-input" className="block text-sm font-medium text-gray-700 mb-1">
                                        ชื่อหัวข้อย่อย <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        id="subtopic-name-input"
                                        aria-label="ชื่อหัวข้อย่อย"
                                        type="text"
                                        value={subTopicName}
                                        onChange={e => setSubTopicName(e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
                                        placeholder="เช่น ยาต้านจุลชีพ (Antimicrobial agents)"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="subtopic-desc-input" className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
                                    <textarea
                                        id="subtopic-desc-input"
                                        aria-label="คำอธิบายหัวข้อย่อย"
                                        value={subTopicDesc}
                                        onChange={e => setSubTopicDesc(e.target.value)}
                                        rows={3}
                                        className="w-full px-3.5 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none resize-none"
                                        placeholder="คำอธิบายรายละเอียดหัวข้อย่อย..."
                                    />
                                </div>
                            </div>
                            <div className="px-4 sm:px-6 py-3 sm:py-4 border-t border-gray-100 flex justify-end gap-2 bg-gray-50">
                                <button
                                    onClick={() => setShowSubTopicModal(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={submitSubTopic}
                                    disabled={submitting}
                                    className="px-4 py-2 text-sm font-medium bg-green-600 hover:bg-green-700 text-white rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition-colors shadow-xs cursor-pointer"
                                >
                                    {submitting && <Loader2 size={14} className="animate-spin" />} บันทึก
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── MODAL: Analytics / Report Modal (รายงานสถิติ) ─── */}
                {showAnalyticsModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/40 backdrop-blur-xs">
                        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
                            {/* Modal Header */}
                            <div className="border-b border-gray-100 px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center bg-gray-50/50">
                                <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                                    <div className="p-1.5 sm:p-2 bg-green-100 text-green-700 rounded-xl shrink-0">
                                        <BarChart3 size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-base sm:text-lg font-medium text-gray-900 truncate">รายงานสถิติโครงสร้างหัวข้อข้อสอบ</h2>
                                        <p className="text-xs sm:text-sm text-gray-500 truncate">ภาพรวมการกระจายตัวของจำนวนข้อสอบตามหัวข้อหลัก</p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setShowAnalyticsModal(false)}
                                    aria-label="ปิดหน้ารายงานสถิติ"
                                    className="text-gray-500 hover:text-gray-600 p-1.5 sm:p-2 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer shrink-0 ml-2"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 flex-1">
                                {/* Charts Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
                                    {/* 1. Bar Chart Card */}
                                    <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col h-[340px] sm:h-[400px]">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                                                <h3 className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                                                    จำนวนข้อสอบรายหัวข้อ (Top 8 Topics)
                                                </h3>
                                            </div>
                                            <span className="text-[10px] sm:text-[11px] font-medium bg-green-50 text-green-700 px-2 sm:px-2.5 py-0.5 rounded-full border border-green-200 shrink-0">
                                                Top 8
                                            </span>
                                        </div>

                                        <div className="flex-1 w-full min-h-0 pt-1 sm:pt-2">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart
                                                    data={analyticsTopicData.slice(0, 8)}
                                                    layout="vertical"
                                                    margin={{ left: 0, right: 35, top: 5, bottom: 5 }}
                                                >
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                                    <XAxis
                                                        type="number"
                                                        tick={{ fontSize: 10, fill: "#64748b" }}
                                                        axisLine={{ stroke: "#e2e8f0" }}
                                                        tickLine={false}
                                                    />
                                                    <YAxis
                                                        type="category"
                                                        dataKey="name"
                                                        width={120}
                                                        tick={{ fontSize: 10, fill: "#334155" }}
                                                        axisLine={{ stroke: "#e2e8f0" }}
                                                        tickLine={false}
                                                        tickFormatter={(val: string) => val.length > 16 ? `${val.slice(0, 14)}...` : val}
                                                    />
                                                    <Tooltip
                                                        content={({ active, payload }) => {
                                                            if (active && payload && payload.length) {
                                                                const data = payload[0].payload;
                                                                return (
                                                                    <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl shadow-lg border border-gray-100 text-xs space-y-1 z-50">
                                                                        <p className="font-medium text-gray-900 border-b border-gray-100 pb-1">{data.name}</p>
                                                                        <div className="flex justify-between gap-3 text-gray-600">
                                                                            <span>จำนวนข้อสอบ:</span>
                                                                            <span className="font-bold text-green-600">{data.count} ข้อ</span>
                                                                        </div>
                                                                        <div className="flex justify-between gap-3 text-gray-500">
                                                                            <span>หัวข้อย่อย:</span>
                                                                            <span className="font-medium text-gray-700">{data.subCount} หมวด</span>
                                                                        </div>
                                                                        <div className="flex justify-between gap-3 text-gray-500">
                                                                            <span>สัดส่วน:</span>
                                                                            <span className="font-medium text-blue-600">{data.percentage}%</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }
                                                            return null;
                                                        }}
                                                    />
                                                    <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={14}>
                                                        {analyticsTopicData.slice(0, 8).map((_, index) => (
                                                            <Cell key={`bar-cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                        ))}
                                                        <LabelList
                                                            dataKey="count"
                                                            position="right"
                                                            formatter={(val: any) => `${val ?? 0} ข้อ`}
                                                            style={{ fontSize: 10, fill: "#475569", fontWeight: 600 }}
                                                        />
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* 2. Donut Chart Card */}
                                    <div className="bg-white p-3.5 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col h-[340px] sm:h-[400px]">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                                                <h3 className="text-xs sm:text-sm font-medium text-gray-800 truncate">
                                                    สัดส่วนร้อยละตามหัวข้อหลัก
                                                </h3>
                                            </div>
                                            <span className="text-[10px] sm:text-[11px] font-medium bg-blue-50 text-blue-700 px-2 sm:px-2.5 py-0.5 rounded-full border border-blue-200 shrink-0">
                                                ภาพรวม
                                            </span>
                                        </div>

                                        <div className="flex-1 flex flex-col justify-between min-h-0 pt-1 sm:pt-2">
                                            {/* Donut Chart with Centered Total */}
                                            <div className="relative w-full h-[150px] sm:h-[175px] flex items-center justify-center shrink-0">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={pieChartData}
                                                            cx="50%" cy="50%"
                                                            innerRadius={42} outerRadius={68}
                                                            paddingAngle={3}
                                                            cornerRadius={4}
                                                            dataKey="count"
                                                        >
                                                            {pieChartData.map((entry, index) => (
                                                                <Cell key={`pie-cell-${index}`} fill={entry.color} stroke="#ffffff" strokeWidth={2} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            content={({ active, payload }) => {
                                                                if (active && payload && payload.length) {
                                                                    const data = payload[0].payload;
                                                                    return (
                                                                        <div className="bg-white/95 backdrop-blur-md p-2.5 rounded-xl shadow-lg border border-gray-100 text-xs space-y-1 z-50">
                                                                            <p className="font-medium text-gray-900">{data.name}</p>
                                                                            <p className="text-gray-600">{data.count} ข้อ ({data.percentage}%)</p>
                                                                        </div>
                                                                    );
                                                                }
                                                                return null;
                                                            }}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                                    <span className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{totalItemsCount}</span>
                                                    <span className="text-sm text-gray-500 ">ข้อสอบรวม</span>
                                                </div>
                                            </div>

                                            {/* Clean Symmetrical Legend Grid */}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-2.5 sm:pt-3 border-t border-gray-100 overflow-y-auto max-h-[130px] sm:max-h-[140px] pr-1">
                                                {pieChartData.map((entry, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between gap-1.5 p-1.5 rounded-lg bg-gray-50/60 hover:bg-gray-100/70 transition-colors text-xs"
                                                    >
                                                        <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                                            <span
                                                                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                                                                style={{ backgroundColor: entry.color }}
                                                            />
                                                            <span className="text-gray-700 font-medium truncate text-[10px] sm:text-[11px]" title={entry.name}>
                                                                {entry.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-1 shrink-0 text-[10px]">
                                                            <span className="text-gray-500 font-medium">{entry.count} ข้อ</span>
                                                            <span className="bg-white text-gray-600 px-1 py-0.5 rounded border border-gray-200 font-medium">
                                                                {entry.percentage}%
                                                            </span>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Table Breakdown */}
                                <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
                                    <div className="bg-gray-50 px-3.5 sm:px-5 py-3 sm:py-3.5 border-b border-gray-200 flex items-center justify-between">
                                        <div className="font-medium text-xs sm:text-sm text-gray-700">
                                            ตารางสรุปจำนวนข้อสอบแยกตามหัวข้อ
                                        </div>
                                        <span className="text-xs sm:text-sm text-gray-500">
                                            ทั้งหมด {stats?.by_topic.length || 0} หัวข้อหลัก
                                        </span>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-[500px] w-full text-left divide-y divide-gray-100">
                                            <thead className="bg-gray-50/60">
                                                <tr>
                                                    <th className="px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-medium text-gray-500 w-12">#</th>
                                                    <th className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-500">หัวข้อหลัก</th>
                                                    <th className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-500 text-center w-28">หัวข้อย่อย</th>
                                                    <th className="px-3 sm:px-4 py-2.5 text-xs sm:text-sm font-medium text-gray-500 text-center w-32">จำนวนข้อสอบ</th>
                                                    <th className="px-3 sm:px-5 py-2.5 text-xs sm:text-sm font-medium text-gray-500 text-right w-44">สัดส่วน</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 bg-white">
                                                {stats?.by_topic.map((t, idx) => {
                                                    const pct = totalItemsCount > 0 ? (((t.item_count || 0) / totalItemsCount) * 100).toFixed(1) : "0";
                                                    return (
                                                        <tr key={t.topic_id} className="hover:bg-gray-50/80 transition-colors">
                                                            <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-400 font-medium">{idx + 1}</td>
                                                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-gray-900">{t.topic_name}</td>
                                                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-gray-500 text-center">
                                                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium text-[11px]">
                                                                    {t.sub_topics?.length || 0} หมวด
                                                                </span>
                                                            </td>
                                                            <td className="px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium text-green-700 text-center">
                                                                {t.item_count || 0} ข้อ
                                                            </td>
                                                            <td className="px-3 sm:px-5 py-2.5 sm:py-3 text-right">
                                                                <div className="flex items-center gap-2 justify-end">
                                                                    <div className="w-16 sm:w-20 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                                        <div
                                                                            className="bg-green-500 h-full rounded-full transition-all"
                                                                            style={{ width: `${Math.min(100, Number(pct))}%` }}
                                                                        />
                                                                    </div>
                                                                    <span className="text-xs sm:text-sm font-medium text-gray-700 w-10 text-right">{pct}%</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="border-t border-gray-100 px-4 sm:px-6 py-3 bg-gray-50 flex justify-end">
                                <button
                                    onClick={() => setShowAnalyticsModal(false)}
                                    className="w-full sm:w-auto px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl text-sm font-medium transition-colors cursor-pointer"
                                >
                                    ปิด
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </Navbar_admin>
    );
}
