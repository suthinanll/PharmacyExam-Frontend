"use client";

import { useEffect, useState, type ReactNode } from "react";

type Recharts = typeof import("recharts");

/**
 * โหลด recharts หลังหน้าแสดงผลแล้ว แทนที่จะรวมไปกับ bundle ของหน้า
 *
 * recharts เป็นก้อนใหญ่ราว 261KB ถ้า import ตรง ๆ เบราว์เซอร์ต้องดาวน์โหลดและ
 * แกะทั้งก้อนก่อนหน้าจะพร้อมใช้งาน ทำให้ TBT สูง (วัดได้ 550-600ms เฉพาะ chunk นี้)
 * ทั้งที่กราฟมักอยู่ล่างจอและผู้ใช้ยังไม่เห็นด้วยซ้ำ
 *
 * ใช้ dynamic import ธรรมดากับ <XAxis /> <Tooltip /> ทีละตัวไม่ได้ เพราะ recharts
 * ตรวจชนิดของ children เพื่อประกอบกราฟ การห่อด้วย lazy wrapper จะทำให้มันไม่รู้จัก
 * จึงส่งทั้งโมดูลเข้าไปใน children แบบฟังก์ชันแทน โค้ดกราฟเดิมย้ายมาได้โดยแค่เติม R. นำหน้า
 *
 *   <LazyRecharts height={270}>
 *     {(R) => (
 *       <R.ResponsiveContainer width="100%" height={270}>
 *         <R.LineChart data={data}>...</R.LineChart>
 *       </R.ResponsiveContainer>
 *     )}
 *   </LazyRecharts>
 *
 * ระหว่างรอโหลดจะกันพื้นที่ไว้เท่าความสูงจริง เนื้อหาใต้กราฟจึงไม่กระโดด (กัน CLS)
 */
export default function LazyRecharts({
  height,
  children,
}: {
  height: number | string;
  children: (recharts: Recharts) => ReactNode;
}) {
  const [recharts, setRecharts] = useState<Recharts | null>(null);

  useEffect(() => {
    let alive = true;
    import("recharts").then((mod) => {
      if (alive) setRecharts(mod);
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!recharts) {
    return <div style={{ height }} aria-hidden="true" />;
  }

  return <>{children(recharts)}</>;
}
