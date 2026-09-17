"use client"
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { User, Mail, Phone, Loader2, Edit3, Save, X, School, AlertCircle, Camera, ChevronDown, Trash2, KeyRound } from "lucide-react";
import { useState, useEffect, useRef } from 'react';
import Swal from "sweetalert2";
import Link from "next/link";
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from "@/components/LoadingSpinner";
import ImageCropModal from "@/components/ImageCropModal";

const Profile = () => {
    const { getToken, refreshUser } = useAuth();
    const [user, setUser] = useState<{
        first_name: string,
        last_name: string,
        email: string,
        tel: string,
        university_id?: number | null,
        university?: { university_id: number, name: string } | null,
        role?: { id: number, name: string },
        profile_picture?: string | null,
        provider?: 'local' | 'google',
        has_password?: boolean
    } | null>(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        tel: '',
    });

    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploadingImage, setIsUploadingImage] = useState(false);
    const [isRemovingImage, setIsRemovingImage] = useState(false);
    const [cropSource, setCropSource] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [passwordForm, setPasswordForm] = useState({ password: '', confirm_password: '' });
    const [isSavingPassword, setIsSavingPassword] = useState(false);
    const [imgError, setImgError] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [universities, setUniversities] = useState<{ university_id: number, name: string }[]>([]);
    const [selectedUniversityId, setSelectedUniversityId] = useState<number | null>(null);

    useEffect(() => {
        setImgError(false);
    }, [user?.profile_picture, previewImage]);

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = getToken();
                if (!token) return;
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (res.ok) {
                    const data = await res.json();
                    // แก้ URL รูปโปรไฟล์ให้เป็น absolute URL
                    if (data.profile_picture && !data.profile_picture.startsWith('http')) {
                        data.profile_picture = `${process.env.NEXT_PUBLIC_API_URL}${data.profile_picture}`;
                    }
                    setUser(data);
                    setSelectedUniversityId(data.university?.university_id ?? data.university_id ?? null);
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
    }, [getToken]);

    // ดึงรายการมหาวิทยาลัย
    useEffect(() => {
        const fetchUniversities = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/universities`);
                if (res.ok) {
                    const data = await res.json();
                    setUniversities(data);
                }
            } catch (err) {
                console.error("Failed to fetch universities:", err);
            }
        };
        fetchUniversities();
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
            confirmButtonColor: "#16a34a",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "ตกลง",
            cancelButtonText: "ยกเลิก",
            reverseButtons: true
        });

        if (!confirm.isConfirmed) return;

        setIsLoading(true);
        try {
            const token = getToken();
            const updateData: any = {
                first_name: formData.first_name,
                last_name: formData.last_name,
                tel: formData.tel,
            };

            // ถ้ามีการเลือกมหาวิทยาลัย ให้ส่งไปด้วย
            if (selectedUniversityId) {
                updateData.university_id = selectedUniversityId;
            }

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(updateData),
            });

            if (res.ok) {
                await Swal.fire({
                    icon: "success",
                    title: "สำเร็จ!",
                    text: "อัปเดตข้อมูลส่วนตัวเรียบร้อยแล้ว",
                    timer: 1500,
                    showConfirmButton: false
                });
                setIsEditing(false);

                // อัปเดต user state รวมข้อมูลมหาวิทยาลัย
                const selectedUniversity = universities.find(u => u.university_id === selectedUniversityId);
                setUser(prev => prev ? {
                    ...prev,
                    ...updateData,
                    university: selectedUniversity ? { university_id: selectedUniversity.university_id, name: selectedUniversity.name } : prev.university
                } : null);
                await refreshUser();
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

    // เลือกรูป → เปิดหน้าต่างครอปก่อน แล้วค่อยอัปโหลดรูปที่ครอปแล้ว
    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        // ล้างค่า input เพื่อให้เลือกไฟล์เดิมซ้ำได้
        e.target.value = '';
        if (!file) return;

        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!validTypes.includes(file.type)) {
            Swal.fire({
                icon: "error",
                title: "ไฟล์ไม่ถูกต้อง",
                text: "กรุณาเลือกไฟล์รูปภาพ (JPG, PNG, GIF, WebP)",
            });
            return;
        }

        // รูปต้นฉบับใหญ่ได้ถึง 10MB เพราะหลังครอปจะถูกย่อเหลือ 512×512 ก่อนอัปโหลด
        if (file.size > 10 * 1024 * 1024) {
            Swal.fire({
                icon: "error",
                title: "ไฟล์ใหญ่เกินไป",
                text: "กรุณาเลือกรูปที่มีขนาดไม่เกิน 10MB",
            });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => setCropSource(reader.result as string);
        reader.readAsDataURL(file);
    };

    const handleCropConfirm = async (blob: Blob) => {
        setIsUploadingImage(true);
        const localPreview = URL.createObjectURL(blob);
        setPreviewImage(localPreview);
        try {
            const body = new FormData();
            body.append('profile_picture', new File([blob], 'profile.jpg', { type: 'image/jpeg' }));

            const token = getToken();
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile/picture`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body,
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "อัปโหลดไม่สำเร็จ");
            }

            setCropSource(null);
            const fullPicUrl = data.profile_picture && !data.profile_picture.startsWith('http')
                ? `${process.env.NEXT_PUBLIC_API_URL}${data.profile_picture}`
                : data.profile_picture;
            setUser(prev => prev ? { ...prev, profile_picture: fullPicUrl } : null);

            await Swal.fire({
                icon: "success",
                title: "อัปโหลดสำเร็จ!",
                text: "รูปโปรไฟล์ของคุณถูกอัปเดตแล้ว",
                timer: 1500,
                showConfirmButton: false
            });
            await refreshUser();
        } catch (err) {
            console.error("Upload error:", err);
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด",
                text: err instanceof Error ? err.message : "ไม่สามารถอัปโหลดรูปได้ กรุณาลองใหม่อีกครั้ง"
            });
        } finally {
            setPreviewImage(null);
            URL.revokeObjectURL(localPreview);
            setIsUploadingImage(false);
        }
    };

    const handleRemovePicture = async () => {
        const confirm = await Swal.fire({
            title: "ลบรูปโปรไฟล์?",
            text: "รูปโปรไฟล์จะถูกลบและแสดงเป็นไอคอนเริ่มต้นแทน",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#dc2626",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "ลบรูป",
            cancelButtonText: "ยกเลิก",
            reverseButtons: true
        });
        if (!confirm.isConfirmed) return;

        setIsRemovingImage(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile/picture`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${getToken()}` },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || "ลบรูปไม่สำเร็จ");
            }

            setUser(prev => prev ? { ...prev, profile_picture: null } : null);
            await Swal.fire({
                icon: "success",
                title: "ลบรูปโปรไฟล์แล้ว",
                timer: 1500,
                showConfirmButton: false
            });
            await refreshUser();
        } catch (err) {
            Swal.fire({
                icon: "error",
                title: "เกิดข้อผิดพลาด",
                text: err instanceof Error ? err.message : "ไม่สามารถลบรูปได้ กรุณาลองใหม่อีกครั้ง"
            });
        } finally {
            setIsRemovingImage(false);
        }
    };

    // ตั้งรหัสผ่านครั้งแรก (บัญชีที่เข้าสู่ระบบด้วย Google)
    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordForm.password.length < 8) {
            Swal.fire({ icon: "error", title: "รหัสผ่านสั้นเกินไป", text: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร" });
            return;
        }
        if (passwordForm.password !== passwordForm.confirm_password) {
            Swal.fire({ icon: "error", title: "รหัสผ่านไม่ตรงกัน", text: "กรุณากรอกยืนยันรหัสผ่านให้ตรงกัน" });
            return;
        }

        setIsSavingPassword(true);
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile/password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getToken()}`,
                },
                body: JSON.stringify(passwordForm),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) {
                const message = Array.isArray(data.message) ? data.message.join(', ') : data.message;
                throw new Error(message || "ตั้งรหัสผ่านไม่สำเร็จ");
            }

            setPasswordForm({ password: '', confirm_password: '' });
            setUser(prev => prev ? { ...prev, has_password: true } : null);
            await Swal.fire({
                icon: "success",
                title: "ตั้งรหัสผ่านเรียบร้อย",
                text: "ต่อไปคุณสามารถเข้าสู่ระบบด้วยอีเมลและรหัสผ่านนี้ได้ด้วย",
                timer: 2000,
                showConfirmButton: false
            });
            await refreshUser();
        } catch (err) {
            Swal.fire({ icon: "error", title: "เกิดข้อผิดพลาด", text: err instanceof Error ? err.message : "ตั้งรหัสผ่านไม่สำเร็จ" });
        } finally {
            setIsSavingPassword(false);
        }
    };

    if (!user) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <LoadingSpinner size="lg" text="กำลังโหลดข้อมูลโปรไฟล์..." />
        </div>
    );

    // ตรวจสอบข้อมูลที่ยังไม่ครบ
    const missingFields = [];
    if (!user.first_name) missingFields.push('ชื่อจริง');
    if (!user.last_name) missingFields.push('นามสกุล');
    if (!user.tel) missingFields.push('เบอร์โทรศัพท์');
    if (!user.university) missingFields.push('มหาวิทยาลัย');
    if (user.has_password === false) missingFields.push('รหัสผ่าน');

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar_user />

            <main className="flex-grow p-4 md:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center text-sm text-gray-500 mb-5">
                        <Link href="/user" className="hover:text-green-600 cursor-pointer transition">หน้าหลัก</Link>
                        <span className="mx-2">›</span>
                        <span className="text-gray-600 font-medium">โปรไฟล์ของฉัน</span>
                    </div>

                    {/* แจ้งเตือนข้อมูลที่ยังไม่ครบ */}
                    {missingFields.length > 0 && (
                        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                            <div>
                                <h3 className="text-sm font-medium text-amber-900 mb-1">
                                    กรุณาเพิ่มข้อมูลให้ครบถ้วน
                                </h3>
                                <p className="text-xs text-amber-700">
                                    ข้อมูลที่ยังไม่ครบ: <span className="font-medium">{missingFields.join(', ')}</span>
                                </p>
                                <p className="text-xs text-amber-600 mt-1">
                                    การกรอกข้อมูลให้ครบจะช่วยให้คุณใช้งานระบบได้เต็มประสิทธิภาพ
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">

                        <div className="px-5 py-6 md:px-8 border-b border-gray-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white">
                            <div className="flex items-center gap-4 w-full sm:w-auto">
                                {/* รูปโปรไฟล์พร้อมปุ่มอัปโหลด */}
                                <div className="relative group">
                                    <div className="w-20 h-20 rounded-full overflow-hidden ring-2 ring-indigo-100 flex-shrink-0">
                                        {previewImage ? (
                                            <img
                                                src={previewImage}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : user.profile_picture && !imgError ? (
                                            <img
                                                src={user.profile_picture}
                                                alt="Profile"
                                                onError={() => setImgError(true)}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-indigo-50 flex items-center justify-center">
                                                <User className="w-10 h-10 text-indigo-600" />
                                            </div>
                                        )}
                                    </div>

                                    {/* ปุ่มเปลี่ยนรูป */}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={isUploadingImage}
                                        className="absolute bottom-0 right-0 bg-indigo-600 hover:bg-indigo-700 text-white p-2 rounded-full shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isUploadingImage ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Camera className="w-4 h-4" />
                                        )}
                                    </button>

                                    {/* ปุ่มลบรูป — แสดงเมื่อมีรูปโปรไฟล์อยู่ */}
                                    {user.profile_picture && (
                                        <button
                                            type="button"
                                            onClick={handleRemovePicture}
                                            disabled={isRemovingImage || isUploadingImage}
                                            title="ลบรูปโปรไฟล์"
                                            aria-label="ลบรูปโปรไฟล์"
                                            className="absolute bottom-0 left-0 bg-white hover:bg-red-50 text-red-600 border border-red-200 p-2 rounded-full shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                        >
                                            {isRemovingImage ? (
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                        </button>
                                    )}

                                    {/* Hidden file input */}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        onChange={handleImageChange}
                                        className="hidden"
                                    />
                                </div>

                                <div>
                                    <h1 className="text-lg md:text-xl font-medium text-gray-900">โปรไฟล์ผู้ใช้งาน</h1>
                                    <p className="text-xs md:text-sm text-gray-500">จัดการข้อมูลส่วนตัวของคุณ</p>
                                    {isUploadingImage && (
                                        <p className="text-xs text-indigo-600 mt-1 flex items-center gap-1">
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            กำลังอัปโหลด...
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="w-full sm:w-auto flex flex-row gap-2">
                                {!isEditing ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="w-full sm:w-auto flex items-center cursor-pointer  justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition shadow-sm"
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
                                            className="flex-1 sm:flex-none flex items-center cursor-pointer  justify-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 transition"
                                        >
                                            <X className="w-4 h-4" /> ยกเลิก
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSaveProfile}
                                            disabled={isLoading}
                                            className="flex-1 sm:flex-none flex items-center cursor-pointer justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition shadow-sm disabled:opacity-50"
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
                                    <label className="text-[10px] md:text-xs font-medium text-gray-400 ">ชื่อจริง</label>
                                    <input
                                        name="first_name"
                                        type="text"
                                        value={formData.first_name}
                                        readOnly={!isEditing}
                                        onChange={handleInputChange}
                                        placeholder={!formData.first_name ? "กรุณากรอกชื่อจริง" : ""}
                                        className={`w-full px-4 py-3 md:py-2.5 rounded-xl border text-sm transition-all outline-none ${isEditing ? "border-blue-500 ring-4 ring-blue-50 bg-white" : "border-gray-200 bg-gray-50 text-gray-500"
                                            }`}
                                    />
                                    {!formData.first_name && !isEditing && (
                                        <p className="text-xs text-amber-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            ยังไม่ได้กรอกชื่อจริง
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] md:text-xs font-medium text-gray-400 ">นามสกุล</label>
                                    <input
                                        name="last_name"
                                        type="text"
                                        value={formData.last_name}
                                        readOnly={!isEditing}
                                        onChange={handleInputChange}
                                        placeholder={!formData.last_name ? "กรุณากรอกนามสกุล" : ""}
                                        className={`w-full px-4 py-3 md:py-2.5 rounded-xl border text-sm transition-all outline-none ${isEditing ? "border-blue-500 ring-4 ring-blue-50 bg-white" : "border-gray-200 bg-gray-50 text-gray-500"
                                            }`}
                                    />
                                    {!formData.last_name && !isEditing && (
                                        <p className="text-xs text-amber-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            ยังไม่ได้กรอกนามสกุล
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1.5 md:col-span-2">
                                    <label className="text-[10px] md:text-xs font-medium text-gray-400 ">อีเมล (ไม่สามารถแก้ไขได้)</label>
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
                                    <label className="text-[10px] md:text-xs font-medium text-gray-400 ">เบอร์โทรศัพท์</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            name="tel"
                                            type="tel"
                                            value={formData.tel}
                                            readOnly={!isEditing}
                                            onChange={handleInputChange}
                                            placeholder="08X-XXX-XXXX"
                                            className={`w-full pl-10 pr-4 py-3 md:py-2.5 rounded-xl border text-sm transition-all outline-none ${isEditing ? "border-blue-500 ring-4 ring-blue-50 bg-white" : "border-gray-200 bg-gray-50 text-gray-500"
                                                }`}
                                        />
                                    </div>
                                    {!formData.tel && !isEditing && (
                                        <p className="text-xs text-amber-600 flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            ยังไม่ได้กรอกเบอร์โทรศัพท์
                                        </p>
                                    )}
                                </div>

                                <div className="md:col-span-2 pt-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] md:text-xs font-medium text-gray-400 ">มหาวิทยาลัย</label>
                                        {isEditing ? (
                                            <div className="relative">
                                                <School className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
                                                <select
                                                    value={selectedUniversityId || ''}
                                                    onChange={(e) => setSelectedUniversityId(Number(e.target.value))}
                                                    className="w-full pl-11 pr-10 py-3 md:py-2.5 rounded-xl border border-blue-500 ring-4 ring-blue-50 bg-white text-sm transition-all outline-none appearance-none cursor-pointer"
                                                >
                                                    <option value="">-- เลือกมหาวิทยาลัย --</option>
                                                    {universities.map((u) => (
                                                        <option key={u.university_id} value={u.university_id}>
                                                            {u.name}
                                                        </option>
                                                    ))}
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                            </div>
                                        ) : (
                                            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-4 flex items-center gap-3 text-gray-600">
                                                <School className="w-5 h-5 text-indigo-500" />
                                                <div className="leading-tight">
                                                    <p className="text-xs font-medium">{user.university?.name || "ไม่ระบุ"}</p>
                                                </div>
                                            </div>
                                        )}
                                        {!user.university && !isEditing && (
                                            <p className="text-xs text-amber-600 flex items-center gap-1 mt-2">
                                                <AlertCircle className="w-3 h-3" />
                                                ยังไม่ได้ระบุมหาวิทยาลัย
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </form>

                            {/* ตั้งรหัสผ่าน — เฉพาะบัญชีที่ยังไม่มีรหัสผ่าน (เข้าสู่ระบบด้วย Google) */}
                            {user.has_password === false && (
                                <form onSubmit={handleSetPassword} className="mt-8 border-t border-gray-100 pt-6">
                                    <div className="flex items-start gap-3 mb-4">
                                        <KeyRound className="w-5 h-5 text-indigo-500 mt-0.5" />
                                        <div>
                                            <h2 className="text-sm font-medium text-gray-900">ตั้งรหัสผ่าน</h2>
                                            <p className="text-xs text-gray-500">
                                                บัญชีนี้เข้าสู่ระบบด้วย Google ตั้งรหัสผ่านไว้เพื่อให้เข้าสู่ระบบด้วยอีเมลได้ด้วย
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                                        <div className="space-y-1.5">
                                            <label htmlFor="new-password" className="text-[10px] md:text-xs font-medium text-gray-400">รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)</label>
                                            <input
                                                id="new-password"
                                                type="password"
                                                autoComplete="new-password"
                                                value={passwordForm.password}
                                                onChange={(e) => setPasswordForm(prev => ({ ...prev, password: e.target.value }))}
                                                className="w-full px-4 py-3 md:py-2.5 rounded-xl border border-gray-300 bg-white text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label htmlFor="confirm-password" className="text-[10px] md:text-xs font-medium text-gray-400">ยืนยันรหัสผ่าน</label>
                                            <input
                                                id="confirm-password"
                                                type="password"
                                                autoComplete="new-password"
                                                value={passwordForm.confirm_password}
                                                onChange={(e) => setPasswordForm(prev => ({ ...prev, confirm_password: e.target.value }))}
                                                className="w-full px-4 py-3 md:py-2.5 rounded-xl border border-gray-300 bg-white text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-4 flex justify-end">
                                        <button
                                            type="submit"
                                            disabled={isSavingPassword || !passwordForm.password || !passwordForm.confirm_password}
                                            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
                                        >
                                            {isSavingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            บันทึกรหัสผ่าน
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {cropSource && (
                <ImageCropModal
                    imageSrc={cropSource}
                    isSaving={isUploadingImage}
                    onCancel={() => setCropSource(null)}
                    onConfirm={handleCropConfirm}
                />
            )}

            <Footer />
        </div>
    );
};

export default Profile;