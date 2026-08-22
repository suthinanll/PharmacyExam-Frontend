"use client";

import React, { useState, useEffect } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { useAuth } from "@/contexts/AuthContext";

// ==================== TYPES ====================
interface IRTItem {
    a: number; // discrimination
    b: number; // difficulty
    c: number; // guessing
}

interface ItemBankResponse {
    item_bank_id: number;
    bank_name: string;
}

interface QuestionItem {
    item_id: number;
    question_text: string;
    irt_a_discrimination: number;
    irt_b_difficulty: number;
    irt_c_guessing: number;
}

interface IRTResponse {
    item: IRTItem;
    isCorrect: boolean;
    item_id: number;
    infoAtSelection: number;
}

interface ThetaEstimation {
    theta: number;
    se: number;
}

// ==================== IRT MATH LOGIC (Frontend Replica) ====================
// These formulas strictly follow the backend's pharmacy_backend/src/cat/irt.service.ts
const IRT = {
    probability(theta: number, item: IRTItem): number {
        const exponent = -item.a * (theta - item.b);
        const prob = item.c + (1 - item.c) / (1 + Math.exp(exponent));
        return Math.max(0.0001, Math.min(0.9999, prob));
    },

    information(theta: number, item: IRTItem): number {
        const P = this.probability(theta, item);
        if (P <= 0.0001 || P >= 0.9999) return 0.0;
        const numerator = Math.pow(item.a, 2) * Math.pow(P - item.c, 2) * (1 - P);
        const denominator = Math.pow(1 - item.c, 2) * P;
        if (denominator === 0) return 0.0;
        return numerator / denominator;
    },

    normalPDF(x: number, mean: number, sd: number): number {
        const exponent = -Math.pow(x - mean, 2) / (2 * Math.pow(sd, 2));
        return Math.exp(exponent) / (sd * Math.sqrt(2 * Math.PI));
    },

    estimateThetaEAP(responses: IRTResponse[], priorMean: number = 0, priorSD: number = 1): ThetaEstimation {
        if (responses.length === 0) return { theta: 0.0, se: 999.0 };

        const numQuadrature = 49;
        const thetaMin = -4.0;
        const thetaMax = 4.0;

        const thetaPoints: number[] = [];
        for (let i = 0; i < numQuadrature; i++) {
            thetaPoints.push(thetaMin + ((thetaMax - thetaMin) * i) / (numQuadrature - 1));
        }

        const prior = thetaPoints.map((th) => this.normalPDF(th, priorMean, priorSD));

        const likelihoods = thetaPoints.map((th) => {
            let logL = 0;
            for (const response of responses) {
                const P = this.probability(th, response.item);
                if (response.isCorrect) logL += Math.log(P);
                else logL += Math.log(1 - P);
            }
            return Math.exp(logL); // Since max items is ~50, we might get precision issues, but fine for demo
        });

        const posterior = likelihoods.map((L, i) => L * prior[i]);
        const total = posterior.reduce((sum, p) => sum + p, 0);

        if (total === 0) return { theta: priorMean, se: 999.0 };

        const normalizedPosterior = posterior.map((p) => p / total);

        const thetaEAP = thetaPoints.reduce((sum, th, i) => sum + th * normalizedPosterior[i], 0);

        const variance = thetaPoints.reduce((sum, th, i) => sum + Math.pow(th - thetaEAP, 2) * normalizedPosterior[i], 0);
        const se = Math.sqrt(variance);

        return { theta: thetaEAP, se };
    }
};

export default function CATDebugPage() {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [itemBanks, setItemBanks] = useState<ItemBankResponse[]>([]);
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null);

    // CAT State
    const [allItems, setAllItems] = useState<QuestionItem[]>([]);
    const [responses, setResponses] = useState<IRTResponse[]>([]);
    const [currentTheta, setCurrentTheta] = useState(0.0);
    const [currentSE, setCurrentSE] = useState(999.0);
    const [nextItem, setNextItem] = useState<QuestionItem | null>(null);

    // Configuration
    const [maxItems, setMaxItems] = useState(50);
    const [targetSE, setTargetSE] = useState(0.35);

    // Computed internal states for visualization
    const [stratumText, setStratumText] = useState("");
    const [aMaxLimit, setAMaxLimit] = useState(999);

    // 1. Load Item Banks
    useEffect(() => {
        const fetchBanks = async () => {
            const token = getToken();
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items-bank`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setItemBanks(data);
                    if (data.length > 0) setSelectedBankId(data[0].item_bank_id);
                }
            } catch (err) {
                console.error("Failed to load item banks", err);
            }
        };
        fetchBanks();
    }, []);

    // 2. Load Items when Bank selected
    useEffect(() => {
        if (!selectedBankId) return;
        const fetchItems = async () => {
            setLoading(true);
            const token = getToken();
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items-bank/${selectedBankId}/items`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    let itemsArray = data.items || data;
                    if (!Array.isArray(itemsArray)) itemsArray = [];
                    // Ensure items have IRT parameters, default to standard if missing
                    itemsArray = itemsArray.map((i: any) => ({
                        ...i,
                        irt_a_discrimination: Number(i.irt_a_discrimination) || 1.0,
                        irt_b_difficulty: Number(i.irt_b_difficulty) || 0.0,
                        irt_c_guessing: Number(i.irt_c_guessing) || 0.2
                    }));
                    setAllItems(itemsArray);
                    resetSimulation(itemsArray);
                }
            } catch (err) {
                console.error("Failed to load items", err);
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, [selectedBankId]);

    // 3. Reset Simulation
    const resetSimulation = (items = allItems) => {
        setResponses([]);
        setCurrentTheta(0.0);
        setCurrentSE(999.0);
        selectNextItem(items, [], 0.0);
    };

    // 4. Select Next Item (The Engine)
    const selectNextItem = (itemsPool: QuestionItem[], currentHistory: IRTResponse[], theta: number) => {
        const answeredIds = currentHistory.map(r => r.item_id);
        const eligibleItems = itemsPool.filter(i => !answeredIds.includes(i.item_id));

        if (eligibleItems.length === 0) {
            setNextItem(null);
            setStratumText("ไม่มีข้อสอบเหลือแล้ว");
            return;
        }

        // --- a-Stratification Logic ---
        const NUM_STRATA = 3;
        const progressRatio = maxItems > 0 ? currentHistory.length / maxItems : 0;
        const currentStratum = Math.min(Math.floor(progressRatio * NUM_STRATA), NUM_STRATA - 1);

        const aValues = [...eligibleItems]
            .map(i => i.irt_a_discrimination)
            .sort((x, y) => x - y);
        const strataSize = Math.ceil(aValues.length / NUM_STRATA);
        const aMax = aValues[Math.min((currentStratum + 1) * strataSize - 1, aValues.length - 1)];

        setAMaxLimit(aMax);
        setStratumText(`Stratum ${currentStratum + 1}/${NUM_STRATA} (ค่า 'a' ต้องไม่เกิน ${aMax.toFixed(2)})`);

        let candidates = eligibleItems.filter(i => i.irt_a_discrimination <= aMax);
        if (candidates.length === 0) candidates = eligibleItems;

        // --- Maximum Fisher Information ---
        let bestItem: QuestionItem | null = null;
        let maxInfo = -1;

        for (const item of candidates) {
            const irtObj = { a: item.irt_a_discrimination, b: item.irt_b_difficulty, c: item.irt_c_guessing };
            const info = IRT.information(theta, irtObj);
            if (info > maxInfo) {
                maxInfo = info;
                bestItem = item;
            }
        }

        setNextItem(bestItem);
    };

    // 5. Answer Handler
    const handleAnswer = (isCorrect: boolean) => {
        if (!nextItem) return;

        const irtObj = { a: nextItem.irt_a_discrimination, b: nextItem.irt_b_difficulty, c: nextItem.irt_c_guessing };
        const infoAtSelection = IRT.information(currentTheta, irtObj);

        const newResponse: IRTResponse = {
            item: irtObj,
            item_id: nextItem.item_id,
            isCorrect,
            infoAtSelection
        };

        const newResponses = [...responses, newResponse];
        setResponses(newResponses);

        const newEst = IRT.estimateThetaEAP(newResponses, 0, 1);
        setCurrentTheta(newEst.theta);
        setCurrentSE(newEst.se);

        // Check Stopping Rule
        if (newResponses.length >= maxItems) {
            setNextItem(null);
            setStratumText(`จบการสอบ: ครบ ${maxItems} ข้อแล้ว!`);
        } else if (newEst.se <= targetSE && newResponses.length >= 20) { // arbitrary min 20
            setNextItem(null);
            setStratumText(`จบการสอบ: ความคลาดเคลื่อน (SE) ลดลงถึงเป้า ${targetSE} แล้ว!`);
        } else {
            selectNextItem(allItems, newResponses, newEst.theta);
        }
    };

    // ==================== RENDERING ====================
    return (
        <div className="min-h-screen bg-slate-100 pb-10">
            <Navbar_user />

            <div className="bg-indigo-900 text-white p-6 shadow-md border-y-4 border-indigo-400">
                <div className="container mx-auto flex flex-wrap gap-6 items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">🔬 CAT Algorithm Debugger</h1>
                        <p className="opacity-80 mt-1">
                            หน้าสำหรับ Demo และดูการทำงานของสมการเบื้องหลัง (EAP Estimation & Maximum Fisher Information)
                        </p>
                    </div>

                    <div className="flex gap-4 bg-indigo-800 p-4 rounded-xl border border-indigo-700 w-full md:w-auto">
                        <div>
                            <label className="block text-xs text-indigo-300 font-medium mb-1 ">เลือกคลังข้อสอบ</label>
                            <select
                                className="bg-indigo-950 text-white border-none rounded p-2 text-sm w-48"
                                value={selectedBankId || ""}
                                onChange={(e) => setSelectedBankId(Number(e.target.value))}
                            >
                                {itemBanks.map(b => (
                                    <option key={b.item_bank_id} value={b.item_bank_id}>{b.bank_name}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => resetSimulation()}
                            className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-6 rounded shadow-lg transition-transform active:scale-95 self-end"
                        >
                            เริ่ม/รีเซ็ต การจำลอง
                        </button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto p-4 mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* LEFT COLUMN: History & State */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Current Score Card */}
                    <div className="bg-white rounded-2xl p-6 shadow border border-slate-200">
                        <h2 className="text-sm font-medium text-slate-500  mb-4">สถานะปัจจุบัน</h2>
                        <div className="text-center">
                            <div className="text-6xl font-black text-indigo-600 tracking-tighter mb-2">
                                {currentTheta.toFixed(3)}
                            </div>
                            <div className="text-xs font-medium text-indigo-400">ความสามารถประเมิน (Theta, θ)</div>
                        </div>

                        {/* CI Bounds Row */}
                        <div className="mt-4 grid grid-cols-2 gap-2">
                            <div className="bg-red-50 p-2 rounded-lg text-center border border-red-100">
                                <div className="text-sm font-medium text-red-600">
                                    {currentSE === 999 ? "-∞" : (currentTheta - 1.96 * currentSE).toFixed(3)}
                                </div>
                                <div className="text-[10px] text-red-400 font-medium ">CI ขอบล่าง</div>
                            </div>
                            <div className="bg-green-50 p-2 rounded-lg text-center border border-green-100">
                                <div className="text-sm font-medium text-green-600">
                                    {currentSE === 999 ? "+∞" : (currentTheta + 1.96 * currentSE).toFixed(3)}
                                </div>
                                <div className="text-[10px] text-green-400 font-medium ">CI ขอบบน</div>
                            </div>
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 flex justify-between px-2">
                            <div className="text-center">
                                <div className="text-xl font-medium text-slate-700">{currentSE === 999 ? "∞" : currentSE.toFixed(3)}</div>
                                <div className="text-[10px] text-slate-400  font-medium">Standard Error (SE)</div>
                            </div>
                            <div className="text-center border-l pl-4 border-slate-100">
                                <div className="text-xl font-medium text-slate-700">{responses.length} / {maxItems}</div>
                                <div className="text-[10px] text-slate-400  font-medium">จำนวนข้อสอบ</div>
                            </div>
                        </div>

                        {/* Theta Graphic */}
                        <div className="mt-6 relative h-6 bg-slate-100 rounded-full border border-slate-200">
                            <div className="absolute top-0 bottom-0 left-1/2 w-[1px] bg-slate-400" />
                            <div
                                className="absolute top-1 bottom-1 w-4 bg-indigo-600 rounded-full shadow transition-all duration-300 transform -translate-x-1/2"
                                style={{ left: `${Math.max(0, Math.min(100, ((currentTheta - (-4)) / 8) * 100))}%` }}
                            />
                        </div>
                        <div className="flex justify-between mt-1 text-[10px] text-slate-400">
                            <span>-4.0</span>
                            <span>0.0</span>
                            <span>+4.0</span>
                        </div>
                    </div>

                    {/* History */}
                    <div className="bg-white rounded-2xl shadow border border-slate-200 overflow-hidden flex flex-col h-[500px]">
                        <div className="bg-slate-50 p-4 border-b border-slate-200">
                            <h2 className="text-sm font-medium text-slate-700 ">ประวัติการตอบ</h2>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {responses.length === 0 && <div className="text-center py-10 text-slate-400">ยังไม่มีการตอบ</div>}
                            {responses.map((r, i) => (
                                <div key={i} className={`p-3 rounded-lg border-l-4 ${r.isCorrect ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium text-sm text-slate-700">ข้อ {i + 1} (ID: {r.item_id})</span>
                                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${r.isCorrect ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                            {r.isCorrect ? 'ตอบถูก' : 'ตอบผิด'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 text-[10px] text-slate-600 gap-1">
                                        <div>Info: {r.infoAtSelection.toFixed(3)}</div>
                                        <div>b (Diff): {r.item.b.toFixed(2)}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* MIDDLE COLUMN: Current Question & Action */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100 flex flex-col h-full relative overflow-hidden">

                        {/* Stratum Indicator */}
                        <div className="absolute top-0 left-0 right-0 bg-yellow-100 p-2 text-center text-xs font-medium text-yellow-800 border-b border-yellow-200">
                            เกณฑ์การคัดกรอง: {stratumText}
                        </div>

                        {nextItem ? (
                            <div className="mt-8 flex flex-col">
                                <h2 className="text-sm font-medium text-indigo-500  mb-4">ระบบเลือกข้อนี้ให้ผู้สอบ:</h2>
                                <h3 className="text-xl font-medium text-slate-800 mb-6 leading-relaxed">
                                    "{nextItem.question_text}"
                                </h3>

                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 mb-6">
                                    <h4 className="text-xs font-medium text-slate-400  mb-3 text-center">IRT Parameters</h4>
                                    <div className="grid grid-cols-3 gap-2 text-center mb-4">
                                        <div className="bg-white rounded p-2 shadow-sm border border-slate-100">
                                            <div className="text-lg font-medium text-slate-700">{nextItem.irt_a_discrimination.toFixed(2)}</div>
                                            <div className="text-[10px] text-slate-400 font-medium ">a (ความชัน)</div>
                                        </div>
                                        <div className="bg-white rounded p-2 shadow-sm border border-purple-200 ring-2 ring-purple-50">
                                            <div className="text-lg font-medium text-purple-700">{nextItem.irt_b_difficulty.toFixed(2)}</div>
                                            <div className="text-[10px] text-purple-400 font-medium ">b (ความยาก)</div>
                                        </div>
                                        <div className="bg-white rounded p-2 shadow-sm border border-slate-100">
                                            <div className="text-lg font-medium text-slate-700">{nextItem.irt_c_guessing.toFixed(2)}</div>
                                            <div className="text-[10px] text-slate-400 font-medium ">c (การเดา)</div>
                                        </div>
                                    </div>

                                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-center">
                                        <div className="text-sm font-medium text-blue-800">ได้คะแนน Information สูงสุดที่:</div>
                                        <div className="text-3xl font-black text-blue-600 my-1">
                                            {IRT.information(currentTheta, { a: nextItem.irt_a_discrimination, b: nextItem.irt_b_difficulty, c: nextItem.irt_c_guessing }).toFixed(4)}
                                        </div>
                                        <div className="text-[10px] text-blue-400 font-medium ">( ณ บริเวณ θ = {currentTheta.toFixed(2)} )</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mt-auto">
                                    <button
                                        onClick={() => handleAnswer(true)}
                                        className="bg-green-500 hover:bg-green-600 text-white font-medium py-4 rounded-xl shadow-lg border-b-4 border-green-700 active:border-b-0 active:mt-4 transition-all"
                                    >
                                        <div className="text-2xl mb-1">✅</div>
                                        จำลองการ "ตอบถูก"
                                    </button>
                                    <button
                                        onClick={() => handleAnswer(false)}
                                        className="bg-red-500 hover:bg-red-600 text-white font-medium py-4 rounded-xl shadow-lg border-b-4 border-red-700 active:border-b-0 active:mt-4 transition-all"
                                    >
                                        <div className="text-2xl mb-1">❌</div>
                                        จำลองการ "ตอบผิด"
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-8 flex flex-col items-center justify-center h-full text-center">
                                <div className="text-6xl mb-4">🏆</div>
                                <h2 className="text-2xl font-medium text-slate-700 mb-2">สิ้นสุดการจำลอง</h2>
                                <p className="text-slate-500 px-4">ระบบหยุดการเลือกข้อสอบเนื่องจากเข้าเงื่อนไข Stopping Rules เรียบร้อยแล้ว</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: Brain (Internal Calculation Table) */}
                <div className="lg:col-span-5 bg-white rounded-2xl shadow border border-slate-200 flex flex-col overflow-hidden max-h-[800px]">
                    <div className="bg-slate-800 text-white p-4 border-b flex justify-between items-center">
                        <h2 className="text-sm font-medium  flex items-center gap-2">
                            <span>🧠</span> กระบวนการคิดเบื้องหลัง (Item Pool)
                        </h2>
                        <div className="text-xs bg-slate-700 px-3 py-1 rounded-full text-slate-300">เรียงตาม Information มากไปน้อย</div>
                    </div>

                    <div className="overflow-x-auto flex-1 h-full relative">
                        {loading && <div className="absolute inset-0 bg-white/50 flex items-center justify-center font-medium">กำลังโหลดข้อสอบ...</div>}

                        <table className="w-full text-sm text-left">
                            <thead className="text-xs font-medium text-slate-500 bg-slate-50 sticky top-0 ">
                                <tr>
                                    <th className="px-4 py-3">ID</th>
                                    <th className="px-4 py-3">a</th>
                                    <th className="px-4 py-3">b</th>
                                    <th className="px-4 py-3">c</th>
                                    <th className="px-4 py-3 bg-blue-50 text-blue-700 w-[100px]">P(θ)</th>
                                    <th className="px-4 py-3 bg-indigo-50 text-indigo-700 w-[100px]">Info(θ)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {allItems
                                    .map(item => {
                                        const irtObj = { a: item.irt_a_discrimination, b: item.irt_b_difficulty, c: item.irt_c_guessing };
                                        const prob = IRT.probability(currentTheta, irtObj);
                                        const info = IRT.information(currentTheta, irtObj);
                                        const isAnswered = responses.some(r => r.item_id === item.item_id);
                                        const isEliminatedByStratum = item.irt_a_discrimination > aMaxLimit;
                                        const isNext = nextItem?.item_id === item.item_id;

                                        return { ...item, prob, info, isAnswered, isNext, isEliminatedByStratum };
                                    })
                                    .sort((x, y) => y.info - x.info) // เรียงตาม info ลดลง
                                    .map((item, idx) => (
                                        <tr
                                            key={item.item_id}
                                            className={`
                                                ${item.isNext ? 'bg-blue-100 ring-2 ring-blue-500 relative z-10' : ''}
                                                ${item.isAnswered ? 'bg-slate-100 opacity-40' : ''}
                                                ${item.isEliminatedByStratum && !item.isAnswered && !item.isNext ? 'bg-red-50 opacity-60' : ''}
                                                hover:bg-slate-50 transition-colors
                                            `}
                                        >
                                            <td className="px-4 py-2 font-medium">#{item.item_id}
                                                {item.isNext && <span className="ml-2 text-[10px] bg-blue-500 text-white px-2 py-0.5 rounded-full inline-block">เลือก!</span>}
                                                {item.isAnswered && <span className="ml-2 text-[10px] text-slate-400">(ตอบแล้ว)</span>}
                                                {item.isEliminatedByStratum && !item.isAnswered && <span className="ml-2 text-[10px] text-red-400" title="ถูกตัดเพราะค่า a เกินกำหนด">(!a)</span>}
                                            </td>
                                            <td className="px-4 py-2 text-slate-600">{item.irt_a_discrimination.toFixed(2)}</td>
                                            <td className={`px-4 py-2 font-medium ${item.isNext ? 'text-blue-700' : 'text-slate-700'}`}>{item.irt_b_difficulty.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-slate-600">{item.irt_c_guessing.toFixed(2)}</td>
                                            <td className="px-4 py-2 bg-blue-50/50 text-blue-600">{(item.prob * 100).toFixed(1)}%</td>
                                            <td className="px-4 py-2 bg-indigo-50/50 font-medium text-indigo-600">{item.info.toFixed(4)}</td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>

            <Footer />
        </div>
    );
}
