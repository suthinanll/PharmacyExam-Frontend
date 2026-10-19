"use client";

import { useEffect, useId, useMemo, useRef, useState, type InputHTMLAttributes, type KeyboardEvent } from "react";
import { Search } from "lucide-react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & {
  value: string;
  onValueChange: (value: string) => void;
  /** คำที่มีอยู่ในระบบ (เช่น ชื่อชุดข้อสอบ หัวข้อข่าว) ใช้เดาคำค้นที่ผู้ใช้กำลังพิมพ์ */
  suggestions: (string | null | undefined)[];
  /** เรียกเมื่อเลือกคำแนะนำ (ค่าเริ่มต้นคือใส่คำนั้นลงช่องค้นหา) */
  onPick?: (value: string) => void;
  maxSuggestions?: number;
};

/** ตัดช่องว่างซ้ำและตัวพิมพ์ใหญ่เล็ก ให้เทียบคำได้ตรงกัน */
const normalize = (s: string) => s.toLocaleLowerCase("th").replace(/\s+/g, " ").trim();

/** จัดอันดับคำแนะนำ: ขึ้นต้นด้วยคำค้น > มีคำค้นอยู่ต้นคำ > มีคำค้นอยู่ตรงไหนก็ได้ */
function rankSuggestions(pool: Props["suggestions"], query: string, max: number) {
  const q = normalize(query);
  if (!q) return [];
  const seen = new Set<string>();
  const ranked: { text: string; score: number; index: number }[] = [];
  for (const raw of pool) {
    if (!raw) continue;
    const text = raw.replace(/\s+/g, " ").trim();
    const key = normalize(text);
    if (!key || seen.has(key) || key === q) continue;
    seen.add(key);
    const index = key.indexOf(q);
    if (index < 0) continue;
    const score = index === 0 ? 0 : /[\s\-_/(.,:]/.test(key[index - 1]) ? 1 : 2;
    ranked.push({ text, score, index });
  }
  ranked.sort((a, b) => a.score - b.score || a.text.length - b.text.length || a.text.localeCompare(b.text, "th"));
  return ranked.slice(0, max);
}

/**
 * ช่องค้นหาที่เดาคำค้นจากข้อมูลในระบบ แบบเดียวกับช่องค้นหาของ Google
 *
 * ใช้แทน <input> เดิมได้ตรง ๆ (ส่ง className/placeholder/aria-label เหมือนเดิม) ไอคอนแว่นขยายของหน้าเดิมยังอยู่ที่เดิม
 * กล่องคำแนะนำวางแบบ absolute ใต้ช่อง จึงต้องมีกล่องครอบที่เป็น relative (ทุกหน้าเดิมมีอยู่แล้ว)
 *
 * คีย์บอร์ด: ↑/↓ เลื่อน, Enter เลือก, Esc ปิด
 */
export default function SuggestInput({
  value,
  onValueChange,
  suggestions,
  onPick,
  maxSuggestions = 8,
  onKeyDown,
  onFocus,
  onBlur,
  ...inputProps
}: Props) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const listId = useId();
  const listRef = useRef<HTMLUListElement>(null);

  const items = useMemo(() => rankSuggestions(suggestions, value, maxSuggestions), [suggestions, value, maxSuggestions]);
  const showList = open && items.length > 0;

  useEffect(() => setActive(-1), [value]);

  // เลื่อนรายการให้เห็นข้อที่เลือกด้วยคีย์บอร์ด
  useEffect(() => {
    if (active < 0) return;
    listRef.current?.children[active]?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const pick = (text: string) => {
    if (onPick) onPick(text);
    else onValueChange(text);
    setOpen(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showList) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((i) => (i + 1) % items.length);
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((i) => (i <= 0 ? items.length - 1 : i - 1));
        return;
      }
      if (e.key === "Enter" && active >= 0) {
        e.preventDefault();
        pick(items[active].text);
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
    }
    if (e.key === "Enter") setOpen(false);
    onKeyDown?.(e);
  };

  return (
    <>
      <input
        {...inputProps}
        type={inputProps.type ?? "text"}
        value={value}
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showList}
        aria-controls={showList ? listId : undefined}
        aria-activedescendant={showList && active >= 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          onValueChange(e.target.value);
          setOpen(true);
        }}
        onFocus={(e) => {
          setOpen(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setOpen(false);
          onBlur?.(e);
        }}
        onKeyDown={handleKeyDown}
      />

      {showList && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label="คำค้นหาที่แนะนำ"
          className="absolute left-0 right-0 top-full z-40 mt-1.5 min-w-64 max-h-80 overflow-y-auto rounded-xl border border-gray-200 bg-white py-1.5 text-left shadow-lg"
        >
          {items.map((item, i) => {
            const end = item.index + normalize(value).length;
            return (
              <li
                key={item.text}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown + preventDefault ไม่ให้ช่องค้นหาเสียโฟกัสก่อนเลือกเสร็จ
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(item.text);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-3 px-4 py-2 text-sm ${i === active ? "bg-gray-100" : ""}`}
              >
                <Search className="h-4 w-4 shrink-0 text-gray-500" aria-hidden="true" />
                <span className="truncate text-gray-600">
                  {item.text.slice(0, item.index)}
                  <span className="text-gray-600">{item.text.slice(item.index, end)}</span>
                  <span className="font-medium text-gray-900">{item.text.slice(end)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
