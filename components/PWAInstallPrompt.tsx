"use client";
import { useState, useEffect } from "react";
import {
  X,
  Download,
  Pill,
  Share,
  SquarePlus,
  CircleCheck,
  Monitor,
  MoreVertical,
} from "lucide-react";

type Platform = "ios" | "android" | "desktop";

interface Step {
  icon: React.ElementType;
  text: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function PWAInstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS =
      /iphone|ipad|ipod/.test(ua) ||
      (ua.includes("mac") && navigator.maxTouchPoints > 1);
    const isAndroid = /android/.test(ua);

    setPlatform(isIOS ? "ios" : isAndroid ? "android" : "desktop");

    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);

    if (standalone || localStorage.getItem("pwa-dismissed")) {
      return;
    }

    if (isIOS) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Desktop — listen for the native install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Fallback: show manual steps if the native event never fires
    const fallbackTimer = setTimeout(() => {
      console.log("Showing PWA prompt (fallback or desktop mode)");
      setShowPrompt(true);
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(fallbackTimer);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      // ถ้าไม่มี deferredPrompt (iOS หรือ localhost) แสดงข้อความ
      return;
    }

    // แสดง prompt ติดตั้ง
    await deferredPrompt.prompt();

    // รอผลลัพธ์
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
      setShowPrompt(false);
    }

    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    localStorage.setItem("pwa-dismissed", "true");
    setShowPrompt(false);
  };

  if (!showPrompt || isStandalone) return null;

  const stepsByPlatform: Record<Platform, Step[]> = {
    ios: [
      { icon: Share, text: "แตะไอคอนแชร์ที่แถบด้านล่างของ Safari" },
      { icon: SquarePlus, text: 'เลื่อนลงแล้วเลือก "เพิ่มไปที่หน้าจอโฮม"' },
      { icon: CircleCheck, text: 'แตะ "เพิ่ม" ที่มุมขวาบนเพื่อยืนยัน' },
    ],
    android: [
      { icon: Download, text: 'แตะปุ่ม "ติดตั้งตอนนี้" ด้านล่าง' },
      { icon: MoreVertical, text: 'หรือเปิดเมนูของเบราว์เซอร์แล้วเลือก "เพิ่มไปที่หน้าจอหลัก"' },
    ],
    desktop: [
      { icon: Monitor, text: "มองหาไอคอนติดตั้งที่แถบที่อยู่ (address bar)" },
      { icon: MoreVertical, text: 'หรือเปิดเมนูเบราว์เซอร์แล้วเลือก "ติดตั้งแอปนี้"' },
    ],
  };

  const steps = stepsByPlatform[platform];
  const canInstallNow = deferredPrompt !== null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/55">
      <div className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden animate-fade-in">
        {/* Accent bar */}
        <div className="h-1.5 bg-emerald-600" />

        <div className="p-6">
          {/* Close */}
          <button
            onClick={handleDismiss}
            aria-label="ปิด"
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2.5} />
          </button>

          {/* Header */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
              <Pill className="w-7 h-7 text-emerald-600" strokeWidth={1.75} />
            </div>
            <h2 className="text-lg font-bold text-slate-900 mb-1.5">
              ติดตั้งเภสัชพร้อมสอบ
            </h2>
            <p className="text-sm text-slate-500 leading-relaxed">
              เพิ่มไปที่หน้าจอหลักเพื่อเข้าใช้งานได้เร็วขึ้น เหมือนเปิดแอปทั่วไป
            </p>

            {/* Install Button - แสดงเสมอ (ยกเว้น iOS) */}
            {platform !== "ios" && (
              <button
                onClick={handleInstall}
                disabled={!canInstallNow}
                className={`mt-4 px-6 py-2.5 rounded-xl font-medium flex items-center gap-2 transition-colors ${
                  canInstallNow
                    ? "bg-emerald-600 text-white hover:bg-emerald-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                <Download className="w-4 h-4" strokeWidth={2.5} />
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
                    <span className="w-8 h-8 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    {!isLast && <span className="w-px flex-1 bg-slate-200 my-1" />}
                  </div>
                  <div className="flex items-center gap-2.5 pt-1 pb-2">
                    <Icon className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2} />
                    <span className="text-sm text-slate-700 leading-snug">{step.text}</span>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Dismiss */}
          <button
            onClick={handleDismiss}
            className="w-full text-slate-400 text-sm hover:text-slate-600 transition-colors"
          >
            ไว้ทีหลัง
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(16px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.25s ease-out;
        }
      `}</style>
    </div>
  );
}
