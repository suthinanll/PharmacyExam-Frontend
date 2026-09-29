/**
 * รายชื่อโฮสต์ของรูปภาพที่เว็บอนุญาตให้โหลด — แหล่งความจริงเดียว
 *
 * รูปในเว็บผ่าน 2 ด่านที่ไม่เกี่ยวกัน ถ้าลืมด่านใดด่านหนึ่งรูปจะไม่ขึ้น
 *   1) next/image  -> ต้องมีใน images.remotePatterns ของ next.config.ts
 *                     ไม่งั้น /_next/image ตอบ 400 (เช่นการ์ดข่าวในหน้าแรก)
 *   2) <img> ปกติ  -> ต้องมีใน img-src ของ CSP ใน middleware.ts
 *                     ไม่งั้นเบราว์เซอร์บล็อก (เช่นรูปปกและรูปในเนื้อข่าวหน้า newsdetail)
 * เดิมสองด่านนี้แยกกันเขียน ทำให้รูปข่าวจาก hfocus / สภาเภสัชฯ / Facebook ไม่แสดง
 */

/** โฮสต์ที่ระบุเป็นชื่อตรง ๆ (ใช้ได้ทั้ง remotePatterns และ CSP) */
const IMAGE_HOSTNAMES = [
  // รูปที่ผู้ใช้อัปโหลด เสิร์ฟจาก backend เอง
  '*.up.railway.app',
  'pharmacyexamth.com',
  '*.pharmacyexamth.com',

  // รูปโปรไฟล์จากบัญชี Google
  'lh3.googleusercontent.com',
  '*.googleusercontent.com',

  // แหล่งรูปข่าวที่ระบบดึงมาแสดง
  'www.hfocus.org',
  'hfocus.org',
  'www.pharmacycouncil.org',
  'pharmacycouncil.org',
  'kdmshospital.com',
  '*.kdmshospital.com',

  // รูปที่ผู้ดูแลแปะมาจากโพสต์ Facebook ในเนื้อข่าว
  '*.fbcdn.net',
];

/** แปลงเป็นรูปแบบของ images.remotePatterns */
const remoteImagePatterns = () => [
  ...IMAGE_HOSTNAMES.map((hostname) => ({ protocol: 'https', hostname })),
  { protocol: 'http', hostname: 'localhost' },
  { protocol: 'http', hostname: '127.0.0.1' },
];

/** แปลงเป็นรายการ source ของ CSP img-src */
const cspImageSources = () => IMAGE_HOSTNAMES.map((hostname) => `https://${hostname}`);

module.exports = { IMAGE_HOSTNAMES, remoteImagePatterns, cspImageSources };
