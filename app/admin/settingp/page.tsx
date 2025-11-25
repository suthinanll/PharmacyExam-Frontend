/* eslint-disable @next/next/no-img-element */
"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect } from "react";
import React from "react";

const PROFILE_IMAGE_URL =
  "https://preview.redd.it/post-the-best-cat-memes-you-got-in-the-comments-please-v0-kg82lbnu0ste1.png?auto=webp&s=e6f9eee86484f5de3f4e31f3c33b2d07fb982bd5";

interface UserAvatarProps {
  size?: number;
  src?: string;
  alt?: string;
}
const UserAvatar: React.FC<UserAvatarProps> = ({ size = 96, src, alt }) => (
  <div
    className="rounded-full overflow-hidden bg-gray-200 border-4 border-white shadow-md"
    style={{ width: size, height: size }}
  >
    <img
      src={src || PROFILE_IMAGE_URL}
      alt={alt || "Profile Picture"}
      className="w-full h-full object-cover"
      onError={(e) => {
        const target = e.currentTarget as HTMLImageElement;
        target.src = "https://via.placeholder.com/96/C4C4C4/FFFFFF?text=P";
        target.onerror = null;
      }}
    />
  </div>
);

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
  const [error, setError] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string>("");

  const disabledInputClass =
    "w-full border border-gray-200 rounded-lg p-3 bg-gray-100 text-base text-gray-700 cursor-not-allowed shadow-inner focus:outline-none";

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch("http://localhost:5000/auth/me", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          setFormData({
            first_name: data.first_name || "",
            last_name: data.last_name || "",
            email: data.email || "",
            tel: data.tel || "",
          });
        } else {
          setError("ไม่สามารถโหลดข้อมูลผู้ใช้ได้");
        }
      } catch (err) {
        console.error(err);
        setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      }
    };
    fetchUser();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // ตัวอย่าง API POST
      const res = await fetch("http://localhost:5000/auth/update-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });
      if (res.ok) {
        setSuccessMessage("บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว!");
      } else {
        setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      console.error(err);
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
    }
    setIsLoading(false);
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // ตัวอย่าง API POST เปลี่ยนรหัสผ่าน
      const res = await fetch("http://localhost:5000/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
        credentials: "include",
      });
      if (res.ok) {
        setSuccessMessage("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว!");
        setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        setError("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
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
          {/* Profile Header */}
          <div className="flex justify-between items-start mb-8 border-b pb-6">
            <UserAvatar size={96} src={PROFILE_IMAGE_URL} alt="Profile" />
            <div className="flex space-x-3">
              <button
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-150 text-sm font-medium border border-gray-300"
                onClick={() => setIsEditing(!isEditing)}
              >
                <PencilIcon className="w-4 h-4" />
                <span>{isEditing ? "ยกเลิกแก้ไข" : "แก้ไขโปรไฟล์"}</span>
              </button>
              <button
                onClick={handleSaveProfile}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-150 text-sm font-medium shadow-md shadow-green-200"
                disabled={!isEditing || isLoading}
              >
                <SaveIcon className="w-4 h-4" />
                <span>{isLoading ? "กำลังบันทึก..." : "บันทึก"}</span>
              </button>
            </div>
          </div>

          {error && <p className="text-red-600 mb-4">{error}</p>}
          {successMessage && <p className="text-green-600 mb-4">{successMessage}</p>}

          {/* Profile Form */}
          <form className="space-y-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">ข้อมูลส่วนตัว</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อจริง</label>
                <input
                  type="text"
                  value={formData.first_name}
                  readOnly={!isEditing}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className={`w-full border border-gray-300 rounded-lg p-3 text-base ${
                    !isEditing ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">นามสกุล</label>
                <input
                  type="text"
                  value={formData.last_name}
                  readOnly={!isEditing}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className={`w-full border border-gray-300 rounded-lg p-3 text-base ${
                    !isEditing ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                  }`}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">อีเมล</label>
              <input
                type="email"
                value={formData.email}
                readOnly
                className={disabledInputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์</label>
              <input
                type="tel"
                value={formData.tel}
                readOnly={!isEditing}
                onChange={(e) => setFormData({ ...formData, tel: e.target.value })}
                className={`w-full border border-gray-300 rounded-lg p-3 text-base ${
                  !isEditing ? "bg-gray-100 cursor-not-allowed" : "bg-white"
                }`}
              />
            </div>
          </form>

          {/* Password Form */}
          <div className="py-8 border-t mt-8"></div>
          <form className="space-y-6" onSubmit={handleSavePassword}>
            <h2 className="text-xl font-bold text-gray-800 mb-6">ตั้งค่ารหัสผ่าน</h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านปัจจุบัน</label>
              <input
                type="password"
                value="********"
                readOnly
                className={disabledInputClass}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รหัสผ่านใหม่</label>
              <input
                type="password"
                placeholder="กรอกรหัสผ่านใหม่"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-green-500 focus:border-green-500 text-base"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ยืนยันรหัสผ่านใหม่</label>
              <input
                type="password"
                placeholder="ยืนยันรหัสผ่านใหม่"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-green-500 focus:border-green-500 text-base"
              />
            </div>
            <div className="pt-4">
              <button
                type="submit"
                className="inline-flex items-center space-x-2 px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-green-500/50 transition duration-150"
                disabled={isLoading}
              >
                <SaveIcon className="w-5 h-5" />
                <span>{isLoading ? "กำลังบันทึก..." : "บันทึกรหัสผ่าน"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Navbar_admin>
  );
}

export default Page;
