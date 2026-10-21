import { test, expect, type Page } from '@playwright/test';
import {
  RUN_ID, uniqueTitle, swal, toast, onBrowserDialog, newAdminPage,
  hasStudent, SKIP_NO_STUDENT, STUDENT_AUTH_FILE,
} from './helpers';

/**
 * Test Scenario: โปรไฟล์ การแสดงผล ข่าวสาร การแจ้งเตือน และแชตบอต (ผู้เรียน) — Black Box Testing
 *
 * เคสแก้ไขโปรไฟล์จะคืนค่าเดิมให้ทุกครั้ง ข่าวทดสอบสร้างผ่านหน้าผู้ดูแลระบบตอนเริ่ม และลบทิ้งตอนจบ
 */

const step = test.step;

// ═════════════════════════════════════════════════════════════════════════════
test.describe('8.1 โปรไฟล์ของฉัน', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.use({ storageState: STUDENT_AUTH_FILE });
  // แก้ข้อมูลบัญชีเดียวกัน จึงรันตามลำดับ
  test.describe.configure({ mode: 'serial' });

  const f = (page: Page) => ({
    first: page.locator('#profile-first-name'),
    last: page.locator('#profile-last-name'),
    email: page.locator('#profile-email'),
    tel: page.locator('#profile-tel'),
    edit: page.getByRole('button', { name: 'แก้ไข', exact: true }),
    save: page.getByRole('button', { name: 'บันทึก', exact: true }),
    cancel: page.getByRole('button', { name: 'ยกเลิก', exact: true }),
  });
  const tab = (page: Page, name: string) =>
    page.getByRole('tablist', { name: 'ตั้งค่าโปรไฟล์' }).getByRole('tab', { name });

  async function openProfile(page: Page) {
    await page.goto('/user/profile');
    await expect(page.getByRole('heading', { name: 'โปรไฟล์ของฉัน' })).toBeVisible();
    await expect(f(page).email).not.toHaveValue('', { timeout: 20_000 });
  }

  /** แก้ช่องข้อมูลแล้วกดบันทึก + ยืนยัน */
  async function saveProfile(page: Page, changes: Partial<Record<'first' | 'last' | 'tel', string>>) {
    await f(page).edit.click();
    for (const [k, v] of Object.entries(changes)) await f(page)[k as 'first'].fill(v!);
    await f(page).save.click();
    await expect(swal(page).title).toHaveText('บันทึกการเปลี่ยนแปลง?');
    await swal(page).confirm.click();
  }

  /** กล่อง "สำเร็จ!" ปิดเองใน 1.5 วินาที (ไม่มีปุ่มตกลง) */
  async function expectSaved(page: Page) {
    await expect(swal(page).title).toHaveText('สำเร็จ!', { timeout: 15_000 });
    await expect(swal(page).title).toHaveCount(0, { timeout: 10_000 });
  }

  let original = { first: '', last: '', tel: '' };

  // คืนค่าโปรไฟล์เดิมเสมอ แม้เคสจะล้มกลางทาง
  test.afterAll(async ({ browser }) => {
    if (!original.last) return;
    const page = await browser.newPage({ storageState: STUDENT_AUTH_FILE });
    await openProfile(page);
    const now = { first: await f(page).first.inputValue(), last: await f(page).last.inputValue(), tel: await f(page).tel.inputValue() };
    if (now.first !== original.first || now.last !== original.last || now.tel !== original.tel) {
      await saveProfile(page, original);
      await expectSaved(page);
    }
    await page.close();
  });

  test('PROF-T01 เปิดหน้าโปรไฟล์ แสดงข้อมูลส่วนตัวเป็นแบบอ่านอย่างเดียว และอีเมลแก้ไขไม่ได้', async ({ page }) => {
    await step('1. เปิดหน้า /user/profile', () => openProfile(page));
    original = {
      first: await f(page).first.inputValue(),
      last: await f(page).last.inputValue(),
      tel: await f(page).tel.inputValue(),
    };
    await step('Expected: ช่องชื่อ นามสกุล และเบอร์โทรเป็นแบบอ่านอย่างเดียว อีเมลแสดงค่าของบัญชีที่เข้าสู่ระบบ', async () => {
      await expect(f(page).first).toHaveAttribute('readonly', '');
      await expect(f(page).tel).toHaveAttribute('readonly', '');
      await expect(f(page).email).toHaveValue(process.env.E2E_STUDENT_EMAIL!);
    });
  });

  test('PROF-T02 กด "แก้ไข" เปลี่ยนนามสกุลแล้วบันทึก อัปเดตสำเร็จและแสดงค่าใหม่หลังโหลดหน้าใหม่', async ({ page }) => {
    const newLast = `${original.last}-E2E${RUN_ID}`;
    await step('1. เปิดหน้าโปรไฟล์', () => openProfile(page));
    await step(`2. กด "แก้ไข" เปลี่ยนนามสกุลเป็น "${newLast}" กด "บันทึก" และ "ตกลง"`, () => saveProfile(page, { last: newLast }));
    await step('Expected: แจ้ง "สำเร็จ!" และหลังโหลดหน้าใหม่นามสกุลเป็นค่าใหม่', async () => {
      await expectSaved(page);
      await openProfile(page);
      await expect(f(page).last).toHaveValue(newLast);
    });
    await step('3. คืนค่านามสกุลเดิม', async () => {
      await saveProfile(page, { last: original.last });
      await expectSaved(page);
    });
  });

  test('PROF-T03 แก้ไขแล้วกด "ยกเลิก" ข้อมูลกลับเป็นค่าเดิมและไม่บันทึก', async ({ page }) => {
    await step('1. เปิดหน้าโปรไฟล์ แล้วกด "แก้ไข"', async () => {
      await openProfile(page);
      await f(page).edit.click();
    });
    await step('2. เปลี่ยนชื่อจริง แล้วกด "ยกเลิก"', async () => {
      await f(page).first.fill(`ไม่บันทึก${RUN_ID}`);
      await f(page).cancel.click();
    });
    await step('Expected: ชื่อจริงกลับเป็นค่าเดิม และกลับเป็นแบบอ่านอย่างเดียว', async () => {
      await expect(f(page).first).toHaveValue(original.first);
      await expect(f(page).first).toHaveAttribute('readonly', '');
    });
  });

  test('PROF-T04 ลบชื่อจริงจนว่างแล้วบันทึก ระบบไม่บันทึกและแจ้งข้อผิดพลาด', async ({ page }) => {
    await step('1. เปิดหน้าโปรไฟล์', () => openProfile(page));
    await step('2. กด "แก้ไข" ลบชื่อจริงจนว่าง กด "บันทึก" และ "ตกลง"', () => saveProfile(page, { first: '' }));
    await step('Expected: แจ้ง "เกิดข้อผิดพลาด" และชื่อจริงในระบบยังเป็นค่าเดิม', async () => {
      await expect(swal(page).title).toHaveText('เกิดข้อผิดพลาด', { timeout: 15_000 });
      await swal(page).confirm.click();
      await openProfile(page);
      await expect(f(page).first).toHaveValue(original.first);
    });
  });

  test('PROF-T05 เบอร์โทรศัพท์ไม่ครบ 10 หลักแล้วบันทึก ระบบไม่บันทึกและแจ้งข้อผิดพลาด', async ({ page }) => {
    await step('1. เปิดหน้าโปรไฟล์', () => openProfile(page));
    await step('2. กด "แก้ไข" เปลี่ยนเบอร์เป็น "08123" กด "บันทึก" และ "ตกลง"', () => saveProfile(page, { tel: '08123' }));
    await step('Expected: แจ้ง "เกิดข้อผิดพลาด" และเบอร์โทรในระบบยังเป็นค่าเดิม', async () => {
      await expect(swal(page).title).toHaveText('เกิดข้อผิดพลาด', { timeout: 15_000 });
      await swal(page).confirm.click();
      await openProfile(page);
      await expect(f(page).tel).toHaveValue(original.tel);
    });
  });

  test('PROF-T06 แท็บ "การแสดงผล" เลือกธีม "มืด" หน้าเว็บเปลี่ยนเป็นโหมดมืด และกลับ "สว่าง" ได้', async ({ page }) => {
    await step('1. เปิดหน้าโปรไฟล์ แล้วกดแท็บ "การแสดงผล"', async () => {
      await openProfile(page);
      await tab(page, 'การแสดงผล').click();
    });
    await step('2. กดตัวเลือกธีม "มืด"', () => page.getByRole('button', { name: /^มืด/ }).click());
    await step('Expected: หน้าเว็บอยู่ในโหมดมืด (html มีคลาส dark)', async () => {
      await expect(page.locator('html')).toHaveClass(/\bdark\b/);
    });
    await step('3. กดตัวเลือกธีม "สว่าง"', () => page.getByRole('button', { name: /^สว่าง/ }).click());
    await step('Expected: กลับเป็นโหมดสว่าง', () => expect(page.locator('html')).not.toHaveClass(/\bdark\b/));
  });

  test('PROF-T07 แท็บ "การแสดงผล" เลือกขนาดตัวอักษร "ใหญ่" ตัวอักษรทั้งหน้าใหญ่ขึ้น และคืนเป็น "กลาง"', async ({ page }) => {
    await step('1. เปิดหน้าโปรไฟล์ แล้วกดแท็บ "การแสดงผล"', async () => {
      await openProfile(page);
      await tab(page, 'การแสดงผล').click();
    });
    const rootSize = () => page.evaluate(() => parseFloat(getComputedStyle(document.documentElement).fontSize));
    const before = await rootSize();
    await step('2. กดขนาดตัวอักษร "ใหญ่"', () => page.getByRole('button', { name: 'ใหญ่', exact: true }).click());
    await step('Expected: ขนาดตัวอักษรของหน้าใหญ่กว่าเดิม', async () => {
      await expect.poll(rootSize).toBeGreaterThan(before);
    });
    await step('3. คืนค่าเป็น "กลาง"', () => page.getByRole('button', { name: 'กลาง', exact: true }).click());
  });
});

// ═════════════════════════════════════════════════════════════════════════════
test.describe('8.2 ข่าวสารและข่าวที่บันทึกไว้', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.use({ storageState: STUDENT_AUTH_FILE });
  test.describe.configure({ mode: 'serial' });

  const newsTitle = uniqueTitle('ข่าวผู้เรียน');

  // สร้างข่าวทดสอบผ่านหน้าผู้ดูแลระบบ (เผยแพร่ทันที)
  test.beforeAll(async ({ browser }) => {
    const page = await newAdminPage(browser);
    await page.goto('/admin/mnblog/addblog');
    await page.getByLabel('หัวข้อข่าวสาร รายการที่ 1', { exact: true }).fill(newsTitle);
    await page.locator('.ProseMirror').first().click();
    await page.keyboard.type('ประกาศสำหรับทดสอบการแสดงข่าวฝั่งผู้เรียน');
    await page.getByRole('button', { name: 'เผยแพร่ทั้งหมด' }).click();
    await expect(toast(page)).toContainText('สำเร็จ', { timeout: 20_000 });
    await page.context().close();
  });

  // ลบข่าวทดสอบทั้งหมดที่ขึ้นต้นด้วย "E2E-" ผ่านหน้าผู้ดูแลระบบ
  test.afterAll(async ({ browser }) => {
    const page = await newAdminPage(browser);
    onBrowserDialog(page, true);
    await page.goto('/admin/mnblog');
    await expect(page.getByText('Synchronizing Data...')).toHaveCount(0, { timeout: 20_000 });
    const box = page.getByLabel('ค้นหาข่าวสารของคุณ');
    await box.fill('E2E-');
    await box.press('Escape');
    const cards = page.locator('div.relative.group');
    for (let left = await cards.count(); left > 0; left--) {
      await cards.first().hover();
      await cards.first().locator('button[aria-label^="ลบข่าวสาร"]').click();
      await expect(cards).toHaveCount(left - 1);
    }
    await page.context().close();
  });

  const bookmarkButton = (page: Page) => page.getByRole('button', { name: `บันทึกข่าว ${newsTitle}` });
  const unbookmarkButton = (page: Page) => page.getByRole('button', { name: `เอาข่าว ${newsTitle} ออกจากรายการที่บันทึก` });

  test('UNEWS-T01 ข่าวที่ผู้ดูแลระบบเผยแพร่ แสดงในส่วน "ข่าวสารและประกาศ" ของหน้าหลัก', async ({ page }) => {
    await step('1. เปิดหน้าหลักผู้เรียน', () => page.goto('/user'));
    await step(`Expected: แสดงข่าว "${newsTitle}"`, () =>
      expect(page.getByText(newsTitle).first()).toBeVisible({ timeout: 20_000 }));
  });

  test('UNEWS-T02 กดข่าว เปิดหน้ารายละเอียดข่าวพร้อมหัวข้อและเนื้อหา', async ({ page, context }) => {
    await step('1. เปิดหน้าหลักผู้เรียน', () => page.goto('/user'));
    const detail = await step('2. กดข่าวทดสอบ (เปิดในแท็บใหม่)', async () => {
      const popup = context.waitForEvent('page');
      await page.getByText(newsTitle).first().click();
      return popup;
    });
    await step('Expected: หน้ารายละเอียดแสดงหัวข้อข่าว เนื้อหา และลิงก์ "กลับหน้าหลัก"', async () => {
      await detail.waitForLoadState();
      await expect(detail.getByRole('heading', { name: newsTitle, level: 1 })).toBeVisible({ timeout: 20_000 });
      await expect(detail.getByText('ประกาศสำหรับทดสอบการแสดงข่าวฝั่งผู้เรียน')).toBeVisible();
      await expect(detail.getByRole('link', { name: /กลับหน้าหลัก/ })).toBeVisible();
    });
  });

  test('UNEWS-T03 กดบันทึกข่าว ข่าวแสดงในหน้า "ข่าวที่บันทึกไว้"', async ({ page }) => {
    await step('1. เปิดหน้าหลัก แล้วกดปุ่มบันทึกของข่าวทดสอบ', async () => {
      await page.goto('/user');
      await bookmarkButton(page).click();
    });
    await step('Expected: ปุ่มเปลี่ยนเป็นสถานะบันทึกแล้ว', () => expect(unbookmarkButton(page)).toBeVisible());
    await step('2. เปิดหน้า /user/saveblog', () => page.goto('/user/saveblog'));
    await step('Expected: แสดงข่าวทดสอบในรายการข่าวที่บันทึกไว้', async () => {
      await expect(page.getByRole('heading', { name: 'ข่าวที่บันทึกไว้' })).toBeVisible();
      await expect(page.getByText(newsTitle).first()).toBeVisible({ timeout: 20_000 });
    });
  });

  test('UNEWS-T04 ค้นหาในหน้าข่าวที่บันทึกไว้ด้วยหัวข้อข่าว แสดงข่าวที่ตรงกัน', async ({ page }) => {
    await step('1. เปิดหน้าข่าวที่บันทึกไว้', () => page.goto('/user/saveblog'));
    await step(`2. พิมพ์ "${newsTitle}" ในช่องค้นหา`, () => page.getByPlaceholder('ค้นหาข่าวที่บันทึกไว้').fill(newsTitle));
    await step('Expected: แสดงข่าวทดสอบ', () => expect(page.getByText(newsTitle).first()).toBeVisible());
  });

  test('UNEWS-T05 ลบข่าวออกจากรายการที่บันทึกไว้ ข่าวหายจากหน้าข่าวที่บันทึกไว้', async ({ page }) => {
    await step('1. เปิดหน้าข่าวที่บันทึกไว้', async () => {
      await page.goto('/user/saveblog');
      await expect(page.getByText(newsTitle).first()).toBeVisible({ timeout: 20_000 });
    });
    await step('2. กดปุ่มลบของข่าวทดสอบ', () => page.getByRole('button', { name: new RegExp(`^ลบ ${newsTitle}`) }).click());
    await step('Expected: ข่าวทดสอบหายจากรายการ', () => expect(page.getByText(newsTitle)).toHaveCount(0, { timeout: 15_000 }));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
test.describe('8.3 การแจ้งเตือน', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.use({ storageState: STUDENT_AUTH_FILE });

  test('NOTI-T01 กดไอคอนกระดิ่ง เปิดหน้าต่างการแจ้งเตือน และกดอีกครั้งเพื่อปิด', async ({ page }) => {
    await step('1. เปิดหน้าหลักผู้เรียน', () => page.goto('/user'));
    const bell = page.getByRole('button', { name: 'View notifications' });
    await step('2. กดไอคอนกระดิ่ง', () => bell.click());
    await step('Expected: แสดงหน้าต่าง "การแจ้งเตือน"', () =>
      expect(page.getByRole('heading', { name: /^การแจ้งเตือน/ })).toBeVisible());
    await step('3. กดไอคอนกระดิ่งอีกครั้ง', () => bell.click());
    await step('Expected: หน้าต่างการแจ้งเตือนปิด', () =>
      expect(page.getByRole('heading', { name: /^การแจ้งเตือน/ })).toHaveCount(0));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
test.describe('8.4 แชตบอตผู้ช่วย', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.use({ storageState: STUDENT_AUTH_FILE });

  const openBot = async (page: Page, acceptedPrivacy: boolean) => {
    await page.addInitScript((accepted) => {
      if (accepted) localStorage.setItem('chatbot_privacy_accepted', 'true');
      else localStorage.removeItem('chatbot_privacy_accepted');
    }, acceptedPrivacy);
    if (!acceptedPrivacy) await page.context().clearCookies({ name: 'chatbot_privacy_accepted' });
    await page.goto('/user');
    await page.getByRole('button', { name: 'เปิดแชตบอต' }).click();
  };

  test('BOT-T01 เปิดแชตบอตครั้งแรก แสดงนโยบายความเป็นส่วนตัว และกด "ยอมรับและเริ่มใช้งาน" แล้วพิมพ์คำถามได้', async ({ page }) => {
    await step('1. เปิดหน้าหลัก แล้วกดปุ่มเปิดแชตบอต (ยังไม่เคยยอมรับนโยบาย)', () => openBot(page, false));
    await step('Expected: แสดง "นโยบายความเป็นส่วนตัว"', () =>
      expect(page.getByRole('heading', { name: 'นโยบายความเป็นส่วนตัว' })).toBeVisible());
    await step('2. กด "ยอมรับและเริ่มใช้งาน"', () => page.getByRole('button', { name: 'ยอมรับและเริ่มใช้งาน' }).click());
    await step('Expected: ปิดนโยบาย และแสดงช่อง "พิมพ์คำถาม..."', async () => {
      await expect(page.getByRole('heading', { name: 'นโยบายความเป็นส่วนตัว' })).toHaveCount(0);
      await expect(page.getByPlaceholder(/พิมพ์คำถาม|ความจุเต็มแล้ว/)).toBeVisible();
    });
  });

  test('BOT-T02 ยังไม่พิมพ์ข้อความ ปุ่มส่งข้อความกดไม่ได้', async ({ page }) => {
    await step('1. เปิดแชตบอต (ยอมรับนโยบายแล้ว)', () => openBot(page, true));
    await step('Expected: ปุ่ม "ส่งข้อความ" ถูกปิดไว้', () =>
      expect(page.getByRole('button', { name: 'ส่งข้อความ' })).toBeDisabled());
  });

  test('BOT-T03 พิมพ์คำถามแล้วส่ง ข้อความแสดงในหน้าแชตและแชตบอตตอบกลับ', async ({ page }) => {
    test.setTimeout(120_000);
    const question = `สวัสดี ทดสอบระบบ ${RUN_ID}`;
    await step('1. เปิดแชตบอต (ยอมรับนโยบายแล้ว)', () => openBot(page, true));
    test.skip(await page.getByPlaceholder('ความจุเต็มแล้ว...').isVisible(), 'โควตาแชตบอตของวันนี้เต็มแล้ว');
    await step(`2. พิมพ์ "${question}" แล้วกดส่ง`, async () => {
      await page.getByPlaceholder('พิมพ์คำถาม...').fill(question);
      await page.getByRole('button', { name: 'ส่งข้อความ' }).click();
    });
    await step('Expected: ข้อความที่ส่งแสดงในหน้าแชต และมีคำตอบจากแชตบอตภายใน 90 วินาที', async () => {
      await expect(page.getByText(question)).toBeVisible();
      await expect(page.getByRole('button', { name: 'หยุดการตอบ' })).toHaveCount(0, { timeout: 90_000 });
    });
  });

  test('BOT-T04 กดปิดแชตบอต หน้าต่างแชตปิดลง', async ({ page }) => {
    await step('1. เปิดแชตบอต (ยอมรับนโยบายแล้ว)', () => openBot(page, true));
    await step('2. กดปุ่ม "ปิดแชตบอต"', () => page.getByRole('button', { name: 'ปิดแชตบอต' }).first().click());
    await step('Expected: ไม่แสดงช่องพิมพ์คำถาม และปุ่มกลับเป็น "เปิดแชตบอต"', async () => {
      await expect(page.getByPlaceholder('พิมพ์คำถาม...')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'เปิดแชตบอต' })).toBeVisible();
    });
  });
});
