/**
 * session ของผลสอบแบบชุดข้อสอบที่กำลังดูอยู่ (หน้าสรุปผลและหน้าเฉลย)
 *
 * แอปเก็บ session id ไว้ใน sessionStorage เพื่อไม่ให้โผล่ใน URL แต่เซิร์ฟเวอร์อ่าน sessionStorage ไม่ได้
 * จึงเก็บสำเนาไว้ในคุกกี้ด้วย ให้ Server Component ดึงผลสอบมาพร้อม HTML ได้
 * (หัวข้อชุดข้อสอบและข้อความสถานการณ์คือองค์ประกอบ LCP ของสองหน้านี้)
 *
 * ถ้าคุกกี้ไม่ตรงกับ sessionStorage ของแท็บ (เช่นเปิดผลสอบคนละชุดในสองแท็บ)
 * หน้าจะดึงชุดที่ถูกต้องฝั่งไคลเอนต์ตามปกติ
 */
export const EXAM_RESULT_COOKIE = 'exam_result_session';

export function rememberExamResultSession(sessionId: string | number) {
  document.cookie = `${EXAM_RESULT_COOKIE}=${encodeURIComponent(String(sessionId))}; path=/user; max-age=${60 * 60 * 24 * 7}; SameSite=Lax`;
}
