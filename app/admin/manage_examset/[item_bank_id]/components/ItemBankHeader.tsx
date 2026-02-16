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
    onBack?: () => void;
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
    submitting = false,
    onBack
}: ItemBankHeaderProps) {
    const router = useRouter();

    return (
        <>
            {/* Back Button */}
            <div className="flex justify-between items-center mb-6">
                {onBack ? (
                    <button
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        กลับ
                    </button>
                ) : (
                    <Link
                        href="/admin/manage_examset"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        กลับ
                    </Link>
                )}
            </div>

            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div>
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-2xl sm:text-3xl font-medium text-gray-900">
                                    {itemBankInfo?.bank_name || 'Loading...'}
                                </h1>
                                {itemBankInfo && (
                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold shadow-sm ${itemBankInfo.is_active
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                                        }`}>
                                        {itemBankInfo.is_active ? 'เผยแพร่แล้ว' : 'แบบร่าง'}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm sm:text-base text-gray-600">
                                {itemBankInfo?.description || 'กำลังโหลดข้อมูล...'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                        {!isEditing ? (
                            <>
                                {/* <button
                                    onClick={onSettingsClick}
                                    className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm whitespace-nowrap"
                                >
                                    <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden sm:inline">ตั้งค่า</span>
                                </button> */}

                                <button
                                    onClick={onCATGuideClick}
                                    className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm whitespace-nowrap"
                                >
                                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden sm:inline">คู่มือ CAT</span>
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


            </div>
        </>
    );
}
