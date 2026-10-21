import { test, expect, type Page } from '@playwright/test';
import {
  uniqueTitle, inputDateThisMonth, thaiMonthHeader, swal, toast, XSS_PAYLOAD, expectNoXss,
  GUEST_STATE, hasStudent, SKIP_NO_STUDENT, STUDENT_AUTH_FILE, newStudentPage, RUN_ID,
} from './helpers';

/**
 * Test Scenario: ปฏิทินการสอบ กำหนดการส่วนตัว และบันทึกสรุป (ผู้เรียน) — Black Box Testing
 *
 * กำหนดการส่วนตัวและโน้ตที่สร้างชื่อขึ้นต้นด้วย "E2E-" และถูกลบผ่านหน้าเว็บตอนจบ
 */

const URL = '/user/calendar';
const step = test.step;

// ─── การทำงานบนหน้าจอที่ใช้ซ้ำ ────────────────────────────────────────────────
const grid = (page: Page) => page.locator('div.grid.grid-cols-7').first();
/** การ์ดกำหนดการในช่องวันที่ของปฏิทิน (ชื่อเต็มอยู่ใน title) */
const chip = (page: Page, title: string) =>
  grid(page).getByTitle(title, { exact: true }).locator('xpath=ancestor::button[1]');
/** ปุ่มปิดหน้าต่างรายละเอียดกำหนดการ */
const closeDetail = (page: Page) => page.locator('button[aria-label="ปิด"]').filter({ visible: true }).first().click();
const allChips = (page: Page) => grid(page).locator('button:has(span[title])');
const trackChip = (page: Page, label: string) =>
  page.getByRole('group', { name: 'กรองตามสายการสอบ' }).getByRole('button', { name: label, exact: true });
const viewTab = (page: Page, label: string) =>
  page.getByRole('tablist', { name: 'แสดงกำหนดการ' }).getByRole('tab', { name: label });
const eventForm = (page: Page) => ({
  title: page.locator('#pe-title'),
  start: page.locator('#pe-start'),
  end: page.locator('#pe-end'),
  desc: page.locator('#pe-desc'),
  save: page.locator('form').getByRole('button', { name: 'บันทึก', exact: true }),
  cancel: page.locator('form').getByRole('button', { name: 'ยกเลิก', exact: true }),
});

async function openCalendar(page: Page) {
  await page.goto(URL);
  await expect(page.getByRole('heading', { name: 'ปฏิทินกำหนดการสอบ' })).toBeVisible();
  await expect(page.getByText(thaiMonthHeader(0))).toBeVisible();
}

/** เพิ่มกำหนดการของฉันผ่านปุ่ม "เพิ่มกำหนดการของฉัน" */
async function addPersonalEvent(page: Page, title: string, startDay: number, endDay = startDay, desc?: string) {
  await page.getByRole('button', { name: 'เพิ่มกำหนดการของฉัน', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'เพิ่มกำหนดการของฉัน' })).toBeVisible();
  const f = eventForm(page);
  await f.title.fill(title);
  await f.start.fill(inputDateThisMonth(startDay));
  await f.end.fill(inputDateThisMonth(endDay));
  if (desc) await f.desc.fill(desc);
  await f.save.click();
}

/** เปิดรายละเอียดกำหนดการจากปฏิทิน */
async function openEvent(page: Page, title: string) {
  await chip(page, title).first().click();
  await expect(page.getByRole('heading', { name: title, level: 4 })).toBeVisible();
}

/** ลบกำหนดการของฉันผ่านหน้าต่างรายละเอียด (ใช้เก็บกวาด) */
async function deletePersonalEvent(page: Page, title: string) {
  await openCalendar(page);
  if (!(await chip(page, title).count())) return;
  await openEvent(page, title);
  await page.getByRole('button', { name: 'ลบ', exact: true }).click();
  await expect(swal(page).title).toHaveText('ลบกำหนดการนี้?');
  await swal(page).confirm.click();
  await expect(chip(page, title)).toHaveCount(0);
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe('6.1 การดูปฏิทินการสอบ', () => {
  test.use({ storageState: GUEST_STATE });

  test('UCAL-T01 ผู้ที่ยังไม่เข้าสู่ระบบเปิดหน้าปฏิทิน แสดงปฏิทินเดือนปัจจุบันได้', async ({ page }) => {
    await step('1. เปิดหน้า /user/calendar โดยยังไม่เข้าสู่ระบบ', () => openCalendar(page));
    await step(`Expected: แสดงปฏิทินเดือน "${thaiMonthHeader(0)}" และข้อความชวนเข้าสู่ระบบเพื่อบันทึกโน้ต`, async () => {
      await expect(grid(page)).toBeVisible();
      await expect(page.getByText('เข้าสู่ระบบเพื่อบันทึกโน้ต', { exact: false })).toBeVisible();
    });
  });

  test('UCAL-T02 ผู้ที่ยังไม่เข้าสู่ระบบกดเพิ่มกำหนดการของฉัน ระบบให้เข้าสู่ระบบก่อน', async ({ page }) => {
    await step('1. เปิดหน้าปฏิทินโดยยังไม่เข้าสู่ระบบ', () => openCalendar(page));
    await step('2. กดปุ่ม "เพิ่มกำหนดการของฉัน"', () =>
      page.getByRole('button', { name: 'เพิ่มกำหนดการของฉัน', exact: true }).click());
    await step('Expected: แจ้ง "กรุณาเข้าสู่ระบบ"', async () => {
      await expect(swal(page).title).toHaveText('กรุณาเข้าสู่ระบบ');
    });
  });

  test('UCAL-T03 กดปุ่มเดือนถัดไปและเดือนก่อนหน้า หัวปฏิทินเปลี่ยนตามเดือน', async ({ page }) => {
    await step('1. เปิดหน้าปฏิทิน', () => openCalendar(page));
    await step('2. กดปุ่ม "เดือนถัดไป"', () => page.getByRole('button', { name: 'เดือนถัดไป' }).click());
    await step(`Expected: แสดง "${thaiMonthHeader(1)}"`, () => expect(page.getByText(thaiMonthHeader(1))).toBeVisible());
    await step('3. กดปุ่ม "เดือนก่อนหน้า" 2 ครั้ง', async () => {
      await page.getByRole('button', { name: 'เดือนก่อนหน้า' }).click();
      await page.getByRole('button', { name: 'เดือนก่อนหน้า' }).click();
    });
    await step(`Expected: แสดง "${thaiMonthHeader(-1)}"`, () => expect(page.getByText(thaiMonthHeader(-1))).toBeVisible());
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('6.2 การกรองกำหนดการตามสายการสอบ (CC / IP / PC / PHCP)', () => {
  test.use({ storageState: GUEST_STATE });

  /** นับการ์ดกำหนดการของแต่ละสายในเดือนนี้และเดือนหน้า (กันกรณีเดือนนี้ไม่มีกำหนดการ) */
  async function countChips(page: Page) {
    let total = await allChips(page).count();
    return total;
  }

  test('UCAL-T04 แสดงปุ่มกรองสายการสอบครบ 5 ปุ่ม เริ่มต้นที่ "ทุกสาย"', async ({ page }) => {
    await step('1. เปิดหน้าปฏิทิน', () => openCalendar(page));
    await step('Expected: มีปุ่ม ทุกสาย CC IP PC PHCP และปุ่ม "ทุกสาย" ถูกเลือกอยู่', async () => {
      for (const t of ['ทุกสาย', 'CC', 'IP', 'PC', 'PHCP']) await expect(trackChip(page, t)).toBeVisible();
      await expect(trackChip(page, 'ทุกสาย')).toHaveAttribute('aria-pressed', 'true');
    });
  });

  test('UCAL-T05 เลือกสาย "CC" แสดงกำหนดการไม่เกินจำนวนเมื่อเลือก "ทุกสาย"', async ({ page }) => {
    await step('1. เปิดหน้าปฏิทิน (ทุกสาย)', () => openCalendar(page));
    const all = await countChips(page);
    await step('2. กดปุ่ม "CC"', () => trackChip(page, 'CC').click());
    await step('Expected: ปุ่ม CC ถูกเลือก และจำนวนกำหนดการน้อยกว่าหรือเท่ากับแบบทุกสาย', async () => {
      await expect(trackChip(page, 'CC')).toHaveAttribute('aria-pressed', 'true');
      expect(await countChips(page)).toBeLessThanOrEqual(all);
    });
  });

  test('UCAL-T06 เลือกสาย "PC" แสดงข้อความว่ารวมกำหนดการ CC ที่ทุกคนต้องสอบด้วย', async ({ page }) => {
    await step('1. เปิดหน้าปฏิทิน', () => openCalendar(page));
    const cc = await (async () => { await trackChip(page, 'CC').click(); return countChips(page); })();
    await step('2. กดปุ่ม "PC"', () => trackChip(page, 'PC').click());
    await step('Expected: แสดง "รวมกำหนดการ CC ที่ทุกคนต้องสอบ" และจำนวนกำหนดการไม่น้อยกว่าแบบ CC อย่างเดียว', async () => {
      await expect(page.getByText('รวมกำหนดการ CC ที่ทุกคนต้องสอบ')).toBeVisible();
      expect(await countChips(page)).toBeGreaterThanOrEqual(cc);
    });
  });

  test('UCAL-T07 เลือกสายแล้วโหลดหน้าใหม่ ระบบจำสายที่เลือกไว้', async ({ page }) => {
    await step('1. เปิดหน้าปฏิทินแล้วกดปุ่ม "IP"', async () => {
      await openCalendar(page);
      await trackChip(page, 'IP').click();
    });
    await step('2. โหลดหน้าใหม่', () => page.reload());
    await step('Expected: ปุ่ม "IP" ยังถูกเลือกอยู่', async () => {
      await expect(trackChip(page, 'IP')).toHaveAttribute('aria-pressed', 'true');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('6.3 กำหนดการของฉัน', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.use({ storageState: STUDENT_AUTH_FILE });

  const created: string[] = [];
  // ลบกำหนดการของฉันที่ชื่อขึ้นต้นด้วย "E2E-" ในเดือนนี้ทั้งหมด (รวมที่ค้างจากรอบก่อนที่ล้มกลางทาง)
  test.afterAll(async ({ browser }) => {
    const page = await newStudentPage(browser);
    await openCalendar(page);
    await viewTab(page, 'ของฉัน').click();
    const leftovers = new Set([
      ...created,
      ...(await grid(page).locator('span[title^="E2E-"]').evaluateAll((els) => els.map((e) => e.getAttribute('title')!))),
    ]);
    for (const title of leftovers) await deletePersonalEvent(page, title).catch(() => {});
    await page.context().close();
  });

  test('UCAL-T08 เพิ่มกำหนดการของฉันครบถ้วน บันทึกสำเร็จและแสดงในปฏิทินพร้อมป้าย "เห็นเฉพาะคุณ"', async ({ page }) => {
    const title = uniqueTitle('อ่านทบทวน');
    await step('1. เปิดหน้าปฏิทิน', () => openCalendar(page));
    await step(`2. กด "เพิ่มกำหนดการของฉัน" กรอกชื่อ "${title}" วันที่ 20-21 ของเดือนนี้ และรายละเอียด แล้วกด "บันทึก"`, async () => {
      await addPersonalEvent(page, title, 20, 21, 'อ่านเภสัชวิทยา บทที่ 1-3');
      created.push(title);
    });
    await step('Expected: แจ้ง "เพิ่มกำหนดการของฉันแล้ว" แสดงในปฏิทิน และรายละเอียดมีป้าย "เห็นเฉพาะคุณ"', async () => {
      await expect(toast(page)).toContainText('เพิ่มกำหนดการของฉันแล้ว');
      await expect(chip(page, title).first()).toBeVisible();
      await openEvent(page, title);
      await expect(page.getByText('เห็นเฉพาะคุณ')).toBeVisible();
      await expect(page.getByText('อ่านเภสัชวิทยา บทที่ 1-3')).toBeVisible();
    });
  });

  test('UCAL-T09 ไม่กรอกชื่อกำหนดการ แจ้ง "กรุณากรอกชื่อกำหนดการ" และไม่บันทึก', async ({ page }) => {
    await step('1. เปิดหน้าปฏิทิน แล้วกด "เพิ่มกำหนดการของฉัน"', async () => {
      await openCalendar(page);
      await page.getByRole('button', { name: 'เพิ่มกำหนดการของฉัน', exact: true }).click();
    });
    await step('2. เว้นชื่อว่าง (ช่องว่างล้วน) กรอกวันที่ แล้วกด "บันทึก"', async () => {
      await eventForm(page).title.fill('   ');
      await eventForm(page).start.fill(inputDateThisMonth(10));
      await eventForm(page).save.click();
    });
    await step('Expected: แสดง "กรุณากรอกชื่อกำหนดการ" และหน้าต่างยังเปิดอยู่', async () => {
      await expect(page.getByText('กรุณากรอกชื่อกำหนดการ')).toBeVisible();
      await expect(eventForm(page).title).toBeVisible();
    });
  });

  test('UCAL-T10 วันที่สิ้นสุดอยู่ก่อนวันที่เริ่ม แจ้ง "วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม"', async ({ page }) => {
    await step('1. เปิดหน้าปฏิทิน แล้วกด "เพิ่มกำหนดการของฉัน"', async () => {
      await openCalendar(page);
      await page.getByRole('button', { name: 'เพิ่มกำหนดการของฉัน', exact: true }).click();
    });
    await step('2. กรอกชื่อ วันที่เริ่มวันที่ 15 และวันที่สิ้นสุดวันที่ 10 แล้วกด "บันทึก"', async () => {
      await eventForm(page).title.fill(uniqueTitle('วันผิด'));
      await eventForm(page).start.fill(inputDateThisMonth(15));
      await eventForm(page).end.fill(inputDateThisMonth(10));
      await eventForm(page).save.click();
    });
    await step('Expected: ช่องวันที่สิ้นสุดแจ้งว่าต้องไม่ก่อนวันที่เริ่ม หน้าต่างยังเปิดอยู่และไม่บันทึก', async () => {
      // ช่องวันที่สิ้นสุดกำหนดค่าต่ำสุดเป็นวันที่เริ่ม เบราว์เซอร์จึงไม่ยอมส่งฟอร์ม
      expect(await eventForm(page).end.evaluate((el: HTMLInputElement) => el.validity.rangeUnderflow)).toBe(true);
      await expect(page.getByRole('heading', { name: 'เพิ่มกำหนดการของฉัน' })).toBeVisible();
      await expect(toast(page)).toHaveCount(0);
    });
  });

  test('UCAL-T11 ชื่อกำหนดการมีโค้ด HTML/Script แสดงเป็นข้อความ ไม่ถูกรัน (XSS)', async ({ page }) => {
    const title = `${uniqueTitle('XSS')} ${XSS_PAYLOAD}`;
    await step('1. เปิดหน้าปฏิทิน', () => openCalendar(page));
    await step('2. เพิ่มกำหนดการของฉันที่ชื่อมีโค้ด <img onerror>', async () => {
      await addPersonalEvent(page, title, 12);
      created.push(title);
      await expect(toast(page)).toContainText('เพิ่มกำหนดการของฉันแล้ว');
    });
    await step('Expected: เปิดรายละเอียดแล้วเห็นโค้ดเป็นข้อความ และโค้ดไม่ถูกรัน', async () => {
      await openEvent(page, title);
      await expectNoXss(page);
    });
  });

  test('UCAL-T12 แก้ไขชื่อกำหนดการของฉัน บันทึกสำเร็จและแสดงชื่อใหม่', async ({ page }) => {
    const title = uniqueTitle('ก่อนแก้');
    const newTitle = uniqueTitle('หลังแก้');
    await step('1. เพิ่มกำหนดการของฉันเตรียมไว้', async () => {
      await openCalendar(page);
      await addPersonalEvent(page, title, 18);
      created.push(title, newTitle);
      await expect(chip(page, title).first()).toBeVisible();
    });
    await step('2. เปิดรายละเอียด กด "แก้ไข" เปลี่ยนชื่อ แล้วกด "บันทึก"', async () => {
      await openEvent(page, title);
      await page.getByRole('button', { name: 'แก้ไข', exact: true }).click();
      await expect(page.getByRole('heading', { name: 'แก้ไขกำหนดการของฉัน' })).toBeVisible();
      await eventForm(page).title.fill(newTitle);
      await eventForm(page).save.click();
    });
    await step('Expected: แจ้ง "แก้ไขกำหนดการของฉันแล้ว" ปฏิทินแสดงชื่อใหม่แทนชื่อเดิม', async () => {
      await expect(toast(page)).toContainText('แก้ไขกำหนดการของฉันแล้ว');
      await expect(chip(page, newTitle).first()).toBeVisible();
      await expect(chip(page, title)).toHaveCount(0);
    });
  });

  test('UCAL-T13 ลบกำหนดการของฉันแล้วกด "ยกเลิก" กำหนดการยังอยู่', async ({ page }) => {
    const title = uniqueTitle('ยกเลิกลบ');
    await step('1. เพิ่มกำหนดการของฉันเตรียมไว้', async () => {
      await openCalendar(page);
      await addPersonalEvent(page, title, 22);
      created.push(title);
    });
    await step('2. เปิดรายละเอียด กด "ลบ" แล้วกด "ยกเลิก"', async () => {
      await openEvent(page, title);
      await page.getByRole('button', { name: 'ลบ', exact: true }).click();
      await expect(swal(page).title).toHaveText('ลบกำหนดการนี้?');
      await swal(page).cancel.click();
    });
    await step('Expected: กำหนดการยังแสดงในปฏิทิน', async () => {
      await closeDetail(page);
      await expect(chip(page, title).first()).toBeVisible();
    });
  });

  test('UCAL-T14 ลบกำหนดการของฉันแล้วยืนยัน กำหนดการหายจากปฏิทิน', async ({ page }) => {
    const title = uniqueTitle('ลบ');
    await step('1. เพิ่มกำหนดการของฉันเตรียมไว้', async () => {
      await openCalendar(page);
      await addPersonalEvent(page, title, 23);
      created.push(title);
    });
    await step('2. เปิดรายละเอียด กด "ลบ" แล้วกด "ลบ" ยืนยัน', async () => {
      await openEvent(page, title);
      await page.getByRole('button', { name: 'ลบ', exact: true }).click();
      await swal(page).confirm.click();
    });
    await step('Expected: แจ้ง "ลบกำหนดการของฉันแล้ว" และกำหนดการหายจากปฏิทิน', async () => {
      await expect(toast(page)).toContainText('ลบกำหนดการของฉันแล้ว');
      await expect(chip(page, title)).toHaveCount(0);
    });
  });

  test('UCAL-T15 แท็บ "ของฉัน" แสดงเฉพาะกำหนดการส่วนตัว ไม่แสดงกำหนดการของผู้ดูแลระบบ', async ({ page }) => {
    const title = uniqueTitle('ของฉัน');
    await step('1. เพิ่มกำหนดการของฉันเตรียมไว้', async () => {
      await openCalendar(page);
      await addPersonalEvent(page, title, 19);
      created.push(title);
    });
    await step('2. กดแท็บ "ของฉัน"', () => viewTab(page, 'ของฉัน').click());
    await step('Expected: การ์ดทุกใบในปฏิทินเป็นกำหนดการส่วนตัว และมีกำหนดการที่เพิ่งเพิ่ม', async () => {
      await expect(chip(page, title).first()).toBeVisible();
      const chips = allChips(page);
      const n = await chips.count();
      for (let i = 0; i < n; i++) await expect(chips.nth(i).locator('svg.lucide-user')).toHaveCount(1);
    });
  });

  test('UCAL-T16 มาร์คกำหนดการของผู้ดูแลระบบ แล้วแสดงในแท็บ "ที่มาร์คไว้" และยกเลิกการมาร์คได้', async ({ page }) => {
    await step('1. เปิดหน้าปฏิทิน (ทุกสาย)', async () => {
      await openCalendar(page);
      await trackChip(page, 'ทุกสาย').click();
    });
    // หาเดือนที่มีกำหนดการของผู้ดูแลระบบ (ไม่เกิน 3 เดือนข้างหน้า)
    const adminChip = grid(page).locator('button:has(span[title]):not(:has(svg.lucide-user))').first();
    for (let i = 0; i < 3 && !(await adminChip.count()); i++) {
      await page.getByRole('button', { name: 'เดือนถัดไป' }).click();
    }
    test.skip(!(await adminChip.count()), 'ไม่มีกำหนดการของผู้ดูแลระบบในช่วง 3 เดือน');
    const title = (await adminChip.locator('span[title]').first().getAttribute('title'))!;
    await step(`2. เปิดรายละเอียดกำหนดการ "${title}" แล้วกดปุ่ม "มาร์ค"`, async () => {
      await adminChip.click();
      const markButton = page.getByRole('button', { name: /^มาร์ค(แล้ว)?$/ });
      if ((await markButton.getAttribute('aria-pressed')) === 'true') await markButton.click(); // เริ่มจากยังไม่มาร์ค
      await page.getByRole('button', { name: 'มาร์ค', exact: true }).click();
    });
    await step('Expected: แจ้ง "มาร์คกำหนดการนี้แล้ว" และปุ่มเปลี่ยนเป็น "มาร์คแล้ว"', async () => {
      await expect(toast(page)).toContainText('มาร์คกำหนดการนี้แล้ว');
      await expect(page.getByRole('button', { name: 'มาร์คแล้ว' })).toHaveAttribute('aria-pressed', 'true');
    });
    await step('3. ปิดหน้าต่าง แล้วกดแท็บ "ที่มาร์คไว้"', async () => {
      await closeDetail(page);
      await viewTab(page, 'ที่มาร์คไว้').click();
    });
    await step('Expected: แสดงกำหนดการที่มาร์คไว้', () => expect(chip(page, title).first()).toBeVisible());
    await step('4. เปิดรายละเอียดแล้วกด "มาร์คแล้ว" เพื่อยกเลิก', async () => {
      await chip(page, title).first().click();
      await page.getByRole('button', { name: 'มาร์คแล้ว' }).click();
    });
    await step('Expected: แจ้ง "ยกเลิกการมาร์คแล้ว"', () => expect(toast(page)).toContainText('ยกเลิกการมาร์คแล้ว'));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('6.4 บันทึกสรุปการเรียนรู้ (โน้ต)', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.use({ storageState: STUDENT_AUTH_FILE });
  // สร้าง → ค้นหา → แก้ไข → ลบ โน้ตชิ้นเดียวกัน จึงต้องรันตามลำดับ
  test.describe.configure({ mode: 'serial' });

  const noteTitle = uniqueTitle('โน้ต');
  const noteTag = `e2e${RUN_ID.toLowerCase()}`;
  const noteModal = (page: Page) => ({
    title: page.getByPlaceholder('เช่น เภสัชวิทยา บทที่ 1'),
    content: page.getByPlaceholder('เขียนสรุปสั้นๆ...'),
    tags: page.getByPlaceholder(/คั่นด้วยเครื่องหมายจุลภาค/),
    save: page.getByRole('button', { name: 'บันทึกข้อมูล' }),
  });
  const noteCard = (page: Page, title: string) =>
    page
      .getByRole('heading', { name: title, exact: true })
      .locator('xpath=ancestor::div[contains(@class,"flex-col") and contains(@class,"h-full")][1]');

  // ลบโน้ตที่หัวข้อขึ้นต้นด้วย "E2E-" ทั้งหมด (รวมที่ค้างจากรอบก่อนที่ล้มกลางทาง)
  test.afterAll(async ({ browser }) => {
    const page = await newStudentPage(browser);
    await openCalendar(page);
    await page.getByLabel('ค้นหาบันทึกด้วยหัวข้อ, Tags หรือเนื้อหา').fill('E2E-');
    const titles = page.locator('h3[title^="E2E-"]');
    for (let guard = 0; guard < 30 && (await titles.count()); guard++) {
      const t = (await titles.first().getAttribute('title'))!;
      await noteCard(page, t).getByTitle('ลบบันทึก').click();
      await swal(page).confirm.click();
      await expect(page.locator(`h3[title="${t.replace(/"/g, '\\"')}"]`)).toHaveCount(0);
    }
    await page.context().close();
  });

  test('UCAL-T17 กด "เพิ่มโน้ต" แล้วไม่กรอกหัวข้อ แจ้ง "กรุณาระบุหัวข้อบันทึก"', async ({ page }) => {
    await step('1. เปิดหน้าปฏิทิน แล้วกด "เพิ่มโน้ต"', async () => {
      await openCalendar(page);
      await page.getByRole('button', { name: 'เพิ่มโน้ต' }).click();
      await expect(page.getByRole('heading', { name: 'สร้างบันทึกใหม่' })).toBeVisible();
    });
    await step('2. กด "บันทึกข้อมูล" โดยไม่กรอกข้อมูล', () => noteModal(page).save.click());
    await step('Expected: แจ้ง "กรุณาระบุหัวข้อบันทึก"', () => expect(toast(page).last()).toContainText('กรุณาระบุหัวข้อบันทึก'));
  });

  test('UCAL-T18 กรอกหัวข้อแต่ไม่กรอกเนื้อหา แจ้ง "กรุณาระบุเนื้อหาโดยสรุป"', async ({ page }) => {
    await step('1. เปิดหน้าปฏิทิน แล้วกด "เพิ่มโน้ต"', async () => {
      await openCalendar(page);
      await page.getByRole('button', { name: 'เพิ่มโน้ต' }).click();
    });
    await step('2. กรอกหัวข้อ แล้วกด "บันทึกข้อมูล"', async () => {
      await noteModal(page).title.fill(uniqueTitle('ไม่มีเนื้อหา'));
      await noteModal(page).save.click();
    });
    await step('Expected: แจ้ง "กรุณาระบุเนื้อหาโดยสรุป"', () => expect(toast(page).last()).toContainText('กรุณาระบุเนื้อหาโดยสรุป'));
  });

  test('UCAL-T19 สร้างโน้ตพร้อมแท็ก บันทึกสำเร็จและแสดงในรายการโน้ต', async ({ page }) => {
    await step('1. เปิดหน้าปฏิทิน แล้วกด "เพิ่มโน้ต"', async () => {
      await openCalendar(page);
      await page.getByRole('button', { name: 'เพิ่มโน้ต' }).click();
    });
    await step(`2. กรอกหัวข้อ "${noteTitle}" เนื้อหา และแท็ก "${noteTag}" แล้วกด "บันทึกข้อมูล"`, async () => {
      await noteModal(page).title.fill(noteTitle);
      await noteModal(page).content.fill('สรุปกลไกการออกฤทธิ์ของยากลุ่ม statin');
      await noteModal(page).tags.fill(noteTag);
      await noteModal(page).save.click();
    });
    await step('Expected: แจ้ง "บันทึกโน้ตสำเร็จ" และโน้ตแสดงในรายการพร้อมแท็ก', async () => {
      await expect(toast(page)).toContainText('บันทึกโน้ตสำเร็จ');
      await expect(page.getByRole('heading', { name: noteTitle, exact: true })).toBeVisible();
      await expect(noteCard(page, noteTitle).getByText(noteTag)).toBeVisible();
    });
  });

  test('UCAL-T20 ค้นหาโน้ตด้วยแท็ก แสดงเฉพาะโน้ตที่ตรงกัน', async ({ page }) => {
    await step('1. เปิดหน้าปฏิทิน', () => openCalendar(page));
    await step(`2. พิมพ์ "${noteTag}" ในช่องค้นหาบันทึก`, () =>
      page.getByLabel('ค้นหาบันทึกด้วยหัวข้อ, Tags หรือเนื้อหา').fill(noteTag));
    await step('Expected: แสดงโน้ตที่มีแท็กนี้', () =>
      expect(page.getByRole('heading', { name: noteTitle, exact: true })).toBeVisible());
  });

  test('UCAL-T21 แก้ไขหัวข้อโน้ต บันทึกสำเร็จและแสดงหัวข้อใหม่', async ({ page }) => {
    await step('1. เปิดหน้าปฏิทิน แล้วกดปุ่มแก้ไขของโน้ต', async () => {
      await openCalendar(page);
      await noteCard(page, noteTitle).getByTitle('แก้ไขบันทึก').click();
      await expect(page.getByRole('heading', { name: 'แก้ไขบันทึก' })).toBeVisible();
    });
    await step('2. เปลี่ยนหัวข้อ แล้วกด "บันทึกข้อมูล"', async () => {
      await noteModal(page).title.fill(`${noteTitle}-แก้ไข`);
      await noteModal(page).save.click();
    });
    await step('Expected: แจ้ง "แก้ไขโน้ตสำเร็จ" และแสดงหัวข้อใหม่', async () => {
      await expect(toast(page)).toContainText('แก้ไขโน้ตสำเร็จ');
      await expect(page.getByRole('heading', { name: `${noteTitle}-แก้ไข`, exact: true })).toBeVisible();
    });
  });

  test('UCAL-T22 ลบโน้ตแล้วยืนยัน โน้ตหายจากรายการ', async ({ page }) => {
    const title = `${noteTitle}-แก้ไข`;
    await step('1. เปิดหน้าปฏิทิน แล้วกดปุ่มลบของโน้ต', async () => {
      await openCalendar(page);
      await noteCard(page, title).getByTitle('ลบบันทึก').click();
    });
    await step('2. กด "ใช่, ลบบันทึก"', async () => {
      await expect(swal(page).title).toHaveText('ยืนยันการลบบันทึก?');
      await swal(page).confirm.click();
    });
    await step('Expected: แจ้ง "ลบโน้ตสำเร็จ" และโน้ตหายจากรายการ', async () => {
      await expect(toast(page)).toContainText('ลบโน้ตสำเร็จ');
      await expect(page.getByRole('heading', { name: title, exact: true })).toHaveCount(0);
    });
  });
});
