"use client";
import { useState, useMemo, useEffect } from 'react';
import Navbar from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import {
  Plus, Trash2, Save, X, ChevronLeft, ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import NoteList from "@/components/note/NoteList";


interface ExamSchedule {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  description: string;
  category: 'ทฤษฎี' | 'ปฏิบัติ' | 'ทบทวน' | 'สอบจริง';
}

interface UserNote {
  id: string;
  title: string;        // ✅ เพิ่ม
  content: string;
  tags: string[];
  files: string[];
  createdAt: number;
}


const initialSchedules: ExamSchedule[] = [
  {
    id: '1',
    title: 'ทบทวนเภสัชเคมี',
    date: '2025-10-20',
    time: '09:00',
    description: 'ทบทวนบทที่ 1-5 และแบบฝึกหัดท้ายบท',
    category: 'ทบทวน'
  },
  {
    id: '2',
    title: 'สอบปฏิบัติการ',
    date: '2025-10-25',
    time: '13:00',
    description: 'สอบปฏิบัติการจ่ายยา',
    category: 'ปฏิบัติ'
  }
];

const categoryColors = {
  'ทฤษฎี': 'bg-blue-100 text-blue-800 border-blue-300',
  'ปฏิบัติ': 'bg-green-100 text-green-800 border-green-300',
  'ทบทวน': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'สอบจริง': 'bg-red-100 text-red-800 border-red-300'
};

const API_URL = "http://localhost:5000";

const Calender = () => {
  const [schedules, setSchedules] = useState<ExamSchedule[]>(initialSchedules);
  const [userNotes, setUserNotes] = useState<UserNote[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);

  const [isNoteModalOpen] = useState(false);
  const [editingNote] = useState<UserNote | null>(null);

  const [tagFilter, setTagFilter] = useState(''); // State สำหรับกรองโน้ตด้วย Tag

  const monthsNames = useMemo(() => ([
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]), []);

  const handleAddSchedule = (dateStr?: string) => {
    setEditingSchedule({
      id: `new-${Date.now()}`,
      title: '',
      date: dateStr || `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`,
      time: '09:00',
      description: '',
      category: 'ทบทวน'
    });
    setIsScheduleModalOpen(true);
  };

  const handleEditSchedule = (schedule: ExamSchedule) => {
    setEditingSchedule(schedule);
    setIsScheduleModalOpen(true);
  };

  // --- Notes Logic ---


  /* =======================
   FETCH NOTES
======================= */
  const fetchNotes = async () => {
    try {
      const res = await fetch(`${API_URL}/notes`, {
        credentials: "include", // ✅ ส่ง cookie
      });

      if (!res.ok) throw new Error("โหลดโน้ตไม่สำเร็จ");

      const data = await res.json();

      const mapped: UserNote[] = data.map((n: any) => ({
        id: String(n.note_id),
        title: n.title,
        content: n.content,
        tags: n.tags?.map((t: any) => t.name) ?? [],
        files: n.files?.map((f: any) => f.filename) ?? [],
        createdAt: new Date(n.created_at).getTime(),
      }));

      setUserNotes(mapped);
    } catch (err) {
      console.error("fetchNotes error:", err);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, []);


  /* =======================
    CREATE NOTE
 ======================= */
  const createNote = async (note: UserNote) => {
    await fetch(`${API_URL}/notes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // ✅ สำคัญที่สุด
      body: JSON.stringify({
        title: note.title,
        content: note.content,
        tags: note.tags,
        files: note.files,
      }),
    });

    fetchNotes(); // ✅ reload จาก DB
  };

  /* =======================
     UPDATE NOTE
  ======================= */
  const updateNote = async (note: UserNote) => {
    await fetch(`${API_URL}/notes/${note.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        title: note.title,
        content: note.content,
        tags: note.tags,
        files: note.files,
      }),
    });

    fetchNotes();
  };

  /* =======================
     DELETE NOTE
  ======================= */
  const deleteNote = async (id: string) => {
    await fetch(`${API_URL}/notes/${id}`, {
      method: "DELETE",
      credentials: "include",
    });

    fetchNotes();
  };


  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const getSchedulesForDate = (date: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return schedules.filter(s => s.date === dateStr);
  };

  const isToday = (date: number) => {
    const today = new Date();
    return today.getDate() === date && today.getMonth() === selectedMonth && today.getFullYear() === selectedYear;
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-24 border border-gray-200 bg-gray-50/50"></div>);
    }

    for (let date = 1; date <= daysInMonth; date++) {
      const daySchedules = getSchedulesForDate(date);
      const todayClass = isToday(date) ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500' : 'bg-white hover:bg-gray-50';
      const dateStrForAdd = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;

      days.push(
        <div
          key={date}
          className={`min-h-24 border border-gray-200 p-2 cursor-pointer transition duration-150 ease-in-out ${todayClass}`}
          onClick={() => handleAddSchedule(dateStrForAdd)}
        >
          <div className={`font-semibold mb-1 flex justify-between items-center ${isToday(date) ? 'text-indigo-700' : 'text-gray-700'}`}>
            {date}
            {isToday(date) && <span className="text-xs font-bold text-indigo-500 border border-indigo-500 rounded-full px-2">วันนี้</span>}
          </div>
          <div className="space-y-1">
            {daySchedules.map(schedule => (
              <div
                key={schedule.id}
                className={`text-xs p-1 rounded border cursor-pointer hover:shadow-md transition duration-100 ${categoryColors[schedule.category]}`}
                onClick={(e) => { e.stopPropagation(); handleEditSchedule(schedule); }}
              >
                <div className="font-medium truncate">{schedule.time} {schedule.title}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const ScheduleModal = ({ isOpen, schedule, onSave, onDelete, onClose }: {
    isOpen: boolean;
    schedule: ExamSchedule | null;
    onSave: (schedule: ExamSchedule) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
  }) => {
    if (!isOpen || !schedule) return null;

    const isNew = schedule.id.startsWith('new-');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [formData, setFormData] = useState<ExamSchedule>(schedule);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setFormData(prev => ({ ...prev, [name]: value as any }));
    };

    const handleInternalSave = () => {
      if (formData.title && formData.date) {
        onSave(formData);
      } else {
        alert('กรุณากรอกชื่อกิจกรรมและวันที่');
      }
    };

    const handleInternalDelete = () => {
      if (window.confirm('คุณต้องการลบกำหนดการนี้หรือไม่?')) {
        onDelete(schedule.id);
      }
    };



    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
          {/* Modal Header */}
          <div className="p-5 border-b flex justify-between items-center">
            <h3 className="text-xl font-bold text-gray-800">{isNew ? 'เพิ่มกำหนดการใหม่' : 'แก้ไขกำหนดการ'}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อกิจกรรม</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="เช่น สอบกลางภาค หรือ ทบทวนบทที่ 3" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">วันที่</label>
                <input type="date" name="date" value={formData.date} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">เวลา</label>
                <input type="time" name="time" value={formData.time} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">รายละเอียด</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500" placeholder="รายละเอียดการเตรียมตัว หรือหัวข้อสอบ" />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-5 border-t flex justify-end gap-3">
            {!isNew && (
              <button onClick={handleInternalDelete} className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1 transition">
                <Trash2 className="w-4 h-4" /> ลบ
              </button>
            )}
            <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition">
              ยกเลิก
            </button>
            <button onClick={handleInternalSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1 transition">
              <Save className="w-4 h-4" /> บันทึก
            </button>
          </div>
        </div>
      </div>
    );
  };


  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">

          {/* Breadcrumbs */}
          <div className="flex items-center text-sm text-gray-500 mb-3 mt-3">
            <Link href="/user" className="hover:text-blue-600 cursor-pointer transition">หน้าหลัก</Link>
            <span className="mx-2">›</span>
            <span className="text-gray-700 font-medium">ปฏิทินการสอบ</span>
          </div>

          {/* Header & Add Button */}
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h1 className="text-3xl font-medium text-gray-800 flex items-center gap-2">
              ปฏิทินกำหนดการสอบ
            </h1>
            <button
              onClick={() => handleAddSchedule()}
              className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-2 shadow-md"
            >
              <Plus className="w-5 h-5" /> เพิ่มกำหนดการ
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-xl p-6">

                {/* Month Navigation */}
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => { setSelectedMonth(prev => (prev === 0 ? 11 : prev - 1)); if (selectedMonth === 0) setSelectedYear(prev => prev - 1); }}
                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition text-gray-700"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <h2 className="text-2xl font-extrabold text-indigo-700">
                    {monthsNames[selectedMonth]} {selectedYear + 543}
                  </h2>
                  <button
                    onClick={() => { setSelectedMonth(prev => (prev === 11 ? 0 : prev + 1)); if (selectedMonth === 11) setSelectedYear(prev => prev + 1); }}
                    className="p-2 bg-gray-100 rounded-full hover:bg-gray-200 transition text-gray-700"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 border border-gray-200 rounded-lg overflow-hidden">
                  {/* Day Headers */}
                  {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                    <div key={day} className="bg-indigo-600 text-white font-semibold text-center py-3 text-sm border-r border-indigo-500 last:border-r-0">
                      {day}
                    </div>
                  ))}
                  {/* Calendar Days */}
                  {renderCalendar()}
                </div>

                {/* Legend */}
                <div className="flex gap-4 mt-6 flex-wrap justify-center">
                  {Object.entries(categoryColors).map(([category, colorClass]) => (
                    <div key={category} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded-full border ${colorClass.split(' ')[0]} ${colorClass.split(' ')[2]}`}></div>
                      <span className="text-sm text-gray-700">{category}</span>
                    </div>
                  ))}
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
      <ScheduleModal
        isOpen={isScheduleModalOpen}
        schedule={editingSchedule}
        onSave={(updatedSchedule) => {
          if (schedules.find(s => s.id === updatedSchedule.id)) {
            setSchedules(schedules.map(s => (s.id === updatedSchedule.id ? updatedSchedule : s)));
          } else {
            setSchedules([...schedules, { ...updatedSchedule, id: String(Date.now()) }]);
          }
          setIsScheduleModalOpen(false);
          setEditingSchedule(null);
        }}
        onDelete={(id) => {
          setSchedules(schedules.filter(s => s.id !== id));
          setIsScheduleModalOpen(false);
          setEditingSchedule(null);
        }}
        onClose={() => setIsScheduleModalOpen(false)}
      />
    </>
  );
}

export default Calender;