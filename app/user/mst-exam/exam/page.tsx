"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Navbar_user from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/utils/api";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Send,
  X,
  AlertCircle,
} from "lucide-react";
import Swal from "sweetalert2";
import { MSTCurrentStageData } from "@/components/mst/types";
import { MSTStageHeader } from "@/components/mst/MSTStageHeader";
import { MSTQuestionCard } from "@/components/mst/MSTQuestionCard";
import { MSTQuestionDrawer } from "@/components/mst/MSTQuestionDrawer";

function MSTExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { getToken } = useAuth();
  const sessionIdStr = searchParams?.get("session_id");

  const [loading, setLoading] = useState(true);
  const [submittingStage, setSubmittingStage] = useState(false);
  const [stageData, setStageData] = useState<MSTCurrentStageData | null>(null);

  // Current Question Index within the Stage (0-indexed)
  const [currentIndex, setCurrentIndex] = useState(0);

  // Answers for the current stage: { [item_id]: selected_option_id }
  const [stageAnswers, setStageAnswers] = useState<Record<number, number>>({});

  // Flagged questions for review: { [item_id]: boolean }
  const [flaggedItems, setFlaggedItems] = useState<Record<number, boolean>>({});

  // Image Zoom Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Timer
  const [elapsedTime, setElapsedTime] = useState(0);
  const stageStartTimeRef = useRef<number>(Date.now());
  const answerTimingsRef = useRef<Record<number, number>>({});

  // Timer interval
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Load Stage Data
  const loadCurrentStage = useCallback(
    async (sessionId: number) => {
      try {
        setLoading(true);
        const data = await api.get<MSTCurrentStageData>(
          `/mst/session/${sessionId}/current-stage`
        );
        setStageData(data);
        setCurrentIndex(0);
        setStageAnswers({});
        setFlaggedItems({});
        stageStartTimeRef.current = Date.now();
        answerTimingsRef.current = {};
      } catch (error: any) {
        Swal.fire({
          title: "เกิดข้อผิดพลาด",
          text: error.message || "ไม่สามารถโหลดข้อสอบได้",
          icon: "error",
          confirmButtonColor: "#ef4444",
        }).then(() => {
          router.push("/user/mst-exam");
        });
      } finally {
        setLoading(false);
      }
    },
    [router]
  );

  useEffect(() => {
    if (sessionIdStr) {
      loadCurrentStage(parseInt(sessionIdStr, 10));
    } else {
      router.push("/user/mst-exam");
    }
  }, [sessionIdStr, loadCurrentStage, router]);

  const currentItem = stageData?.stage_items?.[currentIndex] || null;

  const handleSelectOption = useCallback(
    (optionId: number) => {
      if (!currentItem) return;
      setStageAnswers((prev) => ({
        ...prev,
        [currentItem.item_id]: optionId,
      }));
      answerTimingsRef.current[currentItem.item_id] =
        Date.now() - stageStartTimeRef.current;
    },
    [currentItem]
  );

  const toggleFlag = useCallback((itemId: number) => {
    setFlaggedItems((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  }, []);

  // Submit Stage
  const handleSubmitStage = async () => {
    if (!stageData) return;

    const totalItems = stageData.stage_items.length;
    const answeredCount = Object.keys(stageAnswers).length;
    const unansweredCount = totalItems - answeredCount;

    let confirmText = `คุณต้องการส่งคำตอบ Stage ${stageData.current_stage} ทั้งหมด ${answeredCount}/${totalItems} ข้อ และประมวลผลด่านถัดไปใช่หรือไม่?`;
    if (unansweredCount > 0) {
      confirmText = `⚠️ คุณยังมีข้อสอบที่ยังไม่ได้ตอบอีก ${unansweredCount} ข้อในด่านนี้ ต้องการยืนยันที่จะส่งคำตอบและไปด่านถัดไปหรือไม่? (ข้อที่ไม่ตอบจะนับเป็นไม่ถูกต้อง)`;
    }

    const result = await Swal.fire({
      title: `ยืนยันการส่งคำตอบ Stage ${stageData.current_stage}`,
      text: confirmText,
      icon: unansweredCount > 0 ? "warning" : "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยันส่งคำตอบ",
      cancelButtonText: "กลับไปทำต่อ",
      confirmButtonColor: "#4f46e5",
      cancelButtonColor: "#94a3b8",
    });

    if (!result.isConfirmed) return;

    setSubmittingStage(true);
    try {
      const answersPayload = stageData.stage_items.map((item) => ({
        item_id: item.item_id,
        selected_option_id: stageAnswers[item.item_id] ?? -1,
        response_time_ms: answerTimingsRef.current[item.item_id] ?? 0,
      }));

      const body = {
        session_id: stageData.session_id,
        stage_number: stageData.current_stage,
        answers: answersPayload,
      };

      const data = await api.post<any>("/mst/submit-stage", body);

      if (data.finished) {
        await Swal.fire({
          title: "สอบเสร็จสิ้น!",
          text: "คุณทำข้อสอบครบทุกด่านแล้ว กำลังนำท่านไปยังหน้ารายงานผลการสอบ...",
          icon: "success",
          timer: 2000,
          showConfirmButton: false,
        });
        router.push(`/user/mst-exam/result/${stageData.session_id}`);
      } else {
        await Swal.fire({
          title: `เข้าสู่ Stage ${data.current_stage}!`,
          text: `ระบบได้ปรับระดับความยากและจัดชุดข้อสอบ Stage ${data.current_stage} ให้คุณเรียบร้อยแล้ว`,
          icon: "success",
          confirmButtonColor: "#4f46e5",
          confirmButtonText: "เริ่มทำด่านต่อไป",
        });
        await loadCurrentStage(stageData.session_id);
      }
    } catch (error: any) {
      Swal.fire({
        title: "เกิดข้อผิดพลาด",
        text: error.message || "เกิดข้อผิดพลาดในการส่งคำตอบ",
        icon: "error",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setSubmittingStage(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          กำลังเตรียมข้อสอบ MST...
        </p>
      </div>
    );
  }

  if (!stageData || stageData.stage_items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h2 className="text-lg font-semibold text-slate-800 dark:text-white">
          ไม่พบรายการข้อสอบในด่านนี้
        </h2>
        <button
          onClick={() => router.push("/user/mst-exam")}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm"
        >
          กลับหน้าหลัก
        </button>
      </div>
    );
  }

  const totalStageItems = stageData.stage_items.length;
  const answeredCount = Object.keys(stageAnswers).length;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar_user />

      {/* Sticky Header */}
      <MSTStageHeader
        currentStage={stageData.current_stage}
        totalStages={stageData.total_stages}
        elapsedTime={elapsedTime}
        totalQuestions={totalStageItems}
        answeredCount={answeredCount}
        submittingStage={submittingStage}
        onSubmitStage={handleSubmitStage}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Question & Controls (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {currentItem && (
              <MSTQuestionCard
                item={currentItem}
                questionNumber={currentIndex + 1}
                selectedOptionId={stageAnswers[currentItem.item_id]}
                isFlagged={Boolean(flaggedItems[currentItem.item_id])}
                onSelectOption={handleSelectOption}
                onToggleFlag={() => toggleFlag(currentItem.item_id)}
                onPreviewImage={(url) => setPreviewImage(url)}
              />
            )}

            {/* Navigation Bottom Controls */}
            <div className="flex items-center justify-between gap-4 pt-2">
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>ข้อก่อนหน้า</span>
              </button>

              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                ข้อ {currentIndex + 1} จาก {totalStageItems}
              </span>

              {currentIndex < totalStageItems - 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    setCurrentIndex((prev) =>
                      Math.min(totalStageItems - 1, prev + 1)
                    )
                  }
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium shadow-xs transition cursor-pointer"
                >
                  <span>ข้อถัดไป</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitStage}
                  disabled={submittingStage}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium shadow-xs transition cursor-pointer disabled:opacity-50"
                >
                  <span>ส่งคำตอบ Stage {stageData.current_stage}</span>
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Question Drawer / Matrix (4 cols) */}
          <aside className="lg:col-span-4 sticky top-24 space-y-6">
            <MSTQuestionDrawer
              items={stageData.stage_items}
              currentIndex={currentIndex}
              stageAnswers={stageAnswers}
              flaggedItems={flaggedItems}
              onSelectIndex={(index) => setCurrentIndex(index)}
            />
          </aside>
        </div>
      </main>

      <Footer />

      {/* Image Zoom Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl p-2"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full z-10 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="preview"
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default function MSTExamPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-12 flex flex-col items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            กำลังโหลดหน้าระบบข้อสอบ MST...
          </p>
        </div>
      }
    >
      <MSTExamContent />
    </Suspense>
  );
}
