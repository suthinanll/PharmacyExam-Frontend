"use client";

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Sparkles, SendHorizonal, Clipboard, Check, MessageSquare, Plus, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar_user";
import Image from 'next/image';

const useTypewriter = (text: string, speed: number = 20) => {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    let i = 0;
    const typingInterval = setInterval(() => {
      if (i < text.length) {
        setDisplayText(text.substring(0, i + 1));
        i++;
      } else {
        clearInterval(typingInterval);
      }
    }, speed);

    return () => {
      clearInterval(typingInterval);
    };
  }, [text, speed]);

  return displayText;
};

const BotMessage = ({ content }: { content: string }) => {
  const [isCopied, setIsCopied] = useState(false);
  const typedContent = useTypewriter(content);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center shadow-sm">
        <Sparkles className="text-blue-500" size={20} />
      </div>
      <div className="relative group max-w-2xl px-5 py-4 rounded-2xl bg-white border border-neutral-200 text-neutral-700 shadow-sm">
        <article
          className="prose prose-sm max-w-none prose-neutral"
          dangerouslySetInnerHTML={{ __html: typedContent.replace(/\n/g, '<br />').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
        />
        <button
          onClick={handleCopy}
          className="absolute -top-3 -right-3 p-1.5 bg-white border rounded-full text-neutral-500 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Copy message"
        >
          {isCopied ? <Check size={16} className="text-green-500" /> : <Clipboard size={16} />}
        </button>
      </div>
    </div>
  );
};

const ChatbotPage = () => {
  type Message = { id: string; sender: "user" | "bot"; text: string };
  type ChatSession = { id: string; title: string; messages: Message[]; timestamp: number };

  const [sessions, setSessions] = useState<ChatSession[]>([
    {
      id: "1",
      title: "วันสอบใบประกอบเภสัช",
      messages: [],
      timestamp: Date.now() - 86400000
    },
    {
      id: "2",
      title: "เกี่ยวกับคณะเภสัชศาสตร์",
      messages: [],
      timestamp: Date.now() - 172800000
    }
  ]);

  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sidebarOpen && window.innerWidth < 1024) {
        const sidebar = document.getElementById('chat-sidebar');
        const toggleBtn = document.getElementById('sidebar-toggle');
        if (sidebar && !sidebar.contains(e.target as Node) && !toggleBtn?.contains(e.target as Node)) {
          setSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [sidebarOpen]);

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMessages(session.messages);
      if (window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = { id: `user-${Date.now()}`, text: input, sender: "user" };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      const botResponse: Message = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: `นี่คือคำตอบสำหรับคำถามของคุณเกี่ยวกับ "${userMessage.text}" ครับ\n\n- **ข้อที่ 1:** นี่คือรายละเอียดข้อที่หนึ่ง\n- **ข้อที่ 2:** นี่คือรายละเอียดข้อที่สอง`,
      };
      const updatedMessages = [...newMessages, botResponse];
      setMessages(updatedMessages);

      if (currentSessionId) {
        setSessions(prev => prev.map(s =>
          s.id === currentSessionId ? { ...s, messages: updatedMessages } : s
        ));
      } else {
        const newSession: ChatSession = {
          id: `session-${Date.now()}`,
          title: userMessage.text.substring(0, 30) + (userMessage.text.length > 30 ? "..." : ""),
          messages: updatedMessages,
          timestamp: Date.now()
        };
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
      }

      setIsLoading(false);
    }, 2000);
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const questionSuggestions = [
    "วันสอบใบประกอบเภสัชคือวันไหน",
    "เกี่ยวกับคณะเภสัชศาสตร์",
    "ช่วยแนะนำวิธีการอ่านหนังสือสอบหน่อยครับ",
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />

      <div className="flex flex-1 overflow-hidden relative">

        {/* Sidebar Overlay for Mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          id="chat-sidebar"
          className={`
            fixed lg:static inset-y-0 left-0 z-50
            w-64 bg-white border-r border-neutral-200 
            flex flex-col
            transform transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          `}
        >
          <div className="p-4 border-b border-neutral-200">
            {/* Close button for mobile */}
            <div className="flex items-center justify-between mb-3 lg:hidden">
              <h2 className="text-lg font-semibold text-neutral-800">เมนู</h2>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                aria-label="Close sidebar"
              >
                <X size={20} />
              </button>
            </div>

            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus size={20} />
              <span>แชทใหม่</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3">
            <h3 className="text-xs font-semibold text-neutral-500 uppercase mb-2 px-2">ประวัติการแชท</h3>
            <div className="space-y-1">
              {sessions.map(session => (
                <button
                  key={session.id}
                  onClick={() => handleSelectSession(session.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${currentSessionId === session.id
                      ? "bg-blue-50 text-blue-600 border border-blue-200"
                      : "text-neutral-700 hover:bg-neutral-100"
                    }`}
                >
                  <div className="flex items-start gap-2">
                    <MessageSquare size={16} className="mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{session.title}</p>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        {new Date(session.timestamp).toLocaleDateString('th-TH', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header with Breadcrumb */}
          <header className="bg-white border-b border-neutral-200 px-4 py-3">
            <div className="flex items-center gap-3">
              <button
                id="sidebar-toggle"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors lg:hidden"
                aria-label="Toggle sidebar"
              >
                <Menu size={20} />
              </button>

              <div className="flex items-center text-xs sm:text-sm text-gray-500 mb-2">
                <span className="hover:text-blue-600 cursor-pointer">หน้าหลัก</span>
                <span className="mx-2">›</span>
                <span className="text-gray-700 font-medium">แชตบอตผู้ช่วย</span>
              </div>

            </div>
          </header>

          {/* Chat Area */}
          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-4 lg:p-6">
              <div className="w-full max-w-4xl mx-auto space-y-8">
                {messages.length === 0 ? (
                  // Welcome Screen
                  <div className="text-center pt-12 sm:pt-20">
                    <div className="inline-block p-5 bg-white rounded-full shadow-lg">
                      <Image src="/img/logoPhama.png" width={50} height={50} alt="รูปภาพโลโก้" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold text-neutral-800 mt-6">สวัสดีครับ!</h1>
                    <p className="text-neutral-500 mt-2 text-base sm:text-lg px-4">
                      มีอะไรให้ผมช่วยเกี่ยวกับเรื่องการสอบใบประกอบวิชาชีพเภสัชกรรมบ้าง?
                    </p>
                  </div>
                ) : (
                  // Chat Messages
                  <AnimatePresence>
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={`flex items-start gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        {msg.sender === 'bot' ? (
                          <BotMessage content={msg.text} />
                        ) : (
                          <div className="max-w-xl px-5 py-4 rounded-2xl bg-blue-500 text-white shadow-md">
                            <p>{msg.text}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}

                {isLoading && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full border border-neutral-200 bg-white flex items-center justify-center shadow-sm">
                      <Sparkles className="text-blue-500" size={20} />
                    </div>
                    <div className="flex items-center space-x-1.5 px-5 py-4 bg-white border border-neutral-200 rounded-2xl shadow-sm">
                      <span className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="h-2 w-2 bg-neutral-400 rounded-full animate-bounce"></span>
                    </div>
                  </motion.div>
                )}
                <div ref={chatEndRef}></div>
              </div>
            </div>

            {/* Input Area */}
            <div className="px-4 lg:px-6 pb-4 sm:pb-6 pt-4 bg-neutral-50 border-t border-neutral-200">
              <div className="max-w-4xl mx-auto">
                {messages.length === 0 && (
                  <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
                    {questionSuggestions.map(q => (
                      <button
                        key={q}
                        onClick={() => setInput(q)}
                        className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-white border border-neutral-200 text-neutral-600 rounded-full hover:bg-neutral-100/80 transition-all"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                <motion.div layout className="relative">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="พิมพ์คำถามของคุณที่นี่..."
                    className="w-full text-sm sm:text-base py-3 sm:py-4 pl-4 sm:pl-6 pr-14 sm:pr-16 bg-white text-neutral-800 rounded-full border border-neutral-300 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-sm transition-all"
                  />
                  <button
                    onClick={handleSendMessage}
                    disabled={!input.trim() || isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 sm:p-2.5 rounded-full text-white bg-blue-500 hover:bg-blue-600 disabled:bg-neutral-300 disabled:cursor-not-allowed transition-all"
                    aria-label="Send message"
                  >
                    <SendHorizonal size={18} className="sm:w-5 sm:h-5" />
                  </button>
                </motion.div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default ChatbotPage;