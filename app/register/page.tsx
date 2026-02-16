/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bod, setBod] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [universities, setUniversities] = useState<any[]>([]);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/universities`);
        if (!res.ok) throw new Error("Network response was not ok " + res.status);
        const data = await res.json();
        setUniversities(data);
      } catch (error) {
        console.error("Failed to fetch universities:", error);
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: "ไม่สามารถโหลดรายชื่อมหาวิทยาลัยได้",
        });
      }
    };
    fetchUniversities();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "รหัสผ่านไม่ตรงกัน",
        text: "กรุณากรอกรหัสผ่านให้ตรงกันทั้งสองช่อง",
      });
      return;
    }

    const newUser = {
      first_name: firstName,
      last_name: lastName,
      email,
      tel,
      password,
      confirm_password: confirmPassword,
      bod,
      university_id: Number(universityId),
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const result = await res.json();

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "สมัครสมาชิกสำเร็จ!",
          text: "ระบบจะพาคุณไปยังหน้าเข้าสู่ระบบ",
          showConfirmButton: false,
          timer: 2000,
        });
        router.push("/login");
      } else {
        Swal.fire({
          icon: "error",
          title: "เกิดข้อผิดพลาด",
          text: result.message || "สมัครสมาชิกไม่สำเร็จ",
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
        text: "กรุณาลองใหม่ภายหลัง",
      });
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-login.png')" }}
    >
      <div className="bg-white shadow-xl rounded-2xl p-8 max-w-md mt-8 mb-8">
        <h1 className="text-3xl font-semibold text-center mb-6 text-green-600">
          สมัครสมาชิก
        </h1>

        <form onSubmit={handleRegister} className="space-y-5">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-gray-700 mb-2">ชื่อ</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                placeholder="ชื่อจริง"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>

            <div className="flex-1">
              <label className="block text-gray-700 mb-2">นามสกุล</label>
              <input
                type="text"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                placeholder="นามสกุล"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">อีเมล</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              placeholder="yourname@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">เบอร์โทรศัพท์</label>
            <input
              type="tel"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              placeholder="เช่น 0812345678"
              value={tel}
              onChange={(e) => setTel(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">วันเดือนปีเกิด</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              value={bod}
              onChange={(e) => setBod(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">เลือกมหาวิทยาลัย</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              value={universityId}
              onChange={(e) => setUniversityId(e.target.value)}
              required
            >
              <option value="">-- เลือกมหาวิทยาลัย --</option>
              {universities.map((u) => (
                <option key={u.university_id} value={u.university_id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-700 mb-2">รหัสผ่าน</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              placeholder="••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 mb-2">ยืนยันรหัสผ่าน</label>
            <input
              type="password"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              placeholder="••••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded-lg transition-all duration-200"
          >
            สมัครสมาชิก
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-600">
          มีบัญชีอยู่แล้ว?{" "}
          <a href="/login" className="text-green-600 hover:underline">
            เข้าสู่ระบบ
          </a>
        </div>
      </div>
    </div>
  );
}
