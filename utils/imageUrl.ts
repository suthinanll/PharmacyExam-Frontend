/**
 * แปลง URL รูปข้อสอบ (คำถาม / สถานการณ์ / ตัวเลือก) ให้พร้อมใช้ใน <img src>
 *
 * backend เก็บได้ 3 แบบ: path ของไฟล์ที่อัปโหลด (/uploads/...), URL เต็ม (http/https)
 * และ data URL ที่ฝังมากับไฟล์ Excel — ต่อ NEXT_PUBLIC_API_URL ให้เฉพาะแบบแรก
 * เดิมบางหน้าใช้ค่าดิบตรง ๆ (รูป /uploads/ ไม่ขึ้น) และบางหน้าต่อ API_URL ให้ data URL ด้วย (รูปพัง)
 */
export function resolveImageUrl(url: string | null | undefined): string {
    const trimmed = url?.trim();
    if (!trimmed) return "";
    if (/^(https?:|data:|blob:)/i.test(trimmed)) return trimmed;
    const base = process.env.NEXT_PUBLIC_API_URL ?? "";
    return `${base}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}
