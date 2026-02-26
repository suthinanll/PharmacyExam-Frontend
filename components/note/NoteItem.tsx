"use client";
import { useState } from "react";
import { Edit2, Trash2, Tag, Link as LinkIcon, ChevronDown, ChevronUp, FileText } from "lucide-react";
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
  const [isExpanded, setIsExpanded] = useState(false);

  const contentText = note.content || "";
  const maxLength = 120;
  const isLongContent = contentText.length > maxLength;

  // จัดการเรื่องวันที่ให้รองรับทั้ง createdAt (Frontend) และ created_at (Backend)
  const rawDate = note.createdAt || (note as any).created_at;
  const formattedDate = (() => {
    if (!rawDate) return "เพิ่งเมื่อครู่";
    const date = new Date(rawDate);
    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toLocaleDateString("th-TH", {
          day: "numeric",
          month: "short",
          year: "2-digit",
        });
  })();

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-full">
      {/* Header: Title & Actions */}
      <div className="flex justify-between items-start mb-3 gap-2">
        <h3 className="font-bold text-gray-900 text-base line-clamp-1 flex-grow" title={note.title}>
          {note.title || "ไม่มีหัวข้อ"}
        </h3>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(note)}
            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(note.id)}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-grow mb-4">
        <div className={`text-gray-600 text-sm whitespace-pre-line overflow-hidden ${!isExpanded ? "line-clamp-2" : ""}`}>
          {contentText}
        </div>
        {isLongContent && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-indigo-600 hover:text-indigo-800 font-bold text-xs flex items-center gap-0.5"
          >
            {isExpanded ? (
              <>แสดงน้อยลง <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>... อ่านเพิ่มเติม <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}
      </div>

      {/* Files Section: แก้ไขการดึง storage_path จาก Object */}
      {note.files && note.files.length > 0 && (
        <div className="mb-4 pt-3 border-t border-dashed border-gray-100">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
            <FileText className="w-3 h-3" /> ไฟล์แนบ ({note.files.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {note.files.map((file: any, i) => {
              // ดึงชื่อไฟล์จาก storage_path (ตามโครงสร้าง DB/NoteFile Entity)
              const fileName = file.storage_path || file.original_filename || file;
              const displayLabel = file.original_filename || fileName;
              const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/uploads/${fileName}`;

              return (
                <a
                  key={file.file_id || i}
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-1.5 text-[11px] text-indigo-600 bg-indigo-50 border border-indigo-100 px-2.5 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all max-w-full"
                >
                  <LinkIcon className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate max-w-[150px] font-medium">{displayLabel}</span>
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer: Tags & Date */}
      <div className="mt-auto pt-3 border-t border-gray-50 flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-1.5">
          {note.tags?.map((item: any, idx) => {
            // แก้ไขการแกะชื่อแท็กจากความสัมพันธ์ tags.tag.tag_name
            const tagName = item.tag?.tag_name || item.tag_name || item.name || item;
            const tagId = item.tag_id || item.id || idx;

            return (
              <span
                key={tagId}
                className="flex items-center text-[10px] font-bold text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-full cursor-pointer hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                onClick={() => setTagFilter(tagName)}
              >
                <Tag className="w-2.5 h-2.5 mr-1" /> {tagName}
              </span>
            );
          })}
        </div>
        <span className="text-[10px] font-bold text-gray-400 italic">
          {formattedDate}
        </span>
      </div>
    </div>
  );
}