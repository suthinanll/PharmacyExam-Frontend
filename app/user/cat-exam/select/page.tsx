"use client";

import React, { useState, useEffect } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import {
    Target,
    Settings,
    BarChart,
    PieChart,
    BookOpen,
    Zap,
    ChevronRight,
    LayoutGrid,
    Dna,
    AlertCircle,
    BrainCircuit,
    History
} from "lucide-react";
import Swal from "sweetalert2";

// ==================== TYPES ====================
interface Topic {
    topic_id: number;
    topic_name: string;
    description: string;
}

interface ItemBank {
    item_bank_id: number;
    bank_name: string;
    description: string;
}

interface AbilityInfo {
    theta: number;
    has_history: boolean;
}

// ==================== MAIN COMPONENT ====================
export default function CATSetupPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);

    // Config State
    const [minItems, setMinItems] = useState(5); // ลดเพื่อ testing (production ควรใช้ 20+)
    const [maxItems, setMaxItems] = useState(60);
    const [difficulty, setDifficulty] = useState(0.0);
    const [useAbility, setUseAbility] = useState(false);
    const [abilityInfo, setAbilityInfo] = useState<AbilityInfo | null>(null);
    const [cutScore, setCutScore] = useState(0.0);

    // Data State
    const [topics, setTopics] = useState<Topic[]>([]);
    const [topicWeights, setTopicWeights] = useState<Record<number, number>>({});

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const token = getToken();
            try {
                // Fetch Topics
                const topicRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const topicsData = await topicRes.json();
                setTopics(topicsData);

                // Initialize weights evenly
                const initialWeights: Record<number, number> = {};
                topicsData.forEach((t: Topic) => {
                    initialWeights[t.topic_id] = 0; // Start with 0 or even
                });
                setTopicWeights(initialWeights);

                // Fetch Latest Ability
                const abilityRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/cat/latest-ability`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                const ability = await abilityRes.json();
                setAbilityInfo(ability);

            } catch (error) {
                console.error("Error fetching setup data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleWeightChange = (topicId: number, value: number) => {
        setTopicWeights(prev => ({
            ...prev,
            [topicId]: value
        }));
    };

    const validateWeights = () => {
        const total = Object.values(topicWeights).reduce((sum, w) => sum + w, 0);
        return total === 100 || total === 0; // 0 means no preference
    };

    const startExam = async () => {
        if (!validateWeights()) {
            const total = Object.values(topicWeights).reduce((sum, w) => sum + w, 0);
            Swal.fire({
                title: "สัดส่วนไม่ถูกต้อง",
                text: `ผลรวมสัดส่วนต้องเท่ากับ 100% (ปัจจุบัน: ${total}%) หรือปล่อยเป็น 0 ทั้งหมดถ้าไม่ต้องการกำหนดสัดส่วนเฉพาะ`,
                icon: "warning",
                confirmButtonColor: "#10b981"
            });
            return;
        }

        try {
            const token = getToken();
            const body = {
                min_items: minItems,
                max_items: maxItems,
                initial_theta: useAbility && abilityInfo ? abilityInfo.theta : difficulty,
                cut_score: cutScore,
                topic_proportions: Object.values(topicWeights).some(w => w > 0) ? topicWeights : undefined,
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
            Swal.fire({
                title: "เกิดข้อผิดพลาด",
                text: error.message,
                icon: "error",
                confirmButtonColor: "#ef4444"
            });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-lg text-slate-600 animate-pulse">กำลังเตรียมการทดสอบ CAT...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Navbar_user />

            <div className="max-w-6xl mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className="relative overflow-hidden bg-gradient-to-br from-green-600 via-green-700 to-emerald-800 rounded-[2.5rem] p-10 mb-12 shadow-2xl shadow-green-200">
                    <div className="absolute top-0 right-0 -m-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -m-20 w-60 h-60 bg-emerald-400/20 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="bg-white/20 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-green-50 flex items-center gap-2">
                                <Zap className="w-3 h-3 fill-current" /> AI Adaptive Testing
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight">
                            ปรับแต่งการทดสอบ <span className="text-emerald-300">CAT</span>
                        </h1>
                        <p className="text-green-50/80 text-lg max-w-2xl leading-relaxed">
                            ระบบจะเลือกข้อสอบที่เหมาะสมที่สุดตามความต้องการและระดับความสามารถของคุณ
                            เพื่อให้การประเมินได้ผลลัพธ์ที่แม่นยำที่สุด
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Core Setup */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* 1. Scope Info */}
                        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-green-50 rounded-xl text-green-600">
                                    <LayoutGrid className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">ขอบเขตของข้อสอบ</h2>
                            </div>

                            <div className="p-6 rounded-2xl border-2 border-green-600 bg-green-50/50 ring-4 ring-green-600/5">
                                <div className="flex items-start gap-4">
                                    <div className="p-2.5 bg-green-600 text-white rounded-lg">
                                        <Dna className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 mb-1 text-lg">สุ่มจากคลังข้อสอบทั้งหมด</h3>
                                        <p className="text-slate-600">
                                            ระบบจะทำการสุ่มเลือกข้อสอบที่เหมาะสมที่สุดจากคลังข้อสอบทั้งหมดที่มีในระบบ
                                            เพื่อให้ครอบคลุมความรู้ในทุกมิติและประเมินผลได้อย่างแม่นยำที่สุด
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Difficulty Setup */}
                        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                                    <BrainCircuit className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">ระดับความสามารถเริ่มต้น</h2>
                            </div>

                            <div className="space-y-8">
                                {abilityInfo?.has_history && (
                                    <div
                                        onClick={() => setUseAbility(!useAbility)}
                                        className={`p-6 rounded-2xl cursor-pointer border-2 transition-all ${useAbility ? 'border-amber-500 bg-amber-50' : 'border-slate-100 bg-slate-50 hover:bg-slate-100'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-full ${useAbility ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                                <History className="w-6 h-6" />
                                            </div>
                                            <div className="flex-1">
                                                <h4 className="font-bold text-slate-800">อิงตามประวัติการสอบ</h4>
                                                <p className="text-sm text-slate-500">ความสามารถปัจจุบันของคุณ (Theta): {abilityInfo.theta.toFixed(2)}</p>
                                            </div>
                                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${useAbility ? 'border-amber-500 bg-amber-500' : 'border-slate-300'}`}>
                                                {useAbility && <div className="w-2 h-2 bg-white rounded-full"></div>}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className={`space-y-6 transition-opacity duration-300 ${useAbility ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <label className="text-sm font-bold text-slate-700 block mb-1">กำหนดเอง</label>
                                            <p className="text-xs text-slate-400">เลือกความยากที่คุณต้องการเริ่มทำข้อแรก</p>
                                        </div>
                                        <span className="text-2xl font-black text-amber-600 bg-amber-50 px-4 py-1 rounded-xl">
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
                                        className="w-full h-2.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                                    />
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                                        <span>ง่ายมาก</span>
                                        <span>ระดับแนะนำ (0.0)</span>
                                        <span>ยากมาก</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 3. Topic Proportions */}
                        <section className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                                    <PieChart className="w-6 h-6" />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800">สัดส่วนของหัวข้อ (%)</h2>
                            </div>

                            <div className="p-4 bg-indigo-50 rounded-2xl mb-8 flex gap-3 items-start">
                                <Target className="w-5 h-5 text-indigo-600 mt-0.5 shrink-0" />
                                <p className="text-sm text-indigo-700">
                                    คุณสามารถเลือกเน้นหัวข้อที่ต้องการเป็นพิเศษได้
                                    <br /><span className="font-bold">ตัวอย่าง:</span> ปรับ "บริบาล" เป็น 60% ส่วนที่เหลือแบ่งกัน 40%
                                </p>
                            </div>

                            <div className="space-y-6">
                                {topics.map(topic => (
                                    <div key={topic.topic_id} className="group">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-sm font-bold text-slate-700">{topic.topic_name}</label>
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={topicWeights[topic.topic_id]}
                                                    onChange={(e) => handleWeightChange(topic.topic_id, parseInt(e.target.value) || 0)}
                                                    className="w-16 text-right px-2 py-1 bg-slate-50 border-none ring-1 ring-slate-200 rounded-lg text-sm font-bold text-indigo-600"
                                                />
                                                <span className="text-sm font-bold text-slate-400">%</span>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={topicWeights[topic.topic_id]}
                                            onChange={(e) => handleWeightChange(topic.topic_id, parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500 group-hover:accent-indigo-600 transition-all"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100 flex justify-between items-center">
                                <span className="text-sm text-slate-500">สัดส่วนรวมทั้งหมด:</span>
                                <div className={`px-5 py-2 rounded-full font-black text-lg ${Object.values(topicWeights).reduce((a, b) => a + b, 0) === 100
                                    ? 'bg-green-100 text-green-700'
                                    : Object.values(topicWeights).reduce((a, b) => a + b, 0) === 0
                                        ? 'bg-slate-100 text-slate-600'
                                        : 'bg-red-100 text-red-600'
                                    }`}>
                                    {Object.values(topicWeights).reduce((a, b) => a + b, 0)}%
                                </div>
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Summary & Start */}
                    <div className="space-y-6">
                        <section className="sticky top-8 bg-white rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -z-0 opacity-50"></div>

                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-8 text-green-700">
                                    <Settings className="w-5 h-5 animate-spin-slow" />
                                    <h3 className="font-bold">สรุปการตั้งค่า</h3>
                                </div>

                                <div className="space-y-5 mb-10">
                                    <div className="flex justify-between text-sm py-2 border-b border-dashed border-slate-100">
                                        <span className="text-slate-500">ขั้นต่ำ (Min):</span>
                                        <input
                                            type="number"
                                            value={minItems}
                                            onChange={(e) => setMinItems(parseInt(e.target.value))}
                                            className="w-16 bg-transparent text-right font-bold text-slate-800"
                                        />
                                    </div>
                                    <div className="flex justify-between text-sm py-2 border-b border-dashed border-slate-100">
                                        <span className="text-slate-500">สูงสุด (Max):</span>
                                        <input
                                            type="number"
                                            value={maxItems}
                                            onChange={(e) => setMaxItems(parseInt(e.target.value))}
                                            className="w-16 bg-transparent text-right font-bold text-slate-800"
                                        />
                                    </div>
                                    <div className="flex justify-between text-sm py-2 border-b border-dashed border-slate-100">
                                        <span className="text-slate-500">เกณฑ์คะแนน (Cut):</span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                step="0.1"
                                                value={cutScore}
                                                onChange={(e) => setCutScore(parseFloat(e.target.value))}
                                                className="w-16 bg-transparent text-right font-bold text-slate-800"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-5 bg-slate-50 rounded-2xl mb-8 space-y-3">
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                                        <BarChart className="w-3 h-3" /> แนะนำ
                                    </div>
                                    <p className="text-xs text-slate-500 leading-normal">
                                        หากคุณเพิ่งเริ่มหัดใช้ CAT แนะนำให้ใช้การตั้งค่ามาตรฐาน
                                        และปรับเฉพาะ <span className="text-green-600 font-bold">ขอบเขตของข้อสอบ</span> เท่านั้น
                                    </p>
                                </div>

                                <button
                                    onClick={startExam}
                                    className="w-full bg-gradient-to-r from-green-600 to-emerald-700 text-white rounded-2xl py-5 px-6 font-bold text-lg shadow-lg shadow-green-200 hover:shadow-xl hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3 active:scale-95 group"
                                >
                                    เริ่มการทดสอบ CAT
                                    <Zap className="w-5 h-5 fill-current group-hover:scale-125 transition-transform" />
                                </button>

                                <p className="text-center mt-6">
                                    <button onClick={() => router.push("/user")} className="text-sm font-medium text-slate-400 hover:text-slate-600 transition-colors">
                                        ยกเลิกและกลับหน้าหลัก
                                    </button>
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>

            <Footer />

            <style jsx global>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
}
