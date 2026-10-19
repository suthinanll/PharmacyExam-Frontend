"use client";
import { Plus } from "lucide-react";

export default function AddNoteButton({
  onClickAction,
}: {
  onClickAction: () => void;
}) {
  return (
    <div className="p-4 bg-blue-50 rounded-xl shadow-inner border border-blue-100 mb-4 flex justify-between items-center">
      <h3 className="text-lg font-medium text-blue-800">บันทึกสรุปการเรียนรู้</h3>
      <button
        onClick={onClickAction}
        className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition flex items-center gap-1 cursor-pointer"
      >
        <Plus className="w-4 h-4" /> เพิ่มโน้ต
      </button>
    </div>
  );
}
