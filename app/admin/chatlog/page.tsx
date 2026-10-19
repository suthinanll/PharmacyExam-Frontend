"use client";

import Navbar_admin from "@/components/Navbar_admin";
import { useState, useEffect, useRef, useMemo } from "react";
import {
    UploadCloud, FileText, Trash2, Loader2,
    Database, AlertCircle, FileUp, X, BookOpen,
    Search, FileCheck, ChevronLeft, ChevronRight,
    RotateCcw, CheckSquare, Square, MinusSquare,
    Eye, Download, FileSpreadsheet, FileCode, ExternalLink
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import Swal from "@/utils/sweetalert";
import SuggestInput from '@/components/SuggestInput';

interface ChatbotDocument {
    id: number;
    file_name: string;
    file_size: string;
    file_url?: string;
    uploaded_by: number;
    uploaded_at: string;
    deleted_at?: string | null;
}

interface PreviewState {
    doc: ChatbotDocument;
    blobUrl: string;
    contentType: string;
    textContent?: string;
    fileType: 'pdf' | 'text' | 'office' | 'other';
}

const API_URL = `${process.env.NEXT_PUBLIC_API_URL}`;
const ALLOWED_EXTENSIONS = ['pdf', 'txt', 'csv', 'doc', 'docx', 'xls', 'xlsx'];

// Helper to render file icon by file extension
function getFileIcon(fileName: string) {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf') {
        return (
            <div className="p-2.5 bg-red-50 text-red-500 rounded-xl shrink-0">
                <FileText size={18} />
            </div>
        );
    }
    if (ext === 'docx' || ext === 'doc') {
        return (
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <FileText size={18} />
            </div>
        );
    }
    if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') {
        return (
            <div className="p-2.5 bg-green-50 text-green-600 rounded-xl shrink-0">
                <FileSpreadsheet size={18} />
            </div>
        );
    }
    return (
        <div className="p-2.5 bg-gray-100 text-gray-600 rounded-xl shrink-0">
            <FileCode size={18} />
        </div>
    );
}

export default function ChatbotKnowledgePage() {
    const { getToken } = useAuth();
    const [activeDocuments, setActiveDocuments] = useState<ChatbotDocument[]>([]);
    const [deletedDocuments, setDeletedDocuments] = useState<ChatbotDocument[]>([]);
    const [tab, setTab] = useState<'active' | 'deleted'>('active');
    const [loading, setLoading] = useState(true);
    const [dragActive, setDragActive] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage, setPerPage] = useState(10);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Document Preview Modal State
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewState | null>(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    // Clean up Blob URLs on unmount or preview close
    useEffect(() => {
        return () => {
            if (previewData?.blobUrl) {
                URL.revokeObjectURL(previewData.blobUrl);
            }
        };
    }, [previewData]);

    // Reset selection and page when switching tabs or search
    useEffect(() => {
        setSelectedIds([]);
        setCurrentPage(1);
    }, [tab, searchTerm]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const token = getToken();
            const [activeRes, deletedRes] = await Promise.all([
                fetch(`${API_URL}/chatbot-documents`, {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                fetch(`${API_URL}/chatbot-documents/deleted`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (activeRes.ok) {
                setActiveDocuments(await activeRes.json());
            } else {
                setActiveDocuments([
                    { id: 1, file_name: "drug_guideline_2024.pdf", file_size: "2.4 MB", uploaded_by: 1, uploaded_at: new Date().toISOString() },
                    { id: 2, file_name: "pharmacy_law_summary.docx", file_size: "1.1 MB", uploaded_by: 1, uploaded_at: new Date(Date.now() - 86400000).toISOString() },
                    { id: 3, file_name: "drug_interactions.xlsx", file_size: "850 KB", uploaded_by: 1, uploaded_at: new Date(Date.now() - 172800000).toISOString() },
                ]);
            }

            if (deletedRes.ok) {
                setDeletedDocuments(await deletedRes.json());
            } else {
                setDeletedDocuments([]);
            }
        } catch {
            setActiveDocuments([
                { id: 1, file_name: "drug_guideline_2024.pdf", file_size: "2.4 MB", uploaded_by: 1, uploaded_at: new Date().toISOString() },
                { id: 2, file_name: "pharmacy_law_summary.docx", file_size: "1.1 MB", uploaded_by: 1, uploaded_at: new Date(Date.now() - 86400000).toISOString() },
                { id: 3, file_name: "drug_interactions.xlsx", file_size: "850 KB", uploaded_by: 1, uploaded_at: new Date(Date.now() - 172800000).toISOString() },
            ]);
            setDeletedDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    // ─── Drag & Drop ───
    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(e.type === "dragenter" || e.type === "dragover");
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0]);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
    };

    const handleFileSelect = (file: File) => {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            Swal.fire({
                title: "รูปแบบไฟล์ไม่ถูกต้อง",
                text: `ระบบรองรับเฉพาะไฟล์ ${ALLOWED_EXTENSIONS.map(e => '.' + e).join(', ')} เท่านั้น`,
                icon: "error",
                confirmButtonColor: "#16a34a",
                confirmButtonText: "ตกลง"
            });
            return;
        }
        if (file.size > 20 * 1024 * 1024) {
            Swal.fire({
                title: "ขนาดไฟล์เกินกำหนด",
                text: "กรุณาอัปโหลดไฟล์ขนาดไม่เกิน 20MB",
                icon: "error",
                confirmButtonColor: "#16a34a",
                confirmButtonText: "ตกลง"
            });
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
                Swal.fire({
                    title: "อัปโหลดสำเร็จ",
                    text: "นำเข้าเอกสารเข้าสู่ฐานข้อมูลความรู้เรียบร้อยแล้ว",
                    icon: "success",
                    confirmButtonColor: "#16a34a",
                    confirmButtonText: "ตกลง"
                });
                removeSelectedFile();
                fetchAllData();
            } else {
                let serverMsg = `HTTP ${res.status}`;
                try {
                    const errBody = await res.json();
                    if (errBody?.message) {
                        serverMsg = Array.isArray(errBody.message)
                            ? errBody.message.join(", ")
                            : errBody.message;
                    }
                } catch { }
                throw new Error(serverMsg);
            }
        } catch (error) {
            console.error("Upload error:", error);
            const errorMsg = error instanceof Error ? error.message : String(error);
            const isQuotaLimit =
                errorMsg.includes("429") ||
                errorMsg.toLowerCase().includes("quota") ||
                errorMsg.includes("โควตา") ||
                errorMsg.includes("ลิมิต") ||
                errorMsg.toLowerCase().includes("too many requests") ||
                errorMsg.toLowerCase().includes("resource_exhausted");

            if (isQuotaLimit) {
                Swal.fire({
                    title: "ไม่สามารถอัปโหลดไฟล์ได้ในขณะนี้",
                    html: `
                        <div className="text-sm text-gray-700 text-left space-y-3">
                            <p className="font-medium text-gray-900">
                                เนื่องจากโควตาการเรียกใช้งานโมเดล AI (Gemini Embedding) เต็มชั่วคราว
                            </p>
                            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs sm:text-sm font-medium">
                                คำแนะนำ: กรุณารอสักครู่ (ประมาณ 1 - 2 นาที) เพื่อให้โควตารีเซ็ต แล้วกดปุ่ม "ยืนยันอัปโหลด" ใหม่อีกครั้ง
                            </div>
                        </div>
                    `,
                    icon: "warning",
                    confirmButtonColor: "#16a34a",
                    confirmButtonText: "รับทราบ"
                });
            } else {
                Swal.fire({
                    title: "อัปโหลดไม่สำเร็จ",
                    text: errorMsg || "เกิดข้อผิดพลาดในการอัปโหลดเอกสาร",
                    icon: "error",
                    confirmButtonColor: "#ef4444",
                    confirmButtonText: "ตกลง"
                });
            }
        } finally {
            setIsUploading(false);
        }
    };

    // ─── Open / Preview Document ───
    const handleOpenPreview = async (doc: ChatbotDocument) => {
        setPreviewLoading(true);
        const ext = doc.file_name.split('.').pop()?.toLowerCase() || '';
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/chatbot-documents/${doc.id}/view`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!res.ok) {
                throw new Error('ไม่พบไฟล์เอกสารบนเซิร์ฟเวอร์');
            }

            const contentType = res.headers.get('content-type') || '';
            const blob = await res.blob();
            const blobUrl = URL.createObjectURL(blob);

            if (ext === 'pdf') {
                setPreviewData({
                    doc,
                    blobUrl,
                    contentType: 'application/pdf',
                    fileType: 'pdf'
                });
            } else if (ext === 'txt' || ext === 'csv') {
                const text = await blob.text();
                setPreviewData({
                    doc,
                    blobUrl,
                    contentType: 'text/plain',
                    textContent: text,
                    fileType: 'text'
                });
            } else if (['doc', 'docx', 'xls', 'xlsx'].includes(ext)) {
                setPreviewData({
                    doc,
                    blobUrl,
                    contentType,
                    fileType: 'office'
                });
            } else {
                setPreviewData({
                    doc,
                    blobUrl,
                    contentType,
                    fileType: 'other'
                });
            }
        } catch (error: any) {
            Swal.fire({
                title: "ไม่สามารถเปิดไฟล์ได้",
                text: error.message || "ไม่พบไฟล์เอกสารต้นฉบับบนเซิร์ฟเวอร์ (อาจเป็นข้อมูลตัวอย่างหรือไฟล์ถูกลบไปแล้ว)",
                icon: "warning",
                confirmButtonColor: "#16a34a",
                confirmButtonText: "ตกลง"
            });
        } finally {
            setPreviewLoading(false);
        }
    };

    const closePreview = () => {
        if (previewData?.blobUrl) {
            URL.revokeObjectURL(previewData.blobUrl);
        }
        setPreviewData(null);
    };

    // ─── Download Document ───
    const handleDownloadDocument = async (doc: ChatbotDocument) => {
        try {
            const token = getToken();
            const res = await fetch(`${API_URL}/chatbot-documents/${doc.id}/download`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const blob = await res.blob();
                const downloadUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = downloadUrl;
                a.download = doc.file_name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(downloadUrl);
            } else {
                throw new Error('ไม่พบไฟล์เอกสารบนเซิร์ฟเวอร์');
            }
        } catch (error: any) {
            Swal.fire({
                title: "ดาวน์โหลดไม่สำเร็จ",
                text: error.message || "เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์",
                icon: "error",
                confirmButtonColor: "#ef4444",
                confirmButtonText: "ตกลง"
            });
        }
    };

    // ─── Soft Delete Single ───
    const handleSoftDelete = async (id: number, fileName: string) => {
        const result = await Swal.fire({
            title: "ยืนยันการลบเอกสาร",
            html: `ต้องการย้ายไฟล์ <strong>${fileName}</strong> ไปยังถังขยะหรือไม่?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "ย้ายไปถังขยะ",
            cancelButtonText: "ยกเลิก",
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            const token = getToken();
            await fetch(`${API_URL}/chatbot-documents/${id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch { }

        const target = activeDocuments.find(d => d.id === id);
        if (target) {
            setActiveDocuments(prev => prev.filter(d => d.id !== id));
            setDeletedDocuments(prev => [{ ...target, deleted_at: new Date().toISOString() }, ...prev]);
        }
        setSelectedIds(prev => prev.filter(item => item !== id));

        Swal.fire({
            title: "ย้ายไปถังขยะสำเร็จ",
            text: "คุณสามารถกู้คืนเอกสารนี้ได้จากแท็บถังขยะ",
            icon: "success",
            confirmButtonColor: "#16a34a",
            timer: 1500,
            showConfirmButton: false
        });
    };

    // ─── Batch Soft Delete ───
    const handleBatchSoftDelete = async () => {
        if (selectedIds.length === 0) return;

        const result = await Swal.fire({
            title: `ยืนยันการลบ ${selectedIds.length} รายการ`,
            html: `ต้องการย้ายเอกสารที่เลือกทั้งหมด <strong>${selectedIds.length} รายการ</strong> ไปยังถังขยะหรือไม่?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: `ย้าย ${selectedIds.length} รายการไปถังขยะ`,
            cancelButtonText: "ยกเลิก",
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            const token = getToken();
            await fetch(`${API_URL}/chatbot-documents/batch-delete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ids: selectedIds })
            });
        } catch { }

        const moved = activeDocuments.filter(d => selectedIds.includes(d.id));
        setActiveDocuments(prev => prev.filter(d => !selectedIds.includes(d.id)));
        setDeletedDocuments(prev => [...moved.map(d => ({ ...d, deleted_at: new Date().toISOString() })), ...prev]);
        setSelectedIds([]);

        Swal.fire({
            title: "ย้ายไปถังขยะเรียบร้อย",
            icon: "success",
            confirmButtonColor: "#16a34a",
            timer: 1500,
            showConfirmButton: false
        });
    };

    // ─── Restore Single ───
    const handleRestore = async (id: number, fileName: string) => {
        const result = await Swal.fire({
            title: "ยืนยันการกู้คืนเอกสาร",
            html: `ต้องการกู้คืนไฟล์ <strong>${fileName}</strong> กลับมาใช้งานหรือไม่?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#16a34a",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "กู้คืนเอกสาร",
            cancelButtonText: "ยกเลิก",
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            const token = getToken();
            await fetch(`${API_URL}/chatbot-documents/${id}/restore`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch { }

        const target = deletedDocuments.find(d => d.id === id);
        if (target) {
            setDeletedDocuments(prev => prev.filter(d => d.id !== id));
            setActiveDocuments(prev => [{ ...target, deleted_at: null }, ...prev]);
        }
        setSelectedIds(prev => prev.filter(item => item !== id));

        Swal.fire({
            title: "กู้คืนเอกสารสำเร็จ",
            icon: "success",
            confirmButtonColor: "#16a34a",
            timer: 1500,
            showConfirmButton: false
        });
    };

    // ─── Batch Restore ───
    const handleBatchRestore = async () => {
        if (selectedIds.length === 0) return;

        const result = await Swal.fire({
            title: `กู้คืน ${selectedIds.length} รายการ`,
            html: `ต้องการกู้คืนเอกสารที่เลือก <strong>${selectedIds.length} รายการ</strong> กลับมาใช้งานหรือไม่?`,
            icon: "question",
            showCancelButton: true,
            confirmButtonColor: "#16a34a",
            cancelButtonColor: "#6b7280",
            confirmButtonText: `กู้คืน ${selectedIds.length} รายการ`,
            cancelButtonText: "ยกเลิก",
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            const token = getToken();
            await fetch(`${API_URL}/chatbot-documents/batch-restore`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ids: selectedIds })
            });
        } catch { }

        const restored = deletedDocuments.filter(d => selectedIds.includes(d.id));
        setDeletedDocuments(prev => prev.filter(d => !selectedIds.includes(d.id)));
        setActiveDocuments(prev => [...restored.map(d => ({ ...d, deleted_at: null })), ...prev]);
        setSelectedIds([]);

        Swal.fire({
            title: "กู้คืนเอกสารเรียบร้อย",
            icon: "success",
            confirmButtonColor: "#16a34a",
            timer: 1500,
            showConfirmButton: false
        });
    };

    // ─── Permanent Delete Single ───
    const handlePermanentDelete = async (id: number, fileName: string) => {
        const result = await Swal.fire({
            title: "ยืนยันการลบถาวร",
            html: `ต้องการลบไฟล์ <strong>${fileName}</strong> ออกจากระบบและฐานข้อมูลอย่างถาวรหรือไม่?<br/><span class="text-red-500 text-sm">การดำเนินการนี้ไม่สามารถย้อนกลับได้</span>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: "ลบถาวร",
            cancelButtonText: "ยกเลิก",
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            const token = getToken();
            await fetch(`${API_URL}/chatbot-documents/${id}/permanent`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
        } catch { }

        setDeletedDocuments(prev => prev.filter(d => d.id !== id));
        setSelectedIds(prev => prev.filter(item => item !== id));

        Swal.fire({
            title: "ลบเอกสารถาวรเรียบร้อย",
            icon: "success",
            confirmButtonColor: "#16a34a",
            timer: 1500,
            showConfirmButton: false
        });
    };

    // ─── Batch Permanent Delete ───
    const handleBatchPermanentDelete = async () => {
        if (selectedIds.length === 0) return;

        const result = await Swal.fire({
            title: `ยืนยันการลบถาวร ${selectedIds.length} รายการ`,
            html: `ต้องการลบเอกสารที่เลือก <strong>${selectedIds.length} รายการ</strong> ออกจากระบบและฐานข้อมูลอย่างถาวรหรือไม่?<br/><span class="text-red-500 text-sm">การดำเนินการนี้ไม่สามารถย้อนกลับได้</span>`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#ef4444",
            cancelButtonColor: "#6b7280",
            confirmButtonText: `ลบถาวร ${selectedIds.length} รายการ`,
            cancelButtonText: "ยกเลิก",
            reverseButtons: true,
        });

        if (!result.isConfirmed) return;

        try {
            const token = getToken();
            await fetch(`${API_URL}/chatbot-documents/batch-permanent-delete`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ ids: selectedIds })
            });
        } catch { }

        setDeletedDocuments(prev => prev.filter(d => !selectedIds.includes(d.id)));
        setSelectedIds([]);

        Swal.fire({
            title: "ลบเอกสารถาวรเรียบร้อย",
            icon: "success",
            confirmButtonColor: "#16a34a",
            timer: 1500,
            showConfirmButton: false
        });
    };

    // ─── Filtering & Pagination ───
    const currentList = tab === 'active' ? activeDocuments : deletedDocuments;

    const filteredDocuments = useMemo(() => {
        if (!searchTerm.trim()) return currentList;
        const q = searchTerm.toLowerCase().trim();
        return currentList.filter(doc => doc.file_name.toLowerCase().includes(q));
    }, [currentList, searchTerm]);

    const totalPages = Math.max(1, Math.ceil(filteredDocuments.length / perPage));
    const paginatedDocuments = useMemo(() => {
        const start = (currentPage - 1) * perPage;
        return filteredDocuments.slice(start, start + perPage);
    }, [filteredDocuments, currentPage, perPage]);

    // ─── Selection Logic ───
    const isAllPageSelected = paginatedDocuments.length > 0 && paginatedDocuments.every(d => selectedIds.includes(d.id));
    const isSomePageSelected = paginatedDocuments.some(d => selectedIds.includes(d.id)) && !isAllPageSelected;

    const toggleSelectAllPage = () => {
        if (isAllPageSelected) {
            const pageIds = paginatedDocuments.map(d => d.id);
            setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
        } else {
            const pageIds = paginatedDocuments.map(d => d.id);
            setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
        }
    };

    const toggleSelectRow = (id: number) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    return (
        <Navbar_admin>
            <div className="max-w-7xl mx-auto w-full space-y-6" suppressHydrationWarning>

                {/* ─── Header ─── */}
                <div className="mb-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">
                                จัดการองค์ความรู้ Chatbot
                            </h1>
                            <p className="text-sm text-gray-500">
                                อัปโหลดและจัดการไฟล์เอกสารสำหรับฐานความรู้ของ Chatbot (RAG) · {activeDocuments.length} เอกสารที่ใช้งาน
                            </p>
                        </div>
                        {/* Upload trigger button */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-all cursor-pointer"
                        >
                            <FileUp size={18} />
                            <span>อัปโหลดเอกสาร</span>
                        </button>
                    </div>
                </div>

                {/* ─── Stats Cards ─── */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-xl shrink-0">
                            <BookOpen size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">เอกสารที่ใช้งาน</p>
                            <p className="text-2xl font-medium text-gray-900 mt-0.5">{activeDocuments.length} <span className="text-sm text-gray-500 font-medium">รายการ</span></p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                            <Database size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Vector Database</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">Pinecone (RAG Vector Store)</p>
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                            <FileCheck size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500 font-medium">รูปแบบที่รองรับ</p>
                            <p className="text-sm font-medium text-gray-900 mt-1">PDF, Word, Excel, CSV, Text</p>
                        </div>
                    </div>
                </div>

                {/* ─── Upload Zone (hidden input + drag area) ─── */}
                <div
                    className={`relative border-2 border-dashed rounded-2xl transition-all duration-200 ${dragActive
                            ? "border-green-500 bg-green-50"
                            : selectedFile
                                ? "border-green-400 bg-green-50/60"
                                : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                        }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.txt,.csv,.doc,.docx,.xls,.xlsx"
                        onChange={handleChange}
                        disabled={isUploading}
                        aria-label="อัปโหลดไฟล์เอกสารเข้าสู่ฐานความรู้"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    />
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-6">
                        {!selectedFile ? (
                            <>
                                <div className="w-12 h-12 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-center shrink-0 text-gray-600 shadow-sm">
                                    <UploadCloud size={24} />
                                </div>
                                <div className="text-center sm:text-left">
                                    <p className="text-sm font-medium text-gray-700">ลากไฟล์ PDF, Word (.docx), Excel (.xlsx), CSV หรือ Text (.txt) มาวางที่นี่</p>
                                    <p className="text-sm text-gray-500 mt-0.5">รองรับไฟล์ประเภท .pdf, .docx, .xlsx, .csv, .txt ขนาดไม่เกิน 20MB</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center shrink-0 text-green-600">
                                    <FileText size={24} />
                                </div>
                                <div className="flex-1 min-w-0 text-center sm:text-left">
                                    <p className="text-sm font-medium text-gray-800 truncate">{selectedFile.name}</p>
                                    <p className="text-sm text-gray-500 mt-0.5">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 pointer-events-none relative z-10">
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); removeSelectedFile(); }}
                                        disabled={isUploading}
                                        aria-label="ยกเลิกไฟล์ที่เลือกนี้"
                                        className="pointer-events-auto p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                        title="ยกเลิกไฟล์นี้"
                                    >
                                        <X size={18} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={(e) => { e.stopPropagation(); handleUpload(); }}
                                        disabled={isUploading}
                                        className="pointer-events-auto flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-60"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>กำลังนำเข้าข้อมูล...</span>
                                            </>
                                        ) : (
                                            <>
                                                <UploadCloud size={16} />
                                                <span>ยืนยันอัปโหลด</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* ─── Notice ─── */}
                <div className="flex items-start gap-2.5 text-sm text-amber-800 bg-amber-50 border border-amber-200/60 rounded-xl px-4 py-3">
                    <AlertCircle size={18} className="shrink-0 mt-0.5 text-amber-600" />
                    <span>ไฟล์ที่อัปโหลด (PDF, Word, Excel, CSV, TXT) จะถูกสกัดข้อความ แปลงเป็น Vector Embeddings และจัดเก็บบน Pinecone โดยอัตโนมัติ เพื่อให้ AI นำไปอ้างอิงในการตอบคำถาม</span>
                </div>

                {/* ─── Tabs & Controls ─── */}
                <div className="space-y-3 pt-2">
                    {/* Tabs */}
                    <div className="flex items-center justify-between border-b border-gray-200">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setTab('active')}
                                className={`pb-3 px-4 text-sm font-medium transition-all relative cursor-pointer ${tab === 'active'
                                        ? 'text-green-700 border-b-2 border-green-600 font-medium'
                                        : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                <span>เอกสารที่ใช้งาน</span>
                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    {activeDocuments.length}
                                </span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setTab('deleted')}
                                className={`pb-3 px-4 text-sm font-medium transition-all relative cursor-pointer ${tab === 'deleted'
                                        ? 'text-amber-700 border-b-2 border-amber-600 font-medium'
                                        : 'text-gray-500 hover:text-gray-800'
                                    }`}
                            >
                                <span>ถังขยะ</span>
                                <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                    {deletedDocuments.length}
                                </span>
                            </button>
                        </div>
                    </div>

                    {/* Search & Bulk Action Banner */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                            <SuggestInput
                                placeholder="ค้นหาชื่อเอกสาร..."
                                aria-label="ค้นหาชื่อเอกสารในฐานความรู้"
                                value={searchTerm}
                                onValueChange={setSearchTerm}
                                suggestions={currentList.map((doc) => doc.file_name)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all shadow-xs"
                            />
                        </div>

                        {/* Bulk Action Controls */}
                        {selectedIds.length > 0 ? (
                            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl shadow-xs animate-in fade-in duration-150">
                                <span className="text-sm font-medium text-gray-700">
                                    เลือก <strong className="text-gray-900">{selectedIds.length}</strong> รายการ
                                </span>
                                <div className="h-4 w-px bg-gray-300 mx-1" />
                                {tab === 'active' ? (
                                    <button
                                        type="button"
                                        onClick={handleBatchSoftDelete}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-lg text-sm font-medium transition-all shadow-xs cursor-pointer"
                                    >
                                        <Trash2 size={15} />
                                        <span>ย้ายไปถังขยะ</span>
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={handleBatchRestore}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-lg text-sm font-medium transition-all shadow-xs cursor-pointer"
                                        >
                                            <RotateCcw size={15} />
                                            <span>กู้คืนที่เลือก</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleBatchPermanentDelete}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-lg text-sm font-medium transition-all shadow-xs cursor-pointer"
                                        >
                                            <Trash2 size={15} />
                                            <span>ลบถาวร</span>
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setSelectedIds([])}
                                    aria-label="ยกเลิกการเลือกเอกสารทั้งหมด"
                                    className="p-1.5 text-gray-600 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
                                    title="ยกเลิกการเลือก"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <div className="text-sm font-medium text-gray-500 text-right">
                                แสดง {filteredDocuments.length} รายการ
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Documents Table ─── */}
                {loading ? (
                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 p-6 space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex items-center gap-4 animate-pulse">
                                <div className="w-5 h-5 rounded bg-gray-100 shrink-0" />
                                <div className="w-10 h-10 rounded-xl bg-gray-100 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-4 w-1/3 rounded bg-gray-100" />
                                    <div className="h-3 w-1/4 rounded bg-gray-100" />
                                </div>
                                <div className="w-8 h-8 rounded-lg bg-gray-100 shrink-0" />
                            </div>
                        ))}
                    </div>
                ) : filteredDocuments.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 bg-white border border-gray-200 rounded-2xl text-gray-500">
                        <Database size={40} className="mb-3 opacity-30 text-gray-500" />
                        <p className="font-medium text-lg text-gray-700">
                            {searchTerm
                                ? "ไม่พบเอกสารที่ค้นหา"
                                : tab === 'deleted'
                                    ? "ไม่มีเอกสารในถังขยะ"
                                    : "ยังไม่มีเอกสารในฐานข้อมูลความรู้"}
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                            {searchTerm
                                ? "ลองค้นหาด้วยคำค้นอื่น"
                                : tab === 'deleted'
                                    ? "เอกสารที่ถูกลบจะมาอยู่ที่นี่ และสามารถกู้คืนได้"
                                    : "อัปโหลดไฟล์ PDF, Word, Excel, CSV หรือ Text ด้านบนเพื่อเพิ่มความรู้ให้ Chatbot"}
                        </p>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-100">
                                <thead className={tab === 'deleted' ? 'bg-amber-600 text-white' : 'bg-green-600 text-white'}>
                                    <tr>
                                        {/* Checkbox All */}
                                        <th scope="col" className="w-12 px-4 py-3.5 text-center rounded-tl-2xl">
                                            <button
                                                type="button"
                                                onClick={toggleSelectAllPage}
                                                aria-label={isAllPageSelected ? "ยกเลิกเลือกทั้งหมดในหน้านี้" : "เลือกทั้งหมดในหน้านี้"}
                                                className="text-white hover:opacity-80 transition-opacity cursor-pointer inline-flex items-center justify-center"
                                                title={isAllPageSelected ? "ยกเลิกเลือกทั้งหมดในหน้านี้" : "เลือกทั้งหมดในหน้านี้"}
                                            >
                                                {isAllPageSelected ? (
                                                    <CheckSquare size={18} />
                                                ) : isSomePageSelected ? (
                                                    <MinusSquare size={18} />
                                                ) : (
                                                    <Square size={18} />
                                                )}
                                            </button>
                                        </th>
                                        <th scope="col" className="w-12 px-3 py-3.5 text-left text-sm font-medium tracking-wide">#</th>
                                        <th scope="col" className="px-5 py-3.5 text-left text-sm font-medium tracking-wide">ชื่อเอกสาร</th>
                                        <th scope="col" className="px-5 py-3.5 text-left text-sm font-medium tracking-wide">ขนาดไฟล์</th>
                                        <th scope="col" className="px-5 py-3.5 text-left text-sm font-medium tracking-wide">
                                            {tab === 'deleted' ? 'วันที่ลบ' : 'วันที่อัปโหลด'}
                                        </th>
                                        <th scope="col" className="w-36 px-5 py-3.5 text-center text-sm font-medium tracking-wide rounded-tr-2xl">จัดการ</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedDocuments.map((doc, idx) => {
                                        const isSelected = selectedIds.includes(doc.id);
                                        return (
                                            <tr
                                                key={doc.id}
                                                className={`transition-colors ${isSelected
                                                        ? tab === 'deleted'
                                                            ? 'bg-amber-50/60'
                                                            : 'bg-green-50/60'
                                                        : tab === 'deleted'
                                                            ? 'hover:bg-amber-50/30'
                                                            : 'hover:bg-gray-50/80'
                                                    }`}
                                            >
                                                {/* Checkbox single */}
                                                <td className="px-4 py-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isSelected}
                                                        onChange={() => toggleSelectRow(doc.id)}
                                                        aria-label={`เลือกเอกสาร ${doc.file_name}`}
                                                        className="w-4 h-4 rounded text-green-600 focus:ring-green-500 border-gray-300 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="px-3 py-4 text-sm text-gray-500 text-left font-medium">
                                                    {(currentPage - 1) * perPage + idx + 1}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex items-center gap-3">
                                                        {getFileIcon(doc.file_name)}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenPreview(doc)}
                                                            className="text-sm font-medium text-gray-900 hover:text-green-600 transition-colors truncate max-w-md text-left cursor-pointer"
                                                            title={`คลิกเพื่อเปิดอ่าน: ${doc.file_name}`}
                                                        >
                                                            {doc.file_name}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-4 text-sm text-gray-600 whitespace-nowrap font-medium">
                                                    {doc.file_size}
                                                </td>
                                                <td className="px-5 py-4 text-sm text-gray-500 whitespace-nowrap">
                                                    {new Date(tab === 'deleted' && doc.deleted_at ? doc.deleted_at : doc.uploaded_at).toLocaleDateString("th-TH", {
                                                        year: "numeric",
                                                        month: "short",
                                                        day: "numeric",
                                                        hour: "2-digit",
                                                        minute: "2-digit"
                                                    })}
                                                </td>
                                                <td className="px-5 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        {/* ปุ่มเปิดอ่านไฟล์ */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleOpenPreview(doc)}
                                                            aria-label={`เปิดอ่านเอกสาร ${doc.file_name}`}
                                                            className="p-1.5 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                                                            title="เปิดอ่านเอกสาร"
                                                        >
                                                            <Eye size={16} />
                                                        </button>

                                                        {/* ปุ่มดาวน์โหลดไฟล์ */}
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDownloadDocument(doc)}
                                                            aria-label={`ดาวน์โหลดไฟล์ ${doc.file_name}`}
                                                            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                                                            title="ดาวน์โหลดไฟล์"
                                                        >
                                                            <Download size={16} />
                                                        </button>

                                                        {tab === 'active' ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleSoftDelete(doc.id, doc.file_name)}
                                                                aria-label={`ย้ายเอกสาร ${doc.file_name} ไปถังขยะ`}
                                                                className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                                                                title="ย้ายไปถังขยะ"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleRestore(doc.id, doc.file_name)}
                                                                    aria-label={`กู้คืนเอกสาร ${doc.file_name}`}
                                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                                                                    title="กู้คืนเอกสาร"
                                                                >
                                                                    <RotateCcw size={16} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handlePermanentDelete(doc.id, doc.file_name)}
                                                                    aria-label={`ลบเอกสาร ${doc.file_name} ถาวร`}
                                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all cursor-pointer inline-flex items-center justify-center"
                                                                    title="ลบถาวร"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* ─── Pagination Footer ─── */}
                        <div className="px-5 py-4 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
                            <div className="text-sm text-gray-500 font-medium">
                                แสดง <span className="text-gray-900 font-medium">{filteredDocuments.length > 0 ? (currentPage - 1) * perPage + 1 : 0}</span> -{' '}
                                <span className="text-gray-900 font-medium">{Math.min(currentPage * perPage, filteredDocuments.length)}</span> จากทั้งหมด{' '}
                                <span className="text-gray-900 font-medium">{filteredDocuments.length}</span> รายการ
                                {totalPages > 1 && ` (หน้า ${currentPage}/${totalPages})`}
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Per page selector */}
                                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                                    <span>แสดง:</span>
                                    <select
                                        value={perPage}
                                        aria-label="จำนวนรายการต่อหน้า"
                                        onChange={(e) => {
                                            setPerPage(Number(e.target.value));
                                            setCurrentPage(1);
                                        }}
                                        className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-green-500 cursor-pointer"
                                    >
                                        <option value={5}>5</option>
                                        <option value={10}>10</option>
                                        <option value={20}>20</option>
                                        <option value={50}>50</option>
                                    </select>
                                </div>

                                {/* Page navigation buttons */}
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        disabled={currentPage <= 1}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        aria-label="ไปยังหน้าก่อนหน้า"
                                        className="px-2.5 h-8 flex items-center justify-center gap-1 border border-gray-200 rounded-lg text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 bg-white text-sm font-medium transition cursor-pointer"
                                    >
                                        <ChevronLeft size={16} />
                                        <span className="hidden sm:inline">ก่อนหน้า</span>
                                    </button>

                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                                        const isActive = p === currentPage;
                                        return (
                                            <button
                                                type="button"
                                                key={p}
                                                onClick={() => setCurrentPage(p)}
                                                aria-label={`ไปยังหน้าที่ ${p}`}
                                                aria-current={isActive ? "page" : undefined}
                                                className={`w-8 h-8 text-sm font-medium rounded-lg transition-colors cursor-pointer ${isActive
                                                        ? tab === 'deleted'
                                                            ? 'bg-amber-600 text-white shadow-xs'
                                                            : 'bg-green-600 text-white shadow-xs'
                                                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {p}
                                            </button>
                                        );
                                    })}

                                    <button
                                        type="button"
                                        disabled={currentPage >= totalPages}
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        aria-label="ไปยังหน้าถัดไป"
                                        className="px-2.5 h-8 flex items-center justify-center gap-1 border border-gray-200 rounded-lg text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 bg-white text-sm font-medium transition cursor-pointer"
                                    >
                                        <span className="hidden sm:inline">ถัดไป</span>
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Loading Overlay for Document Preview ─── */}
            {previewLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                    <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center gap-3">
                        <Loader2 className="animate-spin text-green-600" size={24} />
                        <span className="text-sm font-medium text-gray-700">กำลังเตรียมเปิดไฟล์เอกสาร...</span>
                    </div>
                </div>
            )}

            {/* ─── Document Preview Modal ─── */}
            {previewData && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={closePreview} />

                    {/* Modal Content */}
                    <div className="relative z-10 w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
                            <div className="flex items-center gap-3 min-w-0">
                                {getFileIcon(previewData.doc.file_name)}
                                <div className="min-w-0">
                                    <h2 className="text-sm font-medium text-gray-900 truncate" title={previewData.doc.file_name}>
                                        {previewData.doc.file_name}
                                    </h2>
                                    <p className="text-xs text-gray-500 font-medium">{previewData.doc.file_size}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <a
                                    href={previewData.blobUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label={`เปิดดู ${previewData.doc.file_name} ในแท็บใหม่`}
                                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
                                    title="เปิดในแท็บใหม่"
                                >
                                    <ExternalLink size={18} />
                                </a>
                                <button
                                    type="button"
                                    onClick={() => handleDownloadDocument(previewData.doc)}
                                    aria-label={`ดาวน์โหลดไฟล์ ${previewData.doc.file_name}`}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white rounded-xl text-sm font-medium transition-all shadow-xs cursor-pointer"
                                >
                                    <Download size={15} />
                                    <span>ดาวน์โหลด</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={closePreview}
                                    aria-label="ปิดหน้าต่างแสดงตัวอย่าง"
                                    className="p-2 text-gray-600 hover:text-gray-600 hover:bg-gray-200/60 rounded-xl transition-colors cursor-pointer"
                                    title="ปิดหน้าต่าง"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-auto p-4 bg-gray-100 min-h-[50vh]">
                            {previewData.fileType === 'pdf' ? (
                                <iframe
                                    src={previewData.blobUrl}
                                    className="w-full h-full min-h-[70vh] rounded-xl border border-gray-200 bg-white"
                                    title={previewData.doc.file_name}
                                />
                            ) : previewData.fileType === 'text' ? (
                                <div className="bg-white p-6 rounded-xl border border-gray-200  text-sm text-gray-800 whitespace-pre-wrap leading-relaxed max-h-[70vh] overflow-auto select-text shadow-xs">
                                    {previewData.textContent || '(ไฟล์นี้ไม่มีเนื้อหาข้อความ)'}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl border border-gray-200 shadow-xs">
                                    <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl mb-4">
                                        <FileText size={48} />
                                    </div>
                                    <h3 className="text-base font-medium text-gray-900 mb-1">
                                        {previewData.doc.file_name}
                                    </h3>
                                    <p className="text-sm text-gray-500 max-w-md mb-6">
                                        ไฟล์เอกสาร Office (Word / Excel) ไม่สามารถแสดงตัวอย่างบนเบราว์เซอร์ได้โดยตรง คุณสามารถดาวน์โหลดไฟล์เพื่อเปิดอ่านบนเครื่องของคุณได้
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => handleDownloadDocument(previewData.doc)}
                                        aria-label={`ดาวน์โหลดไฟล์ ${previewData.doc.file_size}`}
                                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700 active:scale-95 text-white px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm transition-all cursor-pointer"
                                    >
                                        <Download size={18} />
                                        <span>ดาวน์โหลดไฟล์ {previewData.doc.file_size}</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Navbar_admin>
    );
}