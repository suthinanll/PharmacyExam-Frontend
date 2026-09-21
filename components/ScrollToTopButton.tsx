"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ArrowUp } from "lucide-react";

/** เลื่อนลงเกินเท่านี้ (px) ถึงจะแสดงปุ่ม */
const SHOW_AFTER_PX = 400;

/** หน้าที่มีแถบปุ่มลอยอยู่ด้านล่างอยู่แล้ว — ซ่อนปุ่มไว้ไม่ให้ทับกัน */
const HIDDEN_PATH_PATTERNS = [
  /^\/admin\/manage_calendar\/calendar_add/,
  /^\/admin\/manage_examset\/[^/]+$/,
];

export default function ScrollToTopButton() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > SHOW_AFTER_PX);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (HIDDEN_PATH_PATTERNS.some((pattern) => pattern.test(pathname ?? ""))) return null;

  const scrollToTop = () => {
    // ผู้ใช้ที่ตั้งค่าลดการเคลื่อนไหวไว้ ให้กระโดดขึ้นทันทีแทนการเลื่อนแบบนุ่ม
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="เลื่อนขึ้นด้านบนสุด"
      title="เลื่อนขึ้นด้านบนสุด"
      tabIndex={visible ? 0 : -1}
      aria-hidden={!visible}
      className={`fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full
        bg-green-700 text-white shadow-lg ring-1 ring-black/5 transition-all duration-300
        hover:bg-green-800 hover:shadow-xl focus:outline-none focus-visible:ring-4 focus-visible:ring-green-300
        cursor-pointer
        ${visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"}`}
    >
      <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
    </button>
  );
}
