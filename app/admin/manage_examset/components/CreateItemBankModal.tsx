'use client';

import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Loader2, Save, X, AlertCircle } from 'lucide-react';
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

        setLoading(true);

        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/items-bank`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await Swal.fire({
                    title: 'สำเร็จ!',
                    text: 'สร้างชุดข้อสอบสำเร็จ',
                    icon: 'success',
                    confirmButtonColor: '#22c55e',
                    timer: 1500,
                    showConfirmButton: false
                });

                handleReset();
                onSuccess();
                onClose();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'ไม่สามารถสร้างชุดข้อสอบได้');
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
                        <h2 className="text-xl font-medium text-white">สร้างชุดข้อสอบใหม่</h2>
                        <p className="text-green-100 text-sm mt-0.5">กรอกข้อมูลเพื่อสร้างชุดข้อสอบใหม่</p>
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        <label className="block text-sm font-medium text-gray-700 mb-2">
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
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            ประเภทข้อสอบ
                        </label>
                        {loadingCategories ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-6 h-6 animate-spin text-green-600" />
                                <span className="ml-2 text-gray-600">กำลังโหลดประเภทข้อสอบ...</span>
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

                    {/* Status Note */}
                    {/* <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-medium text-amber-900">บันทึกเป็นแบบร่าง</p>
                            <p className="text-xs text-amber-700 mt-1">
                                ชุดข้อสอบที่สร้างใหม่จะถูกตั้งเป็น "แบบร่าง" (ปิดการใช้งาน) โดยอัตโนมัติ คุณสามารถเปิดใช้งานได้ภายหลังจากการเพิ่มข้อสอบครบถ้วนแล้ว
                            </p>
                        </div>
                    </div> */}
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
                        className="flex-1 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                กำลังสร้าง...
                            </>
                        ) : (
                            <>
                                <Save className="w-5 h-5" />
                                สร้างชุดข้อสอบ
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
