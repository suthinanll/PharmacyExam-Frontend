"use client";

import React, { useState } from "react";
import { Search } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  onSearch: (query: string) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ placeholder = "พิมพ์สิ่งที่คุณต้องการค้นหา", onSearch }) => {
  const [query, setQuery] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="relative w-full">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-300 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 
                     focus:border-blue-500 shadow-sm text-sm"
        />
        <button
          type="submit"
          aria-label="ค้นหา"
          className="absolute left-1.5 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center
                     rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600
                     focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Search size={20} aria-hidden="true" />
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
