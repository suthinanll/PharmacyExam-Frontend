/* eslint-disable @next/next/no-img-element */
"use client"

import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import React, { useState } from "react";
import { Edit, Save } from "lucide-react";
import Link from "next/link";

// URL รูปภาพสำหรับ User Profile (สามารถเปลี่ยนได้)
const PROFILE_IMAGE_URL = "https://media.tenor.com/KkSYfvEw4hsAAAAe/cat-cat-scared.png";
const DEFAULT_USER_NAME = "ผู้ใช้งานทั่วไป";
const DEFAULT_USER_EMAIL = "user@example.com";

// Placeholder component for the Profile Picture
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
            onError={(e: React.SyntheticEvent<HTMLImageElement, Event>) => {
                const target = e.currentTarget as HTMLImageElement;
                target.src = "https://via.placeholder.com/96/C4C4C4/FFFFFF?text=U"; // ใช้ U แทน P สำหรับ User
                target.onerror = null;
            }}
        />
    </div>
);




const Profile = () => {
    // State สำหรับข้อมูลส่วนตัว
    const [firstName, setFirstName] = useState(DEFAULT_USER_NAME);
    const [lastName, setLastName] = useState("สมมติ");
    const [email, setEmail] = useState(DEFAULT_USER_EMAIL);
    const [phone, setPhone] = useState("081XXXXXXX");
    const [university, setuniversity] = useState("มหาวิทยาลัยขอนแก่น");


    // State สำหรับโหมดการแก้ไข
    const [isEditing, setIsEditing] = useState(false);

    const disabledInputClass = "w-full border border-gray-200 rounded-lg p-3 bg-gray-100 text-base text-gray-700 cursor-not-allowed shadow-inner focus:outline-none";
    const enabledInputClass = "w-full border border-gray-300 rounded-lg p-3 focus:ring-blue-500 focus:border-blue-500 text-base transition duration-150";


    const handleSaveProfile = (e: React.FormEvent) => {
        e.preventDefault();
        // Logic บันทึกข้อมูล API
        alert("บันทึกข้อมูลส่วนตัวแล้ว!");
        setIsEditing(false); // ปิดโหมดแก้ไขเมื่อบันทึกเสร็จ
    };

    const handleSavePassword = (e: React.FormEvent) => {
        e.preventDefault();
        // Logic บันทึกรหัสผ่าน API
        alert("บันทึกรหัสผ่านใหม่แล้ว!");
    };

    return (
        <>
            <Navbar_user />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 p-4 md:p-6 lg:p-8">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Link href="/user" className="hover:text-blue-600 cursor-pointer transition">
                            หน้าหลัก
                        </Link>
                        <span className="mx-2">›</span>
                        <span className="text-gray-700 font-medium">คลังข้อสอบ</span>
                    </div>
                    {/* Main Content Card */}
                    <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8 md:p-10 max-w-3xl mx-auto">

                        {/* Profile Header and Action Buttons */}
                        <div className="flex justify-between items-start mb-8 border-b pb-6">
                            {/* Avatar (ขนาดใหญ่ในหน้าตั้งค่า) */}
                            <UserAvatar
                                size={96}
                                src={PROFILE_IMAGE_URL}
                                alt="User Profile"
                            />

                            {/* Top Right Buttons: Edit / Save */}
                            <div className="flex space-x-3">
                                {isEditing ? (
                                    // ปุ่มบันทึกเมื่ออยู่ในโหมดแก้ไข
                                    <button
                                        onClick={handleSaveProfile}
                                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 text-sm font-medium shadow-md shadow-blue-200"
                                    >
                                        <Save className="w-4 h-4" />
                                        <span>บันทึก</span>
                                    </button>
                                ) : (
                                    // ปุ่มแก้ไขเมื่ออยู่ในโหมดดู
                                    <button
                                        onClick={() => setIsEditing(true)}
                                        className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-150 text-sm font-medium border border-gray-300"
                                    >
                                        <Edit className="w-4 h-4" />
                                        <span>แก้ไขโปรไฟล์</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Personal Information Section */}
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
                                        onChange={(e) => setFirstName(e.target.value)}
                                        readOnly={!isEditing} // ควบคุมโดย isEditing
                                        className={isEditing ? enabledInputClass : disabledInputClass}
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
                                        onChange={(e) => setLastName(e.target.value)}
                                        readOnly={!isEditing} // ควบคุมโดย isEditing
                                        className={isEditing ? enabledInputClass : disabledInputClass}
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
                                    onChange={(e) => setEmail(e.target.value)}
                                    readOnly={!isEditing} // ควบคุมโดย isEditing
                                    className={isEditing ? enabledInputClass : disabledInputClass}
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
                                    onChange={(e) => setPhone(e.target.value)}
                                    readOnly={!isEditing} // ควบคุมโดย isEditing
                                    className={isEditing ? enabledInputClass : disabledInputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    มหาวิทยาลัย
                                </label>
                                <input
                                    type="tel"
                                    value={university}
                                    onChange={(e) => setuniversity(e.target.value)}
                                    readOnly={!isEditing}
                                    className={isEditing ? enabledInputClass : disabledInputClass}
                                />
                            </div>
                        </form>

                        <div className="py-8 border-t mt-8"></div>

                        {/* Password Setting Section */}
                        <form onSubmit={handleSavePassword} className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">เปลี่ยนรหัสผ่าน</h2>

                            {/* รหัสผ่านเดิม (ReadOnly/Disabled) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    รหัสผ่านเดิม
                                </label>
                                <input
                                    type="password"
                                    placeholder="กรอกรหัสผ่านเดิม"
                                    className={enabledInputClass} // ให้กรอกได้เสมอ
                                />
                            </div>

                            {/* รหัสผ่านใหม่ */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    รหัสผ่านใหม่
                                </label>
                                <input
                                    type="password"
                                    placeholder="กรอกรหัสผ่านใหม่"
                                    className={enabledInputClass}
                                />
                            </div>

                            {/* ยืนยันรหัสผ่านใหม่ */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ยืนยันรหัสผ่านใหม่
                                </label>
                                <input
                                    type="password"
                                    placeholder="ยืนยันรหัสผ่านใหม่"
                                    className={enabledInputClass}
                                />
                            </div>

                            {/* Save Password Button */}
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className="inline-flex items-center space-x-2 px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-red-500/50 transition duration-150"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>บันทึกรหัสผ่านใหม่</span>
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            </div>

            <Footer />
        </>
    );
};

export default Profile;