"use client";

import React from "react";
import { ArrowRight, Layers, CheckCircle, ShieldCheck } from "lucide-react";

interface MSTRoutingPathVisualizerProps {
  routingPath: string[];
  totalStages: number;
}

export function MSTRoutingPathVisualizer({
  routingPath,
  totalStages,
}: MSTRoutingPathVisualizerProps) {
  if (!routingPath || routingPath.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
      <div className="flex items-center gap-2 mb-4">
        <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        <h3 className="font-semibold text-slate-900 dark:text-white text-base">
          เส้นทางการปรับระดับข้อสอบ (Adaptive Routing Pathway)
        </h3>
      </div>

      <div className="flex flex-wrap items-center gap-3 py-2">
        {routingPath.map((step, index) => {
          const isLast = index === routingPath.length - 1;
          const isHard = step.toLowerCase().includes("hard") || step.includes("ยาก");
          const isMedium = step.toLowerCase().includes("medium") || step.includes("ปานกลาง");
          const isEasy = step.toLowerCase().includes("easy") || step.includes("ง่าย");

          let badgeColor = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
          if (isHard) {
            badgeColor = "bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800";
          } else if (isMedium) {
            badgeColor = "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800";
          } else if (isEasy) {
            badgeColor = "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800";
          }

          return (
            <React.Fragment key={index}>
              <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border font-medium text-sm shadow-2xs ${badgeColor}`}>
                <span className="w-5 h-5 rounded-full bg-white/80 dark:bg-slate-800/80 flex items-center justify-center text-xs font-bold shrink-0">
                  {index + 1}
                </span>
                <span>{step}</span>
              </div>

              {!isLast && (
                <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-600 shrink-0" />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
