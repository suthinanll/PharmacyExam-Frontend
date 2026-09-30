'use client';

import { getMissingProfileFields, useAuth } from '@/contexts/AuthContext';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Swal from "@/utils/sweetalert";
import { LoadingSpinner } from '@/components/LoadingSpinner';

// หน้าให้ guest เข้าดูได้ (ดูข้อมูลได้ แต่ทำข้อสอบ/เพิ่มโน้ตต้อง login ก่อน)
const GUEST_VIEWABLE_PATHS = ['/user/examset', '/user/calendar'];

// หน้าที่บัญชี Google ต้องกรอกเบอร์ มหาวิทยาลัย และรหัสผ่านให้ครบก่อนใช้งานหน้าอื่น
const COMPLETE_PROFILE_PATH = '/user/complete-profile';

export default function UserLayout({ children }: { children: React.ReactNode }) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    const isGuestViewable = GUEST_VIEWABLE_PATHS.includes(pathname);
    const needsProfileCompletion =
        isAuthenticated && user?.role_id === 1 && getMissingProfileFields(user).length > 0;
    const isOnCompleteProfile = pathname === COMPLETE_PROFILE_PATH;

    useEffect(() => {
        if (isLoading) return;
        if (needsProfileCompletion && !isOnCompleteProfile) {
            router.replace(COMPLETE_PROFILE_PATH);
        } else if (!needsProfileCompletion && isOnCompleteProfile && isAuthenticated) {
            router.replace('/user');
        }
    }, [isLoading, needsProfileCompletion, isOnCompleteProfile, isAuthenticated, router]);

    useEffect(() => {
        if (!isLoading) {
            // หน้า guest-viewable: ทุกคนเข้าดูได้ (หน้าเองจะจัดการ login เมื่อทำ action)
            if (isGuestViewable) return;

            if (!isAuthenticated) {
                router.push('/login');
            } else if (user?.role_id !== 1) {
                Swal.fire({
                    icon: 'error',
                    title: 'ไม่มีสิทธิ์เข้าถึง',
                    text: 'คุณไม่มีสิทธิ์เข้าถึงหน้า User',
                    toast: true,
                    position: 'top-end',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                })
                router.push('/admin');
            }
        }
    }, [isLoading, isAuthenticated, user, router, isGuestViewable]);

    // ระหว่างยังไม่รู้ผลการยืนยันตัวตน ปล่อยให้หน้าลูกวาดโครงของตัวเองไปก่อน
    //
    // เดิมคืน spinner เต็มจอ ซึ่งทำให้ HTML ที่เซิร์ฟเวอร์ส่งออกไปมีแต่ spinner
    // หัวข้อของหน้าจึงปรากฏได้ก็ต่อเมื่อดาวน์โหลด JS ครบและ hydrate เสร็จ
    // บนมือถือกินเวลาอีกราว 2.5 วินาทีหลัง FCP และหัวข้อนั้นเองคือองค์ประกอบ LCP
    //
    // หน้าลูกมีสถานะโหลดของตัวเองอยู่แล้ว (ส่วนหัวแสดงทันที ส่วนข้อมูลเป็น spinner)
    // จึงไม่เห็นหน้าเปล่า ส่วนข้อมูลของผู้ใช้ยังไม่ถูกเปิดเผย เพราะต้องมี token
    // ถึงจะดึงมาได้ และ useEffect ด้านบนยัง redirect คนที่ไม่มีสิทธิ์ออกไปเหมือนเดิม
    if (isLoading) {
        return <>{children}</>;
    }

    // หน้า guest-viewable ให้แสดงได้ทุกกรณี ส่วนหน้าอื่นยังคง guard เหมือนเดิม
    if (!isGuestViewable && (!isAuthenticated || user?.role_id !== 1)) {
        return null;
    }

    // รอ redirect ไปหน้ากรอกข้อมูล — ไม่แสดงหน้าอื่นให้ใช้งานระหว่างนี้
    if (needsProfileCompletion !== isOnCompleteProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <LoadingSpinner size="lg" text="กำลังโหลดข้อมูล..." />
            </div>
        );
    }

    return <>{children}</>;
}
