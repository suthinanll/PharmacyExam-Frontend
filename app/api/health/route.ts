import { NextResponse } from 'next/server';

export async function GET() {
  const memory = process.memoryUsage();

  return NextResponse.json(
    {
      status: 'ok',
      service: 'pharmacy-exam-frontend',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime()),
      memory: {
        heapUsedMb: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMb: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
      },
      environment: process.env.NODE_ENV || 'development',
    },
    { status: 200 },
  );
}
