"use client";
import { useState, useMemo } from "react";
import { Search, X, Bookmark } from "lucide-react";
import NoteItem from "./NoteItem";
import NoteModal from "./NoteModal";
import AddNoteButton from "./AddNoteButton";


export interface UserNote {
  id: string;
  content: string;
  title:string;
  tags: string[];
  files: string[];
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
  onSaveNote: (note: UserNote) => void;
  onUpdateNote: (note: UserNote) => void;
  onDeleteNote: (id: string) => void;
  tagFilter: string;
  setTagFilter: (val: string) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<UserNote | null>(null);

  const filteredNotes = useMemo(() => {
    if (!tagFilter) return notes;
    const lower = tagFilter.toLowerCase();
    return notes.filter(
      (note) =>
        note.tags.some((t) => t.toLowerCase().includes(lower)) ||
        note.content.toLowerCase().includes(lower) ||
        note.files.some((f) => f.toLowerCase().includes(lower))
    );
  }, [notes, tagFilter]);

  return (
    <div className="bg-white rounded-xl shadow-xl p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <Bookmark className="w-6 h-6 text-indigo-600" /> บันทึกสรุป
      </h2>

      {/* Search / Filter */}
      <div className="mb-4 flex items-center relative">
        <Search className="w-5 h-5 text-gray-400 absolute left-3" />
        <input
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          placeholder="กรองโน้ตด้วย Tags หรือชื่อไฟล์..."
          className="w-full p-2 pl-10 border border-gray-300 rounded-lg focus:ring-indigo-500 text-sm"
        />
        {tagFilter && (
          <button
            onClick={() => setTagFilter("")}
            className="absolute right-2 p-1 text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Add Button */}
      <AddNoteButton
        onClick={() => {
          setEditingNote(null);
          setIsModalOpen(true);
        }}
      />

      {/* Note List */}
      <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
        {filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
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
          <p className="text-gray-500 text-center py-4">
            ไม่พบโน้ตที่ตรงกับคำค้นหา
          </p>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <NoteModal
          note={editingNote}
          onSave={(note: UserNote) => {
            // eslint-disable-next-line @typescript-eslint/no-unused-expressions
            editingNote ? onUpdateNote(note) : onSaveNote(note);
            setIsModalOpen(false);
          }}
          onClose={() => setIsModalOpen(false)}
          onDelete={onDeleteNote}
        />
      )}
    </div>
  );
}
