"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect, useRef } from "react";
import {
    UploadCloud, FileText, Trash2, Loader2,
    Database, AlertCircle, FileUp, X, BookOpen
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Swal from "sweetalert2";

interface ChatbotDocument {
    id: number;
    file_name: string;
    file_size: string;
    uploaded_by: number;
    uploaded_at: string;
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;

export default function ChatbotKnowledgePage() {
    const { getToken, user } = useAuth();
    const [documents, setDocuments] = useState<ChatbotDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => { fetchDocuments(); }, []);

    const fetchDocuments = async () => {
        try {
            setLoading(true);
            const token = getToken();
            const res = await fetch(`${API_URL}/chatbot-documents`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                setDocuments(await res.json());
            } else {
                // Mock data ขณะ Backend ยังไม่พร้อม
                setDocuments([
                    { id: 1, file_name: "drug_guideline_2024.pdf", file_size: "2.4 MB", uploaded_by: 1, uploaded_at: new Date().toISOString() },
                    { id: 2, file_name: "pharmacy_act_2567.pdf", file_size: "1.1 MB", uploaded_by: 1, uploaded_at: new Date(Date.now() - 86400000).toISOString() },
                ]);
            }
        } catch {
            setDocuments([
                { id: 1, file_name: "drug_guideline_2024.pdf", file_size: "2.4 MB", uploaded_by: 1, uploaded_at: new Date().toISOString() },
                { id: 2, file_name: "pharmacy_act_2567.pdf", file_size: "1.1 MB", uploaded_by: 1, uploaded_at: new Date(Date.now() - 86400000).toISOString() },
            ]);
        } finally {
            setLoading(false);
        }
    };

    // ─── Drag & Drop ───
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(e.type === "dragenter" || e.type === "dragover");
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault(); e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
    };
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
    };
    const handleFileSelect = (file: File) => {
        if (!file.name.toLowerCase().endsWith(".pdf")) {
            Swal.fire({ title: "ไฟล์ไม่ถูกประเภท", text: "รองรับเฉพาะไฟล์ PDF เท่านั้น", icon: "error", confirmButtonColor: "#22c55e" });
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            Swal.fire({ title: "ไฟล์ขนาดใหญ่เกินไป", text: "กรุณาอัปโหลดไฟล์ขนาดไม่เกิน 10MB", icon: "error", confirmButtonColor: "#22c55e" });
            return;
        }
        setSelectedFile(file);
    };
    const removeSelectedFile = () => {
        setSelectedFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // ─── Upload ───
    const handleUpload = async () => {
        if (!selectedFile) return;
        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/chatbot-documents/upload`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });
            if (res.ok) {
                Swal.fire({ title: "อัปโหลดสำเร็จ!", text: "นำเข้าเอกสารเข้าสู่ Pinecone เรียบร้อยแล้ว", icon: "success", confirmButtonColor: "#22c55e" });
                removeSelectedFile();
                fetchDocuments();
            } else {
                // ดึงข้อความ error จริงจาก backend มาแสดง (เพื่อ debug ตอน deploy)
                let serverMsg = `HTTP ${res.status}`;
                try {
                    const errBody = await res.json();
                    if (errBody?.message) {
                        serverMsg = Array.isArray(errBody.message)
                            ? errBody.message.join(", ")
                            : errBody.message;
                    }
                } catch { /* ignore parse errors */ }
                throw new Error(serverMsg);
            }
        } catch (error) {
            console.error("Upload error:", error);
            Swal.fire({ 
                title: "อัปโหลดล้มเหลว", 
                text: "เกิดข้อผิดพลาดในการอัปโหลดเอกสารเข้าสู่ระบบ: " + (error instanceof Error ? error.message : "ไม่ทราบสาเหตุ"), 
                icon: "error", 
                confirmButtonColor: "#ef4444" 
            });
            setIsUploading(false);
            return;
        }
        setIsUploading(false);
    };

    // ─── Delete ───
    const handleDelete = async (id: number, fileName: string) => {
        const result = await Swal.fire({
            title: "ยืนยันการลบ?",
            html: `ต้องการลบ <strong>${fileName}</strong> ออกจากฐานความรู้บอตหรือไม่?<br/><span class="text-red-500 text-sm">Vectors ทั้งหมดของไฟล์นี้จะถูกลบออกจาก Pinecone</span>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#d1d5db",
            confirmButtonText: "ลบเลย",
            cancelButtonText: "ยกเลิก"
        });
        if (!result.isConfirmed) return;
        try {
            const token = getToken();
            await fetch(`${API_URL}/chatbot-documents/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch { /* proceed anyway for mock */ }
        setDocuments(prev => prev.filter(d => d.id !== id));
        Swal.fire({ title: "ลบสำเร็จ", icon: "success", confirmButtonColor: "#22c55e", timer: 1500, showConfirmButton: false });
    };

    return (
        <Navbar_admin>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6" suppressHydrationWarning>

                {/* ─── Header ─── */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">
                                จัดการองค์ความรู้ Chatbot
                            </h1>
                            <p className="text-sm text-gray-500">
                                อัปโหลดไฟล์ PDF เพื่อให้ AI เรียนรู้และตอบคำถามผู้ใช้ · {documents.length} เอกสารในระบบ
                            </p>
                        </div>
                        {/* Upload trigger button */}
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-medium shadow-sm transition-all hover:shadow-md"
                        >
                            <FileUp size={18} /> อัปโหลดเอกสาร
                        </button>
                    </div>
                </div>

                {/* ─── Stats Cards ─── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase">เอกสารทั้งหมด</p>
                            <h3 className="text-2xl font-medium text-gray-900">{documents.length}</h3>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                            <Database size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase">Vector Database</p>
                            <h3 className="text-sm font-medium text-gray-900 mt-0.5">Pinecone</h3>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                            <FileText size={24} />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase">รูปแบบที่รองรับ</p>
                            <h3 className="text-sm font-medium text-gray-900 mt-0.5">PDF (สูงสุด 10MB)</h3>
                        </div>
                    </div>
                </div>

                {/* ─── Upload Zone (hidden input + drag area) ─── */}
                <div
                    className={`relative border-2 border-dashed rounded-2xl mb-6 transition-all duration-200 ${
                        dragActive
                            ? "border-green-500 bg-green-50"
                            : selectedFile
                            ? "border-green-400 bg-green-50/60"
                            : "border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100"
                    }`}
                    onDragEnter={handleDrag} onDragLeave={handleDrag}
                    onDragOver={handleDrag} onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef} type="file" accept="application/pdf"
                        onChange={handleChange} disabled={isUploading}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-6">
                        {!selectedFile ? (
                            <>
                                <div className="w-14 h-14 bg-white border border-gray-200 rounded-xl flex items-center justify-center shrink-0 text-gray-400 shadow-sm">
                                    <UploadCloud size={28} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-700">ลากไฟล์ PDF มาวางที่นี่ หรือคลิก "อัปโหลดเอกสาร"</p>
                                    <p className="text-xs text-gray-400 mt-0.5">รองรับไฟล์ PDF ขนาดไม่เกิน 10MB</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center shrink-0 text-green-600">
                                    <FileText size={28} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 truncate">{selectedFile.name}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 pointer-events-none relative z-10">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeSelectedFile(); }}
                                        disabled={isUploading}
                                        className="pointer-events-auto p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                                        disabled={isUploading}
                                        className="pointer-events-auto flex items-center gap-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-sm font-medium px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
                                    >
                                        {isUploading
                                            ? <><Loader2 size={15} className="animate-spin" /> กำลังนำเข้า...</>
                                            : <><UploadCloud size={15} /> ยืนยันอัปโหลด</>
                                        }
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ─── Notice ─── */}
                <div className="flex items-start gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 mb-6">
                    <AlertCircle size={16} className="shrink-0 mt-0.5 text-amber-500" />
                    <span>ไฟล์ที่อัปโหลดจะถูก<strong>แตกข้อความ และสร้าง Vector Embeddings</strong> เพื่อบันทึกลง Pinecone อาจใช้เวลาสักครู่ขึ้นอยู่กับขนาดไฟล์</span>
                </div>

                {/* ─── Documents Table ─── */}
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-gray-200 animate-pulse shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                                    <div className="h-3 w-1/3 animate-pulse rounded bg-gray-200" />
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-gray-200 animate-pulse shrink-0" />
                            </div>
                        ))}
                    </div>
                ) : documents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400">
                        <Database size={40} className="mb-3 opacity-30" />
                        <p className="font-medium text-gray-500">ยังไม่มีเอกสารในฐานข้อมูล</p>
                        <p className="text-sm mt-1">อัปโหลดไฟล์ PDF เพื่อเพิ่มความรู้ให้ Chatbot</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className="bg-green-600 text-white">
                                    <tr>
                                        {["#", "ชื่อเอกสาร", "ขนาดไฟล์", "วันที่อัปโหลด", "จัดการ"].map((h, i) => (
                                            <th key={h} className={`px-5 py-3 text-left text-xs font-medium tracking-wide ${i === 0 ? "w-12 text-center rounded-tl-2xl" : ""} ${i === 4 ? "text-center rounded-tr-2xl" : ""}`}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {documents.map((doc, idx) => (
                                        <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-5 py-3.5 text-sm text-gray-500 text-center">{idx + 1}</td>
                                            <td className="px-5 py-3.5">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-red-50 text-red-500 rounded-lg shrink-0">
                                                        <FileText size={16} />
                                                    </div>
                                                    <span className="text-sm font-medium text-gray-900 truncate max-w-xs" title={doc.file_name}>
                                                        {doc.file_name}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{doc.file_size}</td>
                                            <td className="px-5 py-3.5 text-xs text-gray-400 whitespace-nowrap">
                                                {new Date(doc.uploaded_at).toLocaleDateString("th-TH", {
                                                    year: "numeric", month: "short", day: "numeric",
                                                    hour: "2-digit", minute: "2-digit"
                                                })}
                                            </td>
                                            <td className="px-5 py-3.5 text-center">
                                                <button
                                                    onClick={() => handleDelete(doc.id, doc.file_name)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="ลบเอกสาร"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </Navbar_admin>
    );
}