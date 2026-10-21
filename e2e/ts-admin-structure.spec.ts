import { test, expect, type Page } from '@playwright/test';
import { RUN_ID, uniqueTitle, swal, XSS_PAYLOAD, expectNoXss, newAdminPage } from './helpers';

/**
 * Test Scenario: จัดการประเภทข้อสอบ และจัดการหัวข้อข้อสอบ (ผู้ดูแลระบบ) — Black Box Testing
 *
 * ข้อมูลที่สร้างชื่อขึ้นต้นด้วย "E2E-" และถูกลบผ่านหน้าเว็บตอนจบ
 */

const step = test.step;

// ═════════════════════════════════════════════════════════════════════════════
// ประเภทข้อสอบ
// ═════════════════════════════════════════════════════════════════════════════
const CAT_URL = '/admin/manage_category';
const catModal = (page: Page) => ({
  name: page.getByPlaceholder('เช่น เภสัชวิทยา (Pharmacology)'),
  desc: page.getByPlaceholder('คำอธิบายรายละเอียดประเภทข้อสอบ...'),
  save: page.getByRole('button', { name: 'บันทึก', exact: true }),
  cancel: page.getByRole('button', { name: 'ยกเลิก', exact: true }),
});
const catRow = (page: Page, name: string) =>
  page.locator('tbody tr').filter({ has: page.getByText(name, { exact: true }) });

async function openCategories(page: Page, search?: string) {
  await page.goto(CAT_URL);
  await expect(page.getByRole('heading', { name: 'จัดการประเภทข้อสอบ' })).toBeVisible({ timeout: 30_000 });
  await page.getByRole('button', { name: 'ตาราง', exact: true }).click();
  if (search !== undefined) await page.getByLabel('ค้นหาประเภทข้อสอบ').fill(search);
}

async function createCategory(page: Page, name: string, desc = 'ประเภทข้อสอบสำหรับทดสอบ') {
  await page.getByRole('button', { name: 'เพิ่มประเภทข้อสอบใหม่' }).click();
  await catModal(page).name.fill(name);
  await catModal(page).desc.fill(desc);
  await catModal(page).save.click();
}

/** กล่อง "สำเร็จ!" ของหน้านี้ปิดเองใน 1.5 วินาที */
async function expectSuccessToast(page: Page, text?: string) {
  await expect(swal(page).title).toHaveText(/สำเร็จ/, { timeout: 15_000 });
  if (text) await expect(swal(page).text).toContainText(text);
  await expect(swal(page).title).toHaveCount(0, { timeout: 10_000 });
}

test.describe('9.1 จัดการประเภทข้อสอบ', () => {
  // ลบประเภทข้อสอบทดสอบทั้งหมด
  test.afterAll(async ({ browser }) => {
    const page = await newAdminPage(browser);
    await openCategories(page, 'E2E-');
    const rows = page.locator('tbody tr').filter({ hasText: 'E2E-' });
    for (let guard = 0; guard < 30 && (await rows.count()); guard++) {
      await rows.first().getByTitle('ลบ').click();
      await swal(page).confirm.click();
      await expectSuccessToast(page);
    }
    await page.context().close();
  });

  test('CATG-T01 เปิดหน้าจัดการประเภทข้อสอบ แสดงรายการประเภทพร้อมปุ่มแก้ไขและลบ', async ({ page }) => {
    await step('1. เปิดหน้า /admin/manage_category แบบตาราง', () => openCategories(page));
    await step('Expected: แสดงตารางประเภทข้อสอบ และแต่ละแถวมีปุ่ม "แก้ไข" และ "ลบ"', async () => {
      await expect(page.locator('tbody tr').first()).toBeVisible();
      await expect(page.locator('tbody tr').first().getByTitle('แก้ไข')).toBeVisible();
      await expect(page.locator('tbody tr').first().getByTitle('ลบ')).toBeVisible();
    });
  });

  test('CATG-T02 เพิ่มประเภทข้อสอบครบถ้วน บันทึกสำเร็จและแสดงในตาราง', async ({ page }) => {
    const name = uniqueTitle('ประเภท');
    await step('1. เปิดหน้าจัดการประเภทข้อสอบ', () => openCategories(page));
    await step(`2. กด "เพิ่มประเภทข้อสอบใหม่" กรอกชื่อ "${name}" และคำอธิบาย แล้วกด "บันทึก"`, () => createCategory(page, name));
    await step('Expected: แจ้ง "สร้างสำเร็จ" และค้นหาแล้วพบในตาราง', async () => {
      await expectSuccessToast(page, 'สร้างสำเร็จ');
      await page.getByLabel('ค้นหาประเภทข้อสอบ').fill(name);
      await expect(catRow(page, name)).toHaveCount(1);
    });
  });

  test('CATG-T03 ไม่กรอกชื่อประเภทข้อสอบ แจ้ง "กรุณากรอกข้อมูล" และไม่บันทึก', async ({ page }) => {
    await step('1. เปิดหน้าจัดการประเภทข้อสอบ แล้วกด "เพิ่มประเภทข้อสอบใหม่"', async () => {
      await openCategories(page);
      await page.getByRole('button', { name: 'เพิ่มประเภทข้อสอบใหม่' }).click();
    });
    await step('2. เว้นชื่อเป็นช่องว่างล้วน แล้วกด "บันทึก"', async () => {
      await catModal(page).name.fill('   ');
      await catModal(page).save.click();
    });
    await step('Expected: แจ้ง "กรุณากรอกข้อมูล"', () => expect(swal(page).title).toHaveText('กรุณากรอกข้อมูล'));
  });

  test('CATG-T04 ตั้งชื่อซ้ำกับประเภทที่มีอยู่ แจ้ง "ชื่อประเภทข้อสอบซ้ำ" และไม่บันทึกซ้ำ', async ({ page }) => {
    const name = uniqueTitle('ซ้ำ');
    await step('1. เพิ่มประเภทข้อสอบเตรียมไว้', async () => {
      await openCategories(page);
      await createCategory(page, name);
      await expectSuccessToast(page);
    });
    await step(`2. เพิ่มประเภทข้อสอบใหม่ชื่อ "${name}" อีกครั้ง`, () => createCategory(page, name));
    await step('Expected: แจ้ง "ชื่อประเภทข้อสอบซ้ำ" และในตารางมีชื่อนี้เพียง 1 แถว', async () => {
      await expect(swal(page).title).toHaveText('ชื่อประเภทข้อสอบซ้ำ');
      await swal(page).confirm.click();
      await catModal(page).cancel.click();
      await page.getByLabel('ค้นหาประเภทข้อสอบ').fill(name);
      await expect(catRow(page, name)).toHaveCount(1);
    });
  });

  test('CATG-T05 ชื่อประเภทข้อสอบมีโค้ด HTML/Script แสดงเป็นข้อความ ไม่ถูกรัน (XSS)', async ({ page }) => {
    const name = `${uniqueTitle('XSS')} ${XSS_PAYLOAD}`;
    await step('1. เพิ่มประเภทข้อสอบที่ชื่อมีโค้ด <img onerror>', async () => {
      await openCategories(page);
      await createCategory(page, name);
      await expectSuccessToast(page);
    });
    await step('Expected: แสดงชื่อเป็นข้อความในตาราง และโค้ดไม่ถูกรัน', async () => {
      await openCategories(page, 'XSS');
      await expect(page.getByText(XSS_PAYLOAD, { exact: false }).first()).toBeVisible();
      await expectNoXss(page);
    });
  });

  test('CATG-T06 แก้ไขชื่อประเภทข้อสอบ บันทึกสำเร็จและแสดงชื่อใหม่', async ({ page }) => {
    const name = uniqueTitle('ก่อนแก้');
    const renamed = uniqueTitle('หลังแก้');
    await step('1. เพิ่มประเภทข้อสอบเตรียมไว้', async () => {
      await openCategories(page);
      await createCategory(page, name);
      await expectSuccessToast(page);
    });
    await step('2. ค้นหา กดปุ่ม "แก้ไข" เปลี่ยนชื่อ แล้วกด "บันทึก"', async () => {
      await page.getByLabel('ค้นหาประเภทข้อสอบ').fill(name);
      await catRow(page, name).getByTitle('แก้ไข').click();
      await expect(catModal(page).name).toHaveValue(name);
      await catModal(page).name.fill(renamed);
      await catModal(page).save.click();
    });
    await step('Expected: แจ้ง "แก้ไขสำเร็จ" และค้นหาชื่อใหม่พบ ชื่อเดิมไม่พบ', async () => {
      await expectSuccessToast(page, 'แก้ไขสำเร็จ');
      await page.getByLabel('ค้นหาประเภทข้อสอบ').fill(renamed);
      await expect(catRow(page, renamed)).toHaveCount(1);
      await page.getByLabel('ค้นหาประเภทข้อสอบ').fill(name);
      await expect(page.getByText('ไม่พบข้อมูลที่ค้นหา')).toBeVisible();
    });
  });

  test('CATG-T07 ค้นหาด้วยคำที่ไม่มีในระบบ แสดง "ไม่พบข้อมูลที่ค้นหา"', async ({ page }) => {
    await step(`1. เปิดหน้าจัดการประเภทข้อสอบ แล้วค้นหา "ไม่มีจริง-${RUN_ID}"`, () => openCategories(page, `ไม่มีจริง-${RUN_ID}`));
    await step('Expected: แสดง "ไม่พบข้อมูลที่ค้นหา"', () => expect(page.getByText('ไม่พบข้อมูลที่ค้นหา')).toBeVisible());
  });

  test('CATG-T08 กดลบประเภทข้อสอบแล้วกด "ยกเลิก" ประเภทยังอยู่', async ({ page }) => {
    const name = uniqueTitle('ยกเลิกลบ');
    await step('1. เพิ่มประเภทข้อสอบเตรียมไว้', async () => {
      await openCategories(page);
      await createCategory(page, name);
      await expectSuccessToast(page);
    });
    await step('2. ค้นหา กดปุ่ม "ลบ" แล้วกด "ยกเลิก"', async () => {
      await page.getByLabel('ค้นหาประเภทข้อสอบ').fill(name);
      await catRow(page, name).getByTitle('ลบ').click();
      await expect(swal(page).title).toHaveText('ยืนยันการลบประเภทข้อสอบ');
      await swal(page).cancel.click();
    });
    await step('Expected: ประเภทยังอยู่ในตาราง', () => expect(catRow(page, name)).toHaveCount(1));
  });

  test('CATG-T09 กดลบประเภทข้อสอบแล้วยืนยัน ประเภทถูกลบออกจากตาราง', async ({ page }) => {
    const name = uniqueTitle('ลบ');
    await step('1. เพิ่มประเภทข้อสอบเตรียมไว้', async () => {
      await openCategories(page);
      await createCategory(page, name);
      await expectSuccessToast(page);
    });
    await step('2. ค้นหา กดปุ่ม "ลบ" แล้วกด "ใช่, ลบเลย"', async () => {
      await page.getByLabel('ค้นหาประเภทข้อสอบ').fill(name);
      await catRow(page, name).getByTitle('ลบ').click();
      await swal(page).confirm.click();
    });
    await step('Expected: แจ้งลบสำเร็จ และค้นหาไม่พบประเภทนี้', async () => {
      await expectSuccessToast(page, 'ลบประเภทข้อสอบ');
      await openCategories(page, name);
      await expect(page.getByText('ไม่พบข้อมูลที่ค้นหา')).toBeVisible();
    });
  });

  test('CATG-T10 สลับมุมมองเป็น "การ์ด" แสดงประเภทข้อสอบเป็นการ์ด', async ({ page }) => {
    await step('1. เปิดหน้าจัดการประเภทข้อสอบ', () => openCategories(page));
    await step('2. กดปุ่ม "การ์ด"', () => page.getByRole('button', { name: 'การ์ด', exact: true }).click());
    await step('Expected: ไม่แสดงตาราง และมีปุ่มแก้ไขในการ์ด', async () => {
      await expect(page.locator('table')).toHaveCount(0);
      await expect(page.getByTitle('แก้ไข').first()).toBeVisible();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
// หัวข้อข้อสอบ (หัวข้อหลัก / หัวข้อย่อย)
// ═════════════════════════════════════════════════════════════════════════════
const TOPIC_URL = '/admin/manage_topics';

async function openTopics(page: Page, search?: string) {
  await page.goto(TOPIC_URL);
  await expect(page.getByRole('heading', { name: 'จัดการหัวข้อข้อสอบ' })).toBeVisible();
  if (search !== undefined) await page.getByLabel('ค้นหาหัวข้อหลัก หรือหัวข้อย่อย').fill(search);
}

async function createTopic(page: Page, name: string) {
  await page.getByRole('button', { name: 'สร้างหัวข้อหลักใหม่' }).click();
  await page.getByLabel('ชื่อหัวข้อหลัก', { exact: true }).fill(name);
  await page.getByLabel('คำอธิบายหัวข้อหลัก').fill('หัวข้อสำหรับทดสอบ');
  await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
}

async function expectSaved(page: Page) {
  await expect(swal(page).title).toHaveText('บันทึกสำเร็จ', { timeout: 15_000 });
  await expect(swal(page).title).toHaveCount(0, { timeout: 10_000 });
}

test.describe('9.2 จัดการหัวข้อข้อสอบ', () => {
  // ลบหัวข้อหลักทดสอบทั้งหมด (หัวข้อย่อยถูกลบตามไปด้วย)
  test.afterAll(async ({ browser }) => {
    const page = await newAdminPage(browser);
    await openTopics(page, 'E2E-');
    const del = page.getByRole('button', { name: /^ลบหัวข้อหลัก E2E-/ });
    for (let guard = 0; guard < 30 && (await del.count()); guard++) {
      await del.first().click();
      await swal(page).confirm.click();
      await expect(swal(page).title).toHaveText(/ลบสำเร็จ/, { timeout: 15_000 });
      await expect(swal(page).title).toHaveCount(0, { timeout: 10_000 });
    }
    await page.context().close();
  });

  test('TOP-T01 เปิดหน้าจัดการหัวข้อข้อสอบ แสดงหัวข้อหลักพร้อมจำนวนหัวข้อย่อย', async ({ page }) => {
    await step('1. เปิดหน้า /admin/manage_topics', () => openTopics(page));
    await step('Expected: แสดงหัวข้อหลักอย่างน้อย 1 หัวข้อ และปุ่ม "สร้างหัวข้อหลักใหม่"', async () => {
      await expect(page.getByRole('button', { name: /^แก้ไขหัวข้อหลัก / }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: 'สร้างหัวข้อหลักใหม่' })).toBeVisible();
    });
  });

  test('TOP-T02 สร้างหัวข้อหลักใหม่ บันทึกสำเร็จและค้นหาพบ', async ({ page }) => {
    const name = uniqueTitle('หัวข้อหลัก');
    await step('1. เปิดหน้าจัดการหัวข้อ', () => openTopics(page));
    await step(`2. กด "สร้างหัวข้อหลักใหม่" กรอกชื่อ "${name}" แล้วกด "บันทึก"`, () => createTopic(page, name));
    await step('Expected: แจ้ง "บันทึกสำเร็จ" และค้นหาแล้วพบหัวข้อนี้', async () => {
      await expectSaved(page);
      await page.getByLabel('ค้นหาหัวข้อหลัก หรือหัวข้อย่อย').fill(name);
      await expect(page.getByRole('heading', { name, exact: true })).toBeVisible();
    });
  });

  test('TOP-T03 ไม่กรอกชื่อหัวข้อหลักแล้วกดบันทึก ระบบไม่บันทึกและหน้าต่างยังเปิดอยู่', async ({ page }) => {
    await step('1. เปิดหน้าจัดการหัวข้อ แล้วกด "สร้างหัวข้อหลักใหม่"', async () => {
      await openTopics(page);
      await page.getByRole('button', { name: 'สร้างหัวข้อหลักใหม่' }).click();
    });
    await step('2. ไม่กรอกชื่อ แล้วกด "บันทึก"', () => page.getByRole('button', { name: 'บันทึก', exact: true }).click());
    await step('Expected: ไม่มีข้อความ "บันทึกสำเร็จ" และหน้าต่างสร้างหัวข้อหลักยังเปิดอยู่', async () => {
      await expect(swal(page).title).toHaveCount(0);
      await expect(page.getByLabel('ชื่อหัวข้อหลัก', { exact: true })).toBeVisible();
    });
  });

  test('TOP-T04 เพิ่มหัวข้อย่อยในหัวข้อหลัก บันทึกสำเร็จและแสดงใต้หัวข้อหลัก', async ({ page }) => {
    const topic = uniqueTitle('มีหัวข้อย่อย');
    const sub = uniqueTitle('หัวข้อย่อย');
    await step('1. สร้างหัวข้อหลักเตรียมไว้ แล้วค้นหา', async () => {
      await openTopics(page);
      await createTopic(page, topic);
      await expectSaved(page);
      await page.getByLabel('ค้นหาหัวข้อหลัก หรือหัวข้อย่อย').fill(topic);
    });
    await step(`2. กด "เพิ่มหัวข้อย่อย" ของหัวข้อหลัก กรอกชื่อ "${sub}" แล้วกด "บันทึก"`, async () => {
      const card = page.getByRole('heading', { name: topic, exact: true }).locator('xpath=ancestor::div[.//button[contains(.,"เพิ่มหัวข้อย่อย")]][1]');
      await card.getByRole('button', { name: /เพิ่มหัวข้อย่อย/ }).first().click();
      await page.getByLabel('ชื่อหัวข้อย่อย', { exact: true }).fill(sub);
      await page.getByLabel('คำอธิบายหัวข้อย่อย').fill('หัวข้อย่อยสำหรับทดสอบ');
      await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
    });
    await step('Expected: แจ้ง "บันทึกสำเร็จ" และค้นหาชื่อหัวข้อย่อยแล้วพบเมื่อขยายหัวข้อ', async () => {
      await expectSaved(page);
      await page.getByLabel('ค้นหาหัวข้อหลัก หรือหัวข้อย่อย').fill(sub);
      await page.getByRole('button', { name: /ขยายทั้งหมด/ }).click();
      await expect(page.getByRole('button', { name: `แก้ไขหัวข้อย่อย ${sub}` })).toBeVisible();
    });
  });

  test('TOP-T05 แก้ไขชื่อหัวข้อหลัก บันทึกสำเร็จและแสดงชื่อใหม่', async ({ page }) => {
    const name = uniqueTitle('ก่อนแก้หัวข้อ');
    const renamed = uniqueTitle('หลังแก้หัวข้อ');
    await step('1. สร้างหัวข้อหลักเตรียมไว้ แล้วค้นหา', async () => {
      await openTopics(page);
      await createTopic(page, name);
      await expectSaved(page);
      await page.getByLabel('ค้นหาหัวข้อหลัก หรือหัวข้อย่อย').fill(name);
    });
    await step('2. กดปุ่มแก้ไขหัวข้อหลัก เปลี่ยนชื่อ แล้วกด "บันทึก"', async () => {
      await page.getByRole('button', { name: `แก้ไขหัวข้อหลัก ${name}` }).click();
      await page.getByLabel('ชื่อหัวข้อหลัก', { exact: true }).fill(renamed);
      await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
    });
    await step('Expected: แจ้ง "บันทึกสำเร็จ" และค้นหาชื่อใหม่พบ', async () => {
      await expectSaved(page);
      await page.getByLabel('ค้นหาหัวข้อหลัก หรือหัวข้อย่อย').fill(renamed);
      await expect(page.getByRole('heading', { name: renamed, exact: true })).toBeVisible();
    });
  });

  test('TOP-T06 ลบหัวข้อหลักแล้วกด "ยกเลิก" หัวข้อยังอยู่', async ({ page }) => {
    const name = uniqueTitle('ยกเลิกลบหัวข้อ');
    await step('1. สร้างหัวข้อหลักเตรียมไว้ แล้วค้นหา', async () => {
      await openTopics(page);
      await createTopic(page, name);
      await expectSaved(page);
      await page.getByLabel('ค้นหาหัวข้อหลัก หรือหัวข้อย่อย').fill(name);
    });
    await step('2. กดปุ่มลบหัวข้อหลัก แล้วกด "ยกเลิก"', async () => {
      await page.getByRole('button', { name: `ลบหัวข้อหลัก ${name}` }).click();
      await expect(swal(page).title).toHaveText('ยืนยันการลบหัวข้อหลัก?');
      await swal(page).cancel.click();
    });
    await step('Expected: หัวข้อยังแสดงอยู่', () => expect(page.getByRole('heading', { name, exact: true })).toBeVisible());
  });

  test('TOP-T07 ลบหัวข้อหลักแล้วกด "ยืนยันลบ" หัวข้อถูกลบ', async ({ page }) => {
    const name = uniqueTitle('ลบหัวข้อ');
    await step('1. สร้างหัวข้อหลักเตรียมไว้ แล้วค้นหา', async () => {
      await openTopics(page);
      await createTopic(page, name);
      await expectSaved(page);
      await page.getByLabel('ค้นหาหัวข้อหลัก หรือหัวข้อย่อย').fill(name);
    });
    await step('2. กดปุ่มลบหัวข้อหลัก แล้วกด "ยืนยันลบ"', async () => {
      await page.getByRole('button', { name: `ลบหัวข้อหลัก ${name}` }).click();
      await swal(page).confirm.click();
    });
    await step('Expected: แจ้งลบสำเร็จ และค้นหาแล้วไม่พบหัวข้อนี้', async () => {
      await expect(swal(page).title).toHaveText(/ลบสำเร็จ/, { timeout: 15_000 });
      await expect(swal(page).title).toHaveCount(0, { timeout: 10_000 });
      await expect(page.getByRole('heading', { name, exact: true })).toHaveCount(0);
    });
  });

  test('TOP-T08 กด "ดูรายงานสถิติ" แสดงรายงานสถิติโครงสร้างหัวข้อข้อสอบ', async ({ page }) => {
    await step('1. เปิดหน้าจัดการหัวข้อ', () => openTopics(page));
    await step('2. กด "ดูรายงานสถิติ"', () => page.getByRole('button', { name: /ดูรายงานสถิติ/ }).click());
    await step('Expected: แสดง "รายงานสถิติโครงสร้างหัวข้อข้อสอบ" พร้อมกราฟจำนวนข้อสอบรายหัวข้อ', async () => {
      await expect(page.getByRole('heading', { name: 'รายงานสถิติโครงสร้างหัวข้อข้อสอบ' })).toBeVisible();
      await expect(page.getByRole('heading', { name: /จำนวนข้อสอบรายหัวข้อ/ })).toBeVisible();
    });
  });
});
