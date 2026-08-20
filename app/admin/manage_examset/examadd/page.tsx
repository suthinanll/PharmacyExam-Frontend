"use client"
import { useState, useEffect } from 'react';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar_admin from "@/components/Navbar_admin";
import Footer from "@/components/Footer";
import Swal from 'sweetalert2';
import { Loader2, Save, X, ChevronRight } from 'lucide-react';

// Types
interface Category {
    category_id: number;
    category_name: string;
    description?: string;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

function CreateItemBank() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loadingCategories, setLoadingCategories] = useState(true);

    // Form state
    const [formData, setFormData] = useState({
        bank_name: '',
        description: '',
        duration: 3600, // seconds (1 hour default)
        is_active: true,
        category_ids: [] as number[]
    });

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoadingCategories(true);
        try {
            const response = await fetch(`${API_URL}/categories`, {
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
            duration: minutes * 60 // แปลงเป็นวินาที
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

        if (formData.is_active) {
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
            const response = await fetch(`${API_URL}/items-bank`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                const data = await response.json();

                await Swal.fire({
                    title: 'สำเร็จ!',
                    text: 'สร้างชุดข้อสอบสำเร็จ',
                    icon: 'success',
                    confirmButtonColor: '#22c55e'
                });

                // Redirect to item bank list
                router.push('/admin/manage_examset');
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
            is_active: true,
            category_ids: []
        });
    };

    return (
        <>
            <Navbar_admin>
                <div className="min-h-screen bg-gray-50 py-8">
                    <div className="container mx-auto px-4 max-w-4xl">


                        {/* Header */}
                        <div className="mb-8">
                            <h1 className="text-3xl font-medium text-gray-900 mb-2">สร้างชุดข้อสอบใหม่</h1>
                            <p className="text-gray-600">กรอกข้อมูลเพื่อสร้างชุดข้อสอบใหม่</p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8">
                            {/* ชื่อชุดข้อสอบ */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ชื่อชุดข้อสอบ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="bank_name"
                                    value={formData.bank_name}
                                    onChange={handleInputChange}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    placeholder="เช่น MCQ ปี 2567 ชุดที่ 1"
                                    required
                                />
                            </div>

                            {/* คำอธิบาย */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    คำอธิบาย
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    rows={4}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                                    placeholder="รายละเอียดของชุดข้อสอบ..."
                                />
                            </div>

                            {/* ระยะเวลา */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ระยะเวลาในการทำข้อสอบ (นาที) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    value={formData.duration / 60}
                                    onChange={handleDurationChange}
                                    min="1"
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                    placeholder="60"
                                    required
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    ระยะเวลาปัจจุบัน: {Math.floor(formData.duration / 60)} นาที ({formData.duration} วินาที)
                                </p>
                            </div>

                            {/* ประเภทข้อสอบ */}
                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    ประเภทข้อสอบ
                                </label>
                                {loadingCategories ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {[1, 2, 3, 4].map((i) => (
                                            <div key={i} className="h-12 w-full animate-pulse rounded-lg bg-gray-200" />
                                        ))}
                                    </div>
                                ) : categories.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {categories.map((category) => (
                                            <label
                                                key={category.category_id}
                                                className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${formData.category_ids.includes(category.category_id)
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                    }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={formData.category_ids.includes(category.category_id)}
                                                    onChange={() => handleCategoryToggle(category.category_id)}
                                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
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

                            {/* สถานะ */}
                            <div className="mb-8">
                                <label className="flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="is_active"
                                        checked={formData.is_active}
                                        onChange={handleInputChange}
                                        className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    />
                                    <span className="ml-3 text-sm font-medium text-gray-700">
                                        เปิดใช้งานชุดข้อสอบนี้
                                    </span>
                                </label>
                                <p className="text-sm text-gray-500 mt-1 ml-8">
                                    {formData.is_active
                                        ? 'ผู้ใช้สามารถเห็นและทำข้อสอบนี้ได้'
                                        : 'ชุดข้อสอบนี้จะถูกซ่อนจากผู้ใช้'}
                                </p>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    disabled={loading}
                                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <X className="w-5 h-5" />
                                    ล้างข้อมูล
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Navbar_admin>
        </>
    );
}

export default CreateItemBank;