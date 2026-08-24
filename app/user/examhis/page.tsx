"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
    Search, X, Filter, History,
    BookOpen, Brain, Clock, CheckCircle2, XCircle,
    ChevronRight, BarChart3, TrendingUp, CalendarDays,
    CheckCircle, MinusCircle, Calendar
} from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Pagination from "@/components/Pagination";

// ─────────────────── Types ───────────────────
interface Category {
    category_id: number;
    category_name: string;
    category_description?: string;
}

interface ExamRecord {
    session_id: number;
    item_bank_id?: number;
    item_bank_name?: string;
    status?: string;
    start_time: string;
    end_time?: string;
    // Normal exam
    final_score?: number;
    total_questions?: number;
    correct_count?: number;
    categories?: Category[];
    // CAT exam
    final_theta?: number;
    final_se?: number;
    num_items?: number;
    num_correct?: number;
    passed?: boolean;
    stop_reason?: string;
    // tag
    examType: "NORMAL" | "CAT";
}

type TabType = "ALL" | "NORMAL" | "CAT";
type StatusFilter = "ALL" | "PASSED" | "FAILED";
type DateFilterType = "ALL" | "TODAY" | "7DAYS" | "30DAYS" | "CUSTOM";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

// ─────────────────── Helpers ───────────────────
function formatDateThai(d: string) {
    const date = new Date(d);
    const m = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
    return `${date.getDate()} ${m[date.getMonth()]} ${date.getFullYear() + 543}`;
}

function formatTime(d: string) {
    return new Date(d).toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
}

function calcDuration(start: string, end?: string) {
    if (!end) return "—";
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const h = Math.floor(ms / 3_600_000);
    const m = Math.floor((ms % 3_600_000) / 60_000);
    const s = Math.floor((ms % 60_000) / 1_000);
    return h > 0
        ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
        : `${m}:${String(s).padStart(2, "0")}`;
}

function isPassed(exam: ExamRecord): boolean {
    if (exam.examType === "CAT") return exam.passed ?? false;
    return (exam.final_score ?? 0) >= 50;
}

// ─────────────────── Score Badge ───────────────────
function ScoreBadge({ exam }: { exam: ExamRecord }) {
    if (exam.examType === "CAT") {
        const theta = exam.final_theta;
        return (
            <div className="text-right sm:text-center">
                <div className="text-base sm:text-xl font-black text-purple-700 leading-tight">
                    θ {theta != null ? theta.toFixed(2) : "—"}
                </div>
            </div>
        );
    }

    const pct = Math.round(exam.final_score ?? 0);
    const scoreColor = pct >= 70 ? "text-green-700" : pct >= 50 ? "text-amber-600" : "text-rose-600";
    return (
        <div className="text-right sm:text-center">
            <div className={`text-base sm:text-xl font-black ${scoreColor} leading-tight`}>{pct}%</div>
        </div>
    );
}

// ─────────────────── Stat Summary Bar ───────────────────
function StatBar({ records }: { records: ExamRecord[] }) {
    const total = records.length;
    const passed = records.filter(isPassed).length;
    const normal = records.filter((r) => r.examType === "NORMAL").length;
    const cat = records.filter((r) => r.examType === "CAT").length;

    const stats = [
        {
            title: "ทั้งหมด",
            value: total,
            description: "รอบการสอบ",
            icon: <History className="w-5 h-5" />,
            iconBg: "bg-slate-100 text-slate-600",
            valColor: "text-green-900",
        },
        {
            title: "สอบผ่าน",
            value: passed,
            description: total > 0 ? `${Math.round((passed / total) * 100)}% อัตราผ่าน` : "0% อัตราผ่าน",
            icon: <CheckCircle2 className="w-5 h-5" />,
            iconBg: "bg-green-100 text-green-600",
            valColor: "text-green-600",
        },
        {
            title: "สอบแบบปกติ",
            value: normal,
            description: "ชุดข้อสอบมาตรฐาน",
            icon: <BookOpen className="w-5 h-5" />,
            iconBg: "bg-blue-100 text-blue-600",
            valColor: "text-blue-600",
        },
        {
            title: "สอบแบบ CAT",
            value: cat,
            description: "Adaptive รายข้อ",
            icon: <Brain className="w-5 h-5" />,
            iconBg: "bg-purple-100 text-purple-600",
            valColor: "text-purple-600",
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {stats.map((s) => (
                <div
                    key={s.title}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-lg text-gray-500">
                            {s.title}
                        </span>
                        <div className={`p-2 rounded-xl ${s.iconBg}`}>
                            {s.icon}
                        </div>
                    </div>
                    <div className="mt-3">
                        <div className={`text-2xl sm:text-3xl font-black tracking-tight ${s.valColor}`}>
                            {s.value}
                        </div>
                        <div className="text-sm font-medium text-gray-400 mt-0.5">
                            {s.description}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────── Main ───────────────────
export default function ExamHistoryPage() {
    const { getToken } = useAuth();

    const [normalRecords, setNormalRecords] = useState<ExamRecord[]>([]);
    const [catRecords, setCatRecords] = useState<ExamRecord[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [activeTab, setActiveTab] = useState<TabType>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [selectedCats, setSelectedCats] = useState<number[]>([]);
    const [showFilter, setShowFilter] = useState(false);

    // ── Date Filter States ──
    const [datePreset, setDatePreset] = useState<DateFilterType>("ALL");
    const [singleDate, setSingleDate] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // ── Pagination States ──
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);

    // Reset pagination on filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery, statusFilter, selectedCats, datePreset, singleDate, startDate, endDate, perPage]);

    // ── Fetch ──
    useEffect(() => {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };

        Promise.allSettled([
            fetch(`${API_URL}/items-bank/exam/history?exam_type=NORMAL`, { headers }).then((r) => r.json()),
            fetch(`${API_URL}/cat/history`, { headers }).then((r) => r.json()),
            fetch(`${API_URL}/items-bank/exam/categories`, { headers }).then((r) => r.json()),
        ])
            .then(([normalRes, catRes, catRes2]) => {
                if (normalRes.status === "fulfilled" && Array.isArray(normalRes.value)) {
                    setNormalRecords(normalRes.value.map((d: any) => ({ ...d, examType: "NORMAL" as const })));
                }
                if (catRes.status === "fulfilled" && Array.isArray(catRes.value)) {
                    setCatRecords(catRes.value.map((d: any) => ({ ...d, examType: "CAT" as const })));
                }
                if (catRes2.status === "fulfilled" && Array.isArray(catRes2.value)) {
                    setCategories(catRes2.value);
                }
            })
            .catch(() => setError("ไม่สามารถโหลดประวัติการสอบได้"))
            .finally(() => setLoading(false));
    }, [getToken]);

    // ── Combine + Filter ──
    const catAttemptMap = useMemo(() => {
        const sorted = [...catRecords].sort(
            (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        );
        const map = new Map<number, number>();
        sorted.forEach((record, index) => {
            map.set(record.session_id, index + 1);
        });
        return map;
    }, [catRecords]);

    const allRecords = useMemo(() => {
        return [...normalRecords, ...catRecords].sort(
            (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        );
    }, [normalRecords, catRecords]);

    const filtered = useMemo(() => {
        let src: ExamRecord[] =
            activeTab === "ALL" ? allRecords
                : activeTab === "NORMAL" ? normalRecords
                    : catRecords;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            src = src.filter((r) => {
                if (r.examType === "CAT") {
                    const attempt = catAttemptMap.get(r.session_id);
                    const catTitle = `การสอบแบบ cat ครั้งที่ ${attempt ?? ""}`.toLowerCase();
                    return catTitle.includes(q) || "cat".includes(q);
                }
                return (r.item_bank_name ?? "").toLowerCase().includes(q);
            });
        }
        if (statusFilter !== "ALL") {
            src = src.filter((r) => (statusFilter === "PASSED") === isPassed(r));
        }
        if (selectedCats.length > 0) {
            src = src.filter((r) =>
                r.examType === "CAT" ||
                r.categories?.some((c) => selectedCats.includes(c.category_id))
            );
        }

        // Date Filtering Logic
        if (datePreset === "TODAY") {
            const now = new Date();
            const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
            src = src.filter((r) => {
                const rDate = new Date(r.start_time);
                const rStr = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, "0")}-${String(rDate.getDate()).padStart(2, "0")}`;
                return rStr === todayStr;
            });
        } else if (datePreset === "7DAYS") {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 7);
            cutoff.setHours(0, 0, 0, 0);
            src = src.filter((r) => new Date(r.start_time).getTime() >= cutoff.getTime());
        } else if (datePreset === "30DAYS") {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - 30);
            cutoff.setHours(0, 0, 0, 0);
            src = src.filter((r) => new Date(r.start_time).getTime() >= cutoff.getTime());
        } else if (datePreset === "CUSTOM") {
            if (singleDate) {
                src = src.filter((r) => {
                    const rDate = new Date(r.start_time);
                    const rStr = `${rDate.getFullYear()}-${String(rDate.getMonth() + 1).padStart(2, "0")}-${String(rDate.getDate()).padStart(2, "0")}`;
                    return rStr === singleDate;
                });
            } else {
                if (startDate) {
                    const start = new Date(startDate);
                    start.setHours(0, 0, 0, 0);
                    src = src.filter((r) => new Date(r.start_time).getTime() >= start.getTime());
                }
                if (endDate) {
                    const end = new Date(endDate);
                    end.setHours(23, 59, 59, 999);
                    src = src.filter((r) => new Date(r.start_time).getTime() <= end.getTime());
                }
            }
        }

        return src;
    }, [allRecords, normalRecords, catRecords, activeTab, searchQuery, statusFilter, selectedCats, datePreset, singleDate, startDate, endDate]);

    const isDateFiltered = datePreset !== "ALL" || Boolean(singleDate) || Boolean(startDate) || Boolean(endDate);
    const hasFilter = searchQuery || statusFilter !== "ALL" || selectedCats.length > 0 || isDateFiltered;

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("ALL");
        setSelectedCats([]);
        setDatePreset("ALL");
        setSingleDate("");
        setStartDate("");
        setEndDate("");
    };

    const toggleCat = (id: number) =>
        setSelectedCats((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

    // ── Render States ──
    if (loading) return (
        <>
            <Navbar />
            <div className="min-h-[60vh] flex items-center justify-center">
                <LoadingSpinner size="lg" text="กำลังโหลดประวัติการสอบ..." />
            </div>
            <Footer />
        </>
    );

    if (error) return (
        <>
            <Navbar />
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-sm bg-white rounded-2xl shadow p-8">
                    <XCircle className="w-14 h-14 text-rose-400 mx-auto mb-4" />
                    <h2 className="text-xl font-medium text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
                    <p className="text-gray-500 mb-5">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium transition cursor-pointer"
                    >
                        ลองใหม่
                    </button>
                </div>
            </div>
            <Footer />
        </>
    );

    return (
        <>
            <Navbar />
            <div className="min-h-screen bg-[#F6F7FB] p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">

                    {/* Breadcrumb */}
                    <div className="flex items-center text-sm text-gray-500 mb-5">
                        <Link href="/user" className="hover:text-green-600 cursor-pointer transition">หน้าหลัก</Link>
                        <span className="mx-2">›</span>
                        <span className="text-gray-600 font-medium">ประวัติการทำข้อสอบ</span>
                    </div>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">

                        <div>
                            <h1 className="text-3xl md:text-3xl font-medium text-[#1C2033]">ประวัติการทำข้อสอบ</h1>
                            <p className="text-sm text-[#6B7089] mt-1">ประวัติการทำข้อสอบทั้งหมด (ปกติ และ CAT)</p>
                        </div>
                    </div>

                    {/* Stats Summary Bar */}
                    <StatBar records={allRecords} />

                    {/* Tabs */}
                    <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 mb-5 gap-1 overflow-x-auto">
                        {([
                            { key: "ALL", label: "ทั้งหมด", count: allRecords.length, icon: null },
                            { key: "NORMAL", label: "สอบแบบปกติ", count: normalRecords.length, icon: BookOpen },
                            { key: "CAT", label: "สอบแบบ CAT", count: catRecords.length, icon: Brain },
                        ] as { key: TabType; label: string; count: number; icon: any }[]).map((t) => {
                            const IconComp = t.icon;
                            const isSelected = activeTab === t.key;
                            return (
                                <button
                                    key={t.key}
                                    onClick={() => { setActiveTab(t.key); clearFilters(); }}
                                    className={`flex-1 py-2 sm:py-2.5 px-2.5 sm:px-4 rounded-xl text-sm sm:text-sm font-medium transition-all flex items-center justify-center gap-1.5 sm:gap-2 cursor-pointer whitespace-nowrap ${isSelected
                                        ? t.key === "CAT"
                                            ? "bg-purple-600 text-white shadow-sm"
                                            : t.key === "NORMAL"
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "bg-gray-800 text-white shadow-sm"
                                        : "text-gray-500 hover:bg-gray-50"
                                        }`}
                                >
                                    {IconComp && <IconComp size={14} className="shrink-0" />}
                                    <span>{t.label}</span>
                                    <span className={`text-sm sm:text-sm px-1.5 py-0.5 rounded-full font-medium shrink-0 ${isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                                        }`}>
                                        {t.count}
                                    </span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Search + Filter bar */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-5">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาชื่อชุดข้อสอบ..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full cursor-pointer"
                                    >
                                        <X size={14} className="text-gray-400" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all cursor-pointer ${showFilter || hasFilter
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                    }`}
                            >
                                <Filter size={16} />
                                <span className="hidden sm:inline">ตัวกรอง</span>
                                {hasFilter && (
                                    <span className="bg-white/25 text-white text-sm px-1.5 py-0.5 rounded-full font-medium">
                                        {(statusFilter !== "ALL" ? 1 : 0) + selectedCats.length + (isDateFiltered ? 1 : 0)}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Filter panel */}
                        {showFilter && (
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                                {/* Date Filter Section */}
                                <div>
                                    <div className="flex items-center gap-1.5 mb-2">
                                        <Calendar size={14} className="text-gray-500" />
                                        <p className="text-sm font-medium text-gray-500 ">ช่วงเวลา / วันที่ทำข้อสอบ</p>
                                    </div>

                                    {/* Preset Buttons */}
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {([
                                            { key: "ALL" as DateFilterType, label: "เวลาทั้งหมด" },
                                            { key: "TODAY" as DateFilterType, label: "วันนี้" },
                                            { key: "7DAYS" as DateFilterType, label: "7 วันที่แล้ว" },
                                            { key: "30DAYS" as DateFilterType, label: "30 วันที่แล้ว (1 เดือน)" },
                                            { key: "CUSTOM" as DateFilterType, label: "กำหนดเอง / เลือกวัน" },
                                        ]).map((d) => (
                                            <button
                                                key={d.key}
                                                onClick={() => {
                                                    setDatePreset(d.key);
                                                    if (d.key !== "CUSTOM") {
                                                        setSingleDate("");
                                                        setStartDate("");
                                                        setEndDate("");
                                                    }
                                                }}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${datePreset === d.key
                                                    ? "bg-blue-600 text-white shadow-sm"
                                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                    }`}
                                            >
                                                {d.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Custom Date Inputs */}
                                    {datePreset === "CUSTOM" && (
                                        <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200/80 space-y-3">
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                                                {/* Single Date Picker */}
                                                <div className="flex-1 w-full">
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                                        เลือกวันที่เจาะจง
                                                    </label>
                                                    <input
                                                        type="date"
                                                        value={singleDate}
                                                        onChange={(e) => {
                                                            setSingleDate(e.target.value);
                                                            setStartDate("");
                                                            setEndDate("");
                                                        }}
                                                        className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </div>

                                                <div className="hidden sm:flex items-center text-sm text-gray-400  self-end pb-2.5">
                                                    หรือ
                                                </div>

                                                {/* Range Date Picker */}
                                                <div className="flex-1 w-full">
                                                    <label className="block text-sm font-medium text-gray-600 mb-1">
                                                        เลือกเป็นช่วงเวลา (เริ่มต้น - สิ้นสุด)
                                                    </label>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="date"
                                                            value={startDate}
                                                            onChange={(e) => {
                                                                setStartDate(e.target.value);
                                                                setSingleDate("");
                                                            }}
                                                            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="เริ่มต้น"
                                                        />
                                                        <span className="text-gray-400 text-sm">-</span>
                                                        <input
                                                            type="date"
                                                            value={endDate}
                                                            onChange={(e) => {
                                                                setEndDate(e.target.value);
                                                                setSingleDate("");
                                                            }}
                                                            className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                            placeholder="สิ้นสุด"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Status */}
                                <div>
                                    <p className="text-sm font-medium text-gray-500  mb-2">สถานะ</p>
                                    <div className="flex gap-2">
                                        {([
                                            { key: "ALL" as StatusFilter, label: "ทั้งหมด", icon: null },
                                            { key: "PASSED" as StatusFilter, label: "ผ่าน", icon: CheckCircle },
                                            { key: "FAILED" as StatusFilter, label: "ไม่ผ่าน", icon: MinusCircle },
                                        ]).map((s) => {
                                            const SIcon = s.icon;
                                            return (
                                                <button
                                                    key={s.key}
                                                    onClick={() => setStatusFilter(s.key)}
                                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${statusFilter === s.key
                                                        ? s.key === "PASSED" ? "bg-green-600 text-white"
                                                            : s.key === "FAILED" ? "bg-rose-500 text-white"
                                                                : "bg-gray-800 text-white"
                                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                        }`}
                                                >
                                                    {SIcon && <SIcon size={14} />}
                                                    {s.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Category */}
                                {categories.length > 0 && (activeTab === "NORMAL" || activeTab === "ALL") && (
                                    <div>
                                        <p className="text-sm font-medium text-gray-500  mb-2">หมวดวิชา</p>
                                        <div className="flex flex-wrap gap-2">
                                            {categories.map((c) => (
                                                <button
                                                    key={c.category_id}
                                                    onClick={() => toggleCat(c.category_id)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${selectedCats.includes(c.category_id)
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                        }`}
                                                >
                                                    {c.category_name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {hasFilter && (
                                    <div className="flex justify-end">
                                        <button
                                            onClick={clearFilters}
                                            className="text-sm text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1 cursor-pointer"
                                        >
                                            <X size={14} /> ล้างตัวกรองทั้งหมด
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Results count */}
                    <p className="text-sm text-gray-400 mb-3 px-1">
                        แสดง <span className="font-medium text-gray-700">{filtered.length}</span> รายการ
                        {hasFilter && " (กรองแล้ว)"}
                    </p>

                    {/* History Cards */}
                    {filtered.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                            {hasFilter ? (
                                <>
                                    <Search className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium mb-4">ไม่พบผลลัพธ์ที่ตรงกัน</p>
                                    <button
                                        onClick={clearFilters}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer"
                                    >
                                        ล้างตัวกรอง
                                    </button>
                                </>
                            ) : (
                                <>
                                    <BarChart3 className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium mb-4">ยังไม่มีประวัติการสอบในหมวดหมู่นี้</p>
                                    <Link
                                        href="/user/examset"
                                        className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition cursor-pointer"
                                    >
                                        เริ่มทำข้อสอบ
                                    </Link>
                                </>
                            )}
                        </div>
                    ) : (
                        (() => {
                            const totalPages = Math.ceil(filtered.length / perPage);
                            const startIndex = (currentPage - 1) * perPage;
                            const currentRecords = filtered.slice(startIndex, startIndex + perPage);

                            return (
                                <>
                                    <div className="space-y-3">
                                        {currentRecords.map((exam) => {
                                            const passed = isPassed(exam);
                                            const isCAT = exam.examType === "CAT";

                                            const title = isCAT
                                                ? `การสอบแบบ CAT ครั้งที่ ${catAttemptMap.get(exam.session_id) ?? 1}`
                                                : exam.item_bank_name || "ชุดข้อสอบมาตรฐาน";

                                            // สีขอบ card ตามประเภทสอบ ไม่ใช่ผ่าน/ไม่ผ่าน
                                            const cardBorderColor = isCAT ? "border-l-purple-500" : "border-l-blue-500";

                                            return (
                                                <div
                                                    key={`${exam.examType}-${exam.session_id}`}
                                                    className={`bg-white rounded-2xl shadow-sm border border-gray-100 border-l-4 ${cardBorderColor} hover:shadow-md transition-all duration-200 p-4 sm:p-5`}
                                                >
                                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">

                                                        {/* Icon + Main Info */}
                                                        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                                                            {/* Icon */}
                                                            <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${isCAT
                                                                ? "bg-purple-100 text-purple-600"
                                                                : "bg-blue-100 text-blue-600"
                                                                }`}>
                                                                {isCAT ? <Brain size={20} /> : <BookOpen size={20} />}
                                                            </div>

                                                            {/* Main info */}
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                                                                    <h3 className="font-medium text-gray-900 text-sm sm:text-base leading-snug">
                                                                        {title}
                                                                    </h3>
                                                                    <span className={`text-[10px] sm:text-sm font-medium px-2 py-0.5 rounded-full  shrink-0 ${isCAT
                                                                        ? "bg-purple-100 text-purple-700"
                                                                        : "bg-blue-100 text-blue-700"
                                                                        }`}>
                                                                        {isCAT ? "CAT" : "NORMAL"}
                                                                    </span>
                                                                    {/* Pass/Fail indicator */}
                                                                    <span className={`inline-flex items-center gap-1 text-[10px] sm:text-sm font-medium px-2 py-0.5 rounded-full shrink-0 ${passed
                                                                        ? "bg-green-50 text-green-700 border border-green-200/60"
                                                                        : "bg-rose-50 text-rose-600 border border-rose-200/60"
                                                                        }`}>
                                                                        {passed
                                                                            ? <><CheckCircle size={11} /> ผ่าน</>
                                                                            : <><MinusCircle size={11} /> ไม่ผ่าน</>
                                                                        }
                                                                    </span>
                                                                </div>

                                                                {/* Categories (for Normal) */}
                                                                {!isCAT && exam.categories && exam.categories.length > 0 && (
                                                                    <div className="flex flex-wrap gap-1.5 mb-1.5 pt-0.5">
                                                                        {exam.categories.map((c) => (
                                                                            <span key={c.category_id} className="text-[11px] sm:text-sm px-2 py-0.5 bg-blue-50 text-blue-600 rounded-md font-medium border border-blue-100">
                                                                                {c.category_name}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                )}

                                                                {/* Meta */}
                                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-400">
                                                                    <span className="flex items-center gap-1">
                                                                        <CalendarDays size={12} className="text-gray-400" />
                                                                        {formatDateThai(exam.start_time)} {formatTime(exam.start_time)}
                                                                    </span>
                                                                    {exam.end_time && (
                                                                        <span className="flex items-center gap-1">
                                                                            <Clock size={12} className="text-gray-400" />
                                                                            {calcDuration(exam.start_time, exam.end_time)}
                                                                        </span>
                                                                    )}
                                                                    {isCAT && exam.num_items != null && (
                                                                        <span className="flex items-center gap-1 text-purple-600 font-medium">
                                                                            <TrendingUp size={12} />
                                                                            {exam.num_items} ข้อ · {exam.num_correct}/{exam.num_items} ถูก
                                                                        </span>
                                                                    )}
                                                                    {!isCAT && exam.total_questions != null && (
                                                                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                                                                            {exam.correct_count ?? 0}/{exam.total_questions} ถูก
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Score + Action */}
                                                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2.5 sm:pt-0 border-t sm:border-t-0 border-gray-100 shrink-0">
                                                            <div className="flex items-baseline sm:block text-left sm:text-center gap-1.5">
                                                                <span className="text-sm text-gray-400 sm:hidden">คะแนน:</span>
                                                                <ScoreBadge exam={exam} />
                                                            </div>
                                                            <Link
                                                                href={
                                                                    isCAT
                                                                        ? `/user/cat-exam/result/${exam.session_id}`
                                                                        : `/user/examset/take-exam/summarize-exam?session_id=${exam.session_id}`
                                                                }
                                                                className={`px-4 py-2 sm:py-2.5 text-white text-sm sm:text-sm font-medium rounded-xl transition-all hover:shadow-md whitespace-nowrap text-center ${isCAT
                                                                    ? "bg-purple-600 hover:bg-purple-700"
                                                                    : "bg-blue-600 hover:bg-blue-700"
                                                                    }`}
                                                            >
                                                                ดูผลสอบ
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Pagination */}
                                    {filtered.length > 0 && (
                                        <Pagination
                                            currentPage={currentPage}
                                            totalPages={totalPages}
                                            totalItems={filtered.length}
                                            perPage={perPage}
                                            onPageChange={setCurrentPage}
                                            itemLabel="รายการสอบ"
                                            activeColor="bg-[#76B25A] text-white shadow-sm"
                                        />
                                    )}
                                </>
                            );
                        })()
                    )}

                </div>
            </div>
            <Footer />
        </>
    );
}