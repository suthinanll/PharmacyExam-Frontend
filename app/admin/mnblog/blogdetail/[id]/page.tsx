/* eslint-disable @next/next/no-img-element */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import Navbar_admin from "@/components/Navbar_admin";
import { 
    ChevronLeft, 
    Save, 
    Loader2, 
    AlertCircle, 
    Image as ImageIcon, 
    Upload, 
    Link2,
    Bold,
    Italic,
    List as ListIcon,
    ListOrdered,
    Quote,
    Minus,
    FileText
} from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';

export default function EditBlogDetail() {
    const { getToken } = useAuth();
    const params = useParams();
    const router = useRouter();
    const blogId = params?.id;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({ title: "", content: "", cover_image_url: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    // --- Tiptap Editor Setup ---
    const editor = useEditor({
        extensions: [StarterKit, LinkExtension.configure({ openOnClick: false })],
        content: "",
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            setFormData(prev => ({ ...prev, content: editor.getHTML() }));
        },
    });

    // --- Fetch Data ---
    useEffect(() => {
        const fetchDetail = async () => {
            if (!blogId) return;
            setIsLoading(true);
            try {
                // ✅ 1. ดึง Token ออกมาเตรียมไว้
                const token = getToken();

                // ✅ 2. แนบ Authorization Header ในการเรียก GET
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news/${blogId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // ส่ง Token ไปยืนยันตัวตน
                    }
                });

                if (!response.ok) throw new Error(`ไม่สามารถดึงข้อมูลได้ (${response.status})`);
                
                const data = await response.json();
                setFormData({
                    title: data.title || "",
                    content: data.content || "",
                    cover_image_url: data.cover_image_url || ""
                });

                if (editor) {
                    editor.commands.setContent(data.content || "");
                }
            } catch (error: any) {
                setErrorMessage(error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [blogId, editor]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const fakeUrl = URL.createObjectURL(file);
            setFormData({ ...formData, cover_image_url: fakeUrl });
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const token = getToken();

        try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news/${blogId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                alert("อัปเดตข้อมูลเรียบร้อย!");
                router.push('/admin/mnblog');
            } else {
                throw new Error("บันทึกไม่สำเร็จ");
            }
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <Navbar_admin>
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="animate-spin text-green-600 mb-2" size={40} />
                <p className="text-gray-500 font-medium">กำลังโหลดข้อมูลข่าวสาร...</p>
            </div>
        </Navbar_admin>
    );

    if (errorMessage) return (
        <Navbar_admin>
            <div className="flex flex-col items-center justify-center h-[60vh] text-red-500 p-4 text-center">
                <AlertCircle size={48} className="mb-4" />
                <p className="text-xl font-bold">{errorMessage}</p>
                <Link href="/admin/mnblog" className="mt-4 bg-gray-100 px-6 py-2 rounded-xl text-gray-600 hover:bg-gray-200 transition-all">กลับหน้าหลัก</Link>
            </div>
        </Navbar_admin>
    );

    return (
        <Navbar_admin>
            <div className="max-w-5xl mx-auto px-4 pt-6 pb-20">
                {/* Header Section */}
                <Link href="/admin/mnblog" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-6 font-medium text-sm w-fit">
                    <ChevronLeft size={18} /> กลับไปหน้าจัดการ
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                            <FileText className="w-8 h-8 text-green-600" /> แก้ไขข่าวสาร
                        </h1>
                        <p className="text-gray-400 text-sm font-medium">Article ID: {blogId}</p>
                    </div>
                    <button
                        onClick={handleUpdate}
                        disabled={isSaving}
                        className="w-full md:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white rounded-2xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 active:scale-95 disabled:opacity-50 transition-all"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        บันทึกการเปลี่ยนแปลง
                    </button>
                </div>

                {/* Main Content Card */}
                <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-200 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        
                        {/* Left Side: Text Content */}
                        <div className="lg:col-span-8 space-y-6">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-2 ml-1">หัวข้อข่าวสาร</label>
                                <input
                                    type="text"
                                    className="w-full text-2xl font-bold border-none p-0 focus:ring-0 placeholder-gray-200 bg-transparent text-gray-800"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="ใส่หัวข้อข่าวที่นี่..."
                                />
                            </div>

                            <div className="border-t border-gray-50 pt-6">
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-3 ml-1">เนื้อหาข่าวสาร</label>
                                <div className="min-h-[400px]">
                                    <TiptapToolbar editor={editor} />
                                    <EditorContent
                                        editor={editor}
                                        className="prose prose-green max-w-none min-h-[350px] outline-none text-gray-700"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Sidebar/Media */}
                        <div className="lg:col-span-4 space-y-6 lg:border-l lg:border-gray-50 lg:pl-8">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-gray-400 mb-4 ml-1">ภาพหน้าปก (Cover)</label>
                                <div 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative aspect-[4/3] bg-gray-50 rounded-[24px] overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center group cursor-pointer hover:bg-gray-100 transition-all"
                                >
                                    {formData.cover_image_url ? (
                                        <img
                                            src={formData.cover_image_url}
                                            alt="Cover Preview"
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="text-center text-gray-400">
                                            <Upload className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest">Upload Photo</p>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <ImageIcon className="text-white w-8 h-8" />
                                    </div>
                                </div>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleImageUpload}
                                    className="hidden"
                                    accept="image/*"
                                />
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100">
                                        <Link2 size={14} className="text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="หรือวาง URL รูปภาพ..."
                                            value={formData.cover_image_url}
                                            onChange={(e) => setFormData({ ...formData, cover_image_url: e.target.value })}
                                            className="w-full text-[11px] bg-transparent border-none focus:ring-0 p-0 text-blue-600 placeholder-gray-300"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                                <h4 className="text-green-700 text-xs font-bold mb-2 flex items-center gap-2">
                                    <AlertCircle size={14} /> คำแนะนำ
                                </h4>
                                <ul className="text-[11px] text-green-600/80 space-y-1.5 leading-relaxed">
                                    <li>• ตรวจสอบหัวข้อข่าวให้กระชับและน่าสนใจ</li>
                                    <li>• ใช้ตัวหนา (Bold) สำหรับประเด็นสำคัญ</li>
                                    <li>• ตรวจสอบลิงก์อ้างอิงให้ถูกต้องก่อนบันทึก</li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </Navbar_admin>
    );
}