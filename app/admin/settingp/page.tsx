/* eslint-disable @next/next/no-img-element */
"use client"; // เปลี่ยนเป็น .tsx หรือเพิ่ม allowJs ใน tsconfig

import Navbar_admin from "@/components/Navbar_admin";
import { useState } from "react";
import React from 'react'; // นำเข้า React เพื่อใช้ Types

// URL รูปภาพใหม่ที่ต้องการใช้
const PROFILE_IMAGE_URL = "https://preview.redd.it/post-the-best-cat-memes-you-got-in-the-comments-please-v0-kg82lbnu0ste1.png?auto=webp&s=e6f9eee86484f5de3f4e31f3c33b2d07fb982bd5";
const DEFAULT_PROFILE_NAME = "Musharof";
const DEFAULT_PROFILE_EMAIL = "hello@tailgrids.com";

// **แก้ไข: กำหนด Type ให้ props ของ UserAvatar**
interface UserAvatarProps {
    size?: number;
    src?: string; // src ควรเป็น string
    alt?: string; // alt ควรเป็น string
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
      // ใช้ React.SyntheticEvent สำหรับ Type ของ event ใน onError
      onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        // Cast event target to HTMLImageElement
        const target = e.currentTarget as HTMLImageElement;
        target.src = "https://via.placeholder.com/96/C4C4C4/FFFFFF?text=P";
        target.onerror = null;
      }}
    />
  </div>
);

// Icon for Edit Profile (Lucide-react style: Pencil)
// **กำหนด Type ให้ props สำหรับ SVG icons**
const PencilIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
);

// Icon for Save (Lucide-react style: Save/Disk)
// **กำหนด Type ให้ props สำหรับ SVG icons**
const SaveIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
);


function Page() {
    // State สำหรับข้อมูลส่วนตัว (ตัวอย่าง)
    const [firstName] = useState(DEFAULT_PROFILE_NAME);
    const [lastName] = useState("-");
    const [email] = useState(DEFAULT_PROFILE_EMAIL);
    const [phone] = useState("0947071162");

    // **แก้ไข: กำหนด Type ให้ event ใน handleSaveProfile**
    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        alert("บันทึกข้อมูลส่วนตัวแล้ว!");
        // Logic บันทึกข้อมูล API
    };

    // **แก้ไข: กำหนด Type ให้ event ใน handleSavePassword**
    const handleSavePassword = (e: React.FormEvent) => {
        e.preventDefault();
        alert("บันทึกรหัสผ่านใหม่แล้ว!");
        // Logic บันทึกรหัสผ่าน API
    };

    const disabledInputClass = "w-full border border-gray-200 rounded-lg p-3 bg-gray-100 text-base text-gray-700 cursor-not-allowed shadow-inner focus:outline-none";


    return (
        <Navbar_admin>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12">
                
                <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 md:p-10 max-w-3xl mx-auto">
                    
                    {/* Profile Header and Action Buttons */}
                    <div className="flex justify-between items-start mb-8 border-b pb-6">
                        {/* Avatar (ขนาดใหญ่ในหน้าตั้งค่า) */}
                        <UserAvatar 
                            size={96} 
                            src={PROFILE_IMAGE_URL}
                            alt="Musharof Profile" 
                        />
                        
                        {/* Top Right Buttons */}
                        <div className="flex space-x-3">
                            <button className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-150 text-sm font-medium border border-gray-300">
                                <PencilIcon className="w-4 h-4" />
                                <span>แก้ไขโปรไฟล์</span>
                            </button>
                            {/* ปุ่มบันทึกข้อมูลส่วนตัว */}
                            <button 
                                // เนื่องจากไม่ได้ใช้ Form submit จึงใช้ onClick และป้องกัน type error ด้วย FormEvent
                                onClick={(e) => handleSaveProfile(e as unknown as React.FormEvent)}
                                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition duration-150 text-sm font-medium shadow-md shadow-green-200"
                            >
                                <SaveIcon className="w-4 h-4" />
                                <span>บันทึก</span>
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSaveProfile} className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">ข้อมูลส่วนตัว</h2>

                        {/* ชื่อจริง และ นามสกุล */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* ชื่อจริง */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ชื่อจริง
                                </label>
                                <input
                                    type="text"
                                    value={firstName}
                                    readOnly 
                                    className={disabledInputClass}
                                />
                            </div>
                            {/* นามสกุล */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    นามสกุล
                                </label>
                                <input
                                    type="text"
                                    value={lastName}
                                    readOnly 
                                    className={disabledInputClass}
                                />
                            </div>
                        </div>

                        {/* อีเมล */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                อีเมล
                            </label>
                            <input
                                type="email"
                                value={email}
                                readOnly 
                                className={disabledInputClass}
                            />
                        </div>

                        {/* เบอร์โทรศัพท์ */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                เบอร์โทรศัพท์
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                readOnly 
                                className={disabledInputClass}
                            />
                        </div>
                    </form>

                    <div className="py-8 border-t mt-8"></div>
                    
                    {/* Password Setting Section */}
                    <form onSubmit={handleSavePassword} className="space-y-6">
                        <h2 className="text-xl font-bold text-gray-800 mb-6">ตั้งค่ารหัสผ่าน</h2>

                        {/* รหัสผ่านเดิม (ReadOnly/Disabled ตามภาพเดิม) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                รหัสผ่าน
                            </label>
                            <input
                                type="password"
                                defaultValue="********" 
                                readOnly 
                                className="w-full border border-gray-200 rounded-lg p-3 bg-gray-100 text-base font-mono cursor-not-allowed"
                            />
                        </div>

                        {/* รหัสผ่านใหม่ (ยังคงแก้ไขได้) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                รหัสผ่านใหม่
                            </label>
                            <input
                                type="password"
                                placeholder="กรอกรหัสผ่านใหม่"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-green-500 focus:border-green-500 text-base"
                            />
                        </div>

                        {/* ยืนยันรหัสผ่านใหม่ (ยังคงแก้ไขได้) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ยืนยันรหัสผ่านใหม่
                            </label>
                            <input
                                type="password"
                                placeholder="ยืนยันรหัสผ่านใหม่"
                                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-green-500 focus:border-green-500 text-base"
                            />
                        </div>
                        
                        {/* Save Password Button */}
                        <div className="pt-4">
                            <button
                                type="submit"
                                className="inline-flex items-center space-x-2 px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-green-500/50 transition duration-150"
                            >
                                <SaveIcon className="w-5 h-5" />
                                <span>บันทึกรหัสผ่าน</span>
                            </button>
                        </div>
                    </form>

                </div>
            </div>
        </Navbar_admin>
    );
}

export default Page;