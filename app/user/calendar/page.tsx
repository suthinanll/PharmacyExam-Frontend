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
} from "lucide-react";
import Link from "next/link";
import NoteList from "@/components/note/NoteList";
import { useAuth } from "@/contexts/AuthContext";
import { useRequireLogin } from "@/utils/requireAuth";

interface ExamSchedule {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  timeRange: string;
  description: string;
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
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-300",
    dot: "bg-emerald-400",
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

  const [viewDate, setViewDate] = useState(new Date());
  const selectedMonth = viewDate.getMonth();
  const selectedYear = viewDate.getFullYear();

  const [tagFilter, setTagFilter] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<ExamSchedule | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

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
          className="min-h-[100px] border border-gray-100 bg-gray-50/40"
        />,
      );
    }

    for (let date = 1; date <= daysInMonth; date++) {
      const daySchedules = getSchedulesForDate(date);
      const today = isToday(date);

      days.push(
        <div
          key={date}
          className={`min-h-[100px] border p-1.5 flex flex-col transition-colors
            ${
              today
                ? "border-emerald-400 bg-emerald-50/40 ring-1 ring-emerald-400"
                : "border-gray-200 bg-white hover:bg-gray-50"
            }`}
        >
          {/* วันที่ */}
          <div className="flex justify-between items-center mb-1">
            <span
              className={`text-xs font-bold ${today ? "text-emerald-700" : "text-gray-500"}`}
            >
              {date}
            </span>
            {today && (
              <span className="text-[8px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-semibold">
                วันนี้
              </span>
            )}
          </div>

          {/* Events */}
          <div className="flex flex-col gap-0.5 overflow-y-auto max-h-[72px]">
            {daySchedules.map((schedule) => {
              // ใช้ type แรกเป็น accent สี event
              const primaryType = schedule.type_event[0];
              const style = primaryType
                ? getTypeStyle(primaryType)
                : DEFAULT_STYLE;
              return (
                <button
                  key={`${schedule.id}-${date}`}
                  onClick={() => {
                    setSelectedEvent(schedule);
                    setIsViewModalOpen(true);
                  }}
                  className={`w-full text-left px-1.5 py-1 rounded border-l-2 text-[9px] font-semibold truncate transition-all hover:opacity-80
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

    // ช่องว่างเดือนถัดไป
    const remaining = 42 - days.length;
    for (let day = 1; day <= remaining; day++) {
      days.push(
        <div
          key={`next-${day}`}
          className="min-h-[100px] border border-gray-100 bg-gray-50/40"
        />,
      );
    }

    return days;
  };

  // ── Note CRUD ────────────────────────────────────────────────────────────────
  const createNote = async (note: any, files?: File[]) => {
    const token = getToken();
    if (!token) return;
    const fd = new FormData();
    fd.append("title", note.title);
    fd.append("content", note.content);
    fd.append("tagIds", JSON.stringify(note.tags));
    if (files) files.forEach((f) => fd.append("files", f));
    await fetch(`${API_URL}/notes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: fd,
    });
    fetchNotes();
  };

  const updateNote = async (
    note: UserNote,
    files?: File[],
    deletedFiles?: string[],
  ) => {
    const token = getToken();
    if (!token) return;
    const fd = new FormData();
    fd.append("title", note.title);
    fd.append("content", note.content);
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
  };

  const deleteNote = async (id: string) => {
    const token = getToken();
    if (!token) return;
    await fetch(`${API_URL}/notes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchNotes();
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
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center text-sm text-gray-500 mb-3 mt-3">
            <Link href={isAuthenticated ? "/user" : "/"} className="hover:text-emerald-600 transition">
              หน้าหลัก
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-700 font-medium">ปฏิทินการสอบ</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            ปฏิทินกำหนดการสอบ
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── Calendar ──────────────────────────────────────────────── */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                {/* Month Nav */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={handlePreviousMonth}
                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors border border-gray-200"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-xl font-bold text-gray-800">
                    {monthsNames[selectedMonth]}{" "}
                    <span className="text-emerald-600">
                      {selectedYear + 543}
                    </span>
                  </h2>
                  <button
                    onClick={handleNextMonth}
                    className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 transition-colors border border-gray-200"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 rounded-xl overflow-hidden border border-gray-200">
                  {["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"].map((day, i) => (
                    <div
                      key={day}
                      className={`py-3 text-center text-xs font-semibold bg-gray-50 border-b border-gray-200
                        ${i === 0 ? "text-red-500" : "text-gray-500"}`}
                    >
                      {day}
                    </div>
                  ))}
                  {renderCalendar()}
                </div>

                {/* Legend */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                    ประเภทกำหนดการ
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {/* วันนี้ */}
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <span className="w-3 h-3 rounded-sm bg-emerald-50 border border-emerald-400 inline-block" />
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
                <h3 className="text-lg font-bold text-gray-800 mb-1">บันทึกสรุป</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">
                  เข้าสู่ระบบเพื่อสร้างและบันทึกโน้ตสรุปการเรียนรู้ของคุณ
                </p>
                <button
                  onClick={() => requireLogin('บันทึกสรุป')}
                  className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" /> เข้าสู่ระบบ
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Modal รายละเอียด ──────────────────────────────────────────── */}
      {isViewModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            {/* Modal Header */}
            <div className="bg-emerald-600 px-6 py-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                <h3 className="font-bold">รายละเอียดกำหนดการ</h3>
              </div>
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-1 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Title + Tags */}
              <div>
                <h4 className="text-xl font-bold text-gray-800 mb-3">
                  {selectedEvent.title}
                </h4>
                {selectedEvent.type_event.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {selectedEvent.type_event.map((type, i) => {
                      const style = getTypeStyle(type);
                      return (
                        <span
                          key={i}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border
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
                  <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 text-gray-500 border border-gray-200">
                    กำหนดการทั่วไป
                  </span>
                )}
              </div>

              {/* Date */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center shrink-0">
                  <CalendarIcon className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                    วันที่
                  </p>
                  <p className="text-sm font-medium text-gray-700">
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
                <div className="w-8 h-8 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-center shrink-0">
                  <AlignLeft className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                    รายละเอียด
                  </p>
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap bg-gray-50 border border-gray-100 rounded-xl p-3">
                    {selectedEvent.description || "ไม่มีรายละเอียดเพิ่มเติม"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsViewModalOpen(false)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all text-sm"
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
