"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Flag, Loader2, RotateCcw, XCircle } from "lucide-react";
import Navbar_admin from "@/components/Navbar_admin";
import RichText from "@/components/RichText";
import Swal from "@/utils/sweetalert";
import { SWAL_COLORS } from "@/utils/swal";
import { useAuth } from "@/contexts/AuthContext";
import { formatScientificText } from "@/utils/formatText";

type Status = "open" | "resolved" | "rejected";

interface ItemReport {
  id: number;
  item_id: number;
  reason: string;
  message: string | null;
  status: Status;
  admin_note: string | null;
  created_at: string;
  resolved_at: string | null;
  reporter: string | null;
  item: {
    question_text: string;
    explanation: string;
    options: { option_id: number; option_text: string; is_correct: boolean }[];
  } | null;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

const REASON_LABEL: Record<string, string> = {
  wrong_answer: "เฉลยผิด",
  unclear: "โจทย์/ตัวเลือกกำกวม",
  typo: "พิมพ์ผิด",
  missing_image: "รูปไม่แสดง / ไม่มีรูป",
  other: "อื่น ๆ",
};

const TABS: { value: Status; label: string }[] = [
  { value: "open", label: "รอตรวจ" },
  { value: "resolved", label: "แก้ไขแล้ว" },
  { value: "rejected", label: "ไม่แก้ไข" },
];

const OPTION_LABELS = ["ก", "ข", "ค", "ง", "จ"];

export default function ItemReportsPage() {
  const { getToken } = useAuth();
  const [tab, setTab] = useState<Status>("open");
  const [reports, setReports] = useState<ItemReport[]>([]);
  const [counts, setCounts] = useState<Partial<Record<Status, number>>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/item-reports?status=${tab}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setReports(data.reports ?? []);
      setCounts(data.counts ?? {});
    } catch {
      setReports([]);
      Swal.fire({ icon: "error", title: "โหลดรายงานไม่สำเร็จ", confirmButtonColor: SWAL_COLORS.confirm });
    } finally {
      setLoading(false);
    }
  }, [tab, getToken]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (report: ItemReport, status: Status) => {
    let adminNote: string | undefined;
    if (status !== "open") {
      const result = await Swal.fire({
        title: status === "resolved" ? "ยืนยันว่าแก้ไขแล้ว" : "ยืนยันว่าไม่แก้ไข",
        input: "textarea",
        inputLabel: "บันทึกของผู้ดูแล (ไม่บังคับ)",
        inputPlaceholder: status === "resolved" ? "เช่น แก้เฉลยเป็นข้อ ค แล้ว" : "เช่น เฉลยถูกต้องตามแนวทาง…",
        inputValue: report.admin_note ?? "",
        showCancelButton: true,
        confirmButtonText: "บันทึก",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: SWAL_COLORS.confirm,
        cancelButtonColor: SWAL_COLORS.cancel,
      });
      if (!result.isConfirmed) return;
      adminNote = typeof result.value === "string" ? result.value : undefined;
    }

    setBusyId(report.id);
    try {
      const res = await fetch(`${API_URL}/item-reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ status, admin_note: adminNote }),
      });
      if (!res.ok) throw new Error();
      await load();
    } catch {
      Swal.fire({ icon: "error", title: "บันทึกไม่สำเร็จ", confirmButtonColor: SWAL_COLORS.confirm });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Navbar_admin>
      <div className="max-w-5xl mx-auto w-full space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">รายงานปัญหาข้อสอบ</h1>
          <p className="text-sm text-gray-500">
            ผู้เรียนแจ้งจากหน้าเฉลย เช่น แย้งว่าเฉลยผิด — แก้ข้อสอบได้ที่หน้าคลังข้อสอบ แล้วกลับมาปิดรายงาน
          </p>
        </div>

        <div role="tablist" aria-label="สถานะรายงาน" className="inline-flex rounded-xl bg-gray-100 p-1">
          {TABS.map((t) => (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={tab === t.value}
              onClick={() => setTab(t.value)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                tab === t.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {t.label}
              <span className="ml-1.5 text-xs text-gray-500">{counts[t.value] ?? 0}</span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16 text-gray-500">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : reports.length === 0 ? (
          <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center text-gray-500">
            <Flag className="mx-auto mb-3 w-10 h-10 opacity-20" />
            <p className="text-sm">ไม่มีรายงานในสถานะนี้</p>
          </div>
        ) : (
          <ul className="space-y-4">
            {reports.map((r) => (
              <li key={r.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-xs">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-rose-50 px-2.5 py-0.5 font-medium text-rose-700 border border-rose-100">
                    {REASON_LABEL[r.reason] ?? r.reason}
                  </span>
                  <span className="text-gray-500">ข้อสอบ #{r.item_id}</span>
                  <span className="text-gray-400">·</span>
                  <span className="text-gray-500">
                    {r.reporter ? `แจ้งโดย ${r.reporter}` : "ผู้ใช้"} ·{" "}
                    {new Date(r.created_at).toLocaleString("th-TH", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                </div>

                {r.message && (
                  <p className="mt-3 whitespace-pre-wrap rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                    {r.message}
                  </p>
                )}

                {r.item ? (
                  <div className="mt-4 space-y-3">
                    <RichText
                      as="div"
                      className="text-sm font-medium text-gray-900 leading-relaxed"
                      html={formatScientificText(r.item.question_text)}
                    />
                    <ol className="space-y-1.5">
                      {r.item.options.map((o, i) => (
                        <li
                          key={o.option_id}
                          className={`flex gap-2 rounded-lg px-3 py-1.5 text-sm ${
                            o.is_correct ? "bg-green-50 text-green-800 border border-green-200" : "text-gray-700"
                          }`}
                        >
                          <span className="font-medium shrink-0">{OPTION_LABELS[i] ?? i + 1}.</span>
                          <RichText as="span" html={formatScientificText(o.option_text)} />
                          {o.is_correct && <span className="ml-auto shrink-0 text-xs font-medium">เฉลยปัจจุบัน</span>}
                        </li>
                      ))}
                    </ol>
                    {r.item.explanation && (
                      <details className="text-sm text-gray-600">
                        <summary className="cursor-pointer font-medium text-gray-700">คำอธิบายเฉลย</summary>
                        <RichText as="div" className="mt-2 leading-relaxed" html={formatScientificText(r.item.explanation)} />
                      </details>
                    )}
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-500">ข้อสอบนี้ถูกลบไปแล้ว</p>
                )}

                {r.admin_note && (
                  <p className="mt-3 text-sm text-gray-600">
                    <span className="font-medium text-gray-700">บันทึกผู้ดูแล:</span> {r.admin_note}
                  </p>
                )}

                <div className="mt-4 flex flex-wrap justify-end gap-2 border-t border-gray-100 pt-4">
                  {r.status === "open" ? (
                    <>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => setStatus(r, "rejected")}
                        className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" /> ไม่แก้ไข
                      </button>
                      <button
                        type="button"
                        disabled={busyId === r.id}
                        onClick={() => setStatus(r, "resolved")}
                        className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" /> แก้ไขแล้ว
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => setStatus(r, "open")}
                      className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" /> เปิดรายงานอีกครั้ง
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Navbar_admin>
  );
}
