'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import Superscript from '@tiptap/extension-superscript';
import Subscript from '@tiptap/extension-subscript';
import { useEffect, useState, useRef, useCallback } from 'react';
import {
    Bold,
    Italic,
    Strikethrough,
    Code,
    List,
    ListOrdered,
    Quote,
    Minus,
    Link2,
    Undo,
    Redo,
    Superscript as SuperscriptIcon,
    Subscript as SubscriptIcon,
    Sigma,
    X,
} from 'lucide-react';

interface TiptapEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: string;
    className?: string;
}

const ToolbarButton = ({
    onClick,
    active,
    title,
    children,
}: {
    onClick: () => void;
    active?: boolean;
    title?: string;
    children: React.ReactNode;
}) => (
    <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={onClick}
        title={title}
        aria-label={title}
        className={`p-1.5 min-w-[32px] h-8 rounded-lg transition-all cursor-pointer flex items-center justify-center select-none ${active
            ? 'bg-emerald-600 text-white font-bold shadow-xs scale-105 ring-2 ring-emerald-300'
            : 'text-gray-600 hover:bg-gray-200/80 hover:text-gray-900 bg-transparent'
            }`}
    >
        {children}
    </button>
);

// หมวดหมู่สัญลักษณ์ทางคณิตศาสตร์และเภสัชศาสตร์ที่ใช้บ่อย
const MATH_SYMBOLS = [
    {
        category: 'คณิตศาสตร์ & การคำนวณ',
        symbols: ['±', '×', '÷', '≠', '≈', '≤', '≥', '√', '²', '³', '∞', '‰', '°', '°C', '½', '¼', '¾'],
    },
    {
        category: 'อักษรกรีก (พารามิเตอร์ยา & สถิติ)',
        symbols: ['α', 'β', 'γ', 'δ', 'Δ', 'θ', 'λ', 'µ', 'π', 'σ', 'Σ', 'Ω', 'ω', 'ρ', 'τ', 'ε'],
    },
    {
        category: 'ลูกศร & ปฏิกิริยาเคมี',
        symbols: ['→', '⇌', '↔', '↑', '↓', '⇒', '⇔', '⁺', '⁻'],
    },
];

export default function TiptapEditor({
    value,
    onChange,
    placeholder = 'กรอกข้อความ...',
    minHeight = '80px',
    className = '',
}: TiptapEditorProps) {
    const [showSymbolPicker, setShowSymbolPicker] = useState(false);
    const [, setTick] = useState(0);
    const pickerRef = useRef<HTMLDivElement>(null);

    const editor = useEditor({
        extensions: [
            StarterKit,
            LinkExtension.configure({ openOnClick: false }),
            Superscript,
            Subscript,
        ],
        content: value,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: 'outline-none prose prose-sm max-w-none text-gray-700 leading-relaxed',
                style: `min-height: ${minHeight}; padding: 10px 14px;`,
            },
        },
        onUpdate: ({ editor }) => {
            const html = editor.getHTML();
            // Return empty string if only empty paragraph
            onChange(html === '<p></p>' ? '' : html);
        },
    });

    // บังคับให้ React Re-render Toolbar ทันทีที่ Cursor เลื่อน, มีการพิมพ์ หรือ Mark เปลี่ยนสถานะ
    useEffect(() => {
        if (!editor) return;
        const handleStateChange = () => {
            setTick(t => t + 1);
        };
        editor.on('transaction', handleStateChange);
        editor.on('selectionUpdate', handleStateChange);
        return () => {
            editor.off('transaction', handleStateChange);
            editor.off('selectionUpdate', handleStateChange);
        };
    }, [editor]);

    // Sync external value changes (e.g. when loading saved data)
    useEffect(() => {
        if (!editor) return;
        const currentHtml = editor.getHTML();
        const normalizedValue = value || '';
        const normalizedCurrent = currentHtml === '<p></p>' ? '' : currentHtml;
        if (normalizedValue !== normalizedCurrent) {
            editor.commands.setContent(normalizedValue || '');
        }
    }, [value, editor]);

    // Close symbol picker when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowSymbolPicker(false);
            }
        }
        if (showSymbolPicker) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showSymbolPicker]);

    // สลับตัวยก (Superscript)
    const handleToggleSuperscript = useCallback(() => {
        if (!editor) return;
        if (editor.isActive('superscript')) {
            editor.chain().focus().unsetSuperscript().run();
        } else {
            editor.chain().focus().unsetSubscript().setSuperscript().run();
        }
    }, [editor]);

    // สลับตัวห้อย (Subscript)
    const handleToggleSubscript = useCallback(() => {
        if (!editor) return;
        if (editor.isActive('subscript')) {
            editor.chain().focus().unsetSubscript().run();
        } else {
            editor.chain().focus().unsetSuperscript().setSubscript().run();
        }
    }, [editor]);

    // สลับขีดฆ่า (Strike)
    const handleToggleStrike = useCallback(() => {
        if (!editor) return;
        editor.chain().focus().toggleStrike().run();
    }, [editor]);

    // สลับโค้ด/สูตร (Code)
    const handleToggleCode = useCallback(() => {
        if (!editor) return;
        editor.chain().focus().toggleCode().run();
    }, [editor]);

    const addLink = () => {
        if (!editor) return;
        const url = window.prompt('ใส่ URL ของลิงก์:');
        if (url) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    };

    const insertSymbol = (sym: string) => {
        if (!editor) return;
        editor.chain().focus().insertContent(sym).run();
    };

    if (!editor) return null;

    return (
        <div className={`rounded-xl border border-gray-300 focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all bg-white mt-2 relative ${className}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 px-2.5 pt-2 pb-1.5 border-b border-gray-100 bg-gray-50/70 rounded-t-xl">
                {/* Text Formatting */}
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="ตัวหนา (Ctrl+B)">
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="ตัวเอียง (Ctrl+I)">
                    <Italic className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={handleToggleStrike} active={editor.isActive('strike')} title="ขีดฆ่า (Strikethrough)">
                    <Strikethrough className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-gray-300 mx-1 self-center" />

                {/* Math & Chemistry Formatting (Superscript, Subscript, Code) */}
                <ToolbarButton
                    onClick={handleToggleSuperscript}
                    active={editor.isActive('superscript')}
                    title="ตัวยก / ยกกำลัง (Superscript เช่น x², 10⁻³, m²)"
                >
                    <SuperscriptIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton
                    onClick={handleToggleSubscript}
                    active={editor.isActive('subscript')}
                    title="ตัวห้อย (Subscript เช่น H₂O, Cmax, t1/2)"
                >
                    <SubscriptIcon className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={handleToggleCode} active={editor.isActive('code')} title="โค้ด / สูตรข้อความสั้น">
                    <Code className="w-4 h-4" />
                </ToolbarButton>

                {/* Quick Math/Science Symbol Palette Button */}
                <div className="relative inline-block" ref={pickerRef}>
                    <ToolbarButton
                        onClick={() => setShowSymbolPicker(!showSymbolPicker)}
                        active={showSymbolPicker}
                        title="แทรกสัญลักษณ์คณิตศาสตร์ & เภสัชศาสตร์ (±, ×, ÷, √, α, β, θ, µ, →, ⇌)"
                    >
                        <div className="flex items-center gap-0.5">
                            <Sigma className={`w-4 h-4 ${showSymbolPicker ? 'text-white' : 'text-purple-600'}`} />
                        </div>
                    </ToolbarButton>

                    {/* Symbol Picker Popover */}
                    {showSymbolPicker && (
                        <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100">
                                <span className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                                    <Sigma className="w-3.5 h-3.5 text-purple-600" />
                                    แทรกสัญลักษณ์คณิตศาสตร์ & วิทยาศาสตร์
                                </span>
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setShowSymbolPicker(false)}
                                    className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>

                            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                                {MATH_SYMBOLS.map((group) => (
                                    <div key={group.category}>
                                        <p className="text-sm font-medium text-gray-400 mb-1">{group.category}</p>
                                        <div className="grid grid-cols-6 sm:grid-cols-8 gap-1">
                                            {group.symbols.map((sym) => (
                                                <button
                                                    key={sym}
                                                    type="button"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                    onClick={() => insertSymbol(sym)}
                                                    className="h-8 flex items-center justify-center text-sm font-medium rounded-lg border border-gray-100 hover:border-purple-300 hover:bg-purple-50 text-gray-800 hover:text-purple-700 transition-all cursor-pointer shadow-2xs"
                                                    title={`แทรก ${sym}`}
                                                >
                                                    {sym}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-px h-5 bg-gray-300 mx-1 self-center" />

                {/* Lists & Blocks */}
                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="รายการหัวข้อ">
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="รายการลำดับตัวเลข">
                    <ListOrdered className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="คำอ้างอิง">
                    <Quote className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().setHorizontalRule().run()} title="เส้นแบ่ง">
                    <Minus className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={addLink} active={editor.isActive('link')} title="แทรกลิงก์">
                    <Link2 className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-5 bg-gray-300 mx-1 self-center" />

                {/* History */}
                <ToolbarButton onClick={() => editor.chain().focus().undo().run()} title="เลิกทำ (Ctrl+Z)">
                    <Undo className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().redo().run()} title="ทำซ้ำ (Ctrl+Y)">
                    <Redo className="w-4 h-4" />
                </ToolbarButton>
            </div>

            {/* Editor area with placeholder */}
            <div className="relative">
                {editor.isEmpty && (
                    <p className="absolute top-0 left-0 px-[14px] py-[10px] text-gray-400 pointer-events-none select-none text-sm">
                        {placeholder}
                    </p>
                )}
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
