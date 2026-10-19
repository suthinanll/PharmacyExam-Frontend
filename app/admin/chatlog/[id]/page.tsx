"use client";

import Navbar_admin from "@/components/Navbar_admin";
import Link from "next/link";
import { ChevronLeft, User, Bot } from "lucide-react"; // เพิ่ม Icons
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface ChatMessage {
    message_id: number;
    chat_session_id: number;
    message_text: string;
    sender_type: 'USER' | 'BOT';
    sent_at: string; // หรือ created_at ขึ้นอยู่กับ backend entity
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

function ChatDetailPage() {
    const params = useParams();
    const id = params.id; // Session ID

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (id) {
            fetchMessages();
        }
    }, [id]);

    const fetchMessages = async () => {
        try {
            const response = await fetch(`${API_URL}/chat/message/${id}`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data: ChatMessage[] = await response.json();
                // Backend ส่งมาเป็น DESC (ล่าสุดขึ้นก่อน) แต่แชตต้องอ่านจากเก่าไปใหม่
                setMessages(data.reverse());
            } else {
                setError("ไม่สามารถโหลดบทสนทนาได้");
            }
        } catch (err) {
            console.error("Error fetching messages:", err);
            setError("เกิดข้อผิดพลาดในการเชื่อมต่อ");
        } finally {
            setLoading(false);
        }
    };

    // ฟังก์ชันสำหรับจัดรูปแบบวันที่และเวลาแบบไทย
    const formatDateTime = (dateString: string) => {
        if (!dateString) return { date: "", time: "" };
        const dateObj = new Date(dateString);

        const date = dateObj.toLocaleDateString('th-TH', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const time = dateObj.toLocaleTimeString('th-TH', {
            hour: '2-digit',
            minute: '2-digit'
        });

        return { date, time };
    };

    // วันที่ของข้อความแรก (Header)
    const headerDate = messages.length > 0 ? formatDateTime(messages[0].sent_at).date : "";

    if (loading) {
        return (
            <Navbar_admin>
                <div className="min-h-screen bg-gray-50 py-8">
                    <div className="max-w-4xl mx-auto px-4 space-y-6">
                        <div className="h-8 w-56 animate-pulse rounded-lg bg-gray-200" />
                        <div className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="flex items-end gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
                                    <div className="space-y-2 flex-1 max-w-[70%]">
                                        <div className="h-3.5 w-full animate-pulse rounded-lg bg-gray-200" />
                                        <div className="h-3.5 w-2/3 animate-pulse rounded-lg bg-gray-200" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Navbar_admin>
        );
    }

    if (error) {
        return (
            <Navbar_admin>
                <div className="p-8 text-center text-red-500">
                    <p>{error}</p>
                    <Link href="/admin/chatlog" className="text-blue-500 underline mt-4 inline-block">กลับหน้ารายการ</Link>
                </div>
            </Navbar_admin>
        );
    }

    return (
        <Navbar_admin>
            <div className="max-w-7xl mx-auto w-full space-y-6">
                <Link
                    href="/admin/chatlog"
                    className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 mb-6 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">กลับ</span>
                </Link>

                {/* Chat Log Container */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 min-h-[500px] flex flex-col">

                    {/* Header Date */}
                    {headerDate && (
                        <div className="text-center mb-6">
                            <span className="inline-block px-3 py-1 text-sm text-gray-500 bg-gray-100 rounded-full font-medium">
                                {headerDate}
                            </span>
                        </div>
                    )}

                    {/* Chat Messages Area */}
                    <div className="flex flex-col space-y-6 flex-grow">
                        {messages.length === 0 ? (
                            <p className="text-center text-gray-600 my-auto">ไม่มีข้อความในบทสนทนานี้</p>
                        ) : (
                            messages.map((message) => {
                                const { time } = formatDateTime(message.sent_at);
                                const isUser = message.sender_type === 'USER';

                                return (
                                    <div key={message.message_id} className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}>

                                        {/* Avatar for Bot (Left side only) */}
                                        {!isUser && (
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center mr-3 mt-1">
                                                <Bot className="w-5 h-5 text-blue-600" />
                                            </div>
                                        )}

                                        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%] sm:max-w-[75%]`}>
                                            <div
                                                className={`px-4 py-3 rounded-2xl shadow-sm text-sm break-words whitespace-pre-wrap ${isUser
                                                        ? 'bg-green-50 text-gray-900 border border-green-200 rounded-tr-sm'
                                                        : 'bg-white text-gray-900 border border-gray-200 rounded-tl-sm'
                                                    }`}
                                            >
                                                {message.message_text}
                                            </div>
                                            <span className="text-xs text-gray-600 mt-1 px-1">
                                                {time}
                                            </span>
                                        </div>

                                        {/* Avatar for User (Right side only - Optional, usually chat UI doesn't show user avatar on right but can add if needed) */}
                                        {/* {isUser && (
                                            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-100 border border-green-200 flex items-center justify-center ml-3 mt-1">
                                                <User className="w-5 h-5 text-green-600" />
                                            </div>
                                        )} */}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </div>
        </Navbar_admin>
    );
}

export default ChatDetailPage;