"use client";

import Navbar_admin from "@/components/Navbar_admin";
import Link from "next/link";
import { ChevronLeft, Save, Upload } from "lucide-react"; 
import { useState } from "react"; 
function CreateExamPage() {
  const [examName, setExamName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState(""); // เป็น string เพื่อรองรับ input
  const [numQuestions, setNumQuestions] = useState(""); // เป็น string เพื่อรองรับ input
  const [examFile, setExamFile] = useState<File | null>(null); // สำหรับไฟล์ที่เลือก

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // 💡 ในส่วนนี้จะเป็น Logic สำหรับส่งข้อมูลไปยัง API
    console.log({
      examName,
      description,
      duration: parseInt(duration), // แปลงเป็นตัวเลขก่อนส่ง
      numQuestions: parseInt(numQuestions), // แปลงเป็นตัวเลขก่อนส่ง
      examFile,
    });
    alert("จำลอง: ข้อมูลข้อสอบถูกบันทึกแล้ว!");
    // คุณอาจต้องการรีเซ็ตฟอร์มหรือเปลี่ยนหน้าหลังจากบันทึก
    // setExamName('');
    // setDescription('');
    // setDuration('');
    // setNumQuestions('');
    // setExamFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setExamFile(e.target.files[0]);
    } else {
      setExamFile(null);
    }
  };


  return (
    <Navbar_admin>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="mb-8  pb-4">
          <Link
            href="/admin/manage_examset" 
            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">กลับ</span>
          </Link>

          <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">
            สร้างข้อสอบใหม่
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            กรอกรายละเอียดและอัปโหลดไฟล์ข้อสอบ
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ชื่อข้อสอบ */}
          <div>
            <label htmlFor="exam-name" className="block text-sm font-medium text-gray-700 mb-2">
              ชื่อข้อสอบ
            </label>
            <input
              type="text"
              id="exam-name"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
              placeholder="เช่น PLE-CCI D 2566"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
              required
            />
          </div>

          {/* คำอธิบาย */}
          <div>
            <label htmlFor="exam-description" className="block text-sm font-medium text-gray-700 mb-2">
              คำอธิบาย
            </label>
            <textarea
              id="exam-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="แนวข้อสอบในประเภทวิชาชีพ"
              rows={3}
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm resize-y"
              required
            ></textarea>
          </div>

          {/* เวลาทำข้อสอบ และ จำนวนข้อ (จัดเป็น Grid) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="exam-duration" className="block text-sm font-medium text-gray-700 mb-2">
                เวลาทำข้อสอบ
              </label>
              <div className="flex items-center mt-1">
                <input
                  type="number"
                  id="exam-duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="เวลาทำ (นาที)"
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  min="1"
                  required
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="exam-questions" className="block text-sm font-medium text-gray-700 mb-2">
                จำนวนข้อ
              </label>
              <div className="flex items-center mt-1">
                <input
                  type="number"
                  id="exam-questions"
                  value={numQuestions}
                  onChange={(e) => setNumQuestions(e.target.value)}
                  placeholder="จำนวนข้อ"
                  className="block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-green-500 focus:border-green-500 sm:text-sm"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>


          {/* ไฟล์เฉลยข้อสอบ */}
          <div>
            <label htmlFor="exam-file" className="block text-sm font-medium text-gray-700 mb-2">
              ไฟล์เฉลยข้อสอบ
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer hover:border-green-500 transition-colors">
              <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-700 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500">
                <div className="text-center">
                    <Upload className="mx-auto h-10 w-10 text-gray-400" />
                    <span className="mt-2 block text-sm font-semibold text-gray-900">
                        {examFile ? examFile.name : "เลือกไฟล์"}
                    </span>
                    <p className="mt-1 text-xs text-gray-500">
                        ขนาดสูงสุด 10MB (ไฟล์ .xls, .xlsx, .csv, .pdf)
                    </p>
                </div>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  onChange={handleFileChange}
                  accept=".xls,.xlsx,.csv,.pdf" // กำหนดประเภทไฟล์ที่ยอมรับ
                />
              </label>
            </div>
          </div>

          {/* ปุ่มบันทึก */}
          <div className="pt-6">
            <button
              type="submit"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <Save className="w-5 h-5 mr-2" />
              บันทึกการตั้งค่า
            </button>
          </div>
        </form>

      </div>
    </Navbar_admin>
  );
}

export default CreateExamPage;