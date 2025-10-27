/** @type {import('next').NextConfig} */
const nextConfig = {
    // ต้องมี object rewrites นี้
    async rewrites() {
        return [
            {
                // Source path ที่มาจาก Frontend
                source: '/api/:path*',
                // Destination URL เต็มของ Backend Server
                destination: 'http://localhost:5000/api/:path*', 
            },
        ];
    },
};

module.exports = nextConfig;
