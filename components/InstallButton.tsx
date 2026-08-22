"use client";
import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // เช็คว่าติดตั้งแล้วหรือยัง
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    setIsStandalone(standalone);

    if (standalone) return;

    // ฟัง event beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    // แสดง prompt ติดตั้ง
    deferredPrompt.prompt();

    // รอผลลัพธ์
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
    } else {
      console.log("User dismissed the install prompt");
    }

    // ล้าง prompt
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  // ไม่แสดงถ้า: ติดตั้งแล้ว หรือ ไม่สามารถติดตั้งได้
  if (isStandalone || !isInstallable) return null;

  return (
    <button
      onClick={handleInstall}
      className="fixed bottom-6 right-6 z-40 bg-green-600 text-white px-5 py-3 rounded-full flex items-center gap-2 hover:bg-green-700 transition-all shadow-lg hover:shadow-xl animate-bounce-subtle"
      aria-label="ติดตั้งแอป"
    >
      <Download className="w-5 h-5" strokeWidth={2.5} />
      <span className="font-medium hidden sm:inline">ติดตั้งแอป</span>
    </button>
  );
}
