"use client";

import { Suspense, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Swal from "sweetalert2";
import LoadingSpinner from "@/components/LoadingSpinner";

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    const handleCallback = async () => {
      // ป้องกันการทำงานซ้ำ
      if (hasProcessed.current) return;
      hasProcessed.current = true;

      const token = searchParams.get("token");

      if (!token) {
        await Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่พบ token จากการยืนยันตัวตน",
          confirmButtonColor: "#ef4444",
        });
        router.push("/login");
        return;
      }

      try {
        // เรียก /auth/me เพื่อดึงข้อมูล user
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            credentials: "include",
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();

        // Debug: ดูข้อมูลที่ backend ส่งมา
        console.log("=== User data from backend ===");
        console.log("Full userData:", JSON.stringify(userData, null, 2));
        console.log("Profile picture fields:");
        console.log("- profile_picture:", userData.profile_picture);
        console.log("- picture:", userData.picture);
        console.log("- avatar:", userData.avatar);
        console.log("- google_picture:", userData.google_picture);
        console.log("- image_url:", userData.image_url);
        console.log("==============================");

        // Login ด้วย token และ userData
        await login(token, userData);

        await Swal.fire({
          icon: "success",
          title: "เข้าสู่ระบบสำเร็จ!",
          text: `ยินดีต้อนรับ ${userData.first_name}`,
          confirmButtonText: "ตกลง",
          confirmButtonColor: "#10b981",
          timer: 2000,
        });

        // Redirect ตาม role (3 = Super Admin เข้าแผงแอดมินเหมือน role 2)
        const roleId = userData.role_id;
        if (roleId === 1) {
          router.push("/user");
        } else if (roleId === 2 || roleId === 3) {
          router.push("/admin");
        } else {
          router.push("/");
        }
      } catch (error) {
        console.error("Auth callback error:", error);
        await Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถเข้าสู่ระบบได้ กรุณาลองใหม่อีกครั้ง",
          confirmButtonColor: "#ef4444",
        });
        router.push("/login");
      }
    };

    handleCallback();
  }, [searchParams, login, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-2">
        <LoadingSpinner size="lg" text="กำลังเข้าสู่ระบบ..." />
      </div>
    </div>
  );
}

const CallbackFallback = (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-2">
      <LoadingSpinner size="lg" text="กำลังเข้าสู่ระบบ..." />
    </div>
  </div>
);

export default function AuthCallback() {
  return (
    <Suspense fallback={CallbackFallback}>
      <AuthCallbackContent />
    </Suspense>
  );
}
