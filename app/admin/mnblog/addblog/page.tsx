/* eslint-disable @next/next/no-img-element */
"use client";

import Navbar_admin from "@/components/Navbar_admin";
import Link from "next/link";
import { ChevronLeft, Save, Zap, Trash2, Loader2, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface BlogFormData {
    title: string;
    imageUrl: string;
    content: string;
    author_id: number;
    categoryIds: number[];
}

const DummyTextEditor = ({ content, setContent, isGenerating }: {
    content: string,
    setContent: (c: string) => void,
    isGenerating: boolean
}) => {
    return (
        <div className={`border rounded-lg p-4 min-h-[300px] transition-colors ${isGenerating ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200'}`}>
            {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-yellow-600">
                    <Loader2 className="w-6 h-6 animate-spin mb-3" />
                    <p>กำลังประมวลผลเนื้อหาข่าว...</p>
                </div>
            ) : (
                <textarea
                    className="w-full h-full p-0 border-none focus:ring-0 resize-none text-gray-700 placeholder-gray-400 min-h-[280px] outline-none"
                    placeholder="ใส่รายละเอียดและเนื้อหาข่าวสารที่นี่..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            )}
        </div>
    );
};

function AddBlogPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<BlogFormData>({
        title: '',
        imageUrl: '',
        content: '',
        author_id: 10, // กำหนดค่า default ตาม Backend
        categoryIds: [1],
    });
    
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 🤖 ฟังก์ชันดึงข้อมูลอัตโนมัติ (Mock API Fetch)
    const handleAutoGenerate = async () => {
        setIsGenerating(true);
        try {
            const response = await fetch('http://localhost:5000/news/latest'); // ปรับ Endpoint ตามจริง
            if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");

            const data = await response.json();
            setFormData({
                ...formData,
                title: data.title || 'กำลังอัปเดตข่าวสารใหม่...',
                content: data.content || 'รายละเอียดข่าวสารกำลังถูกจัดเตรียม...',
                imageUrl: data.cover_image_url || 'https://images.unsplash.com/photo-1587854692152-cbe660dbbb88?q=80&w=2070&auto=format&fit=crop'
            });
        } catch (error) {
            console.error(error);
            alert("ไม่สามารถดึงข้อมูลอัตโนมัติได้ในขณะนี้");
        } finally {
            setIsGenerating(false);
        }
    };

    // 💾 ฟังก์ชันบันทึกข้อมูล
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.title || !formData.content) {
            alert("กรุณากรอกชื่อหัวข้อและเนื้อหาข่าวสาร");
            return;
        }

        setIsSaving(true);
        try {
            const token = localStorage.getItem('access_token');
            const response = await fetch('http://localhost:5000/news', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: formData.title,
                    content: formData.content,
                    cover_image_url: formData.imageUrl,
                    author_id: formData.author_id,
                    categoryIds: formData.categoryIds,
                    status: 'PUBLISHED'
                }),
            });

            if (!response.ok) throw new Error("เกิดข้อผิดพลาดในการบันทึก");

            alert("บันทึกข่าวสารเรียบร้อยแล้ว!");
            router.push('/admin/mnblog');
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Navbar_admin>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-20">
                {/* Header Action Bar */}
                <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-100">
                    <Link href="/admin/mnblog" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors">
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-medium">กลับ</span>
                    </Link>

                    <h2 className="text-xl font-semibold text-gray-800 hidden sm:block">เพิ่มบล็อกข่าวสารใหม่</h2>

                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || isGenerating || !formData.title}
                        className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg text-white transition-all shadow-md ${
                            isSaving || isGenerating ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 active:scale-95'
                        }`}
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข่าวสาร'}</span>
                    </button>
                </div>

                <div className="space-y-6">
                    {/* หัวข้อข่าว */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">หัวข้อข่าวสาร</label>
                        <input
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="ระบุหัวข้อที่ดึงดูดความสนใจ..."
                            className="w-full border border-gray-300 rounded-lg p-3.5 focus:ring-2 focus:ring-green-500 outline-none transition-all text-lg font-medium"
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* จัดการรูปภาพผ่าน URL */}
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">ลิงก์รูปภาพหน้าปก (Image URL)</label>
                            
                            <div className="relative mb-4">
                                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    name="imageUrl"
                                    type="text"
                                    value={formData.imageUrl}
                                    onChange={handleInputChange}
                                    placeholder="วางลิงก์รูปภาพ https://..."
                                    className="w-full border border-gray-300 rounded-lg pl-10 pr-3 py-3 focus:ring-2 focus:ring-green-500 outline-none transition-all"
                                />
                            </div>

                            {/* Preview Window */}
                            <div className="relative border-2 border-dashed border-gray-200 rounded-xl overflow-hidden aspect-[16/9] bg-gray-50 flex flex-col items-center justify-center">
                                {formData.imageUrl ? (
                                    <>
                                        <img
                                            src={formData.imageUrl}
                                            alt="Preview"
                                            className="w-full h-full object-cover"
                                            onError={(e) => { (e.target as HTMLImageElement).src = "https://placehold.co/800x450/eeeeee/999999?text=Invalid+Image+URL"; }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setFormData({...formData, imageUrl: ''})}
                                            className="absolute top-3 right-3 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-xl transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                ) : (
                                    <div className="text-center text-gray-400">
                                        <ImageIcon className="w-14 h-14 mx-auto mb-3 opacity-20" />
                                        <p className="text-sm font-medium">รอการแสดงตัวอย่างรูปภาพจากลิงก์ของคุณ...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ปุ่ม AI ดึงข้อมูลด่วน */}
                        <div className="lg:col-span p-8 rounded-xl shadow-lg flex flex-col justify-center items-center text-center text-black">
                            <div className="bg-gray-100 p-4 rounded-full mb-4 backdrop-blur-sm">
                                <Zap className="w-10 h-10 text-yellow-300 fill-yellow-300" />
                            </div>
                            <h3 className="text-xl font-bold mb-2">Smart Auto-Fetch</h3>
                            <p className="text-sm text-black-100 mb-8 leading-relaxed">
                                ช่วยคุณเขียนข่าวได้ไวขึ้น 10 เท่า! <br /> ดึงข้อมูลและรูปภาพจากระบบล่าสุดมาให้อัตโนมัติ
                            </p>
                            <button
                                type="button"
                                onClick={handleAutoGenerate}
                                disabled={isGenerating}
                                className={`flex items-center justify-center gap-2 px-8 py-4 text-sm font-normal rounded-full transition-all w-full shadow-2xl ${
                                    isGenerating ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 active:scale-95 cursor-pointer'
                                }`}
                            >
                                {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5" />}
                                {isGenerating ? 'กำลังโหลดข่าว...' : 'ดึงข้อมูลอัตโนมัติ'}
                            </button>
                        </div>
                    </div>

                    {/* เนื้อหาข่าว */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">รายละเอียดเนื้อหาข่าวสาร</label>
                        <DummyTextEditor
                            content={formData.content}
                            setContent={(c) => setFormData({...formData, content: c})}
                            isGenerating={isGenerating}
                        />
                    </div>
                </div>
            </div>
        </Navbar_admin>
    );
}

export default AddBlogPage;