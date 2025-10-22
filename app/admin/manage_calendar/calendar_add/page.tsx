"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState } from "react";
import { ChevronLeft, Plus, Upload, X, Calendar } from "lucide-react";
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

  const handleFileChange = (id: number, file: File | null) => {
    updateEvent(id, "file", file);
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

                {/* File Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    อัปโหลดไฟล์เอกสารแนบ (ถ้าม)
                  </label>
                  <div className="mt-1">
                    <label
                      htmlFor={`file-upload-${event.id}`}
                      className="flex items-center justify-center w-full px-4 py-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all"
                    >
                      <div className="text-center">
                        <Upload className="mx-auto h-10 w-10 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          <span className="font-medium text-green-600">
                            คลิกเพื่ออัปโหลด
                          </span>{" "}
                          หรือลากไฟล์มาวางที่นี่
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          PDF, DOC, DOCX, JPG, PNG (สูงสุด 10MB)
                        </p>
                      </div>
                      <input
                        id={`file-upload-${event.id}`}
                        type="file"
                        className="hidden"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          handleFileChange(event.id, file);
                        }}
                      />
                    </label>
                  </div>

                  {/* Display selected file */}
                  {event.file && (
                    <div className="mt-3 flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2">
                        <Upload className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-gray-700">
                          {event.file.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({(event.file.size / 1024).toFixed(2)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleFileChange(event.id, null)}
                        className="text-red-600 hover:text-red-700 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
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