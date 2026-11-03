import { CheckCircle2, Flag, PencilLine } from 'lucide-react';
import { REPORT_REASON_LABEL, formatReportTime, type OpenItemReport } from '@/utils/itemReports';

interface ReportNotesProps {
    reports?: OpenItemReport[];
    /** เข้าโหมดแก้ไขแล้วเลื่อนไปที่ข้อนี้ — ไม่ส่งมาเมื่ออยู่ในโหมดแก้ไขแล้ว */
    onEdit?: () => void;
    /** ปิดรายงานทั้งหมดของข้อนี้เป็น "แก้ไขแล้ว" */
    onResolve?: () => void;
    resolving?: boolean;
}

/** กล่องแสดงปัญหาที่ผู้เรียนแจ้งเข้ามาของข้อนี้ พร้อมปุ่มไปแก้และปุ่มปิดรายงาน */
export default function ReportNotes({ reports, onEdit, onResolve, resolving = false }: ReportNotesProps) {
    if (!reports?.length) return null;
    const edited = reports.some(r => r.item_edited_at);
    return (
        <div
            role="region"
            aria-label="รายงานปัญหาจากผู้เรียน"
            className="mx-5 mb-4 mt-1 rounded-xl border border-red-200 bg-red-50/70 p-3.5"
            onClick={e => e.stopPropagation()}
        >
            <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="flex items-center gap-1.5 text-sm font-medium text-red-800">
                    <Flag className="w-4 h-4" aria-hidden="true" />
                    ผู้เรียนแจ้งปัญหา {reports.length} รายการ
                </p>
                <div className="flex flex-wrap gap-2">
                    {onEdit && (
                        <button
                            type="button"
                            onClick={onEdit}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                        >
                            <PencilLine className="w-4 h-4" aria-hidden="true" />
                            แก้ไขข้อนี้
                        </button>
                    )}
                    {onResolve && (
                        <button
                            type="button"
                            onClick={onResolve}
                            disabled={resolving}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
                        >
                            <CheckCircle2 className="w-4 h-4" aria-hidden="true" />
                            แก้ไขแล้ว
                        </button>
                    )}
                </div>
            </div>
            <ul className="mt-2.5 space-y-2">
                {reports.map(r => (
                    <li key={r.id} className="rounded-lg bg-white border border-red-100 px-3 py-2 text-sm">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-gray-500">
                            <span className="rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 font-medium text-rose-700">
                                {REPORT_REASON_LABEL[r.reason] ?? r.reason}
                            </span>
                            <span>{r.reporter ? `แจ้งโดย ${r.reporter}` : 'ผู้ใช้'} · {formatReportTime(r.created_at)}</span>
                        </div>
                        {r.message && <p className="mt-1.5 whitespace-pre-wrap text-gray-800">{r.message}</p>}
                    </li>
                ))}
            </ul>
            {edited && (
                <p className="mt-2 text-xs text-green-700">
                    แก้ไขข้อนี้ในคลังแล้ว — ถ้าแก้ครบแล้วกด &quot;แก้ไขแล้ว&quot; เพื่อปิดรายงาน
                </p>
            )}
        </div>
    );
}
