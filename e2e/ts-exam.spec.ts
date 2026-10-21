import { test, expect, type Page } from '@playwright/test';
import { RUN_ID, swal, GUEST_STATE, hasStudent, SKIP_NO_STUDENT, STUDENT_AUTH_FILE } from './helpers';

/**
 * Test Scenario: คลังข้อสอบและการทำข้อสอบชุดมาตรฐาน (ผู้เรียน) — Black Box Testing
 *
 * ใช้บัญชีผู้เรียนจาก e2e/.env.e2e ทำข้อสอบชุดที่มีจำนวนข้อน้อยที่สุดในคลัง
 * (กำหนดเองได้ด้วย E2E_EXAM_BANK=ชื่อชุดข้อสอบ) ผลสอบที่ส่งจะถูกบันทึกในประวัติของบัญชีผู้เรียน
 */

const LIST_URL = '/user/examset';
const step = test.step;

// ─── การทำงานบนหน้าจอที่ใช้ซ้ำ ────────────────────────────────────────────────
const searchBox = (page: Page) => page.getByLabel('พิมพ์สิ่งที่คุณต้องการค้นหา');
const bankHeadings = (page: Page) => page.locator('h2.text-xl');
const startButtonOf = (page: Page, bankName: string) =>
  page
    .getByRole('heading', { name: bankName, exact: true })
    .locator('xpath=ancestor::div[.//button[normalize-space()="เริ่มทำข้อสอบ"]][1]')
    .getByRole('button', { name: 'เริ่มทำข้อสอบ' });

/** ตัวเลือกคำตอบของข้อที่แสดงอยู่ (คอลัมน์ซ้าย) */
const options = (page: Page) => page.locator('div.lg\\:col-span-2 div.space-y-3 > button');
/** ปุ่มเลขข้อในตาราง "เลือกข้อ" */
const gridButtons = (page: Page) => page.locator('div.grid.grid-cols-7 button');
const gridButton = (page: Page, n: number) => gridButtons(page).nth(n - 1);
const nextButton = (page: Page) => page.getByRole('button', { name: 'ถัดไป →' });
const prevButton = (page: Page) => page.getByRole('button', { name: '← ย้อนกลับ' });
const questionBadge = (page: Page) => page.getByText(/^คำถามที่ \d+$/);
const submitButton = (page: Page) => page.getByRole('button', { name: 'ส่งข้อสอบ', exact: true });

async function openList(page: Page) {
  await page.goto(LIST_URL);
  await expect(page.getByRole('heading', { name: 'คลังข้อสอบ' })).toBeVisible();
  await expect(bankHeadings(page).first()).toBeVisible({ timeout: 20_000 });
}

/** ชื่อชุดข้อสอบที่จะใช้ทดสอบ: จาก E2E_EXAM_BANK หรือชุดที่มีจำนวนข้อน้อยที่สุด */
async function pickBank(page: Page): Promise<string> {
  if (process.env.E2E_EXAM_BANK) return process.env.E2E_EXAM_BANK;
  await openList(page);
  const banks = await page.evaluate(() =>
    [...document.querySelectorAll('button')]
      .filter((b) => b.textContent?.trim() === 'เริ่มทำข้อสอบ')
      .map((b) => {
        let card: HTMLElement | null = b.parentElement;
        while (card && !card.querySelector('h2')) card = card.parentElement;
        const name = card?.querySelector('h2')?.textContent?.trim() ?? '';
        const count = Number(card?.textContent?.match(/(\d+) ข้อ/)?.[1] ?? Infinity);
        return { name, count };
      })
      .filter((b) => b.name && b.count > 0),
  );
  banks.sort((a, b) => a.count - b.count);
  if (!banks.length) throw new Error('ไม่พบชุดข้อสอบในคลัง');
  return banks[0].name;
}

/** กดเริ่มทำข้อสอบจากหน้าคลัง — ถ้ามีข้อสอบค้างอยู่ให้เริ่มใหม่ตั้งแต่ต้น */
async function startExam(page: Page, bankName: string) {
  await openList(page);
  await startButtonOf(page, bankName).click();
  await expect(swal(page).title).toHaveText('เริ่มทำข้อสอบ');
  await swal(page).confirm.click();
  // ข้อสอบที่ทำค้างไว้ (เช่นจากการรันครั้งก่อน) จะถามว่าจะทำต่อหรือเริ่มใหม่
  const resume = page.locator('.swal2-title', { hasText: 'พบข้อสอบที่ยังไม่เสร็จ' });
  const started = page.waitForURL(/\/user\/examset\/take-exam/, { timeout: 30_000 });
  await Promise.race([started, resume.waitFor({ timeout: 30_000 })]).catch(() => {});
  if (await resume.isVisible()) {
    await page.locator('.swal2-deny').click();
    const again = page.locator('.swal2-title', { hasText: 'เริ่มทำข้อสอบ' });
    if (await again.isVisible().catch(() => false)) await swal(page).confirm.click();
    await page.waitForURL(/\/user\/examset\/take-exam/, { timeout: 30_000 });
  } else {
    await started;
  }
  await expect(questionBadge(page)).toHaveText('คำถามที่ 1', { timeout: 30_000 });
}

/** ตอบทุกข้อด้วยตัวเลือกแรก (ข้อที่ index อยู่ใน wrongAt ตอบตัวเลือกสุดท้ายแทน) */
async function answerAll(page: Page) {
  const total = await gridButtons(page).count();
  for (let i = 1; i <= total; i++) {
    await gridButton(page, i).click();
    await expect(questionBadge(page)).toHaveText(`คำถามที่ ${i}`);
    await options(page).first().click();
  }
  return total;
}

/** ออกจากห้องสอบ (ยกเลิกข้อสอบ) ผ่านลิงก์หน้าหลัก ใช้เก็บกวาดหลังเคสที่ไม่ได้ส่งข้อสอบ */
async function leaveExam(page: Page) {
  if (!/take-exam$/.test(new URL(page.url()).pathname)) return;
  await page.getByRole('link', { name: 'หน้าหลัก' }).first().click();
  await expect(swal(page).title).toHaveText('ต้องการออกจากห้องสอบใช่หรือไม่?');
  await swal(page).confirm.click();
  await page.waitForURL((u) => !u.pathname.includes('take-exam'), { timeout: 20_000 });
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe('4.1 คลังข้อสอบ: การแสดง ค้นหา กรอง และเรียงลำดับ', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.use({ storageState: STUDENT_AUTH_FILE });

  test('EXAM-T01 เปิดหน้าคลังข้อสอบ แสดงชุดข้อสอบพร้อมจำนวนข้อ เวลา และปุ่มเริ่มทำข้อสอบ', async ({ page }) => {
    await step('1. เปิดหน้า /user/examset', () => openList(page));
    await step('Expected: แสดงการ์ดชุดข้อสอบอย่างน้อย 1 ชุด มีจำนวนข้อและปุ่ม "เริ่มทำข้อสอบ"', async () => {
      await expect(bankHeadings(page).first()).toBeVisible();
      await expect(page.getByText(/^\d+ ข้อ$/).first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'เริ่มทำข้อสอบ' }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /^ทั้งหมด \(\d+\)$/ })).toBeVisible();
    });
  });

  test('EXAM-T02 ค้นหาด้วยชื่อชุดข้อสอบที่มีอยู่ แสดงเฉพาะชุดที่ตรงกัน', async ({ page }) => {
    const bank = await pickBank(page);
    await step('1. เปิดหน้าคลังข้อสอบ', () => openList(page));
    await step(`2. พิมพ์ "${bank}" ในช่องค้นหาแล้วกด Enter`, async () => {
      await searchBox(page).fill(bank);
      await searchBox(page).press('Enter');
    });
    await step('Expected: แสดงชุดข้อสอบที่ชื่อตรงกัน และไม่แสดงชุดอื่น', async () => {
      await expect(page.getByRole('heading', { name: bank, exact: true })).toBeVisible();
      for (const name of await bankHeadings(page).allTextContents()) {
        expect(name.toLowerCase()).toContain(bank.toLowerCase());
      }
    });
  });

  test('EXAM-T03 ค้นหาด้วยคำที่ไม่มีในระบบ แสดง "ไม่พบข้อสอบที่ค้นหา"', async ({ page }) => {
    await step('1. เปิดหน้าคลังข้อสอบ', () => openList(page));
    await step(`2. พิมพ์ "ไม่มีจริง-${RUN_ID}" ในช่องค้นหาแล้วกด Enter`, async () => {
      await searchBox(page).fill(`ไม่มีจริง-${RUN_ID}`);
      await searchBox(page).press('Enter');
    });
    await step('Expected: แสดง "ไม่พบข้อสอบที่ค้นหา" และไม่มีการ์ดชุดข้อสอบ', async () => {
      await expect(page.getByRole('heading', { name: 'ไม่พบข้อสอบที่ค้นหา' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'เริ่มทำข้อสอบ' })).toHaveCount(0);
    });
  });

  test('EXAM-T04 กดแท็บประเภทข้อสอบ แสดงจำนวนชุดตรงกับตัวเลขบนแท็บ', async ({ page }) => {
    await step('1. เปิดหน้าคลังข้อสอบ', () => openList(page));
    const tab = page.getByRole('button', { name: /^(?!ทั้งหมด).+ \(\d+\)$/ }).first();
    const label = (await tab.textContent())!.trim();
    const expected = Number(label.match(/\((\d+)\)$/)![1]);
    await step(`2. กดแท็บ "${label}"`, () => tab.click());
    await step(`Expected: แสดงชุดข้อสอบ ${expected} ชุด`, async () => {
      await expect(page.getByRole('button', { name: 'เริ่มทำข้อสอบ' })).toHaveCount(expected);
    });
  });

  test('EXAM-T05 เลือกเรียงจาก ฮ-ก (Z-A) ลำดับชุดข้อสอบกลับจากเรียง ก-ฮ', async ({ page }) => {
    await step('1. เปิดหน้าคลังข้อสอบ (ค่าเริ่มต้นเรียง ก-ฮ)', () => openList(page));
    const asc = await bankHeadings(page).allTextContents();
    await step('2. เลือก "เรียงจาก ฮ-ก (Z-A)"', () =>
      page.getByLabel('เรียงลำดับคลังข้อสอบ').selectOption('name_desc'));
    await step('Expected: ลำดับชุดข้อสอบกลับด้านจากเดิม', async () => {
      await expect.poll(() => bankHeadings(page).allTextContents()).toEqual([...asc].reverse());
    });
  });

  test('EXAM-T06 กดเริ่มทำข้อสอบแล้วกด "ยกเลิก" ไม่เข้าห้องสอบ', async ({ page }) => {
    const bank = await pickBank(page);
    await step('1. เปิดหน้าคลังข้อสอบ', () => openList(page));
    await step(`2. กด "เริ่มทำข้อสอบ" ของชุด "${bank}"`, () => startButtonOf(page, bank).click());
    await step('3. กด "ยกเลิก" ในกล่องยืนยัน', async () => {
      await expect(swal(page).title).toHaveText('เริ่มทำข้อสอบ');
      await swal(page).cancel.click();
    });
    await step('Expected: ยังอยู่หน้าคลังข้อสอบ', async () => {
      await expect(swal(page).title).toHaveCount(0);
      await expect(page).toHaveURL(/\/user\/examset$/);
    });
  });
});

test.describe('4.1 คลังข้อสอบ: ผู้ที่ยังไม่เข้าสู่ระบบ', () => {
  test.use({ storageState: GUEST_STATE });

  test('EXAM-T07 ผู้ที่ยังไม่เข้าสู่ระบบกดเริ่มทำข้อสอบ ระบบให้เข้าสู่ระบบก่อน', async ({ page }) => {
    await step('1. เปิดหน้าคลังข้อสอบโดยยังไม่เข้าสู่ระบบ', async () => {
      await page.addInitScript(() => localStorage.setItem('pwa-dismissed', 'true'));
      await openList(page);
    });
    await step('2. กด "เริ่มทำข้อสอบ" ของชุดแรก', () =>
      page.getByRole('button', { name: 'เริ่มทำข้อสอบ' }).first().click());
    await step('Expected: แจ้ง "กรุณาเข้าสู่ระบบ" และกด "เข้าสู่ระบบ" แล้วไปหน้า /login', async () => {
      await expect(swal(page).title).toHaveText('กรุณาเข้าสู่ระบบ');
      await swal(page).confirm.click();
      await page.waitForURL(/\/login/);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('4.2 การทำข้อสอบ', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.use({ storageState: STUDENT_AUTH_FILE });

  let bank = '';
  test.beforeEach(async ({ page }) => {
    bank ||= await pickBank(page);
  });
  // เคสที่ไม่ได้ส่งข้อสอบ ออกจากห้องสอบให้เรียบร้อยเพื่อไม่ให้ค้างไปเคสถัดไป
  test.afterEach(async ({ page }) => {
    await leaveExam(page).catch(() => {});
  });

  test('EXAM-T08 ยืนยันเริ่มทำข้อสอบ เข้าห้องสอบที่ข้อ 1 พร้อมตารางเลือกข้อและปุ่มส่งข้อสอบ', async ({ page }) => {
    await step(`1. กด "เริ่มทำข้อสอบ" ของชุด "${bank}" แล้วกดยืนยัน`, () => startExam(page, bank));
    await step('Expected: แสดง "คำถามที่ 1" มีตัวเลือกคำตอบ ตารางเลือกข้อ และปุ่ม "ส่งข้อสอบ"', async () => {
      await expect(questionBadge(page)).toHaveText('คำถามที่ 1');
      expect(await options(page).count()).toBeGreaterThan(1);
      await expect(page.getByRole('heading', { name: 'เลือกข้อ' })).toBeVisible();
      expect(await gridButtons(page).count()).toBeGreaterThan(0);
      await expect(submitButton(page)).toBeVisible();
      await expect(prevButton(page)).toBeDisabled();
    });
  });

  test('EXAM-T09 เลือกคำตอบแล้วกด "ถัดไป" ไปข้อ 2 และข้อ 1 ถูกทำเครื่องหมายว่าตอบแล้ว', async ({ page }) => {
    await step('1. เริ่มทำข้อสอบ', () => startExam(page, bank));
    await step('2. เลือกตัวเลือกแรกของข้อ 1', () => options(page).first().click());
    await step('3. กดปุ่ม "ถัดไป →" ที่อยู่ใต้ตัวเลือก', () => nextButton(page).click());
    await step('Expected: แสดงคำถามที่ 2 และเลข 1 ในตารางเปลี่ยนเป็นสถานะ "ตอบแล้ว"', async () => {
      await expect(questionBadge(page)).toHaveText('คำถามที่ 2');
      await expect(gridButton(page, 1)).toHaveClass(/bg-green-100/);
    });
  });

  test('EXAM-T10 กด "← ย้อนกลับ" กลับไปข้อก่อนหน้าและคำตอบเดิมยังถูกเลือกอยู่', async ({ page }) => {
    await step('1. เริ่มทำข้อสอบ เลือกตัวเลือกที่ 2 ของข้อ 1 แล้วกดถัดไป', async () => {
      await startExam(page, bank);
      await options(page).nth(1).click();
      await nextButton(page).click();
      await expect(questionBadge(page)).toHaveText('คำถามที่ 2');
    });
    await step('2. กดปุ่ม "← ย้อนกลับ"', () => prevButton(page).click());
    await step('Expected: แสดงคำถามที่ 1 และตัวเลือกที่ 2 ยังถูกเลือกอยู่', async () => {
      await expect(questionBadge(page)).toHaveText('คำถามที่ 1');
      await expect(options(page).nth(1)).toHaveClass(/border-green-500/);
    });
  });

  test('EXAM-T11 กดเลขข้อในตาราง "เลือกข้อ" ไปยังข้อนั้นทันที', async ({ page }) => {
    await step('1. เริ่มทำข้อสอบ', () => startExam(page, bank));
    const total = await gridButtons(page).count();
    await step(`2. กดเลข ${total} (ข้อสุดท้าย) ในตารางเลือกข้อ`, () => gridButton(page, total).click());
    await step(`Expected: แสดงคำถามที่ ${total} และปุ่ม "ถัดไป" กดไม่ได้`, async () => {
      await expect(questionBadge(page)).toHaveText(`คำถามที่ ${total}`);
      await expect(nextButton(page)).toBeDisabled();
    });
  });

  test('EXAM-T12 กด "มาร์คไว้ทบทวน" แสดงดาวที่เลขข้อในตาราง และกดซ้ำเพื่อยกเลิกได้', async ({ page }) => {
    await step('1. เริ่มทำข้อสอบ', () => startExam(page, bank));
    await step('2. กดปุ่ม "มาร์คไว้ทบทวน"', () => page.getByRole('button', { name: 'มาร์คไว้ทบทวน', exact: true }).click());
    await step('Expected: ปุ่มเปลี่ยนเป็น "มาร์คไว้ทบทวนแล้ว" และมีดาวที่เลข 1', async () => {
      await expect(page.getByRole('button', { name: 'มาร์คไว้ทบทวนแล้ว' })).toBeVisible();
      await expect(gridButton(page, 1).locator('xpath=..').getByText('★')).toBeVisible();
    });
    await step('3. กด "มาร์คไว้ทบทวนแล้ว" อีกครั้ง', () => page.getByRole('button', { name: 'มาร์คไว้ทบทวนแล้ว' }).click());
    await step('Expected: ดาวที่เลข 1 หายไป', async () => {
      await expect(gridButton(page, 1).locator('xpath=..').getByText('★')).toHaveCount(0);
    });
  });

  test('EXAM-T13 ระหว่างทำข้อสอบไม่แสดงชื่อหัวข้อย่อยของคำถาม (กันใบ้คำตอบ)', async ({ page }) => {
    await step('1. เริ่มทำข้อสอบ', () => startExam(page, bank));
    await step('Expected: ไม่มีป้ายหัวข้อย่อยใต้คำถาม (ป้ายสีเขียว rounded-md ในส่วนคำถาม)', async () => {
      await expect(page.locator('div.lg\\:col-span-2 span.bg-green-50.rounded-md')).toHaveCount(0);
    });
  });

  test('EXAM-T14 กดส่งข้อสอบทั้งที่ยังตอบไม่ครบ แจ้ง "ยังตอบไม่ครบ!" และไม่ส่งข้อสอบ', async ({ page }) => {
    await step('1. เริ่มทำข้อสอบ และตอบเฉพาะข้อ 1', async () => {
      await startExam(page, bank);
      await options(page).first().click();
    });
    await step('2. กดปุ่ม "ส่งข้อสอบ"', () => submitButton(page).click());
    await step('Expected: แจ้ง "ยังตอบไม่ครบ!" และยังอยู่ในห้องสอบ', async () => {
      await expect(swal(page).title).toHaveText('ยังตอบไม่ครบ!');
      await swal(page).confirm.click();
      await expect(page).toHaveURL(/take-exam$/);
    });
  });

  test('EXAM-T15 โหลดหน้าใหม่ระหว่างทำข้อสอบ คำตอบเดิมยังอยู่ครบ', async ({ page }) => {
    await step('1. เริ่มทำข้อสอบ และตอบข้อ 1', async () => {
      await startExam(page, bank);
      await options(page).first().click();
      await expect(gridButton(page, 1)).toHaveClass(/bg-green-500/);
    });
    await step('2. โหลดหน้าใหม่ (Refresh)', () => page.reload());
    await step('Expected: ยังอยู่ในห้องสอบ และเลข 1 ยังเป็นข้อที่ตอบแล้ว', async () => {
      await expect(questionBadge(page)).toBeVisible({ timeout: 30_000 });
      await gridButton(page, 2).click();
      await expect(gridButton(page, 1)).toHaveClass(/bg-green-100/);
    });
  });

  test('EXAM-T16 กดลิงก์เมนูระหว่างสอบแล้วเลือก "ทำข้อสอบต่อ" ยังอยู่ในห้องสอบ', async ({ page }) => {
    await step('1. เริ่มทำข้อสอบ', () => startExam(page, bank));
    await step('2. กดลิงก์ "หน้าหลัก" บนแถบเมนู', () => page.getByRole('link', { name: 'หน้าหลัก' }).first().click());
    await step('3. กด "ทำข้อสอบต่อ"', async () => {
      await expect(swal(page).title).toHaveText('ต้องการออกจากห้องสอบใช่หรือไม่?');
      await swal(page).cancel.click();
    });
    await step('Expected: ยังอยู่ในห้องสอบ', async () => {
      await expect(page).toHaveURL(/take-exam$/);
      await expect(questionBadge(page)).toBeVisible();
    });
  });

  test('EXAM-T17 กดลิงก์เมนูระหว่างสอบแล้วเลือก "ออกจากห้องสอบ" ยกเลิกการสอบและออกจากห้องสอบ', async ({ page }) => {
    await step('1. เริ่มทำข้อสอบ', () => startExam(page, bank));
    await step('2. กดลิงก์ "หน้าหลัก" บนแถบเมนู แล้วกด "ออกจากห้องสอบ"', async () => {
      await page.getByRole('link', { name: 'หน้าหลัก' }).first().click();
      await expect(swal(page).title).toHaveText('ต้องการออกจากห้องสอบใช่หรือไม่?');
      await swal(page).confirm.click();
    });
    await step('Expected: ออกจากหน้าทำข้อสอบ และเริ่มชุดเดิมใหม่ได้โดยไม่มีข้อสอบค้าง', async () => {
      await page.waitForURL((u) => !u.pathname.includes('take-exam'), { timeout: 20_000 });
      await openList(page);
      await startButtonOf(page, bank).click();
      await expect(swal(page).title).toHaveText('เริ่มทำข้อสอบ');
      await swal(page).cancel.click();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('4.3 การส่งข้อสอบ สรุปผล และเฉลย', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.use({ storageState: STUDENT_AUTH_FILE });
  // เคสในกลุ่มนี้ต่อเนื่องกัน (ส่งข้อสอบ → สรุปผล → เฉลย) จึงรันตามลำดับในหน้าเดียวกัน
  test.describe.configure({ mode: 'serial' });

  let page: Page;
  let total = 0;
  let bank = '';
  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage({ storageState: STUDENT_AUTH_FILE, viewport: { width: 1440, height: 900 } });
  });
  test.afterAll(async () => {
    await page.close();
  });

  test('EXAM-T18 ตอบครบทุกข้อแล้วกดส่งข้อสอบและยืนยัน ส่งสำเร็จและแสดงคะแนน', async () => {
    test.setTimeout(240_000);
    bank = await pickBank(page);
    await step(`1. เริ่มทำข้อสอบชุด "${bank}"`, () => startExam(page, bank));
    await step('2. ตอบให้ครบทุกข้อ', async () => {
      total = await answerAll(page);
    });
    await step('3. กด "ส่งข้อสอบ" แล้วกด "ส่งข้อสอบ" ในกล่องยืนยัน', async () => {
      await submitButton(page).click();
      await expect(swal(page).title).toHaveText('ยืนยันการส่งข้อสอบ');
      await swal(page).confirm.click();
    });
    await step(`Expected: แจ้ง "ส่งข้อสอบสำเร็จ!" พร้อมคะแนน x/${total}`, async () => {
      await expect(swal(page).title).toHaveText('ส่งข้อสอบสำเร็จ!', { timeout: 30_000 });
      await expect(swal(page).text).toContainText(`/${total}`);
    });
  });

  test('EXAM-T19 กด "ดูผลสอบ" แสดงหน้าสรุปผลของชุดที่ทำ พร้อมจำนวนข้อ ตอบถูก ตอบผิด และเวลาที่ใช้', async () => {
    await step('1. กด "ดูผลสอบ"', () => swal(page).confirm.click());
    await step('Expected: เปิดหน้าสรุปผล แสดงชื่อชุดข้อสอบ จำนวนข้อเท่ากับที่ทำ และการวิเคราะห์จุดแข็ง-จุดอ่อน', async () => {
      await page.waitForURL(/summarize-exam$/, { timeout: 20_000 });
      await expect(page.getByRole('heading', { name: bank, exact: true })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText('สรุปผลการทำข้อสอบ', { exact: true })).toBeVisible();
      const stat = (label: string) => page.getByText(label, { exact: true }).locator('xpath=preceding-sibling::*[1]');
      await expect(stat('จำนวนข้อ')).toHaveText(String(total));
      const correct = Number(await stat('ตอบถูก').textContent());
      const wrong = Number(await stat('ตอบผิด').textContent());
      expect(correct + wrong).toBe(total);
      await expect(page.getByText('เวลาที่ใช้', { exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: /วิเคราะห์จุดแข็ง/ })).toBeVisible();
    });
  });

  test('EXAM-T20 กด "ดูเฉลยคำตอบ" แสดงเฉลยทุกข้อพร้อมสถานะตอบถูก/ไม่ถูก', async () => {
    await step('1. กด "ดูเฉลยคำตอบ"', () => page.getByRole('link', { name: 'ดูเฉลยคำตอบ' }).click());
    await step('2. ซ่อนสารบัญลอยทางขวา แล้วกด "เปิดทั้งหมด"', async () => {
      await page.waitForURL(/summarize-exam\/answer/);
      await page.getByTitle('ซ่อนสารบัญ').click();
      await page.getByRole('button', { name: 'เปิดทั้งหมด' }).click();
    });
    await step(`Expected: แสดงเฉลย ${total} ข้อ แต่ละข้อมีป้าย "ตอบถูกต้อง" หรือ "ตอบไม่ถูกต้อง"`, async () => {
      await expect(page.locator('[id^="question-"]')).toHaveCount(total, { timeout: 20_000 });
      const marked = page.locator('[id^="question-"]').filter({ hasText: /ตอบถูกต้อง|ตอบไม่ถูกต้อง/ });
      await expect(marked).toHaveCount(total);
    });
  });

  test('EXAM-T21 กดปุ่ม "สถิติ" ของข้อ แสดงสถิติการตอบข้อนั้น', async () => {
    await step('1. กดปุ่ม "สถิติ" ของข้อแรก', () =>
      page.locator('#question-0').getByRole('button', { name: 'สถิติ' }).click());
    await step('Expected: เปิดหน้าต่าง "สถิติการตอบข้อนี้"', async () => {
      await expect(page.getByRole('heading', { name: 'สถิติการตอบข้อนี้' })).toBeVisible();
    });
    await step('2. ปิดหน้าต่างสถิติ', () => page.keyboard.press('Escape').then(() =>
      page.getByRole('heading', { name: 'สถิติการตอบข้อนี้' }).locator('xpath=../..').getByRole('button').last().click().catch(() => {})));
  });

  test('EXAM-T22 กดปุ่ม "แจ้งปัญหา" ของข้อ เปิดแบบฟอร์มแจ้งปัญหาพร้อมประเภทปัญหา 5 ประเภท', async () => {
    await step('1. กดปุ่ม "แจ้งปัญหา" ของข้อแรก', () =>
      page.locator('#question-0').getByRole('button', { name: 'แจ้งปัญหา' }).click());
    await step('Expected: เปิดหน้าต่าง "แจ้งปัญหาข้อสอบ" มีตัวเลือก เฉลยผิด กำกวม พิมพ์ผิด รูปไม่แสดง อื่น ๆ', async () => {
      const dialog = page.getByRole('dialog', { name: 'แจ้งปัญหาข้อสอบ' });
      await expect(dialog).toBeVisible();
      await expect(dialog.getByRole('radio')).toHaveCount(5);
      await expect(dialog.getByRole('radio', { name: 'เฉลยผิด' })).toBeChecked();
    });
    await step('2. กด "ยกเลิก"', () => page.getByRole('dialog').getByRole('button', { name: 'ยกเลิก' }).click());
    await step('Expected: ปิดหน้าต่างโดยไม่ส่งรายงาน ปุ่มยังเป็น "แจ้งปัญหา"', async () => {
      await expect(page.getByRole('dialog')).toHaveCount(0);
      await expect(page.locator('#question-0').getByRole('button', { name: 'แจ้งปัญหา' })).toBeEnabled();
    });
  });

  test('EXAM-T23 เปิดหน้าเฉลยบนจอเดสก์ท็อป สารบัญลอยต้องไม่บังปุ่ม "เปิดทั้งหมด" และ "ยุบทั้งหมด"', async () => {
    await step('1. เปิดหน้าเฉลยใหม่ (สารบัญลอยแสดงเป็นค่าเริ่มต้น)', async () => {
      await page.reload();
      await expect(page.getByText('สารบัญข้อสอบ')).toBeVisible({ timeout: 20_000 });
    });
    await step('Expected: ปุ่ม "เปิดทั้งหมด" และ "ยุบทั้งหมด" กดได้ ไม่ถูกสารบัญลอยทับ', async () => {
      // trial: ตรวจว่าคลิกถึงปุ่มจริงได้โดยไม่กดจริง — ถ้ามีอะไรบังอยู่จะล้มเหลว
      await page.getByRole('button', { name: 'เปิดทั้งหมด' }).click({ trial: true, timeout: 5_000 });
      await page.getByRole('button', { name: 'ยุบทั้งหมด' }).click({ trial: true, timeout: 5_000 });
    });
  });
});
