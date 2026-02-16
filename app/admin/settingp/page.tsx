"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect } from "react";
import React from "react";

const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);

const SaveIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

function Page() {
  const [user, setUser] = useState<{
    first_name: string;
    last_name: string;
    email: string;
    tel: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    tel: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // =============================
  // โหลดข้อมูลผู้ใช้
  // =============================
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          method: "GET",
          credentials: "include",
        });

        if (!res.ok) {
          setError("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
          return;
        }

        const data = await res.json();
        setUser(data);
        setFormData({
          first_name: data.first_name || "",
          last_name: data.last_name || "",
          email: data.email || "",
          tel: data.tel || "",
        });
      } catch (err) {
        console.error(err);
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      }
    };

    fetchUser();
  }, []);

  // =============================
  // บันทึกข้อมูลโปรไฟล์
  // =============================
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
        });
      }
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }

    setIsLoading(false);
  };

  if (!user) return <div className="text-center py-20">Loading...</div>;

  return (
    <Navbar_admin>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 md:p-10 max-w-3xl mx-auto">

          {/* Header */}
          <div className="flex justify-between items-start mb-8 border-b pb-6">
            <div className="flex space-x-3">
              <button
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                onClick={() => setIsEditing(!isEditing)}
              >
                <PencilIcon className="w-4 h-4" />
                <span>{isEditing ? "ยกเลิกแก้ไข" : "แก้ไขโปรไฟล์"}</span>
              </button>

              <button
                onClick={handleSaveProfile}
                disabled={!isEditing || isLoading}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition shadow-md"
              >
                <SaveIcon className="w-4 h-4" />
                <span>{isLoading ? "กำลังบันทึก..." : "บันทึก"}</span>
              </button>
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
