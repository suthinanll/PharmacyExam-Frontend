"use client";

import Navbar_admin from "@/components/Navbar_admin";
import Link from "next/link";
import { ChevronLeft,Save } from "lucide-react";
import { useState } from "react";

function CreateExamPage() {
  const [status, setStatus] = useState("เปิดให้ทำข้อสอบ");

  // State for other form fields (optional but good practice)
  const [examName, setExamName] = useState("Cardiovascular disorder");
  const [description, setDescription] = useState("ความผิดปกติของหัวใจและหลอดเลือด");
  const [timeLimit, setTimeLimit] = useState("60 นาที");
  const [totalQuestions, setTotalQuestions] = useState("120 ข้อ");
  const [answerFile] = useState("Cardiovascular_disorder_answers.pdf");


  const handleSaveSettings = (e: { preventDefault: () => void; }) => {
    e.preventDefault();
    console.log("Saving settings...");
  };

  return (
    <Navbar_admin>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        {/* Header Section */}
        <div className="mb-8 pb-4">
          <Link
            href="/admin/manage_examset/examedit"
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">กลับ</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">
            การตั้งค่าข้อสอบ
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            แก้ไขชื่อข้อสอบ คำอธิบายและเวลาทำข้อสอบ
          </p>
        </div>

        {/* Exam Settings Form */}
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-2xl">
          {/* ชื่อข้อสอบ (Exam Name) */}
          <div>
            <label htmlFor="exam-name" className="block text-sm font-medium text-gray-700 mb-1">
              ชื่อข้อสอบ
            </label>
            <input
              type="text"
              id="exam-name"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="Cardiovascular disorder"
            />
          </div>

          {/* คำอธิบาย (Description) */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              คำอธิบาย
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-green-500 focus:border-green-500 sm:text-sm"
              placeholder="ความผิดปกติของหัวใจและหลอดเลือด"
            ></textarea>
          </div>

          {/* เวลาทำข้อสอบ และ จำนวนข้อ (Time Limit and Total Questions) */}
          <div className="flex space-x-4">
            <div className="flex-1">
              <label htmlFor="time-limit" className="block text-sm font-medium text-gray-700 mb-1">
                เวลาทำข้อสอบ
              </label>
              <input
                type="text"
                id="time-limit"
                value={timeLimit}
                onChange={(e) => setTimeLimit(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="60 นาที"
              />
            </div>
            <div className="flex-1">
              <label htmlFor="total-questions" className="block text-sm font-medium text-gray-700 mb-1">
                จำนวนข้อ
              </label>
              <input
                type="text"
                id="total-questions"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2.5 focus:ring-green-500 focus:border-green-500 sm:text-sm"
                placeholder="120 ข้อ"
              />
            </div>
          </div>
          <div>
            <label htmlFor="answer-file" className="block text-sm font-medium text-gray-700 mb-1">
              ไฟล์เฉลยข้อสอบ
            </label>
            <div className="flex items-center border border-gray-300 rounded-md shadow-sm p-2.5 bg-gray-50">
              <span className="text-gray-500 mr-2">
                {/* Placeholder icon for a file */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                </svg>
              </span>
              <span className="text-sm text-gray-900 truncate">{answerFile}</span>
            </div>
          </div>

          {/* สถานะข้อสอบ (Exam Status) - The requested dropdown structure */}
          <div className="space-y-3 pt-4">
            <label htmlFor="exam-status" className="block text-sm font-medium text-gray-700">
              สถานะข้อสอบ
            </label>
            {/* Dropdown component */}
            <select
              id="exam-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="mt-1 block w-full max-w-xs pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm rounded-md shadow-sm"
            >
              <option value="เปิดให้ทำข้อสอบ">เปิดให้ทำข้อสอบ</option>
              <option value="ปิดให้ทำข้อสอบ">ปิดให้ทำข้อสอบ</option>
              {/* You can add more status options here if needed */}
            </select>

            
          </div>

          {/* Save Button */}
          <div className="pt-6">
            <button
              type="submit"
              className="inline-flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              
              <Save className="w-5 h-5 mr-2" /> บันทึกการตั้งค่า
            </button>
          </div>
        </form>
      </div>
    </Navbar_admin>
  );
}

export default CreateExamPage;