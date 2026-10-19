import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ผลการประเมินแบบสอบถาม | เภสัชพร้อมสอบ',
  // หน้าสำหรับผู้วิจัย ไม่ให้เครื่องมือค้นหาเก็บ
  robots: { index: false, follow: false, nocache: true },
};

export default function SurveyResultsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
