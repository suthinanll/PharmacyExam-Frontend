/* eslint-disable @next/next/no-img-element */
"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect, useMemo } from "react";
import { Plus, Search, Clock, Loader2, ImageOff, Trash2, Eye, EyeOff, Filter } from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';

// ... (BlogData และ BlogCardProps interface เหมือนเดิม)
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

// BlogCard Component (คงเดิมตามที่คุณส่งมา)
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
      onRefresh();
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
        className="flex flex-col border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all bg-white cursor-pointer h-full"
      >
        <div className="relative h-48 w-full bg-gray-100 overflow-hidden">
          {blog.cover_image_url ? (
            <img
              src={blog.cover_image_url}
              alt={blog.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-400">
              <ImageOff className="w-10 h-10 mb-2" />
              <span className="text-xs">ไม่มีรูปภาพหน้าปก</span>
            </div>
          )}
          <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded uppercase shadow-sm ${isPublished ? 'bg-green-600 text-white' : 'bg-gray-500 text-white'
            }`}>
            {isPublished ? 'Live' : 'Draft'}
          </span>
        </div>

        <div className="p-4 flex flex-col flex-grow">
          <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2 min-h-[2.5rem]">{blog.title}</h3>
          <p className="text-xs text-gray-600 mb-3 line-clamp-2 flex-grow">{blog.content}</p>
          <div className="mt-auto pt-3 border-t border-gray-100 flex items-center text-[11px] text-gray-500">
            <Clock className="w-3 h-3 mr-1" /> สร้างเมื่อ: {formatDate(blog.created_at)}
          </div>
        </div>
        
      </Link>
      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          disabled={isActionLoading}
          onClick={toggleStatus}
          title={isPublished ? "เปลี่ยนเป็นฉบับร่าง" : "เผยแพร่ทันที"}
          className={`p-2 rounded-full shadow-lg transition-colors ${isPublished ? 'bg-amber-500 hover:bg-amber-600' : 'bg-blue-500 hover:bg-blue-600'
            } text-white`}
        >
          {isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
        <button disabled={isActionLoading} onClick={handleDelete} className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg">
          <Trash2 size={16} />
        </button>
      </div>
      {isActionLoading && (
        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-xl z-20">
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

  const filteredBlogs = blogs.filter(blog =>
    blog.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const counts = {
    ALL: blogs.length,
    PUBLISHED: blogs.filter(b => b.status?.toUpperCase() === 'PUBLISHED').length,
    DRAFT: blogs.filter(b => b.status?.toUpperCase() === 'DRAFT').length,
  };
  return (
    <Navbar_admin>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-10">
        <div className="mb-8 pt-4 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">บล็อกข่าวสาร</h1>
            <p className="text-sm text-gray-600">จัดการและติดตามความเคลื่อนไหวข่าวสารของคุณ</p>
          </div>
          <Link href="/admin/mnblog/addblog" className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg shadow-md transition-all active:scale-95 font-medium">
            <Plus className="w-5 h-5" /> เพิ่มข่าวสารใหม่
          </Link>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-grow max-w-md">
              <input
                type="text"
                placeholder="ค้นหาตามชื่อหัวข้อ..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none transition-all"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-200">
              {[
                { id: "ALL", label: "ทั้งหมด" },
                { id: "PUBLISHED", label: "Live" },
                { id: "DRAFT", label: "Draft" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-4 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                    statusFilter === tab.id 
                    ? 'bg-white text-green-600 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                  <span className="ml-1.5 opacity-60">({counts[tab.id as keyof typeof counts]})</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        {isLoading ? (
          <div className="flex flex-col items-center py-20 text-gray-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4 text-green-600" />
            <p className="font-medium">กำลังโหลดข้อมูล...</p>
          </div>
        ) : filteredBlogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredBlogs.map((blog) => (
              <BlogCard key={blog.article_id} blog={blog} onRefresh={fetchBlogs} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-500 border-2 border-dashed border-gray-200 rounded-2xl">
            <p>ไม่พบข้อมูลข่าวสารที่คุณกำลังค้นหา</p>
          </div>
        )}
      </div>
    </Navbar_admin>
  );
}

export default Page;