
import React, { useState, useEffect } from 'react';
import Swal from 'sweetalert2';
import { Loader2, Save, X, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Category {
    category_id: number;
    category_name: string;
    description?: string;
}

const API_URL = 'http://localhost:5000';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    itemBankId: string;
    onUpdate: () => void;
}

export default function SettingsModal({
    isOpen,
    onClose,
    itemBankId,
    onUpdate
}: SettingsModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [categories, setCategories] = useState<Category[]>([]);

    // Form state
    const [formData, setFormData] = useState({
        bank_name: '',
        description: '',
        duration: 3600,
        is_active: true,
        category_ids: [] as number[]
    });

    useEffect(() => {
        if (isOpen && itemBankId) {
            fetchData();
        }
    }, [isOpen, itemBankId]);

    const fetchData = async () => {
        setFetching(true);
        try {
            await Promise.all([
                fetchCategories(),
                fetchItemBankData()
            ]);
        } catch (error) {
            console.error('Error fetching data:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถโหลดข้อมูลได้',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
            onClose();
        } finally {
            setFetching(false);
        }
    };

    const fetchCategories = async () => {
        const response = await fetch(`${API_URL}/categories`, {
            credentials: 'include'
        });
        if (response.ok) {
            const data = await response.json();
            setCategories(data);
        }
    };

    const fetchItemBankData = async () => {
        const response = await fetch(`${API_URL}/items-bank/${itemBankId}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch item bank');
        }

        const data = await response.json();

        setFormData({
            bank_name: data.bank_name,
            description: data.description || '',
            duration: parseInt(data.duration) || 3600,
            is_active: data.is_active,
            category_ids: data.categories?.map((c: any) => c.category_id) || []
        });
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
        const value = e.target.value;
        const minutes = value === '' ? 0 : parseInt(value, 10);

        if (!isNaN(minutes)) {
            setFormData(prev => ({
                ...prev,
                duration: minutes * 60
            }));
        }
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
                text: 'กรุณากรอกระยะเวลาที่ถูกต้อง (ต้องมากกว่า 0 นาที)',
                icon: 'warning',
                confirmButtonColor: '#3b82f6'
            });
            return;
        }

        setLoading(true);

        const payload = {
            ...formData,
            duration: Number(formData.duration)
        };

        try {
            const response = await fetch(`${API_URL}/items-bank/${itemBankId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                await Swal.fire({
                    title: 'บันทึกสำเร็จ!',
                    text: 'แก้ไขชุดข้อสอบเรียบร้อยแล้ว',
                    icon: 'success',
                    confirmButtonColor: '#22c55e'
                });
                onUpdate();
                onClose();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'ไม่สามารถบันทึกข้อมูลได้');
            }
        } catch (error: any) {
            console.error('Error updating item bank:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถบันทึกข้อมูลได้',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        const result = await Swal.fire({
            title: 'ยืนยันการลบ?',
            text: "คุณต้องการลบชุดข้อสอบนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ลบชุดข้อสอบ',
            cancelButtonText: 'ยกเลิก'
        });

        if (result.isConfirmed) {
            try {
                const response = await fetch(`${API_URL}/items-bank/${itemBankId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });

                if (response.ok) {
                    await Swal.fire(
                        'ลบสำเร็จ!',
                        'ชุดข้อสอบถูกลบเรียบร้อยแล้ว',
                        'success'
                    );
                    router.push('/admin/manage_examset');
                } else {
                    throw new Error('Failed to delete');
                }
            } catch (error) {
                Swal.fire(
                    'เกิดข้อผิดพลาด!',
                    'ไม่สามารถลบชุดข้อสอบได้',
                    'error'
                );
            }
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 backdrop-blur-sm flex items-center justify-center z-50 p-4 bg-black/30 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200">
                {fetching ? (
                    <div className="flex items-center justify-center h-64">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
                    </div>
                ) : (
                    <div className="p-6 sm:p-8">
                        <div className="flex justify-between items-start mb-6 border-b border-gray-100 pb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">ตั้งค่าชุดข้อสอบ</h2>
                                <p className="text-gray-500 text-sm mt-1">แก้ไขข้อมูลพื้นฐานของชุดข้อสอบ</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="ลบชุดข้อสอบ"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={onClose}
                                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            {/* ชื่อชุดข้อสอบ */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    ชื่อชุดข้อสอบ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="bank_name"
                                    value={formData.bank_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition outline-none"
                                    required
                                />
                            </div>

                            {/* คำอธิบาย */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    คำอธิบาย
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition resize-none outline-none"
                                />
                            </div>

                            {/* ระยะเวลา */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    ระยะเวลาในการทำข้อสอบ (นาที) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={Math.floor(formData.duration / 60)}
                                    onChange={handleDurationChange}
                                    min="1"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition outline-none"
                                    required
                                />
                            </div>

                            {/* หมวดหมู่ */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    หมวดหมู่
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                                    {categories.map((category) => (
                                        <label
                                            key={category.category_id}
                                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition ${formData.category_ids.includes(category.category_id)
                                                ? 'border-green-500 bg-green-50'
                                                : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.category_ids.includes(category.category_id)}
                                                onChange={() => handleCategoryToggle(category.category_id)}
                                                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                            />
                                            <span className="ml-3 font-medium text-gray-900 text-sm">
                                                {category.category_name}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* สถานะ */}
                            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 text-green-600 border-gray-300 rounded focus:ring-green-500"
                                    />
                                    <span className="ml-3 font-medium text-gray-700">
                                        เปิดใช้งานชุดข้อสอบนี้
                                    </span>
                                </label>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4 border-t border-gray-100 pt-6">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            กำลังบันทึก...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-5 h-5" />
                                            บันทึก
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
