"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState } from "react";
import { ChevronLeft, Plus, X, Calendar } from "lucide-react";
import Link from "next/link";

interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  file?: File | null;
}

function Page() {
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: 1,
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      file: null,
    },
  ]);
  // State ใหม่สำหรับเก็บไฟล์ PDF ที่อัปโหลดรอการประมวลผล
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const addNewEvent = () => {
    const newEvent: CalendarEvent = {
      id: Date.now(),
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      file: null,
    };
    setEvents([...events, newEvent]);
  };

  const removeEvent = (id: number) => {
    if (events.length > 1) {
      setEvents(events.filter((event) => event.id !== id));
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateEvent = (id: number, field: keyof CalendarEvent, value: any) => {
    setEvents(
      events.map((event) =>
        event.id === id ? { ...event, [field]: value } : event
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // ตรวจสอบข้อมูล
    const isValid = events.every(
      (event) =>
        event.title.trim() !== "" &&
        event.startDate !== "" &&
        event.endDate !== ""
    );

    if (!isValid) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน (ชื่อกำหนดการ และวันที่)");
      return;
    }

    // ส่งข้อมูลไปยัง API
    console.log("Events to submit:", events);
    alert("บันทึกกำหนดการเรียบร้อยแล้ว");
  };

  const handleSaveDraft = () => {
    console.log("Save as draft:", events);
    alert("บันทึกแบบร่างเรียบร้อยแล้ว");
  };

  // ฟังก์ชันใหม่สำหรับประมวลผล PDF และเพิ่มกำหนดการอัตโนมัติ
  const handleGenerateFromPdf = async () => {
    if (!pdfFile) {
      alert("กรุณาเลือกไฟล์ PDF ก่อน");
      return;
    }

    const formData = new FormData();
    formData.append("file", pdfFile);

    try {
      // แสดงสถานะกำลังโหลด
      alert("กำลังประมวลผลไฟล์ PDF...");

      // เรียก API เพื่อประมวลผล
      const res = await fetch("http://localhost:5000/api/calendar/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();

      if (data.events && Array.isArray(data.events)) {
        // กรองกำหนดการแรกออกถ้าว่างเปล่าก่อนเพิ่มรายการใหม่
        const filteredEvents = events.filter(e => e.title.trim() !== "" || e.startDate !== "");

        // เพิ่มกำหนดการที่ได้จาก PDF
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newEventsFromPdf: CalendarEvent[] = data.events.map((e: any) => ({
          id: Date.now() + Math.random(), // ใช้ ID ที่ไม่ซ้ำกัน
          title: e.title || "กำหนดการใหม่",
          description: e.description || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
          file: null,
        }));

        setEvents([...filteredEvents, ...newEventsFromPdf]);
        setPdfFile(null); // เคลียร์ไฟล์หลังจากประมวลผล
        alert(`เพิ่มกำหนดการจาก PDF สำเร็จ (${newEventsFromPdf.length} รายการ)`);
      } else {
        alert("ไม่พบกำหนดการในไฟล์ PDF หรือข้อมูลไม่ถูกต้อง");
      }
    } catch (error) {
      console.error("Error processing PDF:", error);
      alert("เกิดข้อผิดพลาดในการประมวลผลไฟล์ PDF");
    }
  };


  return (
    <Navbar_admin>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="mb-6">
          <Link
            href="/admin/manage_calendar"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-4 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">กลับ</span>
          </Link>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-2">
                เพิ่มกำหนดการณ์
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                จัดการเพิ่มกำหนดการณ์ เพิ่ม แก้ไข ลบ
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 sm:px-6 py-2.5 sm:py-3 border border-green-600 text-green-600 hover:bg-green-50 rounded-lg transition-colors font-medium text-sm sm:text-base"
              >
                บันทึกแบบร่าง
              </button>
              <button
                type="button"
                onClick={addNewEvent}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                เพิ่มกำหนดการ
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            อัปโหลดปฏิทิน PDF เพื่อสร้างกำหนดการอัตโนมัติ
          </h3>

          <div className="sm:flex-row gap-4 items-end">
            {/* Input & File Info */}
            <div className="flex-grow w-full">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                เลือกไฟล์ปฏิทิน PDF
              </label>

              {/* กล่องอัปโหลดแบบ label + input hidden */}
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all">
                <div className="text-center">
                  <Calendar className="mx-auto h-10 w-10 text-green-500 mb-2" />
                  <p className="text-sm text-gray-700">
                    {pdfFile ? (
                      <>
                        📄 <span className="font-medium text-green-700">{pdfFile.name}</span>
                        <span className="text-gray-500 ml-1">
                          ({(pdfFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </>
                    ) : (
                      <>
                        คลิกเพื่อเลือกไฟล์
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    รองรับเฉพาะ PDF (สูงสุด 10MB)
                  </p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={handleGenerateFromPdf}
              disabled={!pdfFile}
              className={`mt-5 ml-auto flex-shrink-0 flex items-center  gap-2 px-6 py-3 rounded-lg font-medium text-sm sm:text-base w-full sm:w-auto transition-colors ${pdfFile
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                : "bg-gray-300 text-gray-600 cursor-not-allowed"
                }`}
            >
              <Calendar className="w-5 h-5" />
              สร้างกำหนดการอัตโนมัติ
            </button>


          </div>
        </div>


        {/* ------------------------------------------------------------- */}


        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {events.map((event, index) => (
            <div
              key={event.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  กำหนดการที่ {index + 1}
                </h3>
                {events.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeEvent(event.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="ลบกำหนดการ"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อกำหนดการณ์ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={event.title}
                    onChange={(e) =>
                      updateEvent(event.id, "title", e.target.value)
                    }
                    placeholder="เช่น ทำแบบทดสอบหน้าแรก"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm sm:text-base"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รายละเอียด
                  </label>
                  <textarea
                    value={event.description}
                    onChange={(e) =>
                      updateEvent(event.id, "description", e.target.value)
                    }
                    placeholder="รายละเอียดเกี่ยวกับกำหนดการณ์"
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm sm:text-base resize-none"
                  />
                  <div className="text-right mt-1">
                    <span className="text-xs text-gray-500">
                      {event.description.length}/500
                    </span>
                  </div>
                </div>

                {/* Date Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      วันที่เริ่มต้น <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={event.startDate}
                        onChange={(e) =>
                          updateEvent(event.id, "startDate", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm sm:text-base"
                        required
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      วันที่สิ้นสุด <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={event.endDate}
                        onChange={(e) =>
                          updateEvent(event.id, "endDate", e.target.value)
                        }
                        min={event.startDate}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all text-sm sm:text-base"
                        required
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end sticky bottom-0 bg-gray-50 py-4 border-t border-gray-200">
            <Link
              href="/admin/manage_calendar"
              className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium text-center"
            >
              ยกเลิก
            </Link>
            <button
              type="submit"
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium shadow-sm"
            >
              บันทึกกำหนดการ ({events.length} รายการ)
            </button>
          </div>
        </form>
      </div>
    </Navbar_admin>
  );
}

export default Page;