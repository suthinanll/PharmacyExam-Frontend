"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useRef } from "react";
import { ChevronLeft, Plus, X, Calendar, CheckCircle2, Save, Send } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";
import { useAuth } from "@/contexts/AuthContext";

const CATEGORY_OPTIONS = [
  { label: "PLE-IP1, PC1, PHCP1", value: "PLE-IP1, PC1, PHCP1", color: "bg-emerald-50 text-emerald-700 border-emerald-300" },
  { label: "PLE-IP2",              value: "PLE-IP2",              color: "bg-teal-50 text-teal-700 border-teal-300" },
  { label: "PLE-PC2",              value: "PLE-PC2",              color: "bg-green-50 text-green-700 border-green-300" },
  { label: "PLE-PHCP2",            value: "PLE-PHCP2",            color: "bg-lime-50 text-lime-700 border-lime-300" },
];

interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type_event: string[];
}

function Page() {
  const { getToken } = useAuth();
  const idCounterRef = useRef(1);

  const [events, setEvents] = useState<CalendarEvent[]>([
    { id: Date.now(), title: "", description: "", startDate: "", endDate: "", type_event: [] },
  ]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const addNewEvent = () => {
    idCounterRef.current += 1;
    setEvents([...events, {
      id: Date.now() + idCounterRef.current,
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      type_event: [],
    }]);
  };

  const removeEvent = (id: number) => {
    if (events.length > 1) setEvents(events.filter((e) => e.id !== id));
  };

  const updateEvent = (id: number, field: keyof CalendarEvent, value: any) => {
    setEvents(events.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  const toggleCategory = (eventId: number, catValue: string) => {
    setEvents(events.map((e) => {
      if (e.id !== eventId) return e;
      const next = e.type_event.includes(catValue)
        ? e.type_event.filter((v) => v !== catValue)
        : [...e.type_event, catValue];
      return { ...e, type_event: next };
    }));
  };

  const saveSchedules = async (isPublished: boolean) => {
    const token = getToken();

    // กรองเฉพาะ event ที่มี title (ไม่ว่างเปล่า)
    const validEvents = events.filter((e) => e.title && e.title.trim());

    if (validEvents.length === 0) {
      Swal.fire("ไม่มีข้อมูล", "ไม่มีกำหนดการที่สามารถบันทึกได้", "warning");
      return;
    }

    // แสดงคำเตือนถ้ามี event ที่ title ว่าง
    const emptyCount = events.length - validEvents.length;
    if (emptyCount > 0) {
      const result = await Swal.fire({
        title: "พบข้อมูลไม่ครบ",
        html: `มีกำหนดการที่ไม่มีชื่อ ${emptyCount} รายการ<br/>จะข้ามรายการเหล่านี้และบันทึกเฉพาะ ${validEvents.length} รายการที่สมบูรณ์<br/><br/>ต้องการดำเนินการต่อหรือไม่?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "ดำเนินการต่อ",
        cancelButtonText: "ยกเลิก"
      });

      if (!result.isConfirmed) return;
    }

    const isValid = validEvents.every((e) => e.startDate && e.type_event.length > 0);
    if (!isValid && isPublished) {
      Swal.fire("ข้อมูลไม่ครบ", "กรุณาระบุวันที่และเลือกประเภทหลักสูตรให้ครบทุกรายการ", "warning");
      return;
    }

    try {
      Swal.fire({
        title: isPublished ? "กำลังเผยแพร่..." : "กำลังบันทึกร่าง...",
        html: `กำลังบันทึก 0/${validEvents.length} รายการ`,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      // แบ่งเป็น batch ละ 3 รายการ (ลดลงอีก)
      const BATCH_SIZE = 3;
      let successCount = 0;
      let failCount = 0;
      const errors: any[] = [];

      for (let i = 0; i < validEvents.length; i += BATCH_SIZE) {
        const batch = validEvents.slice(i, i + BATCH_SIZE);

        const responses = await Promise.all(
          batch.map(async (e) => {
            try {
              const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                  title: e.title,
                  description: e.description,
                  startDate: e.startDate,
                  endDate: e.endDate || e.startDate,
                  is_public: isPublished,
                  type_event: e.type_event,
                }),
              });

              if (!res.ok) {
                const errorText = await res.text();
                errors.push({
                  title: e.title,
                  status: res.status,
                  message: errorText,
                });
                console.error(`Failed to save "${e.title}":`, res.status, errorText);
              }

              return res;
            } catch (err) {
              errors.push({
                title: e.title,
                error: String(err),
              });
              console.error(`Network error for "${e.title}":`, err);
              return { ok: false };
            }
          })
        );

        // นับผลลัพธ์
        responses.forEach(r => {
          if (r && r.ok) successCount++;
          else failCount++;
        });

        // อัพเดทความคืบหน้า
        Swal.update({
          html: `กำลังบันทึก ${successCount + failCount}/${validEvents.length} รายการ<br/>สำเร็จ: ${successCount}, ล้มเหลว: ${failCount}`
        });

        // รอ 2000ms (2 วินาที) ก่อน batch ถัดไป เพื่อหลีกเลี่ยง rate limit
        if (i + BATCH_SIZE < validEvents.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // แสดง error log
      if (errors.length > 0) {
        console.error("=== บันทึกล้มเหลว ===");
        console.table(errors);
      }

      if (failCount === 0) {
        await Swal.fire({
          title: "สำเร็จ",
          text: `บันทึกข้อมูลครบทั้ง ${successCount} รายการ`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
        window.location.href = "/admin/manage_calendar";
      } else {
        // Find the first failed response and extract error message
        const failedResponse = responses.find((r) => !r.ok);
        if (failedResponse) {
          const errorData = await failedResponse.json();
          throw new Error(errorData.message || "ไม่สามารถบันทึกข้อมูลได้");
        }
        throw new Error("ไม่สามารถบันทึกข้อมูลได้");
      }
    } catch (error: any) {
      Swal.fire("เกิดข้อผิดพลาด", error.message || "ไม่สามารถบันทึกข้อมูลได้", "error");
    }
  };

  const handleGenerateFromPdf = async () => {
    if (!pdfFile) return;
    const token = getToken();
    const formData = new FormData();
    formData.append("file", pdfFile);
    try {
      Swal.fire({ title: "AI กำลังประมวลผล...", text: "กำลังดึงข้อมูลจาก PDF", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      Swal.close();
      if (data) {
        const existing = events.filter((e) => e.title.trim());
        const baseTime = Date.now();
        const newEvents = data.map((e: any, idx: number) => ({
          id: baseTime + idx,
          title: e.title || "",
          description: e.description || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
          type_event: e.type_event || [],
        }));
        setEvents([...existing, ...newEvents]);
        setPdfFile(null);
      }
    } catch {
      Swal.fire("ผิดพลาด", "ไม่สามารถประมวลผล PDF ได้", "error");
    }
  };

  return (
    <Navbar_admin>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 pb-32">

        {/* ── Header ──────────────────────────────────────────────── */}
        <div className="mb-8">
          <Link href="/admin/manage_calendar" className="inline-flex items-center gap-1.5 text-emerald-600 hover:text-emerald-700 mb-5 text-sm font-medium transition-colors">
            <ChevronLeft className="w-4 h-4" /> กลับสู่หน้าจัดการ
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">เพิ่มกำหนดการใหม่</h1>
              <p className="text-gray-500 mt-1 text-sm">ดึงข้อมูลด้วย AI หรือเพิ่มด้วยตนเอง</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => saveSchedules(false)}
                className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-semibold text-gray-600 transition-all shadow-sm"
              >
                <Save className="w-4 h-4" /> บันทึกร่าง
              </button>
              <button
                onClick={addNewEvent}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 text-sm font-semibold transition-all shadow-md shadow-emerald-100"
              >
                <Plus className="w-4 h-4" /> เพิ่มช่องใหม่
              </button>
            </div>
          </div>
        </div>

        {/* ── PDF Import ───────────────────────────────────────────── */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-6 mb-8 shadow-sm">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            นำเข้าข้อมูลด้วย AI จากไฟล์ PDF
          </h3>
          <div className="flex flex-col sm:flex-row gap-4">
            <label className="flex-1 flex flex-col items-center justify-center h-28 border-2 border-dashed border-emerald-200 rounded-xl cursor-pointer bg-emerald-50/30 hover:bg-emerald-50 transition-all">
              <p className="text-sm text-gray-600 mb-0.5">
                {pdfFile
                  ? <span className="font-semibold text-emerald-700">{pdfFile.name}</span>
                  : "คลิกเพื่อเลือกไฟล์ PDF"}
              </p>
              <p className="text-xs text-gray-400">ระบบจะดึงชื่อ วันที่ และประเภทให้อัตโนมัติ</p>
              <input type="file" className="hidden" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
            </label>
            <button
              onClick={handleGenerateFromPdf}
              disabled={!pdfFile}
              className={`sm:w-44 py-3 rounded-xl text-sm font-semibold transition-all
                ${pdfFile
                  ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md shadow-emerald-100"
                  : "bg-gray-100 text-gray-400 cursor-not-allowed"}`}
            >
              ประมวลผลด้วย AI
            </button>
          </div>
        </div>

        {/* ── Event Forms ───────────────────────────────────────────── */}
        <div className="space-y-5">
          {events.map((event, index) => (
            <div key={event.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
              {/* Card header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-emerald-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <span className="font-semibold text-gray-700 text-sm">รายละเอียดกำหนดการ</span>
                </div>
                {events.length > 1 && (
                  <button
                    onClick={() => removeEvent(event.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="space-y-5">
                {/* Title + Dates */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      ชื่อกำหนดการ <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={event.title}
                      onChange={(e) => updateEvent(event.id, "title", e.target.value)}
                      placeholder="เช่น เปิดระบบรับสมัครสอบ"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        วันเริ่มต้น <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        <input
                          type="date"
                          value={event.startDate}
                          onChange={(e) => updateEvent(event.id, "startDate", e.target.value)}
                          className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">วันสิ้นสุด</label>
                      <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        <input
                          type="date"
                          value={event.endDate}
                          onChange={(e) => updateEvent(event.id, "endDate", e.target.value)}
                          className="w-full pl-10 pr-3 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">รายละเอียดเพิ่มเติม</label>
                  <textarea
                    rows={2}
                    value={event.description}
                    onChange={(e) => updateEvent(event.id, "description", e.target.value)}
                    placeholder="รายละเอียดกิจกรรม..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none text-sm resize-none"
                  />
                </div>

                {/* Categories */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ประเภทหลักสูตร <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {CATEGORY_OPTIONS.map((cat) => {
                      const selected = event.type_event.includes(cat.value);
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => toggleCategory(event.id, cat.value)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left text-xs font-semibold transition-all
                            ${selected ? `${cat.color} shadow-sm` : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"}`}
                        >
                          <span className="leading-tight">{cat.label}</span>
                          {selected && <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Floating Footer ───────────────────────────────────────── */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-gray-200 px-4 py-4 z-50 shadow-xl">
          <div className="max-w-5xl mx-auto flex justify-between items-center">
            <p className="hidden sm:block text-sm text-gray-500">
              ทั้งหมด <span className="font-bold text-emerald-600">{events.length}</span> รายการ
            </p>
            <div className="flex gap-3 w-full sm:w-auto">
              <Link
                href="/admin/manage_calendar"
                className="flex-1 sm:flex-none text-center px-6 py-3 text-gray-500 font-semibold hover:bg-gray-100 rounded-xl text-sm transition-colors border border-gray-200"
              >
                ยกเลิก
              </Link>
              <button
                onClick={() => saveSchedules(true)}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 shadow-lg shadow-emerald-100 transition-all active:scale-95 text-sm"
              >
                <Send className="w-4 h-4" /> บันทึกและเผยแพร่
              </button>
            </div>
          </div>
        </div>
      </div>
    </Navbar_admin>
  );
}

export default Page;