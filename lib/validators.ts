// ตัวตรวจข้อมูลที่ใช้ร่วมกันในฟอร์มของผู้ดูแลระบบ (ปฏิทิน ข่าวสาร)

/** ลิงก์ต้องเป็น URL ที่ขึ้นต้นด้วย http:// หรือ https:// */
export function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/** วันสิ้นสุดอยู่ก่อนวันเริ่มต้น (รับรูปแบบ YYYY-MM-DD จาก input type="date") */
export function isEndBeforeStart(start?: string, end?: string): boolean {
  return Boolean(start && end && end < start);
}
