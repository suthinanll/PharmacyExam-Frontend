import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const memory = process.memoryUsage();
  const startTime = Date.now();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  let backendStatus = 'unknown';
  let backendLatencyMs = 0;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    clearTimeout(timeoutId);
    backendLatencyMs = Date.now() - startTime;
    backendStatus = res.ok ? 'connected' : 'error';
  } catch (err: any) {
    backendStatus = 'unreachable';
    backendLatencyMs = Date.now() - startTime;
  }

  return NextResponse.json(
    {
      status: 'ok',
      service: 'pharmacy-exam-frontend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      backend: {
        apiUrl,
        status: backendStatus,
        latencyMs: backendLatencyMs,
      },
      memory: {
        heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        rssMb: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      },
      environment: process.env.NODE_ENV || 'development',
    },
    { status: 200 },
  );
}
