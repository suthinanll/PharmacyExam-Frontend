'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import type { FontSize, ThemePreference } from '@/lib/theme';

const THEME_OPTIONS: { value: ThemePreference; label: string; hint: string; icon: React.ElementType }[] = [
  { value: 'light', label: 'สว่าง', hint: 'พื้นขาว ตัวหนังสือเข้ม', icon: Sun },
  { value: 'dark', label: 'มืด', hint: 'พื้นเข้ม ถนอมสายตาตอนกลางคืน', icon: Moon },
  { value: 'system', label: 'ตามระบบ', hint: 'เปลี่ยนตามการตั้งค่าของเครื่อง', icon: Monitor },
];

const FONT_OPTIONS: { value: FontSize; label: string }[] = [
  { value: 'sm', label: 'เล็ก' },
  { value: 'md', label: 'กลาง' },
  { value: 'lg', label: 'ใหญ่' },
];

/** ขนาดตัว ก ในปุ่มเลือกขนาด (ขยายความต่างให้เห็นชัดกว่าขนาดจริง 14/16/18px) */
const PREVIEW_GLYPH_PX: Record<FontSize, number> = { sm: 16, md: 22, lg: 28 };

const optionClass = (selected: boolean) =>
  `flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-colors cursor-pointer ${
    selected ? 'border-primary bg-primary-soft' : 'border-gray-200 bg-white hover:border-gray-300'
  }`;

/**
 * แท็บ "การแสดงผล" ในหน้าโปรไฟล์ผู้ใช้และหน้าตั้งค่าแอดมิน
 * ต้องอยู่ใต้ ThemeProvider (app/user/layout.tsx หรือ app/admin/layout.tsx)
 */
export default function DisplaySettingsPanel({
  showTheme = true,
  scopeLabel,
}: {
  /** false = ซ่อนตัวเลือกธีม (ฝั่งแอดมินไม่มีโหมดมืด) */
  showTheme?: boolean;
  /** ข้อความบอกขอบเขต เช่น "ทั้งเว็บฝั่งผู้ใช้" */
  scopeLabel: string;
}) {
  const theme = useTheme();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-medium text-gray-900">การแสดงผล</h2>
        <p className="text-sm text-gray-500">ตั้งค่าเก็บไว้ในเบราว์เซอร์นี้ และมีผลทันที</p>
      </div>

      {showTheme && (
        <fieldset>
          <legend className="text-sm font-medium text-gray-800 mb-3">ธีม</legend>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {THEME_OPTIONS.map(({ value, label, hint, icon: Icon }) => {
              const selected = theme?.theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => theme?.setTheme(value)}
                  className={optionClass(selected)}
                >
                  <Icon className={`w-5 h-5 shrink-0 ${selected ? 'text-primary' : 'text-gray-500'}`} />
                  <span>
                    <span className="block text-sm font-medium text-gray-900">{label}</span>
                    <span className="block text-xs text-gray-500">{hint}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <fieldset>
        <legend className="text-sm font-medium text-gray-800 mb-3">ขนาดตัวอักษร</legend>
        <div className="grid grid-cols-3 gap-3">
          {FONT_OPTIONS.map(({ value, label }) => {
            const selected = theme?.fontSize === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={selected}
                onClick={() => theme?.setFontSize(value)}
                className={`${optionClass(selected)} flex-col justify-center gap-1`}
              >
                {/* ตัว "ก" ขนาดคงที่ (px) ให้เห็นความต่างของแต่ละระดับโดยไม่ขึ้นกับขนาดที่เลือกอยู่ */}
                <span
                  aria-hidden="true"
                  className="font-medium text-gray-900 leading-none"
                  style={{ fontSize: PREVIEW_GLYPH_PX[value] }}
                >
                  ก
                </span>
                <span className="text-sm text-gray-600">{label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
          <p className="text-xs text-gray-500 mb-1">ตัวอย่าง</p>
          <p className="text-base text-gray-800">ยาในกลุ่ม NSAIDs ออกฤทธิ์ยับยั้งเอนไซม์ COX จึงลดการสร้างพรอสตาแกลนดิน</p>
          <p className="text-sm text-gray-600 mt-1">ข้อความ{scopeLabel}จะมีขนาดประมาณนี้</p>
        </div>
      </fieldset>
    </div>
  );
}
