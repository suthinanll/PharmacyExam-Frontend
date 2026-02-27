"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState } from "react";
import { ChevronLeft, Plus, X, Calendar, CheckCircle2, Save, Send } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";
import { useAuth } from "@/contexts/AuthContext";

// ปรับตัวเลือกให้เป็นค่า String ตามที่จะเก็บใน Simple Array (Postgres)
const CATEGORY_OPTIONS = [
  { label: "PLE-IP1, PC1, PHCP1", value: "PLE-IP1", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { label: "PLE-IP2", value: "PLE-IP2", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { label: "PLE-PC2", value: "PLE-PC2", color: "bg-green-50 text-green-700 border-green-200" },
  { label: "PLE-PHCP2", value: "PLE-PHCP2", color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
];

interface CalendarEvent {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  type_event: string[]; // แก้ไขจาก category_ids เป็น type_event
}

function Page() {
  const { getToken } = useAuth();
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: Date.now(),
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      type_event: [],
    },
  ]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const addNewEvent = () => {
    setEvents([...events, {
      id: Date.now(),
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      type_event: [],
    }]);
  };

  const removeEvent = (id: number) => {
    if (events.length > 1) {
      setEvents(events.filter((event) => event.id !== id));
    }
  };

  const updateEvent = (id: number, field: keyof CalendarEvent, value: any) => {
    setEvents(events.map((event) => (event.id === id ? { ...event, [field]: value } : event)));
  };

  // ปรับการ Toggle ให้ใช้ String Value
  const toggleCategory = (eventId: number, catValue: string) => {
    setEvents(events.map(event => {
      if (event.id === eventId) {
        const current = event.type_event || [];
        const next = current.includes(catValue) 
          ? current.filter(val => val !== catValue) 
          : [...current, catValue];
        return { ...event, type_event: next };
      }
      return event;
    }));
  };

  const saveSchedules = async (isPublished: boolean) => {
    const token = getToken();
    // ปรับการ Validate ให้เช็ค type_event
    const isValid = events.every(e => e.title.trim() !== "" && e.startDate !== "" && e.type_event.length > 0);

    if (!isValid && isPublished) {
      Swal.fire("ข้อมูลไม่ครบ", "กรุณาระบุชื่อ วันที่ และเลือกประเภทหลักสูตร", "warning");
      return;
    }

    try {
      Swal.fire({
        title: isPublished ? 'กำลังเผยแพร่...' : 'กำลังบันทึกร่าง...',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const promises = events.map(event =>
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            title: event.title,
            description: event.description,
            startDate: event.startDate, // Backend จะนำไปปั้นเป็น start_time
            endDate: event.endDate || event.startDate, // Backend จะนำไปปั้นเป็น end_time
            is_public: isPublished,
            type_event: event.type_event // ส่งเป็น Array ของ String
          })
        })
      );

      const responses = await Promise.all(promises);
      if (responses.every(res => res.ok)) {
        await Swal.fire("สำเร็จ", "บันทึกข้อมูลเรียบร้อยแล้ว", "success");
        window.location.href = "/admin/manage_calendar";
      } else {
        throw new Error("Failed to save");
      }
    } catch (error) {
      Swal.fire("เกิดข้อผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้", "error");
    }
  };

  const handleGenerateFromPdf = async () => {
    if (!pdfFile) return;
    const token = getToken();
    const formData = new FormData();
    formData.append("file", pdfFile);

    try {
      Swal.fire({ title: 'AI กำลังประมวลผล...', text: 'กำลังดึงข้อมูลจาก PDF', allowOutsideClick: false, didOpen: () => Swal.showLoading() });
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/upload`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      Swal.close();

      if (data) {
        const filteredEvents = events.filter(e => e.title.trim() !== "");
        // ปรับให้รองรับ Format ที่ AI ส่งมา (type_event)
        const newEvents = data.map((e: any) => ({
          id: Date.now() + Math.random(),
          title: e.title || "",
          description: e.description || "",
          startDate: e.startDate || "",
          endDate: e.endDate || "",
          type_event: e.type_event || [], 
        }));
        setEvents([...filteredEvents, ...newEvents]);
        setPdfFile(null);
      }
    } catch (error) {
      Swal.fire("ผิดพลาด", "ไม่สามารถประมวลผล PDF ได้", "error");
    }
  };

  return (
    <Navbar_admin>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-20">
        <div className="mb-8">
          <Link href="/admin/manage_calendar" className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-4 transition-colors">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">กลับสู่หน้าจัดการ</span>
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">เพิ่มกำหนดการใหม่</h1>
              <p className="text-gray-500 mt-1">ดึงข้อมูลด้วย AI หรือเพิ่มแมนนวล</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => saveSchedules(false)} className="flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 font-medium transition-all">
                <Save className="w-4 h-4" /> บันทึกร่าง
              </button>
              <button onClick={addNewEvent} className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 shadow-md font-medium transition-all">
                <Plus className="w-4 h-4" /> เพิ่มช่องใหม่
              </button>
            </div>
          </div>
        </div>

        {/* PDF Import Card */}
        <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border border-green-100 mb-8 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-600" /> นำเข้าข้อมูลด้วย AI จากไฟล์ PDF
          </h3>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-grow">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-green-300 rounded-xl cursor-pointer bg-white/50 hover:bg-white transition-all">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <p className="text-sm text-gray-600 mb-1">
                    {pdfFile ? <span className="font-bold text-green-600">{pdfFile.name}</span> : "คลิกเพื่อเลือกไฟล์ PDF"}
                  </p>
                  <p className="text-xs text-gray-400">ระบบจะดึงชื่อ วันที่ และประเภทให้โดยอัตโนมัติ</p>
                </div>
                <input type="file" className="hidden" accept=".pdf" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} />
              </label>
            </div>
            <button
              onClick={handleGenerateFromPdf}
              disabled={!pdfFile}
              className={`md:w-48 rounded-xl font-bold transition-all ${pdfFile ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              ประมวลผลด้วย AI
            </button>
          </div>
        </div>

        {/* Schedule Forms */}
        <div className="space-y-6">
          {events.map((event, index) => (
            <div key={event.id} className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-all relative">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <h3 className="font-bold text-gray-800 text-lg">รายละเอียดกำหนดการ</h3>
                </div>
                {events.length > 1 && (
                  <button onClick={() => removeEvent(event.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">ชื่อกำหนดการ <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={event.title}
                      onChange={(e) => updateEvent(event.id, "title", e.target.value)}
                      placeholder="เช่น เปิดระบบรับสมัครสอบ"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-green-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">วันที่เริ่มต้น <span className="text-red-500">*</span></label>
                      <input type="date" value={event.startDate} onChange={(e) => updateEvent(event.id, "startDate", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700">วันที่สิ้นสุด</label>
                      <input type="date" value={event.endDate} onChange={(e) => updateEvent(event.id, "endDate", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200" />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">รายละเอียดเพิ่มเติม</label>
                  <textarea
                    rows={2}
                    value={event.description}
                    onChange={(e) => updateEvent(event.id, "description", e.target.value)}
                    placeholder="รายละเอียดกิจกรรม..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200"
                  />
                </div>

                <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
                  <label className="text-sm font-bold text-gray-700">ประเภทหลักสูตรที่เกี่ยวข้อง <span className="text-red-500">*</span></label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {CATEGORY_OPTIONS.map((cat) => {
                      const selected = event.type_event.includes(cat.value);
                      return (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => toggleCategory(event.id, cat.value)}
                          className={`flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-all text-left ${
                            selected ? `${cat.color} border-current shadow-sm` : "bg-white border-gray-100 text-gray-400 hover:border-gray-200"
                          }`}
                        >
                          <span className="text-xs font-bold leading-tight">{cat.label}</span>
                          {selected && <CheckCircle2 className="w-4 h-4 flex-shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Floating Footer */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 p-4 shadow-2xl z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <p className="hidden sm:block text-sm text-gray-500">ทั้งหมด <span className="font-bold text-green-600">{events.length}</span> รายการ</p>
            <div className="flex gap-3 w-full sm:w-auto">
              <Link href="/admin/manage_calendar" className="flex-1 sm:flex-none text-center px-8 py-3 text-gray-600 font-bold hover:bg-gray-100 rounded-xl">ยกเลิก</Link>
              <button 
                onClick={() => saveSchedules(true)} 
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-10 py-3 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95"
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