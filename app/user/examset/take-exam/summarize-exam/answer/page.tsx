// Server Component: ดึงเฉลยให้เสร็จก่อนส่ง HTML
// ข้อความสถานการณ์ของกลุ่มแรก (องค์ประกอบ LCP) จึงอยู่ใน HTML แรก
// ไม่ต้องรอ JS โหลดเสร็จแล้วค่อยดึง (เดิม LCP 3.5 วินาทีบนมือถือ)
import AnswerClient, { type ExamResult } from './AnswerClient';
import { fetchExamResult, type SearchParams } from '../fetchResult';

export default async function AnswerPage({ searchParams }: { searchParams: SearchParams }) {
  const initialResult = await fetchExamResult<ExamResult>(searchParams);

  return <AnswerClient initialResult={initialResult} />;
}
