/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import { useState } from 'react';
import Navbar from "@/components/Navbar_user";
import Footer from "@/components/Footer";
import { Calendar, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import Link from 'next/link';

interface ExamSchedule {
  id: string;
  title: string;
  date: string;
  time: string;
  description: string;
  category: 'ทฤษฎี' | 'ปฏิบัติ' | 'ทบทวน' | 'สอบจริง';
}

function Calender() {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([
    {
      id: '1',
      title: 'ทบทวนเภสัชเคมี',
      date: '2025-10-20',
      time: '09:00',
      description: 'ทบทวนบทที่ 1-5',
      category: 'ทบทวน'
    },
    {
      id: '2',
      title: 'สอบปฏิบัติการ',
      date: '2025-10-25',
      time: '13:00',
      description: 'สอบปฏิบัติการจ่ายยา',
      category: 'ปฏิบัติ'
    }
  ]);



  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const categoryColors = {
    'ทฤษฎี': 'bg-blue-100 text-blue-800 border-blue-300',
    'ปฏิบัติ': 'bg-green-100 text-green-800 border-green-300',
    'ทบทวน': 'bg-yellow-100 text-yellow-800 border-yellow-300',
    'สอบจริง': 'bg-red-100 text-red-800 border-red-300'
  };








  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month, 1).getDay();
  };

  const getSchedulesForDate = (date: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
    return schedules.filter(s => s.date === dateStr);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);
    const firstDay = getFirstDayOfMonth(selectedMonth, selectedYear);
    const days = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="min-h-24 border border-gray-200"></div>);
    }

    for (let date = 1; date <= daysInMonth; date++) {
      const daySchedules = getSchedulesForDate(date);
      days.push(
        <div key={date} className="min-h-24 border border-gray-200 p-2 bg-white hover:bg-gray-50">
          <div className="font-semibold text-gray-700 mb-1">{date}</div>
          <div className="space-y-1">
            {daySchedules.map(schedule => (
              <div
                key={schedule.id}
                className={`text-xs p-1 rounded border cursor-pointer ${categoryColors[schedule.category]}`}
                onClick={() => handleEdit(schedule)}
              >
                <div className="font-medium truncate">{schedule.time} {schedule.title}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  const monthNames = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
  ];



  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">

          <div className="flex items-center text-sm text-gray-500 mb-3 mt-3">
            <Link href="/user" className="hover:text-blue-600 cursor-pointer transition">
              หน้าหลัก
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-700 font-medium">ปฏิทินการสอบ</span>
          </div>
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    ปฏิทินการสอบ
                  </h1>

                </div>
              </div>

            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
            {/* Calendar */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <button
                    onClick={() => {
                      if (selectedMonth === 0) {
                        setSelectedMonth(11);
                        setSelectedYear(selectedYear - 1);
                      } else {
                        setSelectedMonth(selectedMonth - 1);
                      }
                    }}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    ◀
                  </button>
                  <h2 className="text-xl font-bold text-gray-800">
                    {monthNames[selectedMonth]} {selectedYear + 543}
                  </h2>
                  <button
                    onClick={() => {
                      if (selectedMonth === 11) {
                        setSelectedMonth(0);
                        setSelectedYear(selectedYear + 1);
                      } else {
                        setSelectedMonth(selectedMonth + 1);
                      }
                    }}
                    className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                  >
                    ▶
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-0 border border-gray-200">
                  {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                    <div key={day} className="bg-indigo-600 text-white font-semibold text-center py-3 border border-indigo-500">
                      {day}
                    </div>
                  ))}
                  {renderCalendar()}
                </div>

                <div className="flex gap-4 mt-4 flex-wrap">
                  {Object.entries(categoryColors).map(([category, colorClass]) => (
                    <div key={category} className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border ${colorClass}`}></div>
                      <span className="text-sm text-gray-700">{category}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
      <Footer />
    </>
  );
}

export default Calender;

function handleEdit(_schedule: ExamSchedule): void {
  throw new Error('Function not implemented.');
}
