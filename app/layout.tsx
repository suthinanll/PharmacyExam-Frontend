// app/layout.tsx

import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css'
import localFont from 'next/font/local';


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
};



export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" className={`${myFont.variable}`}>
      <body>
        <header>
         
        </header>

        <main>
          {children}
        </main>

        <footer>
        </footer>
      </body>
    </html>
  );
}