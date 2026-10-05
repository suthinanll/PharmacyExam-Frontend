// Server Component: ดึงข่าวให้เสร็จก่อนส่ง HTML
// รูปปก (องค์ประกอบ LCP) และหัวข้อข่าวจึงอยู่ใน HTML แรก เบราว์เซอร์เริ่มโหลดรูปได้ทันที
// เดิมต้องรอ JS โหลดและ hydrate เสร็จก่อนถึงจะเริ่ม fetch ข่าว แล้วค่อยรู้ว่ารูปปกคือไฟล์ไหน
// (resourceLoadDelay 1.6 วินาที LCP 4.1 วินาที)
import NewsDetailClient, { type NewsDetail } from './NewsDetailClient';

/** GET /news/:id เป็น @Public() ดึงได้โดยไม่ต้องมี token คืน null เมื่อดึงไม่สำเร็จเพื่อให้ไคลเอนต์ดึงเองแทน */
async function fetchNews(id: string): Promise<NewsDetail | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return null;

  try {
    const res = await fetch(`${apiUrl}/news/${encodeURIComponent(id)}`, {
      next: { revalidate: 60 },
      // กัน backend ช้าไม่ให้ลาก TTFB ของหน้าไปด้วย
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const initialNews = await fetchNews(id);

  return <NewsDetailClient initialNews={initialNews} />;
}
