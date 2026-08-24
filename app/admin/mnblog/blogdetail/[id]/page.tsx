/* eslint-disable @next/next/no-img-element */
"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Navbar_admin from "@/components/Navbar_admin";
import Toast from "@/components/Toast";
import {
    ChevronLeft, Save, Loader2, AlertCircle,
    Image as ImageIcon, Upload, Link2, FileText,
    Bold, Italic, List, ListOrdered, Quote, Minus, X, Trash2
} from "lucide-react";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import Swal from 'sweetalert2';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';

// --- Toolbar Component ---
const TiptapToolbar = ({ editor, onAddLink, onAddImage }: { editor: Editor | null; onAddLink: () => void; onAddImage: () => void }) => {
    if (!editor) return null;

    return (
        <div className="flex flex-wrap gap-2 p-2 mb-2 bg-gray-50 rounded-xl border border-gray-200">
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded ${editor.isActive('bold') ? 'bg-green-100 text-green-600' : 'text-gray-600'}`}><Bold size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded ${editor.isActive('italic') ? 'bg-green-100 text-green-600' : 'text-gray-600'}`}><Italic size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-green-100 text-green-600' : 'text-gray-600'}`}><List size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-green-100 text-green-600' : 'text-gray-600'}`}><ListOrdered size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={`p-2 rounded ${editor.isActive('blockquote') ? 'bg-green-100 text-green-600' : 'text-gray-600'}`}><Quote size={16} /></button>
            <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} className="p-2 text-gray-600"><Minus size={16} /></button>
            <button type="button" onClick={onAddLink} className={`p-2 rounded ${editor.isActive('link') ? 'bg-green-100 text-green-600' : 'text-gray-600'}`}><Link2 size={16} /></button>
            <button type="button" onClick={onAddImage} className="p-2 text-gray-600"><ImageIcon size={16} /></button>
        </div>
    );
};

export default function EditBlogDetail() {
    const { getToken } = useAuth();
    const params = useParams();
    const router = useRouter();
    const blogId = params?.id;
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({ title: "", content: "", cover_image_url: "", source_url: "" });
    const initialDataRef = useRef<{ title: string; content: string; cover_image_url: string; source_url: string } | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [imageMode, setImageMode] = useState<'upload' | 'url'>('upload');
    const [toast, setToast] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Modal states
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState("");
    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [imageUrl, setImageUrl] = useState("");

    const editor = useEditor({
        extensions: [
            StarterKit,
            LinkExtension.configure({ openOnClick: false, HTMLAttributes: { class: 'text-green-600 underline' } }),
            Image.configure({ inline: true })
        ],
        content: "",
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            setFormData(prev => ({ ...prev, content: editor.getHTML() }));
        },
    });

    const isDirty = () => {
        if (!initialDataRef.current) return false;
        return (
            formData.title !== initialDataRef.current.title ||
            formData.content !== initialDataRef.current.content ||
            formData.cover_image_url !== initialDataRef.current.cover_image_url ||
            formData.source_url !== initialDataRef.current.source_url ||
            selectedFile !== null
        );
    };

    // เตือนเมื่อพยายามปิดแท็บหรือรีเฟรชหน้าขณะมีข้อมูลที่ยังไม่ได้บันทึก
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isDirty()) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    });

    // Auto-save ทุก 30 วินาที
    useEffect(() => {
        if (!formData.title || isLoading) return;

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(() => {
            localStorage.setItem(`blog-edit-${blogId}`, JSON.stringify({
                title: formData.title,
                content: formData.content,
                timestamp: Date.now()
            }));
            setToast({ type: "info", message: "บันทึกแบบร่างอัตโนมัติแล้ว" });
        }, 30000);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [formData.title, formData.content, blogId, isLoading]);

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

                // ตรวจสอบ auto-save
                const saved = localStorage.getItem(`blog-edit-${blogId}`);
                if (saved) {
                    const parsed = JSON.parse(saved);
                    const timeDiff = Date.now() - parsed.timestamp;
                    // ถ้าบันทึกไว้ไม่เกิน 1 ชั่วโมง ให้ใช้ข้อมูลที่บันทึกไว้
                    if (timeDiff < 3600000) {
                        const loadedData = {
                            title: parsed.title,
                            content: parsed.content,
                            cover_image_url: data.cover_image_url || "",
                            source_url: data.source_url || ""
                        };
                        setFormData(loadedData);
                        initialDataRef.current = {
                            title: data.title || "",
                            content: data.content || "",
                            cover_image_url: data.cover_image_url || "",
                            source_url: data.source_url || ""
                        };
                        editor.commands.setContent(parsed.content);
                        setToast({ type: "info", message: "โหลดแบบร่างที่บันทึกไว้อัตโนมัติ" });
                        setIsLoading(false);
                        return;
                    }
                }

                const initialLoaded = {
                    title: data.title || "",
                    content: data.content || "",
                    cover_image_url: data.cover_image_url || "",
                    source_url: data.source_url || ""
                };
                setFormData(initialLoaded);
                initialDataRef.current = initialLoaded;
                editor.commands.setContent(data.content || "");
            } catch (err) {
                const error = err as Error;
                setToast({ type: "error", message: error.message });
            } finally {
                setIsLoading(false);
            }
        };
        fetchDetail();
    }, [blogId, editor, getToken]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const MAX_SIZE = 5 * 1024 * 1024;
        if (file.size > MAX_SIZE) {
            setToast({ type: "warning", message: "ไฟล์ต้องไม่เกิน 5MB" });
            return;
        }

        if (!file.type.startsWith('image/')) {
            setToast({ type: "warning", message: "กรุณาเลือกไฟล์ภาพเท่านั้น" });
            return;
        }

        setSelectedFile(file);
        const previewUrl = URL.createObjectURL(file);
        setFormData(prev => ({ ...prev, cover_image_url: previewUrl }));
        setIsUploading(true);

        try {
            const token = getToken();
            const uploadData = new FormData();
            uploadData.append("file", file);

            const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: uploadData
            });

            if (!uploadRes.ok) throw new Error("อัปโหลดไม่สำเร็จ");

            const uploadResult = await uploadRes.json();
            // แก้: เพิ่ม API_URL ข้างหน้าถ้า Backend ส่งมาแค่ /uploads/...
            const fullUrl = uploadResult.url.startsWith('http')
                ? uploadResult.url
                : `${process.env.NEXT_PUBLIC_API_URL}${uploadResult.url}`;
            setFormData(prev => ({ ...prev, cover_image_url: fullUrl }));
            setToast({ type: "success", message: "อัปโหลดรูปภาพสำเร็จ" });
        } catch (err) {
            const error = err as Error;
            setToast({ type: "error", message: error.message || "อัปโหลดรูปภาพไม่สำเร็จ" });
            setFormData(prev => ({ ...prev, cover_image_url: "" }));
        } finally {
            setIsUploading(false);
            setSelectedFile(null);
        }
    };

    const removeImage = () => {
        setFormData(prev => ({ ...prev, cover_image_url: "" }));
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title.trim()) {
            setToast({ type: "warning", message: "กรุณากรอกหัวข้อข่าว" });
            return;
        }

        if (isUploading) {
            setToast({ type: "warning", message: "กรุณารอการอัปโหลดรูปภาพให้เสร็จก่อน" });
            return;
        }

        setIsSaving(true);
        const token = getToken();

        try {
            let finalImageUrl = formData.cover_image_url;

            // ถ้า URL เป็น blob:// แสดงว่ายังไม่ได้อัปโหลดจริง
            if (selectedFile && finalImageUrl.startsWith('blob:')) {
                const uploadData = new FormData();
                uploadData.append("file", selectedFile);

                const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news/upload`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` },
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
                    cover_image_url: finalImageUrl,
                    source_url: formData.source_url
                }),
            });

            if (!response.ok) throw new Error("บันทึกไม่สำเร็จ");

            // ล้าง localStorage หลังบันทึกสำเร็จ
            localStorage.removeItem(`blog-edit-${blogId}`);

            // รีเซ็ตสถานะ dirty
            initialDataRef.current = { ...formData };
            setSelectedFile(null);

            setToast({ type: "success", message: "อัปเดตข้อมูลเรียบร้อย!" });
            setTimeout(() => router.push('/admin/mnblog'), 1500);
        } catch (err) {
            const error = err as Error;
            setToast({ type: "error", message: error.message || "เกิดข้อผิดพลาดในการบันทึก" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleBackWithConfirm = async () => {
        if (isDirty()) {
            const result = await Swal.fire({
                title: 'ต้องการออกจากหน้านี้ใช่หรือไม่?',
                text: 'คุณมีการแก้ไขที่ยังไม่ได้บันทึก ข้อมูลอาจสูญหายหากออกจากหน้านี้',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#6b7280',
                confirmButtonText: 'ใช่, ออกจากหน้านี้',
                cancelButtonText: 'อยู่หน้านี้ต่อ',
                reverseButtons: true
            });
            if (result.isConfirmed) {
                router.push('/admin/mnblog');
            }
        } else {
            router.push('/admin/mnblog');
        }
    };

    if (isLoading) return (
        <Navbar_admin>
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="animate-spin text-green-600 mb-2" size={40} />
                <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
            </div>
        </Navbar_admin>
    );

    return (
        <Navbar_admin>
            <div className="max-w-7xl mx-auto w-full space-y-6 pb-20">
                <button
                    onClick={handleBackWithConfirm}
                    className="inline-flex items-center gap-1.5 text-green-600 hover:text-green-700 mb-5 text-sm font-medium transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> กลับสู่หน้าจัดการ
                </button>

                {/* ── Header ──────────────────────────────────────────────── */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1 flex items-center gap-3">
                                <FileText className="w-8 h-8 text-green-600" /> แก้ไขข่าวสาร
                            </h1>
                            <p className="text-sm text-gray-500">แก้ไขรายละเอียดเนื้อหาและอัปเดตข้อมูลข่าวสาร</p>
                        </div>
                        <div className="flex w-full sm:w-auto">
                            <button
                                onClick={handleUpdate}
                                disabled={isSaving}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 active:scale-95 hover:shadow-md disabled:opacity-50 transition-all shadow-sm"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 md:p-8 rounded-[32px] border border-gray-200 shadow-sm">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                        {/* Content */}
                        <div className="lg:col-span-8 space-y-6">
                            <div>
                                <label className="block text-xs font-black  text-gray-400 mb-2">หัวข้อข่าวสาร</label>
                                <input
                                    type="text"
                                    className="w-full text-2xl font-medium border-none p-0 focus:ring-0 text-gray-800"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="ใส่หัวข้อข่าว..."
                                />
                            </div>

                            <div className="border-t pt-6">
                                <label className="block text-xs font-black  text-gray-400 mb-3">เนื้อหาข่าวสาร</label>
                                <TiptapToolbar
                                    editor={editor}
                                    onAddLink={() => setLinkModalOpen(true)}
                                    onAddImage={() => setImageModalOpen(true)}
                                />
                                <div className="min-h-[400px] border rounded-xl p-4">
                                    <EditorContent editor={editor} className="prose prose-sm sm:prose lg:prose-lg focus:outline-none" />
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2 pt-4 border-t border-gray-100">
                                <Link2 className="w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    value={formData.source_url}
                                    onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                                    placeholder="ลิงก์แหล่งข่าว (Facebook / เว็บไซต์อ้างอิง)..."
                                    className="w-full text-sm text-blue-600 placeholder-gray-400 border-none p-0 focus:ring-0 bg-transparent"
                                />
                            </div>
                        </div>

                        {/* Sidebar */}
                        <div className="lg:col-span-4 space-y-6">
                            <label className="block text-xs font-black  text-gray-400 mb-4">ภาพหน้าปก</label>

                            {/* Toggle: Upload vs URL */}
                            <div className="flex gap-2 mb-4">
                                <button
                                    type="button"
                                    onClick={() => setImageMode('upload')}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${imageMode === 'upload'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <Upload className="w-4 h-4 inline mr-2" />
                                    อัปโหลดไฟล์
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setImageMode('url')}
                                    className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${imageMode === 'url'
                                            ? 'bg-green-600 text-white'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    <Link2 className="w-4 h-4 inline mr-2" />
                                    ใส่ URL
                                </button>
                            </div>

                            {imageMode === 'upload' ? (
                                <>
                                    <div
                                        onClick={() => !isUploading && fileInputRef.current?.click()}
                                        className="relative aspect-[4/3] bg-gray-50 rounded-[24px] overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-all"
                                    >
                                        {formData.cover_image_url ? (
                                            <>
                                                <img src={formData.cover_image_url} alt="Preview" className="w-full h-full object-cover" />
                                                {formData.cover_image_url && (
                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            removeImage();
                                                        }}
                                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-center">
                                                <Upload className="text-gray-300 w-8 h-8 mx-auto mb-2" />
                                                <p className="text-xs text-gray-400">คลิกเพื่ออัปโหลด</p>
                                            </div>
                                        )}
                                        {isUploading && (
                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                <Loader2 className="animate-spin text-white w-8 h-8" />
                                            </div>
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageUpload}
                                        className="hidden"
                                        accept="image/*"
                                    />
                                </>
                            ) : (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        placeholder="https://example.com/image.jpg"
                                        value={formData.cover_image_url}
                                        onChange={(e) => setFormData(prev => ({ ...prev, cover_image_url: e.target.value }))}
                                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    />
                                    {formData.cover_image_url && (
                                        <div className="relative aspect-[4/3] bg-gray-50 rounded-[24px] overflow-hidden border-2 border-gray-200">
                                            <img
                                                src={formData.cover_image_url}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect fill='%23f3f4f6' width='400' height='300'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ERูปภาพไม่พร้อมใช้งาน%3C/text%3E%3C/svg%3E";
                                                }}
                                            />
                                            <button
                                                type="button"
                                                onClick={removeImage}
                                                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                                <h4 className="text-green-700 text-xs font-medium mb-2 flex items-center gap-2">
                                    <AlertCircle size={14} /> คำแนะนำ
                                </h4>
                                <ul className="text-xs text-green-600/80 space-y-1">
                                    <li>• แนะนำขนาดภาพ 1200 x 800 px</li>
                                    <li>• ไฟล์ภาพต้องไม่เกิน 5MB</li>
                                    <li>• รองรับไฟล์: JPG, PNG, WebP</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {toast && (
                <Toast
                    type={toast.type}
                    message={toast.message}
                    onClose={() => setToast(null)}
                />
            )}

            {/* Link Modal */}
            {linkModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">เพิ่มลิงก์</h3>
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://example.com"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-green-500 focus:outline-none"
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setLinkModalOpen(false);
                                    setLinkUrl("");
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={() => {
                                    if (linkUrl && editor) {
                                        editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
                                    }
                                    setLinkModalOpen(false);
                                    setLinkUrl("");
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                เพิ่ม
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Modal */}
            {imageModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-medium text-gray-800 mb-4">เพิ่มรูปภาพในเนื้อหา</h3>
                        <input
                            type="url"
                            value={imageUrl}
                            onChange={(e) => setImageUrl(e.target.value)}
                            placeholder="https://example.com/image.jpg"
                            className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-green-500 focus:outline-none"
                            autoFocus
                        />
                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setImageModalOpen(false);
                                    setImageUrl("");
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={() => {
                                    if (imageUrl && editor) {
                                        editor.chain().focus().setImage({ src: imageUrl }).run();
                                    }
                                    setImageModalOpen(false);
                                    setImageUrl("");
                                }}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                            >
                                เพิ่ม
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Navbar_admin>
    );
}