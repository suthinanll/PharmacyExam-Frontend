'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import Swal from 'sweetalert2';
import { FullScreenSkeleton } from '@/components/Skeleton';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading) {
            if (!isAuthenticated) {
                router.push('/login');
            } else if (user?.role_id !== 2) {
                // If not admin (role_id 2), show toast and redirect to user page
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่มีสิทธิ์เข้าถึง',
                    text: 'คุณไม่มีสิทธิ์เข้าถึงหน้า Admin',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true,
                });
                router.push('/user');
            }
        }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading) {
        return <FullScreenSkeleton />;
    }

    // Only render children if user is authenticated and is an admin
    if (!isAuthenticated || user?.role_id !== 2) {
        return null;
    }

    return <>{children}</>;
}
