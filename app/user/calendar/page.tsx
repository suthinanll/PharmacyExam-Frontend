"use client";
import { useState, useMemo, useEffect, useCallback } from 'react';
import Navbar from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlignLeft, X, Info } from 'lucide-react';
import Link from 'next/link';
import NoteList from "@/components/note/NoteList";
import { useAuth } from '@/contexts/AuthContext';

// ... (Interface และ categoryColors เหมือนเดิม)
interface ExamSchedule {
  id: string;
  title: string;
  startDate: Date;
  endDate: Date;
  timeRange: string;
  description: string;
  category: 'ทฤษฎี' | 'ปฏิบัติ' | 'ทบทวน' | 'สอบจริง' | 'กำหนดการทั่วไป';
}

interface Tag { id: number; name: string; }
interface UserNote { id: string; title: string; content: string; tags: Tag[]; files: string[]; createdAt: number; }

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;
const categoryColors = {
  'ทฤษฎี': 'bg-blue-100 text-blue-800 border-blue-200',
  'ปฏิบัติ': 'bg-purple-100 text-purple-800 border-purple-200',
  'ทบทวน': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  'สอบจริง': 'bg-red-100 text-red-800 border-red-200',
  'กำหนดการทั่วไป': 'bg-green-100 text-green-800 border-green-200'
};

const CalenderPage = () => {
  const { getToken } = useAuth();
  const [adminSchedules, setAdminSchedules] = useState<ExamSchedule[]>([]);
  const [userNotes, setUserNotes] = useState<UserNote[]>([]);

  // แก้ไข: ใช้ Date Object ตัวเดียวจัดการทั่งเดือนและปี เพื่อป้องกันการหลุดช่วงปี
  const [viewDate, setViewDate] = useState(new Date());
  const selectedMonth = viewDate.getMonth();
  const selectedYear = viewDate.getFullYear();

  const [tagFilter, setTagFilter] = useState("");
  const [selectedEvent, setSelectedEvent] = useState<ExamSchedule | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const monthsNames = useMemo(() => ([
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]), []);

  const fetchAdminSchedules = useCallback(async () => {
    try {
      const token = getToken();
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
        id: String(n.note_id), title: n.title, content: n.content,
        tags: n.tags || [], files: n.files || [],
        createdAt: new Date(n.created_at).getTime(),
      }));
      setUserNotes(mapped);
    } catch (err) { console.error("fetchNotes error:", err); }
  };

  useEffect(() => {
    fetchNotes();
    fetchAdminSchedules();
  }, [fetchAdminSchedules]);

  // ฟังก์ชันเลื่อนเดือนที่รองรับการเปลี่ยนปีแบบ Dynamic
  const handlePreviousMonth = () => {
    setViewDate(new Date(selectedYear, selectedMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(selectedYear, selectedMonth + 1, 1));
  };

  const getSchedulesForDate = (date: number) => {
    const currentCalendarDate = new Date(selectedYear, selectedMonth, date);
    currentCalendarDate.setHours(0, 0, 0, 0);

    return adminSchedules.filter(s => {
      const start = new Date(s.startDate);
      const end = new Date(s.endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);
      return currentCalendarDate >= start && currentCalendarDate <= end;
    });
  };

  const isToday = (date: number) => {
    const today = new Date();
    return today.getDate() === date && today.getMonth() === selectedMonth && today.getFullYear() === selectedYear;
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const firstDay = new Date(selectedYear, selectedMonth, 1).getDay();
    const days = [];

    // เติมช่องว่างเดือนก่อนหน้า
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-[110px] border border-gray-100 bg-gray-50/30"></div>);
    }

    // วาดวันที่ในเดือนนั้นๆ
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
          <div className="flex flex-col gap-1">
            {daySchedules.map(schedule => (
              <div
                key={`${schedule.id}-${date}`}
                onClick={() => { setSelectedEvent(schedule); setIsViewModalOpen(true); }}
                className={`cursor-pointer truncate text-[10px] p-1.5 rounded border-l-[3px] shadow-sm transition-transform active:scale-95 ${categoryColors[schedule.category] || 'bg-green-50 text-green-800 border-green-500'}`}
              >
                <div className="font-bold truncate">{schedule.title}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return days;
  };

  // ... (Note Handlers createNote, updateNote, deleteNote เหมือนเดิม)
  const createNote = async (note: any, files?: File[]) => {
    const token = getToken();
    if (!token) return;
    const formData = new FormData();
    formData.append("title", note.title);
    formData.append("content", note.content);
    formData.append("tagIds", JSON.stringify(note.tags));
    if (files) files.forEach(file => formData.append("files", file));
    await fetch(`${API_URL}/notes`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData });
    fetchNotes();
  };

  const updateNote = async (note: UserNote, files?: File[], deletedFiles?: string[]) => {
    const token = getToken();
    if (!token) return;
    const formData = new FormData();
    formData.append("title", note.title);
    formData.append("content", note.content);
    formData.append("tagIds", JSON.stringify(note.tags.map(t => typeof t === 'object' ? (t as any).name : t)));
    formData.append("deletedFiles", JSON.stringify(deletedFiles || []));
    if (files) files.forEach((f) => formData.append("files", f));
    await fetch(`${API_URL}/notes/${note.id}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` }, body: formData });
    fetchNotes();
  };

  const deleteNote = async (id: string) => {
    const token = getToken();
    if (!token) return;
    await fetch(`${API_URL}/notes/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
    fetchNotes();
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
                  <button onClick={handlePreviousMonth} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  {/* แสดงปี พ.ศ. แบบ Dynamic */}
                  <h2 className="text-2xl font-extrabold text-indigo-700 tracking-tight">
                    {monthsNames[selectedMonth]} {selectedYear + 543}
                  </h2>
                  <button onClick={handleNextMonth} className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition-colors">
                    <ChevronRight className="w-5 h-5 text-gray-600" />
                  </button>
                </div>

                <div className="grid grid-cols-7 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                    <div key={day} className="bg-indigo-600 text-white font-semibold text-center py-3 text-sm border-x border-indigo-500">
                      {day}
                    </div>
                  ))}
                  {renderCalendar()}
                </div>
                {/* Legend */}
                <div className="mt-6 flex flex-wrap gap-4 text-xs font-medium text-gray-500">
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-green-100 border border-green-400 rounded-sm"></span> กำหนดการทั่วไป</div>
                  <div className="flex items-center gap-1.5"><span className="w-3 h-3 bg-indigo-50 border border-indigo-500 rounded-sm"></span> วันนี้</div>
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

      {/* Modal รายละเอียดกิจกรรม (คงเดิม) */}
      {isViewModalOpen && selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="bg-indigo-600 p-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5" />
                <h3 className="font-bold text-lg">รายละเอียดกำหนดการ</h3>
              </div>
              <button onClick={() => setIsViewModalOpen(false)}><X className="w-6 h-6" /></button>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h4 className="text-2xl font-bold text-gray-800 mb-2">{selectedEvent.title}</h4>
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${categoryColors[selectedEvent.category]}`}>
                  {selectedEvent.category}
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <CalendarIcon className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">วันที่</p>
                    <p className="text-sm font-medium text-gray-700">
                      {selectedEvent.startDate.toLocaleDateString('th-TH', { dateStyle: 'long' })}
                      {selectedEvent.startDate.toDateString() !== selectedEvent.endDate.toDateString() &&
                        ` - ${selectedEvent.endDate.toLocaleDateString('th-TH', { dateStyle: 'long' })}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <Clock className="w-5 h-5 text-indigo-600" />
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">เวลา</p>
                    <p className="text-sm font-medium text-gray-700">{selectedEvent.timeRange} น.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <AlignLeft className="w-5 h-5 text-indigo-600" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-gray-400 uppercase">รายละเอียด</p>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                      {selectedEvent.description || "ไม่มีรายละเอียดเพิ่มเติมสำหรับกำหนดการนี้"}
                    </p>
                  </div>
                </div>
              </div>
              <button onClick={() => setIsViewModalOpen(false)} className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all">
                เข้าใจแล้ว
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
}

export default CalenderPage;