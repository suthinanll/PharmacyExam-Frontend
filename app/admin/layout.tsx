import type { Metadata } from 'next';
import AdminAuthGuard from './components/AdminAuthGuard';
import { ThemeProvider } from '@/contexts/ThemeContext';

export const metadata: Metadata = {
  title: {
    template: '%s | ระบบจัดการผู้ดูแลระบบ Pharmacy Exam',
    default: 'ระบบจัดการผู้ดูแลระบบ (Admin Dashboard) | Pharmacy Exam',
  },
  description: 'แผงควบคุมระบบการจัดการข้อสอบ คลังข้อสอบ ผู้ใช้งาน และการวิเคราะห์สถิติผลสอบจำลองสภาเภสัชกรรม',
  robots: {
    index: false,
    follow: false,
    nocache: true,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // ฝั่งแอดมินปรับได้แค่ขนาดตัวอักษร (หน้าตั้งค่า แท็บ "การแสดงผล") ไม่มีโหมดมืด
  return (
    <ThemeProvider allowDark={false}>
      <AdminAuthGuard>{children}</AdminAuthGuard>
    </ThemeProvider>
  );
}
