"use client";

import { useState } from "react";
import LazyRecharts from "@/components/charts/LazyRecharts";
import {
  Award,
  CalendarCheck,
  Flame,
  Lock,
  Minus,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
} from "lucide-react";

// ── Types (ตรงกับ progress ที่ /user/dashboard ส่งมา) ──────────────────────

export type ProgressTimelineItem = {
  session_id: number;
  attempt: number;
  date: string;
  exam_name: string;
  score: number;
  accuracy: number | null;
  score_delta: number | null;
  duration_minutes: number | null;
};

/** ผลสอบ CAT รายครั้ง — ใช้ค่าความสามารถ (θ) แทนคะแนนเต็ม 100 */
export type ProgressCatTimelineItem = {
  session_id: number;
  attempt: number;
  date: string;
  theta: number;
  se: number | null;
  cut_score: number;
  passed: boolean | null;
  num_items: number;
  accuracy: number | null;
};

export type UserProgress = {
  timeline: ProgressTimelineItem[];
  /** backend รุ่นเก่าอาจยังไม่ส่งมา */
  cat_timeline?: ProgressCatTimelineItem[];
  improvement: {
    first_score: number | null;
    last_score: number | null;
    best_score: number | null;
    score_delta: number | null;
    total_gain: number | null;
    accuracy: number | null;
    accuracy_delta: number | null;
    duration_delta: number | null;
  };
  radar_compare: { subject: string; first: number; latest: number }[];
  level: {
    code: string;
    name: string;
    next_code: string | null;
    next_name: string | null;
    progress_pct: number;
    score: number;
    points_to_next: number | null;
  };
  streak: {
    current_days: number;
    longest_days: number;
    last_active: string | null;
    active_days_last_week: number;
  };
  achievements: {
    code: string;
    title: string;
    description: string;
    unlocked: boolean;
    unlocked_at: string | null;
    progress_pct: number;
  }[];
};

const LEVEL_STYLES: Record<string, { ring: string; text: string; bar: string }> = {
  bronze: { ring: "bg-amber-100", text: "text-amber-700", bar: "bg-amber-500" },
  silver: { ring: "bg-slate-100", text: "text-slate-700", bar: "bg-slate-400" },
  gold: { ring: "bg-yellow-100", text: "text-yellow-700", bar: "bg-yellow-500" },
  platinum: { ring: "bg-blue-100", text: "text-blue-700", bar: "bg-blue-500" },
};

const formatThaiDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("th-TH", { day: "numeric", month: "short", year: "numeric" })
    : "—";

// ── การ์ดตัวเลขการเปลี่ยนแปลง ────────────────────────────────────────────

const DeltaCard = ({
  label,
  value,
  unit,
  delta,
  /** true เมื่อค่าที่ลดลงถือว่าดี เช่น เวลาที่ใช้ทำข้อสอบ */
  lowerIsBetter = false,
}: {
  label: string;
  value: string;
  unit: string;
  delta: number | null;
  lowerIsBetter?: boolean;
}) => {
  const improved = delta === null ? null : lowerIsBetter ? delta < 0 : delta > 0;
  const tone =
    improved === null || delta === 0
      ? "text-gray-500 bg-gray-50"
      : improved
        ? "text-green-700 bg-green-50"
        : "text-amber-700 bg-amber-50";
  const Icon = improved === null || delta === 0 ? Minus : improved ? TrendingUp : TrendingDown;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-medium tabular-nums text-gray-900">
        {value}
        <span className="ml-1 text-xs font-normal text-gray-600">{unit}</span>
      </p>
      <span className={`mt-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tone}`}>
        <Icon className="h-3 w-3" />
        {delta === null
          ? "ยังไม่มีข้อมูลเทียบ"
          : `${delta > 0 ? "+" : ""}${delta} จากครั้งก่อน`}
      </span>
    </div>
  );
};

const EmptyTrend = ({ text }: { text: string }) => (
  <div className="flex h-64 flex-col items-center justify-center rounded-xl bg-gray-50 text-center">
    <Target className="mb-2 h-8 w-8 text-gray-300" />
    <p className="max-w-xs text-sm text-gray-500">{text}</p>
  </div>
);

// ── ส่วนหลัก ─────────────────────────────────────────────────────────────

export const ProgressSection = ({ progress }: { progress: UserProgress }) => {
  const { timeline, improvement, radar_compare, level, streak, achievements } = progress;
  const catTimeline = progress.cat_timeline ?? [];
  // ยังไม่เคยทำข้อสอบปกติแต่เคยทำ CAT ให้เปิดกราฟ CAT ก่อน
  const [trendMode, setTrendMode] = useState<"normal" | "cat">(
    timeline.length === 0 && catTimeline.length > 0 ? "cat" : "normal",
  );

  if (timeline.length === 0 && catTimeline.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
        <Target className="mx-auto mb-2 h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-500">
          เมื่อทำข้อสอบครั้งแรกเสร็จ ระบบจะเริ่มแสดงพัฒนาการของคุณที่นี่
        </p>
      </div>
    );
  }

  const chartData = timeline.map((item) => ({
    name: `ครั้งที่ ${item.attempt}`,
    คะแนน: item.score,
    ความแม่นยำ: item.accuracy,
  }));

  const catChartData = catTimeline.map((item) => ({
    name: `ครั้งที่ ${item.attempt}`,
    theta: item.theta,
    se: item.se,
    items: item.num_items,
    accuracy: item.accuracy,
    result: item.passed === null ? null : item.passed ? "ผ่าน" : "ไม่ผ่าน",
  }));
  const catCutScore = catTimeline.length ? catTimeline[catTimeline.length - 1].cut_score : 0;
  const bestTheta = catTimeline.length ? Math.max(...catTimeline.map((c) => c.theta)) : null;
  const catGain =
    catTimeline.length > 1
      ? Math.round((catTimeline[catTimeline.length - 1].theta - catTimeline[0].theta) * 100) / 100
      : null;

  const levelStyle = LEVEL_STYLES[level.code] ?? LEVEL_STYLES.bronze;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-5">
      {/* สรุปการเปลี่ยนแปลงล่าสุด (คิดจากข้อสอบปกติ) */}
      {timeline.length > 0 && (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <DeltaCard
          label="คะแนนล่าสุด"
          value={String(improvement.last_score ?? "—")}
          unit="/ 100"
          delta={improvement.score_delta}
        />
        <DeltaCard
          label="ความแม่นยำล่าสุด"
          value={improvement.accuracy === null ? "—" : String(improvement.accuracy)}
          unit="%"
          delta={improvement.accuracy_delta}
        />
        <DeltaCard
          label="เวลาที่ใช้ครั้งล่าสุด"
          value={String(timeline[timeline.length - 1]?.duration_minutes ?? "—")}
          unit="นาที"
          delta={improvement.duration_delta}
          lowerIsBetter
        />
      </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* กราฟแนวโน้มคะแนน */}
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-800">แนวโน้มคะแนนของคุณ</h3>
                <p className="text-xs text-gray-500">
                  {trendMode === "normal"
                    ? timeline.length
                      ? `${timeline.length} ครั้งล่าสุด · คะแนนดีที่สุด ${improvement.best_score}`
                      : "ยังไม่มีผลข้อสอบปกติ"
                    : catTimeline.length
                      ? `${catTimeline.length} ครั้งล่าสุด · θ สูงสุด ${bestTheta?.toFixed(2)}`
                      : "ยังไม่มีผลข้อสอบ CAT"}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2">
              {trendMode === "normal" && improvement.total_gain !== null && improvement.total_gain > 0 && (
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  +{improvement.total_gain} คะแนนจากครั้งแรก
                </span>
              )}
              {trendMode === "cat" && catGain !== null && catGain > 0 && (
                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
                  θ +{catGain.toFixed(2)} จากครั้งแรก
                </span>
              )}
              <div role="tablist" aria-label="ประเภทข้อสอบ" className="inline-flex rounded-lg bg-gray-100 p-0.5">
                {(
                  [
                    ["normal", "ข้อสอบปกติ"],
                    ["cat", "CAT"],
                  ] as const
                ).map(([mode, label]) => (
                  <button
                    key={mode}
                    type="button"
                    role="tab"
                    aria-selected={trendMode === mode}
                    onClick={() => setTrendMode(mode)}
                    className={`cursor-pointer rounded-md px-3 py-1 text-xs font-medium transition-colors ${
                      trendMode === mode ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {trendMode === "normal" && timeline.length === 0 && (
            <EmptyTrend text="ยังไม่มีผลข้อสอบปกติ ลองทำชุดข้อสอบในคลังข้อสอบดูก่อน" />
          )}
          {trendMode === "cat" && catTimeline.length === 0 && (
            <EmptyTrend text="ยังไม่มีผลข้อสอบ CAT ลองทำข้อสอบแบบปรับเหมาะรายข้อดูก่อน" />
          )}

          {trendMode === "cat" && catTimeline.length > 0 && (
            <>
              <div className="h-64 w-full">
                <LazyRecharts height="100%">
                  {(R) => (
                    <R.ResponsiveContainer width="100%" height="100%">
                      <R.LineChart data={catChartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                        <R.CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <R.XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <R.YAxis domain={[-3, 3]} ticks={[-3, -2, -1, 0, 1, 2, 3]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                        <R.ReferenceLine
                          y={catCutScore}
                          stroke="#f59e0b"
                          strokeDasharray="6 4"
                          label={{ value: `เกณฑ์ผ่าน θ ${catCutScore}`, position: "insideTopRight", fontSize: 11, fill: "#b45309" }}
                        />
                        <R.Tooltip
                          contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                          formatter={(value, _name, entry) => {
                            const p = (entry?.payload ?? {}) as (typeof catChartData)[number];
                            const extra = [
                              p.se !== null && p.se !== undefined ? `SE ${p.se}` : null,
                              p.items ? `${p.items} ข้อ` : null,
                              p.accuracy !== null && p.accuracy !== undefined ? `ถูก ${p.accuracy}%` : null,
                              p.result,
                            ]
                              .filter(Boolean)
                              .join(" · ");
                            return [`${Number(value).toFixed(2)}${extra ? ` (${extra})` : ""}`, "ความสามารถ θ"];
                          }}
                        />
                        <R.Line
                          type="monotone"
                          dataKey="theta"
                          name="θ"
                          stroke="#7c3aed"
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: "#7c3aed" }}
                          activeDot={{ r: 6 }}
                        />
                      </R.LineChart>
                    </R.ResponsiveContainer>
                  )}
                </LazyRecharts>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                ค่า θ (theta) คือความสามารถที่ระบบประเมินได้ในแต่ละครั้ง ยิ่งสูงยิ่งดี เส้นประสีส้มคือเกณฑ์ผ่าน
              </p>
            </>
          )}

          {trendMode === "normal" && timeline.length > 0 && (
          <div className="h-64 w-full">
            <LazyRecharts height="100%">
              {(R) => (
                <R.ResponsiveContainer width="100%" height="100%">
                <R.LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <R.CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <R.XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <R.YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                  <R.Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                    formatter={(value, name) => [
                      value === null || value === undefined
                        ? "—"
                        : `${value}${name === "ความแม่นยำ" ? "%" : " คะแนน"}`,
                      String(name),
                    ]}
                  />
                  <R.Legend wrapperStyle={{ fontSize: 12 }} />
                  <R.Line
                    type="monotone"
                    dataKey="คะแนน"
                    stroke="#2563eb"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#2563eb" }}
                    activeDot={{ r: 6 }}
                  />
                  <R.Line
                    type="monotone"
                    dataKey="ความแม่นยำ"
                    stroke="#14b8a6"
                    strokeWidth={2}
                    strokeDasharray="5 4"
                    dot={{ r: 3, fill: "#14b8a6" }}
                    connectNulls
                  />
                </R.LineChart>
              </R.ResponsiveContainer>
              )}
            </LazyRecharts>
          </div>
          )}
        </div>

        {/* ระดับและสตรีค */}
        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2.5">
              <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${levelStyle.ring} ${levelStyle.text}`}>
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-800">ระดับของคุณ</h3>
                <p className="text-xs text-gray-500">คิดจากคะแนนเฉลี่ย {level.score}</p>
              </div>
            </div>

            <div className="flex items-baseline justify-between">
              <span className={`text-xl font-medium ${levelStyle.text}`}>{level.name}</span>
              {level.next_name && (
                <span className="text-xs text-gray-600">ถัดไป: {level.next_name}</span>
              )}
            </div>

            <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
              <div
                className={`h-full rounded-full transition-all duration-700 ${levelStyle.bar}`}
                style={{ width: `${level.progress_pct}%` }}
              />
            </div>

            <p className="mt-2 text-xs text-gray-500">
              {level.points_to_next === null
                ? "คุณอยู่ระดับสูงสุดแล้ว ทำได้ดีมาก"
                : `อีก ${level.points_to_next} คะแนนเฉลี่ยจะถึงระดับ ${level.next_name}`}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="mb-3 flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Flame className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-medium text-gray-800">ความสม่ำเสมอ</h3>
                <p className="text-xs text-gray-500">
                  ทำข้อสอบล่าสุด {formatThaiDate(streak.last_active)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "ต่อเนื่อง", value: streak.current_days, unit: "วัน" },
                { label: "สถิติสูงสุด", value: streak.longest_days, unit: "วัน" },
                { label: "7 วันล่าสุด", value: streak.active_days_last_week, unit: "วัน" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl bg-gray-50 py-2.5">
                  <p className="text-lg font-medium tabular-nums text-gray-800">{item.value}</p>
                  <p className="text-[0.6875rem] text-gray-500">
                    {item.label} ({item.unit})
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* เปรียบเทียบครั้งแรกกับครั้งล่าสุด */}
      {radar_compare.length >= 3 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <CalendarCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-800">เทียบครั้งแรกกับครั้งล่าสุด</h3>
              <p className="text-xs text-gray-500">เฉพาะหมวดที่ทำทั้งสองครั้ง</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <LazyRecharts height="100%">
              {(R) => (
                <R.ResponsiveContainer width="100%" height="100%">
                <R.RadarChart data={radar_compare}>
                  <R.PolarGrid stroke="#e2e8f0" />
                  <R.PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "#64748b" }} />
                  <R.PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: "#cbd5e1" }} />
                  <R.Radar name="ครั้งแรก" dataKey="first" stroke="#94a3b8" fill="#94a3b8" fillOpacity={0.25} />
                  <R.Radar name="ครั้งล่าสุด" dataKey="latest" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.3} />
                  <R.Legend wrapperStyle={{ fontSize: 12 }} />
                  <R.Tooltip
                    contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
                    formatter={(value: number) => `${value}%`}
                  />
                </R.RadarChart>
              </R.ResponsiveContainer>
              )}
            </LazyRecharts>
          </div>
        </div>
      )}

      {/* แบดจ์ */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-medium text-gray-800">ความสำเร็จของคุณ</h3>
              <p className="text-xs text-gray-500">
                ปลดล็อกแล้ว {unlockedCount} จาก {achievements.length} รายการ
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {achievements.map((badge) => (
            <div
              key={badge.code}
              className={`rounded-xl border p-3.5 ${
                badge.unlocked ? "border-amber-200 bg-amber-50/60" : "border-gray-200 bg-gray-50"
              }`}
            >
              <div className="mb-2 flex items-center gap-2">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                    badge.unlocked ? "bg-amber-100 text-amber-600" : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {badge.unlocked ? <Award className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                </div>
                <p
                  className={`text-sm font-medium ${badge.unlocked ? "text-gray-800" : "text-gray-500"}`}
                >
                  {badge.title}
                </p>
              </div>

              <p className="text-[0.6875rem] leading-relaxed text-gray-500">{badge.description}</p>

              {badge.unlocked ? (
                <p className="mt-2 text-[0.6875rem] font-medium text-amber-700">
                  {badge.unlocked_at ? `ปลดล็อก ${formatThaiDate(badge.unlocked_at)}` : "ปลดล็อกแล้ว"}
                </p>
              ) : (
                <div className="mt-2">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full rounded-full bg-gray-400 transition-all duration-700"
                      style={{ width: `${badge.progress_pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[0.6875rem] text-gray-600">{badge.progress_pct}%</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProgressSection;
