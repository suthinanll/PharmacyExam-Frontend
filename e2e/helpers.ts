import { expect, type Browser, type Page } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

/**
 * ตัวช่วยสำหรับการทดสอบแบบ Black Box
 * ทุกอย่างในไฟล์นี้ทำผ่านหน้าเว็บเหมือนผู้ใช้จริง ไม่เรียก API และไม่อ่านฐานข้อมูล
 */

export const BASE_URL = (process.env.E2E_BASE_URL || 'http://localhost:3000').replace(/\/+$/, '');
export const ADMIN_AUTH_FILE = path.join(__dirname, '.auth', 'admin.json');
export const STUDENT_AUTH_FILE = path.join(__dirname, '.auth', 'student.json');

/** ตั้งค่าบัญชีผู้เรียนไว้หรือไม่ — เทสต์ฝั่งผู้เรียนใช้ test.skip(!hasStudent, ...) */
export const hasStudent = !!(process.env.E2E_STUDENT_EMAIL && process.env.E2E_STUDENT_PASSWORD);
export const SKIP_NO_STUDENT = 'ไม่ได้ตั้งค่าบัญชีผู้เรียน (E2E_STUDENT_EMAIL / E2E_STUDENT_PASSWORD)';

/** สถานะเบราว์เซอร์ที่ยังไม่ได้เข้าสู่ระบบ (ผู้เยี่ยมชม) */
export const GUEST_STATE = { cookies: [], origins: [] };

// ─── ชื่อข้อมูลทดสอบ ──────────────────────────────────────────────────────────
/** ข้อมูลที่เทสต์สร้างทุกชิ้นชื่อขึ้นต้นด้วย "E2E-" ใช้ค้นหาแยกจากข้อมูลจริงและลบทิ้งตอนจบ */
export const PREFIX = 'E2E';

/** รหัสรอบทดสอบ ใส่ในชื่อข้อมูลเพื่อให้ค้นหาเจอเฉพาะข้อมูลของรอบนี้ */
export const RUN_ID = Date.now().toString(36).toUpperCase();

let seq = 0;
/** ชื่อไม่ซ้ำสำหรับข้อมูลทดสอบ เช่น "E2E-MV7S-เพิ่ม-ครบ-4" */
export function uniqueTitle(label: string): string {
  seq += 1;
  return `${PREFIX}-${RUN_ID}-${label}-${seq}`;
}

// ─── วันที่ ───────────────────────────────────────────────────────────────────
const shift = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d;
};
const toInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** วันที่สำหรับกรอกในช่อง date (YYYY-MM-DD) ห่างจากวันนี้ offset วัน */
export const inputDate = (offsetDays = 0) => toInput(shift(offsetDays));

/** วันที่แบบที่หน้าเว็บแสดง เช่น "24/10/2569" */
export const thaiDate = (offsetDays = 0) => shift(offsetDays).toLocaleDateString('th-TH');

/** วันที่ภายในเดือนนี้ (กันวันล้นไปเดือนหน้าเมื่อวันนี้อยู่ปลายเดือน) */
export function inputDateThisMonth(day: number): string {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return toInput(new Date(now.getFullYear(), now.getMonth(), Math.min(day, last)));
}

export const THAI_MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

/** หัวปฏิทิน เช่น "ตุลาคม 2569" ของเดือนที่ห่างจากเดือนนี้ offset เดือน */
export function thaiMonthHeader(offsetMonths = 0): string {
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() + offsetMonths, 1);
  return `${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
}

// ─── กล่องข้อความบนหน้าจอ ─────────────────────────────────────────────────────
/** กล่องแจ้งเตือน SweetAlert2 */
export const swal = (page: Page) => ({
  title: page.locator('.swal2-title'),
  text: page.locator('.swal2-html-container'),
  confirm: page.locator('.swal2-confirm'),
  cancel: page.locator('.swal2-cancel'),
});

/** Toast มุมขวาบนของหน้าข่าวสาร */
export const toast = (page: Page) => page.locator('div.fixed.top-4.right-4');

/** เก็บข้อความจาก alert() / confirm() ของเบราว์เซอร์ แล้วกดตกลง (accept) หรือยกเลิก */
export function onBrowserDialog(page: Page, accept = true) {
  const messages: string[] = [];
  page.on('dialog', async (d) => {
    messages.push(d.message());
    if (accept) await d.accept(); else await d.dismiss();
  });
  return messages;
}

/** ตรวจว่าโค้ดที่แฝงมาในข้อมูล (XSS) ไม่ถูกรันบนหน้าเว็บ */
export const XSS_PAYLOAD = '<img src=x onerror="window.__xss=1">';
export async function expectNoXss(page: Page) {
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
}

// ─── เปิดหน้าใหม่ในฐานะผู้ดูแลระบบ (ใช้ใน beforeAll / afterAll) ───────────────
export async function newAdminPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    storageState: ADMIN_AUTH_FILE,
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
    viewport: { width: 1440, height: 900 },
  });
  return context.newPage();
}

/** เปิดหน้าใหม่ในฐานะผู้เรียน (ใช้ใน beforeAll / afterAll) */
export async function newStudentPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    baseURL: BASE_URL,
    storageState: STUDENT_AUTH_FILE,
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
    viewport: { width: 1440, height: 900 },
  });
  return context.newPage();
}

/** เข้าสู่ระบบผ่านหน้า /login */
export async function loginViaUI(page: Page, email: string, password: string) {
  await page.addInitScript(() => localStorage.setItem('pwa-dismissed', 'true'));
  await page.goto('/login');
  await page.getByPlaceholder('example@email.com').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'เข้าสู่ระบบ', exact: true }).click();
  await expect(swal(page).title).toHaveText('เข้าสู่ระบบสำเร็จ!', { timeout: 15_000 });
  await swal(page).confirm.click();
}

// ─── ไฟล์ทดสอบ ────────────────────────────────────────────────────────────────
const publicFile = (p: string) => fs.readFileSync(path.join(__dirname, '..', 'public', p));
const JPG = publicFile('img/news1.jpg');
const PNG = publicFile('img/logoPhama.png');

/** สร้างไฟล์ PDF หน้าเดียวที่มีข้อความตามบรรทัดที่ให้มา */
function makePdf(lines: string[]): Buffer {
  const esc = (s: string) => s.replace(/[\\()]/g, (m) => `\\${m}`);
  const content = ['BT', '/F1 12 Tf', '50 800 Td', '18 TL', ...lines.map((l) => `(${esc(l)}) '`), 'ET'].join('\n');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content)} >>\nstream\n${content}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((obj, i) => {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${i + 1} 0 obj\n${obj}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

export const files = {
  jpg: { name: 'cover.jpg', mimeType: 'image/jpeg', buffer: JPG },
  png: { name: 'cover.png', mimeType: 'image/png', buffer: PNG },
  /** รูปขนาดเกิน 6MB (เกินเพดาน 5MB) */
  bigJpg: { name: 'big-6mb.jpg', mimeType: 'image/jpeg', buffer: Buffer.concat([JPG, Buffer.alloc(6 * 1024 * 1024)]) },
  txt: { name: 'not-image.txt', mimeType: 'text/plain', buffer: Buffer.from('ไฟล์ข้อความ ไม่ใช่รูปภาพหรือ PDF') },
  /** PDF ตารางกำหนดการสอบ */
  schedulePdf: {
    name: 'exam-calendar-2026.pdf',
    mimeType: 'application/pdf',
    buffer: makePdf([
      'Pharmacy Licensure Examination Calendar 2026 : Exam 6/2026 [Common Competency]',
      'No. | Activity | Start date | End date | PLE-CC1 | PLE-CC2',
      '1 | Online registration | 2 November 2026 | 13 November 2026 | X | X',
      '2 | Exam day PLE-CC1 | 20 December 2026 | 20 December 2026 | X |',
      '3 | Announcement of results | 15 January 2027 | 15 January 2027 | X | X',
    ]),
  },
  /** PDF ที่ไม่มีกำหนดการอยู่เลย */
  emptyPdf: {
    name: 'meeting-notes.pdf',
    mimeType: 'application/pdf',
    buffer: makePdf(['Meeting notes', 'This document does not contain any schedule.']),
  },
};

/** URL รูปที่ใช้ได้จริง (ไฟล์ใน public ของ frontend) และ URL รูปที่ไม่มีอยู่จริง */
export const VALID_IMAGE_URL = `${BASE_URL}/img/news1.jpg`;
export const BROKEN_IMAGE_URL = `${BASE_URL}/img/does-not-exist-${RUN_ID}.jpg`;
