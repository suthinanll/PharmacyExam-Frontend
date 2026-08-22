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
} from "lucide-react";
import Link from "next/link";
import NoteList from "@/components/note/NoteList";
import Toast from "@/components/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireLogin } from "@/utils/requireAuth";

interface ExamSchedule {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  timeRange: string;
  description: string;
  link_url?: string;
  type_event: string[];
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

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

const TYPE_EVENT_STYLES: Record<
  string,
  { bg: string; text: string; border: string; dot: string }
> = {
  "PLE-IP1, PC1, PHCP1": {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-300",
    dot: "bg-green-400",
  },
  "PLE-IP2": {
    bg: "bg-teal-50",
    text: "text-teal-700",
    border: "border-teal-300",
    dot: "bg-teal-400",
  },
  "PLE-PC2": {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-300",
    dot: "bg-green-400",
  },
  "PLE-PHCP2": {
    bg: "bg-lime-50",
    text: "text-lime-700",
    border: "border-lime-300",
    dot: "bg-lime-400",
  },
};

const DEFAULT_STYLE = {
  bg: "bg-gray-100",
  text: "text-gray-600",
  border: "border-gray-300",
  dot: "bg-gray-400",
};

const getTypeStyle = (type: string) => TYPE_EVENT_STYLES[type] || DEFAULT_STYLE;

const CalenderPage = () => {
  const { getToken, isAuthenticated } = useAuth();
  const { requireLogin } = useRequireLogin();
  const [adminSchedules, setAdminSchedules] = useState<ExamSchedule[]>([]);
  const [userNotes, setUserNotes] = useState<UserNote[]>([]);
  const [tagFilter, setTagFilter] = useState("");
  const [toast, setToast] = useState<{ type: "success" | "error" | "warning" | "info"; message: string } | null>(null);

  const [viewDate, setViewDate] = useState(new Date());
  const selectedMonth = viewDate.getMonth();
  const selectedYear = viewDate.getFullYear();

  const [selectedEvent, setSelectedEvent] = useState<ExamSchedule | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [dayEventsModal, setDayEventsModal] = useState<{ date: number; events: ExamSchedule[] } | null>(null);

  const monthsNames = useMemo(
    () => [
      "มกราคม",
      "กุมภาพันธ์",
      "มีนาคม",
      "เมษายน",
      "พฤษภาคม",
      "มิถุนายน",
      "กรกฎาคม",
      "สิงหาคม",
      "กันยายน",
      "ตุลาคม",
      "พฤศจิกายน",
      "ธันวาคม",
    ],
    [],
  );

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
      const formatted: ExamSchedule[] = data
        .filter((item: any) => item.is_public === true || item.is_public === 1)
        .map((item: any) => {
          const start = new Date(item.start_time);
          const end = new Date(item.end_time);
          return {
            id: `admin-${item.id}`,
            title: item.title,
            startDate: start,
            endDate: end,
            timeRange: `${start.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })} - ${end.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" })}`,
            description: item.description || "",
            link_url: item.link_url || "",
            type_event: Array.isArray(item.type_event)
              ? item.type_event
              : (typeof item.type_event === "string"
                ? item.type_event.replace(/^{|}$/g, '').split(',')
                : []),
          };
        });
      setAdminSchedules(formatted);
    } catch (error) {
      console.error("fetchAdminSchedules error:", error);
    }
  }, [getToken]);

  const fetchNotes = async () => {
    try {
      const token = getToken();
      if (!token) return;
      const res = await fetch(`${API_URL}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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
    } catch (err) {
      console.error("fetchNotes error:", err);
    }
  };

  useEffect(() => {
    fetchNotes();
    fetchAdminSchedules();
  }, [fetchAdminSchedules]);

  const handlePreviousMonth = () =>
    setViewDate(new Date(selectedYear, selectedMonth - 1, 1));
  const handleNextMonth = () =>
    setViewDate(new Date(selectedYear, selectedMonth + 1, 1));

  const getSchedulesForDate = (date: number) => {
    const target = new Date(selectedYear, selectedMonth, date);
    target.setHours(0, 0, 0, 0);
    return adminSchedules.filter((s) => {
      const start = new Date(s.startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(s.endDate);
      end.setHours(0, 0, 0, 0);
      return target >= start && target <= end;
    });
  };

  const isToday = (date: number) => {
    const today = new Date();
    return (
      today.getDate() === date &&
      today.getMonth() === selectedMonth &&
      today.getFullYear() === selectedYear
    );
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const days = [];

    // ช่องว่างเดือนก่อน
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div
          key={`empty-${i}`}
          className="min-h-[48px] sm:min-h-[90px] md:min-h-[105px] border border-gray-100 bg-gray-50/30"
        />,
      );
    }

    for (let date = 1; date <= daysInMonth; date++) {
      const daySchedules = getSchedulesForDate(date);
      const today = isToday(date);
      const dayOfWeek = (firstDay + date - 1) % 7;
      const isSunday = dayOfWeek === 0;

      days.push(
        <div
          key={date}
          onClick={() => {
            if (daySchedules.length === 1) {
              setSelectedEvent(daySchedules[0]);
              setIsViewModalOpen(true);
            } else if (daySchedules.length > 1) {
              setDayEventsModal({ date, events: daySchedules });
            }
          }}
          className={`min-h-[48px] sm:min-h-[90px] md:min-h-[105px] border p-1 sm:p-1.5 md:p-2 flex flex-col justify-between sm:justify-start transition-all relative
            ${daySchedules.length > 0 ? "cursor-pointer sm:cursor-default hover:bg-gray-50/90 active:scale-[0.98] sm:active:scale-100" : ""}
            ${today
              ? "border-green-400 bg-green-50/40 ring-1 ring-green-400 z-1"
              : "border-gray-200 bg-white hover:bg-gray-50/80"
            }`}
        >
          {/* วันที่ */}
          <div className="flex items-center justify-between">
            <span
              className={`text-xs sm:text-sm font-semibold inline-flex items-center justify-center
                ${today
                  ? "w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-green-600 text-white shadow-xs text-[11px] sm:text-xs"
                  : isSunday
                    ? "text-red-500"
                    : "text-gray-700"
                }`}
            >
              {date}
            </span>
            {today && (
              <span className="hidden sm:inline-block text-[9px] bg-green-600 text-white px-1.5 py-0.5 rounded font-medium">
                วันนี้
              </span>
            )}
          </div>

          {/* Events - Mobile View (แสดงจุดสัญลักษณ์สีแบบสมมาตร) */}
          {daySchedules.length > 0 && (
            <div className="flex sm:hidden items-center justify-center gap-1 mt-0.5 flex-wrap">
              {daySchedules.slice(0, 3).map((schedule, idx) => {
                const primaryType = schedule.type_event[0];
                const style = primaryType ? getTypeStyle(primaryType) : DEFAULT_STYLE;
                return (
                  <span
                    key={idx}
                    className={`w-1.5 h-1.5 rounded-full ${style.dot} ring-1 ring-white`}
                    title={schedule.title}
                  />
                );
              })}
              {daySchedules.length > 3 && (
                <span className="text-[8px] font-bold text-gray-500 leading-none">
                  +{daySchedules.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Events - Desktop View (แสดงการ์ดรายการเต็ม) */}
          <div className="hidden sm:flex flex-col gap-1 mt-1.5 overflow-y-auto max-h-[70px] custom-scrollbar">
            {daySchedules.map((schedule) => {
              const primaryType = schedule.type_event[0];
              const style = primaryType
                ? getTypeStyle(primaryType)
                : DEFAULT_STYLE;
              return (
                <button
                  key={`${schedule.id}-${date}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEvent(schedule);
                    setIsViewModalOpen(true);
                  }}
                  className={`w-full text-left px-1.5 py-1 rounded-md border-l-2 text-[10px] font-medium truncate transition-all hover:opacity-85 shadow-2xs cursor-pointer
                    ${style.bg} ${style.text} ${style.border}`}
                >
                  {/* dot tags */}
                  {schedule.type_event.length > 0 && (
                    <div className="flex gap-0.5 mb-0.5">
                      {schedule.type_event.map((t, i) => (
                        <span
                          key={i}
                          className={`inline-block w-1.5 h-1.5 rounded-full ${getTypeStyle(t).dot}`}
                        />
                      ))}
                    </div>
                  )}
                  <span className="truncate block">{schedule.title}</span>
                </button>
              );
            })}
          </div>
        </div>,
      );
    }

    // ช่องว่างเดือนถัดไป (คำนวณจำนวนแถวให้พอดี ไม่เกิน 5-6 แถว)
    const totalCells = Math.ceil((firstDay + daysInMonth) / 7) * 7;
    const remaining = totalCells - (firstDay + daysInMonth);
    for (let day = 1; day <= remaining; day++) {
      days.push(
        <div
          key={`next-${day}`}
          className="min-h-[48px] sm:min-h-[90px] md:min-h-[105px] border border-gray-100 bg-gray-50/30"
        />,
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

  const updateNote = async (
    note: UserNote,
    files?: File[],
    deletedFiles?: string[],
  ) => {
    try {
      const token = getToken();
      if (!token) return;
      const fd = new FormData();
      fd.append("title", note.title);
      fd.append("content", note.content);
      if (note.link_url !== undefined && note.link_url !== null) {
        fd.append("link_url", note.link_url);
      }
      fd.append(
        "tagIds",
        JSON.stringify(
          note.tags.map((t) => (typeof t === "object" ? (t as any).name : t)),
        ),
      );
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

  return (
    <>
      {isAuthenticated ? <Navbar /> : <NavbarGuest />}
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
      <div className="min-h-screen bg-gray-50 p-3.5 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-3 sm:mb-5">
            <Link href={isAuthenticated ? "/user" : "/"} className="hover:text-green-600 cursor-pointer transition">
              หน้าหลัก
            </Link>
            <span className="mx-1.5 sm:mx-2">›</span>
            <span className="text-gray-600 font-medium">ปฏิทินการสอบ</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-medium text-gray-800 mb-4 sm:mb-6">
            ปฏิทินกำหนดการสอบ
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
            {/* ── Calendar ──────────────────────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3.5 sm:p-6">
                {/* Month Nav */}
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <button
                    onClick={handlePreviousMonth}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors border border-gray-200 cursor-pointer"
                    title="เดือนก่อนหน้า"
                  >
                    <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                  <h2 className="text-base sm:text-xl font-semibold text-gray-800">
                    {monthsNames[selectedMonth]}{" "}
                    <span className="text-green-600">
                      {selectedYear + 543}
                    </span>
                  </h2>
                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors border border-gray-200 cursor-pointer"
                    title="เดือนถัดไป"
                  >
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 rounded-xl overflow-hidden border border-gray-200">
                  {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day, i) => (
                    <div
                      key={day}
                      className={`py-2 sm:py-3 text-center text-[11px] sm:text-xs font-semibold bg-gray-50 border-b border-gray-200
                        ${i === 0 ? "text-red-500" : "text-gray-600"}`}
                    >
                      {day}
                    </div>
                  ))}
                  {renderCalendar()}
                </div>

                {/* Legend */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-sm font-medium text-gray-500  mb-3">
                    ประเภทกำหนดการ
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {/* วันนี้ */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="w-3 h-3 rounded-sm bg-green-50 border border-green-400 inline-block" />
                      วันนี้
                    </div>
                    {/* Dynamic tags */}
                    {allTypes.map((type) => {
                      const style = getTypeStyle(type);
                      return (
                        <div
                          key={type}
                          className="flex items-center gap-1.5 text-xs text-gray-600"
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full inline-block ${style.dot}`}
                          />
                          {type}
                        </div>
                      );
                    })}
                    {allTypes.length === 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-400">
                        <span className="w-2.5 h-2.5 rounded-full inline-block bg-gray-300" />
                        กำหนดการทั่วไป
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* ── NoteList (เฉพาะ user ที่ login) ──────────────────────── */}
            {isAuthenticated ? (
              <NoteList
                notes={userNotes}
                onSaveNote={createNote}
                onUpdateNote={updateNote}
                onDeleteNote={deleteNote}
                tagFilter={tagFilter}
                setTagFilter={setTagFilter}
              />
            ) : (
              <div className="bg-white rounded-xl shadow-xl p-6 border border-slate-100 flex flex-col items-center justify-center text-center h-fit lg:sticky lg:top-24">
                <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-4">
                  <Bookmark className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-1">บันทึกสรุป</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">
                  เข้าสู่ระบบเพื่อสร้างและบันทึกโน้ตสรุปการเรียนรู้ของคุณ
                </p>
                <Link
                  href="/login"
                  className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" /> เข้าสู่ระบบ
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal รายการกำหนดการประจำวัน (สำหรับมือถือเมื่อมีหลายรายการ) ──────── */}
      {dayEventsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden animate-fade-in">
            <div className="bg-green-600 px-5 py-3.5 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-4 h-4" />
                <h3 className="font-medium text-sm">
                  กำหนดการวันที่ {dayEventsModal.date} {monthsNames[selectedMonth]} {selectedYear + 543}
                </h3>
              </div>
              <button
                onClick={() => setDayEventsModal(null)}
                className="p-1 hover:bg-green-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <p className="text-xs text-gray-500 mb-2">มีทั้งหมด {dayEventsModal.events.length} กำหนดการ (แตะเพื่อดูรายละเอียด):</p>
              {dayEventsModal.events.map((schedule) => {
                const primaryType = schedule.type_event[0];
                const style = primaryType ? getTypeStyle(primaryType) : DEFAULT_STYLE;
                return (
                  <button
                    key={schedule.id}
                    onClick={() => {
                      setSelectedEvent(schedule);
                      setDayEventsModal(null);
                      setIsViewModalOpen(true);
                    }}
                    className={`w-full text-left p-3 rounded-xl border-l-3 transition-all hover:opacity-90 flex flex-col gap-1 cursor-pointer shadow-xs ${style.bg} ${style.border}`}
                  >
                    <span className={`text-xs font-semibold ${style.text}`}>{schedule.title}</span>
                    <div className="flex flex-wrap items-center gap-1 mt-0.5">
                      {schedule.type_event.map((t, idx) => (
                        <span key={idx} className="text-[10px] bg-white/70 px-1.5 py-0.5 rounded text-gray-600 font-medium">
                          {t}
                        </span>
                      ))}
                      {schedule.link_url && (
                        <span className="inline-flex items-center gap-0.5 text-[9px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 font-medium">
                          <ExternalLink className="w-2.5 h-2.5" /> มีลิงก์แนบ
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal รายละเอียด ──────────────────────────────────────────── */}
      {isViewModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-green-600 px-6 py-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                <h3 className="font-medium">รายละเอียดกำหนดการ</h3>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-1 hover:bg-green-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Title + Tags */}
              <div>
                <h4 className="text-xl font-medium text-gray-800 mb-3">
                  {selectedEvent.title}
                </h4>
                {selectedEvent.type_event.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.type_event.map((type, i) => {
                      const style = getTypeStyle(type);
                      return (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-default
                            ${style.bg} ${style.text} ${style.border}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${style.dot}`}
                          />
                          {type}
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <span className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                    กำหนดการทั่วไป
                  </span>
                )}
              </div>

              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500  mb-0.5">
                    วันที่
                  </p>
                  <p className="text-md font-medium text-gray-700">
                    {selectedEvent.startDate.toLocaleDateString("th-TH", {
                      dateStyle: "long",
                    })}
                    {selectedEvent.startDate.toDateString() !==
                      selectedEvent.endDate.toDateString() &&
                      ` – ${selectedEvent.endDate.toLocaleDateString("th-TH", { dateStyle: "long" })}`}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center shrink-0">
                  <AlignLeft className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-500  mb-1">
                    รายละเอียด
                  </p>
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
                    <p className="text-sm font-medium text-gray-500 mb-1">
                      ลิงก์แนบ / เอกสารอ้างอิง
                    </p>
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

              <button
                onClick={() => setIsViewModalOpen(false)}
                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-xl transition-all text-sm cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default CalenderPage;
