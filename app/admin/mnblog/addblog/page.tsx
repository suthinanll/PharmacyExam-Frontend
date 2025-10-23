/* eslint-disable @next/next/no-img-element */
"use client";

import Navbar_admin from "@/components/Navbar_admin";
import Link from "next/link";
import { ChevronLeft, Save, Upload, Zap, Trash2, Loader2 } from "lucide-react";
import { useState } from "react";
// สมมติว่าคุณมี Text Editor component เช่น Tiptap/Quill/Lexical

// Interface สำหรับข้อมูลฟอร์ม
interface BlogFormData {
    title: string;
    imageUrl: string | null;
    content: string; // อาจเป็น HTML/JSON string จาก Editor
}

// Dummy Text Editor Component (ไม่มีการเปลี่ยนแปลง)
const DummyTextEditor = ({ content, setContent, isGenerating }: {
    content: string,
    setContent: (c: string) => void,
    isGenerating: boolean
}) => {
    return (
        <div className={`border rounded-lg p-4 min-h-[300px] transition-colors ${isGenerating ? 'bg-yellow-50 border-yellow-300' : 'bg-white border-gray-200'
            }`}>
            {isGenerating ? (
                <div className="flex flex-col items-center justify-center h-[200px] text-yellow-600">
                    <Loader2 className="w-6 h-6 animate-spin mb-3" />
                    <p>กำลังดึงข้อมูลข่าวสาร...</p>
                </div>
            ) : (
                <textarea
                    className="w-full h-full p-0 border-none focus:ring-0 resize-none text-gray-700 placeholder-gray-400 min-h-[280px]"
                    placeholder="ใส่รายละเอียดและเนื้อหาข่าวสารที่นี่..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                />
            )}
        </div>
    );
};


function AddBlogPage() {
    const [formData, setFormData] = useState<BlogFormData>({
        title: '',
        imageUrl: null,
        content: '',
    });
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleContentChange = (content: string) => {
        setFormData({ ...formData, content });
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            const fakeUrl = URL.createObjectURL(file); 
            setFormData({ ...formData, imageUrl: fakeUrl });
        }
    };

    const handleRemoveImage = () => {
        setFormData({ ...formData, imageUrl: null });
    };

    const handleAutoGenerate = async () => {
        setIsGenerating(true);
        console.log("Calling external API to fetch news content...");

        try {
            const response = await fetch('/api/news/latest', {
                method: 'GET',
            });

            if (!response.ok) {
                throw new Error(`Fetch failed with status: ${response.status}`);
            }

            const data = await response.json();

            // ตรวจสอบโครงสร้างข้อมูลที่ดึงมา
            if (!data.title || !data.content) {
                throw new Error("API response is missing required fields (title or content).");
            }

            setFormData({
                ...formData,
                title: data.title,
                content: data.content,
                // ใช้ data.imageUrl ถ้ามี
                imageUrl: data.imageUrl || null
            });

            // ใน handleAutoGenerate
        } catch (error) {
            console.error("Error fetching news:", error);

            // 💡 การแก้ไข: ใช้ Type Assertion เพื่อให้เข้าถึง .message ได้
            const errorMessage = (error instanceof Error) ? error.message : "Unknown error occurred.";

            alert(`ไม่สามารถดึงข้อมูลข่าวสารอัตโนมัติได้: ${errorMessage}`);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.title || !formData.content) {
            alert("กรุณากรอกชื่อบล็อกและเนื้อหา");
            return;
        }

        setIsSaving(true);

        try {
            const response = await fetch('/api/admin/blog', { // สมมติว่าใช้ API นี้ในการบันทึก
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `บันทึกไม่สำเร็จ, สถานะ: ${response.status}`);
            }

            // การบันทึกสำเร็จ
            alert("บันทึกบล็อกข่าวสารเรียบร้อย!");
            // router.push('/admin/mnblog'); 

        } catch (error) {
            console.error("Error fetching news:", error);

            const errorMessage = (error instanceof Error) ? error.message : "Unknown error occurred.";

            alert(`ไม่สามารถดึงข้อมูลข่าวสารอัตโนมัติได้: ${errorMessage}`);
        } finally {
            // ...
            setIsSaving(false);
        }
    };


    return (
        <Navbar_admin>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                <div className="flex justify-between items-center pb-4 mb-6">
                    <Link
                        href="/admin/mnblog"
                        className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span className="text-sm font-medium">กลับ</span>
                    </Link>

                    <h2 className="text-xl font-semibold text-gray-800">
                        เพิ่มบล็อกข่าวสารใหม่
                    </h2>

                    <button
                        onClick={handleSubmit}
                        disabled={isSaving || isGenerating || !formData.title || !formData.content}
                        className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors shadow-md ${isSaving || isGenerating ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                            }`}
                    >
                        {isSaving ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Save className="w-5 h-5" />
                        )}
                        <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</span>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <label htmlFor="blog-title" className="block text-sm font-medium text-gray-700 mb-2">
                            ชื่อบล็อก
                        </label>
                        <input
                            id="blog-title"
                            name="title"
                            type="text"
                            value={formData.title}
                            onChange={handleInputChange}
                            placeholder="เช่น บล็อกข่าวสารการสอบใบประกอบวิชาชีพปี 2567"
                            className="mt-1 block w-full border border-gray-300 rounded-lg shadow-sm p-3 text-base focus:border-green-500 focus:ring-green-500"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
                            <label className="block text-sm font-medium text-gray-700 mb-3">
                                ภาพข่าวสาร
                            </label>

                            {formData.imageUrl ? (
                                <div className="relative border border-gray-300 rounded-lg overflow-hidden h-60">
                                    <img
                                        src={formData.imageUrl}
                                        alt="Blog Cover Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    <button
                                        type="button"
                                        onClick={handleRemoveImage}
                                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors shadow-lg"
                                        aria-label="ลบรูปภาพ"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ) : (
                                <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50 h-60 flex flex-col items-center justify-center">
                                    <input
                                        id="file-upload"
                                        name="file-upload"
                                        type="file"
                                        className="sr-only"
                                        onChange={handleImageUpload}
                                        accept="image/*"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer flex flex-col items-center justify-center text-gray-600 hover:text-green-600 transition-colors"
                                    >
                                        <Upload className="w-8 h-8 mb-2" />
                                        <span className="text-sm font-medium">เพิ่มรูปภาพข่าวสาร</span>
                                        <span className="text-xs text-gray-500 mt-1">คลิกเพื่ออัปโหลด (แนะนำ 1200x600px)</span>
                                    </label>
                                </div>
                            )}
                        </div>

                        {/* AI Generator Button (เปลี่ยนข้อความให้สื่อถึงการดึงข้อมูล) */}
                        <div className="lg:col-span-1 bg-white p-6 rounded-xl shadow-lg flex flex-col justify-center items-center text-center">
                            <Zap className="w-10 h-10 text-green-600 mb-3" />
                            <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                ดึงข้อมูลข่าวสารอัตโนมัติ
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                ดึงข้อมูลล่าสุด (หัวข้อ/รายละเอียด/ภาพ) จากระบบข่าวสาร
                            </p>
                            <button
                                type="button"
                                onClick={handleAutoGenerate}
                                disabled={isGenerating}
                                className={`inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded-full transition-colors shadow-md w-full max-w-[200px] ${isGenerating ? 'bg-yellow-400 text-gray-700 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'
                                    }`}
                            >
                                {isGenerating ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>กำลังดึง...</span>
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4" />
                                        <span>ดึงข่าวสาร</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 3. Blog Content (Text Editor) (เหมือนเดิม) */}
                    <div className="bg-white p-6 rounded-xl shadow-lg">
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            เนื้อหาบล็อกข่าวสาร
                        </label>
                        <DummyTextEditor
                            content={formData.content}
                            setContent={handleContentChange}
                            isGenerating={isGenerating}
                        />
                        <p className="text-xs text-gray-500 mt-2">
                            *ในโค้ดจริงให้แทนที่ **DummyTextEditor** ด้วย Rich Text Editor (เช่น React-Quill, TipTap)
                        </p>
                    </div>

                </form>

            </div>
        </Navbar_admin>
    );
}

export default AddBlogPage;