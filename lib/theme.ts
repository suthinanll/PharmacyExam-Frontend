/**
 * การตั้งค่าการแสดงผล (ธีมสว่าง/มืด และขนาดตัวอักษร)
 *
 * เก็บไว้ใน localStorage ของเบราว์เซอร์เท่านั้น ไม่ส่งไป backend
 * - หน้าใต้ /user ได้ทั้งธีมมืดและขนาดตัวอักษร
 * - หน้าใต้ /admin ได้แค่ขนาดตัวอักษร (แอดมินไม่มีโหมดมืด)
 * - หน้าสำหรับบุคคลทั่วไปแสดงแบบเดิมเสมอ
 *
 * สคริปต์ใน <head> (components/ThemeScript.tsx) ใช้ตรรกะเดียวกับ applyDisplaySettings
 * เพื่อตั้งค่าก่อนหน้าแรกถูกวาด ถ้าแก้ที่นี่ต้องแก้ที่นั่นด้วย
 */

export type ThemePreference = 'light' | 'dark' | 'system';
export type FontSize = 'sm' | 'md' | 'lg';

export const THEME_KEY = 'pe-theme';
export const FONT_KEY = 'pe-font-size';

export const DEFAULT_THEME: ThemePreference = 'light';
export const DEFAULT_FONT: FontSize = 'md';

const isTheme = (v: unknown): v is ThemePreference => v === 'light' || v === 'dark' || v === 'system';
const isFont = (v: unknown): v is FontSize => v === 'sm' || v === 'md' || v === 'lg';

function read(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function readTheme(): ThemePreference {
  const v = read(THEME_KEY);
  return isTheme(v) ? v : DEFAULT_THEME;
}

export function readFontSize(): FontSize {
  const v = read(FONT_KEY);
  return isFont(v) ? v : DEFAULT_FONT;
}

export function saveSetting(key: typeof THEME_KEY | typeof FONT_KEY, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // โหมดส่วนตัวบางเบราว์เซอร์เขียน localStorage ไม่ได้ — ใช้ค่าได้แค่ในหน้านี้
  }
}

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveDark(theme: ThemePreference): boolean {
  return theme === 'dark' || (theme === 'system' && systemPrefersDark());
}

/** ใส่ class/attribute ที่ <html> ตามค่าที่เลือก */
export function applyDisplaySettings(theme: ThemePreference, font: FontSize, allowDark = true) {
  const root = document.documentElement;
  root.classList.toggle('dark', allowDark && resolveDark(theme));
  root.dataset.fontSize = font;
}

/** ล้างค่าทั้งหมดออก (ตอนออกจากหน้า /user หรือ /admin ไปหน้าอื่น) */
export function clearDisplaySettings() {
  const root = document.documentElement;
  root.classList.remove('dark');
  delete root.dataset.fontSize;
}
