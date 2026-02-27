"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Calendar,
  AlertTriangle,
  Eye,
  EyeOff,
  Search,
  Tag,
  Filter,
} from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";
import axios from "axios";

// Mapping สีตามชื่อ String
const CATEGORY_STYLES: Record<string, string> = {
  "PLE-IP1": "bg-blue-100 text-blue-700 border-blue-200",
  "PLE-IP2": "bg-orange-100 text-orange-700 border-orange-200",
  "PLE-PC2": "bg-green-100 text-green-700 border-green-200",
  "PLE-PHCP2": "bg-yellow-100 text-yellow-700 border-yellow-200",
};

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  month: number;
  is_published: boolean;
  raw_start?: string;
  raw_end?: string;
  type_event: string[];
}

function Page() {
  const getToken = useCallback(() => {
    return typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  }, []);

  const [viewDate, setViewDate] = useState(new Date());
  const currentMonth = viewDate.getMonth();
  const currentYearAD = viewDate.getFullYear();

  const [activeTab, setActiveTab] = useState("calendar");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);

  // States สำหรับการค้นหาและกรอง
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all"); // เพิ่มการกรองตามประเภท

  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    is_published: true,
  });

  const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const daysOfWeek = ["อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์"];

  const fetchEvents = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules`, {
        headers: { Authorization: `Bearer ${token}` },
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
          is_published: item.is_public,
          raw_start: item.start_time,
          raw_end: item.end_time,
          type_event: item.type_event || [],
        };
      });
      setEvents(formattedEvents);
    } catch (error) {
      console.error(error);
    }
  }, [getToken]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // Logic การกรองข้อมูล (Search + Status + Type)
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

      const matchesStatus = statusFilter === "all" ? true : 
                            statusFilter === "published" ? event.is_published : !event.is_published;

      const matchesType = typeFilter === "all" ? true : event.type_event.includes(typeFilter);

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [events, searchTerm, statusFilter, typeFilter]);

  const handleEditClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditFormData({
      title: event.title,
      description: event.description || "",
      startDate: new Date(event.raw_start!).toLocaleDateString("sv-SE"),
      endDate: new Date(event.raw_end!).toLocaleDateString("sv-SE"),
      is_published: event.is_published,
    });
    setIsEditModalOpen(true);
  };

  const handleToggleStatus = async (event: CalendarEvent) => {
    try {
      const token = getToken();
      const newStatus = !event.is_published;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/${event.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ is_public: newStatus }),
      });
      if (res.ok) {
        await fetchEvents();
        Swal.fire({ title: "สำเร็จ", icon: "success", timer: 1000, showConfirmButton: false });
      }
    } catch (error) {
      Swal.fire("ผิดพลาด", "ไม่สามารถเปลี่ยนสถานะได้", "error");
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    try {
      const token = getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/${selectedEvent.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: editFormData.title,
          description: editFormData.description,
          start_time: editFormData.startDate,
          end_time: editFormData.endDate,
          is_public: editFormData.is_published,
        }),
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
      const token = getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/${selectedEvent.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
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

      // ใช้ filteredEvents เพื่อให้การกรองมีผลกับหน้าปฏิทินด้วย
      const dayEvents = filteredEvents.filter((event) => {
        const eventStart = new Date(event.raw_start!);
        const eventEnd = new Date(event.raw_end!);
        eventStart.setHours(0, 0, 0, 0);
        eventEnd.setHours(0, 0, 0, 0);
        return currentDate >= eventStart && currentDate <= eventEnd;
      });

      days.push(
        <div key={day} className="p-1 sm:p-2 border border-gray-100 min-h-[120px] hover:bg-gray-50 transition-colors bg-white flex flex-col">
          <div className="font-medium text-gray-500 text-xs mb-1 text-right">{day}</div>
          <div className="flex flex-col gap-1 overflow-y-auto max-h-[90px] custom-scrollbar">
            {dayEvents.map((event, idx) => (
              <div
                key={`${event.id}-${idx}`}
                onClick={() => handleEditClick(event)}
                className={`px-1.5 py-1 rounded text-[9px] sm:text-[10px] font-medium cursor-pointer shadow-sm border truncate
                ${event.is_published ? "bg-white text-gray-700 border-gray-200 hover:border-green-400" : "bg-gray-50 text-gray-400 border-gray-100 italic"}`}
              >
                <div className="flex gap-0.5 mb-0.5">
                  {event.type_event.map((type, tIdx) => (
                    <div key={tIdx} className={`w-1.5 h-1.5 rounded-full ${CATEGORY_STYLES[type]?.split(' ')[0] || 'bg-gray-300'}`} />
                  ))}
                </div>
                {event.title}
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
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">ปฏิทินกำหนดการ</h1>
            <p className="text-sm text-gray-500 mt-1">ตรวจสอบและจัดการกำหนดการสอบ</p>
          </div>
          <Link href="/admin/manage_calendar/calendar_add" className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl transition-all font-semibold shadow-md active:scale-95">
            <Plus className="w-5 h-5" /> เพิ่มกำหนดการใหม่
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200 mb-6 flex flex-col lg:flex-row gap-3">
          <div className="flex-[2] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="ค้นหาชื่อกำหนดการ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 outline-none text-sm"
            />
          </div>
          
          {/* การกรองตามสถานะ */}
          <div className="flex-1 flex gap-2">
             <div className="relative flex-1">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm cursor-pointer appearance-none"
                >
                    <option value="all">ทุกสถานะ</option>
                    <option value="published">เผยแพร่แล้ว</option>
                    <option value="draft">แบบร่าง</option>
                </select>
             </div>

             {/* การกรองตามประเภท (Type Filter) */}
             <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none text-sm cursor-pointer appearance-none"
                >
                    <option value="all">ทุกประเภท</option>
                    {Object.keys(CATEGORY_STYLES).map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
             </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-gray-100 p-1.5 rounded-2xl w-fit">
          <button onClick={() => setActiveTab("calendar")} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "calendar" ? "bg-white text-green-600 shadow-sm" : "text-gray-500"}`}>ปฏิทิน</button>
          <button onClick={() => setActiveTab("list")} className={`px-6 py-2 rounded-xl text-sm font-bold transition-all ${activeTab === "list" ? "bg-white text-green-600 shadow-sm" : "text-gray-500"}`}>รายการ</button>
        </div>

        {/* Content */}
        {activeTab === "calendar" ? (
          <div className="bg-white rounded-3xl shadow-xl border border-gray-200 p-4 sm:p-8">
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setViewDate(new Date(currentYearAD, currentMonth - 1))} className="p-2 hover:bg-gray-100 rounded-full border border-gray-100"><ChevronLeft className="w-6 h-6 text-gray-600" /></button>
              <h2 className="text-xl font-bold text-gray-800">{months[currentMonth]} {currentYearAD + 543}</h2>
              <button onClick={() => setViewDate(new Date(currentYearAD, currentMonth + 1))} className="p-2 hover:bg-gray-100 rounded-full border border-gray-100"><ChevronRight className="w-6 h-6 text-gray-600" /></button>
            </div>
            <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-100">
              {daysOfWeek.map((day, i) => (
                <div key={i} className={`p-2 text-center font-bold text-[10px] uppercase tracking-tighter ${day === "อาทิตย์" ? "text-red-400" : "text-gray-400"}`}>{day}</div>
              ))}
              {renderCalendarDays()}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => (
              <div key={event.id} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all group">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-green-600 transition-colors">{event.title}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${event.is_published ? "bg-green-50 text-green-600 border-green-100" : "bg-gray-50 text-gray-400 border-gray-200"}`}>
                        {event.is_published ? "เผยแพร่แล้ว" : "แบบร่าง"}
                      </span>
                    </div>
                    
                    {/* Badge ประเภท */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {event.type_event.map((type, tIdx) => (
                        <span key={tIdx} className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold border ${CATEGORY_STYLES[type] || "bg-gray-50 text-gray-500 border-gray-100"}`}>
                          <Tag className="w-3 h-3" /> {type}
                        </span>
                      ))}
                    </div>

                    {event.description && <p className="text-sm text-gray-500 mb-3 line-clamp-2">{event.description}</p>}
                    <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
                      <Calendar className="w-4 h-4 text-gray-300" />
                      <span>{new Date(event.raw_start!).toLocaleDateString("th-TH")} - {new Date(event.raw_end!).toLocaleDateString("th-TH")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-3 sm:pt-0 border-t sm:border-t-0 w-full sm:w-auto">
                    <button onClick={() => handleToggleStatus(event)} className={`p-2 rounded-xl border transition-all ${event.is_published ? "text-amber-500 border-amber-100 hover:bg-amber-50" : "text-indigo-500 border-indigo-100 hover:bg-indigo-50"}`}>
                      {event.is_published ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                    <button onClick={() => handleEditClick(event)} className="px-4 py-2 text-xs font-bold text-green-600 border border-green-100 bg-green-50/50 hover:bg-green-50 rounded-xl transition-all">แก้ไข</button>
                    <button onClick={() => { setSelectedEvent(event); setIsDeleteModalOpen(true); }} className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl"><X className="w-5 h-5" /></button>
                  </div>
                </div>
              </div>
            ))}
            {filteredEvents.length === 0 && (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 text-gray-400 font-medium">ไม่พบข้อมูลที่ค้นหา</div>
            )}
          </div>
        )}

        {/* Modals เหมือนเดิม... (Edit/Delete) */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-2xl max-w-xl w-full overflow-hidden">
              <div className="px-8 py-6 border-b flex justify-between items-center bg-gray-50/50">
                <h2 className="text-xl font-bold text-gray-900">แก้ไขกำหนดการ</h2>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full"><X className="w-5 h-5 text-gray-500" /></button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-8 space-y-5">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-400 uppercase">ชื่อกำหนดการ</label>
                  <input type="text" value={editFormData.title} onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500 font-medium" required />
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase">ประเภทที่ระบุไว้</label>
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent?.type_event.map((type, idx) => (
                      <span key={idx} className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${CATEGORY_STYLES[type] || 'bg-gray-50'}`}>{type}</span>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">วันที่เริ่ม</label>
                    <input type="date" value={editFormData.startDate} onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-400 uppercase">วันที่สิ้นสุด</label>
                    <input type="date" value={editFormData.endDate} onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" required />
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-500">ยกเลิก</button>
                  <button type="submit" className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg transition-all active:scale-95">บันทึกข้อมูล</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isDeleteModalOpen && selectedEvent && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[110] p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-red-100"><AlertTriangle className="w-10 h-10" /></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">ยืนยันการลบ?</h2>
              <p className="text-gray-500 mb-8 text-sm">ต้องการลบกำหนดการ <br/><span className="font-bold text-gray-900">"{selectedEvent.title}"</span> หรือไม่?</p>
              <div className="flex gap-4">
                <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-3 border border-gray-200 rounded-xl font-bold text-gray-500">ยกเลิก</button>
                <button onClick={handleDeleteConfirm} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold hover:bg-red-600 transition-all active:scale-95">ลบข้อมูล</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Navbar_admin>
  );
}

export default Page;