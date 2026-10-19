import { test as setup, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const authFile = path.join(__dirname, '.auth', 'admin.json');

setup('เข้าสู่ระบบผู้ดูแลระบบ', async ({ page }) => {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('ยังไม่ได้ตั้งค่า E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD ใน e2e/.env.e2e (ดูตัวอย่างใน e2e/env.example)');
  }

  await page.goto('/login');
  await page.getByPlaceholder('example@email.com').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();

  await expect(page.locator('.swal2-title')).toHaveText('เข้าสู่ระบบสำเร็จ!', { timeout: 15_000 });
  await page.locator('.swal2-confirm').click();

  await page.waitForURL(/\/admin(\/|$)/, { timeout: 20_000 });
  await expect.poll(() => page.evaluate(() => localStorage.getItem('access_token'))).toBeTruthy();

  await page.evaluate(() => localStorage.setItem('pwa-dismissed', 'true'));

  fs.mkdirSync(path.dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});
