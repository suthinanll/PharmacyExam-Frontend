"use client"
import { useState, useEffect, useCallback } from 'react';
import Navbar from '@/components/Navbar_user';
import Footer from '@/components/Footer';
import Search from '@/components/SearchBar';
import Image from 'next/image';
import axios from 'axios';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/LoadingSpinner';

interface BookmarkItem {
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

function SaveBlog() {
  const { getToken } = useAuth();
  const [savedNews, setSavedNews] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchBookmarks = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/bookmark`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSavedNews(Array.isArray(response.data) ? response.data : []);
    } catch (error: any) {
      console.error("Fetch Error:", error.response?.data || error.message);
      if (error.response?.status === 401) {
        alert("เซสชั่นหมดอายุ กรุณาเข้าสู่ระบบใหม่");
      }
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);
  const removeNews = async (articleId: number) => {
    const token = getToken();
    if (!token) return alert("กรุณาเข้าสู่ระบบก่อน");
    try {
      const numericId = Number(articleId);
      const res = await axios.post(`${API_BASE_URL}/bookmark/toggle`,
        { articleId: numericId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSavedNews(prev => prev.filter(item => item.news.article_id !== articleId));
    } catch (error: any) {
      console.error("Debug Error 400:", error.response?.data);
      const backendMessage = error.response?.data?.message;
      alert("ลบไม่สำเร็จ: " + (Array.isArray(backendMessage) ? backendMessage[0] : backendMessage || "ข้อมูลไม่ถูกต้อง"));
    }
  };
  const clearAll = async () => {
    if (confirm('คุณต้องการลบข่าวที่บันทึกทั้งหมดหรือไม่?')) {
      for (const item of savedNews) {
        await removeNews(item.news.article_id);
      }
    }
  };
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Search onSearch={(q) => console.log(q)} /><br />
          <div className="mb-8">
            <div className="text-sm text-gray-500 mb-2">หน้าหลัก › ข่าวที่บันทึกไว้</div>
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
            ) : savedNews.length > 0 ? (
              <div key="grid-container" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {savedNews.map((item, index) => (
                  <div
                    key={`bookmark-${item.bookmark_id || index}`}
                    className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100 flex flex-col h-full group hover:shadow-2xl transition-all duration-300"
                  >
                    <div className="relative overflow-hidden">
                      <Image
                        src={item.news.cover_image_url || '/img/placeholder.jpg'}
                        alt={item.news.title || 'news image'}
                        width={500}
                        height={300}
                        className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-500"
                      />
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
                      <h5 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                        {item.news.title}
                      </h5>
                      <p className="text-sm text-gray-600 leading-relaxed mb-4 flex-1 line-clamp-3">
                        {item.news.content?.replace(/<[^>]*>?/gm, '')}
                      </p>
                      <div className="flex gap-2 mt-auto">
                        <a href={`/news/${item.news.article_id}`} className="flex-1 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium text-center shadow-lg hover:bg-blue-700 transition">
                          อ่านเพิ่มเติม
                        </a>
                        <button
                          onClick={() => removeNews(item.news.article_id)}
                          className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                <h3 className="text-2xl font-medium text-gray-900 mb-2">ยังไม่มีข่าวที่บันทึกไว้</h3>
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