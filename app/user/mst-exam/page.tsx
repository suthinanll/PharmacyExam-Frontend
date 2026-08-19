"use client";

import React, { useState, useEffect } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import {
    Layers,
    Sparkles,
    BookOpen,
    BrainCircuit,
    History,
    ChevronRight,
    Loader2,
    CheckCircle2,
    XCircle,
    ArrowRight,
    GraduationCap,
    HelpCircle,
    BarChart2,
} from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";

interface ItemBank {
    item_bank_id: number;
    bank_name: string;
    description?: string;
    total_items?: number;
}

interface MSTHistoryItem {
    session_id: number;
    item_bank_name?: string;
    status: string;
    start_time: string;
    end_time?: string;
    final_theta?: number;
    total_items?: number;
    total_correct?: number;
    passed?: boolean;
    routing_path?: string[];
}

export default function MSTSetupPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    // Configuration
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
    const [totalStages, setTotalStages] = useState<number>(2);
    const [itemsPerStage, setItemsPerStage] = useState<number>(12);

    // Data
    const [itemBanks, setItemBanks] = useState<ItemBank[]>([]);
    const [history, setHistory] = useState<MSTHistoryItem[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const token = getToken();
            try {
                // Fetch Item Banks
                const banksRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items-bank`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (banksRes.ok) {
                    const banksData = await banksRes.json();
                    setItemBanks(banksData);
                }

                // Fetch MST History
                const historyRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mst/history`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (historyRes.ok) {
                    const historyData = await historyRes.json();
                    setHistory(historyData);
                }
            } catch (error) {
                console.error("Error fetching MST data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [getToken]);

    const handleStartExam = async () => {
        if (starting) return;
        setStarting(true);
        try {
            const token = getToken();
            const body = {
                item_bank_id: selectedBankId || undefined,
                total_stages: totalStages,
                items_per_stage: itemsPerStage,
                cut_score: 0.0,
            };

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/mst/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.message || "ไม่สามารถเริ่มการสอบได้");
            }

            const data = await res.json();
            router.push(`/user/mst-exam/exam?session_id=${data.session_id}`);
        } catch (error: any) {
            Swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: error.message || "ไม่สามารถเริ่มการสอบได้ กรุณาลองใหม่อีกครั้ง",
                icon: "error",
                confirmButtonColor: "#ef4444",
            });
            setStarting(false);
        }
    };

    return (
        <>
            <Navbar_user />

            <div className="min-h-screen bg-slate-50 py-8">
                <div className="max-w-6xl mx-auto px-4 space-y-8">

                    {/* Breadcrumb */}
                    <div className="flex items-center text-sm text-gray-500">
                        <Link href="/user" className="hover:text-green-600 transition">หน้าหลัก</Link>
                        <span className="mx-2">›</span>
                        <Link href="/user/examset" className="hover:text-green-600 transition">คลังข้อสอบ</Link>
                        <span className="mx-2">›</span>
                        <span className="text-gray-800 font-medium">ข้อสอบแบบปรับเหมาะรายด่าน (MST)</span>
                    </div>

                    {/* Hero Banner */}
                    <div className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-indigo-800 to-slate-900 rounded-3xl p-8 sm:p-10 text-white shadow-xl">
                        <div className="relative z-10 max-w-3xl space-y-4">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-indigo-200">
                                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                                Multistage Adaptive Testing (MST)
                            </div>
                            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
                                ข้อสอบแบบปรับเหมาะรายด่าน
                            </h1>
                            <p className="text-indigo-100 text-sm sm:text-base leading-relaxed">
                                จำลองการสอบวิชาชีพมาตรฐานสากลด้วยระบบปรับความยากเป็นด่าน (Stages) รองรับข้อสอบสถานการณ์และเคสผู้ป่วยแบบครบชุด สามารถข้ามข้อ ปักธง และย้อนกลับมาทบทวนคำตอบได้อิสระในแต่ละด่าน
                            </p>
                        </div>
                        {/* Decorative background shape */}
                        <div className="absolute right-0 bottom-0 translate-x-12 translate-y-12 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
                    </div>

                    {/* MST Mechanism Explanation Card */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                                <Layers className="w-5 h-5" />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-900">กระบวนการสอบแบบ MST ทำงานอย่างไร?</h2>
                                <p className="text-xs sm:text-sm text-gray-500">รูปแบบการทดสอบที่ใช้ในข้อสอบวิชาชีพทางการแพทย์และเภสัชกรรมยุคใหม่</p>
                            </div>
                        </div>

                        {/* Interactive Stages Flow Visualizer */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            {/* Step 1 */}
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 relative overflow-hidden">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Stage 1</div>
                                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    Routing Module
                                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-semibold">ปานกลาง</span>
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    ทำข้อสอบชุดแรก (ข้อเดี่ยว + สถานการณ์) เพื่อประเมินระดับความสามารถเบื้องต้น สามารถย้อนกลับมาแก้คำตอบได้
                                </p>
                            </div>

                            {/* Step 2 */}
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 relative overflow-hidden">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Stage 2</div>
                                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    Targeted Module
                                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-700 font-semibold">ปรับตามความสามารถ</span>
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    ระบบส่งต่อไปยังด่านที่ตรงกับระดับของคุณ (ง่าย / ปานกลาง / ยาก) เพื่อวัดผลอย่างแม่นยำที่สุด
                                </p>
                            </div>

                            {/* Step 3 */}
                            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 relative overflow-hidden">
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">Final Step</div>
                                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                                    Scoring & Feedback
                                    <span className="text-[11px] px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-semibold">IRT Analysis</span>
                                </h3>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    ประมวลผลคะแนนความสามารถ (θ) ตามทฤษฎี IRT พร้อมผังเส้นทางด่านและจุดแข็ง-จุดอ่อนรายหัวข้อ
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                        {/* ── Configuration Card (Left) ── */}
                        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <BrainCircuit className="w-5 h-5 text-indigo-600" />
                                ตั้งค่าการสอบ MST
                            </h2>

                            {/* Select Item Bank */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-800">
                                    คลังข้อสอบ
                                </label>
                                <select
                                    value={selectedBankId ?? ""}
                                    onChange={(e) => setSelectedBankId(e.target.value ? Number(e.target.value) : null)}
                                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition"
                                >
                                    <option value="">คลังข้อสอบรวม (Global Item Pool) — แนะนำ</option>
                                    {itemBanks.map((bank) => (
                                        <option key={bank.item_bank_id} value={bank.item_bank_id}>
                                            {bank.bank_name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-400">
                                    * หากเลือกคลังรวม ระบบจะดึงข้อสอบคุณภาพสูงที่มีพารามิเตอร์ IRT ครบจากทุกคลัง
                                </p>
                            </div>

                            {/* Total Stages */}
                            <div className="space-y-2">
                                <label className="block text-sm font-semibold text-gray-800">
                                    จำนวนด่าน (Stages)
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setTotalStages(2)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${totalStages === 2
                                                ? "border-indigo-600 bg-indigo-50/60 shadow-sm"
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                            }`}
                                    >
                                        <div className="font-bold text-gray-900 text-sm">2 ด่าน (มาตรฐาน)</div>
                                        <div className="text-xs text-gray-500 mt-1">Stage 1: Routing &rarr; Stage 2: Targeted</div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setTotalStages(3)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${totalStages === 3
                                                ? "border-indigo-600 bg-indigo-50/60 shadow-sm"
                                                : "border-slate-200 hover:border-slate-300 bg-white"
                                            }`}
                                    >
                                        <div className="font-bold text-gray-900 text-sm">3 ด่าน (ละเอียด)</div>
                                        <div className="text-xs text-gray-500 mt-1">Stage 1 &rarr; Stage 2 &rarr; Stage 3 (Fine-tuning)</div>
                                    </button>
                                </div>
                            </div>

                            {/* Items per stage */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-sm font-semibold text-gray-800">
                                        จำนวนข้อต่อด่าน
                                    </label>
                                    <span className="text-sm font-bold text-indigo-600">{itemsPerStage} ข้อ / ด่าน</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2.5">
                                    {[10, 12, 15].map((count) => (
                                        <button
                                            key={count}
                                            type="button"
                                            onClick={() => setItemsPerStage(count)}
                                            className={`py-2.5 px-3 rounded-xl border text-sm font-semibold transition ${itemsPerStage === count
                                                    ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                                    : "bg-slate-50 text-gray-700 border-slate-200 hover:bg-slate-100"
                                                }`}
                                        >
                                            {count} ข้อ
                                        </button>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 pt-1">
                                    รวมทั้งหมดประมาณ {totalStages * itemsPerStage} ข้อ (ใช้เวลาประมาณ {totalStages * itemsPerStage * 1.5} นาที)
                                </p>
                            </div>

                            {/* Start Exam Button */}
                            <div className="pt-4">
                                <button
                                    onClick={handleStartExam}
                                    disabled={starting || loading}
                                    className="w-full py-4 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {starting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            กำลังจัดชุดข้อสอบ Stage 1...
                                        </>
                                    ) : (
                                        <>
                                            เริ่มทำข้อสอบ MST
                                            <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* ── Past History (Right) ── */}
                        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <History className="w-5 h-5 text-indigo-600" />
                                ประวัติการสอบ MST
                            </h2>

                            {loading ? (
                                <div className="space-y-3 pt-2">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="h-16 rounded-xl bg-slate-100 animate-pulse" />
                                    ))}
                                </div>
                            ) : history.length === 0 ? (
                                <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl space-y-2">
                                    <GraduationCap className="w-10 h-10 text-slate-300 mx-auto" />
                                    <p className="text-sm font-medium text-gray-700">ยังไม่มีประวัติการสอบ MST</p>
                                    <p className="text-xs text-gray-400">เมื่อทำข้อสอบจบ ระบบจะบันทึกผลการสอบและเส้นทางด่านไว้ที่นี่</p>
                                </div>
                            ) : (
                                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                                    {history.map((item) => (
                                        <div
                                            key={item.session_id}
                                            onClick={() => {
                                                if (item.status === "COMPLETED") {
                                                    router.push(`/user/mst-exam/result/${item.session_id}`);
                                                } else {
                                                    router.push(`/user/mst-exam/exam?session_id=${item.session_id}`);
                                                }
                                            }}
                                            className="p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-sm bg-slate-50 hover:bg-white transition-all cursor-pointer space-y-2"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-semibold text-gray-800 line-clamp-1">
                                                    {item.item_bank_name || "คลังข้อสอบรวม"}
                                                </span>
                                                <span
                                                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${item.status === "COMPLETED"
                                                            ? item.passed
                                                                ? "bg-emerald-100 text-emerald-700"
                                                                : "bg-rose-100 text-rose-700"
                                                            : "bg-amber-100 text-amber-700"
                                                        }`}
                                                >
                                                    {item.status === "COMPLETED"
                                                        ? item.passed
                                                            ? "ผ่านเกณฑ์"
                                                            : "ไม่ผ่านเกณฑ์"
                                                        : "กำลังสอบ"}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between text-xs text-gray-500">
                                                <span>ตอบ {item.total_items ?? 0} ข้อ (ถูก {item.total_correct ?? 0})</span>
                                                <span>{new Date(item.start_time).toLocaleDateString("th-TH")}</span>
                                            </div>

                                            {item.final_theta !== undefined && item.final_theta !== null && (
                                                <div className="text-xs  font-semibold text-indigo-700 pt-1 border-t border-slate-200/60 flex justify-between items-center">
                                                    <span>ความสามารถ (θ): {item.final_theta.toFixed(2)}</span>
                                                    <span className="text-indigo-600 flex items-center gap-0.5">
                                                        ดูผลสอบ <ChevronRight className="w-3.5 h-3.5" />
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
}
