/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import Navbar_user from "@/components/Navbar_user"
import NavbarGuest from "@/components/Navbar_guest"
import Footer from "@/components/Footer"
import SearchBar from "@/components/SearchBar"
import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Loader2, BookOpen, Clock, ArrowUpDown } from "lucide-react"
import Swal from "@/utils/sweetalert"
import { useAuth } from '@/contexts/AuthContext'
import { useRequireLogin } from '@/utils/requireAuth'
import LoadingSpinner from "@/components/LoadingSpinner"
import Pagination from "@/components/Pagination"

// Types
interface Category {
  category_id: number;
  category_name: string;
  description?: string;
}

interface ItemBank {
  item_bank_id: number;
  bank_name: string;
  description: string;
  duration: number;
  is_active: boolean;
  total_items?: number;
  categories?: Category[];
}

const sortByName = (banks: ItemBank[], order: "name_asc" | "name_desc") =>
  [...banks].sort((a, b) => {
    const nameA = a.bank_name || "";
    const nameB = b.bank_name || "";
    return order === "name_asc"
      ? nameA.localeCompare(nameB, "th", { numeric: true, sensitivity: "base" })
      : nameB.localeCompare(nameA, "th", { numeric: true, sensitivity: "base" });
  });

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

/**
 * initialCategories / initialBanks = ข้อมูลที่เซิร์ฟเวอร์ดึงมาให้แล้ว
 * GET /categories และ GET /items-bank เป็น @Public() จึงดึงฝั่งเซิร์ฟเวอร์ได้
 *
 * องค์ประกอบ LCP ของหน้านี้คือชื่อชุดข้อสอบในการ์ดใบแรก ไม่ใช่หัวข้อของหน้า
 * (ชื่อชุดยาวกว่าจึงกินพื้นที่มากกว่า) การย้ายหัวข้อออกมานอกสถานะโหลดอย่างเดียว
 * จึงไม่พอ ต้องให้รายการชุดข้อสอบอยู่ใน HTML ตั้งแต่แรกด้วย
 */
const ExamsetClient = ({
  initialCategories,
  initialBanks,
}: {
  initialCategories: Category[] | null;
  initialBanks: ItemBank[] | null;
}) => {
  const router = useRouter();
  const { getToken, isAuthenticated } = useAuth();
  const { requireLogin } = useRequireLogin();
  const [categories, setCategories] = useState<Category[]>(initialCategories ?? []);
  const [itemBanks, setItemBanks] = useState<ItemBank[]>(initialBanks ?? []);
  // เริ่มด้วยผลลัพธ์ที่กรอง/เรียงแล้วของข้อมูลจากเซิร์ฟเวอร์ ไม่งั้นการ์ดจะไม่อยู่ใน HTML
  // แรกและ LCP (ชื่อชุดข้อสอบใบแรก) จะยังต้องรอ hydrate เหมือนเดิม
  const [filteredBanks, setFilteredBanks] = useState<ItemBank[]>(
    initialBanks ? sortByName(initialBanks, "name_asc") : [],
  );
  const [searchResults, setSearchResults] = useState<ItemBank[] | null>(null);
  const [activeTab, setActiveTab] = useState<number | "all">("all");
  const [loading, setLoading] = useState(initialBanks === null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [startingExam, setStartingExam] = useState<number | null>(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc">("name_asc");
  const perPage = 10;

  // Fetch data on mount
  useEffect(() => {
    fetchData();
  }, []);

  // Filter when tab or search changes
  useEffect(() => {
    filterExams();
    setCurrentPage(1);
  }, [activeTab, searchQuery, itemBanks, searchResults, sortBy]);

  const fetchData = async () => {
    try {
      await Promise.all([
        fetchCategories(),
        fetchItemBanks()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/categories`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchItemBanks = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/items-bank`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter only active item banks
        const activeBanks = data.filter((bank: ItemBank) => bank.is_active);
        setItemBanks(activeBanks);
      }
    } catch (error) {
      console.error('Error fetching item banks:', error);
    }
  };

  const filterExams = () => {
    let baseData = searchQuery.trim() && searchResults !== null ? searchResults : itemBanks;
    let filtered = [...baseData];

    // Filter by category
    if (activeTab !== "all") {
      filtered = filtered.filter(bank =>
        bank.categories?.some(cat => cat.category_id === activeTab)
      );
    }

    // Sort by name using natural numeric comparison (e.g. Chapter 1, Chapter 2, ..., Chapter 10)
    setFilteredBanks(sortByName(filtered, sortBy));
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    setSearching(true);
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/items-bank/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      } else {
        console.error('Search failed');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Error during search:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours} ชั่วโมง ${minutes > 0 ? `${minutes} นาที` : ''}`;
    }
    return `${minutes} นาที`;
  };

  const handleStartExam = async (itemBankId: number, bankName: string) => {
    // Guest: ต้อง login ก่อนถึงเริ่มทำข้อสอบได้
    if (!isAuthenticated) {
      requireLogin('เริ่มทำข้อสอบ');
      return;
    }

    const result = await Swal.fire({
      title: 'เริ่มทำข้อสอบ',
      html: `คุณต้องการเริ่มทำข้อสอบ<br/><strong>${bankName}</strong><br/>ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#155DFC',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'เริ่มทำข้อสอบ',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    setStartingExam(itemBankId);

    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/items-bank/exam/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          item_bank_id: itemBankId
        })
      });

      // ตรวจสอบ response
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Server error:', errorData);
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();

      // ถ้ามี session เดิมอยู่แล้ว แจ้งเตือน
      if (data.is_existing) {
        const continueResult = await Swal.fire({
          title: 'พบข้อสอบที่ยังไม่เสร็จ',
          text: 'คุณมีข้อสอบชุดนี้ที่กำลังทำค้างอยู่ ต้องการทำต่อหรือไม่?',
          icon: 'info',
          showCancelButton: true,
          showDenyButton: true,
          confirmButtonColor: '#5EA500',
          denyButtonColor: '#ef4444',
          cancelButtonColor: '#6b7280',
          confirmButtonText: 'ทำต่อ',
          denyButtonText: 'เริ่มทำใหม่ตั้งแต่ต้น',
          cancelButtonText: 'ปิด',
          reverseButtons: true
        });

        if (continueResult.isConfirmed) {
          sessionStorage.setItem('active_exam_session', JSON.stringify({
            session_id: data.session_id,
            item_bank_id: itemBankId
          }));
          router.push('/user/examset/take-exam');
          return;
        } else if (continueResult.isDenied) {
          // ยกเลิก session เดิมแล้วสร้าง session ใหม่และเข้าหน้าสอบทันที
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/items-bank/exam/${data.session_id}/cancel`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          localStorage.removeItem(`exam_answers_${data.session_id}`);
          localStorage.removeItem(`exam_flags_${data.session_id}`);
          localStorage.removeItem(`exam_start_time_${data.session_id}`);

          const newRes = await fetch(`${API_URL}/items-bank/exam/start`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              item_bank_id: itemBankId
            })
          });

          if (!newRes.ok) {
            const err = await newRes.json().catch(() => ({}));
            throw new Error(err.message || 'ไม่สามารถเริ่มข้อสอบใหม่ได้');
          }

          const newData = await newRes.json();
          sessionStorage.setItem('active_exam_session', JSON.stringify({
            session_id: newData.session_id,
            item_bank_id: itemBankId
          }));
          router.push('/user/examset/take-exam');
          return;
        } else {
          setStartingExam(null);
          return;
        }
      }

      // Redirect to exam page with clean URL
      sessionStorage.setItem('active_exam_session', JSON.stringify({
        session_id: data.session_id,
        item_bank_id: itemBankId
      }));
      router.push('/user/examset/take-exam');

    } catch (error) {
      console.error('Error starting exam:', error);

      Swal.fire({
        title: 'เกิดข้อผิดพลาด',
        text: error instanceof Error ? error.message : 'ไม่สามารถเริ่มทำข้อสอบได้ กรุณาลองใหม่อีกครั้ง',
        icon: 'error',
        confirmButtonColor: '#3b82f6'
      });
    } finally {
      setStartingExam(null);
    }
  };

  /**
   * ส่วนหัวของหน้า แยกออกมาเพื่อให้แสดงได้ทันทีตั้งแต่ยังโหลดข้อมูลไม่เสร็จ
   *
   * เดิมทั้งหน้าถูกแทนด้วย spinner ระหว่างโหลด หัวข้อจึงปรากฏหลังจากดาวน์โหลด JS
   * ครบ hydrate เสร็จ และ fetch จบ ซึ่งบนมือถือกินเวลาอีก 2.4 วินาทีหลัง FCP
   * (Lighthouse วัดได้ FCP 1.4 วินาที แต่ LCP 3.8 วินาที) ทั้งที่เป็นข้อความคงที่
   */
  const PageHeader = () => (
    <>
      {/* Breadcrumb */}
      <div className="flex items-center text-sm text-gray-500 mb-5">
        <Link href={isAuthenticated ? "/user" : "/"} className="hover:text-green-600 cursor-pointer transition">
          หน้าหลัก
        </Link>
        <span className="mx-2">›</span>
        <span className="text-gray-600 font-medium">คลังข้อสอบ</span>
      </div>

      <h1 className="text-3xl font-medium text-gray-800 mb-4">คลังข้อสอบ</h1>
    </>
  );

  if (loading) {
    return (
      <>
        {isAuthenticated ? <Navbar_user /> : <NavbarGuest />}
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <PageHeader />
            <div className="pt-8">
              <LoadingSpinner size="lg" text="กำลังโหลดคลังข้อสอบ..." />
            </div>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      {isAuthenticated ? <Navbar_user /> : <NavbarGuest />}
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <PageHeader />

          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
              <div className="flex-1">
                <SearchBar
                  onSearch={handleSearch}
                  suggestions={[...itemBanks.map((b) => b.bank_name), ...categories.map((c) => c.category_name)]}
                />
              </div>
              {/* Sort Selector */}
              <div className="relative min-w-[170px]">
                <select
                  value={sortBy}
                  aria-label="เรียงลำดับคลังข้อสอบ"
                  onChange={e => setSortBy(e.target.value as any)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-xl px-3.5 py-2 pr-8 text-xs sm:text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs cursor-pointer"
                >
                  <option value="name_asc">เรียงจาก ก-ฮ (A-Z)</option>
                  <option value="name_desc">เรียงจาก ฮ-ก (Z-A)</option>
                </select>
                <ArrowUpDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 border-b border-gray-200">
              <button
                onClick={() => setActiveTab("all")}
                className={`px-6 py-3 font-medium transition-colors rounded-t-lg ${activeTab === "all"
                  ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                  : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                  }`}
              >
                ทั้งหมด ({itemBanks.length})
              </button>
              {categories.map((category) => {
                const count = itemBanks.filter(bank =>
                  bank.categories?.some(cat => cat.category_id === category.category_id)
                ).length;

                return (
                  <button
                    key={category.category_id}
                    onClick={() => setActiveTab(category.category_id)}
                    className={`px-6 py-3 font-medium transition-colors rounded-t-lg ${activeTab === category.category_id
                      ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50"
                      : "text-gray-600 hover:text-gray-800 hover:bg-gray-50"
                      }`}
                  >
                    {category.category_name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Results Info */}
          {searchQuery && (
            <div className="mb-4 text-gray-600">
              ผลการค้นหา "{searchQuery}": พบ {filteredBanks.length} รายการ
            </div>
          )}

          {/* Exam List */}
          <div className="space-y-4">
            {searching ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-3">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
                    <div className="h-10 w-full animate-pulse rounded-xl bg-gray-200" />
                  </div>
                ))}
              </div>
            ) : (
              (() => {
                const totalPages = Math.ceil(filteredBanks.length / perPage);
                const startIndex = (currentPage - 1) * perPage;
                const currentBanks = filteredBanks.slice(startIndex, startIndex + perPage);

                return (
                  <>
                    {currentBanks.map((bank) => (
                      <div
                        key={bank.item_bank_id}
                        className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-gray-100 hover:border-blue-200"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-start gap-3 mb-3">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <BookOpen className="w-6 h-6 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <h2 className="text-xl font-medium text-gray-800 mb-2">
                                  {bank.bank_name}
                                </h2>
                                <p className="text-gray-600 text-sm mb-3">
                                  {bank.description}
                                </p>

                                {/* Categories Tags */}
                                {bank.categories && bank.categories.length > 0 && (
                                  <div className="flex flex-wrap gap-2 mb-3">
                                    {bank.categories.map((cat) => (
                                      <span
                                        key={cat.category_id}
                                        className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700"
                                      >
                                        {cat.category_name}
                                      </span>
                                    ))}
                                  </div>
                                )}

                                {/* Info */}
                                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <BookOpen className="w-4 h-4" />
                                    <span>
                                      {bank.total_items ? `${bank.total_items} ข้อ` : 'ไม่ระบุจำนวน'}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    <span>{formatDuration(bank.duration)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleStartExam(bank.item_bank_id, bank.bank_name)}
                            disabled={startingExam === bank.item_bank_id}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-medium px-8 py-3 rounded-xl transition-all duration-300 w-full lg:w-auto text-center active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                          >
                            {startingExam === bank.item_bank_id ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                กำลังเริ่ม...
                              </>
                            ) : (
                              'เริ่มทำข้อสอบ'
                            )}
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {filteredBanks.length > 0 && (
                      <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalItems={filteredBanks.length}
                        perPage={perPage}
                        onPageChange={setCurrentPage}
                        itemLabel="ชุดข้อสอบ"
                        activeColor="bg-primary text-white shadow-xs"
                      />
                    )}
                  </>
                );
              })()
            )}
          </div>

          {/* Empty State */}
          {filteredBanks.length === 0 && (
            <div className="text-center py-16 bg-white rounded-xl shadow-sm">
              <div className="max-w-md mx-auto">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BookOpen className="w-12 h-12 text-gray-600" />
                </div>
                <h2 className="text-xl font-medium text-gray-700 mb-2">
                  {searchQuery ? 'ไม่พบข้อสอบที่ค้นหา' : 'ไม่มีข้อสอบในหมวดนี้'}
                </h2>
                <p className="text-gray-500">
                  {searchQuery
                    ? 'ลองค้นหาด้วยคำอื่น หรือเลือกประเภทข้อสอบอื่น'
                    : 'ยังไม่มีข้อสอบในประเภทนี้ในขณะนี้'
                  }
                </p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults(null);
                    }}
                    className="mt-4 text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    ล้างการค้นหา
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}

export default ExamsetClient