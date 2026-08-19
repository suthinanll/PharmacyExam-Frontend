/* eslint-disable @next/next/no-img-element */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Navbar_admin from "@/components/Navbar_admin";
import { 
    ChevronLeft, Save, Loader2, AlertCircle, 
    Image as ImageIcon, Upload, Link2, FileText,
    Bold, Italic, List, ListOrdered, Quote, Minus
} from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';

// --- Tiptap Imports ---
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';

// --- Toolbar Component ---
const TiptapToolbar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) return null;
    return (
        <div className="flex flex-wrap gap-2 p-2 mb-2 bg-gray-50 rounded-xl border border-gray-200">
            <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded ${editor.isActive('bold') ? 'bg-green-100 text-green-600' : 'text-gray-600'}`}><Bold size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded ${editor.isActive('italic') ? 'bg-green-100 text-green-600' : 'text-gray-600'}`}><Italic size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-green-100 text-green-600' : 'text-gray-600'}`}><List size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-green-100 text-green-600' : 'text-gray-600'}`}><ListOrdered size={16} /></button>
            <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2 rounded ${editor.isActive('blockquote') ? 'bg-green-100 text-green-600' : 'text-gray-600'}`}><Quote size={16} /></button>
            <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="p-2 text-gray-600"><Minus size={16} /></button>
        </div>
    );
};

export default function EditBlogDetail() {
    const { getToken } = useAuth();
    const params = useParams();
    const router = useRouter();
    const blogId = params?.id;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({ title: "", content: "", cover_image_url: "" });
    const [selectedFile, setSelectedFile] = useState<File | null>(null); // เก็บไฟล์จริง
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const editor = useEditor({
        extensions: [
            StarterKit,
            LinkExtension.configure({ openOnClick: false, HTMLAttributes: { class: 'text-green-600 underline' } })
        ],
        content: "",
        immediatelyRender: false, // ✅ เพิ่มบรรทัดนี้เพื่อปิดการ Render ทันทีบน SSR
        onUpdate: ({ editor }) => {
            setFormData(prev => ({ ...prev, content: editor.getHTML() }));
        },
    });

    // --- Fetch Initial Data ---
    useEffect(() => {
        const fetchDetail = async () => {
            if (!blogId || !editor) return;
            try {
                const token = getToken();
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news/${blogId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!response.ok) throw new Error("ไม่สามารถโหลดข้อมูลได้");
                
                const data = await response.json();
                setFormData({
                    title: data.title || "",
                    content: data.content || "",
                    cover_image_url: data.cover_image_url || ""
                });
                editor.commands.setContent(data.content || "");
            } catch (error: any) {
                setErrorMessage(error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [blogId, editor, getToken]);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const previewUrl = URL.createObjectURL(file);
            setFormData(prev => ({ ...prev, cover_image_url: previewUrl }));
        }
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const token = getToken();

        try {
            let finalImageUrl = formData.cover_image_url;

            // ถ้ามีการเลือกไฟล์ใหม่ ให้อัปโหลดไฟล์ก่อน
            if (selectedFile) {
                const uploadData = new FormData();
                uploadData.append("file", selectedFile);
                
                const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news/upload`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}` 
                    },
                    body: uploadData
                });

                if (!uploadRes.ok) throw new Error("อัปโหลดรูปภาพไม่สำเร็จ");
                const uploadJson = await uploadRes.json();
                finalImageUrl = uploadJson.url;
            }

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news/${blogId}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` 
                },
                body: JSON.stringify({
                    title: formData.title,
                    content: formData.content,
                    cover_image_url: finalImageUrl
                }),
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
            <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
                <div className="h-8 w-3/4 animate-pulse rounded-lg bg-gray-200" />
                <div className="h-3 w-40 animate-pulse rounded bg-gray-200" />
                <div className="h-64 w-full animate-pulse rounded-2xl bg-gray-200" />
                <div className="space-y-3">
                    <div className="h-3.5 w-full animate-pulse rounded bg-gray-200" />
                    <div className="h-3.5 w-11/12 animate-pulse rounded bg-gray-200" />
                    <div className="h-3.5 w-full animate-pulse rounded bg-gray-200" />
                    <div className="h-3.5 w-4/5 animate-pulse rounded bg-gray-200" />
                </div>
            </div>
        </Navbar_admin>
    );

    return (
        <Navbar_admin>
            <div className="max-w-5xl mx-auto px-4 pt-6 pb-20">
                <Link href="/admin/mnblog" className="flex items-center gap-2 text-gray-500 hover:text-gray-800 mb-6 text-sm">
                    <ChevronLeft size={18} /> กลับไปหน้าจัดการ
                </Link>

                <div className="flex flex-col md:flex-row justify-between items-center mb-8 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                            <FileText className="w-8 h-8 text-green-600" /> แก้ไขข่าวสาร
                        </h1>
                    </div>
                    <button
                        onClick={handleUpdate}
                        disabled={isSaving}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-3 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 disabled:opacity-50 transition-all"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        บันทึกการเปลี่ยนแปลง
                    </button>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-200 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        
                        {/* Content */}
                        <div className="lg:col-span-8 space-y-6">
                            <div>
                                <label className="block text-xs font-black uppercase text-gray-400 mb-2">หัวข้อข่าวสาร</label>
                                <input
                                    type="text"
                                    className="w-full text-2xl font-bold border-none p-0 focus:ring-0 text-gray-800"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="ใส่หัวข้อข่าว..."
                                />
                            </div>

                            <div className="border-t pt-6">
                                <label className="block text-xs font-black uppercase text-gray-400 mb-3">เนื้อหาข่าวสาร</label>
                                <TiptapToolbar editor={editor} />
                                <div className="min-h-[400px] border rounded-xl p-4">
                                    <EditorContent editor={editor} className="prose prose-sm sm:prose lg:prose-lg focus:outline-none" />
                                </div>
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-6">
                            <label className="block text-xs font-black uppercase text-gray-400 mb-4">ภาพหน้าปก</label>
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="relative aspect-[4/3] bg-gray-50 rounded-[24px] overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-all"
                            >
                                {formData.cover_image_url ? (
                                    <img src={formData.cover_image_url} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Upload className="text-gray-300 w-8 h-8" />
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handleImageUpload} className="hidden" accept="image/*" />
                            
                            <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                                <h4 className="text-green-700 text-xs font-bold mb-2 flex items-center gap-2">
                                    <AlertCircle size={14} /> คำแนะนำ
                                </h4>
                                <ul className="text-[11px] text-green-600/80 space-y-1">
                                    <li>• แนะนำขนาดภาพ 1200 x 800 px</li>
                                    <li>• ไฟล์ภาพต้องไม่เกิน 5MB</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Navbar_admin>
    );
}