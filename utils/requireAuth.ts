"use client";

import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

/**
 * ใช้กับหน้าแรก (guest) เมื่อผู้ใช้ยังไม่ login แล้วกดฟีเจอร์ที่ต้องมีบัญชี
 * เช่น ทำข้อสอบ, บันทึกข่าว, ดูปฏิทิน — จะเด้งไปหน้า login ก่อน
 */
export function useRequireLogin() {
  const router = useRouter();

  const requireLogin = (feature: string) => {
    Swal.fire({
      icon: "info",
      title: "กรุณาเข้าสู่ระบบ",
      text: `ต้องเข้าสู่ระบบก่อนใช้งาน "${feature}"`,
      showCancelButton: true,
      confirmButtonText: "เข้าสู่ระบบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#22c55e",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        router.push("/login");
      }
    });
  };

  return { requireLogin };
}
