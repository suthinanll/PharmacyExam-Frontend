import { defineConfig, devices } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Automated Test (E2E) ของระบบ PharmacyExam ด้วย Playwright
 
 */

// โหลดค่าจาก e2e/.env.e2e (ถ้ามี) โดยไม่ต้องลง dotenv เพิ่ม
const envFile = path.join(__dirname, 'e2e', '.env.e2e');
if (fs.existsSync(envFile)) process.loadEnvFile(envFile);

const baseURL = process.env.E2E_BASE_URL || 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  // เทสต์หลายตัวแก้ข้อมูลชุดเดียวกัน (เช่น ค้นหาด้วยรหัสรอบทดสอบ) จึงรันทีละไฟล์ทีละเทสต์
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'playwright-report/results.json' }],
  ],
  use: {
    baseURL,
    // ใช้ Google Chrome ที่ติดตั้งในเครื่อง ไม่ต้องดาวน์โหลด browser ของ Playwright
    // (ตั้งไว้ตรงนี้ให้ทั้ง setup และเทสต์หลักใช้ร่วมกัน)
    channel: 'chrome',
    // E2E_SLOWMO=500 ทำให้แต่ละขั้นช้าลง 0.5 วินาที ใช้คู่กับ --headed ตอนอยากดูการทำงาน
    launchOptions: { slowMo: Number(process.env.E2E_SLOWMO) || 0 },
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
    // ภาพหน้าจอทุกเคส เอาไปใส่ช่อง Actual Results ในเล่มได้
    screenshot: 'on',
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chrome',
      testMatch: /.*\.spec\.ts/,
      dependencies: ['setup'],
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 1440, height: 900 },
        storageState: 'e2e/.auth/admin.json',
      },
    },
  ],
});
