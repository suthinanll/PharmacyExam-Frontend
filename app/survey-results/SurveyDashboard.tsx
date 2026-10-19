"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import LoadingSpinner from "@/components/LoadingSpinner";
import Swal from "@/utils/sweetalert";
import { LEVEL_STYLE } from "@/lib/survey";
import {
  ClipboardList,
  Download,
  RefreshCw,
  Users,
  TrendingUp,
  Award,
  Clock,
  ChevronDown,
  MessageSquareText,
  Power,
  LogOut,
} from "lucide-react";

type Stat = { n: number; mean: number | null; sd: number | null; level: string | null };

type Summary = {
  isOpen: boolean;
  totalResponses: number;
  lastResponseAt: string | null;
  overall: Stat;
  demographics: {
    id: string;
    label: string;
    type: "single" | "multi";
    answered: number;
    options: { value: string; label: string; count: number; percent: number }[];
    others: string[];
  }[];
  likertGroups: (Stat & {
    id: string;
    title: string;
    items: (Stat & { id: string; text: string; distribution: number[] })[];
  })[];
  ranking: {
    id: string;
    title: string;
    items: { id: string; label: string; n: number; averageRank: number | null; firstChoice: number }[];
  }[];
  suggestions: { text: string; createdAt: string }[];
};

const API = process.env.NEXT_PUBLIC_API_URL;

/** สีแท่งการกระจายคะแนน 1–5 */
const DIST_COLORS = ["bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-lime-500", "bg-green-600"];

const fmt = (n: number | null) => (n === null ? "—" : n.toFixed(2));
const thaiDateTime = (iso: string) =>
  new Date(iso).toLocaleString("th-TH", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

function LevelBadge({ level }: { level: string | null }) {
  if (!level) return <span className="text-xs text-gray-500">—</span>;
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${LEVEL_STYLE[level] ?? "bg-gray-100 text-gray-700"}`}>{level}</span>;
}

/**
 * แดชบอร์ดผลการประเมิน — ใช้ในหน้าแยก /survey-results เท่านั้น (ไม่อยู่ในเมนูแอดมิน)
 * token มาจากการเข้าสู่ระบบในหน้านั้นเอง ไม่ใช้ token ของการเข้าสู่ระบบหลักของเว็บ
 */
export default function SurveyDashboard({ token, email, onLogout }: { token: string; email: string; onLogout: () => void }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/survey/admin/summary`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401 || res.status === 403) return onLogout();
      if (!res.ok) throw new Error("โหลดผลการประเมินไม่สำเร็จ");
      setSummary(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  }, [token, onLogout]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleOpen = async () => {
    if (!summary) return;
    const next = !summary.isOpen;
    const confirm = await Swal.fire({
      icon: "question",
      title: next ? "เปิดแบบประเมิน?" : "ปิดแบบประเมิน?",
      text: next
        ? "เมนู “แบบประเมินความพึงพอใจ” จะแสดงในเมนูรูปโปรไฟล์ของผู้ใช้ และผู้ใช้ตอบได้ทันที"
        : "เมนูแบบประเมินจะถูกซ่อนจากผู้ใช้ และระบบจะไม่รับคำตอบใหม่จนกว่าจะเปิดอีกครั้ง",
      showCancelButton: true,
      confirmButtonText: next ? "เปิดแบบประเมิน" : "ปิดแบบประเมิน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: next ? "#16a34a" : "#dc2626",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    setToggling(true);
    try {
      const res = await fetch(`${API}/survey/admin/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ isOpen: next }),
      });
      if (!res.ok) throw new Error();
      setSummary((s) => (s ? { ...s, isOpen: next } : s));
    } catch {
      Swal.fire({ icon: "error", title: "เปลี่ยนสถานะไม่สำเร็จ", text: "กรุณาลองใหม่อีกครั้ง" });
    } finally {
      setToggling(false);
    }
  };

  /** ส่งออกคำตอบรายคน (ไม่ระบุตัวตน) เป็น CSV — ใส่ BOM ให้ Excel อ่านภาษาไทยได้ */
  const exportCsv = async () => {
    setExporting(true);
    try {
      const res = await fetch(`${API}/survey/admin/responses`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      const { columns, rows } = (await res.json()) as { columns: string[]; rows: (string | number)[][] };
      const cell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
      const csv = [columns, ...rows].map((r) => r.map(cell).join(",")).join("\r\n");
      const url = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `survey-responses-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      Swal.fire({ icon: "error", title: "ส่งออกไฟล์ไม่สำเร็จ", text: "กรุณาลองใหม่อีกครั้ง" });
    } finally {
      setExporting(false);
    }
  };

  const toggleRow = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <>
      <div className="max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">ผลการประเมินแบบสอบถาม</h1>
            <p className="text-sm text-gray-500">สรุปความพึงพอใจในการใช้งานเว็บไซต์เภสัชพร้อมสอบ คำตอบทั้งหมดไม่ระบุตัวตนผู้ตอบ</p>
            <p className="text-xs text-gray-500 mt-1">เข้าสู่ระบบในชื่อ {email}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> ออกจากระบบ
            </button>
            <button
              type="button"
              onClick={load}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-50 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} /> รีเฟรช
            </button>
            <button
              type="button"
              onClick={exportCsv}
              disabled={exporting || !summary?.totalResponses}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" /> ส่งออก CSV
            </button>
          </div>
        </div>

        {error && <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-4 text-sm">{error}</div>}

        {loading && !summary ? (
          <div className="min-h-[50vh] flex items-center justify-center">
            <LoadingSpinner size="lg" text="กำลังโหลดผลการประเมิน..." />
          </div>
        ) : summary ? (
          <>
            {/* สถานะเปิด/ปิด */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${summary.isOpen ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-base font-medium text-gray-900">
                    แบบประเมิน: {summary.isOpen ? "เปิดอยู่" : "ปิดอยู่"}
                  </p>
                  <p className="text-sm text-gray-500">
                    {summary.isOpen
                      ? "แสดงเมนู “แบบประเมินความพึงพอใจ” ในเมนูรูปโปรไฟล์ของผู้ใช้ ตอบได้คนละ 1 ครั้ง"
                      : "ซ่อนเมนูแบบประเมินจากผู้ใช้ และไม่รับคำตอบใหม่"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={summary.isOpen}
                aria-label="เปิด/ปิดแบบประเมิน (แสดงเมนูให้ผู้ใช้)"
                onClick={toggleOpen}
                disabled={toggling}
                className={`relative inline-flex h-7 w-12 shrink-0 rounded-full transition-colors duration-200 cursor-pointer disabled:opacity-50 ${summary.isOpen ? "bg-green-600" : "bg-gray-300"}`}
              >
                <span className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 ${summary.isOpen ? "translate-x-5" : ""}`} />
              </button>
            </div>

            {/* สรุปตัวเลข */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard icon={Users} color="bg-blue-50 text-blue-600" label="จำนวนผู้ตอบ" value={`${summary.totalResponses}`} unit="คน" />
              <StatCard icon={TrendingUp} color="bg-green-50 text-green-600" label="ค่าเฉลี่ยรวม (x̄)" value={fmt(summary.overall.mean)} unit={summary.overall.sd !== null ? `S.D. ${fmt(summary.overall.sd)}` : ""} />
              <StatCard icon={Award} color="bg-amber-50 text-amber-600" label="ระดับความพึงพอใจรวม" value={summary.overall.level ?? "—"} />
              <StatCard icon={Clock} color="bg-purple-50 text-purple-600" label="ตอบล่าสุด" value={summary.lastResponseAt ? thaiDateTime(summary.lastResponseAt) : "—"} small />
            </div>

            {summary.totalResponses === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-12 text-center">
                <ClipboardList className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                <p className="text-base font-medium text-gray-700">ยังไม่มีผู้ตอบแบบประเมิน</p>
                <p className="text-sm text-gray-500 mt-1">ผลสรุปจะแสดงที่นี่เมื่อมีผู้ใช้ส่งแบบประเมิน</p>
              </div>
            ) : (
              <>
                {/* ส่วนที่ 2 รายด้าน */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-5 sm:p-6 pb-3">
                    <h2 className="text-lg font-medium text-gray-900">ปัจจัยการยอมรับการใช้งาน (ส่วนที่ 2)</h2>
                    <p className="text-sm text-gray-500">ค่าเฉลี่ยและส่วนเบี่ยงเบนมาตรฐานรายด้าน กดที่แถวเพื่อดูรายข้อ · เกณฑ์ระดับ 4.51–5.00 มากที่สุด, 3.51–4.50 มาก, 2.51–3.50 ปานกลาง, 1.51–2.50 น้อย, 1.00–1.50 น้อยที่สุด</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm min-w-[640px]">
                      <thead>
                        <tr className="bg-green-600 text-white text-left">
                          <th className="px-5 py-3 font-medium">ด้าน / ข้อคำถาม</th>
                          <th className="px-3 py-3 font-medium w-48">ค่าเฉลี่ย</th>
                          <th className="px-3 py-3 font-medium text-right w-20">S.D.</th>
                          <th className="px-5 py-3 font-medium text-center w-28">ระดับ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {summary.likertGroups.map((g) => {
                          const open = expanded.has(g.id);
                          return (
                            <Fragment key={g.id}>
                              <tr className="cursor-pointer hover:bg-gray-50" onClick={() => toggleRow(g.id)}>
                                <td className="px-5 py-3">
                                  <button type="button" aria-expanded={open} className="flex items-center gap-2 text-left text-gray-900 font-medium cursor-pointer">
                                    <ChevronDown className={`w-4 h-4 text-gray-500 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
                                    {g.title}
                                  </button>
                                </td>
                                <td className="px-3 py-3">
                                  <MeanBar mean={g.mean} />
                                </td>
                                <td className="px-3 py-3 text-right text-gray-700">{fmt(g.sd)}</td>
                                <td className="px-5 py-3 text-center"><LevelBadge level={g.level} /></td>
                              </tr>
                              {open &&
                                g.items.map((item) => (
                                  <tr key={item.id} className="bg-gray-50/70">
                                    <td className="pl-11 pr-5 py-2.5 text-gray-700">
                                      <p><span className="text-gray-500 mr-1.5">{item.id}</span>{item.text}</p>
                                      <Distribution values={item.distribution} />
                                    </td>
                                    <td className="px-3 py-2.5"><MeanBar mean={item.mean} /></td>
                                    <td className="px-3 py-2.5 text-right text-gray-700">{fmt(item.sd)}</td>
                                    <td className="px-5 py-2.5 text-center"><LevelBadge level={item.level} /></td>
                                  </tr>
                                ))}
                            </Fragment>
                          );
                        })}
                        <tr className="bg-green-50">
                          <td className="px-5 py-3 font-medium text-gray-900">รวมทุกด้าน</td>
                          <td className="px-3 py-3"><MeanBar mean={summary.overall.mean} /></td>
                          <td className="px-3 py-3 text-right font-medium text-gray-900">{fmt(summary.overall.sd)}</td>
                          <td className="px-5 py-3 text-center"><LevelBadge level={summary.overall.level} /></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="px-5 sm:px-6 py-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600 border-t border-gray-100">
                    <span>การกระจายคะแนนรายข้อ:</span>
                    {["1 ไม่เห็นด้วยอย่างยิ่ง", "2", "3", "4", "5 เห็นด้วยอย่างยิ่ง"].map((l, i) => (
                      <span key={l} className="inline-flex items-center gap-1.5">
                        <span className={`w-2.5 h-2.5 rounded-sm ${DIST_COLORS[i]}`} /> {l}
                      </span>
                    ))}
                  </div>
                </section>

                {/* ส่วนที่ 3 ลำดับความชอบ */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {summary.ranking.map((g) => (
                    <div key={g.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                      <h2 className="text-base font-medium text-gray-900">{g.title}</h2>
                      <p className="text-xs text-gray-500 mb-4">เรียงจากลำดับเฉลี่ยน้อยไปมาก (1 = ชอบมากที่สุด)</p>
                      <ol className="space-y-3">
                        {g.items.map((item, i) => (
                          <li key={item.id}>
                            <div className="flex items-center justify-between gap-3 text-sm">
                              <span className="flex items-center gap-2 text-gray-800 min-w-0">
                                <span className={`w-6 h-6 shrink-0 rounded-full text-xs font-medium flex items-center justify-center ${i === 0 ? "bg-green-600 text-white" : "bg-gray-100 text-gray-600"}`}>{i + 1}</span>
                                <span className="truncate">{item.label}</span>
                              </span>
                              <span className="text-gray-600 shrink-0 text-xs">
                                เฉลี่ย {item.averageRank?.toFixed(2) ?? "—"} · อันดับ 1: {item.firstChoice} คน
                              </span>
                            </div>
                            <div className="h-1.5 bg-gray-100 rounded-full mt-1.5 ml-8 overflow-hidden">
                              {/* ลำดับ 1 = แท่งเต็ม, ลำดับ 5 = แท่งสั้นสุด */}
                              <div className="h-full bg-green-500 rounded-full" style={{ width: item.averageRank ? `${((6 - item.averageRank) / 5) * 100}%` : "0%" }} />
                            </div>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </section>

                {/* ส่วนที่ 1 ข้อมูลทั่วไป */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">ข้อมูลทั่วไปของผู้ตอบ (ส่วนที่ 1)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    {summary.demographics.map((q) => (
                      <div key={q.id}>
                        <p className="text-sm font-medium text-gray-800">{q.label}</p>
                        <p className="text-xs text-gray-500 mb-2">ตอบ {q.answered} คน{q.type === "multi" ? " (เลือกได้หลายข้อ ร้อยละคิดจากผู้ตอบ)" : ""}</p>
                        <div className="space-y-1.5">
                          {q.options.map((o) => (
                            <div key={o.value} className="text-xs">
                              <div className="flex justify-between text-gray-700 mb-0.5">
                                <span>{o.label}</span>
                                <span>{o.count} ({o.percent}%)</span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${o.percent}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                        {q.others.length > 0 && (
                          <p className="text-xs text-gray-600 mt-2">อื่น ๆ: {q.others.join(", ")}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* ส่วนที่ 4 ข้อเสนอแนะ */}
                <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MessageSquareText className="w-5 h-5 text-green-600" />
                    <h2 className="text-lg font-medium text-gray-900">ข้อเสนอแนะเพิ่มเติม</h2>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{summary.suggestions.length}</span>
                  </div>
                  {summary.suggestions.length === 0 ? (
                    <p className="text-sm text-gray-500">ยังไม่มีข้อเสนอแนะ</p>
                  ) : (
                    <ul className="space-y-3">
                      {summary.suggestions.map((s, i) => (
                        <li key={i} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                          <p className="text-sm text-gray-800 whitespace-pre-line">{s.text}</p>
                          <p className="text-xs text-gray-500 mt-1.5">{thaiDateTime(s.createdAt)}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </>
        ) : null}
      </div>
    </>
  );
}

function StatCard({
  icon: Icon,
  color,
  label,
  value,
  unit,
  small,
}: {
  icon: React.ElementType;
  color: string;
  label: string;
  value: string;
  unit?: string;
  small?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm text-gray-600">{label}</p>
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className={`${small ? "text-base" : "text-2xl"} font-medium text-gray-900 mt-2`}>{value}</p>
      {unit && <p className="text-xs text-gray-500 mt-0.5">{unit}</p>}
    </div>
  );
}

/** แท่งค่าเฉลี่ยเทียบเต็ม 5 */
function MeanBar({ mean }: { mean: number | null }) {
  return (
    <div className="flex items-center gap-2">
      <span className="w-9 text-gray-900 font-medium">{fmt(mean)}</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full bg-green-500 rounded-full" style={{ width: mean ? `${(mean / 5) * 100}%` : "0%" }} />
      </div>
    </div>
  );
}

/** แท่งซ้อนแสดงจำนวนคนที่ให้คะแนน 1–5 */
function Distribution({ values }: { values: number[] }) {
  const total = values.reduce((s, v) => s + v, 0);
  if (!total) return null;
  return (
    <div className="flex h-1.5 rounded-full overflow-hidden mt-1.5 max-w-md" title={values.map((v, i) => `${i + 1}: ${v} คน`).join(", ")}>
      {values.map((v, i) => (v ? <div key={i} className={DIST_COLORS[i]} style={{ width: `${(v / total) * 100}%` }} /> : null))}
    </div>
  );
}
