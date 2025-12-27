"use client";
import { useEffect, useState } from "react";
import { X, Upload, Save, Trash2, FileText, Link as LinkIcon } from "lucide-react";
import type { UserNote } from "./NoteList";

type Props = {
  note: UserNote | null;
  onSave: (note: UserNote) => void;
  onClose: () => void;
  onDelete: (id: string) => void;
};

const emptyForm: UserNote = {
  id: "",
  title: "",
  content: "",
  tags: [],
  files: [],
  createdAt: Date.now(),
};

export default function NoteModal({
  note,
  onSave,
  onClose,
  onDelete,
}: Props) {
  const isNew = !note;

  const [formData, setFormData] = useState<UserNote>(emptyForm);
  const [tagInput, setTagInput] = useState("");
  const [newFile, setNewFile] = useState("");

  // 🔹 sync state เมื่อเปิด modal (create / edit)
  useEffect(() => {
    if (note) {
      setFormData({
        ...note,
        title: note.title ?? "",
        content: note.content ?? "",
        tags: note.tags ?? [],
        files: note.files ?? [],
      });
      setTagInput((note.tags ?? []).join(", "));
    } else {
      setFormData({
        ...emptyForm,
        id: `n-${Date.now()}`,
        createdAt: Date.now(),
      });
      setTagInput("");
    }
  }, [note]);

  const handleSave = () => {
    onSave({
      ...formData,
      tags: tagInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    });
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
        {/* Header */}
        <div className="p-5 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">
            {isNew ? "เพิ่มบันทึกสรุปใหม่" : "แก้ไขบันทึกสรุป"}
          </h3>
          <button onClick={onClose}>
            <X className="w-6 h-6 text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              หัวข้อการสรุป
            </label>
            <input
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              className="w-full p-2 border rounded-lg"
              placeholder="หัวข้อบันทึก"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              เนื้อหาบันทึก
            </label>
            <textarea
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  content: e.target.value,
                }))
              }
              rows={4}
              className="w-full p-3 border rounded-lg resize-none"
              placeholder="สรุปเนื้อหาการอ่าน..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Tags (คั่นด้วย ,)
            </label>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full p-2 border rounded-lg text-sm"
              placeholder="เช่น เคมี, กลางภาค, สำคัญ"
            />
          </div>

          {/* Files */}
          <div className="border p-4 rounded-lg bg-gray-50">
            <label className="flex items-center gap-1 text-sm font-bold mb-2">
              <FileText className="w-4 h-4" /> ไฟล์แนบ
            </label>

            {formData.files.length > 0 ? (
              <div className="space-y-2 mb-3">
                {formData.files.map((file, i) => (
                  <div
                    key={i}
                    className="flex justify-between items-center bg-white p-2 border rounded-lg"
                  >
                    <span className="flex items-center gap-2 text-sm">
                      <LinkIcon className="w-4 h-4 text-indigo-500" />
                      {file}
                    </span>
                    <button onClick={() => handleRemoveFile(i)}>
                      <X className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm italic text-gray-500 mb-3">
                ยังไม่มีไฟล์แนบ
              </p>
            )}

            <div className="flex gap-2">
              <input
                value={newFile}
                onChange={(e) => setNewFile(e.target.value)}
                className="flex-grow p-2 border rounded-lg text-sm"
                placeholder="Lecture1.pdf"
              />
              <button
                onClick={handleAddFile}
                className="bg-indigo-500 text-white px-3 rounded-lg flex items-center gap-1"
              >
                <Upload className="w-4 h-4" /> เพิ่ม
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t flex justify-end gap-3">
          {!isNew && (
            <button
              onClick={() => onDelete(formData.id)}
              className="border border-red-600 text-red-600 px-4 py-2 rounded-lg flex items-center gap-1"
            >
              <Trash2 className="w-4 h-4" /> ลบ
            </button>
          )}
          <button
            onClick={onClose}
            className="bg-gray-200 px-4 py-2 rounded-lg"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-1"
          >
            <Save className="w-4 h-4" /> บันทึก
          </button>
        </div>
      </div>
    </div>
  );
}
