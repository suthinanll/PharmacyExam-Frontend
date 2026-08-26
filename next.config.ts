/** @type {import('next').NextConfig} */
const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https: http:;
    font-src 'self' data:;
    connect-src 'self' http://localhost:5000 https: ws: wss:;
    worker-src 'self' blob:;
    frame-ancestors 'self';
    form-action 'self';
    base-uri 'self';
    object-src 'none';
`.replace(/\s{2,}/g, ' ').trim();

const nextConfig = {
    // ปิด X-Powered-By เพื่อไม่ให้เปิดเผยเทคโนโลยีฝั่งเซิร์ฟเวอร์
    poweredByHeader: false,

    // 1. ส่วนของ Rewrites เดิม
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
            },
        ];
    },

    // 2. จัดการเรื่อง Remote Image Domains
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

    // 4. ตั้งค่า Security Headers และ CSP ตามมาตรฐานความปลอดภัย (CSP-Check-SKILL)
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
                        value: cspHeader,
                    },
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

