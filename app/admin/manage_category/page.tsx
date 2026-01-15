'use client';

import React, { useState, useEffect } from 'react';
import Navbar_admin from "@/components/Navbar_admin";
import { Plus, Search, ChevronLeft, ChevronRight, ArrowUpDown, Edit, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

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

const API_URL = 'http://localhost:5000/categories';
const ITEMS_PER_PAGE = 10;

export default function CategoriesManagement() {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");

    // Fetch categories
    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await fetch(API_URL, {
                credentials: 'include'
            });
            const data = await response.json();
            setCategories(data);
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
            text: `ต้องการลบหมวดหมู่ "${categoryName}" หรือไม่?`,
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
            const response = await fetch(`${API_URL}/${categoryId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                await Swal.fire({
                    title: 'สำเร็จ!',
                    text: 'ลบหมวดหมู่สำเร็จ',
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
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                {/* Header Section */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">
                                จัดการหมวดหมู่
                            </h1>
                            <p className="text-sm sm:text-base text-gray-600">
                                จัดการหมวดหมู่ เพิ่ม แก้ไข ลบ
                            </p>
                        </div>

                        <a
                            href="/admin/manage_category/add"
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm whitespace-nowrap"
                        >
                            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                            เพิ่มหมวดหมู่ใหม่
                        </a>
                    </div>
                </div>

                {/* Search and Sort */}
                <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative w-full max-w-sm">
                        <input
                            type="text"
                            placeholder="ค้นหาหมวดหมู่"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-sm"
                        />
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    </div>

                    <button
                        onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
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
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider">ชื่อหมวดหมู่</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider">คำอธิบาย</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider w-40">วัน-เวลาที่สร้าง</th>
                                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium tracking-wider w-32 rounded-tr-xl">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {currentItems.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                {searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีหมวดหมู่'}
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
                                                        <a
                                                            href={`/admin/manage_category/${category.category_id}`}
                                                            className="text-blue-600 hover:text-blue-900 p-1.5 hover:bg-blue-50 rounded transition-colors"
                                                            title="แก้ไข"
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </a>
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
            </div>
        </Navbar_admin>
    );
}
