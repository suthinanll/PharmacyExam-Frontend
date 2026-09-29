// Server Component: ดึงตารางสอบสาธารณะให้เสร็จก่อนส่ง HTML
// การ์ดนับถอยหลังซึ่งเป็นทั้งองค์ประกอบ LCP และ <h1> เดียวของหน้า
// จึงอยู่ใน HTML ตั้งแต่แรก แทนที่จะรอ hydrate + fetch
import { fetchPublicSchedules } from '@/lib/schedule';
import HomeClient from './HomeClient';

export default async function HomePage() {
  const initialSchedules = await fetchPublicSchedules();

  return <HomeClient initialSchedules={initialSchedules} />;
}
