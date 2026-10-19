import { notFound } from 'next/navigation';

// หน้าสำหรับนักพัฒนา (ทดสอบการแจ้งเตือน) — เปิดได้เฉพาะตอน npm run dev บนเว็บจริงตอบ 404
export default function NotifDebugLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production') notFound();
  return children;
}
