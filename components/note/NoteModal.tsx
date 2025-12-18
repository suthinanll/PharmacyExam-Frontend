"use client";
import { useState } from "react";
import { X, Upload, Save, Trash2, FileText, Link as LinkIcon } from "lucide-react";
import type { UserNote } from "./NoteList";

export default function NoteModal({
  note,
  onSave,
  onClose,
  onDelete,
}: {
  note: UserNote | null;
  onSave: (note: UserNote) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
}) {
  const isNew = !note;
  const [formData, setFormData] = useState<UserNote>(
    note || {
      id: `n-${Date.now()}`,
      content: "",
      tags: [],
      files: [],
      createdAt: Date.now(),
    }
  );
  const [tagInput, setTagInput] = useState(formData.tags.join(", "));
  const [newFile, setNewFile] = useState("");

  const handleSave = () => {
    const finalNote = {
      ...formData,
      tags: tagInput
        .split(",")
        .map((t) => t.trim())
        .filter((t) => t.length > 0),
    };
    onSave(finalNote);
  };

  const handleAddFile = () => {
    if (!newFile.trim()) return;
    setFormData((prev) => ({
      ...prev,
      files: [...prev.files, newFile.trim()],
    }));
    setNewFile("");
  };

  const handleRemoveFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl">
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            {isNew ? "เพิ่มบันทึกสรุปใหม่" : "แก้ไขบันทึกสรุป"}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            หัวข้อการสรุป
          </label>
          <input
            value={formData.title}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, title: e.target.value }))
            }
            className="w-full p-2 border rounded-lg"
            placeholder="หัวข้อบันทึก"
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เนื้อหาบันทึก
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              rows={4}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-indigo-500 resize-none text-gray-700"
              placeholder="สรุปเนื้อหาการอ่าน..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (คั่นด้วย , )
            </label>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 text-sm"
              placeholder="เช่น เคมี, กลางภาค, สำคัญ"
            />
          </div>

          {/* File Attachments */}
          <div className="border p-4 rounded-lg bg-gray-50">
            <label className="text-sm font-bold text-gray-700 mb-2 flex items-center gap-1">
              <FileText className="w-4 h-4" /> ไฟล์แนบ
            </label>

            <div className="space-y-2 mb-3">
              {formData.files.length > 0 ? (
                formData.files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between bg-white p-2 border rounded-lg"
                  >
                    <span className="text-sm text-gray-700 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4 text-indigo-500" /> {file}
                    </span>
                    <button
                      onClick={() => handleRemoveFile(i)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">ยังไม่มีไฟล์แนบ</p>
              )}
            </div>

            <div className="flex gap-2">
              <input
                value={newFile}
                onChange={(e) => setNewFile(e.target.value)}
                className="flex-grow p-2 border border-gray-300 rounded-lg focus:ring-indigo-500 text-sm"
                placeholder="ชื่อไฟล์ เช่น Lecture1.pdf"
              />
              <button
                onClick={handleAddFile}
                className="px-3 py-1 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition flex items-center gap-1"
              >
                <Upload className="w-4 h-4" /> เพิ่ม
              </button>
            </div>
          </div>
        </div>

        <div className="p-5 border-t flex justify-end gap-3">
          {!isNew && (
            <button
              onClick={() => onDelete(formData.id)}
              className="px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 flex items-center gap-1 transition"
            >
              <Trash2 className="w-4 h-4" /> ลบ
            </button>
          )}
          <button
            onClick={onClose}
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
}
