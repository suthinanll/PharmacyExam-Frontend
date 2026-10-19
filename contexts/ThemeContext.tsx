'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  applyDisplaySettings,
  clearDisplaySettings,
  DEFAULT_FONT,
  DEFAULT_THEME,
  FONT_KEY,
  readFontSize,
  readTheme,
  resolveDark,
  saveSetting,
  THEME_KEY,
  type FontSize,
  type ThemePreference,
} from '@/lib/theme';

type ThemeContextValue = {
  /** ค่าที่ผู้ใช้เลือก (สว่าง / มืด / ตามระบบ) */
  theme: ThemePreference;
  /** สีที่แสดงจริงตอนนี้ (ตามระบบจะกลายเป็น light หรือ dark) */
  isDark: boolean;
  fontSize: FontSize;
  setTheme: (theme: ThemePreference) => void;
  setFontSize: (size: FontSize) => void;
  /** สลับสว่าง ↔ มืด (ใช้กับปุ่มลัดในเมนูโปรไฟล์) */
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * ครอบหน้าใต้ /user (app/user/layout.tsx) และ /admin (app/admin/layout.tsx, allowDark=false)
 * ตอนออกไปหน้าอื่นแบบ client-side คอมโพเนนต์นี้ถูกถอด จึงล้างค่าออกจาก <html>
 * หน้าแรกและหน้าเข้าสู่ระบบจึงแสดงแบบสว่างขนาดปกติเสมอ
 */
export function ThemeProvider({
  children,
  allowDark = true,
}: {
  children: React.ReactNode;
  /** false = ใช้ได้แค่ขนาดตัวอักษร ไม่มีโหมดมืด (ฝั่งแอดมิน) */
  allowDark?: boolean;
}) {
  // ค่าเริ่มต้นตรงกับฝั่งเซิร์ฟเวอร์ แล้วค่อยอ่านค่าจริงหลัง mount (กัน hydration mismatch)
  // ส่วนหน้าตาถูกตั้งไว้ก่อนแล้วโดย ThemeScript จึงไม่กะพริบ
  const [theme, setThemeState] = useState<ThemePreference>(DEFAULT_THEME);
  const [fontSize, setFontState] = useState<FontSize>(DEFAULT_FONT);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const t = readTheme();
    const f = readFontSize();
    setThemeState(t);
    setFontState(f);
    setIsDark(allowDark && resolveDark(t));
    applyDisplaySettings(t, f, allowDark);
    return () => clearDisplaySettings();
  }, [allowDark]);

  // โหมด "ตามระบบ" ต้องเปลี่ยนตามเมื่อผู้ใช้สลับธีมของเครื่องระหว่างเปิดหน้าอยู่
  useEffect(() => {
    if (!allowDark || theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      setIsDark(mq.matches);
      applyDisplaySettings('system', fontSize);
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [allowDark, theme, fontSize]);

  const setTheme = useCallback(
    (t: ThemePreference) => {
      setThemeState(t);
      setIsDark(allowDark && resolveDark(t));
      saveSetting(THEME_KEY, t);
      applyDisplaySettings(t, fontSize, allowDark);
    },
    [allowDark, fontSize],
  );

  const setFontSize = useCallback(
    (f: FontSize) => {
      setFontState(f);
      saveSetting(FONT_KEY, f);
      applyDisplaySettings(theme, f, allowDark);
    },
    [allowDark, theme],
  );

  const toggleTheme = useCallback(() => setTheme(isDark ? 'light' : 'dark'), [isDark, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, fontSize, setTheme, setFontSize, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** คืน null ถ้าอยู่นอก ThemeProvider (เช่น คอมโพเนนต์ที่ใช้ร่วมกับหน้าแอดมิน) */
export function useTheme() {
  return useContext(ThemeContext);
}
