import { test, expect, type Page } from '@playwright/test';
import { RUN_ID, swal, newAdminPage, hasStudent, SKIP_NO_STUDENT } from './helpers';

/**
 * Test Scenario: จัดการผู้ใช้งาน และติดตามผลการเรียนรายบุคคล (ผู้ดูแลระบบ) — Black Box Testing
 *
 * บัญชีผู้ดูแลระบบทดสอบใช้อีเมล e2e-…@example.com (โดเมนสงวนสำหรับทดสอบ ไม่มีกล่องจดหมายจริง)
 * สร้างแล้วลบถาวรผ่านหน้าเว็บในชุดเดียวกัน
 */

const URL = '/admin/manage_users';
const step = test.step;
const studentEmail = process.env.E2E_STUDENT_EMAIL ?? '';

const search = (page: Page) => page.getByLabel(/^ค้นหาชื่อ นามสกุล อีเมล เบอร์โทร/);
const rows = (page: Page) => page.locator('tbody tr');
const rowOf = (page: Page, text: string) => rows(page).filter({ hasText: text });

async function openUsers(page: Page, opts: { search?: string; trash?: boolean } = {}) {
  await page.goto(URL);
  await expect(page.getByRole('button', { name: 'เพิ่มบัญชีผู้ดูแลระบบ' })).toBeVisible();
  await expect(page.getByText('กำลังโหลดรายชื่อผู้ใช้งาน...')).toHaveCount(0, { timeout: 20_000 });
  if (opts.trash) await page.getByRole('button', { name: /^ถังขยะ/ }).click();
  if (opts.search !== undefined) await search(page).fill(opts.search);
}

// ─── ฟอร์มเพิ่มผู้ดูแลระบบ ────────────────────────────────────────────────────
const adminForm = (page: Page) => ({
  first: page.getByPlaceholder('เช่น สมชาย'),
  last: page.getByPlaceholder('เช่น ใจดี'),
  email: page.getByPlaceholder('admin@example.com'),
  tel: page.getByPlaceholder('0812345678'),
  bod: page.locator('form input[type="date"]'),
  university: page.locator('form select'),
  password: page.locator('form').getByPlaceholder('••••••••').nth(0),
  confirm: page.locator('form').getByPlaceholder('••••••••').nth(1),
  submit: page.getByRole('button', { name: 'บันทึกบัญชีผู้ดูแลระบบ' }),
});

interface AdminInput { email: string; tel?: string; password?: string; confirm?: string }
async function fillAdminForm(page: Page, input: AdminInput) {
  await page.getByRole('button', { name: 'เพิ่มบัญชีผู้ดูแลระบบ' }).click();
  await expect(page.getByRole('heading', { name: 'เพิ่มบัญชีผู้ดูแลระบบ' })).toBeVisible();
  const f = adminForm(page);
  await f.first.fill('ผู้ดูแลทดสอบ');
  await f.last.fill(`E2E${RUN_ID}`);
  await f.email.fill(input.email);
  await f.tel.fill(input.tel ?? '0812345678');
  await f.bod.fill('1995-01-15');
  if (await f.university.count()) {
    await expect(f.university.locator('option')).not.toHaveCount(1);
    await f.university.selectOption({ index: 1 });
  }
  // รหัสผ่านทดสอบสร้างขึ้นสำหรับรอบนี้เท่านั้น
  const pw = input.password ?? `E2e-${RUN_ID}-Pw#1`;
  await f.password.fill(pw);
  await f.confirm.fill(input.confirm ?? pw);
}

// ═════════════════════════════════════════════════════════════════════════════
test.describe('11.1 รายชื่อผู้ใช้งาน: แสดง ค้นหา และกรอง', () => {
  test('USR-T01 เปิดหน้ารายชื่อผู้ใช้งาน แสดงตารางผู้ใช้และตัวกรองสิทธิ์ ช่องทาง และมหาวิทยาลัย', async ({ page }) => {
    await step('1. เปิดหน้า /admin/manage_users', () => openUsers(page));
    await step('Expected: แสดงแถวผู้ใช้อย่างน้อย 1 แถว และตัวกรอง 3 แบบ', async () => {
      await expect(rows(page).first()).toBeVisible();
      await expect(page.getByLabel('กรองตามสิทธิ์การใช้งาน')).toBeVisible();
      await expect(page.getByLabel('กรองตามช่องทางการเข้าสู่ระบบ')).toBeVisible();
      await expect(page.getByLabel('กรองตามสถาบันมหาวิทยาลัย')).toBeVisible();
    });
  });

  test('USR-T02 ค้นหาด้วยอีเมลผู้เรียน แสดงผู้ใช้ที่ตรงกัน', async ({ page }) => {
    test.skip(!hasStudent, SKIP_NO_STUDENT);
    await step(`1. เปิดหน้ารายชื่อผู้ใช้งาน แล้วค้นหา "${studentEmail}"`, () => openUsers(page, { search: studentEmail }));
    await step('Expected: แสดงแถวของผู้เรียนคนนี้', () => expect(rowOf(page, studentEmail)).toHaveCount(1));
  });

  test('USR-T03 ค้นหาด้วยคำที่ไม่มีในระบบ แสดง "ไม่พบรายชื่อผู้ใช้งาน"', async ({ page }) => {
    await step(`1. เปิดหน้ารายชื่อผู้ใช้งาน แล้วค้นหา "ไม่มีจริง-${RUN_ID}"`, () => openUsers(page, { search: `ไม่มีจริง-${RUN_ID}` }));
    await step('Expected: แสดง "ไม่พบรายชื่อผู้ใช้งาน"', () => expect(page.getByText('ไม่พบรายชื่อผู้ใช้งาน')).toBeVisible());
  });

  test('USR-T04 กรองสิทธิ์ "ผู้ใช้งาน" ไม่แสดงบัญชีผู้ดูแลระบบที่กำลังใช้งานอยู่', async ({ page }) => {
    await step('1. เปิดหน้ารายชื่อผู้ใช้งาน', () => openUsers(page));
    await step('2. เลือกตัวกรองสิทธิ์ "ผู้ใช้งาน"', () => page.getByLabel('กรองตามสิทธิ์การใช้งาน').selectOption('1'));
    await step('Expected: ไม่มีแถวของบัญชีผู้ดูแลระบบที่ใช้ทดสอบ', async () => {
      await expect(rowOf(page, process.env.E2E_ADMIN_EMAIL!)).toHaveCount(0);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
test.describe('11.2 เพิ่มบัญชีผู้ดูแลระบบ: ตรวจข้อมูล', () => {
  test('USR-T05 อีเมลไม่มีโดเมนระดับบนสุด แจ้ง "รูปแบบอีเมลไม่ถูกต้อง"', async ({ page }) => {
    await step('1. เปิดฟอร์มเพิ่มผู้ดูแลระบบ แล้วกรอกอีเมล "e2e@mail"', async () => {
      await openUsers(page);
      await fillAdminForm(page, { email: 'e2e@mail' });
    });
    await step('2. กด "บันทึกบัญชีผู้ดูแลระบบ"', () => adminForm(page).submit.click());
    await step('Expected: แจ้ง "รูปแบบอีเมลไม่ถูกต้อง"', () => expect(swal(page).title).toHaveText('รูปแบบอีเมลไม่ถูกต้อง'));
  });

  test('USR-T06 เบอร์โทรศัพท์ไม่ครบ 10 หลัก แจ้ง "เบอร์โทรศัพท์ไม่ถูกต้อง"', async ({ page }) => {
    await step('1. เปิดฟอร์มเพิ่มผู้ดูแลระบบ แล้วกรอกเบอร์ "08123"', async () => {
      await openUsers(page);
      await fillAdminForm(page, { email: `e2e-${RUN_ID.toLowerCase()}@example.com`, tel: '08123' });
    });
    await step('2. กด "บันทึกบัญชีผู้ดูแลระบบ"', () => adminForm(page).submit.click());
    await step('Expected: แจ้ง "เบอร์โทรศัพท์ไม่ถูกต้อง"', () => expect(swal(page).title).toHaveText('เบอร์โทรศัพท์ไม่ถูกต้อง'));
  });

  test('USR-T07 รหัสผ่านสั้นกว่า 8 ตัวอักษร ระบบไม่สร้างบัญชีและแจ้งที่ช่องรหัสผ่าน', async ({ page }) => {
    await step('1. เปิดฟอร์มเพิ่มผู้ดูแลระบบ แล้วกรอกรหัสผ่าน 5 ตัวอักษร', async () => {
      await openUsers(page);
      await fillAdminForm(page, { email: `e2e-${RUN_ID.toLowerCase()}@example.com`, password: 'Ab#12' });
    });
    await step('2. กด "บันทึกบัญชีผู้ดูแลระบบ"', () => adminForm(page).submit.click());
    await step('Expected: ช่องรหัสผ่านแจ้งว่าสั้นเกินไป (อย่างน้อย 8 ตัวอักษร) และไม่มีข้อความสร้างบัญชีสำเร็จ', async () => {
      expect(await adminForm(page).password.evaluate((el: HTMLInputElement) => el.validity.tooShort)).toBe(true);
      await expect(page.getByText('สร้างบัญชีผู้ดูแลระบบสำเร็จ!')).toHaveCount(0);
    });
  });

  test('USR-T08 รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน แจ้ง "รหัสผ่านไม่ตรงกัน"', async ({ page }) => {
    await step('1. เปิดฟอร์มเพิ่มผู้ดูแลระบบ แล้วกรอกยืนยันรหัสผ่านไม่ตรง', async () => {
      await openUsers(page);
      await fillAdminForm(page, { email: `e2e-${RUN_ID.toLowerCase()}@example.com`, password: 'E2e-Strong#2026', confirm: 'E2e-Other#2026' });
    });
    await step('2. กด "บันทึกบัญชีผู้ดูแลระบบ"', () => adminForm(page).submit.click());
    await step('Expected: แจ้ง "รหัสผ่านไม่ตรงกัน"', () => expect(swal(page).title).toHaveText('รหัสผ่านไม่ตรงกัน'));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
test.describe('11.3 เพิ่ม ลบ กู้คืน และลบถาวรบัญชีผู้ดูแลระบบ', () => {
  test.describe.configure({ mode: 'serial' });
  const email = `e2e-admin-${RUN_ID.toLowerCase()}@example.com`;

  // ลบถาวรบัญชีทดสอบที่อาจค้างอยู่ (ทั้งที่ใช้งานอยู่และในถังขยะ)
  test.afterAll(async ({ browser }) => {
    const page = await newAdminPage(browser);
    await openUsers(page, { search: email });
    if (await rowOf(page, email).count()) {
      await rowOf(page, email).getByTitle('ลบผู้ใช้ (กู้คืนได้)').click();
      await swal(page).confirm.click();
      await expect(swal(page).title).toBeVisible({ timeout: 15_000 });
    }
    await openUsers(page, { trash: true, search: email });
    if (await rowOf(page, email).count()) {
      await rowOf(page, email).getByTitle(/^ลบถาวรพร้อมข้อมูลทั้งหมด/).click();
      await page.locator('.swal2-input').fill(email);
      await swal(page).confirm.click();
      await expect(swal(page).title).toBeVisible({ timeout: 15_000 });
    }
    await page.context().close();
  });

  test('USR-T09 กรอกข้อมูลผู้ดูแลระบบครบถ้วน สร้างบัญชีสำเร็จและแสดงในรายชื่อเป็นผู้ดูแลระบบ', async ({ page }) => {
    await step(`1. เปิดฟอร์มเพิ่มผู้ดูแลระบบ กรอกข้อมูลครบ อีเมล "${email}"`, async () => {
      await openUsers(page);
      await fillAdminForm(page, { email });
    });
    await step('2. กด "บันทึกบัญชีผู้ดูแลระบบ"', () => adminForm(page).submit.click());
    await step('Expected: แจ้ง "สร้างบัญชีผู้ดูแลระบบสำเร็จ!" และค้นหาอีเมลแล้วพบในรายชื่อ', async () => {
      await expect(swal(page).title).toHaveText('สร้างบัญชีผู้ดูแลระบบสำเร็จ!', { timeout: 20_000 });
      await swal(page).confirm.click();
      await openUsers(page, { search: email });
      await expect(rowOf(page, email)).toHaveCount(1);
    });
  });

  test('USR-T10 สร้างบัญชีด้วยอีเมลที่มีอยู่แล้ว แจ้ง "ไม่สามารถสร้างบัญชีได้"', async ({ page }) => {
    await step('1. เปิดฟอร์มเพิ่มผู้ดูแลระบบ แล้วกรอกอีเมลเดียวกับบัญชีที่สร้างไว้', async () => {
      await openUsers(page);
      await fillAdminForm(page, { email });
    });
    await step('2. กด "บันทึกบัญชีผู้ดูแลระบบ"', () => adminForm(page).submit.click());
    await step('Expected: แจ้ง "ไม่สามารถสร้างบัญชีได้" และมีบัญชีอีเมลนี้เพียงบัญชีเดียว', async () => {
      await expect(swal(page).title).toHaveText('ไม่สามารถสร้างบัญชีได้', { timeout: 20_000 });
      await swal(page).confirm.click();
      await openUsers(page, { search: email });
      await expect(rowOf(page, email)).toHaveCount(1);
    });
  });

  test('USR-T11 กดลบผู้ใช้แล้วยืนยัน บัญชีหายจากรายชื่อและย้ายไปถังขยะ', async ({ page }) => {
    await step('1. ค้นหาบัญชีทดสอบ แล้วกด "ลบผู้ใช้ (กู้คืนได้)" และยืนยัน', async () => {
      await openUsers(page, { search: email });
      await rowOf(page, email).getByTitle('ลบผู้ใช้ (กู้คืนได้)').click();
      await expect(swal(page).title).toHaveText(/^ลบผู้ใช้ /);
      await swal(page).confirm.click();
    });
    await step('Expected: ไม่พบในรายชื่อผู้ใช้งานปัจจุบัน แต่พบในแท็บถังขยะ', async () => {
      await expect(swal(page).title).toBeVisible({ timeout: 15_000 });
      await openUsers(page, { search: email });
      await expect(rowOf(page, email)).toHaveCount(0);
      await openUsers(page, { trash: true, search: email });
      await expect(rowOf(page, email)).toHaveCount(1);
    });
  });

  test('USR-T12 กดกู้คืนผู้ใช้จากถังขยะ บัญชีกลับมาในรายชื่อผู้ใช้งาน', async ({ page }) => {
    await step('1. เปิดแท็บถังขยะ ค้นหาบัญชีทดสอบ แล้วกด "กู้คืนผู้ใช้"', async () => {
      await openUsers(page, { trash: true, search: email });
      await rowOf(page, email).getByTitle('กู้คืนผู้ใช้').click();
      if (await swal(page).confirm.isVisible({ timeout: 3_000 }).catch(() => false)) await swal(page).confirm.click();
    });
    await step('Expected: บัญชีกลับมาอยู่ในรายชื่อผู้ใช้งานปัจจุบัน', async () => {
      await expect(swal(page).title).toBeVisible({ timeout: 15_000 });
      await openUsers(page, { search: email });
      await expect(rowOf(page, email)).toHaveCount(1);
    });
  });

  test('USR-T13 ลบถาวรโดยพิมพ์อีเมลไม่ตรง ระบบไม่ลบ', async ({ page }) => {
    await step('1. ย้ายบัญชีทดสอบไปถังขยะ', async () => {
      await openUsers(page, { search: email });
      await rowOf(page, email).getByTitle('ลบผู้ใช้ (กู้คืนได้)').click();
      await swal(page).confirm.click();
      await expect(swal(page).title).toBeVisible({ timeout: 15_000 });
    });
    await step('2. เปิดแท็บถังขยะ กดลบถาวร แล้วพิมพ์อีเมลผิดและกด "ลบถาวร"', async () => {
      await openUsers(page, { trash: true, search: email });
      await rowOf(page, email).getByTitle(/^ลบถาวรพร้อมข้อมูลทั้งหมด/).click();
      await expect(swal(page).title).toHaveText('ลบผู้ใช้และข้อมูลทั้งหมดถาวร?');
      await page.locator('.swal2-input').fill('wrong@example.com');
      await swal(page).confirm.click();
    });
    await step('Expected: แสดงข้อความตรวจสอบในกล่อง และไม่ลบ', async () => {
      await expect(page.locator('.swal2-validation-message')).toBeVisible();
      await swal(page).cancel.click();
      await expect(rowOf(page, email)).toHaveCount(1);
    });
  });

  test('USR-T14 ลบถาวรโดยพิมพ์อีเมลถูกต้อง บัญชีหายจากระบบทั้งหมด', async ({ page }) => {
    await step('1. เปิดแท็บถังขยะ ค้นหาบัญชีทดสอบ กดลบถาวร พิมพ์อีเมลให้ตรง แล้วกด "ลบถาวร"', async () => {
      await openUsers(page, { trash: true, search: email });
      await rowOf(page, email).getByTitle(/^ลบถาวรพร้อมข้อมูลทั้งหมด/).click();
      await page.locator('.swal2-input').fill(email);
      await swal(page).confirm.click();
    });
    await step('Expected: ไม่พบบัญชีทั้งในถังขยะและรายชื่อผู้ใช้งาน', async () => {
      await expect(swal(page).title).toBeVisible({ timeout: 15_000 });
      await openUsers(page, { trash: true, search: email });
      await expect(rowOf(page, email)).toHaveCount(0);
      await openUsers(page, { search: email });
      await expect(rowOf(page, email)).toHaveCount(0);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
test.describe('11.4 ติดตามผลการเรียนรายบุคคล', () => {
  async function openTracking(page: Page) {
    await page.goto('/admin/student-tracking');
    await expect(page.getByRole('heading', { name: 'ระบบติดตามผลการเรียนรายบุคคล' })).toBeVisible();
  }

  test('TRK-T01 ค้นหาผู้เรียนด้วยอีเมล แล้วเลือก แสดงประวัติการสอบแบบปกติและแบบ CAT ของผู้เรียนคนนั้น', async ({ page }) => {
    test.skip(!hasStudent, SKIP_NO_STUDENT);
    await step('1. เปิดหน้าติดตามผลการเรียน', () => openTracking(page));
    await step(`2. ค้นหา "${studentEmail}" แล้วกดรายชื่อผู้เรียน`, async () => {
      await page.getByLabel('ค้นหาชื่อหรืออีเมลนักเรียน').fill(studentEmail);
      await page.getByText(studentEmail).first().click();
    });
    await step('Expected: แสดงส่วน "เก็บคะแนนปกติ (Classical)" และ "ประเมินความสามารถ (CAT)"', async () => {
      await expect(page.getByText('เก็บคะแนนปกติ (Classical)').first()).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText('ประเมินความสามารถ (CAT)').first()).toBeVisible();
    });
  });

  test('TRK-T02 ค้นหาด้วยชื่อที่ไม่มีในระบบ แสดง "ไม่พบรายชื่อดังกล่าว"', async ({ page }) => {
    await step('1. เปิดหน้าติดตามผลการเรียน', () => openTracking(page));
    await step(`2. ค้นหา "ไม่มีจริง-${RUN_ID}"`, () => page.getByLabel('ค้นหาชื่อหรืออีเมลนักเรียน').fill(`ไม่มีจริง-${RUN_ID}`));
    await step('Expected: แสดง "ไม่พบรายชื่อดังกล่าว"', () => expect(page.getByText('ไม่พบรายชื่อดังกล่าว')).toBeVisible());
  });
});
