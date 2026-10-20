'use client';

import React, { createContext, useContext, useState, useEffect, useLayoutEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { setAuthCookie, clearAuthCookie } from '@/lib/authCookie';

interface User {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    tel?: string;
    role_id: number;
    profile_picture?: string;
    provider?: 'local' | 'google';
    university_id?: number | null;
    /** มาจาก /auth/me — บัญชีที่สมัครผ่าน Google จะเป็น false จนกว่าจะตั้งรหัสผ่าน */
    has_password?: boolean;
}

/**
 * ข้อมูลที่บัญชี Google ยังต้องกรอกเพิ่ม (สมัครแบบปกติจะกรอกครบตั้งแต่ตอนลงทะเบียน)
 * คืนค่าเป็น array ว่างเมื่อข้อมูลครบแล้ว หรือไม่ใช่บัญชี Google
 */
export function getMissingProfileFields(user: User | null): ('tel' | 'university' | 'password')[] {
    if (!user || user.provider !== 'google') return [];
    const missing: ('tel' | 'university' | 'password')[] = [];
    if (!user.tel) missing.push('tel');
    if (!user.university_id) missing.push('university');
    if (user.has_password === false) missing.push('password');
    return missing;
}

interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (token: string, userData?: User) => Promise<void>;
    logout: () => Promise<void>;
    getToken: () => string | null;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000').replace(/\/+$/, '');

function normalizeUserData(userData: any): User {
    if (!userData) return userData;
    let pic = userData.profile_picture || userData.picture || userData.avatar || userData.google_picture || userData.image_url;
    if (typeof pic === 'string' && pic.trim() !== '') {
        if (pic.includes('googleusercontent.com')) {
            pic = pic.replace('=s96-c', '=s200-c');
        } else if (!pic.startsWith('http') && !pic.startsWith('data:')) {
            const cleanPic = pic.startsWith('/') ? pic : `/${pic}`;
            pic = `${API_URL}${cleanPic}`;
        }
    } else {
        pic = undefined;
    }
    return {
        ...userData,
        user_id: userData.user_id ?? userData.id,
        id: userData.id ?? userData.user_id,
        profile_picture: pic,
    };
}

/**
 * อยู่นอกคอมโพเนนต์เพื่อให้เป็นฟังก์ชันตัวเดิมตลอด
 * หลายหน้าใส่ getToken ไว้ใน deps ของ useCallback/useEffect ที่ดึงข้อมูลตอนเปิดหน้า
 * เดิมสร้างใหม่ทุกครั้งที่ AuthProvider render (ได้ user จากแคช แล้วได้จาก /auth/me อีกรอบ)
 * ทำให้หน้าเหล่านั้นยิง API ซ้ำ 2-3 รอบ เช่นหน้า saveblog ดึง /bookmark 3 ครั้ง
 * แย่งเครือข่ายกับรูปที่เป็นองค์ประกอบ LCP
 */
function getToken() {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('access_token');
}

export function AuthProvider({ children }: { children: ReactNode }) {
    // ต้องเริ่มที่ null ให้ตรงกับฝั่งเซิร์ฟเวอร์เสมอ ห้ามอ่าน localStorage ตรงนี้
    // ไม่งั้น render แรกของไคลเอนต์จะได้ user ที่เซิร์ฟเวอร์ไม่มี หน้าที่แสดงต่างกัน
    // ตามสถานะล็อกอิน (เช่นสลับ Navbar) จะ hydration mismatch (React error #418)
    // ค่าจาก cache ถูกเติมใน useLayoutEffect ด้านล่างแทน ซึ่งทำงานก่อนเบราว์เซอร์วาด
    const [user, setUserState] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const setUser = (userData: User | null) => {
        setUserState(userData);
        if (typeof window !== 'undefined') {
            if (userData) {
                try {
                    localStorage.setItem('cached_user', JSON.stringify(userData));
                } catch { }
            } else {
                localStorage.removeItem('cached_user');
            }
        }
    };

    const fetchUser = async () => {
        try {
            const token = getToken();
            if (!token) {
                setUser(null);
                setIsLoading(false);
                return;
            }

            const response = await fetch(`${API_URL}/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(normalizeUserData(userData));
            } else {
                // Token invalid or expired
                setUser(null);
                localStorage.removeItem('access_token');
                clearAuthCookie();
            }
        } catch (error) {
            console.warn('Auth server unavailable while fetching user:', error);
            // If offline, keep cached user if available
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (token: string, userData?: any) => {
        localStorage.setItem('access_token', token);
        setAuthCookie(token);
        if (userData) {
            setUser(normalizeUserData(userData));
            setIsLoading(false);
        } else {
            await fetchUser();
        }
    };

    const logout = async () => {
        const token = getToken();

        // Call backend logout API if token exists (for session cleanup)
        if (token) {
            try {
                await fetch(`${API_URL}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include'
                });
            } catch (error) {
                console.error('Error calling logout API:', error);
                // Continue with local cleanup even if API call fails
            }
        }

        // Clear all auth-related storage keys
        localStorage.removeItem('access_token');
        clearAuthCookie();
        localStorage.removeItem('user'); // Remove old/stale user key if exists
        sessionStorage.removeItem('token'); // Remove old/stale session key if exists

        setUser(null);
        // ใช้ window.location.replace('/') เพื่อ redirect ไปหน้าแรกอย่างราบรื่น
        // ป้องกัน race condition กับ UserLayout/AdminLayout ที่พยายาม push ไป /login ระหว่าง transition
        window.location.replace('/');
    };

    const refreshUser = async () => {
        setIsLoading(true);
        await fetchUser();
    };

    // ถ้ามี token + ข้อมูลผู้ใช้ที่แคชไว้ ให้เปิดหน้าใช้งานได้ทันทีหลัง hydrate
    // แล้วค่อยยืนยันกับ /auth/me เบื้องหลัง (stale-while-revalidate)
    // เดิมทุกหน้าที่ต้องล็อกอินต้องรอ /auth/me ตอบก่อนถึงจะวาดเนื้อหา ทำให้ LCP ช้า
    // ใช้ useLayoutEffect แทน initial state เพื่อไม่ให้ HTML ฝั่งเซิร์ฟเวอร์กับไคลเอนต์ต่างกัน
    useLayoutEffect(() => {
        try {
            const token = localStorage.getItem('access_token');
            // ผู้ใช้ที่ล็อกอินไว้ก่อนมีคุกกี้ (หรือคุกกี้หมดอายุก่อน token) ได้คุกกี้ตอนเปิดหน้าใดก็ได้
            if (token) setAuthCookie(token);
            else clearAuthCookie();
            const cached = localStorage.getItem('cached_user');
            if (token && cached) {
                setUserState(JSON.parse(cached));
                setIsLoading(false);
            }
        } catch { }
    }, []);

    useEffect(() => {
        fetchUser();
    }, []);

    const value: AuthContextType = {
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        getToken,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
