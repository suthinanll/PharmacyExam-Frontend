import React from 'react';
import { ArrowLeft, Settings, Plus, FileText, Clock, CheckCircle, XCircle, Layers, Edit2, ChevronLeft, ChevronRight, X, HelpCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface ItemBankDetails {
    item_bank_id: number;
    bank_name: string;
    description: string;
    duration: number;
    is_active: boolean;
    created_at: string;
    categories: {
        category_id: number;
        category_name: string;
    }[];
}

interface Situation {
    questions: any[];
}

interface ItemBankHeaderProps {
    itemBankInfo: ItemBankDetails | null;
    situations: Situation[];
    itemBankId: string;
    onAddSituation: () => void;
    onSettingsClick: () => void;
    onCATGuideClick: () => void;
    isEditing: boolean;
    onToggleEdit: () => void;
    onSave?: (e: React.FormEvent) => void;
    submitting?: boolean;
}

export default function ItemBankHeader({
    itemBankInfo,
    situations,
    itemBankId,
    onAddSituation,
    onSettingsClick,
    onCATGuideClick,
    isEditing,
    onToggleEdit,
    onSave,
    submitting = false
}: ItemBankHeaderProps) {
    const router = useRouter();

    return (
        <>
            {/* Back Button */}
            <div className="flex justify-between items-center mb-6">
                <Link
                    href="/admin/manage_examset"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    กลับ
                </Link>
            </div>

            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">
                                {itemBankInfo?.bank_name || 'Loading...'}
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600">
                                {itemBankInfo?.description || 'กำลังโหลดข้อมูล...'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                        {!isEditing ? (
                            <>
                                <button
                                    onClick={onCATGuideClick}
                                    className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm whitespace-nowrap"
                                >
                                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden sm:inline">คู่มือ CAT</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={onSettingsClick}
                                    className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm whitespace-nowrap"
                                >
                                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                                    การตั้งค่า
                                </button>
                                <button
                                    onClick={onToggleEdit}
                                    className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm whitespace-nowrap"
                                >
                                    <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                    แก้ไขข้อมูล
                                </button>
                            </>
                        ) : (
                            <>
                                <button
                                    onClick={onToggleEdit}
                                    className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm whitespace-nowrap"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={onAddSituation}
                                    className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm whitespace-nowrap"
                                >
                                    <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                                    เพิ่มสถานการณ์
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Item Bank Info Grid */}
                {itemBankInfo && (
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Questions */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">จำนวนข้อทั้งหมด</p>
                                <p className="text-gray-900 font-semibold text-lg">
                                    {situations.reduce((acc, s) => acc + s.questions.length, 0)} ข้อ
                                </p>
                            </div>
                        </div>

                        {/* Duration */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">ระยะเวลาสอบ</p>
                                <p className="text-gray-900 font-semibold">
                                    {Math.floor(itemBankInfo.duration / 60)} นาที
                                </p>
                            </div>
                        </div>

                        {/* Status */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className={`p-3 rounded-lg ${itemBankInfo.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                                {itemBankInfo.is_active ? <CheckCircle className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">สถานะ</p>
                                <p className={`font-semibold ${itemBankInfo.is_active ? 'text-green-700' : 'text-red-700'}`}>
                                    {itemBankInfo.is_active ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}
                                </p>
                            </div>
                        </div>


                        {/* Categories */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center gap-4">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-lg">
                                <Layers className="w-6 h-6" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">หมวดหมู่</p>
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {itemBankInfo.categories && itemBankInfo.categories.length > 0 ? (
                                        itemBankInfo.categories.slice(0, 2).map((cat, idx) => (
                                            <span key={idx} className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full border border-gray-200 truncate max-w-full">
                                                {cat.category_name}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-gray-400 text-sm italic">- ไม่มี -</span>
                                    )}
                                    {itemBankInfo.categories && itemBankInfo.categories.length > 2 && (
                                        <span className="text-xs text-gray-500 ml-1">+{itemBankInfo.categories.length - 2}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
