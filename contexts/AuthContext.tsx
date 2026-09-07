'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    user_id: number;
    first_name: string;
    last_name: string;
    email: string;
    tel?: string;
    role_id: number;
    profile_picture?: string;
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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUserState] = useState<User | null>(() => {
        if (typeof window === 'undefined') return null;
        try {
            const token = localStorage.getItem('access_token');
            const cached = localStorage.getItem('cached_user');
            if (token && cached) {
                return JSON.parse(cached);
            }
        } catch { }
        return null;
    });
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

    const getToken = () => {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('access_token');
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
        localStorage.removeItem('user'); // Remove old/stale user key if exists
        localStorage.removeItem('last_active_session_id'); // Clear chatbot session
        sessionStorage.removeItem('token'); // Remove old/stale session key if exists

        setUser(null);
        router.push('/'); // หลังออกจากระบบ → กลับไปหน้าแรก (guest homepage)
    };

    const refreshUser = async () => {
        setIsLoading(true);
        await fetchUser();
    };

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
