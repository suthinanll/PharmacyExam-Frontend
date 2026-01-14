/** @type {import('next').NextConfig} */
const nextConfig = {
    // 1. ส่วนของ Rewrites เดิมของเฮีย
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: 'http://localhost:5000/api/:path*', 
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
};

module.exports = nextConfig;