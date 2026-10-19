import { notFound } from 'next/navigation';

// หน้าสำหรับนักพัฒนา (ดูการทำงานภายในของ CAT) — เปิดได้เฉพาะตอน npm run dev บนเว็บจริงตอบ 404
export default function CatDebugLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV === 'production') notFound();
  return children;
}
