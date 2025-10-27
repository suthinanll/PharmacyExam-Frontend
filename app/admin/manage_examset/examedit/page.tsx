"use client";

import Navbar_admin from "@/components/Navbar_admin";
import Link from "next/link";
import {
    ChevronLeft,
    Save,
    Trash2,
    Settings,
    Move,
    PlusCircle,
    AlertTriangle,
    Loader2
} from "lucide-react";
import React, { useState } from "react";


// =================================================================
// 1. Modal Component: ยืนยันการลบ
// =================================================================
interface DeleteModalProps {
    examTitle: string;
    onClose: () => void;
    onConfirm: () => void;
    isDeleting: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({
    examTitle,
    onClose,
    onConfirm,
    isDeleting,
}) => (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4 transition-opacity">
        <div className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-in fade-in zoom-in duration-300">
            <div className="p-6">
                <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                    <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
                    ยืนยันการลบข้อสอบ
                </h2>
                <p className="text-gray-600 text-center mb-6 text-sm">
                    คุณต้องการลบข้อสอบ **&quot;{examTitle}&quot;** ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors font-medium text-sm disabled:opacity-70"
                    >
                        ยกเลิก
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={isDeleting}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors shadow-sm inline-flex items-center justify-center gap-2 ${isDeleting
                            ? 'bg-red-400 text-white cursor-not-allowed'
                            : 'bg-red-600 hover:bg-red-700 text-white'
                            }`}
                    >
                        {isDeleting ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>กำลังลบ...</span>
                            </>
                        ) : (
                            <span>ลบข้อสอบ</span>
                        )}
                    </button>
                </div>
            </div>
        </div>
    </div>
);


// =================================================================
// 2. Question/Option Components (ปรับปรุง QuestionBox)
// *เอา Logic ปุ่มเพิ่มข้อสอบออกจาก QuestionBox*
// =================================================================
interface AnswerOptionProps { id: number; label: string; isCorrect: boolean; onLabelChange: (id: number, newLabel: string) => void; onToggleCorrect: (id: number) => void; }
const AnswerOption: React.FC<AnswerOptionProps> = ({ id, label, isCorrect, onLabelChange, onToggleCorrect }) => (
    <div className="flex items-center space-x-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
        <Move className="w-4 h-4 text-gray-400 cursor-grab" />
        <input type="text" value={label} onChange={(e) => onLabelChange(id, e.target.value)} placeholder="ใส่คำตอบ" className="flex-grow p-1 text-gray-800 border-none focus:ring-0 focus:outline-none text-base" />
        <div className="flex items-center">
            <input id={`answer-${id}`} name="correct-answer" type="radio" checked={isCorrect} onChange={() => onToggleCorrect(id)} className="h-5 w-5 text-green-600 border-gray-300 focus:ring-green-500" />
        </div>
    </div>
);

interface QuestionBoxProps {
    questionNumber: number;
    initialText: string;
    initialOptions: { id: number; label: string; isCorrect: boolean }[];
    maxCharacters: number;
    // ลบ showAddButton ออกไป 
}
const QuestionBox: React.FC<QuestionBoxProps> = ({ questionNumber, initialText, initialOptions, maxCharacters }) => {
    const [questionText, setQuestionText] = useState(initialText);
    const [options, setOptions] = useState(initialOptions);

    const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (e.target.value.length <= maxCharacters) { setQuestionText(e.target.value); }
    };
    const handleOptionLabelChange = (id: number, newLabel: string) => {
        setOptions(options.map(opt => opt.id === id ? { ...opt, label: newLabel } : opt));
    };
    const handleToggleCorrect = (id: number) => {
        setOptions(options.map(opt => ({ ...opt, isCorrect: opt.id === id })));
    };
    const handleAddOption = () => {
        const newId = Math.max(...options.map(o => o.id), 0) + 1;
        setOptions([...options, { id: newId, label: 'ใส่คำตอบใหม่', isCorrect: false }]);
    };


    return (
        <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 mb-8">
            <div className="flex items-center space-x-2 text-lg font-bold text-gray-800 mb-4">
                <Move className="w-5 h-5 text-gray-400 cursor-grab" />
                <h2>ข้อที่ {questionNumber}</h2>
            </div>
            <div className="relative mb-6">
                <textarea value={questionText} onChange={handleTextChange} rows={5} className="w-full p-4 border border-gray-300 rounded-lg focus:ring-green-500 focus:border-green-500 text-base resize-y" placeholder="พิมพ์คำถามหรือสถานการณ์ที่นี่..." />
                <span className="absolute bottom-2 right-4 text-xs text-gray-500">
                    {questionText.length}/{maxCharacters}
                </span>
            </div>
            <h3 className="text-md font-semibold text-gray-700 mb-3">ตัวเลือกคำตอบ</h3>
            <div className="space-y-3">
                {options.map((option) => (
                    <AnswerOption key={option.id} id={option.id} label={option.label} isCorrect={option.isCorrect} onLabelChange={handleOptionLabelChange} onToggleCorrect={handleToggleCorrect} />
                ))}
                <button type="button" onClick={handleAddOption} className="inline-flex items-center text-sm font-medium text-green-600 hover:text-green-700 transition-colors mt-2">
                    <PlusCircle className="w-4 h-4 mr-1" />
                    เพิ่มตัวเลือกคำตอบ
                </button>
            </div>
            {/* ส่วนเพิ่มข้อสอบถูกย้ายไปด้านล่างสุดของ EditExamPage */}
        </div>
    );
};


// =================================================================
// 3. Main Page Component
// =================================================================

function EditExamPage() {
    const currentExamTitle = "Cardiovascular disorder"; // ชื่อข้อสอบ

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirmDelete = async () => {
        setIsDeleting(true);
        // ... (API call logic)
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            alert(`ข้อสอบ "${currentExamTitle}" ถูกลบแล้ว`);
            window.location.href = '/admin/manage_examset';
        } catch (error) {
            console.error("Deletion failed:", error);
            alert("เกิดข้อผิดพลาดในการลบข้อสอบ");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleAddQuestion = () => {
        alert("จำลอง: เพิ่มข้อใหม่ถัดไปที่ด้านล่างสุด");
        // Logic ในการเพิ่มข้อสอบใหม่ใน State หลักของหน้า
    };


    // ข้อมูลจำลองสำหรับ ข้อที่ 1 และ 2
    const initialQuestion1 = {
        text: "สถานการณ์ที่ 1 ชายไทยอายุ 65 ปี มีการตรวจพบประวัติ: ร้องได้รับการตรวจความดันโลหิตเมื่อขึ้นต้นและในครั้งที่สองมีความดันเท่ากับ 155/105 mmHg มีประวัติป่วยเป็นโรคเบาหวานชนิดเลือด ได้ใช้ชีวิตขึ้นมาแล้ว 5 ปี ตาม JNC VII ผู้ป่วยรายนี้มีความดันอยู่ใน state ใด",
        options: [
            { id: 1, label: "Prehypertension", isCorrect: false },
            { id: 2, label: "Stage I", isCorrect: false },
            { id: 3, label: "Stage II", isCorrect: true },
            { id: 4, label: "Stage III", isCorrect: false },
            { id: 5, label: "ใส่คำตอบ", isCorrect: false },
        ]
    };
    const initialQuestion2 = {
        text: "สถานการณ์ที่ 1 ชายไทยอายุ 65 ปี มีการตรวจพบประวัติ: ร้องได้รับการตรวจความดันโลหิตเมื่อขึ้นต้นและในครั้งที่สองมีความดันเท่ากับ 155/105 mmHg มีประวัติป่วยเป็นโรคเบาหวานชนิดเลือด ได้ใช้ชีวิตขึ้นมาแล้ว 5 ปี ต้องการให้ผู้ป่วยควบคุมความดันโลหิตในระดับใด",
        options: [{ id: 1, label: "ใส่คำตอบ", isCorrect: false }]
    };


    return (
        <Navbar_admin>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">

                {/* Header และ Action Buttons */}
                <div className="flex justify-between items-start mb-6 pb-4">
                    {/* Back Button & Title */}
                    <div>
                        <Link
                            href="/admin/manage_examset"
                            className="inline-flex items-center gap-2 text-green-700 mb-6 transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                            <span className="text-sm font-medium">กลับ</span>
                        </Link>
                        <h1 className="text-2xl sm:text-3xl font-medium text-gray-900 mb-1">
                            {currentExamTitle}
                        </h1>
                        <p className="text-sm text-gray-600">
                            (ความผิดปกติของหัวใจและหลอดเลือด)
                        </p>
                    </div>

                    <div className="flex space-x-3 mt-2">
                        <Link
                            href="/admin/manage_examset/examsetting"
                            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <Settings className="w-4 h-4 mr-2" />
                            ตั้งค่า
                        </Link>
                        <button
                            onClick={() => setShowDeleteModal(true)}
                            className="flex items-center px-4 py-2 border border-red-500 rounded-lg text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            ลบข้อสอบ
                        </button>
                        <button className="flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors shadow-md">
                            <Save className="w-4 h-4 mr-2" />
                            บันทึก
                        </button>
                    </div>
                </div>

                {/* Question Editor Area */}
                <div className="mt-8">
                    {/* ข้อ 1 */}
                    <QuestionBox
                        questionNumber={1}
                        initialText={initialQuestion1.text}
                        initialOptions={initialQuestion1.options}
                        maxCharacters={500}
                    />

                    {/* ข้อ 2 */}
                    <QuestionBox
                        questionNumber={2}
                        initialText={initialQuestion2.text}
                        initialOptions={initialQuestion2.options}
                        maxCharacters={500}
                    />

                    {/* ======================================================= */}
                    {/* ปุ่มเพิ่มข้อสอบ: แยกอยู่ด้านล่างสุดของ Main Content Area */}
                    {/* ======================================================= */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={handleAddQuestion}
                            className="inline-flex items-center px-4 py-2 border border-green-600 text-sm font-medium rounded-lg shadow-sm text-green-600 bg-white hover:bg-green-50 transition-colors"
                        >
                            <PlusCircle className="w-5 h-5 mr-2" />
                            เพิ่มข้อสอบ
                        </button>
                    </div>
                </div>
            </div>

            {/* Conditionally Render Modal */}
            {showDeleteModal && (
                <DeleteConfirmationModal
                    examTitle={currentExamTitle}
                    onClose={() => setShowDeleteModal(false)}
                    onConfirm={handleConfirmDelete}
                    isDeleting={isDeleting}
                />
            )}
        </Navbar_admin>
    );
}

export default EditExamPage;