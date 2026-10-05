/**
 * สำเนาของ access_token ในคุกกี้ ให้ Server Component ดึงข้อมูลของผู้ใช้ได้ตั้งแต่ตอนวาด HTML
 *
 * token ตัวจริงยังอยู่ใน localStorage และทุกอย่างฝั่งไคลเอนต์ใช้จากที่นั่นเหมือนเดิม
 * คุกกี้นี้มีไว้แค่ให้หน้าที่ข้อมูลส่วนตัวเป็นองค์ประกอบ LCP (เช่น /user/saveblog)
 * วาดเนื้อหามาพร้อม HTML ได้ ไม่ต้องรอ JS โหลดและ hydrate เสร็จก่อนค่อยเริ่มดึง
 *
 * ไม่ได้ทำให้ token เสี่ยงขึ้นกว่าเดิม เพราะ localStorage ก็อ่านได้จาก JS อยู่แล้ว
 * Secure ส่งเฉพาะผ่าน HTTPS และ SameSite=Lax ไม่ติดไปกับ request ที่เว็บอื่นยิงเข้ามา
 * ถ้าคุกกี้หายหรือ token หมดอายุ หน้าจะกลับไปดึงข้อมูลฝั่งไคลเอนต์ตามปกติ
 */
export const AUTH_COOKIE = 'access_token';

/** อายุคุกกี้ตาม exp ของ JWT อ่านไม่ได้ให้ใช้ 1 วัน (เท่าอายุ token ปัจจุบัน) */
function maxAgeSeconds(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (typeof payload.exp === 'number') {
      return Math.max(0, Math.floor(payload.exp - Date.now() / 1000));
    }
  } catch { }
  return 60 * 60 * 24;
}

export function setAuthCookie(token: string) {
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${maxAgeSeconds(token)}; SameSite=Lax${secure}`;
}

export function clearAuthCookie() {
  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}
