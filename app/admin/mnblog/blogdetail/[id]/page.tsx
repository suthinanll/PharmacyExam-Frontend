"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar_admin from "@/components/Navbar_admin";
import { ChevronLeft, Save, Loader2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function EditBlogDetail() {
    const params = useParams();
    const router = useRouter();
    // ✅ ต้องใช้ชื่อ params.id ให้ตรงกับชื่อโฟลเดอร์ [id]
    const blogId = params?.id;

    const [formData, setFormData] = useState({ title: "", content: "", cover_image_url: "" });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    useEffect(() => {
        const fetchDetail = async () => {
            if (!blogId) return;

            setIsLoading(true);
            setErrorMessage("");

            try {
                // ✅ 1. ดึง Token ออกมาเตรียมไว้
                const token = localStorage.getItem('access_token');

                // ✅ 2. แนบ Authorization Header ในการเรียก GET
                const response = await fetch(`http://localhost:5000/news/${blogId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}` // ส่ง Token ไปยืนยันตัวตน
                    }
                });

                if (!response.ok) {
                    const status = response.status;
                    if (status === 401) throw new Error("เซสชันหมดอายุหรือไม่มีสิทธิ์เข้าถึง (401)");
                    if (status === 404) throw new Error("ไม่พบข้อมูลข่าวสารชิ้นนี้ (404)");
                    throw new Error(`เกิดข้อผิดพลาดรหัส ${status}`);
                }

                const data = await response.json();

                setFormData({
                    title: data.title || "",
                    content: data.content || "",
                    cover_image_url: data.cover_image_url || ""
                });
            } catch (error: any) {
                console.error("Fetch error:", error);
                setErrorMessage(error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDetail();
    }, [blogId]);
    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        const token = localStorage.getItem('access_token');

        try {
            const response = await fetch(`http://localhost:5000/news/${blogId}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                alert("อัปเดตข้อมูลข่าวสารเรียบร้อย!");
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
                <p className="text-gray-500">กำลังดึงข้อมูล ID: {blogId}...</p>
            </div>
        </Navbar_admin>
    );

    if (errorMessage) return (
        <Navbar_admin>
            <div className="flex flex-col items-center justify-center h-[60vh] text-red-500">
                <AlertCircle size={48} className="mb-4" />
                <p className="text-xl font-bold">{errorMessage}</p>
                <Link href="/admin/mnblog" className="mt-4 text-green-600 underline">กลับหน้าหลัก</Link>
            </div>
        </Navbar_admin>
    );

    return (
        <Navbar_admin>
            <div className="max-w-4xl mx-auto p-6">
                <Link href="/admin/mnblog" className="flex items-center text-green-600 mb-6 hover:translate-x-[-4px] transition-transform">
                    <ChevronLeft size={20} /> กลับไปหน้าจัดการ
                </Link>

                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
                    <h1 className="text-2xl font-bold mb-6 text-gray-800">ตั้งค่าและแก้ไขข่าวสาร (ID: {blogId})</h1>

                    <form onSubmit={handleUpdate} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">หัวข้อข่าว</label>
                            <input
                                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="ระบุชื่อหัวข้อข่าว..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">เนื้อหา</label>
                            <textarea
                                className="w-full p-3 border border-gray-200 rounded-xl h-80 focus:ring-2 focus:ring-green-500 outline-none"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="ระบุรายละเอียดข่าว..."
                            />
                        </div>
                        <div className="pt-4 border-t border-gray-50 flex justify-end">
                            <button
                                type="submit"
                                disabled={isSaving}
                                className="bg-green-600 text-white px-8 py-3 rounded-xl hover:bg-green-700 flex items-center gap-2 font-bold shadow-md active:scale-95 disabled:opacity-50 transition-all"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                บันทึกการเปลี่ยนแปลง
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Navbar_admin>
    );
}