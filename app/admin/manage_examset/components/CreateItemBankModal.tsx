"use client"
import { useState, useEffect, useRef } from 'react';
import Swal from "@/utils/sweetalert";
import { Loader2, Save, X, FileSpreadsheet, Upload, CheckCircle2, HelpCircle, Layers, Clock, Tag, Plus, Check } from 'lucide-react';
import { useAuth } from "@/contexts/AuthContext";

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
    const [showGuide, setShowGuide] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        bank_name: '',
        description: '',
        duration: 3600, // seconds
        is_active: false,
        category_ids: [] as number[]
    });

    // Excel file state
    const [excelFile, setExcelFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Create New Category Modal State
    const [showCreateCatModal, setShowCreateCatModal] = useState(false);
    const [newCatName, setNewCatName] = useState('');
    const [newCatDesc, setNewCatDesc] = useState('');
    const [creatingCat, setCreatingCat] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen]);

    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const token = getToken ? getToken() : '';
            const response = await fetch(`${API_URL}/categories`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
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

    const handleCreateCategory = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedName = newCatName.trim();
        if (!trimmedName) {
            Swal.fire({
                title: 'กรุณากรอกข้อมูล',
                text: 'กรุณากรอกชื่อประเภทข้อสอบ',
                icon: 'warning',
                confirmButtonColor: '#16a34a'
            });
            return;
        }

        // Check for duplicate locally
        const isDuplicate = categories.some(
            c => c.category_name.trim().toLowerCase() === trimmedName.toLowerCase()
        );
        if (isDuplicate) {
            Swal.fire({
                title: 'ชื่อประเภทข้อสอบซ้ำ',
                text: `ชื่อประเภทข้อสอบ "${trimmedName}" มีอยู่ในระบบแล้ว`,
                icon: 'warning',
                confirmButtonColor: '#16a34a'
            });
            return;
        }

        setCreatingCat(true);
        try {
            const token = getToken ? getToken() : '';
            const res = await fetch(`${API_URL}/categories`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                credentials: 'include',
                body: JSON.stringify({
                    category_name: trimmedName,
                    category_description: newCatDesc.trim()
                })
            });

            if (res.ok) {
                const newCat = await res.json();
                await fetchCategories();
                if (newCat && newCat.category_id) {
                    setFormData(prev => ({
                        ...prev,
                        category_ids: [...prev.category_ids, newCat.category_id]
                    }));
                }
                setShowCreateCatModal(false);
                setNewCatName('');
                setNewCatDesc('');
                Swal.fire({
                    title: 'สำเร็จ',
                    text: `สร้างประเภทข้อสอบ "${trimmedName}" เรียบร้อยแล้ว`,
                    icon: 'success',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                const errData = await res.json().catch(() => ({}));
                throw new Error(errData.message || 'ไม่สามารถสร้างประเภทข้อสอบได้');
            }
        } catch (error: any) {
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถสร้างประเภทข้อสอบได้',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setCreatingCat(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        const validExtensions = ['.xlsx', '.xls'];
        const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();

        if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
            Swal.fire({
                title: 'ประเภทไฟล์ไม่ถูกต้อง',
                text: 'กรุณาเลือกไฟล์ Excel (.xlsx หรือ .xls) เท่านั้น',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
            return;
        }

        if (file.size > 50 * 1024 * 1024) {
            Swal.fire({
                title: 'ไฟล์มีขนาดใหญ่เกินไป',
                text: 'ขนาดไฟล์ต้องไม่เกิน 50MB',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
            return;
        }

        setExcelFile(file);
    };

    const handleRemoveFile = () => {
        setExcelFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.bank_name.trim()) {
            Swal.fire({
                title: 'กรุณากรอกข้อมูล',
                text: 'กรุณากรอกชื่อชุดข้อสอบ',
                icon: 'warning',
                confirmButtonColor: '#16a34a'
            });
            return;
        }

        if (formData.duration <= 0) {
            Swal.fire({
                title: 'กรุณากรอกข้อมูล',
                text: 'กรุณากรอกระยะเวลาที่ถูกต้อง',
                icon: 'warning',
                confirmButtonColor: '#16a34a'
            });
            return;
        }

        if (formData.is_active && !excelFile) {
            Swal.fire({
                title: 'ไม่สามารถเปิดใช้งานได้',
                text: 'ต้องมีอย่างน้อย 1 คำถามหรือสถานการณ์ในชุดข้อสอบ จึงจะสามารถเปิดใช้งานได้ (หรือแนบไฟล์ Excel เพื่อนำเข้าข้อสอบทันที)',
                icon: 'warning',
                confirmButtonColor: '#16a34a'
            });
            return;
        }

        setLoading(true);

        try {
            const token = getToken ? getToken() : '';
            const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

            if (excelFile) {
                const submitData = new FormData();
                submitData.append('bank_name', formData.bank_name.trim());
                if (formData.description) submitData.append('description', formData.description.trim());
                submitData.append('duration', formData.duration.toString());
                submitData.append('is_active', formData.is_active.toString());
                submitData.append('category_ids', JSON.stringify(formData.category_ids));
                submitData.append('file', excelFile);

                const response = await fetch(`${API_URL}/items-bank/with-excel`, {
                    method: 'POST',
                    headers: {
                        ...authHeaders,
                    },
                    credentials: 'include',
                    body: submitData
                });

                const data = await response.json();

                if (response.ok) {
                    if (data.import_result?.errors && data.import_result.errors.length > 0) {
                        await Swal.fire({
                            title: 'สร้างชุดข้อสอบสำเร็จ แต่พบปัญหาบางข้อ',
                            html: `
                                <div class="text-left space-y-2 text-sm">
                                    <p>สร้างชุดข้อสอบ: <b>${data.item_bank?.bank_name}</b></p>
                                    <p class="text-green-600 font-medium">นำเข้าสำเร็จ: ${data.import_result.imported_count} ข้อ</p>
                                    <p class="text-amber-600 font-medium">ข้าม/ผิดพลาด: ${data.import_result.errors.length} รายการ</p>
                                    <div class="mt-2 p-2 bg-amber-50 rounded-lg text-sm max-h-36 overflow-y-auto text-amber-900 border border-amber-200">
                                        ${data.import_result.errors.map((e: string) => `<p>• ${e}</p>`).join('')}
                                    </div>
                                </div>
                            `,
                            icon: 'warning',
                            confirmButtonColor: '#16a34a'
                        });
                    } else {
                        await Swal.fire({
                            title: 'สำเร็จ',
                            text: `สร้างชุดข้อสอบ "${data.item_bank?.bank_name || formData.bank_name}" พร้อมนำเข้าข้อสอบ ${data.import_result?.imported_count || 0} ข้อเรียบร้อยแล้ว`,
                            icon: 'success',
                            confirmButtonColor: '#16a34a'
                        });
                    }

                    handleReset();
                    onSuccess();
                    onClose();
                } else {
                    throw new Error(data.message || 'ไม่สามารถสร้างชุดข้อสอบและนำเข้าไฟล์ได้');
                }
            } else {
                const response = await fetch(`${API_URL}/items-bank`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...authHeaders,
                    },
                    credentials: 'include',
                    body: JSON.stringify(formData)
                });

                if (response.ok) {
                    await Swal.fire({
                        title: 'สำเร็จ',
                        text: 'สร้างชุดข้อสอบใหม่เรียบร้อยแล้ว',
                        icon: 'success',
                        confirmButtonColor: '#16a34a'
                    });

                    handleReset();
                    onSuccess();
                    onClose();
                } else {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'ไม่สามารถสร้างชุดข้อสอบได้');
                }
            }
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
        setShowGuide(false);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleClose = () => {
        if (!loading) {
            handleReset();
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full my-8 max-h-[90vh] overflow-y-auto border border-slate-100 flex flex-col justify-between">

                    {/* ── Modal Header ── */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
                        <div>
                            <h2 className="text-lg font-medium text-gray-900">สร้างชุดข้อสอบใหม่</h2>
                            <p className="text-sm text-gray-500 mt-0.5">กรอกข้อมูลและอัปโหลดไฟล์ข้อสอบจาก Excel (ตัวเลือกเพิ่มเติม)</p>
                        </div>
                        <button
                            onClick={handleClose}
                            disabled={loading}
                            className="text-gray-600 hover:text-gray-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* ── Modal Body ── */}
                    <form onSubmit={handleSubmit} className="p-6 space-y-6 flex-1">

                        {/* Section 1: ข้อมูลชุดข้อสอบ */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                                <Layers className="w-4 h-4 text-green-600" />
                                <h3 className="text-sm font-medium text-gray-900">ข้อมูลชุดข้อสอบ</h3>
                            </div>

                            {/* ชื่อชุดข้อสอบ */}
                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                                    ชื่อชุดข้อสอบ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="bank_name"
                                    value={formData.bank_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition"
                                    placeholder="เช่น MCQ ปี 2567 ชุดที่ 1"
                                    required
                                />
                            </div>

                            {/* คำอธิบาย */}
                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                                    คำอธิบายรายละเอียด
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={2}
                                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition resize-y"
                                    placeholder="ระบุรายละเอียดเพิ่มเติมเกี่ยวกับชุดข้อสอบนี้..."
                                />
                            </div>

                            {/* ระยะเวลา */}
                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                                    ระยะเวลาในการทำข้อสอบ (นาที) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Clock className="w-4 h-4 text-gray-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                    <input
                                        type="number"
                                        value={formData.duration / 60}
                                        onChange={handleDurationChange}
                                        min="1"
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-gray-900 focus:outline-hidden focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition"
                                        placeholder="60"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section 2: ประเภทข้อสอบที่เกี่ยวข้อง */}
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                    <Tag className="w-4 h-4 text-green-600" />
                                    <h3 className="text-sm font-medium text-gray-900">ประเภทข้อสอบที่เกี่ยวข้อง</h3>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => { setNewCatName(''); setNewCatDesc(''); setShowCreateCatModal(true); }}
                                    className="text-xs text-green-600 hover:text-green-700 font-medium flex items-center gap-1 hover:underline cursor-pointer"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                    เพิ่มประเภทข้อสอบใหม่
                                </button>
                            </div>

                            {loadingCategories ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {[1, 2, 3, 4].map((i) => (
                                        <div key={i} className="h-14 w-full animate-pulse rounded-xl bg-slate-100" />
                                    ))}
                                </div>
                            ) : categories.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                    {categories.map((category) => {
                                        const isSelected = formData.category_ids.includes(category.category_id);
                                        return (
                                            <label
                                                key={category.category_id}
                                                className={`flex items-start gap-2.5 p-3 border rounded-xl cursor-pointer transition-all ${
                                                    isSelected
                                                        ? 'border-green-500 bg-green-50/60 shadow-2xs'
                                                        : 'border-slate-200 hover:border-slate-300 bg-white'
                                                }`}
                                            >
                                                <div className={`w-4 h-4 rounded flex items-center justify-center mt-0.5 shrink-0 border transition-all ${
                                                    isSelected
                                                        ? 'bg-green-600 border-green-600 text-white'
                                                        : 'border-slate-300 bg-white'
                                                }`}>
                                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleCategoryToggle(category.category_id)}
                                                    className="sr-only"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <span className="text-sm font-medium text-gray-900 block truncate">
                                                        {category.category_name}
                                                    </span>
                                                    {category.description && (
                                                        <p className="text-[0.6875rem] text-gray-500 line-clamp-1 mt-0.5">{category.description}</p>
                                                    )}
                                                </div>
                                            </label>
                                        );
                                    })}

                                    {/* Add New Category Card Button at the end */}
                                    <button
                                        type="button"
                                        onClick={() => { setNewCatName(''); setNewCatDesc(''); setShowCreateCatModal(true); }}
                                        className="flex items-center justify-center gap-2 p-3 border-2 border-dashed border-slate-200 hover:border-green-500 hover:bg-green-50/40 text-gray-500 hover:text-green-700 rounded-xl transition-all text-xs font-medium cursor-pointer min-h-[50px]"
                                    >
                                        <Plus className="w-4 h-4" />
                                        <span>เพิ่มประเภทข้อสอบใหม่</span>
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-6 px-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 space-y-2.5">
                                    <Tag className="w-6 h-6 text-gray-600 mx-auto" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-700">ยังไม่มีประเภทข้อสอบในระบบ</p>
                                        <p className="text-xs text-gray-600 mt-0.5">คุณสามารถสร้างประเภทข้อสอบใหม่เพื่อเชื่อมโยงกับชุดข้อสอบนี้ได้ทันที</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => { setNewCatName(''); setNewCatDesc(''); setShowCreateCatModal(true); }}
                                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-medium rounded-lg shadow-xs transition cursor-pointer"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        สร้างประเภทข้อสอบใหม่
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Section 4: นำเข้าข้อสอบจาก Excel */}
                        <div className="space-y-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-gray-900 flex items-center gap-2">
                                    <FileSpreadsheet className="w-4 h-4 text-green-600" />
                                    นำเข้าข้อสอบจากไฟล์ Excel (ตัวเลือกเพิ่มเติม)
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowGuide(!showGuide)}
                                    className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1 font-medium cursor-pointer"
                                >
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    {showGuide ? 'ซ่อนโครงสร้างคอลัมน์' : 'ดูโครงสร้างคอลัมน์ Excel'}
                                </button>
                            </div>

                            {/* Guide Panel */}
                            {showGuide && (
                                <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-sm text-emerald-950 space-y-1.5">
                                    <p className="font-medium text-sm text-emerald-900">โครงสร้างหัวตารางที่รองรับในไฟล์ Excel (.xlsx / .xls):</p>
                                    <ul className="list-disc list-inside space-y-1 text-emerald-800">
                                        <li><b>ข้อที่</b> (No.) | <b>สถานการณ์</b> (เว้นว่างได้ถ้าไม่มีสถานการณ์)</li>
                                        <li><b>หัวข้อหลัก</b> (Main Topic) | <b>หัวข้อย่อย</b> (Sub Topic) *(ระบบสร้างให้อัตโนมัติหากไม่มีในฐานข้อมูล)*</li>
                                        <li><b>คำถาม</b> (Question) | <b>รูปภาพคำถาม</b> / <b>รูปภาพสถานการณ์</b> (ใส่ URL หรือฝังรูปใน Excel ได้)</li>
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
                                    className="border border-dashed border-slate-300 hover:border-green-500 hover:bg-green-50/30 rounded-xl p-5 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5"
                                >
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".xlsx, .xls"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    <div className="p-2.5 bg-green-50 rounded-full text-green-600 mb-0.5">
                                        <Upload className="w-5 h-5" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-800">
                                        คลิกเพื่อเลือกไฟล์ Excel หรือลากไฟล์มาวางที่นี่
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        รองรับเฉพาะไฟล์ .xlsx และ .xls (ขนาดไม่เกิน 50MB)
                                    </p>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between p-3.5 bg-green-50/80 border border-green-300 rounded-xl">
                                    <div className="flex items-center gap-3 overflow-hidden min-w-0">
                                        <div className="p-2 bg-green-600 rounded-lg text-white shrink-0">
                                            <FileSpreadsheet className="w-5 h-5" />
                                        </div>
                                        <div className="truncate min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {excelFile.name}
                                            </p>
                                            <p className="text-sm text-green-700 flex items-center gap-1 mt-0.5">
                                                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                                พร้อมนำเข้าพร้อมกับการสร้างชุดข้อสอบ ({(excelFile.size / 1024).toFixed(1)} KB)
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveFile}
                                        className="p-1.5 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors ml-2 shrink-0 cursor-pointer"
                                        title="ยกเลิกไฟล์"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </form>

                    {/* ── Modal Footer ── */}
                    <div className="px-6 py-4 bg-slate-50/50 rounded-b-2xl border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="px-5 py-2.5 border border-slate-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            ยกเลิก
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-6 py-2.5 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {excelFile ? 'กำลังสร้างและนำเข้าข้อสอบ...' : 'กำลังสร้าง...'}
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4" />
                                    {excelFile ? 'สร้างชุดข้อสอบและนำเข้า Excel' : 'สร้างชุดข้อสอบ'}
                                </>
                            )}
                        </button>
                    </div>

                </div>
            </div>

            {/* ── Sub Modal: Create New Category Quick Modal ── */}
            {showCreateCatModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[60]">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                            <div>
                                <h3 className="text-base font-medium text-gray-900">เพิ่มประเภทข้อสอบใหม่</h3>
                                <p className="text-xs text-gray-500 mt-0.5">สร้างประเภทข้อสอบเพื่อเชื่อมโยงกับชุดข้อสอบนี้</p>
                            </div>
                            <button
                                onClick={() => setShowCreateCatModal(false)}
                                disabled={creatingCat}
                                className="text-gray-600 hover:text-gray-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                                    ชื่อประเภทข้อสอบ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newCatName}
                                    onChange={e => setNewCatName(e.target.value)}
                                    placeholder="เช่น เภสัชกรรมคลินิก, เภสัชวิทยา"
                                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition"
                                    required
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-800 mb-1.5">
                                    คำอธิบายรายละเอียด
                                </label>
                                <textarea
                                    value={newCatDesc}
                                    onChange={e => setNewCatDesc(e.target.value)}
                                    rows={3}
                                    placeholder="ระบุคำอธิบายเกี่ยวกับประเภทข้อสอบนี้..."
                                    className="w-full px-4 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-hidden focus:border-green-500 focus:bg-white focus:ring-2 focus:ring-green-100 transition resize-none"
                                />
                            </div>

                            <div className="flex items-center justify-end gap-2.5 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateCatModal(false)}
                                    disabled={creatingCat}
                                    className="px-4 py-2 border border-slate-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={creatingCat}
                                    className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-5 py-2 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    {creatingCat ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            กำลังบันทึก...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            บันทึกประเภทข้อสอบ
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
