import { test, expect } from '@playwright/test';
import { swal, loginViaUI } from './helpers';

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
