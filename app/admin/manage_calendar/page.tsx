"use client";
import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Calendar,
  Eye,
  EyeOff,
  Search,
  Trash2,
  Clock,
  CheckSquare,
  Square,
  List,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import Swal from "@/utils/sweetalert";

const CATEGORY_STYLES: Record<string, string> = {
  "PLE-CC1": "bg-blue-50 text-blue-700 border-blue-200",
  "PLE-CC2": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "PLE-IP1, PC1, PHCP1": "bg-green-50 text-green-700 border-green-200",
  "PLE-IP2": "bg-teal-50 text-teal-700 border-teal-200",
  "PLE-PC2": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "PLE-PHCP2": "bg-lime-50 text-lime-700 border-lime-200",
};
const CATEGORY_DOT: Record<string, string> = {
  "PLE-CC1": "bg-blue-400",
  "PLE-CC2": "bg-indigo-400",
  "PLE-IP1, PC1, PHCP1": "bg-green-400",
  "PLE-IP2": "bg-teal-400",
  "PLE-PC2": "bg-emerald-400",
  "PLE-PHCP2": "bg-lime-400",
};

// Helper ตัดข้อความชื่อกิจกรรมให้กระชับสำหรับแสดงในช่องปฏิทิน
const getShortEventTitle = (title: string, maxLen = 22) => {
  if (!title) return "";
  if (title.includes(" - ")) {
    const parts = title.split(" - ");
    const activity = parts.slice(1).join(" - ").trim();
    if (activity) {
      return activity.length > maxLen ? activity.slice(0, maxLen) + "..." : activity;
    }
  }
  return title.length > maxLen ? title.slice(0, maxLen) + "..." : title;
};

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  link_url?: string;
  startDate: string;
  endDate: string;
  month: number;
  is_published: boolean;
  raw_start?: string;
  raw_end?: string;
  type_event: string[];
}

function Page() {
  const getToken = useCallback(() =>
    typeof window !== "undefined" ? localStorage.getItem("access_token") : null, []);

  const [viewDate, setViewDate] = useState(new Date());
  const currentMonth = viewDate.getMonth();
  const currentYearAD = viewDate.getFullYear();

  const [activeTab, setActiveTab] = useState("calendar");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    link_url: "",
    startDate: "",
    endDate: "",
    is_published: true,
    type_event: [] as string[],
  });

  const months = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
  const daysOfWeek = ["อา.", "จ.", "อ.", "พ.", "พฤ.", "ศ.", "ส."];

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
          link_url: item.link_url,
          startDate: String(start.getDate()),
          endDate: String(end.getDate()),
          month: start.getMonth(),
          is_published: item.is_public,
          raw_start: item.start_time,
          raw_end: item.end_time,
          type_event: Array.isArray(item.type_event)
            ? item.type_event
            : (typeof item.type_event === "string"
              ? item.type_event.replace(/^{|}$/g, '').split(',')
              : []),
        };
      });
      setEvents(formattedEvents);
    } catch (error) {
      console.error(error);
    }
  }, [getToken]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesSearch =
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (event.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
      const matchesStatus =
        statusFilter === "all" ? true :
          statusFilter === "published" ? event.is_published : !event.is_published;
      const matchesType =
        typeFilter === "all" ? true : event.type_event.some((t) => t === typeFilter);
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [events, searchTerm, statusFilter, typeFilter]);

  // ─── Checkbox helpers ───────────────────────────────────────────────────────
  const allSelected = filteredEvents.length > 0 && filteredEvents.every((e) => selectedIds.includes(e.id));
  const someSelected = selectedIds.length > 0;

  const toggleSelectAll = () => {
    if (allSelected) setSelectedIds([]);
    else setSelectedIds(filteredEvents.map((e) => e.id));
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ─── Single-item toggle ──────────────────────────────────────────────────────
  const handleToggleStatus = async (event: CalendarEvent) => {
    const actionText = event.is_published ? "งดเผยแพร่" : "เผยแพร่";
    const result = await Swal.fire({
      title: `ยืนยันการ${actionText}?`,
      text: `"${event.title}"`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: event.is_published ? "#f59e0b" : "#059669",
    });
    if (result.isConfirmed) {
      try {
        const token = getToken();
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/${event.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ is_public: !event.is_published }),
        });
        fetchEvents();
      } catch {
        Swal.fire("ผิดพลาด", "ไม่สามารถเปลี่ยนสถานะได้", "error");
      }
    }
  };

  const handleDeleteConfirm = async (event: CalendarEvent) => {
    const result = await Swal.fire({
      title: "ลบกำหนดการ?",
      text: `"${event.title}" จะถูกลบถาวร`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "ลบข้อมูล",
      cancelButtonText: "ยกเลิก",
    });
    if (result.isConfirmed) {
      try {
        const token = getToken();
        await fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/${event.id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchEvents();
        setSelectedIds((prev) => prev.filter((id) => id !== event.id));
      } catch {
        Swal.fire("ผิดพลาด", "ลบข้อมูลไม่สำเร็จ", "error");
      }
    }
  };

  // ─── Bulk action (ใช้ selectedIds ถ้ามี ถ้าไม่มีใช้ filteredEvents ทั้งหมด) ──
  const handleBulkAction = async (action: "publish" | "unpublish" | "delete") => {
    const targetIds = someSelected ? selectedIds : filteredEvents.map((e) => e.id);
    if (targetIds.length === 0) return;

    const actionMap = {
      publish: { text: "เผยแพร่", color: "#059669" },
      unpublish: { text: "งดเผยแพร่", color: "#f59e0b" },
      delete: { text: "ลบ", color: "#ef4444" },
    };
    const cfg = actionMap[action];

    const result = await Swal.fire({
      title: `ยืนยัน${cfg.text} ${targetIds.length} รายการ?`,
      icon: action === "delete" ? "warning" : "question",
      showCancelButton: true,
      confirmButtonText: "ยืนยัน",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: cfg.color,
    });

    if (result.isConfirmed) {
      try {
        const token = getToken();
        Swal.fire({ title: "กำลังดำเนินการ...", allowOutsideClick: false, didOpen: () => Swal.showLoading() });
        await Promise.all(
          targetIds.map((id) => {
            const method = action === "delete" ? "DELETE" : "PATCH";
            const body = action === "delete" ? undefined : JSON.stringify({ is_public: action === "publish" });
            return fetch(`${process.env.NEXT_PUBLIC_API_URL}/schedules/${id}`, {
              method,
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
              body,
            });
          })
        );
        Swal.fire("สำเร็จ", `${cfg.text}เรียบร้อยแล้ว`, "success");
        setSelectedIds([]);
        fetchEvents();
      } catch {
        Swal.fire("ผิดพลาด", "ดำเนินการไม่สำเร็จ", "error");
      }
    }
  };

  const handleEditClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditFormData({
      title: event.title,
      description: event.description || "",
      link_url: event.link_url || "",
      startDate: event.raw_start ? new Date(event.raw_start).toISOString().split("T")[0] : "",
      endDate: event.raw_end ? new Date(event.raw_end).toISOString().split("T")[0] : "",
      is_published: event.is_published,
      type_event: event.type_event || [],
    });
    setIsEditModalOpen(true);
  };

  const toggleTag = (tag: string) => {
    setEditFormData((prev) => ({
      ...prev,
      type_event: prev.type_event.includes(tag)
        ? prev.type_event.filter((t) => t !== tag)
        : [...prev.type_event, tag],
    }));
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
          link_url: editFormData.link_url || undefined,
          startDate: editFormData.startDate,
          endDate: editFormData.endDate,
          is_public: editFormData.is_published,
          type_event: editFormData.type_event,
        }),
      });
      if (res.ok) {
        setIsEditModalOpen(false);
        fetchEvents();
        Swal.fire({ title: "บันทึกสำเร็จ", icon: "success", timer: 1200, showConfirmButton: false });
      }
    } catch {
      Swal.fire("ผิดพลาด", "ไม่สามารถบันทึกข้อมูลได้", "error");
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    const daysInCurrentMonth = new Date(currentYearAD, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYearAD, currentMonth, 1).getDay();
    const daysInPrevMonth = new Date(currentYearAD, currentMonth, 0).getDate();

    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} className="p-2 min-h-[90px] bg-gray-50/40 border border-gray-100 text-gray-300 text-xs text-right">
          {daysInPrevMonth - i}
        </div>
      );
    }

    for (let day = 1; day <= daysInCurrentMonth; day++) {
      const currentDate = new Date(currentYearAD, currentMonth, day);
      currentDate.setHours(0, 0, 0, 0);
      const dayEvents = filteredEvents.filter((event) => {
        const s = new Date(event.raw_start!); s.setHours(0, 0, 0, 0);
        const e2 = new Date(event.raw_end!); e2.setHours(0, 0, 0, 0);
        return currentDate >= s && currentDate <= e2;
      });

      days.push(
        <div key={day} className="p-1.5 border border-gray-100 min-h-[90px] bg-white hover:bg-green-50/30 transition-colors flex flex-col">
          <div className="text-xs font-medium text-gray-400 text-right mb-1">{day}</div>
          <div className="flex flex-col gap-0.5 overflow-y-auto max-h-[68px]">
            {dayEvents.map((event, idx) => (
              <div
                key={`${event.id}-${idx}`}
                onClick={() => handleEditClick(event)}
                className={`px-1.5 py-0.5 rounded text-xs font-medium cursor-pointer truncate border
                  ${event.is_published
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-400 border-gray-200 italic"}`}
              >
                <div className="flex gap-0.5 mb-0.5">
                  {event.type_event.map((type, tIdx) => (
                    <div key={tIdx} className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[type] || "bg-gray-300"}`} />
                  ))}
                </div>
                <span className="truncate block" title={event.title}>
                  {getShortEventTitle(event.title)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      days.push(
        <div key={`next-${day}`} className="p-2 min-h-[90px] bg-gray-50/40 border border-gray-100 text-gray-300 text-xs text-right">
          {day}
        </div>
      );
    }
    return days;
  };

  return (
    <Navbar_admin>
      <div className="max-w-7xl mx-auto w-full space-y-6 pb-20">

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">จัดการกำหนดการปฏิทิน</h1>
              <p className="text-sm text-gray-500">ตั้งค่ากำหนดการและจัดการสถานะการเผยแพร่ · {filteredEvents.length} รายการ</p>
            </div>
            <Link
              href="/admin/manage_calendar/calendar_add"
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all hover:shadow-md"
            >
              <Plus size={18} /> เพิ่มกำหนดการใหม่
            </Link>
          </div>
        </div>

        {/* ── Toolbar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col xl:flex-row gap-4 mb-6 justify-between items-start xl:items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex gap-3 flex-1 flex-wrap w-full xl:w-auto">
            <div className="relative max-w-sm w-full">
              <input
                type="text"
                placeholder="ค้นหากำหนดการ..."
                aria-label="ค้นหากำหนดการ"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-xl text-sm focus:ring-green-500 focus:border-green-500 bg-gray-50"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            </div>
            <select
              value={statusFilter}
              aria-label="กรองตามสถานะกำหนดการ"
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-xl outline-none text-sm focus:ring-green-500 focus:border-green-500 font-medium text-gray-700"
            >
              <option value="all">ทุกสถานะ</option>
              <option value="published">เผยแพร่แล้ว</option>
              <option value="draft">แบบร่าง</option>
            </select>
            <select
              value={typeFilter}
              aria-label="กรองตามประเภทกำหนดการ"
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-xl outline-none text-sm focus:ring-green-500 focus:border-green-500 font-medium text-gray-700"
            >
              <option value="all">ทุกประเภท</option>
              {Object.keys(CATEGORY_STYLES).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* View toggle and Bulk actions */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-between xl:justify-end">
            <div className="flex flex-wrap items-center gap-2">
              {someSelected && (
                <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg font-medium">
                  เลือก {selectedIds.length}
                </span>
              )}
              {activeTab === "list" && (
                <>
                  <button
                    onClick={() => handleBulkAction("publish")}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-green-200 text-green-700 rounded-xl text-xs font-semibold hover:bg-green-600 hover:text-white hover:border-green-600 transition-all"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {someSelected ? `เผยแพร่ (${selectedIds.length})` : "เผยแพร่ทั้งหมด"}
                  </button>
                  <button
                    onClick={() => handleBulkAction("unpublish")}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-amber-200 text-amber-600 rounded-xl text-xs font-semibold hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all"
                  >
                    <EyeOff className="w-3.5 h-3.5" />
                    {someSelected ? `งดเผยแพร่ (${selectedIds.length})` : "งดเผยแพร่ทั้งหมด"}
                  </button>
                  <button
                    onClick={() => handleBulkAction("delete")}
                    className="flex items-center gap-1.5 px-3 py-2 bg-white border border-red-200 text-red-500 rounded-xl text-xs font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    {someSelected ? `ลบ (${selectedIds.length})` : "ลบทั้งหมด"}
                  </button>
                </>
              )}
            </div>

            <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
              <button
                onClick={() => setActiveTab("calendar")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "calendar" ? "bg-white shadow-sm text-green-700" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Calendar className="w-4 h-4" /> ปฏิทิน
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === "list" ? "bg-white shadow-sm text-green-700" : "text-gray-500 hover:text-gray-700"}`}
              >
                <List className="w-4 h-4" /> รายการ
              </button>
            </div>
          </div>
        </div>

        {/* ── Calendar View ────────────────────────────────────────────── */}
        {activeTab === "calendar" ? (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                onClick={() => setViewDate(new Date(currentYearAD, currentMonth - 1))}
                aria-label="เดือนก่อนหน้า"
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-medium text-gray-800">{months[currentMonth]} {currentYearAD + 543}</h2>
              <button
                type="button"
                onClick={() => setViewDate(new Date(currentYearAD, currentMonth + 1))}
                aria-label="เดือนถัดไป"
                className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-7 rounded-xl overflow-hidden border border-gray-200">
              {daysOfWeek.map((day, i) => (
                <div
                  key={i}
                  className={`py-3 text-center text-xs font-semibold bg-gray-50 border-b border-gray-200 ${i === 0 ? "text-red-500" : "text-gray-500"}`}
                >
                  {day}
                </div>
              ))}
              {renderCalendarDays()}
            </div>
          </div>
        ) : (
          /* ── List View ───────────────────────────────────────────────── */
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            {/* List header with select-all */}
            {filteredEvents.length > 0 && (
              <div className="flex items-center gap-3 px-6 py-3 border-b border-gray-100 bg-gray-50">
                <button onClick={toggleSelectAll} className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-700 transition-colors">
                  {allSelected
                    ? <CheckSquare className="w-4 h-4 text-green-600" />
                    : <Square className="w-4 h-4 text-gray-400" />}
                  <span className="font-medium">{allSelected ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}</span>
                </button>
                <span className="text-xs text-gray-400">{filteredEvents.length} รายการ</span>
              </div>
            )}

            {filteredEvents.length > 0 ? (
              filteredEvents.map((event, idx) => {
                const isChecked = selectedIds.includes(event.id);
                return (
                  <div
                    key={event.id}
                    className={`flex items-center gap-4 px-6 py-5 border-b border-gray-100 last:border-0 transition-colors
                      ${isChecked ? "bg-green-50/50" : "hover:bg-gray-50"}`}
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleSelect(event.id)}
                      aria-label={`เลือกกำหนดการ ${event.title}`}
                      className="shrink-0 text-gray-400 hover:text-green-600 transition-colors cursor-pointer"
                    >
                      {isChecked
                        ? <CheckSquare className="w-5 h-5 text-green-600" />
                        : <Square className="w-5 h-5" />}
                    </button>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h2 className="text-base font-medium text-gray-900 truncate ">{event.title}</h2>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${event.is_published ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-100 text-gray-500 border-gray-200"}`}>
                          {event.is_published ? "เผยแพร่" : "แบบร่าง"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mb-5">
                        {event.type_event.map((type, tIdx) => (
                          <span key={tIdx} className={`px-2.5 py-0.5 rounded-lg text-xs font-medium border ${CATEGORY_STYLES[type] || "bg-gray-50 text-gray-500 border-gray-200"}`}>
                            {type}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-green-500" />
                          {new Date(event.raw_start!).toLocaleDateString("th-TH")} – {new Date(event.raw_end!).toLocaleDateString("th-TH")}
                        </span>
                        {event.link_url && (
                          <a
                            href={event.link_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200"
                          >
                            <ExternalLink className="w-3 h-3" />
                            ลิงก์แนบ
                          </a>
                        )}
                      </div>
                    </div>



                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(event)}
                        aria-label={event.is_published ? "งดเผยแพร่กำหนดการ" : "เผยแพร่กำหนดการ"}
                        title={event.is_published ? "งดเผยแพร่" : "เผยแพร่"}
                        className={`p-2 rounded-lg border transition-all cursor-pointer ${event.is_published ? "text-amber-500 bg-amber-50 border-amber-200 hover:bg-amber-500 hover:text-white" : "text-green-600 bg-green-50 border-green-200 hover:bg-green-600 hover:text-white"}`}
                      >
                        {event.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditClick(event)}
                        aria-label={`แก้ไขกำหนดการ ${event.title}`}
                        className="px-4 py-2 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-all cursor-pointer"
                      >
                        แก้ไข
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteConfirm(event)}
                        aria-label={`ลบกำหนดการ ${event.title}`}
                        className="p-2 text-red-500 bg-red-50 border border-red-200 hover:bg-red-500 hover:text-white rounded-lg transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-20">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 font-medium">ไม่พบข้อมูลกำหนดการ</p>
                <p className="text-gray-400 text-sm mt-1">ลองเปลี่ยนคำค้นหาหรือตัวกรอง</p>
              </div>
            )}
          </div>
        )}
        {/* ── Edit Modal ───────────────────────────────────────────────── */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-medium text-gray-800">แก้ไขกำหนดการ</h2>
                  <p className="text-gray-500 text-xs mt-0.5">อัปเดตข้อมูลรายละเอียด</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  aria-label="ปิดหน้าต่างแก้ไขกำหนดการ"
                  className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleEditSubmit} className="p-8 space-y-6 overflow-y-auto">
                <div className="space-y-1.5">
                  <label htmlFor="edit-cal-title" className="text-xs font-medium text-gray-700">ชื่อกำหนดการ</label>
                  <input
                    id="edit-cal-title"
                    aria-label="ชื่อกำหนดการ"
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-green-500 focus:bg-white rounded-xl outline-none transition-all text-sm font-medium"
                    placeholder="ระบุชื่อกำหนดการ..."
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-cal-desc" className="text-xs font-medium text-gray-700">รายละเอียดเพิ่มเติม</label>
                  <textarea
                    id="edit-cal-desc"
                    aria-label="รายละเอียดเพิ่มเติม"
                    rows={2}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-green-500 focus:bg-white rounded-xl outline-none transition-all text-sm resize-none"
                    placeholder="รายละเอียดกำหนดการ..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="edit-cal-url" className="text-xs font-medium text-gray-700 flex items-center gap-1.5">
                    <LinkIcon className="w-3.5 h-3.5 text-green-600" />
                    แนบลิงก์ (URL) / เอกสารอ้างอิง <span className="text-gray-500 font-normal">(ไม่บังคับกรอก)</span>
                  </label>
                  <input
                    id="edit-cal-url"
                    aria-label="แนบลิงก์ (URL) หรือเอกสารอ้างอิง"
                    type="url"
                    value={editFormData.link_url || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, link_url: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 focus:border-green-500 focus:bg-white rounded-xl outline-none transition-all text-sm"
                    placeholder="เช่น https://example.com/exam-info"
                  />
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-medium text-gray-700 block">หมวดหมู่</span>
                  <div className="flex flex-wrap gap-2">
                    {Object.keys(CATEGORY_STYLES).map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`px-4 py-2 rounded-lg text-xs font-medium border transition-all
                          ${editFormData.type_event.includes(tag)
                            ? CATEGORY_STYLES[tag] + " ring-2 ring-green-500/30"
                            : "bg-white text-gray-500 border-gray-200 hover:border-green-300"}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label htmlFor="edit-cal-start" className="text-xs font-medium text-gray-700">วันเริ่มต้น</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      <input
                        id="edit-cal-start"
                        aria-label="วันเริ่มต้น"
                        type="date"
                        value={editFormData.startDate}
                        onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                        className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:bg-white text-sm"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="edit-cal-end" className="text-xs font-medium text-gray-700">วันสิ้นสุด</label>
                    <div className="relative">
                      <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                      <input
                        id="edit-cal-end"
                        aria-label="วันสิ้นสุด"
                        type="date"
                        value={editFormData.endDate}
                        onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                        className="w-full pl-10 pr-3 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-green-500 focus:bg-white text-sm"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 py-3 rounded-xl font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all text-sm"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="flex-[2] py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-all text-sm shadow-md shadow-green-100"
                  >
                    บันทึกการแก้ไข
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Navbar_admin>
  );
}

export default Page;