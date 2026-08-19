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
    Layers, Sparkles, Award
} from "lucide-react";
import PageSkeleton from "@/components/Skeleton";

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
    // MST exam
    total_items?: number;
    total_correct?: number;
    routing_path?: string[];
    // tag
    examType: "NORMAL" | "CAT" | "MST";
}

type TabType = "ALL" | "NORMAL" | "CAT" | "MST";
type StatusFilter = "ALL" | "PASSED" | "FAILED";

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
    if (exam.examType === "CAT" || exam.examType === "MST") return exam.passed ?? false;
    return (exam.final_score ?? 0) >= 50;
}

// ─────────────────── Score Badge ───────────────────
function ScoreBadge({ exam }: { exam: ExamRecord }) {
    if (exam.examType === "CAT") {
        const theta = exam.final_theta;
        return (
            <div className="text-center">
                <div className="text-xl font-bold text-purple-700">
                    θ {theta != null ? theta.toFixed(2) : "—"}
                </div>
                <div className={`text-xs font-semibold mt-0.5 ${exam.passed ? "text-emerald-600" : "text-rose-500"}`}>
                    {exam.passed ? "ผ่าน" : "ไม่ผ่าน"}
                </div>
            </div>
        );
    }

    if (exam.examType === "MST") {
        const theta = exam.final_theta;
        return (
            <div className="text-center">
                <div className="text-xl font-bold text-indigo-700">
                    θ {theta != null ? theta.toFixed(2) : "—"}
                </div>
                <div className={`text-xs font-semibold mt-0.5 ${exam.passed ? "text-emerald-600" : "text-rose-500"}`}>
                    {exam.passed ? "ผ่าน" : "ไม่ผ่าน"}
                </div>
            </div>
        );
    }

    const pct = Math.round(exam.final_score ?? 0);
    const color = pct >= 70 ? "text-emerald-700" : pct >= 50 ? "text-amber-600" : "text-rose-600";
    return (
        <div className="text-center">
            <div className={`text-xl font-bold ${color}`}>{pct}%</div>
            <div className={`text-xs font-semibold mt-0.5 ${pct >= 50 ? "text-emerald-600" : "text-rose-500"}`}>
                {pct >= 50 ? "ผ่าน" : "ไม่ผ่าน"}
            </div>
        </div>
    );
}

// ─────────────────── Stat Summary Bar ───────────────────
function StatBar({ records }: { records: ExamRecord[] }) {
    const total = records.length;
    const passed = records.filter(isPassed).length;
    const normal = records.filter((r) => r.examType === "NORMAL").length;
    const cat = records.filter((r) => r.examType === "CAT").length;
    const mst = records.filter((r) => r.examType === "MST").length;

    const stats = [
        {
            title: "ทั้งหมด",
            value: total,
            description: "รอบการสอบ",
            icon: <History className="w-5 h-5" />,
            iconBg: "bg-slate-100 text-slate-700",
            valColor: "text-gray-900",
        },
        {
            title: "สอบผ่าน",
            value: passed,
            description: total > 0 ? `${Math.round((passed / total) * 100)}% อัตราผ่าน` : "0% อัตราผ่าน",
            icon: <CheckCircle2 className="w-5 h-5" />,
            iconBg: "bg-emerald-100 text-emerald-600",
            valColor: "text-emerald-600",
        },
        {
            title: "สอบปกติ",
            value: normal,
            description: "ชุดข้อสอบมาตรฐาน",
            icon: <BookOpen className="w-5 h-5" />,
            iconBg: "bg-blue-100 text-blue-600",
            valColor: "text-blue-600",
        },
        {
            title: "สอบ CAT",
            value: cat,
            description: "Adaptive รายข้อ",
            icon: <Brain className="w-5 h-5" />,
            iconBg: "bg-purple-100 text-purple-600",
            valColor: "text-purple-600",
        },
        {
            title: "สอบ MST",
            value: mst,
            description: "Adaptive รายด่าน",
            icon: <Layers className="w-5 h-5" />,
            iconBg: "bg-indigo-100 text-indigo-600",
            valColor: "text-indigo-600",
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 mb-6">
            {stats.map((s) => (
                <div
                    key={s.title}
                    className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md flex flex-col justify-between"
                >
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                            {s.title}
                        </span>
                        <div className={`p-2.5 rounded-xl flex items-center justify-center ${s.iconBg}`}>
                            {s.icon}
                        </div>
                    </div>
                    <div className="mt-2.5">
                        <div className={`text-2xl sm:text-3xl font-black tracking-tight ${s.valColor}`}>
                            {s.value}
                        </div>
                        <div className="text-[11px] font-medium text-gray-400 mt-0.5">
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
    const [mstRecords, setMstRecords] = useState<ExamRecord[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [activeTab, setActiveTab] = useState<TabType>("ALL");
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
    const [selectedCats, setSelectedCats] = useState<number[]>([]);
    const [showFilter, setShowFilter] = useState(false);

    // ── Fetch ──
    useEffect(() => {
        const token = getToken();
        const headers = { Authorization: `Bearer ${token}` };

        Promise.allSettled([
            fetch(`${API_URL}/items-bank/exam/history?exam_type=NORMAL`, { headers }).then((r) => r.json()),
            fetch(`${API_URL}/cat/history`, { headers }).then((r) => r.json()),
            fetch(`${API_URL}/mst/history`, { headers }).then((r) => r.json()),
            fetch(`${API_URL}/items-bank/exam/categories`, { headers }).then((r) => r.json()),
        ])
            .then(([normalRes, catRes, mstRes, catRes2]) => {
                if (normalRes.status === "fulfilled" && Array.isArray(normalRes.value)) {
                    setNormalRecords(normalRes.value.map((d: any) => ({ ...d, examType: "NORMAL" as const })));
                }
                if (catRes.status === "fulfilled" && Array.isArray(catRes.value)) {
                    setCatRecords(catRes.value.map((d: any) => ({ ...d, examType: "CAT" as const })));
                }
                if (mstRes.status === "fulfilled" && Array.isArray(mstRes.value)) {
                    setMstRecords(mstRes.value.map((d: any) => ({ ...d, examType: "MST" as const })));
                }
                if (catRes2.status === "fulfilled" && Array.isArray(catRes2.value)) {
                    setCategories(catRes2.value);
                }
            })
            .catch(() => setError("ไม่สามารถโหลดประวัติการสอบได้"))
            .finally(() => setLoading(false));
    }, [getToken]);

    // ── Combine + Filter ──
    const allRecords = useMemo(() => {
        return [...normalRecords, ...catRecords, ...mstRecords].sort(
            (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        );
    }, [normalRecords, catRecords, mstRecords]);

    const filtered = useMemo(() => {
        let src: ExamRecord[] =
            activeTab === "ALL" ? allRecords
                : activeTab === "NORMAL" ? normalRecords
                    : activeTab === "CAT" ? catRecords
                        : mstRecords;

        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            src = src.filter((r) => (r.item_bank_name ?? "").toLowerCase().includes(q));
        }
        if (statusFilter !== "ALL") {
            src = src.filter((r) => (statusFilter === "PASSED") === isPassed(r));
        }
        if (selectedCats.length > 0) {
            src = src.filter((r) =>
                r.examType === "CAT" ||
                r.examType === "MST" ||
                r.categories?.some((c) => selectedCats.includes(c.category_id))
            );
        }
        return src;
    }, [allRecords, normalRecords, catRecords, mstRecords, activeTab, searchQuery, statusFilter, selectedCats]);

    const hasFilter = searchQuery || statusFilter !== "ALL" || selectedCats.length > 0;

    const clearFilters = () => {
        setSearchQuery("");
        setStatusFilter("ALL");
        setSelectedCats([]);
    };

    const toggleCat = (id: number) =>
        setSelectedCats((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);

    // ── Render States ──
    if (loading) return (
        <>
            <Navbar />
            <PageSkeleton variant="list" stats={5} />
            <Footer />
        </>
    );

    if (error) return (
        <>
            <Navbar />
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-sm bg-white rounded-2xl shadow p-8">
                    <XCircle className="w-14 h-14 text-rose-400 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
                    <p className="text-gray-500 mb-5">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium transition"
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
            <div className="min-h-screen bg-slate-50 py-8">
                <div className="container mx-auto px-4 max-w-5xl">

                    {/* Breadcrumb */}
                    <div className="flex items-center text-sm text-gray-400 mb-5 gap-1">
                        <Link href="/user" className="hover:text-emerald-600 transition">หน้าหลัก</Link>
                        <ChevronRight size={14} />
                        <span className="text-gray-700 font-medium">ประวัติการสอบ</span>
                    </div>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
                            <History className="text-emerald-600" size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">ประวัติการสอบ</h1>
                            <p className="text-sm text-gray-400">ประวัติการทำข้อสอบทั้งหมดของคุณ (ปกติ, CAT, และ MST)</p>
                        </div>
                    </div>

                    {/* Stats Summary Bar */}
                    <StatBar records={allRecords} />

                    {/* Tabs */}
                    <div className="flex bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 mb-5 gap-1">
                        {([
                            { key: "ALL", label: "ทั้งหมด", count: allRecords.length, icon: null },
                            { key: "NORMAL", label: "สอบปกติ", count: normalRecords.length, icon: BookOpen },
                            { key: "CAT", label: "CAT (รายข้อ)", count: catRecords.length, icon: Brain },
                            { key: "MST", label: "MST (รายด่าน)", count: mstRecords.length, icon: Layers },
                        ] as { key: TabType; label: string; count: number; icon: any }[]).map((t) => {
                            const IconComp = t.icon;
                            const isSelected = activeTab === t.key;
                            return (
                                <button
                                    key={t.key}
                                    onClick={() => { setActiveTab(t.key); clearFilters(); }}
                                    className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                                        isSelected
                                            ? t.key === "CAT"
                                                ? "bg-purple-600 text-white shadow-sm"
                                                : t.key === "MST"
                                                ? "bg-indigo-600 text-white shadow-sm"
                                                : t.key === "NORMAL"
                                                ? "bg-blue-600 text-white shadow-sm"
                                                : "bg-emerald-600 text-white shadow-sm"
                                            : "text-gray-500 hover:bg-gray-50"
                                    }`}
                                >
                                    {IconComp && <IconComp size={14} />}
                                    <span>{t.label}</span>
                                    <span className={`text-[11px] px-1.5 py-0.5 rounded-full font-bold ${
                                        isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
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
                                    className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full"
                                    >
                                        <X size={14} className="text-gray-400" />
                                    </button>
                                )}
                            </div>
                            <button
                                onClick={() => setShowFilter(!showFilter)}
                                className={`px-4 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                                    showFilter || hasFilter
                                        ? "bg-emerald-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                }`}
                            >
                                <Filter size={16} />
                                <span className="hidden sm:inline">ตัวกรอง</span>
                                {hasFilter && (
                                    <span className="bg-white/25 text-white text-xs px-1.5 py-0.5 rounded-full">
                                        {(statusFilter !== "ALL" ? 1 : 0) + selectedCats.length}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Filter panel */}
                        {showFilter && (
                            <div className="mt-4 pt-4 border-t border-gray-100 space-y-4">
                                {/* Status */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">สถานะ</p>
                                    <div className="flex gap-2">
                                        {(["ALL", "PASSED", "FAILED"] as StatusFilter[]).map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setStatusFilter(s)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                    statusFilter === s
                                                        ? s === "PASSED" ? "bg-emerald-600 text-white"
                                                            : s === "FAILED" ? "bg-rose-500 text-white"
                                                                : "bg-gray-800 text-white"
                                                        : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                                                }`}
                                            >
                                                {s === "ALL" ? "ทั้งหมด" : s === "PASSED" ? "✅ ผ่าน" : "❌ ไม่ผ่าน"}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Category */}
                                {categories.length > 0 && (activeTab === "NORMAL" || activeTab === "ALL") && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">หมวดวิชา</p>
                                        <div className="flex flex-wrap gap-2">
                                            {categories.map((c) => (
                                                <button
                                                    key={c.category_id}
                                                    onClick={() => toggleCat(c.category_id)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                                                        selectedCats.includes(c.category_id)
                                                            ? "bg-indigo-600 text-white"
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
                                            className="text-sm text-rose-500 hover:text-rose-600 font-medium flex items-center gap-1"
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
                        แสดง <span className="font-semibold text-gray-700">{filtered.length}</span> รายการ
                        {hasFilter && " (กรองแล้ว)"}
                    </p>

                    {/* History Cards */}
                    {filtered.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center">
                            {hasFilter ? (
                                <>
                                    <Search className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium mb-4">ไม่พบผลลัพธ์ที่ตรงกัน</p>
                                    <button
                                        onClick={clearFilters}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition"
                                    >
                                        ล้างตัวกรอง
                                    </button>
                                </>
                            ) : (
                                <>
                                    <BarChart3 className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium mb-4">ยังไม่มีประวัติการสอบในหมวดหมู่นี้</p>
                                    <Link
                                        href="/user/examset"
                                        className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition"
                                    >
                                        เริ่มทำข้อสอบ
                                    </Link>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filtered.map((exam) => {
                                const passed = isPassed(exam);
                                const isCAT = exam.examType === "CAT";
                                const isMST = exam.examType === "MST";

                                const title = isCAT
                                    ? "การสอบแบบ CAT (Adaptive รายข้อ)"
                                    : isMST
                                    ? exam.item_bank_name || "การสอบแบบ MST (Adaptive รายด่าน)"
                                    : exam.item_bank_name || "ชุดข้อสอบมาตรฐาน";

                                return (
                                    <div
                                        key={`${exam.examType}-${exam.session_id}`}
                                        className={`bg-white rounded-2xl shadow-sm border-l-4 transition-all hover:shadow-md ${
                                            passed ? "border-emerald-500" : "border-rose-400"
                                        }`}
                                    >
                                        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                            
                                            {/* Icon */}
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                                                isCAT
                                                    ? "bg-purple-100 text-purple-600"
                                                    : isMST
                                                    ? "bg-indigo-100 text-indigo-600"
                                                    : "bg-blue-100 text-blue-600"
                                            }`}>
                                                {isCAT ? (
                                                    <Brain size={22} />
                                                ) : isMST ? (
                                                    <Layers size={22} />
                                                ) : (
                                                    <BookOpen size={22} />
                                                )}
                                            </div>

                                            {/* Main info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                                                    <h3 className="font-bold text-gray-900 text-base truncate">
                                                        {title}
                                                    </h3>
                                                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase shrink-0 ${
                                                        isCAT
                                                            ? "bg-purple-100 text-purple-700"
                                                            : isMST
                                                            ? "bg-indigo-100 text-indigo-700"
                                                            : "bg-blue-100 text-blue-700"
                                                    }`}>
                                                        {isCAT ? "CAT Adaptive" : isMST ? "MST Adaptive" : "NORMAL"}
                                                    </span>
                                                </div>

                                                {/* Routing Path (for MST) */}
                                                {isMST && exam.routing_path && exam.routing_path.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                        {exam.routing_path.map((path, idx) => (
                                                            <span key={idx} className="text-[11px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium border border-slate-200">
                                                                {path}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Categories (for Normal) */}
                                                {!isCAT && !isMST && exam.categories && exam.categories.length > 0 && (
                                                    <div className="flex flex-wrap gap-1.5 mb-2">
                                                        {exam.categories.map((c) => (
                                                            <span key={c.category_id} className="text-[11px] px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded font-medium border border-indigo-100">
                                                                {c.category_name}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Meta */}
                                                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                                                    <span className="flex items-center gap-1">
                                                        <CalendarDays size={12} />
                                                        {formatDateThai(exam.start_time)} {formatTime(exam.start_time)}
                                                    </span>
                                                    {exam.end_time && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock size={12} />
                                                            {calcDuration(exam.start_time, exam.end_time)}
                                                        </span>
                                                    )}
                                                    {isCAT && exam.num_items != null && (
                                                        <span className="flex items-center gap-1 text-purple-600 font-medium">
                                                            <TrendingUp size={12} />
                                                            {exam.num_items} ข้อ · {exam.num_correct}/{exam.num_items} ถูก
                                                        </span>
                                                    )}
                                                    {isMST && exam.total_items != null && (
                                                        <span className="flex items-center gap-1 text-indigo-600 font-medium">
                                                            <TrendingUp size={12} />
                                                            {exam.total_items} ข้อ · {exam.total_correct}/{exam.total_items} ถูก
                                                        </span>
                                                    )}
                                                    {!isCAT && !isMST && exam.total_questions != null && (
                                                        <span className="flex items-center gap-1 text-blue-600 font-medium">
                                                            {exam.correct_count ?? 0}/{exam.total_questions} ถูก
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Score + Action */}
                                            <div className="flex items-center gap-4 sm:gap-5 shrink-0">
                                                <div className="min-w-[64px]">
                                                    <ScoreBadge exam={exam} />
                                                </div>
                                                <Link
                                                    href={
                                                        isCAT
                                                            ? `/user/cat-exam/result/${exam.session_id}`
                                                            : isMST
                                                            ? `/user/mst-exam/result/${exam.session_id}`
                                                            : `/user/examset/take-exam/summarize-exam?session_id=${exam.session_id}`
                                                    }
                                                    className={`px-4 py-2 text-white text-sm font-semibold rounded-xl transition-all shadow-xs hover:shadow-md whitespace-nowrap ${
                                                        isCAT
                                                            ? "bg-purple-600 hover:bg-purple-700"
                                                            : isMST
                                                            ? "bg-indigo-600 hover:bg-indigo-700"
                                                            : "bg-emerald-600 hover:bg-emerald-700"
                                                    }`}
                                                >
                                                    ดูผลสอบ →
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                </div>
            </div>
            <Footer />
        </>
    );
}