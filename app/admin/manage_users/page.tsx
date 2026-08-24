"use client";

import React, { useState, useEffect, useMemo } from "react";
import Navbar_admin from "@/components/Navbar_admin";
import {
  Users,
  Search,
  Mail,
  Phone,
  GraduationCap,
  ShieldCheck,
  UserCheck,
  Calendar,
  Clock,
  RefreshCcw,
  Plus,
  X,
  Lock,
  Eye,
  EyeOff,
  Building2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  UserPlus,
  Globe,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import Swal from "sweetalert2";

interface UserItem {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  tel: string | null;
  bod: string | null;
  role_id: number;
  role?: {
    role_id: number;
    name: string;
  };
  university?: {
    university_id: number;
    name: string;
  } | null;
  provider: "local" | "google";
  profile_picture: string | null;
  last_login_at?: string | null;
  created_at: string;
  updated_at: string;
}

interface UniversityItem {
  university_id: number;
  name: string;
}

function UserAvatar({
  user,
  isAdmin,
}: {
  user: UserItem;
  isAdmin: boolean;
}) {
  const [hasError, setHasError] = useState(false);
  const initial = (user.first_name?.[0] || user.email?.[0] || "U").toUpperCase();

  let fullSrc: string | null = null;
  if (user.profile_picture) {
    if (user.profile_picture.startsWith("http") || user.profile_picture.startsWith("data:")) {
      fullSrc = user.profile_picture;
    } else {
      const apiUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
      const cleanPath = user.profile_picture.startsWith("/") ? user.profile_picture : `/${user.profile_picture}`;
      fullSrc = `${apiUrl}${cleanPath}`;
    }
  }

  if (fullSrc && !hasError) {
    return (
      <img
        src={fullSrc}
        alt={user.first_name}
        onError={() => setHasError(true)}
        className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
      />
    );
  }

  return (
    <div
      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-2xs ${
        isAdmin ? "bg-purple-600" : "bg-emerald-600"
      }`}
    >
      {initial}
    </div>
  );
}

const ITEMS_PER_PAGE = 10;

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [universities, setUniversities] = useState<UniversityItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Create Admin Modal State
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    tel: "",
    bod: "",
    university_id: "",
    password: "",
    confirm_password: "",
  });

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        throw new Error("ไม่สามารถดึงข้อมูลรายชื่อผู้ใช้งานได้");
      }

      const data = await res.json();
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error("Error fetching users:", err);
      setError(err?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/universities`);
      if (res.ok) {
        const data = await res.json();
        setUniversities(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error("Failed to fetch universities:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchUniversities();
  }, []);

  // Format Thai Date & Time
  const formatThaiDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "ยังไม่มีประวัติ";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "ยังไม่มีประวัติ";
    return (
      new Intl.DateTimeFormat("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date) + " น."
    );
  };

  // Format Thai Phone
  const formatPhone = (phone?: string | null) => {
    if (!phone) return "-";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Filtered Users
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
      const email = (u.email || "").toLowerCase();
      const tel = (u.tel || "").toLowerCase();
      const uni = (u.university?.name || "").toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch =
        !q ||
        fullName.includes(q) ||
        email.includes(q) ||
        tel.includes(q) ||
        uni.includes(q);

      const matchesRole =
        selectedRole === "all" ||
        (selectedRole === "2" && u.role_id === 2) ||
        (selectedRole === "1" && u.role_id === 1);

      const matchesProvider =
        selectedProvider === "all" || u.provider === selectedProvider;

      const matchesUniversity =
        selectedUniversity === "all" || u.university?.name === selectedUniversity;

      return matchesSearch && matchesRole && matchesProvider && matchesUniversity;
    });
  }, [users, searchQuery, selectedRole, selectedProvider, selectedUniversity]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => u.role_id === 2).length;
    const students = users.filter((u) => u.role_id === 1).length;
    const googleUsers = users.filter((u) => u.provider === "google").length;
    return { total, admins, students, googleUsers };
  }, [users]);

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // Handle Create Admin Submit
  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !formData.first_name.trim() ||
      !formData.last_name.trim() ||
      !formData.email.trim() ||
      !formData.tel.trim() ||
      !formData.bod ||
      !formData.password ||
      !formData.confirm_password
    ) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        text: "กรุณากรอกข้อมูลทุกช่องที่มีเครื่องหมายดอกจัน (*)",
        confirmButtonColor: "#16a34a",
      });
      return;
    }

    // Validate Email
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email.trim())) {
      Swal.fire({
        icon: "warning",
        title: "รูปแบบอีเมลไม่ถูกต้อง",
        text: "กรุณากรอกรูปแบบอีเมลให้ถูกต้อง (เช่น admin@example.com)",
        confirmButtonColor: "#16a34a",
      });
      return;
    }

    // Validate Thai Phone
    const cleanTel = formData.tel.replace(/[-\s]/g, "");
    if (!/^0[0-9]{9}$/.test(cleanTel)) {
      Swal.fire({
        icon: "warning",
        title: "เบอร์โทรศัพท์ไม่ถูกต้อง",
        text: "กรุณากรอกเบอร์โทรศัพท์มือถือ 10 หลัก (เช่น 0812345678)",
        confirmButtonColor: "#16a34a",
      });
      return;
    }

    // Validate Password
    if (formData.password.length < 8) {
      Swal.fire({
        icon: "warning",
        title: "รหัสผ่านสั้นเกินไป",
        text: "รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร",
        confirmButtonColor: "#16a34a",
      });
      return;
    }

    if (formData.password !== formData.confirm_password) {
      Swal.fire({
        icon: "warning",
        title: "รหัสผ่านไม่ตรงกัน",
        text: "กรุณากรอกรหัสผ่านและยืนยันรหัสผ่านให้ตรงกัน",
        confirmButtonColor: "#16a34a",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("access_token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/admin`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim().toLowerCase(),
          tel: cleanTel,
          bod: formData.bod,
          university_id: formData.university_id ? Number(formData.university_id) : null,
          password: formData.password,
          confirm_password: formData.confirm_password,
        }),
      });

      const result = await res.json();

      if (res.ok) {
        await Swal.fire({
          icon: "success",
          title: "สร้างบัญชีผู้ดูแลระบบสำเร็จ!",
          text: `เพิ่มผู้ดูแลระบบ ${formData.first_name} ${formData.last_name} เรียบร้อยแล้ว`,
          confirmButtonColor: "#16a34a",
        });

        setIsAddAdminOpen(false);
        setFormData({
          first_name: "",
          last_name: "",
          email: "",
          tel: "",
          bod: "",
          university_id: "",
          password: "",
          confirm_password: "",
        });
        fetchUsers();
      } else {
        const errorMsg = Array.isArray(result.message) ? result.message[0] : result.message;
        Swal.fire({
          icon: "error",
          title: "ไม่สามารถสร้างบัญชีได้",
          text: errorMsg || "เกิดข้อผิดพลาดในการสร้างบัญชีผู้ดูแลระบบ",
          confirmButtonColor: "#ef4444",
        });
      }
    } catch (err: any) {
      console.error(err);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Navbar_admin>
      <div className="max-w-7xl mx-auto w-full space-y-6 pb-12">
        {/* ── Page Header ────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 flex items-center gap-2.5">
              <Users className="w-8 h-8 text-green-700" />
              <span>รายชื่อผู้ใช้งานในระบบ</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              ตรวจสอบรายชื่อ ข้อมูลการติดต่อ สิทธิ์การใช้งาน และเวลาเข้าใช้งานระบบ
            </p>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={fetchUsers}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-medium text-xs sm:text-sm shadow-2xs transition-all cursor-pointer disabled:opacity-60"
              title="รีเฟรชข้อมูล"
            >
              <RefreshCcw className={`w-4 h-4 text-green-600 ${isLoading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">รีเฟรช</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAddAdminOpen(true)}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-medium text-xs sm:text-sm shadow-sm transition-all hover:shadow-md cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>เพิ่มผู้ดูแลระบบ</span>
            </button>
          </div>
        </div>

        {/* ── Stat Summary Cards ──────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">ผู้ใช้งานทั้งหมด</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.total}</h3>
              <p className="text-[11px] text-indigo-600 font-medium">บัญชีทั้งหมดในระบบ</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">นักศึกษา / ผู้สอบ</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.students}</h3>
              <p className="text-[11px] text-emerald-600 font-medium">Role 1: ผู้สอบในระบบ</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">ผู้ดูแลระบบ (Admin)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.admins}</h3>
              <p className="text-[11px] text-purple-600 font-medium">Role 2: สิทธิ์แอดมิน</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <FcGoogle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">ล็อกอินด้วย Google</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.googleUsers}</h3>
              <p className="text-[11px] text-amber-600 font-medium">Google OAuth Users</p>
            </div>
          </div>
        </div>

        {/* ── Filters & Search ────────────────────────────────────────── */}
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-2xs space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="ค้นหาชื่อ, นามสกุล, อีเมล, เบอร์โทร หรือมหาวิทยาลัย..."
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder:text-gray-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 cursor-pointer font-semibold"
                >
                  ล้าง
                </button>
              )}
            </div>

            {/* Filter by Role */}
            <div className="w-full md:w-52">
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all cursor-pointer"
              >
                <option value="all">สิทธิ์: ทั้งหมด ({users.length})</option>
                <option value="1">นักศึกษา / ผู้สอบ (Role 1)</option>
                <option value="2">ผู้ดูแลระบบ (Role 2)</option>
              </select>
            </div>

            {/* Filter by Provider */}
            <div className="w-full md:w-48">
              <select
                value={selectedProvider}
                onChange={(e) => {
                  setSelectedProvider(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all cursor-pointer"
              >
                <option value="all">ช่องทาง: ทั้งหมด</option>
                <option value="local">อีเมลและรหัสผ่าน</option>
                <option value="google">Google Account</option>
              </select>
            </div>

            {/* Filter by University */}
            {universities.length > 0 && (
              <div className="w-full md:w-56">
                <select
                  value={selectedUniversity}
                  onChange={(e) => {
                    setSelectedUniversity(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all cursor-pointer"
                >
                  <option value="all">มหาวิทยาลัย: ทั้งหมด</option>
                  {universities.map((uni) => (
                    <option key={uni.university_id} value={uni.name}>
                      {uni.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 pt-1 px-1">
            <span>
              พบผู้ใช้งานทั้งหมด <strong className="text-gray-800">{filteredUsers.length}</strong> คน
            </span>
            {(searchQuery || selectedRole !== "all" || selectedProvider !== "all" || selectedUniversity !== "all") && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedRole("all");
                  setSelectedProvider("all");
                  setSelectedUniversity("all");
                  setCurrentPage(1);
                }}
                className="text-green-700 hover:text-green-900 font-medium underline cursor-pointer"
              >
                รีเซ็ตตัวกรองทั้งหมด
              </button>
            )}
          </div>
        </div>

        {/* ── User Table / Cards ──────────────────────────────────────── */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center space-y-3">
              <div className="w-10 h-10 border-3 border-green-200 border-t-green-600 rounded-full animate-spin mx-auto" />
              <p className="text-xs text-gray-500">กำลังโหลดรายชื่อผู้ใช้งาน...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-16 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-gray-800">ไม่พบรายชื่อผู้ใช้งาน</h3>
              <p className="text-xs text-gray-400 max-w-sm mx-auto">
                ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา ลองเปลี่ยนคำค้นหาหรือรีเซ็ตตัวกรอง
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 border-b border-gray-100 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4">ผู้ใช้งาน</th>
                    <th className="py-3.5 px-4">ข้อมูลติดต่อ</th>
                    <th className="py-3.5 px-4">มหาวิทยาลัย</th>
                    <th className="py-3.5 px-4">สิทธิ์การใช้งาน</th>
                    <th className="py-3.5 px-4">เข้าใช้งานล่าสุด</th>
                    <th className="py-3.5 px-4">วันที่สมัคร</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs">
                  {paginatedUsers.map((item) => {
                    const isAdmin = item.role_id === 2;
                    const isGoogle = item.provider === "google";
                    const initial = (item.first_name?.[0] || item.email?.[0] || "U").toUpperCase();

                    return (
                      <tr
                        key={item.user_id}
                        className="hover:bg-gray-50/60 transition-colors"
                      >
                        {/* 1. Name & Avatar */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={item} isAdmin={isAdmin} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-gray-900 text-sm truncate">
                                  {item.first_name} {item.last_name}
                                </span>
                                {isGoogle && (
                                  <span title="บัญชี Google">
                                    <FcGoogle className="w-3.5 h-3.5 shrink-0" />
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-gray-400">
                                ID: #{item.user_id}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* 2. Contact Info */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 text-gray-700">
                              <Mail className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span className="truncate max-w-[200px]" title={item.email}>
                                {item.email}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-gray-500">
                              <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                              <span>{formatPhone(item.tel)}</span>
                            </div>
                          </div>
                        </td>

                        {/* 3. University */}
                        <td className="py-3.5 px-4">
                          {item.university?.name ? (
                            <div className="flex items-center gap-1.5 text-gray-700">
                              <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate max-w-[180px]" title={item.university.name}>
                                {item.university.name}
                              </span>
                            </div>
                          ) : item.role_id === 2 ? (
                            <span className="text-gray-400 text-xs italic">ส่วนกลาง / ระบบ</span>
                          ) : (
                            <span className="text-gray-400 italic text-xs">- ไม่ได้ระบุ -</span>
                          )}
                        </td>

                        {/* 4. Role & Permissions (Role 1 vs Role 2) */}
                        <td className="py-3.5 px-4">
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                              <span>ผู้ดูแลระบบ (Admin)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>นักศึกษา / ผู้สอบ (User)</span>
                            </span>
                          )}
                        </td>

                        {/* 5. Last Login */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-gray-700">
                            <Clock className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                            <span className="whitespace-nowrap">
                              {formatThaiDateTime(item.last_login_at || item.updated_at)}
                            </span>
                          </div>
                        </td>

                        {/* 6. Created Date */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <Calendar className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                            <span className="whitespace-nowrap">
                              {formatThaiDateTime(item.created_at)}
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Pagination ──────────────────────────────────────────── */}
          {!isLoading && filteredUsers.length > 0 && (
            <div className="p-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500">
              <span>
                แสดงหน้า {currentPage} จากทั้งหมด {totalPages} หน้า (รวม {filteredUsers.length} คน)
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="หน้าก่อนหน้า"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((pageNum, idx, arr) => {
                    const prev = arr[idx - 1];
                    const isGap = prev && pageNum - prev > 1;

                    return (
                      <React.Fragment key={pageNum}>
                        {isGap && <span className="px-1 text-gray-400">...</span>}
                        <button
                          type="button"
                          onClick={() => setCurrentPage(pageNum)}
                          className={`w-8 h-8 rounded-lg font-medium transition-colors cursor-pointer ${
                            currentPage === pageNum
                              ? "bg-green-600 text-white shadow-2xs"
                              : "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                          }`}
                        >
                          {pageNum}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                  title="หน้าถัดไป"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Add Admin Account Modal ─────────────────────────────────── */}
        {isAddAdminOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-gray-100">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900">
                      เพิ่มบัญชีผู้ดูแลระบบ (Admin)
                    </h3>
                    <p className="text-xs text-gray-500">
                      กำหนดสิทธิ์ Role 2 สำหรับจัดการระบบและคลังข้อสอบ
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => !isSubmitting && setIsAddAdminOpen(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleCreateAdmin} className="p-6 space-y-4">
                {/* First Name & Last Name */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">
                      ชื่อจริง <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) =>
                        setFormData({ ...formData, first_name: e.target.value })
                      }
                      placeholder="เช่น สมชาย"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder:text-gray-300"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">
                      นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) =>
                        setFormData({ ...formData, last_name: e.target.value })
                      }
                      placeholder="เช่น ใจดี"
                      required
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder:text-gray-300"
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">
                      อีเมล <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="admin@example.com"
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder:text-gray-300"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">
                      เบอร์โทรศัพท์ (10 หลัก) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        maxLength={10}
                        value={formData.tel}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            tel: e.target.value.replace(/\D/g, ""),
                          })
                        }
                        placeholder="0812345678"
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all placeholder:text-gray-300"
                      />
                    </div>
                  </div>
                </div>

                {/* Birthday & University */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">
                      วันเดือนปีเกิด <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="date"
                        value={formData.bod}
                        onChange={(e) =>
                          setFormData({ ...formData, bod: e.target.value })
                        }
                        required
                        className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-700 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">
                      สังกัดมหาวิทยาลัย <span className="text-gray-400 font-normal">(ไม่บังคับ)</span>
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <select
                        value={formData.university_id}
                        onChange={(e) =>
                          setFormData({ ...formData, university_id: e.target.value })
                        }
                        className="w-full pl-9 pr-3.5 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-gray-700 cursor-pointer"
                      >
                        <option value="">-- ไม่ระบุ / ส่วนกลาง --</option>
                        {universities.map((uni) => (
                          <option key={uni.university_id} value={uni.university_id}>
                            {uni.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Password & Confirm Password */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">
                      รหัสผ่าน (อย่างน้อย 8 ตัวอักษร) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="••••••••"
                        required
                        minLength={8}
                        className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-700">
                      ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirm_password}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            confirm_password: e.target.value,
                          })
                        }
                        placeholder="••••••••"
                        required
                        minLength={8}
                        className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Role Note */}
                <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl flex items-start gap-2.5 text-xs text-purple-900">
                  <ShieldCheck className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
                  <span>
                    บัญชีนี้จะได้รับสิทธิ์ <strong>ผู้ดูแลระบบ (Role 2)</strong> โดยอัตโนมัติ สามารถเข้าถึงหน้าจัดการคลังข้อสอบและสถิติทั้งหมดได้
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => setIsAddAdminOpen(false)}
                    className="px-4 py-2.5 text-xs sm:text-sm font-medium rounded-xl text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    ยกเลิก
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 transition-all shadow-sm hover:shadow-md cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>กำลังสร้างบัญชี...</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>บันทึกบัญชีผู้ดูแลระบบ</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Navbar_admin>
  );
}
