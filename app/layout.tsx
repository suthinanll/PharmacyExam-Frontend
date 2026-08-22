// app/layout.tsx

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
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



export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" className={`${myFont.variable}`}>
      <head>
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

        {/* Service Worker Registration */}
        <Script id="register-sw" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(
                  function(registration) {
                    console.log('Service Worker registered:', registration.scope);
                  },
                  function(err) {
                    console.log('Service Worker registration failed:', err);
                  }
                );
              });
            }
          `}
        </Script>
      </body>
    </html>
  );
}