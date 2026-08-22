"use client";
import { useState, useMemo, useEffect } from "react";
import { Search, X, Bookmark } from "lucide-react";
import NoteItem from "./NoteItem";
import NoteModal from "./NoteModal";
import AddNoteButton from "./AddNoteButton";
import NotePagination from "./NotePagination";

export interface UserNote {
  id: string;
  content: string;
  title: string;
  link_url?: string;
  tags: any[];
  files: any[];
  createdAt: number;
}

export default function NoteList({
  notes,
  onSaveNote,
  onUpdateNote,
  onDeleteNote,
  tagFilter,
  setTagFilter,
}: {
  notes: UserNote[];
  onSaveNote: (note: UserNote, files?: File[]) => void;
  // เพิ่ม deletedFiles พารามิเตอร์ที่ 3 เพื่อรองรับการลบไฟล์จาก Modal
  onUpdateNote: (note: UserNote, files?: File[], deletedFiles?: string[]) => void;
  onDeleteNote: (id: string) => void;
  tagFilter: string;
  setTagFilter: (val: string) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<UserNote | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 2;

  const filteredNotes = useMemo(() => {
    if (!tagFilter) return notes;
    const lower = tagFilter.toLowerCase();

    return notes.filter((note) => {
      // 1. ค้นหาใน Tags (รองรับความสัมพันธ์ที่ซ้อนกันจาก Backend)
      const matchesTags = note.tags?.some((t) => {
        const tagName = typeof t === "object" ? (t.tag?.tag_name || t.tag_name || t.name) : t;
        return tagName?.toLowerCase().includes(lower);
      });

      // 2. ค้นหาใน Title
      const matchesTitle = note.title?.toLowerCase().includes(lower);

      // 3. ค้นหาใน Content
      const matchesContent = note.content?.toLowerCase().includes(lower);

      // 4. ค้นหาในชื่อไฟล์ (ตรวจสอบทั้ง original_filename และ string ปกติ)
      const matchesFiles = note.files?.some((f) => {
        const fileName = typeof f === "object" ? f.original_filename : f;
        return fileName?.toLowerCase().includes(lower);
      });

      return matchesTags || matchesTitle || matchesContent || matchesFiles;
    });
  }, [notes, tagFilter]);

  const totalPages = Math.ceil(filteredNotes.length / ITEMS_PER_PAGE);

  // Reset to page 1 when tagFilter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [tagFilter]);

  // Adjust page if current page exceeds total pages
  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedNotes = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNotes.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNotes, currentPage]);

  const existingTags = useMemo(() => {
    const tags = new Set<string>();
    notes.forEach(note => {
      note.tags?.forEach(t => {
        const tagName = typeof t === "object" ? (t.tag?.tag_name || t.tag_name || t.name) : t;
        if (tagName && typeof tagName === "string") {
          tags.add(tagName.trim());
        }
      });
    });
    return Array.from(tags);
  }, [notes]);

  return (
    <div className="bg-white rounded-xl shadow-xl p-4 border border-slate-100">
      <h2 className="text-2xl font-medium text-gray-800 mb-4 flex items-center gap-2">
        <Bookmark className="w-6 h-6 text-indigo-600" /> บันทึกสรุป
      </h2>

      {/* Search / Filter */}
      <div className="mb-4 flex items-center relative">
        <Search className="w-5 h-5 text-gray-400 absolute left-3" />
        <input
          value={tagFilter || ""} 
          onChange={(e) => setTagFilter(e.target.value)}
          placeholder="ค้นหาด้วยหัวข้อ, Tags หรือเนื้อหา..."
          className="w-full p-2.5 pl-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm transition-all"
        />
        {tagFilter && (
          <button
            onClick={() => setTagFilter("")}
            className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Add Button */}
      <div className="mb-4">
        <AddNoteButton
          onClick={() => {
            setEditingNote(null);
            setIsModalOpen(true);
          }}
        />
      </div>

      {/* Note List Container */}
      <div className="space-y-4">
        {paginatedNotes.length > 0 ? (
          paginatedNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              onEdit={(n) => {
                setEditingNote(n);
                setIsModalOpen(true);
              }}
              onDelete={onDeleteNote}
              setTagFilter={setTagFilter}
            />
          ))
        ) : (
          <div className="text-center py-10">
            <p className="text-slate-400 text-sm italic">
              {tagFilter ? "ไม่พบโน้ตที่ตรงกับการค้นหา" : "ยังไม่มีบันทึกในขณะนี้"}
            </p>
          </div>
        )}
      </div>

      {/* Pagination (จะแสดงอัตโนมัติเมื่อมีมากกว่า 2 รายการ ออกแบบพิเศษสำหรับความกว้างการ์ด) */}
      <NotePagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredNotes.length}
        perPage={ITEMS_PER_PAGE}
        onPageChange={setCurrentPage}
      />

      {/* Modal สำหรับ Create/Update */}
      {isModalOpen && (
        <NoteModal
          note={editingNote}
          // ปรับพารามิเตอร์ onSave ให้สอดคล้องกับ NoteModal ที่ส่ง deletedFiles กลับมา
          onSave={(noteData: UserNote, files?: File[], deletedFiles?: string[]) => {
            if (editingNote) {
              onUpdateNote(noteData, files, deletedFiles);
            } else {
              onSaveNote(noteData, files);
            }
            setIsModalOpen(false);
          }}
          onClose={() => setIsModalOpen(false)}
          onDelete={(id) => {
            onDeleteNote(id);
            setIsModalOpen(false);
          }}
          existingTags={existingTags}
        />
      )}
    </div>
  );
}