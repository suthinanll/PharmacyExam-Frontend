"use client";

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Menu, X, User, LogOut } from 'lucide-react'; 
import Link from 'next/link'; 
import React from 'react'; 

// Interface สำหรับ Props ของ LogoutConfirmationModal
interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

// Component สำหรับ Logout Confirmation Modal
const LogoutConfirmationModal = ({ isOpen, onClose, onConfirm }: LogoutModalProps) => {
  if (!isOpen) return null;

  return (
    // ใช้ bg-black/60 เพื่อให้พื้นหลังเข้มขึ้น และมั่นใจว่า Opacity ทำงาน
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
        
        {/* แก้ไข: ใช้ justify-center เพื่อให้ปุ่มอยู่ตรงกลาง */}
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
          >
            ออกจากระบบ
          </button>
        </div>
      </div>
    </div>
  );
};


export default function Navbar_admin({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false); 
  const pathname = usePathname();

  const sidebarItems = [
    { title: 'คลังข้อสอบ', href: '/admin/manage_examset' },
    { title: 'ปฏิทินกำหนดการ', href: '/admin/manage_calendar' },
    { title: 'บล็อกข่าวสาร', href: '/admin/mnblog' }
  ];

  const settingsItems = [
    { title: 'ประวัติการสนทนาแชตบอต', href: '/admin/chatlog' },
    { title: 'การตั้งค่า', href: '/settings' },
  ];

  /**
   * ตรวจสอบว่าเมนูควร Active หรือไม่ โดยใช้ startsWith เพื่อรองรับ Sub-paths 
   * เช่น: href='/admin/manage_calendar' จะ Active เมื่อ pathname เป็น 
   * '/admin/manage_calendar' หรือ '/admin/manage_calendar/edit/123'
   */
  const isActive = (href: string) => {
    // กำหนดให้ Path ที่ลงท้ายด้วยชื่อเมนูเป็น Base Path ที่จะ Active
    // ตัวอย่าง: href='/admin/manage_calendar'
    if (href === '/') {
        return pathname === href; 
    }
    
    // ตรวจสอบว่า pathname ปัจจุบัน "เริ่มต้นด้วย" href หรือไม่
    // และเพิ่มการตรวจสอบพิเศษสำหรับ Link ที่เป็น /settings หรือ /profile 
    // เพื่อไม่ให้ active ผิดเมื่อมี path อื่นที่บังเอิญเริ่มด้วยข้อความเดียวกัน
    if (href === '/settings' || href === '/profile') {
        return pathname === href; // สำหรับเมนูที่ไม่ต้องการให้ Active กับ Sub-path ให้ใช้ ===
    }

    return pathname.startsWith(href);
  };

  const handleConfirmLogout = () => {
    setIsLogoutModalOpen(false);
    // ** LOGOUT LOGIC HERE **
    console.log("User is logging out...");
    // window.location.href = '/login'; 
  };

  const handleLogoutClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
      event.preventDefault(); 
      setIsLogoutModalOpen(true);
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false); 
      }
  };


  return (
    <div className="flex h-screen bg-gray-50">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col w-64 xl:w-72 bg-white border-r border-gray-200 fixed h-full">
        {/* Logo */}
        <div className="p-4 sm:p-5 lg:p-6 border-b border-gray-200">
          <Link href="/admin/homeadmin" className="block hover:opacity-80 transition-opacity">
            <h1 className="text-lg sm:text-xl font-semibold text-green-700">
              เภสัชพร้อมสอบ
            </h1>
          </Link>
        </div>

        {/* Main Menu */}
        <nav className="flex-1 p-3 sm:p-4 overflow-y-auto navadmin">
          <div className="space-y-1 sm:space-y-2">
            {sidebarItems.map((item, index) => (
              <Link
                key={index}
                href={item.href}
                className={`block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 text-sm sm:text-base ${
                  isActive(item.href)
                    ? 'bg-green-50 text-green-700 font-medium border-l-4 border-green-700 '
                    : 'text-green-600 hover:bg-gray-50 hover:text-green-700'
                }`}
              >
                {item.title}
              </Link>
            ))}
          </div>

          {/* Settings Section */}
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-200">
            <div className="space-y-1 sm:space-y-2">
              {settingsItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className={`block w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 text-sm sm:text-base ${
                    isActive(item.href)
                      ? 'bg-green-50 text-green-700 font-medium border-l-4 border-green-700'
                      : 'text-green-600 hover:bg-gray-50 hover:text-green-700'
                  }`}
                >
                  {item.title}
                </Link>
              ))}
              
              {/* Logout Link (Desktop) - เพิ่ม ICON */}
              <a
                href="#" 
                onClick={handleLogoutClick}
                // ใช้ flex และ space-x-2 เพื่อจัด Icon กับข้อความ
                className="flex items-center space-x-2 w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 text-sm sm:text-base text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                <span>ออกจากระบบ</span>
              </a>
            </div>
          </div>
        </nav>

        {/* User Profile - Bottom */}
        <div className="p-3 sm:p-4 border-t border-gray-200">
          <Link 
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
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-64 xl:ml-72">
        {/* Top Navbar - Mobile & Tablet */}
        <header className="lg:hidden bg-white shadow-md sticky top-0 z-40">
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
            <Link href="/admin/homeadmin" className="hover:opacity-80 transition-opacity">
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
                {isMobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="border-t border-gray-200 bg-white max-h-[calc(100vh-64px)] overflow-y-auto">
              <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-1">
                {sidebarItems.map((item, index) => (
                  <Link
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
                  </Link>
                ))}

                <div className="pt-3 sm:pt-4 border-t border-gray-200 mt-3 sm:mt-4 space-y-1">
                  {settingsItems.map((item, index) => (
                    <Link
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
                    </Link>
                  ))}
                  
                  {/* Logout Link (Mobile) - เพิ่ม ICON */}
                  <a
                    href="#" 
                    onClick={handleLogoutClick}
                    // ใช้ flex และ space-x-2 เพื่อจัด Icon กับข้อความ
                    className="flex items-center space-x-2 w-full text-left px-3 sm:px-4 py-2.5 sm:py-3 transition-all duration-200 text-sm sm:text-base text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <LogOut className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                    <span>ออกจากระบบ</span>
                  </a>
                </div>

                <div className="pt-3 sm:pt-4 border-t border-gray-200 mt-3 sm:mt-4">
                  <Link 
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
                  </Link>
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

      {/* Logout Modal Component */}
      <LogoutConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  );
}