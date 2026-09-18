import DOMPurify from "dompurify";

/**
 * ล้าง HTML ก่อนนำไปแสดงด้วย dangerouslySetInnerHTML
 *
 * เนื้อหาโจทย์ ตัวเลือก และสถานการณ์ถูกสร้างจาก rich text editor และการนำเข้า Excel
 * ซึ่งอาจมีแท็กอันตรายติดมาได้ ถ้าบัญชีแอดมินถูกยึดหรือไฟล์นำเข้ามีสคริปต์ฝังไว้
 * จะกลายเป็น stored XSS ที่ยิงใส่ผู้เรียนทุกคน จึงต้องล้างก่อนแสดงผลเสมอ
 *
 * บนเซิร์ฟเวอร์ไม่มี DOM ให้ DOMPurify ทำงาน จึงคืนค่าว่างไว้ก่อน
 * แล้วค่อยแสดงผลจริงตอน hydrate ฝั่งเบราว์เซอร์ (หน้าเหล่านี้ดึงข้อมูลฝั่ง client อยู่แล้ว)
 */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  if (typeof window === "undefined") return "";

  return DOMPurify.sanitize(html, {
    // อนุญาตเฉพาะแท็กจัดรูปแบบข้อความ ตาราง และรูปภาพที่ editor ใช้จริง
    ALLOWED_TAGS: [
      "p", "br", "span", "div", "strong", "b", "em", "i", "u", "s", "mark", "small",
      "sub", "sup", "code", "pre", "blockquote",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "ul", "ol", "li",
      "table", "thead", "tbody", "tfoot", "tr", "th", "td",
      "a", "img", "hr",
    ],
    ALLOWED_ATTR: [
      "href", "target", "rel", "title",
      "src", "alt", "width", "height",
      "class", "style",
      "colspan", "rowspan",
    ],
    // กัน javascript: และ data: ที่ไม่ใช่รูปภาพ
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|data:image\/(?:png|jpe?g|gif|webp|svg\+xml);base64,|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
    FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form", "input"],
    FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "formaction"],
  });
}

export default sanitizeHtml;
