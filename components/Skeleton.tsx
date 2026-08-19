export { LoadingSpinner } from "./LoadingSpinner";

// ─────────────────────────────────────────────────────────────
// Shared Skeleton Components
// ใช้แทน loading ring ให้เหมือนกันทุกหน้า (skeleton section แทน spinner)
// ─────────────────────────────────────────────────────────────

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-gray-200/80 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonText({
  width = "w-full",
  height = "h-3.5",
  className = "",
}: {
  width?: string;
  height?: string;
  className?: string;
}) {
  return <SkeletonBlock className={`${width} ${height} ${className}`} />;
}

// ─── Header (icon + title + subtitle) ───
export function SkeletonHeader({
  subtitle = true,
  action = false,
}: {
  subtitle?: boolean;
  action?: boolean;
}) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
      <div className="flex items-center gap-3">
        <SkeletonBlock className="w-11 h-11 rounded-xl shrink-0" />
        <div className="space-y-2">
          <SkeletonText width="w-40 sm:w-56" height="h-5" />
          {subtitle && <SkeletonText width="w-52 sm:w-72" height="h-3" />}
        </div>
      </div>
      {action && (
        <SkeletonBlock className="w-36 h-10 rounded-xl" />
      )}
    </div>
  );
}

// ─── Stats cards row ───
export function SkeletonStats({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4"
        >
          <SkeletonBlock className="w-10 h-10 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonText width="w-12" height="h-4" />
            <SkeletonText width="w-20" height="h-2.5" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Table rows skeleton ───
export function SkeletonTable({
  rows = 6,
  cols = 4,
  header = true,
}: {
  rows?: number;
  cols?: number;
  header?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
      {header && (
        <div className="bg-gray-100 px-5 py-3.5 grid gap-6 border-b border-gray-200" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonText key={i} width="w-16" height="h-3" />
          ))}
        </div>
      )}
      <div className="divide-y divide-gray-100">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="px-5 py-4 grid gap-6 items-center" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonText
                key={c}
                width={c === 0 ? "w-3/4" : "w-1/2"}
                height="h-3.5"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── News Card Skeleton (Matches NewsCard layout) ───
export function NewsCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100 flex flex-col h-full animate-pulse">
      {/* Cover Image */}
      <div className="w-full h-48 bg-gray-200" />
      {/* Content */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Title Skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-5 bg-gray-200 rounded-md w-11/12" />
          <div className="h-5 bg-gray-200 rounded-md w-2/3" />
        </div>
        {/* Description Skeleton */}
        <div className="space-y-2 mb-6 flex-1">
          <div className="h-3.5 bg-gray-200/80 rounded-md w-full" />
          <div className="h-3.5 bg-gray-200/80 rounded-md w-full" />
          <div className="h-3.5 bg-gray-200/80 rounded-md w-3/4" />
        </div>
        {/* Action Buttons Skeleton */}
        <div className="flex flex-row items-center gap-3 mt-auto">
          <div className="flex-1 h-10 bg-gray-200 rounded-xl" />
          <div className="w-10 h-10 bg-gray-200 rounded-xl shrink-0" />
        </div>
      </div>
    </div>
  );
}

// ─── Card grid skeleton ───
export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <NewsCardSkeleton key={i} />
      ))}
    </div>
  );
}

// ─── List rows skeleton ───
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
          <SkeletonBlock className="w-11 h-11 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonText width="w-2/3" height="h-4" />
            <SkeletonText width="w-1/3" height="h-2.5" />
          </div>
          <SkeletonBlock className="w-20 h-9 rounded-lg shrink-0" />
        </div>
      ))}
    </div>
  );
}

// ─── Detail / article page skeleton ───
export function SkeletonDetail() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <SkeletonBlock className="w-full h-8 rounded-lg" />
      <SkeletonText width="w-40" height="h-3" />
      <SkeletonBlock className="w-full h-64 rounded-2xl" />
      <div className="space-y-3">
        <SkeletonText width="w-full" height="h-3.5" />
        <SkeletonText width="w-11/12" height="h-3.5" />
        <SkeletonText width="w-full" height="h-3.5" />
        <SkeletonText width="w-4/5" height="h-3.5" />
        <SkeletonText width="w-full" height="h-3.5" />
        <SkeletonText width="w-2/3" height="h-3.5" />
      </div>
    </div>
  );
}

// ─── Modal content skeleton ───
export function SkeletonModal({ lines = 5 }: { lines?: number }) {
  return (
    <div className="space-y-4 py-2">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="space-y-2">
          <SkeletonText width="w-24" height="h-3" />
          <SkeletonBlock className="w-full h-10 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

// ─── Full-page skeleton (default page load) ───
export default function PageSkeleton({
  variant = "list",
  stats = 0,
  header = true,
  title = false,
}: {
  variant?: "list" | "table" | "cards" | "detail" | "plain";
  stats?: number;
  header?: boolean;
  title?: boolean;
}) {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {header && <SkeletonHeader subtitle={!title} action />}
        {stats > 0 && <SkeletonStats count={stats} />}

        {variant === "table" && <SkeletonTable rows={6} cols={5} />}
        {variant === "cards" && <SkeletonCards count={6} />}
        {variant === "detail" && <SkeletonDetail />}
        {variant === "plain" && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonText key={i} width={i === 0 ? "w-1/2" : "w-full"} height="h-4" />
            ))}
          </div>
        )}
        {variant === "list" && <SkeletonList rows={5} />}
      </div>
    </div>
  );
}

// ─── Full-screen auth layout skeleton ───
export function FullScreenSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-2xl mx-auto px-6 space-y-5">
        <div className="flex flex-col items-center space-y-4 mb-8">
          <SkeletonBlock className="w-14 h-14 rounded-2xl" />
          <SkeletonText width="w-40" height="h-4" />
        </div>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <SkeletonText width="w-2/3" height="h-4" />
            <SkeletonText width="w-full" height="h-3" />
            <SkeletonText width="w-4/5" height="h-3" />
          </div>
        ))}
      </div>
    </div>
  );
}
