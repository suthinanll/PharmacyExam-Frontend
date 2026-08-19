/* eslint-disable @next/next/no-img-element */
"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Clock, ImageOff, Trash2, Eye, EyeOff } from "lucide-react";
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
              src={blog.cover_image_url}
              alt={blog.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-300">
              <ImageOff className="w-12 h-12 mb-2 opacity-20" />
              <span className="text-[10px] uppercase font-bold tracking-widest">No Cover Image</span>
            </div>
          )}
          <div className="absolute top-3 left-3 flex gap-2">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase shadow-sm ${isPublished ? 'bg-green-500 text-white' : 'bg-gray-400 text-white'}`}>
              {isPublished ? '• Live' : 'Draft'}
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col flex-grow">
          <h3 className="text-base font-bold text-gray-800 mb-2 line-clamp-2 leading-snug">{blog.title}</h3>
          {/* ใช้ stripHtml เพื่อไม่ให้เห็น <div> หรือ <p> ในหน้า Dashboard */}
          <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-grow">
            {stripHtml(blog.content)}
          </p>
          <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-[11px] text-gray-400 font-medium">
            <div className="flex items-center gap-1.5">
               <Clock size={14} className="text-gray-300" />
               {formatDate(blog.created_at)}
            </div>
            <span className="text-green-600 font-bold uppercase tracking-tighter">Edit Details →</span>
          </div>
        </div>
      </Link>

      {/* Floating Actions */}
      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 z-10">
        <button
          disabled={isActionLoading}
          onClick={toggleStatus}
          className={`p-2.5 rounded-xl shadow-xl transition-all active:scale-90 ${isPublished ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
        >
          {isPublished ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
        <button 
          disabled={isActionLoading} 
          onClick={handleDelete} 
          className="p-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl shadow-xl transition-all active:scale-90"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {isActionLoading && (
        <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] rounded-2xl z-20 p-4">
          <div className="h-2 w-full bg-gray-200 animate-pulse rounded-full mb-3" />
          <div className="h-2 w-2/3 bg-gray-200 animate-pulse rounded-full mb-3" />
          <div className="h-2 w-full bg-gray-200 animate-pulse rounded-full" />
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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="mb-10 pt-8 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">Management Content</h1>
            <p className="text-gray-500 mt-1 font-medium">สรุปและจัดการข่าวสารประชาสัมพันธ์ทั้งหมด</p>
          </div>
          <Link href="/admin/mnblog/addblog" className="w-full md:w-auto flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-green-200 transition-all active:scale-95 font-bold">
            <Plus className="w-5 h-5" /> สร้างข่าวสารใหม่
          </Link>
        </div>

        <div className="bg-white p-2 rounded-[24px] shadow-sm border border-gray-100 mb-10">
          <div className="flex flex-col lg:flex-row gap-2">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="ค้นหาข่าวสารของคุณ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 border-none rounded-[20px] focus:ring-2 focus:ring-green-500 transition-all text-gray-700 font-medium"
              />
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            </div>
            
            <div className="flex bg-gray-100/50 p-1.5 rounded-[20px] gap-1">
              {[
                { id: "ALL", label: "ทั้งหมด" },
                { id: "PUBLISHED", label: "Live" },
                { id: "DRAFT", label: "Draft" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`flex-1 md:flex-none px-6 py-2.5 text-xs font-black rounded-[15px] transition-all cursor-pointer uppercase tracking-wider ${
                    statusFilter === tab.id 
                    ? 'bg-white text-green-600 shadow-sm ring-1 ring-black/5' 
                    : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {tab.label}
                  <span className={`ml-2 text-[10px] ${statusFilter === tab.id ? 'text-green-400' : 'text-gray-300'}`}>
                    {counts[tab.id as keyof typeof counts]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="h-44 bg-gray-200 animate-pulse" />
                <div className="p-4 space-y-3">
                  <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                  <div className="h-3 w-full animate-pulse rounded bg-gray-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog) => (
              <BlogCard key={blog.article_id} blog={blog} onRefresh={fetchBlogs} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[40px]">
            <ImageOff className="w-12 h-12 mx-auto mb-4 text-gray-200" />
            <h3 className="text-gray-400 font-bold uppercase tracking-tighter">No Articles Found</h3>
            <p className="text-gray-400 text-sm mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรองสถานะ</p>
          </div>
        )}
      </div>
    </Navbar_admin>
  );
}

export default Page;