/**
 * SweetAlert2 แบบโหลดเมื่อใช้จริง
 *
 * ทุกที่ในโปรเจกต์ให้ import จากไฟล์นี้: import Swal from "@/utils/sweetalert";
 * (ส่วนชุดสีมาตรฐานของปุ่มยังอยู่ที่ utils/swal.ts เหมือนเดิม)
 *
 * เดิม import SweetAlert2 ตรง ๆ ทำให้ Navbar และ layout ของผู้ใช้ดึงไลบรารีราว 45KB
 * (พร้อม CSS) เข้ามาในทุกหน้า เบราว์เซอร์ต้องดาวน์โหลดและรันตั้งแต่เปิดหน้า
 * ทั้งที่ popup เกิดหลังผู้ใช้กดอะไรสักอย่างเกือบทั้งหมด จึงเพิ่ม TBT ให้ทุกหน้าโดยไม่จำเป็น
 *
 * ไฟล์นี้คงหน้าตา API เดิมไว้ (Swal.fire, Swal.close, Swal.mixin ฯลฯ) แต่ตัวไลบรารีจริง
 * (utils/sweetalert-impl.ts) จะถูกโหลดตอนเรียกใช้ครั้งแรก หรือตอนผู้ใช้เริ่มแตะหน้าจอ
 * Swal.fire คืน Promise อยู่แล้ว โค้ดที่ใช้ .then หรือ await จึงทำงานเหมือนเดิม
 */
import type { SweetAlertIcon, SweetAlertOptions, SweetAlertResult } from "sweetalert2";

type SwalStatic = typeof import("sweetalert2").default;

let swal: SwalStatic | null = null;
let loading: Promise<SwalStatic> | null = null;

/** โหลด SweetAlert2 (ครั้งเดียว) */
export function loadSwal(): Promise<SwalStatic> {
  if (!loading) {
    loading = import("./sweetalert-impl").then((m) => (swal = m.default));
  }
  return loading;
}

// โหลดล่วงหน้าตอนผู้ใช้เริ่มโต้ตอบกับหน้า popup ส่วนใหญ่ตามมาหลังการแตะหรือกด
// จึงมักโหลดเสร็จทันก่อนต้องแสดง และไม่ไปเพิ่มงานช่วงเปิดหน้า
if (typeof window !== "undefined") {
  const preload = () => {
    loadSwal();
    window.removeEventListener("pointerdown", preload);
    window.removeEventListener("keydown", preload);
  };
  window.addEventListener("pointerdown", preload, { passive: true });
  window.addEventListener("keydown", preload);
}

/** เรียกทันทีถ้าโหลดแล้ว ไม่งั้นรอให้โหลดเสร็จก่อน (ลำดับการเรียกยังคงเดิม) */
function invoke(name: "close" | "showLoading" | "stopTimer" | "resumeTimer" | "update", args: unknown[]) {
  const run = (s: SwalStatic) => (s[name] as (...a: unknown[]) => unknown)(...args);
  if (swal) return run(swal);
  loadSwal().then(run);
}

function fire<T = any>(options: SweetAlertOptions): Promise<SweetAlertResult<Awaited<T>>>;
function fire<T = any>(title?: string, html?: string, icon?: SweetAlertIcon): Promise<SweetAlertResult<Awaited<T>>>;
function fire(...args: unknown[]) {
  return loadSwal().then((s) => (s.fire as (...a: unknown[]) => unknown)(...args));
}

const Swal = {
  fire,
  /** คืนตัวที่มี fire เหมือนกัน โดยตั้งค่าเริ่มต้นไว้ล่วงหน้า */
  mixin(options: SweetAlertOptions) {
    return {
      fire<T = any>(more: SweetAlertOptions = {}): Promise<SweetAlertResult<Awaited<T>>> {
        return loadSwal().then((s) => s.mixin(options).fire(more)) as Promise<SweetAlertResult<Awaited<T>>>;
      },
    };
  },
  close: (...args: unknown[]) => void invoke("close", args),
  showLoading: (...args: unknown[]) => void invoke("showLoading", args),
  stopTimer: (...args: unknown[]) => void invoke("stopTimer", args),
  resumeTimer: (...args: unknown[]) => void invoke("resumeTimer", args),
  update: (options: SweetAlertOptions) => void invoke("update", [options]),
  // ค่าเดียวกับ Swal.DismissReason ของจริง (เป็นสตริงตอนรัน แม้ type จะประกาศเป็น enum)
  DismissReason: {
    cancel: "cancel",
    backdrop: "backdrop",
    close: "close",
    esc: "esc",
    timer: "timer",
  } as unknown as SwalStatic["DismissReason"],
};

export default Swal;
