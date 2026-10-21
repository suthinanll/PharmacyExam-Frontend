import { test, expect, type Page } from '@playwright/test';
import { RUN_ID, swal, GUEST_STATE, hasStudent, SKIP_NO_STUDENT, STUDENT_AUTH_FILE } from './helpers';

/**
 * Test Scenario: การเข้าสู่ระบบ สมัครสมาชิก ลืมรหัสผ่าน และออกจากระบบ — Black Box Testing
 *
 * ทุกเคสเริ่มจากเบราว์เซอร์ที่ยังไม่ได้เข้าสู่ระบบ (ยกเว้นกลุ่มออกจากระบบ)
 * การสมัครสมาชิกทดสอบถึงขั้นตรวจข้อมูลก่อนขอรหัส OTP เท่านั้น เพื่อไม่ส่งอีเมลจริงออกไป
 */

const step = test.step;
const studentEmail = process.env.E2E_STUDENT_EMAIL ?? '';
const studentPassword = process.env.E2E_STUDENT_PASSWORD ?? '';
/** อีเมลที่ไม่มีในระบบแน่นอน (โดเมน example.com สงวนไว้สำหรับทดสอบ ไม่มีกล่องจดหมายจริง) */
const unknownEmail = `e2e-${RUN_ID.toLowerCase()}@example.com`;

const login = (page: Page) => ({
  email: page.getByPlaceholder('example@email.com'),
  password: page.locator('input[type="password"]'),
  submit: page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }),
});

async function openLogin(page: Page) {
  await page.addInitScript(() => localStorage.setItem('pwa-dismissed', 'true'));
  await page.goto('/login');
  await expect(login(page).submit).toBeVisible();
}

// ─────────────────────────────────────────────────────────────────────────────
test.describe('3.1 การเข้าสู่ระบบ', () => {
  test.use({ storageState: GUEST_STATE });

  test('AUTH-T01 เปิดหน้าเข้าสู่ระบบ แสดงช่องอีเมล รหัสผ่าน และประกาศช่วงทดสอบระบบ', async ({ page }) => {
    await step('1. เปิดหน้า /login', () => openLogin(page));
    await step('Expected: มีช่องกรอกอีเมล รหัสผ่าน ปุ่มเข้าสู่ระบบ และข้อความ "ระบบอยู่ในช่วงทดสอบ"', async () => {
      await expect(login(page).email).toBeVisible();
      await expect(login(page).password).toBeVisible();
      await expect(page.getByRole('button', { name: 'เข้าสู่ระบบด้วยบัญชี Google' })).toBeVisible();
      await expect(page.getByText('ระบบอยู่ในช่วงทดสอบ')).toBeVisible();
      await expect(page.getByText('ไม่มีผลต่อคะแนนสอบจริง')).toBeVisible();
    });
  });

  test('AUTH-T02 กรอกอีเมลและรหัสผ่านผู้เรียนถูกต้อง เข้าสู่ระบบสำเร็จและไปหน้าหลักผู้เรียน', async ({ page }) => {
    test.skip(!hasStudent, SKIP_NO_STUDENT);
    await step('1. เปิดหน้า /login', () => openLogin(page));
    await step('2. กรอกอีเมลและรหัสผ่านของผู้เรียน แล้วกด "เข้าสู่ระบบ"', async () => {
      await login(page).email.fill(studentEmail);
      await login(page).password.fill(studentPassword);
      await login(page).submit.click();
    });
    await step('Expected: แจ้ง "เข้าสู่ระบบสำเร็จ!" และพาไปหน้า /user', async () => {
      await expect(swal(page).title).toHaveText('เข้าสู่ระบบสำเร็จ!', { timeout: 15_000 });
      await swal(page).confirm.click();
      await page.waitForURL(/\/user(\/|$)/);
    });
  });

  test('AUTH-T03 กรอกรหัสผ่านผิด แจ้ง "เข้าสู่ระบบไม่สำเร็จ" และอยู่หน้าเดิม', async ({ page }) => {
    test.skip(!hasStudent, SKIP_NO_STUDENT);
    await step('1. เปิดหน้า /login', () => openLogin(page));
    await step('2. กรอกอีเมลผู้เรียนและรหัสผ่านที่ไม่ถูกต้อง แล้วกด "เข้าสู่ระบบ"', async () => {
      await login(page).email.fill(studentEmail);
      await login(page).password.fill(`Wrong-${RUN_ID}`);
      await login(page).submit.click();
    });
    await step('Expected: แจ้ง "เข้าสู่ระบบไม่สำเร็จ" และยังอยู่หน้า /login', async () => {
      await expect(swal(page).title).toHaveText('เข้าสู่ระบบไม่สำเร็จ', { timeout: 15_000 });
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test('AUTH-T04 กรอกอีเมลที่ไม่มีในระบบ แจ้ง "เข้าสู่ระบบไม่สำเร็จ"', async ({ page }) => {
    await step('1. เปิดหน้า /login', () => openLogin(page));
    await step(`2. กรอกอีเมล ${unknownEmail} และรหัสผ่านใดก็ได้ แล้วกด "เข้าสู่ระบบ"`, async () => {
      await login(page).email.fill(unknownEmail);
      await login(page).password.fill('Password123!');
      await login(page).submit.click();
    });
    await step('Expected: แจ้ง "เข้าสู่ระบบไม่สำเร็จ"', async () => {
      await expect(swal(page).title).toHaveText('เข้าสู่ระบบไม่สำเร็จ', { timeout: 15_000 });
    });
  });

  test('AUTH-T05 ไม่กรอกอีเมลและรหัสผ่าน ระบบไม่ส่งข้อมูลเข้าสู่ระบบ', async ({ page }) => {
    await step('1. เปิดหน้า /login', () => openLogin(page));
    await step('2. กด "เข้าสู่ระบบ" โดยไม่กรอกข้อมูล', () => login(page).submit.click());
    await step('Expected: ช่องอีเมลแจ้งว่าต้องกรอก ไม่มีกล่องแจ้งผล และยังอยู่หน้า /login', async () => {
      expect(await login(page).email.evaluate((el: HTMLInputElement) => el.validity.valid)).toBe(false);
      await expect(swal(page).title).toHaveCount(0);
      await expect(page).toHaveURL(/\/login/);
    });
  });

  test('AUTH-T06 กดไอคอนรูปตา แสดงรหัสผ่านเป็นตัวอักษร', async ({ page }) => {
    await step('1. เปิดหน้า /login และกรอกรหัสผ่าน', async () => {
      await openLogin(page);
      await login(page).password.fill('Secret123');
    });
    await step('2. กดปุ่มแสดงรหัสผ่าน', async () => {
      await page.getByRole('button', { name: /แสดงรหัสผ่าน/ }).click();
    });
    await step('Expected: ช่องรหัสผ่านเปลี่ยนเป็นแบบข้อความ เห็นรหัสที่กรอก', async () => {
      await expect(page.locator('input[type="text"]').last()).toHaveValue('Secret123');
    });
  });

  test('AUTH-T07 ผู้ที่ยังไม่เข้าสู่ระบบเปิดหน้าผู้เรียนโดยตรง ระบบพาไปหน้าเข้าสู่ระบบ', async ({ page }) => {
    await step('1. พิมพ์ URL /user/followup โดยยังไม่เข้าสู่ระบบ', () => page.goto('/user/followup'));
    await step('Expected: ระบบพาไปหน้า /login', async () => {
      await page.waitForURL(/\/login/, { timeout: 15_000 });
    });
  });

  test('AUTH-T08 กดลิงก์ "ลืมรหัสผ่าน?" ไปหน้าลืมรหัสผ่าน', async ({ page }) => {
    await step('1. เปิดหน้า /login', () => openLogin(page));
    await step('2. กดลิงก์ "ลืมรหัสผ่าน?"', () => page.getByRole('link', { name: 'ลืมรหัสผ่าน?' }).click());
    await step('Expected: ไปหน้าลืมรหัสผ่าน', async () => {
      await page.waitForURL(/\/resetpassword/);
      await expect(page.getByRole('heading', { name: /ลืมรหัสผ่าน/ })).toBeVisible();
    });
  });

  test('AUTH-T09 กดลิงก์ "สมัครสมาชิก" ไปหน้าสมัครสมาชิก', async ({ page }) => {
    await step('1. เปิดหน้า /login', () => openLogin(page));
    await step('2. กดลิงก์ "สมัครสมาชิก"', () => page.getByRole('link', { name: 'สมัครสมาชิก', exact: true }).click());
    await step('Expected: ไปหน้า /register', async () => {
      await page.waitForURL(/\/register/);
      await expect(page.getByRole('button', { name: /ขอรหัส OTP/ })).toBeVisible();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('3.2 การสมัครสมาชิก (ตรวจข้อมูลก่อนขอรหัส OTP)', () => {
  test.use({ storageState: GUEST_STATE });

  const reg = (page: Page) => ({
    firstName: page.getByPlaceholder('ชื่อ', { exact: true }),
    lastName: page.getByPlaceholder('นามสกุล', { exact: true }),
    tel: page.getByPlaceholder('08xxxxxxxx'),
    bod: page.locator('#register-bod'),
    university: page.locator('#register-university'),
    email: page.getByPlaceholder('example@email.com'),
    password: page.getByPlaceholder('••••••••').first(),
    confirm: page.getByPlaceholder('••••••••').nth(1),
    submit: page.getByRole('button', { name: /ขอรหัส OTP/ }),
  });

  /** กรอกฟอร์มสมัครสมาชิกให้ครบ (เปลี่ยนบางช่องได้ผ่าน override) */
  async function fillRegister(page: Page, override: Partial<Record<'tel' | 'email' | 'password' | 'confirm', string>> = {}) {
    const r = reg(page);
    await r.firstName.fill('ทดสอบ');
    await r.lastName.fill(`E2E${RUN_ID}`);
    await r.tel.fill(override.tel ?? '0812345678');
    await r.bod.fill('2003-05-15');
    // รอรายชื่อมหาวิทยาลัยโหลดเสร็จ แล้วเลือกตัวแรก
    await expect(r.university.locator('option')).not.toHaveCount(1);
    await r.university.selectOption({ index: 1 });
    await r.email.fill(override.email ?? unknownEmail);
    await r.password.fill(override.password ?? 'E2e-Strong#2026');
    await r.confirm.fill(override.confirm ?? override.password ?? 'E2e-Strong#2026');
  }

  async function openRegister(page: Page) {
    await page.addInitScript(() => localStorage.setItem('pwa-dismissed', 'true'));
    await page.goto('/register');
    await expect(reg(page).submit).toBeVisible();
  }

  test('AUTH-T10 กดขอรหัส OTP โดยไม่กรอกข้อมูล ระบบไม่ส่งคำขอและแจ้งช่องที่ต้องกรอก', async ({ page }) => {
    await step('1. เปิดหน้า /register', () => openRegister(page));
    await step('2. กด "ขอรหัส OTP เพื่อยืนยันอีเมล" โดยไม่กรอกข้อมูล', () => reg(page).submit.click());
    await step('Expected: ช่องชื่อถูกระบุว่าต้องกรอก และไม่มีข้อความ "ส่งรหัส OTP แล้ว!"', async () => {
      expect(await reg(page).firstName.evaluate((el: HTMLInputElement) => el.validity.valueMissing)).toBe(true);
      await expect(page.getByText('ส่งรหัส OTP แล้ว!')).toHaveCount(0);
    });
  });

  test('AUTH-T11 อีเมลไม่มีโดเมนระดับบนสุด (name@mail) แจ้ง "รูปแบบอีเมลไม่ถูกต้อง"', async ({ page }) => {
    await step('1. เปิดหน้า /register', () => openRegister(page));
    await step('2. กรอกข้อมูลครบ แต่ใช้อีเมล "e2e@mail" แล้วกดขอรหัส OTP', async () => {
      await fillRegister(page, { email: 'e2e@mail' });
      await reg(page).submit.click();
    });
    await step('Expected: แจ้ง "รูปแบบอีเมลไม่ถูกต้อง"', async () => {
      await expect(swal(page).title).toHaveText('รูปแบบอีเมลไม่ถูกต้อง');
    });
  });

  test('AUTH-T12 เบอร์โทรศัพท์ไม่ขึ้นต้นด้วย 0 แจ้งข้อผิดพลาดใต้ช่องเบอร์โทร', async ({ page }) => {
    await step('1. เปิดหน้า /register', () => openRegister(page));
    await step('2. กรอกเบอร์โทรศัพท์ "8123456789"', () => reg(page).tel.fill('8123456789'));
    await step('Expected: แสดงข้อความ "เบอร์โทรศัพท์ต้องขึ้นต้นด้วยเลข 0"', async () => {
      await expect(page.getByText('เบอร์โทรศัพท์ต้องขึ้นต้นด้วยเลข 0')).toBeVisible();
    });
  });

  test('AUTH-T13 เบอร์โทรศัพท์ไม่ครบ 10 หลัก แจ้งจำนวนหลักที่ขาด', async ({ page }) => {
    await step('1. เปิดหน้า /register', () => openRegister(page));
    await step('2. กรอกเบอร์โทรศัพท์ "08123"', () => reg(page).tel.fill('08123'));
    await step('Expected: แสดงข้อความ "กรุณากรอกให้ครบ 10 หลัก (5/10)"', async () => {
      await expect(page.getByText('กรุณากรอกให้ครบ 10 หลัก (5/10)')).toBeVisible();
    });
  });

  test('AUTH-T14 รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน แจ้ง "รหัสผ่านไม่ตรงกัน"', async ({ page }) => {
    await step('1. เปิดหน้า /register', () => openRegister(page));
    await step('2. กรอกข้อมูลครบ แต่ยืนยันรหัสผ่านไม่ตรงกับรหัสผ่าน แล้วกดขอรหัส OTP', async () => {
      await fillRegister(page, { password: 'E2e-Strong#2026', confirm: 'E2e-Other#2026' });
      await reg(page).submit.click();
    });
    await step('Expected: แจ้ง "รหัสผ่านไม่ตรงกัน"', async () => {
      await expect(swal(page).title).toHaveText('รหัสผ่านไม่ตรงกัน');
    });
  });

  test('AUTH-T15 รหัสผ่านไม่ผ่านเกณฑ์ความปลอดภัย แจ้งเตือนและเลือกกลับไปแก้ไขได้', async ({ page }) => {
    await step('1. เปิดหน้า /register', () => openRegister(page));
    await step('2. กรอกข้อมูลครบ ใช้รหัสผ่าน "12345678" แล้วกดขอรหัส OTP', async () => {
      await fillRegister(page, { password: '12345678' });
      await reg(page).submit.click();
    });
    await step('3. กด "แก้ไขรหัสผ่าน"', async () => {
      await expect(swal(page).title).toHaveText('รหัสผ่านไม่ปลอดภัยพอ');
      await swal(page).cancel.click();
    });
    await step('Expected: ปิดกล่องแจ้งเตือน ไม่ขอรหัส OTP และยังอยู่ฟอร์มเดิม', async () => {
      await expect(swal(page).title).toHaveCount(0);
      await expect(reg(page).submit).toBeVisible();
      await expect(reg(page).password).toHaveValue('12345678');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('3.3 การลืมรหัสผ่านและตั้งรหัสผ่านใหม่', () => {
  test.use({ storageState: GUEST_STATE });

  test('AUTH-T16 กรอกอีเมลแล้วกดส่ง แจ้ง "ส่งอีเมลสำเร็จ!"', async ({ page }) => {
    await step('1. เปิดหน้า /resetpassword', () => page.goto('/resetpassword'));
    await step(`2. กรอกอีเมล ${unknownEmail} แล้วกดส่ง`, async () => {
      await page.getByPlaceholder('example@email.com').fill(unknownEmail);
      await page.getByRole('button', { name: 'ส่งรหัสยืนยันเข้าอีเมล' }).click();
    });
    await step('Expected: แจ้ง "ส่งอีเมลสำเร็จ!" (ระบบไม่บอกว่าอีเมลมีในระบบหรือไม่ กันการเดาบัญชี)', async () => {
      await expect(swal(page).title).toHaveText('ส่งอีเมลสำเร็จ!', { timeout: 15_000 });
    });
  });

  test('AUTH-T17 ตั้งรหัสผ่านใหม่โดยกรอกสองช่องไม่ตรงกัน แจ้ง "รหัสผ่านไม่ตรงกัน"', async ({ page }) => {
    await step('1. เปิดหน้า /reset-password?token=... (ลิงก์จากอีเมล)', () => page.goto(`/reset-password?token=e2e-${RUN_ID}`));
    await step('2. กรอกรหัสผ่านใหม่และยืนยันไม่ตรงกัน แล้วกดยืนยัน', async () => {
      const inputs = page.locator('input[type="password"]');
      await inputs.nth(0).fill('E2e-Strong#2026');
      await inputs.nth(1).fill('E2e-Other#2026');
      await page.getByRole('button', { name: 'ยืนยันการเปลี่ยนรหัสผ่าน' }).click();
    });
    await step('Expected: แจ้ง "รหัสผ่านไม่ตรงกัน"', async () => {
      await expect(swal(page).title).toHaveText('รหัสผ่านไม่ตรงกัน');
    });
  });

  test('AUTH-T18 ใช้ลิงก์ตั้งรหัสผ่านที่ไม่ถูกต้องหรือหมดอายุ แจ้ง "เกิดข้อผิดพลาด"', async ({ page }) => {
    await step('1. เปิดหน้า /reset-password ด้วย token ที่ไม่มีอยู่จริง', () => page.goto(`/reset-password?token=e2e-${RUN_ID}`));
    await step('2. กรอกรหัสผ่านใหม่ให้ตรงกันทั้งสองช่อง แล้วกดยืนยัน', async () => {
      const inputs = page.locator('input[type="password"]');
      await inputs.nth(0).fill('E2e-Strong#2026');
      await inputs.nth(1).fill('E2e-Strong#2026');
      await page.getByRole('button', { name: 'ยืนยันการเปลี่ยนรหัสผ่าน' }).click();
    });
    await step('Expected: แจ้ง "เกิดข้อผิดพลาด" และรหัสผ่านไม่ถูกเปลี่ยน', async () => {
      await expect(swal(page).title).toHaveText('เกิดข้อผิดพลาด', { timeout: 15_000 });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
test.describe('3.4 การออกจากระบบ', () => {
  test.skip(!hasStudent, SKIP_NO_STUDENT);
  test.use({ storageState: STUDENT_AUTH_FILE });

  const openLogoutConfirm = async (page: Page) => {
    await page.goto('/user');
    await page.getByRole('button', { name: 'Open user menu' }).click();
    await page.getByRole('button', { name: 'ออกจากระบบ' }).click();
    await expect(swal(page).title).toHaveText('ต้องการออกจากระบบจริงหรือไม่?');
  };

  test('AUTH-T19 กดออกจากระบบแล้วกด "ตกลง" ออกจากระบบและกลับหน้าแรกของเว็บไซต์', async ({ page }) => {
    await step('1. เปิดหน้าหลักผู้เรียน กดเมนูผู้ใช้ แล้วกด "ออกจากระบบ"', () => openLogoutConfirm(page));
    await step('2. กด "ตกลง"', () => swal(page).confirm.click());
    await step('Expected: แจ้ง "ออกจากระบบเรียบร้อย" ออกจากหน้าผู้เรียน และล้างสถานะการเข้าสู่ระบบ', async () => {
      await expect(swal(page).title).toHaveText('ออกจากระบบเรียบร้อย');
      // ระบบพากลับหน้าแรก (/) ซึ่งบางครั้งส่งต่อไปหน้า /login — ถือว่าถูกต้องทั้งสองแบบ
      await page.waitForURL((u) => u.pathname === '/' || u.pathname.startsWith('/login'), { timeout: 30_000 });
      await expect.poll(() => page.evaluate(() => localStorage.getItem('access_token'))).toBeNull();
    });
  });

  test('AUTH-T20 กดออกจากระบบแล้วกด "ยกเลิก" ยังอยู่ในระบบ', async ({ page }) => {
    await step('1. เปิดหน้าหลักผู้เรียน กดเมนูผู้ใช้ แล้วกด "ออกจากระบบ"', () => openLogoutConfirm(page));
    await step('2. กด "ยกเลิก"', () => swal(page).cancel.click());
    await step('Expected: ยังอยู่หน้า /user และยังเข้าสู่ระบบอยู่', async () => {
      await expect(page).toHaveURL(/\/user/);
      expect(await page.evaluate(() => localStorage.getItem('access_token'))).toBeTruthy();
    });
  });
});
