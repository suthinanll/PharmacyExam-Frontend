'use client';

import React, { useState, useEffect } from 'react';
import Navbar_admin from "@/components/Navbar_admin";
import { Plus, Search, ChevronLeft, ChevronRight, ArrowUpDown, Edit, Trash2, X, Loader2 } from 'lucide-react';
import Swal from 'sweetalert2';
import { useAuth } from "@/contexts/AuthContext";

// Types
interface Category {
    category_id: number;
    category_name: string;
    category_description: string;
    created_at: string;
    updated_at: string;
}

interface PageButtonProps {
    page: number;
    isActive: boolean;
    setCurrentPage: (page: number) => void;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}/categories`;
const ITEMS_PER_PAGE = 10;

export default function CategoriesManagement() {
    const { getToken } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(null);
    const [categoryName, setCategoryName] = useState('');
    const [categoryDescription, setCategoryDescription] = useState('');
    const [submitting, setSubmitting] = useState(false);

    // Fetch categories
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const response = await fetch(API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });
            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                setCategories(data);
            } else {
                console.error('Received non-array data:', data);
                setCategories([]);
            }
        } catch (error) {
            console.error('Error fetching categories:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถดึงข้อมูลได้',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    // Reset to first page when searching or sorting
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortOrder]);

    // Delete category
    const handleDelete = async (categoryId: number, categoryName: string) => {
        const result = await Swal.fire({
            title: 'คุณแน่ใจหรือไม่?',
            text: `ต้องการลบประเภทข้อสอบ "${categoryName}" หรือไม่?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: 'ใช่, ลบเลย!',
            cancelButtonText: 'ยกเลิก',
            reverseButtons: true
        });

        if (!result.isConfirmed) return;

        try {
            const token = getToken();
            const response = await fetch(`${API_URL}/${categoryId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (response.ok) {
                await Swal.fire({
                    title: 'สำเร็จ!',
                    text: 'ลบประเภทข้อสอบสำเร็จ',
                    icon: 'success',
                    confirmButtonColor: '#22c55e'
                });
                fetchCategories();
            } else {
                throw new Error('ไม่สามารถลบได้');
            }
        } catch (error) {
            console.error('Error deleting category:', error);
            Swal.fire({
                title: 'เกิดข้อผิดพลาด',
                text: 'เกิดข้อผิดพลาดในการลบ',
                icon: 'error',
                confirmButtonColor: '#ef4444'
            });
        }
    };

    // Modal handlers
    const handleCreateCategory = () => {
        setEditingCategory(null);
        setCategoryName('');
        setCategoryDescription('');
        setShowModal(true);
    };

    const handleEditCategory = (category: Category) => {
        setEditingCategory(category);
        setCategoryName(category.category_name);
        setCategoryDescription(category.category_description);
        setShowModal(true);
    };

    const submitCategory = async () => {
        if (!categoryName.trim()) {
            Swal.fire({
                icon: 'warning',
                title: 'กรุณากรอกข้อมูล',
                text: 'กรุณากรอกชื่อประเภทข้อสอบ'
            });
            return;
        }

        setSubmitting(true);
        try {
            // Note logic below: we're creating or updating, and url/id changes accordingly.
            const url = editingCategory
                ? `${API_URL}/${editingCategory.category_id}`
                : API_URL;

            const method = editingCategory ? 'PATCH' : 'POST';

            const token = getToken();
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include',
                body: JSON.stringify({
                    category_name: categoryName,
                    category_description: categoryDescription
                })
            });

            if (response.ok) {
                await Swal.fire({
                    icon: 'success',
                    title: 'สำเร็จ!',
                    text: editingCategory ? 'แก้ไขประเภทข้อสอบเรียบร้อย' : 'สร้างประเภทข้อสอบเรียบร้อย',
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowModal(false);
                fetchCategories();
            } else {
                throw new Error('Failed to save category');
            }
        } catch (error) {
            console.error('Error saving category:', error);
            Swal.fire({
                icon: 'error',
                title: 'เกิดข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกประเภทข้อสอบได้'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear() + 543;
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} - ${hours}:${minutes}`;
    };

    // Filter and Sort categories
    const filteredCategories = categories
        .filter(cat =>
            cat.category_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cat.category_description.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            const dateA = new Date(a.created_at).getTime();
            const dateB = new Date(b.created_at).getTime();
            return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
        });

    // Pagination logic
    const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
    const currentItems = filteredCategories.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const Pagination = () => {
        if (totalPages <= 1) return null;

        const pages = Array.from({ length: totalPages }, (_, i) => i + 1);

        const PageButton = ({ page, isActive, setCurrentPage }: PageButtonProps) => (
            <button
                className={`w-10 h-10 flex items-center justify-center text-sm font-medium border rounded-lg transition-colors ${isActive
                    ? "bg-green-600 text-white border-green-600"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                    }`}
                onClick={() => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
            >
                {page}
            </button>
        );

        return (
            <div className="flex items-center justify-end space-x-2 mt-6">
                <button
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    disabled={currentPage === 1}
                    onClick={() => {
                        setCurrentPage(currentPage - 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                {pages.map((page) => (
                    <PageButton
                        key={page}
                        page={page}
                        isActive={page === currentPage}
                        setCurrentPage={setCurrentPage}
                    />
                ))}

                <button
                    className="w-10 h-10 flex items-center justify-center border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    disabled={currentPage === totalPages}
                    onClick={() => {
                        setCurrentPage(currentPage + 1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
        );
    };

    return (
        <Navbar_admin>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4" suppressHydrationWarning>
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">
                                จัดการประเภทข้อสอบ
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600">
                                จัดการประเภทข้อสอบ เพิ่ม แก้ไข ลบ
                            </p>
                        </div>

                        <button
                            onClick={handleCreateCategory}
                            suppressHydrationWarning
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            เพิ่มประเภทข้อสอบใหม่
                        </button>
                    </div>
                </div>

                {/* Search and Sort */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <input
                            type="text"
                            placeholder="ค้นหาประเภทข้อสอบ"
                            value={searchTerm}
                            suppressHydrationWarning
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>

                    <button
                        onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
                        suppressHydrationWarning
                        className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm font-medium"
                    >
                        <ArrowUpDown className="w-4 h-4" />
                        เรียงตามวันที่: {sortOrder === "desc" ? "ใหม่สุด" : "เก่าสุด"}
                    </button>
                </div>

                {/* Table */}
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
                            <p className="text-gray-600">กำลังโหลดข้อมูล...</p>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-green-600 text-white">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium tracking-wider w-16 rounded-tl-xl">ลำดับ</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider">ชื่อประเภทข้อสอบ</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider">คำอธิบาย</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider w-40">วัน-เวลาที่สร้าง</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium tracking-wider w-32 rounded-tr-xl">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                {searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีประเภทข้อสอบ'}
                                            </td>
                                        </tr>
                                    ) : (
                                        currentItems.map((category, index) => (
                                            <tr key={category.category_id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-16 text-center">
                                                    {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{category.category_name}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-sm text-gray-500 max-w-md">
                                                        {category.category_description}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-40">
                                                    {formatDate(category.created_at)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium w-32">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEditCategory(category)}
                                                            className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded transition-colors"
                                                            title="แก้ไข"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(category.category_id, category.category_name)}
                                                            className="text-red-600 hover:text-red-900 p-1.5 hover:bg-red-50 rounded transition-colors"
                                                            title="ลบ"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Section */}
                        <div className="p-4 border-t border-gray-200">
                            <Pagination />
                        </div>
                    </div>
                )}
                {/* Category Modal */}
                {showModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
                            <div className="bg-green-600 px-4 sm:px-6 py-3 sm:py-4 rounded-t-xl flex items-center justify-between">
                                <h3 className="text-lg sm:text-xl font-bold text-white">
                                    {editingCategory ? 'แก้ไขประเภทข้อสอบ' : 'เพิ่มประเภทข้อสอบใหม่'}
                                </h3>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                                >
                                    <X className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                                </button>
                            </div>
                            <div className="p-4 sm:p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        ชื่อประเภทข้อสอบ <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={categoryName}
                                        onChange={(e) => setCategoryName(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                                        placeholder="เช่น ระบบประสาท"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        คำอธิบาย
                                    </label>
                                    <textarea
                                        value={categoryDescription}
                                        onChange={(e) => setCategoryDescription(e.target.value)}
                                        className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-sm sm:text-base"
                                        rows={3}
                                        placeholder="อธิบายเกี่ยวกับประเภทข้อสอบนี้"
                                    />
                                </div>
                            </div>
                            <div className="px-4 sm:px-6 py-3 sm:py-4 bg-gray-50 rounded-b-xl flex justify-end gap-3">
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-colors text-sm sm:text-base"
                                    disabled={submitting}
                                >
                                    ยกเลิก
                                </button>
                                <button
                                    onClick={submitCategory}
                                    className="px-4 sm:px-5 py-2 sm:py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium flex items-center gap-2 transition-colors disabled:opacity-50 text-sm sm:text-base"
                                    disabled={submitting}
                                >
                                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {submitting ? 'กำลังบันทึก...' : 'บันทึก'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Navbar_admin>
    );
}
