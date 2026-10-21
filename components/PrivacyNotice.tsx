import { ShieldCheck } from "lucide-react";

// แจ้งผู้ใช้ (ผู้ร่วมทดสอบระบบ) ว่าข้อมูลส่วนบุคคลถูกเก็บเป็นความลับ — ใช้ในหน้าเข้าสู่ระบบและสมัครสมาชิก
export default function PrivacyNotice({ className = "" }: { className?: string }) {
  return (
    <div role="note" className={`flex gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm ${className}`}>
      <ShieldCheck className="w-5 h-5 shrink-0 text-green-700 mt-0.5" aria-hidden="true" />
      <div>
        <p className="font-medium text-green-800">ข้อมูลของคุณถูกเก็บเป็นความลับ</p>
        <p className="text-green-700 mt-0.5 leading-relaxed">
          ข้อมูลส่วนบุคคล เช่น ชื่อ อีเมล และเบอร์โทรศัพท์ ใช้เพื่อให้บริการภายในระบบและการวิจัยเท่านั้น
          ไม่แสดงต่อผู้ใช้อื่น และเมื่อนำผลไปใช้ในงานวิจัยจะปกปิดข้อมูลที่ระบุตัวตนทุกครั้ง
        </p>
      </div>
    </div>
  );
}
