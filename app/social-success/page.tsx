"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();
  const token = useSearchParams().get("token");

  useEffect(() => {
    if (token) {
      localStorage.setItem("access_token", token);
      router.push("/user");
    }
  }, []);

  return <p>กำลังเข้าสู่ระบบด้วย Google...</p>;
}
