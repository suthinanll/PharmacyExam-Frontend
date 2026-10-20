'use client';

import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import {
  Sparkles,
  SendHorizonal,
  Clipboard,
  Check,
  X,
  Bot,
  AlertCircle,
  Shield,
  Zap,
  Square,
  RotateCcw,
  MessageCircle,
} from 'lucide-react';
import Swal from '@/utils/sweetalert';
import { useAuth } from '@/contexts/AuthContext';
import { sanitizeHtml } from '@/utils/sanitize';
import {
  PRIVACY_COOKIE,
  rememberPrivacyAccepted,
  hasAcceptedPrivacy,
} from './privacy';

const useTypewriter = (text: string, speed: number = 10) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    setDisplayText('');
    let i = 0;
    const typingInterval = setInterval(() => {
      i++;
      if (i <= text.length) {
        setDisplayText(text.substring(0, i));
      } else {
        clearInterval(typingInterval);
      }
    }, speed);

    return () => clearInterval(typingInterval);
  }, [text, speed]);

  return displayText;
};

const BotMessage = ({
  content,
  animate = false,
}: {
  content: string;
  animate?: boolean;
}) => {
  const [isCopied, setIsCopied] = useState(false);
  const typedContent = useTypewriter(content, 10);
  const displayContent = animate ? typedContent : content;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex items-start gap-2 max-w-[95%] group">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles className="w-3.5 h-3.5 text-white" />
      </div>
      <div className="relative min-w-0">
        <div className="bg-white p-3 rounded-2xl shadow-sm border border-neutral-200">
          <div
            className="prose prose-sm max-w-none text-gray-700 text-sm"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(
                displayContent
                  .replace(/\n/g, '<br>')
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>'),
              ),
            }}
          />
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="absolute -top-5 right-0 p-1 text-neutral-400 hover:text-green-600 transition-all opacity-0 group-hover:opacity-100 flex items-center gap-1 bg-white/80 backdrop-blur rounded px-1.5 shadow-sm border border-neutral-100 cursor-pointer"
        >
          {isCopied ? (
            <Check className="w-3 h-3" />
          ) : (
            <Clipboard className="w-3 h-3" />
          )}
          <span className="text-[0.625rem]">คัดลอก</span>
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

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  animate?: boolean;
};

const MAX_INPUT_LENGTH = 1000;

export default function FloatingChatbot() {
  const { getToken, user } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [countdownText, setCountdownText] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Sync privacy: cookie may lag behind localStorage for returning users
  useEffect(() => {
    if (!isOpen) return;
    if (!hasAcceptedPrivacy()) {
      setShowPrivacyModal(true);
    } else if (
      document.cookie.indexOf(`${PRIVACY_COOKIE}=true`) === -1
    ) {
      rememberPrivacyAccepted();
    }
  }, [isOpen]);

  useEffect(() => {
    if (user?.user_id && isOpen) {
      fetchQuota();
    }
  }, [user?.user_id, isOpen]);

  useEffect(() => {
    if (!quota?.reset_at) return;

    const updateCountdown = () => {
      const target = new Date(quota.reset_at).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);

      if (diff <= 0) {
        setCountdownText('กำลังรีเซ็ต...');
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.min(Math.max(scrollHeight, 44), 120)}px`;
    }
  }, [input]);

  const fetchQuota = async () => {
    const currentUserId = user?.user_id;
    if (!currentUserId) return;
    try {
      const token = getToken();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/quota/${currentUserId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (res.ok) {
        setQuota(await res.json());
      }
    } catch (err) {
      console.error('Fetch quota error:', err);
    }
  };

  const handleCancelRequest = async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsLoading(false);

    if (user?.user_id) {
      try {
        const token = getToken();
        await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/chat/cancel/${user.user_id}`,
          {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          },
        );
      } catch (err) {
        console.error('Failed to notify backend of cancel:', err);
      }
    }
  };

  const handleReset = () => {
    if (isLoading) {
      handleCancelRequest();
    }
    setMessages([]);
    setInput('');
  };

  const handleAcceptPrivacy = () => {
    rememberPrivacyAccepted();
    setShowPrivacyModal(false);
  };

  const handleSendMessage = async () => {
    const currentUserId = user?.user_id;
    if (!currentUserId || !input.trim() || isLoading) return;

    if (input.length > MAX_INPUT_LENGTH) {
      Swal.fire({
        icon: 'warning',
        title: 'ข้อความยาวเกินกำหนด',
        text: `กรุณาลดความยาวข้อความให้อยู่ใน ${MAX_INPUT_LENGTH} ตัวอักษร (ปัจจุบัน ${input.length} ตัวอักษร)`,
        confirmButtonColor: '#5EA500',
      });
      return;
    }

    if (quota?.is_limited) {
      Swal.fire({
        icon: 'info',
        title: 'ความจุการใช้งานเต็ม 100%',
        text: `คุณใช้งานความจุแชตบอตประจำวันครบแล้ว ระบบจะรีเซ็ตความจุใหม่ในเวลา 00:00 น. (อีกประมาณ ${countdownText || 'สักครู่'})`,
        confirmButtonColor: '#5EA500',
      });
      return;
    }

    const sentText = input.trim();
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: sentText,
    };

    // history = messages ก่อนข้อล่าสุด (ไม่รวมข้อความที่กำลังส่ง)
    const history = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setIsLoading(true);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const token = getToken();
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/chat/send`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: sentText,
            history,
          }),
          signal: controller.signal,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        if (response.status === 429) {
          if (errorData?.error === 'CONCURRENT_REQUEST_LIMIT') {
            Swal.fire({
              icon: 'warning',
              title: 'กำลังประมวลผลคำขอก่อนหน้า',
              text: 'กรุณารอสักครู่ให้ AI ตอบเสร็จสิ้นก่อนส่งข้อความใหม่',
              timer: 2500,
              showConfirmButton: false,
            });
          } else {
            Swal.fire({
              icon: 'warning',
              title: 'โควตาความจุเต็ม 100%',
              text:
                errorData?.message ||
                'คุณใช้งานความจุแชตบอตครบ 100% สำหรับวันนี้แล้ว',
              confirmButtonColor: '#5EA500',
            });
            fetchQuota();
          }
          setMessages(messages);
          setInput(sentText);
          return;
        }
        throw new Error(
          errorData?.message || `Failed to send message: ${response.status}`,
        );
      }

      const data = await response.json();

      if (data.cancelled) {
        setMessages([
          ...nextMessages,
          {
            id: `bot-cancelled-${Date.now()}`,
            role: 'assistant',
            content: 'คุณได้ยกเลิกคำถามนี้แล้ว',
          },
        ]);
        if (data.quota) setQuota(data.quota);
        return;
      }

      const botResponse: Message = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content:
          data.reply ||
          data.message ||
          'ขออภัยเกิดข้อผิดพลาดจากระบบ',
        animate: true,
      };

      setMessages([...nextMessages, botResponse]);

      if (data.quota) {
        setQuota(data.quota);
      } else {
        fetchQuota();
      }
    } catch (error: any) {
      if (error?.name === 'AbortError') {
        setMessages([
          ...nextMessages,
          {
            id: `bot-cancelled-${Date.now()}`,
            role: 'assistant',
            content: 'คุณได้ยกเลิกคำถามนี้แล้ว',
          },
        ]);
        return;
      }
      console.error('Error sending message:', error);
      setMessages([
        ...nextMessages,
        {
          id: `bot-error-${Date.now()}`,
          role: 'assistant',
          content:
            error?.message ||
            'ขออภัยครับ เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง',
        },
      ]);
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const capacityPct = quota?.capacity_percentage ?? 0;
  const isLimited = quota?.is_limited ?? false;

  if (!user?.user_id) return null;

  return (
    <>
      {/* Privacy Modal */}
      {showPrivacyModal && isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[110] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-5 py-4 text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-medium">นโยบายความเป็นส่วนตัว</h2>
                <p className="text-green-100 text-sm">เกี่ยวกับการใช้งานแชตบอต</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <p className="font-medium mb-1">ไม่เก็บประวัติการสนทนา</p>
                    <p>
                      ข้อความที่คุณคุยกับแชตบอตจะอยู่ในหน้าจอนี้ชั่วคราวเท่านั้น
                      เมื่อปิดหรือรีเซ็ตแชต ข้อความจะหายไปและไม่ถูกบันทึกในระบบ
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                <h3 className="font-medium text-gray-800">สิ่งที่ระบบยังติดตาม</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>ปริมาณการใช้งานรายวัน (โควตา) เพื่อจำกัดการใช้งานอย่างเป็นธรรม</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <span>ข้อความจะถูกส่งไปประมวลผลชั่วคราวเพื่อสร้างคำตอบเท่านั้น</span>
                  </li>
                </ul>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-green-800">
                    <p className="font-medium mb-1">ความปลอดภัยของข้อมูล</p>
                    <p>
                      เราไม่เผยแพร่หรือขายข้อมูลของคุณให้บุคคลที่สาม
                      และไม่เก็บบทสนทนาไว้ในฐานข้อมูล
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-5 py-4 bg-gray-50">
              <button
                type="button"
                onClick={handleAcceptPrivacy}
                className="w-full px-6 py-3 bg-primary hover:bg-primary-hover text-white font-medium rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-5 h-5" />
                ยอมรับและเริ่มใช้งาน
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {isOpen && (
        <div
          className="fixed z-[100] bottom-20 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[380px] h-[min(560px,calc(100dvh-6.5rem))] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          role="dialog"
          aria-label="แชตบอตผู้ช่วย"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <Bot className="w-5 h-5 shrink-0" />
              <div className="min-w-0">
                <h2 className="font-medium text-sm truncate">แชตบอตผู้ช่วย</h2>
                <p className="text-[0.65rem] text-green-100 truncate">
                  สนทนาชั่วคราว · ไม่เก็บประวัติ
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                title="รีเซ็ตแชต"
                aria-label="รีเซ็ตแชต"
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="ปิด"
                aria-label="ปิดแชตบอต"
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quota bar */}
          <div className="px-3 py-2 border-b border-gray-100 bg-green-50/60 shrink-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-1.5 text-xs text-gray-700">
                <Zap className="w-3.5 h-3.5 text-green-700" />
                <span>ความจุวันนี้</span>
              </div>
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                  capacityPct >= 90
                    ? 'bg-rose-100 text-rose-700'
                    : capacityPct >= 70
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                }`}
              >
                {capacityPct}%
              </span>
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  capacityPct >= 90
                    ? 'bg-rose-500'
                    : capacityPct >= 70
                      ? 'bg-amber-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(100, capacityPct)}%` }}
              />
            </div>
            {isLimited && (
              <p className="text-[0.65rem] text-rose-600 mt-1">
                ความจุเต็ม · รีเซ็ตใน {countdownText || '00:00 น.'}
              </p>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50">
            {messages.length === 0 && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center text-center px-4 text-gray-500">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-3">
                  <Sparkles className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">
                  สวัสดี! มีอะไรให้ช่วยไหม?
                </p>
                <p className="text-xs mt-1 text-gray-500">
                  ถามเรื่องเภสัชกรรมหรือการเตรียมสอบได้เลย
                </p>
              </div>
            )}

            {messages.map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] bg-green-600 text-white px-3.5 py-2.5 rounded-2xl rounded-br-md text-sm whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              ) : (
                <BotMessage
                  key={msg.id}
                  content={msg.content}
                  animate={msg.animate}
                />
              ),
            )}

            {isLoading && (
              <div className="flex items-start gap-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                </div>
                <div className="bg-white px-4 py-3 rounded-2xl border border-neutral-200 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:0ms]" />
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:150ms]" />
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-gray-100 bg-white shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={
                  isLimited
                    ? 'ความจุเต็มแล้ว...'
                    : 'พิมพ์คำถาม...'
                }
                disabled={isLimited || showPrivacyModal}
                rows={1}
                maxLength={MAX_INPUT_LENGTH}
                className="flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/40 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
              {isLoading ? (
                <button
                  type="button"
                  onClick={handleCancelRequest}
                  aria-label="หยุดการตอบ"
                  className="p-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer shrink-0"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLimited || showPrivacyModal}
                  aria-label="ส่งข้อความ"
                  className="p-2.5 rounded-xl bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white transition-colors cursor-pointer shrink-0"
                >
                  <SendHorizonal className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-[0.6rem] text-gray-400 mt-1.5 text-right">
              {input.length}/{MAX_INPUT_LENGTH}
            </p>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label={isOpen ? 'ปิดแชตบอต' : 'เปิดแชตบอต'}
        aria-expanded={isOpen}
        className={`fixed z-[100] bottom-4 right-4 sm:right-6 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 cursor-pointer ${
          isOpen
            ? 'bg-gray-700 hover:bg-gray-800 text-white rotate-0'
            : 'bg-green-600 hover:bg-green-700 text-white hover:scale-105'
        }`}
      >
        {isOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <MessageCircle className="w-6 h-6" />
        )}
      </button>
    </>
  );
}
