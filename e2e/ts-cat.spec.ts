import { test, expect, type Page } from '@playwright/test';
import { swal, hasStudent, SKIP_NO_STUDENT, STUDENT_AUTH_FILE } from './helpers';

/**
 * Test Scenario: การสอบแบบปรับตัวด้วยคอมพิวเตอร์ (CAT) ของผู้เรียน — Black Box Testing
 *
 * ใช้บัญชีผู้เรียนจาก e2e/.env.e2e ตั้งค่าจำนวนข้อขั้นต่ำ 10 / สูงสุด 40 เพื่อให้สอบจบเร็ว
 * ผลสอบที่จบจะถูกบันทึกในประวัติของบัญชีผู้เรียน
 */

const SETUP_URL = '/user/cat-exam';
const step = test.step;

const startButton = (page: Page) => page.getByRole('button', { name: 'เริ่มการทดสอบ' });
/** ตัวเลือกคำตอบของข้อที่แสดงอยู่ */
const catOptions = (page: Page) => page.getByText('เลือกคำตอบ', { exact: true }).locator('xpath=following-sibling::div[1]/button');
const nextItem = (page: Page) => page.getByRole('button', { name: 'ข้อถัดไป' });
const itemBadge = (page: Page) => page.getByText(/^ข้อ \d+$/).first();

async function openSetup(page: Page) {
  await page.goto(SETUP_URL);
  await expect(page.getByRole('heading', { name: 'การสอบแบบปรับตัวด้วยคอมพิวเตอร์ (CAT)' })).toBeVisible();
  await expect(startButton(page)).toBeVisible({ timeout: 20_000 });
}

/** ตั้งจำนวนข้อขั้นต่ำ/สูงสุดใน "การตั้งค่าขั้นสูง" */
async function setItemLimits(page: Page, min: number, max: number) {
  await page.getByRole('button', { name: /การตั้งค่าขั้นสูง/ }).click();
  await page.getByText('จำนวนข้อขั้นต่ำ', { exact: true }).locator('xpath=../following-sibling::div[1]')
    .getByRole('button', { name: `${min} ข้อ`, exact: true }).click();
  await page.getByText('จำนวนข้อสูงสุด', { exact: true }).locator('xpath=../following-sibling::div[1]')
    .getByRole('button', { name: `${max} ข้อ`, exact: true }).click();
}

const NO_IRT_MESSAGE = 'ไม่มีข้อสอบในระบบที่มี IRT parameters ครบ';
const SKIP_NO_IRT =
  'เงื่อนไขก่อนทดสอบไม่ครบ: ยังไม่มีข้อสอบที่กำหนดค่า IRT (a, b, c) — ผู้ดูแลระบบต้องคำนวณค่าที่หน้า "จัดการพารามิเตอร์ IRT" ก่อน';

/** กดเริ่มการทดสอบ — ถ้ามีการสอบค้างอยู่ให้เริ่มใหม่ตั้งแต่ต้น ถ้าคลังยังไม่พร้อมสำหรับ CAT ให้ข้ามเคส */
async function startCat(page: Page) {
  await startButton(page).click();
  const resume = page.locator('.swal2-title', { hasText: 'พบการสอบ CAT ที่ยังไม่เสร็จ' });
  const noIrt = page.locator('.swal2-html-container', { hasText: NO_IRT_MESSAGE });
  const started = page.waitForURL(/\/user\/cat-exam\/exam/, { timeout: 30_000 });
  await Promise.race([started, resume.waitFor({ timeout: 30_000 }), noIrt.waitFor({ timeout: 30_000 })]).catch(() => {});
  test.skip(await noIrt.isVisible(), SKIP_NO_IRT);
  if (await resume.isVisible()) {
    await page.locator('.swal2-deny').click();
    await page.waitForURL(/\/user\/cat-exam\/exam/, { timeout: 30_000 });
  }
  await expect(catOptions(page).first()).toBeVisible({ timeout: 30_000 });
}

/** ออกจากการสอบ CAT ที่ยังไม่จบผ่านลิงก์หน้าหลัก (เก็บกวาดหลังเคส) */
async function leaveCat(page: Page) {
  if (!/\/cat-exam\/exam/.test(page.url())) return;
  await page.getByRole('link', { name: 'หน้าหลัก' }).first().click();
  if (await swal(page).title.isVisible({ timeout: 5_000 }).catch(() => false)) await swal(page).confirm.click();
  await page.waitForURL((u) => !u.pathname.includes('/cat-exam/exam'), { timeout: 20_000 }).catch(() => {});
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe('5.1 หน้าตั้งค่าและข้อมูลการสอบ CAT', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.use({ storageState: STUDENT_AUTH_FILE });

  test('CAT-T01 เปิดหน้าสอบ CAT แสดงระดับความสามารถเริ่มต้น หมวดหมู่ สรุปการตั้งค่า และปุ่มเริ่ม', async ({ page }) => {
    await step('1. เปิดหน้า /user/cat-exam', () => openSetup(page));
    await step('Expected: แสดงส่วน "ระดับความสามารถเริ่มต้น" "เน้นหมวดหมู่" "สรุปการตั้งค่า" และปุ่ม "เริ่มการทดสอบ"', async () => {
      await expect(page.getByRole('heading', { name: 'ระดับความสามารถเริ่มต้น' })).toBeVisible();
      await expect(page.getByRole('heading', { name: /เน้นหมวดหมู่/ })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'สรุปการตั้งค่า' })).toBeVisible();
      await expect(startButton(page)).toBeEnabled();
    });
  });

  test('CAT-T02 เลือกหมวดหมู่ที่ต้องการเน้น สรุปการตั้งค่าแสดงจำนวนวิชาที่เลือก', async ({ page }) => {
    await step('1. เปิดหน้าสอบ CAT', () => openSetup(page));
    const summary = page.getByText('หมวดที่เน้น', { exact: true }).locator('xpath=following-sibling::*[1]');
    await step('Expected (ก่อนเลือก): หมวดที่เน้นเป็น "ทั้งหมด"', () => expect(summary).toHaveText('ทั้งหมด'));
    await step('2. กดเลือกหมวดหมู่แรก', () =>
      page.getByRole('heading', { name: /เน้นหมวดหมู่/ }).locator('xpath=ancestor::div[1]/following-sibling::*').getByRole('button').first().click()
        .catch(async () => page.locator('button', { hasText: /Disorders|ระบบ/ }).first().click()));
    await step('Expected: หมวดที่เน้นเป็น "1 วิชา"', () => expect(summary).toHaveText('1 วิชา'));
    await step('3. กด "ล้างการเลือกทั้งหมด"', () => page.getByRole('button', { name: 'ล้างการเลือกทั้งหมด' }).click());
    await step('Expected: หมวดที่เน้นกลับเป็น "ทั้งหมด"', () => expect(summary).toHaveText('ทั้งหมด'));
  });

  test('CAT-T03 เปลี่ยนจำนวนข้อขั้นต่ำและสูงสุดในการตั้งค่าขั้นสูง สรุปการตั้งค่าเปลี่ยนตาม', async ({ page }) => {
    await step('1. เปิดหน้าสอบ CAT', () => openSetup(page));
    await step('2. เปิด "การตั้งค่าขั้นสูง" เลือกขั้นต่ำ 10 ข้อ และสูงสุด 40 ข้อ', () => setItemLimits(page, 10, 40));
    await step('Expected: สรุป "จำนวนข้อ (ต่ำ-สูง)" แสดง 10 และ 40', async () => {
      const value = page.getByText('จำนวนข้อ (ต่ำ-สูง)', { exact: true }).locator('xpath=following-sibling::*[1]');
      await expect(value).toContainText('10');
      await expect(value).toContainText('40');
    });
  });

  test('CAT-T04 กดลิงก์ข้อมูลการสอบ CAT แสดงหน้าอธิบายวงจรการดึงข้อสอบ', async ({ page }) => {
    await step('1. เปิดหน้าสอบ CAT', () => openSetup(page));
    await step('2. กดลิงก์ไปหน้าข้อมูล (/user/cat-exam/info)', () => page.locator('a[href="/user/cat-exam/info"]').first().click());
    await step('Expected: แสดงหัวข้อ "วงจรการดึงข้อสอบ (CAT Flow)"', async () => {
      await page.waitForURL(/\/cat-exam\/info/);
      await expect(page.getByRole('heading', { name: 'วงจรการดึงข้อสอบ (CAT Flow)' })).toBeVisible();
    });
  });
});

test.describe('5.1 หน้าตั้งค่าการสอบ CAT: คลังข้อสอบยังไม่พร้อม', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.use({ storageState: STUDENT_AUTH_FILE });

  test('CAT-T13 คลังข้อสอบยังไม่มีค่า IRT แล้วกดเริ่มการทดสอบ แจ้งว่าไม่มีข้อสอบที่มี IRT ครบและไม่เข้าหน้าสอบ', async ({ page }) => {
    await step('1. เปิดหน้าสอบ CAT แล้วกด "เริ่มการทดสอบ"', async () => {
      await openSetup(page);
      await startButton(page).click();
    });
    const noIrt = page.locator('.swal2-html-container', { hasText: NO_IRT_MESSAGE });
    const started = page.waitForURL(/\/user\/cat-exam\/exam/, { timeout: 30_000 });
    await Promise.race([started, noIrt.waitFor({ timeout: 30_000 })]).catch(() => {});
    // เคสนี้ใช้ได้เฉพาะตอนที่คลังยังไม่พร้อม ถ้าคลังพร้อมแล้ว (เข้าหน้าสอบได้) ให้ออกจากการสอบแล้วข้าม
    if (!(await noIrt.isVisible())) {
      await leaveCat(page);
      test.skip(true, 'คลังข้อสอบมีค่า IRT แล้ว เคสนี้ใช้ทดสอบเฉพาะตอนที่คลังยังไม่พร้อม');
    }
    await step('Expected: แจ้ง "เกิดข้อผิดพลาด" ว่าไม่มีข้อสอบที่มี IRT parameters ครบ และยังอยู่หน้าตั้งค่า', async () => {
      await expect(swal(page).title).toHaveText('เกิดข้อผิดพลาด');
      await swal(page).confirm.click();
      await expect(page).toHaveURL(/\/user\/cat-exam$/);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('5.2 การทำข้อสอบ CAT', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.use({ storageState: STUDENT_AUTH_FILE });
  test.afterEach(async ({ page }) => {
    await leaveCat(page).catch(() => {});
  });

  test('CAT-T05 กดเริ่มการทดสอบ เข้าหน้าสอบพร้อมข้อแรก ตัวเลือก และระดับความสามารถ (θ)', async ({ page }) => {
    await step('1. เปิดหน้าสอบ CAT แล้วกด "เริ่มการทดสอบ"', async () => {
      await openSetup(page);
      await startCat(page);
    });
    await step('Expected: แสดงข้อ 1 ตัวเลือกคำตอบ และค่า "ระดับความสามารถ (θ)"', async () => {
      await expect(itemBadge(page)).toHaveText('ข้อ 1');
      expect(await catOptions(page).count()).toBeGreaterThan(1);
      // หน้าสอบแสดงการ์ด "ระดับความสามารถ" พร้อมค่า Theta (ข้อความ "ระดับความสามารถ (θ)" มีเฉพาะหน้าสรุปตอนสอบจบ)
      await expect(page.getByRole('heading', { name: 'ระดับความสามารถ', exact: true })).toBeVisible();
      await expect(page.getByText('ค่าความสามารถ (Theta)')).toBeVisible();
    });
  });

  test('CAT-T06 ยังไม่เลือกคำตอบ ปุ่ม "ข้อถัดไป" กดไม่ได้และแจ้งให้เลือกคำตอบก่อน', async ({ page }) => {
    await step('1. เริ่มการทดสอบ CAT', async () => {
      await openSetup(page);
      await startCat(page);
    });
    await step('Expected: ปุ่ม "ข้อถัดไป" ใต้ตัวเลือกกดไม่ได้ และมีข้อความ "เลือกคำตอบก่อนกดส่ง"', async () => {
      await expect(nextItem(page)).toBeDisabled();
      await expect(page.getByText('เลือกคำตอบก่อนกดส่ง')).toBeVisible();
    });
  });

  test('CAT-T07 เลือกคำตอบแล้วกด "ข้อถัดไป" ระบบเลือกข้อใหม่และนับจำนวนข้อที่ตอบ', async ({ page }) => {
    await step('1. เริ่มการทดสอบ CAT', async () => {
      await openSetup(page);
      await startCat(page);
    });
    await step('2. เลือกตัวเลือกแรก แล้วกด "ข้อถัดไป"', async () => {
      await catOptions(page).first().click();
      await nextItem(page).click();
    });
    await step('Expected: แสดงข้อ 2', async () => {
      await expect(itemBadge(page)).toHaveText('ข้อ 2', { timeout: 30_000 });
    });
  });

  test('CAT-T08 ระหว่างสอบ CAT ไม่แสดงชื่อหัวข้อย่อยของคำถาม (กันใบ้คำตอบ)', async ({ page }) => {
    await step('1. เริ่มการทดสอบ CAT', async () => {
      await openSetup(page);
      await startCat(page);
    });
    await step('Expected: ส่วนหัวคำถามมีเฉพาะป้าย "ข้อ 1" ไม่มีป้ายหัวข้อย่อยสีเขียว', async () => {
      await expect(itemBadge(page).locator('xpath=..').locator('span.bg-green-50')).toHaveCount(0);
    });
  });

  test('CAT-T09 กดลิงก์เมนูระหว่างสอบแล้วเลือก "ทำข้อสอบต่อ" ยังอยู่ในหน้าสอบ', async ({ page }) => {
    await step('1. เริ่มการทดสอบ CAT', async () => {
      await openSetup(page);
      await startCat(page);
    });
    await step('2. กดลิงก์ "หน้าหลัก" แล้วกด "ทำข้อสอบต่อ"', async () => {
      await page.getByRole('link', { name: 'หน้าหลัก' }).first().click();
      await expect(swal(page).title).toBeVisible();
      await swal(page).cancel.click();
    });
    await step('Expected: ยังอยู่หน้าสอบ CAT', async () => {
      await expect(page).toHaveURL(/\/cat-exam\/exam/);
      await expect(catOptions(page).first()).toBeVisible();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('5.3 การสอบ CAT จนจบและผลการสอบ', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  /** CAT-T10 สอบจนจบได้หรือไม่ — เคสถัดไปใช้ผลสอบนี้ต่อ */
  let finishedExam = false;
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage({ storageState: STUDENT_AUTH_FILE, viewport: { width: 1440, height: 900 } });
  });
  test.beforeEach(({}, testInfo) => {
    if (!testInfo.title.startsWith('CAT-T10')) test.skip(!finishedExam, SKIP_NO_IRT);
  });
  test.afterAll(async () => {
    await page.close();
  });

  test('CAT-T10 ตอบข้อสอบไปเรื่อย ๆ ระบบหยุดเองเมื่อถึงเงื่อนไข และแสดง "การประเมินผลการสอบเสร็จสิ้น"', async () => {
    test.setTimeout(300_000);
    await step('1. ตั้งค่าขั้นต่ำ 10 ข้อ สูงสุด 40 ข้อ แล้วกด "เริ่มการทดสอบ"', async () => {
      await openSetup(page);
      await setItemLimits(page, 10, 40);
      await startCat(page);
    });
    let answered = 0;
    await step('2. เลือกตัวเลือกแรกแล้วกด "ข้อถัดไป" ซ้ำจนระบบหยุดการสอบ', async () => {
      const finished = page.getByRole('heading', { name: /การประเมินผลการสอบเสร็จสิ้น/ });
      while (!(await finished.isVisible()) && answered < 40) {
        await catOptions(page).first().click();
        await nextItem(page).click();
        answered++;
        await expect(nextItem(page).or(finished)).toBeVisible({ timeout: 30_000 });
        await expect(page.getByText('กำลังประมวลผลข้อถัดไป...')).toHaveCount(0, { timeout: 30_000 });
      }
    });
    await step('Expected: ระบบหยุดหลังตอบอย่างน้อย 10 ข้อและไม่เกิน 40 ข้อ แสดงผลการประเมิน', async () => {
      await expect(page.getByRole('heading', { name: /การประเมินผลการสอบเสร็จสิ้น/ })).toBeVisible({ timeout: 30_000 });
      expect(answered).toBeGreaterThanOrEqual(10);
      expect(answered).toBeLessThanOrEqual(40);
    });
    finishedExam = true;
  });

  test('CAT-T11 กด "สรุปผลการสอบ" แสดงหน้าผลการสอบพร้อมตอบถูก ความแม่นยำ θ และ SE', async () => {
    await step('1. กด "สรุปผลการสอบ"', async () => {
      const cta = page.getByRole('button', { name: 'สรุปผลการสอบ' });
      await expect(cta).toBeEnabled({ timeout: 15_000 });
      await cta.click();
    });
    await step('Expected: หน้า /user/cat-exam/result แสดง "ตอบถูก" "ความแม่นยำ" "ระดับความสามารถ (θ)" "ความคลาดเคลื่อน (SE)"', async () => {
      await page.waitForURL(/\/cat-exam\/result/, { timeout: 20_000 });
      for (const label of ['ตอบถูก', 'ความแม่นยำ', 'ระดับความสามารถ (θ)', 'ความคลาดเคลื่อน (SE)']) {
        await expect(page.getByText(label, { exact: true }).first()).toBeVisible({ timeout: 20_000 });
      }
      await expect(page.getByRole('heading', { name: 'วิเคราะห์ตามหัวข้อ' })).toBeVisible();
    });
  });

  test('CAT-T12 กด "ดูเฉลยคำตอบ" แสดงเฉลยของข้อที่ตอบพร้อมปุ่มแจ้งปัญหา', async () => {
    await step('1. กด "ดูเฉลยคำตอบ"', () => page.getByRole('link', { name: 'ดูเฉลยคำตอบ' }).click());
    await step('Expected: แสดงเฉลยรายข้อ และแต่ละข้อมีปุ่ม "แจ้งปัญหา" และ "สถิติ"', async () => {
      await page.waitForURL(/\/answer/, { timeout: 20_000 });
      await expect(page.getByRole('button', { name: 'แจ้งปัญหา' }).first()).toBeVisible({ timeout: 20_000 });
      await expect(page.getByRole('button', { name: 'สถิติ' }).first()).toBeVisible();
    });
  });
});
