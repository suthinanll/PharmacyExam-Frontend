// Server Component: ดึงข้อสอบของ session ที่กำลังสอบอยู่ให้เสร็จก่อนส่ง HTML
// ข้อความสถานการณ์ของข้อแรก (องค์ประกอบ LCP) จึงอยู่ใน HTML แรก
// เดิมต้องรอ JS โหลดเสร็จแล้วค่อยยิง /items-bank/:id/items (LCP 3.5 วินาทีบนมือถือ)
//
// ทั้งสอง endpoint เป็น GET ที่ไม่แก้ข้อมูล คำตอบที่ทำไว้และเวลาเริ่มสอบอยู่ใน localStorage
// ไคลเอนต์จึงกู้คืนส่วนนั้นเองหลังโหลด (TakeExamClient)
import { fetchWithAuth } from '@/lib/serverFetch';
import TakeExamClient, { type InitialExam } from './TakeExamClient';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

const asId = (v: unknown) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 0 ? String(n) : null;
};

async function fetchInitialExam(searchParams: SearchParams): Promise<InitialExam | null> {
  const params = await searchParams;
  let sessionId = asId(params.session_id);
  let itemBankId = asId(params.id);

  if (!sessionId || !itemBankId) {
    const active = await fetchWithAuth<{ session_id?: number; item_bank_id?: number }>(
      '/items-bank/exam/active-session',
    );
    sessionId = asId(active?.session_id);
    itemBankId = asId(active?.item_bank_id);
  }
  if (!sessionId || !itemBankId) return null;

  const itemBank = await fetchWithAuth<InitialExam['itemBank']>(`/items-bank/${itemBankId}/items`);
  if (!itemBank?.items?.length) return null;

  return { sessionId, itemBankId, itemBank };
}

export default async function TakeExamPage({ searchParams }: { searchParams: SearchParams }) {
  const initial = await fetchInitialExam(searchParams);

  return <TakeExamClient initial={initial} />;
}
