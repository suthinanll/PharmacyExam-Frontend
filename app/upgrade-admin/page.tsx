"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { withRedirect } from "@/utils/redirect";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Ban,
  BarChart3,
  BookOpen,
  Brain,
  Braces,
  Check,
  CheckCircle2,
  Crown,
  Download,
  FileCode,
  ImageIcon,
  Landmark,
  Link2,
  Loader2,
  LogIn,
  Newspaper,
  QrCode,
  Receipt,
  RefreshCcw,
  ShieldCheck,
  Timer,
  Upload,
  Users,
  Wallet,
  XCircle,
} from "lucide-react";

type FlowState = "idle" | "qr" | "verifying" | "success" | "expired";
type PaymentMethod = "promptpay" | "truewallet";
type SlipMethod = "image" | "payload" | "base64" | "url";

type PaymentHistoryItem = {
  id: number;
  amount: number;
  method: PaymentMethod;
  methodLabel: string;
  transactionRef: string | null;
  paidAt: string;
  expiresAt: string | null;
};

const ADMIN_FEATURES = [
  { icon: BarChart3, text: "แดชบอร์ดสถิติและภาพรวมระบบ" },
  { icon: Users, text: "จัดการผู้ใช้งานและสิทธิ์เข้าใช้งาน" },
  { icon: BookOpen, text: "สร้างและนำเข้าคลังข้อสอบ" },
  { icon: Brain, text: "จัดการ CAT, IRT และการวิเคราะห์ข้อสอบ" },
  { icon: Newspaper, text: "จัดการข่าวสาร ปฏิทิน และประกาศ" },
];

const PAYMENT_METHODS: { id: PaymentMethod; label: string; desc: string; icon: any }[] = [
  {
    id: "promptpay",
    label: "PromptPay",
    desc: "สแกน QR ด้วยแอปธนาคาร",
    icon: Landmark,
  },
  {
    id: "truewallet",
    label: "TrueMoney Wallet",
    desc: "โอนเข้าหมายเลข Wallet",
    icon: Wallet,
  },
];

const SLIP_METHODS: { id: SlipMethod; label: string; icon: any }[] = [
  { id: "image", label: "รูปสลิป", icon: ImageIcon },
  { id: "payload", label: "Payload", icon: Braces },
  // { id: "base64", label: "Base64", icon: FileCode },
  // { id: "url", label: "URL", icon: Link2 },
];

function apiBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/+$/, "");
}

function formatCountdown(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatDate(iso?: string | null) {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function UpgradeAdminPage() {
  const { user, getToken, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [flow, setFlow] = useState<FlowState>("idle");
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("promptpay");
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [walletInstructions, setWalletInstructions] = useState<string | null>(null);
  const [subscriptionId, setSubscriptionId] = useState<number | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [slipMethod, setSlipMethod] = useState<SlipMethod>("image");
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPayload, setSlipPayload] = useState("");
  const [slipBase64, setSlipBase64] = useState("");
  const [slipUrl, setSlipUrl] = useState("");

  const [mySubscription, setMySubscription] = useState<{
    hasActiveSubscription: boolean;
    daysRemaining?: number;
    expiresAt?: string;
  } | null>(null);
  const [settings, setSettings] = useState<{ annualPrice: number; isEnabled: boolean } | null>(null);
  const [history, setHistory] = useState<PaymentHistoryItem[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);

  const baseUrl = apiBaseUrl();
  const annualPrice = settings?.annualPrice ?? 0;
  const paymentEnabled = settings?.isEnabled ?? true;
  const isSuperAdmin = user?.role_id === 3;
  const isPaidAdmin = user?.role_id === 2;
  const isRenewal = isPaidAdmin && !!mySubscription?.hasActiveSubscription;

  const ctaText = useMemo(() => {
    if (!isAuthenticated) return "เข้าสู่ระบบเพื่อซื้อแผน Admin";
    if (isRenewal) return "ต่ออายุแผน Admin";
    return "ซื้อแผน Admin";
  }, [isAuthenticated, isRenewal]);

  useEffect(() => {
    const fetchStatus = async () => {
      if (authLoading) return;

      try {
        const res = await fetch(`${baseUrl}/payment/settings`);
        if (res.ok) setSettings(await res.json());
      } catch {
        setErrorMsg("โหลดราคาชำระเงินไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      }

      if (!isAuthenticated) {
        setLoadingStatus(false);
        return;
      }

      const token = getToken();
      const auth = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const [subRes, historyRes] = await Promise.all([
          fetch(`${baseUrl}/payment/my-subscription`, auth),
          fetch(`${baseUrl}/payment/my-history`, auth),
        ]);
        if (subRes.ok) setMySubscription(await subRes.json());
        if (historyRes.ok) setHistory(await historyRes.json());
      } catch {
        setErrorMsg("โหลดสถานะสมาชิกไม่สำเร็จ แต่ยังสามารถลองสร้างรายการชำระเงินได้");
      }

      try {
        const res = await fetch(`${baseUrl}/payment/pending`, auth);
        if (res.ok) {
          const data = await res.json();
          if (data.pending) {
            setSubscriptionId(data.subscriptionId);
            setSelectedMethod(data.method);
            setSecondsRemaining(data.secondsRemaining);
            if (data.method === "truewallet") {
              setWalletInstructions(data.instructions?.text ?? null);
              setQrImage(null);
            } else {
              setQrImage(data.qrImage);
              setWalletInstructions(null);
            }
            setFlow("qr");
          }
        }
      } catch {
        // ไม่มีรายการค้างก็เริ่มจากหน้าเลือกแผนตามปกติ
      } finally {
        setLoadingStatus(false);
      }
    };

    fetchStatus();
  }, [authLoading, isAuthenticated, getToken, baseUrl]);

  useEffect(() => {
    if (flow !== "qr" || secondsRemaining <= 0) return;
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setFlow("expired");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [flow, secondsRemaining > 0]);

  const clearSlipInputs = () => {
    setSlipFile(null);
    setSlipPayload("");
    setSlipBase64("");
    setSlipUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const resetPaymentFlow = () => {
    setFlow("idle");
    setErrorMsg("");
    setQrImage(null);
    setWalletInstructions(null);
    setSubscriptionId(null);
    setSecondsRemaining(0);
    clearSlipInputs();
  };

  useEffect(() => {
    if (selectedMethod === "truewallet" && slipMethod === "payload") {
      setSlipMethod("image");
      setSlipPayload("");
    }
  }, [selectedMethod, slipMethod]);

  const handleGenerateQr = async () => {
    if (!isAuthenticated) {
      router.push("/admin-login");
      return;
    }
    if (isSuperAdmin) return;

    setFlow("qr");
    setErrorMsg("");
    setQrImage(null);
    setWalletInstructions(null);

    try {
      const token = getToken();
      const res = await fetch(`${baseUrl}/payment/generate-qr`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ method: selectedMethod }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "ไม่สามารถสร้างรายการชำระเงินได้");

      setSubscriptionId(data.subscriptionId);
      setSecondsRemaining(data.secondsRemaining ?? 5 * 60);
      if (typeof data.amount === "number") {
        setSettings((prev) => (prev ? { ...prev, annualPrice: data.amount } : prev));
      }
      if (data.method === "truewallet") {
        setWalletInstructions(data.instructions?.text ?? null);
      } else {
        setQrImage(data.qrImage);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "เกิดข้อผิดพลาด");
      setFlow("idle");
    }
  };

  const isSlipInputReady =
    (slipMethod === "image" && !!slipFile) ||
    (slipMethod === "payload" && selectedMethod !== "truewallet" && !!slipPayload.trim()) ||
    (slipMethod === "base64" && !!slipBase64.trim()) ||
    (slipMethod === "url" && !!slipUrl.trim());

  const getResponseMessage = (data: any, fallback: string) => {
    if (Array.isArray(data?.message)) return data.message.join("\n");
    return data?.message || data?.error || fallback;
  };

  const handleSubmitSlip = async () => {
    if (!isSlipInputReady || !subscriptionId) return;
    if (selectedMethod === "truewallet" && slipMethod === "payload") {
      setErrorMsg("TrueMoney Wallet ไม่รองรับการยืนยันด้วย Payload กรุณาใช้รูปสลิป, Base64 หรือ URL");
      return;
    }
    setFlow("verifying");
    setErrorMsg("");

    try {
      const token = getToken();
      const formData = new FormData();
      formData.append("subscriptionId", String(subscriptionId));
      if (slipMethod === "image" && slipFile) {
        formData.append("image", slipFile);
      } else if (slipMethod === "payload") {
        formData.append("payload", slipPayload.trim());
      } else if (slipMethod === "base64") {
        formData.append("base64", slipBase64.trim());
      } else if (slipMethod === "url") {
        formData.append("url", slipUrl.trim());
      }

      const res = await fetch(`${baseUrl}/payment/verify-slip`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const message = getResponseMessage(data, "ตรวจสอบสลิปไม่ผ่าน");
        console.error("verify-slip failed", { status: res.status, data });
        throw new Error(message);
      }
      setFlow("success");
      setMySubscription({
        hasActiveSubscription: true,
        expiresAt: data.expiresAt,
        daysRemaining: 365,
      });
    } catch (err: any) {
      const message = err.message || "ตรวจสอบสลิปไม่ผ่าน กรุณาลองแนบสลิปใหม่อีกครั้ง";
      setErrorMsg(message);
      clearSlipInputs();
      setFlow("qr");
    }
  };

  const downloadReceipt = async (id: number) => {
    try {
      const res = await fetch(`${baseUrl}/payment/receipt/${id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("ไม่สามารถดาวน์โหลดใบเสร็จได้");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `receipt-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      setErrorMsg(err.message || "ดาวน์โหลดใบเสร็จไม่สำเร็จ");
    }
  };

  if (authLoading || loadingStatus) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" text="กำลังโหลดแผนสมาชิก..." />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Link
            href="/login"
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:border-green-200 hover:bg-green-50 hover:text-green-700"
          >
            <ArrowLeft className="h-4 w-4" />
            กลับหน้า login ปกติ
          </Link>

          <div className="mb-8 max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              สมัครสมาชิกหรือเข้าสู่ระบบเพื่อซื้อแผน Admin
            </div>
            <h1 className="text-2xl font-medium tracking-normal text-gray-900 sm:text-3xl">
              อัปเกรดเป็นผู้ดูแลระบบ
            </h1>
            <p className="mt-3 text-sm leading-6 text-gray-600 sm:text-base">
              สมัครสมาชิกปกติได้ก่อน แล้วเข้าสู่ระบบในฐานะผู้ดูแลระบบเพื่อซื้อแผนรายปี ระบบจะเปิดสิทธิ์ให้บัญชีที่ชำระเงินสำเร็จเท่านั้น
            </p>
          </div>

          {errorMsg && flow === "idle" && (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-[1fr_390px] lg:items-start">
            <section className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Free</h2>
                    <p className="text-sm text-gray-500">บัญชีผู้เรียนทั่วไป</p>
                  </div>
                  <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                    ปัจจุบัน
                  </span>
                </div>
                <div className="mb-5">
                  <span className="text-3xl font-medium">0</span>
                  <span className="ml-1 text-sm text-gray-500">บาท</span>
                </div>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    ทำข้อสอบและดูประวัติการสอบของตัวเอง
                  </li>
                  <li className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                    ใช้ chatbot และบันทึก note ส่วนตัว
                  </li>
                  <li className="flex gap-2 text-gray-400">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    ไม่รวมเครื่องมือจัดการระบบ
                  </li>
                </ul>
              </div>

              <div className="rounded-2xl border-2 border-green-600 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">Admin</h2>
                    <p className="text-sm text-gray-500">สิทธิ์ผู้ดูแลระบบรายปี</p>
                  </div>
                  <span className="rounded-lg bg-green-600 px-2.5 py-1 text-xs font-medium text-white">
                    แนะนำ
                  </span>
                </div>
                <div className="mb-5">
                  <span className="text-3xl font-medium">
                    {annualPrice ? annualPrice.toLocaleString() : "-"}
                  </span>
                  <span className="ml-1 text-sm text-gray-500">บาท / ปี</span>
                </div>
                <ul className="space-y-3 text-sm text-gray-700">
                  {ADMIN_FEATURES.map((feature) => {
                    const Icon = feature.icon;
                    return (
                      <li key={feature.text} className="flex gap-2">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                        {feature.text}
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-2xl border border-green-100 bg-green-50/50 p-5 md:col-span-2">
                <h2 className="mb-3 text-base font-medium text-green-800">เปิดสิทธิ์จากบัญชีสมาชิกของคุณ</h2>
                <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <p className="font-medium text-gray-900">สมัครสมาชิก</p>
                    <p className="mt-1">สร้างบัญชีผู้ใช้ทั่วไปก่อนซื้อแผนได้ทันที</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <p className="font-medium text-gray-900">เข้าสู่ระบบแอดมิน</p>
                    <p className="mt-1">บัญชีที่ยังไม่มีสิทธิ์จะถูกพามาหน้านี้</p>
                  </div>
                  <div className="rounded-xl bg-white p-3 shadow-sm">
                    <p className="font-medium text-gray-900">ชำระเงินและรับใบเสร็จ</p>
                    <p className="mt-1">ยืนยันสลิปแล้วระบบเปิดสิทธิ์ให้อัตโนมัติ</p>
                  </div>
                </div>
              </div>
            </section>

            <aside className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <p className="text-xs font-medium uppercase text-gray-500">Checkout</p>
                  <h2 className="mt-1 text-xl font-medium text-gray-900">Admin Plan</h2>
                </div>
                <div className="rounded-xl bg-green-50 p-2 text-green-700">
                  <Crown className="h-5 w-5" />
                </div>
              </div>

              {isSuperAdmin ? (
                <div className="space-y-4 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">บัญชีนี้เป็น Super Admin</p>
                    <p className="mt-1 text-sm text-gray-500">ไม่ต้องซื้อแผนรายปี</p>
                  </div>
                  <button
                    onClick={() => router.push("/admin")}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700"
                  >
                    ไปหน้า Admin <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              ) : !paymentEnabled ? (
                <div className="space-y-3 text-center">
                  <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100 text-gray-400">
                    <Ban className="h-5 w-5" />
                  </div>
                  <p className="font-medium text-gray-900">ปิดรับชำระเงินชั่วคราว</p>
                  <p className="text-sm text-gray-500">กรุณาติดต่อผู้ดูแลระบบหรือกลับมาใหม่ภายหลัง</p>
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="rounded-lg bg-gray-50 p-4">
                    <div className="flex items-end justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-500">{isRenewal ? "ต่ออายุรายปี" : "ยอดชำระวันนี้"}</p>
                        <p className="mt-1 text-3xl font-medium text-gray-900">
                          {annualPrice ? annualPrice.toLocaleString() : "-"} ฿
                        </p>
                      </div>
                      <span className="text-xs font-medium text-gray-500">1 ปี</span>
                    </div>
                    {mySubscription?.hasActiveSubscription && (
                      <p className="mt-3 text-xs text-green-700">
                        สิทธิ์ปัจจุบันเหลือ {mySubscription.daysRemaining} วัน หมดอายุ {formatDate(mySubscription.expiresAt)}
                      </p>
                    )}
                    {isPaidAdmin && (
                      <button
                        type="button"
                        onClick={() => router.push("/admin")}
                        className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-3 py-2.5 text-sm font-medium text-green-700 transition hover:bg-green-50"
                      >
                        เข้าแผงผู้ดูแลระบบ <ArrowRight className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {flow === "idle" && (
                    <>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-900">วิธีชำระเงิน</p>
                        {PAYMENT_METHODS.map((method) => {
                          const Icon = method.icon;
                          return (
                            <button
                              key={method.id}
                              type="button"
                              onClick={() => setSelectedMethod(method.id)}
                              className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition ${
                                selectedMethod === method.id
                                  ? "border-green-500 bg-green-50"
                                  : "border-gray-200 hover:bg-gray-50"
                              }`}
                            >
                              <Icon className="h-5 w-5 shrink-0 text-gray-700" />
                              <span className="min-w-0">
                                <span className="block text-sm font-medium text-gray-900">{method.label}</span>
                                <span className="block text-xs text-gray-500">{method.desc}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={handleGenerateQr}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700"
                      >
                        {isAuthenticated ? (
                          <>
                            <QrCode className="h-4 w-4" />
                            {ctaText}
                          </>
                        ) : (
                          <>
                            <LogIn className="h-4 w-4" />
                            {ctaText}
                          </>
                        )}
                      </button>

                      {!isAuthenticated && (
                        <p className="text-center text-xs text-gray-500">
                          ยังไม่มีบัญชี?{" "}
                          <Link
                            href={withRedirect("/register", "/upgrade-admin")}
                            className="font-medium text-green-700 underline"
                          >
                            สมัครสมาชิกเพื่อซื้อแผน
                          </Link>
                        </p>
                      )}
                    </>
                  )}

                  {flow === "qr" && (qrImage || walletInstructions) && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                        <span className="inline-flex items-center gap-1.5 font-medium">
                          <Timer className="h-4 w-4" />
                          เวลายืนยัน
                        </span>
                        <span>{formatCountdown(secondsRemaining)} นาที</span>
                      </div>

                      {errorMsg && (
                        <div className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      {qrImage ? (
                        <div className="text-center">
                          {/* <img
                            src={qrImage}
                            alt="PromptPay QR"
                            className="mx-auto h-56 w-56 rounded-lg border border-gray-200 bg-white"
                          /> */}
                          <p className="mt-2 text-xs text-gray-500">
                            สแกนจ่าย {annualPrice.toLocaleString()} บาท แล้วอัปโหลดสลิป
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-700">
                          <Wallet className="mx-auto mb-2 h-6 w-6 text-gray-800" />
                          {walletInstructions}
                        </div>
                      )}

                      <div className="space-y-3">
                        <p className="text-sm font-medium text-gray-900">ยืนยันสลิป</p>
                        <div className="grid grid-cols-4 gap-1.5">
                          {SLIP_METHODS.filter(
                            (method) => !(selectedMethod === "truewallet" && method.id === "payload"),
                          ).map((method) => {
                            const Icon = method.icon;
                            return (
                              <button
                                key={method.id}
                                type="button"
                                onClick={() => setSlipMethod(method.id)}
                                className={`flex flex-col items-center gap-1 rounded-lg border px-1 py-2 text-[11px] font-medium transition ${
                                  slipMethod === method.id
                                    ? "border-green-500 bg-green-50 text-green-700"
                                    : "border-gray-200 text-gray-500 hover:bg-gray-50"
                                }`}
                              >
                                <Icon className="h-4 w-4" />
                                {method.label}
                              </button>
                            );
                          })}
                        </div>

                        {slipMethod === "image" && (
                          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-600 transition hover:border-green-300 hover:bg-green-50/60">
                            <ImageIcon className="h-5 w-5 shrink-0 text-green-700" />
                            <span className="min-w-0 flex-1">
                              <span className="block font-medium text-gray-900">
                                {slipFile ? slipFile.name : "อัปโหลดรูปสลิป"}
                              </span>
                              <span className="mt-0.5 block text-xs text-gray-500">
                                รองรับไฟล์รูปภาพเท่านั้น
                              </span>
                            </span>
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={(event) => setSlipFile(event.target.files?.[0] ?? null)}
                              className="sr-only"
                            />
                          </label>
                        )}
                        {slipMethod === "payload" && (
                          <input
                            type="text"
                            value={slipPayload}
                            onChange={(event) => setSlipPayload(event.target.value)}
                            placeholder="วาง QR payload"
                            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-green-500"
                          />
                        )}
                      
                        {slipMethod === "url" && (
                          <input
                            type="url"
                            value={slipUrl}
                            onChange={(event) => setSlipUrl(event.target.value)}
                            placeholder="https://example.com/slip.jpg"
                            className="w-full rounded-xl border border-gray-300 px-3 py-2.5 text-sm outline-none transition focus:border-green-500"
                          />
                        )}

                        <button
                          onClick={handleSubmitSlip}
                          disabled={!isSlipInputReady}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Upload className="h-4 w-4" />
                          ตรวจสอบและเปิดสิทธิ์
                        </button>
                      </div>
                    </div>
                  )}

                  {flow === "verifying" && (
                    <div className="py-8 text-center">
                      <Loader2 className="mx-auto h-10 w-10 animate-spin text-green-600" />
                      <p className="mt-3 text-sm text-gray-600">กำลังตรวจสอบสลิป...</p>
                    </div>
                  )}

                  {flow === "success" && (
                    <div className="space-y-4 py-4 text-center">
                      <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
                      <div>
                        <p className="font-medium text-gray-900">ชำระเงินสำเร็จ</p>
                        <p className="mt-1 text-sm text-gray-500">
                          ระบบอัปเดตสิทธิ์แล้ว กรุณาเข้าสู่ระบบใหม่เพื่อรับ token สิทธิ์ล่าสุด
                        </p>
                      </div>
                      <button
                        onClick={() => router.push("/admin-login")}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700"
                      >
                        เข้าสู่ระบบใหม่ <ArrowRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {flow === "expired" && (
                    <div className="space-y-4 py-4 text-center">
                      <XCircle className="mx-auto h-12 w-12 text-rose-600" />
                      <div>
                        <p className="font-medium text-gray-900">รายการนี้หมดเวลาแล้ว</p>
                        <p className="mt-1 text-sm text-gray-500">สร้างรายการใหม่เพื่อรับ QR หรือคำแนะนำการโอนชุดใหม่</p>
                      </div>
                      <button
                        onClick={resetPaymentFlow}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-green-700"
                      >
                        <RefreshCcw className="h-4 w-4" />
                        สร้างรายการใหม่
                      </button>
                    </div>
                  )}
                </div>
              )}
            </aside>
          </div>

          {history.length > 0 && (
            <section className="mt-6 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-gray-500" />
                <h2 className="text-base font-medium text-gray-900">ประวัติการชำระเงินของคุณ</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {history.map((item) => (
                  <div key={item.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {Number(item.amount).toLocaleString()} บาท
                        <span className="font-normal text-gray-500"> · {item.methodLabel}</span>
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        ชำระเมื่อ {formatDate(item.paidAt)} · หมดอายุ {formatDate(item.expiresAt)}
                      </p>
                    </div>
                    <button
                      onClick={() => downloadReceipt(item.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 transition hover:bg-gray-50 sm:w-auto"
                    >
                      <Download className="h-3.5 w-3.5" />
                      ใบเสร็จ
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
    </main>
  );
}
