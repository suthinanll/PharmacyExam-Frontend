"use client";
import React from 'react';
import { X } from 'lucide-react';

interface ImagePreviewModalProps {
  src: string | null;
  onClose: () => void;
  alt?: string;
}

export default function ImagePreviewModal({ src, onClose, alt = "รูปภาพเต็ม" }: ImagePreviewModalProps) {
  if (!src) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-[1000] flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-200"
      onClick={onClose}
    >
      <div
        className="relative max-w-5xl max-h-[90vh] bg-white rounded-2xl overflow-hidden shadow-2xl p-2 flex flex-col items-center border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black/60 hover:bg-black/80 text-white p-2 rounded-full transition-colors z-10 shadow-md"
          title="ปิด"
        >
          <X className="w-5 h-5" />
        </button>
        <img
          src={src}
          alt={alt}
          className="max-w-full max-h-[85vh] object-contain rounded-lg"
        />
      </div>
    </div>
  );
}
