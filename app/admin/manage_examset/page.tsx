"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect } from "react";
import { Plus, Search, ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";
import Link from "next/link";
import CreateItemBankModal from "./components/CreateItemBankModal";
import { useAuth } from "@/contexts/AuthContext";

// Types
interface Category {
  category_id: number;
  category_name: string;
  category_description: string;
}

interface ItemBank {
  item_bank_id: number;
  bank_name: string;
  description: string;
  duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  categories?: Category[];
}

interface PageButtonProps {
  page: number;
  isActive: boolean;
  setCurrentPage: (page: number) => void;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;
const ITEMS_PER_PAGE = 5;

function Page() {
  const { getToken } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemBanks, setItemBanks] = useState<ItemBank[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [showCreateModal, setShowCreateModal] = useState(false); // desc = newest first

  // Fetch item banks
  useEffect(() => {
    fetchItemBanks();
  }, []);

  // Reset to first page when searching or sorting
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortOrder]);

  const fetchItemBanks = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch(`${API_URL}/items-bank`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setItemBanks(data);
      } else {
        console.error('Failed to fetch item banks');
        // alert('ไม่สามารถดึงข้อมูลคลังข้อสอบได้');
      }
    } catch (error) {
      console.error('Error fetching item banks:', error);
      // alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear() + 543; // Convert to Buddhist year
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} - ${hours}:${minutes}`;
  };

  // Format duration from seconds to hours/minutes
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
      return `${hours} ชั่วโมง ${minutes} นาที`;
    } else if (hours > 0) {
      return `${hours} ชั่วโมง`;
    } else {
      return `${minutes} นาที`;
    }
  };

  // Filter and Sort item banks based on search term and date
  const filteredItemBanks = itemBanks
    .filter(bank =>
      bank.bank_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bank.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  // Pagination logic
  const totalPages = Math.ceil(filteredItemBanks.length / ITEMS_PER_PAGE);
  const currentItems = filteredItemBanks.slice(
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
        {/* Previous Button */}
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

        {/* Page Numbers */}
        {pages.map((page) => (
          <PageButton
            key={page}
            page={page}
            isActive={page === currentPage}
            setCurrentPage={setCurrentPage}
          />
        ))}

        {/* Next Button */}
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
                คลังข้อสอบ
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                จัดการคลังข้อสอบ เพิ่ม แก้ไข ลบ
              </p>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              suppressHydrationWarning
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              สร้างข้อสอบใหม่
            </button>
          </div>
        </div>

        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative w-full max-w-sm">
            <input
              type="text"
              placeholder="ค้นหาข้อสอบ"
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
                    <th scope="col" className="px-6 py-3 text-center text-xs font-medium  tracking-wider w-16 rounded-tl-xl">ลำดับ</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider">ชื่อข้อสอบ</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider w-32">ระยะเวลา</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider w-32">สถานะ</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider w-40">วัน-เวลาที่สร้าง</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider w-40">ประเภทข้อสอบ</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium tracking-wider w-20 rounded-tr-xl">จัดการ</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                        {searchTerm ? 'ไม่พบข้อมูลที่ค้นหา' : 'ยังไม่มีคลังข้อสอบ'}
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((bank, index) => {
                      const categoryNames = bank.categories && bank.categories.length > 0
                        ? bank.categories.map(cat => cat.category_name).join(', ')
                        : 'ไม่มีประเภทข้อสอบ';

                      return (
                        <tr key={`bank-${bank.item_bank_id}-${index}`} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 w-16 text-center">
                            {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{bank.bank_name}</div>
                            <div className="text-xs text-gray-500 mt-0.5 max-w-xs truncate" title={bank.description}>
                              {bank.description.length > 10
                                ? `${bank.description.substring(0, 10)}...`
                                : bank.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-32">{formatDuration(bank.duration)}</td>
                          <td className="px-6 py-4 whitespace-nowrap w-32">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bank.is_active
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                              }`}>
                              {bank.is_active ? 'เปิดให้ทำข้อสอบ' : 'ปิดการใช้งาน'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-40">{formatDate(bank.created_at)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 w-40">
                            {categoryNames}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium w-20">
                            <Link href={`/admin/manage_examset/${bank.item_bank_id}`} className="text-blue-600 hover:text-blue-900 text-sm">ดูรายละเอียด</Link>
                          </td>
                        </tr>
                      );
                    })
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

      <CreateItemBankModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchItemBanks}
      />
    </Navbar_admin>
  );
}

export default Page;