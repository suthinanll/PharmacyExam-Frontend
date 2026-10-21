import { test, expect, type Page } from '@playwright/test';
import { RUN_ID, uniqueTitle, swal, newAdminPage } from './helpers';

/**
 * Test Scenario: จัดการคลังข้อสอบและคำถาม (ผู้ดูแลระบบ) — Black Box Testing
 *
 * ชุดข้อสอบทดสอบสร้างเป็น "แบบร่าง" (ผู้เรียนไม่เห็น) ชื่อขึ้นต้นด้วย "E2E-"
 * ตอนจบย้ายไปถังขยะแล้วลบถาวรผ่านหน้าเว็บ
 */

const LIST_URL = '/admin/manage_examset';
const step = test.step;

// ─── การทำงานบนหน้าจอที่ใช้ซ้ำ ────────────────────────────────────────────────
const searchBox = (page: Page) => page.getByLabel(/^ค้นหาคลัง/);
const bankRow = (page: Page, name: string) =>
  page.locator('tbody tr').filter({ has: page.getByText(name, { exact: true }) });
const createModal = (page: Page) => ({
  name: page.getByPlaceholder('เช่น MCQ ปี 2567 ชุดที่ 1'),
  desc: page.getByPlaceholder(/ระบุรายละเอียดเพิ่มเติมเกี่ยวกับชุดข้อสอบ/),
  duration: page.locator('input[type="number"]').first(),
  submit: page.getByRole('button', { name: 'สร้างชุดข้อสอบ', exact: true }),
});

async function openBanks(page: Page, opts: { search?: string; deleted?: boolean } = {}) {
  await page.addInitScript(() => localStorage.setItem('examset_viewmode', 'table'));
  await page.goto(LIST_URL);
  await expect(page.getByRole('heading', { name: 'คลังข้อสอบ', exact: true })).toBeVisible();
  if (opts.deleted) await page.getByRole('button', { name: /คลังข้อสอบที่ลบไปแล้ว/ }).first().click();
  if (opts.search !== undefined) await searchBox(page).fill(opts.search);
}

async function createBank(page: Page, name: string, minutes = 30) {
  await page.getByRole('button', { name: 'สร้างข้อสอบใหม่' }).click();
  await expect(page.getByRole('heading', { name: 'สร้างชุดข้อสอบใหม่' })).toBeVisible();
  await createModal(page).name.fill(name);
  await createModal(page).desc.fill('ชุดข้อสอบสำหรับการทดสอบอัตโนมัติ');
  await createModal(page).duration.fill(String(minutes));
  await createModal(page).submit.click();
}

async function expectCreated(page: Page) {
  await expect(swal(page).title).toHaveText('สำเร็จ', { timeout: 20_000 });
  await expect(swal(page).text).toContainText('สร้างชุดข้อสอบใหม่เรียบร้อยแล้ว');
  if (await swal(page).confirm.isVisible()) await swal(page).confirm.click();
  await expect(swal(page).title).toHaveCount(0, { timeout: 10_000 });
}

/** เปิดหน้ารายละเอียดชุดข้อสอบ แล้วเข้าหน้าจัดการคำถาม (แบบอ่านอย่างเดียว) */
async function openQuestions(page: Page, name: string) {
  await openBanks(page, { search: name });
  await bankRow(page, name).getByTitle('ดูรายละเอียดคลังข้อสอบ').click();
  await page.waitForURL(/manage_examset\/detail/);
  await page.getByRole('button', { name: /จัดการคำถาม/ }).click();
  await expect(page.getByRole('button', { name: 'แก้ไขข้อมูลชุดข้อสอบ' })).toBeVisible({ timeout: 20_000 });
}

/** เข้าหน้าจัดการคำถามแล้วเปิดโหมดแก้ไข */
async function openEditor(page: Page, name: string) {
  await openQuestions(page, name);
  // ปุ่ม "แก้ไขข้อมูล" ถูกสารบัญลอยทับเมื่อชุดมีคำถามแล้ว (ดู BANK-T17) จึงกดด้วยแป้นพิมพ์แทนเมาส์
  await page.getByRole('button', { name: 'แก้ไขข้อมูลชุดข้อสอบ' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'สร้างสถานการณ์หรือคำถามใหม่' })).toBeVisible({ timeout: 20_000 });
}

/** ช่องพิมพ์โจทย์คำถามของคำถามล่าสุด (คลิกที่ข้อความแนะนำในช่อง) */
const questionEditor = (page: Page) => page.getByText('กรอกโจทย์คำถาม...').last();

// ใช้ปุ่ม "เพิ่มคำถามเดี่ยว" / "เพิ่มสถานการณ์ใหม่" ในสารบัญลอยทางขวา
// เพราะปุ่ม "สร้าง" มุมขวาบนถูกปุ่มของสารบัญลอยทับอยู่ (ดู BANK-T17)
async function addStandaloneQuestion(page: Page) {
  await page.getByRole('button', { name: /เพิ่มคำถามเดี่ยว/ }).first().click();
  await expect(questionEditor(page)).toBeVisible();
}
async function addSituation(page: Page) {
  await page.getByRole('button', { name: /เพิ่มสถานการณ์ใหม่/ }).first().click();
}

const CHOICES = ['Metformin', 'Simvastatin', 'Amlodipine', 'Losartan', 'Warfarin'];
/** กรอกตัวเลือกคำตอบทั้ง 5 ช่องของคำถามล่าสุด (ทุกช่องเป็นช่องบังคับ) */
async function fillChoices(page: Page) {
  for (let i = 0; i < CHOICES.length; i++) await page.getByLabel(`ตัวเลือกที่ ${i + 1}`, { exact: true }).last().fill(CHOICES[i]);
}

const saveButton = (page: Page) => page.getByRole('button', { name: /^(บันทึกร่าง|บันทึกการแก้ไข)$/ });

/** ย้ายชุดข้อสอบไปถังขยะ แล้วลบถาวร (เก็บกวาด) */
async function purgeBank(page: Page, name: string) {
  await openBanks(page, { search: name });
  if (await bankRow(page, name).count()) {
    await bankRow(page, name).getByTitle(/ลบคลังข้อสอบ/).click();
    await swal(page).confirm.click();
    await expect(swal(page).title).toHaveText('ย้ายไปถังขยะแล้ว!', { timeout: 15_000 });
    if (await swal(page).confirm.isVisible()) await swal(page).confirm.click();
  }
  await openBanks(page, { deleted: true, search: name });
  if (await bankRow(page, name).count()) {
    await bankRow(page, name).getByTitle('ลบออกจากระบบอย่างถาวร').click();
    await swal(page).confirm.click();
    await expect(swal(page).title).toHaveText('ลบถาวรสำเร็จ!', { timeout: 15_000 });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe('10.1 คลังข้อสอบ: รายการและการสร้างชุดข้อสอบ', () => {
  const created: string[] = [];
  test.afterAll(async ({ browser }) => {
    const page = await newAdminPage(browser);
    for (const name of created) await purgeBank(page, name).catch(() => {});
    await page.context().close();
  });

  test('BANK-T01 เปิดหน้าคลังข้อสอบ แสดงตารางชุดข้อสอบพร้อมแท็บคลังทั้งหมดและที่ลบแล้ว', async ({ page }) => {
    await step('1. เปิดหน้า /admin/manage_examset', () => openBanks(page));
    await step('Expected: แสดงแท็บ "คลังข้อสอบทั้งหมด" ปุ่ม "สร้างข้อสอบใหม่" และแถวชุดข้อสอบ', async () => {
      await expect(page.getByRole('button', { name: /คลังข้อสอบทั้งหมด/ })).toBeVisible();
      await expect(page.getByRole('button', { name: 'สร้างข้อสอบใหม่' })).toBeVisible();
      await expect(page.locator('tbody tr').first()).toBeVisible();
    });
  });

  test('BANK-T02 สร้างชุดข้อสอบโดยไม่กรอกชื่อ แจ้ง "กรุณากรอกข้อมูล" และไม่สร้าง', async ({ page }) => {
    await step('1. เปิดหน้าคลังข้อสอบ แล้วกด "สร้างข้อสอบใหม่"', async () => {
      await openBanks(page);
      await page.getByRole('button', { name: 'สร้างข้อสอบใหม่' }).click();
    });
    await step('2. ไม่กรอกชื่อชุดข้อสอบ แล้วกด "สร้างชุดข้อสอบ"', () => createModal(page).submit.click());
    await step('Expected: แจ้ง "กรุณากรอกข้อมูล" (กรุณากรอกชื่อชุดข้อสอบ)', async () => {
      await expect(swal(page).title).toHaveText('กรุณากรอกข้อมูล');
      await expect(swal(page).text).toContainText('ชื่อชุดข้อสอบ');
    });
  });

  test('BANK-T03 ระยะเวลาสอบเป็น 0 นาที แจ้งให้กรอกระยะเวลาที่ถูกต้อง', async ({ page }) => {
    await step('1. เปิดหน้าคลังข้อสอบ แล้วกด "สร้างข้อสอบใหม่"', async () => {
      await openBanks(page);
      await page.getByRole('button', { name: 'สร้างข้อสอบใหม่' }).click();
    });
    await step('2. กรอกชื่อ และระยะเวลา 0 นาที แล้วกด "สร้างชุดข้อสอบ"', async () => {
      await createModal(page).name.fill(uniqueTitle('เวลาศูนย์'));
      await createModal(page).duration.fill('0');
      await createModal(page).submit.click();
    });
    await step('Expected: ไม่สร้างชุดข้อสอบ — แจ้ง "กรุณากรอกระยะเวลาที่ถูกต้อง" หรือช่องระยะเวลาไม่ผ่านเงื่อนไข', async () => {
      const invalid = await createModal(page).duration.evaluate((el: HTMLInputElement) => !el.validity.valid);
      if (!invalid) await expect(swal(page).text).toContainText('กรุณากรอกระยะเวลาที่ถูกต้อง');
      await expect(page.getByText('สร้างชุดข้อสอบใหม่เรียบร้อยแล้ว')).toHaveCount(0);
    });
  });

  test('BANK-T04 สร้างชุดข้อสอบครบถ้วน สร้างสำเร็จเป็นแบบร่างและแสดงในตาราง', async ({ page }) => {
    const name = uniqueTitle('ชุดข้อสอบ');
    created.push(name);
    await step('1. เปิดหน้าคลังข้อสอบ', () => openBanks(page));
    await step(`2. กด "สร้างข้อสอบใหม่" กรอกชื่อ "${name}" คำอธิบาย และเวลา 30 นาที แล้วกด "สร้างชุดข้อสอบ"`, () => createBank(page, name));
    await step('Expected: แจ้ง "สร้างชุดข้อสอบใหม่เรียบร้อยแล้ว" และค้นหาพบในตาราง', async () => {
      await expectCreated(page);
      await searchBox(page).fill(name);
      await expect(bankRow(page, name)).toHaveCount(1);
    });
  });

  test('BANK-T05 ค้นหาด้วยคำที่ไม่มีในระบบ แสดง "ไม่พบข้อมูลที่ค้นหา"', async ({ page }) => {
    await step(`1. เปิดหน้าคลังข้อสอบ แล้วค้นหา "ไม่มีจริง-${RUN_ID}"`, () => openBanks(page, { search: `ไม่มีจริง-${RUN_ID}` }));
    await step('Expected: แสดง "ไม่พบข้อมูลที่ค้นหา"', () => expect(page.getByText('ไม่พบข้อมูลที่ค้นหา')).toBeVisible());
  });

  test('BANK-T06 เลือกไฟล์ที่ไม่ใช่ Excel ในหน้าสร้างชุดข้อสอบ แจ้ง "ประเภทไฟล์ไม่ถูกต้อง"', async ({ page }) => {
    await step('1. เปิดหน้าคลังข้อสอบ แล้วกด "สร้างข้อสอบใหม่"', async () => {
      await openBanks(page);
      await page.getByRole('button', { name: 'สร้างข้อสอบใหม่' }).click();
    });
    await step('2. เลือกไฟล์ข้อความ (.txt) ในช่องนำเข้า Excel', () =>
      page.locator('input[type="file"]').first().setInputFiles({
        name: 'not-excel.txt', mimeType: 'text/plain', buffer: Buffer.from('ไม่ใช่ไฟล์ Excel'),
      }));
    await step('Expected: แจ้ง "ประเภทไฟล์ไม่ถูกต้อง"', () => expect(swal(page).title).toHaveText('ประเภทไฟล์ไม่ถูกต้อง'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('10.2 จัดการคำถามในชุดข้อสอบ', () => {
  test.describe.configure({ mode: 'serial' });
  const bank = uniqueTitle('ชุดจัดการคำถาม');
  const question = `คำถามทดสอบ ${RUN_ID}: ยาใดเป็นยากลุ่ม statin`;

  test.beforeAll(async ({ browser }) => {
    const page = await newAdminPage(browser);
    await openBanks(page);
    await createBank(page, bank);
    await expectCreated(page);
    await page.context().close();
  });
  test.afterAll(async ({ browser }) => {
    const page = await newAdminPage(browser);
    await purgeBank(page, bank).catch(() => {});
    await page.context().close();
  });

  test('BANK-T07 เปิดรายละเอียดชุดข้อสอบแล้วกด "จัดการคำถาม" แสดงหน้าจัดการคำถามของชุดนั้น', async ({ page }) => {
    await step(`1. ค้นหาชุด "${bank}" แล้วกดดูรายละเอียด`, async () => {
      await openBanks(page, { search: bank });
      await bankRow(page, bank).getByTitle('ดูรายละเอียดคลังข้อสอบ').click();
    });
    await step('2. กด "จัดการคำถาม"', () => page.getByRole('button', { name: /จัดการคำถาม/ }).click());
    await step('Expected: แสดงชื่อชุดข้อสอบ สถานะ "แบบร่าง" และปุ่ม "แก้ไขข้อมูล" (เปิดแบบอ่านอย่างเดียว)', async () => {
      await expect(page.getByText(bank).first()).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText('แบบร่าง', { exact: true }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'แก้ไขข้อมูลชุดข้อสอบ' })).toBeVisible();
    });
    await step('3. กด "แก้ไขข้อมูล"', () => page.getByRole('button', { name: 'แก้ไขข้อมูลชุดข้อสอบ' }).click());
    await step('Expected: แสดงปุ่มสร้างสถานการณ์หรือคำถามใหม่', () =>
      expect(page.getByRole('button', { name: 'สร้างสถานการณ์หรือคำถามใหม่' })).toBeVisible());
  });

  test('BANK-T18 เพิ่มคำถามเดี่ยวแต่ไม่กรอกตัวเลือกคำตอบแล้วบันทึก ระบบไม่บันทึกและแจ้งให้กรอกตัวเลือก', async ({ page }) => {
    await step('1. เปิดหน้าจัดการคำถามของชุดทดสอบ', () => openEditor(page, bank));
    await step('2. กด "เพิ่มคำถามเดี่ยว" กรอกโจทย์ แต่ไม่กรอกตัวเลือก แล้วกดบันทึก', async () => {
      await addStandaloneQuestion(page);
      await questionEditor(page).click({ force: true }); // ข้อความแนะนำวางทับช่องพิมพ์ (pointer-events: none)
      await page.keyboard.type(`ไม่มีตัวเลือก ${RUN_ID}`);
      await saveButton(page).click();
    });
    await step('Expected: ช่อง "ตัวเลือกที่ 1" แจ้งว่าต้องกรอก และไม่มีกล่องแจ้งผลการบันทึก', async () => {
      expect(await page.getByLabel('ตัวเลือกที่ 1', { exact: true }).last().evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
      await expect(swal(page).title).toHaveCount(0);
    });
  });

  test('BANK-T08 เพิ่มคำถามเดี่ยวกรอกตัวเลือกครบแต่ไม่กรอกโจทย์แล้วบันทึก แจ้ง "กรุณากรอกโจทย์คำถาม"', async ({ page }) => {
    await step('1. เปิดหน้าจัดการคำถามของชุดทดสอบ', () => openEditor(page, bank));
    await step('2. กด "เพิ่มคำถามเดี่ยว" กรอกตัวเลือกครบ 5 ข้อ แต่ไม่กรอกโจทย์ แล้วกดบันทึก', async () => {
      await addStandaloneQuestion(page);
      await fillChoices(page);
      await saveButton(page).click();
    });
    await step('Expected: แจ้ง "กรุณากรอกโจทย์คำถาม"', async () => {
      await expect(swal(page).title).toHaveText('กรุณากรอกโจทย์คำถาม');
      await swal(page).confirm.click();
    });
  });

  test('BANK-T09 เพิ่มสถานการณ์แต่ไม่กรอกรายละเอียดแล้วบันทึก แจ้ง "กรุณากรอกรายละเอียดสถานการณ์"', async ({ page }) => {
    await step('1. เปิดหน้าจัดการคำถามของชุดทดสอบ', () => openEditor(page, bank));
    await step('2. กด "เพิ่มสถานการณ์ใหม่" กรอกตัวเลือกของคำถามในสถานการณ์ครบ แต่ไม่กรอกรายละเอียดสถานการณ์ แล้วกดบันทึก', async () => {
      await addSituation(page);
      await fillChoices(page);
      await saveButton(page).click();
    });
    await step('Expected: แจ้ง "กรุณากรอกรายละเอียดสถานการณ์"', async () => {
      await expect(swal(page).title).toHaveText('กรุณากรอกรายละเอียดสถานการณ์');
      await swal(page).confirm.click();
    });
  });

  test('BANK-T10 เพิ่มคำถามเดี่ยวพร้อมตัวเลือกและเฉลย บันทึกสำเร็จและแสดงโจทย์ในชุดข้อสอบ', async ({ page }) => {
    await step('1. เปิดหน้าจัดการคำถามของชุดทดสอบ', () => openEditor(page, bank));
    await step('2. กด "เพิ่มคำถามเดี่ยว" กรอกโจทย์ ตัวเลือก 5 ข้อ และเลือกเฉลยข้อที่ 2', async () => {
      await addStandaloneQuestion(page);
      await questionEditor(page).click({ force: true }); // ข้อความแนะนำวางทับช่องพิมพ์ (pointer-events: none)
      await page.keyboard.type(question);
      await fillChoices(page);
      await page.getByLabel('เฉลยข้อตัวเลือกที่ 2', { exact: true }).last().check();
    });
    await step('3. กดบันทึก', () => saveButton(page).click());
    await step('Expected: แจ้ง "สำเร็จ!" และหน้าแสดงโจทย์ที่บันทึก', async () => {
      await expect(swal(page).title).toHaveText('สำเร็จ!', { timeout: 20_000 });
      if (await swal(page).confirm.isVisible()) await swal(page).confirm.click();
      await expect(page.getByText(question).first()).toBeVisible({ timeout: 15_000 });
    });
  });

  test('BANK-T11 เปิดหน้าจัดการคำถามใหม่ คำถามที่บันทึกยังอยู่พร้อมตัวเลือกและเฉลยเดิม', async ({ page }) => {
    await step('1. เปิดหน้าจัดการคำถามของชุดทดสอบใหม่ (แบบอ่านอย่างเดียว)', () => openQuestions(page, bank));
    await step('Expected: แสดงโจทย์ที่บันทึกไว้ ตัวเลือกครบ 5 ข้อ และ "เฉลย: ข้อ ข"', async () => {
      await expect(page.getByText(question).first()).toBeVisible({ timeout: 20_000 });
      for (const c of CHOICES) await expect(page.getByText(c, { exact: true }).first()).toBeVisible();
      await expect(page.getByText('เฉลย: ข้อ ข')).toBeVisible();
    });
  });

  // เคสนี้พบข้อบกพร่อง (ลบคำถามเดี่ยวแล้วไม่ถูกลบจากฐานข้อมูล) จึงวางไว้ท้ายกลุ่ม serial
  test('BANK-T12 กดลบคำถามเดี่ยวที่บันทึกแล้วและยืนยัน คำถามถูกลบออกจากชุดข้อสอบ', async ({ page }) => {
    await step('1. เปิดหน้าจัดการคำถามของชุดทดสอบ แล้วเปิดโหมดแก้ไข', () => openEditor(page, bank));
    await step('2. กดปุ่ม "ลบคำถามเดี่ยว" แล้วกด "ใช่, ลบเลย!"', async () => {
      // ปุ่มลบมุมขวาของการ์ดถูกสารบัญลอยทับ (ดู BANK-T17) จึงกดด้วยแป้นพิมพ์
      await page.getByRole('button', { name: 'ลบคำถามเดี่ยว' }).first().focus();
      await page.keyboard.press('Enter');
      await expect(swal(page).title).toHaveText('คุณแน่ใจหรือไม่?');
      await swal(page).confirm.click();
    });
    await step('Expected: คำถามหายจากหน้าแก้ไข', async () => {
      // กล่องแจ้งผลการลบ (ถ้ามี) — กดตกลงถ้ามีปุ่ม ไม่งั้นรอให้ปิดเอง
      const title = await swal(page).title.textContent({ timeout: 5_000 }).catch(() => null);
      test.info().annotations.push({ type: 'ข้อความหลังลบ', description: title ?? '(ไม่มีกล่องแจ้งผล)' });
      await swal(page).confirm.click({ timeout: 3_000 }).catch(() => {});
      await expect(swal(page).title).toHaveCount(0, { timeout: 15_000 });
      await expect(page.getByText(question)).toHaveCount(0);
    });
    await step('Expected: เปิดหน้าจัดการคำถามใหม่แล้วไม่พบโจทย์นี้ในชุดข้อสอบ', async () => {
      await openQuestions(page, bank);
      await expect(page.getByText(question)).toHaveCount(0);
    });
  });

});

// ─────────────────────────────────────────────────────────────────────────────
// แยกกลุ่มเพราะเคสนี้ล้มเหลวได้ตามที่พบ (สารบัญลอยทับปุ่ม) ไม่ให้กระทบเคสอื่น
test.describe('10.2 จัดการคำถามในชุดข้อสอบ: การวางปุ่มบนหน้าจอ', () => {
  const bank = uniqueTitle('ชุดตรวจปุ่ม');
  test.beforeAll(async ({ browser }) => {
    const page = await newAdminPage(browser);
    await openBanks(page);
    await createBank(page, bank);
    await expectCreated(page);
    await page.context().close();
  });
  test.afterAll(async ({ browser }) => {
    const page = await newAdminPage(browser);
    await purgeBank(page, bank).catch(() => {});
    await page.context().close();
  });

  test('BANK-T17 หน้าจัดการคำถามบนจอเดสก์ท็อป ปุ่ม "สร้าง" มุมขวาบนต้องกดได้ ไม่ถูกสารบัญลอยทับ', async ({ page }) => {
    await step('1. เปิดหน้าจัดการคำถามของชุดทดสอบ แล้วเปิดโหมดแก้ไข', () => openEditor(page, bank));
    await step('Expected: ปุ่ม "สร้าง" กดได้ (ไม่มีองค์ประกอบอื่นบังอยู่)', async () => {
      // trial: ตรวจว่าคลิกถึงปุ่มได้จริงโดยไม่กด — ถ้ามีอะไรบังอยู่จะล้มเหลว
      // (ตอนชุดมีคำถามแล้ว ปุ่ม "แก้ไขข้อมูล" ตำแหน่งเดียวกันก็ถูกทับเช่นกัน)
      await page.getByRole('button', { name: 'สร้างสถานการณ์หรือคำถามใหม่' }).click({ trial: true, timeout: 5_000 });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('10.3 ถังขยะคลังข้อสอบ: ลบ กู้คืน และลบถาวร', () => {
  test.describe.configure({ mode: 'serial' });
  const bank = uniqueTitle('ชุดถังขยะ');

  test.beforeAll(async ({ browser }) => {
    const page = await newAdminPage(browser);
    await openBanks(page);
    await createBank(page, bank);
    await expectCreated(page);
    await page.context().close();
  });
  test.afterAll(async ({ browser }) => {
    const page = await newAdminPage(browser);
    await purgeBank(page, bank).catch(() => {});
    await page.context().close();
  });

  test('BANK-T13 กดลบชุดข้อสอบแล้วกด "ยกเลิก" ชุดข้อสอบยังอยู่ในคลัง', async ({ page }) => {
    await step('1. ค้นหาชุดทดสอบ แล้วกดปุ่มลบ', async () => {
      await openBanks(page, { search: bank });
      await bankRow(page, bank).getByTitle(/ลบคลังข้อสอบ/).click();
    });
    await step('2. กด "ยกเลิก"', async () => {
      await expect(swal(page).title).toHaveText('ย้ายไปถังขยะ?');
      await swal(page).cancel.click();
    });
    await step('Expected: ชุดข้อสอบยังอยู่ในตาราง', () => expect(bankRow(page, bank)).toHaveCount(1));
  });

  test('BANK-T14 กดลบชุดข้อสอบแล้วยืนยัน ชุดย้ายไปแท็บที่ลบแล้ว', async ({ page }) => {
    await step('1. ค้นหาชุดทดสอบ กดปุ่มลบ แล้วกด "ใช่, ย้ายไปถังขยะ"', async () => {
      await openBanks(page, { search: bank });
      await bankRow(page, bank).getByTitle(/ลบคลังข้อสอบ/).click();
      await swal(page).confirm.click();
    });
    await step('Expected: แจ้ง "ย้ายไปถังขยะแล้ว!" ไม่อยู่ในคลังทั้งหมด และอยู่ในแท็บที่ลบแล้ว', async () => {
      await expect(swal(page).title).toHaveText('ย้ายไปถังขยะแล้ว!', { timeout: 15_000 });
      if (await swal(page).confirm.isVisible()) await swal(page).confirm.click();
      await openBanks(page, { search: bank });
      await expect(bankRow(page, bank)).toHaveCount(0);
      await openBanks(page, { deleted: true, search: bank });
      await expect(bankRow(page, bank)).toHaveCount(1);
    });
  });

  test('BANK-T15 กดกู้คืนชุดข้อสอบจากแท็บที่ลบแล้ว ชุดกลับมาอยู่ในคลังทั้งหมด', async ({ page }) => {
    await step('1. เปิดแท็บที่ลบแล้ว ค้นหาชุดทดสอบ แล้วกดกู้คืนและยืนยัน', async () => {
      await openBanks(page, { deleted: true, search: bank });
      await bankRow(page, bank).getByTitle('กู้คืนคลังข้อสอบ').click();
      await expect(swal(page).title).toHaveText('ยืนยันการกู้คืน?');
      await swal(page).confirm.click();
    });
    await step('Expected: แจ้ง "กู้คืนสำเร็จ!" และชุดกลับมาอยู่ในคลังทั้งหมด', async () => {
      await expect(swal(page).title).toHaveText('กู้คืนสำเร็จ!', { timeout: 15_000 });
      if (await swal(page).confirm.isVisible()) await swal(page).confirm.click();
      await openBanks(page, { search: bank });
      await expect(bankRow(page, bank)).toHaveCount(1);
    });
  });

  test('BANK-T16 ลบชุดข้อสอบถาวรจากแท็บที่ลบแล้ว ชุดหายจากทั้งสองแท็บ', async ({ page }) => {
    await step('1. ย้ายชุดทดสอบไปถังขยะ', async () => {
      await openBanks(page, { search: bank });
      await bankRow(page, bank).getByTitle(/ลบคลังข้อสอบ/).click();
      await swal(page).confirm.click();
      await expect(swal(page).title).toHaveText('ย้ายไปถังขยะแล้ว!', { timeout: 15_000 });
    });
    await step('2. เปิดแท็บที่ลบแล้ว กด "ลบออกจากระบบอย่างถาวร" แล้วกด "ลบถาวร"', async () => {
      await openBanks(page, { deleted: true, search: bank });
      await bankRow(page, bank).getByTitle('ลบออกจากระบบอย่างถาวร').click();
      await expect(swal(page).title).toHaveText('ยืนยันลบถาวร?');
      await swal(page).confirm.click();
    });
    await step('Expected: แจ้ง "ลบถาวรสำเร็จ!" และค้นหาไม่พบทั้งในคลังทั้งหมดและแท็บที่ลบแล้ว', async () => {
      await expect(swal(page).title).toHaveText('ลบถาวรสำเร็จ!', { timeout: 15_000 });
      if (await swal(page).confirm.isVisible()) await swal(page).confirm.click();
      await openBanks(page, { deleted: true, search: bank });
      await expect(bankRow(page, bank)).toHaveCount(0);
      await openBanks(page, { search: bank });
      await expect(bankRow(page, bank)).toHaveCount(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// เก็บกวาดชุดข้อสอบทดสอบ "E2E-" ที่อาจค้างจากรอบก่อน (ทั้งที่ใช้งานอยู่และในถังขยะ)
test.afterAll(async ({ browser }) => {
  const page = await newAdminPage(browser);
  const names = async (deleted: boolean) => {
    await openBanks(page, { deleted, search: 'E2E-' });
    return page.locator('tbody tr div.text-sm.font-medium.text-gray-900').allTextContents();
  };
  for (const name of new Set([...(await names(false)), ...(await names(true))])) {
    if (name.startsWith('E2E-')) await purgeBank(page, name.trim()).catch(() => {});
  }
  await page.context().close();
});
