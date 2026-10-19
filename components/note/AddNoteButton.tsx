"use client";
import { Plus } from "lucide-react";

export default function AddNoteButton({
  onClickAction,
}: {
  onClickAction: () => void;
}) {
  return (
    <div className="p-4 bg-primary-soft rounded-xl border border-primary/20 mb-4 flex justify-between items-center">
      <h3 className="text-lg font-medium text-gray-800">บันทึกสรุปการเรียนรู้</h3>
      <button
        onClick={onClickAction}
        className="px-4 py-2 bg-primary text-on-primary font-medium rounded-lg hover:bg-primary-hover transition flex items-center gap-1 cursor-pointer"
      >
        <Plus className="w-4 h-4" /> เพิ่มโน้ต
      </button>
    </div>
  );
}
