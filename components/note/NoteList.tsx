"use client";
import { useState, useMemo, useEffect } from "react";
import { Search, X, Bookmark } from "lucide-react";
import NoteItem from "./NoteItem";
import NoteModal from "./NoteModal";
import AddNoteButton from "./AddNoteButton";
import NotePagination from "./NotePagination";
import SuggestInput from "@/components/SuggestInput";

export interface UserNote {
  id: string;
  content: string;
  title: string;
  link_url?: string;
  tags: any[];
  files: any[];
  createdAt: number;
}

function NoteSkeleton() {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 animate-pulse space-y-3">
      {/* Header: Title & Action Buttons skeleton */}
      <div className="flex justify-between items-start gap-2">
        <div className="h-5 bg-gray-200 rounded-md w-3/5"></div>
        <div className="flex gap-1.5 flex-shrink-0">
          <div className="w-7 h-7 bg-gray-100 rounded-lg"></div>
          <div className="w-7 h-7 bg-gray-100 rounded-lg"></div>
        </div>
      </div>

      {/* Content skeleton lines */}
      <div className="space-y-2 py-1">
        <div className="h-3.5 bg-gray-100 rounded w-full"></div>
        <div className="h-3.5 bg-gray-100 rounded w-4/5"></div>
      </div>

      {/* Attached link/file placeholder */}
      <div className="h-6 bg-gray-50 rounded-lg w-2/3"></div>

      {/* Footer: Tags & Date */}
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="flex gap-1.5">
          <div className="h-5 bg-gray-100 rounded-md w-14"></div>
          <div className="h-5 bg-gray-100 rounded-md w-12"></div>
        </div>
        <div className="h-3.5 bg-gray-100 rounded w-16"></div>
      </div>
    </div>
  );
}

export default function NoteList({
  notes,
  isLoading = false,
  onSaveNoteAction,
  onUpdateNoteAction,
  onDeleteNoteAction,
  tagFilter,
  setTagFilterAction,
}: {
  notes: UserNote[];
  isLoading?: boolean;
    onSaveNoteAction: (note: UserNote, files?: File[]) => void;
  // เพิ่ม deletedFiles พารามิเตอร์ที่ 3 เพื่อรองรับการลบไฟล์จาก Modal
    onUpdateNoteAction: (note: UserNote, files?: File[], deletedFiles?: string[]) => void;
    onDeleteNoteAction: (id: string) => void;
  tagFilter: string;
    setTagFilterAction: (val: string) => void;
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
        <Bookmark className="w-6 h-6 text-primary" /> บันทึกสรุป
      </h2>

      {/* Search / Filter */}
      <div className="mb-4 flex items-center relative">
        <Search className="w-5 h-5 text-gray-600 absolute left-3" />
        <SuggestInput
          value={tagFilter || ""}
          onValueChange={setTagFilterAction}
          aria-label="ค้นหาบันทึกด้วยหัวข้อ, Tags หรือเนื้อหา"
          suggestions={notes.flatMap((note) => [
            note.title,
            ...(note.tags ?? []).map((t) =>
              typeof t === "object" ? (t.tag?.tag_name || t.tag_name || t.name) : t,
            ),
          ])}
          placeholder="ค้นหาด้วยหัวข้อ, Tags หรือเนื้อหา..."
          className="w-full p-2.5 pl-10 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm transition-all"
        />
        {tagFilter && (
          <button
            onClick={() => setTagFilterAction("")}
            className="absolute right-3 p-1 text-gray-600 hover:text-gray-600 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Add Button */}
      <div className="mb-4">
        <AddNoteButton
          onClickAction={() => {
            setEditingNote(null);
            setIsModalOpen(true);
          }}
        />
      </div>

      {/* Note List Container */}
      <div className="space-y-4">
        {isLoading ? (
          <>
            <NoteSkeleton />
            <NoteSkeleton />
          </>
        ) : paginatedNotes.length > 0 ? (
          paginatedNotes.map((note) => (
            <NoteItem
              key={note.id}
              note={note}
              onEditAction={(n) => {
                setEditingNote(n);
                setIsModalOpen(true);
              }}
              onDeleteAction={onDeleteNoteAction}
              setTagFilterAction={setTagFilterAction}
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

      {/* Pagination (จะแสดงอัตโนมัติเมื่อมีมากกว่า 2 รายการ และโหลดเสร็จแล้ว) */}
      {!isLoading && (
        <NotePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredNotes.length}
          perPage={ITEMS_PER_PAGE}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Modal สำหรับ Create/Update */}
      {isModalOpen && (
        <NoteModal
          note={editingNote}
          // ปรับพารามิเตอร์ onSave ให้สอดคล้องกับ NoteModal ที่ส่ง deletedFiles กลับมา
          onSave={(noteData: UserNote, files?: File[], deletedFiles?: string[]) => {
            if (editingNote) {
              onUpdateNoteAction(noteData, files, deletedFiles);
            } else {
              onSaveNoteAction(noteData, files);
            }
            setIsModalOpen(false);
          }}
          onClose={() => setIsModalOpen(false)}
          onDelete={(id) => {
            onDeleteNoteAction(id);
            setIsModalOpen(false);
          }}
          existingTags={existingTags}
        />
      )}
    </div>
  );
}