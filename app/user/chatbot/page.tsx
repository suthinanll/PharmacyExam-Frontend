'use client';

import { useState, useRef, useEffect, KeyboardEvent } from "react";
import { Sparkles, SendHorizonal, Clipboard, Check, MessageSquare, Plus, Menu, X, User, Bot, AlertCircle, Trash2, Pencil, Shield } from "lucide-react";
import Navbar from "@/components/Navbar_user";
import Swal from "sweetalert2";
import { useAuth } from '@/contexts/AuthContext';

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
// BotMessage Component
const BotMessage = ({ content, animate = false }: { content: string, animate?: boolean }) => {
  const [isCopied, setIsCopied] = useState(false);
  const typedContent = useTypewriter(content, 10); // Speed 10ms

  // Use typed content if animate is true, otherwise full content
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
          className="absolute -top-6 right-0 p-1 text-neutral-400 hover:text-green-600 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white/80 backdrop-blur rounded px-2 shadow-sm border border-neutral-100"
        >
          {isCopied ? <Check className="w-3 h-3" /> : <Clipboard className="w-3 h-3" />}
          <span className="text-[10px]">คัดลอก</span>
        </button>
      </div>
    </div>
  );
};

export default function ChatbotPage() {
  const { getToken } = useAuth();
  type Message = {
    id: string;
    sender: "user" | "bot";
    text: string;
    created_at?: string;
    animate?: boolean; // Added for typing effect control
  };

  type ChatSession = {
    session_id: string;
    title: string;
    created_at: string;
  };

  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [userId, setUserId] = useState<any>(null);

  const [userName, setUserName] = useState<string>("");
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMessageLoading, setIsMessageLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isEditLoading, setIsEditLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);


  // 1. Get User ID from /auth/me
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = getToken();
        const res = await fetch('http://localhost:5000/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.user_id) {
            setUserId(data.user_id);
            if (data.first_name) {
              setUserName(`${data.first_name} ${data.last_name || ''}`.trim());
            }
          }
        }
      } catch (error) {
        console.error("Error fetching /auth/me:", error);
      }
    };

    fetchUser();

    // Check if user has accepted privacy policy
    const hasAccepted = localStorage.getItem('chatbot_privacy_accepted');
    if (!hasAccepted) {
      setShowPrivacyModal(true);
    }
  }, []);

  // 2. Fetch sessions when userId is available
  useEffect(() => {
    if (userId) {
      fetchSessions();
    }
  }, [userId]);

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

  const fetchSessions = async () => {
    if (!userId) return;
    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/chat/session/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status}`);
      }

      const data = await response.json();

      // API returns [sessionsArray, totalCount] or just array
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

      // GET /chat/message/:session_id (Singular based on user hint)
      const token = getToken();
      const response = await fetch(`http://localhost:5000/chat/message/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // 404 means no messages found or endpoint missing.
          // Treat as empty conversation for now to avoid locking the UI.
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

      // Sort messages by date (Oldest first)
      mappedMessages.sort((a, b) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateA - dateB;
      });

      setMessages(mappedMessages);

    } catch (error: any) {
      console.error("Error fetching messages:", error);
      setFetchError(error.message);
      // Removed `if (!isBackground)` as `isBackground` is not defined in the original code.
      // Assuming the intent was to always set loading to false on error.
      setIsMessageLoading(false);
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
    if (!input.trim()) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      text: input,
      sender: "user",
      created_at: new Date().toISOString()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      // If we have a session ID, use it. If not (new chat), use 'new' or handle differently.
      // Assuming backend accepts '/chat/send/new' or similar for creating a session.
      // If 'currentSessionId' is null, interpolating it directly results in ".../null" which likely causes 500.
      const endpointSessionId = currentSessionId || 'new';
      const token = getToken();
      const response = await fetch(`http://localhost:5000/chat/send/${endpointSessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          session_id: currentSessionId,
          message: input
        }),
      });

      if (!response.ok) throw new Error("Failed to send message");

      const data = await response.json();
      console.log("SendMessage Response:", data);

      const botData = data.bot || {};
      const botResponse: Message = {
        id: botData.message_id ? botData.message_id.toString() : `bot-${Date.now()}`,
        sender: "bot",
        text: botData.message_text || data.message || data.response || "No response text",
        created_at: botData.sent_at || new Date().toISOString(),
        animate: true // Enable animation for new messages
      };

      // Update the user message with the real ID from the backend
      const updatedUserMessages = newMessages.map(msg => {
        if (msg.id === userMessage.id && data.user?.message_id) {
          return { ...msg, id: data.user.message_id.toString() };
        }
        return msg;
      });

      const updatedMessages = [...updatedUserMessages, botResponse];
      setMessages(updatedMessages);

      if (!currentSessionId && data.user?.chat_session_id) {
        setCurrentSessionId(data.user.chat_session_id);
        // Refresh list to see the new title/session
        await fetchSessions();
      }

    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: `bot-error-${Date.now()}`,
        sender: "bot",
        text: "ขออภัยครับ เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง",
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
      const response = await fetch(`http://localhost:5000/chat/session/${sessionId}`, {
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
    setEditingMessageId(msg.id);
    setEditContent(msg.text);
  };

  const cancelEditing = () => {
    setEditingMessageId(null);
    setEditContent("");
  };

  const saveEdit = async (messageId: string) => {
    console.log("Saving edit for ID:", messageId, "Content:", editContent);
    if (!editContent.trim()) {
      console.warn("Edit content is empty");
      return;
    }

    // 1. Optimistic UI Update
    // Close edit mode immediately
    setEditingMessageId(null);
    setEditContent("");

    // Store original messages in case of error (optional rollback could be added)
    const previousMessages = [...messages];

    // Update the message list immediately
    setMessages((prev) => {
      const editedIndex = prev.findIndex(m => m.id === messageId);
      if (editedIndex === -1) return prev;

      const updated = [...prev];
      // Update User Text
      updated[editedIndex] = { ...updated[editedIndex], text: editContent };

      // Check for next bot message to "Reset" it
      const nextMsgIndex = editedIndex + 1;
      const hasNextBotMsg = nextMsgIndex < updated.length && updated[nextMsgIndex].sender === "bot";

      if (hasNextBotMsg) {
        // Remove the old bot message temporarily to show "Loading" state
        // If it's the last message, this interacts perfectly with global isLoading
        updated.splice(nextMsgIndex, 1);
      }
      return updated;
    });

    // Show persistent loading (like sending a normal message)
    setIsLoading(true);

    try {
      const token = getToken();
      const response = await fetch(`http://localhost:5000/chat/message/${messageId}`, {
        method: 'PUT',
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: editContent,
        }),
      });

      console.log("Save response status:", response.status);

      if (!response.ok) {
        throw new Error("Failed to edit message");
      }

      const data = await response.json();
      console.log("Save success data:", data);

      setMessages((prev) => {
        // We need to find the index again because state might have changed (though unlikely during 'await')
        // Note: We are finding based on the *User Message ID* which is stable.
        const editedIndex = prev.findIndex(m => m.id === messageId);
        if (editedIndex === -1) return prev;

        const updated = [...prev];

        // Ensure User content is synced (already done optimistically, but good to ensure)
        updated[editedIndex] = { ...updated[editedIndex], text: editContent };

        const botData = data.bot || data.bot_response;

        if (botData) {
          const newBotMessage: Message = {
            id: botData.message_id ? botData.message_id.toString() : `bot-${Date.now()}`,
            sender: "bot",
            text: botData.message_text || botData.message || "...",
            created_at: botData.sent_at || new Date().toISOString(),
            animate: true
          };

          // Insert the new bot message right after the edited message
          // Check if there's ALREADY a bot message there (e.g. if optimistic remove failed, or we are replacing)
          const nextMsgIndex = editedIndex + 1;
          const isNextBot = nextMsgIndex < updated.length && updated[nextMsgIndex].sender === "bot";

          if (isNextBot) {
            updated[nextMsgIndex] = newBotMessage;
          } else {
            updated.splice(nextMsgIndex, 0, newBotMessage);
          }
        }

        return updated;
      });

    } catch (error) {
      console.error("Edit message error:", error);
      // Rollback or show error
      setMessages(previousMessages); // Revert on failure
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด',
        text: 'ไม่สามารถแก้ไขข้อความได้'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptPrivacy = () => {
    localStorage.setItem('chatbot_privacy_accepted', 'true');
    setShowPrivacyModal(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 to-green-50/30">
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
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
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

      <div className="max-w-screen-2xl mx-auto flex h-[calc(100vh-64px)] overflow-hidden">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/20 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          id="chat-sidebar"
          className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-white border-r border-neutral-200 flex flex-col transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
            }`}
        >
          <div className="p-4 border-b border-neutral-100 flex flex-col gap-4">
            <div className="flex items-center justify-between lg:hidden">
              <h2 className="text-lg font-bold text-gray-800">เมนู</h2>
              <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-sm font-medium"
            >
              <Plus size={20} />
              แชทใหม่
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 py-2">
              ประวัติการสนทนา ({totalCount})
            </h3>
            {sessions.map((session) => (
              <button
                key={session.session_id}
                onClick={() => handleSelectSession(session.session_id?.toString())}
                className={`w-full text-left px-3 py-3 rounded-xl transition-all flex items-start gap-3 group relative pr-10 ${currentSessionId?.toString() === session.session_id?.toString()
                  ? "bg-green-50 text-green-700 border border-green-100 shadow-sm"
                  : "text-gray-600 hover:bg-gray-50 border border-transparent"
                  }`}
              >
                <MessageSquare size={18} className={`mt-0.5 flex-shrink-0 ${currentSessionId?.toString() === session.session_id?.toString() ? 'text-green-500' : 'text-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {session.title || `Session #${session.session_id}`}
                  </p>
                  <p className="text-xs opacity-70 mt-0.5">
                    {new Date(session.created_at).toLocaleDateString('th-TH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div
                  onClick={(e) => handleDeleteSession(e, session.session_id?.toString())}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-red-500 hover:bg-red-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                  title="ลบแชท"
                >
                  <Trash2 size={16} />
                </div>
              </button>
            ))}
          </div>
        </aside>


        <main className="flex-1 flex flex-col relative w-full bg-white/50 backdrop-blur-sm">

          {/* Mobile Header for Sidebar Toggle */}
          <div className="lg:hidden h-14 border-b border-gray-200 bg-white/80 backdrop-blur flex items-center px-4 justify-between sticky top-0 z-30">
            <button
              id="sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            >
              <Menu size={24} />
            </button>
            <span className="font-semibold text-gray-700">แชตบอตผู้ช่วย</span>
            <div className="w-8"></div> {/* Spacer for centering */}
          </div>


          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
            {!currentSessionId && messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-6">
                  <Bot size={40} className="text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">ยินดีต้อนรับ! {userName ? `คุณ${userName}` : ''}</h2>
                <p className="text-gray-500 max-w-md">
                  เลือกประวัติการแชทด้านซ้าย หรือกด "แชทใหม่" เพื่อปรึกษาเกี่ยวกับการสอบใบประกอบวิชาชีพเภสัชกรรมได้เลย!
                </p>
              </div>
            ) : (
              <>
                {fetchError && (
                  <div className="mx-auto max-w-lg bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 mb-4">
                    <AlertCircle size={20} />
                    <p className="text-sm">ไม่สามารถโหลดข้อความได้: {fetchError}</p>
                  </div>
                )}

                {isMessageLoading ? (
                  <div className="flex justify-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                  </div>
                ) : (
                  messages.length === 0 && !fetchError ? (
                    <div className="text-center py-10 text-gray-400">
                      ไม่พบข้อความในเซสชันนี้
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className={msg.sender === 'bot' ? '' : 'flex justify-end'}>
                        {msg.sender === 'bot' ? (
                          <BotMessage content={msg.text} animate={msg.animate} />
                        ) : (
                          <div className="flex flex-col items-end gap-1 max-w-[85%] sm:max-w-xl w-full">
                            {editingMessageId === msg.id ? (
                              <div className="px-4 py-3 rounded-2xl shadow-sm text-sm break-words whitespace-pre-wrap bg-green-50 text-gray-900 border border-green-200 rounded-tr-sm">
                                <textarea
                                  value={editContent}
                                  onChange={(e) => setEditContent(e.target.value)}
                                  className="w-full text-gray-700 focus:outline-none resize-none bg-transparent disabled:opacity-50"
                                  rows={2}
                                  autoFocus
                                  disabled={isEditLoading}
                                />
                                <div className="flex justify-end gap-2 mt-2">
                                  <button
                                    onClick={cancelEditing}
                                    className="px-3 py-1 text-xs text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
                                    disabled={isEditLoading}
                                  >
                                    ยกเลิก
                                  </button>
                                  <button
                                    onClick={() => saveEdit(msg.id)}
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-1 disabled:opacity-70"
                                    disabled={isEditLoading}
                                  >
                                    {isEditLoading && <span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full"></span>}
                                    บันทึก
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-green-600 text-white px-5 py-3 rounded-2xl rounded-tr-sm shadow-md relative group">
                                <p className="whitespace-pre-wrap">{msg.text}</p>
                                <button
                                  onClick={() => startEditing(msg)}
                                  className="absolute -top-3 -right-3 p-1.5 bg-white text-green-600 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-green-50 border border-green-100 scale-90 hover:scale-100 z-10"
                                  title="แก้ไขข้อความ"
                                >
                                  <Pencil size={14} />
                                </button>
                              </div>
                            )}
                            <span className="text-[10px] text-gray-500 mr-1">
                              {msg.created_at ? new Date(msg.created_at).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                        )}
                      </div>
                    ))
                  )
                )}

                {isLoading && (
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-200">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-gray-100 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto relative flex items-center">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="พิมพ์ข้อความ..."
                className="w-full pl-5 pr-16 py-4 bg-gray-50 border-0 rounded-full focus:ring-2 focus:ring-green-100 focus:bg-white transition-all resize-none shadow-sm text-gray-800"
                rows={1}
                style={{ minHeight: '56px' }}
              />

              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isLoading}
                className="absolute right-2 flex items-center justify-center
                 w-10 h-10 bg-green-600 text-white rounded-full
                 hover:bg-green-700 disabled:opacity-50
                 transition-colors shadow-sm"
              >
                <SendHorizonal size={18} />
              </button>
            </div>
          </div>

        </main>
      </div >
    </div >
  );
}