// Server Component: ดึงรายการชุดข้อสอบและหมวดหมู่ให้เสร็จก่อนส่ง HTML
// องค์ประกอบ LCP ของหน้านี้คือชื่อชุดข้อสอบในการ์ดใบแรก จึงต้องอยู่ใน HTML ตั้งแต่แรก
// ทั้งสอง endpoint เป็น @Public() ฝั่งเซิร์ฟเวอร์จึงดึงได้โดยไม่ต้องมี token
import ExamsetClient from './ExamsetClient';

async function fetchPublic<T>(path: string): Promise<T | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;
  try {
    const res = await fetch(`${apiUrl}${path}`, {
      // ข้อมูลชุดข้อสอบเปลี่ยนไม่บ่อย แคชไว้ลดภาระ backend เมื่อมีผู้ใช้พร้อมกันหลายคน
      next: { revalidate: 60 },
      // กัน backend ช้าไม่ให้ลาก TTFB ของหน้าไปด้วย เกินเวลาแล้วปล่อยให้ไคลเอนต์ดึงเอง
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export default async function ExamsetPage() {
  const [categories, banks] = await Promise.all([
    fetchPublic<any[]>('/categories'),
    fetchPublic<any[]>('/items-bank'),
  ]);

  return (
    <ExamsetClient
      initialCategories={categories}
      initialBanks={banks ? banks.filter((b) => b.is_active) : null}
    />
  );
}
