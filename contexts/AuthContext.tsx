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

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

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
                setUser(userData);
            } else {
                // Token invalid or expired
                setUser(null);
                localStorage.removeItem('access_token');
            }
        } catch (error) {
            console.error('Error fetching user:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (token: string, userData?: any) => {
        localStorage.setItem('access_token', token);
        if (userData) {
            // Normalize userData to ensure both id and user_id are set correctly
            const normalizedUser = {
                ...userData,
                user_id: userData.user_id ?? userData.id,
                id: userData.id ?? userData.user_id,
            };
            setUser(normalizedUser);
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
