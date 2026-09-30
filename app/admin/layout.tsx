import type { Metadata } from 'next';
import AdminAuthGuard from './components/AdminAuthGuard';

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
  return <AdminAuthGuard>{children}</AdminAuthGuard>;
}
