"use client"
import { useState } from 'react';
import Navbar_user from "@/components/Navbar_user";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [eventText, setEventText] = useState('');
  
  // States สำหรับโน้ต
  const [notes, setNotes] = useState([
    {
      id: 1,
      title: 'ยาแก้ปวดและลดไข้',
      subject: 'เภสัชวิทยา',
      content: `กลุ่มยา NSAIDs (Non-Steroidal Anti-Inflammatory Drugs):
      
1. Paracetamol (Acetaminophen)
   - ขนาด: 500-1000 mg ทุก 4-6 ชม.
   - ขนาดสูงสุด: 4000 mg/วัน
   - ข้อควรระวัง: โรคตับ

2. Ibuprofen  
   - ขนาด: 200-400 mg ทุก 4-6 ชม.
   - รับประทานหลังอาหาร
   - ข้อควรระวัง: โรคกระเพาะ, ไต

3. Aspirin
   - ขนาด: 300-600 mg ทุก 4-6 ชม.
   - ห้ามให้เด็ก < 12 ปี`,
      files: [
        { 
          name: 'ตาราง_NSAIDs_เปรียบเทียบ.pdf', 
          size: '423 KB', 
          type: 'application/pdf',
          url: 'https://www.example.com/sample.pdf'
        },
        { 
          name: 'คู่มือการใช้ยาแก้ปวด.docx', 
          size: '156 KB', 
          type: 'application/docx',
          url: '#'
        }
      ],
      createdAt: '2024-01-15T10:30:00',
      updatedAt: '2024-01-15T10:30:00'
    },
    {
      id: 2,
      title: 'ยาปฏิชีวนะ (Antibiotics)',
      subject: 'เภสัชวิทยา',
      content: `หลักการใช้ยาปฏิชีวนะ:

1. Penicillin Group
   - Amoxicillin 500 mg ทุก 8 ชม.
   - รักษาติดเชื้อทางเดินหายใจ, ปัสสาวะ
   
2. Cephalosporin  
   - Cephalexin 500 mg ทุก 6 ชม.
   - ติดเชื้อผิวหนัง

3. Fluoroquinolone
   - Ciprofloxacin 500 mg ทุก 12 ชม.
   - ติดเชื้อทางเดินปัสสาวะ

⚠️ สำคัญ: ต้องกินครบหลักสูตร ห้ามหยุดเอง`,
      files: [
        { 
          name: 'แผนภูมิการเลือกใช้ยา.jpg', 
          size: '892 KB', 
          type: 'image/jpeg',
          url: 'https://via.placeholder.com/800x600/4299e1/ffffff?text=Antibiotic+Chart'
        }
      ],
      createdAt: '2024-01-14T14:20:00',
      updatedAt: '2024-01-14T14:20:00'
    },
    {
      id: 3,
      title: 'การคำนวณขนาดยา',
      subject: 'เภสัชกรรมคลินิก',
      content: `สูตรสำคัญในการคำนวณ:

1. ขนาดยาตามน้ำหนักตัว
   Dose (mg) = น้ำหนัก (kg) × ขนาดยา (mg/kg)
   
2. ความเร็วการให้ยาทางหลอดเลือด
   mL/hr = (ปริมาตรยา × Drop factor) / เวลา(นาที) × 60

3. Creatinine Clearance (CrCl)
   CrCl = [(140-อายุ) × น้ำหนัก] / (72 × Scr)
   (สำหรับหญิง คูณ 0.85)

4. Body Surface Area (BSA)
   BSA = √[(ส่วนสูง × น้ำหนัก) / 3600]`,
      files: [],
      createdAt: '2024-01-13T09:15:00',
      updatedAt: '2024-01-13T16:45:00'
    }
  ]);
  
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [editingNote, setEditingNote] = useState(null);
  const [noteForm, setNoteForm] = useState({
    title: '',
    subject: '',
    content: '',
    files: []
  });
  const [viewingFile, setViewingFile] = useState(null);

  const thaiMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  const thaiDaysShort = ['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'];

  // คำนวณวันในเดือน
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return {
      firstDay: new Date(year, month, 1).getDay(),
      lastDate: new Date(year, month + 1, 0).getDate()
    };
  };

  const { firstDay, lastDate } = getDaysInMonth();

  // จัดการกำหนดการสอบ
  const openEventModal = (day) => {
    const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`;
    setSelectedDate({ day, dateKey });
    setEventText(events[dateKey] || '');
    setShowEventModal(true);
  };

  const saveEvent = () => {
    if (eventText.trim()) {
      setEvents({ ...events, [selectedDate.dateKey]: eventText });
    } else {
      const newEvents = { ...events };
      delete newEvents[selectedDate.dateKey];
      setEvents(newEvents);
    }
    setShowEventModal(false);
  };

  // จัดการโน้ต
  const openNoteModal = (note = null) => {
    if (note) {
      setEditingNote(note.id);
      setNoteForm({ ...note });
    } else {
      setEditingNote(null);
      setNoteForm({ title: '', subject: '', content: '', files: [] });
    }
    setShowNoteModal(true);
  };

  const saveNote = () => {
    if (!noteForm.title.trim()) return alert('กรุณาใส่ชื่อเรื่อง');

    const newNote = {
      ...noteForm,
      id: editingNote || Date.now(),
      createdAt: editingNote ? notes.find(n => n.id === editingNote).createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setNotes(editingNote 
      ? notes.map(n => n.id === editingNote ? newNote : n)
      : [newNote, ...notes]
    );
    setShowNoteModal(false);
  };

  const deleteNote = (id) => {
    if (confirm('ลบโน้ตนี้?')) {
      setNotes(notes.filter(n => n.id !== id));
    }
  };

  // จัดการไฟล์
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files).map(file => ({
      name: file.name,
      size: (file.size / 1024).toFixed(2) + ' KB',
      type: file.type,
      url: URL.createObjectURL(file)
    }));
    setNoteForm({ ...noteForm, files: [...noteForm.files, ...files] });
  };

  const removeFile = (index) => {
    setNoteForm({ 
      ...noteForm, 
      files: noteForm.files.filter((_, i) => i !== index) 
    });
  };

  const openFile = (file) => {
    setViewingFile(file);
  };

  // แสดงวันในปฏิทิน
  const renderDays = () => {
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-20 bg-gray-50 rounded" />);
    }
    
    for (let day = 1; day <= lastDate; day++) {
      const dateKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${day}`;
      const hasEvent = events[dateKey];
      const isToday = new Date().toDateString() === 
        new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
      
      days.push(
        <div
          key={day}
          onClick={() => openEventModal(day)}
          className={`h-20 p-2 rounded cursor-pointer transition hover:shadow-lg
            ${isToday ? 'bg-yellow-100 border-2 border-yellow-500' 
              : hasEvent ? 'bg-blue-100 border-2 border-blue-400'
              : 'bg-white border-2 border-gray-200 hover:border-blue-300'}
          `}
        >
          <div className={`font-bold text-sm ${isToday ? 'text-yellow-700' : 'text-gray-700'}`}>
            {day}
          </div>
          {hasEvent && (
            <div className="text-xs text-blue-700 mt-1 line-clamp-2">{hasEvent}</div>
          )}
        </div>
      );
    }
    return days;
  };

  return (
    <>
      <Navbar_user />
      
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="mb-6">
            <div className="text-sm text-gray-500 mb-2">
              หน้าหลัก › ปฏิทินการสอบ
            </div>
            <h1 className="text-3xl font-bold text-gray-800">ปฏิทินการสอบ</h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-4">
            
            {/* ปฏิทิน */}
            <div className="w-full lg:w-2/3">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                
                {/* Header ปฏิทิน */}
                <div className="bg-blue-600 text-white p-4">
                  <div className="flex items-center justify-between max-w-sm mx-auto">
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                      className="p-2 hover:bg-blue-700 rounded"
                    >
                      ◀
                    </button>
                    
                    <h2 className="text-xl font-bold">
                      {thaiMonths[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
                    </h2>
                    
                    <button
                      onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                      className="p-2 hover:bg-blue-700 rounded"
                    >
                      ▶
                    </button>
                  </div>
                </div>

                {/* Grid ปฏิทิน */}
                <div className="p-4">
                  <div className="grid grid-cols-7 gap-2">
                    {thaiDaysShort.map((day, i) => (
                      <div 
                        key={i} 
                        className={`text-center font-bold py-2 text-sm rounded ${
                          i === 0 ? 'bg-red-50 text-red-600' 
                          : i === 6 ? 'bg-blue-50 text-blue-600' 
                          : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                    {renderDays()}
                  </div>
                </div>
              </div>

              {/* คำอธิบาย */}
              <div className="mt-4 bg-white rounded-xl shadow p-4">
                <div className="flex gap-4 justify-center text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-yellow-100 border-2 border-yellow-500 rounded" />
                    <span>วันนี้</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-blue-100 border-2 border-blue-400 rounded" />
                    <span>มีกำหนดการ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar โน้ต */}
            <div className="w-full lg:w-1/3">
              <div className="bg-white rounded-xl shadow p-4 lg:sticky lg:top-6 max-h-[calc(100vh-120px)] overflow-y-auto">
                
                {/* Header */}
                <div className="flex items-center justify-between pb-3 mb-4">
                  <h3 className="text-lg font-bold text-gray-800">โน้ตการเรียน</h3>
                  <button
                    onClick={() => openNoteModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-sm font-medium"
                  >
                    + เพิ่มโน้ต
                  </button>
                </div>

                <div className="text-sm text-gray-500 mb-4">
                  ทั้งหมด {notes.length} โน้ต
                </div>

                {/* รายการโน้ต */}
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="rounded-lg p-3 bg-gray-50">
                      
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 line-clamp-1 mb-1">
                            {note.title}
                          </h4>
                          {note.subject && (
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                              {note.subject}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <button
                            onClick={() => openNoteModal(note)}
                            className="text-gray-400 hover:text-blue-600 p-1"
                            title="แก้ไข"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="text-gray-400 hover:text-red-600 p-1"
                            title="ลบ"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      {/* เนื้อหา */}
                      {note.content && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                          {note.content}
                        </p>
                      )}
                      
                      {/* ไฟล์แนบ */}
                      {note.files?.length > 0 && (
                        <div className="mt-2 pt-2 border-t space-y-1">
                          {note.files.map((file, idx) => (
                            <button
                              key={idx}
                              onClick={() => openFile(file)}
                              className="w-full text-left text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                              </svg>
                              <span className="truncate">{file.name}</span>
                            </button>
                          ))}
                        </div>
                      )}
                      
                      {/* วันที่ */}
                      <div className="text-xs text-gray-400 mt-2">
                        {new Date(note.updatedAt).toLocaleDateString('th-TH', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal กำหนดการสอบ */}
        {showEventModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <h3 className="text-xl font-bold mb-4">
                {selectedDate?.day} {thaiMonths[currentDate.getMonth()]} {currentDate.getFullYear() + 543}
              </h3>
              
              <textarea
                value={eventText}
                onChange={(e) => setEventText(e.target.value)}
                placeholder="รายละเอียดกำหนดการ..."
                rows="4"
                className="w-full p-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              
              <div className="flex gap-2 mt-4">
                <button
                  onClick={saveEvent}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg"
                >
                  บันทึก
                </button>
                {events[selectedDate?.dateKey] && (
                  <button
                    onClick={() => {
                      const newEvents = { ...events };
                      delete newEvents[selectedDate.dateKey];
                      setEvents(newEvents);
                      setShowEventModal(false);
                    }}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
                  >
                    ลบ
                  </button>
                )}
                <button
                  onClick={() => setShowEventModal(false)}
                  className="px-4 bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        )}

        {showNoteModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[95vh] overflow-hidden shadow-2xl">
              
              {/* Header สีสันสวยงาม */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-bold">
                      {editingNote ? 'แก้ไขโน้ต' : 'สร้างโน้ตใหม่'}
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowNoteModal(false)}
                    className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-lg transition"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* เนื้อหา Form */}
              <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
                <div className="space-y-5">
                  
                  {/* ชื่อเรื่อง */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      ชื่อเรื่อง <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={noteForm.title}
                      onChange={(e) => setNoteForm({ ...noteForm, title: e.target.value })}
                      placeholder="เช่น ยาแก้ปวดและลดไข้"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
                    />
                  </div>

                  {/* วิชา */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      วิชา / หมวดหมู่
                    </label>
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      <input
                        type="text"
                        value={noteForm.subject}
                        onChange={(e) => setNoteForm({ ...noteForm, subject: e.target.value })}
                        placeholder="เช่น เภสัชวิทยา, เภสัชกรรมคลินิก"
                        className="w-full pl-11 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition text-gray-800 placeholder-gray-400"
                      />
                    </div>
                  </div>

                  {/* เนื้อหา */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      เนื้อหา / สรุปบทเรียน
                    </label>
                    <textarea
                      value={noteForm.content}
                      onChange={(e) => setNoteForm({ ...noteForm, content: e.target.value })}
                      placeholder="พิมพ์เนื้อหา หรือ สรุปบทเรียนที่ต้องการบันทึก..."
                      rows="10"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition font-mono text-sm text-gray-800 placeholder-gray-400 resize-none"
                    />
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                      <span>รองรับ Markdown และ Text formatting</span>
                      <span>{noteForm.content.length} ตัวอักษร</span>
                    </div>
                  </div>

                  {/* อัปโหลดไฟล์ */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      แนบไฟล์เอกสาร
                    </label>
                    
                    {/* Drop Zone */}
                    <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-400 hover:bg-blue-50/50 transition cursor-pointer group">
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        id="fileUpload"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      />
                      <label htmlFor="fileUpload" className="cursor-pointer">
                        <div className="inline-block p-4 bg-blue-100 rounded-full mb-3 group-hover:bg-blue-200 transition">
                          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <div className="text-gray-700 font-medium mb-1">คลิกเพื่ออัปโหลดไฟล์</div>
                        <div className="text-sm text-gray-500">หรือลากไฟล์มาวางที่นี่</div>
                        <div className="text-xs text-gray-400 mt-2">รองรับ PDF, DOC, DOCX, JPG, PNG (สูงสุด 10MB)</div>
                      </label>
                    </div>

                    {/* รายการไฟล์ที่แนบ */}
                    {noteForm.files?.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <div className="text-sm font-medium text-gray-700 mb-2">
                          ไฟล์ที่แนบ ({noteForm.files.length})
                        </div>
                        {noteForm.files.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200 hover:border-blue-300 transition group">
                            {/* ไอคอนตามประเภทไฟล์ */}
                            <div className="flex-shrink-0">
                              {file.type?.includes('pdf') ? (
                                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                                  <span className="text-xl">📄</span>
                                </div>
                              ) : file.type?.includes('image') ? (
                                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                  <span className="text-xl">🖼️</span>
                                </div>
                              ) : (
                                <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                                  <span className="text-xl">📎</span>
                                </div>
                              )}
                            </div>
                            
                            {/* ข้อมูลไฟล์ */}
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-800 truncate">{file.name}</div>
                              <div className="text-xs text-gray-500">{file.size}</div>
                            </div>
                            
                            {/* ปุ่มลบ */}
                            <button
                              onClick={() => removeFile(idx)}
                              className="flex-shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition"
                              title="ลบไฟล์"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer ปุ่ม */}
              <div className="border-t bg-gray-50 px-6 py-4">
                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowNoteModal(false)}
                    className="px-6 py-2.5 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 font-medium transition"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={saveNote}
                    className="px-8 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-xl hover:from-blue-700 hover:to-blue-600 font-medium shadow-lg shadow-blue-500/30 transition flex items-center gap-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {editingNote ? 'บันทึกการแก้ไข' : 'สร้างโน้ต'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modaหl ดูไฟล์ */}
        {viewingFile && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] overflow-hidden shadow-2xl">
              
              {/* Header */}
              <div className="bg-gradient-to-r from-gray-800 to-gray-700 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="bg-white/10 p-2 rounded-lg">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </div>
                  <h3 className="font-semibold truncate">{viewingFile.name}</h3>
                </div>
                <button
                  onClick={() => setViewingFile(null)}
                  className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition ml-4"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* เนื้อหาไฟล์ */}
              <div className="p-6 overflow-auto max-h-[calc(95vh-80px)] bg-gray-50">
                {viewingFile.type?.includes('image') ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={viewingFile.url} alt={viewingFile.name} className="max-w-full mx-auto rounded-xl shadow-lg" />
                ) : viewingFile.type?.includes('pdf') ? (
                  <iframe src={viewingFile.url} className="w-full h-[75vh] rounded-xl border-2 border-gray-200 shadow-lg" />
                ) : (
                  <div className="text-center py-16">
                    <div className="inline-block p-6 bg-gray-100 rounded-2xl mb-4">
                      <div className="text-7xl">📄</div>
                    </div>
                    <p className="text-gray-600 text-lg mb-6">ไม่สามารถแสดงตัวอย่างไฟล์ประเภทนี้ได้</p>
                    <a
                      href={viewingFile.url}
                      download={viewingFile.name}
                      className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 font-medium shadow-lg transition"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      ดาวน์โหลดไฟล์
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Calendar;