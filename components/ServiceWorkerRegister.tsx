import Script from 'next/script';
import { headers } from 'next/headers';

/**
 * ลงทะเบียน Service Worker พร้อมอัปเดตอัตโนมัติ
 *
 * แยกออกมาจาก root layout เพราะการเรียก headers() เพื่อเอา nonce ทำให้ layout กลายเป็น dynamic
 * แล้ว Next จะสตรีม meta ที่สร้างจาก metadata (title, description, icons) ไปไว้ท้าย body แทน head
 * ทำให้ Lighthouse มองว่าหน้าไม่มี meta description
 */
export default async function ServiceWorkerRegister() {
  const nonce = (await headers()).get('x-nonce') ?? undefined;

  return (
        <Script id="register-sw" strategy="afterInteractive" nonce={nonce}>
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    // Check for updates on every page load
                    registration.update();
  
                    // Detect new service worker installation
                    registration.onupdatefound = function() {
                      var installingWorker = registration.installing;
                      if (!installingWorker) return;
                      installingWorker.onstatechange = function() {
                        if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                          // New version available -> tell it to skip waiting immediately
                          installingWorker.postMessage({ type: 'SKIP_WAITING' });
                        }
                      };
                    };
                  },
                  function(err) {
                    console.log('Service Worker registration failed:', err);
                  }
                );
  
                // Auto reload when the new Service Worker takes over
                //
                // reload เฉพาะตอนมี SW ตัวเก่าคุมหน้าอยู่แล้วและถูกตัวใหม่แทนที่ (อัปเดตเวอร์ชัน)
                // ตอนเข้าเว็บครั้งแรกยังไม่มี SW คุมหน้า แต่ sw.js เรียก clients.claim() ทันที
                // ที่ activate ทำให้ controllerchange เกิดขึ้นด้วย ถ้าไม่เช็คตรงนี้หน้าจะโหลดซ้ำ
                // ทั้งหน้าโดยไม่จำเป็น (Lighthouse วัดได้ว่าเอกสารถูกขอสองรอบ API ถูกเรียกซ้ำ
                // และ TBT ของหน้า summarize-exam ขึ้นไปถึง 1,020ms)
                var hadController = !!navigator.serviceWorker.controller;
                var refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', function() {
                  if (!hadController || refreshing) return;
                  refreshing = true;
                  window.location.reload();
                });
              });
            }
          `}
        </Script>
  );
}
