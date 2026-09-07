"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, User, Users, LogOut, ChevronLeft, ChevronRight, FileText, Zap, List, ListCollapse, Calendar, Newspaper, MessageSquare, Settings, LayoutDashboard, SlidersHorizontal, Receipt, Settings2, CalendarClock } from "lucide-react";
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
          <h3 className="text-xl font-medium text-gray-900 mb-2">
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


  // Save collapse state to localStorage
  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("admin_sidebar_collapsed", String(newState));
  };

  // ดึงข้อมูลผู้ใช้จาก AuthContext (ต้องอยู่ก่อน sidebarItems เพราะเมนู Super Admin ขึ้นกับ role)
  const { user, logout, getToken } = useAuth();
  const isSuperAdmin = user?.role_id === 3;

  // สถานะสิทธิ์รายปีของ admin ที่ซื้อไว้ — โชว์วันคงเหลือท้าย sidebar (Super Admin ไม่ต้องเช็ค ไม่มีวันหมดอายุ)
  const [subscription, setSubscription] = useState<{
    hasActiveSubscription: boolean;
    daysRemaining?: number;
    expiresAt?: string;
  } | null>(null);

  useEffect(() => {
    if (user?.role_id !== 2) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/payment/my-subscription`,
          { headers: { Authorization: `Bearer ${getToken()}` } },
        );
        if (res.ok && !cancelled) setSubscription(await res.json());
      } catch {
        // เงียบไว้ — เป็นข้อมูลเสริม ไม่ควรทำให้ navbar พัง
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.role_id, getToken]);

  const sidebarItems = [
    { title: "แดชบอร์ด", href: "/admin", icon: LayoutDashboard },
    { title: "รายชื่อผู้ใช้งาน", href: "/admin/manage_users", icon: Users },
    { title: "คลังข้อสอบ", href: "/admin/manage_examset", icon: FileText },
    { title: "ข้อสอบแบบ (CAT)", href: "/admin/cat_management", icon: Zap },
    { title: "จัดการพารามิเตอร์ IRT", href: "/admin/irt_management", icon: SlidersHorizontal },
    { title: "จัดการประเภทข้อสอบ", href: "/admin/manage_category", icon: List },
    { title: "จัดการหัวข้อ", href: "/admin/manage_topics", icon: ListCollapse },
    { title: "ปฏิทินกำหนดการ", href: "/admin/manage_calendar", icon: Calendar },
    { title: "บล็อกข่าวสาร", href: "/admin/mnblog", icon: Newspaper },
    // เฉพาะ Super Admin (role_id=3) — admin ที่ซื้อสิทธิ์รายปีมองไม่เห็นเมนูสองอันนี้
    ...(isSuperAdmin
      ? [
          { title: "ประวัติการชำระเงิน", href: "/admin/super/subscriptions", icon: Receipt },
          { title: "ตั้งค่าการชำระเงิน", href: "/admin/super/payment-settings", icon: Settings2 },
        ]
      : []),
  ];

  const settingsItems = [
    { title: "แชตบอต", href: "/admin/chatlog", icon: MessageSquare },
    { title: "การตั้งค่า", href: "/admin/settingp", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/") return pathname === href;
    if (href === "/admin") return pathname === href;
    if (href === "/settings" || href === "/profile") return pathname === href;
    return pathname.startsWith(href);
  };

  const handleLogoutClick = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    setIsLogoutModalOpen(true);
    if (isMobileMenuOpen) setIsMobileMenuOpen(false);
  };

  const handleConfirmLogout = async () => {
    setLoadingLogout(true);
    try {
      await Swal.fire({
        icon: "success",
        title: "ออกจากระบบเรียบร้อย",
        showConfirmButton: false,
        timer: 1500,
      });

      setIsLogoutModalOpen(false);
      setLoadingLogout(false);
      await logout();
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
        className={`hidden lg:flex lg:flex-col bg-white border-r border-gray-200 fixed h-full transition-all duration-300 z-30 ${isCollapsed ? "w-20" : "w-64 xl:w-72"
          }`}
      >
        <div
          className={`px-4 h-16 border-b border-gray-200 flex items-center shrink-0 ${isCollapsed ? "justify-center" : "justify-between"}`}
        >
          {!isCollapsed && (
            <Link
              href="/admin"
              className="block hover:opacity-80 transition-opacity truncate"
            >
              <h1 className="text-lg font-medium text-green-700 whitespace-nowrap">
                เภสัชพร้อมสอบ
              </h1>
            </Link>
          )}
          <button
            onClick={toggleCollapse}
            className={`p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-green-700 transition-colors cursor-pointer ${isCollapsed ? "" : "ml-2"}`}
            title={isCollapsed ? "ขยายแถบเมนู" : "หุบแถบเมนู"}
          >
            {isCollapsed ? (
              <ChevronRight size={20} />
            ) : (
              <ChevronLeft size={20} />
            )}
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden flex flex-col justify-between">
          <div className="space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 transition-all duration-150 rounded-xl group text-sm ${isActive(item.href)
                    ? "bg-green-50 text-green-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50 hover:text-green-700 font-medium"
                    } ${isCollapsed ? "justify-center" : ""}`}
                  title={isCollapsed ? item.title : ""}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${isActive(item.href) ? "text-green-700" : "text-gray-400 group-hover:text-green-700"}`}
                  />
                  {!isCollapsed && (
                    <span className="truncate whitespace-nowrap">{item.title}</span>
                  )}
                </Link>
              );
            })}
          </div>

          <div className="my-3 pt-3 border-t border-gray-100">
            <div className="space-y-1">
              {settingsItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 transition-all duration-150 rounded-xl group text-sm ${isActive(item.href)
                      ? "bg-green-50 text-green-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50 hover:text-green-700 font-medium"
                      } ${isCollapsed ? "justify-center" : ""}`}
                    title={isCollapsed ? item.title : ""}
                  >
                    <Icon
                      className={`w-5 h-5 flex-shrink-0 ${isActive(item.href) ? "text-green-700" : "text-gray-400 group-hover:text-green-700"}`}
                    />
                    {!isCollapsed && (
                      <span className="truncate whitespace-nowrap">{item.title}</span>
                    )}
                  </Link>
                );
              })}

              <button
                onClick={handleLogoutClick}
                type="button"
                className={`flex items-center gap-3 w-full px-3 py-2.5 transition-all duration-150 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer ${isCollapsed ? "justify-center" : ""
                  }`}
                title={isCollapsed ? "ออกจากระบบ" : ""}
              >
                <LogOut className="w-5 h-5 flex-shrink-0 text-red-500" />
                {!isCollapsed && (
                  <span className="truncate whitespace-nowrap">ออกจากระบบ</span>
                )}
              </button>
            </div>
          </div>
        </nav>

        <div className="p-3 border-t border-gray-200 bg-white shrink-0 space-y-2">
          {/* สิทธิ์รายปีเหลืออีกกี่วัน — เฉพาะ admin ที่ซื้อสิทธิ์ (role 2), Super Admin ไม่มีวันหมดอายุ */}
          {subscription?.hasActiveSubscription && (
            <Link
              href="/upgrade-admin"
              className={`flex items-center gap-2 p-2 rounded-xl border transition-colors ${
                subscription.daysRemaining! <= 30
                  ? "bg-red-50 border-red-200 hover:bg-red-100"
                  : "bg-green-50 border-green-200 hover:bg-green-100"
              } ${isCollapsed ? "justify-center" : ""}`}
              title={`สิทธิ์เหลืออีก ${subscription.daysRemaining} วัน — กดเพื่อดูรายละเอียด/ต่ออายุ`}
            >
              <CalendarClock
                className={`w-5 h-5 flex-shrink-0 ${
                  subscription.daysRemaining! <= 30 ? "text-red-600" : "text-green-700"
                }`}
              />
              {!isCollapsed && (
                <div className="min-w-0">
                  <p
                    className={`text-xs font-medium truncate ${
                      subscription.daysRemaining! <= 30 ? "text-red-700" : "text-green-800"
                    }`}
                  >
                    สิทธิ์เหลืออีก {subscription.daysRemaining} วัน
                  </p>
                  <p className="text-[11px] text-gray-500 truncate">
                    หมดอายุ{" "}
                    {subscription.expiresAt &&
                      new Date(subscription.expiresAt).toLocaleDateString("th-TH", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                  </p>
                </div>
              )}
            </Link>
          )}

          <Link
            href="/admin/settingp"
            className={`flex items-center gap-3 p-2 rounded-xl transition-all duration-150 ${isActive("/admin/settingp") ? "bg-green-50" : "hover:bg-gray-50"
              } ${isCollapsed ? "justify-center" : ""}`}
            title={isCollapsed ? `${user?.first_name} ${user?.last_name}` : ""}
          >
            <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0 border border-gray-200">
              <User className="w-5 h-5 text-green-700" />
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate whitespace-nowrap">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-xs text-gray-500 truncate whitespace-nowrap">{user?.email}</p>
              </div>
            )}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isCollapsed ? "lg:ml-20" : "lg:ml-64 xl:ml-72"
          }`}
      >
        <header className="lg:hidden bg-white shadow-md sticky top-0 z-50">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <Link href="/admin" className="hover:opacity-80 transition-opacity">
              <h1 className="text-base sm:text-lg md:text-xl font-medium text-green-700">
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
                    className={`block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 text-sm sm:text-base ${isActive(item.href)
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
                      className={`block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 text-sm sm:text-base ${isActive(item.href)
                        ? "bg-gray-100 text-green-700 font-medium border-l-4 border-green-700"
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
                        <p className="text-sm font-medium text-green-700 truncate">
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

        <main id="admin-main-content" className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 lg:p-8">
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
