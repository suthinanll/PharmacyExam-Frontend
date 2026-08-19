"use client";

import React from "react";
import { Layers, Clock, CheckCircle2, Send, Loader2 } from "lucide-react";

interface MSTStageHeaderProps {
  currentStage: number;
  totalStages: number;
  elapsedTime: number;
  totalQuestions: number;
  answeredCount: number;
  submittingStage: boolean;
  onSubmitStage: () => void;
}

export function MSTStageHeader({
  currentStage,
  totalStages,
  elapsedTime,
  totalQuestions,
  answeredCount,
  submittingStage,
  onSubmitStage,
}: MSTStageHeaderProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Stage badge & Exam Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 font-semibold text-sm">
              <Layers className="w-4 h-4" />
              <span>
                Stage {currentStage} / {totalStages}
              </span>
            </div>
            <span className="text-slate-400 dark:text-slate-600 hidden sm:inline">|</span>
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 hidden md:inline">
              Multi-Stage Adaptive Exam (MST)
            </span>
          </div>

          {/* Center: Timer & Progress Status */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-mono font-medium shadow-inner">
              <Clock className="w-4 h-4 text-indigo-500 animate-pulse" />
              <span>{formatTime(elapsedTime)}</span>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>
                ตอบแล้ว <strong className="text-slate-900 dark:text-white">{answeredCount}</strong> / {totalQuestions} ข้อ
              </span>
            </div>
          </div>

          {/* Right: Submit Stage Button */}
          <button
            onClick={onSubmitStage}
            disabled={submittingStage}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-sm transition active:scale-98 disabled:opacity-50 cursor-pointer"
          >
            {submittingStage ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>กำลังประมวลผล...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>ส่งคำตอบ Stage {currentStage}</span>
              </>
            )}
          </button>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-3">
          <div
            className="bg-indigo-600 dark:bg-indigo-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </header>
  );
}
