import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
    // สร้าง Nonce แบบสุ่มในระดับ Base64 ต่อทุกๆ Request (Cryptographically Secure)
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');

    // Strict Content-Security-Policy (ผ่านเกณฑ์ Mozilla Observatory & OWASP ระดับสูงสุด)
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'nonce-${nonce}' 'strict-dynamic';
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

    // ส่งค่า Header เข้าสู่ Internal Request สำหรับ Next.js App Router Server Components
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-nonce', nonce);
    requestHeaders.set('Content-Security-Policy', cspHeader);

    const response = NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });

    // ส่ง Security Headers กลับไปยัง Browser Client
    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('x-nonce', nonce);

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt, manifest.json, sw.js
         */
        {
            source: '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|manifest.json|sw.js).*)',
            missing: [
                { type: 'header', key: 'next-router-prefetch' },
                { type: 'header', key: 'purpose', value: 'prefetch' },
            ],
        },
    ],
};
