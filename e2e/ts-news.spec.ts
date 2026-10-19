import { test, expect, type Page } from '@playwright/test';
import {
  RUN_ID, uniqueTitle, swal, toast, files, VALID_IMAGE_URL, BROKEN_IMAGE_URL,
  XSS_PAYLOAD, expectNoXss, onBrowserDialog, newAdminPage,
} from './helpers';

/**
 * Test Scenario: จัดการบล็อกข่าวสาร (ผู้ดูแลระบบ) — Black Box Testing
 *
 * ทุกเคสทำผ่านหน้าเว็บและตรวจผลจากสิ่งที่แสดงบนหน้าจอเท่านั้น
 * ชื่อเทสต์ขึ้นต้นด้วย Test ID ตามตารางในเล่ม ส่วน test.step คือขั้นตอนในคอลัมน์ Test Action
 * ข้อมูลทดสอบทุกชิ้นชื่อขึ้นต้นด้วย "E2E-" และถูกลบผ่านหน้าเว็บตอนจบ
 */

const LIST_URL = '/admin/mnblog';
const ADD_URL = '/admin/mnblog/addblog';
const step = test.step;

// ─── การทำงานบนหน้าจอที่ใช้ซ้ำ ────────────────────────────────────────────────
interface NewsForm {
  title: string;
  content?: string;
  source?: string;
  coverUrl?: string;
}

/** ช่องกรอกของข่าวลำดับที่ n (เริ่มที่ 1) ในหน้าสร้างข่าว */
const draft = (page: Page, n: number) => ({
  title: page.getByLabel(`หัวข้อข่าวสาร รายการที่ ${n}`, { exact: true }),
  editor: page.locator('.ProseMirror').nth(n - 1),
  source: page.getByLabel(`ลิงก์แหล่งข่าว รายการที่ ${n}`, { exact: true }),
  coverFile: page.getByLabel(`เลือกไฟล์ภาพหน้าปก รายการที่ ${n}`, { exact: true }),
  coverUrl: page.getByLabel(`หรือวาง URL รูปภาพหน้าปก รายการที่ ${n}`, { exact: true }),
  coverPreview: page.locator('img[alt="Preview"]').nth(n - 1),
});

async function fillDraft(page: Page, n: number, f: NewsForm) {
  const d = draft(page, n);
  await d.title.fill(f.title);
  await d.editor.click();
  await page.keyboard.type(f.content ?? 'เนื้อหาข่าวประชาสัมพันธ์สำหรับทดสอบ');
  if (f.source) await d.source.fill(f.source);
  if (f.coverUrl) await d.coverUrl.fill(f.coverUrl);
}

const publishButton = (page: Page) => page.getByRole('button', { name: 'เผยแพร่ทั้งหมด' });
const draftButton = (page: Page) => page.getByRole('button', { name: 'บันทึกร่าง' });

/** สร้างข่าวผ่านหน้า "สร้างข่าวสารใหม่" (ใช้เตรียมข้อมูลก่อนทดสอบ) */
async function addNews(page: Page, items: NewsForm[], publish = true) {
  await page.goto(ADD_URL);
  for (let i = 0; i < items.length; i++) {
    if (i > 0) await page.getByRole('button', { name: 'เพิ่มรายการในคิว' }).click();
    await fillDraft(page, i + 1, items[i]);
  }
  await (publish ? publishButton(page) : draftButton(page)).click();
  await expect(toast(page)).toContainText('สำเร็จ', { timeout: 20_000 });
  await page.waitForURL(new RegExp(`${LIST_URL}$`), { timeout: 20_000 });
}

/** เปิดหน้าจัดการข่าวสารและค้นหา */
async function openList(page: Page, search?: string) {
  await page.goto(LIST_URL);
  await expect(page.getByRole('heading', { name: 'จัดการข่าวสาร', exact: true })).toBeVisible();
  await expect(page.getByText('Synchronizing Data...')).toHaveCount(0);
  if (search !== undefined) {
    const box = page.getByLabel('ค้นหาข่าวสารของคุณ');
    await box.fill(search);
    // ช่องค้นหาแสดงคำแนะนำทับรายการด้านล่าง กด Esc ปิดก่อนทำขั้นถัดไป
    await box.press('Escape');
  }
}

/** การ์ดข่าวในหน้ารายการ */
const newsCard = (page: Page, title: string) =>
  page.locator('div.relative.group').filter({ has: page.getByRole('heading', { name: title, exact: true }) });
const allCards = (page: Page) => page.locator('div.relative.group');
const noArticles = (page: Page) => page.getByText('No Articles Found');

/** ไปค้นหาในหน้ารายการแล้วตรวจว่าไม่มีข่าวชื่อนี้ */
async function expectNotInList(page: Page, title: string) {
  await page.waitForTimeout(3000); // เผื่อระบบกำลังบันทึกอยู่
  await openList(page, title);
  await expect(noArticles(page)).toBeVisible();
}

/** เลือกข้อความทั้งหมดใน editor แล้วกดปุ่มในแถบเครื่องมือ */
async function typeAndFormat(page: Page, buttonLabel: string) {
  await page.goto(ADD_URL);
  await draft(page, 1).editor.click();
  await page.keyboard.type('ข้อความทดสอบการจัดรูปแบบ');
  await page.keyboard.press('Control+A');
  await page.getByRole('toolbar').first().getByLabel(buttonLabel, { exact: true }).click();
  return draft(page, 1).editor;
}

// หน้าแก้ไขข่าว
const editTitle = (page: Page) => page.getByPlaceholder('ใส่หัวข้อข่าว...');
const saveChanges = (page: Page) => page.getByRole('button', { name: 'บันทึกการเปลี่ยนแปลง' });

/** เปิดหน้าแก้ไขของข่าว โดยคลิกการ์ดในหน้ารายการ */
async function openEditOf(page: Page, title: string) {
  await openList(page, title);
  await newsCard(page, title).getByRole('link').click();
  await expect(page.getByRole('heading', { name: 'แก้ไขข่าวสาร' })).toBeVisible({ timeout: 30_000 });
  await expect(editTitle(page)).toHaveValue(title);
}

/** สร้างข่าว 1 รายการแล้วเปิดหน้าแก้ไข */
async function seedAndOpenEdit(page: Page, label: string) {
  const title = uniqueTitle(label);
  await addNews(page, [{ title, content: 'เนื้อหาเดิม' }]);
  await openEditOf(page, title);
  return title;
}

// ─── ข้อมูลตั้งต้น (สร้างผ่านหน้าเว็บ) และการล้างข้อมูลตอนจบ ──────────────────
const SEED = `NSEED${RUN_ID}`;
const liveTitle = uniqueTitle(`${SEED}-ข่าวเผยแพร่`);
const draftTitle = uniqueTitle(`${SEED}-ข่าวแบบร่าง`);

test.beforeAll(async ({ browser }) => {
  const page = await newAdminPage(browser);
  await addNews(page, [{ title: liveTitle }], true);
  await addNews(page, [{ title: draftTitle }], false);
  await page.context().close();
});

/** ล้างข้อมูลทดสอบ: ค้นหา "E2E-" แล้วกดลบทีละการ์ด */
test.afterAll(async ({ browser }) => {
  const page = await newAdminPage(browser);
  onBrowserDialog(page, true);
  await openList(page, 'E2E-');
  for (let left = await allCards(page).count(); left > 0; left--) {
    const first = allCards(page).first();
    await first.hover();
    await first.locator('button[aria-label^="ลบข่าวสาร"]').click();
    await expect(allCards(page)).toHaveCount(left - 1);
  }
  await page.context().close();
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('2.1 การแสดงรายการข่าวสาร', () => {
  test('NEWS-T01 เปิดหน้าจัดการข่าวสาร แสดงรายการข่าวเป็นการ์ด', async ({ page }) => {
    await step(`1. เปิดหน้าจัดการข่าวสาร  2. ค้นหา "${SEED}"`, () => openList(page, SEED));
    await step('Expected: แสดงการ์ดข่าวทั้งที่เผยแพร่และแบบร่าง', async () => {
      await expect(newsCard(page, liveTitle)).toBeVisible();
      await expect(newsCard(page, draftTitle)).toBeVisible();
    });
  });

  test('NEWS-T02 กดปุ่ม "สร้างข่าวสารใหม่" ไปหน้าสร้างข่าวสาร', async ({ page }) => {
    await openList(page);
    await step('1. กดปุ่ม "สร้างข่าวสารใหม่"', () => page.getByRole('link', { name: 'สร้างข่าวสารใหม่' }).click());
    await step('Expected: แสดงหน้า "จัดการคิวข่าวสาร"', () =>
      expect(page.getByRole('heading', { name: 'จัดการคิวข่าวสาร' })).toBeVisible());
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('2.2 การค้นหาข่าวสาร', () => {
  test('NEWS-T03 ค้นหาด้วยคำที่มีอยู่ แสดงเฉพาะข่าวที่ตรงกัน', async ({ page }) => {
    await step(`1. ค้นหา "${SEED}"`, () => openList(page, SEED));
    await step('Expected: แสดง 2 รายการที่ตรงกับคำค้น', async () => {
      await expect(allCards(page)).toHaveCount(2);
      await expect(page.getByText('· 2 รายการ')).toBeVisible();
    });
  });

  test('NEWS-T04 ค้นหาด้วยคำที่ไม่มีในระบบ แสดง "No Articles Found"', async ({ page }) => {
    await step('1. ค้นหาคำที่ไม่มีในระบบ', () => openList(page, `ไม่มีข่าวนี้แน่นอน-${RUN_ID}`));
    await step('Expected: แสดง "No Articles Found"', () => expect(noArticles(page)).toBeVisible());
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('2.3 การกรองข่าวสารตามสถานะ', () => {
  test('NEWS-T05 แท็บ "ทั้งหมด" แสดงทั้งข่าวที่เผยแพร่และแบบร่าง', async ({ page }) => {
    await openList(page, SEED);
    await step('1. กดแท็บ "ทั้งหมด"', () => page.getByLabel('กรองตามสถานะ ทั้งหมด').click());
    await step('Expected: แสดงทั้งข่าวที่เผยแพร่และแบบร่าง', async () => {
      await expect(newsCard(page, liveTitle)).toBeVisible();
      await expect(newsCard(page, draftTitle)).toBeVisible();
    });
  });

  test('NEWS-T06 แท็บ "Live" แสดงเฉพาะข่าวที่เผยแพร่', async ({ page }) => {
    await openList(page, SEED);
    await step('1. กดแท็บ "Live"', () => page.getByLabel('กรองตามสถานะ Live').click());
    await step('Expected: แสดงเฉพาะข่าวที่เผยแพร่', async () => {
      await expect(newsCard(page, liveTitle)).toBeVisible();
      await expect(newsCard(page, draftTitle)).toHaveCount(0);
    });
  });

  test('NEWS-T07 แท็บ "Draft" แสดงเฉพาะข่าวแบบร่าง', async ({ page }) => {
    await openList(page, SEED);
    await step('1. กดแท็บ "Draft"', () => page.getByLabel('กรองตามสถานะ Draft').click());
    await step('Expected: แสดงเฉพาะข่าวแบบร่าง', async () => {
      await expect(newsCard(page, draftTitle)).toBeVisible();
      await expect(newsCard(page, liveTitle)).toHaveCount(0);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('2.4 การสร้างข่าวสาร', () => {
  test('NEWS-T08 ไม่กรอกหัวข้อข่าว แจ้งเตือน "กรุณากรอกหัวข้อข่าวให้ครบทุกรายการ"', async ({ page }) => {
    await page.goto(ADD_URL);
    await step('1. กรอกเฉพาะเนื้อหาข่าว (ไม่กรอกหัวข้อ)', async () => {
      await draft(page, 1).editor.click();
      await page.keyboard.type('มีเนื้อหาแต่ไม่มีหัวข้อ');
    });
    await step('2. กดปุ่ม "เผยแพร่ทั้งหมด"', () => publishButton(page).click());
    await step('Expected: แจ้งเตือน "กรุณากรอกหัวข้อข่าวให้ครบทุกรายการ"', () =>
      expect(toast(page)).toContainText('กรุณากรอกหัวข้อข่าวให้ครบทุกรายการ'));
  });

  test('NEWS-T09 ไม่กรอกเนื้อหาข่าว แจ้งเตือน "กรุณากรอกเนื้อหาข่าวให้ครบทุกรายการ"', async ({ page }) => {
    const title = uniqueTitle('สร้าง-ไม่มีเนื้อหา');
    await page.goto(ADD_URL);
    await step('1. กรอกเฉพาะหัวข้อข่าว (ไม่กรอกเนื้อหา)', () => draft(page, 1).title.fill(title));
    await step('2. กดปุ่ม "เผยแพร่ทั้งหมด"', () => publishButton(page).click());
    await step('Expected: แจ้งเตือน "กรุณากรอกเนื้อหาข่าวให้ครบทุกรายการ" และไม่มีข่าวนี้ในรายการ', async () => {
      await expect(toast(page)).toContainText('กรุณากรอกเนื้อหาข่าวให้ครบทุกรายการ');
      await expectNotInList(page, title);
    });
  });

  test('NEWS-T10 หัวข้อข่าวเป็นช่องว่างล้วน แจ้งเตือนให้กรอกหัวข้อข่าว', async ({ page }) => {
    await page.goto(ADD_URL);
    await step('1. กรอกหัวข้อเป็นช่องว่าง 5 ตัว และกรอกเนื้อหา', () => fillDraft(page, 1, { title: '     ' }));
    await step('2. กดปุ่ม "เผยแพร่ทั้งหมด"', () => publishButton(page).click());
    await step('Expected: แจ้งเตือน "กรุณากรอกหัวข้อข่าวให้ครบทุกรายการ"', () =>
      expect(toast(page)).toContainText('กรุณากรอกหัวข้อข่าวให้ครบทุกรายการ'));
  });

  test('NEWS-T11 ลิงก์แหล่งข่าวผิดรูปแบบ ระบบต้องแจ้งเตือนและไม่บันทึก', async ({ page }) => {
    const title = uniqueTitle('สร้าง-ลิงก์ผิด');
    await page.goto(ADD_URL);
    await step('1. กรอกหัวข้อ เนื้อหา และลิงก์แหล่งข่าว = "ไม่ใช่ลิงก์ abc"', () =>
      fillDraft(page, 1, { title, source: 'ไม่ใช่ลิงก์ abc' }));
    await step('2. กดปุ่ม "เผยแพร่ทั้งหมด"', () => publishButton(page).click());
    await step('Expected: ไม่มีข่าวนี้ในรายการ', () => expectNotInList(page, title));
  });

  test('NEWS-T12 กด "เพิ่มรายการในคิว" เพิ่มฟอร์มข่าวเป็น 2 รายการ', async ({ page }) => {
    await page.goto(ADD_URL);
    await step('1. กดปุ่ม "เพิ่มรายการในคิว"', () => page.getByRole('button', { name: 'เพิ่มรายการในคิว' }).click());
    await step('Expected: มีฟอร์มข่าว 2 รายการ', () => expect(draft(page, 2).title).toBeVisible());
  });

  test('NEWS-T13 กดลบรายการในคิว ฟอร์มกลับเหลือ 1 รายการ', async ({ page }) => {
    await page.goto(ADD_URL);
    await step('1. กด "เพิ่มรายการในคิว"  2. กดปุ่มถังขยะของรายการที่ 2', async () => {
      await page.getByRole('button', { name: 'เพิ่มรายการในคิว' }).click();
      await page.getByLabel('ลบรายการร่างข่าวสารที่ 2').click();
    });
    await step('Expected: เหลือฟอร์มข่าว 1 รายการ', () => expect(draft(page, 2).title).toHaveCount(0));
  });

  test('NEWS-T14 สร้างข่าว 2 รายการแล้วกด "เผยแพร่ทั้งหมด" บันทึกครบทั้ง 2 รายการ', async ({ page }) => {
    const t1 = uniqueTitle('สร้าง-คิว1');
    const t2 = uniqueTitle('สร้าง-คิว2');
    await page.goto(ADD_URL);
    await step('1. กรอกข่าวรายการที่ 1  2. กด "เพิ่มรายการในคิว"  3. กรอกข่าวรายการที่ 2', async () => {
      await fillDraft(page, 1, { title: t1 });
      await page.getByRole('button', { name: 'เพิ่มรายการในคิว' }).click();
      await fillDraft(page, 2, { title: t2 });
    });
    await step('4. กดปุ่ม "เผยแพร่ทั้งหมด"', () => publishButton(page).click());
    await step('Expected: แจ้ง "บันทึกข่าวสารสำเร็จ 2 รายการ!" และทั้ง 2 ข่าวแสดงสถานะ Live', async () => {
      await expect(toast(page)).toContainText('บันทึกข่าวสารสำเร็จ 2 รายการ!');
      await page.waitForURL(new RegExp(`${LIST_URL}$`));
      await openList(page, `${RUN_ID}-สร้าง-คิว`);
      await expect(newsCard(page, t1).getByText('• Live')).toBeVisible();
      await expect(newsCard(page, t2).getByText('• Live')).toBeVisible();
    });
  });

  test('NEWS-T15 มีข้อมูลค้างแล้วกด "กลับสู่หน้าจัดการ" และยืนยันออก กลับหน้ารายการข่าว', async ({ page }) => {
    await page.goto(ADD_URL);
    await step('1. กรอกหัวข้อและเนื้อหา', () => fillDraft(page, 1, { title: uniqueTitle('สร้าง-ออกจากหน้า') }));
    await step('2. กด "กลับสู่หน้าจัดการ"  3. กด "ใช่, ออกจากหน้านี้"', async () => {
      await page.getByRole('button', { name: 'กลับสู่หน้าจัดการ' }).click();
      await expect(swal(page).title).toHaveText('ต้องการออกจากหน้านี้ใช่หรือไม่?');
      await swal(page).confirm.click();
    });
    await step('Expected: กลับไปหน้าจัดการข่าวสาร', () =>
      expect(page.getByRole('heading', { name: 'จัดการข่าวสาร', exact: true })).toBeVisible());
  });

  test('NEWS-T16 มีข้อมูลค้างแล้วกด "กลับสู่หน้าจัดการ" และเลือกอยู่ต่อ ข้อมูลยังอยู่ครบ', async ({ page }) => {
    const title = uniqueTitle('สร้าง-อยู่ต่อ');
    await page.goto(ADD_URL);
    await step('1. กรอกหัวข้อและเนื้อหา', () => fillDraft(page, 1, { title }));
    await step('2. กด "กลับสู่หน้าจัดการ"  3. กด "อยู่หน้านี้ต่อ"', async () => {
      await page.getByRole('button', { name: 'กลับสู่หน้าจัดการ' }).click();
      await swal(page).cancel.click();
    });
    await step('Expected: อยู่หน้าเดิม และหัวข้อที่กรอกยังอยู่', async () => {
      await expect(page.getByRole('heading', { name: 'จัดการคิวข่าวสาร' })).toBeVisible();
      await expect(draft(page, 1).title).toHaveValue(title);
    });
  });

  test('NEWS-T17 หัวข้อข่าวมีโค้ด HTML/Script แสดงเป็นข้อความ ไม่ถูกรัน (XSS)', async ({ page }) => {
    const title = uniqueTitle(`XSS${XSS_PAYLOAD}`);
    await page.goto(ADD_URL);
    await step(`1. กรอกหัวข้อ = ${XSS_PAYLOAD} และเนื้อหา`, () => fillDraft(page, 1, { title }));
    await step('2. กดปุ่ม "เผยแพร่ทั้งหมด"', () => publishButton(page).click());
    await step('Expected: แสดงหัวข้อเป็นข้อความตามที่กรอก และโค้ดไม่ถูกรัน', async () => {
      await page.waitForURL(new RegExp(`${LIST_URL}$`));
      await openList(page, 'XSS');
      await expect(newsCard(page, title)).toBeVisible();
      await expectNoXss(page);
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('2.5 การบันทึกข่าวสารเป็นแบบร่าง', () => {
  test('NEWS-T18 กรอกข้อมูลครบแล้วกด "บันทึกร่าง" บันทึกสำเร็จเป็นแบบร่าง', async ({ page }) => {
    const title = uniqueTitle('ร่าง-บันทึก');
    await page.goto(ADD_URL);
    await step('1. กรอกหัวข้อและเนื้อหา', () => fillDraft(page, 1, { title }));
    await step('2. กดปุ่ม "บันทึกร่าง"', () => draftButton(page).click());
    await step('Expected: แจ้ง "บันทึกแบบร่างสำเร็จ 1 รายการ!" และข่าวแสดงป้าย Draft', async () => {
      await expect(toast(page)).toContainText('บันทึกแบบร่างสำเร็จ 1 รายการ!');
      await page.waitForURL(new RegExp(`${LIST_URL}$`));
      await openList(page, title);
      await expect(newsCard(page, title).getByText('Draft', { exact: true })).toBeVisible();
    });
  });

  test('NEWS-T19 ข่าวแบบร่างแสดงในแท็บ "Draft" พร้อมป้าย Draft', async ({ page }) => {
    await openList(page, SEED);
    await step('1. กดแท็บ "Draft"', () => page.getByLabel('กรองตามสถานะ Draft').click());
    await step('Expected: ข่าวแบบร่างแสดงในแท็บพร้อมป้าย Draft', () =>
      expect(newsCard(page, draftTitle).getByText('Draft', { exact: true })).toBeVisible());
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('2.6 การเผยแพร่ข่าวสาร', () => {
  test('NEWS-T20 กรอกข้อมูลครบแล้วกด "เผยแพร่ทั้งหมด" ข่าวแสดงสถานะ Live', async ({ page }) => {
    const title = uniqueTitle('เผยแพร่-ครบ');
    const source = 'https://www.facebook.com/pharmacycouncil';
    await page.goto(ADD_URL);
    await step('1. กรอกหัวข้อ เนื้อหา ลิงก์แหล่งข่าว และ URL รูปปก', () =>
      fillDraft(page, 1, { title, source, coverUrl: VALID_IMAGE_URL }));
    await step('2. กดปุ่ม "เผยแพร่ทั้งหมด"', () => publishButton(page).click());
    await step('Expected: แจ้ง "บันทึกข่าวสารสำเร็จ 1 รายการ!" ข่าวแสดงสถานะ Live และรูปปก', async () => {
      await expect(toast(page)).toContainText('บันทึกข่าวสารสำเร็จ 1 รายการ!');
      await page.waitForURL(new RegExp(`${LIST_URL}$`));
      await openList(page, title);
      await expect(newsCard(page, title).getByText('• Live')).toBeVisible();
      await expect(newsCard(page, title).getByRole('img', { name: title })).toHaveAttribute('src', VALID_IMAGE_URL);
    });
    await step('Expected: หน้าแก้ไขแสดงลิงก์แหล่งข่าวที่บันทึกไว้', async () => {
      await openEditOf(page, title);
      await expect(page.getByPlaceholder('ลิงก์แหล่งข่าว (Facebook / เว็บไซต์อ้างอิง)...')).toHaveValue(source);
    });
  });

  test('NEWS-T21 ข่าวที่เผยแพร่แสดงที่หน้าแรกของผู้ใช้ทั่วไป ส่วนข่าวแบบร่างไม่แสดง', async ({ browser }) => {
    const guest = await browser.newContext({ storageState: { cookies: [], origins: [] } });
    const page = await guest.newPage();
    await step('1. เปิดหน้าแรกของเว็บโดยไม่เข้าสู่ระบบ', () => page.goto('/'));
    await step('Expected: เห็นข่าวที่เผยแพร่ และไม่เห็นข่าวแบบร่าง', async () => {
      await expect(page.getByText(liveTitle).first()).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(draftTitle)).toHaveCount(0);
    });
    await guest.close();
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('2.7 การจัดการรูปปกข่าวสาร', () => {
  /** รูปตัวอย่างแสดงผลได้จริง (โหลดรูปสำเร็จ ไม่ใช่ภาพแทน) */
  const expectPreviewLoaded = (page: Page) =>
    expect.poll(() => draft(page, 1).coverPreview.evaluate(
      (img: HTMLImageElement) => img.complete && img.naturalWidth > 0 && !img.src.startsWith('data:'),
    ), { timeout: 20_000 }).toBe(true);

  test('NEWS-T22 อัปโหลดรูปปกไฟล์ JPG สำเร็จ แสดงตัวอย่างรูป', async ({ page }) => {
    await page.goto(ADD_URL);
    await step(`1. คลิกช่อง Upload Cover แล้วเลือกไฟล์ ${files.jpg.name}`, () => draft(page, 1).coverFile.setInputFiles(files.jpg));
    await step('Expected: แสดงตัวอย่างรูปปก', () => expectPreviewLoaded(page));
  });

  test('NEWS-T23 อัปโหลดรูปปกไฟล์ PNG สำเร็จ แสดงตัวอย่างรูป', async ({ page }) => {
    await page.goto(ADD_URL);
    await step(`1. คลิกช่อง Upload Cover แล้วเลือกไฟล์ ${files.png.name}`, () => draft(page, 1).coverFile.setInputFiles(files.png));
    await step('Expected: แสดงตัวอย่างรูปปก', () => expectPreviewLoaded(page));
  });

  test('NEWS-T24 อัปโหลดรูปปกขนาดเกิน 5MB แจ้งเตือน "ไฟล์ต้องไม่เกิน 5MB"', async ({ page }) => {
    const dialogs = onBrowserDialog(page);
    await page.goto(ADD_URL);
    await step(`1. เลือกไฟล์ ${files.bigJpg.name} (ขนาดเกิน 6MB)`, () => draft(page, 1).coverFile.setInputFiles(files.bigJpg));
    await step('Expected: แจ้งเตือน "ไฟล์ต้องไม่เกิน 5MB" และไม่แสดงรูป', async () => {
      await expect.poll(() => dialogs).toContain('ไฟล์ต้องไม่เกิน 5MB');
      await expect(draft(page, 1).coverPreview).toHaveCount(0);
    });
  });

  test('NEWS-T25 อัปโหลดไฟล์ที่ไม่ใช่รูปภาพ แจ้งเตือน "กรุณาเลือกไฟล์ภาพเท่านั้น"', async ({ page }) => {
    const dialogs = onBrowserDialog(page);
    await page.goto(ADD_URL);
    await step(`1. เลือกไฟล์ ${files.txt.name}`, () => draft(page, 1).coverFile.setInputFiles(files.txt));
    await step('Expected: แจ้งเตือน "กรุณาเลือกไฟล์ภาพเท่านั้น" และไม่แสดงรูป', async () => {
      await expect.poll(() => dialogs).toContain('กรุณาเลือกไฟล์ภาพเท่านั้น');
      await expect(draft(page, 1).coverPreview).toHaveCount(0);
    });
  });

  test('NEWS-T26 วาง URL รูปภาพที่ใช้ได้ แสดงตัวอย่างรูปจาก URL', async ({ page }) => {
    await page.goto(ADD_URL);
    await step(`1. วาง URL รูปภาพ = ${VALID_IMAGE_URL}`, () => draft(page, 1).coverUrl.fill(VALID_IMAGE_URL));
    await step('Expected: แสดงตัวอย่างรูปปก', () => expectPreviewLoaded(page));
  });

  test('NEWS-T27 วาง URL รูปภาพที่ใช้ไม่ได้ แสดงภาพแทน "รูปภาพไม่พร้อมใช้งาน"', async ({ page }) => {
    await page.goto(ADD_URL);
    await step('1. วาง URL รูปภาพที่ไม่มีอยู่จริง', () => draft(page, 1).coverUrl.fill(BROKEN_IMAGE_URL));
    await step('Expected: แสดงภาพแทน "รูปภาพไม่พร้อมใช้งาน"', () =>
      expect(draft(page, 1).coverPreview).toHaveAttribute('src', /^data:image\/svg\+xml/));
  });

  test('NEWS-T28 กดลบรูปปก กลับเป็นช่องอัปโหลดรูป', async ({ page }) => {
    await page.goto(ADD_URL);
    await step('1. วาง URL รูปภาพ  2. กดปุ่ม X บนรูป', async () => {
      await draft(page, 1).coverUrl.fill(VALID_IMAGE_URL);
      await draft(page, 1).coverPreview.hover();
      await page.getByLabel('ลบรูปภาพหน้าปก รายการที่ 1').click();
    });
    await step('Expected: รูปหายไป และกลับเป็นช่อง Upload Cover', async () => {
      await expect(draft(page, 1).coverPreview).toHaveCount(0);
      await expect(page.getByLabel('คลิกเพื่ออัปโหลดภาพหน้าปก รายการที่ 1')).toBeVisible();
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('2.8 การจัดรูปแบบเนื้อหาข่าวสาร', () => {
  const TEXT = 'ข้อความทดสอบการจัดรูปแบบ';
  const formats: [string, string, string, string][] = [
    ['NEWS-T29', 'ตัวหนา', 'strong', 'ข้อความเป็นตัวหนา'],
    ['NEWS-T30', 'ตัวเอียง', 'em', 'ข้อความเป็นตัวเอียง'],
    ['NEWS-T31', 'ขีดทับ', 's', 'ข้อความมีเส้นขีดทับ'],
    ['NEWS-T32', 'รายการแบบสัญลักษณ์', 'ul > li', 'ข้อความเป็นรายการแบบจุด'],
    ['NEWS-T33', 'รายการแบบลำดับเลข', 'ol > li', 'ข้อความเป็นรายการแบบตัวเลข'],
    ['NEWS-T34', 'กล่องข้อความอ้างอิง', 'blockquote', 'ข้อความอยู่ในกล่องอ้างอิง'],
  ];
  for (const [id, button, tag, expected] of formats) {
    test(`${id} กดปุ่ม${button} ${expected}`, async ({ page }) => {
      let ed = draft(page, 1).editor;
      await step(`1. พิมพ์ข้อความ  2. เลือกข้อความทั้งหมด  3. กดปุ่ม "${button}"`, async () => {
        ed = await typeAndFormat(page, button);
      });
      await step(`Expected: ${expected}`, () => expect(ed.locator(tag)).toHaveText(TEXT));
    });
  }

  test('NEWS-T35 กดปุ่มเส้นคั่นแนวนอน แทรกเส้นคั่นในเนื้อหา', async ({ page }) => {
    await page.goto(ADD_URL);
    await step('1. พิมพ์ข้อความ  2. กดปุ่ม "เส้นคั่นแนวนอน"', async () => {
      await draft(page, 1).editor.click();
      await page.keyboard.type('ย่อหน้าแรก');
      await page.getByRole('toolbar').first().getByLabel('เส้นคั่นแนวนอน').click();
    });
    await step('Expected: มีเส้นคั่นแสดงในเนื้อหา', () => expect(draft(page, 1).editor.locator('hr')).toHaveCount(1));
  });

  test('NEWS-T36 เลือกข้อความแล้วแทรกลิงก์ที่ถูกต้อง ข้อความกลายเป็นลิงก์', async ({ page }) => {
    let ed = draft(page, 1).editor;
    await step('1. พิมพ์ข้อความและเลือกทั้งหมด  2. กด "แทรกลิงก์"  3. กรอก URL  4. กด "เพิ่ม"', async () => {
      ed = await typeAndFormat(page, 'แทรกลิงก์');
      await page.getByLabel('URL ลิงก์ที่ต้องการเพิ่ม').fill('https://www.pharmacycouncil.org');
      await page.getByRole('button', { name: 'เพิ่ม', exact: true }).click();
    });
    await step('Expected: ข้อความกลายเป็นลิงก์ไปยัง URL ที่กรอก', () =>
      expect(ed.getByRole('link', { name: TEXT })).toHaveAttribute('href', 'https://www.pharmacycouncil.org'));
  });

  test('NEWS-T37 แทรกลิงก์แบบ javascript: ระบบไม่สร้างลิงก์อันตราย', async ({ page }) => {
    let ed = draft(page, 1).editor;
    await step('1. พิมพ์ข้อความและเลือกทั้งหมด  2. กด "แทรกลิงก์"  3. กรอก javascript:alert(1)  4. กด "เพิ่ม"', async () => {
      ed = await typeAndFormat(page, 'แทรกลิงก์');
      await page.getByLabel('URL ลิงก์ที่ต้องการเพิ่ม').fill('javascript:alert(1)');
      await page.getByRole('button', { name: 'เพิ่ม', exact: true }).click();
    });
    await step('Expected: ข้อความไม่กลายเป็นลิงก์', () => expect(ed.getByRole('link')).toHaveCount(0));
  });

  test('NEWS-T38 แทรกรูปภาพในเนื้อหาจาก URL รูปแสดงในเนื้อหา', async ({ page }) => {
    await page.goto(ADD_URL);
    await step('1. คลิกช่องเนื้อหา  2. กด "แทรกรูปภาพ"  3. กรอก URL รูป  4. กด "เพิ่ม"', async () => {
      await draft(page, 1).editor.click();
      await page.getByRole('toolbar').first().getByLabel('แทรกรูปภาพ').click();
      await page.getByLabel('URL รูปภาพที่ต้องการแทรก').fill(VALID_IMAGE_URL);
      await page.getByRole('button', { name: 'เพิ่ม', exact: true }).click();
    });
    await step('Expected: รูปแสดงในเนื้อหา', () =>
      expect(draft(page, 1).editor.getByRole('img')).toHaveAttribute('src', VALID_IMAGE_URL));
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('2.9 การแก้ไขข่าวสาร', () => {
  test('NEWS-T39 คลิกการ์ดข่าวในหน้ารายการ เปิดหน้าแก้ไขพร้อมข้อมูลเดิม', async ({ page }) => {
    await openList(page, liveTitle);
    await step('1. คลิกการ์ดข่าว', () => newsCard(page, liveTitle).getByRole('link').click());
    await step('Expected: เปิดหน้า "แก้ไขข่าวสาร" และแสดงหัวข้อเดิม', async () => {
      await expect(page.getByRole('heading', { name: 'แก้ไขข่าวสาร' })).toBeVisible({ timeout: 30_000 });
      await expect(editTitle(page)).toHaveValue(liveTitle);
    });
  });

  test('NEWS-T40 แก้ไขหัวข้อข่าวแล้วบันทึก แจ้ง "อัปเดตข้อมูลเรียบร้อย!"', async ({ page }) => {
    await seedAndOpenEdit(page, 'แก้ไข-หัวข้อ');
    const newTitle = uniqueTitle('แก้ไข-หัวข้อใหม่');
    await step('1. แก้หัวข้อข่าว  2. กด "บันทึกการเปลี่ยนแปลง"', async () => {
      await editTitle(page).fill(newTitle);
      await saveChanges(page).click();
    });
    await step('Expected: แจ้ง "อัปเดตข้อมูลเรียบร้อย!" และรายการแสดงหัวข้อใหม่', async () => {
      await expect(toast(page)).toContainText('อัปเดตข้อมูลเรียบร้อย!');
      await openList(page, newTitle);
      await expect(newsCard(page, newTitle)).toBeVisible();
    });
  });

  test('NEWS-T41 ลบหัวข้อข่าวจนว่างแล้วบันทึก แจ้งเตือน "กรุณากรอกหัวข้อข่าว"', async ({ page }) => {
    const title = await seedAndOpenEdit(page, 'แก้ไข-หัวข้อว่าง');
    await step('1. ลบหัวข้อข่าวจนว่าง  2. กด "บันทึกการเปลี่ยนแปลง"', async () => {
      await editTitle(page).fill('');
      await saveChanges(page).click();
    });
    await step('Expected: แจ้งเตือน "กรุณากรอกหัวข้อข่าว" และหัวข้อเดิมไม่เปลี่ยน', async () => {
      await expect(toast(page)).toContainText('กรุณากรอกหัวข้อข่าว');
      await openList(page, title);
      await expect(newsCard(page, title)).toBeVisible();
    });
  });

  test('NEWS-T42 แก้ไขเนื้อหาข่าวแล้วบันทึก เนื้อหาใหม่ถูกบันทึก', async ({ page }) => {
    const title = await seedAndOpenEdit(page, 'แก้ไข-เนื้อหา');
    const newContent = `เนื้อหาที่แก้ไขแล้ว ${RUN_ID}`;
    await step('1. แก้เนื้อหาข่าว  2. กด "บันทึกการเปลี่ยนแปลง"', async () => {
      await page.locator('.ProseMirror').first().click();
      await page.keyboard.press('Control+A');
      await page.keyboard.type(newContent);
      await saveChanges(page).click();
    });
    await step('Expected: แจ้ง "อัปเดตข้อมูลเรียบร้อย!" และการ์ดข่าวแสดงเนื้อหาใหม่', async () => {
      await expect(toast(page)).toContainText('อัปเดตข้อมูลเรียบร้อย!');
      await openList(page, title);
      await expect(newsCard(page, title)).toContainText(newContent);
    });
  });

  test('NEWS-T43 เปลี่ยนรูปปกด้วย URL แล้วบันทึก รูปปกใหม่ถูกบันทึก', async ({ page }) => {
    const title = await seedAndOpenEdit(page, 'แก้ไข-รูปปก');
    await step('1. กด "ใส่ URL"  2. วาง URL รูป  3. กด "บันทึกการเปลี่ยนแปลง"', async () => {
      await page.getByRole('button', { name: 'ใส่ URL' }).click();
      await page.getByPlaceholder('https://example.com/image.jpg').first().fill(VALID_IMAGE_URL);
      await saveChanges(page).click();
    });
    await step('Expected: แจ้ง "อัปเดตข้อมูลเรียบร้อย!" และการ์ดข่าวแสดงรูปปกใหม่', async () => {
      await expect(toast(page)).toContainText('อัปเดตข้อมูลเรียบร้อย!');
      await openList(page, title);
      await expect(newsCard(page, title).getByRole('img', { name: title })).toHaveAttribute('src', VALID_IMAGE_URL);
    });
  });

  test('NEWS-T44 อัปโหลดรูปปกเกิน 5MB ในหน้าแก้ไข แจ้งเตือน "ไฟล์ต้องไม่เกิน 5MB"', async ({ page }) => {
    await seedAndOpenEdit(page, 'แก้ไข-รูปใหญ่');
    await step(`1. เลือกไฟล์รูปปก ${files.bigJpg.name} (ขนาดเกิน 6MB)`, () =>
      page.locator('input[type="file"]').first().setInputFiles(files.bigJpg));
    await step('Expected: แจ้งเตือน "ไฟล์ต้องไม่เกิน 5MB"', () => expect(toast(page)).toContainText('ไฟล์ต้องไม่เกิน 5MB'));
  });

  test('NEWS-T45 แก้ไขค้างแล้วกด "กลับสู่หน้าจัดการ" และยืนยันออก กลับหน้ารายการโดยไม่บันทึก', async ({ page }) => {
    const title = await seedAndOpenEdit(page, 'แก้ไข-ออกจากหน้า');
    await step('1. แก้หัวข้อ  2. กด "กลับสู่หน้าจัดการ"  3. กดยืนยันออก', async () => {
      await editTitle(page).fill('หัวข้อที่ไม่ได้บันทึก');
      await page.getByRole('button', { name: 'กลับสู่หน้าจัดการ' }).click();
      await expect(swal(page).title).toHaveText('ต้องการออกจากหน้านี้ใช่หรือไม่?');
      await swal(page).confirm.click();
    });
    await step('Expected: กลับหน้ารายการ และหัวข้อเดิมไม่เปลี่ยน', async () => {
      await expect(page.getByRole('heading', { name: 'จัดการข่าวสาร', exact: true })).toBeVisible();
      await openList(page, title);
      await expect(newsCard(page, title)).toBeVisible();
    });
  });

  test('NEWS-T46 แก้ไขค้างแล้วกด "กลับสู่หน้าจัดการ" และเลือกอยู่ต่อ ยังอยู่หน้าแก้ไข', async ({ page }) => {
    await seedAndOpenEdit(page, 'แก้ไข-อยู่ต่อ');
    await step('1. แก้หัวข้อ  2. กด "กลับสู่หน้าจัดการ"  3. กดอยู่หน้านี้ต่อ', async () => {
      await editTitle(page).fill('หัวข้อที่กำลังแก้');
      await page.getByRole('button', { name: 'กลับสู่หน้าจัดการ' }).click();
      await swal(page).cancel.click();
    });
    await step('Expected: ยังอยู่หน้าแก้ไข และหัวข้อที่กำลังแก้ยังอยู่', async () => {
      await expect(page.getByRole('heading', { name: 'แก้ไขข่าวสาร' })).toBeVisible();
      await expect(editTitle(page)).toHaveValue('หัวข้อที่กำลังแก้');
    });
  });
});

// ════════════════════════════════════════════════════════════════════════════
test.describe('2.10 การเปลี่ยนสถานะและลบข่าวสาร', () => {
  test('NEWS-T47 กดปุ่มเปลี่ยนสถานะข่าวที่เผยแพร่อยู่ สถานะเปลี่ยนเป็น Draft', async ({ page }) => {
    const title = uniqueTitle('สถานะ-เป็นร่าง');
    await addNews(page, [{ title }]);
    await openList(page, title);
    await step('1. ชี้เมาส์ที่การ์ดข่าว  2. กดปุ่มรูปตาขีดฆ่า', async () => {
      await newsCard(page, title).hover();
      await page.getByLabel(`เปลี่ยนสถานะข่าวสาร "${title}" เป็นฉบับร่าง`).click();
    });
    await step('Expected: ป้ายสถานะเปลี่ยนเป็น Draft', () =>
      expect(newsCard(page, title).getByText('Draft', { exact: true })).toBeVisible());
  });

  test('NEWS-T48 กดลบข่าวแล้วยืนยัน ข่าวถูกลบออกจากระบบ', async ({ page }) => {
    const title = uniqueTitle('ลบ-ยืนยัน');
    await addNews(page, [{ title }]);
    const dialogs = onBrowserDialog(page, true);
    await openList(page, title);
    await step('1. ชี้เมาส์ที่การ์ดข่าว  2. กดปุ่มถังขยะ  3. กด OK', async () => {
      await newsCard(page, title).hover();
      await page.getByLabel(`ลบข่าวสาร "${title}"`).click();
      await expect.poll(() => dialogs.join()).toContain('ใช่หรือไม่');
    });
    await step('Expected: ข่าวหายจากรายการ (ตรวจหลังโหลดหน้าใหม่)', async () => {
      await expect(newsCard(page, title)).toHaveCount(0);
      await openList(page, title);
      await expect(noArticles(page)).toBeVisible();
    });
  });

  test('NEWS-T49 กดลบข่าวแล้วกดยกเลิก ข่าวยังอยู่', async ({ page }) => {
    const title = uniqueTitle('ลบ-ยกเลิก');
    await addNews(page, [{ title }]);
    onBrowserDialog(page, false);
    await openList(page, title);
    await step('1. ชี้เมาส์ที่การ์ดข่าว  2. กดปุ่มถังขยะ  3. กด Cancel', async () => {
      await newsCard(page, title).hover();
      await page.getByLabel(`ลบข่าวสาร "${title}"`).click();
    });
    await step('Expected: ข่าวยังอยู่ในรายการ', async () => {
      await openList(page, title);
      await expect(newsCard(page, title)).toBeVisible();
    });
  });
});
