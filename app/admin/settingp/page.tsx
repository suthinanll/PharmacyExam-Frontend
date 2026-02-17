"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect } from "react";
import React from "react";
import { User, Mail, Phone, ShieldCheck, Loader2, Edit3, Save, X } from "lucide-react";
import Swal from "sweetalert2";
import { useAuth } from '@/contexts/AuthContext';

function Page() {
  const { user, getToken } = useAuth();

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    tel: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);



  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirmResult = await Swal.fire({
      title: "ยืนยันการบันทึก?",
      text: "คุณต้องการเปลี่ยนแปลงข้อมูลโปรไฟล์ใช่หรือไม่",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#d33",
      confirmButtonText: "ใช่, บันทึกเลย",
      cancelButtonText: "ยกเลิก",
    });

    if (!confirmResult.isConfirmed) return;

    setIsLoading(true);

    try {
      const token = getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const result = await res.json();
        setError(result.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      } else {
        setSuccessMessage("บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว!");
        setIsEditing(false);
      }
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }

    setIsLoading(false);
  };

  // =============================
  // เปลี่ยนรหัสผ่าน
  // =============================
  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError("รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/change-password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      });

      if (!res.ok) {
        const result = await res.json();
        setError(result.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
      } else {
        setSuccessMessage("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "บันทึกสำเร็จ!",
          text: "ระบบจะทำการรีเฟรชหน้าจอเพื่ออัปเดตข้อมูล",
          timer: 1500,
          showConfirmButton: false,
        });

        // ✨ รีเฟรชหน้าจอหลังจากบันทึกสำเร็จ
        window.location.reload();
      } else {
        throw new Error("บันทึกไม่สำเร็จ");
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4 bg-gray-50">
      <Loader2 className="w-10 h-10 animate-spin text-gray-400" />
      <p className="text-gray-400 font-medium">กำลังโหลดข้อมูล...</p>
    </div>
  );
  return (
    <Navbar_admin>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-5xl mx-auto ">

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-500" />
                </div>
                <div>
                  <h1 className="text-xl font-medium text-gray-900">โปรไฟล์ส่วนตัว</h1>
                  <p className="text-sm text-gray-500">จัดการข้อมูลและรายละเอียดบัญชีของคุณ</p>
                </div>
              </div>

              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition shadow-sm"
                >
                  <Edit3 className="w-4 h-4" /> แก้ไข
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition"
                  >
                    <X className="w-4 h-4" /> ยกเลิก
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition shadow-sm disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    บันทึก
                  </button>
                </div>
              )}
            </div>

            {/* Form Section */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อจริง</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    readOnly={!isEditing}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-all outline-none ${isEditing
                      ? "border-blue-500 ring-2 ring-blue-50 bg-white"
                      : "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">นามสกุล</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    readOnly={!isEditing}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-all outline-none ${isEditing
                      ? "border-blue-500 ring-2 ring-blue-50 bg-white"
                      : "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">อีเมล</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      readOnly
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-400 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">เบอร์โทรศัพท์</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.tel}
                      readOnly={!isEditing}
                      onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                      placeholder="เช่น 0812345678"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-all outline-none ${isEditing
                        ? "border-blue-500 ring-2 ring-blue-50 bg-white"
                        : "border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                        }`}
                    />
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <ShieldCheck className="w-4 h-4 text-green-500" />
                  สิทธิ์การใช้งาน: <span className="font-medium">{user.role_id === 2 ? "Admin" : "User"}</span>
                </div>
              </div>

            </div>
          </div>

          {error && <p className="text-red-600 mb-4">{error}</p>}
          {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}

          {/* =============================
              Profile Form
          ============================= */}
          <form className="space-y-6">
            <h2 className="text-xl font-bold mb-6">ข้อมูลส่วนตัว</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium">ชื่อจริง</label>
                <input
                  type="text"
                  value={formData.first_name}
                  readOnly={!isEditing}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  className={`w-full border rounded-lg p-3 ${!isEditing ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                    }`}
                />
              </div>

              <div>
                <label className="text-sm font-medium">นามสกุล</label>
                <input
                  type="text"
                  value={formData.last_name}
                  readOnly={!isEditing}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  className={`w-full border rounded-lg p-3 ${!isEditing ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                    }`}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">อีเมล</label>
              <input
                type="email"
                value={formData.email}
                readOnly
                className="w-full border rounded-lg p-3 bg-gray-100 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-sm font-medium">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                value={formData.tel}
                readOnly={!isEditing}
                onChange={(e) =>
                  setFormData({ ...formData, tel: e.target.value })
                }
                className={`w-full border rounded-lg p-3 ${!isEditing ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                  }`}
              />
            </div>
          </form>

          {/* =============================
              Change Password 
          ============================= */}
          <div className="py-8 border-t mt-8"></div>

          <form className="space-y-6" onSubmit={handleSavePassword}>
            <h2 className="text-xl font-bold mb-6">ตั้งค่ารหัสผ่าน</h2>

            <div>
              <label className="text-sm font-medium">รหัสผ่านปัจจุบัน</label>
              <input
                type="password"
                placeholder="กรอกรหัสผ่านปัจจุบัน"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div>
              <label className="text-sm font-medium">รหัสผ่านใหม่</label>
              <input
                type="password"
                placeholder="กรอกรหัสผ่านใหม่"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    newPassword: e.target.value,
                  })
                }
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div>
              <label className="text-sm font-medium">ยืนยันรหัสผ่านใหม่</label>
              <input
                type="password"
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    confirmPassword: e.target.value,
                  })
                }
                className="w-full border rounded-lg p-3"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md"
            >
              <SaveIcon className="w-5 h-5" />
              <span>{isLoading ? "กำลังบันทึก..." : "บันทึกรหัสผ่าน"}</span>
            </button>
          </form>
        </div>
      </div>
    </Navbar_admin>
  );
}

export default Page;