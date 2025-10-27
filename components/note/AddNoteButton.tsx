"use client";
import { Plus } from "lucide-react";

export default function AddNoteButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="p-4 bg-indigo-50 rounded-xl shadow-inner border border-indigo-100 mb-4 flex justify-between items-center">
      <h3 className="text-lg font-bold text-indigo-800">บันทึกสรุปการเรียนรู้</h3>
      <button
        onClick={onClick}
        className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition flex items-center gap-1"
      >
        <Plus className="w-4 h-4" /> เพิ่มโน้ต
      </button>
    </div>
  );
}
