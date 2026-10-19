// app/layout.tsx

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css'
import { Kanit } from 'next/font/google';
import { AuthProvider } from '@/contexts/AuthContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import ScrollToTopButton from '@/components/ScrollToTopButton';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';


// ใช้ Kanit ผ่าน next/font/google — Next ดาวน์โหลดมาเก็บไว้ในโปรเจกต์ตอน build
// จึงยังเสิร์ฟจากโดเมนเราเอง (ไม่ขัด CSP) แต่ได้ไฟล์ woff2 ที่ย่อเฉพาะอักษรไทย+ละติน
// เล็กกว่าไฟล์ .ttf เดิมที่หนักไฟล์ละ 67KB ทำให้ตัวหนังสือขึ้นเร็วขึ้นและ LCP ดีขึ้น
const myFont = Kanit({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '700'],
  display: 'swap',
  variable: '--font-primary',
});

/** ใช้ซ้ำทั้งใน <head> ที่เขียนเองและใน metadata ของ Open Graph */
const SITE_DESCRIPTION =
  'แพลตฟอร์มฝึกสอบออนไลน์สำหรับผู้ที่เตรียมสอบใบประกอบวิชาชีพเภสัชกรรม';

export const metadata: Metadata = {
  title: 'เภสัชพร้อมสอบ',
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
  // เฉดเดียวกับแถบเมนูและ footer (ปรับให้เข้มขึ้นเพื่อให้ตัวหนังสือขาวผ่านเกณฑ์ contrast)
  themeColor: '#76B25A',
};



export default function RootLayout({ children }: { children: ReactNode }) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  return (
    // ห้ามเขียน <head> เองใน App Router — Next จะย้าย meta ที่สร้างจาก metadata
    // (รวมถึง description) ไปไว้ใน body ทำให้ Lighthouse มองว่าไม่มี meta description
    // ส่วน <link> ด้านล่าง React จะยกขึ้นไปไว้ใน head ให้เอง ไอคอนและ theme-color
    // ประกาศไว้ใน metadata/viewport ด้านบนแล้ว
    // className ตั้ง font-family เป็น Kanit ให้ทั้งหน้าโดยตรง (globals.css จึงไม่ต้องใช้ var())
    // variable ยังคงไว้ให้ --font-primary ใช้ได้ในที่ที่อ้างถึง เช่น not-found.tsx
    <html lang="th" className={`${myFont.variable} ${myFont.className}`}>
      <head>
        {/* Next สตรีม meta ที่สร้างจาก metadata ไปไว้ท้าย body เพราะทุกหน้าเป็น dynamic
            (middleware ออก nonce ใหม่ทุก request) เครื่องมือตรวจ SEO จึงมองไม่เห็น
            จึงประกาศ description ตรงนี้เองเพื่อให้อยู่ใน head แน่นอน */}
        <meta name="description" content={SITE_DESCRIPTION} />
        <link rel="preconnect" href={apiUrl} crossOrigin="anonymous" />
        <link rel="dns-prefetch" href={apiUrl} />
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

            {/* ปุ่มลอยเลื่อนกลับขึ้นด้านบน — แสดงเมื่อเลื่อนลงมาไกลพอ */}
            <ScrollToTopButton />
          </NotificationProvider>
        </AuthProvider>

        {/* ลงทะเบียน Service Worker — แยกเป็นคอมโพเนนต์เพราะต้องอ่าน nonce จาก header */}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}