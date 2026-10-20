"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { BookOpen, CheckCircle2, Flame, Loader2, RotateCcw, XCircle } from "lucide-react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import RichText from "@/components/RichText";
import ImagePreviewModal from "@/components/ImagePreviewModal";
import ReportItemButton from "@/components/ReportItemButton";
import { useAuth } from "@/contexts/AuthContext";
import { formatScientificText } from "@/utils/formatText";
import { resolveImageUrl } from "@/utils/imageUrl";

interface ReviewResult {
  selected_option_id: number;
  is_correct: boolean;
  correct_option_id: number | null;
  explanation: string;
}

interface ReviewItem {
  item_id: number;
  question_text: string;
  question_image_url: string | null;
  situation: { situation_text?: string | null; situation_image_url?: string | null } | null;
  answer_options: { option_id: number; option_text: string; option_image_url: string | null }[];
  result: ReviewResult | null;
}

interface DailyReview {
  date: string;
  total: number;
  answered: number;
  completed: boolean;
  streak: number;
  items: ReviewItem[];
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;
const OPTION_LABELS = ["ก", "ข", "ค", "ง", "จ"];

export default function DailyReviewClient() {
  const { getToken } = useAuth();
  const [review, setReview] = useState<DailyReview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(`${API_URL}/daily-review/today`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "โหลดชุดทบทวนไม่สำเร็จ");
      setReview(data);
      // เปิดมาที่ข้อแรกที่ยังไม่ได้ตอบ
      const firstOpen = (data as DailyReview).items.findIndex((i) => !i.result);
      setIndex(firstOpen === -1 ? 0 : firstOpen);
    } catch (err) {
      setError(err instanceof Error ? err.message : "โหลดชุดทบทวนไม่สำเร็จ");
    }
  }, [getToken]);

  useEffect(() => {
    load();
  }, [load]);

  const item = review?.items[index];

  const submit = async () => {
    if (!review || !item || selected === null) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/daily-review/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ item_id: item.item_id, option_id: selected }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.message || "ส่งคำตอบไม่สำเร็จ");
      const result: ReviewResult = {
        selected_option_id: selected,
        is_correct: data.is_correct,
        correct_option_id: data.correct_option_id,
        explanation: data.explanation,
      };
      const items = review.items.map((i) => (i.item_id === item.item_id ? { ...i, result } : i));
      const answered = items.filter((i) => i.result).length;
      setReview({
        ...review,
        items,
        answered,
        completed: data.completed,
        // ทำครบวันนี้เป็นครั้งแรก — นับวันต่อเนื่องเพิ่มทันที ไม่ต้องโหลดใหม่
        streak: data.completed && !review.completed ? review.streak + 1 : review.streak,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "ส่งคำตอบไม่สำเร็จ");
    } finally {
      setSubmitting(false);
    }
  };

  const goTo = (next: number) => {
    setIndex(next);
    setSelected(null);
  };

  const correctCount = review?.items.filter((i) => i.result?.is_correct).length ?? 0;

  return (
    <>
      <Navbar_user />
      <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-900">ทบทวนประจำวัน</h1>
              <p className="mt-1 text-sm text-gray-500">
                วันละ {review?.total ?? 5} ข้อ เน้นข้อที่เคยตอบผิด ชุดใหม่ทุกเที่ยงคืน
              </p>
            </div>
            {review && review.streak > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-sm font-medium text-amber-700">
                <Flame className="w-4 h-4" /> ทำต่อเนื่อง {review.streak} วัน
              </div>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
              {!review && (
                <button type="button" onClick={load} className="ml-3 font-medium underline cursor-pointer">
                  ลองใหม่
                </button>
              )}
            </div>
          )}

          {!review ? (
            !error && (
              <div className="flex justify-center py-20 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            )
          ) : (
            <>
              {/* ความคืบหน้า */}
              <div className="mb-4 flex gap-1.5" aria-label={`ตอบแล้ว ${review.answered} จาก ${review.total} ข้อ`}>
                {review.items.map((it, i) => (
                  <button
                    key={it.item_id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`ข้อ ${i + 1}`}
                    aria-current={i === index ? "step" : undefined}
                    className={`h-2 flex-1 rounded-full transition-colors cursor-pointer ${
                      it.result ? (it.result.is_correct ? "bg-green-500" : "bg-rose-400") : i === index ? "bg-gray-400" : "bg-gray-200"
                    }`}
                  />
                ))}
              </div>

              {review.completed && (
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-green-200 bg-green-50 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">ทบทวนวันนี้ครบแล้ว</p>
                      <p className="text-sm text-green-700">
                        ตอบถูก {correctCount} จาก {review.total} ข้อ — กลับมาทำชุดใหม่พรุ่งนี้
                      </p>
                    </div>
                  </div>
                  <Link href="/user/examset" className="text-sm font-medium text-green-700 underline">
                    ทำชุดข้อสอบต่อ
                  </Link>
                </div>
              )}

              {item && (
                <div className="rounded-2xl border border-gray-100 bg-white shadow-xs">
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
                    <span className="text-sm font-medium text-gray-700">
                      ข้อ {index + 1} / {review.total}
                    </span>
                    {item.result && <ReportItemButton itemId={item.item_id} />}
                  </div>

                  <div className="space-y-5 p-5">
                    {item.situation && (item.situation.situation_text || item.situation.situation_image_url) && (
                      <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                        <p className="mb-2 flex items-center gap-2 text-sm font-medium text-blue-700">
                          <BookOpen className="w-4 h-4" /> สถานการณ์
                        </p>
                        {item.situation.situation_text && (
                          <RichText
                            className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                            html={formatScientificText(item.situation.situation_text)}
                          />
                        )}
                        {item.situation.situation_image_url && (
                          <img
                            src={resolveImageUrl(item.situation.situation_image_url)}
                            alt="สถานการณ์"
                            className="mt-3 max-h-72 rounded-lg border border-gray-200 cursor-zoom-in"
                            onClick={() => setPreviewImage(resolveImageUrl(item.situation?.situation_image_url))}
                          />
                        )}
                      </div>
                    )}

                    <RichText
                      className="text-base sm:text-lg font-medium text-gray-900 leading-relaxed whitespace-pre-wrap"
                      html={formatScientificText(item.question_text)}
                    />
                    {item.question_image_url && (
                      <img
                        src={resolveImageUrl(item.question_image_url)}
                        alt="คำถาม"
                        className="max-h-72 rounded-xl border border-gray-200 bg-white object-contain cursor-zoom-in"
                        onClick={() => setPreviewImage(resolveImageUrl(item.question_image_url))}
                      />
                    )}

                    <div className="space-y-2.5">
                      {item.answer_options.map((o, i) => {
                        const r = item.result;
                        const isPicked = r ? r.selected_option_id === o.option_id : selected === o.option_id;
                        const isCorrect = r?.correct_option_id === o.option_id;
                        const tone = r
                          ? isCorrect
                            ? "border-green-500 bg-green-50"
                            : isPicked
                              ? "border-rose-400 bg-rose-50"
                              : "border-gray-200 bg-white opacity-70"
                          : isPicked
                            ? "border-green-500 bg-green-50"
                            : "border-gray-200 bg-white hover:border-green-300";
                        return (
                          <button
                            key={o.option_id}
                            type="button"
                            disabled={!!r || submitting}
                            onClick={() => setSelected(o.option_id)}
                            aria-pressed={isPicked}
                            className={`flex w-full items-start gap-3 rounded-xl border-2 p-4 text-left transition-colors ${tone} ${r ? "cursor-default" : "cursor-pointer"}`}
                          >
                            <span className="shrink-0 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                              {OPTION_LABELS[i] ?? i + 1}
                            </span>
                            <div className="flex-1">
                              <RichText as="span" className="block text-sm sm:text-base text-gray-800" html={formatScientificText(o.option_text)} />
                              {o.option_image_url && (
                                <img
                                  src={resolveImageUrl(o.option_image_url)}
                                  alt={`ตัวเลือก ${OPTION_LABELS[i] ?? i + 1}`}
                                  className="mt-2 max-h-40 rounded-lg border border-gray-200 bg-white object-contain"
                                />
                              )}
                            </div>
                            {r && isCorrect && <CheckCircle2 className="w-5 h-5 shrink-0 text-green-600" />}
                            {r && isPicked && !isCorrect && <XCircle className="w-5 h-5 shrink-0 text-rose-500" />}
                          </button>
                        );
                      })}
                    </div>

                    {item.result && (
                      <div
                        className={`rounded-xl border px-4 py-3 ${
                          item.result.is_correct ? "border-green-200 bg-green-50" : "border-rose-200 bg-rose-50"
                        }`}
                      >
                        <p className={`font-medium ${item.result.is_correct ? "text-green-800" : "text-rose-700"}`}>
                          {item.result.is_correct ? "ตอบถูก" : "ยังไม่ถูก"}
                        </p>
                        {item.result.explanation && (
                          <RichText
                            className="mt-1 text-sm text-gray-700 leading-relaxed whitespace-pre-wrap"
                            html={formatScientificText(item.result.explanation)}
                          />
                        )}
                      </div>
                    )}
                  </div>

                  {/* ปุ่มอยู่ใต้ตัวเลือกและติดขอบล่างบนมือถือ เหมือนหน้าทำข้อสอบ */}
                  <div className="sticky bottom-0 flex items-center gap-3 rounded-b-2xl border-t border-gray-100 bg-white/95 px-5 py-3 backdrop-blur">
                    <button
                      type="button"
                      onClick={() => goTo(index - 1)}
                      disabled={index === 0 || submitting}
                      className="px-4 py-2.5 rounded-lg bg-green-100 text-green-700 font-medium hover:bg-green-200 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      ← ย้อนกลับ
                    </button>
                    <div className="flex-1" />
                    {!item.result ? (
                      <button
                        type="button"
                        onClick={submit}
                        disabled={selected === null || submitting}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                      >
                        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                        ตรวจคำตอบ
                      </button>
                    ) : index < review.total - 1 ? (
                      <button
                        type="button"
                        onClick={() => goTo(index + 1)}
                        className="px-5 py-2.5 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 cursor-pointer"
                      >
                        ข้อถัดไป →
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => goTo(0)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 cursor-pointer"
                      >
                        <RotateCcw className="w-4 h-4" /> ดูตั้งแต่ข้อแรก
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <Footer />
      {previewImage && <ImagePreviewModal src={previewImage} onClose={() => setPreviewImage(null)} />}
    </>
  );
}
