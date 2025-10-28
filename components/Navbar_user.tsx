"use client";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { global } from 'styled-jsx/css';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import {
  User,
  LogOut,
  History,
  Bell,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle,
  ChevronDown,
  Bookmark

} from 'lucide-react';
import { label } from 'framer-motion/client';

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

  const navItems = [
    { href: '/user', label: 'เภสัชพร้อมสอบ' },
    { href: '/user', label: 'หน้าหลัก' },

    {
      href: '/user/examset',
      label: 'คลังข้อสอบ',
      submenu: [
        { href: '/examset/by-year', label: 'ข้อสอบโรคและระบบต่างๆ' },
        { href: '/examset/mock-exam', label: 'ข้อสอบย้อนหลัง' },
        { href: '/user/examcat', label: 'ข้อสอบแบบ CAT (Cumputerized-Adaptive-Testing)'}
      ]
    },
    { href: '/user/calendar', label: 'ปฏิทินการสอบ' },
    { href: '/user/chatbot', label: 'แชตบอตผู้ช่วย' },
    { href: '/user/followup', label: 'ติดตามความคืบหน้า' },
  ];

  const notifications = [
    {
      id: 1, type: 'exam', icon: Calendar, iconColor: 'text-red-500', bgColor: 'bg-red-50', title: 'ใกล้ถึงกำหนดการสอบแล้ว!',
      message: 'การสอบเภสัชวิทยา 1 จะเริ่มในวันพรุ่งนี้ เวลา 09:00 น.', time: '1 ชั่วโมงที่แล้ว', unread: true, link: '/calender'
    },
    {
      id: 2, type: 'exam', icon: Clock, iconColor: 'text-orange-500', bgColor: 'bg-orange-50',
      title: 'เตือนการสอบ', message: 'อีก 3 วันจะถึงการสอบเภสัชเคมี ควรทบทวนบทที่ 5-8', time: '3 ชั่วโมงที่แล้ว', unread: true, link: '/calender'
    },
    {
      id: 4, type: 'update', icon: BookOpen, iconColor: 'text-blue-500', bgColor: 'bg-blue-50',
      title: 'ข้อสอบใหม่', message: 'เพิ่มข้อสอบชุดใหม่ "เภสัชศาสตร์คลินิก" 50 ข้อ', time: '1 วันที่แล้ว', unread: false, link: '/examset'
    },
    {
      id: 5, type: 'achievement', icon: CheckCircle, iconColor: 'text-purple-500', bgColor: 'bg-purple-50',
      title: 'ความสำเร็จใหม่', message: 'ยินดีด้วย! คุณทำข้อสอบครบ 100 ชุดแล้ว', time: '2 วันที่แล้ว', unread: false, link: '/followup'
    },
    {
      id: 6, type: 'reminder', icon: AlertCircle, iconColor: 'text-yellow-500', bgColor: 'bg-yellow-50',
      title: 'แนะนำการเรียน', message: 'คุณยังไม่ได้ทำข้อสอบในหมวด "เภสัชกรรมคลินิก" ควรฝึกฝนเพิ่มเติม', time: '3 วันที่แล้ว', unread: false, link: '/followup'
    }
  ];

  const unreadCount = notifications.filter(n => n.unread).length;

  const isActive = (path: string, hasSubmenu = false) => {
    if (hasSubmenu) {
      return pathname.startsWith(path);
    }
    return pathname === path;
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (examSetDropdownRef.current && !examSetDropdownRef.current.contains(event.target as Node)) {
        setIsExamSetDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) {
      setMobileSubmenuOpen(false);
    }
  }, [isMobileMenuOpen]);

  return (
    <nav className="shadow-lg sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="relative flex h-14 sm:h-16 items-center justify-between">

          <div className="absolute inset-y-0 left-0 flex items-center lg:hidden">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="relative inline-flex items-center justify-center rounded-md p-2 text-white hover:bg-white/10 hover:text-white focus:outline-2 focus:-outline-offset-1 focus:outline-green-300 transition-all duration-200"
            >
              <span className="sr-only">Open main menu</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={`size-6 ${isMobileMenuOpen ? 'hidden' : 'block'}`}>
                <path d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true" className={`size-6 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
                <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="flex flex-1 items-center justify-center lg:items-stretch lg:justify-start">
            <div className="flex shrink-0 items-center">
              <Link href="/user" className="flex items-center space-x-2 group">
                <span className="text-base sm:text-lg md:text-xl font-medium text-white group-hover:text-green-100 transition-colors">
                  เภสัชพร้อมสอบ
                </span>
              </Link>
            </div>

            <div className="hidden lg:ml-6 lg:block">
              <div className="flex space-x-1 xl:space-x-2">
                {navItems.slice(1).map((item) => (
                  item.submenu ? (
                    // --- START: แก้ไขส่วนคลังข้อสอบ ---
                    <div key={item.label} className="relative group" ref={examSetDropdownRef}>
                      <div className={`flex items-center rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive(item.href, true)
                        ? "buttonact  text-white shadow-md"
                        : "text-white hover:bg-white/10 hover:text-white"
                        }`}>
                        <Link
                          href={item.href}
                          className={`pl-2 xl:pl-3 pr-1 py-2 rounded-l-md`}
                        >
                          {item.label}
                        </Link>
                        <button
                          onClick={() => setIsExamSetDropdownOpen(prev => !prev)}
                          className={`p-2 rounded-r-md`}
                        >
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExamSetDropdownOpen ? 'rotate-180' : 'rotate-0'
                            }`} />
                        </button>
                      </div>

                      {/* Dropdown Menu (เหมือนเดิม) */}
                      {isExamSetDropdownOpen && (
                        <div className="absolute left-0 mt-2 w-56 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none z-50">
                          {item.submenu.map((subItem) => (
                            <Link
                              key={subItem.href}
                              href={subItem.href}
                              onClick={() => setIsExamSetDropdownOpen(false)}
                              className={`block px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 transition-colors ${isActive(subItem.href) ? 'font-semibold text-green-700' : ''
                                }`}
                            >
                              {subItem.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-md px-2 xl:px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive(item.href) ? "buttonact text-white shadow-md" : "text-white hover:bg-white/10 hover:text-white"
                        }`}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                    >
                      {item.label}
                    </Link>
                  )
                ))}
              </div>
            </div>

          </div>

          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-4 md:ml-6 sm:pr-0 space-x-2 sm:space-x-3">
            {/* Notification dropdown wrapper */}
            <div className="relative" ref={notificationRef}>

              {/* ปุ่มเปิด/ปิด Notification (ไอคอนกระดิ่ง) */}
              <button
                type="button"
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative rounded-full p-1.5 sm:p-2 text-green-200  hover:bg-white/10 hover:text-white focus:outline-2 focus:outline-offset-2 focus:outline-green-300 transition-all duration-200 group
              "
              >
                <span className="absolute -inset-1.5"></span>
                <span className="sr-only">View notifications</span>
                <Bell className="size-4 sm:size-5 group-hover:scale-110 transition-transform" />

                {/* ป้ายจำนวน Notification ที่ยังไม่อ่าน */}
                {unreadCount > 0 && (
                  <span
                    className="absolute -top-0.5 -right-0.5 min-w-[1.125rem] sm:min-w-[1.25rem] h-4 sm:h-5  bg-red-500 text-white text-[10px] sm:text-xs rounded-full flex items-center justify-center px-1 animate-pulse font-medium"
                  >
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* ส่วนของ Dropdown ที่จะแสดงเมื่อ isNotificationOpen เป็น true */}
              {isNotificationOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 w-80 sm:w-96 md:w-[28rem] origin-top-right rounded-xl bg-white shadow-2xl ring-1 ring-black/5 max-h-[calc(100vh-5rem)] overflow-hidden flex flex-col"
                >
                  {/* Header ของ Dropdown */}
                  <div className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-t-xl border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h3 className="text-gray-700 font-semibold text-sm sm:text-base flex items-center">
                        <Bell className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1.5 sm:mr-2" />
                        การแจ้งเตือน
                      </h3>
                      {unreadCount > 0 && (
                        <span className="bg-green-100 text-green-700 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full font-medium">
                          {unreadCount} ใหม่
                        </span>
                      )}
                    </div>
                  </div>

                  {/* รายการ Notifications */}
                  <div className="overflow-y-auto max-h-80 sm:max-h-96 flex-1">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => {
                        const IconComponent = notification.icon;
                        return (
                          <Link
                            key={notification.id}
                            href={notification.link}
                            onClick={() => setIsNotificationOpen(false)}
                            className={`block border-b border-gray-100  hover:bg-gray-50 transition-colors ${notification.unread ? 'bg-blue-50/50' : ''}`}
                          >
                            <div className="px-3 sm:px-4 py-2.5 sm:py-3">
                              <div className="flex items-start space-x-2 sm:space-x-3">
                                {/* ไอคอน */}
                                <div className={`flex-shrink-0 w-8 sm:w-10 h-8 sm:h-10 ${notification.bgColor} rounded-lg flex items-center justify-center`}>
                                  <IconComponent className={`w-4 sm:w-5 h-4 sm:h-5 ${notification.iconColor}`} />
                                </div>
                                {/* เนื้อหา */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between">
                                    <p className="font-medium text-gray-900 text-xs sm:text-sm">{notification.title}</p>
                                    {notification.unread && <span className="ml-2 w-1.5 sm:w-2 h-1.5 sm:h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>}
                                  </div>
                                  <p className="text-xs sm:text-sm text-gray-600 mt-0.5 sm:mt-1 line-clamp-2">{notification.message}</p>
                                  <p className="text-[10px] sm:text-xs text-gray-400 mt-1 sm:mt-2 flex items-center">
                                    <Clock className="w-2.5 sm:w-3 h-2.5 sm:h-3 mr-0.5 sm:mr-1" />
                                    {notification.time}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </Link>
                        );
                      })
                    ) : (
                      // กรณีไม่มี Notifications
                      <div className="px-4 py-8 text-center text-gray-500">
                        <Bell className="w-10 sm:w-12 h-10 sm:h-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-sm">ไม่มีการแจ้งเตือน</p>
                      </div>
                    )}
                  </div>

                  {/* Footer ของ Dropdown */}
                  <div className="bg-gray-50 px-3 sm:px-4 py-2 sm:py-3 rounded-b-xl border-t border-gray-100">
                    <button className="w-full text-center text-xs sm:text-sm text-green-600 hover:text-green-700 font-medium transition-colors" onClick={() => setIsNotificationOpen(false)}>
                      ดูการแจ้งเตือนทั้งหมด
                    </button>
                  </div>
                </div>
              )}


            </div>
            {/* Profile dropdown wrapper */}
            <div className="relative" ref={profileDropdownRef}>

              {/* ปุ่มเปิด/ปิด Profile Menu (ไอคอนรูปคน) */}
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="relative flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-300 transition-all duration-200 hover:scale-105"
              >
                <span className="absolute -inset-1.5"></span>
                <span className="sr-only">Open user menu</span>
                <div className="size-7 sm:size-8 rounded-full bg-white flex items-center justify-center shadow-md hover:shadow-lg transition-all duration-300">
                  <User className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-green-600" />
                </div>
              </button>

              {/* ส่วนของ Dropdown ที่จะแสดงเมื่อ isProfileDropdownOpen เป็น true */}
              {isProfileDropdownOpen && (
                <div
                  className="absolute right-0 z-50 mt-2 w-52 sm:w-56 md:w-60 origin-top-right rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5"
                >
                  {/* Header แสดงข้อมูลผู้ใช้ */}
                  <div className="px-3 sm:px-4 py-2 sm:py-3 border-b border-gray-100 bg-green-50">
                    <p className="text-xs sm:text-sm font-medium text-green-800 truncate">นักศึกษาเภสัช</p>
                    <p className="text-[10px] sm:text-xs text-green-600 truncate">student@pharmacy.ac.th</p>
                  </div>

                  {/* รายการเมนู */}
                  <div className="py-1">
                    <Link
                      href="/user/profile"
                      className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <User className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2 sm:mr-3 text-gray-600" />
                      โปรไฟล์ของฉัน
                    </Link>
                     
                     <Link
                      href="/user/saveblog"
                      className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <Bookmark className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2 sm:mr-3 text-gray-600" />
                      บันทึกแล้ว
                    </Link>
                   
                    <Link
                      href="/user/examhis"
                      className="flex items-center px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setIsProfileDropdownOpen(false)}
                    >
                      <History className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2 sm:mr-3 text-gray-600" />
                      ประวัติการทำข้อสอบ
                    </Link>
                  </div>

                  {/* เมนูออกจากระบบ */}
                  <div className="border-t border-gray-100">
                    <button
                      className="flex items-center w-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-red-600 hover:bg-red-50 transition-colors"
                      onClick={() => { setIsProfileDropdownOpen(false); }}
                    >
                      <LogOut className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-2 sm:mr-3" />
                      ออกจากระบบ
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* --- START: แก้ไข Mobile & Tablet menu ให้เป็นแบบ Toggle --- */}
      <div className={`lg:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'block' : 'hidden'
        }`}>
        <div className="mobilenav space-y-1 px-2 pt-2 pb-3 backdrop-blur-sm">
          {navItems.slice(1).map((item) => (
            item.submenu ? (
              <div key={item.label}>

                <div
                  className={`flex w-full items-center justify-between rounded-md text-left text-sm sm:text-base font-medium transition-colors duration-200 ${isActive(item.href, true)
                    ? "buttonact text-white shadow-md"
                    : "text-white hover:bg-white/10 hover:text-white"
                    }`}
                >
                  <Link
                    href={item.href}
                    className="flex-grow px-3 py-2.5"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <span>{item.label}</span>
                  </Link>

                  <button
                    onClick={() => setMobileSubmenuOpen(!mobileSubmenuOpen)}
                    className="px-3 py-2.5"
                    aria-label="เปิดเมนูย่อยคลังข้อสอบ"
                  >
                    <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${mobileSubmenuOpen ? 'rotate-180' : 'rotate-0'}`} />
                  </button>
                </div>

                <div
                  className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${mobileSubmenuOpen ? 'max-h-96' : 'max-h-0'
                    }`}
                >
                  <div className="mt-1 ml-4 space-y-1 border-l-3 border-green-700/20 pl-2 pt-1 pb-2">
                    {item.submenu.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`block rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${isActive(subItem.href)
                          ? "buttonact text-white"
                          : "text-white hover:bg-white/10 hover:text-white"
                          }`}
                        aria-current={isActive(subItem.href) ? 'page' : undefined}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {subItem.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2.5 text-sm sm:text-base font-medium transition-colors duration-200 ${isActive(item.href)
                  ? "buttonact text-white shadow-md"
                  : "text-white hover:bg-white/10 hover:text-white"
                  }`}
                aria-current={isActive(item.href) ? 'page' : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
              >
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