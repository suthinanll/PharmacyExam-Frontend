'use client';
import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, HelpCircle, AlertTriangle, Layers, PlusCircle, RefreshCw, Loader2 } from 'lucide-react';
import Swal from "@/utils/sweetalert";
import { useAuth } from '@/contexts/AuthContext';

interface ImportExcelModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemBankId: string | number;
    itemBankName?: string;
    onSuccess: () => void;
}

export default function ImportExcelModal({
    isOpen,
    onClose,
    itemBankId,
    itemBankName,
    onSuccess,
}: ImportExcelModalProps) {
    const { getToken } = useAuth();
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [importMode, setImportMode] = useState<'append' | 'overwrite'>('append');
    const [showGuide, setShowGuide] = useState(false);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
            if (!isExcel) {
                Swal.fire({
                    title: 'ประเภทไฟล์ไม่ถูกต้อง',
                    text: 'กรุณาอัปโหลดเฉพาะไฟล์ Excel (.xlsx, .xls)',
                    icon: 'warning',
                    confirmButtonColor: '#16a34a',
                });
                return;
            }
            if (file.size > 50 * 1024 * 1024) {
                Swal.fire({
                    title: 'ไฟล์มีขนาดใหญ่เกินไป',
                    text: 'ขนาดไฟล์สูงสุดไม่เกิน 50MB',
                    icon: 'warning',
                    confirmButtonColor: '#16a34a',
                });
                return;
            }
            setExcelFile(file);
        }
    };

    const handleRemoveFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setExcelFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!excelFile) {
            Swal.fire({
                title: 'กรุณาเลือกไฟล์',
                text: 'กรุณาเลือกไฟล์ Excel ที่ต้องการนำเข้า',
                icon: 'warning',
                confirmButtonColor: '#16a34a',
            });
            return;
        }

        if (importMode === 'overwrite') {
            const result = await Swal.fire({
                title: 'ยืนยันการแทนที่ข้อสอบทั้งหมด?',
                text: 'ข้อสอบและสถานการณ์เดิมที่มีอยู่ในชุดข้อสอบนี้ทั้งหมดจะถูกลบและแทนที่ด้วยข้อสอบใหม่จากไฟล์ Excel',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'ใช่, แทนที่ทั้งหมด',
                cancelButtonText: 'ยกเลิก',
            });

            if (!result.isConfirmed) {
                return;
            }
        }

        setLoading(true);
        try {
            const token = getToken();
            const formData = new FormData();
            formData.append('file', excelFile);
            formData.append('mode', importMode);

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items-bank/${itemBankId}/import-excel`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'เกิดข้อผิดพลาดในการนำเข้าไฟล์ Excel');
            }

            await Swal.fire({
                title: 'นำเข้าสำเร็จ!',
                html: `
                    <div class="text-left text-sm space-y-1 py-2">
                        <p class="text-gray-700"><b>จำนวนข้อสอบที่นำเข้า:</b> ${data.items_count || 0} ข้อ</p>
                        ${data.situations_count ? `<p class="text-gray-700"><b>จำนวนสถานการณ์:</b> ${data.situations_count} สถานการณ์</p>` : ''}
                        ${data.created_topics_count ? `<p class="text-gray-700"><b>หัวข้อหลักใหม่:</b> ${data.created_topics_count} หัวข้อ</p>` : ''}
                        ${data.created_sub_topics_count ? `<p class="text-gray-700"><b>หัวข้อย่อยใหม่:</b> ${data.created_sub_topics_count} หัวข้อ</p>` : ''}
                    </div>
                `,
                icon: 'success',
                confirmButtonColor: '#16a34a',
            });

            onClose();
            onSuccess();
        } catch (err: any) {
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: err.message || 'ไม่สามารถนำเข้าไฟล์ Excel ได้',
                icon: 'error',
                confirmButtonColor: '#ef4444',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-emerald-100/80 text-emerald-700 rounded-xl">
                            <FileSpreadsheet className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                นำเข้าข้อสอบจาก Excel
                            </h3>
                            <p className="text-xs text-gray-500">
                                {itemBankName ? `ชุดข้อสอบ: ${itemBankName}` : 'อัปโหลดไฟล์ข้อสอบ .xlsx หรือ .xls'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="text-gray-400 hover:text-gray-600 hover:bg-slate-100 p-2 rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
                    {/* Section 1: Mode Selection */}
                    <div className="space-y-2.5">
                        <label className="text-sm font-medium text-gray-900 block">
                            รูปแบบการนำเข้า <span className="text-red-500">*</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {/* Mode Append */}
                            <label
                                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                                    importMode === 'append'
                                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 shadow-xs'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 text-gray-700'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="importMode"
                                    value="append"
                                    checked={importMode === 'append'}
                                    onChange={() => setImportMode('append')}
                                    className="mt-1 text-emerald-600 focus:ring-emerald-500"
                                />
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 font-medium text-sm text-gray-900">
                                        <PlusCircle className="w-4 h-4 text-emerald-600" />
                                        นำเข้าต่อท้าย (Append)
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        เพิ่มข้อสอบใหม่ต่อจากข้อสอบเดิมที่มีอยู่แล้วในชุดนี้
                                    </p>
                                </div>
                            </label>

                            {/* Mode Overwrite */}
                            <label
                                className={`flex items-start gap-3 p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                                    importMode === 'overwrite'
                                        ? 'border-red-500 bg-red-50/50 text-red-950 shadow-xs'
                                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50/50 text-gray-700'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="importMode"
                                    value="overwrite"
                                    checked={importMode === 'overwrite'}
                                    onChange={() => setImportMode('overwrite')}
                                    className="mt-1 text-red-600 focus:ring-red-500"
                                />
                                <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 font-medium text-sm text-gray-900">
                                        <RefreshCw className="w-4 h-4 text-red-600" />
                                        แทนที่ทั้งหมด (Overwrite)
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        ล้างข้อสอบเดิมทั้งหมด และนำเข้าข้อสอบใหม่จากไฟล์นี้
                                    </p>
                                </div>
                            </label>
                        </div>

                        {importMode === 'overwrite' && (
                            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 animate-in fade-in duration-150">
                                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                                <span>
                                    <b>คำเตือน:</b> การเลือก "แทนที่ทั้งหมด" จะลบข้อสอบและสถานการณ์เดิมทั้งหมดในชุดข้อสอบนี้ และแทนที่ด้วยข้อสอบจากไฟล์ Excel ที่เลือก
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Section 2: Guide Button & Panel */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                                ไฟล์ Excel ข้อสอบ
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowGuide(!showGuide)}
                                className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium cursor-pointer"
                            >
                                <HelpCircle className="w-3.5 h-3.5" />
                                {showGuide ? 'ซ่อนโครงสร้างคอลัมน์' : 'ดูโครงสร้างคอลัมน์ Excel'}
                            </button>
                        </div>

                        {/* Guide Panel */}
                        {showGuide && (
                            <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 space-y-1.5">
                                <p className="font-semibold text-emerald-900">โครงสร้างหัวตารางที่รองรับในไฟล์ Excel (.xlsx / .xls):</p>
                                <ul className="list-disc list-inside space-y-1 text-emerald-800">
                                    <li><b>ข้อที่</b> (No.) | <b>สถานการณ์</b> (เว้นว่างได้ถ้าไม่มีสถานการณ์)</li>
                                    <li><b>หัวข้อหลัก</b> (Main Topic) | <b>หัวข้อย่อย</b> (Sub Topic) *(ระบบสร้างให้อัตโนมัติหากไม่มีในระบบ)*</li>
                                    <li><b>คำถาม</b> (Question) | <b>รูปภาพคำถาม</b> / <b>รูปภาพสถานการณ์</b> (ใส่ URL หรือฝังรูป/สมการใน Excel ได้)</li>
                                    <li><b>ตัวเลือก 1</b> ถึง <b>ตัวเลือก 5</b></li>
                                    <li><b>เฉลย</b> (Answer Key) *(รองรับ: 1-5, ก-จ, ข้อ ก - ข้อ จ, A-E)*</li>
                                    <li><b>คำอธิบายเฉลย</b> (Answer Text / Explanation) *(เว้นว่างได้)*</li>
                                </ul>
                            </div>
                        )}

                        {/* File Upload Box */}
                        {!excelFile ? (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50/30 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 mb-0.5">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-medium text-gray-800">
                                    คลิกเพื่อเลือกไฟล์ Excel หรือลากไฟล์มาวางที่นี่
                                </p>
                                <p className="text-xs text-gray-400">
                                    รองรับเฉพาะไฟล์ .xlsx และ .xls (ขนาดไม่เกิน 50MB)
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 bg-emerald-50/80 border border-emerald-300 rounded-xl">
                                <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                    <div className="p-2.5 bg-emerald-600 rounded-lg text-white shrink-0">
                                        <FileSpreadsheet className="w-5 h-5" />
                                    </div>
                                    <div className="truncate min-w-0">
                                        <p className="text-sm font-medium text-gray-900 truncate">
                                            {excelFile.name}
                                        </p>
                                        <p className="text-xs text-emerald-700 flex items-center gap-1 mt-0.5">
                                            <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                            พร้อมนำเข้า ({(excelFile.size / 1024).toFixed(1)} KB)
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    disabled={loading}
                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2 shrink-0 cursor-pointer disabled:opacity-50"
                                    title="ยกเลิกไฟล์"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 bg-slate-50/50 rounded-b-2xl border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-5 py-2.5 border border-slate-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading || !excelFile}
                        className={`text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98 ${
                            importMode === 'overwrite'
                                ? 'bg-red-600 hover:bg-red-700'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                        }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>กำลังนำเข้า...</span>
                            </>
                        ) : (
                            <>
                                <Upload className="w-4 h-4" />
                                <span>
                                    {importMode === 'overwrite' ? 'แทนที่ข้อสอบทั้งหมด' : 'นำเข้าข้อสอบ'}
                                </span>
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
