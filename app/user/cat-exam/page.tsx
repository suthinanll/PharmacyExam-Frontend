"use client";

import React, { useState, useEffect } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import {
    Target,
    BarChart3,
    PieChart,
    BookOpen,
    Zap,
    BrainCircuit,
    History,
    Info,
    ChevronDown,
    ChevronUp,
    Loader2,
    CheckCircle2,
} from "lucide-react";
import Swal from "sweetalert2";
import Link from "next/link";

// ==================== TYPES ====================
interface Topic {
    topic_id: number;
    topic_name: string;
    description: string;
}

interface AbilityInfo {
    theta: number;
    has_history: boolean;
}

// ==================== HELPERS ====================
function InfoTooltip({ text }: { text: string }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative inline-block mt-1">
            <span
                onMouseEnter={() => setShow(true)}
                onMouseLeave={() => setShow(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors cursor-help inline-flex items-center"
            >
                <Info className="w-4 h-4" />
            </span>
            {show && (
                <div className="absolute z-20 left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 bg-gray-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl leading-relaxed">
                    {text}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800" />
                </div>
            )}
        </div>
    );
}

// ==================== MAIN COMPONENT ====================
export default function CATSetupPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);

    // Config State
    const [minItems, setMinItems] = useState(20);
    const [maxItems, setMaxItems] = useState(60);
    const [difficulty, setDifficulty] = useState(0.0);
    const [useAbility, setUseAbility] = useState(false);
    const [abilityInfo, setAbilityInfo] = useState<AbilityInfo | null>(null);
    const [cutScore, setCutScore] = useState(0.0);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Data State
    const [topics, setTopics] = useState<Topic[]>([]);
    const [focusedTopics, setFocusedTopics] = useState<number[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const token = getToken();
            try {
                const topicRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const topicsData = await topicRes.json();
                setTopics(topicsData);

                const abilityRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cat/latest-ability`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const ability = await abilityRes.json();
                setAbilityInfo(ability);
                if (ability?.has_history) setUseAbility(true);
            } catch (error) {
                console.error("Error fetching setup data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleTopicToggle = (topicId: number) => {
        setFocusedTopics(prev =>
            prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
        );
    };

    const startExam = async () => {
        if (starting) return;
        setStarting(true);
        try {
            const token = getToken();
            const body = {
                min_items: minItems,
                max_items: maxItems,
                initial_theta: useAbility && abilityInfo ? abilityInfo.theta : difficulty,
                cut_score: cutScore,
                topic_proportions: (() => {
                    if (focusedTopics.length === 0 || focusedTopics.length === topics.length) return undefined;
                    const proportions: Record<number, number> = {};
                    const focusTotalWeight = 60;
                    const unselectedWeight = 40;
                    const unselectedCount = topics.length - focusedTopics.length;
                    const weightPerFocus = parseFloat((focusTotalWeight / focusedTopics.length).toFixed(2));
                    const weightPerOther = parseFloat((unselectedWeight / unselectedCount).toFixed(2));
                    topics.forEach(t => {
                        proportions[t.topic_id] = focusedTopics.includes(t.topic_id) ? weightPerFocus : weightPerOther;
                    });
                    return proportions;
                })(),
            };

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cat/start`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || "Failed to start exam");
            }

            const data = await response.json();
            router.push(`/user/cat-exam/exam?session_id=${data.session_id}`);
        } catch (error: any) {
            setStarting(false);
            Swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: error.message,
                icon: "error",
                confirmButtonColor: "#ef4444"
            });
        }
    };

    const getAbilityLabel = (theta: number) => {
        if (theta >= 1.5) return { label: 'สูง (Advanced)', color: 'text-green-700 bg-green-100' };
        if (theta >= -1.5) return { label: 'ปานกลาง (Intermediate)', color: 'text-amber-700 bg-amber-100' };
        return { label: 'เริ่มต้น (Beginner)', color: 'text-red-700 bg-red-100' };
    };

    const getDifficultyLabel = (val: number) => {
        if (val >= 1.5) return 'ยาก';
        if (val >= 0.5) return 'ค่อนข้างยาก';
        if (val >= -0.5) return 'ปานกลาง (แนะนำ)';
        if (val >= -1.5) return 'ค่อนข้างง่าย';
        return 'ง่าย';
    };

    if (loading) {
        return (
            <>
                <Navbar_user />
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 animate-spin text-green-600 mx-auto mb-4" />
                        <p className="text-gray-600 font-medium">กำลังเตรียมการทดสอบ CAT...</p>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const abilityMeta = abilityInfo ? getAbilityLabel(abilityInfo.theta) : null;

    return (
        <div className="min-h-screen bg-gray-50 text-slate-900">
            <Navbar_user />

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Breadcrumb */}
                <div className="flex items-center text-sm text-gray-500 mb-6">
                    <Link href="/user" className="hover:text-green-600 cursor-pointer transition">หน้าหลัก</Link>
                    <span className="mx-2">›</span>
                    <span className="text-gray-700 font-medium">สอบแบบปรับตัว (CAT)</span>
                </div>

                {/* Page Header */}
                <div className="mb-8">
                    <div className="flex items-start justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-medium text-gray-900 mb-2">การสอบแบบปรับตัวด้วยคอมพิวเตอร์ (CAT)</h1>
                            <p className="text-gray-500 text-base leading-relaxed max-w-xl">
                                ระบบจะเลือกข้อสอบที่เหมาะกับระดับของคุณแบบเรียลไทม์ ปรับแต่งพารามิเตอร์ตามต้องการแล้วกด <strong className="text-gray-700">เริ่มการทดสอบ</strong>
                            </p>
                        </div>
                        <Link
                            href="/user/cat-exam/info"
                            className="shrink-0 flex items-center gap-2 text-sm text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 px-4 py-2 rounded-lg transition-colors font-medium"
                        >
                            <BookOpen className="w-4 h-4" />
                            CAT คืออะไร?
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ─── Left Column: Settings ─── */}
                    <div className="lg:col-span-2 space-y-5">

                        {/* 1. Starting Ability */}
                        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                                <BrainCircuit className="w-5 h-5 text-amber-500" />
                                <h2 className="text-base font-medium text-gray-800">ระดับความสามารถเริ่มต้น</h2>
                                <InfoTooltip text="ระบบ CAT จะเริ่มส่งข้อสอบที่ระดับความยากนี้ก่อน แล้วปรับขึ้นหรือลงตามคำตอบของคุณโดยอัตโนมัติ" />
                            </div>
                            <p className="text-sm text-gray-400 mb-5 ml-7">กำหนดจุดเริ่มต้นของการประเมิน — ระบบจะปรับระดับเองตลอดการสอบ</p>

                            <div className="space-y-3 ml-7">
                                {/* Option A: Use history */}
                                {abilityInfo?.has_history && abilityMeta && (
                                    <label
                                        className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${useAbility
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                                    >
                                        <input
                                            type="radio"
                                            name="abilityMode"
                                            checked={useAbility}
                                            onChange={() => setUseAbility(true)}
                                            className="w-4 h-4 accent-green-600"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-0.5">
                                                <History className="w-4 h-4 text-green-600" />
                                                <span className="text-sm font-medium text-gray-800">ใช้ระดับจากประวัติการสอบ</span>
                                                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full uppercase tracking-wide bg-green-100 text-green-700">แนะนำ</span>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                ระดับปัจจุบันของคุณ:{' '}
                                                <strong className="text-gray-700">{abilityInfo.theta.toFixed(2)}</strong>
                                            </p>
                                        </div>
                                        {useAbility && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                                    </label>
                                )}

                                {/* Option B: Manual */}
                                <label
                                    className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${!useAbility
                                        ? 'border-green-500 bg-green-50'
                                        : 'border-gray-200 hover:border-gray-300 bg-white'}`}
                                >
                                    <input
                                        type="radio"
                                        name="abilityMode"
                                        checked={!useAbility}
                                        onChange={() => setUseAbility(false)}
                                        className="w-4 h-4 accent-green-600"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <BarChart3 className="w-4 h-4 text-amber-500" />
                                            <span className="text-sm font-medium text-gray-800">กำหนดระดับเอง</span>
                                        </div>
                                        <p className="text-sm text-gray-500">ลาก slider เพื่อกำหนดจุดเริ่มต้น</p>

                                        {!useAbility && (
                                            <div className="mt-4 space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-sm font-medium text-gray-600">{getDifficultyLabel(difficulty)}</span>
                                                    <span className="text-sm font-medium text-amber-600 bg-amber-50 px-3 py-0.5 rounded-lg border border-amber-100">
                                                        {difficulty.toFixed(1)}
                                                    </span>
                                                </div>
                                                <input
                                                    type="range"
                                                    min="-3"
                                                    max="3"
                                                    step="0.1"
                                                    value={difficulty}
                                                    onChange={(e) => setDifficulty(parseFloat(e.target.value))}
                                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                                />
                                                <div className="flex justify-between text-sm text-gray-600 font-medium">
                                                    <span>ง่ายมาก (-3)</span>
                                                    <span>ปานกลาง (0)</span>
                                                    <span>ยากมาก (+3)</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    {!useAbility && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                                </label>
                            </div>
                        </section>

                        {/* 2. Topic Focus */}
                        <section className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                            <div className="flex items-center gap-2 mb-1">
                                <PieChart className="w-5 h-5 text-indigo-500" />
                                <h2 className="text-base font-medium text-gray-800">เน้นหมวดหมู่ (ไม่บังคับ)</h2>
                                <InfoTooltip text="เลือกวิชาที่ต้องการฝึกเพิ่มเป็นพิเศษ ระบบจะดึงข้อสอบหมวดนั้นมาให้บ่อยขึ้น โดยไม่ต้องกำหนดเปอร์เซ็นต์เอง หากไม่เลือก ระบบจะสุ่มจากคลังทั้งหมด" />
                            </div>
                            <p className="text-sm text-gray-400 mb-5 ml-7">
                                คลิกวิชาที่ต้องการฝึก — ระบบจะเพิ่มสัดส่วนให้อัตโนมัติ{' '}
                                {focusedTopics.length > 0 && (
                                    <span className="text-indigo-600 font-medium">({focusedTopics.length} วิชาที่เลือก)</span>
                                )}
                            </p>

                            {topics.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-4">ไม่พบหมวดหมู่</p>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 ml-7">
                                    {topics.map(topic => {
                                        const isSelected = focusedTopics.includes(topic.topic_id);
                                        return (
                                            <button
                                                key={topic.topic_id}
                                                type="button"
                                                onClick={() => handleTopicToggle(topic.topic_id)}
                                                className={`flex items-center justify-between gap-2 p-3 rounded-lg border-2 text-left transition-all text-sm font-medium group ${isSelected
                                                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                                                    : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300 hover:bg-indigo-50/50'
                                                    }`}
                                            >
                                                <span className="truncate">{topic.topic_name}</span>
                                                <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${isSelected ? 'border-indigo-500 bg-indigo-500' : 'border-gray-300'}`}>
                                                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {focusedTopics.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setFocusedTopics([])}
                                    className="mt-4 ml-7 text-xs text-gray-400 hover:text-red-500 transition-colors underline"
                                >
                                    ล้างการเลือกทั้งหมด
                                </button>
                            )}
                        </section>

                        {/* 3. Advanced Settings (collapsible) */}
                        <section className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <button
                                type="button"
                                onClick={() => setShowAdvanced(!showAdvanced)}
                                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Target className="w-5 h-5 text-gray-400" />
                                    <span className="text-base font-medium text-gray-800">การตั้งค่าขั้นสูง</span>
                                    <InfoTooltip text="ปรับจำนวนข้อสอบขั้นต่ำและสูงสุด สำหรับผู้ใช้ที่ต้องการควบคุมความยาวของการสอบ" />
                                </div>
                                {showAdvanced ? (
                                    <ChevronUp className="w-4 h-4 text-gray-400" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
                                )}
                            </button>

                            {showAdvanced && (
                                <div className="px-6 pb-6 border-t border-gray-100 pt-5 space-y-5">
                                    {/* Min Items — preset cards */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <label className="text-sm font-medium text-gray-700">จำนวนข้อขั้นต่ำ</label>
                                            <InfoTooltip text="ระบบจะสอบอย่างน้อยกี่ข้อก่อนจะพิจารณาหยุด (ค่าแนะนำ: 20)" />
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[10, 15, 20, 25].map(val => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setMinItems(val)}
                                                    className={`py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                                        minItems === val
                                                            ? 'border-green-500 bg-green-50 text-green-700'
                                                            : 'border-gray-200 text-gray-600 hover:border-green-300'
                                                    }`}
                                                >
                                                    {val} ข้อ
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Max Items — preset cards */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <label className="text-sm font-medium text-gray-700">จำนวนข้อสูงสุด</label>
                                            <InfoTooltip text="ระบบจะหยุดสอบอัตโนมัติเมื่อถึงจำนวนนี้ ไม่ว่าความแม่นยำจะถึงเกณฑ์หรือยัง (ค่าแนะนำ: 60)" />
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                            {[40, 50, 60, 80].map(val => (
                                                <button
                                                    key={val}
                                                    type="button"
                                                    onClick={() => setMaxItems(val)}
                                                    className={`py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                                                        maxItems === val
                                                            ? 'border-green-500 bg-green-50 text-green-700'
                                                            : 'border-gray-200 text-gray-600 hover:border-green-300'
                                                    }`}
                                                >
                                                    {val} ข้อ
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* ─── Right Column: Summary + Start ─── */}
                    <div className="lg:col-span-1">
                        <div className="sticky top-20 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-200 px-5 py-4">
                                <h3 className="text-sm font-medium text-gray-700">สรุปการตั้งค่า</h3>
                            </div>

                            <div className="p-5 space-y-3 text-sm">
                                {/* Ability row */}
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">ระดับเริ่มต้น</span>
                                    <span className="font-medium text-gray-800">
                                        {useAbility && abilityInfo
                                            ? `${abilityInfo.theta.toFixed(2)} (ประวัติ)`
                                            : `${difficulty.toFixed(1)} (กำหนดเอง)`}
                                    </span>
                                </div>
                                {/* Min */}
                                <div className="flex items-center justify-between py-2 border-b border-gray-100">
                                    <span className="text-gray-500">จำนวนข้อ (ต่ำ-สูง)</span>
                                    <span className="font-medium text-gray-800">{minItems} – {maxItems} ข้อ</span>
                                </div>

                                {/* Topics */}
                                <div className="flex items-center justify-between py-2">
                                    <span className="text-gray-500">หมวดที่เน้น</span>
                                    <span className="font-medium text-gray-800">
                                        {focusedTopics.length === 0 ? 'ทั้งหมด' : `${focusedTopics.length} วิชา`}
                                    </span>
                                </div>
                            </div>

                            <div className="px-5 pb-5 space-y-3">
                                {/* Info box */}
                                <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-sm text-blue-700 flex gap-2 items-start">
                                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                    <span>ระบบจะหยุดสอบโดยอัตโนมัติเมื่อประเมินความสามารถของคุณได้แม่นยำเพียงพอแล้ว</span>
                                </div>

                                {/* Start button */}
                                <button
                                    onClick={startExam}
                                    disabled={starting}
                                    className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-medium rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2"
                                >
                                    {starting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            กำลังเริ่ม...
                                        </>
                                    ) : (
                                        <>
                                            เริ่มการทดสอบ
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
