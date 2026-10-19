"use client";
import { useEffect, useState, useRef } from "react";
import { X, Upload, Save, Trash2, FileText, Tag, AlignLeft, Type, Link as LinkIcon } from "lucide-react";
import Swal from "@/utils/sweetalert";
import { SWAL_COLORS } from "@/utils/swal";
import type { UserNote } from "./NoteList";
import Toast from "../Toast";

type Props = {
  note: UserNote | null;
  onSave: (note: UserNote, files?: File[], deletedFiles?: string[]) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  existingTags?: string[];
};

const emptyForm: UserNote = {
  id: "",
  title: "",
  content: "",
  link_url: "",
  tags: [],
  files: [],
  createdAt: Date.now(),
};

export default function NoteModal({ note, onSave, onClose, onDelete, existingTags = [] }: Props) {
  const isNew = !note;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<UserNote>(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [deletedFiles, setDeletedFiles] = useState<string[]>([]); 

  useEffect(() => {
    if (note) {
      setFormData({
        ...note,
        link_url: note.link_url || "",
      });

      // ดึงชื่อแท็กแบบละเอียด (ป้องกันโครงสร้าง Relations จาก Backend)
      const tagNames = note.tags?.map((t: any) => {
        if (!t) return null;
        // เช็คทุกจุดที่ชื่อแท็กอาจจะซ่อนอยู่
        return t.tag?.tag_name || t.tag_name || t.name || (typeof t === 'string' ? t : null);
      })
      .filter(n => n && String(n).trim() !== '' && String(n) !== 'undefined') || [];

      setTagInput(tagNames.join(", "));
      setDeletedFiles([]); 
    } else {
      setFormData({ ...emptyForm });
      setTagInput("");
      setSelectedFiles([]);
      setPreviews([]);
      setDeletedFiles([]);
    }

    return () => {
      previews.forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [note]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...filesArray]);

      filesArray.forEach((file) => {
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onloadend = () => {
            setPreviews(prev => [...prev, reader.result as string]);
          };
          reader.readAsDataURL(file);
        } else {
          setPreviews(prev => [...prev, ""]);
        }
      });
    }
  };

  const removeNewFile = (index: number) => {
    if (previews[index]) URL.revokeObjectURL(previews[index]);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingFile = async (fileId: any) => {
    if (!fileId) return;

    const result = await Swal.fire({
      title: 'ลบไฟล์แนบ?',
      text: 'คุณต้องการลบไฟล์แนบนี้ใช่หรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: SWAL_COLORS.danger,
      cancelButtonColor: SWAL_COLORS.cancel,
      confirmButtonText: 'ใช่, ลบไฟล์',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
      customClass: {
        popup: 'rounded-3xl shadow-2xl',
        confirmButton: 'rounded-xl px-4 py-2 font-medium text-sm',
        cancelButton: 'rounded-xl px-4 py-2 font-medium text-sm',
      }
    });

    if (!result.isConfirmed) return;

    // เก็บ ID ลงในรายการที่จะส่งไปลบที่ Backend
    setDeletedFiles(prev => [...prev, String(fileId)]);
    
    // อัปเดต UI ทันที
    setFormData(prev => ({
      ...prev,
      files: prev.files?.filter((f: any) => (f.file_id || f.id) !== fileId)
    }));
  };

  const [toast, setToast] = useState<{ type: "error" | "warning" | "success" | "info"; message: string } | null>(null);

  const handleSave = () => {
    if (!formData.title?.trim()) {
      setToast({ type: "warning", message: "กรุณาระบุหัวข้อบันทึก" });
      return;
    }
    if (!formData.content?.trim()) {
      setToast({ type: "warning", message: "กรุณาระบุเนื้อหาโดยสรุป" });
      return;
    }

    // กรองชื่อแท็กให้สะอาดที่สุดก่อนส่งออก
    const tagNames = Array.from(new Set(
      tagInput
        .split(",")
        .map(t => t.trim())
        .filter(t => t && t !== 'undefined' && t !== 'null')
    ));

    onSave({
      ...formData,
      tags: tagNames as any, // ส่ง Array ของ String ชื่อแท็กไป
    }, selectedFiles, deletedFiles);
  };

  return (
    <div className="fixed inset-0 bg-gray-900/60 dark:bg-black/60 flex items-center justify-center z-50 p-4 overflow-y-auto">
      {toast && (
        <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />
      )}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h3 className="text-lg font-medium text-slate-800">{isNew ? "สร้างบันทึกใหม่" : "แก้ไขบันทึก"}</h3>
            <p className="text-xs text-slate-500">รวบรวมเนื้อหาสำคัญสำหรับการสอบ</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Type className="w-4 h-4 text-blue-500" /> หัวข้อบันทึก
            </label>
            <input
              value={formData.title || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all"
              placeholder="เช่น เภสัชวิทยา บทที่ 1"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <AlignLeft className="w-4 h-4 text-blue-500" /> เนื้อหาโดยสรุป
            </label>
            <textarea
              value={formData.content || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={5}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all resize-none"
              placeholder="เขียนสรุปสั้นๆ..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <Tag className="w-4 h-4 text-blue-500" /> ป้ายกำกับ
            </label>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
              placeholder="เคมี, สอบปลายภาค (คั่นด้วยเครื่องหมายจุลภาค)"
            />
            {existingTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                <span className="text-xs text-slate-500 pt-1">แท็กที่เคยใช้:</span>
                {existingTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      const tags = tagInput.split(',').map(t => t.trim()).filter(Boolean);
                      if (!tags.includes(tag)) {
                        setTagInput(tags.length > 0 ? `${tags.join(', ')}, ${tag}` : tag);
                      }
                    }}
                    className="text-xs bg-slate-100 hover:bg-blue-100 text-slate-600 hover:text-blue-700 px-2.5 py-1 rounded-lg transition-colors border border-slate-200"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-blue-500" /> แนบลิงก์เนื้อหา / แหล่งอ้างอิง
            </label>
            <input
              type="url"
              value={formData.link_url || ""}
              onChange={(e) => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-sm"
              placeholder="เช่น https://example.com หรือ ลิงก์เอกสาร/วิดีโอ"
            />
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" /> เอกสารแนบ
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 rounded-2xl p-6 transition-all text-center"
            >
              <input type="file" multiple className="hidden" ref={fileInputRef} onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx" />
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"><Upload className="w-6 h-6 text-blue-600" /></div>
              <p className="text-sm font-medium text-slate-700">คลิกเพื่อเพิ่มไฟล์</p>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {/* รายการไฟล์ที่มีอยู่เดิม */}
              {formData.files?.map((file: any, i) => {
                const fileName = file.original_filename || file.storage_path || "Unnamed File";
                const fileId = file.file_id || file.id;
                let storagePath = file.storage_path || fileName;
                if (storagePath.startsWith('/uploads/')) {
                  storagePath = storagePath.replace('/uploads/', '');
                } else if (storagePath.startsWith('uploads/')) {
                  storagePath = storagePath.replace('uploads/', '');
                }
                const isImage = file.file_type?.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
                const fileUrl = `${process.env.NEXT_PUBLIC_API_URL}/uploads/${storagePath}`;

                return (
                  <div 
                    key={fileId || `old-${i}`} 
                    onClick={() => window.open(fileUrl, '_blank')}
                    className="relative aspect-square rounded-xl border border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden group shadow-sm cursor-pointer hover:border-blue-300"
                    title="คลิกเพื่อดูไฟล์"
                  >
                    {isImage ? (
                      <img
                        src={fileUrl}
                        className="w-full h-full object-cover"
                        alt={fileName}
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <>
                        <FileText className="w-8 h-8 text-slate-300 group-hover:text-blue-300 transition-colors" />
                        <p className="text-[0.5625rem] text-slate-500 truncate w-full px-1 text-center mt-1">{fileName}</p>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeExistingFile(fileId);
                      }}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}

              {/* แสดงไฟล์ใหม่ที่กำลังเลือก */}
              {selectedFiles.map((file, i) => (
                <div 
                  key={`new-${i}`} 
                  onClick={() => {
                    if (previews[i]) window.open(previews[i], '_blank');
                  }}
                  className="relative aspect-square rounded-xl border-2 border-blue-100 overflow-hidden group shadow-sm cursor-pointer hover:border-blue-300"
                  title="คลิกเพื่อดูไฟล์"
                >
                  {previews[i] ? (
                    <img src={previews[i]} className="w-full h-full object-cover" alt="preview" />
                  ) : (
                    <div className="w-full h-full bg-blue-50 flex flex-col items-center justify-center">
                      <FileText className="w-8 h-8 text-blue-300 mb-1" />
                      <p className="text-[0.5625rem] text-blue-400 truncate w-full px-1 text-center">{file.name}</p>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNewFile(i);
                    }}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 shadow-md"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-3">
          {!isNew && (
            <button
              type="button"
              onClick={async () => {
                const result = await Swal.fire({
                  title: 'ยืนยันการลบบันทึก?',
                  html: `
                    <div class="text-center py-1">
                      <p class="text-sm text-gray-600 mb-1">คุณต้องการลบบันทึกนี้ใช่หรือไม่?</p>
                      <p class="text-base font-medium text-gray-800 bg-gray-50 py-2 px-3 rounded-xl border border-gray-100 mb-2 truncate">"${formData.title || 'ไม่มีหัวข้อ'}"</p>
                      <p class="text-xs text-red-500">⚠️ ข้อมูลและไฟล์แนบจะถูกลบถาวร ไม่สามารถกู้คืนได้</p>
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
                  onDelete(formData.id);
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-xl font-medium text-sm transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> ลบบันทึก
            </button>
          )}
          <div className="flex-grow"></div>
          <button onClick={onClose} className="px-6 py-2.5 text-slate-600 hover:bg-slate-200 rounded-xl font-medium text-sm transition-colors">ยกเลิก</button>
          <button onClick={handleSave} className="flex items-center justify-center gap-2 px-8 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium text-sm shadow-lg active:scale-95 transition-all">
            <Save className="w-4 h-4" /> บันทึกข้อมูล
          </button>
        </div>
      </div>
    </div>
  );
}