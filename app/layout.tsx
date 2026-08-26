// app/layout.tsx

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { headers } from 'next/headers';
import './globals.css'
import localFont from 'next/font/local';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import Script from 'next/script';


const myFont = localFont({
  src: [
    {
      path: './fonts/Kanit-Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/Kanit-Medium.ttf',
      weight: '500',
      style: 'normal',
    },
    {
      path: './fonts/Kanit-Bold.ttf',
      weight: '700',
      style: 'normal',
    },
  ],
  display: 'swap',
  variable: '--font-primary',
});

export const metadata: Metadata = {
  title: 'เภสัชพร้อมสอบ',
  description: 'แพลตฟอร์มฝึกสอบออนไลน์สำหรับผู้ที่เตรียมสอบใบประกอบวิชาชีพเภสัชกรรม',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-2.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico' },
    ],
    apple: '/icons/icon-192x192.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'เภสัชพร้อมสอบ',
  },
};

export const viewport = {
  themeColor: '#76B25A',
};



export default async function RootLayout({ children }: { children: ReactNode }) {
  const headersList = await headers();
  const nonce = headersList.get('x-nonce') ?? undefined;

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  return (
    <html lang="th" className={`${myFont.variable}`}>
      <head>
        <link rel="preconnect" href={apiUrl} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={apiUrl} />
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml" />
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="theme-color" content="#76B25A" />
      </head>
      <body>
        <AuthProvider>
          <NotificationProvider>
            <header>

            </header>

            <main>
              {children}
            </main>

            <footer>
            </footer>

            {/* PWA Install Prompt */}
            <PWAInstallPrompt />
          </NotificationProvider>
        </AuthProvider>

        {/* Service Worker Registration with Auto-Update */}
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
      </body>
    </html>
  );
}