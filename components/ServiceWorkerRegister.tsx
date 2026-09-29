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
                var refreshing = false;
                navigator.serviceWorker.addEventListener('controllerchange', function() {
                  if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                  }
                });
              });
            }
          `}
        </Script>
  );
}
