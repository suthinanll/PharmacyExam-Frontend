'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function getPaginationItems(current: number, total: number): (number | string)[] {
    if (total <= 7) {
        return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 4) {
        return [1, 2, 3, 4, 5, '...', total];
    }
    if (current >= total - 3) {
        return [1, '...', total - 4, total - 3, total - 2, total - 1, total];
    }
    return [1, '...', current - 1, current, current + 1, '...', total];
}

export interface PaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    perPage: number;
    onPageChange: (page: number) => void;
    itemLabel?: string;
    scrollToTop?: boolean;
    activeColor?: string;
    className?: string;
    /** ใช้ตอนวางในพื้นที่แคบ (เช่น sidebar) — เรียงแนวตั้งเสมอ ไม่สลับเป็นแนวนอนตาม viewport breakpoint */
    compact?: boolean;
}

export default function Pagination({
    currentPage,
    totalPages,
    totalItems,
    perPage,
    onPageChange,
    itemLabel = 'รายการ',
    scrollToTop = true,
    activeColor = 'bg-green-600 text-white shadow-xs',
    className = '',
    compact = false,
}: PaginationProps) {
    if (totalPages <= 1 && totalItems <= perPage) return null;

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages || page === currentPage) return;
        onPageChange(page);
        if (scrollToTop) {
            const main = document.getElementById('admin-main-content') || document.querySelector('main');
            if (main) {
                main.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        }
    };

    const startIndex = (currentPage - 1) * perPage + 1;
    const endIndex = Math.min(currentPage * perPage, totalItems);

    return (
        <div className={`flex flex-col ${compact ? '' : 'sm:flex-row'} justify-between items-center gap-4 mt-6 pt-4 border-t border-gray-100 ${className}`}>
            <div className={`text-xs text-gray-500 ${compact ? 'text-center' : ''}`}>
                แสดง <span className="font-semibold text-gray-800">{totalItems > 0 ? startIndex : 0}</span> -{' '}
                <span className="font-semibold text-gray-800">{endIndex}</span> จากทั้งหมด{' '}
                <span className="font-semibold text-gray-800">{totalItems}</span> {itemLabel} (หน้า {currentPage}/{totalPages})
            </div>

            <div className={`flex items-center gap-1.5 ${compact ? 'flex-wrap justify-center' : ''}`}>
                <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                    className="px-2.5 h-8 flex items-center justify-center gap-1 border border-gray-200 rounded-lg text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 bg-white text-xs font-medium transition cursor-pointer"
                >
                    <ChevronLeft size={14} />
                    <span className="hidden sm:inline">ก่อนหน้า</span>
                </button>

                {getPaginationItems(currentPage, totalPages).map((p, idx) => {
                    if (typeof p === 'string') {
                        return (
                            <span key={`dots-${idx}`} className="w-8 h-8 flex items-center justify-center text-xs text-gray-400">
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
                            className={`w-8 h-8 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${isActive
                                ? activeColor
                                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50 hover:text-gray-900'
                                }`}
                        >
                            {p}
                        </button>
                    );
                })}

                <button
                    type="button"
                    disabled={currentPage >= totalPages || totalPages === 0}
                    onClick={() => handlePageChange(currentPage + 1)}
                    className="px-2.5 h-8 flex items-center justify-center gap-1 border border-gray-200 rounded-lg text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 bg-white text-xs font-medium transition cursor-pointer"
                >
                    <span className="hidden sm:inline">ถัดไป</span>
                    <ChevronRight size={14} />
                </button>
            </div>
        </div>
    );
}
