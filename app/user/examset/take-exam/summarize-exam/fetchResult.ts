import { fetchWithAuth, readCookie } from '@/lib/serverFetch';
import { EXAM_RESULT_COOKIE } from '@/lib/resultSession';

export type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

/**
 * ผลสอบของ session ที่กำลังดู ใช้ร่วมกันระหว่างหน้าสรุปผลและหน้าเฉลย
 * session id มาจาก ?session_id= ก่อน ถ้าไม่มีใช้คุกกี้ที่หน้าเหล่านี้จำไว้ (lib/resultSession.ts)
 * คืน null เมื่อหาไม่ได้หรือดึงไม่สำเร็จ ให้ไคลเอนต์จัดการต่อเหมือนเดิม
 */
export async function fetchExamResult<T>(searchParams: SearchParams): Promise<T | null> {
  const params = await searchParams;
  const fromUrl = typeof params.session_id === 'string' ? params.session_id : undefined;
  const sessionId = Number(fromUrl ?? (await readCookie(EXAM_RESULT_COOKIE)));
  if (!Number.isInteger(sessionId) || sessionId <= 0) return null;

  return fetchWithAuth<T>(`/items-bank/exam/${sessionId}/result`);
}
