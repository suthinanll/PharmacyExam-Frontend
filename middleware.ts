import { NextRequest, NextResponse } from 'next/server';
import { cspImageSources } from './config/image-hosts';

export function middleware(request: NextRequest) {
    // สร้าง Nonce แบบสุ่มในระดับ Base64 ต่อทุกๆ Request (Cryptographically Secure)
    const nonce = Buffer.from(crypto.randomUUID()).toString('base64');
    const isDev = process.env.NODE_ENV === 'development';

    // ดึง Backend Origin และ WebSocket Origin จาก Environment Variables
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';
    let apiOrigin = '';
    let apiWsOrigin = '';

    if (apiUrl) {
        try {
            const parsed = new URL(apiUrl);
            apiOrigin = parsed.origin;
            apiWsOrigin = parsed.protocol === 'https:' ? `wss://${parsed.host}` : `ws://${parsed.host}`;
        } catch {
            apiOrigin = apiUrl;
        }
    }

    // กำหนด Sources สำหรับ img-src และ connect-src ตามสภาพแวดล้อม (ไม่มี Wildcard Scheme ใน Production)
    // ไม่ต้องระบุพอร์ต backend ตรงนี้ — apiOrigin/apiWsOrigin ข้างบนคำนวณจาก NEXT_PUBLIC_API_URL
    // ให้แล้ว การ hardcode ไว้จะค้างเป็นพอร์ตเก่าทันทีที่ backend ย้ายพอร์ต
    // เหลือแค่ origin ของ dev server ตัวเอง (พอร์ต 3000) ที่ใช้กับ HMR websocket
    const devImgSources = isDev ? 'http://localhost:3000' : '';
    const devConnectSources = isDev ? 'http://localhost:3000 ws://localhost:3000' : '';

    // รายชื่อโฮสต์รูปใช้ร่วมกับ images.remotePatterns ใน next.config.ts (config/image-hosts.js)
    // เดิมสองที่นี้เขียนแยกกัน ทำให้รูปข่าวจาก hfocus / สภาเภสัชฯ / Facebook ถูก CSP บล็อก
    const allowedImgHosts = [
        apiOrigin,
        ...cspImageSources(),
        devImgSources,
    ].filter(Boolean).join(' ');

    const allowedConnectHosts = [
        apiOrigin,
        apiWsOrigin,
        'https://accounts.google.com',
        'https://oauth2.googleapis.com',
        devConnectSources,
    ].filter(Boolean).join(' ');

    // Strict Content-Security-Policy (ผ่านเกณฑ์ Mozilla Observatory & OWASP สูงสุด)
    //
    // style-src ใช้ nonce ได้เพราะ SweetAlert2 ถูกเปลี่ยนไปใช้บิลด์ที่ไม่ inject CSS แล้ว
    // (ดู utils/swal.ts) ส่วนสไตล์ของ Next.js เองจะได้ nonce อัตโนมัติจาก header ที่ส่งเข้า
    // request ด้านล่าง — หมายเหตุ: ถ้าใส่ nonce เบราว์เซอร์จะไม่สนใจ 'unsafe-inline' อีกต่อไป
    // style-src-attr ยังต้องผ่อนไว้ เพราะ recharts เขียน style ลงบน attribute ของ element
    const cspHeader = `
        default-src 'self';
        script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${isDev ? "'unsafe-eval'" : ''};
        style-src 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
        style-src-elem 'self' ${isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`};
        style-src-attr 'unsafe-inline';
        img-src 'self' data: blob: ${allowedImgHosts};
        font-src 'self' data:;
        connect-src 'self' ${allowedConnectHosts};
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

    // ส่ง Security Headers กลับไปยัง Browser Client สำหรับทุก Route (รวม sitemap.xml, robots.txt)
    response.headers.set('Content-Security-Policy', cspHeader);
    response.headers.set('x-nonce', nonce);

    // กันเบราว์เซอร์เดาชนิดไฟล์เอง (MIME sniffing) — ปิดช่องทางอัปโหลดไฟล์ปลอมชนิด
    response.headers.set('X-Content-Type-Options', 'nosniff');
    // ไม่ส่ง path/query ของหน้าเราไปให้เว็บอื่นเวลาผู้ใช้กดลิงก์ออก
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    // ปิดสิทธิ์อุปกรณ์ที่เว็บนี้ไม่ได้ใช้
    response.headers.set(
        'Permissions-Policy',
        'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
    );
    // สำรองของ frame-ancestors สำหรับเบราว์เซอร์เก่าที่ยังไม่รองรับ CSP เต็มรูปแบบ
    response.headers.set('X-Frame-Options', 'SAMEORIGIN');

    // หน้าที่ต้องล็อกอินมีข้อมูลส่วนตัว ห้ามให้เบราว์เซอร์หรือ proxy เก็บ cache ไว้
    // กันไม่ให้กดปุ่มย้อนกลับหลัง logout แล้วยังเห็นข้อมูลของคนก่อนหน้า
    const isPrivatePath = ['/user', '/admin'].some((prefix) =>
        request.nextUrl.pathname.startsWith(prefix),
    );
    if (isPrivatePath) {
        response.headers.set('Cache-Control', 'no-store, must-revalidate');
        response.headers.set('Pragma', 'no-cache');
    }

    // HSTS — บังคับ HTTPS 1 ปี ใส่เฉพาะ production เพราะ dev รันบน http
    if (!isDev) {
        response.headers.set(
            'Strict-Transport-Security',
            'max-age=31536000; includeSubDomains; preload',
        );
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths to ensure complete CSP coverage including:
         * - pages and static files generated by Next.js (e.g. sitemap.xml, robots.txt, favicon.ico, manifest.json)
         * - excludes internal Next.js static asset bundles (_next/static, _next/image)
         */
        {
            source: '/((?!_next/static|_next/image).*)',
            missing: [
                { type: 'header', key: 'next-router-prefetch' },
                { type: 'header', key: 'purpose', value: 'prefetch' },
            ],
        },
    ],
};
