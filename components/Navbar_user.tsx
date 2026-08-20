"use client";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { global } from 'styled-jsx/css';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  User,
  LogOut,
  History,
  Bell,
  Calendar,
  Clock,
  BookOpen,
  AlertCircle,
  ChevronDown,
  Bookmark,
  CheckCheck,
  Trash2,
  Info,
  Newspaper,
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useNotifications, AppNotification } from '@/contexts/NotificationContext';
import { useAuth } from '@/contexts/AuthContext';

// ---- Notification type helpers ----
const TYPE_ICON_MAP: Record<number, React.ElementType> = {
  1: Calendar,
  2: Newspaper,
  3: BookOpen,
  4: Info,
};
const TYPE_COLOR_MAP: Record<number, { icon: string; bg: string }> = {
  1: { icon: 'text-red-500', bg: 'bg-red-50' },
  2: { icon: 'text-orange-500', bg: 'bg-orange-50' },
  3: { icon: 'text-blue-500', bg: 'bg-blue-50' },
  4: { icon: 'text-purple-500', bg: 'bg-purple-50' },
};

function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'เมื่อกี้';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} นาทีที่แล้ว`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} ชั่วโมงที่แล้ว`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} วันที่แล้ว`;
  return d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short' });
}

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isExamSetDropdownOpen, setIsExamSetDropdownOpen] = useState(false);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState(false);

  const pathname = usePathname();
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const notificationRef = useRef<HTMLDivElement>(null);
  const examSetDropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // ── Real notifications from WebSocket context ──
  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead, removeNotification } =
    useNotifications();

  // ดึงข้อมูลผู้ใช้จาก AuthContext
  const { user } = useAuth();

  // logout
  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'ต้องการออกจากระบบจริงหรือไม่?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true,
    });
    if (result.isConfirmed) {
      try {
        sessionStorage.removeItem("token");
        await Swal.fire({ icon: 'success', title: 'ออกจากระบบเรียบร้อย', showConfirmButton: false, timer: 1500 });
        router.push('/login');
      } catch (err) {
        console.error(err);
        Swal.fire({ icon: 'error', title: 'เกิดข้อผิดพลาด', text: 'ไม่สามารถออกจากระบบได้' });
      }
    }
  };

  const navItems = [
    { href: '/user', label: 'เภสัชพร้อมสอบ' },
    { href: '/user', label: 'หน้าหลัก' },
    {
      href: '/user/examset',
      label: 'คลังข้อสอบ',
      submenu: [
        { href: '/user/cat-exam', label: 'ข้อสอบแบบ CAT (Cumputerized-Adaptive-Testing)' }
      ]
    },
    { href: '/user/calendar', label: 'ปฏิทินการสอบ' },
    { href: '/user/chatbot', label: 'แชตบอตผู้ช่วย' },
    { href: '/user/followup', label: 'ติดตามความคืบหน้า' },
  ];

  const isActive = (path: string, hasSubmenu = false) => {
    if (hasSubmenu) return pathname.startsWith(path);
    return pathname === path;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) setIsProfileDropdownOpen(false);
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setIsNotificationOpen(false);
      if (examSetDropdownRef.current && !examSetDropdownRef.current.contains(event.target as Node)) setIsExamSetDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) setMobileSubmenuOpen(false);
  }, [isMobileMenuOpen]);

  return (
    <nav className="shadow-xl bg-[rgba(118,178,90,1)] sticky top-0 z-50 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-3 sm:px-5 md:px-6 lg:px-8">
        <div className="relative flex h-14 sm:h-15 md:h-17 items-center justify-between">

          {/* Mobile hamburger */}
          <div className="absolute inset-y-0 left-0 flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative inline-flex items-center justify-center rounded-lg p-2 text-white hover:bg-white/20 focus:outline-2 focus:-outline-offset-1 focus:outline-green-300 transition-colors duration-200"
            >
              <span className="sr-only">Open main menu</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={`size-5 ${isMobileMenuOpen ? 'hidden' : 'block'}`}>
                <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true" className={`size-5 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
                <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Logo + Desktop nav */}
          <div className="flex flex-1 items-center justify-center lg:items-stretch lg:justify-start">
            <div className="flex shrink-0 items-center">
              <Link href="/user" className="flex items-center space-x-2 group">
                <span className="text-lg sm:text-xl md:text-2xl font-medium text-white group-hover:text-green-100 transition-colors duration-200">
                  เภสัชพร้อมสอบ
                </span>
              </Link>
            </div>

            <div className="hidden lg:ml-6 xl:ml-8 lg:block">
              <div className="flex space-x-1.5 xl:space-x-2">
                {navItems.slice(1).map((item) => (
                  item.submenu ? (
                    <div key={item.label} className="relative group" ref={examSetDropdownRef}>
                      <div className={`flex items-center rounded-lg text-lg font-medium transition-colors duration-200 whitespace-nowrap ${isActive(item.href, true) ? "buttonact text-white shadow-lg" : "text-white hover:bg-white/20 hover:text-white"}`}>
                        <Link href={item.href} className="pl-2.5 xl:pl-3 pr-1 py-2 rounded-l-lg">
                          {item.label}
                        </Link>
                        <button onClick={() => setIsExamSetDropdownOpen(prev => !prev)} className="p-2 rounded-r-lg hover:bg-white/10 transition-colors">
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExamSetDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </button>
                      </div>
                      {isExamSetDropdownOpen && (
                        <div className="absolute left-0 mt-2 w-64 origin-top-left rounded-xl bg-white py-2 shadow-2xl ring-1 ring-black/10 z-50">
                          {item.submenu.map((subItem) => (
                            <Link key={subItem.href} href={subItem.href} onClick={() => setIsExamSetDropdownOpen(false)}
                              className={`block px-4 py-2.5 text-base text-gray-700 hover:bg-green-50 hover:text-green-800 transition-colors duration-200 ${isActive(subItem.href) ? 'font-medium text-green-700 bg-green-50/50' : ''}`}>
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link key={item.href} href={item.href}
                      className={`rounded-lg px-2.5 xl:px-3 py-2 text-lg font-medium transition-colors duration-200 whitespace-nowrap ${isActive(item.href) ? "buttonact text-white shadow-lg" : "text-white hover:bg-white/20 hover:text-white"}`}
                      aria-current={isActive(item.href) ? 'page' : undefined}>
                      {item.label}
                    </Link>
                  )
                ))}
              </div>
            </div>
          </div>

          {/* Right icons */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-4 md:ml-6 sm:pr-0 space-x-2 sm:space-x-3">

            {/* ── Notification ── */}
            <div className="relative" ref={notificationRef}>
              <button
                type="button"
                id="notification-bell-user"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative rounded-full p-1.5 sm:p-2 text-green-200 hover:bg-white/20 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-green-300 transition-colors duration-200 group"
              >
                <span className="absolute -inset-1.5"></span>
                <span className="sr-only">View notifications</span>
                <Bell className="size-5 sm:size-5 transition-colors duration-200" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] sm:min-w-[1.25rem] h-4.5 sm:h-5 bg-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center px-1 animate-pulse font-medium shadow-lg">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
                {/* WS status dot */}
                <span className={`absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full border border-green-400/50 transition-colors duration-200 ${isConnected ? 'bg-green-300' : 'bg-gray-400'}`} />
              </button>

              {isNotificationOpen && (
                <div className="absolute right-0 z-50 mt-2 w-80 sm:w-96 origin-top-right rounded-2xl bg-white shadow-2xl ring-1 ring-black/10 max-h-[calc(100vh-5rem)] overflow-hidden flex flex-col">

                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-green-50 to-green-50/50">
                    <div className="flex items-center justify-between">
                      <h3 className="text-gray-800 font-medium text-sm flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-green-600" />
                        การแจ้งเตือน
                        {unreadCount > 0 && (
                          <span className="bg-red-100 text-red-600 text-[10px] px-1.5 py-0.5 rounded-full font-medium">{unreadCount} ใหม่</span>
                        )}
                      </h3>
                      {unreadCount > 0 && (
                        <button onClick={markAllAsRead}
                          className="flex items-center gap-1 text-xs text-green-700 hover:text-green-800 font-medium px-2 py-1 rounded-lg hover:bg-green-100 transition-colors duration-200">
                          <CheckCheck className="w-3.5 h-3.5" />
                          อ่านทั้งหมด
                        </button>
                      )}
                    </div>
                  </div>

                  {/* List */}
                  <div className="overflow-y-auto max-h-80 sm:max-h-96 flex-1 p-3 space-y-2">
                    {notifications.length > 0 ? (
                      notifications.map((n: AppNotification) => {
                        const typeId = n.notification_type_id ?? 4;
                        const IconComponent = TYPE_ICON_MAP[typeId] ?? Info;
                        const colors = TYPE_COLOR_MAP[typeId] ?? { icon: 'text-gray-500', bg: 'bg-gray-50' };
                        return (
                          <div key={n.notification_id}
                            className={`group relative flex items-start gap-3 px-4 py-3 rounded-xl border transition-colors duration-200 cursor-pointer ${n.is_read ? 'bg-white border-gray-100 hover:bg-gray-50' : 'bg-blue-50/60 border-blue-200 hover:bg-blue-50'}`}
                            onClick={() => {
                              if (!n.is_read) markAsRead(n.notification_id);
                              if (n.link_url) router.push(n.link_url);
                            }}
                          >
                            <div className={`flex-shrink-0 w-10 h-10 ${colors.bg} rounded-xl flex items-center justify-center shadow-sm`}>
                              <IconComponent className={`w-5 h-5 ${colors.icon}`} />
                            </div>
                            <div className="flex-1 min-w-0 pr-4">
                              <p className={`text-sm font-medium leading-tight ${n.is_read ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</p>
                              <p className="text-xs text-gray-500 mt-1 line-clamp-2">{n.message}</p>
                              <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {timeAgo(n.created_at)}
                              </p>
                            </div>
                            {!n.is_read && (
                              <span className="absolute top-3 right-8 w-2.5 h-2.5 bg-blue-500 rounded-full shadow-lg animate-pulse" />
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); removeNotification(n.notification_id); }}
                              className="absolute top-2.5 right-2.5 hidden group-hover:flex items-center justify-center w-7 h-7 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors duration-200"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-12 text-center text-gray-500">
                        <Bell className="w-12 sm:w-14 h-12 sm:h-14 mx-auto text-gray-300 mb-3" />
                        <p className="text-base font-medium">ไม่มีการแจ้งเตือน</p>
                        <p className="text-sm text-gray-400 mt-1">การแจ้งเตือนใหม่จะปรากฏที่นี่</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="bg-gray-50 px-5 py-3 rounded-b-2xl border-t border-gray-100 flex justify-end">
                    <button className="text-sm text-green-600 hover:text-green-700 font-medium px-3 py-1 rounded-lg hover:bg-green-100 transition-colors duration-200" onClick={() => setIsNotificationOpen(false)}>
                      ปิด
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── Profile dropdown ── */}
            <div className="relative" ref={profileDropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="relative flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-300 transition-all duration-200"
              >
                <span className="absolute -inset-1.5"></span>
                <span className="sr-only">Open user menu</span>
                {user?.profile_picture ? (
                  <div className="size-8 sm:size-9 md:size-10 rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200 ring-2 ring-green-400/30 relative">
                    <Image
                      src={user.profile_picture}
                      alt="Profile"
                      fill
                      sizes="(max-width: 640px) 32px, (max-width: 768px) 36px, 40px"
                      className="object-cover"
                      priority
                    />
                  </div>
                ) : (
                  <div className="size-8 sm:size-9 md:size-10 rounded-full bg-white flex items-center justify-center shadow-lg hover:shadow-xl transition-shadow duration-200 ring-2 ring-green-400/30">
                    <User className="w-4 sm:w-5 h-4 sm:h-5 text-green-600" />
                  </div>
                )}
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 z-50 mt-3 w-56 sm:w-60 md:w-64 origin-top-right rounded-xl bg-white py-1 shadow-2xl ring-1 ring-black/10">
                  <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 bg-gradient-to-r from-green-50 to-green-50/50">
                    <p className="text-sm sm:text-base font-medium text-green-800 truncate">
                      {user?.first_name + "  " + user?.last_name || 'นักศึกษาเภสัช'}
                    </p>
                    <p className="text-xs sm:text-sm text-green-600 truncate mt-0.5">
                      {user?.email || 'student@pharmacy.ac.th'}
                    </p>
                  </div>
                  <div className="py-1">
                    <Link href="/user/profile" className="flex items-center px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-200" onClick={() => setIsProfileDropdownOpen(false)}>
                      <User className="w-4 sm:w-5 h-4 sm:h-5 mr-3 sm:mr-4 text-gray-600" />โปรไฟล์ของฉัน
                    </Link>
                    <Link href="/user/saveblog" className="flex items-center px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors duration-200" onClick={() => setIsProfileDropdownOpen(false)}>
                      <Bookmark className="w-4 sm:w-5 h-4 sm:h-5 mr-3 sm:mr-4 text-gray-600" />บันทึกแล้ว
                    </Link>
                    <Link href="/user/examhis" className="flex items-center px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base text-gray-700 hover:bg-gray-50 transition-colors duration-200" onClick={() => setIsProfileDropdownOpen(false)}>
                      <History className="w-4 sm:w-5 h-4 sm:h-5 mr-3 sm:mr-4 text-gray-600" />ประวัติการทำข้อสอบ
                    </Link>
                  </div>
                  <div className="border-t border-gray-100">
                    <button className="flex items-center w-full px-4 sm:px-5 py-2.5 sm:py-3 text-sm sm:text-base text-red-600 hover:bg-red-50 transition-colors duration-200" onClick={handleLogout}>
                      <LogOut className="w-4 sm:w-5 h-4 sm:h-5 mr-3 sm:mr-4" />ออกจากระบบ
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Mobile menu */}
      <div className={`lg:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="mobilenav space-y-2 px-3 pt-3 pb-4 backdrop-blur-sm">
          {navItems.slice(1).map((item) => (
            item.submenu ? (
              <div key={item.label}>
                <div className={`flex w-full items-center justify-between rounded-lg text-left text-base sm:text-lg font-medium transition-colors duration-200 ${isActive(item.href, true) ? "buttonact text-white shadow-lg" : "text-white hover:bg-white/20 hover:text-white"}`}>
                  <Link href={item.href} className="flex-grow px-4 py-3" onClick={() => setIsMobileMenuOpen(false)}>
                    <span>{item.label}</span>
                  </Link>
                  <button onClick={() => setMobileSubmenuOpen(!mobileSubmenuOpen)} className="px-4 py-3 hover:bg-white/10 rounded-r-lg transition-colors" aria-label="เปิดเมนูย่อยคลังข้อสอบ">
                    <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${mobileSubmenuOpen ? 'rotate-180' : 'rotate-0'}`} />
                  </button>
                </div>
                <div className={`overflow-hidden transition-all duration-500 ease-in-out ${mobileSubmenuOpen ? 'max-h-96 mt-2' : 'max-h-0'}`}>
                  <div className="ml-4 space-y-1.5 border-l-4 border-green-700/30 pl-3 pt-1 pb-2">
                    {item.submenu.map((subItem) => (
                      <Link key={subItem.href} href={subItem.href}
                        className={`block rounded-lg px-4 py-2.5 text-sm font-medium transition-colors duration-200 ${isActive(subItem.href) ? "buttonact text-white shadow-md" : "text-white hover:bg-white/20 hover:text-white"}`}
                        aria-current={isActive(subItem.href) ? 'page' : undefined}
                        onClick={() => setIsMobileMenuOpen(false)}>
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link key={item.href} href={item.href}
                className={`block rounded-lg px-4 py-3 text-base sm:text-lg font-medium transition-colors duration-200 ${isActive(item.href) ? "buttonact text-white shadow-lg" : "text-white hover:bg-white/20 hover:text-white"}`}
                aria-current={isActive(item.href) ? 'page' : undefined}
                onClick={() => setIsMobileMenuOpen(false)}>
                {item.label}
              </Link>
            )
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;