"use client"
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Navbar_admin from "@/components/Navbar_admin";
import Swal from 'sweetalert2';
import { Loader2, Save, X, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/categories`;

interface Category {
    category_id: number;
    category_name: string;
    category_description: string;
    created_at: string;
    updated_at: string;
}

export default function EditCategory() {
    const router = useRouter();
    const params = useParams();
    const categoryId = params?.id as string;

    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [category, setCategory] = useState<Category | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        category_name: '',
        category_description: ''
    });

    useEffect(() => {
        if (categoryId) {
            fetchCategory();
        }
    }, [categoryId]);

    const fetchCategory = async () => {
        setFetching(true);
        try {
            const response = await fetch(`${API_URL}/${categoryId}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                setCategory(data);
                setFormData({
                    category_name: data.category_name,
                    category_description: data.category_description
                });
            } else {
                throw new Error('ไม่พบประเภทข้อสอบ');
            }
        } catch (error) {
            console.error('Error fetching category:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถโหลดข้อมูลประเภทข้อสอบได้',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            }).then(() => {
                router.push('/admin/manage_category');
            });
        } finally {
            setFetching(false);
        }
    };

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
            const response = await fetch(`${API_URL}/${categoryId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                await Swal.fire({
                    title: 'สำเร็จ!',
                    text: 'แก้ไขประเภทข้อสอบสำเร็จ',
                    icon: 'success',
                    confirmButtonColor: '#22c55e'
                });

                // Redirect to category list
                router.push('/admin/manage_category');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'ไม่สามารถแก้ไขประเภทข้อสอบได้');
            }
        } catch (error: any) {
            console.error('Error updating category:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: error.message || 'ไม่สามารถแก้ไขประเภทข้อสอบได้ กรุณาลองใหม่อีกครั้ง',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleReset = () => {
        if (category) {
            setFormData({
                category_name: category.category_name,
                category_description: category.category_description
            });
        }
    };

    if (fetching) {
        return (
            <Navbar_admin>
                <div className="min-h-screen bg-gray-50 py-8">
                    <div className="max-w-3xl mx-auto px-4 space-y-5">
                        <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-3 w-24 animate-pulse rounded bg-gray-200" />
                                    <div className="h-10 w-full animate-pulse rounded-lg bg-gray-200" />
                                </div>
                            ))}
                            <div className="h-10 w-32 animate-pulse rounded-xl bg-gray-300" />
                        </div>
                    </div>
                </div>
            </Navbar_admin>
        );
    }

    return (
        <Navbar_admin>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="container mx-auto px-4 max-w-4xl">
                    {/* Back Button */}
                    <Link
                        href="/admin/manage_category"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        กลับไปหน้ารายการ
                    </Link>

                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-medium text-gray-900 mb-2">แก้ไขประเภทข้อสอบ</h1>
                        <p className="text-gray-600">แก้ไขข้อมูลประเภทข้อสอบ</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-8">
                        {/* ชื่อประเภทข้อสอบ */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">
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

                        {/* Metadata */}
                        {category && (
                            <div className="mb-8 p-4 bg-gray-50 rounded-lg">
                                <h3 className="text-sm font-medium text-gray-700 mb-2">ข้อมูลเพิ่มเติม</h3>
                                <div className="text-xs text-gray-600 space-y-1">
                                    <p>สร้างเมื่อ: {new Date(category.created_at).toLocaleString('th-TH')}</p>
                                    <p>แก้ไขล่าสุด: {new Date(category.updated_at).toLocaleString('th-TH')}</p>
                                </div>
                            </div>
                        )}

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
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        บันทึกการแก้ไข
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
                                รีเซ็ต
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Navbar_admin>
    );
}
