/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { Eye, EyeOff, ChevronDown } from "lucide-react";

export default function RegisterPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [bod, setBod] = useState("");
  const [universityId, setUniversityId] = useState("");
  const [universities, setUniversities] = useState<any[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const res = await fetch("http://localhost:5000/universities");
        if (!res.ok) throw new Error("Network response was not ok " + res.status);
        const data = await res.json();
        setUniversities(data);
      } catch (error) {
        console.error("Failed to fetch universities:", error);
      }
    };
    fetchUniversities();
  }, []);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
        Swal.fire({ icon: "warning", title: "รหัสผ่านไม่ตรงกัน", confirmButtonColor: "#f59e0b" });
        return;
    }
    // ... logic การ fetch ...
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center  px-4 py-12 bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-login.png')" }}
    >
      <div className="bg-white shadow-2xs rounded-2xl p-8 md:p-12 w-full max-w-4xl border border-white/60 backdrop-blur-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-green-600 mb-2">เภสัชพร้อมสอบ</h1>
          <p className="text-gray-500 font-medium">กรอกข้อมูลเพื่อสร้างบัญชีใหม่</p>
        </div>

        <form onSubmit={handleRegister} className="relative space-y-8">
          <div className="flex flex-col md:flex-row gap-8 md:gap-0 relative">
            
            <div className="flex-1 md:pr-10 space-y-5">
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  ชื่อ-นามสกุล
                </label>
                <div className="flex gap-2">
                    <input type="text" className="w-1/2 border border-gray-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm" placeholder="ชื่อ" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    <input type="text" className="w-1/2 border border-gray-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm" placeholder="นามสกุล" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  เบอร์โทรศัพท์
                </label>
                <input type="tel" className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm" placeholder="08xxxxxxxx" value={tel} onChange={(e) => setTel(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                   วันเดือนปีเกิด
                </label>
                <input type="date" className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm text-gray-600" value={bod} onChange={(e) => setBod(e.target.value)} required />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  มหาวิทยาลัย
                </label>
                <div className="relative">
                  <select 
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm bg-white text-gray-600 appearance-none cursor-pointer" 
                    value={universityId} 
                    onChange={(e) => setUniversityId(e.target.value)} 
                    required
                  >
                    <option value="">-- เลือกมหาวิทยาลัย --</option>
                    {universities.map((u) => (<option key={u.university_id} value={u.university_id}>{u.name}</option>))}
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div className="hidden md:flex items-center">
              <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>
            </div>
            <div className="flex-1 md:pl-10 space-y-5">
              {/* <h3 className="text-lg font-bold text-gray-800 mb-4 pb-2 border-b border-green-100">ข้อมูลความปลอดภัย</h3> */}
              
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                อีเมลสำหรับเข้าใช้งาน
                </label>
                <input type="email" className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm" placeholder="example@email.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>

              <div className="space-y-1.5 pt-2">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  รหัสผ่าน
                </label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} className="w-full border border-gray-200 rounded-2xl pl-4 pr-12 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                 ยืนยันรหัสผ่านอีกครั้ง
                </label>
                <input type={showPassword ? "text" : "password"} className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>
              
              <div className="bg-green-50 p-4 rounded-2xl border border-green-100 mt-4">
                <p className="text-xs text-green-700 leading-relaxed">
                  * กรุณาใช้รหัสผ่านที่มีความยาวอย่างน้อย 8 ตัวอักษร และประกอบด้วยตัวอักษรและตัวเลขเพื่อความปลอดภัย
                </p>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl shadow-lg shadow-green-100 transition-all duration-300  cursor-pointer">
              ลงทะเบียนเข้าใช้งาน
            </button>
          </div>
        </form>

        <div className="text-center mt-8 text-sm font-medium text-gray-500">
          มีบัญชีอยู่แล้ว? <a href="/login" className="text-green-600 font-medium hover:underline underline-offset-4">เข้าสู่ระบบ</a>
        </div>
      </div>
    </div>
  );
}