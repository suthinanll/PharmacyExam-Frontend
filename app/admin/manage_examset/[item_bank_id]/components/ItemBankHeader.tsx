import React, { useState } from 'react';
import { ArrowLeft, Settings, Plus, FileText, Clock, CheckCircle, XCircle, Layers, Edit2, ChevronLeft, ChevronRight, X, HelpCircle, Save, Ban, ChevronDown, FileSpreadsheet } from 'lucide-react';
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
    onAddStandaloneQuestion?: () => void;
    onImportExcel?: () => void;
    onSettingsClick: () => void;
    onCATGuideClick: () => void;
    isEditing: boolean;
    onToggleEdit: () => void;
    onCancel?: () => void;
    onSave?: (e: React.FormEvent) => void;
    submitting?: boolean;
    onBack?: () => void;
    onUploadPdf?: () => void;
}

export default function ItemBankHeader({
    itemBankInfo,
    situations,
    itemBankId,
    onAddSituation,
    onAddStandaloneQuestion,
    onImportExcel,
    onSettingsClick,
    onCATGuideClick,
    isEditing,
    onToggleEdit,
    onCancel,
    onSave,
    submitting = false,
    onBack,
    onUploadPdf
}: ItemBankHeaderProps) {
    const router = useRouter();
    const [showCreateDropdown, setShowCreateDropdown] = useState(false);

    return (
        <>
            {/* Back Button */}
            <div className="flex justify-between items-center mb-6">
                {onBack ? (
                    <button
                        onClick={onToggleEdit}
                        aria-label="ย้อนกลับไปหน้ารายละเอียดชุดข้อสอบ"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        กลับ
                    </button>
                ) : (
                    <Link
                        href="/admin/manage_examset"
                        aria-label="ย้อนกลับไปหน้ารายการชุดข้อสอบ"
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
                                    <span className={`px-2.5 py-1 rounded-full text-sm font-medium shadow-sm ${itemBankInfo.is_active
                                        ? 'bg-green-100 text-green-700 border border-green-200'
                                        : 'bg-amber-100 text-amber-700 border border-amber-200'
                                        }`}>
                                        {itemBankInfo.is_active ? 'เผยแพร่แล้ว' : 'แบบร่าง'}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm sm:text-base text-gray-600">
                                {itemBankInfo?.description || 'ไม่มีคำอธิบายชุดข้อสอบ'}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                        {!isEditing ? (
                            <>
                                <button
                                    onClick={onCATGuideClick}
                                    aria-label="เปิดคู่มือ CAT"
                                    className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm whitespace-nowrap"
                                >
                                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                    <span className="hidden sm:inline">คู่มือ CAT</span>
                                </button>

                                <button
                                    onClick={onToggleEdit}
                                    aria-label="แก้ไขข้อมูลชุดข้อสอบ"
                                    className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm whitespace-nowrap"
                                >
                                    <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                    แก้ไขข้อมูล
                                </button>
                            </>
                        ) : (
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateDropdown(!showCreateDropdown)}
                                    aria-haspopup="true"
                                    aria-expanded={showCreateDropdown}
                                    aria-label="สร้างสถานการณ์หรือคำถามใหม่"
                                    className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl transition-all font-medium text-sm sm:text-base shadow-sm whitespace-nowrap active:scale-95 cursor-pointer"
                                >
                                    <Plus className="w-5 h-5" />
                                    <span>สร้าง</span>
                                    <ChevronDown className={`w-4 h-4 transition-transform ${showCreateDropdown ? 'rotate-180' : ''}`} />
                                </button>

                                {showCreateDropdown && (
                                    <div
                                        className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                                        onMouseLeave={() => setShowCreateDropdown(false)}
                                    >
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowCreateDropdown(false);
                                                onAddSituation();
                                            }}
                                            className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 flex items-center gap-3 transition-colors font-medium cursor-pointer"
                                        >
                                            <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                                                <Layers className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <div className="font-medium">สร้างสถานการณ์ใหม่</div>
                                                <div className="text-xs text-gray-500 font-normal">ข้อสอบที่มีบริบท/โจทย์ยาวร่วมกัน</div>
                                            </div>
                                        </button>

                                        <div className="my-1 border-t border-gray-100" />

                                        {onAddStandaloneQuestion && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowCreateDropdown(false);
                                                    onAddStandaloneQuestion();
                                                }}
                                                className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors font-medium cursor-pointer"
                                            >
                                                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="font-medium">สร้างคำถาม (ไม่มีสถานการณ์)</div>
                                                    <div className="text-xs text-gray-500 font-normal">คำถามเดี่ยวแบบช้อยส์ทั่วไป</div>
                                                </div>
                                            </button>
                                        )}

                                        {onImportExcel && (
                                            <>
                                                <div className="my-1 border-t border-gray-100" />
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setShowCreateDropdown(false);
                                                        onImportExcel();
                                                    }}
                                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-3 transition-colors font-medium cursor-pointer"
                                                >
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                                                        <FileSpreadsheet className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">นำเข้าจากไฟล์ Excel</div>
                                                        <div className="text-xs text-gray-500 font-normal">อัปโหลดไฟล์ .xlsx / .xls (ต่อท้าย/แทนที่)</div>
                                                    </div>
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
