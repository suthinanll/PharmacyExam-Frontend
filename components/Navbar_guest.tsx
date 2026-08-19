"use client";
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import {
  LogIn,
  ChevronDown,
  UserPlus,
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
      // หน้า คลังข้อสอบ เปิดให้ guest ดูได้ แต่ทำข้อสอบต้อง login
      submenu: [
        { href: '/user/cat-exam', label: 'ข้อสอบแบบ CAT (Cumputerized-Adaptive-Testing)', protected: true },
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

          {/* Logo + Desktop nav */}
          <div className="flex flex-1 items-center justify-center lg:items-stretch lg:justify-start">
            <div className="flex shrink-0 items-center">
              <Link href="/" className="flex items-center space-x-2 group">
                <span className="text-base sm:text-lg md:text-xl font-medium text-white group-hover:text-green-100 transition-colors">
                  เภสัชพร้อมสอบ
                </span>
              </Link>
            </div>

            <div className="hidden lg:ml-6 lg:block">
              <div className="flex space-x-1 xl:space-x-2">
                {navItems.map((item) => (
                  item.submenu ? (
                    <div key={item.label} className="relative group" ref={examSetDropdownRef}>
                      <div className={`flex items-center rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive(item.href, true) ? "buttonact text-white shadow-md" : "text-white hover:bg-white/10 hover:text-white"}`}>
                        <Link href={item.href} className="pl-2 xl:pl-3 pr-1 py-2 rounded-l-md cursor-pointer">
                          {item.label}
                        </Link>
                        <button onClick={() => setIsExamSetDropdownOpen(prev => !prev)} className="p-2 rounded-r-md">
                          <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isExamSetDropdownOpen ? 'rotate-180' : 'rotate-0'}`} />
                        </button>
                      </div>
                      {isExamSetDropdownOpen && (
                        <div className="absolute left-0 mt-2 w-56 origin-top-left rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 z-50">
                          {item.submenu.map((subItem) => (
                            subItem.protected ? (
                              <button key={subItem.href} onClick={(e) => handleProtectedClick(e, subItem.label)}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 transition-colors cursor-pointer">
                                {subItem.label}
                              </button>
                            ) : (
                              <Link key={subItem.href} href={subItem.href}
                                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 transition-colors">
                                {subItem.label}
                              </Link>
                            )
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    item.protected ? (
                      <button key={item.label} onClick={(e) => handleProtectedClick(e, item.label)}
                        className={`rounded-md px-2 xl:px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap cursor-pointer ${isActive(item.href) ? "buttonact text-white shadow-md" : "text-white hover:bg-white/10 hover:text-white"}`}>
                        {item.label}
                      </button>
                    ) : (
                      <Link key={item.href} href={item.href}
                        className={`rounded-md px-2 xl:px-3 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${isActive(item.href) ? "buttonact text-white shadow-md" : "text-white hover:bg-white/10 hover:text-white"}`}
                        aria-current={isActive(item.href) ? 'page' : undefined}>
                        {item.label}
                      </Link>
                    )
                  )
                ))}
              </div>
            </div>
          </div>

          {/* Right: Sign in / Register (หรือไปหน้าผู้ใช้ถ้า login แล้ว) */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-4 md:ml-6 sm:pr-0 space-x-2">
            {isAuthenticated ? (
              <Link
                href={user?.role_id === 2 ? "/admin" : "/user"}
                className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 text-sm font-semibold text-green-700 bg-white rounded-xl shadow-md hover:shadow-lg hover:bg-green-50 transition-all duration-200"
              >
                <LogIn size={16} />
                ไปยังหน้าผู้ใช้
              </Link>
            ) : (
              <>
                <Link
                  href="/register"
                  className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-white border border-white/40 rounded-xl hover:bg-white/10 transition-all duration-200"
                >
                  <UserPlus size={16} />
                  สมัครสมาชิก
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1.5 px-4 sm:px-5 py-2 text-sm font-semibold text-green-700 bg-white rounded-xl shadow-md hover:shadow-lg hover:bg-green-50 transition-all duration-200"
                >
                  <LogIn size={16} />
                  เข้าสู่ระบบ
                </Link>
              </>
            )}
          </div>

        </div>
      </div>

      {/* Mobile menu */}
      <div className={`lg:hidden transition-all duration-300 ease-in-out ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
        <div className="mobilenav space-y-1 px-2 pt-2 pb-3 backdrop-blur-sm">
          {navItems.map((item) => (
            item.submenu ? (
              <div key={item.label}>
                <div className={`flex w-full items-center justify-between rounded-md text-left text-sm sm:text-base font-medium transition-colors duration-200 ${isActive(item.href, true) ? "buttonact text-white shadow-md" : "text-white hover:bg-white/10 hover:text-white"}`}>
                  <Link href={item.href} onClick={() => setIsMobileMenuOpen(false)} className="flex-grow px-3 py-2.5 text-left cursor-pointer">
                    <span>{item.label}</span>
                  </Link>
                  <button onClick={() => setMobileSubmenuOpen(!mobileSubmenuOpen)} className="px-3 py-2.5" aria-label="เปิดเมนูย่อยคลังข้อสอบ">
                    <ChevronDown className={`h-5 w-5 transition-transform duration-300 ${mobileSubmenuOpen ? 'rotate-180' : 'rotate-0'}`} />
                  </button>
                </div>
                <div className={`overflow-hidden transition-[max-height] duration-500 ease-in-out ${mobileSubmenuOpen ? 'max-h-96' : 'max-h-0'}`}>
                  <div className="mt-1 ml-4 space-y-1 border-l-3 border-green-700/20 pl-2 pt-1 pb-2">
                    {item.submenu.map((subItem) => (
                      subItem.protected ? (
                        <button key={subItem.href} onClick={(e) => { handleProtectedClick(e, subItem.label); setIsMobileMenuOpen(false); }}
                          className="block w-full text-left rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 text-white hover:bg-white/10 cursor-pointer">
                          {subItem.label}
                        </button>
                      ) : (
                        <Link key={subItem.href} href={subItem.href} onClick={() => setIsMobileMenuOpen(false)}
                          className="block w-full text-left rounded-md px-3 py-2 text-sm font-medium transition-colors duration-200 text-white hover:bg-white/10 cursor-pointer">
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
                href={user?.role_id === 2 ? "/admin" : "/user"}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-green-700 bg-white rounded-xl shadow-md"
              >
                <LogIn size={16} />
                ไปยังหน้าผู้ใช้
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-green-700 bg-white rounded-xl shadow-md"
                >
                  <LogIn size={16} />
                  เข้าสู่ระบบ
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-white border border-white/40 rounded-xl"
                >
                  <UserPlus size={16} />
                  สมัครสมาชิก
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
