"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState } from "react";
import { ChevronLeft, Plus, X, Calendar } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

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

  const updateEvent = (id: number, field: keyof CalendarEvent, value: any) => {
    setEvents(
      events.map((event) =>
        event.id === id ? { ...event, [field]: value } : event
      )
    );
  };

  const saveSchedules = async (isPublished: boolean) => {
    const token = localStorage.getItem("access_token");

    try {
      // แสดงสถานะกำลังโหลด
      Swal.fire({
        title: isPublished ? 'กำลังบันทึกและเผยแพร่...' : 'กำลังบันทึกแบบร่าง...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const promises = events.map(event =>
        fetch("http://localhost:5000/schedules", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            title: event.title,
            description: event.description,
            start_time: event.startDate,
            end_time: event.endDate,
            is_public: isPublished // แก้ไข: เปลี่ยนจาก is_published เป็น is_public ให้ตรงกับ Backend
          })
        })
      );

      const responses = await Promise.all(promises);
      const allOk = responses.every(res => res.ok);

      if (allOk) {
        await Swal.fire({
          icon: 'success',
          title: isPublished ? 'บันทึกและเผยแพร่สำเร็จ' : 'บันทึกแบบร่างสำเร็จ',
          text: `จัดการ ${events.length} รายการเรียบร้อยแล้ว`,
          confirmButtonColor: '#16a34a'
        });
        window.location.href = "/admin/manage_calendar";
      } else {
        throw new Error("บางรายการไม่สามารถบันทึกได้");
      }
    } catch (error) {
      console.error("Save Error:", error);
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่", "error");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // ตรวจสอบความถูกต้องสำหรับบันทึกปกติ (ต้องครบทุกช่อง)
    const isValid = events.every(
      (event) => event.title.trim() !== "" && event.startDate !== "" && event.endDate !== ""
    );

    if (!isValid) {
      Swal.fire("ข้อมูลไม่ครบ", "กรุณากรอกชื่อและวันที่ให้ครบทุกรายการก่อนบันทึกจริง", "warning");
      return;
    }

    await saveSchedules(true);
  };

  const handleSaveDraft = async () => {
    const hasTitle = events.some(event => event.title.trim() !== "");
    if (!hasTitle) {
      Swal.fire("แจ้งเตือน", "กรุณาระบุชื่อกำหนดการอย่างน้อย 1 รายการเพื่อบันทึกแบบร่าง", "info");
      return;
    }

    await saveSchedules(false); // บันทึกแบบร่าง (is_public: false)
  };

  const handleGenerateFromPdf = async () => {
    if (!pdfFile) {
      Swal.fire("แจ้งเตือน", "กรุณาเลือกไฟล์ PDF ก่อน", "info");
      return;
    }
    const formData = new FormData();
    formData.append("file", pdfFile);

    try {
      Swal.fire({
        title: 'กำลังประมวลผล...',
        text: 'AI กำลังอ่านข้อมูลจาก PDF ของคุณ',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
      });

      const res = await fetch("http://localhost:5000/api/calendar/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Server Error");
      const data = await res.json();
      Swal.close();

      if (data.events && Array.isArray(data.events)) {
        const filteredEvents = events.filter(e => e.title.trim() !== "" || e.startDate !== "");
        const newEventsFromPdf: CalendarEvent[] = data.events.map((e: any) => ({
          id: Date.now() + Math.random(),
          title: e.title || "กำหนดการใหม่",
          description: e.description || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
          file: null,
        }));
        setEvents([...filteredEvents, ...newEventsFromPdf]);
        setPdfFile(null);
        Swal.fire("สำเร็จ", `ดึงข้อมูลจาก PDF ได้ ${newEventsFromPdf.length} รายการ`, "success");
      }
    } catch (error) {
      Swal.fire("ผิดพลาด", "ไม่สามารถประมวลผล PDF ได้", "error");
    }
  };

  return (
    <Navbar_admin>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20">
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
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-2">เพิ่มกำหนดการ</h1>
              <p className="text-sm sm:text-base text-gray-600">จัดการเพิ่ม แก้ไข หรือบันทึกแบบร่างกำหนดการสอบ</p>
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
                เพิ่มช่องใหม่
              </button>
            </div>
          </div>
        </div>

        {/* ส่วน PDF Upload */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">อัปโหลดปฏิทิน PDF เพื่อสร้างกำหนดการอัตโนมัติ</h3>
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-grow w-full">
              <label className="flex items-center justify-center w-full px-4 py-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all">
                <div className="text-center">
                  <Calendar className="mx-auto h-10 w-10 text-green-500 mb-2" />
                  <p className="text-sm text-gray-700">
                    {pdfFile ? <span className="font-medium text-green-700">{pdfFile.name}</span> : "คลิกเพื่อเลือกไฟล์ PDF"}
                  </p>
                </div>
                <input type="file" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="hidden" />
              </label>
            </div>
            <button
              type="button"
              onClick={handleGenerateFromPdf}
              disabled={!pdfFile}
              className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors w-full sm:w-auto ${pdfFile ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm" : "bg-gray-200 text-gray-400 cursor-not-allowed"}`}
            >
              ประมวลผล PDF
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 relative group">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">กำหนดการที่ {index + 1}</h3>
                {events.length > 1 && (
                  <button type="button" onClick={() => removeEvent(event.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ชื่อกำหนดการ <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={event.title}
                    onChange={(e) => updateEvent(event.id, "title", e.target.value)}
                    placeholder="เช่น สอบกลางภาควิชาคณิตศาสตร์"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">รายละเอียด</label>
                  <textarea
                    value={event.description}
                    onChange={(e) => updateEvent(event.id, "description", e.target.value)}
                    placeholder="รายละเอียดเพิ่มเติม..."
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none transition-all resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">วันที่เริ่มต้น</label>
                    <input type="date" value={event.startDate} onChange={(e) => updateEvent(event.id, "startDate", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">วันที่สิ้นสุด</label>
                    <input type="date" min={event.startDate} value={event.endDate} onChange={(e) => updateEvent(event.id, "endDate", e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-green-500" />
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div className="p-4 z-10 flex justify-end gap-3">
            <Link href="/admin/manage_calendar" className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg font-medium transition-colors">
              ยกเลิก
            </Link>
            <button type="submit" className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium shadow-md transition-all active:scale-95">
              บันทึกและเผยแพร่ ({events.length} รายการ)
            </button>
          </div>
        </form>
      </div>
    </Navbar_admin>
  );
}

export default Page;