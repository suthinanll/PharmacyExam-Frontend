"use client";
import { Edit2, Trash2, Tag, FileText, Link as LinkIcon } from "lucide-react";
import type { UserNote } from "./NoteList";

export default function NoteItem({
  note,
  onEdit,
  onDelete,
  setTagFilter,
}: {
  note: UserNote;
  onEdit: (note: UserNote) => void;
  onDelete: (id: string) => void;
  setTagFilter: (tag: string) => void;
}) {
  return (
    <div className="bg-white p-4 rounded-lg shadow border border-gray-100 hover:shadow-lg transition duration-150">
      <div className="flex justify-between items-start mb-2">
        <p className="text-gray-800 whitespace-pre-line">{note.content}</p>
        <div className="flex gap-1 ml-4 flex-shrink-0">
          <button
            onClick={() => onEdit(note)}
            className="p-1 text-blue-500 hover:text-blue-700 rounded-full hover:bg-blue-50"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Files */}
      {note.files.length > 0 && (
        <div className="mt-3 pt-2 border-t border-dashed border-gray-200">
          <p className="text-xs font-semibold text-gray-600 flex items-center gap-1 mb-3">
            <FileText className="w-3 h-3" /> ไฟล์แนบ:
          </p>
          <div className="flex flex-wrap gap-2">
            {note.files.map((file, i) => (
              <span
                key={i}
                className="text-xs text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full flex items-center gap-1 max-w-full truncate"
              >
                <LinkIcon className="w-3 h-3 flex-shrink-0" />
                {file}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      <div className="mt-2 flex flex-wrap gap-2 pt-2 border-t border-dashed border-gray-200">
        {note.tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full cursor-pointer hover:bg-indigo-200"
            onClick={() => setTagFilter(tag)}
          >
            <Tag className="w-3 h-3 mr-1" /> {tag}
          </span>
        ))}
        <span className="text-xs text-gray-400 ml-auto flex-shrink-0">
          {new Date(note.createdAt).toLocaleDateString("th-TH", {
            day: "numeric",
            month: "short",
          })}
        </span>
      </div>
    </div>
  );
}
