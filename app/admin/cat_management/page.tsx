'use client';

import React, { useState, useEffect } from 'react';
import Navbar_admin from "@/components/Navbar_admin";
import {
    BarChart3,
    CheckCircle,
    AlertCircle,
    Search,
    Eye,
    X,
    ChevronLeft,
    ChevronRight,
    Filter,
    HelpCircle,
    Info
} from 'lucide-react';
import Swal from 'sweetalert2';
import CATGuideModal from './components/CATGuideModal';
import { useAuth } from "@/contexts/AuthContext";

// Types
interface AnswerOption {
    option_id: number;
    option_text: string;
    is_correct: boolean;
}

interface ItemBank {
    item_bank_id: number;
    bank_name: string;
    description: string;
}

interface Situation {
    situation_id: number;
    situation_text: string;
    situation_image_url: string;
}

interface ItemWithIRT {
    item_id: number;
    question_text: string;
    question_type: string;
    irt_a_discrimination: number;
    irt_b_difficulty: number;
    irt_c_guessing: number;
    explanation: string;
    status: string;
    display_order: number;
    item_bank: ItemBank;
    answer_options: AnswerOption[];
    situation?: Situation;
}

interface ItemBankReadiness {
    item_bank_id: number;
    bank_name: string;
    total_items: number;
    items_with_irt: number;
    items_without_irt: number;
    readiness_percentage: number;
    is_ready: boolean;
    status: string;
}

interface ReadinessSummary {
    total_item_banks: number;
    ready_for_cat: number;
    not_ready: number;
    overall_percentage: number;
    item_banks: ItemBankReadiness[];
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;
const ITEMS_PER_PAGE = 9;

export default function CATManagement() {
    const { getToken } = useAuth();
    const [summary, setSummary] = useState<ReadinessSummary | null>(null);
    const [itemsWithIRT, setItemsWithIRT] = useState<ItemWithIRT[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedItem, setSelectedItem] = useState<ItemWithIRT | null>(null);
    const [showModal, setShowModal] = useState<boolean>(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBankId, setSelectedBankId] = useState<number | null>(null);
    const [editIRT, setEditIRT] = useState({ a: 0, b: 0, c: 0 });
    const [isSaving, setIsSaving] = useState(false);
    const [showHelpModal, setShowHelpModal] = useState(false);

    // Fetch summary and items on mount
    useEffect(() => {
        fetchSummary();
        fetchItemsWithIRT();
    }, []);

    // Reset to first page when searching or filtering
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedBankId]);

    const fetchSummary = async () => {
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/items-bank/cat/readiness-summary`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            setSummary(data);
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถดึงข้อมูลสรุปได้',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    const fetchItemsWithIRT = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const response = await fetch(`${API_URL}/items-bank/cat/items-with-irt`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            setItemsWithIRT(data);
        } catch (error) {
            console.error('Error:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถดึงข้อมูลข้อสอบได้',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSingleIRT = async () => {
        if (!selectedItem) return;

        // Validation
        const { a, b, c } = editIRT;
        if (a <= 0 || a > 3 || b < -4 || b > 4 || c <= 0 || c >= 1) {
            Swal.fire({
                title: 'ข้อมูลไม่ถูกต้อง',
                html: `กรุณาตรวจสอบค่าดังนี้:<br>- a: 0.1 - 3.0<br>- b: -4.0 - 4.0<br>- c: 0.01 - 0.99`,
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
            return;
        }

        try {
            setIsSaving(true);
            const token = getToken();
            const response = await fetch(`${API_URL}/items-bank/cat/batch-update-irt`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    updates: [{
                        item_id: selectedItem.item_id,
                        irt_a_discrimination: a,
                        irt_b_difficulty: b,
                        irt_c_guessing: c
                    }]
                })
            });

            if (!response.ok) throw new Error('Update failed');

            await Swal.fire({
                title: 'บันทึกสำเร็จ!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });

            setShowModal(false);
            fetchItemsWithIRT();
            fetchSummary();
        } catch (error) {
            console.error('Update error:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกข้อมูลได้',
                icon: 'error'
            });
        } finally {
            setIsSaving(false);
        }
    };

    const stripHTML = (html: string): string => {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    };

    // Get unique item banks for filter
    const uniqueItemBanks = Array.from(
        new Set(itemsWithIRT.map(item => item.item_bank?.item_bank_id))
    )
        .filter(id => id !== undefined)
        .map(id => {
            const item = itemsWithIRT.find(i => i.item_bank?.item_bank_id === id);
            return item?.item_bank;
        })
        .filter(bank => bank !== undefined) as ItemBank[];

    // Filter items based on search and selected bank
    const filteredItems = itemsWithIRT.filter(item => {
        const questionText = stripHTML(item.question_text).toLowerCase();
        const bankName = item.item_bank?.bank_name?.toLowerCase() || '';
        const search = searchTerm.toLowerCase();

        const matchesSearch = questionText.includes(search) || bankName.includes(search);
        const matchesBank = selectedBankId === null || item.item_bank?.item_bank_id === selectedBankId;

        return matchesSearch && matchesBank;
    });

    // Pagination
    const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
    const currentItems = filteredItems.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const Pagination = () => {
        if (totalPages <= 1) return null;

        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

        return (
            <div className="flex items-center justify-center space-x-2 mt-8">
                <button
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    disabled={currentPage === 1}
                    onClick={() => {
                        setCurrentPage(currentPage - 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {pages.map((page) => (
                    <button
                        key={page}
                        className={`w-10 h-10 flex items-center justify-center text-sm font-medium border rounded-lg transition-colors ${page === currentPage
                            ? "bg-green-600 text-white border-green-600"
                            : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                            }`}
                        onClick={() => {
                            setCurrentPage(page);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                    >
                        {page}
                    </button>
                ))}

                <button
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    disabled={currentPage === totalPages}
                    onClick={() => {
                        setCurrentPage(currentPage + 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        );
    };

    return (
        <Navbar_admin>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8" suppressHydrationWarning>
                {/* Header */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">
                                ข้อสอบ CAT
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600">
                                ข้อสอบทั้งหมดพร้อมใช้งาน (Computerized Adaptive Testing)
                            </p>
                        </div>
                        <button
                            onClick={() => setShowHelpModal(true)}
                            suppressHydrationWarning
                            className="flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 px-4 py-2 rounded-lg transition-colors font-medium border border-green-200"
                        >
                            <HelpCircle className="w-5 h-5" />
                            <span>คู่มือการใช้งาน CAT</span>
                        </button>
                    </div>
                </div>

                {/* Search and Filter Bar */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="ค้นหาข้อสอบ..."
                            value={searchTerm}
                            suppressHydrationWarning
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>

                    <div className="relative min-w-[200px]">
                        <select
                            value={selectedBankId || ''}
                            suppressHydrationWarning
                            onChange={(e) => setSelectedBankId(e.target.value ? Number(e.target.value) : null)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm appearance-none bg-white"
                        >
                            <option value="">ทุกคลังข้อสอบ</option>
                            {uniqueItemBanks.map((bank) => (
                                <option key={bank.item_bank_id} value={bank.item_bank_id}>
                                    {bank.bank_name}
                                </option>
                            ))}
                        </select>
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Results Count */}
                <div className="mb-4">
                    <p className="text-sm text-gray-600">
                        แสดง <span className="font-semibold text-gray-900">{filteredItems.length}</span> ข้อสอบ
                        {selectedBankId && (
                            <span className="ml-2">
                                (กรองจาก: <span className="font-medium text-green-600">
                                    {uniqueItemBanks.find(b => b.item_bank_id === selectedBankId)?.bank_name}
                                </span>)
                            </span>
                        )}
                    </p>
                </div>

                {/* Items Grid */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4" />
                            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {currentItems.length === 0 ? (
                                <div className="col-span-full text-center py-16 bg-white border-2 border-dashed border-gray-300 rounded-xl">
                                    <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <Filter className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                                        {searchTerm || selectedBankId ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีข้อสอบที่พร้อมใช้ CAT'}
                                    </h3>
                                    <p className="text-gray-500">
                                        {searchTerm || selectedBankId
                                            ? 'ลองปรับคำค้นหา หรือเลือกคลังข้อสอบอื่น'
                                            : 'ข้อสอบจะปรากฏที่นี่เมื่อมีการระบุค่า IRT เรียบร้อยแล้ว'}
                                    </p>
                                </div>
                            ) : (
                                currentItems.map((item) => (
                                    <div
                                        key={item.item_id}
                                        className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
                                    >
                                        <div className="mb-4">
                                            <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded">
                                                {item.item_bank?.bank_name || 'ไม่ระบุคลัง'}
                                            </span>
                                        </div>

                                        <p className="text-gray-700 text-sm mb-4 line-clamp-3">
                                            {stripHTML(item.question_text)}
                                        </p>

                                        <div className="space-y-2 mb-4">
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="bg-blue-50 p-3 rounded-lg">
                                                    <p className="text-xs text-blue-600 font-medium mb-1">a</p>
                                                    <p className="text-lg font-bold text-blue-700">{item.irt_a_discrimination.toFixed(2)}</p>
                                                    <p className="text-xs text-blue-500">จำแนก</p>
                                                </div>
                                                <div className="bg-purple-50 p-3 rounded-lg">
                                                    <p className="text-xs text-purple-600 font-medium mb-1">b</p>
                                                    <p className="text-lg font-bold text-purple-700">{item.irt_b_difficulty.toFixed(2)}</p>
                                                    <p className="text-xs text-purple-500">ความยาก</p>
                                                </div>
                                                <div className="bg-pink-50 p-3 rounded-lg">
                                                    <p className="text-xs text-pink-600 font-medium mb-1">c</p>
                                                    <p className="text-lg font-bold text-pink-700">{item.irt_c_guessing.toFixed(2)}</p>
                                                    <p className="text-xs text-pink-500">การเดา</p>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={() => {
                                                setSelectedItem(item);
                                                setEditIRT({
                                                    a: item.irt_a_discrimination,
                                                    b: item.irt_b_difficulty,
                                                    c: item.irt_c_guessing
                                                });
                                                setShowModal(true);
                                            }}
                                            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors text-sm font-medium"
                                        >
                                            <Eye className="w-4 h-4" />
                                            ดูรายละเอียด
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        <Pagination />
                    </>
                )}
            </div>

            {/* Modal for viewing item details */}
            {showModal && selectedItem && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                            <h3 className="text-lg font-medium text-gray-900">รายละเอียดข้อสอบ</h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">คลังข้อสอบ</h4>
                                <p className="text-gray-900">{selectedItem.item_bank?.bank_name}</p>
                            </div>

                            {selectedItem.situation && (
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">สถานการณ์</h4>
                                    <div
                                        className="prose prose-sm max-w-none text-gray-800"
                                        dangerouslySetInnerHTML={{ __html: selectedItem.situation.situation_text }}
                                    />
                                    {selectedItem.situation.situation_image_url && (
                                        <div className="mt-4">
                                            <img
                                                src={selectedItem.situation.situation_image_url}
                                                alt="Situation Image"
                                                className="max-w-full h-auto rounded-lg shadow-sm mx-auto"
                                            />
                                        </div>
                                    )}
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">คำถาม</h4>
                                <div
                                    className="prose prose-sm max-w-none text-gray-900"
                                    dangerouslySetInnerHTML={{ __html: selectedItem.question_text }}
                                />
                            </div>

                            {selectedItem.answer_options && selectedItem.answer_options.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">ตัวเลือก</h4>
                                    <div className="space-y-2">
                                        {selectedItem.answer_options.map((option, index) => (
                                            <div
                                                key={option.option_id}
                                                className={`p-3 rounded-lg border ${option.is_correct
                                                    ? 'bg-green-50 border-green-300'
                                                    : 'bg-gray-50 border-gray-200'
                                                    }`}
                                            >
                                                <div className="flex items-start gap-2">
                                                    <span className="font-medium text-sm text-gray-700">{index + 1}.</span>
                                                    <div className="flex-1">
                                                        <p className="text-sm text-gray-900">{option.option_text}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-3">แก้ไข IRT Parameters</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <label className="text-xs text-blue-600 font-medium block mb-1">Parameter a (อำนาจจำแนก)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editIRT.a}
                                            onChange={(e) => setEditIRT({ ...editIRT, a: parseFloat(e.target.value) })}
                                            className="w-full bg-white border border-blue-200 rounded px-2 py-1 text-lg font-bold text-blue-700 focus:ring-2 focus:ring-blue-500 outline-none"
                                        />
                                        <p className="text-[10px] text-blue-500 mt-1">แนะนำ: 1.0 - 2.0</p>
                                    </div>
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                        <label className="text-xs text-purple-600 font-medium block mb-1">Parameter b (ความยาก)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editIRT.b}
                                            onChange={(e) => setEditIRT({ ...editIRT, b: parseFloat(e.target.value) })}
                                            className="w-full bg-white border border-purple-200 rounded px-2 py-1 text-lg font-bold text-purple-700 focus:ring-2 focus:ring-purple-500 outline-none"
                                        />
                                        <p className="text-[10px] text-purple-500 mt-1">ช่วง: -4.0 ถึง 4.0</p>
                                    </div>
                                    <div className="bg-pink-50 p-4 rounded-lg border border-pink-100">
                                        <label className="text-xs text-pink-600 font-medium block mb-1">Parameter c (การเดา)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editIRT.c}
                                            onChange={(e) => setEditIRT({ ...editIRT, c: parseFloat(e.target.value) })}
                                            className="w-full bg-white border border-pink-200 rounded px-2 py-1 text-lg font-bold text-pink-700 focus:ring-2 focus:ring-pink-500 outline-none"
                                        />
                                        <p className="text-[10px] text-pink-500 mt-1">แนะนำ: 0.20 - 0.25</p>
                                    </div>
                                </div>
                            </div>

                            {selectedItem.explanation && (
                                <div>
                                    <h4 className="text-sm font-medium text-gray-700 mb-2">คำอธิบาย</h4>
                                    <div
                                        className="prose prose-sm max-w-none text-gray-700 bg-gray-50 p-4 rounded-lg"
                                        dangerouslySetInnerHTML={{ __html: selectedItem.explanation }}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-lg transition-colors font-medium hover:bg-gray-50"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={handleUpdateSingleIRT}
                                disabled={isSaving}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors font-medium shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        กำลังบันทึก...
                                    </>
                                ) : 'บันทึกการเปลี่ยนแปลง'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CAT Guide Modal */}
            <CATGuideModal isOpen={showHelpModal} onClose={() => setShowHelpModal(false)} />
        </Navbar_admin>
    );
}
