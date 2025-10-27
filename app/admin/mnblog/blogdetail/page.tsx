/* eslint-disable @next/next/no-img-element */
"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState } from "react";
// เพิ่ม AlertTriangle
import { ChevronLeft, Trash2, Save, Loader2, AlertTriangle } from "lucide-react"; 
import Link from "next/link";
import { useRouter } from "next/navigation"; // สำหรับ Redirect หลังลบ

// Interface สำหรับข้อมูลฟอร์ม
interface BlogFormData {
  id: number | null;
  title: string;
  content: string;
  imageUrl: string; 
}

// Dummy Text Editor Component (ไม่มีการเปลี่ยนแปลง)
const DummyTextEditor = ({ content, setContent }: { 
    content: string, 
    setContent: (c: string) => void,
}) => {
    return (
        <textarea
            className="w-full h-full p-4 border rounded-lg min-h-[400px] border-gray-300 focus:border-green-500 focus:ring-green-500 resize-none text-gray-700 placeholder-gray-400"
            placeholder="ใส่รายละเอียดและเนื้อหาบล็อกที่นี่..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
        />
    );
};

// ************************************************************
// ** ข้อมูลเริ่มต้น (สมมติว่าดึงมาจาก API ด้วย ID) **
// ************************************************************
const initialBlogData: BlogFormData = {
  id: 123,
  title: "สภาเภสัชกรรม x วิทยาลัยเภสัชฯ นำความรู้ดีๆ มาให้แก่สมาชิก PHARMA TIPS: Oncology EP.03",
  content: "เนื้อหาข่าวสาร...", 
  imageUrl: "/img/news1.jpg", 
};

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string; // ชื่อบล็อกที่กำลังจะลบ
    isDeleting: boolean;
}

const DeleteConfirmationModal = ({ isOpen, onClose, onConfirm, title, isDeleting }: ModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4  transition-opacity">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
                <div className="p-6">
                    <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                    </div>

                    <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
                        ยืนยันการลบบล็อกข่าวสาร
                    </h2>

                    <p className="text-gray-600 text-center mb-6 text-sm">
                        คุณต้องการลบบล็อก **&quot;{title}&quot;** ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                    </p>

                    <div className="flex gap-3">
                        {/* ปุ่มยกเลิก */}
                        <button
                            onClick={onClose}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm disabled:opacity-70"
                        >
                            ยกเลิก
                        </button>
                        
                        {/* ปุ่มยืนยันการลบ */}
                        <button
                            onClick={onConfirm}
                            disabled={isDeleting}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm inline-flex items-center justify-center gap-2 ${
                                isDeleting 
                                ? 'bg-red-400 text-white cursor-not-allowed' 
                                : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>กำลังลบ...</span>
                                </>
                            ) : (
                                <span>ลบบล็อก</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

function EditBlogPage() {
    const router = useRouter();
    const [formData, setFormData] = useState<BlogFormData>(initialBlogData);
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // 💡 สถานะใหม่สำหรับ Modal

    const handleContentChange = (content: string) => {
        setFormData({ ...formData, content });
    };

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, title: e.target.value });
    };

    // 1. ฟังก์ชันเปิด Modal
    const handleDelete = () => {
        setIsDeleteModalOpen(true);
    };

    // 2. ฟังก์ชันยืนยันการลบ (เมื่อกด "ลบบล็อก" ใน Modal)
    const handleDeleteConfirm = async () => {
        setIsDeleting(true);
        console.log("Deleting Blog ID:", formData.id);

        try {
            // ** Logic การเรียก API ลบ (DELETE) **
            // const response = await fetch(`/api/admin/blog/${formData.id}`, { method: 'DELETE' });
            // if (!response.ok) throw new Error('Failed to delete blog');
            
            // จำลองการหน่วงเวลา
            await new Promise(resolve => setTimeout(resolve, 1500)); 
            
            alert("ลบบล็อกข่าวสารเรียบร้อย!");
            router.push('/admin/mnblog'); // Redirect กลับหน้า list

        } catch (error) {
            console.error("Deletion failed:", error);
            alert("เกิดข้อผิดพลาดในการลบ");
        } finally {
            setIsDeleting(false);
            setIsDeleteModalOpen(false); // ปิด Modal เสมอ
        }
    };


    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        console.log("Saving Blog Data:", formData);

        // ** Logic การเรียก API บันทึก (PUT/POST) **
        await new Promise(resolve => setTimeout(resolve, 1500)); 
        
        setIsSaving(false);
        alert("บันทึกบล็อกข่าวสารเรียบร้อย!");
    };


    return (
      <Navbar_admin>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          
          {/* Header Section */}
          <div className="flex justify-between items-center  pb-4 mb-6 -mx-4 sm:mx-0 px-4 sm:px-0 pt-4">
            
            {/* Left: Back Link */}
            <Link
              href="/admin/mnblog"
              className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm font-medium">กลับ</span>
            </Link>

            {/* Right: Actions */}
            <div className="flex gap-3">
                <button
                    onClick={handleDelete} // 💡 เปลี่ยนไปเรียก handleDelete ที่เปิด Modal
                    disabled={isSaving || isDeleting}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
                        isDeleting ? 'bg-red-300 text-red-800 cursor-not-allowed' : 'bg-white text-red-600 border-red-600 hover:bg-red-50'
                    }`}
                >
                    <Trash2 className="w-4 h-4" />
                    <span>ลบออก</span>
                </button>
                
                <button
                    onClick={handleSave}
                    disabled={isSaving || isDeleting || !formData.title || !formData.content}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors shadow-md ${
                        isSaving || isDeleting ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Save className="w-4 h-4" />
                    )}
                    <span>{isSaving ? 'กำลังบันทึก...' : 'บันทึก'}</span>
                </button>
            </div>
          </div>
          
          {/* Main Form Area */}
          <form onSubmit={handleSave} className="space-y-6">
            {/* ... โค้ดส่วนชื่อบล็อกและ Editor ... */}
             <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <label htmlFor="blog-title" className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อบล็อก
                </label>
                <input
                    id="blog-title"
                    name="title"
                    type="text"
                    value={formData.title}
                    onChange={handleTitleChange}
                    placeholder="ใส่ชื่อบล็อกข่าวสาร"
                    className="mt-1 block w-full border-b border-gray-300 focus:border-green-500 focus:ring-0 p-3 text-lg font-medium text-gray-800 placeholder-gray-400 outline-none"
                    required
                />
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
                <div className="relative w-full mb-6 rounded-lg overflow-hidden border border-gray-200">
                    <img 
                        src={formData.imageUrl} 
                        alt="Blog Cover" 
                        className="w-full h-auto max-hobject-cover" 
                        onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = "https://via.placeholder.com/1200x600?text=Image+Not+Found"; 
                        }}
                    />
                </div>
                
                <label className="block text-sm font-medium text-gray-700 mb-3">
                    เนื้อหาบล็อกข่าวสาร
                </label>
                <DummyTextEditor 
                    content={formData.content} 
                    setContent={handleContentChange} 
                />
            </div>
          </form>

        </div>

        {/* 💡 Modal Component */}
        <DeleteConfirmationModal 
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onConfirm={handleDeleteConfirm}
            title={formData.title} // ส่งชื่อบล็อกไปแสดงใน Modal
            isDeleting={isDeleting}
        />
      </Navbar_admin>
    );
}

export default EditBlogPage;