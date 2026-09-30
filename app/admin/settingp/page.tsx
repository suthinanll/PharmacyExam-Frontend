"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect } from "react";
import React from "react";
import { User, Mail, Phone, ShieldCheck, Loader2, Edit3, Save, X } from "lucide-react";
import Swal from "@/utils/sweetalert";
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
    if (user) {
      setFormData({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        tel: user.tel || "",
      });
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const confirmResult = await Swal.fire({
      title: "ยืนยันการบันทึก?",
      text: "คุณต้องการเปลี่ยนแปลงข้อมูลโปรไฟล์ใช่หรือไม่",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "ใช่, บันทึกเลย",
      cancelButtonText: "ยกเลิก",
      reverseButtons: true,
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
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="max-w-3xl mx-auto px-4 space-y-5">
        <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-200" />
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    </div>
  );
  return (
    <Navbar_admin>
      <div className="max-w-7xl mx-auto w-full space-y-6">

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
                  type="button"
                  onClick={() => setIsEditing(true)}
                  aria-label="แก้ไขข้อมูลโปรไฟล์ผู้ดูแลระบบ"
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition shadow-sm cursor-pointer"
                >
                  <Edit3 className="w-4 h-4" aria-hidden="true" />
                  <span>แก้ไข</span>
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    aria-label="ยกเลิกการแก้ไขโปรไฟล์"
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition cursor-pointer"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                    <span>ยกเลิก</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    disabled={isLoading}
                    aria-label="บันทึกการเปลี่ยนแปลงโปรไฟล์"
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition shadow-sm disabled:opacity-50 cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Save className="w-4 h-4" aria-hidden="true" />}
                    <span>บันทึก</span>
                  </button>
                </div>
              )}
            </div>

            {/* Form Section */}
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-1.5">
                  <label htmlFor="admin-first-name" className="text-xs font-semibold text-gray-700">ชื่อจริง</label>
                  <input
                    id="admin-first-name"
                    type="text"
                    value={formData.first_name}
                    readOnly={!isEditing}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-all outline-none ${isEditing
                      ? "border-green-600 ring-2 ring-green-100 bg-white"
                      : "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="admin-last-name" className="text-xs font-semibold text-gray-700">นามสกุล</label>
                  <input
                    id="admin-last-name"
                    type="text"
                    value={formData.last_name}
                    readOnly={!isEditing}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className={`w-full px-4 py-2.5 rounded-lg border text-sm transition-all outline-none ${isEditing
                      ? "border-green-600 ring-2 ring-green-100 bg-white"
                      : "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                      }`}
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="admin-email-field" className="text-xs font-semibold text-gray-700">อีเมล</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                    <input
                      id="admin-email-field"
                      type="email"
                      value={formData.email}
                      readOnly
                      className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-600 text-sm cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label htmlFor="admin-tel-field" className="text-xs font-semibold text-gray-700">เบอร์โทรศัพท์</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" aria-hidden="true" />
                    <input
                      id="admin-tel-field"
                      type="tel"
                      value={formData.tel}
                      readOnly={!isEditing}
                      onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                      placeholder="เช่น 0812345678"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm transition-all outline-none ${isEditing
                        ? "border-green-600 ring-2 ring-green-100 bg-white"
                        : "border-gray-200 bg-gray-50 text-gray-700 cursor-not-allowed"
                        }`}
                    />
                  </div>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <ShieldCheck className="w-4 h-4 text-green-600" aria-hidden="true" />
                  <span>
                    สิทธิ์การใช้งาน:{" "}
                    <strong className="font-semibold text-gray-900">
                      {user.role_id === 3 ? "Super Admin" : user.role_id === 2 ? "Admin" : "User"}
                    </strong>
                  </span>
                </div>
              </div>

            </div>
          </div>
        </div>
    </Navbar_admin>
  );
}

export default Page;