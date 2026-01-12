"use client";
import { useState, useMemo, useEffect, useCallback } from 'react';
import Navbar from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import NoteList from "@/components/note/NoteList";

interface ExamSchedule {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  timeRange: string;
  description: string;
  category: 'ทฤษฎี' | 'ปฏิบัติ' | 'ทบทวน' | 'สอบจริง' | 'กำหนดการทั่วไป';
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

const API_URL = "http://localhost:5000";

const categoryColors = {
  'ทฤษฎี': 'bg-blue-100 text-blue-800 border-blue-200',
  'ปฏิบัติ': 'bg-purple-100 text-purple-800 border-purple-200',
  'ทบทวน': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'สอบจริง': 'bg-red-100 text-red-800 border-red-200',
  'กำหนดการทั่วไป': 'bg-green-100 text-green-800 border-green-200'
};

const Calender = () => {
  const [adminSchedules, setAdminSchedules] = useState<ExamSchedule[]>([]);
  const [userNotes, setUserNotes] = useState<UserNote[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [tagFilter, setTagFilter] = useState("");

  const monthsNames = useMemo(() => ([
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]), []);

  const fetchAdminSchedules = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${API_URL}/schedules`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("ดึงข้อมูลล้มเหลว");

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
            timeRange: `${start.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} - ${end.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}`,
            description: item.description || '',
            category: 'กำหนดการทั่วไป'
          };
        });

      setAdminSchedules(formatted);
    } catch (error) {
      console.error("fetchAdminSchedules error:", error);
    }
  }, []);

  const fetchNotes = async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      const res = await fetch(`${API_URL}/notes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("โหลดโน้ตไม่สำเร็จ");
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

  const getSchedulesForDate = (date: number) => {
    const currentCalendarDate = new Date(selectedYear, selectedMonth, date);
    currentCalendarDate.setHours(0, 0, 0, 0);

    return adminSchedules.filter(s => {
      const startDate = new Date(s.startDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(s.endDate);
      endDate.setHours(0, 0, 0, 0);
      return currentCalendarDate >= startDate && currentCalendarDate <= endDate;
    });
  };

  const isToday = (date: number) => {
    const today = new Date();
    return today.getDate() === date && today.getMonth() === selectedMonth && today.getFullYear() === selectedYear;
  };

  const createNote = async (note: any, files?: File[]) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    const formData = new FormData();
    formData.append("title", note.title);
    formData.append("content", note.content);
    formData.append("tagIds", JSON.stringify(note.tags));
    if (files) files.forEach(file => formData.append("files", file));
    await fetch(`${API_URL}/notes`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    fetchNotes();
  };

  const updateNote = async (note: UserNote, files?: File[], deletedFiles?: string[]) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      const formData = new FormData();
      formData.append("title", note.title);
      formData.append("content", note.content);
      const tagNames = note.tags.map(t => typeof t === 'object' ? t.name : t);
      formData.append("tagIds", JSON.stringify(tagNames));
      formData.append("deletedFiles", JSON.stringify(deletedFiles || []));
      if (files) files.forEach((f) => formData.append("files", f));
      await fetch(`${API_URL}/notes/${note.id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      fetchNotes();
      alert("บันทึกการเปลี่ยนแปลงสำเร็จ");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const deleteNote = async (id: string) => {
    const token = localStorage.getItem("access_token");
    if (!token) return;
    await fetch(`${API_URL}/notes/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchNotes();
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-24 border border-gray-100 bg-gray-50/30"></div>);
    }

    for (let date = 1; date <= daysInMonth; date++) {
      const daySchedules = getSchedulesForDate(date);
      const todayClass = isToday(date) ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' : 'bg-white hover:bg-gray-50';

      days.push(
        <div key={date} className={`min-h-[110px] border border-gray-200 p-2 transition-all ${todayClass}`}>
          <div className="flex justify-between items-center mb-2">
            <span className={`text-sm font-bold ${isToday(date) ? 'text-indigo-700' : 'text-gray-600'}`}>
              {date}
            </span>
            {isToday(date) && (
              <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.5 rounded shadow-sm">วันนี้</span>
            )}
          </div>

          <div className="space-y-1.5">
            {daySchedules.map(schedule => {
              const fmtDate = (d: Date) => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });

              return (
                <div
                  key={schedule.id}
                  title={`${schedule.title}\nเริ่ม: ${fmtDate(schedule.startDate)}\nสิ้นสุด: ${fmtDate(schedule.endDate)}`}
                  className={`
                    group relative cursor-default
                    text-[10px] p-1.5 rounded border-l-[3px] shadow-sm
                    ${categoryColors[schedule.category] || 'bg-green-50 text-green-800 border-green-500'}
                  `}
                >
                  <div className="font-bold truncate leading-tight mb-0.5">
                    {schedule.title}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return days;
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center text-sm text-gray-500 mb-3 mt-3">
            <Link href="/user" className="hover:text-blue-600 transition">หน้าหลัก</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-700 font-medium">ปฏิทินการสอบ</span>
          </div>

          <h1 className="text-3xl font-medium text-gray-800 mb-6">ปฏิทินกำหนดการสอบ</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <button onClick={() => { setSelectedMonth(prev => prev === 0 ? 11 : prev - 1); if (selectedMonth === 0) setSelectedYear(y => y - 1); }} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><ChevronLeft className="w-5 h-5" /></button>
                  <h2 className="text-2xl font-extrabold text-indigo-700">{monthsNames[selectedMonth]} {selectedYear + 543}</h2>
                  <button onClick={() => { setSelectedMonth(prev => prev === 11 ? 0 : prev + 1); if (selectedMonth === 11) setSelectedYear(y => y + 1); }} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"><ChevronRight className="w-5 h-5" /></button>
                </div>

                <div className="grid grid-cols-7 border border-gray-200 rounded-lg overflow-hidden">
                  {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                    <div key={day} className="bg-indigo-600 text-white font-semibold text-center py-3 text-sm">{day}</div>
                  ))}
                  {renderCalendar()}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-100 border border-green-300 rounded"></span> กำหนดการจากระบบ (เริ่ม-สิ้นสุด)</div>
                </div>
              </div>
            </div>

            <NoteList
              notes={userNotes}
              onSaveNote={createNote}
              onUpdateNote={updateNote}
              onDeleteNote={deleteNote}
              tagFilter={tagFilter}
              setTagFilter={setTagFilter}
            />
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Calender;