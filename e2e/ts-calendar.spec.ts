import { test, expect, type Page } from '@playwright/test';
import {
  RUN_ID, uniqueTitle, inputDate, inputDateThisMonth, thaiDate, thaiMonthHeader,
  swal, files, XSS_PAYLOAD, expectNoXss, newAdminPage,
} from './helpers';

/**
 * Test Scenario: จัดการปฏิทินกำหนดการ (ผู้ดูแลระบบ) — Black Box Testing
 *
 * ทุกเคสทำผ่านหน้าเว็บและตรวจผลจากสิ่งที่แสดงบนหน้าจอเท่านั้น
 * ชื่อเทสต์ขึ้นต้นด้วย Test ID ตามตารางในเล่ม ส่วน test.step คือขั้นตอนในคอลัมน์ Test Action
 * ข้อมูลทดสอบทุกชิ้นชื่อขึ้นต้นด้วย "E2E-" และถูกลบผ่านหน้าเว็บตอนจบ
 */

const LIST_URL = '/admin/manage_calendar';
const ADD_URL = '/admin/manage_calendar/calendar_add';
const step = test.step;

// ─── การทำงานบนหน้าจอที่ใช้ซ้ำ ────────────────────────────────────────────────
interface ScheduleForm {
  title: string;
  start: string;
  end?: string;
  desc?: string;
  link?: string;
  types?: string[];
}

/** ช่องกรอกของการ์ดกำหนดการลำดับที่ n (เริ่มที่ 1) ในหน้าเพิ่มกำหนดการ */
const card = (page: Page, n: number) => ({
  box: page.locator('div.space-y-5 > div.bg-white').nth(n - 1),
  title: page.getByLabel(`ชื่อกำหนดการ รายการที่ ${n}`, { exact: true }),
  start: page.getByLabel(`วันเริ่มต้น รายการที่ ${n}`, { exact: true }),
  end: page.getByLabel(`วันสิ้นสุด รายการที่ ${n}`, { exact: true }),
  desc: page.getByLabel(`รายละเอียดเพิ่มเติม รายการที่ ${n}`, { exact: true }),
  link: page.getByLabel(`แนบลิงก์ หรือเอกสารอ้างอิง รายการที่ ${n}`, { exact: true }),
});

async function fillCard(page: Page, n: number, f: ScheduleForm) {
  const c = card(page, n);
  await c.title.fill(f.title);
  await c.start.fill(f.start);
  if (f.end) await c.end.fill(f.end);
  if (f.desc) await c.desc.fill(f.desc);
  if (f.link) await c.link.fill(f.link);
  for (const t of f.types ?? []) await c.box.getByRole('button', { name: `${t} ไม่ได้เลือก` }).click();
}

const saveButton = (page: Page, publish: boolean) =>
  page.getByRole('button', { name: publish ? 'บันทึกและเผยแพร่' : 'บันทึกร่าง' });

/** เพิ่มกำหนดการผ่านหน้า "เพิ่มกำหนดการใหม่" (ใช้เตรียมข้อมูลก่อนทดสอบ) */
async function addSchedules(page: Page, items: ScheduleForm[], publish = true) {
  await page.goto(ADD_URL);
  for (let i = 0; i < items.length; i++) {
    if (i > 0) {
      await page.getByRole('button', { name: 'เพิ่มช่องใหม่' }).click();
      await expect(card(page, i + 1).title).toBeVisible();
    }
    await fillCard(page, i + 1, items[i]);
  }
  await saveButton(page, publish).click();
  await expectSavedAndBackToList(page);
}

async function expectSavedAndBackToList(page: Page) {
  await expect(swal(page).title).toHaveText('สำเร็จ', { timeout: 20_000 });
  await page.waitForURL(new RegExp(`${LIST_URL}$`), { timeout: 20_000 });
}

/** เปิดหน้าจัดการกำหนดการ แท็บ "รายการ" และค้นหา */
async function openList(page: Page, search?: string) {
  await page.goto(LIST_URL);
  await expect(page.getByRole('heading', { name: 'จัดการกำหนดการปฏิทิน' })).toBeVisible();
  await page.getByRole('button', { name: 'รายการ', exact: true }).click();
  if (search !== undefined) {
    const box = page.getByLabel('ค้นหากำหนดการ');
    await box.fill(search);
    // ช่องค้นหาแสดงคำแนะนำทับรายการด้านล่าง กด Esc ปิดก่อนทำขั้นถัดไป
    await box.press('Escape');
  }
}

/** แถวของกำหนดการในแท็บรายการ */
const row = (page: Page, title: string) =>
  page.locator('div.px-6.py-5').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
const allRows = (page: Page) => page.locator('div.px-6.py-5');
const notFound = (page: Page) => page.getByText('ไม่พบข้อมูลกำหนดการ');

/** ไปค้นหาในหน้ารายการแล้วตรวจว่าไม่มีกำหนดการชื่อนี้ */
async function expectNotInList(page: Page, title: string) {
  await page.waitForTimeout(3000); // เผื่อระบบกำลังบันทึกอยู่
  await openList(page, title);
  await expect(notFound(page)).toBeVisible();
}

/** สร้างกำหนดการ 1 รายการ แล้วเปิดหน้าต่างแก้ไขของรายการนั้น */
async function openEditOf(page: Page, label: string) {
  const title = uniqueTitle(label);
  await addSchedules(page, [{ title, start: inputDate(10), end: inputDate(11), types: ['PLE-CC1'] }]);
  await openList(page, title);
  await page.getByLabel(`แก้ไขกำหนดการ ${title}`).click();
  await expect(page.getByRole('heading', { name: 'แก้ไขกำหนดการ' })).toBeVisible();
  return title;
}

// ─── ข้อมูลตั้งต้น (สร้างผ่านหน้าเว็บ) และการล้างข้อมูลตอนจบ ──────────────────
const SEED = `SEED${RUN_ID}`;
const pubTitle = uniqueTitle(`${SEED}-เปิดรับสมัครสอบ`);
const draftTitle = uniqueTitle(`${SEED}-ประกาศผลสอบ`);

test.beforeAll(async ({ browser }) => {
  const page = await newAdminPage(browser);
  await addSchedules(page, [{
    title: pubTitle, start: inputDateThisMonth(10), end: inputDateThisMonth(12),
    desc: 'กำหนดการทดสอบ (เผยแพร่)', types: ['PLE-CC1'],
  }], true);
  await addSchedules(page, [{
    title: draftTitle, start: inputDateThisMonth(15), end: inputDateThisMonth(15),
    desc: 'กำหนดการทดสอบ (แบบร่าง)', types: ['PLE-CC2'],
  }], false);
  await page.context().close();
});

/** ล้างข้อมูลทดสอบ: ค้นหา "E2E-" แล้วกด "ลบทั้งหมด" ซึ่งลบเฉพาะรายการที่ค้นหาเจอ */
test.afterAll(async ({ browser }) => {
  const page = await newAdminPage(browser);
  await openList(page, 'E2E-');
  const count = await allRows(page).count();
  if (count > 0) {
    await page.getByRole('button', { name: 'ลบทั้งหมด' }).click();
    await expect(swal(page).title).toHaveText(`ยืนยันลบ ${count} รายการ?`);
    await swal(page).confirm.click();
    await expect(swal(page).title).toHaveText('สำเร็จ');
  }
  await page.context().close();
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('1.1 การแสดงกำหนดการในรูปแบบปฏิทินและรายการ', () => {
  test('CAL-T01 เปิดหน้าจัดการกำหนดการ แสดงปฏิทินเดือนปัจจุบัน', async ({ page }) => {
    await step('1. เปิดหน้าจัดการกำหนดการ', () => page.goto(LIST_URL));
    await step('Expected: แสดงหัวข้อหน้า ชื่อเดือนปัจจุบัน และวันในสัปดาห์ครบ 7 วัน', async () => {
      await expect(page.getByRole('heading', { name: 'จัดการกำหนดการปฏิทิน' })).toBeVisible();
      await expect(page.getByRole('heading', { name: thaiMonthHeader(0) })).toBeVisible();
      for (const d of ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.']) {
        await expect(page.getByText(d, { exact: true })).toBeVisible();
      }
    });
  });

  test('CAL-T02 กดแท็บ "รายการ" แสดงกำหนดการเป็นรายการพร้อมสถานะ', async ({ page }) => {
    await step('1. เปิดหน้าจัดการกำหนดการ  2. กดแท็บ "รายการ"', () => openList(page, SEED));
    await step('Expected: แสดงกำหนดการพร้อมป้าย "เผยแพร่" และ "แบบร่าง"', async () => {
      await expect(row(page, pubTitle).getByText('เผยแพร่', { exact: true })).toBeVisible();
      await expect(row(page, draftTitle).getByText('แบบร่าง', { exact: true })).toBeVisible();
    });
  });

  test('CAL-T03 คลิกกำหนดการในปฏิทิน เปิดหน้าต่างแก้ไขพร้อมข้อมูลเดิม', async ({ page }) => {
    await step('1. เปิดหน้าจัดการกำหนดการ', () => page.goto(LIST_URL));
    await step('2. ค้นหาชื่อกำหนดการ', () => page.getByLabel('ค้นหากำหนดการ').fill(pubTitle));
    await step('3. คลิกกำหนดการในช่องวันที่ของปฏิทิน', () => page.locator(`span[title="${pubTitle}"]`).first().click());
    await step('Expected: เปิดหน้าต่าง "แก้ไขกำหนดการ" และแสดงชื่อเดิม', async () => {
      await expect(page.getByRole('heading', { name: 'แก้ไขกำหนดการ' })).toBeVisible();
      await expect(page.getByLabel('ชื่อกำหนดการ', { exact: true })).toHaveValue(pubTitle);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('1.2 การเลื่อนดูปฏิทินรายเดือน', () => {
  test('CAL-T04 กดปุ่มเดือนก่อนหน้า แสดงปฏิทินเดือนที่แล้ว', async ({ page }) => {
    await page.goto(LIST_URL);
    await step('1. กดปุ่ม "<" (เดือนก่อนหน้า)', () => page.getByLabel('เดือนก่อนหน้า').click());
    await step(`Expected: แสดง "${thaiMonthHeader(-1)}"`, () =>
      expect(page.getByRole('heading', { name: thaiMonthHeader(-1) })).toBeVisible());
  });

  test('CAL-T05 กดปุ่มเดือนถัดไป แสดงปฏิทินเดือนหน้า', async ({ page }) => {
    await page.goto(LIST_URL);
    await step('1. กดปุ่ม ">" (เดือนถัดไป)', () => page.getByLabel('เดือนถัดไป').click());
    await step(`Expected: แสดง "${thaiMonthHeader(1)}"`, () =>
      expect(page.getByRole('heading', { name: thaiMonthHeader(1) })).toBeVisible());
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('1.3 การค้นหากำหนดการ', () => {
  test('CAL-T06 ค้นหาด้วยคำที่มีอยู่ แสดงเฉพาะกำหนดการที่ตรงกัน', async ({ page }) => {
    await step(`1. แท็บรายการ  2. ค้นหา "${SEED}"`, () => openList(page, SEED));
    await step('Expected: แสดง 2 รายการที่ตรงกับคำค้น', async () => {
      await expect(allRows(page)).toHaveCount(2);
      await expect(page.getByText('· 2 รายการ')).toBeVisible();
    });
  });

  test('CAL-T07 ค้นหาด้วยคำที่ไม่มีในระบบ แสดง "ไม่พบข้อมูลกำหนดการ"', async ({ page }) => {
    await step('1. แท็บรายการ  2. ค้นหาคำที่ไม่มีในระบบ', () => openList(page, `ไม่มีคำนี้แน่นอน-${RUN_ID}`));
    await step('Expected: แสดง "ไม่พบข้อมูลกำหนดการ"', () => expect(notFound(page)).toBeVisible());
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('1.4 การกรองกำหนดการตามสถานะและประเภทหลักสูตร', () => {
  test('CAL-T08 กรองสถานะ "เผยแพร่แล้ว" แสดงเฉพาะที่เผยแพร่', async ({ page }) => {
    await openList(page, SEED);
    await step('1. เลือกสถานะ = เผยแพร่แล้ว', () => page.getByLabel('กรองตามสถานะกำหนดการ').selectOption('published'));
    await step('Expected: แสดงเฉพาะกำหนดการที่เผยแพร่', async () => {
      await expect(row(page, pubTitle)).toBeVisible();
      await expect(row(page, draftTitle)).toHaveCount(0);
    });
  });

  test('CAL-T09 กรองสถานะ "แบบร่าง" แสดงเฉพาะแบบร่าง', async ({ page }) => {
    await openList(page, SEED);
    await step('1. เลือกสถานะ = แบบร่าง', () => page.getByLabel('กรองตามสถานะกำหนดการ').selectOption('draft'));
    await step('Expected: แสดงเฉพาะกำหนดการแบบร่าง', async () => {
      await expect(row(page, draftTitle)).toBeVisible();
      await expect(row(page, pubTitle)).toHaveCount(0);
    });
  });

  test('CAL-T10 กรองประเภท "PLE-CC2" แสดงเฉพาะประเภทนั้น', async ({ page }) => {
    await openList(page, SEED);
    await step('1. เลือกประเภท = PLE-CC2', () => page.getByLabel('กรองตามประเภทกำหนดการ').selectOption('PLE-CC2'));
    await step('Expected: แสดงเฉพาะกำหนดการประเภท PLE-CC2', async () => {
      await expect(row(page, draftTitle)).toBeVisible();
      await expect(row(page, pubTitle)).toHaveCount(0);
    });
  });

  test('CAL-T11 กรองสถานะและประเภทพร้อมกันแบบไม่มีข้อมูลตรง แสดง "ไม่พบข้อมูลกำหนดการ"', async ({ page }) => {
    await openList(page, SEED);
    await step('1. เลือกสถานะ = เผยแพร่แล้ว  2. เลือกประเภท = PLE-CC2', async () => {
      await page.getByLabel('กรองตามสถานะกำหนดการ').selectOption('published');
      await page.getByLabel('กรองตามประเภทกำหนดการ').selectOption('PLE-CC2');
    });
    await step('Expected: แสดง "ไม่พบข้อมูลกำหนดการ"', () => expect(notFound(page)).toBeVisible());
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('1.5 การเพิ่มกำหนดการ', () => {
  test('CAL-T12 กรอกข้อมูลครบถ้วนแล้วกด "บันทึกและเผยแพร่" บันทึกสำเร็จ', async ({ page }) => {
    const title = uniqueTitle('เพิ่ม-ครบ');
    const link = 'https://www.pharmacycouncil.org';
    await page.goto(ADD_URL);
    await step(`1. กรอกชื่อ วันเริ่ม ${thaiDate(7)} วันสิ้นสุด ${thaiDate(9)} รายละเอียด ลิงก์ และเลือก PLE-CC1`, () =>
      fillCard(page, 1, { title, start: inputDate(7), end: inputDate(9), desc: 'รับสมัครสอบ รอบที่ 1', link, types: ['PLE-CC1'] }));
    await step('2. กดปุ่ม "บันทึกและเผยแพร่"', () => saveButton(page, true).click());
    await step('Expected: แจ้ง "สำเร็จ" และกลับหน้ารายการ', () => expectSavedAndBackToList(page));
    await step('Expected: รายการแสดงสถานะ วันที่ ประเภท และลิงก์ถูกต้อง', async () => {
      await openList(page, title);
      const r = row(page, title);
      await expect(r.getByText('เผยแพร่', { exact: true })).toBeVisible();
      await expect(r).toContainText(`${thaiDate(7)} – ${thaiDate(9)}`);
      await expect(r.getByText('PLE-CC1', { exact: true })).toBeVisible();
      await expect(r.getByRole('link', { name: 'ลิงก์แนบ' })).toHaveAttribute('href', link);
    });
  });

  test('CAL-T13 กด "บันทึกร่าง" บันทึกเป็นแบบร่าง (ไม่เผยแพร่)', async ({ page }) => {
    const title = uniqueTitle('เพิ่ม-ร่าง');
    await page.goto(ADD_URL);
    await step('1. กรอกชื่อและวันเริ่มต้น', () => fillCard(page, 1, { title, start: inputDate(5) }));
    await step('2. กดปุ่ม "บันทึกร่าง"', () => saveButton(page, false).click());
    await step('Expected: บันทึกสำเร็จ และรายการแสดงป้าย "แบบร่าง"', async () => {
      await expectSavedAndBackToList(page);
      await openList(page, title);
      await expect(row(page, title).getByText('แบบร่าง', { exact: true })).toBeVisible();
    });
  });

  test('CAL-T14 ไม่กรอกวันสิ้นสุด ระบบใช้วันเริ่มต้นเป็นวันสิ้นสุด', async ({ page }) => {
    const title = uniqueTitle('เพิ่ม-ไม่มีวันสิ้นสุด');
    await page.goto(ADD_URL);
    await step(`1. กรอกชื่อ และวันเริ่ม ${thaiDate(3)} (ไม่กรอกวันสิ้นสุด)`, () => fillCard(page, 1, { title, start: inputDate(3) }));
    await step('2. กดปุ่ม "บันทึกและเผยแพร่"', () => saveButton(page, true).click());
    await step(`Expected: บันทึกสำเร็จ และแสดงช่วงวันที่ ${thaiDate(3)} – ${thaiDate(3)}`, async () => {
      await expectSavedAndBackToList(page);
      await openList(page, title);
      await expect(row(page, title)).toContainText(`${thaiDate(3)} – ${thaiDate(3)}`);
    });
  });

  test('CAL-T15 เลือกประเภทหลักสูตรมากกว่า 1 ประเภท บันทึกครบทุกประเภท', async ({ page }) => {
    const title = uniqueTitle('เพิ่ม-หลายประเภท');
    await page.goto(ADD_URL);
    await step('1. กรอกชื่อ วันเริ่ม และเลือก PLE-CC1 กับ PLE-CC2', () =>
      fillCard(page, 1, { title, start: inputDate(4), types: ['PLE-CC1', 'PLE-CC2'] }));
    await step('2. กดปุ่ม "บันทึกและเผยแพร่"', () => saveButton(page, true).click());
    await step('Expected: รายการแสดงป้ายประเภท PLE-CC1 และ PLE-CC2', async () => {
      await expectSavedAndBackToList(page);
      await openList(page, title);
      await expect(row(page, title).getByText('PLE-CC1', { exact: true })).toBeVisible();
      await expect(row(page, title).getByText('PLE-CC2', { exact: true })).toBeVisible();
    });
  });

  test('CAL-T16 ชื่อกำหนดการมีโค้ด HTML/Script แสดงเป็นข้อความ ไม่ถูกรัน (XSS)', async ({ page }) => {
    const title = uniqueTitle(`XSS${XSS_PAYLOAD}`);
    await page.goto(ADD_URL);
    await step(`1. กรอกชื่อ = ${XSS_PAYLOAD} และวันเริ่มต้น`, () => fillCard(page, 1, { title, start: inputDate(2) }));
    await step('2. กดปุ่ม "บันทึกและเผยแพร่"', () => saveButton(page, true).click());
    await step('Expected: แสดงชื่อเป็นข้อความตามที่กรอก และโค้ดไม่ถูกรัน', async () => {
      await expectSavedAndBackToList(page);
      await openList(page, 'XSS');
      await expect(row(page, title)).toBeVisible();
      await expectNoXss(page);
    });
  });

  test('CAL-T17 ไม่กรอกชื่อกำหนดการ แจ้งเตือน "ไม่มีข้อมูล"', async ({ page }) => {
    await page.goto(ADD_URL);
    await step('1. กรอกเฉพาะวันเริ่มต้น (ไม่กรอกชื่อ)', () => card(page, 1).start.fill(inputDate(1)));
    await step('2. กดปุ่ม "บันทึกและเผยแพร่"', () => saveButton(page, true).click());
    await step('Expected: แจ้งเตือน "ไม่มีข้อมูล" และอยู่หน้าเดิม', async () => {
      await expect(swal(page).title).toHaveText('ไม่มีข้อมูล');
      await expect(page).toHaveURL(new RegExp(ADD_URL));
    });
  });

  test('CAL-T18 ชื่อกำหนดการเป็นช่องว่างล้วน แจ้งเตือน "ไม่มีข้อมูล"', async ({ page }) => {
    await page.goto(ADD_URL);
    await step('1. กรอกชื่อเป็นช่องว่าง 5 ตัว และวันเริ่มต้น', () => fillCard(page, 1, { title: '     ', start: inputDate(1) }));
    await step('2. กดปุ่ม "บันทึกและเผยแพร่"', () => saveButton(page, true).click());
    await step('Expected: แจ้งเตือน "ไม่มีข้อมูล"', () => expect(swal(page).title).toHaveText('ไม่มีข้อมูล'));
  });

  test('CAL-T19 ไม่กรอกวันเริ่มต้นแล้วกดเผยแพร่ แจ้งเตือน "ข้อมูลไม่ครบ"', async ({ page }) => {
    const title = uniqueTitle('เพิ่ม-ไม่มีวันเริ่ม');
    await page.goto(ADD_URL);
    await step('1. กรอกเฉพาะชื่อกำหนดการ (ไม่กรอกวันเริ่มต้น)', () => card(page, 1).title.fill(title));
    await step('2. กดปุ่ม "บันทึกและเผยแพร่"', () => saveButton(page, true).click());
    await step('Expected: แจ้งเตือน "ข้อมูลไม่ครบ" และไม่มีกำหนดการนี้ในรายการ', async () => {
      await expect(swal(page).title).toHaveText('ข้อมูลไม่ครบ');
      await expectNotInList(page, title);
    });
  });

  test('CAL-T20 วันสิ้นสุดอยู่ก่อนวันเริ่มต้น ระบบต้องแจ้งเตือนและไม่บันทึก', async ({ page }) => {
    const title = uniqueTitle('เพิ่ม-วันสิ้นสุดก่อนวันเริ่ม');
    await page.goto(ADD_URL);
    await step(`1. กรอกชื่อ วันเริ่ม ${thaiDate(10)} วันสิ้นสุด ${thaiDate(5)}`, () =>
      fillCard(page, 1, { title, start: inputDate(10), end: inputDate(5) }));
    await step('2. กดปุ่ม "บันทึกและเผยแพร่"', () => saveButton(page, true).click());
    await step('Expected: ไม่มีกำหนดการนี้ในรายการ', () => expectNotInList(page, title));
  });

  test('CAL-T21 ลิงก์แนบผิดรูปแบบ ระบบต้องแจ้งเตือนและไม่บันทึก', async ({ page }) => {
    const title = uniqueTitle('เพิ่ม-ลิงก์ผิดรูปแบบ');
    await page.goto(ADD_URL);
    await step('1. กรอกชื่อ วันเริ่ม และลิงก์ = "ไม่ใช่ลิงก์ abc"', () =>
      fillCard(page, 1, { title, start: inputDate(6), link: 'ไม่ใช่ลิงก์ abc' }));
    await step('2. กดปุ่ม "บันทึกและเผยแพร่"', () => saveButton(page, true).click());
    await step('Expected: ไม่มีกำหนดการนี้ในรายการ', () => expectNotInList(page, title));
  });

  test('CAL-T22 ชื่อซ้ำกับกำหนดการที่มีอยู่ ระบบแจ้งเตือนและไม่บันทึกซ้ำ', async ({ page }) => {
    await page.goto(ADD_URL);
    await step('1. กรอกชื่อซ้ำกับกำหนดการที่มีอยู่แล้ว และวันเริ่มต้น', () =>
      fillCard(page, 1, { title: pubTitle, start: inputDate(1) }));
    await step('2. กดปุ่ม "บันทึกและเผยแพร่"', () => saveButton(page, true).click());
    await step('Expected: แจ้งเตือน "เกิดข้อผิดพลาด" และในรายการยังมีชื่อนี้เพียง 1 รายการ', async () => {
      await expect(swal(page).title).toHaveText('เกิดข้อผิดพลาด');
      await openList(page, pubTitle);
      await expect(allRows(page)).toHaveCount(1);
    });
  });

  test('CAL-T23 กด "เพิ่มช่องใหม่" เพิ่มฟอร์มกำหนดการเป็น 2 รายการ', async ({ page }) => {
    await page.goto(ADD_URL);
    await step('1. กดปุ่ม "เพิ่มช่องใหม่"', () => page.getByRole('button', { name: 'เพิ่มช่องใหม่' }).click());
    await step('Expected: มีฟอร์ม 2 รายการ และแสดง "ทั้งหมด 2 รายการ"', async () => {
      await expect(card(page, 2).title).toBeVisible();
      await expect(page.getByText('ทั้งหมด 2 รายการ')).toBeVisible();
    });
  });

  test('CAL-T24 กดปุ่มลบช่อง ลดฟอร์มกลับเหลือ 1 รายการ', async ({ page }) => {
    await page.goto(ADD_URL);
    await step('1. กดปุ่ม "เพิ่มช่องใหม่"', () => page.getByRole('button', { name: 'เพิ่มช่องใหม่' }).click());
    await step('2. กดปุ่ม X ของรายการที่ 2', () => page.getByLabel('ลบกำหนดการรายการที่ 2').click());
    await step('Expected: เหลือฟอร์ม 1 รายการ', async () => {
      await expect(card(page, 2).title).toHaveCount(0);
      await expect(page.getByText('ทั้งหมด 1 รายการ')).toBeVisible();
    });
  });

  test('CAL-T25 มี 2 รายการแต่รายการที่ 2 ไม่มีชื่อ กด "ดำเนินการต่อ" บันทึกเฉพาะรายการที่สมบูรณ์', async ({ page }) => {
    const title = uniqueTitle('เพิ่ม-ข้ามรายการว่าง');
    await page.goto(ADD_URL);
    await step('1. กรอกรายการที่ 1 ครบ  2. กด "เพิ่มช่องใหม่" (รายการที่ 2 เว้นว่าง)', async () => {
      await fillCard(page, 1, { title, start: inputDate(8) });
      await page.getByRole('button', { name: 'เพิ่มช่องใหม่' }).click();
      await expect(card(page, 2).title).toBeVisible();
    });
    await step('3. กด "บันทึกและเผยแพร่"  4. กด "ดำเนินการต่อ"', async () => {
      await saveButton(page, true).click();
      await expect(swal(page).title).toHaveText('พบข้อมูลไม่ครบ');
      await swal(page).confirm.click();
    });
    await step('Expected: บันทึกสำเร็จ และรายการที่ 1 อยู่ในรายการ', async () => {
      await expectSavedAndBackToList(page);
      await openList(page, title);
      await expect(row(page, title)).toBeVisible();
    });
  });

  test('CAL-T26 มี 2 รายการแต่รายการที่ 2 ไม่มีชื่อ กด "ยกเลิก" ไม่บันทึกและอยู่หน้าเดิม', async ({ page }) => {
    const title = uniqueTitle('เพิ่ม-ยกเลิกรายการว่าง');
    await page.goto(ADD_URL);
    await step('1. กรอกรายการที่ 1 ครบ  2. กด "เพิ่มช่องใหม่" (รายการที่ 2 เว้นว่าง)', async () => {
      await fillCard(page, 1, { title, start: inputDate(8) });
      await page.getByRole('button', { name: 'เพิ่มช่องใหม่' }).click();
      await expect(card(page, 2).title).toBeVisible();
    });
    await step('3. กด "บันทึกและเผยแพร่"  4. กด "ยกเลิก"', async () => {
      await saveButton(page, true).click();
      await expect(swal(page).title).toHaveText('พบข้อมูลไม่ครบ');
      await swal(page).cancel.click();
    });
    await step('Expected: อยู่หน้าเดิม ข้อมูลที่กรอกยังอยู่ และไม่มีกำหนดการนี้ในรายการ', async () => {
      await expect(page).toHaveURL(new RegExp(ADD_URL));
      await expect(card(page, 1).title).toHaveValue(title);
      await expectNotInList(page, title);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('1.6 การเพิ่มกำหนดการจากไฟล์ PDF', () => {
  // AI ใช้เวลาประมวลผลนาน จึงให้เวลาเคสกลุ่มนี้มากกว่าปกติ
  test.describe.configure({ timeout: 180_000 });
  const aiButton = (page: Page) => page.getByRole('button', { name: 'ประมวลผลด้วย AI' });
  const pdfInput = (page: Page) => page.getByLabel('อัปโหลดไฟล์ PDF กำหนดการ');
  /** รอกล่อง "AI กำลังประมวลผล..." ขึ้นแล้วหายไป */
  async function waitAiDone(page: Page) {
    await expect(swal(page).title).toHaveText('AI กำลังประมวลผล...');
    // รอให้กล่องประมวลผลหายไป (ใช้ toHaveCount เพราะ not.toHaveText ล้มเมื่อไม่มีกล่องใดเหลืออยู่เลย)
    await expect(page.locator('.swal2-title', { hasText: 'AI กำลังประมวลผล...' })).toHaveCount(0, { timeout: 150_000 });
  }

  test('CAL-T27 ยังไม่เลือกไฟล์ ปุ่ม "ประมวลผลด้วย AI" กดไม่ได้', async ({ page }) => {
    await step('1. เปิดหน้าเพิ่มกำหนดการ (ยังไม่เลือกไฟล์)', () => page.goto(ADD_URL));
    await step('Expected: ปุ่ม "ประมวลผลด้วย AI" กดไม่ได้', () => expect(aiButton(page)).toBeDisabled());
  });

  test('CAL-T28 เลือกไฟล์ PDF ตารางสอบแล้วกดประมวลผล ระบบเติมกำหนดการลงฟอร์ม', async ({ page }) => {
    await page.goto(ADD_URL);
    await step(`1. เลือกไฟล์ ${files.schedulePdf.name}`, () => pdfInput(page).setInputFiles(files.schedulePdf));
    await step('2. กดปุ่ม "ประมวลผลด้วย AI"', async () => {
      await expect(page.getByText(files.schedulePdf.name)).toBeVisible();
      await aiButton(page).click();
    });
    await step('Expected: ฟอร์มถูกเติมชื่อและวันเริ่มต้นของกำหนดการจากไฟล์', async () => {
      await expect(card(page, 1).title).not.toHaveValue('', { timeout: 150_000 });
      await expect(card(page, 1).start).not.toHaveValue('');
    });
  });

  test('CAL-T29 เลือกไฟล์ที่ไม่ใช่ PDF ระบบแจ้งเตือนและไม่เติมข้อมูล', async ({ page }) => {
    await page.goto(ADD_URL);
    await step(`1. เลือกไฟล์ ${files.txt.name}`, () => pdfInput(page).setInputFiles(files.txt));
    await step('2. กดปุ่ม "ประมวลผลด้วย AI"', () => aiButton(page).click());
    await step('Expected: แจ้งเตือน "ผิดพลาด" และฟอร์มยังว่าง', async () => {
      await expect(swal(page).title).toHaveText('ผิดพลาด');
      await expect(card(page, 1).title).toHaveValue('');
    });
  });

  test('CAL-T30 เลือก PDF ที่ไม่มีข้อมูลกำหนดการ ระบบแจ้งเตือนและฟอร์มยังอยู่', async ({ page }) => {
    await page.goto(ADD_URL);
    await step(`1. เลือกไฟล์ ${files.emptyPdf.name} (ไม่มีกำหนดการในไฟล์)`, () => pdfInput(page).setInputFiles(files.emptyPdf));
    await step('2. กดปุ่ม "ประมวลผลด้วย AI"', () => aiButton(page).click());
    await step('Expected: แจ้งเตือนว่าไม่พบข้อมูล และยังมีฟอร์มให้กรอกเอง', async () => {
      await waitAiDone(page);
      await expect(swal(page).title).toBeVisible();
      await expect(card(page, 1).title).toBeVisible();
    });
  });

  test('CAL-T31 แก้ไขข้อมูลที่ AI ดึงมาแล้วบันทึก บันทึกตามที่แก้ไข', async ({ page }) => {
    const edited = uniqueTitle('PDF-แก้ไขแล้ว');
    await page.goto(ADD_URL);
    await step(`1. เลือกไฟล์ ${files.schedulePdf.name}  2. กด "ประมวลผลด้วย AI"`, async () => {
      await pdfInput(page).setInputFiles(files.schedulePdf);
      await aiButton(page).click();
      await expect(card(page, 1).title).not.toHaveValue('', { timeout: 150_000 });
    });
    await step('3. ลบรายการอื่นให้เหลือรายการแรก  4. แก้ชื่อรายการแรก', async () => {
      for (let n = await page.getByLabel(/^ชื่อกำหนดการ รายการที่ \d+$/).count(); n > 1; n--) {
        await page.getByLabel(`ลบกำหนดการรายการที่ ${n}`).click();
      }
      await card(page, 1).title.fill(edited);
      if (!(await card(page, 1).start.inputValue())) await card(page, 1).start.fill(inputDate(12));
    });
    await step('5. กดปุ่ม "บันทึกและเผยแพร่"', () => saveButton(page, true).click());
    await step('Expected: บันทึกสำเร็จด้วยชื่อที่แก้ไข', async () => {
      await expectSavedAndBackToList(page);
      await openList(page, edited);
      await expect(row(page, edited)).toBeVisible();
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('1.7 การแก้ไขกำหนดการ', () => {
  const editField = (page: Page, label: string) => page.getByLabel(label, { exact: true });
  const saveEdit = (page: Page) => page.getByRole('button', { name: 'บันทึกการแก้ไข' });
  const editHeading = (page: Page) => page.getByRole('heading', { name: 'แก้ไขกำหนดการ' });

  test('CAL-T32 แก้ไขชื่อกำหนดการ บันทึกสำเร็จและแสดงชื่อใหม่', async ({ page }) => {
    await step('1. กดปุ่ม "แก้ไข" ของกำหนดการ', () => openEditOf(page, 'แก้ไข-ชื่อ'));
    const newTitle = uniqueTitle('แก้ไข-ชื่อใหม่');
    await step('2. แก้ชื่อกำหนดการ  3. กด "บันทึกการแก้ไข"', async () => {
      await editField(page, 'ชื่อกำหนดการ').fill(newTitle);
      await saveEdit(page).click();
    });
    await step('Expected: แจ้ง "บันทึกสำเร็จ" และรายการแสดงชื่อใหม่', async () => {
      await expect(swal(page).title).toHaveText('บันทึกสำเร็จ');
      await openList(page, newTitle);
      await expect(row(page, newTitle)).toBeVisible();
    });
  });

  test('CAL-T33 ลบชื่อกำหนดการจนว่าง ระบบไม่ให้บันทึก', async ({ page }) => {
    let title = '';
    await step('1. กดปุ่ม "แก้ไข" ของกำหนดการ', async () => { title = await openEditOf(page, 'แก้ไข-ชื่อว่าง'); });
    await step('2. ลบชื่อกำหนดการจนว่าง  3. กด "บันทึกการแก้ไข"', async () => {
      await editField(page, 'ชื่อกำหนดการ').fill('');
      await saveEdit(page).click();
    });
    await step('Expected: หน้าต่างแก้ไขยังเปิดอยู่ และชื่อเดิมไม่เปลี่ยน', async () => {
      await expect(editHeading(page)).toBeVisible();
      await page.getByLabel('ปิดหน้าต่างแก้ไขกำหนดการ').click();
      await openList(page, title);
      await expect(row(page, title)).toBeVisible();
    });
  });

  test('CAL-T34 เปลี่ยนวันเริ่มต้นและวันสิ้นสุด บันทึกวันที่ใหม่', async ({ page }) => {
    let title = '';
    await step('1. กดปุ่ม "แก้ไข" ของกำหนดการ', async () => { title = await openEditOf(page, 'แก้ไข-วันที่'); });
    await step(`2. แก้วันเริ่ม ${thaiDate(20)} วันสิ้นสุด ${thaiDate(22)}  3. กด "บันทึกการแก้ไข"`, async () => {
      await editField(page, 'วันเริ่มต้น').fill(inputDate(20));
      await editField(page, 'วันสิ้นสุด').fill(inputDate(22));
      await saveEdit(page).click();
    });
    await step(`Expected: รายการแสดงช่วงวันที่ ${thaiDate(20)} – ${thaiDate(22)}`, async () => {
      await expect(swal(page).title).toHaveText('บันทึกสำเร็จ');
      await openList(page, title);
      await expect(row(page, title)).toContainText(`${thaiDate(20)} – ${thaiDate(22)}`);
    });
  });

  test('CAL-T35 แก้วันสิ้นสุดให้อยู่ก่อนวันเริ่มต้น ระบบต้องแจ้งเตือนและไม่บันทึก', async ({ page }) => {
    let title = '';
    await step('1. กดปุ่ม "แก้ไข" ของกำหนดการ', async () => { title = await openEditOf(page, 'แก้ไข-วันสิ้นสุดก่อนวันเริ่ม'); });
    await step(`2. แก้วันเริ่ม ${thaiDate(20)} วันสิ้นสุด ${thaiDate(15)}  3. กด "บันทึกการแก้ไข"`, async () => {
      await editField(page, 'วันเริ่มต้น').fill(inputDate(20));
      await editField(page, 'วันสิ้นสุด').fill(inputDate(15));
      await saveEdit(page).click();
    });
    await step(`Expected: วันที่ในรายการยังเป็นค่าเดิม ${thaiDate(10)} – ${thaiDate(11)}`, async () => {
      await page.waitForTimeout(2000);
      await openList(page, title);
      await expect(row(page, title)).toContainText(`${thaiDate(10)} – ${thaiDate(11)}`);
    });
  });

  test('CAL-T36 เปลี่ยนหมวดหมู่ประเภทหลักสูตร บันทึกหมวดหมู่ใหม่', async ({ page }) => {
    let title = '';
    await step('1. กดปุ่ม "แก้ไข" ของกำหนดการ', async () => { title = await openEditOf(page, 'แก้ไข-หมวดหมู่'); });
    await step('2. ยกเลิก PLE-CC1 และเลือก PLE-IP2  3. กด "บันทึกการแก้ไข"', async () => {
      const form = page.locator('form').filter({ has: editField(page, 'ชื่อกำหนดการ') });
      await form.getByRole('button', { name: 'PLE-CC1', exact: true }).click();
      await form.getByRole('button', { name: 'PLE-IP2', exact: true }).click();
      await saveEdit(page).click();
    });
    await step('Expected: รายการแสดงป้าย PLE-IP2 และไม่มี PLE-CC1', async () => {
      await expect(swal(page).title).toHaveText('บันทึกสำเร็จ');
      await openList(page, title);
      await expect(row(page, title).getByText('PLE-IP2', { exact: true })).toBeVisible();
      await expect(row(page, title).getByText('PLE-CC1', { exact: true })).toHaveCount(0);
    });
  });

  test('CAL-T37 แก้ลิงก์แนบเป็นรูปแบบที่ไม่ใช่ URL ระบบไม่ให้บันทึก', async ({ page }) => {
    let title = '';
    await step('1. กดปุ่ม "แก้ไข" ของกำหนดการ', async () => { title = await openEditOf(page, 'แก้ไข-ลิงก์ผิด'); });
    await step('2. กรอกลิงก์ = "ไม่ใช่ลิงก์"  3. กด "บันทึกการแก้ไข"', async () => {
      await editField(page, 'แนบลิงก์ (URL) หรือเอกสารอ้างอิง').fill('ไม่ใช่ลิงก์');
      await saveEdit(page).click();
    });
    await step('Expected: หน้าต่างแก้ไขยังเปิดอยู่ และรายการไม่มีลิงก์แนบ', async () => {
      await expect(editHeading(page)).toBeVisible();
      await page.getByLabel('ปิดหน้าต่างแก้ไขกำหนดการ').click();
      await openList(page, title);
      await expect(row(page, title).getByRole('link', { name: 'ลิงก์แนบ' })).toHaveCount(0);
    });
  });

  test('CAL-T38 กดปิดหน้าต่างแก้ไขโดยไม่บันทึก ข้อมูลไม่เปลี่ยนแปลง', async ({ page }) => {
    let title = '';
    await step('1. กดปุ่ม "แก้ไข" ของกำหนดการ', async () => { title = await openEditOf(page, 'แก้ไข-ปิดหน้าต่าง'); });
    await step('2. แก้ชื่อ  3. กดปุ่ม X ปิดหน้าต่าง', async () => {
      await editField(page, 'ชื่อกำหนดการ').fill('ชื่อที่ไม่ได้บันทึก');
      await page.getByLabel('ปิดหน้าต่างแก้ไขกำหนดการ').click();
    });
    await step('Expected: หน้าต่างปิด และรายการยังเป็นชื่อเดิม', async () => {
      await expect(editHeading(page)).toHaveCount(0);
      await openList(page, title);
      await expect(row(page, title)).toBeVisible();
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('1.8 การเผยแพร่และงดเผยแพร่กำหนดการ', () => {
  test('CAL-T39 กดเผยแพร่กำหนดการที่เป็นแบบร่างแล้วยืนยัน สถานะเป็น "เผยแพร่"', async ({ page }) => {
    const title = uniqueTitle('สถานะ-เผยแพร่');
    await addSchedules(page, [{ title, start: inputDate(5) }], false);
    await openList(page, title);
    await step('1. กดปุ่มรูปตา (เผยแพร่) ของกำหนดการแบบร่าง  2. กด "ยืนยัน"', async () => {
      await row(page, title).getByLabel('เผยแพร่กำหนดการ', { exact: true }).click();
      await expect(swal(page).title).toHaveText('ยืนยันการเผยแพร่?');
      await swal(page).confirm.click();
    });
    await step('Expected: สถานะเปลี่ยนเป็น "เผยแพร่"', () =>
      expect(row(page, title).getByText('เผยแพร่', { exact: true })).toBeVisible());
  });

  test('CAL-T40 กดงดเผยแพร่กำหนดการที่เผยแพร่อยู่แล้วยืนยัน สถานะเป็น "แบบร่าง"', async ({ page }) => {
    const title = uniqueTitle('สถานะ-งดเผยแพร่');
    await addSchedules(page, [{ title, start: inputDate(5) }], true);
    await openList(page, title);
    await step('1. กดปุ่มรูปตาขีดฆ่า (งดเผยแพร่)  2. กด "ยืนยัน"', async () => {
      await row(page, title).getByLabel('งดเผยแพร่กำหนดการ', { exact: true }).click();
      await expect(swal(page).title).toHaveText('ยืนยันการงดเผยแพร่?');
      await swal(page).confirm.click();
    });
    await step('Expected: สถานะเปลี่ยนเป็น "แบบร่าง"', () =>
      expect(row(page, title).getByText('แบบร่าง', { exact: true })).toBeVisible());
  });

  test('CAL-T41 กดเปลี่ยนสถานะแล้วกด "ยกเลิก" สถานะไม่เปลี่ยนแปลง', async ({ page }) => {
    const title = uniqueTitle('สถานะ-ยกเลิก');
    await addSchedules(page, [{ title, start: inputDate(5) }], true);
    await openList(page, title);
    await step('1. กดปุ่มงดเผยแพร่  2. กด "ยกเลิก"', async () => {
      await row(page, title).getByLabel('งดเผยแพร่กำหนดการ', { exact: true }).click();
      await swal(page).cancel.click();
    });
    await step('Expected: สถานะยังเป็น "เผยแพร่" (ตรวจหลังโหลดหน้าใหม่)', async () => {
      await openList(page, title);
      await expect(row(page, title).getByText('เผยแพร่', { exact: true })).toBeVisible();
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('1.9 การลบกำหนดการ', () => {
  test('CAL-T42 กดลบกำหนดการแล้วยืนยัน กำหนดการถูกลบออกจากระบบ', async ({ page }) => {
    const title = uniqueTitle('ลบ-ยืนยัน');
    await addSchedules(page, [{ title, start: inputDate(5) }]);
    await openList(page, title);
    await step('1. กดปุ่มถังขยะ  2. กด "ลบข้อมูล"', async () => {
      await page.getByLabel(`ลบกำหนดการ ${title}`).click();
      await expect(swal(page).title).toHaveText('ลบกำหนดการ?');
      await swal(page).confirm.click();
    });
    await step('Expected: กำหนดการหายจากรายการ (ตรวจหลังโหลดหน้าใหม่)', async () => {
      await expect(row(page, title)).toHaveCount(0);
      await openList(page, title);
      await expect(notFound(page)).toBeVisible();
    });
  });

  test('CAL-T43 กดลบกำหนดการแล้วกด "ยกเลิก" กำหนดการยังอยู่', async ({ page }) => {
    const title = uniqueTitle('ลบ-ยกเลิก');
    await addSchedules(page, [{ title, start: inputDate(5) }]);
    await openList(page, title);
    await step('1. กดปุ่มถังขยะ  2. กด "ยกเลิก"', async () => {
      await page.getByLabel(`ลบกำหนดการ ${title}`).click();
      await swal(page).cancel.click();
    });
    await step('Expected: กำหนดการยังอยู่ในรายการ', async () => {
      await openList(page, title);
      await expect(row(page, title)).toBeVisible();
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('1.10 การจัดการกำหนดการหลายรายการพร้อมกัน', () => {
  /** สร้างกำหนดการ 3 รายการที่มีคำค้นร่วมกัน เพื่อค้นหาให้บนจอมีแค่ข้อมูลทดสอบ */
  async function seedThree(page: Page, label: string, publish: boolean) {
    const tag = `BULK${label}${RUN_ID}`;
    const titles = [1, 2, 3].map((i) => uniqueTitle(`${tag}-${i}`));
    await addSchedules(page, titles.map((title, i) => ({ title, start: inputDate(i + 1) })), publish);
    await openList(page, tag);
    await expect(allRows(page)).toHaveCount(3);
    return titles;
  }
  const select = (page: Page, title: string) => page.getByLabel(`เลือกกำหนดการ ${title}`).click();
  const badge = (page: Page, title: string, text: string) => row(page, title).getByText(text, { exact: true });

  test('CAL-T44 กด "เลือกทั้งหมด" เลือกทุกรายการที่แสดงอยู่', async ({ page }) => {
    await seedThree(page, 'SELALL', true);
    await step('1. กดปุ่ม "เลือกทั้งหมด"', () => page.getByRole('button', { name: 'เลือกทั้งหมด' }).click());
    await step('Expected: แสดง "เลือก 3" และปุ่ม "ลบ (3)"', async () => {
      await expect(page.getByText('เลือก 3', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'ลบ (3)' })).toBeVisible();
    });
  });

  test('CAL-T45 เลือก 2 รายการแล้วกดเผยแพร่ ทั้ง 2 รายการเป็น "เผยแพร่"', async ({ page }) => {
    const t = await seedThree(page, 'PUB', false);
    await step('1. ติ๊กเลือกรายการที่ 1 และ 2  2. กด "เผยแพร่ (2)"  3. กด "ยืนยัน"', async () => {
      await select(page, t[0]);
      await select(page, t[1]);
      await page.getByRole('button', { name: 'เผยแพร่ (2)', exact: true }).click();
      await expect(swal(page).title).toHaveText('ยืนยันเผยแพร่ 2 รายการ?');
      await swal(page).confirm.click();
      await expect(swal(page).title).toHaveText('สำเร็จ');
      await swal(page).confirm.click(); // ปิดกล่องก่อน เพราะกล่องนี้ซ่อนเนื้อหาด้านหลังไว้
    });
    await step('Expected: รายการที่ 1–2 เป็น "เผยแพร่" รายการที่ 3 ยังเป็น "แบบร่าง"', async () => {
      await expect(badge(page, t[0], 'เผยแพร่')).toBeVisible();
      await expect(badge(page, t[1], 'เผยแพร่')).toBeVisible();
      await expect(badge(page, t[2], 'แบบร่าง')).toBeVisible();
    });
  });

  test('CAL-T46 เลือก 2 รายการแล้วกดงดเผยแพร่ ทั้ง 2 รายการเป็น "แบบร่าง"', async ({ page }) => {
    const t = await seedThree(page, 'UNPUB', true);
    await step('1. ติ๊กเลือกรายการที่ 1 และ 2  2. กด "งดเผยแพร่ (2)"  3. กด "ยืนยัน"', async () => {
      await select(page, t[0]);
      await select(page, t[1]);
      await page.getByRole('button', { name: 'งดเผยแพร่ (2)', exact: true }).click();
      await swal(page).confirm.click();
      await expect(swal(page).title).toHaveText('สำเร็จ');
      await swal(page).confirm.click(); // ปิดกล่องก่อน เพราะกล่องนี้ซ่อนเนื้อหาด้านหลังไว้
    });
    await step('Expected: รายการที่ 1–2 เป็น "แบบร่าง" รายการที่ 3 ยังเป็น "เผยแพร่"', async () => {
      await expect(badge(page, t[0], 'แบบร่าง')).toBeVisible();
      await expect(badge(page, t[1], 'แบบร่าง')).toBeVisible();
      await expect(badge(page, t[2], 'เผยแพร่')).toBeVisible();
    });
  });

  test('CAL-T47 ไม่เลือกรายการแล้วกด "ลบทั้งหมด" ลบเฉพาะรายการที่ค้นหา/กรองอยู่', async ({ page }) => {
    await seedThree(page, 'DELALL', true);
    await step('1. ไม่ติ๊กเลือกรายการใด  2. กด "ลบทั้งหมด"  3. กด "ยืนยัน"', async () => {
      await page.getByRole('button', { name: 'ลบทั้งหมด' }).click();
      // ป้องกันลบข้อมูลจริง: ถ้าจำนวนไม่ใช่ 3 เทสต์จะหยุดตรงนี้ก่อนกดยืนยัน
      await expect(swal(page).title).toHaveText('ยืนยันลบ 3 รายการ?');
      await swal(page).confirm.click();
      await expect(swal(page).title).toHaveText('สำเร็จ');
      await swal(page).confirm.click(); // ปิดกล่องก่อน เพราะกล่องนี้ซ่อนเนื้อหาด้านหลังไว้
    });
    await step('Expected: ทั้ง 3 รายการถูกลบ แต่กำหนดการอื่นยังอยู่', async () => {
      await expect(notFound(page)).toBeVisible();
      await openList(page, SEED);
      await expect(row(page, pubTitle)).toBeVisible();
    });
  });

  test('CAL-T48 เลือก 1 รายการแล้วกดลบ ลบเฉพาะรายการที่เลือก', async ({ page }) => {
    const t = await seedThree(page, 'DELONE', true);
    await step('1. ติ๊กเลือกรายการที่ 1  2. กด "ลบ (1)"  3. กด "ยืนยัน"', async () => {
      await select(page, t[0]);
      await page.getByRole('button', { name: 'ลบ (1)' }).click();
      await expect(swal(page).title).toHaveText('ยืนยันลบ 1 รายการ?');
      await swal(page).confirm.click();
      await expect(swal(page).title).toHaveText('สำเร็จ');
      await swal(page).confirm.click(); // ปิดกล่องก่อน เพราะกล่องนี้ซ่อนเนื้อหาด้านหลังไว้
    });
    await step('Expected: รายการที่ 1 หายไป รายการที่ 2–3 ยังอยู่', async () => {
      await expect(row(page, t[0])).toHaveCount(0);
      await expect(row(page, t[1])).toBeVisible();
      await expect(row(page, t[2])).toBeVisible();
    });
  });
});
