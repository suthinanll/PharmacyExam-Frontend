"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, User } from 'lucide-react';

export default function Navbar_admin({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const sidebarItems = [
    {
      title: 'คลังข้อสอบ',
      href: '/admin/manage_examset',
    },
    {
      title: 'ปฏิทินกำหนดการ',
      href: '/admin/manage_calendar',
    },
    {
      title: 'บล็อกข่าวสาร',
      href: '/admin/mnblog',
    }
  ];

  const settingsItems = [
    {
      title: 'ประวัติการสนทนาแชตบอต',
      href: '/chat-history',
    },
    {
      title: 'การตั้งค่า',
      href: '/settings',
    },
    {
      title: 'ออกจากระบบ',
      href: '/logout',
    }
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 xl:w-72 bg-white border-r border-gray-200 fixed h-full">
        {/* Logo */}
        <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200">
          <a href="/admin/homeadmin" className="block hover:opacity-80 transition-opacity">
            <h1 className="text-lg sm:text-xl font-semibold text-green-700">
              เภสัชพร้อมสอบ
            </h1>
          </a>
        </div>

        {/* Main Menu */}
        <nav className="flex-1 p-3 sm:p-4 overflow-y-auto navadmin">
          <div className="space-y-1 sm:space-y-2">
            {sidebarItems.map((item, index) => (
              <a
                key={index}
                href={item.href}
                className={`block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3  transition-all duration-200 text-sm sm:text-base ${
                  isActive(item.href)
                    ? 'bg-green-50 text-green-700 font-medium border-l-4 border-green-700 '
                    : 'text-green-600 hover:bg-gray-50 hover:text-green-700'
                }`}
              >
                {item.title}
              </a>
            ))}
          </div>

          {/* Settings Section */}
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
            <div className="space-y-1 sm:space-y-2">
              {settingsItems.map((item, index) => (
                <a
                  key={index}
                  href={item.href}
                  className={`block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all duration-200 text-sm sm:text-base ${
                    isActive(item.href)
                      ? 'bg-green-50 text-green-700 font-medium border-l-4 border-green-700'
                      : 'text-green-600 hover:bg-gray-50 hover:text-green-700'
                  }`}
                >
                  {item.title}
                </a>
              ))}
            </div>
          </div>
        </nav>

        {/* User Profile - Bottom */}
        <div className="p-3 sm:p-4 border-t border-gray-200">
          <a 
            href="/profile" 
            className={`flex items-center space-x-3 px-2 py-2 rounded-lg transition-all duration-200 ${
              isActive('/profile')
                ? 'bg-green-50'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-green-700 truncate">Admin</p>
              <p className="text-[10px] sm:text-xs text-green-600 truncate">admin@gmail.com</p>
            </div>
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64 xl:ml-72">
        {/* Top Navbar - Mobile & Tablet */}
        <header className="lg:hidden bg-white shadow-md sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <a href="/admin/homeadmin" className="hover:opacity-80 transition-opacity">
              <h1 className="text-base sm:text-lg md:text-xl font-semibold text-green-700">
                เภสัชพร้อมสอบ
              </h1>
            </a>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="border-t border-gray-200 bg-white max-h-[calc(100vh-64px)] overflow-y-auto">
              <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-1">
                {sidebarItems.map((item, index) => (
                  <a
                    key={index}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 text-sm sm:text-base ${
                      isActive(item.href)
                        ? 'bg-green-50 text-green-700 font-medium border-l-4 border-green-700 '
                        : 'text-green-600 hover:bg-gray-50 hover:text-green-700'
                    }`}
                  >
                    {item.title}
                  </a>
                ))}

                <div className="pt-3 sm:pt-4 border-t border-gray-200 mt-3 sm:mt-4 space-y-1">
                  {settingsItems.map((item, index) => (
                    <a
                      key={index}
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={`block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 text-sm sm:text-base ${
                        isActive(item.href)
                          ? 'bg-green-50 text-green-700 font-medium border-l-4 border-green-700 '
                          : 'text-green-600 hover:bg-gray-50 hover:text-green-700'
                      }`}
                    >
                      {item.title}
                    </a>
                  ))}
                </div>

                <div className="pt-3 sm:pt-4 border-t border-gray-200 mt-3 sm:mt-4">
                  <a 
                    href="/profile" 
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 sm:px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive('/profile')
                        ? 'bg-green-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-9 h-9 sm:w-10 sm:h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-green-700">Admin</p>
                      <p className="text-[10px] sm:text-xs text-green-600">admin@gmail.com</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-7 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}