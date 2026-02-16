"use client"
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Navbar_admin from "@/components/Navbar_admin";
import Footer from "@/components/Footer";
import Swal from 'sweetalert2';
import { Loader2, Save, ChevronRight, Trash2, ArrowLeft } from 'lucide-react';

// Types
interface Category {
    category_id: number;
    category_name: string;
    description?: string;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function ItemBankSettingsPage() {
    const router = useRouter();
    const params = useParams();
    // Use item_bank_id from the [item_bank_id] folder structure
    const id = params.item_bank_id as string;

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
        if (id) {
            fetchData();
        }
    }, [id]);

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
            router.push('/admin/manage_examset');
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
        const response = await fetch(`${API_URL}/items-bank/${id}`, {
            credentials: 'include'
        });

        if (!response.ok) {
            throw new Error('Failed to fetch item bank');
        }

        const data = await response.json();

        // แปลงข้อมูลที่ได้ให้ตรงกับ Form Structure
        setFormData({
            bank_name: data.bank_name,
            description: data.description || '',
            duration: parseInt(data.duration) || 3600, // แปลงเป็น Int ทันทีที่รับมา
            is_active: data.is_active,
            // ถ้า backend ส่ง categories มาเป็น array ของ object
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

        // สร้าง Payload ใหม่ที่แปลงค่าให้ถูกต้องแน่นอน
        const payload = {
            ...formData,
            duration: Number(formData.duration) // แปลงเป็น Number อย่างชัดเจน
        };

        try {
            const response = await fetch(`${API_URL}/items-bank/${id}`, {
                method: 'PATCH', // ใช้ PATCH สำหรับการแก้ไข
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

                // redirect กลับไปหน้าจัดการข้อสอบ
                router.push(`/admin/manage_examset/${id}`);
                router.refresh();
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
                const response = await fetch(`${API_URL}/items-bank/${id}`, {
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

    if (fetching) {
        return (
            <Navbar_admin>
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                </div>
            </Navbar_admin>
        );
    }

    return (
        <Navbar_admin>
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="flex justify-between items-start mb-8">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-2">ตั้งค่าชุดข้อสอบ</h1>
                            <p className="text-gray-600">แก้ไขข้อมูลพื้นฐานของชุดข้อสอบ</p>
                        </div>
                        <button
                            onClick={handleDelete}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 border border-red-200"
                        >
                            <Trash2 className="w-5 h-5" />
                            ลบชุดข้อสอบ
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
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

                        {/* ประเภทข้อสอบ */}
                        <div className="mb-6">
                            <label className="block text-sm font-semibold text-gray-700 mb-3">
                                ประเภทข้อสอบ
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {categories.map((category) => (
                                    <label
                                        key={category.category_id}
                                        className={`flex items-center p-4 border rounded-lg cursor-pointer transition ${formData.category_ids.includes(category.category_id)
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
                                        <span className="ml-3 font-medium text-gray-900">
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
                                onClick={() => router.back()}
                                className="px-6 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-5 h-5 animate-spin" />
                                        กำลังบันทึก...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5" />
                                        บันทึกการเปลี่ยนแปลง
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Navbar_admin>
    );
}
