import { test, expect, type Page } from '@playwright/test';
import { RUN_ID, hasStudent, SKIP_NO_STUDENT, STUDENT_AUTH_FILE } from './helpers';

/**
 * Test Scenario: หน้าหลักผู้เรียน ทบทวนประจำวัน ติดตามความคืบหน้า และประวัติการทำข้อสอบ — Black Box Testing
 *
 * ทบทวนประจำวันเป็นชุดเดียวทั้งวัน ถ้ารันซ้ำในวันเดียวกันหลังทำครบแล้ว เคสที่ต้องตอบข้อจะตรวจสถานะ "ครบแล้ว" แทน
 */

const step = test.step;

const trackChip = (page: Page, label: string) =>
  page.getByRole('group', { name: 'กรองตามสายการสอบ' }).getByRole('button', { name: label, exact: true });

async function openHome(page: Page) {
  await page.goto('/user');
  await expect(page.getByRole('heading', { name: 'จัดอันดับมหาวิทยาลัย' })).toBeVisible({ timeout: 20_000 });
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe('7.1 หน้าหลักผู้เรียน', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.use({ storageState: STUDENT_AUTH_FILE });

  test('HOME-T01 เปิดหน้าหลัก แสดงการ์ดนับถอยหลัง กำหนดการถัดไป ทบทวนประจำวัน จัดอันดับ และข่าวสาร', async ({ page }) => {
    await step('1. เปิดหน้า /user', () => openHome(page));
    await step('Expected: แสดงทุกส่วนของหน้าหลัก', async () => {
      await expect(page.getByRole('group', { name: 'กรองตามสายการสอบ' })).toBeVisible();
      await expect(page.getByRole('link', { name: /ทบทวนประจำวัน/ }).last()).toBeVisible();
      await expect(page.getByRole('heading', { name: 'จัดอันดับมหาวิทยาลัย' })).toBeVisible();
      await expect(page.getByText('ข่าวสารและประกาศ').first()).toBeVisible();
    });
  });

  test('HOME-T02 ตารางจัดอันดับมหาวิทยาลัยไม่เปิดเผยชื่อมหาวิทยาลัยใดเลย', async ({ page }) => {
    await step('1. เปิดหน้าหลัก', () => openHome(page));
    const board = page.getByRole('heading', { name: 'จัดอันดับมหาวิทยาลัย' }).locator('xpath=ancestor::div[2]');
    await step('Expected: ทุกแถวแสดงเป็น "มหาวิทยาลัยอันดับ N" หรือ "มหาวิทยาลัยของคุณ" ไม่มีคำว่า "มหาวิทยาลัย" ตามด้วยชื่อจริง', async () => {
      await expect(board.getByText('ไม่เปิดเผยชื่อมหาวิทยาลัย', { exact: false })).toBeVisible();
      const names = await board.locator('span.truncate').allTextContents();
      expect(names.length).toBeGreaterThan(0);
      for (const n of names) expect(n.trim()).toMatch(/^(มหาวิทยาลัยอันดับ \d+|มหาวิทยาลัยของคุณ)$/);
    });
  });

  test('HOME-T03 เลือกสายการสอบ "CC" การ์ดนับถอยหลังเปลี่ยนตามสายที่เลือก และกลับ "ทุกสาย" ได้', async ({ page }) => {
    await step('1. เปิดหน้าหลัก แล้วกดปุ่ม "ทุกสาย"', async () => {
      await openHome(page);
      await trackChip(page, 'ทุกสาย').click();
    });
    await step('2. กดปุ่ม "CC"', () => trackChip(page, 'CC').click());
    await step('Expected: ปุ่ม CC ถูกเลือก และกำหนดการที่นับถอยหลังเป็นกำหนดการของ CC หรือไม่มีกำหนดการ', async () => {
      await expect(trackChip(page, 'CC')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.getByText('รวมกำหนดการ CC ที่ทุกคนต้องสอบ')).toHaveCount(0);
    });
    await step('3. กดปุ่ม "ทุกสาย"', () => trackChip(page, 'ทุกสาย').click());
    await step('Expected: ปุ่ม "ทุกสาย" ถูกเลือก', () =>
      expect(trackChip(page, 'ทุกสาย')).toHaveAttribute('aria-pressed', 'true'));
  });

  test('HOME-T04 สายการสอบที่เลือกในหน้าหลักใช้ร่วมกับหน้าปฏิทิน', async ({ page }) => {
    await step('1. เปิดหน้าหลัก แล้วกดปุ่ม "PHCP"', async () => {
      await openHome(page);
      await trackChip(page, 'PHCP').click();
    });
    await step('2. ไปหน้าปฏิทินการสอบ', () => page.goto('/user/calendar'));
    await step('Expected: หน้าปฏิทินเลือกสาย "PHCP" ไว้แล้ว', async () => {
      await expect(trackChip(page, 'PHCP')).toHaveAttribute('aria-pressed', 'true');
    });
    await step('3. คืนค่าเป็น "ทุกสาย"', () => trackChip(page, 'ทุกสาย').click());
  });

  test('HOME-T05 กดการ์ด "ทบทวนประจำวัน" ไปหน้าทบทวนประจำวัน', async ({ page }) => {
    await step('1. เปิดหน้าหลัก', () => openHome(page));
    await step('2. กดการ์ด "ทบทวนประจำวัน"', () =>
      page.locator('main, body').getByRole('link', { name: /ทบทวนประจำวัน\s*วันละ 5 ข้อ/ }).click());
    await step('Expected: ไปหน้า /user/daily-review', async () => {
      await page.waitForURL(/\/user\/daily-review/);
      await expect(page.getByRole('heading', { name: 'ทบทวนประจำวัน' })).toBeVisible();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('7.2 ทบทวนความรู้ประจำวัน', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.use({ storageState: STUDENT_AUTH_FILE });
  test.describe.configure({ mode: 'serial' });

  const segments = (page: Page) => page.locator('[aria-label^="ตอบแล้ว"] > button');
  const options = (page: Page) => page.locator('button[aria-pressed]').filter({ has: page.locator('span.rounded') });
  const checkButton = (page: Page) => page.getByRole('button', { name: 'ตรวจคำตอบ' });

  async function openReview(page: Page) {
    await page.goto('/user/daily-review');
    await expect(page.getByRole('heading', { name: 'ทบทวนประจำวัน' })).toBeVisible();
    await expect(segments(page).first()).toBeVisible({ timeout: 20_000 });
  }
  const isCompleted = (page: Page) => page.getByText('ทบทวนวันนี้ครบแล้ว').isVisible();

  test('DR-T01 เปิดหน้าทบทวนประจำวัน แสดงชุดคำถาม 5 ข้อพร้อมแถบความคืบหน้า', async ({ page }) => {
    await step('1. เปิดหน้า /user/daily-review', () => openReview(page));
    await step('Expected: แถบความคืบหน้ามี 5 ช่อง และแสดง "ข้อ x / 5"', async () => {
      await expect(segments(page)).toHaveCount(5);
      await expect(page.getByText(/^ข้อ \d \/ 5$/)).toBeVisible();
    });
  });

  test('DR-T02 ยังไม่เลือกคำตอบ ปุ่ม "ตรวจคำตอบ" กดไม่ได้', async ({ page }) => {
    await step('1. เปิดหน้าทบทวนประจำวัน', () => openReview(page));
    test.skip(await isCompleted(page), 'ชุดทบทวนวันนี้ทำครบแล้ว (รันซ้ำในวันเดียวกัน)');
    await step('Expected: ปุ่ม "ตรวจคำตอบ" ถูกปิดไว้จนกว่าจะเลือกคำตอบ', async () => {
      await expect(checkButton(page)).toBeDisabled();
    });
  });

  test('DR-T03 เลือกคำตอบแล้วกด "ตรวจคำตอบ" แสดงผลถูก/ผิด เฉลยข้อที่ถูก และปุ่มแจ้งปัญหา', async ({ page }) => {
    await step('1. เปิดหน้าทบทวนประจำวัน', () => openReview(page));
    test.skip(await isCompleted(page), 'ชุดทบทวนวันนี้ทำครบแล้ว (รันซ้ำในวันเดียวกัน)');
    await step('2. เลือกตัวเลือกแรก แล้วกด "ตรวจคำตอบ"', async () => {
      await options(page).first().click();
      await checkButton(page).click();
    });
    await step('Expected: แสดง "ตอบถูก" หรือ "ยังไม่ถูก" มีตัวเลือกที่ถูกเป็นสีเขียว และปุ่ม "แจ้งปัญหา"', async () => {
      await expect(page.getByText(/^(ตอบถูก|ยังไม่ถูก)$/)).toBeVisible({ timeout: 15_000 });
      await expect(page.locator('button.border-green-500')).toHaveCount(1);
      await expect(page.getByRole('button', { name: 'แจ้งปัญหา' })).toBeVisible();
    });
  });

  test('DR-T04 ตอบครบทั้ง 5 ข้อ แสดง "ทบทวนวันนี้ครบแล้ว" และจำนวนวันที่ทำต่อเนื่อง', async ({ page }) => {
    test.setTimeout(120_000);
    await step('1. เปิดหน้าทบทวนประจำวัน', () => openReview(page));
    await step('2. ตอบข้อที่เหลือทุกข้อ (เลือกตัวเลือกแรก → ตรวจคำตอบ → ข้อถัดไป)', async () => {
      for (let i = 0; i < 5 && !(await isCompleted(page)); i++) {
        if (await checkButton(page).isVisible()) {
          await options(page).first().click();
          await checkButton(page).click();
          await expect(page.getByText(/^(ตอบถูก|ยังไม่ถูก)$/)).toBeVisible({ timeout: 15_000 });
        }
        const next = page.getByRole('button', { name: 'ข้อถัดไป →' });
        if (await next.isVisible()) await next.click();
      }
    });
    await step('Expected: แสดง "ทบทวนวันนี้ครบแล้ว" ทุกช่องในแถบความคืบหน้าเป็นสีเขียวหรือแดง และป้ายทำต่อเนื่อง', async () => {
      await expect(page.getByText('ทบทวนวันนี้ครบแล้ว')).toBeVisible({ timeout: 15_000 });
      for (let i = 0; i < 5; i++) await expect(segments(page).nth(i)).toHaveClass(/bg-green-500|bg-rose-400/);
      await expect(page.getByText(/ทำต่อเนื่อง \d+ วัน/)).toBeVisible();
    });
  });

  test('DR-T05 โหลดหน้าใหม่หลังทำครบ ยังเป็นชุดเดิมและสถานะครบแล้ว (ไม่สุ่มชุดใหม่ในวันเดียวกัน)', async ({ page }) => {
    await step('1. เปิดหน้าทบทวนประจำวัน แล้วจดคำถามข้อ 1', async () => {
      await openReview(page);
      await segments(page).first().click();
    });
    const firstQuestion = await page.locator('div.space-y-5 > div.text-base, div.space-y-5 > div').filter({ hasText: /\S/ }).first().textContent();
    await step('2. โหลดหน้าใหม่ แล้วเปิดข้อ 1', async () => {
      await page.reload();
      await expect(segments(page).first()).toBeVisible({ timeout: 20_000 });
      await segments(page).first().click();
    });
    await step('Expected: คำถามข้อ 1 เหมือนเดิม และยังแสดง "ทบทวนวันนี้ครบแล้ว"', async () => {
      await expect(page.getByText('ทบทวนวันนี้ครบแล้ว')).toBeVisible();
      await expect(page.locator('div.space-y-5 > div.text-base, div.space-y-5 > div').filter({ hasText: /\S/ }).first()).toHaveText(firstQuestion!);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('7.3 ติดตามความคืบหน้า', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.use({ storageState: STUDENT_AUTH_FILE });

  async function openFollowup(page: Page) {
    await page.goto('/user/followup');
    await expect(page.getByRole('heading', { name: 'ติดตามความคืบหน้า' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'อันดับของคุณ' })).toBeVisible({ timeout: 30_000 });
  }

  test('PROG-T01 เปิดหน้าติดตามความคืบหน้า แสดงอันดับ พัฒนาการ จุดแข็ง-จุดอ่อน และหัวข้อที่ควรทบทวน', async ({ page }) => {
    await step('1. เปิดหน้า /user/followup', () => openFollowup(page));
    await step('Expected: แสดงหัวข้อ "อันดับของคุณ" "พัฒนาการของคุณ" "วิเคราะห์จุดแข็ง - จุดอ่อน" "หัวข้อที่ควรทบทวน"', async () => {
      for (const h of ['อันดับของคุณ', 'พัฒนาการของคุณ', 'วิเคราะห์จุดแข็ง - จุดอ่อน', 'หัวข้อที่ควรทบทวน']) {
        await expect(page.getByRole('heading', { name: h })).toBeVisible();
      }
    });
  });

  test('PROG-T02 เปิดหน้าต่างเลือกหัวข้อ กด "เลือกทั้งหมด" จำนวนที่เลือกเท่ากับหัวข้อทั้งหมด', async ({ page }) => {
    await step('1. เปิดหน้าติดตามความคืบหน้า แล้วกด "เลือกหัวข้อแสดงผล"', async () => {
      await openFollowup(page);
      await page.getByRole('button', { name: 'เลือกหัวข้อแสดงผล' }).click();
      await expect(page.getByRole('heading', { name: 'เลือกหัวข้อที่ต้องการแสดงผล' })).toBeVisible();
    });
    await step('2. กด "เลือกทั้งหมด"', () => page.getByRole('button', { name: 'เลือกทั้งหมด' }).click());
    await step('Expected: แสดง "เลือกแล้ว N จาก N หัวข้อ"', async () => {
      const text = (await page.getByText(/^เลือกแล้ว \d+ จาก \d+ หัวข้อ$/).textContent())!;
      const [, picked, total] = text.match(/(\d+) จาก (\d+)/)!;
      expect(picked).toBe(total);
    });
    await step('3. กด "ล้างการเลือก"', () => page.getByRole('button', { name: 'ล้างการเลือก' }).click());
    await step('Expected: แสดง "เลือกแล้ว 0 จาก N หัวข้อ"', () =>
      expect(page.getByText(/^เลือกแล้ว 0 จาก \d+ หัวข้อ$/)).toBeVisible());
  });

  test('PROG-T03 เลือก "3 จุดที่ควรพัฒนา" แล้วบันทึก กราฟแสดงผลตามหัวข้อที่เลือก', async ({ page }) => {
    await step('1. เปิดหน้าต่างเลือกหัวข้อ', async () => {
      await openFollowup(page);
      await page.getByRole('button', { name: 'เลือกหัวข้อแสดงผล' }).click();
    });
    await step('2. กด "3 จุดที่ควรพัฒนา" แล้วกด "บันทึกและนำไปแสดงผล"', async () => {
      await page.getByRole('button', { name: '3 จุดที่ควรพัฒนา' }).click();
      await expect(page.getByText(/^เลือกแล้ว [1-3] จาก \d+ หัวข้อ$/)).toBeVisible();
      await page.getByRole('button', { name: 'บันทึกและนำไปแสดงผล' }).click();
    });
    await step('Expected: ปิดหน้าต่าง และไม่แสดง "ยังไม่ได้เลือกหัวข้อแสดงผล"', async () => {
      await expect(page.getByRole('heading', { name: 'เลือกหัวข้อที่ต้องการแสดงผล' })).toHaveCount(0);
      await expect(page.getByText('ยังไม่ได้เลือกหัวข้อแสดงผล')).toHaveCount(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('7.4 ประวัติการทำข้อสอบ', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.use({ storageState: STUDENT_AUTH_FILE });

  const cards = (page: Page) => page.getByRole('button', { name: /ดูผลสอบ/ });
  async function openHistory(page: Page) {
    await page.goto('/user/examhis');
    await expect(page.getByRole('heading', { name: 'ประวัติการทำข้อสอบ' })).toBeVisible();
    await expect(page.getByRole('button', { name: /^ทั้งหมด/ }).first()).toBeVisible({ timeout: 20_000 });
  }

  test('HIS-T01 เปิดหน้าประวัติ แสดงสรุปจำนวนครั้ง สอบผ่าน แบบปกติ แบบ CAT และรายการสอบ', async ({ page }) => {
    await step('1. เปิดหน้า /user/examhis', () => openHistory(page));
    await step('Expected: แสดงการ์ดสรุป "สอบผ่าน" "สอบแบบปกติ" "สอบแบบ CAT" และมีรายการสอบอย่างน้อย 1 รายการ', async () => {
      for (const t of ['สอบผ่าน', 'สอบแบบปกติ', 'สอบแบบ CAT']) await expect(page.getByText(t, { exact: true }).first()).toBeVisible();
      await expect(page.getByText(/ดูผลสอบ/).first()).toBeVisible();
    });
  });

  test('HIS-T02 กดแท็บ "สอบแบบปกติ" แสดงเฉพาะรายการแบบ NORMAL', async ({ page }) => {
    await step('1. เปิดหน้าประวัติ', () => openHistory(page));
    await step('2. กดแท็บ "สอบแบบปกติ"', () => page.getByRole('button', { name: /^สอบแบบปกติ/ }).click());
    await step('Expected: ไม่มีรายการที่มีป้าย "CAT"', async () => {
      await expect(page.getByText('NORMAL', { exact: true }).first()).toBeVisible();
      await expect(page.getByText('CAT', { exact: true })).toHaveCount(0);
    });
  });

  test('HIS-T03 ค้นหาด้วยชื่อชุดที่ไม่มี แสดง "ไม่พบผลลัพธ์ที่ตรงกัน"', async ({ page }) => {
    await step('1. เปิดหน้าประวัติ', () => openHistory(page));
    await step(`2. พิมพ์ "ไม่มีจริง-${RUN_ID}" ในช่องค้นหา`, () =>
      page.getByLabel('ค้นหาชื่อชุดข้อสอบ').fill(`ไม่มีจริง-${RUN_ID}`));
    await step('Expected: แสดง "ไม่พบผลลัพธ์ที่ตรงกัน"', () =>
      expect(page.getByText('ไม่พบผลลัพธ์ที่ตรงกัน')).toBeVisible());
  });

  test('HIS-T04 เปิดตัวกรองแล้วเลือก "วันนี้" แสดงเฉพาะการสอบของวันนี้ หรือแจ้งว่าไม่พบ', async ({ page }) => {
    await step('1. เปิดหน้าประวัติ แล้วกด "ตัวกรอง"', async () => {
      await openHistory(page);
      await page.getByRole('button', { name: 'ตัวกรอง' }).click();
    });
    await step('2. เลือกช่วงเวลา "วันนี้"', () => page.getByRole('button', { name: 'วันนี้', exact: true }).click());
    await step('Expected: แสดงรายการสอบ หรือข้อความ "ไม่พบผลลัพธ์ที่ตรงกัน" (ไม่เกิดข้อผิดพลาด)', async () => {
      await expect(page.getByText(/ดูผลสอบ|ไม่พบผลลัพธ์ที่ตรงกัน/).first()).toBeVisible();
      await expect(page.getByRole('heading', { name: 'เกิดข้อผิดพลาด' })).toHaveCount(0);
    });
  });

  test('HIS-T05 กด "ดูผลสอบ" ของรายการแบบปกติ ไปหน้าสรุปผลของการสอบครั้งนั้น', async ({ page }) => {
    await step('1. เปิดหน้าประวัติ แล้วกดแท็บ "สอบแบบปกติ"', async () => {
      await openHistory(page);
      await page.getByRole('button', { name: /^สอบแบบปกติ/ }).click();
    });
    test.skip(!(await page.getByText(/ดูผลสอบ/).count()), 'ยังไม่มีประวัติการสอบแบบปกติ');
    await step('2. กด "ดูผลสอบ" ของรายการแรก', () => page.getByText(/ดูผลสอบ/).first().click());
    await step('Expected: ไปหน้าสรุปผลการทำข้อสอบ', async () => {
      await page.waitForURL(/summarize-exam/, { timeout: 20_000 });
      await expect(page.getByText('สรุปผลการทำข้อสอบ', { exact: true })).toBeVisible({ timeout: 20_000 });
    });
  });
});
