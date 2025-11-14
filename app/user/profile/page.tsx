/* eslint-disable @next/next/no-img-element */
"use client"

import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { Edit, Save, X } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from 'react';

const PROFILE_IMAGE_URL = "https://media.tenor.com/KkSYfvEw4hsAAAAe/cat-cat-scared.png";

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
                target.src = "https://via.placeholder.com/96/C4C4C4/FFFFFF?text=U";
                target.onerror = null;
            }}
        />
    </div>
);

const Profile = () => {
    const [user, setUser] = useState<{
        first_name: string,
        last_name: string,
        email: string,
        tel: string,
        university: {
            id: number,
            name: string
        },
        role: {
            id: number,
            name: string
        }
    } | null>(null);

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        email: '',
        tel: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const token = localStorage.getItem("token");


    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string>('');
    const [successMessage, setSuccessMessage] = useState<string>('');

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const res = await fetch('http://localhost:5000/auth/me', {
                    credentials: 'include',
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data);
                    setFormData({
                        first_name: data.first_name || '',
                        last_name: data.last_name || '',
                        email: data.email || '',
                        tel: data.tel || '',
                    });
                } else {
                    setError('ไม่สามารถโหลดข้อมูลผู้ใช้ได้');
                }
            } catch (err) {
                console.error(err);
                setError('เกิดข้อผิดพลาดในการเชื่อมต่อ');
            }
        };

        fetchUser();
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        try {
            const res = await fetch('http://localhost:5000/users/profile', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`,   

                },
                credentials: 'include',
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const updatedData = await res.json();
                setUser(updatedData);
                setSuccessMessage('บันทึกข้อมูลส่วนตัวสำเร็จ');
                setIsEditing(false);
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                const errorData = await res.json();
                setError(errorData.message || 'ไม่สามารถบันทึกข้อมูลได้');
            }
        } catch (err) {
            console.error(err);
            setError('เกิดข้อผิดพลาดในการบันทึกข้อมูล');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSavePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setSuccessMessage('');

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setError('รหัสผ่านใหม่และยืนยันรหัสผ่านไม่ตรงกัน');
            setIsLoading(false);
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setError('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
            setIsLoading(false);
            return;
        }

        try {
            const res = await fetch('http://localhost:5000/users/change-password', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    currentPassword: passwordData.currentPassword,
                    newPassword: passwordData.newPassword,
                }),
            });

            if (res.ok) {
                setSuccessMessage('เปลี่ยนรหัสผ่านสำเร็จ');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: '',
                });
                setTimeout(() => setSuccessMessage(''), 3000);
            } else {
                const errorData = await res.json();
                setError(errorData.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้');
            }
        } catch (err) {
            console.error(err);
            setError('เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelEdit = () => {
        if (user) {
            setFormData({
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                tel: user.tel || '',
            });
        }
        setIsEditing(false);
        setError('');
    };

    const disabledInputClass = "w-full border border-gray-200 rounded-lg p-3 bg-gray-50 text-gray-600 cursor-not-allowed text-base";
    const enabledInputClass = "w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base transition duration-150";

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
                        <span className="text-gray-700 font-medium">โปรไฟล์ของฉัน</span>
                    </div>

                    {/* Alert Messages */}
                    {error && (
                        <div className="max-w-3xl mx-auto mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="max-w-3xl mx-auto mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                            {successMessage}
                        </div>
                    )}

                    {/* Main Content Card */}
                    <div className="bg-white rounded-xl shadow-xl p-6 sm:p-8 md:p-10 max-w-3xl mx-auto">
                        {/* Profile Header and Action Buttons */}
                        <div className="flex justify-between items-start mb-8 border-b pb-6">
                            <UserAvatar
                                size={96}
                                src={PROFILE_IMAGE_URL}
                                alt="User Profile"
                            />
                            <div className="flex space-x-3">
                                {isEditing ? (
                                    <>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition duration-150 text-sm font-medium border border-gray-300"
                                        >
                                            <X className="w-4 h-4" />
                                            <span>ยกเลิก</span>
                                        </button>
                                        <button
                                            onClick={handleSaveProfile}
                                            disabled={isLoading}
                                            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-150 text-sm font-medium shadow-md shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            <Save className="w-4 h-4" />
                                            <span>{isLoading ? 'กำลังบันทึก...' : 'บันทึก'}</span>
                                        </button>
                                    </>
                                ) : (
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
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        ชื่อจริง
                                    </label>
                                    <input
                                        type="text"
                                        name="first_name"
                                        value={formData.first_name}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className={isEditing ? enabledInputClass : disabledInputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        นามสกุล
                                    </label>
                                    <input
                                        type="text"
                                        name="last_name"
                                        value={formData.last_name}
                                        onChange={handleInputChange}
                                        disabled={!isEditing}
                                        className={isEditing ? enabledInputClass : disabledInputClass}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    อีเมล
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={isEditing ? enabledInputClass : disabledInputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    เบอร์โทรศัพท์
                                </label>
                                <input
                                    type="tel"
                                    name="tel"
                                    value={formData.tel}
                                    onChange={handleInputChange}
                                    disabled={!isEditing}
                                    className={isEditing ? enabledInputClass : disabledInputClass}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    มหาวิทยาลัย
                                </label>
                                <input
                                    type="text"
                                    value={user?.university?.name || ''}
                                    disabled
                                    className={disabledInputClass}
                                />
                            </div>
                        </form>

                        <div className="py-8 border-t mt-8"></div>

                        {/* Password Setting Section */}
                        <form onSubmit={handleSavePassword} className="space-y-6">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">เปลี่ยนรหัสผ่าน</h2>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    รหัสผ่านเดิม
                                </label>
                                <input
                                    type="password"
                                    name="currentPassword"
                                    value={passwordData.currentPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="กรอกรหัสผ่านเดิม"
                                    className={enabledInputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    รหัสผ่านใหม่
                                </label>
                                <input
                                    type="password"
                                    name="newPassword"
                                    value={passwordData.newPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                                    className={enabledInputClass}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    ยืนยันรหัสผ่านใหม่
                                </label>
                                <input
                                    type="password"
                                    name="confirmPassword"
                                    value={passwordData.confirmPassword}
                                    onChange={handlePasswordChange}
                                    placeholder="ยืนยันรหัสผ่านใหม่"
                                    className={enabledInputClass}
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="inline-flex items-center space-x-2 px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-red-500/50 transition duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Save className="w-5 h-5" />
                                    <span>{isLoading ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}</span>
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