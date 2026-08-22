/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import {
  Eye,
  EyeOff,
  ChevronDown,
  Check,
  X,
  Mail,
  Shield,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";

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

  // OTP States
  const [step, setStep] = useState(1); // 1 = กรอกข้อมูล, 2 = ยืนยัน OTP
  const [otp, setOtp] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  const [otpCooldown, setOtpCooldown] = useState(0);

  // Password Strength States
  const [passwordStrength, setPasswordStrength] = useState({
    minLength: false,
    has: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });

  const router = useRouter();

  // ดึงข้อมูลมหาวิทยาลัย
  useEffect(() => {
    const fetchUniversities = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/universities`,
        );
        if (!res.ok)
          throw new Error("Network response was not ok " + res.status);
        const data = await res.json();
        setUniversities(data);
      } catch (error) {
        console.error("Failed to fetch universities:", error);
      }
    };
    fetchUniversities();
  }, []);

  // เช็คความแข็งแรงของรหัสผ่าน
  useEffect(() => {
    setPasswordStrength({
      minLength: password.length >= 8,
      has: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    });
  }, [password]);

  // OTP Cooldown Timer
  useEffect(() => {
    if (otpCooldown > 0) {
      const timer = setTimeout(() => setOtpCooldown(otpCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCooldown]);

  // คำนวณ Password Strength Score
  const getPasswordScore = () => {
    const scores = Object.values(passwordStrength).filter(Boolean).length;
    return scores;
  };

  const getPasswordStrengthColor = () => {
    const score = getPasswordScore();
    if (score <= 2) return "bg-red-500";
    if (score <= 3) return "bg-yellow-500";
    if (score <= 4) return "bg-blue-500";
    return "bg-green-500";
  };

  const getPasswordStrengthText = () => {
    const score = getPasswordScore();
    if (score <= 2) return "อ่อนแอ";
    if (score <= 3) return "ปานกลาง";
    if (score <= 4) return "ดี";
    return "แข็งแรงมาก";
  };

  // ส่ง OTP ไปยัง Email
  const handleSendOTP = async () => {
    // Validate ข้อมูลก่อนส่ง OTP
    if (!firstName || !lastName || !email || !tel || !bod || !universityId) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        text: "กรุณากรอกข้อมูลทุกช่องก่อนขอรหัส OTP",
      });
      return;
    }

    if (!password || !confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "กรุณาตั้งรหัสผ่าน",
        text: "กรุณากรอกรหัสผ่านและยืนยันรหัสผ่าน",
      });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "warning",
        title: "รหัสผ่านไม่ตรงกัน",
        text: "กรุณากรอกรหัสผ่านให้ตรงกันทั้งสองช่อง",
      });
      return;
    }

    // เช็คความแข็งแรงของรหัสผ่าน
    const score = getPasswordScore();
    if (score < 4) {
      const result = await Swal.fire({
        icon: "warning",
        title: "รหัสผ่านไม่ปลอดภัยพอ",
        text: "รหัสผ่านของคุณยังไม่ผ่านเกณฑ์ความปลอดภัย ต้องการดำเนินการต่อหรือไม่?",
        showCancelButton: true,
        confirmButtonText: "ดำเนินการต่อ",
        cancelButtonText: "ยกเลิก",
        confirmButtonColor: "#16a34a",
        cancelButtonColor: "#6b7280",
        reverseButtons: true,
      });
      if (!result.isConfirmed) return;
    }

    setIsSendingOTP(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/send-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      const data = await res.json();

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "ส่งรหัส OTP แล้ว!",
          text: `กรุณาตรวจสอบอีเมล ${email}`,
          timer: 2000,
          showConfirmButton: false,
        });
        setStep(2);
        setOtpCooldown(60); // Cooldown 60 วินาที
      } else {
        Swal.fire({
          icon: "error",
          title: "ส่ง OTP ไม่สำเร็จ",
          text: data.message || "กรุณาลองใหม่อีกครั้ง",
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้",
      });
    } finally {
      setIsSendingOTP(false);
    }
  };
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกรหัส OTP",
        text: "รหัส OTP ต้องมี 6 หลัก",
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
      otp, // ส่ง OTP ไปให้ backend ตรวจสอบ
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/users/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newUser),
        },
      );

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
          text: result.message || "สมัครสมาชิกไม่สำเร็จ กรุณาตรวจสอบรหัส OTP",
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
      className="min-h-screen flex items-center justify-center px-4 py-12 bg-cover bg-center"
      style={{ backgroundImage: "url('/bg-login.png')" }}
    >
      <div className="bg-white shadow-2xs rounded-2xl p-8 md:p-12 w-full max-w-4xl border border-white/60 backdrop-blur-sm">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-green-600 mb-2">
            เภสัชพร้อมสอบ
          </h1>
          <p className="text-gray-500 font-medium">
            {step === 1
              ? "กรอกข้อมูลเพื่อสร้างบัญชีใหม่"
              : "ยืนยันอีเมลด้วยรหัส OTP"}
          </p>
        </div>

        {/* Step 1: กรอกข้อมูล */}
        {step === 1 && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendOTP();
            }}
            className="relative space-y-8"
          >
            <div className="flex flex-col md:flex-row gap-8 md:gap-0 relative">
              {/* ฝั่งซ้าย: ข้อมูลส่วนตัว */}
              <div className="flex-1 md:pr-10 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    ชื่อ-นามสกุล
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="w-1/2 border border-gray-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm"
                      placeholder="ชื่อ"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                    <input
                      type="text"
                      className="w-1/2 border border-gray-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm"
                      placeholder="นามสกุล"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm"
                    placeholder="08xxxxxxxx"
                    value={tel}
                    onChange={(e) => setTel(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    วันเดือนปีเกิด
                  </label>
                  <input
                    type="date"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm text-gray-600"
                    value={bod}
                    onChange={(e) => setBod(e.target.value)}
                    required
                  />
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
                      {universities.map((u) => (
                        <option key={u.university_id} value={u.university_id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                    />
                  </div>
                </div>
              </div>

              <div className="hidden md:flex items-center">
                <div className="h-full w-[1px] bg-gradient-to-b from-transparent via-gray-200 to-transparent"></div>
              </div>

              {/* ฝั่งขวา: ข้อมูลความปลอดภัย */}
              <div className="flex-1 md:pl-10 space-y-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    อีเมลสำหรับเข้าใช้งาน
                  </label>
                  <input
                    type="email"
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm"
                    placeholder="example@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    รหัสผ่าน
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="w-full border border-gray-200 rounded-2xl pl-4 pr-12 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password && (
                    <div className="space-y-2 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                            style={{
                              width: `${(getPasswordScore() / 5) * 100}%`,
                            }}
                          ></div>
                        </div>
                        <span
                          className={`text-xs font-medium ${getPasswordScore() < 4 ? "text-red-600" : "text-green-600"}`}
                        >
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                    ยืนยันรหัสผ่านอีกครั้ง
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="w-full border border-gray-200 rounded-2xl px-4 py-3 focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                {/* Password Checklist */}
                {/* Password Checklist */}
                <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200">
                  <div className="flex items-center gap-2 mb-3">
                    <Shield className="w-4 h-4 text-gray-600" />
                    <p className="text-xs font-medium text-gray-700">
                      ความปลอดภัยของรหัสผ่าน
                    </p>
                  </div>
                  <div className="space-y-2">
                    <ChecklistItem
                      checked={passwordStrength.minLength}
                      text="ความยาวอย่างน้อย 8 ตัวอักษร"
                    />
                    <ChecklistItem
                      checked={passwordStrength.has}
                      text="มีตัวอักษรพิมพ์ใหญ่ (A-Z)"
                    />
                    <ChecklistItem
                      checked={passwordStrength.hasLowerCase}
                      text="มีตัวอักษรพิมพ์เล็ก (a-z)"
                    />
                    <ChecklistItem
                      checked={passwordStrength.hasNumber}
                      text="มีตัวเลข (0-9)"
                    />
                    <ChecklistItem
                      checked={passwordStrength.hasSpecialChar}
                      text="มีอักขระพิเศษ (!@#$%...)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSendingOTP}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl shadow-lg shadow-green-100 transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSendingOTP ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    กำลังส่งรหัส OTP...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    ขอรหัส OTP เพื่อยืนยันอีเมล
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: ยืนยัน OTP */}
        {step === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-6">
            <div className="bg-green-50 p-6 rounded-2xl border border-green-200 text-center">
              <Mail className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <p className="text-sm text-gray-700 mb-1">
                เราได้ส่งรหัส OTP ไปยังอีเมล
              </p>
              <p className="text-base font-medium text-green-700">{email}</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                กรอกรหัส OTP (6 หลัก)
              </label>
              <input
                type="text"
                maxLength={6}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-center text-2xl font-medium tracking-widest focus:ring-4 focus:ring-green-100 focus:border-green-500 outline-none transition-all shadow-sm"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                required
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="submit"
                className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 rounded-xl shadow-lg shadow-green-100 transition-all duration-300 cursor-pointer"
              >
                ยืนยันและลงทะเบียน
              </button>

              <button
                type="button"
                onClick={handleSendOTP}
                disabled={otpCooldown > 0 || isSendingOTP}
                className="w-full bg-white border-2 border-gray-200 hover:border-green-500 hover:bg-green-50 text-gray-700 font-medium py-3 rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {otpCooldown > 0
                  ? `ส่งรหัสใหม่ได้ใน ${otpCooldown} วินาที`
                  : "ส่งรหัส OTP อีกครั้ง"}
              </button>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-gray-600 hover:text-gray-800 font-medium py-2 transition-colors"
              >
                ← กลับไปแก้ไขข้อมูล
              </button>
            </div>
          </form>
        )}

        <div className="text-center mt-8 text-sm font-medium text-gray-500">
          มีบัญชีอยู่แล้ว?{" "}
          <a
            href="/login"
            className="text-green-600 font-medium hover:underline underline-offset-4"
          >
            เข้าสู่ระบบ
          </a>
        </div>
      </div>
    </div>
  );
}

// Component สำหรับ Checklist Item
function ChecklistItem({ checked, text }: { checked: boolean; text: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-5 h-5 rounded-full flex items-center justify-center transition-colors ${checked ? "bg-green-500" : "bg-gray-300"
          }`}
      >
        {checked ? (
          <Check className="w-3 h-3 text-white" />
        ) : (
          <X className="w-3 h-3 text-gray-500" />
        )}
      </div>
      <span
        className={`text-xs ${checked ? "text-green-700 font-medium" : "text-gray-600"}`}
      >
        {text}
      </span>
    </div>
  );
}
