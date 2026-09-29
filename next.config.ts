const path = require('path');
const { remoteImagePatterns } = require('./config/image-hosts');

/** @type {import('next').NextConfig} */
const nextConfig = {
    // แยกโฟลเดอร์ build ของ production ออกจาก .next ที่ dev server ใช้อยู่
    // ถ้าใช้โฟลเดอร์เดียวกัน การรัน `next build` ขณะที่ `next dev` เปิดค้างไว้
    // จะไปทับ manifest ของ dev server ทำให้ asset ตอบ 404 เป็น text/plain ทั้งหน้า
    // (npm ตั้ง npm_lifecycle_event ให้เป็นชื่อ script ที่กำลังรัน)
    distDir: ['build', 'start'].includes(process.env.npm_lifecycle_event ?? '')
        ? '.next-build'
        : '.next',

    // ปิด X-Powered-By เพื่อไม่ให้เปิดเผยเทคโนโลยีฝั่งเซิร์ฟเวอร์
    poweredByHeader: false,
    compress: true,
    outputFileTracingRoot: path.join(__dirname),

    // 1. ส่วนของ Rewrites เดิม
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
            },
        ];
    },

    // 2. จัดการเรื่อง Remote Image Domains เฉพาะ Domain ที่ใช้งานจริง
    images: {
        // รายชื่อโฮสต์อยู่ที่ config/image-hosts.js ที่เดียว ใช้ร่วมกับ CSP img-src ใน middleware
        remotePatterns: remoteImagePatterns(),
    },

    // 3. ปิดการเช็ก TypeScript และ ESLint ตอน Build
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },

    // 4. ตั้งค่า Security Headers ตามมาตรฐานความปลอดภัย (CSP จัดการแบบ Dynamic Nonce ใน middleware.ts)
    async headers() {
        return [
            {
                source: '/sw.js',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'no-cache, no-store, must-revalidate',
                    },
                    {
                        key: 'Service-Worker-Allowed',
                        value: '/',
                    },
                ],
            },
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'strict-origin-when-cross-origin',
                    },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=31536000; includeSubDomains',
                    },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=()',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;


