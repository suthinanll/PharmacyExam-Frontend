/* eslint-disable @next/next/no-img-element */
"use client";

import Navbar_admin from "@/components/Navbar_admin";
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
    Sparkles, // เพิ่มไอคอนสำหรับ AI
} from "lucide-react";
import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from '@/contexts/AuthContext';


import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import LinkExtension from "@tiptap/extension-link";

interface BlogFormData {
    tempId: number;
    title: string;
    imageUrl: string;
    content: string;
    categoryIds: number[];
}

const TiptapToolbar = ({ editor }: { editor: any }) => {
    if (!editor) return null;

    const addLink = () => {
        const url = window.prompt("ใส่ URL ของลิงก์:");
        if (url)
            editor
                .chain()
                .focus()
                .extendMarkRange("link")
                .setLink({ href: url })
                .run();
    };

    const btnClass = (activeName: string, attrs = {}) =>
        `p-1.5 rounded transition-colors ${editor.isActive(activeName, attrs) ? "bg-green-100 text-green-600" : "text-gray-500 hover:bg-gray-100"}`;

    return (
        <div className="flex flex-wrap gap-1 pb-2 mb-3 border-b border-gray-100 sticky top-0 bg-white z-10">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={btnClass("bold")}
            >
                <Bold className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={btnClass("italic")}
            >
                <Italic className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-gray-200 mx-1 self-center" />
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={btnClass("bulletList")}
            >
                <ListIcon className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={btnClass("orderedList")}
            >
                <ListOrdered className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                className={btnClass("blockquote")}
            >
                <Quote className="w-4 h-4" />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                className="p-1.5 text-gray-500 hover:bg-gray-100 rounded"
            >
                <Minus className="w-4 h-4" />
            </button>
            <button type="button" onClick={addLink} className={btnClass("link")}>
                <Link2 className="w-4 h-4" />
            </button>
        </div>
    );
};

const DraftCard = ({
    draft,
    index,
    onUpdate,
    onRemove,
}: {
    draft: BlogFormData;
    index: number;
    onUpdate: (id: number, field: keyof BlogFormData, value: any) => void;
    onRemove: (id: number) => void;
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const editor = useEditor({
        extensions: [StarterKit, LinkExtension.configure({ openOnClick: false })],
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

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const fakeUrl = URL.createObjectURL(file);
            onUpdate(draft.tempId, "imageUrl", fakeUrl);
        }
    };

    return (
        <div className="group relative bg-white p-6 rounded-3xl border border-gray-200 hover:border-green-300 transition-all shadow-sm">
            <div className="absolute -left-3 top-6 w-8 h-8 bg-white border-2 border-green-500 text-green-600 rounded-full flex items-center justify-center font-black text-sm z-10 shadow-sm">
                {index + 1}
            </div>

            <button
                onClick={() => onRemove(draft.tempId)}
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
                        className="w-full text-xl font-bold border-none p-0 focus:ring-0 placeholder-gray-300 bg-transparent"
                    />

                    <div className="border-t pt-4">
                        <TiptapToolbar editor={editor} />
                        <EditorContent
                            editor={editor}
                            className="prose prose-sm max-w-none min-h-[180px] outline-none text-gray-700"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                        <Link2 className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            value={draft.sourceUrl}
                            onChange={(e) =>
                                onUpdate(draft.tempId, "sourceUrl", e.target.value)
                            }
                            placeholder="ลิงก์แหล่งข่าว (Facebook / เว็บไซต์อ้างอิง)..."
                            className="w-full text-sm text-blue-600 placeholder-gray-300 border-none p-0 focus:ring-0 bg-transparent"
                        />
                    </div>
                </div>

                <div className="lg:col-span-4 border-l border-gray-50 pl-0 lg:pl-6 space-y-4">
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="relative aspect-video bg-gray-50 rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center group/img cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                        {draft.imageUrl ? (
                            <img
                                src={draft.imageUrl}
                                alt="Preview"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-center text-gray-400">
                                <Upload className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                <p className="text-[10px] font-bold uppercase tracking-widest">
                                    Upload Cover
                                </p>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                            <ImageIcon className="text-white w-6 h-6" />
                        </div>
                    </div>

                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        className="hidden"
                        accept="image/*"
                    />

                    <input
                        type="text"
                        placeholder="หรือวาง URL รูปภาพ..."
                        value={draft.imageUrl}
                        onChange={(e) => onUpdate(draft.tempId, "imageUrl", e.target.value)}
                        className="w-full text-[10px] border-gray-200 rounded-lg focus:ring-green-500 py-1"
                    />
                </div>
            </div>
        </div>
    );
};

function AddBlogPage() {
    const { getToken } = useAuth();
    const router = useRouter();
    const [formData, setFormData] = useState<BlogFormData>({
        title: '',
        imageUrl: '',
        content: '',
        categoryIds: [1],
    });

    const [isSaving, setIsSaving] = useState(false);
    const [isFetching, setIsFetching] = useState(false); // สถานะ Loading สำหรับ AI

    const addNewDraft = () => {
        setDrafts([
            ...drafts,
            {
                tempId: Date.now(),
                title: "",
                imageUrl: "",
                content: "",
                sourceUrl: "",
                author_id: 10,
                categoryIds: [1],
            },
        ]);
    };

    const removeDraft = (tempId: number) => {
        if (drafts.length === 1) return;
        setDrafts(drafts.filter((d) => d.tempId !== tempId));
    };

    const updateDraft = useCallback(
        (tempId: number, field: keyof BlogFormData, value: any) => {
            setDrafts((prev) =>
                prev.map((d) => (d.tempId === tempId ? { ...d, [field]: value } : d)),
            );
        },
        [],
    );

    // app\admin\mnblog\addblog\page.tsx

    const handleAutoFetch = async () => {
        const url = window.prompt("วางลิงก์หน้าเพจ หรือลิงก์โพสต์ Facebook:");
        if (!url) return;

        setIsFetching(true);
        try {
            const token = getToken();
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news/latest`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }); // ปรับ Endpoint ตามจริง
            if (!response.ok) throw new Error("ไม่สามารถดึงข้อมูลได้");

            const response = await fetch("http://localhost:5000/news/auto-fetch", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ url }),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    throw new Error("คุณไม่มีสิทธิ์เข้าถึง หรือไม่ได้เข้าสู่ระบบ");
                }
                throw new Error("ไม่สามารถดึงข้อมูลได้ (Backend Error)");
            }

            // รับข้อมูลซึ่งตอนนี้จะเป็น Array [ {title, content}, ... ]
            const data = await response.json();

            if (Array.isArray(data) && data.length > 0) {
                // แปลงข้อมูลที่ได้จาก AI ให้เข้ากับรูปแบบ BlogFormData ของเรา
                const newItems: BlogFormData[] = data.map((item: any, idx: number) => ({
                    // ใช้ Date.now() บวกกับ index และเลขสุ่มเพื่อให้ ID ไม่ซ้ำกันแน่นอน
                    tempId: Date.now() + idx + Math.floor(Math.random() * 1000),
                    title: item.title || "หัวข้อข่าวอัตโนมัติ",
                    content: item.content ? `<p>${item.content}</p>` : "",
                    imageUrl: "", // รูปภาพจาก FB Scraping ดึงยาก แนะนำให้แอดมินอัปโหลดเอง
                    sourceUrl: url,
                    author_id: 10,
                    categoryIds: [1],
                }));

                // เอาข่าวใหม่ที่ดึงได้ (newItems) ไปวางข้างหน้า drafts เดิมที่มีอยู่
                // ถ้าไม่อยากให้เหลือ Card เปล่าอันแรก ให้กรองอันที่ว่างออกได้ครับ
                setDrafts((prev) => {
                    const filteredPrev = prev.filter(
                        (d) => d.title !== "" || d.content !== "",
                    );
                    return [...newItems, ...filteredPrev];
                });

                alert(`ดึงข้อมูลสำเร็จ! พบทั้งหมด ${newItems.length} รายการ`);
            } else {
                alert("ไม่พบข้อมูลข่าวที่สรุปได้จากลิงก์นี้");
            }
        } catch (error: any) {
            console.error("Fetch Error:", error);
            alert("เกิดข้อผิดพลาด: " + error.message);
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmitAll = async () => {
        setIsSaving(true);
        try {
            const token = getToken();
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/news`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: formData.title,
                    content: formData.content,
                    cover_image_url: formData.imageUrl,
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
            <div className="max-w-5xl mx-auto px-4 pt-6 pb-20">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors mb-4 font-medium text-sm"
                >
                    <ChevronLeft className="w-4 h-4" /> กลับ
                </button>

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 flex items-center gap-3">
                            <FileText className="w-8 h-8 text-green-600" /> เพิ่มข่าวสาร
                        </h1>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                        <button
                            onClick={handleAutoFetch}
                            disabled={isFetching}
                            className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-xl font-bold border border-blue-100 hover:bg-blue-100 disabled:opacity-50 transition-all"
                        >
                            {isFetching ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <Sparkles className="w-5 h-5" />
                            )}
                            ดึงข้อมูลอัตโนมัติ
                        </button>

                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || isGenerating || !formData.title}
                        className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold rounded-lg text-white transition-all shadow-md ${isSaving || isGenerating ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 active:scale-95'
                            }`}
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึกข่าวสาร'}</span>
                    </button>
                </div>

                <div className="space-y-6">
                    {drafts.map((draft, index) => (
                        <DraftCard
                            key={draft.tempId}
                            draft={draft}
                            index={index}
                            onUpdate={updateDraft}
                            onRemove={removeDraft}
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
                                            onClick={() => setFormData({ ...formData, imageUrl: '' })}
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
                                className={`flex items-center justify-center gap-2 px-8 py-4 text-sm font-normal rounded-full transition-all w-full shadow-2xl ${isGenerating ? 'bg-gray-200 text-gray-500 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700 active:scale-95 cursor-pointer'
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
                            setContent={(c) => setFormData({ ...formData, content: c })}
                            isGenerating={isGenerating}
                        />
                    </div>
                </div>
                <button
                    onClick={addNewDraft}
                    className="mt-8 w-full py-4 border-2 border-dashed border-gray-300 rounded-3xl text-gray-400 hover:text-green-600 hover:border-green-300 hover:bg-green-50 transition-all flex items-center justify-center gap-2 font-bold"
                >
                    <Plus className="w-5 h-5" /> เพิ่มรายการในคิว
                </button>
            </div>
        </Navbar_admin>
    );
}

export default AddBlogPage;
