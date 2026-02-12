"use client"
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { User, Mail, Phone, Loader2, Edit3, Save, X, School } from "lucide-react";
import { useState, useEffect } from 'react';
import Swal from "sweetalert2";
import Link from "next/link";

const Profile = () => {
    const [user, setUser] = useState<{
        first_name: string,
        last_name: string,
        email: string,
        tel: string,
        university?: { id: number, name: string },
        role?: { id: number, name: string }
    } | null>(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        tel: '',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem("access_token");
                if (!token) return;
                const res = await fetch("http://localhost:5000/auth/me", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                } else if (res.status === 401) {
                    // ถ้า Token หมดอายุให้เตะออกไปหน้า Login
                    localStorage.removeItem("access_token");
                    window.location.href = "/login";
                }
            } catch (err) {
                console.error("Fetch Error:", err);
            }
        };
        fetchUser();
    }, []);

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                email: user.email || "",
                tel: user.tel || "",
            });
        }
    }, [user]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const confirm = await Swal.fire({
            title: "บันทึกการเปลี่ยนแปลง?",
            text: "ข้อมูลโปรไฟล์ของคุณจะถูกอัปเดต",
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#111827",
            cancelButtonColor: "#ef4444",
            confirmButtonText: "ตกลง",
            cancelButtonText: "ยกเลิก"
        });

        if (!confirm.isConfirmed) return;

        setIsLoading(true);
        try {
            const token = localStorage.getItem("access_token");
            
            // --- แก้ไขจุดนี้: แยก email ออก ไม่ส่งไปซ้ำเพื่อเลี่ยง 409 Conflict ---
            const { email, ...updateData } = formData; 

            const res = await fetch('http://localhost:5000/users/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updateData), // ส่งแค่ชื่อ นามสกุล และเบอร์โทร
            });

            if (res.ok) {
                await Swal.fire({
                    icon: "success",
                    title: "สำเร็จ!",
                    text: "อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว",
                    timer: 1500,
                    showConfirmButton: false
                });
                setIsEditing(false); // ปิดโหมดแก้ไข
                // อัปเดต State user ในหน้าปัจจุบันโดยไม่ต้อง reload ทั้งหน้า (เพื่อความลื่นไหล)
                setUser(prev => prev ? { ...prev, ...updateData } : null);
            } else {
                const errorData = await res.json();
                throw new Error(errorData.message || "ล้มเหลว");
            }
        } catch (err: any) {
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด",
                text: err.message || "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง"
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!user) return (
        <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-gray-50 px-4">
            <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
            <p className="text-gray-400 font-medium tracking-wide text-center">กำลังดึงข้อมูลโปรไฟล์...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar_user />

            <main className="flex-grow py-6 md:py-12 px-4">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center text-sm text-gray-500 mb-4 ml-1 overflow-x-auto whitespace-nowrap pb-2 md:pb-0">
                        <Link href="/user" className="hover:text-indigo-600 transition">หน้าหลัก</Link>
                        <span className="mx-2 text-gray-400">›</span>
                        <span className="text-gray-700 font-medium">โปรไฟล์ของฉัน</span>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                        
                        <div className="px-5 py-6 md:px-8 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white">
                            <div className="flex items-center gap-4">
                                <div className="hidden xs:flex w-12 h-12 bg-indigo-50 rounded-full items-center justify-center flex-shrink-0">
                                    <User className="w-6 h-6 text-indigo-600" />
                                </div>
                                <div>
                                    <h1 className="text-lg md:text-xl font-bold text-gray-900">โปรไฟล์ผู้ใช้งาน</h1>
                                    <p className="text-xs md:text-sm text-gray-500">จัดการข้อมูลส่วนตัวของคุณ</p>
                                </div>
                            </div>

                            <div className="w-full sm:w-auto flex flex-row gap-2">
                                {!isEditing ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition shadow-sm"
                                    >
                                        <Edit3 className="w-4 h-4" /> แก้ไข
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsEditing(false);
                                                // คืนค่า formData เป็นค่าล่าสุดจาก user state
                                                setFormData({
                                                    first_name: user.first_name,
                                                    last_name: user.last_name,
                                                    email: user.email,
                                                    tel: user.tel,
                                                });
                                            }}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition"
                                        >
                                            <X className="w-4 h-4" /> ยกเลิก
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveProfile}
                                            disabled={isLoading}
                                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition shadow-sm disabled:opacity-50"
                                        >
                                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            บันทึก
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="p-5 md:p-8">
                            <form className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6" onSubmit={(e) => e.preventDefault()}>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">ชื่อจริง</label>
                                    <input
                                        name="first_name"
                                        type="text"
                                        value={formData.first_name}
                                        readOnly={!isEditing}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 md:py-2.5 rounded-xl border text-sm transition-all outline-none ${
                                            isEditing ? "border-blue-500 ring-4 ring-blue-50 bg-white" : "border-gray-200 bg-gray-50 text-gray-500"
                                        }`}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">นามสกุล</label>
                                    <input
                                        name="last_name"
                                        type="text"
                                        value={formData.last_name}
                                        readOnly={!isEditing}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-3 md:py-2.5 rounded-xl border text-sm transition-all outline-none ${
                                            isEditing ? "border-blue-500 ring-4 ring-blue-50 bg-white" : "border-gray-200 bg-gray-50 text-gray-500"
                                        }`}
                                    />
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">อีเมล (ไม่สามารถแก้ไขได้)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={formData.email}
                                            readOnly
                                            className="w-full pl-10 pr-4 py-3 md:py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-400 text-sm cursor-not-allowed overflow-hidden text-ellipsis"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">เบอร์โทรศัพท์</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            name="tel"
                                            type="tel"
                                            value={formData.tel}
                                            readOnly={!isEditing}
                                            onChange={handleInputChange}
                                            placeholder="08X-XXX-XXXX"
                                            className={`w-full pl-10 pr-4 py-3 md:py-2.5 rounded-xl border text-sm transition-all outline-none ${
                                                isEditing ? "border-blue-500 ring-4 ring-blue-50 bg-white" : "border-gray-200 bg-gray-50 text-gray-500"
                                            }`}
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2 pt-4">
                                    <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex items-center gap-3 text-gray-600">
                                            <School className="w-5 h-5 text-indigo-500" />
                                            <div className="leading-tight">
                                                <p className="text-[9px] text-gray-400 font-bold uppercase">มหาวิทยาลัย</p>
                                                <p className="text-xs font-semibold">{user.university?.name || "ไม่ระบุ"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default Profile;