"use client";

import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { withRedirect } from "./redirect";

/**
 * ใช้กับหน้าแรก (guest) เมื่อผู้ใช้ยังไม่ login แล้วกดฟีเจอร์ที่ต้องมีบัญชี
 * เช่น ทำข้อสอบ, บันทึกข่าว, ดูปฏิทิน — จะเด้งไปหน้า login ก่อน
 *
 * ส่ง redirectTo มาด้วยได้ ถ้าอยากให้ล็อกอินเสร็จแล้วกลับมาหน้าเดิมเพื่อทำต่อ
 * (เช่นหน้าชำระเงิน ที่ผู้ใช้ไม่ควรต้องหาทางกลับมาเอง)
 */
export function useRequireLogin() {
  const router = useRouter();

  const requireLogin = (feature: string, redirectTo?: string) => {
    Swal.fire({
      icon: "info",
      title: "กรุณาเข้าสู่ระบบ",
      text: `ต้องเข้าสู่ระบบก่อนใช้งาน "${feature}"`,
      showCancelButton: true,
      confirmButtonText: "เข้าสู่ระบบ",
      cancelButtonText: "ยกเลิก",
      confirmButtonColor: "#16a34a",
      cancelButtonColor: "#6b7280",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        router.push(redirectTo ? withRedirect("/login", redirectTo) : "/login");
      }
    });
  };

  return { requireLogin };
}
