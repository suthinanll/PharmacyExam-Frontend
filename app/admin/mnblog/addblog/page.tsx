/* eslint-disable @next/next/no-img-element */
"use client";

import Navbar_admin from "@/components/Navbar_admin";
import Toast from "@/components/Toast";
import {
    ChevronLeft,
    Save,
    Trash2,
    Loader2,
    Image as ImageIcon,
    Plus,
    FileText,
    Upload,
    Link2,
    Bold,
    Italic,
    List as ListIcon,
    ListOrdered,
    Quote,
    Minus,
    X,
    Strikethrough,
    Send,
} from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';
import Swal from "@/utils/sweetalert";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Strike from "@tiptap/extension-strike";

interface BlogFormData {
    tempId: number;
    title: string;
    imageUrl: string;
    imageFile?: File | null;
    content: string;
    categoryIds: number[];
    sourceUrl?: string;
    author_id?: number;
    isUploading?: boolean;
}

const TiptapToolbar = ({ editor, onAddLink, onAddImage }: { editor: any; onAddLink: () => void; onAddImage: () => void }) => {
    if (!editor) return null;

    const btnClass = (activeName: string, attrs = {}) =>
        `p-1.5 rounded transition-colors ${editor.isActive(activeName, attrs) ? "bg-green-100 text-green-600" : "text-gray-500 hover:bg-gray-100"}`;

    return (
        <div className="flex flex-wrap gap-1 pb-2 mb-3 border-b border-gray-100 sticky top-0 bg-white z-10" role="toolbar" aria-label="เครื่องมือจัดรูปแบบข้อความ">
            <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} aria-label="ตัวหนา" className={btnClass("bold")}>
                <Bold className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} aria-label="ตัวเอียง" className={btnClass("italic")}>
                <Italic className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleStrike().run()} aria-label="ขีดทับ" className={btnClass("strike")}>
                <Strikethrough className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-gray-200 mx-1 self-center" />
            <button type="button" onClick={() => editor.chain().focus().toggleBulletList().run()} aria-label="รายการแบบสัญลักษณ์" className={btnClass("bulletList")}>
                <ListIcon className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleOrderedList().run()} aria-label="รายการแบบลำดับเลข" className={btnClass("orderedList")}>
                <ListOrdered className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().toggleBlockquote().run()} aria-label="กล่องข้อความอ้างอิง" className={btnClass("blockquote")}>
                <Quote className="w-4 h-4" />
            </button>
            <button type="button" onClick={() => editor.chain().focus().setHorizontalRule().run()} aria-label="เส้นคั่นแนวนอน" className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                <Minus className="w-4 h-4" />
            </button>
            <button type="button" onClick={onAddLink} aria-label="แทรกลิงก์" className={btnClass("link")}>
                <Link2 className="w-4 h-4" />
            </button>
            <button type="button" onClick={onAddImage} aria-label="แทรกรูปภาพ" className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                <ImageIcon className="w-4 h-4" />
            </button>
        </div>
    );
};

const DraftCard = ({
    draft,
    index,
    onUpdate,
    onRemove,
    onOpenLinkModal,
    onOpenImageModal,
}: {
    draft: BlogFormData;
    index: number;
    onUpdate: (id: number, field: keyof BlogFormData, value: any) => void;
    onRemove: (id: number) => void;
    onOpenLinkModal: (editor: any) => void;
    onOpenImageModal: (editor: any) => void;
}) => {
    const { getToken } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            Strike,
            LinkExtension.configure({ openOnClick: false }),
            Image.configure({ inline: true })
        ],
        content: draft.content,
        immediatelyRender: false,
        onUpdate: ({ editor }) => {
            onUpdate(draft.tempId, "content", editor.getHTML());
        },
    });

    useEffect(() => {
        if (editor && draft.content !== editor.getHTML()) {
            editor.commands.setContent(draft.content);
        }
    }, [draft.content, editor]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
            alert("ไฟล์ต้องไม่เกิน 5MB");
            return;
        }

        if (!file.type.startsWith('image/')) {
            alert("กรุณาเลือกไฟล์ภาพเท่านั้น");
            return;
        }

        // Show preview immediately
        const previewUrl = URL.createObjectURL(file);
        onUpdate(draft.tempId, "imageUrl", previewUrl);
        onUpdate(draft.tempId, "imageFile", file);
        onUpdate(draft.tempId, "isUploading", true);

        try {
            const token = getToken();
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) throw new Error("อัปโหลดไม่สำเร็จ");

            const data = await response.json();
            // แก้: เพิ่ม API_URL ข้างหน้าถ้า Backend ส่งมาแค่ /uploads/...
            const fullUrl = data.url.startsWith('http')
                ? data.url
                : `${process.env.NEXT_PUBLIC_API_URL}${data.url}`;
            onUpdate(draft.tempId, "imageUrl", fullUrl);
        } catch (error) {
            console.error(error);
            alert("อัปโหลดรูปภาพไม่สำเร็จ");
            onUpdate(draft.tempId, "imageUrl", "");
        } finally {
            onUpdate(draft.tempId, "isUploading", false);
            onUpdate(draft.tempId, "imageFile", null);
        }
    };

    const removeImage = () => {
        onUpdate(draft.tempId, "imageUrl", "");
        onUpdate(draft.tempId, "imageFile", null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    return (
        <div className="group relative bg-white p-6 rounded-3xl border border-gray-200 hover:border-green-300 transition-all shadow-sm">
            <div className="absolute -left-3 top-6 w-8 h-8 bg-white border-2 border-green-500 text-green-600 rounded-full flex items-center justify-center font-medium text-sm z-10 shadow-sm">
                {index + 1}
            </div>

            <button
                type="button"
                onClick={() => onRemove(draft.tempId)}
                aria-label={`ลบรายการร่างข่าวสารที่ ${index + 1}`}
                className="absolute -right-3 -top-3 p-2 bg-white text-red-500 hover:bg-red-500 hover:text-white rounded-full border border-gray-100 shadow-md transition-all opacity-0 group-hover:opacity-100"
            >
                <Trash2 className="w-4 h-4" />
            </button>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 space-y-4">
                    <input
                        type="text"
                        value={draft.title}
                        onChange={(e) => onUpdate(draft.tempId, "title", e.target.value)}
                        placeholder="หัวข้อข่าวสาร..."
                        aria-label={`หัวข้อข่าวสาร รายการที่ ${index + 1}`}
                        className="w-full text-xl font-medium border-none p-0 focus:ring-0 placeholder-gray-300 bg-transparent"
                    />

                    <div className="border-t pt-4">
                        <TiptapToolbar
                            editor={editor}
                            onAddLink={() => onOpenLinkModal(editor)}
                            onAddImage={() => onOpenImageModal(editor)}
                        />
                        <EditorContent
                            editor={editor}
                            className="prose prose-sm max-w-none min-h-[180px] outline-none text-gray-700 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-gray-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_s]:line-through"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                        <Link2 className="w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={draft.sourceUrl || ""}
                            onChange={(e) => onUpdate(draft.tempId, "sourceUrl", e.target.value)}
                            placeholder="ลิงก์แหล่งข่าว (Facebook / เว็บไซต์อ้างอิง)..."
                            aria-label={`ลิงก์แหล่งข่าว รายการที่ ${index + 1}`}
                            className="w-full text-sm text-blue-600 placeholder-gray-400 border-none p-0 focus:ring-0 bg-transparent"
                        />
                    </div>
                </div>

                <div className="lg:col-span-4 border-l border-gray-50 pl-0 lg:pl-6 space-y-4">
                    <div className="relative aspect-video bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 group/img">
                        {draft.imageUrl ? (
                            <>
                                <img
                                    src={draft.imageUrl}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='225'%3E%3Crect fill='%23f3f4f6' width='400' height='225'/%3E%3Ctext fill='%239ca3af' font-family='sans-serif' font-size='18' x='50%25' y='50%25' text-anchor='middle' dominant-baseline='middle'%3ERูปภาพไม่พร้อมใช้งาน%3C/text%3E%3C/svg%3E";
                                    }}
                                />
                                {draft.isUploading && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                                    </div>
                                )}
                                <button
                                    type="button"
                                    onClick={removeImage}
                                    aria-label={`ลบรูปภาพหน้าปก รายการที่ ${index + 1}`}
                                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full shadow-lg opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-red-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                aria-label={`คลิกเพื่ออัปโหลดภาพหน้าปก รายการที่ ${index + 1}`}
                                className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                            >
                                <div className="text-center text-gray-500">
                                    <Upload className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                    <p className="text-[0.625rem] font-medium ">Upload Cover</p>
                                </div>
                            </button>
                        )}
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                        accept="image/*"
                        aria-label={`เลือกไฟล์ภาพหน้าปก รายการที่ ${index + 1}`}
                    />
                    <input
                        type="text"
                        placeholder="หรือวาง URL รูปภาพ..."
                        value={draft.imageUrl.startsWith('blob:') ? '' : draft.imageUrl}
                        onChange={(e) => onUpdate(draft.tempId, "imageUrl", e.target.value)}
                        aria-label={`หรือวาง URL รูปภาพหน้าปก รายการที่ ${index + 1}`}
                        className="w-full text-[0.625rem] border-gray-200 rounded-lg focus:ring-green-500 py-1"
                    />

                    {/* คำแนะนำการอัปโหลด */}
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <p className="text-xs font-medium text-blue-900 mb-1.5">คำแนะนำ</p>
                        <ul className="text-[0.625rem] text-blue-700 space-y-0.5">
                            <li>• แนะนำขนาดภาพ 1200 x 800 px</li>
                            <li>• ไฟล์ภาพต้องไม่เกิน 5MB</li>
                            <li>• รองรับไฟล์: JPG, PNG, WebP</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

function AddBlogPage() {
    const { getToken } = useAuth();
    const router = useRouter();

    const [drafts, setDrafts] = useState<BlogFormData[]>([
        {
            tempId: Date.now(),
            title: "",
            imageUrl: "",
            imageFile: null,
            content: "",
            categoryIds: [1],
            sourceUrl: "",
            author_id: 10,
            isUploading: false
        }
    ]);

    const [isSaving, setIsSaving] = useState(false);
    const [toast, setToast] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);
    const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Modal states for Link and Image
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [linkModalEditor, setLinkModalEditor] = useState<any>(null);
    const [linkUrl, setLinkUrl] = useState("");

    const [imageModalOpen, setImageModalOpen] = useState(false);
    const [imageModalEditor, setImageModalEditor] = useState<any>(null);
    const [imageUrl, setImageUrl] = useState("");
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [isUploadingContentImage, setIsUploadingContentImage] = useState(false);
    const imageFileInputRef = useRef<HTMLInputElement>(null);

    // Auto-save ทุก 30 วินาที
    useEffect(() => {
        const saveToLocalStorage = () => {
            const draftsToSave = drafts.map(d => ({
                ...d,
                imageFile: null, // ไม่เก็บ File object
                isUploading: false
            }));
            localStorage.setItem('blog-drafts', JSON.stringify(draftsToSave));
            setToast({ type: "info", message: "บันทึกแบบร่างอัตโนมัติแล้ว" });
        };

        if (autoSaveTimerRef.current) {
            clearTimeout(autoSaveTimerRef.current);
        }

        autoSaveTimerRef.current = setTimeout(saveToLocalStorage, 30000);

        return () => {
            if (autoSaveTimerRef.current) {
                clearTimeout(autoSaveTimerRef.current);
            }
        };
    }, [drafts]);

    // เตือนเมื่อพยายามปิดแท็บหรือรีเฟรชหน้าขณะมีข้อมูลที่ยังไม่ได้เผยแพร่
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            const hasContent = drafts.some(d => d.title.trim() || d.content.trim() || d.imageUrl || d.imageFile);
            if (hasContent) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [drafts]);

    const handleBackWithConfirm = async () => {
        const hasContent = drafts.some(d => d.title.trim() || d.content.trim() || d.imageUrl || d.imageFile);
        if (hasContent) {
            const result = await Swal.fire({
                title: 'ต้องการออกจากหน้านี้ใช่หรือไม่?',
                text: 'คุณมีข้อมูลข่าวสารที่ยังไม่ได้เผยแพร่ ข้อมูลอาจสูญหายหากออกจากหน้านี้',
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

    const addNewDraft = () => {
        setDrafts(prev => [
            ...prev,
            {
                tempId: Date.now(),
                title: "",
                imageUrl: "",
                imageFile: null,
                content: "",
                sourceUrl: "",
                author_id: 10,
                categoryIds: [1],
                isUploading: false
            },
        ]);
    };

    const removeDraft = (tempId: number) => {
        if (drafts.length === 1) return;
        setDrafts(prev => prev.filter((d) => d.tempId !== tempId));
    };

    const updateDraft = useCallback(
        (tempId: number, field: keyof BlogFormData, value: any) => {
            setDrafts((prev) =>
                prev.map((d) => (d.tempId === tempId ? { ...d, [field]: value } : d)),
            );
        },
        [],
    );

    const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
        if (file.size > MAX_SIZE) {
            setToast({ type: "error", message: "ไฟล์ต้องไม่เกิน 5MB" });
            return;
        }

        if (!file.type.startsWith('image/')) {
            setToast({ type: "error", message: "กรุณาเลือกไฟล์ภาพเท่านั้น" });
            return;
        }

        setIsUploadingContentImage(true);
        try {
            const token = getToken();
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (!response.ok) throw new Error("อัปโหลดไม่สำเร็จ");

            const data = await response.json();
            const fullUrl = data.url.startsWith('http')
                ? data.url
                : `${process.env.NEXT_PUBLIC_API_URL}${data.url}`;

            // แทรกรูปเข้าไปใน editor
            if (imageModalEditor) {
                imageModalEditor.chain().focus().setImage({ src: fullUrl }).run();
            }

            setImageModalOpen(false);
            setImageUrl("");
            setImageFile(null);
            if (imageFileInputRef.current) imageFileInputRef.current.value = "";
        } catch (error) {
            console.error(error);
            setToast({ type: "error", message: "อัปโหลดรูปภาพไม่สำเร็จ" });
        } finally {
            setIsUploadingContentImage(false);
        }
    };

    const handleSaveDraft = async () => {
        // Validation
        const emptyTitles = drafts.filter(d => !d.title.trim());
        if (emptyTitles.length > 0) {
            setToast({ type: "warning", message: "กรุณากรอกหัวข้อข่าวให้ครบทุกรายการ" });
            return;
        }
        const emptyContent = drafts.filter(d => !d.content.trim() || d.content === '<p></p>');
        if (emptyContent.length > 0) {
            setToast({ type: "warning", message: "กรุณากรอกเนื้อหาข่าวให้ครบทุกรายการ" });
            return;
        }
        const uploading = drafts.filter(d => d.isUploading);
        if (uploading.length > 0) {
            setToast({ type: "warning", message: "กรุณารอการอัปโหลดรูปภาพให้เสร็จก่อน" });
            return;
        }
        setIsSaving(true);
        try {
            const token = getToken();
            let successCount = 0;
            for (const draft of drafts) {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: draft.title,
                        content: draft.content,
                        cover_image_url: draft.imageUrl,
                        source_url: draft.sourceUrl,
                        categoryIds: draft.categoryIds,
                        status: 'DRAFT',
                        author_id: Number(draft.author_id || 10)
                    }),
                });
                if (response.ok) {
                    successCount++;
                } else {
                    throw new Error(`บันทึกแบบร่าง "${draft.title}" ไม่สำเร็จ`);
                }
            }
            localStorage.removeItem('blog-drafts');
            setToast({ type: "success", message: `บันทึกแบบร่างสำเร็จ ${successCount} รายการ!` });
            setTimeout(() => router.push('/admin/mnblog'), 1500);
        } catch (error: any) {
            setToast({ type: "error", message: error.message || "เกิดข้อผิดพลาดในการบันทึก" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleSubmitAll = async () => {
        const emptyTitles = drafts.filter(d => !d.title.trim());
        if (emptyTitles.length > 0) {
            setToast({ type: "warning", message: "กรุณากรอกหัวข้อข่าวให้ครบทุกรายการ" });
            return;
        }
        const emptyContent = drafts.filter(d => !d.content.trim() || d.content === '<p></p>');
        if (emptyContent.length > 0) {
            setToast({ type: "warning", message: "กรุณากรอกเนื้อหาข่าวให้ครบทุกรายการ" });
            return;
        }
        const uploading = drafts.filter(d => d.isUploading);
        if (uploading.length > 0) {
            setToast({ type: "warning", message: "กรุณารอการอัปโหลดรูปภาพให้เสร็จก่อน" });
            return;
        }

        setIsSaving(true);
        try {
            const token = getToken();
            let successCount = 0;

            for (const draft of drafts) {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: draft.title,
                        content: draft.content,
                        cover_image_url: draft.imageUrl,
                        source_url: draft.sourceUrl,
                        categoryIds: draft.categoryIds,
                        status: 'PUBLISHED',
                        author_id: Number(draft.author_id || 10)
                    }),
                });

                if (response.ok) {
                    successCount++;
                } else {
                    throw new Error(`บันทึกข่าว "${draft.title}" ไม่สำเร็จ`);
                }
            }
            localStorage.removeItem('blog-drafts');
            setToast({ type: "success", message: `บันทึกข่าวสารสำเร็จ ${successCount} รายการ!` });
            setTimeout(() => router.push('/admin/mnblog'), 1500);
        } catch (error: any) {
            setToast({ type: "error", message: error.message || "เกิดข้อผิดพลาดในการบันทึก" });
        } finally {
            setIsSaving(false);
        }
    };

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
                                <FileText className="w-8 h-8 text-green-600" /> จัดการคิวข่าวสาร
                            </h1>
                            <p className="text-sm text-gray-500">สร้างเนื้อหาและตั้งค่ารายละเอียดข่าวสารประชาสัมพันธ์</p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <button
                                onClick={handleSaveDraft}
                                disabled={isSaving || drafts.length === 0}
                                className={`flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl transition-all shadow-sm border border-gray-200 ${isSaving ? 'bg-gray-100 text-gray-600 cursor-not-allowed' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกร่าง'}</span>
                            </button>
                            <button
                                onClick={handleSubmitAll}
                                disabled={isSaving || drafts.length === 0}
                                className={`flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl text-white transition-all shadow-sm ${isSaving ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 active:scale-95 hover:shadow-md'}`}
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                <span>{isSaving ? 'กำลังบันทึก...' : 'เผยแพร่ทั้งหมด'}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {drafts.map((draft, index) => (
                        <DraftCard
                            key={draft.tempId}
                            draft={draft}
                            index={index}
                            onUpdate={updateDraft}
                            onRemove={removeDraft}
                            onOpenLinkModal={(editor) => {
                                setLinkModalOpen(true);
                                setLinkModalEditor(editor);
                            }}
                            onOpenImageModal={(editor) => {
                                setImageModalOpen(true);
                                setImageModalEditor(editor);
                            }}
                        />
                    ))}
                </div>

                <button
                    onClick={addNewDraft}
                    className="mt-8 w-full py-4 border-2 border-dashed border-gray-300 rounded-3xl text-gray-600 hover:text-green-700 hover:border-green-300 hover:bg-green-50 transition-all flex items-center justify-center gap-2 font-medium"
                >
                    <Plus className="w-5 h-5" /> เพิ่มรายการในคิว
                </button>
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
                        <h2 className="text-lg font-medium text-gray-800 mb-4">เพิ่มลิงก์</h2>
                        <input
                            type="url"
                            value={linkUrl}
                            onChange={(e) => setLinkUrl(e.target.value)}
                            placeholder="https://example.com"
                            aria-label="URL ลิงก์ที่ต้องการเพิ่ม"
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
                                    if (linkUrl && linkModalEditor) {
                                        linkModalEditor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl }).run();
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
                        <h2 className="text-lg font-medium text-gray-800 mb-4">เพิ่มรูปภาพในเนื้อหา</h2>

                        {/* แท็บเลือกวิธี */}
                        <div className="flex gap-2 mb-4">
                            <button
                                onClick={() => setImageFile(null)}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${!imageFile ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                            >
                                URL
                            </button>
                            <button
                                onClick={() => imageFileInputRef.current?.click()}
                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${imageFile ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
                            >
                                อัปโหลดไฟล์
                            </button>
                        </div>

                        {/* แสดงส่วน URL หรือไฟล์ที่เลือก */}
                        {!imageFile ? (
                            <input
                                type="url"
                                value={imageUrl}
                                onChange={(e) => setImageUrl(e.target.value)}
                                placeholder="https://example.com/image.jpg"
                                aria-label="URL รูปภาพที่ต้องการแทรก"
                                className="w-full border border-gray-300 rounded-lg px-4 py-2 mb-4 focus:ring-2 focus:ring-green-500 focus:outline-none"
                                autoFocus
                            />
                        ) : (
                            <div className="mb-4 p-3 bg-green-50 rounded-lg border border-green-200 flex items-center gap-2">
                                <ImageIcon className="w-4 h-4 text-green-600" />
                                <span className="text-sm text-green-700 flex-1 truncate">{imageFile.name}</span>
                                <button
                                    onClick={() => {
                                        setImageFile(null);
                                        if (imageFileInputRef.current) imageFileInputRef.current.value = "";
                                    }}
                                    aria-label="ยกเลิกไฟล์รูปภาพที่เลือก"
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        )}

                        <input
                            ref={imageFileInputRef}
                            type="file"
                            accept="image/*"
                            aria-label="เลือกไฟล์รูปภาพเพื่ออัปโหลด"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) setImageFile(file);
                            }}
                            className="hidden"
                        />

                        <div className="flex gap-2 justify-end">
                            <button
                                onClick={() => {
                                    setImageModalOpen(false);
                                    setImageUrl("");
                                    setImageFile(null);
                                    if (imageFileInputRef.current) imageFileInputRef.current.value = "";
                                }}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                disabled={isUploadingContentImage}
                            >
                                ยกเลิก
                            </button>
                            <button
                                onClick={() => {
                                    if (imageFile) {
                                        // สร้าง fake event สำหรับ handleContentImageUpload
                                        const fakeEvent = {
                                            target: { files: [imageFile] }
                                        } as any;
                                        handleContentImageUpload(fakeEvent);
                                    } else if (imageUrl && imageModalEditor) {
                                        imageModalEditor.chain().focus().setImage({ src: imageUrl }).run();
                                        setImageModalOpen(false);
                                        setImageUrl("");
                                    }
                                }}
                                disabled={(!imageUrl && !imageFile) || isUploadingContentImage}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isUploadingContentImage ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        กำลังอัปโหลด...
                                    </>
                                ) : (
                                    'เพิ่ม'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Navbar_admin>
    );
}

export default AddBlogPage;