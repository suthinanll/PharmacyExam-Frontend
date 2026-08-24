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
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Lock,
} from "lucide-react";
import { FcGoogle } from "react-icons/fc";

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

const ITEMS_PER_PAGE = 10;

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState<string>("all");
  const [selectedProvider, setSelectedProvider] = useState<string>("all");
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

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

  useEffect(() => {
    fetchUsers();
  }, []);

  // Format Thai Date & Time
  const formatThaiDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "ยังไม่มีประวัติ";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "ยังไม่มีประวัติ";
    return new Intl.DateTimeFormat("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date) + " น.";
  };

  // Format Thai Phone: 0812345678 -> 081-234-5678
  const formatPhone = (phone?: string | null) => {
    if (!phone) return "-";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  };

  // Unique Universities for filter
  const universityOptions = useMemo(() => {
    const set = new Set<string>();
    users.forEach((u) => {
      if (u.university?.name) set.add(u.university.name);
    });
    return Array.from(set);
  }, [users]);

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
        (selectedRole === "admin" && u.role_id === 2) ||
        (selectedRole === "student" && u.role_id === 1);

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
              ตรวจสอบรายชื่อ, ข้อมูลการติดต่อ, สิทธิ์การใช้งาน และเวลาเข้าใช้งานระบบ
            </p>
          </div>

          <button
            type="button"
            onClick={fetchUsers}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl font-medium text-xs sm:text-sm shadow-2xs transition-all cursor-pointer disabled:opacity-60"
          >
            <RefreshCcw className={`w-4 h-4 text-green-600 ${isLoading ? "animate-spin" : ""}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>
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
              <p className="text-[11px] text-emerald-600 font-medium">ผู้เรียนเตรียมสอบ</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-2xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">ผู้ดูแลระบบ (Admin)</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stats.admins}</h3>
              <p className="text-[11px] text-purple-600 font-medium">สิทธิ์จัดการระบบ</p>
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
            <div className="w-full md:w-48">
              <select
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all cursor-pointer"
              >
                <option value="all">สิทธิ์: ทั้งหมด ({users.length})</option>
                <option value="student">🎓 นักศึกษา / ผู้สอบ ({stats.students})</option>
                <option value="admin">👑 ผู้ดูแลระบบ ({stats.admins})</option>
              </select>
            </div>

            {/* Filter by Provider */}
            <div className="w-full md:w-44">
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
            {universityOptions.length > 0 && (
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
                  {universityOptions.map((uni) => (
                    <option key={uni} value={uni}>
                      {uni}
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
                            {item.profile_picture ? (
                              <img
                                src={item.profile_picture}
                                alt={item.first_name}
                                className="w-9 h-9 rounded-full object-cover border border-gray-200 shrink-0"
                              />
                            ) : (
                              <div
                                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white shrink-0 shadow-2xs ${
                                  isAdmin
                                    ? "bg-gradient-to-tr from-purple-600 to-indigo-600"
                                    : "bg-gradient-to-tr from-green-600 to-teal-600"
                                }`}
                              >
                                {initial}
                              </div>
                            )}
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
                          ) : (
                            <span className="text-gray-400 italic">- ไม่ได้ระบุ -</span>
                          )}
                        </td>

                        {/* 4. Role & Permissions */}
                        <td className="py-3.5 px-4">
                          {isAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
                              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                              <span>ผู้ดูแลระบบ</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>นักศึกษา / ผู้สอบ</span>
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
      </div>
    </Navbar_admin>
  );
}
