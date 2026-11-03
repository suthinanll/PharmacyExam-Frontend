/** ประเภทปัญหาที่ผู้เรียนเลือกตอนแจ้งปัญหาข้อสอบ (ต้องตรงกับ ITEM_REPORT_REASONS ฝั่ง backend) */
export const REPORT_REASON_LABEL: Record<string, string> = {
  wrong_answer: "เฉลยผิด",
  unclear: "โจทย์/ตัวเลือกกำกวม",
  typo: "พิมพ์ผิด",
  missing_image: "รูปไม่แสดง / ไม่มีรูป",
  other: "อื่น ๆ",
};

/** รายงานที่รอตรวจของข้อหนึ่ง ตามที่ GET /item-reports/open-by-items ส่งมา */
export interface OpenItemReport {
  id: number;
  reason: string;
  message: string | null;
  created_at: string;
  item_edited_at: string | null;
  reporter: string | null;
}

export const formatReportTime = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" });
