"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus, X, Calendar, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface CalendarEvent {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  month: number;
  color: string;
  file?: File | null;
}

function Page() {
  const [currentMonth, setCurrentMonth] = useState(0);
  const [activeTab, setActiveTab] = useState("calendar");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    file: null as File | null,
  });

  const months = [
    "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"
  ];

  const daysOfWeek = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];

  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: 1,
      title: "สอบกลางภาคเรียนที่ 1 ปีการศึกษา 2568",
      description: "การสอบกลางภาคเรียนสำหรับนักศึกษาชั้นปีที่ 1-4",
      startDate: "27",
      endDate: "29",
      month: 0,
      color: "bg-yellow-200",
    },
    {
      id: 2,
      title: "วันหยุดเทศกาลสงกรานต์",
      description: "วันหยุดประจำปีตามประเพณีไทย",
      startDate: "13",
      endDate: "15",
      month: 3,
      color: "bg-blue-200",
    },
  ]);

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

  const handleEditClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setEditFormData({
      title: event.title,
      description: event.description || "",
      startDate: `2025-${String(event.month + 1).padStart(2, '0')}-${String(event.startDate).padStart(2, '0')}`,
      endDate: `2025-${String(event.month + 1).padStart(2, '0')}-${String(event.endDate).padStart(2, '0')}`,
      file: event.file || null,
    });
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsDeleteModalOpen(true);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedEvent) {
      const updatedEvents = events.map((event) =>
        event.id === selectedEvent.id
          ? {
            ...event,
            title: editFormData.title,
            description: editFormData.description,
            startDate: editFormData.startDate.split('-')[2],
            endDate: editFormData.endDate.split('-')[2],
            month: parseInt(editFormData.startDate.split('-')[1]) - 1,
            file: editFormData.file,
          }
          : event
      );
      setEvents(updatedEvents);
      setIsEditModalOpen(false);
      setSelectedEvent(null);
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedEvent) {
      setEvents(events.filter((event) => event.id !== selectedEvent.id));
      setIsDeleteModalOpen(false);
      setSelectedEvent(null);
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    const prevMonthDays = getDaysInMonth(currentMonth - 1, year - 543);

    for (let i = firstDay - 1; i >= 0; i--) {
      days.push(
        <div key={`prev-${i}`} className="p-3 sm:p-4 text-center text-gray-400 bg-gray-50 min-h-[80px] sm:min-h-[100px]">
          {prevMonthDays - i}
        </div>
      );
    }

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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-2">
              ปฏิทินกำหนดการ
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              จัดการปฏิทินกำหนดการ เพิ่ม แก้ไข ลบ
            </p>
          </div>
          <Link
            href="/admin/calendar_add"
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg transition-colors font-medium text-sm sm:text-base shadow-sm"
          >
            เพิ่มกำหนดการใหม่
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          </Link>
        </div>

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

        {activeTab === "calendar" && (
          <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
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

            <div className="overflow-x-auto">
              <div className="min-w-[640px]">
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

                <div className="grid grid-cols-7 gap-0 border-t border-l border-gray-200">
                  {renderCalendarDays()}
                </div>
              </div>
            </div>
          </div>
        )}

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
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-2">{event.description}</p>
                      )}
                      <p className="text-sm sm:text-base text-gray-600">
                        {event.startDate} - {event.endDate} {months[event.month]} {year}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditClick(event)}
                        className="px-4 py-2 text-sm font-medium text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        แก้ไข
                      </button>
                      <button
                        onClick={() => handleDeleteClick(event)}
                        className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        ลบ
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {isEditModalOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">แก้ไขกำหนดการ</h2>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    ชื่อกำหนดการ <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    รายละเอียด
                  </label>
                  <textarea
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      วันที่เริ่มต้น <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={editFormData.startDate}
                        onChange={(e) => setEditFormData({ ...editFormData, startDate: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      วันที่สิ้นสุด <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        value={editFormData.endDate}
                        onChange={(e) => setEditFormData({ ...editFormData, endDate: e.target.value })}
                        min={editFormData.startDate}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        required
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                

                <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                  >
                    บันทึกการแก้ไข
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && selectedEvent && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">

            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>

                <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
                  ยืนยันการลบกำหนดการ
                </h2>

                <p className="text-gray-600 text-center mb-6">
                  คุณต้องการลบกำหนดการ &quot;{selectedEvent.title}&quot; ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium"
                  >
                    ยกเลิก
                  </button>
                  <button
                    onClick={handleDeleteConfirm}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium shadow-sm"
                  >
                    ลบกำหนดการ
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Navbar_admin>
  );
}

export default Page;