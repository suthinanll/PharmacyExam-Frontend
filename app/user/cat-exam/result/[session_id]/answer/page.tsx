// Server Component: ดึงเฉลยการสอบ CAT ให้เสร็จก่อนส่ง HTML
// ข้อความสถานการณ์ของกลุ่มแรก (องค์ประกอบ LCP) จึงอยู่ใน HTML แรก
// ไม่ต้องรอ JS โหลดเสร็จแล้วค่อยดึง (เดิม LCP 3.4 วินาทีบนมือถือ)
import { fetchWithAuth } from '@/lib/serverFetch';
import CatAnswerClient, { type CatExamResult } from './CatAnswerClient';

export default async function CatAnswerPage({ params }: { params: Promise<{ session_id: string }> }) {
  const { session_id } = await params;
  const id = Number(session_id);
  const initialResult = Number.isInteger(id) && id > 0
    ? await fetchWithAuth<CatExamResult>(`/cat/session/${id}/result`)
    : null;

  return <CatAnswerClient initialResult={initialResult} />;
}
