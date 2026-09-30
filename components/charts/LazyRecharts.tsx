"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Recharts = typeof import("recharts");

/**
 * ระยะที่เริ่มโหลดล่วงหน้าก่อนกราฟจะเลื่อนเข้ามาในจอ
 *
 * ตั้ง 0 คือโหลดตอนกราฟโผล่เข้าจอจริง ๆ ลองปรับเป็น 300 แล้ววัดเทียบ พบว่า
 * หน้า cat-exam/result มีกราฟใบแรกอยู่ในระยะเผื่อพอดี เลยโหลดตั้งแต่เปิดหน้า
 * TBT ต่างกัน 360ms กับ 220ms (คะแนน 83 กับ 88) จึงเลือก 0
 *
 * ผลข้างเคียงคือถ้าเลื่อนเร็วมากอาจเห็นพื้นที่ว่างแวบหนึ่ง แต่ไม่เกิดการกระโดด
 * เพราะจองความสูงไว้เท่าของจริงแล้ว
 */
const PRELOAD_MARGIN_PX = 0;

/**
 * โหลด recharts เมื่อกราฟใกล้จะเลื่อนเข้ามาในจอ ไม่ใช่ตอนเปิดหน้า
 *
 * recharts เป็นก้อนใหญ่ราว 261KB ถ้า import ตรง ๆ เบราว์เซอร์ต้องดาวน์โหลดและ
 * แกะทั้งก้อนก่อนหน้าจะพร้อมใช้งาน ทำให้ TBT สูง ทั้งที่กราฟมักอยู่ใต้เส้นพับ
 * และผู้ใช้ยังไม่เห็นด้วยซ้ำ (วัดได้ว่ากิน CPU 653-855ms บนหน้า followup
 * และ cat-exam/result ซึ่งกราฟทุกตัวอยู่ใต้เส้นพับทั้งหมด)
 *
 * แค่เปลี่ยนเป็น dynamic import ยังไม่พอ เพราะโมดูลจะถูกโหลดทันทีหลัง mount
 * ซึ่งยังอยู่ในช่วงที่ Lighthouse นับ TBT จึงรอจนกราฟใกล้เข้าจอก่อนค่อยโหลด
 *
 * ใช้ dynamic import ทีละแท็กไม่ได้ เพราะ recharts ตรวจชนิดของ children เพื่อ
 * ประกอบกราฟ การห่อด้วย lazy wrapper จะทำให้มันไม่รู้จัก จึงส่งทั้งโมดูลเข้าไป
 * ใน children แบบฟังก์ชันแทน โค้ดกราฟเดิมย้ายมาได้โดยแค่เติม R. นำหน้า
 *
 *   <LazyRecharts height={270}>
 *     {(R) => (
 *       <R.ResponsiveContainer width="100%" height={270}>
 *         <R.LineChart data={data}>...</R.LineChart>
 *       </R.ResponsiveContainer>
 *     )}
 *   </LazyRecharts>
 *
 * ระหว่างรอจะกันพื้นที่ไว้เท่าความสูงจริง เนื้อหาใต้กราฟจึงไม่กระโดด (กัน CLS)
 */
export default function LazyRecharts({
  height,
  children,
}: {
  height: number | string;
  children: (recharts: Recharts) => ReactNode;
}) {
  const placeholderRef = useRef<HTMLDivElement | null>(null);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [recharts, setRecharts] = useState<Recharts | null>(null);

  // รอจนกราฟใกล้เข้ามาในจอ ถ้าเบราว์เซอร์ไม่รองรับ IntersectionObserver ก็โหลดเลย
  useEffect(() => {
    const el = placeholderRef.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setShouldLoad(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: `${PRELOAD_MARGIN_PX}px` },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!shouldLoad) return;
    let alive = true;
    import("recharts").then((mod) => {
      if (alive) setRecharts(mod);
    });
    return () => {
      alive = false;
    };
  }, [shouldLoad]);

  if (!recharts) {
    return <div ref={placeholderRef} style={{ height }} aria-hidden="true" />;
  }

  return <>{children(recharts)}</>;
}
