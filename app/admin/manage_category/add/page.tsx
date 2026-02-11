"use client"
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar_admin from "@/components/Navbar_admin";
import Swal from 'sweetalert2';
import { Loader2, Save, X } from 'lucide-react';

const API_URL = 'http://localhost:5000/categories';

export default function AddCategory() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        category_name: '',
        category_description: ''
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!formData.category_name.trim()) {
            Swal.fire({
                title: 'กรุณากรอกข้อมูล',
                text: 'กรุณากรอกชื่อประเภทข้อสอบ',
                icon: 'warning',
                confirmButtonColor: '#3b82f6'
            });
            return;
        }

        if (!formData.category_description.trim()) {
            Swal.fire({
                title: 'กรุณากรอกข้อมูล',
                text: 'กรุณากรอกคำอธิบาย',
                icon: 'warning',
                confirmButtonColor: '#3b82f6'
            });
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await Swal.fire({
                    title: 'สำเร็จ!',
                    text: 'สร้างประเภทข้อสอบสำเร็จ',
                    icon: 'success',
                    confirmButtonColor: '#22c55e'
                });

                // Redirect to category list
                router.push('/admin/manage_category');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'ไม่สามารถสร้างประเภทข้อสอบได้');
            }
        } catch (error: any) {
            console.error('Error creating category:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถสร้างประเภทข้อสอบได้ กรุณาลองใหม่อีกครั้ง',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        setFormData({
            category_name: '',
            category_description: ''
        });
    };

    return (
        <Navbar_admin>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">เพิ่มประเภทข้อสอบใหม่</h1>
                        <p className="text-gray-600">กรอกข้อมูลเพื่อสร้างประเภทข้อสอบใหม่</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8">
                        {/* ชื่อประเภทข้อสอบ */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                ชื่อประเภทข้อสอบ <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                name="category_name"
                                value={formData.category_name}
                                onChange={handleInputChange}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                                placeholder="เช่น เภสัชกรรมคลินิก"
                                required
                            />
                        </div>

                        {/* คำอธิบาย */}
                        <div className="mb-8">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                คำอธิบาย <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                name="category_description"
                                value={formData.category_description}
                                onChange={handleInputChange}
                                rows={4}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-none"
                                placeholder="รายละเอียดของประเภทข้อสอบ..."
                                required
                            />
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        กำลังสร้าง...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        สร้างประเภทข้อสอบ
                                    </>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                disabled={loading}
                                className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <X className="w-5 h-5" />
                                ล้างข้อมูล
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Navbar_admin>
    );
}
