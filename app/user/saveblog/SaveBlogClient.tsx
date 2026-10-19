"use client"
import { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '@/components/Navbar_user';
import Footer from '@/components/Footer';
import Search from '@/components/SearchBar';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Swal from '@/utils/sweetalert';
import { SWAL_COLORS } from '@/utils/swal';

export interface BookmarkItem {
  bookmark_id: number;
  created_at: string;
  news: {
    article_id: number;
    title: string;
    content: string;
    cover_image_url: string;
    category?: string;
  }
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_API_URL}`;
const FALLBACK_COVER = '/img/news1.jpg';

function coverUrl(url: string) {
  if (!url) return FALLBACK_COVER;
  return url.startsWith('http') ? url : `${API_BASE_URL}${url}`;
}

/**
 * รูปปกข่าว ให้ Next ย่อตามความกว้างจอและแปลงเป็น WebP
 *
 * เดิมใส่ unoptimized ไว้ รูปปกใบแรก (องค์ประกอบ LCP) จึงเป็นไฟล์ต้นฉบับ 219KB
 * ทั้งที่แสดงกว้างไม่เกิน 400px โฮสต์ที่ไม่อยู่ใน remotePatterns จะโหลดไม่ขึ้น
 * จึงสลับไปรูปสำรองแบบเดียวกับการ์ดข่าวหน้าแรก (components/News.tsx)
 */
function BookmarkCover({ src, alt, priority }: { src: string; alt: string; priority: boolean }) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <Image
      src={imgSrc}
      alt={alt}
      width={500}
      height={300}
      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 400px"
      priority={priority}
      onError={() => setImgSrc(FALLBACK_COVER)}
      className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
    />
  );
}

/**
 * initialBookmarks = รายการที่เซิร์ฟเวอร์ดึงมาให้แล้ว (page.tsx)
 * ถ้าเป็น null (ไม่มีคุกกี้ / token หมดอายุ) จะดึงฝั่งไคลเอนต์เหมือนเดิม
 */
function SaveBlog({ initialBookmarks }: { initialBookmarks: BookmarkItem[] | null }) {
  const { getToken } = useAuth();
  const [savedNews, setSavedNews] = useState<BookmarkItem[]>(initialBookmarks ?? []);
  const [query, setQuery] = useState('');
  // กรองข่าวที่บันทึกไว้ตามคำค้น (หัวข่าว หมวด หรือเนื้อหา) ทันทีระหว่างพิมพ์
  const filteredNews = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('th');
    if (!q) return savedNews;
    return savedNews.filter(({ news }) =>
      [news.title, news.category, news.content].some((v) => (v ?? '').toLocaleLowerCase('th').includes(q)),
    );
  }, [savedNews, query]);
  const [loading, setLoading] = useState(initialBookmarks === null);
  const fetchBookmarks = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    // ใช้ fetch แทน axios เพราะหน้านี้เป็นหน้าเดียวฝั่งผู้ใช้ที่ใช้ axios
    // ต้องโหลด JS เพิ่มราว 14KB ก่อนจะเริ่มดึงข้อมูลได้
    try {
      const res = await fetch(`${API_BASE_URL}/bookmark`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.status === 401) {
        Swal.fire({ icon: "warning", title: "เซสชันหมดอายุ", text: "กรุณาเข้าสู่ระบบใหม่" });
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSavedNews(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error("Fetch Error:", error.message);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (initialBookmarks === null) fetchBookmarks();
  }, [fetchBookmarks, initialBookmarks]);
  const removeNews = async (articleId: number) => {
    const token = getToken();
    if (!token) {
      Swal.fire({ icon: "warning", title: "กรุณาเข้าสู่ระบบก่อน" });
      return;
    }
    try {
      const numericId = Number(articleId);
      const res = await fetch(`${API_BASE_URL}/bookmark/toggle`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId: numericId }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        console.error("Debug Error 400:", body);
        const backendMessage = body?.message;
        Swal.fire({ icon: "error", title: "ลบไม่สำเร็จ", text: Array.isArray(backendMessage) ? backendMessage[0] : backendMessage || "ข้อมูลไม่ถูกต้อง" });
        return;
      }
      setSavedNews(prev => prev.filter(item => item.news.article_id !== articleId));
    } catch (error: any) {
      console.error("Remove bookmark error:", error.message);
      Swal.fire({ icon: "error", title: "ลบไม่สำเร็จ", text: "ข้อมูลไม่ถูกต้อง" });
    }
  };
  const clearAll = async () => {
    const result = await Swal.fire({
      icon: 'warning',
      title: 'ลบข่าวที่บันทึกทั้งหมด?',
      text: 'คุณต้องการลบข่าวที่บันทึกทั้งหมดหรือไม่?',
      showCancelButton: true,
      confirmButtonText: 'ลบทั้งหมด',
      cancelButtonText: 'ยกเลิก',
      confirmButtonColor: SWAL_COLORS.danger,
      cancelButtonColor: SWAL_COLORS.cancel,
      reverseButtons: true,
    });
    if (result.isConfirmed) {
      for (const item of savedNews) {
        await removeNews(item.news.article_id);
      }
    }
  };
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-5">
            <Link href="/user" className="hover:text-green-600 cursor-pointer transition">หน้าหลัก</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-600 font-medium">ข่าวที่บันทึกไว้</span>
          </div>

          <Search
            placeholder="ค้นหาข่าวที่บันทึกไว้"
            onSearch={setQuery}
            onQueryChange={setQuery}
            suggestions={savedNews.flatMap((item) => [item.news.title, item.news.category])}
          />
          <br />
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-medium text-gray-900 mb-2">ข่าวที่บันทึกไว้</h1>
                <p className="text-gray-600">
                  คุณมีข่าวที่บันทึกไว้ทั้งหมด <span className="font-medium text-blue-600">{savedNews.length}</span> รายการ
                </p>
              </div>
              {savedNews.length > 0 && (
                <button onClick={clearAll} className="bg-red-500 hover:bg-red-600 text-white px-6 py-2.5 rounded-xl font-medium transition shadow-lg flex items-center gap-2">
                  ลบทั้งหมด
                </button>
              )}
            </div>
          </div>
          <div className="relative min-h-[400px]">
            {loading ? (
              <div key="loading-state" className="py-12">
                <LoadingSpinner text="กำลังโหลดข่าวที่บันทึกไว้..." size="md" />
              </div>
            ) : savedNews.length > 0 && filteredNews.length === 0 ? (
              <div key="no-match" className="py-16 text-center">
                <p className="text-lg font-medium text-gray-700">ไม่พบข่าวที่ตรงกับ “{query.trim()}”</p>
                <p className="text-sm text-gray-500 mt-1">ลองค้นหาด้วยคำอื่น หรือลบคำค้นเพื่อดูข่าวทั้งหมด</p>
              </div>
            ) : savedNews.length > 0 ? (
              <div key="grid-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredNews.map((item, index) => (
                  <div
                    key={`bookmark-${item.bookmark_id || index}`}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col h-full group hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="relative overflow-hidden">
                      <a href={`/user/newsdetail/${item.news.article_id}`} target="_blank" rel="noopener noreferrer">
                        <BookmarkCover
                          src={coverUrl(item.news.cover_image_url)}
                          alt={item.news.title || 'news image'}
                          /* รูปใบแรกคือองค์ประกอบ LCP สั่งโหลดทันที ส่วนใบอื่นอยู่ใต้เส้นพับ */
                          priority={index === 0}
                        />
                      </a>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className="bg-blue-100 text-blue-700 text-xs font-medium px-3 py-1 rounded-full">
                          {item.news.category || 'ข่าวสาร'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(item.created_at).toLocaleDateString('th-TH')}
                        </span>
                      </div>
                      <a href={`/user/newsdetail/${item.news.article_id}`} target="_blank" rel="noopener noreferrer">
                        <h2 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
                          {item.news.title}
                        </h2>
                      </a>
                      <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1 line-clamp-3">
                        {item.news.content?.replace(/<[^>]*>?/gm, '')}
                      </p>
                      <div className="flex gap-2 mt-auto">
                        <a
                          href={`/user/newsdetail/${item.news.article_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium text-center shadow-lg hover:bg-blue-700 transition"
                        >
                          อ่านเพิ่มเติม
                        </a>
                        <button
                          onClick={() => removeNews(item.news.article_id)}
                          aria-label={`ลบ ${item.news.title} ออกจากข่าวที่บันทึกไว้`}
                          className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                        >
                          <svg className="w-5 h-5" aria-hidden="true" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div key="empty-state" className="bg-white rounded-2xl shadow-lg p-12 text-center border-2 border-dashed border-gray-200">
                <h2 className="text-2xl font-medium text-gray-900 mb-2">ยังไม่มีข่าวที่บันทึกไว้</h2>
                <p className="text-gray-500 mb-6">เริ่มบันทึกข่าวสารที่คุณสนใจ เพื่อกลับมาอ่านภายหลังได้ที่นี่</p>
                <a href="/user" className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-medium hover:bg-blue-700 transition">
                  สำรวจข่าวสาร
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default SaveBlog;