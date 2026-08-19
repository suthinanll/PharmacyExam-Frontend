"use client";

import React from "react";
import { Bookmark, CheckCircle2, Circle } from "lucide-react";
import { MSTItem } from "./types";

interface MSTQuestionDrawerProps {
  items: MSTItem[];
  currentIndex: number;
  stageAnswers: Record<number, number>;
  flaggedItems: Record<number, boolean>;
  onSelectIndex: (index: number) => void;
}

export function MSTQuestionDrawer({
  items,
  currentIndex,
  stageAnswers,
  flaggedItems,
  onSelectIndex,
}: MSTQuestionDrawerProps) {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">
        รายการข้อสอบในด่านนี้ ({items.length} ข้อ)
      </h3>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-indigo-600 border border-indigo-700" />
          <span>ตอบแล้ว</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700" />
          <span>ยังไม่ตอบ</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3.5 h-3.5 rounded-md bg-amber-100 dark:bg-amber-950 border border-amber-400 text-amber-600 flex items-center justify-center text-[9px] font-bold">
            ★
          </span>
          <span>ทบทวน</span>
        </div>
      </div>

      {/* Grid of question buttons */}
      <div className="grid grid-cols-5 sm:grid-cols-6 lg:grid-cols-4 gap-2">
        {items.map((item, index) => {
          const isAnswered = stageAnswers[item.item_id] !== undefined;
          const isFlagged = Boolean(flaggedItems[item.item_id]);
          const isCurrent = index === currentIndex;

          let btnClass = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-200 dark:border-slate-700";

          if (isAnswered) {
            btnClass = "bg-indigo-600 text-white border-indigo-700 shadow-xs";
          }

          if (isCurrent) {
            btnClass += " ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 font-bold scale-105";
          }

          return (
            <button
              key={item.item_id}
              onClick={() => onSelectIndex(index)}
              className={`relative h-10 rounded-xl flex items-center justify-center text-sm font-medium border transition duration-150 cursor-pointer ${btnClass}`}
            >
              <span>{index + 1}</span>
              {isFlagged && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-400 border border-white dark:border-slate-900" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
