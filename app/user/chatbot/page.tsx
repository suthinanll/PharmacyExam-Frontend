'use client';

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Sparkles, SendHorizonal, Clipboard, Check, MessageSquare, Plus, Menu, X, User, Bot, AlertCircle, Trash2, Pencil, Shield, Clock, Zap } from "lucide-react";
import Navbar from "@/components/Navbar_user";
import Swal from "sweetalert2";
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from "@/components/LoadingSpinner";

// Utility for typing effect
const useTypewriter = (text: string, speed: number = 20) => {
  const [displayText, setDisplayText] = useState("");

  useEffect(() => {
    setDisplayText("");
    let i = 0;
    const typingInterval = setInterval(() => {
      i++;
      if (i <= text.length) {
        setDisplayText(text.substring(0, i));
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

// Bot Message Component
const BotMessage = ({ content, animate = false }: { content: string, animate?: boolean }) => {
  const [isCopied, setIsCopied] = useState(false);
  const typedContent = useTypewriter(content, 10); // Speed 10ms

  const displayContent = animate ? typedContent : content;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-3 max-w-3xl group">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 mt-1">
        <Sparkles className="w-4 h-4 text-white" />
      </div>
      <div className="relative">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{
              __html: displayContent
                .replace(/\n/g, '<br>')
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            }}
          />
        </div>
        <button
          onClick={handleCopy}
          className="absolute -top-6 right-0 p-1 text-neutral-400 hover:text-green-600 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white/80 backdrop-blur rounded px-2 shadow-sm border border-neutral-100 cursor-pointer"
        >
          {isCopied ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
          <span className="text-[10px]">คัดลอก</span>
        </button>
      </div>
    </div>
  );
};

interface QuotaData {
  capacity_percentage: number;
  remaining_percentage: number;
  used_points: number;
  max_points: number;
  message_count: number;
  is_limited: boolean;
  max_message_length: number;
  reset_at: string;
  reset_in_seconds: number;
}

export default function ChatbotPage() {
  const { getToken, user } = useAuth();

  type Message = {
    id: string;
    sender: "user" | "bot";
    text: string;
    created_at?: string;
    animate?: boolean;
  };

  type ChatSession = {
    session_id: string;
    title: string;
    created_at: string;
  };

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [userName, setUserName] = useState<string>("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Quota & Limits State
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [countdownText, setCountdownText] = useState<string>("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const MAX_INPUT_LENGTH = 1000;

  // Auto-expand textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 52), 170)}px`;
    }
  }, [input]);

  // 1. Get User info from AuthContext
  useEffect(() => {
    if (user?.user_id) {
      setUserName(`${user.first_name} ${user.last_name || ''}`.trim());
    }
  }, [user]);

  useEffect(() => {
    const hasAccepted = localStorage.getItem('chatbot_privacy_accepted');
    if (!hasAccepted) {
      setShowPrivacyModal(true);
    }
  }, []);

  // Fetch Quota & Sessions
  useEffect(() => {
    if (user?.user_id) {
      fetchSessions();
      fetchQuota();
    }
  }, [user?.user_id]);

  // Live Countdown Timer for Reset Time
  useEffect(() => {
    if (!quota?.reset_at) return;

    const updateCountdown = () => {
      const target = new Date(quota.reset_at).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);

      if (diff <= 0) {
        setCountdownText("กำลังรีเซ็ต...");
        fetchQuota();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      setCountdownText(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [quota?.reset_at]);

  // Scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isMessageLoading, isLoading]);

  // Close sidebar on click outside (mobile)
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

  const fetchQuota = async () => {
    const currentUserId = user?.user_id;
    if (!currentUserId) return;
    try {
      const token = getToken();
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/quota/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setQuota(data);
      }
    } catch (err) {
      console.error("Fetch quota error:", err);
    }
  };

  const fetchSessions = async () => {
    const currentUserId = user?.user_id;
    if (!currentUserId) return;
    try {
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/session/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status}`);
      }

      const data = await response.json();

      if (Array.isArray(data)) {
        if (data.length >= 2 && Array.isArray(data[0])) {
          setSessions(data[0]);
          setTotalCount(Number(data[1]) || 0);
        } else {
          setSessions(data);
          setTotalCount(data.length);
        }
      }
    } catch (error) {
      console.error("Fetch sessions error:", error);
    }
  };

  const fetchMessages = async (sessionId: string) => {
    try {
      setIsMessageLoading(true);
      setFetchError(null);
      setMessages([]);

      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/message/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.warn(`Messages for session ${sessionId} not found (404).`);
          setMessages([]);
          return;
        }
        throw new Error(`Failed to fetch messages: ${response.status}`);
      }

      const data = await response.json();
      const msgs = Array.isArray(data) ? data : (data.messages || []);

      const mappedMessages: Message[] = msgs.map((m: any) => ({
        id: m.message_id ? m.message_id.toString() : `msg-${Math.random()}`,
        sender: (m.sender_type === "USER" ? "user" : "bot"),
        text: m.message_text || "",
        created_at: m.sent_at
      }));

      mappedMessages.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateA - dateB;
      });

      setMessages(mappedMessages);
    } catch (error: any) {
      console.error("Error fetching messages:", error);
      setFetchError(error.message);
    } finally {
      setIsMessageLoading(false);
    }
  };

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem("last_active_session_id");
    if (savedSessionId) {
      setCurrentSessionId(savedSessionId);
      fetchMessages(savedSessionId);
    }
  }, []);

  // Save session to localStorage
  useEffect(() => {
    if (currentSessionId) {
      localStorage.setItem("last_active_session_id", currentSessionId);
    } else {
      localStorage.removeItem("last_active_session_id");
    }
  }, [currentSessionId]);

  const handleSelectSession = async (sessionId: string) => {
    if (currentSessionId === sessionId) return;
    setCurrentSessionId(sessionId);
    await fetchMessages(sessionId);

    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleNewChat = () => {
    setCurrentSessionId(null);
    setMessages([]);
    setFetchError(null);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleSendMessage = async () => {
    const currentUserId = user?.user_id;
    if (!currentUserId) {
      console.error("Cannot send message: user_id is missing");
      return;
    }
    if (!input.trim() || isLoading) return;

    if (input.length > MAX_INPUT_LENGTH) {
      Swal.fire({
        icon: 'warning',
        title: 'ข้อความยาวเกินกำหนด',
        text: `กรุณาลดความยาวข้อความให้อยู่ใน ${MAX_INPUT_LENGTH} ตัวอักษร (ปัจจุบัน ${input.length} ตัวอักษร)`,
        confirmButtonColor: '#16a34a'
      });
      return;
    }

    if (quota?.is_limited) {
      Swal.fire({
        icon: 'info',
        title: 'ความจุการใช้งานเต็ม 100%',
        text: `คุณใช้งานความจุแชตบอตประจำวันครบแล้ว ระบบจะรีเซ็ตความจุใหม่ในเวลา 00:00 น. (อีกประมาณ ${countdownText || 'สักครู่'})`,
        confirmButtonColor: '#16a34a'
      });
      return;
    }

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: input,
      sender: "user",
      created_at: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    const sentText = input;
    setInput("");
    setIsLoading(true);

    try {
      const endpointSessionId = currentSessionId || 'new';
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/send/${endpointSessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: currentUserId,
          session_id: currentSessionId,
          message: sentText
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          if (errorData?.error === 'CONCURRENT_REQUEST_LIMIT') {
            Swal.fire({
              icon: 'warning',
              title: 'กำลังประมวลผลคำขอก่อนหน้า',
              text: 'กรุณารอสักครู่ให้ AI ตอบเสร็จสิ้นก่อนส่งข้อความใหม่',
              timer: 2500,
              showConfirmButton: false
            });
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'โควตาความจุเต็ม 100%',
              text: errorData?.message || 'คุณใช้งานความจุแชตบอตครบ 100% สำหรับวันนี้แล้ว',
              confirmButtonColor: '#16a34a'
            });
            fetchQuota();
          }
          setMessages(messages);
          setInput(sentText);
          return;
        }
        throw new Error(errorData?.message || `Failed to send message: ${response.status}`);
      }

      const data = await response.json();
      const botData = data.bot || {};
      const botResponse: Message = {
        id: botData.message_id ? botData.message_id.toString() : `bot-${Date.now()}`,
        sender: "bot",
        text: botData.message_text || data.message || data.response || "ขออภัยเกิดข้อผิดพลาดจากระบบ",
        created_at: botData.sent_at || new Date().toISOString(),
        animate: true
      };

      const updatedUserMessages = newMessages.map(msg => {
        if (msg.id === userMessage.id && data.user?.message_id) {
          return { ...msg, id: data.user.message_id.toString() };
        }
        return msg;
      });

      setMessages([...updatedUserMessages, botResponse]);

      // Update Quota
      if (data.quota) {
        setQuota(data.quota);
      } else {
        fetchQuota();
      }

      if (!currentSessionId && data.user?.chat_session_id) {
        setCurrentSessionId(data.user.chat_session_id);
        await fetchSessions();
      }

    } catch (error: any) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: `bot-error-${Date.now()}`,
        sender: "bot",
        text: error?.message || "ขออภัยครับ เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง",
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();

    const result = await Swal.fire({
      title: 'คุณแน่ใจหรือไม่?',
      text: "คุณต้องการลบประวัติการสนทนานี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'ใช่, ลบเลย!',
      cancelButtonText: 'ยกเลิก',
      reverseButtons: true
    });

    if (!result.isConfirmed) return;

    try {
      const token = getToken();
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/chat/session/${sessionId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        setSessions((prev) => prev.filter((s) => s.session_id !== sessionId));
        setTotalCount((prev) => prev - 1);
        if (currentSessionId === sessionId) {
          handleNewChat();
        }
        Swal.fire(
          'ลบสำเร็จ!',
          'ประวัติการสนทนาถูกลบเรียบร้อยแล้ว',
          'success'
        );
      } else {
        Swal.fire(
          'เกิดข้อผิดพลาด!',
          'ไม่สามารถลบรายการนี้ได้',
          'error'
        );
      }
    } catch (error) {
      console.error("Delete session error:", error);
      Swal.fire(
        'เกิดข้อผิดพลาด!',
        'เกิดข้อผิดพลาดในการลบ กรุณาลองใหม่อีกครั้ง',
        'error'
      );
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startEditing = (msg: Message) => {
    setInput(msg.text);
    if (textareaRef.current) {
      textareaRef.current.focus();
      const len = msg.text.length;
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.setSelectionRange(len, len);
          textareaRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 50);
    }
  };

  const handleAcceptPrivacy = () => {
    localStorage.setItem('chatbot_privacy_accepted', 'true');
    setShowPrivacyModal(false);
  };

  const capacityPct = quota?.capacity_percentage ?? 0;
  const isLimited = quota?.is_limited ?? false;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 text-white flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold">นโยบายความเป็นส่วนตัว</h2>
                <p className="text-green-100 text-sm">เกี่ยวกับการใช้งานแชตบอต</p>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-semibold mb-1">ข้อมูลที่เราเก็บรวบรวม</p>
                    <p>เพื่อปรับปรุงคุณภาพการให้บริการ เราจะเก็บบันทึกการสนทนาระหว่างคุณกับแชตบอต</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-green-600 rounded-full"></div>
                  ข้อมูลที่จะถูกบันทึก
                </h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>คำถามและข้อความที่คุณส่งถึงแชตบอต</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>คำตอบและคำแนะนำที่แชตบอตให้กับคุณ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>วันที่และเวลาของการสนทนา</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h3 className="font-bold text-gray-800 flex items-center gap-2">
                  <div className="w-1.5 h-5 bg-green-600 rounded-full"></div>
                  วัตถุประสงค์ในการใช้ข้อมูล
                </h3>
                <ul className="space-y-2 text-gray-700 text-sm">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>ปรับปรุงและพัฒนาความแม่นยำของแชตบอต</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>วิเคราะห์และเข้าใจคำถามที่ผู้ใช้สนใจ</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>ให้บริการที่ดีขึ้นและตรงกับความต้องการ</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-semibold mb-1">ความปลอดภัยของข้อมูล</p>
                    <p>เราให้ความสำคัญกับความเป็นส่วนตัวของคุณ ข้อมูลทั้งหมดจะถูกเก็บรักษาอย่างปลอดภัยและจะไม่ถูกนำไปเผยแพร่หรือขายให้กับบุคคลที่สาม</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 italic">
                หมายเหตุ: คุณสามารถลบประวัติการสนทนาของคุณได้ตลอดเวลาผ่านเมนูด้านซ้าย
              </p>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleAcceptPrivacy}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Check className="w-5 h-5" />
                  ยอมรับและเริ่มใช้งาน
                </button>
              </div>
              <p className="text-center text-xs text-gray-500 mt-3">
                การกดปุ่ม "ยอมรับและเริ่มใช้งาน" ถือว่าคุณยอมรับนโยบายความเป็นส่วนตัวของเรา
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Full-width container to prevent left clipping and margin misalignment */}
      <div className="w-full flex h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-3.75rem)] md:h-[calc(100vh-4.25rem)] overflow-hidden bg-white">
        
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/30 z-40 lg:hidden backdrop-blur-xs"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Left Sidebar ── */}
        <aside
          id="chat-sidebar"
          className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white border-r border-gray-200 flex flex-col transition-transform duration-300 ease-in-out shrink-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Sidebar Top: New Chat + Capacity % Card */}
          <div className="p-3.5 border-b border-gray-100 flex flex-col gap-3 shrink-0 bg-white">
            <div className="flex items-center justify-between lg:hidden">
              <h2 className="text-base font-bold text-gray-800">เมนูแชตบอต</h2>
              <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                <X size={18} />
              </button>
            </div>

            {/* New Chat Button */}
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 active:scale-98 transition-all shadow-xs font-semibold text-sm cursor-pointer"
            >
              <Plus size={18} />
              แชทใหม่
            </button>

            {/* ⚡ Dynamic Capacity Card (Placed in Left Sidebar) */}
            <div className="bg-gradient-to-br from-green-50/90 to-emerald-50/50 border border-green-200/80 rounded-xl p-3 shadow-2xs">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Zap className="w-3.5 h-3.5 text-green-700 shrink-0" />
                  <span className="text-xs font-bold text-gray-800 truncate">ความจุ AI วันนี้</span>
                </div>
                <span className={`text-[11px] font-black font-mono px-2 py-0.5 rounded-full ${
                  capacityPct >= 90 
                    ? 'bg-rose-100 text-rose-700' 
                    : capacityPct >= 70 
                    ? 'bg-amber-100 text-amber-700' 
                    : 'bg-green-100 text-green-700'
                }`}>
                  {capacityPct}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200/80 rounded-full h-1.5 overflow-hidden mb-1.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ease-out ${
                    capacityPct >= 90
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                      : capacityPct >= 70
                      ? 'bg-gradient-to-r from-green-500 to-amber-500'
                      : 'bg-gradient-to-r from-green-500 to-emerald-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(3, capacityPct))}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-gray-500">
                <span>{isLimited ? 'ความจุเต็มแล้ว' : `ใช้งานไปแล้ว ${capacityPct}%`}</span>
                <span className="flex items-center gap-1 font-mono text-gray-500" title="เวลานับถอยหลังรีเซ็ตเที่ยงคืน (00:00 น.)">
                  <Clock className="w-3 h-3 text-gray-400" />
                  {countdownText || '00:00:00'}
                </span>
              </div>
            </div>
          </div>

          {/* Session History List */}
          <div className="flex-1 overflow-y-auto p-2.5 space-y-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 py-1.5">
              ประวัติการสนทนา ({totalCount})
            </h3>
            {sessions.map((session) => (
              <button
                key={session.session_id}
                onClick={() => handleSelectSession(session.session_id?.toString())}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-start gap-2.5 group relative pr-9 cursor-pointer ${
                  currentSessionId?.toString() === session.session_id?.toString()
                    ? "bg-green-50 text-green-800 font-semibold border border-green-200/60 shadow-2xs"
                    : "text-gray-600 hover:bg-gray-50 border border-transparent"
                }`}
              >
                <MessageSquare size={16} className={`mt-0.5 shrink-0 ${
                  currentSessionId?.toString() === session.session_id?.toString() ? 'text-green-600' : 'text-gray-400'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs truncate">
                    {session.title || `Session #${session.session_id}`}
                  </p>
                  <p className="text-[10px] opacity-60 mt-0.5">
                    {new Date(session.created_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div
                  onClick={(e) => handleDeleteSession(e, session.session_id?.toString())}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  title="ลบแชท"
                >
                  <Trash2 size={14} />
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* ── Main Chat Area ── */}
        <main className="flex-1 flex flex-col relative w-full bg-slate-50/40 overflow-hidden">

          {/* Mobile Header for Sidebar Toggle */}
          <div className="lg:hidden h-12 border-b border-gray-200 bg-white flex items-center px-4 justify-between shrink-0 z-20">
            <button
              id="sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 -ml-1.5 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            >
              <Menu size={20} />
            </button>
            <span className="font-bold text-sm text-gray-800">แชตบอตผู้ช่วย</span>
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              <Zap size={12} /> {capacityPct}%
            </div>
          </div>

          {/* Cooldown Alert Banner when Quota is 100% */}
          {isLimited && (
            <div className="mx-4 sm:mx-6 mt-3 p-3 sm:p-3.5 bg-gradient-to-r from-rose-50 to-amber-50 border border-rose-200/80 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 shadow-2xs shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4 animate-pulse" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-rose-900 truncate">คุณใช้งานความจุแชตบอตครบ 100% สำหรับวันนี้แล้ว</p>
                  <p className="text-[11px] text-rose-700">ระบบจะรีเซ็ตความจุใหม่ในเวลา 00:00 น.</p>
                </div>
              </div>
              <div className="self-end sm:self-center bg-white/90 backdrop-blur px-2.5 py-1 rounded-lg border border-rose-200/60 text-right shrink-0">
                <span className="text-[11px] font-mono font-bold text-rose-600">{countdownText || '00:00:00'}</span>
              </div>
            </div>
          )}

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 scroll-smooth">
            {!currentSessionId && messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-16 h-16 bg-green-100/80 rounded-2xl flex items-center justify-center mb-4 text-green-600 shadow-xs">
                  <Bot size={34} />
                </div>
                <h2 className="text-xl font-bold text-gray-800 mb-1.5">ยินดีต้อนรับ! {userName ? `คุณ${userName}` : ''}</h2>
                <p className="text-sm text-gray-500 max-w-md">
                  เลือกประวัติการแชทด้านซ้าย หรือพิมพ์คำถามเกี่ยวกับการสอบใบประกอบวิชาชีพเภสัชกรรมได้เลย!
                </p>
              </div>
            ) : (
              <>
                {fetchError && (
                  <div className="mx-auto max-w-lg bg-red-50 text-red-600 p-3.5 rounded-xl flex items-center gap-2.5 mb-4 text-sm">
                    <AlertCircle size={18} />
                    <p>ไม่สามารถโหลดข้อความได้: {fetchError}</p>
                  </div>
                )}

                {isMessageLoading ? (
                  <div className="py-12 flex items-center justify-center">
                    <LoadingSpinner size="md" text="กำลังโหลดข้อความ..." />
                  </div>
                ) : (
                  messages.length === 0 && !fetchError ? (
                    <div className="text-center py-10 text-gray-400 text-sm">
                      ไม่พบข้อความในเซสชันนี้
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={msg.sender === 'bot' ? '' : 'flex justify-end'}>
                        {msg.sender === 'bot' ? (
                          <BotMessage content={msg.text} animate={msg.animate} />
                        ) : (
                          <div className="flex flex-col items-end gap-1 max-w-[85%] sm:max-w-xl w-full">
                            <div className="bg-green-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-xs shadow-xs relative group text-sm sm:text-base">
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                              <button
                                onClick={() => startEditing(msg)}
                                className="absolute -top-2.5 -right-2.5 p-1 bg-white text-green-600 rounded-full shadow-xs opacity-0 group-hover:opacity-100 transition-all hover:bg-green-50 border border-green-100 cursor-pointer"
                                title="แก้ไขและถามใหม่"
                              >
                                <Pencil size={12} />
                              </button>
                            </div>
                            <span className="text-[10px] text-gray-400 mr-1">
                              {msg.created_at ? new Date(msg.created_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )
                )}

                {isLoading && (
                  <div className="flex items-start gap-3 animate-fade-in">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-white animate-spin" />
                    </div>
                    <div className="bg-white p-3.5 rounded-2xl shadow-2xs border border-gray-200">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                          <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                        </div>
                        <span className="text-xs text-gray-400 ml-1">AI กำลังประมวลผลคำตอบ...</span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 sm:p-4 bg-white border-t border-gray-200 px-4 sm:px-6 shrink-0">
            <div className="max-w-4xl mx-auto">
              <div className={`relative flex items-end border rounded-2xl shadow-2xs transition-all p-1.5 ${
                isLimited 
                  ? 'bg-gray-100 border-gray-300 opacity-80' 
                  : 'bg-gray-50 border-gray-200 focus-within:border-green-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-green-100'
              }`}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  disabled={isLimited || isLoading}
                  maxLength={MAX_INPUT_LENGTH}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={
                    isLimited
                      ? `ความจุเต็ม 100% แล้ว — จะเปิดใช้งานใหม่ในเวลา 00:00 น. (อีก ${countdownText})`
                      : isLoading
                      ? "กำลังประมวลผลคำตอบ กรุณารอสักครู่..."
                      : "พิมพ์คำถามเกี่ยวกับเภสัชกรรม... (Shift + Enter เพื่อขึ้นบรรทัดใหม่)"
                  }
                  className="w-full pl-3.5 pr-11 py-2.5 bg-transparent border-0 focus:ring-0 focus:outline-hidden resize-none text-gray-800 text-sm sm:text-base max-h-40 overflow-y-auto leading-relaxed disabled:cursor-not-allowed"
                  rows={1}
                  style={{ minHeight: '44px' }}
                />

                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading || isLimited || input.length > MAX_INPUT_LENGTH}
                  className="flex items-center justify-center w-9 h-9 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-40 transition-colors shadow-2xs shrink-0 cursor-pointer mb-1 mr-1 disabled:cursor-not-allowed"
                  title="ส่งข้อความ"
                >
                  <SendHorizonal size={16} />
                </button>
              </div>

              {/* Character Counter & Limit text */}
              <div className="flex justify-between items-center px-1.5 pt-1 text-[11px] text-gray-400">
                <span>จำกัดสูงสุด {MAX_INPUT_LENGTH.toLocaleString()} ตัวอักษร</span>
                <span className={`font-mono font-medium ${
                  input.length >= 950 
                    ? 'text-rose-500 font-bold' 
                    : input.length >= 800 
                    ? 'text-amber-500 font-semibold' 
                    : 'text-gray-400'
                }`}>
                  {input.length} / {MAX_INPUT_LENGTH.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}