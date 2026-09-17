"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, X, ZoomIn, ZoomOut } from "lucide-react";

type ImageCropModalProps = {
    /** data URL หรือ object URL ของรูปที่ผู้ใช้เลือก */
    imageSrc: string;
    onCancel: () => void;
    /** ได้รูปสี่เหลี่ยมจัตุรัสที่ครอปแล้ว (JPEG) */
    onConfirm: (blob: Blob) => void | Promise<void>;
    isSaving?: boolean;
};

const VIEWPORT = 280;
const OUTPUT_SIZE = 512;
const MAX_ZOOM = 3;

type Point = { x: number; y: number };

/**
 * ครอปรูปโปรไฟล์เป็นวงกลม — ลากเพื่อเลื่อนรูป ใช้แถบหรือล้อเมาส์เพื่อซูม
 * วาดผลลัพธ์ด้วย canvas เอง จึงไม่ต้องพึ่งไลบรารีเพิ่ม
 */
export default function ImageCropModal({ imageSrc, onCancel, onConfirm, isSaving = false }: ImageCropModalProps) {
    const imgRef = useRef<HTMLImageElement | null>(null);
    const dragRef = useRef<{ pointerId: number; start: Point; origin: Point } | null>(null);
    const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
    const [zoom, setZoom] = useState(1);
    const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });

    const baseScale = natural ? Math.max(VIEWPORT / natural.w, VIEWPORT / natural.h) : 1;
    const scale = baseScale * zoom;

    const clamp = useCallback(
        (p: Point, s: number): Point => {
            if (!natural) return p;
            const dw = natural.w * s;
            const dh = natural.h * s;
            return {
                x: Math.min(0, Math.max(VIEWPORT - dw, p.x)),
                y: Math.min(0, Math.max(VIEWPORT - dh, p.y)),
            };
        },
        [natural],
    );

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            imgRef.current = img;
            const s = Math.max(VIEWPORT / img.naturalWidth, VIEWPORT / img.naturalHeight);
            setNatural({ w: img.naturalWidth, h: img.naturalHeight });
            setZoom(1);
            setOffset({
                x: (VIEWPORT - img.naturalWidth * s) / 2,
                y: (VIEWPORT - img.naturalHeight * s) / 2,
            });
        };
        img.src = imageSrc;
    }, [imageSrc]);

    // ปิดด้วยปุ่ม Esc
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !isSaving) onCancel();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [onCancel, isSaving]);

    /** ซูมโดยให้จุดกึ่งกลางของกรอบยังอยู่ที่เดิม */
    const applyZoom = (nextZoom: number) => {
        const z = Math.min(MAX_ZOOM, Math.max(1, nextZoom));
        const nextScale = baseScale * z;
        const center = VIEWPORT / 2;
        const imgX = (center - offset.x) / scale;
        const imgY = (center - offset.y) / scale;
        setZoom(z);
        setOffset(clamp({ x: center - imgX * nextScale, y: center - imgY * nextScale }, nextScale));
    };

    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current = { pointerId: e.pointerId, start: { x: e.clientX, y: e.clientY }, origin: offset };
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        const drag = dragRef.current;
        if (!drag || drag.pointerId !== e.pointerId) return;
        setOffset(
            clamp(
                { x: drag.origin.x + e.clientX - drag.start.x, y: drag.origin.y + e.clientY - drag.start.y },
                scale,
            ),
        );
    };

    const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
        if (dragRef.current?.pointerId === e.pointerId) dragRef.current = null;
    };

    const handleConfirm = async () => {
        const img = imgRef.current;
        if (!img || !natural) return;

        const canvas = document.createElement("canvas");
        canvas.width = OUTPUT_SIZE;
        canvas.height = OUTPUT_SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // พื้นขาวรองไว้ กันรูป PNG โปร่งใสกลายเป็นพื้นดำตอนแปลงเป็น JPEG
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, -offset.x / scale, -offset.y / scale, VIEWPORT / scale, VIEWPORT / scale, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
        if (blob) await onConfirm(blob);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 px-4" role="dialog" aria-modal="true" aria-labelledby="crop-title">
            <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                    <h2 id="crop-title" className="text-base font-medium text-gray-900">ปรับรูปโปรไฟล์</h2>
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 cursor-pointer"
                        aria-label="ปิด"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex flex-col items-center gap-4 px-5 py-5">
                    <div
                        className="relative overflow-hidden rounded-xl bg-gray-900 select-none"
                        style={{ width: VIEWPORT, height: VIEWPORT, touchAction: "none", cursor: natural ? "grab" : "default" }}
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={endDrag}
                        onPointerCancel={endDrag}
                        onWheel={(e) => applyZoom(zoom - e.deltaY * 0.002)}
                    >
                        {natural ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={imageSrc}
                                alt="รูปที่เลือก"
                                draggable={false}
                                className="pointer-events-none absolute left-0 top-0 max-w-none"
                                style={{
                                    width: natural.w * scale,
                                    height: natural.h * scale,
                                    transform: `translate(${offset.x}px, ${offset.y}px)`,
                                }}
                            />
                        ) : (
                            <div className="flex h-full items-center justify-center">
                                <Loader2 className="h-6 w-6 animate-spin text-white" />
                            </div>
                        )}
                        {/* หน้ากากวงกลม — ส่วนนอกวงจะถูกทำให้มืดลง */}
                        <div
                            className="pointer-events-none absolute inset-0 rounded-full"
                            style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)", border: "2px solid rgba(255,255,255,0.9)" }}
                        />
                    </div>

                    <p className="text-xs text-gray-500">ลากเพื่อเลื่อนตำแหน่ง และปรับขนาดด้วยแถบด้านล่าง</p>

                    <div className="flex w-full items-center gap-3">
                        <button type="button" onClick={() => applyZoom(zoom - 0.2)} className="text-gray-500 hover:text-gray-700 cursor-pointer" aria-label="ย่อ">
                            <ZoomOut className="h-5 w-5" />
                        </button>
                        <input
                            type="range"
                            min={1}
                            max={MAX_ZOOM}
                            step={0.01}
                            value={zoom}
                            onChange={(e) => applyZoom(Number(e.target.value))}
                            className="w-full accent-green-600"
                            aria-label="ซูม"
                        />
                        <button type="button" onClick={() => applyZoom(zoom + 0.2)} className="text-gray-500 hover:text-gray-700 cursor-pointer" aria-label="ขยาย">
                            <ZoomIn className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isSaving}
                        className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
                    >
                        ยกเลิก
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={!natural || isSaving}
                        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:opacity-50 cursor-pointer"
                    >
                        {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                        ใช้รูปนี้
                    </button>
                </div>
            </div>
        </div>
    );
}
