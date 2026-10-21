import { test, expect } from '@playwright/test';
import { swal, loginViaUI, STUDENT_AUTH_FILE } from './helpers';

/**
 * เคสเพิ่มเติม: สิทธิ์การเข้าถึงหน้าผู้ดูแลระบบ — Black Box Testing
 * ผู้เรียนเข้าสู่ระบบผ่านหน้าเว็บ แล้วพยายามเปิดหน้าจัดการปฏิทินและข่าวสารของผู้ดูแลระบบ
 * ต้องตั้งค่าบัญชีผู้เรียนใน e2e/.env.e2e ไม่เช่นนั้นเคสกลุ่มนี้จะถูกข้าม
 */

const step = test.step;
const email = process.env.E2E_STUDENT_EMAIL;
const password = process.env.E2E_STUDENT_PASSWORD;

test.describe('สิทธิ์การเข้าถึงหน้าผู้ดูแลระบบ', () => {
  test.skip(!email || !password, 'ไม่ได้ตั้งค่าบัญชีผู้เรียน (E2E_STUDENT_EMAIL / E2E_STUDENT_PASSWORD)');
  // เริ่มจากเบราว์เซอร์ที่ยังไม่ได้เข้าสู่ระบบ
  test.use({ storageState: { cookies: [], origins: [] } });

  const pages = [
    ['SEC-T01', 'หน้าสร้างข่าวสาร', '/admin/mnblog/addblog', 'จัดการคิวข่าวสาร'],
    ['SEC-T02', 'หน้าเพิ่มกำหนดการ', '/admin/manage_calendar/calendar_add', 'เพิ่มกำหนดการใหม่'],
  ] as const;

  for (const [id, name, url, adminHeading] of pages) {
    test(`${id} ผู้เรียนเปิด${name}ของผู้ดูแลระบบ ระบบต้องไม่ให้เข้าใช้งาน`, async ({ page }) => {
      await step('1. เข้าสู่ระบบด้วยบัญชีผู้เรียน', () => loginViaUI(page, email!, password!));
      await step(`2. พิมพ์ URL ${url} เพื่อเปิด${name}`, async () => {
        await page.waitForURL(/\/user/);
        await page.goto(url);
      });
      await step('Expected: แจ้งเตือน "ยังไม่มีสิทธิ์ผู้ดูแลระบบ" และไม่แสดงหน้าของผู้ดูแลระบบ', async () => {
        await expect(swal(page).title).toHaveText('ยังไม่มีสิทธิ์ผู้ดูแลระบบ');
        await expect(page.getByRole('heading', { name: adminHeading })).toHaveCount(0);
      });
    });
  }
});

/**
 * เคสเพิ่มเติม: สิทธิ์การเข้าถึงทุกกลุ่มหน้า — ใช้สถานะการเข้าสู่ระบบที่เตรียมไว้ใน auth.setup.ts
 */
test.describe('สิทธิ์การเข้าถึง: ผู้เรียนเปิดหน้าผู้ดูแลระบบ', () => {
  test.skip(!email || !password, 'ไม่ได้ตั้งค่าบัญชีผู้เรียน (E2E_STUDENT_EMAIL / E2E_STUDENT_PASSWORD)');
  test.use({ storageState: STUDENT_AUTH_FILE });

  const adminPages = [
    ['SEC-T03', 'หน้าแดชบอร์ดผู้ดูแลระบบ', '/admin'],
    ['SEC-T04', 'หน้ารายชื่อผู้ใช้งาน', '/admin/manage_users'],
    ['SEC-T05', 'หน้าคลังข้อสอบ', '/admin/manage_examset'],
    ['SEC-T06', 'หน้ารายงานปัญหาข้อสอบ', '/admin/item_reports'],
    ['SEC-T07', 'หน้าจัดการพารามิเตอร์ IRT', '/admin/irt_management'],
    ['SEC-T08', 'หน้าตั้งค่าระบบชำระเงิน (Super Admin)', '/admin/super/payment-settings'],
  ] as const;

  for (const [id, name, url] of adminPages) {
    test(`${id} ผู้เรียนพิมพ์ URL ${name} ระบบไม่ให้เข้าและพาไปหน้าสมัครสิทธิ์ผู้ดูแลระบบ`, async ({ page }) => {
      await step(`1. (ผู้เรียน) พิมพ์ URL ${url}`, () => page.goto(url));
      await step('Expected: แจ้ง "ยังไม่มีสิทธิ์ผู้ดูแลระบบ" และพาไปหน้า /upgrade-admin', async () => {
        await expect(swal(page).title).toHaveText('ยังไม่มีสิทธิ์ผู้ดูแลระบบ', { timeout: 15_000 });
        await page.waitForURL(/\/upgrade-admin/, { timeout: 15_000 });
      });
    });
  }
});

test.describe('สิทธิ์การเข้าถึง: ผู้ที่ยังไม่เข้าสู่ระบบ', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  const privatePages = [
    ['SEC-T09', 'หน้าติดตามความคืบหน้า', '/user/followup'],
    ['SEC-T10', 'หน้าประวัติการทำข้อสอบ', '/user/examhis'],
    ['SEC-T11', 'หน้าทบทวนประจำวัน', '/user/daily-review'],
    ['SEC-T12', 'หน้าโปรไฟล์', '/user/profile'],
    ['SEC-T13', 'หน้าผู้ดูแลระบบ', '/admin'],
  ] as const;

  for (const [id, name, url] of privatePages) {
    test(`${id} ผู้ที่ยังไม่เข้าสู่ระบบพิมพ์ URL ${name} ระบบพาไปหน้าเข้าสู่ระบบ`, async ({ page }) => {
      await step(`1. พิมพ์ URL ${url} โดยยังไม่เข้าสู่ระบบ`, () => page.goto(url));
      await step('Expected: ระบบพาไปหน้า /login', () => page.waitForURL(/\/login/, { timeout: 15_000 }));
    });
  }

  const publicPages = [
    ['SEC-T14', 'หน้าคลังข้อสอบ', '/user/examset', 'คลังข้อสอบ'],
    ['SEC-T15', 'หน้าปฏิทินการสอบ', '/user/calendar', 'ปฏิทินกำหนดการสอบ'],
  ] as const;

  for (const [id, name, url, heading] of publicPages) {
    test(`${id} ผู้ที่ยังไม่เข้าสู่ระบบเปิด${name}ได้ (หน้าที่เปิดให้ดูโดยไม่ต้องเข้าสู่ระบบ)`, async ({ page }) => {
      await step(`1. พิมพ์ URL ${url} โดยยังไม่เข้าสู่ระบบ`, () => page.goto(url));
      await step(`Expected: แสดงหัวข้อ "${heading}" และไม่ถูกพาไปหน้า /login`, async () => {
        await expect(page.getByRole('heading', { name: heading, exact: true })).toBeVisible({ timeout: 15_000 });
        await expect(page).not.toHaveURL(/\/login/);
      });
    });
  }
});

test.describe('สิทธิ์การเข้าถึง: ผู้ดูแลระบบเปิดหน้าผู้เรียน', () => {
  test('SEC-T16 ผู้ดูแลระบบพิมพ์ URL หน้าติดตามความคืบหน้าของผู้เรียน ระบบแจ้งไม่มีสิทธิ์และพากลับหน้าผู้ดูแลระบบ', async ({ page }) => {
    await step('1. (ผู้ดูแลระบบ) พิมพ์ URL /user/followup', () => page.goto('/user/followup'));
    await step('Expected: แจ้ง "ไม่มีสิทธิ์เข้าถึง" และพาไปหน้า /admin', async () => {
      await expect(swal(page).title).toHaveText('ไม่มีสิทธิ์เข้าถึง', { timeout: 15_000 });
      await page.waitForURL(/\/admin(\/|$)/, { timeout: 15_000 });
    });
  });
});
