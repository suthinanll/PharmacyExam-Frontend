"use client";

import { useEffect, useState } from "react";
import { Flag, Loader2, X } from "lucide-react";
import Swal from "@/utils/sweetalert";
import { SWAL_COLORS } from "@/utils/swal";
import { useAuth } from "@/contexts/AuthContext";

const REASONS: { value: string; label: string }[] = [
  { value: "wrong_answer", label: "เฉลยผิด" },
  { value: "unclear", label: "โจทย์หรือตัวเลือกกำกวม" },
  { value: "typo", label: "พิมพ์ผิด" },
  { value: "missing_image", label: "รูปไม่แสดง / ไม่มีรูปที่โจทย์อ้างถึง" },
  { value: "other", label: "อื่น ๆ" },
];

/** ปุ่ม "แจ้งปัญหา" ในหน้าเฉลย — ส่งรายงานให้แอดมินตรวจที่หน้า /admin/item_reports */
export default function ReportItemButton({ itemId }: { itemId: number }) {
  const { getToken } = useAuth();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("wrong_answer");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !sending && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, sending]);

  const submit = async () => {
    setSending(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/item-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ item_id: itemId, reason, message: message.trim() || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg = Array.isArray(data?.message) ? data.message[0] : data?.message;
        throw new Error(msg || "ส่งรายงานไม่สำเร็จ");
      }
      setSent(true);
      setOpen(false);
      setMessage("");
      Swal.fire({
        icon: "success",
        title: "ส่งรายงานแล้ว",
        text: "ขอบคุณที่ช่วยตรวจสอบ ผู้ดูแลจะตรวจข้อนี้อีกครั้ง",
        confirmButtonColor: SWAL_COLORS.confirm,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "ส่งรายงานไม่สำเร็จ",
        text: err instanceof Error ? err.message : "กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: SWAL_COLORS.confirm,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={sent}
        title={sent ? "แจ้งปัญหาข้อนี้แล้ว" : "แจ้งว่าข้อนี้มีปัญหา เช่น เฉลยผิด"}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-600 hover:text-rose-700 bg-white/80 hover:bg-white border border-gray-200/80 transition-all cursor-pointer shadow-2xs disabled:cursor-default disabled:text-gray-400 disabled:hover:text-gray-400"
      >
        <Flag className="w-3.5 h-3.5" />
        {sent ? "แจ้งแล้ว" : "แจ้งปัญหา"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={`report-title-${itemId}`}
          onClick={() => !sending && setOpen(false)}
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h2 id={`report-title-${itemId}`} className="text-lg font-medium text-gray-900">
                  แจ้งปัญหาข้อสอบ
                </h2>
                <p className="mt-0.5 text-sm text-gray-500">ผู้ดูแลจะตรวจสอบและแก้ไขข้อนี้</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={sending}
                aria-label="ปิด"
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <fieldset className="space-y-2">
              <legend className="mb-2 text-sm font-medium text-gray-700">ปัญหาที่พบ</legend>
              {REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                    reason === r.value ? "border-primary bg-primary-soft text-gray-900" : "border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`report-reason-${itemId}`}
                    value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-current"
                  />
                  {r.label}
                </label>
              ))}
            </fieldset>

            <label htmlFor={`report-message-${itemId}`} className="mt-4 mb-1.5 block text-sm font-medium text-gray-700">
              รายละเอียดเพิ่มเติม <span className="font-normal text-gray-500">(ไม่บังคับ)</span>
            </label>
            <textarea
              id={`report-message-${itemId}`}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={1000}
              rows={3}
              placeholder="เช่น คำตอบที่ถูกควรเป็นข้อ ค เพราะ… (อ้างอิงแหล่งข้อมูลได้)"
              className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-800 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={sending}
                className="rounded-xl px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={sending}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-on-primary hover:bg-primary-hover disabled:opacity-60 cursor-pointer"
              >
                {sending && <Loader2 className="w-4 h-4 animate-spin" />}
                ส่งรายงาน
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
