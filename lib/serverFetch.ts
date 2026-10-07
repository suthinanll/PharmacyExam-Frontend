import { cookies } from 'next/headers';
import { AUTH_COOKIE } from './authCookie';

/**
 * ดึงข้อมูลของผู้ใช้จาก backend ใน Server Component โดยใช้ token จากคุกกี้ (lib/authCookie.ts)
 *
 * คืน null ทุกกรณีที่ไม่สำเร็จ (ไม่มีคุกกี้, token หมดอายุ, backend ช้าหรือล่ม)
 * หน้าที่เรียกใช้จะส่ง null ให้ไคลเอนต์ แล้วไคลเอนต์ดึงและจัดการข้อผิดพลาดเองเหมือนเดิม
 */
export async function fetchWithAuth<T>(path: string): Promise<T | null> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const token = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!apiUrl || !token) return null;

  try {
    const res = await fetch(`${apiUrl}${path}`, {
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

/** อ่านค่าคุกกี้ทั่วไปใน Server Component */
export async function readCookie(name: string): Promise<string | undefined> {
  return (await cookies()).get(name)?.value;
}
