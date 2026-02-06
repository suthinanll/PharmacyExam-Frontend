"use client";

import React, { useState, useEffect } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';

// ==================== TYPES ====================
interface ItemBank {
    item_bank_id: number;
    bank_name: string;
    description: string;
    duration: number;
    is_active: boolean;
    total_items?: number;
    cat_ready?: boolean;
}

interface CATReadiness {
    item_bank_id: number;
    bank_name: string;
    total_items: number;
    items_with_irt: number;
    readiness_percentage: number;
    is_ready: boolean;
    status: string;
}

// ==================== MAIN COMPONENT ====================
export default function SelectCATExamPage() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(true);
    const [itemBanks, setItemBanks] = useState<ItemBank[]>([]);
    const [readiness, setReadiness] = useState<Record<number, CATReadiness>>({});

    useEffect(() => {
        fetchItemBanks();
        fetchCATReadiness();
    }, []);

    async function fetchItemBanks() {
        try {
            const token = getToken();
            const response = await fetch("http://localhost:3001/items-bank", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) throw new Error("Failed to fetch item banks");

            const data = await response.json();
            setItemBanks(data.filter((bank: ItemBank) => bank.is_active));
        } catch (error) {
            console.error("Error fetching item banks:", error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchCATReadiness() {
        try {
            const token = getToken();
            const response = await fetch(
                "http://localhost:3001/items-bank/cat/readiness-summary",
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) return;

            const data = await response.json();
            const readinessMap: Record<number, CATReadiness> = {};
            data.item_banks.forEach((r: CATReadiness) => {
                readinessMap[r.item_bank_id] = r;
            });
            setReadiness(readinessMap);
        } catch (error) {
            console.error("Error fetching CAT readiness:", error);
        }
    }

    function startExam(itemBankId: number) {
        const ready = readiness[itemBankId];
        if (ready && !ready.is_ready) {
            alert(
                `ชุดข้อสอบนี้ยังไม่พร้อมสำหรับ CAT\n${ready.status}\n\nมีข้อสอบที่ระบุ IRT parameters ครบเพียง ${ready.items_with_irt} ข้อ (ต้องการอย่างน้อย 20 ข้อ)`
            );
            return;
        }

        // ส่งต่อไปหน้าสอบพร้อม item_bank_id
        router.push(`/user/cat-exam/exam?item_bank_id=${itemBankId}`);
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
                    <p className="text-lg text-green-800">กำลังโหลดชุดข้อสอบ...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 to-green-100">
            <Navbar_user />

            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-2xl px-8 py-8 text-white mb-8 shadow-xl">
                    <h1 className="text-3xl font-bold mb-2">
                        🎯 เลือกชุดข้อสอบ CAT
                    </h1>
                    <p className="text-green-100">
                        ระบบข้อสอบแบบปรับตัว (Computerized Adaptive Testing)
                    </p>
                    <div className="mt-4 bg-white/20 rounded-xl p-4">
                        <p className="text-sm">
                            💡 <strong>หมายเหตุ:</strong> ระบบ CAT จะปรับความยากของข้อสอบตามความสามารถของคุณโดยอัตโนมัติ
                            ทำให้ประเมินความสามารถได้แม่นยำด้วยข้อสอบน้อยกว่าการสอบแบบปกติ
                        </p>
                    </div>
                </div>

                {/* Item Banks Grid */}
                {itemBanks.length === 0 ? (
                    <div className="bg-white rounded-2xl shadow-xl p-12 text-center">
                        <div className="text-6xl mb-4">📚</div>
                        <h3 className="text-xl font-semibold text-gray-700 mb-2">
                            ยังไม่มีชุดข้อสอบ
                        </h3>
                        <p className="text-gray-500">
                            กรุณารอระบบเพิ่มชุดข้อสอบ หรือติดต่อผู้ดูแลระบบ
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {itemBanks.map((bank) => {
                            const ready = readiness[bank.item_bank_id];
                            const isReady = ready?.is_ready ?? false;

                            return (
                                <div
                                    key={bank.item_bank_id}
                                    className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
                                >
                                    {/* Status Badge */}
                                    <div
                                        className={`px-6 py-3 ${isReady
                                            ? "bg-gradient-to-r from-green-500 to-green-600"
                                            : "bg-gradient-to-r from-gray-400 to-gray-500"
                                            }`}
                                    >
                                        <div className="flex items-center justify-between text-white">
                                            <span className="text-sm font-semibold">
                                                {isReady ? "✅ พร้อมใช้" : "⚠️ ยังไม่พร้อม"}
                                            </span>
                                            {ready && (
                                                <span className="text-xs bg-white/30 px-2 py-1 rounded-full">
                                                    {ready.readiness_percentage}%
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="p-6">
                                        <h3 className="text-xl font-bold text-gray-800 mb-2">
                                            {bank.bank_name}
                                        </h3>
                                        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                            {bank.description || "ไม่มีคำอธิบาย"}
                                        </p>

                                        {/* Stats */}
                                        <div className="space-y-2 mb-4">
                                            {ready && (
                                                <>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">จำนวนข้อทั้งหมด:</span>
                                                        <span className="font-semibold text-gray-800">
                                                            {ready.total_items} ข้อ
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">ข้อที่พร้อม CAT:</span>
                                                        <span className={`font-semibold ${isReady ? 'text-green-600' : 'text-red-600'}`}>
                                                            {ready.items_with_irt} ข้อ
                                                        </span>
                                                    </div>
                                                    {!isReady && (
                                                        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                                                            ต้องการอย่างน้อย 20 ข้อ
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            {bank.duration && (
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-gray-600">เวลาโดยประมาณ:</span>
                                                    <span className="font-semibold text-gray-800">
                                                        {bank.duration} นาที
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Progress Bar */}
                                        {ready && (
                                            <div className="mb-4">
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className={`h-2 rounded-full transition-all duration-300 ${isReady ? 'bg-green-500' : 'bg-gray-400'
                                                            }`}
                                                        style={{ width: `${ready.readiness_percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Button */}
                                        <button
                                            onClick={() => startExam(bank.item_bank_id)}
                                            disabled={!isReady}
                                            className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${isReady
                                                ? "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-lg hover:shadow-xl"
                                                : "bg-gray-300 text-gray-500 cursor-not-allowed"
                                                }`}
                                        >
                                            {isReady ? "🚀 เริ่มสอบ CAT" : "⚠️ ยังไม่พร้อม"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Back Button */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => router.push("/user")}
                        className="px-8 py-3 bg-gray-600 text-white rounded-xl font-semibold hover:bg-gray-700 transition-all duration-200"
                    >
                        ← กลับหน้าหลัก
                    </button>
                </div>
            </div>

            <Footer />
        </div>
    );
}
