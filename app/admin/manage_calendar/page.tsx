"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Calendar, AlertTriangle, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  month: number;
  color: string;
  is_published: boolean; 
  raw_start?: string;
  raw_end?: string;
}

function Page() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [activeTab, setActiveTab] = useState("calendar");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    is_published: true
  });

  const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const daysOfWeek = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
  const year = 2568;

  const fetchEvents = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch("http://localhost:5000/schedules", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("ดึงข้อมูลล้มเหลว");

      const data = await res.json();

      const formattedEvents = data.map((item: any) => {
        const start = new Date(item.start_time);
        const end = new Date(item.end_time);
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          startDate: String(start.getDate()),
          endDate: String(end.getDate()),
          month: start.getMonth(),
          // ใช้ item.is_public ตาม Backend
          color: item.is_public ? "bg-green-100" : "bg-gray-100",
          is_published: item.is_public, 
          raw_start: item.start_time,
          raw_end: item.end_time
        };
      });
      setEvents(formattedEvents);
    } catch (error) {
      console.error(error);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleToggleStatus = async (event: CalendarEvent) => {
    try {
      const token = localStorage.getItem("access_token");
      const newStatus = !event.is_published;

      const res = await fetch(`http://localhost:5000/schedules/${event.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          is_public: newStatus // แก้เป็น is_public ให้ตรงกับ Backend
        })
      });

      if (res.ok) {
        await fetchEvents(); 
        Swal.fire({
          title: "สำเร็จ",
          text: `เปลี่ยนสถานะเป็น ${newStatus ? "เปิดใช้งาน" : "ปิดใช้งาน"} แล้ว`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        throw new Error("API response not ok");
      }
    } catch (error) {
      Swal.fire("ผิดพลาด", "ไม่สามารถเปลี่ยนสถานะได้ กรุณาลองใหม่", "error");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;

    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:5000/schedules/${selectedEvent.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description,
          start_time: editFormData.startDate,
          end_time: editFormData.endDate,
          is_public: editFormData.is_published // แก้เป็น is_public ให้ตรงกับ Backend
        })
      });

      if (res.ok) {
        setIsEditModalOpen(false);
        fetchEvents();
        Swal.fire("สำเร็จ", "แก้ไขข้อมูลเรียบร้อย", "success");
      }
    } catch (error) {
      Swal.fire("ผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้", "error");
    }
  };

  // ... (ส่วนอื่นๆ ของ renderCalendarDays และ UI คงเดิม)
  
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();
  const daysInMonth = getDaysInMonth(currentMonth, year - 543);
  const firstDay = getFirstDayOfMonth(currentMonth, year - 543);

  const handlePreviousMonth = () => setCurrentMonth((prev) => (prev === 0 ? 11 : prev - 1));
  const handleNextMonth = () => setCurrentMonth((prev) => (prev === 11 ? 0 : prev + 1));

  const handleEditClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditFormData({
      title: event.title,
      description: event.description || "",
      startDate: new Date(event.raw_start!).toLocaleDateString('sv-SE'),
      endDate: new Date(event.raw_end!).toLocaleDateString('sv-SE'),
      is_published: event.is_published
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedEvent) return;
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`http://localhost:5000/schedules/${selectedEvent.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setIsDeleteModalOpen(false);
        fetchEvents();
        Swal.fire("ลบสำเร็จ", "ลบกำหนดการเรียบร้อย", "success");
      }
    } catch (error) {
      Swal.fire("ผิดพลาด", "ลบข้อมูลไม่สำเร็จ", "error");
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    const prevMonthDays = getDaysInMonth(currentMonth - 1, year - 543);
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(<div key={`prev-${i}`} className="p-3 sm:p-4 text-center text-gray-400 bg-gray-50 min-h-[80px] sm:min-h-[100px] border border-gray-100">{prevMonthDays - i}</div>);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const event = events.find(e => e.month === currentMonth && day >= parseInt(e.startDate) && day <= parseInt(e.endDate));
      days.push(
        <div key={day} onClick={() => event && handleEditClick(event)} className={`p-3 sm:p-4 border border-gray-200 min-h-[80px] sm:min-h-[100px] hover:bg-gray-50 transition-colors cursor-pointer relative ${event ? event.color : "bg-white"}`}>
          <div className="font-medium text-gray-700 text-sm sm:text-base text-center">{day}</div>
          {event && (
            <div className={`mt-2 text-[10px] sm:text-xs font-bold line-clamp-2 text-center ${event.is_published ? 'text-green-800' : 'text-gray-500'}`}>
              {!event.is_published && "[DRAFT] "} {event.title}
            </div>
          )}
        </div>
      );
    }
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(<div key={`next-${day}`} className="p-3 sm:p-4 text-center text-gray-400 bg-gray-50 min-h-[80px] sm:min-h-[100px] border border-gray-100">{day}</div>);
    }
    return days;
  };

  return (
    <Navbar_admin>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">ปฏิทินกำหนดการ</h1>
            <p className="text-sm sm:text-base text-gray-600">จัดการปฏิทิน เพิ่ม แก้ไข ลบ และสถานะการเผยแพร่</p>
          </div>
          <Link
            href="/admin/manage_calendar/calendar_add"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            เพิ่มกำหนดการใหม่
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button onClick={() => setActiveTab("calendar")} className={`flex items-center gap-2 px-6 py-4 text-sm sm:text-base font-medium transition-colors relative ${activeTab === "calendar" ? "text-green-600 border-b-2 border-green-600" : "text-gray-600"}`}>ปฏิทิน</button>
              <button onClick={() => setActiveTab("list")} className={`flex items-center gap-2 px-6 py-4 text-sm sm:text-base font-medium transition-colors relative ${activeTab === "list" ? "text-green-600 border-b-2 border-green-600" : "text-gray-600"}`}>รายการกำหนดการ</button>
            </div>
          </div>
        </div>

        {/* Calendar View */}
        {activeTab === "calendar" && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <button onClick={handlePreviousMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronLeft className="w-6 h-6 text-gray-600" /></button>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">{months[currentMonth]} {year}</h2>
              <button onClick={handleNextMonth} className="p-2 hover:bg-gray-100 rounded-lg transition-colors"><ChevronRight className="w-6 h-6 text-gray-600" /></button>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <div className="grid grid-cols-7 gap-0 mb-2">
                  {daysOfWeek.map((day, i) => <div key={i} className="p-4 text-center font-semibold text-gray-700 bg-gray-50 text-xs sm:text-sm">{day}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-200">{renderCalendarDays()}</div>
              </div>
            </div>
          </div>
        )}

        {/* List View */}
        {activeTab === "list" && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="space-y-4">
              {events.length === 0 ? (
                <div className="text-center py-10 text-gray-500">ไม่พบข้อมูลกำหนดการ</div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className={`border border-gray-200 rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow bg-white`}>
                    <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base sm:text-lg font-semibold text-gray-900">{event.title}</h3>
                          {event.is_published ? (
                            <span className="flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full border border-green-200 font-medium">
                              <span className="w-1 h-1 bg-green-500 rounded-full"></span> เผยแพร่แล้ว
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full border border-gray-200 font-medium">
                              <span className="w-1 h-1 bg-gray-400 rounded-full"></span> แบบร่าง
                            </span>
                          )}
                        </div>
                        {event.description && <p className="text-sm text-gray-600 mb-2">{event.description}</p>}
                        <div className="flex items-center gap-2 text-gray-500 text-xs sm:text-sm">
                          <Calendar className="w-4 h-4" />
                          <span>{new Date(event.raw_start!).toLocaleDateString('th-TH')} - {new Date(event.raw_end!).toLocaleDateString('th-TH')}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 pt-3 sm:pt-0">
                        <button
                          onClick={() => handleToggleStatus(event)}
                          title={event.is_published ? "คลิกเพื่อปิดการเผยแพร่" : "คลิกเพื่อเผยแพร่"}
                          className={`flex-1 sm:flex-none flex items-center justify-center gap-1 px-3 py-2 text-xs font-medium rounded-lg border transition-all ${event.is_published
                              ? 'text-amber-600 border-amber-200 hover:bg-amber-50'
                              : 'text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                            }`}
                        >
                          {event.is_published ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {event.is_published ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                        </button>
                        <button onClick={() => handleEditClick(event)} className="flex-1 sm:flex-none px-3 py-2 text-xs font-medium text-green-600 border border-green-200 hover:bg-green-50 rounded-lg transition-colors">แก้ไข</button>
                        <button onClick={() => handleDeleteClick(event)} className="flex-1 sm:flex-none px-3 py-2 text-xs font-medium text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors">ลบ</button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Modal แก้ไขและลบยังคงเดิมตามที่แก้ไขเรื่อง is_public ไปแล้วด้านบน */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden">
              <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                <h2 className="text-lg font-bold">แก้ไขกำหนดการ</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">ชื่อกำหนดการ <span className="text-red-500">*</span></label>
                  <input type="text" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">รายละเอียด</label>
                  <textarea value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 border rounded-lg outline-none resize-none" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">วันที่เริ่มต้น</label>
                    <input type="date" value={editFormData.startDate} onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })} className="w-full px-4 py-2 border rounded-lg" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">วันที่สิ้นสุด</label>
                    <input type="date" value={editFormData.endDate} onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })} min={editFormData.startDate} className="w-full px-4 py-2 border rounded-lg" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">สถานะการเผยแพร่</label>
                  <select
                    value={editFormData.is_published ? "true" : "false"}
                    onChange={(e) => setEditFormData({ ...editFormData, is_published: e.target.value === "true" })}
                    className="w-full px-4 py-2.5 border rounded-lg outline-none bg-white"
                  >
                    <option value="true">เปิดใช้งาน (แสดงให้นักเรียนเห็น)</option>
                    <option value="false">แบบร่าง (ซ่อนไว้ก่อน)</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-2.5 border rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
                  <button type="submit" className="flex-1 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow-md">บันทึกการแก้ไข</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isDeleteModalOpen && selectedEvent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center shadow-2xl">
              <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8" /></div>
              <h2 className="text-xl font-bold mb-2">ยืนยันการลบ?</h2>
              <p className="text-gray-500 mb-6 text-sm">คุณต้องการลบ "{selectedEvent.title}" ใช่หรือไม่? ข้อมูลจะหายไปถาวร</p>
              <div className="flex gap-3">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2.5 border rounded-lg hover:bg-gray-50 transition-colors">ยกเลิก</button>
                <button onClick={handleDeleteConfirm} className="flex-1 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md">ยืนยันลบ</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Navbar_admin>
  );
}

export default Page;