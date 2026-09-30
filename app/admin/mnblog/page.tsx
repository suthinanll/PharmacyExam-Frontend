/* eslint-disable @next/next/no-img-element */
"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Clock, Loader2, ImageOff, Trash2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';

interface BlogData {
  article_id: number;
  title: string;
  content: string;
  created_at: string;
  cover_image_url: string | null;
  status: string;
}

interface BlogCardProps {
  blog: BlogData;
  onRefresh: () => void;
}

// ฟังก์ชันสำหรับล้าง Tag HTML เพื่อแสดงแต่ข้อความในหน้าแรก
const stripHtml = (html: string) => {
  if (typeof window === 'undefined') return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
};

const BlogCard = ({ blog, onRefresh }: BlogCardProps) => {
  const { getToken } = useAuth();
  const [isActionLoading, setIsActionLoading] = useState(false);
  const isPublished = blog.status?.toUpperCase() === 'PUBLISHED';

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!confirm(`คุณต้องการลบข่าว "${blog.title}" ใช่หรือไม่?`)) return;
    setIsActionLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news/${blog.article_id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) { onRefresh(); }
    } catch (error) {
      alert("เกิดข้อผิดพลาดในการลบ");
    } finally {
      setIsActionLoading(false);
    }
  };

  const toggleStatus = async (e: React.MouseEvent) => {
    e.preventDefault();
    const newStatus = isPublished ? 'DRAFT' : 'PUBLISHED';
    setIsActionLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news/${blog.article_id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) onRefresh();
    } catch (error) {
      console.error(error);
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="relative group">
      <Link
        href={`/admin/mnblog/blogdetail/${blog.article_id}`}
        className="flex flex-col border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all bg-white h-full border-t-4 border-t-transparent hover:border-t-green-500"
      >
        <div className="relative h-48 w-full bg-gray-50 overflow-hidden">
          {blog.cover_image_url ? (
            <img
              src={
                blog.cover_image_url.startsWith('http')
                  ? blog.cover_image_url
                  : `${process.env.NEXT_PUBLIC_API_URL}${blog.cover_image_url}`
              }
              alt={blog.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-300">
              <ImageOff className="w-12 h-12 mb-2 opacity-20" />
              <span className="text-[10px]  font-medium tracking-widest">No Cover Image</span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full  shadow-sm ${isPublished ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
              {isPublished ? '• Live' : 'Draft'}
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-grow">
          <h2 className="text-base font-medium text-gray-800 mb-2 line-clamp-2 leading-snug">{blog.title}</h2>
          {/* ใช้ stripHtml เพื่อไม่ให้เห็น <div> หรือ <p> ในหน้า Dashboard */}
          <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">
            {stripHtml(blog.content)}
          </p>
          <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Clock size={14} className="text-gray-400" />
              {formatDate(blog.created_at)}
            </div>
            <span className="text-green-600 font-medium  tracking-tighter">Edit Details →</span>
          </div>
        </div>
      </Link>

      {/* Floating Actions */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 z-10">
        <button
          disabled={isActionLoading}
          onClick={toggleStatus}
          aria-label={isPublished ? `เปลี่ยนสถานะข่าวสาร "${blog.title}" เป็นฉบับร่าง` : `เผยแพร่ข่าวสาร "${blog.title}"`}
          className={`p-2.5 rounded-xl shadow-xl transition-all active:scale-90 ${isPublished ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
        >
          {isPublished ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <button
          disabled={isActionLoading}
          onClick={handleDelete}
          aria-label={`ลบข่าวสาร "${blog.title}"`}
          className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-xl transition-all active:scale-90"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {isActionLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-2xl z-20">
          <Loader2 className="animate-spin text-green-600" />
        </div>
      )}
    </div>
  );
};

function Page() {
  const { getToken } = useAuth();
  const [blogs, setBlogs] = useState<BlogData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const fetchBlogs = async () => {
    setIsLoading(true);
    try {
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      // เรียงจากใหม่ไปเก่า
      setBlogs(data.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  // --- Logic กรองข้อมูล ---
  const filteredBlogs = useMemo(() => {
    return blogs.filter(blog => {
      const matchesSearch = blog.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "ALL" || blog.status?.toUpperCase() === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [blogs, searchTerm, statusFilter]);

  const counts = {
    ALL: blogs.length,
    PUBLISHED: blogs.filter(b => b.status?.toUpperCase() === 'PUBLISHED').length,
    DRAFT: blogs.filter(b => b.status?.toUpperCase() === 'DRAFT').length,
  };

  return (
    <Navbar_admin>
      <div className="max-w-7xl mx-auto w-full space-y-6 pb-20">
        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">จัดการข่าวสาร</h1>
              <p className="text-sm text-gray-500">สรุปและจัดการข่าวสารประชาสัมพันธ์ทั้งหมด · {filteredBlogs.length} รายการ</p>
            </div>
            <Link
              href="/admin/mnblog/addblog"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all hover:shadow-md"
            >
              <Plus size={18} /> สร้างข่าวสารใหม่
            </Link>
          </div>
        </div>

        {/* ── Toolbar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col xl:flex-row gap-4 mb-6 justify-between items-start xl:items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex gap-3 flex-1 flex-wrap w-full xl:w-auto">
            <div className="relative max-w-sm w-full">
              <input
                type="text"
                placeholder="ค้นหาข่าวสารของคุณ..."
                aria-label="ค้นหาข่าวสารของคุณ"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-green-500 focus:border-green-500 bg-gray-50"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
          </div>

          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1 w-full xl:w-auto overflow-x-auto" role="group" aria-label="กรองสถานะข่าวสาร">
            {[
              { id: "ALL", label: "ทั้งหมด" },
              { id: "PUBLISHED", label: "Live" },
              { id: "DRAFT", label: "Draft" }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                aria-label={`กรองตามสถานะ ${tab.label}`}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  statusFilter === tab.id
                    ? 'bg-white shadow-sm text-green-700'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
                <span className={`text-xs ${statusFilter === tab.id ? 'text-green-600 bg-green-50 px-1.5 rounded-md' : 'text-gray-500'}`}>
                  {counts[tab.id as keyof typeof counts]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center py-32 text-gray-400">
            <Loader2 className="w-12 h-12 animate-spin mb-4 text-green-600 opacity-60" />
            <p className="font-medium  text-xs">Synchronizing Data...</p>
          </div>
        ) : filteredBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog) => (
              <BlogCard key={blog.article_id} blog={blog} onRefresh={fetchBlogs} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[40px]">
            <ImageOff className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h2 className="text-gray-600 font-medium  tracking-tighter">No Articles Found</h2>
            <p className="text-gray-500 text-sm mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ</p>
          </div>
        )}
      </div>
    </Navbar_admin>
  );
}

export default Page;