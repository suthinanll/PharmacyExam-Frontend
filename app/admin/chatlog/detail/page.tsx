"use client";

import Navbar_admin from "@/components/Navbar_admin";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

const chatMessages = [
    {
        id: 1,
        date: "14 สิงหาคม 2568 16:25:20",
        type: "user_query", // User ส่งคำถาม
        content: "วันสอบใบประกอบเภสัชคือวันไหน ปี 2568"
    },
    {
        id: 2,
        date: "14 สิงหาคม 2568 16:25:23",
        type: "bot_reply", // Bot ตอบกลับ
        content: (
            <>
                สอบใบประกอบวิชาชีพเภสัชกรรมในประเทศไทย ปี พ.ศ. 2568 มีวันสอบสำคัญดังนี้ครับ
                (อ้างอิงจากผู้ที่ทำการสอบอย่างเป็นทางการจากกลุ่มสื่อสารข้อมูลฯ สภาเภสัชกรรม):
                <ul className="list-disc list-inside space-y-2 pl-4 mt-3 text-sm text-gray-700">
                    <li>**วันสอบครั้งที่ 1/2568** (การสอบบรรลุสมรรถนะเฉพาะสาขา)
                        <ul className="list-disc list-inside space-y-1 pl-4 mt-1">
                            <li>PLE-PC1 (สายงานร้านยา) และ PLE-IP1, PLE-PHCP1</li>
                            <li>วันทีสอบ: 23 มีนาคม 2568 เวลา 09.00-12.00 น. <a href="#" className="text-green-600 underline hover:text-green-700">plecenter.orgpharm.tu.ac.th+1</a></li>
                        </ul>
                    </li>
                    <li>**PLE-PC2** (Long case)
                        <ul className="list-disc list-inside space-y-1 pl-4 mt-1">
                            <li>วันทีสอบ: 28 มีนาคม 2568 <a href="#" className="text-green-600 underline hover:text-green-700">plecenter.orgFacebookpharm.tu.ac.th</a></li>
                        </ul>
                    </li>
                    <li>**วันสอบครั้งที่ 3/2568** (การสอบบรรลุสมรรถนะร่วม)
                        <ul className="list-disc list-inside space-y-1 pl-4 mt-1">
                            <li>PLE-CC2 (การสอบปฏิบัติแบบ Lab/OSPE)</li>
                            <li>วันทีสอบ: 4 กรกฎาคม 2568 <a href="#" className="text-green-600 underline hover:text-green-700">plecenter.org</a></li>
                        </ul>
                    </li>
                    <li>**PLE-CC1** (ข้อสอบ E-Exam)
                        <ul className="list-disc list-inside space-y-1 pl-4 mt-1">
                            <li>วันทีสอบ: 5-6 กรกฎาคม 2568 (เวลา 14.00-17.00 น.) <a href="#" className="text-green-600 underline hover:text-green-700">plecenter.orgFacebook</a></li>
                        </ul>
                    </li>
                </ul>
            </>
        )
    }
];

function Page() {
    // ฟังก์ชันสำหรับแยก วันที่ และ เวลา
    const formatDateTime = (dateTime: string) => {
        const parts = dateTime.split(" ");
        // วันที่: 14 สิงหาคม 2568
        const date = parts.slice(0, 3).join(" ");
        // เวลา: 16:25:20
        const time = parts.slice(3).join(" ");
        return { date, time };
    };
    
    // ดึงข้อมูลข้อความแรกเพื่อใช้เป็น Header
    const firstMessage = chatMessages[0];
    const headerDate = firstMessage ? formatDateTime(firstMessage.date).date : "";

    return (
        <Navbar_admin>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
                <Link
                    href="/admin/chatlog"
                    className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">กลับ</span>
                </Link>

                {/* Chat Log Container - ใช้พื้นหลังสีขาวและมุมมน */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8">
                    
                    {/* Header: วันที่ของบทสนทนา (14 สิงหาคม 2568) */}
                    <div className="text-center mb-6">
                        <span className="inline-block px-3 py-1 text-sm text-gray-500 bg-gray-100 rounded-full font-medium">
                            {headerDate}
                        </span>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex flex-col space-y-4">
                        {chatMessages.map((message) => {
                            const { time } = formatDateTime(message.date);
                            
                            // *** แก้ไขการแสดงผล: ลบการแสดงวันที่ 14 สิงหาคม 2568 ในส่วนของ Chat Bubble ออก
                            // ให้เหลือเพียงเวลา (time) และขยับเวลาของ Bot Reply ไปด้านล่างซ้าย
                            return (
                                <div key={message.id}>
                                    
                                    {/* Chat Bubble Container */}
                                    <div className={`flex ${message.type === 'user_query' ? 'justify-end' : 'justify-start'}`}>
                                        
                                        {/* User Query (Right side) */}
                                        {message.type === 'user_query' && (
                                            <div className="max-w-[85%]">
                                                <div className="bg-green-50 rounded-xl p-3 shadow-sm border border-green-200">
                                                    <p className="text-gray-900 text-sm">{message.content}</p>
                                                </div>
                                                <div className="text-right text-xs text-gray-500 mt-1">
                                                    {time}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Bot Reply (Left side - with Icon) */}
                                        {message.type === 'bot_reply' && (
                                            <div className="flex items-start max-w-[90%]">
                                                
                                                {/* Icon ผู้ช่วย */}
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 border border-gray-300 flex items-center justify-center mr-3 mt-0.5">
                                                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                                </div>
                                                
                                                <div className="flex-grow">
                                                    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
                                                        <div className="text-sm text-gray-900 leading-relaxed">
                                                            {message.content}
                                                        </div>
                                                    </div>
                                                    {/* เวลาของ Bot Reply: แสดงด้านล่างซ้าย */}
                                                    <div className="text-left text-xs text-gray-500 mt-1">
                                                        {time}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Navbar_admin>
    );
}

export default Page;