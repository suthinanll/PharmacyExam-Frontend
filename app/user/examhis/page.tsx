"use client";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import Link from "next/link";
import {
    Loader2, Search, X, Filter, History,
    BookOpen, Brain, Clock, CheckCircle2, XCircle,
    ChevronRight, BarChart3, TrendingUp, CalendarDays,
} from "lucide-react";

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
            <div className="text-center">
                <div className="text-xl font-medium text-purple-700">
                    θ {theta != null ? theta.toFixed(2) : "—"}
                </div>
                <div className={`text-xs font-medium mt-0.5 ${exam.passed ? "text-green-600" : "text-red-500"}`}>
                    {exam.passed ? "ผ่าน" : "ไม่ผ่าน"}
                </div>
            </div>
        );
    }
    const pct = Math.round(exam.final_score ?? 0);
    const color = pct >= 70 ? "text-green-700" : pct >= 50 ? "text-amber-600" : "text-red-600";
    return (
        <div className="text-center">
            <div className={`text-xl font-medium ${color}`}>{pct}%</div>
            <div className={`text-xs font-medium mt-0.5 ${pct >= 50 ? "text-green-600" : "text-red-500"}`}>
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

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
                { label: "ทั้งหมด", value: total, icon: <History size={18} />, color: "bg-slate-100 text-slate-700" },
                { label: "ผ่าน", value: passed, icon: <CheckCircle2 size={18} />, color: "bg-green-50 text-green-700" },
                { label: "สอบปกติ", value: normal, icon: <BookOpen size={18} />, color: "bg-blue-50 text-blue-700" },
                { label: "สอบ CAT", value: cat, icon: <Brain size={18} />, color: "bg-purple-50 text-purple-700" },
            ].map((s) => (
                <div key={s.label} className={`rounded-xl px-4 py-3 flex items-center gap-3 ${s.color}`}>
                    {s.icon}
                    <div>
                        <div className="text-2xl font-medium leading-none">{s.value}</div>
                        <div className="text-xs mt-0.5 opacity-70">{s.label}</div>
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
    }, []);

    // ── Combine + Filter ──
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
            src = src.filter((r) => (r.item_bank_name ?? "").toLowerCase().includes(q));
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
        return src;
    }, [allRecords, normalRecords, catRecords, activeTab, searchQuery, statusFilter, selectedCats]);

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
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
                    <p className="text-gray-500 font-medium">กำลังโหลดประวัติการสอบ...</p>
                </div>
            </div>
            <Footer />
        </>
    );

    if (error) return (
        <>
            <Navbar />
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center max-w-sm bg-white rounded-2xl shadow p-8">
                    <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
                    <h2 className="text-xl font-medium text-gray-800 mb-2">เกิดข้อผิดพลาด</h2>
                    <p className="text-gray-500 mb-5">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium transition"
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
                        <Link href="/user" className="hover:text-green-600 transition">หน้าหลัก</Link>
                        <ChevronRight size={14} />
                        <span className="text-gray-700 font-medium">ประวัติการสอบ</span>
                    </div>

                    {/* Header */}
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
                            <History className="text-green-600" size={22} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-medium text-gray-900">ประวัติการสอบ</h1>
                            <p className="text-sm text-gray-400">ประวัติการทำข้อสอบทั้งหมดของคุณ</p>
                        </div>
                    </div>

                    {/* Stats */}
                    <StatBar records={allRecords} />

                    {/* Tabs */}
                    <div className="flex bg-white rounded-xl shadow-sm border border-gray-100 p-1 mb-5 gap-1">
                        {([
                            { key: "ALL", label: "ทั้งหมด", count: allRecords.length },
                            { key: "NORMAL", label: "สอบปกติ", count: normalRecords.length },
                            { key: "CAT", label: "CAT Adaptive", count: catRecords.length },
                        ] as { key: TabType; label: string; count: number }[]).map((t) => (
                            <button
                                key={t.key}
                                onClick={() => { setActiveTab(t.key); clearFilters(); }}
                                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${activeTab === t.key
                                    ? "bg-green-600 text-white shadow-sm"
                                    : "text-gray-500 hover:bg-gray-50"
                                    }`}
                            >
                                {t.key === "NORMAL" && <BookOpen size={14} />}
                                {t.key === "CAT" && <Brain size={14} />}
                                {t.label}
                                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${activeTab === t.key ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"}`}>
                                    {t.count}
                                </span>
                            </button>
                        ))}
                    </div>

                    {/* Search + Filter bar */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-5">
                        <div className="flex gap-3">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="ค้นหาชื่อชุดข้อสอบ..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent"
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
                                className={`px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${showFilter || hasFilter
                                    ? "bg-green-600 text-white"
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
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">สถานะ</p>
                                    <div className="flex gap-2">
                                        {(["ALL", "PASSED", "FAILED"] as StatusFilter[]).map((s) => (
                                            <button
                                                key={s}
                                                onClick={() => setStatusFilter(s)}
                                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${statusFilter === s
                                                    ? s === "PASSED" ? "bg-green-600 text-white"
                                                        : s === "FAILED" ? "bg-red-500 text-white"
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
                                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">ประเภท</p>
                                        <div className="flex flex-wrap gap-2">
                                            {categories.map((c) => (
                                                <button
                                                    key={c.category_id}
                                                    onClick={() => toggleCat(c.category_id)}
                                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${selectedCats.includes(c.category_id)
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
                                            className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                                        >
                                            <X size={14} /> ล้างทั้งหมด
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
                                    <Search className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium mb-4">ไม่พบผลลัพธ์ที่ตรงกัน</p>
                                    <button
                                        onClick={clearFilters}
                                        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition"
                                    >
                                        ล้างตัวกรอง
                                    </button>
                                </>
                            ) : (
                                <>
                                    <BarChart3 className="w-14 h-14 text-gray-300 mx-auto mb-4" />
                                    <p className="text-gray-600 font-medium mb-4">ยังไม่มีประวัติการสอบ</p>
                                    <Link
                                        href="/user/examset"
                                        className="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2.5 rounded-xl font-medium text-sm transition"
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
                                const title = isCAT
                                    ? "การสอบแบบ CAT (Adaptive)"
                                    : exam.item_bank_name || "ไม่ระบุชื่อ";

                                return (
                                    <div
                                        key={`${exam.examType}-${exam.session_id}`}
                                        className={`bg-white rounded-xl shadow-sm border-l-4 transition-all hover:shadow-md ${passed ? "border-green-400" : "border-red-400"
                                            }`}
                                    >
                                        <div className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                                            {/* Icon */}
                                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${isCAT ? "bg-purple-100" : "bg-blue-100"}`}>
                                                {isCAT
                                                    ? <Brain className="text-purple-600" size={20} />
                                                    : <BookOpen className="text-blue-600" size={20} />
                                                }
                                            </div>

                                            {/* Main info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-medium text-gray-900 text-base truncate">{title}</h3>
                                                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full uppercase flex-shrink-0 ${isCAT ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                                                        {isCAT ? "CAT" : "NORMAL"}
                                                    </span>
                                                </div>

                                                {/* Categories */}
                                                {exam.categories && exam.categories.length > 0 && (
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
                                                        <span className="flex items-center gap-1 text-purple-500 font-medium">
                                                            <TrendingUp size={12} />
                                                            {exam.num_items} ข้อ · {exam.num_correct}/{exam.num_items} ถูก
                                                        </span>
                                                    )}
                                                    {!isCAT && exam.total_questions != null && (
                                                        <span className="flex items-center gap-1 text-blue-500 font-medium">
                                                            {exam.correct_count ?? 0}/{exam.total_questions} ถูก
                                                        </span>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Score + Action */}
                                            <div className="flex items-center gap-4 sm:gap-5 flex-shrink-0">
                                                <div className="min-w-[64px]">
                                                    <ScoreBadge exam={exam} />
                                                </div>
                                                <Link
                                                    href={isCAT
                                                        ? `/user/cat-exam/result/${exam.session_id}`
                                                        : `/user/examset/take-exam/summarize-exam?session_id=${exam.session_id}`}
                                                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-all shadow-sm hover:shadow-md whitespace-nowrap"
                                                >
                                                    ดูผล →
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