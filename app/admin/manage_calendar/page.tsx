"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Calendar, AlertTriangle, Eye, EyeOff, Search, Filter } from "lucide-react";
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
  const [viewDate, setViewDate] = useState(new Date());
  const currentMonth = viewDate.getMonth();
  const currentYearAD = viewDate.getFullYear();
  
  const [activeTab, setActiveTab] = useState("calendar");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  
  // --- New Search & Filter States ---
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // all, published, draft

  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    is_published: true
  });

  const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const daysOfWeek = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

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

  // --- Search & Filter Logic ---
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch = 
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      
      const matchesStatus = 
        statusFilter === "all" ? true :
        statusFilter === "published" ? event.is_published :
        !event.is_published;

      return matchesSearch && matchesStatus;
    });
  }, [events, searchTerm, statusFilter]);

  const handlePreviousMonth = () => setViewDate(new Date(currentYearAD, currentMonth - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(currentYearAD, currentMonth + 1, 1));

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
        body: JSON.stringify({ is_public: newStatus })
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
      }
    } catch (error) {
      Swal.fire("ผิดพลาด", "ไม่สามารถเปลี่ยนสถานะได้", "error");
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
          is_public: editFormData.is_published
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
    const daysInCurrentMonth = new Date(currentYearAD, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYearAD, currentMonth, 1).getDay();
    const daysInPrevMonth = new Date(currentYearAD, currentMonth, 0).getDate();
    
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push(<div key={`prev-${i}`} className="p-2 text-center text-gray-300 bg-gray-50/50 min-h-[100px] border border-gray-100">{daysInPrevMonth - i}</div>);
    }
    
    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const currentDate = new Date(currentYearAD, currentMonth, day);
      currentDate.setHours(0, 0, 0, 0);
      
      const dayEvents = filteredEvents.filter(event => {
        const eventStart = new Date(event.raw_start!);
        const eventEnd = new Date(event.raw_end!);
        eventStart.setHours(0, 0, 0, 0);
        eventEnd.setHours(0, 0, 0, 0);
        return currentDate >= eventStart && currentDate <= eventEnd;
      });

      days.push(
        <div key={day} className="p-1 sm:p-2 border border-gray-100 min-h-[100px] hover:bg-gray-50 transition-colors bg-white flex flex-col">
          <div className="font-medium text-gray-500 text-xs mb-1 text-right">{day}</div>
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[80px] custom-scrollbar">
            {dayEvents.map((event, idx) => (
              <div key={`${event.id}-${idx}`} onClick={() => handleEditClick(event)}
                className={`px-1.5 py-1 rounded text-[9px] sm:text-[10px] font-medium cursor-pointer shadow-sm border truncate
                ${event.is_published ? 'bg-green-50 text-green-700 border-green-100 hover:bg-green-100' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
              >
                {!event.is_published && "• "}{event.title}
              </div>
            ))}
          </div>
        </div>
      );
    }
    
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(<div key={`next-${day}`} className="p-2 text-center text-gray-300 bg-gray-50/50 min-h-[100px] border border-gray-100">{day}</div>);
    }
    return days;
  };

  return (
    <Navbar_admin>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">ปฏิทินกำหนดการ</h1>
            <p className="text-sm text-gray-500 mt-1">จัดการและตรวจสอบกำหนดการรับสมัคร/ประกาศผล</p>
          </div>
          <Link href="/admin/manage_calendar/calendar_add" className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl transition-all font-semibold shadow-md hover:shadow-lg active:scale-95">
            <Plus className="w-5 h-5" /> เพิ่มกำหนดการใหม่
          </Link>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อกำหนดการหรือรายละเอียด..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="pl-10 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 text-sm appearance-none cursor-pointer"
              >
                <option value="all">ทุกสถานะ</option>
                <option value="published">เผยแพร่แล้ว</option>
                <option value="draft">แบบร่าง</option>
              </select>
            </div>
            <div className="flex items-center px-4 py-2.5 text-xs font-bold text-gray-500 bg-gray-100 rounded-xl border border-gray-200 uppercase tracking-wider">
              พบ {filteredEvents.length} รายการ
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-2xl w-fit">
          <button 
            onClick={() => setActiveTab("calendar")} 
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "calendar" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            ปฏิทิน
          </button>
          <button 
            onClick={() => setActiveTab("list")} 
            className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "list" ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            รายการ
          </button>
        </div>

        {activeTab === "calendar" ? (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-4 sm:p-8 overflow-hidden">
            <div className="flex items-center justify-between mb-8">
              <button onClick={handlePreviousMonth} className="p-2.5 hover:bg-gray-100 rounded-full transition-colors border border-gray-100"><ChevronLeft className="w-6 h-6 text-gray-600" /></button>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{months[currentMonth]} {currentYearAD + 543}</h2>
              <button onClick={handleNextMonth} className="p-2.5 hover:bg-gray-100 rounded-full transition-colors border border-gray-100"><ChevronRight className="w-6 h-6 text-gray-600" /></button>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="grid grid-cols-7 gap-0 mb-4">
                  {daysOfWeek.map((day, i) => (
                    <div key={i} className={`p-2 text-center font-bold text-xs uppercase tracking-widest ${day === 'อาทิตย์' ? 'text-red-400' : 'text-gray-400'}`}>
                      {day}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-100 rounded-sm overflow-hidden">
                  {renderCalendarDays()}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <Calendar className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                <p className="text-gray-400 font-medium text-lg">ไม่พบข้อมูลที่ตรงกับการค้นหา</p>
                {(searchTerm || statusFilter !== "all") && (
                  <button onClick={() => {setSearchTerm(""); setStatusFilter("all");}} className="mt-4 text-green-600 font-bold hover:underline">ล้างตัวกรองทั้งหมด</button>
                )}
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div key={event.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all group">
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">{event.title}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${event.is_published ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                          {event.is_published ? 'เผยแพร่แล้ว' : 'แบบร่าง'}
                        </span>
                      </div>
                      {event.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{event.description}</p>}
                      <div className="flex items-center gap-4 text-gray-400 text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-gray-300" />
                          <span>{new Date(event.raw_start!).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })} - {new Date(event.raw_end!).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0">
                      <button onClick={() => handleToggleStatus(event)} className={`p-2 rounded-xl border transition-all ${event.is_published ? 'text-amber-500 border-amber-100 hover:bg-amber-50' : 'text-indigo-500 border-indigo-100 hover:bg-indigo-50'}`} title={event.is_published ? "ปิดการใช้งาน" : "เปิดการใช้งาน"}>
                        {event.is_published ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                      <button onClick={() => handleEditClick(event)} className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold text-green-600 border border-green-100 bg-green-50/50 hover:bg-green-50 rounded-xl transition-all">แก้ไข</button>
                      <button onClick={() => { setSelectedEvent(event); setIsDeleteModalOpen(true); }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><X className="w-5 h-5" /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-xl w-full overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="px-8 py-6 border-b flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">แก้ไขข้อมูลกำหนดการ</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-8 space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">ชื่อกำหนดการ</label>
                  <input type="text" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all font-medium" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">รายละเอียด</label>
                  <textarea value={editFormData.description} onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })} rows={3} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:bg-white outline-none transition-all resize-none font-medium" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">วันที่เริ่มต้น</label>
                    <input type="date" value={editFormData.startDate} onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase ml-1">วันที่สิ้นสุด</label>
                    <input type="date" value={editFormData.endDate} onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })} min={editFormData.startDate} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500" required />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase ml-1">สถานะ</label>
                  <select value={editFormData.is_published ? "true" : "false"} onChange={(e) => setEditFormData({ ...editFormData, is_published: e.target.value === "true" })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium cursor-pointer">
                    <option value="true">เปิดการเผยแพร่ (Visible)</option>
                    <option value="false">เก็บเป็นแบบร่าง (Hidden)</option>
                  </select>
                </div>
                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3.5 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all">ยกเลิก</button>
                  <button type="submit" className="flex-1 py-3.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200 transition-all active:scale-95">บันทึกข้อมูล</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Modal */}
        {isDeleteModalOpen && selectedEvent && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-100 animate-pulse"><AlertTriangle className="w-10 h-10" /></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">ยืนยันการลบ?</h2>
              <p className="text-gray-500 mb-8 text-sm px-4">ต้องการลบกำหนดการ <span className="font-bold text-gray-900">"{selectedEvent.title}"</span> ใช่หรือไม่? ข้อมูลนี้ไม่สามารถกู้คืนได้</p>
              <div className="flex gap-4">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-all">ยกเลิก</button>
                <button onClick={handleDeleteConfirm} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 shadow-lg shadow-red-200 transition-all active:scale-95">ลบข้อมูล</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Navbar_admin>
  );
}

export default Page;