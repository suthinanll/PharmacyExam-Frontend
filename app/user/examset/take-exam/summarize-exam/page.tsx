// Server Component: ดึงผลสอบให้เสร็จก่อนส่ง HTML
// ชื่อชุดข้อสอบ (องค์ประกอบ LCP) และคะแนนจึงอยู่ใน HTML แรก ไม่ต้องรอ JS โหลดเสร็จแล้วค่อยดึง
// (เดิม LCP 3.2-3.3 วินาทีบนมือถือ)
import SummarizeClient, { type ExamResult } from './SummarizeClient';
import { fetchExamResult, type SearchParams } from './fetchResult';

/**
 * หน้าสรุปผลใช้แค่ว่าแต่ละข้อถูกหรือผิด และอยู่หัวข้อไหน
 * แต่ผลสอบจาก API มีโจทย์ ตัวเลือก และคำอธิบายของทุกข้อด้วย (ชุด 38 ข้อราว 73KB)
 * ข้อมูลที่ส่งให้ client component จะถูกฝังลงใน HTML ทั้งก้อน จึงตัดส่วนที่ไม่ได้ใช้ออกก่อน
 */
function forSummary(result: ExamResult | null): ExamResult | null {
  if (!result) return null;
  return {
    ...result,
    responses: result.responses?.map((r) => ({
      item_id: r.item_id,
      question_text: '',
      is_correct: r.is_correct,
      sub_topics: r.sub_topics,
    })),
  };
}

export default async function SummarizePage({ searchParams }: { searchParams: SearchParams }) {
  const initialResult = forSummary(await fetchExamResult<ExamResult>(searchParams));

  return <SummarizeClient initialResult={initialResult} />;
}
