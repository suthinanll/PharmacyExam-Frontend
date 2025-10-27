"use client";

import { useState, useMemo } from 'react';
import Navbar from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import {
  Plus, Edit2, Trash2, Save, X, ChevronLeft, ChevronRight,
  Bookmark, Tag, Search, FileText, Upload, Link as LinkIcon
} from 'lucide-react';
import Link from 'next/link';


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
  content: string;
  tags: string[]; // เช่น ['เคมี', 'สำคัญ', 'กลางภาค']
  files: string[]; // เพิ่ม array สำหรับเก็บชื่อ/URL ไฟล์ที่แนบ
  createdAt: number;
}

// --- Initial Data ---

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

const initialNotes: UserNote[] = [
  {
    id: 'n1',
    content: 'สูตรเคมีอินทรีย์ออกเยอะมาก เน้น Benzene rings',
    tags: ['เคมี', 'สำคัญ', 'สูตร'],
    files: ['Organic_Chem_Summary.pdf', 'Example_Quiz.docx'], // มีไฟล์แนบ
    createdAt: Date.now() - 86400000
  },
  {
    id: 'n2',
    content: 'ทบทวนวิธีจ่ายยาเด็กก่อนสอบปฏิบัติ 2 วัน',
    tags: ['ปฏิบัติ', 'เด็ก', 'เภสัช'],
    files: [], // ไม่มีไฟล์แนบ
    createdAt: Date.now()
  }
];

const categoryColors = {
  'ทฤษฎี': 'bg-blue-100 text-blue-800 border-blue-300',
  'ปฏิบัติ': 'bg-green-100 text-green-800 border-green-300',
  'ทบทวน': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'สอบจริง': 'bg-red-100 text-red-800 border-red-300'
};

const Calender = () => {
  const [schedules, setSchedules] = useState<ExamSchedule[]>(initialSchedules);
  const [userNotes, setUserNotes] = useState<UserNote[]>(initialNotes);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // State สำหรับ Modal ของ Schedule
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<ExamSchedule | null>(null);

  // State สำหรับ Modal ของ Note
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<UserNote | null>(null);

  const [tagFilter, setTagFilter] = useState(''); // State สำหรับกรองโน้ตด้วย Tag

  const monthsNames = useMemo(() => ([
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ]), []);

  // --- Schedule/Modal Logic ---

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

  const handleOpenNoteModal = (note: UserNote | null) => {
    if (note) {
      setEditingNote(note);
    } else {
      setEditingNote({
        id: `new-${Date.now()}`,
        content: '',
        tags: [],
        files: [],
        createdAt: Date.now(),
      });
    }
    setIsNoteModalOpen(true);
  }

  const handleSaveNote = (noteData: Omit<UserNote, 'createdAt'>) => {
    if (noteData.id.startsWith('new-')) {
      // Add new note
      const newNote: UserNote = {
        ...noteData,
        createdAt: Date.now(),
        id: String(Date.now()), // ให้ ID เป็น timestamp จริง
      };
      setUserNotes([newNote, ...userNotes]); // เพิ่มโน้ตใหม่ไว้ด้านบน
    } else {
      // Edit existing note
      setUserNotes(userNotes.map(note =>
        note.id === noteData.id ? { ...note, ...noteData } : note
      ));
    }
    setIsNoteModalOpen(false);
    setEditingNote(null);
  };

  const handleDeleteNote = (id: string) => {
    if (window.confirm('คุณต้องการลบโน้ตนี้หรือไม่?')) {
      setUserNotes(userNotes.filter(n => n.id !== id));
    }
  };

  // กรองโน้ตตาม Tag
  const filteredNotes = useMemo(() => {
    if (!tagFilter) return userNotes;
    const lowerCaseFilter = tagFilter.toLowerCase();
    return userNotes.filter(note =>
      note.tags.some(tag => tag.toLowerCase().includes(lowerCaseFilter)) ||
      note.content.toLowerCase().includes(lowerCaseFilter) ||
      note.files.some(file => file.toLowerCase().includes(lowerCaseFilter)) // กรองด้วยชื่อไฟล์ด้วย
    );
  }, [userNotes, tagFilter]);

  // --- Calendar Logic ---

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

  // --- Component: Schedule Modal (Unchanged for brevity, but moved outside Calender for clean up) ---
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

    // eslint-disable-next-line react-hooks/rules-of-hooks
    const colors = useMemo(() => categoryColors, []);

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
              <label className="block text-sm font-medium text-gray-700 mb-1">ประเภท</label>
              <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500">
                {Object.keys(colors).map(cat => (<option key={cat} value={cat}>{cat}</option>))}
              </select>
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

  // --- Component: Note Editing Modal (New) ---

  const EditNoteModal = () => {
    if (!isNoteModalOpen || !editingNote) return null;

    const isNew = editingNote.id.startsWith('new-');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [formData, setFormData] = useState<Omit<UserNote, 'createdAt'>>({
      id: editingNote.id,
      content: editingNote.content,
      tags: editingNote.tags,
      files: editingNote.files, // ดึงข้อมูลไฟล์เริ่มต้น
    });
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [tagInput, setTagInput] = useState(formData.tags.join(', '));
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const [newFileUrl, setNewFileUrl] = useState('');

    const handleSave = () => {
      const finalFormData = {
        ...formData,
        tags: tagInput.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0),
      };
      handleSaveNote(finalFormData);
    };

    const handleAddFile = () => {
      if (newFileUrl.trim()) {
        setFormData(prev => ({
          ...prev,
          files: [...prev.files, newFileUrl.trim()]
        }));
        setNewFileUrl('');
      }
    };

    const handleRemoveFile = (index: number) => {
      setFormData(prev => ({
        ...prev,
        files: prev.files.filter((_, i) => i !== index)
      }));
    };


    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">       
       <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl">
        {/* Modal Header */}
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            {isNew ? 'เพิ่มบันทึกสรุปใหม่' : 'แก้ไขบันทึกสรุป'}
          </h3>
          <button onClick={() => setIsNoteModalOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เนื้อหาบันทึก</label>
            <textarea
              name="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 resize-none text-gray-700"
              rows={4}
              placeholder="บันทึกข้อความสรุปการเตรียมตัว..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tags </label>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
              placeholder="เช่น เคมี, สำคัญ, กลางภาค"
            />
          </div>

          {/* File Attachment Section */}
          <div className="border p-4 rounded-lg bg-gray-50">
            <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
              <FileText className="w-4 h-4" /> ไฟล์ที่แนบมา 
            </label>

            <div className="space-y-2 mb-3">
              {formData.files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white border rounded-lg">
                  <span className="text-sm text-gray-700 truncate flex items-center gap-2">
                    <LinkIcon className="w-4 h-4 text-indigo-500" /> {file}
                  </span>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {formData.files.length === 0 && (
                <p className="text-sm text-gray-500 italic">ยังไม่มีไฟล์แนบ</p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newFileUrl}
                onChange={(e) => setNewFileUrl(e.target.value)}
                className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                placeholder="เพิ่มชื่อ/URL ไฟล์ เช่น Summary.pdf"
              />
              <button
                onClick={handleAddFile}
                type="button"
                className="px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition flex items-center gap-1"
              >
                <Upload className="w-4 h-4" /> เพิ่ม
              </button>
            </div>
         
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-5 border-t flex justify-end gap-3">
          {!isNew && (
            <button
              onClick={() => { handleDeleteNote(editingNote.id); setIsNoteModalOpen(false); }}
              className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1 transition"
            >
              <Trash2 className="w-4 h-4" /> ลบ
            </button>
          )}
          <button
            onClick={() => setIsNoteModalOpen(false)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1 transition"
          >
            <Save className="w-4 h-4" /> บันทึก
          </button>
        </div>
      </div>
      </div>
    );
  };

  const AddNoteButton = () => (
    <div className="p-5 bg-indigo-50 rounded-xl shadow-inner border border-indigo-100 mb-6 flex justify-between items-center">
      <h3 className="text-lg font-bold text-indigo-800 flex items-center gap-2">
        บันทึกสรุปการเรียนรู้
      </h3>
      <button
        onClick={() => handleOpenNoteModal(null)}
        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-1"
      >
        <Plus className="w-4 h-4" /> เพิ่มโน้ต
      </button>
    </div>
  );

  const NoteItem = ({ note }: { note: UserNote }) => (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-100 hover:shadow-lg transition duration-150">
      <div className="flex justify-between items-start mb-2">
        <p className="text-gray-800 whitespace-pre-line">{note.content}</p>
        <div className="flex gap-1 ml-4 flex-shrink-0">
          <button
            onClick={() => handleOpenNoteModal(note)}
            className="p-1 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-50"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleDeleteNote(note.id)}
            className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Files Display */}
      {note.files.length > 0 && (
        <div className="mt-3 pt-2 border-t border-dashed border-gray-200">
          <p className="text-xs font-semibold text-gray-600 flex items-center gap-1 mb-3"><FileText className="w-3 h-3" /> ไฟล์แนบ:</p>
          <div className="flex flex-wrap gap-2">
            {note.files.map((file, index) => (
              <span key={index} className="text-xs text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full flex items-center gap-1 max-w-full truncate">
                <LinkIcon className="w-3 h-3 flex-shrink-0" />
                {file}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags and Date */}
      <div className="mt-2 flex flex-wrap gap-2 pt-2 border-t border-dashed border-gray-200">
        {note.tags.map(tag => (
          <span
            key={tag}
            className="flex items-center text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full cursor-pointer hover:bg-indigo-200"
            onClick={() => setTagFilter(tag)}
          >
            <Tag className="w-3 h-3 mr-1" /> {tag}
          </span>
        ))}
        <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
          {new Date(note.createdAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  );

  // --- Main Render ---

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

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* 1. Calendar */}
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

            {/* 2. Notes Section */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-xl p-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Bookmark className="w-6 h-6 text-indigo-600" /> บันทึกสรุป
                </h2>

                {/* Filter / Search Bar */}
                <div className="mb-4 flex items-center relative">
                  <Search className="w-5 h-5 text-gray-400 absolute left-3" />
                  <input
                    type="text"
                    value={tagFilter}
                    onChange={(e) => setTagFilter(e.target.value)}
                    placeholder="กรองโน้ตด้วย Tags ข้อความ หรือชื่อไฟล์..."
                    className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                  {tagFilter && (
                    <button
                      onClick={() => setTagFilter('')}
                      className="absolute right-2 p-1 text-gray-500 hover:text-gray-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Add New Note Button */}
                <AddNoteButton />

                {/* Filtered Notes List */}
                <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                  {filteredNotes.length > 0 ? (
                    filteredNotes.map(note => (
                      <NoteItem key={note.id} note={note} />
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      ไม่พบโน้ตที่ตรงกับคำค้นหา
                    </p>
                  )}
                </div>

              </div>
            </div>

          </div>

        </div>
      </div>
      <Footer />
      {/* Schedule Modal Instance */}
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
      {/* Note Modal Instance */}
      <EditNoteModal />
    </>
  );
}

export default Calender;