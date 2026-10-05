/**
 * ทำงานครั้งเดียวตอนเซิร์ฟเวอร์ Next เริ่ม
 *
 * ให้เซิร์ฟเวอร์คิดวันเวลาเป็นเวลาไทยเหมือนเบราว์เซอร์ของผู้ใช้
 * เซิร์ฟเวอร์ที่ deploy ใช้ UTC ช่วง 00:00-07:00 ของไทยจึงเห็น "วันนี้" เป็นคนละวัน
 * กับเบราว์เซอร์ ทุกอย่างที่วาดจาก new Date() / Date.now() / toLocaleDateString
 * (ช่องวันนี้ในปฏิทิน จำนวนวันที่เหลือในหน้าแรก) จึงไม่ตรงกับ HTML จากเซิร์ฟเวอร์
 * React เจอ hydration mismatch (error #418) แล้ววาดหน้าใหม่ทั้งหน้า
 * LCP ของหน้า /user/calendar ช้าไป 2.7 วินาทีและ console มี error
 *
 * Node อ่าน process.env.TZ ใหม่ทุกครั้งที่ตั้งค่า จึงตั้งตรงนี้ได้โดยไม่ต้องแก้ค่าบนโฮสต์
 */
export function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    process.env.TZ = 'Asia/Bangkok';
  }
}
