'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Swal from '@/utils/sweetalert';
import { LoadingSpinner } from '@/components/LoadingSpinner';

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/login');
      } else if (user?.role_id !== 2 && user?.role_id !== 3) {
        Swal.fire({
          icon: 'info',
          title: 'ยังไม่มีสิทธิ์ผู้ดูแลระบบ',
          text: 'ดูตัวอย่างฟีเจอร์และสมัครเป็นผู้ดูแลระบบได้เลย',
          toast: true,
          position: 'top-end',
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
        });
        router.push('/upgrade-admin');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" role="status" aria-live="polite">
        <LoadingSpinner size="lg" text="กำลังโหลดข้อมูลระบบผู้ดูแล..." />
        <span className="sr-only">กำลังโหลดข้อมูลระบบผู้ดูแล...</span>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role_id !== 2 && user?.role_id !== 3)) {
    return null;
  }

  return <>{children}</>;
}
