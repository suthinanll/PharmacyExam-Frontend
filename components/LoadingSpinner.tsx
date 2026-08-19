"use client";

import React from "react";

export interface LoadingSpinnerProps {
  text?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({
  text = "กำลังโหลดข้อมูล...",
  size = "md",
  className = "",
  fullPage = false,
}: LoadingSpinnerProps) {
  const sizeMap = {
    sm: "w-6 h-6 border-2",
    md: "w-10 h-10 border-3",
    lg: "w-14 h-14 border-4",
    xl: "w-20 h-20 border-4",
  };

  const content = (
    <div className={`flex flex-col items-center justify-center py-12 px-4 gap-3 text-center ${className}`}>
      <div className="relative flex items-center justify-center">
        <div
          className={`${sizeMap[size]} rounded-full border-blue-100 border-t-blue-600 animate-spin shadow-sm`}
        />
      </div>
      {text && (
        <p className="text-sm font-semibold text-gray-500 tracking-wide animate-pulse">
          {text}
        </p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

export default LoadingSpinner;
