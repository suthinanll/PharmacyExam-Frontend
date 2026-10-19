import { notFound } from 'next/navigation';

// หน้าสำหรับนักพัฒนา (ทดสอบ n8n workflow) — เปิดได้เฉพาะตอน npm run dev บนเว็บจริงตอบ 404
export default function TestN8nLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production') notFound();
  return children;
}
