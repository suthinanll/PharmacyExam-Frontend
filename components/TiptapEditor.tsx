'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import LinkExtension from '@tiptap/extension-link';
import { useEffect } from 'react';
import {
    Bold,
    Italic,
    List,
    ListOrdered,
    Quote,
    Minus,
    Link2,
    Undo,
    Redo,
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
        onClick={onClick}
        title={title}
        className={`p-1.5 rounded transition-colors ${active
            ? 'bg-emerald-100 text-emerald-700'
            : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
    >
        {children}
    </button>
);

export default function TiptapEditor({
    value,
    onChange,
    placeholder = 'กรอกข้อความ...',
    minHeight = '80px',
    className = '',
}: TiptapEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            LinkExtension.configure({ openOnClick: false }),
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

    const addLink = () => {
        if (!editor) return;
        const url = window.prompt('ใส่ URL ของลิงก์:');
        if (url) {
            editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
        }
    };

    if (!editor) return null;

    return (
        <div className={`rounded-lg border border-gray-300 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-transparent transition-all bg-white ${className}`}>
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-0.5 px-2 pt-2 pb-1.5 border-b border-gray-100">
                <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="ตัวหนา (Ctrl+B)">
                    <Bold className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="ตัวเอียง (Ctrl+I)">
                    <Italic className="w-4 h-4" />
                </ToolbarButton>

                <div className="w-px h-4 bg-gray-200 mx-1 self-center" />

                <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="รายการ">
                    <List className="w-4 h-4" />
                </ToolbarButton>
                <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="รายการลำดับ">
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

                <div className="w-px h-4 bg-gray-200 mx-1 self-center" />

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
