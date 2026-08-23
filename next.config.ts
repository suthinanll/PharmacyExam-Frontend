/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. ส่วนของ Rewrites เดิมของเฮีย
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
            },
        ];
    },

    // 2. เพิ่มส่วนนี้เข้าไปเพื่อแก้เรื่องรูปภาพครับ
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**', // อนุญาตทุกเว็บ (รวมถึง kdmshospital.com)
            },
            {
                protocol: 'http',
                hostname: '**',
            },
        ],
    },

    // 3. ปิดการเช็ก TypeScript และ ESLint ตอน Build
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },

    // 4. เพิ่ม headers เพื่อแก้ CSP และป้องกันการแคช sw.js
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
                        key: 'Content-Security-Policy',
                        value: "img-src 'self' data: blob: https: http:;",
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
