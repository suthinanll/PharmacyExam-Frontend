"use client";

import React from "react";
import Image from "next/image";
import { Bookmark, Sparkles } from "lucide-react";
import { MSTItem } from "./types";

interface MSTQuestionCardProps {
  item: MSTItem;
  questionNumber: number;
  selectedOptionId?: number;
  isFlagged: boolean;
  onSelectOption: (optionId: number) => void;
  onToggleFlag: () => void;
  onPreviewImage: (url: string) => void;
}

export function MSTQuestionCard({
  item,
  questionNumber,
  selectedOptionId,
  isFlagged,
  onSelectOption,
  onToggleFlag,
  onPreviewImage,
}: MSTQuestionCardProps) {
  const choiceLabels = ["ก", "ข", "ค", "ง", "จ", "ฉ"];

  return (
    <div className="space-y-6">
      {/* Situation Card (if question belongs to a scenario) */}
      {item.situation && (
        <div className="bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-5 shadow-xs transition-colors">
          <div className="flex items-center gap-2 mb-3 text-amber-800 dark:text-amber-300 font-semibold text-sm">
            <span className="px-2 py-0.5 rounded-md bg-amber-200/60 dark:bg-amber-800/40 text-xs">
              สถานการณ์ / โจทย์จำลอง
            </span>
            {item.situation.situation_title && <span>{item.situation.situation_title}</span>}
          </div>
          <p className="text-slate-800 dark:text-slate-200 text-sm sm:text-base leading-relaxed whitespace-pre-line">
            {item.situation.situation_text}
          </p>
          {item.situation.situation_image_url && (
            <div className="mt-4 overflow-hidden rounded-xl border border-amber-200/60 max-w-md">
              <img
                src={item.situation.situation_image_url}
                alt="สถานการณ์"
                className="w-full h-auto object-cover cursor-zoom-in hover:scale-102 transition duration-200"
                onClick={() => onPreviewImage(item.situation!.situation_image_url!)}
              />
            </div>
          )}
        </div>
      )}

      {/* Question Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xs transition-colors">
        {/* Header: Question Index, Tags, Flag Button */}
        <div className="flex items-start justify-between gap-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold text-sm border border-indigo-200 dark:border-indigo-800/50">
              {questionNumber}
            </span>
            {item.sub_topics && item.sub_topics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {item.sub_topics.map((st) => (
                  <span
                    key={st.sub_topic_id}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium"
                  >
                    <Sparkles className="w-3 h-3 text-indigo-400" />
                    {st.sub_topic_name}
                  </span>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onToggleFlag}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition cursor-pointer ${
              isFlagged
                ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800"
                : "bg-slate-50 dark:bg-slate-800/50 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border-slate-200 dark:border-slate-700"
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${isFlagged ? "fill-amber-500 text-amber-500" : ""}`} />
            <span>{isFlagged ? "ทำเครื่องหมายแล้ว" : "ทำเครื่องหมายทบทวน"}</span>
          </button>
        </div>

        {/* Question Text */}
        <h2 className="text-base sm:text-lg font-medium text-slate-900 dark:text-white leading-relaxed mb-6 whitespace-pre-line">
          {item.question_text}
        </h2>

        {/* Question Image */}
        {item.question_image_url && (
          <div className="mb-6 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 max-w-lg">
            <img
              src={item.question_image_url}
              alt="รูปภาพประกอบคำถาม"
              className="w-full h-auto object-cover cursor-zoom-in hover:scale-102 transition duration-200"
              onClick={() => onPreviewImage(item.question_image_url!)}
            />
          </div>
        )}

        {/* Answer Options */}
        <div className="space-y-3">
          {item.answer_options.map((option, idx) => {
            const isSelected = selectedOptionId === option.option_id;
            const label = choiceLabels[idx] || `${idx + 1}`;

            return (
              <label
                key={option.option_id}
                onClick={() => onSelectOption(option.option_id)}
                className={`flex items-start gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none ${
                  isSelected
                    ? "bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-500 dark:border-indigo-500 shadow-xs ring-1 ring-indigo-500"
                    : "bg-slate-50/50 dark:bg-slate-800/30 border-slate-200 dark:border-slate-800 hover:bg-slate-100/60 dark:hover:bg-slate-800/60"
                }`}
              >
                <div
                  className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition-colors ${
                    isSelected
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
                >
                  {label}
                </div>

                <div className="flex-1 text-sm sm:text-base text-slate-800 dark:text-slate-200 pt-0.5 leading-relaxed">
                  <span>{option.option_text}</span>
                  {option.option_image_url && (
                    <div className="mt-2 max-w-xs rounded-lg overflow-hidden border border-slate-200">
                      <img
                        src={option.option_image_url}
                        alt={`ตัวเลือก ${label}`}
                        className="w-full h-auto object-cover cursor-zoom-in"
                        onClick={(e) => {
                          e.stopPropagation();
                          onPreviewImage(option.option_image_url!);
                        }}
                      />
                    </div>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
