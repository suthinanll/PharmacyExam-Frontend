"use client";

import { useSyncExternalStore } from "react";
import { sanitizeHtml } from "@/utils/sanitize";

/** ข้อความ HTML เป็นข้อความล้วน ใช้แสดงระหว่างรอ hydrate เท่านั้น (React escape ให้แล้ว จึงไม่เปิดช่อง XSS) */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

const noopSubscribe = () => () => {};

/** false ตอนเรนเดอร์บนเซิร์ฟเวอร์และตอน hydrate, true หลังจากนั้น (ไม่ต้องรอ effect จึงไม่กะพริบ) */
function useHydrated() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

/**
 * ข้อความโจทย์ สถานการณ์ ตัวเลือก และคำอธิบาย ซึ่งเป็น HTML จาก editor
 *
 * sanitizeHtml (DOMPurify) ทำงานได้เฉพาะในเบราว์เซอร์ บนเซิร์ฟเวอร์คืนค่าว่าง
 * ถ้าใส่ dangerouslySetInnerHTML ตรง ๆ HTML แรกจะไม่มีข้อความเลย หน้าที่ดึงข้อมูลฝั่งเซิร์ฟเวอร์
 * (ข้อสอบ CAT, เฉลย) จึงต้องรอ JS ก่อนถึงจะเห็นข้อความ ทั้งที่ข้อความนี้มักเป็นองค์ประกอบ LCP
 *
 * - ข้อความที่ไม่มีแท็กหรือ entity (ส่วนใหญ่) แสดงเป็นข้อความธรรมดาตลอด
 *   ไม่สลับเป็น innerHTML ภายหลัง เพราะการวาดข้อความใหม่หลัง hydrate นับเป็น LCP รอบใหม่
 * - ข้อความที่มีแท็ก แสดงเป็นข้อความล้วนก่อน แล้วสลับเป็น HTML ที่ผ่าน DOMPurify ทันทีที่ hydrate เสร็จ
 *   ทั้งสองฝั่งจึงเรนเดอร์ตรงกัน ไม่เกิด hydration mismatch
 */
export default function RichText({
  html,
  as: Tag = "p",
  className,
}: {
  html: string | null | undefined;
  as?: "p" | "span" | "div";
  className?: string;
}) {
  const hydrated = useHydrated();
  const value = html ?? "";
  if (!/[<&]/.test(value)) return <Tag className={className}>{value}</Tag>;
  if (!hydrated) return <Tag className={className}>{htmlToPlainText(value)}</Tag>;
  return <Tag className={className} dangerouslySetInnerHTML={{ __html: sanitizeHtml(value) }} />;
}
