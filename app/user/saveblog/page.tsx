// Server Component: ดึงข่าวที่บันทึกไว้ให้เสร็จก่อนส่ง HTML โดยใช้ token จากคุกกี้ (lib/authCookie.ts)
//
// รูปปกใบแรกคือองค์ประกอบ LCP ของหน้า เดิมต้องรอ JS โหลดและ hydrate เสร็จ (~3.3 วินาทีบนมือถือ)
// แล้วค่อยยิง /bookmark กว่ารูปจะเริ่มโหลด LCP จึงช้าถึง 3.8-4.5 วินาที
// พอดึงฝั่งเซิร์ฟเวอร์ การ์ดและรูปปกอยู่ใน HTML แรก เบราว์เซอร์เริ่มโหลดรูปได้ทันที
import { cookies } from 'next/headers';
import { AUTH_COOKIE } from '@/lib/authCookie';
import SaveBlogClient, { type BookmarkItem } from './SaveBlogClient';

/** คืน null เมื่อไม่มีคุกกี้หรือดึงไม่สำเร็จ (เช่น token หมดอายุ) ให้ไคลเอนต์ดึงและจัดการข้อผิดพลาดเอง */
async function fetchBookmarks(): Promise<BookmarkItem[] | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!apiUrl || !token) return null;

  try {
    const res = await fetch(`${apiUrl}/bookmark`, {
      headers: { Authorization: `Bearer ${token}` },
      // ข้อมูลของผู้ใช้แต่ละคน ห้ามแคชข้ามผู้ใช้
      cache: 'no-store',
      // กัน backend ช้าไม่ให้ลาก TTFB ของหน้าไปด้วย
      signal: AbortSignal.timeout(2500),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data) ? data : null;
  } catch {
    return null;
  }
}

export default async function SaveBlogPage() {
  const initialBookmarks = await fetchBookmarks();

  return <SaveBlogClient initialBookmarks={initialBookmarks} />;
}
