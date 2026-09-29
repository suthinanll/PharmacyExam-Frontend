// Server Component: ดึงตารางสอบสาธารณะให้เสร็จก่อนส่ง HTML
// การ์ดนับถอยหลัง (องค์ประกอบ LCP ของหน้านี้) จึงปรากฏพร้อมหน้าเว็บ
// แทนที่จะรอ hydrate + fetch ซึ่งเดิมหน่วงไปกว่า 3 วินาที
import { fetchPublicSchedules } from '@/lib/schedule';
import UserHomeClient from './UserHomeClient';

export default async function UserHomePage() {
  const initialSchedules = await fetchPublicSchedules();

  return <UserHomeClient initialSchedules={initialSchedules} />;
}
