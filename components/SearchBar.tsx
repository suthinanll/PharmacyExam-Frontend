"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";
import SuggestInput from "@/components/SuggestInput";

interface SearchBarProps {
  placeholder?: string;
  /** เรียกเมื่อกด Enter / ปุ่มค้นหา หรือเลือกคำแนะนำ */
  onSearch: (query: string) => void;
  /** เรียกทุกครั้งที่พิมพ์ (สำหรับหน้าที่กรองผลทันทีระหว่างพิมพ์) */
  onQueryChange?: (query: string) => void;
  /** คำในระบบที่ใช้เดาคำค้น */
  suggestions?: (string | null | undefined)[];
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = "พิมพ์สิ่งที่คุณต้องการค้นหา",
  onSearch,
  onQueryChange,
  suggestions = [],
}) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full" role="search">
      <div className="relative w-full">
        <SuggestInput
          value={query}
          onValueChange={(v) => {
            setQuery(v);
            onQueryChange?.(v);
            // ลบคำค้นจนว่างแล้ว ให้กลับไปแสดงทั้งหมดทันที ไม่ต้องกด Enter
            if (!v.trim()) onSearch("");
          }}
          onPick={(v) => {
            setQuery(v);
            onQueryChange?.(v);
            onSearch(v);
          }}
          suggestions={suggestions}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300
                     focus:outline-none focus:ring-2 focus:ring-blue-500
                     focus:border-blue-500 shadow-sm text-sm"
        />
        <button
          type="submit"
          aria-label="ค้นหา"
          className="absolute left-1.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center
                     rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-600
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Search size={20} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
