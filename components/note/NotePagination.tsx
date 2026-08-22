'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function getCompactPaginationItems(current: number, total: number): (number | string)[] {
    if (total <= 5) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 3) {
        return [1, 2, 3, '...', total];
    }
    if (current >= total - 2) {
        return [1, '...', total - 2, total - 1, total];
    }
    return [1, '...', current, '...', total];
}

export interface NotePaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export default function NotePagination({
    currentPage,
    totalPages,
    totalItems,
    perPage,
    onPageChange,
    className = '',
}: NotePaginationProps) {
    if (totalPages <= 1 && totalItems <= perPage) return null;

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages || page === currentPage) return;
        onPageChange(page);
    };

    return (
        <div className={`flex flex-col items-center gap-2 mt-4 pt-3 border-t border-slate-100 ${className}`}>
            {/* Info Text */}
            <div className="text-[11px] font-medium text-slate-500 flex items-center justify-between w-full px-1">
                <span>หน้า <strong className="text-slate-700">{currentPage}</strong> จาก <strong className="text-slate-700">{totalPages}</strong></span>
                <span>ทั้งหมด <strong className="text-indigo-600">{totalItems}</strong> รายการ</span>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-center gap-1.5 w-full">
                {/* Prev Button */}
                <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 bg-white transition-all cursor-pointer shadow-2xs shrink-0"
                    title="หน้าก่อนหน้า"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* Page Number Buttons */}
                <div className="flex items-center gap-1">
                    {getCompactPaginationItems(currentPage, totalPages).map((p, idx) => {
                        if (typeof p === 'string') {
                            return (
                                <span key={`dots-${idx}`} className="w-5 h-7 flex items-center justify-center text-[10px] text-slate-400">
                                    ...
                                </span>
                            );
                        }

                        const isActive = p === currentPage;
                        return (
                            <button
                                type="button"
                                key={`page-${p}`}
                                onClick={() => handlePageChange(p)}
                                className={`w-7 h-7 text-xs font-medium rounded-lg transition-all cursor-pointer flex items-center justify-center ${isActive
                                    ? 'bg-indigo-600 text-white shadow-xs font-semibold scale-105'
                                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200'
                                    }`}
                            >
                                {p}
                            </button>
                        );
                    })}
                </div>

                {/* Next Button */}
                <button
                    type="button"
                    disabled={currentPage >= totalPages || totalPages === 0}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 bg-white transition-all cursor-pointer shadow-2xs shrink-0"
                    title="หน้าถัดไป"
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
}
