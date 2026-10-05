// Server Component: อ่านคุกกี้ว่าผู้ใช้เคยยอมรับนโยบายความเป็นส่วนตัวแล้วหรือยัง
// popup นโยบายจึงอยู่ใน HTML แรกตั้งแต่ต้นสำหรับคนที่ยังไม่เคยยอมรับ
// เดิมรู้ได้จาก localStorage เท่านั้น popup จึงเด้งขึ้นหลัง hydrate เสร็จ
// และข้อความใน popup กลายเป็นองค์ประกอบ LCP ที่มาช้าถึง 3.5 วินาที
import { cookies } from 'next/headers';
import ChatbotClient from './ChatbotClient';
import { PRIVACY_COOKIE } from './privacy';

export default async function ChatbotPage() {
  const accepted = (await cookies()).get(PRIVACY_COOKIE)?.value === 'true';

  return <ChatbotClient initialShowPrivacy={!accepted} />;
}
