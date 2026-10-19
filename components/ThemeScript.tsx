import { headers } from 'next/headers';
import { FONT_KEY, THEME_KEY } from '@/lib/theme';

/**
 * ตั้งธีมมืด (เฉพาะ /user) และขนาดตัวอักษร (/user และ /admin) ก่อนเบราว์เซอร์วาดหน้าแรก
 *
 * ถ้ารอให้ React ทำหลัง hydrate หน้าจะขึ้นสีขาวแวบหนึ่งก่อนกลายเป็นสีมืด
 * และตัวอักษรจะเปลี่ยนขนาดหลังแสดงไปแล้ว (Lighthouse นับเป็น CLS)
 * จึงต้องเป็นสคริปต์ inline ใน <head> และต้องมี nonce เพราะ CSP ไม่อนุญาตสคริปต์ที่ไม่มี nonce
 *
 * แยกเป็นคอมโพเนนต์เพราะการเรียก headers() ใน root layout โดยตรงทำให้ metadata
 * ถูกสตรีมไปท้าย body (ดูหมายเหตุใน ServiceWorkerRegister.tsx)
 *
 * ตรรกะต้องตรงกับ applyDisplaySettings ใน lib/theme.ts
 */
export default async function ThemeScript() {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  const code = `(function(){try{
var p=location.pathname,u=p.indexOf('/user')===0;
if(!u&&p.indexOf('/admin')!==0)return;
var r=document.documentElement,t=localStorage.getItem('${THEME_KEY}'),f=localStorage.getItem('${FONT_KEY}');
if(u&&(t==='dark'||(t==='system'&&matchMedia('(prefers-color-scheme: dark)').matches)))r.classList.add('dark');
if(f==='sm'||f==='md'||f==='lg')r.dataset.fontSize=f;
}catch(e){}})();`;

  // suppressHydrationWarning: เบราว์เซอร์ซ่อนค่า nonce หลังโหลด ค่าฝั่ง client จึงว่างเสมอ
  return <script nonce={nonce} suppressHydrationWarning dangerouslySetInnerHTML={{ __html: code }} />;
}
