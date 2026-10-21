import { test as setup, expect, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const adminFile = path.join(__dirname, '.auth', 'admin.json');
const studentFile = path.join(__dirname, '.auth', 'student.json');

/** เข้าสู่ระบบผ่านหน้า /login แล้วเก็บสถานะ (localStorage + cookie) ไว้ใช้ในเทสต์อื่น */
async function loginAndSave(page: Page, email: string, password: string, landing: RegExp, file: string) {
  // ปิดกล่องแนะนำติดตั้งแอปตั้งแต่ก่อนโหลดหน้า ไม่ให้บังปุ่มระหว่างทดสอบ
  await page.addInitScript(() => localStorage.setItem('pwa-dismissed', 'true'));
  await page.goto('/login');
  await page.getByPlaceholder('example@email.com').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();

  await expect(page.locator('.swal2-title')).toHaveText('เข้าสู่ระบบสำเร็จ!', { timeout: 15_000 });
  await page.locator('.swal2-confirm').click();

  // dev server คอมไพล์หน้าปลายทางครั้งแรกอาจใช้เวลานาน จึงรอได้ถึง 60 วินาที
  await page.waitForURL(landing, { timeout: 60_000 });
  await expect.poll(() => page.evaluate(() => localStorage.getItem('access_token'))).toBeTruthy();

  fs.mkdirSync(path.dirname(file), { recursive: true });
  await page.context().storageState({ path: file });
}

// รอให้ backend ตอบก่อนเริ่ม (ตอนพัฒนา backend รีสตาร์ตเองเมื่อแก้โค้ด ถ้าเริ่มทดสอบระหว่างนั้นจะล้มทั้งชุด)
setup.beforeAll(async ({ request }) => {
  const api = (process.env.E2E_API_URL || 'http://localhost:5050').replace(/\/+$/, '');
  await expect
    .poll(async () => (await request.get(`${api}/schedules`).catch(() => null))?.status() ?? 0, {
      message: `backend ที่ ${api} ไม่ตอบสนอง — เปิด backend และฐานข้อมูลก่อนรันเทสต์`,
      timeout: 90_000,
      intervals: [2_000],
    })
    .toBe(200);
});

setup('เข้าสู่ระบบผู้ดูแลระบบ', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('ยังไม่ได้ตั้งค่า E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD ใน e2e/.env.e2e (ดูตัวอย่างใน e2e/env.example)');
  }
  await loginAndSave(page, email, password, /\/admin(\/|$)/, adminFile);
});

setup('เข้าสู่ระบบผู้เรียน', async ({ page }) => {
  const email = process.env.E2E_STUDENT_EMAIL;
  const password = process.env.E2E_STUDENT_PASSWORD;
  // เทสต์ฝั่งผู้เรียนจะถูกข้ามเองถ้าไม่ได้ตั้งค่าบัญชี (ดู hasStudent ใน helpers.ts)
  setup.skip(!email || !password, 'ไม่ได้ตั้งค่าบัญชีผู้เรียน (E2E_STUDENT_EMAIL / E2E_STUDENT_PASSWORD)');
  await loginAndSave(page, email!, password!, /\/user(\/|$)/, studentFile);
});
