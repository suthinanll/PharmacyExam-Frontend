/* eslint-disable react-hooks/rules-of-hooks */
"use client"
import Navbar_user from "@/components/Navbar_user"
import Footer from "@/components/Footer"
import SearchBar from "@/components/SearchBar"
import { useState } from "react"
import Link from "next/link"

const examset = () => {
  const [activeTab, setActiveTab] = useState<"all" | "disease" | "previous">("all")

  const exams = {
    all: [
      { id: 1, name: "MCQ ปี 2554 ชุดที่ 1", questions: 110 },
    ],
    disease: [

    ],
    previous: [
      { id: 1, name: "MCQ ปี 2554 ชุดที่ 1", questions: 110 },

    ]
  }

  const currentExams = exams[activeTab]

  return (
    <>
      <Navbar_user />
      <div className="min-h-screen bg-gray-50 py-8">


        <div className="container mx-auto px-4 mb-4">
          <div className="flex items-center text-sm text-gray-500 mb-3 mt-3">
            <Link href="/" className="hover:text-blue-600 cursor-pointer transition">
              หน้าหลัก
            </Link>
            <span className="mx-2">›</span>
            <span className="text-gray-700 font-medium">คลังข้อสอบ</span>
          </div>

          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">คลังข้อสอบ</h1>
              <SearchBar onSearch={function (): void {
                throw new Error("Function not implemented.")
              }} />
            </div>

            {/* Tabs */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2 border-b border-gray-200">
                <button
                  onClick={() => setActiveTab("all")}
                  className={`px-6 py-3 font-medium transition-colors ${activeTab === "all"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  ข้อสอบทั้งหมด
                </button>
                <button
                  onClick={() => setActiveTab("disease")}
                  className={`px-6 py-3 font-medium transition-colors ${activeTab === "disease"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  ข้อสอบโรคและระบบต่างๆ
                </button>
                <button
                  onClick={() => setActiveTab("previous")}
                  className={`px-6 py-3 font-medium transition-colors ${activeTab === "previous"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-600 hover:text-gray-800"
                    }`}
                >
                  ข้อสอบย้อนหลัง
                </button>
              </div>
            </div>

            {/* Exam List */}
            <div className="space-y-4">
              {currentExams.map((exam) => (
                <div
                  key={exam.id}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {exam.name}
                      </h3>
                      <p className="text-gray-600">
                        จำนวน {exam.questions} ข้อ
                      </p>
                    </div>
                    <Link
                      href={`/take-exam`}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors w-full sm:w-auto text-center inline-block"
                    >
                      เริ่มทำข้อสอบ
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {currentExams.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">ไม่มีข้อสอบในหมวดนี้</p>
              </div>
            )}
          </div>
        </div>


      </div>


      <Footer />
    </>
  )
}

export default examset