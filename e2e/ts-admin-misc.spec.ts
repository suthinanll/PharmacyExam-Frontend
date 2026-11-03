import { test, expect, type Page } from '@playwright/test';
import { RUN_ID, swal, newStudentPage, hasStudent, SKIP_NO_STUDENT, STUDENT_AUTH_FILE } from './helpers';

/**
 * Test Scenario: แดชบอร์ด รายงานปัญหาข้อสอบ CAT/IRT องค์ความรู้แชตบอต การตั้งค่า และเมนู Super Admin
 * (ผู้ดูแลระบบ) — Black Box Testing
 *
 * เคสรายงานปัญหาข้อสอบ: ผู้เรียนแจ้งปัญหาจากหน้าทบทวนประจำวัน แล้วผู้ดูแลระบบตรวจและปิดรายงาน
 * รายงานทดสอบมีรหัสรอบทดสอบอยู่ในข้อความ และถูกปิด (ไม่แก้ไข) ตอนจบ
 * เอกสารแชตบอตทดสอบชื่อขึ้นต้นด้วย "e2e-" และถูกลบถาวรตอนจบ
 */

const step = test.step;

/** ปิดกล่องแจ้งผล: กดตกลงถ้ามีปุ่ม ไม่งั้นรอให้ปิดเองตามเวลา */
async function dismiss(page: Page) {
  await swal(page).confirm.click({ timeout: 2_000 }).catch(() => {});
  await expect(swal(page).title).toHaveCount(0, { timeout: 10_000 });
}

// ═════════════════════════════════════════════════════════════════════════════
test.describe('12.1 แดชบอร์ดผู้ดูแลระบบ', () => {
  test('DASH-T01 เปิดหน้าแดชบอร์ด แสดงภาพรวมระบบและสถิติ และแนวโน้มประสิทธิภาพของผู้เรียน', async ({ page }) => {
    await step('1. เปิดหน้า /admin', () => page.goto('/admin'));
    await step('Expected: แสดงหัวข้อ "ภาพรวมระบบและสถิติ" และ "แนวโน้มประสิทธิภาพของผู้เรียน"', async () => {
      await expect(page.getByRole('heading', { name: 'ภาพรวมระบบและสถิติ' })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByRole('heading', { name: 'แนวโน้มประสิทธิภาพของผู้เรียน' })).toBeVisible();
    });
  });

  test('DASH-T02 กดลิงก์ติดตามผลการเรียนรายบุคคล ไปหน้าระบบติดตามผลการเรียน', async ({ page }) => {
    await step('1. เปิดหน้าแดชบอร์ด', () => page.goto('/admin'));
    await step('2. กด "ไปยังหน้ารายงานติดตามผลการเรียน"', () =>
      page.getByLabel('ไปยังหน้ารายงานติดตามผลการเรียน').click());
    await step('Expected: ไปหน้า /admin/student-tracking', async () => {
      await page.waitForURL(/\/admin\/student-tracking/);
      await expect(page.getByRole('heading', { name: 'ระบบติดตามผลการเรียนรายบุคคล' })).toBeVisible();
    });
  });

  test('DASH-T03 เมนูด้านซ้ายมีเมนูหลักของผู้ดูแลระบบครบ รวมเมนู "รายงานปัญหาข้อสอบ"', async ({ page }) => {
    await step('1. เปิดหน้าแดชบอร์ด', () => page.goto('/admin'));
    await step('Expected: แถบเมนูมีเมนูหลักครบ', async () => {
      const nav = page.getByRole('navigation', { name: 'เมนูหลักระบบผู้ดูแล' });
      for (const m of ['แดชบอร์ด', 'รายชื่อผู้ใช้งาน', 'คลังข้อสอบ', 'รายงานปัญหาข้อสอบ', 'ข้อสอบแบบ (CAT)',
        'จัดการพารามิเตอร์ IRT', 'จัดการประเภทข้อสอบ', 'จัดการหัวข้อ', 'ปฏิทินกำหนดการ', 'บล็อกข่าวสาร']) {
        await expect(nav.getByRole('link', { name: m, exact: true })).toBeVisible();
      }
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
test.describe('12.2 รายงานปัญหาข้อสอบ (ผู้เรียนแจ้ง → ผู้ดูแลระบบตรวจ)', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.describe.configure({ mode: 'serial' });
  const message = `[E2E ${RUN_ID}] คำตอบที่ถูกควรเป็นข้ออื่น — ทดสอบระบบแจ้งปัญหา`;
  const card = (page: Page) => page.locator('li').filter({ hasText: message });

  /** หน้าทบทวนประจำวันของผู้เรียน — ให้ข้อ 1 ถูกตอบแล้วเพื่อให้มีปุ่มแจ้งปัญหา */
  async function openAnsweredReview(page: Page) {
    await page.goto('/user/daily-review');
    const first = page.locator('[aria-label^="ตอบแล้ว"] > button').first();
    await expect(first).toBeVisible({ timeout: 20_000 });
    await first.click();
    if (await page.getByRole('button', { name: 'ตรวจคำตอบ' }).isVisible()) {
      await page.locator('button[aria-pressed]').filter({ has: page.locator('span.rounded') }).first().click();
      await page.getByRole('button', { name: 'ตรวจคำตอบ' }).click();
    }
    await expect(page.getByRole('button', { name: /^แจ้ง(ปัญหา|แล้ว)$/ })).toBeVisible({ timeout: 15_000 });
  }

  async function openReports(page: Page, tab: 'รอตรวจ' | 'แก้ไขแล้ว' | 'ไม่แก้ไข' = 'รอตรวจ') {
    await page.goto('/admin/item_reports');
    await expect(page.getByRole('heading', { name: 'รายงานปัญหาข้อสอบ' })).toBeVisible();
    await page.getByRole('tab', { name: new RegExp(`^${tab}`) }).click();
  }

  /** ปิดรายงานทดสอบที่ยังเปิดอยู่ (กันค้างในแท็บรอตรวจ) */
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await openReports(page);
    for (let guard = 0; guard < 5 && (await card(page).count()); guard++) {
      await card(page).first().getByRole('button', { name: 'ไม่แก้ไข' }).click();
      await swal(page).confirm.click();
      await expect(card(page)).toHaveCount(0, { timeout: 15_000 });
    }
    await page.close();
  });

  test('RPT-T01 ผู้เรียนกด "แจ้งปัญหา" เลือก "เฉลยผิด" พร้อมรายละเอียดแล้วส่ง ระบบรับรายงานและปุ่มเปลี่ยนเป็น "แจ้งแล้ว"', async ({ browser }) => {
    const page = await newStudentPage(browser);
    await step('1. (ผู้เรียน) เปิดหน้าทบทวนประจำวัน ไปที่ข้อที่ตอบแล้ว', () => openAnsweredReview(page));
    test.skip(await page.getByRole('button', { name: 'แจ้งแล้ว' }).isVisible(), 'ข้อนี้ถูกแจ้งไว้แล้ว');
    await step('2. กด "แจ้งปัญหา" เลือก "เฉลยผิด" กรอกรายละเอียด แล้วกด "ส่งรายงาน"', async () => {
      await page.getByRole('button', { name: 'แจ้งปัญหา' }).click();
      const dialog = page.getByRole('dialog', { name: 'แจ้งปัญหาข้อสอบ' });
      await dialog.getByRole('radio', { name: 'เฉลยผิด' }).check();
      await dialog.getByRole('textbox').fill(message);
      await dialog.getByRole('button', { name: 'ส่งรายงาน' }).click();
    });
    await step('Expected: แจ้ง "ส่งรายงานแล้ว" และปุ่มเปลี่ยนเป็น "แจ้งแล้ว" (กดไม่ได้)', async () => {
      await expect(swal(page).title).toHaveText('ส่งรายงานแล้ว', { timeout: 15_000 });
      await swal(page).confirm.click();
      await expect(page.getByRole('button', { name: 'แจ้งแล้ว' })).toBeDisabled();
    });
    await page.context().close();
  });

  test('RPT-T02 ผู้เรียนแจ้งปัญหาข้อเดิมซ้ำขณะที่รายงานเดิมยังรอตรวจ ระบบไม่รับซ้ำ', async ({ browser }) => {
    const page = await newStudentPage(browser);
    await step('1. (ผู้เรียน) เปิดหน้าทบทวนประจำวันใหม่ ไปที่ข้อเดิม', () => openAnsweredReview(page));
    await step('2. กด "แจ้งปัญหา" เลือก "อื่น ๆ" แล้วกด "ส่งรายงาน"', async () => {
      await page.getByRole('button', { name: 'แจ้งปัญหา' }).click();
      const dialog = page.getByRole('dialog', { name: 'แจ้งปัญหาข้อสอบ' });
      await dialog.getByRole('radio', { name: 'อื่น ๆ' }).check();
      await dialog.getByRole('button', { name: 'ส่งรายงาน' }).click();
    });
    await step('Expected: แจ้ง "ส่งรายงานไม่สำเร็จ" ว่าแจ้งปัญหาข้อนี้ไว้แล้ว', async () => {
      await expect(swal(page).title).toHaveText('ส่งรายงานไม่สำเร็จ', { timeout: 15_000 });
      await expect(swal(page).text).toContainText('แจ้งปัญหาข้อนี้ไว้แล้ว');
    });
    await page.context().close();
  });

  test('RPT-T03 ผู้ดูแลระบบเปิดหน้ารายงานปัญหาข้อสอบ เห็นรายงานในแท็บ "รอตรวจ" พร้อมโจทย์และเฉลยปัจจุบัน', async ({ page }) => {
    await step('1. (ผู้ดูแลระบบ) เปิดหน้า /admin/item_reports แท็บ "รอตรวจ"', () => openReports(page));
    await step('Expected: แสดงรายงาน ประเภท "เฉลยผิด" ข้อความของผู้เรียน และตัวเลือกที่เป็น "เฉลยปัจจุบัน"', async () => {
      await expect(card(page)).toHaveCount(1);
      await expect(card(page).getByText('เฉลยผิด', { exact: true })).toBeVisible();
      await expect(card(page).getByText('เฉลยปัจจุบัน')).toBeVisible();
    });
  });

  /** กล่องรายละเอียดปัญหาใต้ข้อที่ถูกแจ้งในหน้าคลังข้อสอบ (เฉพาะกล่องของรายงานทดสอบรอบนี้) */
  const notes = (page: Page) => page.getByRole('region', { name: 'รายงานปัญหาจากผู้เรียน' }).filter({ hasText: message });
  const highlighted = (page: Page) => page.locator('[id^="question-"][class*="ring-amber"]');

  /** เปิดข้อที่ถูกแจ้งในคลังข้อสอบผ่านลิงก์บนการ์ดรายงาน */
  async function openReportedQuestion(page: Page) {
    await openReports(page);
    await card(page).getByRole('link', { name: /^คลัง .+ · ข้อที่ \d+/ }).first().click();
    await page.waitForURL(/\/admin\/manage_examset\/\d+\?item=\d+/);
    await expect(notes(page)).toBeVisible({ timeout: 30_000 });
    // หน้าเลื่อนไปที่ข้อที่ถูกแจ้งเอง (ไม่ต้องเลื่อนหา)
    await expect(notes(page)).toBeInViewport({ timeout: 10_000 });
  }

  test('RPT-T08 เมนู "รายงานปัญหาข้อสอบ" แสดงตัวเลขแจ้งเตือนจำนวนรายงานที่รอตรวจ', async ({ page }) => {
    await step('1. (ผู้ดูแลระบบ) เปิดหน้าแดชบอร์ด', () => page.goto('/admin'));
    await step('Expected: หลังเมนู "รายงานปัญหาข้อสอบ" มีตัวเลขบอกจำนวนรายงานที่รอตรวจ', async () => {
      const link = page.getByRole('navigation', { name: 'เมนูหลักระบบผู้ดูแล' }).getByRole('link', { name: 'รายงานปัญหาข้อสอบ', exact: true });
      await expect(link).toHaveAccessibleDescription(/รอตรวจ\s+\d+\s+รายการ/, { timeout: 15_000 });
    });
  });

  test('RPT-T09 กดลิงก์ "คลัง … · ข้อที่ …" บนการ์ดรายงาน ไปยังข้อนั้นในคลังข้อสอบ พร้อมไฮไลต์และรายละเอียดปัญหา', async ({ page }) => {
    await step('1. เปิดแท็บ "รอตรวจ" แล้วกดลิงก์คลังข้อสอบบนการ์ดรายงานทดสอบ', () => openReportedQuestion(page));
    await step('Expected: ข้อที่ถูกแจ้งมีกรอบไฮไลต์ และมีกล่องรายละเอียดปัญหา "เฉลยผิด" พร้อมข้อความของผู้เรียน', async () => {
      await expect(highlighted(page)).toHaveCount(1);
      await expect(notes(page).getByText('เฉลยผิด', { exact: true })).toBeVisible();
      await expect(notes(page).getByRole('button', { name: 'แก้ไขข้อนี้' })).toBeVisible();
      await expect(notes(page).getByRole('button', { name: 'แก้ไขแล้ว' })).toBeVisible();
    });
  });

  test('RPT-T10 สารบัญคำถามในคลังข้อสอบแสดงจำนวนข้อที่ถูกแจ้งปัญหารอตรวจ', async ({ page }) => {
    await step('1. เปิดข้อที่ถูกแจ้งในคลังข้อสอบผ่านลิงก์บนการ์ดรายงาน', () => openReportedQuestion(page));
    await step('Expected: สารบัญคำถามแสดง "มีข้อที่ถูกแจ้งปัญหารอตรวจ"', () =>
      expect(page.getByText(/มีข้อที่ถูกแจ้งปัญหารอตรวจ \d+ ข้อ/)).toBeVisible());
  });

  test('RPT-T11 กด "แก้ไขแล้ว" ในกล่องรายงานโดยยังไม่ได้แก้ข้อสอบ ระบบเตือนก่อน และกด "ยกเลิก" รายงานยังรอตรวจ', async ({ page }) => {
    await step('1. เปิดข้อที่ถูกแจ้งในคลังข้อสอบ แล้วกด "แก้ไขแล้ว" ในกล่องรายงาน', async () => {
      await openReportedQuestion(page);
      await notes(page).getByRole('button', { name: 'แก้ไขแล้ว' }).click();
    });
    await step('2. ระบบเตือน "ยังไม่ได้แก้ไขข้อนี้" แล้วกด "ยกเลิก"', async () => {
      await expect(swal(page).title).toHaveText('ยังไม่ได้แก้ไขข้อนี้');
      await expect(swal(page).text).toContainText('โดยยังไม่ได้แก้ปัญหา');
      await swal(page).cancel.click();
    });
    await step('Expected: กล่องรายงานยังแสดงอยู่ (รายงานยังรอตรวจ)', () => expect(notes(page)).toBeVisible());
  });

  test('RPT-T12 กด "แก้ไขข้อนี้" ในกล่องรายงาน เข้าโหมดแก้ไข กรอบไฮไลต์หายไป และยังเห็นรายละเอียดปัญหา', async ({ page }) => {
    await step('1. เปิดข้อที่ถูกแจ้งในคลังข้อสอบ แล้วกด "แก้ไขข้อนี้"', async () => {
      await openReportedQuestion(page);
      await notes(page).getByRole('button', { name: 'แก้ไขข้อนี้' }).click();
    });
    await step('Expected: อยู่ในโหมดแก้ไข ไม่มีกรอบไฮไลต์ และกล่องรายงานยังแสดงพร้อมปุ่ม "แก้ไขแล้ว"', async () => {
      await expect(page.getByRole('button', { name: 'สร้างสถานการณ์หรือคำถามใหม่' })).toBeVisible();
      await expect(highlighted(page)).toHaveCount(0);
      await expect(notes(page).getByRole('button', { name: 'แก้ไขแล้ว' })).toBeVisible();
      await expect(notes(page)).toBeInViewport({ timeout: 10_000 });
    });
  });

  test('RPT-T04 กด "ไม่แก้ไข" พร้อมบันทึกผู้ดูแล รายงานย้ายไปแท็บ "ไม่แก้ไข"', async ({ page }) => {
    await step('1. เปิดแท็บ "รอตรวจ" แล้วกด "ไม่แก้ไข" ของรายงานทดสอบ', async () => {
      await openReports(page);
      await card(page).getByRole('button', { name: 'ไม่แก้ไข' }).click();
    });
    await step('2. กรอกบันทึกผู้ดูแล แล้วกด "บันทึก"', async () => {
      await expect(swal(page).title).toHaveText('ยืนยันว่าไม่แก้ไข');
      await page.locator('.swal2-textarea').fill(`เฉลยถูกต้องตามแนวทาง (E2E ${RUN_ID})`);
      await swal(page).confirm.click();
    });
    await step('Expected: รายงานหายจากแท็บ "รอตรวจ" และอยู่ในแท็บ "ไม่แก้ไข" พร้อมบันทึกผู้ดูแล', async () => {
      await expect(card(page)).toHaveCount(0, { timeout: 15_000 });
      await page.getByRole('tab', { name: /^ไม่แก้ไข/ }).click();
      await expect(card(page)).toHaveCount(1);
      await expect(card(page).getByText('บันทึกผู้ดูแล:')).toBeVisible();
    });
  });

  test('RPT-T05 กด "เปิดรายงานอีกครั้ง" รายงานกลับไปแท็บ "รอตรวจ"', async ({ page }) => {
    await step('1. เปิดแท็บ "ไม่แก้ไข" แล้วกด "เปิดรายงานอีกครั้ง"', async () => {
      await openReports(page, 'ไม่แก้ไข');
      await card(page).getByRole('button', { name: 'เปิดรายงานอีกครั้ง' }).click();
    });
    await step('Expected: รายงานกลับมาอยู่ในแท็บ "รอตรวจ"', async () => {
      await expect(card(page)).toHaveCount(0, { timeout: 15_000 });
      await page.getByRole('tab', { name: /^รอตรวจ/ }).click();
      await expect(card(page)).toHaveCount(1);
    });
  });

  test('RPT-T06 กด "แก้ไขแล้ว" แล้วกด "ยกเลิก" ในกล่องยืนยัน รายงานยังอยู่ในแท็บ "รอตรวจ"', async ({ page }) => {
    await step('1. เปิดแท็บ "รอตรวจ" กด "แก้ไขแล้ว" แล้วกด "ยกเลิก"', async () => {
      await openReports(page);
      await card(page).getByRole('button', { name: 'แก้ไขแล้ว' }).click();
      await expect(swal(page).title).toHaveText('ยืนยันว่าแก้ไขแล้ว');
      await swal(page).cancel.click();
    });
    await step('Expected: รายงานยังอยู่ในแท็บ "รอตรวจ"', () => expect(card(page)).toHaveCount(1));
  });

  test('RPT-T07 กด "แก้ไขแล้ว" และยืนยัน รายงานย้ายไปแท็บ "แก้ไขแล้ว"', async ({ page }) => {
    await step('1. เปิดแท็บ "รอตรวจ" กด "แก้ไขแล้ว" แล้วกด "บันทึก"', async () => {
      await openReports(page);
      await card(page).getByRole('button', { name: 'แก้ไขแล้ว' }).click();
      await swal(page).confirm.click();
    });
    await step('Expected: รายงานอยู่ในแท็บ "แก้ไขแล้ว"', async () => {
      await expect(card(page)).toHaveCount(0, { timeout: 15_000 });
      await page.getByRole('tab', { name: /^แก้ไขแล้ว/ }).click();
      await expect(card(page)).toHaveCount(1);
    });
  });

  test('RPT-T13 รายงานในแท็บ "แก้ไขแล้ว" แสดงเวลาที่ปิดรายงานและชื่อผู้ดูแลที่ปิด', async ({ page }) => {
    await step('1. เปิดแท็บ "แก้ไขแล้ว"', () => openReports(page, 'แก้ไขแล้ว'));
    await step('Expected: การ์ดรายงานแสดง "ปิดเป็นแก้ไขแล้ว เมื่อ …" และชื่อผู้ปิด', () =>
      expect(card(page).getByText(/ปิดเป็นแก้ไขแล้ว เมื่อ .+ โดย .+/)).toBeVisible());
  });
});

// ═════════════════════════════════════════════════════════════════════════════
test.describe('12.3 ข้อสอบแบบ CAT และพารามิเตอร์ IRT', () => {
  test('CATM-T01 เปิดหน้าจัดการข้อสอบ CAT แสดงหัวข้อและสถิติการสอบ', async ({ page }) => {
    await step('1. เปิดหน้า /admin/cat_management', () => page.goto('/admin/cat_management'));
    await step('Expected: แสดงหัวข้อ "จัดการและวิเคราะห์ข้อสอบ CAT" และข้อมูล "การสอบทั้งหมด"', async () => {
      await expect(page.getByRole('heading', { name: 'จัดการและวิเคราะห์ข้อสอบ CAT' })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(/การสอบทั้งหมด|จำนวนการสอบทั้งหมด/).first()).toBeVisible();
    });
  });

  test('IRT-T01 เปิดหน้าจัดการพารามิเตอร์ IRT แสดงหัวข้อและรายการข้อสอบพร้อมค่า a b c', async ({ page }) => {
    await step('1. เปิดหน้า /admin/irt_management', () => page.goto('/admin/irt_management'));
    await step('Expected: แสดงหัวข้อ "การจัดการพารามิเตอร์ IRT" และคอลัมน์ความยาก/อำนาจจำแนก/การเดา', async () => {
      await expect(page.getByRole('heading', { name: 'การจัดการพารามิเตอร์ IRT' })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(/ยังไม่ระบุ IRT|IRT ปัจจุบัน|ความยาก/).first()).toBeVisible();
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
test.describe('12.4 จัดการองค์ความรู้แชตบอต', () => {
  test.describe.configure({ mode: 'serial' });
  const fileName = `e2e-${RUN_ID.toLowerCase()}-knowledge.txt`;
  const row = (page: Page) => page.getByRole('checkbox', { name: `เลือกเอกสาร ${fileName}` }).locator('xpath=ancestor::*[self::tr or self::li or self::div[contains(@class,"rounded")]][1]');

  async function openDocs(page: Page, tab: 'เอกสารที่ใช้งาน' | 'ถังขยะ' = 'เอกสารที่ใช้งาน') {
    await page.goto('/admin/chatlog');
    await expect(page.getByRole('heading', { name: 'จัดการองค์ความรู้ Chatbot' })).toBeVisible();
    await page.getByRole('button', { name: new RegExp(`^${tab}`) }).click();
    await page.getByLabel('ค้นหาชื่อเอกสารในฐานความรู้').fill(fileName);
  }
  const fileInput = (page: Page) => page.locator('input[type="file"]').first();

  // ลบเอกสารทดสอบถาวร (ทั้งที่ใช้งานอยู่และในถังขยะ)
  test.afterAll(async ({ browser }) => {
    const page = await browser.newPage();
    await openDocs(page);
    if (await page.getByLabel(`ย้ายเอกสาร ${fileName}`, { exact: false }).count()) {
      await page.getByLabel(new RegExp(`^ย้ายเอกสาร ${fileName}`)).click();
      await swal(page).confirm.click();
      await expect(swal(page).title).toBeVisible({ timeout: 15_000 });
    }
    await openDocs(page, 'ถังขยะ');
    if (await page.getByLabel(new RegExp(`^ลบเอกสาร ${fileName}`)).count()) {
      await page.getByLabel(new RegExp(`^ลบเอกสาร ${fileName}`)).click();
      await swal(page).confirm.click();
      await expect(swal(page).title).toBeVisible({ timeout: 15_000 });
    }
    await page.close();
  });

  test('DOC-T01 เลือกไฟล์รูปแบบที่ไม่รองรับ (.png) แจ้ง "รูปแบบไฟล์ไม่ถูกต้อง" และไม่อัปโหลด', async ({ page }) => {
    await step('1. เปิดหน้าจัดการองค์ความรู้ Chatbot', () => openDocs(page));
    await step('2. เลือกไฟล์รูปภาพ .png', () =>
      fileInput(page).setInputFiles({ name: 'image.png', mimeType: 'image/png', buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47]) }));
    await step('Expected: แจ้ง "รูปแบบไฟล์ไม่ถูกต้อง"', () => expect(swal(page).title).toHaveText('รูปแบบไฟล์ไม่ถูกต้อง'));
  });

  test('DOC-T02 อัปโหลดเอกสาร .txt แล้วกด "ยืนยันอัปโหลด" เอกสารแสดงในรายการเอกสารที่ใช้งาน', async ({ page }) => {
    test.setTimeout(180_000);
    await step('1. เปิดหน้าจัดการองค์ความรู้ Chatbot', () => openDocs(page));
    await step(`2. เลือกไฟล์ "${fileName}" แล้วกด "ยืนยันอัปโหลด"`, async () => {
      await fileInput(page).setInputFiles({
        name: fileName, mimeType: 'text/plain',
        buffer: Buffer.from('ยากลุ่ม statin ยับยั้งเอนไซม์ HMG-CoA reductase ทำให้ระดับ LDL-C ลดลง (เอกสารทดสอบระบบ)'),
      });
      await expect(page.getByText(fileName).first()).toBeVisible();
      await page.getByRole('button', { name: 'ยืนยันอัปโหลด' }).click();
    });
    await step('Expected: แจ้ง "อัปโหลดสำเร็จ" และเอกสารแสดงในรายการ', async () => {
      await expect(swal(page).title).toHaveText(/อัปโหลดสำเร็จ|อัปโหลดไม่สำเร็จ|ไม่สามารถอัปโหลดไฟล์ได้ในขณะนี้/, { timeout: 150_000 });
      const title = await swal(page).title.textContent();
      expect(title, `ระบบตอบกลับ: ${await swal(page).text.textContent()}`).toBe('อัปโหลดสำเร็จ');
      await dismiss(page);
      await expect(page.getByLabel(new RegExp(`^เปิดอ่านเอกสาร ${fileName}`))).toBeVisible();
    });
  });

  test('DOC-T03 กดย้ายเอกสารไปถังขยะ เอกสารย้ายไปแท็บ "ถังขยะ"', async ({ page }) => {
    await step('1. ค้นหาเอกสารทดสอบ แล้วกดย้ายไปถังขยะและยืนยัน', async () => {
      await openDocs(page);
      await page.getByLabel(new RegExp(`^ย้ายเอกสาร ${fileName}`)).click();
      await expect(swal(page).title).toHaveText('ยืนยันการลบเอกสาร');
      await swal(page).confirm.click();
    });
    await step('Expected: แจ้ง "ย้ายไปถังขยะสำเร็จ" และพบเอกสารในแท็บถังขยะ', async () => {
      await expect(swal(page).title).toHaveText('ย้ายไปถังขยะสำเร็จ', { timeout: 15_000 });
      await dismiss(page);
      await openDocs(page, 'ถังขยะ');
      await expect(page.getByLabel(new RegExp(`^กู้คืนเอกสาร ${fileName}`))).toBeVisible();
    });
  });

  test('DOC-T04 กดกู้คืนเอกสารจากถังขยะ เอกสารกลับไปแท็บ "เอกสารที่ใช้งาน"', async ({ page }) => {
    await step('1. เปิดแท็บถังขยะ แล้วกดกู้คืนเอกสารทดสอบและยืนยัน', async () => {
      await openDocs(page, 'ถังขยะ');
      await page.getByLabel(new RegExp(`^กู้คืนเอกสาร ${fileName}`)).click();
      await expect(swal(page).title).toHaveText('ยืนยันการกู้คืนเอกสาร');
      await swal(page).confirm.click();
    });
    await step('Expected: แจ้ง "กู้คืนเอกสารสำเร็จ" และเอกสารอยู่ในแท็บเอกสารที่ใช้งาน', async () => {
      await expect(swal(page).title).toHaveText('กู้คืนเอกสารสำเร็จ', { timeout: 15_000 });
      await dismiss(page);
      await openDocs(page);
      await expect(page.getByLabel(new RegExp(`^ย้ายเอกสาร ${fileName}`))).toBeVisible();
    });
  });

  test('DOC-T05 ลบเอกสารถาวรจากถังขยะ เอกสารหายจากทั้งสองแท็บ', async ({ page }) => {
    await step('1. ย้ายเอกสารทดสอบไปถังขยะ', async () => {
      await openDocs(page);
      await page.getByLabel(new RegExp(`^ย้ายเอกสาร ${fileName}`)).click();
      await swal(page).confirm.click();
      await expect(swal(page).title).toHaveText('ย้ายไปถังขยะสำเร็จ', { timeout: 15_000 });
      await dismiss(page);
    });
    await step('2. เปิดแท็บถังขยะ กดลบเอกสาร แล้วกด "ลบถาวร"', async () => {
      await openDocs(page, 'ถังขยะ');
      await page.getByLabel(new RegExp(`^ลบเอกสาร ${fileName}`)).click();
      await expect(swal(page).title).toHaveText('ยืนยันการลบถาวร');
      await swal(page).confirm.click();
    });
    await step('Expected: แจ้ง "ลบเอกสารถาวรเรียบร้อย" และไม่พบเอกสารทั้งสองแท็บ', async () => {
      await expect(swal(page).title).toHaveText('ลบเอกสารถาวรเรียบร้อย', { timeout: 15_000 });
      await dismiss(page);
      await expect(page.getByLabel(new RegExp(`^กู้คืนเอกสาร ${fileName}`))).toHaveCount(0);
      await openDocs(page);
      await expect(page.getByLabel(new RegExp(`^ย้ายเอกสาร ${fileName}`))).toHaveCount(0);
    });
  });
});

// ═════════════════════════════════════════════════════════════════════════════
test.describe('12.5 การตั้งค่าบัญชีผู้ดูแลระบบ', () => {
  test('SET-T01 เปิดหน้าการตั้งค่า แสดงข้อมูลส่วนตัวของผู้ดูแลระบบ อีเมลแก้ไขไม่ได้', async ({ page }) => {
    await step('1. เปิดหน้า /admin/settingp', () => page.goto('/admin/settingp'));
    await step('Expected: แสดงแท็บ ข้อมูลส่วนตัว ความปลอดภัย การแสดงผล และอีเมลของบัญชีเป็นแบบอ่านอย่างเดียว', async () => {
      const tabs = page.getByRole('tablist', { name: 'การตั้งค่า' });
      for (const t of ['ข้อมูลส่วนตัว', 'ความปลอดภัย', 'การแสดงผล']) await expect(tabs.getByRole('tab', { name: t })).toBeVisible();
      await expect(page.locator('#admin-email-field')).toHaveValue(process.env.E2E_ADMIN_EMAIL!, { timeout: 15_000 });
      await expect(page.locator('#admin-email-field')).not.toBeEditable();
    });
  });

  test('SET-T02 กดแก้ไขโปรไฟล์แล้วกดยกเลิก ข้อมูลกลับเป็นค่าเดิม', async ({ page }) => {
    await step('1. เปิดหน้าการตั้งค่า', () => page.goto('/admin/settingp'));
    const original = await page.locator('#admin-first-name').inputValue();
    await step('2. กด "แก้ไข" เปลี่ยนชื่อจริง แล้วกด "ยกเลิก"', async () => {
      await page.getByLabel('แก้ไขข้อมูลโปรไฟล์ผู้ดูแลระบบ').click();
      await page.locator('#admin-first-name').fill(`ไม่บันทึก${RUN_ID}`);
      await page.getByLabel('ยกเลิกการแก้ไขโปรไฟล์').click();
    });
    await step('Expected: ชื่อจริงกลับเป็นค่าเดิม', () => expect(page.locator('#admin-first-name')).toHaveValue(original));
  });
});

// ═════════════════════════════════════════════════════════════════════════════
test.describe('12.6 เมนูเฉพาะ Super Admin', () => {
  test('SUP-T01 เปิดหน้าตั้งค่าระบบชำระเงิน แสดงราคาสิทธิ์ผู้ดูแลระบบและสวิตช์รับชำระเงิน', async ({ page }) => {
    await step('1. เปิดหน้า /admin/super/payment-settings', () => page.goto('/admin/super/payment-settings'));
    await step('Expected: แสดงหัวข้อ "ตั้งค่าระบบชำระเงิน" ช่องราคาต่อปี และสวิตช์เปิด/ปิดการรับชำระเงิน', async () => {
      await expect(page.getByRole('heading', { name: 'ตั้งค่าระบบชำระเงิน' })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByLabel('ราคาสิทธิ์ผู้ดูแลระบบต่อปี (บาท)')).toBeVisible();
      await expect(page.getByLabel('เปิด/ปิดการรับชำระเงิน')).toBeVisible();
    });
  });

  test('SUP-T02 เปิดหน้าประวัติการชำระเงิน แสดงหัวข้อและช่องค้นหา', async ({ page }) => {
    await step('1. เปิดหน้า /admin/super/subscriptions', () => page.goto('/admin/super/subscriptions'));
    await step('Expected: แสดงหัวข้อ "ประวัติการชำระเงิน" และช่องค้นหาชื่อ อีเมล หรือรหัสอ้างอิง', async () => {
      await expect(page.getByRole('heading', { name: 'ประวัติการชำระเงิน' })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByLabel(/^ค้นหาชื่อ อีเมล หรือรหัสอ้างอิง/)).toBeVisible();
    });
  });

});
