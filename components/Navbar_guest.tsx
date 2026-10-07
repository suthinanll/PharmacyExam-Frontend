"use client";
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LogIn,
  ChevronDown,
  UserPlus,
  BookOpen,
  Zap,
  Lock,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRequireLogin } from '@/utils/requireAuth';

const NavbarGuest = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isExamSetDropdownOpen, setIsExamSetDropdownOpen] = useState(false);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState(false);

  const pathname = usePathname();
  const examSetDropdownRef = useRef<HTMLDivElement>(null);

  const { user, isAuthenticated } = useAuth();
  const { requireLogin } = useRequireLogin();

  const navItems = [
    { href: '/', label: 'หน้าหลัก' },
    {
      href: '/user/examset',
      label: 'คลังข้อสอบ',
      submenu: [
        { href: '/user/examset', label: 'ชุดข้อสอบมาตรฐาน (Standard Exam)' },
        { href: '/user/cat-exam', label: 'ข้อสอบแบบปรับเหมาะรายข้อ (CAT)', protected: true },
      ],
    },
    { href: '/user/calendar', label: 'ปฏิทินการสอบ' },
    { href: '/user/chatbot', label: 'แชตบอตผู้ช่วย', protected: true },
    { href: '/user/followup', label: 'ติดตามความคืบหน้า', protected: true },
  ];

  const isActive = (path: string, hasSubmenu = false) => {
    if (path === '/') return false;
    if (hasSubmenu) return pathname.startsWith(path);
    return pathname === path;
  };

  const handleProtectedClick = (e: React.MouseEvent, label: string) => {
    e.preventDefault();
    requireLogin(label);
  };

  // Click outside เพื่อปิด dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (examSetDropdownRef.current && !examSetDropdownRef.current.contains(event.target as Node)) {
        setIsExamSetDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) setMobileSubmenuOpen(false);
  }, [isMobileMenuOpen]);

  // ถ้า login แล้ว redirect ไปหน้า user ให้อัตโนมัติ (เยี่ยมชมหน้าแรกไม่ต้อง)
  // (ไม่ redirect เพื่อให้กลับมาดูหน้าแรกได้ แต่ปุ่มกดจะพาไปหน้า user)

  return (
    <nav className="shadow-lg bg-[rgba(118,178,90,1)] sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-2 sm:px-4 md:px-6 lg:px-8">
        <div className="relative flex h-14 sm:h-16 items-center justify-between">

          {/* Mobile hamburger */}
          <div className="absolute inset-y-0 left-0 flex items-center xl:hidden">
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

          {/* Logo + Desktop nav */}
          <div className="flex flex-1 items-center justify-center xl:items-stretch xl:justify-start">
            <div className="flex shrink-0 items-center">
              <Link href="/" className="flex items-center space-x-2 group">
                <span className="text-base sm:text-lg md:text-xl font-medium text-white group-hover:text-green-100 transition-colors">
                  เภสัชพร้อมสอบ
                </span>
              </Link>
            </div>

            <div className="hidden xl:ml-8 xl:block">
              <div className="flex space-x-1.5 xl:space-x-2">
                {navItems.map((item) => (
                  item.submenu ? (
                    <div key={item.label} className="relative" ref={examSetDropdownRef}>
                      <button
                        type="button"
                        onClick={() => setIsExamSetDropdownOpen(prev => !prev)}
                        className={`flex items-center gap-1.5 rounded-lg px-2.5 xl:px-3 py-2 text-lg font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${
                          isActive(item.href, true)
                            ? "buttonact text-white shadow-lg"
                            : "text-white hover:bg-white/20 hover:text-white"
                        }`}
                        aria-expanded={isExamSetDropdownOpen}
                      >
                        <span>{item.label}</span>
                        <ChevronDown
                          className={`h-4 w-4 transition-transform duration-200 ${
                            isExamSetDropdownOpen ? "rotate-180" : "rotate-0"
                          }`}
                        />
                      </button>
                      {isExamSetDropdownOpen && (
                        <div className="absolute left-0 mt-2 w-72 origin-top-left rounded-2xl bg-white p-2 shadow-2xl ring-1 ring-black/10 z-50 transition-all duration-200">
                          {item.submenu.map((subItem) => {
                            const active = isActive(subItem.href);
                            const isCAT = subItem.href.includes("cat-exam");
                            return subItem.protected ? (
                              <button
                                key={subItem.href}
                                onClick={(e) => {
                                  handleProtectedClick(e, subItem.label);
                                  setIsExamSetDropdownOpen(false);
                                }}
                                className="flex items-start gap-3 w-full text-left p-3 rounded-xl transition-colors duration-150 text-gray-700 hover:bg-green-50/60 hover:text-green-800 cursor-pointer"
                              >
                                {/* ใน <button> ใส่ได้แค่ phrasing content จึงใช้ <span> แทน <div> (เติม block ให้จัดวางเหมือนเดิม) */}
                                <span className="block p-2 rounded-lg mt-0.5 shrink-0 bg-green-100/80 text-green-700">
                                  {isCAT ? <Zap className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                                </span>
                                <span className="block min-w-0 flex-1">
                                  <span className="flex items-center justify-between gap-1">
                                    <span className="text-sm font-medium leading-tight">{subItem.label}</span>
                                    <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                                  </span>
                                  <span className="block text-xs text-gray-500 mt-1 leading-snug">
                                    {isCAT ? "ทดสอบแบบปรับเหมาะตามความสามารถ" : "ฝึกทำชุดข้อสอบตามหมวดหมู่วิชา"}
                                  </span>
                                </span>
                              </button>
                            ) : (
                              <Link
                                key={subItem.href}
                                href={subItem.href}
                                onClick={() => setIsExamSetDropdownOpen(false)}
                                className={`flex items-start gap-3 p-3 rounded-xl transition-colors duration-150 ${
                                  active
                                    ? "bg-green-50 text-green-900 font-medium"
                                    : "text-gray-700 hover:bg-green-50/60 hover:text-green-800"
                                }`}
                              >
                                <div
                                  className={`p-2 rounded-lg mt-0.5 shrink-0 transition-colors ${
                                    active
                                      ? "bg-green-600 text-white shadow-sm"
                                      : "bg-green-100/80 text-green-700"
                                  }`}
                                >
                                  {isCAT ? <Zap className="w-4 h-4" /> : <BookOpen className="w-4 h-4" />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-sm font-medium leading-tight">{subItem.label}</div>
                                  <div className="text-xs text-gray-500 mt-1 leading-snug">
                                    {isCAT ? "ทดสอบแบบปรับเหมาะตามความสามารถ" : "ฝึกทำชุดข้อสอบตามหมวดหมู่วิชา"}
                                  </div>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ) : (
                    item.protected ? (
                      <button key={item.label} onClick={(e) => handleProtectedClick(e, item.label)}
                        className={`rounded-lg px-2.5 xl:px-3 py-2 text-lg font-medium transition-colors duration-200 whitespace-nowrap cursor-pointer ${isActive(item.href) ? "buttonact text-white shadow-lg" : "text-white hover:bg-white/20 hover:text-white"}`}>
                        {item.label}
                      </button>
                    ) : (
                      <Link key={item.href} href={item.href}
                        className={`rounded-lg px-2.5 xl:px-3 py-2 text-lg font-medium transition-colors duration-200 whitespace-nowrap ${isActive(item.href) ? "buttonact text-white shadow-lg" : "text-white hover:bg-white/20 hover:text-white"}`}
                        aria-current={isActive(item.href) ? 'page' : undefined}>
                        {item.label}
                      </Link>
                    )
                  )
                ))}
              </div>
            </div>
          </div>

          {/* Right: Sign in / Register (แสดงเฉพาะจอใหญ่ sm ขึ้นไป ในมือถืออยู่ใน Hamburger เมนู) */}
          <div className="hidden sm:flex items-center sm:ml-4 md:ml-6 space-x-2">
            {isAuthenticated ? (
              <Link
                href={user?.role_id === 2 || user?.role_id === 3 ? "/admin" : "/user"}
                className="inline-flex items-center gap-1.5 whitespace-nowrap px-4 sm:px-5 py-2 text-sm font-semibold text-green-700 bg-white rounded-xl shadow-md hover:shadow-lg hover:bg-green-50 transition-all duration-200"
              >
                <LogIn size={16} />
                ไปยังหน้าผู้ใช้
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 whitespace-nowrap px-4 py-2 text-sm font-medium text-white border border-white/40 rounded-xl hover:bg-white/10 transition-all duration-200"
                >
                  <LogIn size={16} />
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-1.5 whitespace-nowrap px-4 sm:px-5 py-2 text-sm font-medium text-green-700 bg-white rounded-xl shadow-md hover:shadow-lg hover:bg-green-50 transition-all duration-200"
                >
                  <UserPlus size={16} />
                  สมัครสมาชิก
                </Link>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Mobile menu */}
      <div className={`xl:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="mobilenav space-y-1 px-2 pt-2 pb-3 backdrop-blur-sm">
          {navItems.map((item) => (
            item.submenu ? (
              <div key={item.label} className="space-y-1">
                <button
                  type="button"
                  onClick={() => setMobileSubmenuOpen(!mobileSubmenuOpen)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm sm:text-base font-medium transition-colors duration-200 cursor-pointer ${
                    isActive(item.href, true)
                      ? "buttonact text-white shadow-md"
                      : "text-white hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{item.label}</span>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform duration-200 ${
                      mobileSubmenuOpen ? "rotate-180" : "rotate-0"
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ease-in-out ${
                    mobileSubmenuOpen ? "max-h-96" : "max-h-0"
                  }`}
                >
                  <div className="mt-1 ml-4 space-y-1 border-l-2 border-white/40 pl-2 pt-1 pb-2">
                    {item.submenu.map((subItem) => (
                      subItem.protected ? (
                        <button
                          key={subItem.href}
                          onClick={(e) => {
                            handleProtectedClick(e, subItem.label);
                            setIsMobileMenuOpen(false);
                          }}
                          className="flex items-center justify-between w-full text-left rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 text-white hover:bg-white/10 cursor-pointer"
                        >
                          <span>{subItem.label}</span>
                          <Lock className="w-3.5 h-3.5 text-yellow-200 shrink-0 ml-2" />
                        </button>
                      ) : (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className={`block w-full text-left rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 ${
                            isActive(subItem.href)
                              ? "bg-white/20 text-white font-semibold"
                              : "text-white hover:bg-white/10"
                          } cursor-pointer`}
                        >
                          {subItem.label}
                        </Link>
                      )
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              item.protected ? (
                <button key={item.label} onClick={(e) => { handleProtectedClick(e, item.label); setIsMobileMenuOpen(false); }}
                  className="block w-full text-left rounded-md px-3 py-2.5 text-sm sm:text-base font-medium transition-colors duration-200 text-white hover:bg-white/10 cursor-pointer">
                  {item.label}
                </button>
              ) : (
                <Link key={item.href} href={item.href}
                  className={`block rounded-md px-3 py-2.5 text-sm sm:text-base font-medium transition-colors duration-200 ${isActive(item.href) ? "buttonact text-white shadow-md" : "text-white hover:bg-white/10 hover:text-white"}`}
                  aria-current={isActive(item.href) ? 'page' : undefined}
                  onClick={() => setIsMobileMenuOpen(false)}>
                  {item.label}
                </Link>
              )
            )
          ))}

          {/* Mobile auth buttons */}
          <div className="flex flex-col gap-2 pt-2">
            {isAuthenticated ? (
              <Link
                href={user?.role_id === 2 || user?.role_id === 3 ? "/admin" : "/user"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-green-700 bg-white rounded-xl shadow-md"
              >
                <LogIn size={16} />
                ไปยังหน้าผู้ใช้
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-green-700 bg-white rounded-xl shadow-md"
                >

                  <UserPlus size={16} />
                  สมัครสมาชิก
                </Link>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white border border-white/40 rounded-xl"
                >
                  <LogIn size={16} />
                  เข้าสู่ระบบ
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default NavbarGuest;
