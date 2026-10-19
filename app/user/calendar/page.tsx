"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import Navbar from "@/components/Navbar_user";
import NavbarGuest from "@/components/Navbar_guest";
import Footer from "@/components/Footer";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  AlignLeft,
  X,
  Info,
  Bookmark,
  LogIn,
  ExternalLink,
  Link as LinkIcon,
  Plus,
  Star,
  Pencil,
  Trash2,
  User as UserIcon,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import NoteList from "@/components/note/NoteList";
import Toast from "@/components/Toast";
import Swal from "@/utils/sweetalert";
import { SWAL_COLORS } from "@/utils/swal";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireLogin } from "@/utils/requireAuth";

/**
 * กำหนดการในปฏิทินมี 2 แบบ
 * - admin:    กำหนดการสอบจากผู้ดูแลระบบ (ทุกคนเห็น) ผู้ใช้มาร์ค ★ ไว้ว่าสนใจได้
 * - personal: กำหนดการส่วนตัวที่ผู้ใช้สร้างเอง เห็นเฉพาะเจ้าของ (API /personal-calendar)
 */
interface CalendarItem {
  id: string;
  kind: "admin" | "personal";
  /** schedule_id ของแอดมิน หรือ id ของกำหนดการส่วนตัว */
  sourceId: number;
  title: string;
  startDate: Date;
  endDate: Date;
  description: string;
  link_url?: string;
  type_event: string[];
  marked: boolean;
}

interface PersonalEventApi {
  id: number;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
}

interface Tag {
  id: number;
  name: string;
}
interface UserNote {
  id: string;
  title: string;
  content: string;
  link_url?: string;
  tags: Tag[];
  files: string[];
  createdAt: number;
}

type ViewFilter = "all" | "marked" | "personal";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

/**
 * สีตามประเภทหลักสูตร — ใช้ 2 กลุ่มสีหลักของระบบ
 * ความรู้ร่วม (CC) = น้ำเงิน, เฉพาะสาขา = เขียว แยกเฉดภายในกลุ่ม
 */
const TYPE_EVENT_STYLES: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "PLE-CC1": { bg: "bg-blue-50", text: "text-blue-800", border: "border-blue-400", dot: "bg-blue-500" },
  "PLE-CC2": { bg: "bg-sky-50", text: "text-sky-800", border: "border-sky-400", dot: "bg-sky-500" },
  "PLE-IP1, PC1, PHCP1": { bg: "bg-lime-50", text: "text-lime-800", border: "border-lime-500", dot: "bg-lime-500" },
  "PLE-IP2": { bg: "bg-green-50", text: "text-green-800", border: "border-green-500", dot: "bg-green-500" },
  "PLE-PC2": { bg: "bg-emerald-50", text: "text-emerald-800", border: "border-emerald-500", dot: "bg-emerald-500" },
  "PLE-PHCP2": { bg: "bg-teal-50", text: "text-teal-800", border: "border-teal-500", dot: "bg-teal-500" },
};

const DEFAULT_STYLE = { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-400", dot: "bg-gray-400" };

/** กำหนดการส่วนตัวใช้สีส้มอำพัน แยกจากกำหนดการของแอดมินชัดเจน */
const PERSONAL_STYLE = { bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-500", dot: "bg-amber-500" };

const getTypeStyle = (type: string) => TYPE_EVENT_STYLES[type] || DEFAULT_STYLE;
const styleOf = (item: CalendarItem) =>
  item.kind === "personal" ? PERSONAL_STYLE : item.type_event[0] ? getTypeStyle(item.type_event[0]) : DEFAULT_STYLE;

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

/** "2026-10-22" → Date เวลาท้องถิ่น 00:00 (new Date("2026-10-22") จะเป็นเวลา UTC) */
const parseDateOnly = (s: string) => {
  const [y, m, d] = s.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
};
const toDateInput = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

const CalenderPage = () => {
  const { getToken, isAuthenticated } = useAuth();
  const { requireLogin } = useRequireLogin();
  const [adminSchedules, setAdminSchedules] = useState<CalendarItem[]>([]);
  const [personalEvents, setPersonalEvents] = useState<PersonalEventApi[]>([]);
  const [markedIds, setMarkedIds] = useState<Set<number>>(new Set());
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [userNotes, setUserNotes] = useState<UserNote[]>([]);
  const [isNotesLoading, setIsNotesLoading] = useState(true);
  const [tagFilter, setTagFilter] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);

  const [viewDate, setViewDate] = useState(new Date());
  const selectedMonth = viewDate.getMonth();
  const selectedYear = viewDate.getFullYear();

  const [selectedEvent, setSelectedEvent] = useState<CalendarItem | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [dayEventsModal, setDayEventsModal] = useState<{ date: number; events: CalendarItem[] } | null>(null);
  /** หน้าต่างสร้าง/แก้ไขกำหนดการส่วนตัว (editing = null คือสร้างใหม่) */
  const [formModal, setFormModal] = useState<{ editing: PersonalEventApi | null; date?: Date } | null>(null);

  const fetchAdminSchedules = useCallback(async () => {
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
      const res = await fetch(`${API_URL}/schedules`, { headers });
      if (!res.ok) {
        console.error("fetchAdminSchedules error: status", res.status);
        return;
      }
      const data = await res.json();
      const formatted: CalendarItem[] = data
        .filter((item: any) => item.is_public === true || item.is_public === 1)
        .map((item: any) => ({
          id: `admin-${item.id}`,
          kind: "admin" as const,
          sourceId: Number(item.id),
          title: item.title,
          startDate: new Date(item.start_time),
          endDate: new Date(item.end_time ?? item.start_time),
          description: item.description || "",
          link_url: item.link_url || "",
          type_event: Array.isArray(item.type_event)
            ? item.type_event
            : typeof item.type_event === "string"
              ? item.type_event.replace(/^{|}$/g, "").split(",")
              : [],
          marked: false,
        }));
      setAdminSchedules(formatted);
    } catch (error) {
      console.error("fetchAdminSchedules error:", error);
    }
  }, [getToken]);

  /** กำหนดการส่วนตัว + รายการที่มาร์คไว้ (เฉพาะผู้ที่เข้าสู่ระบบ) */
  const fetchPersonal = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/personal-calendar`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data: { events: PersonalEventApi[]; marked_schedule_ids: number[] } = await res.json();
      setPersonalEvents(data.events);
      setMarkedIds(new Set(data.marked_schedule_ids));
    } catch (error) {
      console.error("fetchPersonal error:", error);
    }
  }, [getToken]);

  const fetchNotes = async () => {
    try {
      setIsNotesLoading(true);
      const token = getToken();
      if (!token) {
        setIsNotesLoading(false);
        return;
      }
      const res = await fetch(`${API_URL}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const mapped: UserNote[] = data.map((n: any) => ({
          id: String(n.note_id),
          title: n.title,
          content: n.content,
          link_url: n.link_url || "",
          tags: n.tags || [],
          files: n.files || [],
          createdAt: new Date(n.created_at).getTime(),
        }));
        setUserNotes(mapped);
      }
    } catch (err) {
      console.error("fetchNotes error:", err);
    } finally {
      setIsNotesLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchAdminSchedules();
    fetchPersonal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchAdminSchedules, fetchPersonal]);

  /** รวมกำหนดการทั้งสองแบบ แล้วกรองตามมุมมองที่เลือก */
  const allItems = useMemo<CalendarItem[]>(() => {
    const admin = adminSchedules.map((s) => ({ ...s, marked: markedIds.has(s.sourceId) }));
    const personal: CalendarItem[] = personalEvents.map((e) => ({
      id: `personal-${e.id}`,
      kind: "personal",
      sourceId: e.id,
      title: e.title,
      startDate: parseDateOnly(e.start_date),
      endDate: parseDateOnly(e.end_date),
      description: e.description,
      type_event: [],
      marked: false,
    }));
    const merged = [...personal, ...admin];
    if (viewFilter === "marked") return merged.filter((i) => i.marked);
    if (viewFilter === "personal") return merged.filter((i) => i.kind === "personal");
    return merged;
  }, [adminSchedules, personalEvents, markedIds, viewFilter]);

  const handlePreviousMonth = () => setViewDate(new Date(selectedYear, selectedMonth - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(selectedYear, selectedMonth + 1, 1));

  const getSchedulesForDate = (date: number) => {
    const target = new Date(selectedYear, selectedMonth, date);
    target.setHours(0, 0, 0, 0);
    return allItems
      .filter((s) => {
        const start = new Date(s.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(s.endDate);
        end.setHours(0, 0, 0, 0);
        return target >= start && target <= end;
      })
      // ของฉันและที่มาร์คไว้ขึ้นก่อน
      .sort((a, b) => Number(b.kind === "personal" || b.marked) - Number(a.kind === "personal" || a.marked));
  };

  const isToday = (date: number) => {
    const today = new Date();
    return today.getDate() === date && today.getMonth() === selectedMonth && today.getFullYear() === selectedYear;
  };

  const openEvent = (item: CalendarItem) => {
    setSelectedEvent(item);
    setIsViewModalOpen(true);
  };

  const openCreate = (date?: Date) => {
    if (!isAuthenticated) return requireLogin("เพิ่มกำหนดการของฉัน");
    setFormModal({ editing: null, date });
  };

  // ── มาร์คกำหนดการของแอดมิน ─────────────────────────────────────────────
  const toggleMark = async (item: CalendarItem) => {
    if (!isAuthenticated) return requireLogin("มาร์คกำหนดการที่สนใจ");
    const willMark = !markedIds.has(item.sourceId);
    // อัปเดตหน้าจอก่อน แล้วค่อยย้อนกลับถ้าบันทึกไม่สำเร็จ
    setMarkedIds((prev) => {
      const next = new Set(prev);
      if (willMark) next.add(item.sourceId);
      else next.delete(item.sourceId);
      return next;
    });
    setSelectedEvent((prev) => (prev && prev.id === item.id ? { ...prev, marked: willMark } : prev));
    try {
      const res = await fetch(`${API_URL}/personal-calendar/marks/${item.sourceId}`, {
        method: willMark ? "PUT" : "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      setToast({ type: "success", message: willMark ? "มาร์คกำหนดการนี้แล้ว" : "ยกเลิกการมาร์คแล้ว" });
    } catch {
      setMarkedIds((prev) => {
        const next = new Set(prev);
        if (willMark) next.delete(item.sourceId);
        else next.add(item.sourceId);
        return next;
      });
      setSelectedEvent((prev) => (prev && prev.id === item.id ? { ...prev, marked: !willMark } : prev));
      setToast({ type: "error", message: "บันทึกการมาร์คไม่สำเร็จ" });
    }
  };

  // ── กำหนดการส่วนตัว ────────────────────────────────────────────────────
  const savePersonal = async (values: { title: string; description: string; start_date: string; end_date: string }) => {
    const editing = formModal?.editing;
    const res = await fetch(
      editing ? `${API_URL}/personal-calendar/events/${editing.id}` : `${API_URL}/personal-calendar/events`,
      {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(values),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(Array.isArray(data.message) ? data.message[0] : data.message || "บันทึกไม่สำเร็จ");
    }
    await fetchPersonal();
    setFormModal(null);
    setIsViewModalOpen(false);
    setToast({ type: "success", message: editing ? "แก้ไขกำหนดการของฉันแล้ว" : "เพิ่มกำหนดการของฉันแล้ว" });
    // เลื่อนปฏิทินไปเดือนของกำหนดการที่เพิ่งบันทึก
    const start = parseDateOnly(values.start_date);
    setViewDate(new Date(start.getFullYear(), start.getMonth(), 1));
  };

  const deletePersonal = async (item: CalendarItem) => {
    const confirm = await Swal.fire({
      icon: "warning",
      title: "ลบกำหนดการนี้?",
      text: item.title,
      showCancelButton: true,
      confirmButtonText: "ลบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: SWAL_COLORS.danger,
      cancelButtonColor: SWAL_COLORS.cancel,
      reverseButtons: true,
    });
    if (!confirm.isConfirmed) return;
    try {
      const res = await fetch(`${API_URL}/personal-calendar/events/${item.sourceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error();
      await fetchPersonal();
      setIsViewModalOpen(false);
      setToast({ type: "success", message: "ลบกำหนดการของฉันแล้ว" });
    } catch {
      setToast({ type: "error", message: "ลบกำหนดการไม่สำเร็จ" });
    }
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const days = [];

    // ช่องว่างเดือนก่อน
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div key={`empty-${i}`} className="min-h-[48px] sm:min-h-[90px] md:min-h-[105px] border border-gray-100 bg-gray-50/30" />,
      );
    }

    for (let date = 1; date <= daysInMonth; date++) {
      const daySchedules = getSchedulesForDate(date);
      const today = isToday(date);
      const dayOfWeek = (firstDay + date - 1) % 7;
      const isSunday = dayOfWeek === 0;
      const cellDate = new Date(selectedYear, selectedMonth, date);

      days.push(
        <div
          key={date}
          onClick={() => {
            if (daySchedules.length === 1) openEvent(daySchedules[0]);
            else if (daySchedules.length > 1) setDayEventsModal({ date, events: daySchedules });
            else if (isAuthenticated) openCreate(cellDate);
          }}
          className={`group/day min-h-[48px] sm:min-h-[90px] md:min-h-[105px] border p-1 sm:p-1.5 md:p-2 flex flex-col justify-between sm:justify-start transition-all relative cursor-pointer
            ${today ? "border-primary bg-primary-soft ring-1 ring-primary z-1" : "border-gray-200 bg-white hover:bg-gray-50"}`}
        >
          {/* วันที่ */}
          <div className="flex items-center justify-between">
            <span
              className={`text-xs sm:text-sm font-medium inline-flex items-center justify-center
                ${today
                  ? "w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-primary text-on-primary shadow-xs text-[0.6875rem] sm:text-xs"
                  : isSunday
                    ? "text-red-600"
                    : "text-gray-700"
                }`}
            >
              {date}
            </span>
            {today ? (
              <span className="hidden sm:inline-block text-[0.5625rem] bg-primary text-on-primary px-1.5 py-0.5 rounded font-medium">
                วันนี้
              </span>
            ) : (
              isAuthenticated && (
                // ปุ่มเพิ่มกำหนดการของฉันในวันนั้น (แสดงตอนชี้เมาส์บนจอใหญ่)
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCreate(cellDate);
                  }}
                  aria-label={`เพิ่มกำหนดการของฉันวันที่ ${date}`}
                  className="hidden sm:flex w-5 h-5 items-center justify-center rounded-md text-gray-500 opacity-0 group-hover/day:opacity-100 hover:bg-primary-soft hover:text-primary-hover transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              )
            )}
          </div>

          {/* มือถือ: จุดสี (ดาวสำหรับที่มาร์ค) */}
          {daySchedules.length > 0 && (
            <div className="flex sm:hidden items-center justify-center gap-1 mt-0.5 flex-wrap">
              {daySchedules.slice(0, 3).map((schedule) =>
                schedule.marked ? (
                  <Star key={schedule.id} className="w-2 h-2 fill-amber-400 text-amber-500" />
                ) : (
                  <span key={schedule.id} className={`w-1.5 h-1.5 rounded-full ${styleOf(schedule).dot} ring-1 ring-white`} />
                ),
              )}
              {daySchedules.length > 3 && (
                <span className="text-[0.5rem] font-medium text-gray-500 leading-none">+{daySchedules.length - 3}</span>
              )}
            </div>
          )}

          {/* จอใหญ่: การ์ดรายการ */}
          <div className="hidden sm:flex flex-col gap-1 mt-1.5 overflow-y-auto max-h-[70px] custom-scrollbar">
            {daySchedules.map((schedule) => {
              const style = styleOf(schedule);
              return (
                <button
                  key={`${schedule.id}-${date}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    openEvent(schedule);
                  }}
                  className={`w-full text-left px-1.5 py-1 rounded-md border-l-2 text-[0.625rem] font-medium truncate transition-all hover:opacity-85 shadow-2xs cursor-pointer
                    ${style.bg} ${style.text} ${style.border} ${schedule.marked ? "ring-1 ring-amber-400" : ""}`}
                >
                  <span className="flex items-center gap-1 truncate" title={schedule.title}>
                    {schedule.marked && <Star className="w-2.5 h-2.5 shrink-0 fill-amber-400 text-amber-500" />}
                    {schedule.kind === "personal" && <UserIcon className="w-2.5 h-2.5 shrink-0" />}
                    <span className="truncate">{getShortEventTitle(schedule.title)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>,
      );
    }

    // ช่องว่างเดือนถัดไป
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remaining = totalCells - (firstDay + daysInMonth);
    for (let day = 1; day <= remaining; day++) {
      days.push(
        <div key={`next-${day}`} className="min-h-[48px] sm:min-h-[90px] md:min-h-[105px] border border-gray-100 bg-gray-50/30" />,
      );
    }

    return days;
  };

  // ── Note CRUD ────────────────────────────────────────────────────────────────
  const createNote = async (note: any, files?: File[]) => {
    try {
      const token = getToken();
      if (!token) return;
      const fd = new FormData();
      fd.append("title", note.title);
      fd.append("content", note.content);
      if (note.link_url !== undefined && note.link_url !== null) {
        fd.append("link_url", note.link_url);
      }
      fd.append("tagIds", JSON.stringify(note.tags));
      if (files) files.forEach((f) => fd.append("files", f));
      await fetch(`${API_URL}/notes`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      fetchNotes();
      setToast({ type: "success", message: "บันทึกโน้ตสำเร็จ" });
    } catch (error) {
      setToast({ type: "error", message: "ไม่สามารถบันทึกโน้ตได้" });
    }
  };

  const updateNote = async (note: UserNote, files?: File[], deletedFiles?: string[]) => {
    try {
      const token = getToken();
      if (!token) return;
      const fd = new FormData();
      fd.append("title", note.title);
      fd.append("content", note.content);
      if (note.link_url !== undefined && note.link_url !== null) {
        fd.append("link_url", note.link_url);
      }
      fd.append("tagIds", JSON.stringify(note.tags.map((t) => (typeof t === "object" ? (t as any).name : t))));
      fd.append("deletedFiles", JSON.stringify(deletedFiles || []));
      if (files) files.forEach((f) => fd.append("files", f));
      await fetch(`${API_URL}/notes/${note.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      fetchNotes();
      setToast({ type: "success", message: "แก้ไขโน้ตสำเร็จ" });
    } catch (error) {
      setToast({ type: "error", message: "ไม่สามารถแก้ไขโน้ตได้" });
    }
  };

  const deleteNote = async (id: string) => {
    try {
      const token = getToken();
      if (!token) return;
      await fetch(`${API_URL}/notes/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotes();
      setToast({ type: "success", message: "ลบโน้ตสำเร็จ" });
    } catch (error) {
      setToast({ type: "error", message: "ไม่สามารถลบโน้ตได้" });
    }
  };

  // ── Unique type_event ทั้งหมดสำหรับ Legend ───────────────────────────────────
  const allTypes = useMemo(() => {
    const set = new Set<string>();
    adminSchedules.forEach((s) => s.type_event.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [adminSchedules]);

  /** ที่มาร์คไว้และของฉัน ที่ยังไม่ผ่านไป เรียงตามวัน (แสดงใต้ปฏิทิน) */
  const myUpcoming = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return [
      ...adminSchedules.filter((s) => markedIds.has(s.sourceId)).map((s) => ({ ...s, marked: true })),
      ...personalEvents.map((e) => ({
        id: `personal-${e.id}`,
        kind: "personal" as const,
        sourceId: e.id,
        title: e.title,
        startDate: parseDateOnly(e.start_date),
        endDate: parseDateOnly(e.end_date),
        description: e.description,
        type_event: [],
        marked: false,
      })),
    ]
      .filter((i) => i.endDate >= today)
      .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
      .slice(0, 6);
  }, [adminSchedules, personalEvents, markedIds]);

  const formatRange = (item: CalendarItem) => {
    const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
    const start = item.startDate.toLocaleDateString("th-TH", opts);
    return item.startDate.toDateString() === item.endDate.toDateString()
      ? start
      : `${start} – ${item.endDate.toLocaleDateString("th-TH", opts)}`;
  };

  const FILTERS: { value: ViewFilter; label: string }[] = [
    { value: "all", label: "ทั้งหมด" },
    { value: "marked", label: "ที่มาร์คไว้" },
    { value: "personal", label: "ของฉัน" },
  ];

  return (
    <>
      {isAuthenticated ? <Navbar /> : <NavbarGuest />}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
      <div className="min-h-screen bg-gray-50 p-3.5 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-3 sm:mb-5">
            <Link href={isAuthenticated ? "/user" : "/"} className="hover:text-primary-hover cursor-pointer transition">
              หน้าหลัก
            </Link>
            <span className="mx-1.5 sm:mx-2">›</span>
            <span className="text-gray-600 font-medium">ปฏิทินการสอบ</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-800">ปฏิทินกำหนดการสอบ</h1>
            <button
              type="button"
              onClick={() => openCreate()}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-medium hover:bg-primary-hover transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> เพิ่มกำหนดการของฉัน
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* ── Calendar ──────────────────────────────────────────────── */}
            <div className="lg:col-span-2 space-y-5">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3.5 sm:p-6">
                {/* Month Nav */}
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={handlePreviousMonth}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors border border-gray-200 cursor-pointer"
                    title="เดือนก่อนหน้า"
                    aria-label="เดือนก่อนหน้า"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <h2 className="text-base sm:text-xl font-medium text-gray-800">
                    {MONTHS[selectedMonth]} <span className="text-primary-hover dark:text-lime-400">{selectedYear + 543}</span>
                  </h2>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors border border-gray-200 cursor-pointer"
                    title="เดือนถัดไป"
                    aria-label="เดือนถัดไป"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                {/* ตัวกรองมุมมอง (เฉพาะผู้ที่เข้าสู่ระบบ — ผู้เยี่ยมชมไม่มีของตัวเอง) */}
                {isAuthenticated && (
                  <div role="tablist" aria-label="แสดงกำหนดการ" className="mb-4 inline-flex rounded-xl bg-gray-100 p-1">
                    {FILTERS.map((f) => (
                      <button
                        key={f.value}
                        type="button"
                        role="tab"
                        aria-selected={viewFilter === f.value}
                        onClick={() => setViewFilter(f.value)}
                        className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer ${
                          viewFilter === f.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                )}

                {/* Grid */}
                <div className="grid grid-cols-7 rounded-xl overflow-hidden border border-gray-200">
                  {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day, i) => (
                    <div
                      key={day}
                      className={`py-2 sm:py-3 text-center text-[0.6875rem] sm:text-xs font-medium bg-gray-50 border-b border-gray-200
                        ${i === 0 ? "text-red-600" : "text-gray-600"}`}
                    >
                      {day}
                    </div>
                  ))}
                  {renderCalendar()}
                </div>

                {/* Legend */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-500 mb-3">ประเภทกำหนดการ</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                      <span className="w-3 h-3 rounded-sm bg-primary-soft border border-primary inline-block" />
                      วันนี้
                    </div>
                    {isAuthenticated && (
                      <>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <span className={`w-2.5 h-2.5 rounded-full inline-block ${PERSONAL_STYLE.dot}`} />
                          กำหนดการของฉัน
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Star className="w-3 h-3 fill-amber-400 text-amber-500" />
                          ที่มาร์คไว้
                        </div>
                      </>
                    )}
                    {allTypes.map((type) => (
                      <div key={type} className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span className={`w-2.5 h-2.5 rounded-full inline-block ${getTypeStyle(type).dot}`} />
                        {type}
                      </div>
                    ))}
                    {allTypes.length === 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <span className="w-2.5 h-2.5 rounded-full inline-block bg-gray-400" />
                        กำหนดการทั่วไป
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ที่มาร์คไว้และของฉันที่กำลังจะถึง */}
              {isAuthenticated && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6">
                  <h2 className="text-base font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    ที่มาร์คไว้และกำหนดการของฉันที่กำลังจะถึง
                  </h2>
                  {myUpcoming.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      ยังไม่มีรายการ — กด ☆ ในรายละเอียดกำหนดการเพื่อมาร์ค หรือกด &quot;เพิ่มกำหนดการของฉัน&quot;
                    </p>
                  ) : (
                    <ul className="divide-y divide-gray-100">
                      {myUpcoming.map((item) => {
                        const style = styleOf(item);
                        return (
                          <li key={item.id}>
                            <button
                              type="button"
                              onClick={() => openEvent(item)}
                              className="w-full flex items-start gap-3 py-2.5 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition cursor-pointer"
                            >
                              {item.kind === "personal" ? (
                                <UserIcon className={`w-4 h-4 mt-0.5 shrink-0 ${style.text}`} />
                              ) : (
                                <Star className="w-4 h-4 mt-0.5 shrink-0 fill-amber-400 text-amber-500" />
                              )}
                              <span className="flex-1 min-w-0">
                                <span className="block text-sm text-gray-800 truncate">{item.title}</span>
                                <span className="block text-xs text-gray-500">
                                  {formatRange(item)} · {item.kind === "personal" ? "ของฉัน" : "กำหนดการสอบ"}
                                </span>
                              </span>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              )}
            </div>

            {/* ── NoteList (เฉพาะ user ที่ login) ──────────────────────── */}
            {isAuthenticated ? (
              <NoteList
                notes={userNotes}
                isLoading={isNotesLoading}
                onSaveNoteAction={createNote}
                onUpdateNoteAction={updateNote}
                onDeleteNoteAction={deleteNote}
                tagFilter={tagFilter}
                setTagFilterAction={setTagFilter}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex flex-col items-center justify-center text-center h-fit lg:sticky lg:top-24">
                <div className="w-16 h-16 bg-primary-soft rounded-2xl flex items-center justify-center mb-4">
                  <Bookmark className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">บันทึกสรุปและกำหนดการของฉัน</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">
                  เข้าสู่ระบบเพื่อบันทึกโน้ต เพิ่มกำหนดการของตัวเอง และมาร์คกำหนดการที่สนใจ
                </p>
                <Link
                  href="/login"
                  className="px-5 py-2.5 bg-primary text-on-primary font-medium rounded-xl hover:bg-primary-hover transition flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" /> เข้าสู่ระบบ
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal รายการกำหนดการประจำวัน ──────── */}
      {dayEventsModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fade-in">
            <div className="bg-primary px-6 py-4 flex justify-between items-center text-on-primary">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5" />
                <h3 className="font-medium">
                  กำหนดการวันที่ {dayEventsModal.date} {MONTHS[selectedMonth]} {selectedYear + 543}
                </h3>
              </div>
              <button
                onClick={() => setDayEventsModal(null)}
                aria-label="ปิด"
                className="p-1 hover:bg-primary-hover rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3 max-h-[65vh] overflow-y-auto custom-scrollbar">
              <p className="text-sm text-gray-500 mb-2">
                มีทั้งหมด <span className="font-medium text-gray-700">{dayEventsModal.events.length}</span> กำหนดการ (แตะเพื่อดูรายละเอียด):
              </p>
              {dayEventsModal.events.map((schedule) => {
                const style = styleOf(schedule);
                return (
                  <button
                    key={schedule.id}
                    onClick={() => {
                      setDayEventsModal(null);
                      openEvent(schedule);
                    }}
                    className={`w-full text-left p-3.5 sm:p-4 rounded-xl border-l-4 transition-all hover:opacity-90 flex flex-col gap-1.5 cursor-pointer shadow-xs ${style.bg} ${style.border}`}
                  >
                    <span className={`text-sm font-medium leading-snug flex items-start gap-1.5 ${style.text}`}>
                      {schedule.marked && <Star className="w-4 h-4 mt-0.5 shrink-0 fill-amber-400 text-amber-500" />}
                      {schedule.title}
                    </span>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      {schedule.kind === "personal" && (
                        <span className="text-xs bg-white/80 px-2 py-0.5 rounded-md text-amber-800 font-medium border border-amber-200">
                          กำหนดการของฉัน
                        </span>
                      )}
                      {schedule.type_event.map((t, idx) => (
                        <span key={idx} className="text-xs bg-white/80 px-2 py-0.5 rounded-md text-gray-700 font-medium border border-black/5">
                          {t}
                        </span>
                      ))}
                      {schedule.link_url && (
                        <span className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 font-medium">
                          <ExternalLink className="w-3 h-3" /> มีลิงก์แนบ
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
              {isAuthenticated && (
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date(selectedYear, selectedMonth, dayEventsModal.date);
                    setDayEventsModal(null);
                    openCreate(d);
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-gray-300 text-sm font-medium text-gray-600 hover:border-primary hover:text-primary-hover transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" /> เพิ่มกำหนดการของฉันวันนี้
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal รายละเอียด ──────────────────────────────────────────── */}
      {isViewModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div
              className={`px-6 py-4 flex justify-between items-center ${
                selectedEvent.kind === "personal" ? "bg-amber-500 text-white" : "bg-primary text-on-primary"
              }`}
            >
              <div className="flex items-center gap-2">
                {selectedEvent.kind === "personal" ? <UserIcon className="w-5 h-5" /> : <Info className="w-5 h-5" />}
                <h3 className="font-medium">
                  {selectedEvent.kind === "personal" ? "กำหนดการของฉัน" : "รายละเอียดกำหนดการ"}
                </h3>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                aria-label="ปิด"
                className="p-1 hover:bg-black/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Title + Tags + ปุ่มมาร์ค */}
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h4 className="text-xl font-medium text-gray-800">{selectedEvent.title}</h4>
                  {selectedEvent.kind === "admin" && (
                    <button
                      type="button"
                      onClick={() => toggleMark(selectedEvent)}
                      aria-pressed={selectedEvent.marked}
                      title={selectedEvent.marked ? "ยกเลิกการมาร์ค" : "มาร์คกำหนดการนี้"}
                      className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                        selectedEvent.marked
                          ? "bg-amber-50 border-amber-300 text-amber-800"
                          : "bg-white border-gray-300 text-gray-700 hover:border-amber-300 hover:text-amber-800"
                      }`}
                    >
                      <Star className={`w-4 h-4 ${selectedEvent.marked ? "fill-amber-400 text-amber-500" : ""}`} />
                      {selectedEvent.marked ? "มาร์คแล้ว" : "มาร์ค"}
                    </button>
                  )}
                </div>
                {selectedEvent.kind === "personal" ? (
                  <span className="inline-flex px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-50 text-amber-800 border border-amber-200">
                    เห็นเฉพาะคุณ
                  </span>
                ) : selectedEvent.type_event.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.type_event.map((type, i) => {
                      const style = getTypeStyle(type);
                      return (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-default ${style.bg} ${style.text} ${style.border}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {type}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">
                    กำหนดการทั่วไป
                  </span>
                )}
              </div>

              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-soft border border-primary/30 rounded-lg flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-4 h-4 text-primary-hover" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-0.5">วันที่</p>
                  <p className="text-md font-medium text-gray-700">
                    {selectedEvent.startDate.toLocaleDateString("th-TH", { dateStyle: "long" })}
                    {selectedEvent.startDate.toDateString() !== selectedEvent.endDate.toDateString() &&
                      ` – ${selectedEvent.endDate.toLocaleDateString("th-TH", { dateStyle: "long" })}`}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-primary-soft border border-primary/30 rounded-lg flex items-center justify-center shrink-0">
                  <AlignLeft className="w-4 h-4 text-primary-hover" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500 mb-1">รายละเอียด</p>
                  <p className="text-md text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 border border-gray-100 rounded-xl p-3">
                    {selectedEvent.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                  </p>
                </div>
              </div>

              {/* Link Attachment (ถ้ามี) */}
              {selectedEvent.link_url && (
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center shrink-0">
                    <LinkIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-500 mb-1">ลิงก์แนบ / เอกสารอ้างอิง</p>
                    <a
                      href={selectedEvent.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-sm font-medium border border-blue-200 transition-colors w-full break-all group"
                    >
                      <ExternalLink className="w-4 h-4 shrink-0 text-blue-600 group-hover:scale-110 transition-transform" />
                      <span className="truncate flex-1">{selectedEvent.link_url}</span>
                    </a>
                  </div>
                </div>
              )}

              {selectedEvent.kind === "personal" ? (
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => deletePersonal(selectedEvent)}
                    className="inline-flex items-center justify-center gap-1.5 py-3 rounded-xl border border-red-200 text-red-700 hover:bg-red-50 text-sm font-medium transition cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" /> ลบ
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const editing = personalEvents.find((e) => e.id === selectedEvent.sourceId) ?? null;
                      setFormModal({ editing });
                    }}
                    className="inline-flex items-center justify-center gap-1.5 py-3 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition cursor-pointer"
                  >
                    <Pencil className="w-4 h-4" /> แก้ไข
                  </button>
                  <button
                    onClick={() => setIsViewModalOpen(false)}
                    className="py-3 bg-primary hover:bg-primary-hover text-on-primary font-medium rounded-xl transition-all text-sm cursor-pointer"
                  >
                    ปิด
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsViewModalOpen(false)}
                  className="w-full py-3 bg-primary hover:bg-primary-hover text-on-primary font-medium rounded-xl transition-all text-sm cursor-pointer"
                >
                  ปิด
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal สร้าง/แก้ไขกำหนดการของฉัน ──────────────────────────── */}
      {formModal && (
        <PersonalEventForm
          editing={formModal.editing}
          initialDate={formModal.date}
          onClose={() => setFormModal(null)}
          onSave={savePersonal}
        />
      )}

      <Footer />
    </>
  );
};

function PersonalEventForm({
  editing,
  initialDate,
  onClose,
  onSave,
}: {
  editing: PersonalEventApi | null;
  initialDate?: Date;
  onClose: () => void;
  onSave: (v: { title: string; description: string; start_date: string; end_date: string }) => Promise<void>;
}) {
  const defaultDate = toDateInput(initialDate ?? new Date());
  const [title, setTitle] = useState(editing?.title ?? "");
  const [description, setDescription] = useState(editing?.description ?? "");
  const [startDate, setStartDate] = useState(editing?.start_date ?? defaultDate);
  const [endDate, setEndDate] = useState(editing?.end_date ?? defaultDate);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return setError("กรุณากรอกชื่อกำหนดการ");
    if (endDate < startDate) return setError("วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่ม");
    setSaving(true);
    setError(null);
    try {
      await onSave({ title: title.trim(), description: description.trim(), start_date: startDate, end_date: endDate });
    } catch (err) {
      setError(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[110] p-4">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        <div className="bg-amber-500 px-6 py-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <UserIcon className="w-5 h-5" />
            <h3 className="font-medium">{editing ? "แก้ไขกำหนดการของฉัน" : "เพิ่มกำหนดการของฉัน"}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="ปิด" className="p-1 hover:bg-black/10 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-gray-500">กำหนดการนี้เห็นเฉพาะคุณ ไม่ถูกเพิ่มลงในปฏิทินของผู้ดูแลระบบ</p>
          <div className="space-y-1.5">
            <label htmlFor="pe-title" className="text-sm font-medium text-gray-700">
              ชื่อกำหนดการ <span className="text-red-600">*</span>
            </label>
            <input
              id="pe-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
              placeholder="เช่น อ่านทบทวนเภสัชวิทยา บทที่ 1–3"
              className={inputClass}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="pe-start" className="text-sm font-medium text-gray-700">วันที่เริ่ม</label>
              <input
                id="pe-start"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
                required
                className={inputClass}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="pe-end" className="text-sm font-medium text-gray-700">วันที่สิ้นสุด</label>
              <input
                id="pe-end"
                type="date"
                value={endDate}
                min={startDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className={inputClass}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="pe-desc" className="text-sm font-medium text-gray-700">รายละเอียด (ถ้ามี)</label>
            <textarea
              id="pe-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={1000}
              rows={3}
              className={inputClass}
            />
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
              {error}
            </p>
          )}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-on-primary hover:bg-primary-hover text-sm font-medium transition disabled:opacity-60 cursor-pointer"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              บันทึก
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default CalenderPage;
