'use client';

import { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { Loader2, Save, X, FileSpreadsheet, Upload, CheckCircle2, HelpCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Category {
    category_id: number;
    category_name: string;
    description?: string;
}

interface CreateItemBankModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function CreateItemBankModal({ isOpen, onClose, onSuccess }: CreateItemBankModalProps) {
    const { getToken } = useAuth();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const [showGuide, setShowGuide] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Form state
    const [formData, setFormData] = useState({
        bank_name: '',
        description: '',
        duration: 3600, // seconds (1 hour default)
        is_active: false,
        category_ids: [] as number[]
    });

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/categories`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                setCategories(data);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
        } finally {
            setLoadingCategories(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({
                ...prev,
                [name]: checked
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }
    };

    const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const minutes = parseInt(e.target.value) || 0;
        setFormData(prev => ({
            ...prev,
            duration: minutes * 60
        }));
    };

    const handleCategoryToggle = (categoryId: number) => {
        setFormData(prev => ({
            ...prev,
            category_ids: prev.category_ids.includes(categoryId)
                ? prev.category_ids.filter(id => id !== categoryId)
                : [...prev.category_ids, categoryId]
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (!file.name.match(/\.(xlsx|xls)$/i)) {
                Swal.fire({
                    title: 'รูปแบบไฟล์ไม่ถูกต้อง',
                    text: 'กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls) เท่านั้น',
                    icon: 'error',
                    confirmButtonColor: '#ef4444'
                });
                return;
            }
            setExcelFile(file);
        }
    };

    const handleRemoveFile = () => {
        setExcelFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.bank_name.trim()) {
            Swal.fire({
                title: 'กรุณากรอกข้อมูล',
                text: 'กรุณากรอกชื่อชุดข้อสอบ',
                icon: 'warning',
                confirmButtonColor: '#3b82f6'
            });
            return;
        }

        if (formData.duration <= 0) {
            Swal.fire({
                title: 'กรุณากรอกข้อมูล',
                text: 'กรุณากรอกระยะเวลาที่ถูกต้อง',
                icon: 'warning',
                confirmButtonColor: '#3b82f6'
            });
            return;
        }

        if (formData.is_active && !excelFile) {
            Swal.fire({
                title: 'ไม่สามารถเปิดใช้งานได้',
                text: 'ต้องมีอย่างน้อย 1 คำถาม/สถานการณ์ ถึงจะสามารถเปิดใช้งานชุดข้อสอบได้',
                icon: 'warning',
                confirmButtonColor: '#3b82f6'
            });
            return;
        }

        setLoading(true);

        try {
            const token = getToken();

            // 1. Create Item Bank
            const response = await fetch(`${API_URL}/items-bank`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'ไม่สามารถสร้างชุดข้อสอบได้');
            }

            const createdBank = await response.json();
            const itemBankId = createdBank.item_bank_id;

            // 2. Import Excel file if provided
            let importMsg = '';
            if (excelFile) {
                const excelFormData = new FormData();
                excelFormData.append('file', excelFile);

                const importRes = await fetch(`${API_URL}/items-bank/${itemBankId}/import-excel`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include',
                    body: excelFormData
                });

                if (importRes.ok) {
                    const importResult = await importRes.json();
                    importMsg = ` และนำเข้าข้อสอบ ${importResult.items_count} ข้อสำเร็จ`;
                    if (importResult.created_topics_count > 0 || importResult.created_sub_topics_count > 0) {
                        importMsg += ` (สร้างหัวข้อใหม่ ${importResult.created_topics_count + importResult.created_sub_topics_count} หัวข้อ)`;
                    }
                } else {
                    const errorData = await importRes.json();
                    console.error('Excel Import Warning:', errorData);
                    Swal.fire({
                        title: 'สร้างชุดข้อสอบสำเร็จ แต่การนำเข้าข้อสอบล้มเหลว',
                        text: errorData.message || 'เกิดข้อผิดพลาดในการประมวลผลไฟล์ Excel สามารถเพิ่มข้อสอบทีหลังได้ในหน้าแก้ไข',
                        icon: 'warning',
                        confirmButtonColor: '#f59e0b'
                    });
                }
            }

            await Swal.fire({
                title: 'สำเร็จ!',
                text: `สร้างชุดข้อสอบสำเร็จ${importMsg}`,
                icon: 'success',
                confirmButtonColor: '#22c55e',
                timer: 2000,
                showConfirmButton: false
            });

            handleReset();
            onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error creating item bank:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถสร้างชุดข้อสอบได้ กรุณาลองใหม่อีกครั้ง',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            bank_name: '',
            description: '',
            duration: 3600,
            is_active: false,
            category_ids: []
        });
        setExcelFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleClose = () => {
        if (!loading) {
            handleReset();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full my-8 max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="bg-green-600 px-6 py-4 rounded-t-2xl flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold text-white">สร้างชุดข้อสอบใหม่</h2>
                        <p className="text-green-100 text-sm mt-0.5">กรอกข้อมูลและอัปโหลดไฟล์ข้อสอบจาก Excel (ตัวเลือก)</p>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="text-white hover:bg-green-500 p-2 rounded-lg transition-colors disabled:opacity-50"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* ชื่อชุดข้อสอบ */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            ชื่อชุดข้อสอบ <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            name="bank_name"
                            value={formData.bank_name}
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                            placeholder="เช่น MCQ ปี 2567 ชุดที่ 1"
                            required
                        />
                    </div>

                    {/* คำอธิบาย */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            คำอธิบาย
                        </label>
                        <textarea
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none"
                            placeholder="รายละเอียดของชุดข้อสอบ..."
                        />
                    </div>

                    {/* ระยะเวลา */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            ระยะเวลาในการทำข้อสอบ (นาที) <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            value={formData.duration / 60}
                            onChange={handleDurationChange}
                            min="1"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition"
                            placeholder="60"
                            required
                        />
                        <p className="text-sm text-gray-500 mt-1">
                            ระยะเวลาปัจจุบัน: {Math.floor(formData.duration / 60)} นาที ({formData.duration} วินาที)
                        </p>
                    </div>

                    {/* ประเภทข้อสอบ */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-3">
                            ประเภทข้อสอบ
                        </label>
                        {loadingCategories ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {[1, 2, 3, 4].map((i) => (
                                    <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-gray-200" />
                                ))}
                            </div>
                        ) : categories.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                                {categories.map((category) => (
                                    <label
                                        key={category.category_id}
                                        className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${formData.category_ids.includes(category.category_id)
                                            ? 'border-green-500 bg-green-50'
                                            : 'border-gray-200 hover:border-gray-300'
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.category_ids.includes(category.category_id)}
                                            onChange={() => handleCategoryToggle(category.category_id)}
                                            className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                        />
                                        <div className="ml-3">
                                            <span className="font-medium text-gray-900">
                                                {category.category_name}
                                            </span>
                                            {category.description && (
                                                <p className="text-sm text-gray-500">{category.description}</p>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-gray-500">
                                ไม่มีประเภทข้อสอบ
                            </div>
                        )}
                    </div>

                    {/* Section: Upload Excel File */}
                    <div className="border-t border-gray-200 pt-6">
                        <div className="flex items-center justify-between mb-3">
                            <label className="block text-sm font-semibold text-gray-800 flex items-center gap-2">
                                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                                นำเข้าข้อสอบจากไฟล์ Excel (ตัวเลือกเสริม)
                            </label>
                            <button
                                type="button"
                                onClick={() => setShowGuide(!showGuide)}
                                className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-medium"
                            >
                                <HelpCircle className="w-4 h-4" />
                                {showGuide ? 'ซ่อนโครงสร้างคอลัมน์' : 'ดูโครงสร้างคอลัมน์ Excel'}
                            </button>
                        </div>

                        {/* Guide Panel */}
                        {showGuide && (
                            <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 space-y-2">
                                <p className="font-semibold text-sm text-emerald-950">📌 หัวตารางที่รองรับในไฟล์ Excel (.xlsx / .xls):</p>
                                <ul className="list-disc list-inside space-y-1 text-emerald-800">
                                    <li><b>ข้อที่</b> (No.) | <b>สถานการณ์</b> (เว้นว่างได้ถ้าไม่มีสถานการณ์)</li>
                                    <li><b>หัวข้อหลัก</b> (Main Topic) | <b>หัวข้อย่อย</b> (Sub Topic) *(ระบบสร้างให้อัตโนมัติหากไม่มีในฐานข้อมูล)*</li>
                                    <li><b>คำถาม</b> (Question) | <b>รูปภาพคำถาม</b> / <b>รูปภาพสถานการณ์</b> (ใส่ URL หรือฝังรูปใน Excel ได้เลย)</li>
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
                                className="border-2 border-dashed border-gray-300 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2"
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx, .xls"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                                <div className="p-3 bg-emerald-100 rounded-full text-emerald-600 mb-1">
                                    <Upload className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-medium text-gray-700">
                                    คลิกเพื่อเลือกไฟล์ Excel หรือลากไฟล์มาวางที่นี่
                                </p>
                                <p className="text-xs text-gray-400">
                                    รองรับเฉพาะไฟล์ .xlsx และ .xls (ขนาดไม่เกิน 50MB)
                                </p>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between p-4 bg-emerald-50 border-2 border-emerald-500 rounded-xl">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="p-2 bg-emerald-600 rounded-lg text-white shrink-0">
                                        <FileSpreadsheet className="w-6 h-6" />
                                    </div>
                                    <div className="truncate">
                                        <p className="text-sm font-semibold text-gray-900 truncate">
                                            {excelFile.name}
                                        </p>
                                        <p className="text-xs text-emerald-700 flex items-center gap-1 mt-0.5">
                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                            พร้อมนำเข้าพร้อมกับการสร้างชุดข้อสอบ ({(excelFile.size / 1024).toFixed(1)} KB)
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleRemoveFile}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2 shrink-0"
                                    title="ยกเลิกไฟล์"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </div>
                </form>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-200 flex gap-3">
                    <button
                        type="button"
                        onClick={handleReset}
                        disabled={loading}
                        className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <X className="w-5 h-5" />
                        ล้างข้อมูล
                    </button>
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {excelFile ? 'กำลังสร้างและนำเข้าข้อสอบ...' : 'กำลังสร้าง...'}
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                {excelFile ? 'สร้างชุดข้อสอบและนำเข้า Excel' : 'สร้างชุดข้อสอบ'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

