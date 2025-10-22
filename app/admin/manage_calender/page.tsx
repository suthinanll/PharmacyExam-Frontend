"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";

function Page() {
  const [currentMonth, setCurrentMonth] = useState(0); // มกราคม 2568
  const [activeTab, setActiveTab] = useState("calendar");

  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const daysOfWeek = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];

  // ตัวอย่างข้อมูลกิจกรรม
  const events = [
    {
      id: 1,
      title: "สอบกลางภาคเรียนที่ 1 ปีการศึกษา 2568",
      startDate: "27",
      endDate: "29",
      month: 0,
      color: "bg-yellow-200"
    }
  ];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const year = 2568;
  const daysInMonth = getDaysInMonth(currentMonth, year - 543);
  const firstDay = getFirstDayOfMonth(currentMonth, year - 543);

  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => (prev === 0 ? 11 : prev - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => (prev === 11 ? 0 : prev + 1));
  };

  const renderCalendarDays = () => {
    const days = [];
    const prevMonthDays = getDaysInMonth(currentMonth - 1, year - 543);

    // วันเดือนก่อนหน้า
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} className="p-3 sm:p-4 text-center text-gray-400 bg-gray-50 min-h-[80px] sm:min-h-[100px]">
          {prevMonthDays - i}
        </div>
      );
    }
    // วันในเดือนปัจจุบัน
    for (let day = 1; day <= daysInMonth; day++) {
      const hasEvent = events.some(
        (event) =>
          event.month === currentMonth &&
          day >= parseInt(event.startDate) &&
          day <= parseInt(event.endDate)
      );

      const event = events.find(
        (e) => e.month === currentMonth && day >= parseInt(e.startDate) && day <= parseInt(e.endDate)
      );

      days.push(
        <div
          key={day}
          className={`p-3 sm:p-4 text-center border border-gray-200 min-h-[80px] sm:min-h-[100px] hover:bg-gray-50 transition-colors cursor-pointer ${hasEvent ? event?.color : "bg-white"
            }`}
        >
          <div className="font-medium text-gray-700 text-sm sm:text-base">{day}</div>
          {hasEvent && event && (
            <div className="mt-2 text-xs text-gray-700 font-medium line-clamp-2">
              {event.title}
            </div>
          )}
        </div>
      );
    }

    // วันเดือนถัดไป
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(
        <div key={`next-${day}`} className="p-3 sm:p-4 text-center text-gray-400 bg-gray-50 min-h-[80px] sm:min-h-[100px]">
          {day}
        </div>
      );
    }

    return days;
  };

  return (
    <Navbar_admin>
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-2">
              ปฏิทินกำหนดการ
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              จัดการปฏิทินกำหนดการ เพิ่ม แก้ไข ลบ
            </p>
          </div>
          <button className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm">
            เพิ่มกำหนดการใหม่
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />

          </button>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab("calendar")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors relative ${activeTab === "calendar"
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs sm:text-sm ${activeTab === "calendar" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                  1
                </span>
                ปฏิทิน
              </button>
              <button
                onClick={() => setActiveTab("list")}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3 sm:py-4 text-sm sm:text-base font-medium transition-colors relative ${activeTab === "list"
                    ? "text-green-600 border-b-2 border-green-600"
                    : "text-gray-600 hover:text-gray-900"
                  }`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs sm:text-sm ${activeTab === "list" ? "bg-green-600 text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                  2
                </span>
                รายการกำหนดการ
              </button>
            </div>
          </div>
        </div>

        {/* Calendar Section */}
        {activeTab === "calendar" && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            {/* Month Navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </button>
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                {months[currentMonth]} {year}
              </h2>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="เดือนถัดไป"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-600" />
              </button>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
                {/* Days of Week Header */}
                <div className="grid grid-cols-7 gap-0 mb-2">
                  {daysOfWeek.map((day, index) => (
                    <div
                      key={index}
                      className="p-3 sm:p-4 text-center font-semibold text-gray-700 bg-gray-50 text-xs sm:text-sm"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Days */}
                <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-200">
                  {renderCalendarDays()}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* List View Section */}
        {activeTab === "list" && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
            <div className="space-y-4">
              {events.map((event) => (
                <div
                  key={event.id}
                  className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                        {event.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600">
                        {event.startDate} - {event.endDate} {months[event.month]} {year}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        แก้ไข
                      </button>
                      <button className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Navbar_admin>
  );
}

export default Page;