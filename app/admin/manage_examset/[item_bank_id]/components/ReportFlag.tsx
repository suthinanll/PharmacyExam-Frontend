import { Flag } from 'lucide-react';

/** ป้ายบอกว่าข้อนี้มีรายงานปัญหาจากผู้เรียนรอตรวจกี่รายการ */
export default function ReportFlag({ count, compact = false }: { count?: number; compact?: boolean }) {
    if (!count) return null;
    return (
        <span
            className="inline-flex items-center gap-1 shrink-0 rounded-full bg-red-50 border border-red-200 text-red-700 font-medium text-[0.6875rem] px-1.5 py-0.5"
            title={`มีรายงานปัญหารอตรวจ ${count} รายการ`}
        >
            <Flag className="w-3 h-3" aria-hidden="true" />
            {compact ? count : `แจ้งปัญหา ${count}`}
            <span className="sr-only"> รายงานรอตรวจ</span>
        </span>
    );
}
