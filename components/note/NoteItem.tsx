"use client";
import { useState } from "react";
import { Edit2, Trash2, Tag, Link as LinkIcon, ChevronDown, ChevronUp, FileText, ExternalLink } from "lucide-react";
import Swal from "@/utils/sweetalert";
import { SWAL_COLORS } from "@/utils/swal";
import type { UserNote } from "./NoteList";

export default function NoteItem({
  note,
  onEditAction,
  onDeleteAction,
  setTagFilterAction,
}: {
  note: UserNote;
    onEditAction: (note: UserNote) => void;
    onDeleteAction: (id: string) => void;
    setTagFilterAction: (tag: string) => void;
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

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: 'ยืนยันการลบบันทึก?',
      html: `
        <div class="text-center py-1">
          <p class="text-sm text-gray-600 mb-1">คุณต้องการลบบันทึกนี้ใช่หรือไม่?</p>
          <p class="text-base font-semibold text-gray-800 bg-gray-50 py-2 px-3 rounded-xl border border-gray-100 mb-2 truncate">"${note.title || 'ไม่มีหัวข้อ'}"</p>
          <p class="text-sm text-red-500">⚠️ ข้อมูลและไฟล์แนบจะถูกลบถาวร ไม่สามารถกู้คืนได้</p>
        </div>
      `,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: SWAL_COLORS.danger,
      cancelButtonColor: SWAL_COLORS.cancel,
      confirmButtonText: 'ใช่, ลบบันทึก',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-3xl shadow-2xl',
        confirmButton: 'rounded-xl px-5 py-2.5 font-medium text-sm',
        cancelButton: 'rounded-xl px-5 py-2.5 font-medium text-sm',
      }
    });

    if (result.isConfirmed) {
      onDeleteAction(note.id);
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex flex-col h-full">
      {/* Header: Title & Actions */}
      <div className="flex justify-between items-start mb-3 gap-2">
        <h3 className="font-medium text-gray-900 text-base line-clamp-1 flex-grow" title={note.title}>
          {note.title || "ไม่มีหัวข้อ"}
        </h3>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEditAction(note)}
            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
            title="แก้ไขบันทึก"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
            title="ลบบันทึก"
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
            className="mt-2 text-indigo-600 hover:text-indigo-800 font-medium text-xs flex items-center gap-0.5"
          >
            {isExpanded ? (
              <>แสดงน้อยลง <ChevronUp className="w-3 h-3" /></>
            ) : (
              <>... อ่านเพิ่มเติม <ChevronDown className="w-3 h-3" /></>
            )}
          </button>
        )}
      </div>

      {/* Attached Link Section */}
      {note.link_url && (
        <div className="mb-3">
          <a
            href={note.link_url.startsWith("http://") || note.link_url.startsWith("https://") ? note.link_url : `https://${note.link_url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors border border-blue-200/60 max-w-full truncate group"
            title={note.link_url}
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-500 shrink-0 group-hover:scale-110 transition-transform" />
            <span className="truncate">{note.link_url}</span>
          </a>
        </div>
      )}

      {/* Files Section: แก้ไขการดึง storage_path จาก Object */}
      {note.files && note.files.length > 0 && (
        <div className="mb-4 pt-3 border-t border-dashed border-gray-100">
          <p className="text-[10px] font-medium text-gray-400  mb-2 flex items-center gap-1">
            <FileText className="w-3 h-3" /> ไฟล์แนบ ({note.files.length})
          </p>
          <div className="flex flex-wrap gap-1.5">
            {note.files.map((file: any, i) => {
              // ดึงชื่อไฟล์จาก storage_path (ตามโครงสร้าง DB/NoteFile Entity)
              let fileName = file.storage_path || file.original_filename || (typeof file === 'string' ? file : '');
              if (fileName.startsWith('/uploads/')) {
                fileName = fileName.replace('/uploads/', '');
              } else if (fileName.startsWith('uploads/')) {
                fileName = fileName.replace('uploads/', '');
              }
              const displayLabel = file.original_filename || fileName;
              const isImage = file.file_type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(displayLabel) || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
              const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/uploads/${fileName}`;

              return isImage ? (
                <a
                  key={file.file_id || i}
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block relative rounded-lg overflow-hidden border border-slate-200 w-16 h-16 hover:opacity-90 hover:ring-2 hover:ring-indigo-500 transition-all shadow-sm"
                  title={displayLabel}
                >
                  <img
                    src={fileUrl}
                    alt={displayLabel}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      // ถ้าโหลดรูปไม่ขึ้นให้แสดงไอคอนไฟล์แทน
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </a>
              ) : (
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
                className="flex items-center text-[10px] font-medium text-indigo-600 bg-indigo-50/50 px-2 py-0.5 rounded-full cursor-pointer hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                onClick={() => setTagFilterAction(tagName)}
              >
                <Tag className="w-2.5 h-2.5 mr-1" /> {tagName}
              </span>
            );
          })}
        </div>
        <span className="text-[10px] font-medium text-gray-400 italic">
          {formattedDate}
        </span>
      </div>
    </div>
  );
}