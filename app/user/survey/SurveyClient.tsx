'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, ArrowRight, CheckCircle2, ClipboardList, Loader2, Lock, Send, ZoomIn } from 'lucide-react';
import Navbar_user from '@/components/Navbar_user';
import Footer from '@/components/Footer';
import ImagePreviewModal from '@/components/ImagePreviewModal';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import Swal from '@/utils/sweetalert';
import { useAuth } from '@/contexts/AuthContext';
import {
  emptyAnswers,
  isQuestionVisible,
  type ChoiceQuestion,
  type LikertGroup,
  type SurveyAnswers,
  type SurveyDefinition,
} from '@/lib/survey';

type Status = 'loading' | 'error' | 'closed' | 'responded' | 'form' | 'done';

/** ขั้นของฟอร์ม — ส่วนที่ 2 แบ่ง 2 หน้าเหมือน Google Form ต้นฉบับ */
const STEPS = [
  { key: 'consent', label: 'ชี้แจง' },
  { key: 'demographics', label: 'ส่วนที่ 1' },
  { key: 'likert1', label: 'ส่วนที่ 2' },
  { key: 'likert2', label: 'ส่วนที่ 2 (ต่อ)' },
  { key: 'ranking', label: 'ส่วนที่ 3–4' },
] as const;

const API = process.env.NEXT_PUBLIC_API_URL;

export default function SurveyClient() {
  const { getToken, user } = useAuth();
  const [status, setStatus] = useState<Status>('loading');
  const [definition, setDefinition] = useState<SurveyDefinition | null>(null);
  const [answers, setAnswers] = useState<SurveyAnswers>(emptyAnswers);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const topRef = useRef<HTMLDivElement>(null);
  // ภาพหน้าจอฟังก์ชันในส่วนที่ 3 ที่กดดูขนาดเต็ม
  const [preview, setPreview] = useState<{ src: string; alt: string } | null>(null);

  // ร่างคำตอบเก็บในเบราว์เซอร์ ปิดหน้าแล้วกลับมาทำต่อได้ (ลบทิ้งเมื่อส่งสำเร็จ)
  const draftKey = user ? `pe-survey-draft-${user.user_id}` : null;

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API}/survey`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => (res.ok ? res.json() : Promise.reject(res)))
      .then((data: { isOpen: boolean; hasResponded: boolean; definition: SurveyDefinition }) => {
        setDefinition(data.definition);
        if (data.hasResponded) return setStatus('responded');
        if (!data.isOpen) return setStatus('closed');
        setStatus('form');
      })
      .catch(() => setStatus('error'));
  }, [getToken]);

  useEffect(() => {
    if (!draftKey || status !== 'form') return;
    try {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setAnswers({ ...emptyAnswers(), ...parsed.answers });
        setStep(Math.min(parsed.step ?? 0, STEPS.length - 1));
      }
    } catch {
      // ร่างเสียหรืออ่าน localStorage ไม่ได้ — เริ่มใหม่
    }
  }, [draftKey, status]);

  useEffect(() => {
    if (!draftKey || status !== 'form') return;
    try {
      localStorage.setItem(draftKey, JSON.stringify({ answers, step }));
    } catch {
      // โหมดส่วนตัวบางเบราว์เซอร์เขียนไม่ได้ — ไม่เป็นไร
    }
  }, [answers, step, draftKey, status]);

  const goTo = useCallback((next: number) => {
    setStep(next);
    setErrors({});
    topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const likertPages = useMemo(
    () => [1, 2].map((p) => definition?.likertGroups.filter((g) => g.page === p) ?? []),
    [definition],
  );

  const setDemo = (id: string, value: string | string[]) =>
    setAnswers((a) => ({ ...a, demographics: { ...a.demographics, [id]: value } }));

  /** ตรวจขั้นปัจจุบัน — คืน true ถ้าไปต่อได้ */
  const validateStep = async (): Promise<boolean> => {
    if (!definition) return false;
    const key = STEPS[step].key;

    if (key === 'consent' && !answers.consent) {
      setErrors({ consent: 'กรุณาทำเครื่องหมายยินยอมก่อนเริ่มทำแบบประเมิน' });
      return false;
    }

    if (key === 'demographics') {
      const next: Record<string, string> = {};
      for (const q of definition.demographics) {
        if (!isQuestionVisible(q, answers.demographics)) continue;
        const v = answers.demographics[q.id];
        const empty = v === undefined || v === '' || (Array.isArray(v) && v.length === 0);
        if (q.required && empty) next[q.id] = 'กรุณาเลือกคำตอบ';
        if (q.otherValue && v === q.otherValue && !String(answers.demographics[`${q.id}Other`] ?? '').trim()) {
          next[q.id] = 'กรุณาระบุรายละเอียด';
        }
      }
      setErrors(next);
      if (Object.keys(next).length) {
        document.getElementById(`q-${Object.keys(next)[0]}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return false;
      }
    }

    if (key === 'likert1' || key === 'likert2') {
      const groups = likertPages[key === 'likert1' ? 0 : 1];
      const missing = groups.flatMap((g) => g.items).filter((i) => answers.likert[i.id] === undefined);
      if (missing.length) {
        // เอกสารชี้แจงระบุว่าข้ามข้อที่ไม่ต้องการตอบได้ จึงแค่ถามยืนยัน
        const r = await Swal.fire({
          icon: 'question',
          title: `ยังไม่ได้ตอบ ${missing.length} ข้อ`,
          text: 'ต้องการข้ามข้อที่ยังไม่ได้ตอบหรือไม่',
          showCancelButton: true,
          confirmButtonText: 'ข้ามไปต่อ',
          cancelButtonText: 'กลับไปตอบ',
          reverseButtons: true,
        });
        if (!r.isConfirmed) {
          document.getElementById(`likert-${missing[0].id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return false;
        }
      }
    }
    return true;
  };

  const next = async () => {
    if (await validateStep()) goTo(step + 1);
  };

  const submit = async () => {
    if (!definition) return;
    const confirm = await Swal.fire({
      icon: 'question',
      title: 'ส่งแบบประเมิน?',
      text: 'ส่งแล้วจะแก้ไขคำตอบไม่ได้',
      showCancelButton: true,
      confirmButtonText: 'ส่งแบบประเมิน',
      cancelButtonText: 'ตรวจทานอีกครั้ง',
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;

    setSubmitting(true);
    try {
      // ส่งเฉพาะคำตอบของข้อที่แสดงอยู่ (เช่น เปลี่ยนข้อ 5 เป็น "ไม่เคย" แล้ว ข้อ 6 ไม่ต้องส่ง)
      const demographics: SurveyAnswers['demographics'] = {};
      for (const q of definition.demographics) {
        if (!isQuestionVisible(q, answers.demographics)) continue;
        const v = answers.demographics[q.id];
        if (v !== undefined && v !== '') demographics[q.id] = v;
        if (q.otherValue && v === q.otherValue) demographics[`${q.id}Other`] = answers.demographics[`${q.id}Other`] ?? '';
      }

      const res = await fetch(`${API}/survey/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ answers: { ...answers, demographics } }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 409) {
        setStatus('responded');
        return;
      }
      if (!res.ok) throw new Error(Array.isArray(data.message) ? data.message[0] : data.message);

      try {
        if (draftKey) localStorage.removeItem(draftKey);
      } catch {
        // ไม่เป็นไร
      }
      setStatus('done');
      topRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'ส่งแบบประเมินไม่สำเร็จ',
        text: err instanceof Error && err.message ? err.message : 'กรุณาลองใหม่อีกครั้ง',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const declineConsent = async () => {
    await Swal.fire({
      icon: 'info',
      title: 'ขอบคุณที่สละเวลา',
      text: 'ท่านเลือกไม่เข้าร่วมการวิจัย ระบบจะไม่บันทึกข้อมูลใด ๆ',
      confirmButtonText: 'กลับหน้าหลัก',
    });
    window.location.href = '/user';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar_user />

      <main className="flex-grow p-4 md:p-6 lg:p-8">
        <div className="max-w-3xl mx-auto scroll-mt-24" ref={topRef}>
          <div className="flex items-center text-sm text-gray-500 mb-5">
            <Link href="/user" className="hover:text-green-600 transition">หน้าหลัก</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-600 font-medium">แบบประเมินความพึงพอใจ</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">แบบประเมินความพึงพอใจ</h1>
          <p className="text-sm text-gray-600 mb-6">
            {definition?.title ?? 'ความคิดเห็นของท่านช่วยให้เราพัฒนาระบบเภสัชพร้อมสอบให้ดียิ่งขึ้น'}
          </p>

          {status === 'loading' && (
            <div className="flex justify-center pt-12">
              <LoadingSpinner size="lg" text="กำลังโหลดแบบประเมิน..." />
            </div>
          )}

          {status === 'error' && (
            <StateCard icon={ClipboardList} title="โหลดแบบประเมินไม่สำเร็จ" text="กรุณารีเฟรชหน้านี้อีกครั้ง" />
          )}
          {status === 'closed' && (
            <StateCard icon={Lock} title="ขณะนี้ปิดรับคำตอบแบบประเมิน" text="ขอบคุณที่สนใจ กรุณากลับมาใหม่ภายหลัง" />
          )}
          {status === 'responded' && (
            <StateCard icon={CheckCircle2} tone="success" title="ท่านได้ส่งแบบประเมินแล้ว" text="ขอบคุณสำหรับความคิดเห็นของท่าน" />
          )}
          {status === 'done' && (
            <StateCard
              icon={CheckCircle2}
              tone="success"
              title="ส่งแบบประเมินเรียบร้อยแล้ว"
              text="ขอบคุณที่สละเวลาตอบแบบประเมิน ความคิดเห็นของท่านจะถูกนำไปพัฒนาระบบต่อไป"
            />
          )}

          {status === 'form' && definition && (
            <>
              <Stepper current={step} />

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-8">
                {STEPS[step].key === 'consent' && (
                  <ConsentStep
                    definition={definition}
                    checked={answers.consent}
                    error={errors.consent}
                    onChange={(consent) => {
                      setAnswers((a) => ({ ...a, consent }));
                      setErrors({});
                    }}
                  />
                )}

                {STEPS[step].key === 'demographics' && (
                  <section className="space-y-7">
                    <SectionHeader title="ส่วนที่ 1 ข้อมูลทั่วไปของผู้ตอบแบบสอบถาม" description="กรุณาเลือกคำตอบที่ตรงกับท่าน" />
                    {definition.demographics
                      .filter((q) => isQuestionVisible(q, answers.demographics))
                      .map((q) => (
                        <ChoiceField
                          key={q.id}
                          question={q}
                          value={answers.demographics[q.id]}
                          otherText={String(answers.demographics[`${q.id}Other`] ?? '')}
                          error={errors[q.id]}
                          onChange={(v) => setDemo(q.id, v)}
                          onOtherChange={(t) => setDemo(`${q.id}Other`, t)}
                        />
                      ))}
                  </section>
                )}

                {(STEPS[step].key === 'likert1' || STEPS[step].key === 'likert2') && (
                  <section className="space-y-8">
                    <SectionHeader
                      title={`ส่วนที่ 2 ปัจจัยการยอมรับการใช้เว็บไซต์${STEPS[step].key === 'likert2' ? ' (ต่อ)' : ''}`}
                      description={`เลือกระดับความคิดเห็น 1–5 (1 = ${definition.likertScale.labels[0]}, 5 = ${definition.likertScale.labels[4]})`}
                    />
                    {likertPages[STEPS[step].key === 'likert1' ? 0 : 1].map((g) => (
                      <LikertGroupField
                        key={g.id}
                        group={g}
                        labels={definition.likertScale.labels}
                        values={answers.likert}
                        onChange={(id, v) => setAnswers((a) => ({ ...a, likert: { ...a.likert, [id]: v } }))}
                      />
                    ))}
                  </section>
                )}

                {STEPS[step].key === 'ranking' && (
                  <section className="space-y-8">
                    <SectionHeader
                      title="ส่วนที่ 3 ความพึงพอใจต่อฟังก์ชันการทำงานของระบบ"
                      description="เลือกลำดับความชอบให้แต่ละฟังก์ชัน 1 = ชอบมากที่สุด ถึง 5 = ชอบน้อยที่สุด (ตัวเลขในกลุ่มเดียวกันห้ามซ้ำ)"
                    />
                    {definition.rankingGroups.map((g) => (
                      <div key={g.id}>
                        <h3 className="text-base font-medium text-gray-900 mb-3">{g.title}</h3>
                        <div className="space-y-2">
                          {g.items.map((item) => {
                            const ranks = answers.ranking[g.id] ?? {};
                            const used = new Set(Object.entries(ranks).filter(([k]) => k !== item.id).map(([, v]) => v));
                            return (
                              <div
                                key={item.id}
                                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-xl border border-gray-200 p-3"
                              >
                                <div className="flex flex-1 items-center gap-3 min-w-0">
                                  {item.image && (
                                    <button
                                      type="button"
                                      onClick={() => setPreview({ src: item.image!, alt: item.label })}
                                      aria-label={`ดูภาพหน้าจอ ${item.label} ขนาดเต็ม`}
                                      className="group relative w-28 sm:w-36 aspect-[16/10] shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-100 cursor-zoom-in"
                                    >
                                      <Image
                                        src={item.image}
                                        alt={`ภาพหน้าจอ ${item.label}`}
                                        fill
                                        sizes="(max-width: 640px) 112px, 144px"
                                        className="object-cover object-top transition-transform duration-200 group-hover:scale-105"
                                      />
                                      <span className="absolute bottom-1 right-1 rounded-md bg-black/60 p-0.5 text-white">
                                        <ZoomIn className="w-3.5 h-3.5" />
                                      </span>
                                    </button>
                                  )}
                                  <span className="text-sm text-gray-800">{item.label}</span>
                                </div>
                                <div className="flex gap-1.5" role="radiogroup" aria-label={`ลำดับของ ${item.label}`}>
                                  {g.items.map((_, i) => {
                                    const n = i + 1;
                                    const selected = ranks[item.id] === n;
                                    const taken = used.has(n);
                                    return (
                                      <button
                                        key={n}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        aria-label={`อันดับ ${n}`}
                                        disabled={taken}
                                        onClick={() =>
                                          setAnswers((a) => {
                                            const group = { ...(a.ranking[g.id] ?? {}) };
                                            if (selected) delete group[item.id];
                                            else group[item.id] = n;
                                            return { ...a, ranking: { ...a.ranking, [g.id]: group } };
                                          })
                                        }
                                        className={`w-9 h-9 rounded-lg text-sm font-medium border transition-colors cursor-pointer disabled:cursor-not-allowed ${
                                          selected
                                            ? 'bg-primary text-on-primary border-primary'
                                            : taken
                                              ? 'bg-gray-100 text-gray-300 border-gray-200'
                                              : 'bg-white text-gray-700 border-gray-300 hover:border-primary'
                                        }`}
                                      >
                                        {n}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    <div>
                      <SectionHeader title={`ส่วนที่ 4 ${definition.suggestion.label}`} />
                      <textarea
                        value={answers.suggestion}
                        onChange={(e) => setAnswers((a) => ({ ...a, suggestion: e.target.value }))}
                        maxLength={definition.suggestion.maxLength}
                        rows={5}
                        placeholder="พิมพ์ข้อเสนอแนะ ปัญหาที่พบ หรือสิ่งที่อยากให้เพิ่มในระบบ"
                        aria-label={definition.suggestion.label}
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                      />
                      <p className="text-xs text-gray-500 text-right mt-1">
                        {answers.suggestion.length}/{definition.suggestion.maxLength}
                      </p>
                    </div>
                  </section>
                )}

                {/* ปุ่มเปลี่ยนขั้น */}
                <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col-reverse sm:flex-row gap-3 sm:justify-between">
                  {step === 0 ? (
                    <button
                      type="button"
                      onClick={declineConsent}
                      className="px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                    >
                      ไม่ต้องการเข้าร่วมการวิจัย
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => goTo(step - 1)}
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                    >
                      <ArrowLeft className="w-4 h-4" /> ย้อนกลับ
                    </button>
                  )}

                  {step < STEPS.length - 1 ? (
                    <button
                      type="button"
                      onClick={next}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover transition shadow-sm cursor-pointer"
                    >
                      {step === 0 ? 'ยินยอมและเริ่มทำแบบประเมิน' : 'ถัดไป'} <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={submit}
                      disabled={submitting}
                      className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover transition shadow-sm disabled:opacity-60 cursor-pointer"
                    >
                      {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      ส่งแบบประเมิน
                    </button>
                  )}
                </div>
              </div>

              <p className="text-xs text-gray-500 text-center mt-4">
                ระบบบันทึกร่างคำตอบไว้ในเบราว์เซอร์นี้ ปิดหน้าแล้วกลับมาทำต่อได้
              </p>
            </>
          )}
        </div>
      </main>

      <ImagePreviewModal src={preview?.src ?? null} alt={preview?.alt} onClose={() => setPreview(null)} />

      <Footer />
    </div>
  );
}

// ─── ส่วนประกอบย่อย ─────────────────────────────────────────────────────────

function StateCard({
  icon: Icon,
  title,
  text,
  tone = 'neutral',
}: {
  icon: React.ElementType;
  title: string;
  text: string;
  tone?: 'neutral' | 'success';
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center">
      <div
        className={`w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center ${
          tone === 'success' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'
        }`}
      >
        <Icon className="w-7 h-7" />
      </div>
      <p className="text-lg font-medium text-gray-900">{title}</p>
      <p className="text-sm text-gray-600 mt-1">{text}</p>
      <Link
        href="/user"
        className="inline-block mt-6 px-5 py-2.5 rounded-xl border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
      >
        กลับหน้าหลัก
      </Link>
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-center gap-1.5 sm:gap-2 mb-5" aria-label="ความคืบหน้าแบบประเมิน">
      {STEPS.map((s, i) => (
        <li key={s.key} className="flex-1" aria-current={i === current ? 'step' : undefined}>
          <div className={`h-1.5 rounded-full ${i <= current ? 'bg-primary' : 'bg-gray-200'}`} />
          <p className={`hidden sm:block text-xs mt-1.5 ${i === current ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
            {s.label}
          </p>
        </li>
      ))}
      <li className="sm:hidden text-xs text-gray-600 whitespace-nowrap pl-1">
        {current + 1}/{STEPS.length}
      </li>
    </ol>
  );
}

function SectionHeader({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900">{title}</h2>
      {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
    </div>
  );
}

function ConsentStep({
  definition,
  checked,
  error,
  onChange,
}: {
  definition: SurveyDefinition;
  checked: boolean;
  error?: string;
  onChange: (v: boolean) => void;
}) {
  const c = definition.consent;
  return (
    <section className="space-y-4">
      <SectionHeader title={c.title} />
      <div className="max-h-[50vh] overflow-y-auto rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-5 text-sm leading-relaxed text-gray-700 space-y-3">
        {c.before.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <ol className="list-decimal pl-6 space-y-1">
          {c.activities.map((a) => (
            <li key={a}>
              <Linkify text={a} />
            </li>
          ))}
        </ol>
        {c.after.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <p className="text-xs text-gray-600 leading-relaxed">{c.pdpaNotice}</p>
      <label
        className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-colors ${
          checked ? 'border-primary bg-primary-soft' : error ? 'border-red-300' : 'border-gray-200'
        }`}
      >
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-primary)]"
        />
        <span className="text-sm text-gray-800">{c.question}</span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </section>
  );
}

/** แสดง URL ในข้อความเป็นลิงก์ที่กดได้ */
function Linkify({ text }: { text: string }) {
  const parts = text.split(/(https?:\/\/\S+)/g);
  return (
    <>
      {parts.map((part, i) =>
        /^https?:\/\//.test(part) ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline hover:text-blue-700 break-all">
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </>
  );
}

function ChoiceField({
  question: q,
  value,
  otherText,
  error,
  onChange,
  onOtherChange,
}: {
  question: ChoiceQuestion;
  value: string | string[] | undefined;
  otherText: string;
  error?: string;
  onChange: (v: string | string[]) => void;
  onOtherChange: (t: string) => void;
}) {
  const selected = (v: string) => (Array.isArray(value) ? value.includes(v) : value === v);
  const toggle = (v: string) => {
    if (q.type === 'single') return onChange(v);
    const list = Array.isArray(value) ? value : [];
    onChange(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  };

  return (
    <fieldset id={`q-${q.id}`} className="scroll-mt-24">
      <legend className="text-sm font-medium text-gray-900 mb-2.5">
        {q.label}
        {q.required && <span className="text-red-600"> *</span>}
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {q.options.map((o) => (
          <label
            key={o.value}
            className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 text-sm cursor-pointer transition-colors ${
              selected(o.value) ? 'border-primary bg-primary-soft text-gray-900' : 'border-gray-200 text-gray-700 hover:border-gray-300'
            }`}
          >
            <input
              type={q.type === 'single' ? 'radio' : 'checkbox'}
              name={q.id}
              checked={selected(o.value)}
              onChange={() => toggle(o.value)}
              className="h-4 w-4 shrink-0 accent-[var(--color-primary)]"
            />
            {o.label}
          </label>
        ))}
      </div>
      {q.otherValue && value === q.otherValue && (
        <input
          type="text"
          value={otherText}
          onChange={(e) => onOtherChange(e.target.value)}
          maxLength={100}
          placeholder="โปรดระบุ"
          aria-label={`${q.label} โปรดระบุ`}
          className="mt-2 w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
        />
      )}
      {error && <p className="text-sm text-red-600 mt-1.5">{error}</p>}
    </fieldset>
  );
}

function LikertGroupField({
  group,
  labels,
  values,
  onChange,
}: {
  group: LikertGroup;
  labels: string[];
  values: Record<string, number>;
  onChange: (itemId: string, value: number) => void;
}) {
  return (
    <div>
      <h3 className="text-base font-medium text-gray-900">{group.title}</h3>
      <p className="text-xs text-gray-600 mt-0.5 mb-3">{group.description}</p>
      <div className="space-y-2.5">
        {group.items.map((item) => (
          <fieldset
            key={item.id}
            id={`likert-${item.id}`}
            className={`rounded-xl border px-4 py-3 scroll-mt-24 ${values[item.id] ? 'border-gray-200' : 'border-gray-200 bg-gray-50/60'}`}
          >
            <legend className="sr-only">
              {item.id} {item.text}
            </legend>
            <p className="text-sm text-gray-800 mb-2.5" aria-hidden="true">
              <span className="text-gray-500 mr-1.5">{item.id}</span>
              {item.text}
            </p>
            <div className="grid grid-cols-5 gap-1.5 sm:gap-2">
              {labels.map((label, i) => {
                const score = i + 1;
                const checked = values[item.id] === score;
                return (
                  <label
                    key={score}
                    title={label}
                    className={`flex flex-col items-center justify-center gap-0.5 rounded-lg border py-2 cursor-pointer transition-colors ${
                      checked ? 'bg-primary border-primary text-on-primary' : 'border-gray-200 bg-white text-gray-700 hover:border-primary'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`likert-${item.id}`}
                      value={score}
                      checked={checked}
                      onChange={() => onChange(item.id, score)}
                      className="sr-only"
                    />
                    <span className="text-base font-medium leading-none">{score}</span>
                    <span className={`hidden sm:block text-[0.625rem] leading-tight text-center ${checked ? 'text-white/90' : 'text-gray-500'}`}>
                      {label}
                    </span>
                    <span className="sr-only sm:hidden">{label}</span>
                  </label>
                );
              })}
            </div>
            <div className="flex justify-between text-[0.625rem] text-gray-500 mt-1 sm:hidden" aria-hidden="true">
              <span>{labels[0]}</span>
              <span>{labels[labels.length - 1]}</span>
            </div>
          </fieldset>
        ))}
      </div>
    </div>
  );
}
