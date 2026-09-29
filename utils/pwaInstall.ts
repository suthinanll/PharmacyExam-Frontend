/**
 * สถานะการติดตั้ง PWA ที่ใช้ร่วมกันทั้งแอป
 *
 * เบราว์เซอร์ยิง `beforeinstallprompt` แค่ครั้งเดียวต่อการโหลดหน้า และต้องเก็บ event นั้นไว้
 * ถึงจะเรียกหน้าต่างติดตั้งทีหลังได้ ถ้าไปรอจับใน useEffect ของคอมโพเนนต์ อาจพลาดเพราะ
 * event มาถึงก่อนคอมโพเนนต์ mount จึงจับไว้ตั้งแต่โมดูลนี้ถูกโหลด แล้วแชร์ให้ทุกที่ใช้
 */

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export type InstallPlatform = "ios" | "android" | "desktop";

/** event ที่ใช้สั่งเปิดหน้าต่างวิธีติดตั้งจากที่ไหนก็ได้ เช่น เมนูโปรไฟล์ */
export const OPEN_INSTALL_GUIDE_EVENT = "pwa:open-install-guide";

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

/** เปิดอยู่ในแอปที่ติดตั้งแล้ว (ไม่ใช่แท็บเบราว์เซอร์) */
export const isRunningStandalone = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    // Safari บน iOS ใช้ property นี้แทน display-mode
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true);

export const detectPlatform = (): InstallPlatform => {
  if (typeof window === "undefined") return "desktop";
  const ua = window.navigator.userAgent.toLowerCase();
  const isIOS =
    /iphone|ipad|ipod/.test(ua) || (ua.includes("mac") && navigator.maxTouchPoints > 1);
  if (isIOS) return "ios";
  if (/android/.test(ua)) return "android";
  return "desktop";
};

/** เบราว์เซอร์พร้อมให้กด "ติดตั้งตอนนี้" หรือยัง (Chrome/Edge ที่ยิง beforeinstallprompt แล้ว) */
export const canPromptInstall = () => deferredPrompt !== null;

/** เปิดหน้าต่างติดตั้งของเบราว์เซอร์ คืนผลว่าผู้ใช้กดติดตั้งหรือไม่ */
export const promptInstall = async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
  if (!deferredPrompt) return "unavailable";

  const promptEvent = deferredPrompt;
  await promptEvent.prompt();
  const { outcome } = await promptEvent.userChoice;

  // event ใช้ได้ครั้งเดียว ต้องรอเบราว์เซอร์ยิงใหม่รอบหน้า
  deferredPrompt = null;
  notify();
  return outcome;
};

/** ติดตามการเปลี่ยนแปลงสถานะ (มี/ไม่มี event ให้ติดตั้ง) คืนฟังก์ชันยกเลิกการติดตาม */
export const subscribeInstallState = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};

/** เปิดหน้าต่างวิธีติดตั้ง — ใช้จากเมนูต่าง ๆ แม้ผู้ใช้เคยกด "ไว้ทีหลัง" ไปแล้ว */
export const openInstallGuide = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(OPEN_INSTALL_GUIDE_EVENT));
  }
};
