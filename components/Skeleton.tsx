"use client";

import React from "react";
import { LoadingSpinner } from "./LoadingSpinner";

export { LoadingSpinner } from "./LoadingSpinner";

// ─────────────────────────────────────────────────────────────
// Compatibility components: renders LoadingSpinner (Loading Ring)
// แทน Skeleton ตามที่ผู้ใช้ระบุ
// ─────────────────────────────────────────────────────────────

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <LoadingSpinner size="sm" text="" className={className} />;
}

export function SkeletonText({ className = "" }: { width?: string; height?: string; className?: string }) {
  return <LoadingSpinner size="sm" text="" className={className} />;
}

export function SkeletonHeader() {
  return <LoadingSpinner size="md" text="กำลังโหลด..." />;
}

export function SkeletonStats() {
  return <LoadingSpinner size="md" text="กำลังโหลดข้อมูลสถิติ..." />;
}

export function SkeletonTable() {
  return <LoadingSpinner size="lg" text="กำลังโหลดข้อมูลตาราง..." />;
}

export function NewsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow p-8 flex items-center justify-center min-h-[260px] border border-gray-100">
      <LoadingSpinner size="md" text="กำลังโหลดข่าวสาร..." />
    </div>
  );
}

export function SkeletonCards() {
  return <LoadingSpinner size="lg" text="กำลังโหลดข้อมูล..." />;
}

export function SkeletonList() {
  return <LoadingSpinner size="lg" text="กำลังโหลดรายการ..." />;
}

export function SkeletonDetail() {
  return <LoadingSpinner size="lg" text="กำลังโหลดรายละเอียด..." />;
}

export function SkeletonModal() {
  return <LoadingSpinner size="md" text="กำลังโหลด..." />;
}

export default function PageSkeleton({
  text = "กำลังโหลดข้อมูล...",
}: {
  variant?: string;
  stats?: number;
  header?: boolean;
  title?: boolean;
  text?: string;
}) {
  return (
    <div className="min-h-[50vh] flex items-center justify-center py-12">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}

export function FullScreenSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <LoadingSpinner size="xl" text="กำลังตรวจสอบสิทธิ์การเข้าใช้งาน..." />
    </div>
  );
}
