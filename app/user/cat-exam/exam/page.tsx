// Server Component: ดึงข้อสอบข้อปัจจุบันของ session ที่กำลังสอบอยู่ให้เสร็จก่อนส่ง HTML
// โดยใช้ token จากคุกกี้ (lib/authCookie.ts)
//
// ข้อความสถานการณ์คือองค์ประกอบ LCP ของหน้า เดิมต้องรอ JS โหลดและ hydrate เสร็จ
// แล้วค่อยยิง /cat/session/:id/next-item LCP จึงช้าถึง 3.4 วินาทีบนมือถือ
//
// ไม่ดึงเมื่อมี item_bank_id (กำลังจะเริ่มสอบชุดใหม่ ซึ่งต้อง POST /cat/start ฝั่งไคลเอนต์)
// และ next-item เป็น GET ที่ไม่แก้ข้อมูลใน session จึงเรียกจากเซิร์ฟเวอร์ได้ปลอดภัย
import { cookies } from 'next/headers';
import { AUTH_COOKIE } from '@/lib/authCookie';
import CATExamClient, { type CATSession } from './CATExamClient';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

async function getJson<T>(url: string, token: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      // ข้อมูลของผู้ใช้แต่ละคน ห้ามแคชข้ามผู้ใช้
      cache: 'no-store',
      // กัน backend ช้าไม่ให้ลาก TTFB ของหน้าไปด้วย
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** คืน null เมื่อดึงไม่ได้ ให้ไคลเอนต์หา session และจัดการข้อผิดพลาดเองเหมือนเดิม */
async function fetchCurrentItem(searchParams: Awaited<SearchParams>): Promise<CATSession | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!apiUrl || !token || searchParams.item_bank_id) return null;

  let sessionId = Number(searchParams.session_id) || null;
  if (!sessionId) {
    const active = await getJson<{ session_id?: number | string }>(`${apiUrl}/cat/active-session`, token);
    sessionId = Number(active?.session_id) || null;
  }
  if (!sessionId) return null;

  const session = await getJson<CATSession>(`${apiUrl}/cat/session/${sessionId}/next-item`, token);
  return session?.current_item ? session : null;
}

export default async function CATExamPage({ searchParams }: { searchParams: SearchParams }) {
  const initialSession = await fetchCurrentItem(await searchParams);

  return <CATExamClient initialSession={initialSession} />;
}
