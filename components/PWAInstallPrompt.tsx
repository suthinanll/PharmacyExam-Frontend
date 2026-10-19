"use client";
import { useState, useEffect, useSyncExternalStore } from "react";
import { usePathname } from "next/navigation";
import {
  X,
  Download,
  Share,
  SquarePlus,
  CircleCheck,
  Monitor,
  MoreVertical,
} from "lucide-react";
import {
  OPEN_INSTALL_GUIDE_EVENT,
  canPromptInstall,
  detectPlatform,
  isRunningStandalone,
  promptInstall,
  subscribeInstallState,
  type InstallPlatform,
} from "@/utils/pwaInstall";

interface Step {
  icon: React.ElementType;
  text: string;
}

/** กด "ไว้ทีหลัง" หรือติดตั้งแล้ว — ไม่เด้งเองอีกเลยในเบราว์เซอร์นี้ (ยังเปิดจากเมนูได้) */
const DISMISSED_KEY = "pwa-dismissed";
/** เด้งไปแล้วในรอบการใช้งานนี้ — กันไม่ให้เด้งซ้ำทุกครั้งที่รีเฟรชหรือเปิดหน้าใหม่ */
const SHOWN_THIS_SESSION_KEY = "pwa-prompt-shown";
/** หน่วงหลังผู้ใช้เริ่มใช้งานหน้า ไม่ใช่หน่วงจากตอนโหลดเสร็จ */
const SHOW_DELAY_MS = 1200;

/** หน้าที่ป๊อปอัปจะรบกวนการใช้งาน เช่น ระหว่างทำข้อสอบ */
const EXCLUDED_PATH_PREFIXES = [
  "/user/examset/take-exam",
  "/user/cat-exam/exam",
  "/user/complete-profile",
  "/auth/callback",
];

const isExcludedPath = (path: string | null | undefined) =>
  EXCLUDED_PATH_PREFIXES.some((prefix) => path?.startsWith(prefix));

// localStorage/sessionStorage อาจใช้ไม่ได้ในโหมดส่วนตัวหรือเมื่อถูกบล็อก จึงห่อ try/catch ไว้
const readStorage = (storage: "local" | "session", key: string) => {
  try {
    return (storage === "local" ? window.localStorage : window.sessionStorage).getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (storage: "local" | "session", key: string, value: string) => {
  try {
    (storage === "local" ? window.localStorage : window.sessionStorage).setItem(key, value);
  } catch {
    // บันทึกไม่ได้ก็ไม่เป็นไร อย่างน้อยจะไม่แสดงซ้ำในหน้าที่เปิดอยู่
  }
};

const isPermanentlyDismissed = () => readStorage("local", DISMISSED_KEY) !== null;

export default function PWAInstallPrompt() {
  const pathname = usePathname();
  const [showPrompt, setShowPrompt] = useState(false);
  const [platform, setPlatform] = useState<InstallPlatform>("desktop");
  const [isStandalone, setIsStandalone] = useState(false);

  // ปุ่ม "ติดตั้งตอนนี้" กดได้เมื่อเบราว์เซอร์ส่ง beforeinstallprompt มาแล้ว (Chrome/Edge)
  const canInstallNow = useSyncExternalStore(subscribeInstallState, canPromptInstall, () => false);

  useEffect(() => {
    setPlatform(detectPlatform());
    const standalone = isRunningStandalone();
    setIsStandalone(standalone);

    // ติดตั้งแล้ว / เคยกดไว้ทีหลัง / เด้งไปแล้วในรอบนี้ → ไม่ต้องตั้งเวลาเด้งเอง
    if (standalone || isPermanentlyDismissed() || readStorage("session", SHOWN_THIS_SESSION_KEY)) {
      return;
    }

    const reveal = () => {
      // เช็กซ้ำตอนจะแสดงจริง เผื่อผู้ใช้กดไว้ทีหลังจากอีกแท็บระหว่างรอ
      if (isPermanentlyDismissed()) return;
      // อยู่ในหน้าทำข้อสอบ → ข้ามไปก่อน และไม่นับว่าแสดงแล้ว จะได้ขึ้นในรอบถัดไป
      if (isExcludedPath(window.location.pathname)) return;
      writeStorage("session", SHOWN_THIS_SESSION_KEY, "true");
      setShowPrompt(true);
    };

    // รอให้ผู้ใช้เริ่มใช้งานหน้าก่อน (แตะ เลื่อน หรือกดคีย์) แล้วค่อยเด้งป๊อปอัป
    //
    // เดิมตั้งเวลาเด้งหลังโหลด 3 วินาที ทำให้กล่องป๊อปอัปกลายเป็นชิ้นส่วนที่ใหญ่ที่สุด
    // ที่เพิ่งวาดเสร็จ คะแนน Largest Contentful Paint จึงถูกนับที่ 3 วินาทีกว่าทั้งที่
    // เนื้อหาจริงขึ้นตั้งแต่ 2 วินาที และการเด้งใส่ทันทีที่เปิดหน้าก็รบกวนผู้ใช้ด้วย
    let timer: ReturnType<typeof setTimeout> | undefined;
    const events: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "scroll", "touchstart"];

    const onFirstInteraction = () => {
      events.forEach((name) => window.removeEventListener(name, onFirstInteraction));
      timer = setTimeout(reveal, SHOW_DELAY_MS);
    };
    events.forEach((name) =>
      window.addEventListener(name, onFirstInteraction, { once: true, passive: true }),
    );

    return () => {
      events.forEach((name) => window.removeEventListener(name, onFirstInteraction));
      if (timer) clearTimeout(timer);
    };
  }, []);

  // เปิดจากเมนู "วิธีติดตั้งแอป" — แสดงเสมอ แม้เคยกดไว้ทีหลังแล้วก็ตาม
  useEffect(() => {
    const openGuide = () => setShowPrompt(true);
    window.addEventListener(OPEN_INSTALL_GUIDE_EVENT, openGuide);
    return () => window.removeEventListener(OPEN_INSTALL_GUIDE_EVENT, openGuide);
  }, []);

  // ติดตั้งสำเร็จ (ทั้งจากปุ่มเราและจากเมนูเบราว์เซอร์) → ไม่ต้องชวนอีก
  useEffect(() => {
    const onInstalled = () => {
      writeStorage("local", DISMISSED_KEY, "installed");
      setShowPrompt(false);
    };
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  // กดไว้ทีหลังในแท็บหนึ่ง → แท็บอื่นที่เปิดค้างไว้ก็ปิดตามทันที
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === DISMISSED_KEY && e.newValue !== null) setShowPrompt(false);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === "accepted") {
      writeStorage("local", DISMISSED_KEY, "installed");
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    writeStorage("local", DISMISSED_KEY, "true");
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone || isExcludedPath(pathname)) return null;

  const stepsByPlatform: Record<InstallPlatform, Step[]> = {
    ios: [
      { icon: Share, text: "แตะไอคอนแชร์ที่แถบด้านล่างของ Safari" },
      { icon: SquarePlus, text: 'เลื่อนลงแล้วเลือก "เพิ่มไปที่หน้าจอโฮม"' },
      { icon: CircleCheck, text: 'แตะ "เพิ่ม" ที่มุมขวาบนเพื่อยืนยัน' },
    ],
    android: canInstallNow
      ? [
          { icon: Download, text: 'แตะปุ่ม "ติดตั้งตอนนี้" ด้านบน' },
          { icon: MoreVertical, text: 'หรือเปิดเมนูของเบราว์เซอร์แล้วเลือก "เพิ่มไปที่หน้าจอหลัก"' },
        ]
      : [
          { icon: MoreVertical, text: "เปิดเมนู ⋮ ของเบราว์เซอร์ (มุมขวาบน)" },
          { icon: SquarePlus, text: 'เลือก "เพิ่มไปที่หน้าจอหลัก" หรือ "ติดตั้งแอป"' },
          { icon: CircleCheck, text: 'แตะ "ติดตั้ง" เพื่อยืนยัน' },
        ],
    desktop: canInstallNow
      ? [
          { icon: Download, text: 'คลิกปุ่ม "ติดตั้งตอนนี้" ด้านบน' },
          { icon: Monitor, text: "หรือคลิกไอคอนติดตั้งที่แถบที่อยู่ (address bar)" },
        ]
      : [
          { icon: Monitor, text: "มองหาไอคอนติดตั้งที่ท้ายแถบที่อยู่ (address bar)" },
          { icon: MoreVertical, text: 'หรือเปิดเมนูเบราว์เซอร์แล้วเลือก "ติดตั้งแอปนี้"' },
          { icon: CircleCheck, text: "ถ้าไม่พบเมนูนี้ ให้เปิดเว็บด้วย Chrome หรือ Edge" },
        ],
  };

  const steps = stepsByPlatform[platform];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/55 dark:bg-black/60">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-fade-in">
        {/* Accent bar */}
        <div className="h-1.5 bg-green-600" />

        <div className="p-6">
          {/* Close */}
          <button
            onClick={handleDismiss}
            aria-label="ปิด"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4 overflow-hidden border border-gray-100 shadow-sm bg-white p-1">
              <img src="/icons/icon.svg" alt="App Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-lg font-medium text-slate-900 mb-1.5">
              ติดตั้งเภสัชพร้อมสอบ
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              เพิ่มไปที่หน้าจอหลักเพื่อเข้าใช้งานได้เร็วขึ้น เหมือนเปิดแอปทั่วไป
            </p>

            {/* ปุ่มติดตั้งในคลิกเดียว — มีเฉพาะเบราว์เซอร์ที่รองรับ (Chrome/Edge บน Android และคอมพิวเตอร์)
                เบราว์เซอร์อื่นแสดงเฉพาะขั้นตอนติดตั้งด้วยตัวเองด้านล่าง แทนปุ่มสีเทาที่กดไม่ได้ */}
            {canInstallNow && (
              <button
                type="button"
                onClick={handleInstall}
                aria-label="ติดตั้งแอปพลิเคชันลงบนเครื่อง"
                className="mt-4 px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 bg-green-700 text-white hover:bg-green-800 transition-colors cursor-pointer"
              >
                <Download className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
                ติดตั้งตอนนี้
              </button>
            )}
          </div>

          {/* Steps */}
          <ol className="space-y-3 mb-5">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isLast = i === steps.length - 1;
              return (
                <li key={i} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <span className="w-8 h-8 rounded-full bg-slate-900 text-white dark:text-[#0f172a] text-xs font-medium flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {!isLast && <span className="w-px flex-1 bg-slate-200 my-1" />}
                  </div>
                  <div className="flex items-center gap-2.5 pt-1 pb-2">
                    <Icon className="w-4 h-4 text-green-700 shrink-0" strokeWidth={2} aria-hidden="true" />
                    <span className="text-sm font-medium text-slate-800 leading-snug">{step.text}</span>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Dismiss */}
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="ปิดกล่องแนะนำการติดตั้งแอป"
            className="w-full text-slate-600 font-medium text-sm hover:text-slate-900 transition-colors cursor-pointer py-1"
          >
            ไว้ทีหลัง
          </button>
        </div>
      </div>
    </div>
  );
}
