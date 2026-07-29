"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  User,
  LogOut,
  ChevronLeft,
  ChevronRight,
  FileText,
  Zap,
  Layers,
  List,
  Calendar,
  Newspaper,
  MessageSquare,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import Link from "next/link";
import React from "react";
import Swal from "sweetalert2";
import { useAuth } from "@/contexts/AuthContext";

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading: boolean;
}

const LogoutConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  loading,
}: LogoutModalProps) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-auto p-6 transform transition-all duration-300 scale-100 opacity-100">
        <div className="flex flex-col items-center">
          <LogOut className="w-10 h-10 text-red-700 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            ยืนยันการออกจากระบบ
          </h3>
          <p className="text-sm text-gray-500 text-center mb-6">
            คุณแน่ใจหรือไม่ว่าจะออกจากระบบตอนนี้?
          </p>
        </div>

        <div className="flex justify-center space-x-3">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-sm font-medium rounded-lg text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            onClick={onConfirm}
            type="button"
            className="px-4 py-2 text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors shadow-md"
            disabled={loading}
          >
            {loading ? "กำลังออก..." : "ออกจากระบบ"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function Navbar_admin({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("admin_sidebar_collapsed") === "true";
  });
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  // Save collapse state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("admin_sidebar_collapsed", String(newState));
  };

  const sidebarItems = [
    { title: "แดชบอร์ด", href: "/admin", icon: LayoutDashboard },
    { title: "คลังข้อสอบ", href: "/admin/manage_examset", icon: FileText },
    { title: "ข้อสอบแบบ (CAT)", href: "/admin/cat_management", icon: Zap },
    {
      title: "จัดการประเภทข้อสอบ",
      href: "/admin/manage_category",
      icon: Layers,
    },
    { title: "จัดการหัวข้อ", href: "/admin/manage_topics", icon: List },
    { title: "ปฏิทินกำหนดการ", href: "/admin/manage_calendar", icon: Calendar },
    { title: "บล็อกข่าวสาร", href: "/admin/mnblog", icon: Newspaper },
  ];

  const settingsItems = [
    { title: "แชตบอต", href: "/admin/chatlog", icon: MessageSquare },
    { title: "การตั้งค่า", href: "/admin/settingp", icon: Settings },
  ];

  const isActive = (href: string) => {
    // 1. เช็ค Exact Match สำหรับหน้า Dashboard / Root
    if (href === "/" || href === "/admin") {
      return pathname === href;
    }

    // 2. สำหรับหน้าอื่นๆ ให้เช็คว่า Path ปัจจุบันตรงเป๊ะ หรือเป็น Sub-path ของเมนูนั้น
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogoutClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setIsLogoutModalOpen(true);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  // ดึงข้อมูลผู้ใช้จาก AuthContext
  const { user } = useAuth();

  const handleConfirmLogout = async () => {
    setLoadingLogout(true);
    try {
      sessionStorage.removeItem("token");

      await Swal.fire({
        icon: "success",
        title: "ออกจากระบบเรียบร้อย",
        showConfirmButton: false,
        timer: 1500,
      });

      setIsLogoutModalOpen(false);
      setLoadingLogout(false);
      router.push("/login");
    } catch (err) {
      console.error(err);
      setLoadingLogout(false);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
      });
    }
  };

  return (
    <div
      className={`flex h-screen bg-gray-50 overflow-hidden ${isCollapsed ? "sidebar-collapsed" : ""}`}
    >
      {/* Sidebar - Desktop */}
      <aside
        className={`hidden lg:flex lg:flex-col bg-white border-r border-gray-200 fixed h-full transition-all duration-300 z-30 ${
          isCollapsed ? "w-20" : "w-64 xl:w-72"
        }`}
      >
        <div
          className={`p-4 h-20 border-b border-gray-200 flex items-center ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          {!isCollapsed && (
            <Link
              href="/admin"
              className="block hover:opacity-80 transition-opacity truncate"
            >
              <h1 className="text-lg font-semibold text-green-700 whitespace-nowrap">
                เภสัชพร้อมสอบ
              </h1>
            </Link>
          )}
          <button
            onClick={toggleCollapse}
            className={`p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-green-700 transition-colors ${isCollapsed ? "" : "ml-2"}`}
            title={isCollapsed ? "ขยายแถบเมนู" : "หุบแถบเมนู"}
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto no-scrollbar">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 w-full px-3 py-3 transition-all duration-200 rounded-lg group ${
                    isActive(item.href)
                      ? "bg-gray-100 text-green-700 font-bold"
                      : "text-gray-600 hover:bg-gray-50 hover:text-green-700"
                  } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? item.title : ""}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${isActive(item.href) ? "text-green-700" : "text-gray-400 group-hover:text-green-700"}`}
                  />
                  {!isCollapsed && (
                    <span className="text-sm truncate">{item.title}</span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="space-y-1">
              {settingsItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 w-full px-3 py-3 transition-all duration-200 rounded-lg group ${
                      isActive(item.href)
                        ? "bg-gray-100 text-green-700 font-bold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-green-700"
                    } ${isCollapsed ? "justify-center" : ""}`}
                    title={isCollapsed ? item.title : ""}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${isActive(item.href) ? "text-green-700" : "text-gray-400 group-hover:text-green-700"}`}
                    />
                    {!isCollapsed && (
                      <span className="text-sm truncate">{item.title}</span>
                    )}
                  </Link>
                );
              })}

              <button
                onClick={handleLogoutClick}
                className={`flex items-center gap-3 w-full px-3 py-3 transition-all duration-200 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 ${
                  isCollapsed ? "justify-center" : ""
                }`}
                title={isCollapsed ? "ออกจากระบบ" : ""}
              >
                <LogOut className="w-5 h-5 flex-shrink-0" />
                {!isCollapsed && (
                  <span className="text-sm font-medium">ออกจากระบบ</span>
                )}
              </button>
            </div>
          </div>
        </nav>

        <div className="p-4 border-t border-gray-200 bg-white">
          <Link
            href="/admin/settingp"
            className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-200 ${
              isActive("/admin/settingp") ? "bg-gray-100" : "hover:bg-gray-50"
            } ${isCollapsed ? "justify-center" : ""}`}
            title={isCollapsed ? `${user?.first_name} ${user?.last_name}` : ""}
          >
            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0 border border-gray-200">
              <User className="w-6 h-6 text-green-700" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-green-800 truncate">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-green-600 truncate">{user?.email}</p>
              </div>
            )}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          isCollapsed ? "lg:ml-20" : "lg:ml-64 xl:ml-72"
        }`}
      >
        <header className="lg:hidden bg-white shadow-md sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <Link href="/admin" className="hover:opacity-80 transition-opacity">
              <h1 className="text-base sm:text-lg md:text-xl font-semibold text-green-700">
                เภสัชพร้อมสอบ
              </h1>
            </Link>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                ) : (
                  <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
                )}
              </button>
            </div>
          </div>

          {isMobileMenuOpen && (
            <div className="border-t border-gray-200 bg-white max-h-[calc(100vh-64px)] overflow-y-auto">
              <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-1">
                {sidebarItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 text-sm sm:text-base ${
                      isActive(item.href)
                        ? "bg-green-50 text-green-700 font-medium border-l-4 border-green-700"
                        : "text-green-600 hover:bg-gray-50 hover:text-green-700"
                    }`}
                  >
                    {item.title}
                  </Link>
                ))}

                <div className="pt-3 sm:pt-4 border-t border-gray-200 mt-3 sm:mt-4 space-y-1">
                  {settingsItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 text-sm sm:text-base ${
                        isActive(item.href)
                          ? "bg-gray-100 text-green-700 font-bold border-l-4 border-green-700"
                          : "text-green-600 hover:bg-gray-50 hover:text-green-700"
                      }`}
                    >
                      {item.title}
                    </Link>
                  ))}

                  <a
                    href="#"
                    onClick={handleLogoutClick}
                    className="flex items-center space-x-2 w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 text-sm sm:text-base text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span>ออกจากระบบ</span>
                  </a>

                  {/* 📍 ส่วนที่เพิ่มเข้ามา: แสดงข้อมูลโปรไฟล์ในหน้า Mobile */}
                  <div className="pt-3 sm:pt-4 border-t border-gray-200 mt-3 sm:mt-4">
                    <Link
                      href="/admin/settingp"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 ${isActive("/admin/settingp") ? "bg-gray-100" : "bg-gray-50"}`}
                    >
                      <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center border border-gray-200 shadow-sm">
                        <User className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-green-700 truncate">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-green-600 truncate">
                          {user?.email}
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 lg:p-8">
          {children}
        </main>
      </div>

      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
        loading={loadingLogout}
      />
    </div>
  );
}
