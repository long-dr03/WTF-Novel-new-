"use client"

import { useState, useCallback } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import {
    Bold,
    Italic,
    Underline as UnderlineIcon,
    Strikethrough,
    Heading1,
    Heading2,
    Heading3,
    List,
    ListOrdered,
    Quote,
    Code,
    Minus,
    Undo,
    Redo,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    Highlighter,
    Sun,
    Moon,
    Save,
    FileText,
    Eye,
    EyeOff,
    Maximize2,
    Minimize2,
    Type,
    Pilcrow
} from 'lucide-react';
import { cn } from "@/lib/utils";
import {createNovelService,
        uploadChapterService} from "@/services/novelService";
// Toolbar Button Component
const ToolbarButton = ({
    onClick,
    isActive = false,
    disabled = false,
    children,
    title,
    isDark
}: {
    onClick: () => void;
    isActive?: boolean;
    disabled?: boolean;
    children: React.ReactNode;
    title: string;
    isDark: boolean;
}) => (
    <button
        type="button"
        onMouseDown={(e) => {
            e.preventDefault(); // Prevent losing focus from editor
        }}
        onClick={(e) => {
            e.preventDefault();
            onClick();
        }}
        disabled={disabled}
        title={title}
        className={cn(
            "p-2 rounded-lg transition-all duration-200 flex items-center justify-center",
            "hover:scale-105 active:scale-95",
            disabled && "opacity-40 cursor-not-allowed",
            isActive
                ? isDark
                    ? "bg-purple-500/30 text-purple-300 shadow-inner"
                    : "bg-purple-100 text-purple-700 shadow-inner"
                : isDark
                    ? "text-stone-400 hover:bg-stone-700/50 hover:text-stone-200"
                    : "text-stone-600 hover:bg-stone-200/70 hover:text-stone-800"
        )}
    >
        {children}
    </button>
);

// Toolbar Divider
const ToolbarDivider = ({ isDark }: { isDark: boolean }) => (
    <div className={cn(
        "w-px h-6 mx-1",
        isDark ? "bg-stone-700" : "bg-stone-300"
    )} />
);

const WriteNovel = () => {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isPreview, setIsPreview] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                heading: {
                    levels: [1, 2, 3],
                },
            }),
            Underline,
            TextAlign.configure({
                types: ['heading', 'paragraph'],
            }),
            Highlight.configure({
                multicolor: true,
            }),
            Placeholder.configure({
                placeholder: 'Bắt đầu viết câu chuyện của bạn...',
            }),
            CharacterCount,
        ],
        content: '',
        editorProps: {
            attributes: {
                class: cn(
                    'prose prose-lg max-w-none focus:outline-none min-h-[500px] p-8',
                    'prose-headings:font-bold prose-headings:tracking-tight',
                    'prose-p:leading-relaxed prose-p:my-4',
                    'prose-blockquote:border-l-4 prose-blockquote:pl-4 prose-blockquote:italic',
                    'prose-code:rounded prose-code:px-1.5 prose-code:py-0.5',
                    'prose-pre:rounded-lg prose-pre:p-4',
                    'prose-ul:my-4 prose-ol:my-4',
                    'prose-li:my-1',
                ),
            },
        },
    });

    const wordCount = editor?.storage.characterCount?.words() || 0;
    const charCount = editor?.storage.characterCount?.characters() || 0;

    const handleSave = useCallback(() => {
        if (!editor) return;
        setIsSaving(true);
        
        // Lấy nội dung theo nhiều định dạng
        const htmlContent = editor.getHTML();      // Định dạng HTML
        const jsonContent = editor.getJSON();      // Định dạng JSON (ProseMirror)
        const textContent = editor.getText();      // Chỉ text thuần
        
        // Lấy word/char count trực tiếp từ editor
        const words = editor.storage.characterCount?.words() || 0;
        const chars = editor.storage.characterCount?.characters() || 0;
        
        // Log để xem các định dạng
        console.log('=== NỘI DUNG EDITOR ===');
        console.log('📄 HTML Format:', htmlContent);
        console.log('📋 JSON Format:', JSON.stringify(jsonContent, null, 2));
        console.log('📝 Text Format:', textContent);
        console.log('========================');
        
        // Ví dụ data để gửi lên server
        const saveData = {
            title: 'Chương 1', // Có thể thêm input cho title
            content: htmlContent, // Hoặc jsonContent tùy bạn chọn
            contentJson: jsonContent, // Lưu cả 2 để linh hoạt
            wordCount: words,
            charCount: chars,
            updatedAt: new Date().toISOString(),
        };
        
        console.log('💾 Data để gửi lên server:', saveData);
        
        setTimeout(() => setIsSaving(false), 1000);
    }, [editor]);

    // Theme colors
    const theme = {
        bg: isDarkMode ? "bg-stone-900" : "bg-stone-100",
        editorBg: isDarkMode ? "bg-stone-800/50" : "bg-[#faf8f5]",
        editorBorder: isDarkMode ? "border-stone-700/50" : "border-stone-300/50",
        toolbarBg: isDarkMode ? "bg-stone-800/80" : "bg-white/80",
        text: isDarkMode ? "text-stone-200" : "text-stone-800",
        textMuted: isDarkMode ? "text-stone-400" : "text-stone-500",
        prose: isDarkMode 
            ? "prose-invert prose-p:text-stone-300 prose-headings:text-stone-100 prose-strong:text-stone-100 prose-blockquote:text-stone-400 prose-blockquote:border-stone-600 prose-code:text-purple-300 prose-code:bg-stone-700 prose-pre:bg-stone-900 prose-pre:text-stone-300"
            : "prose-p:text-stone-700 prose-headings:text-stone-900 prose-strong:text-stone-900 prose-blockquote:text-stone-600 prose-blockquote:border-stone-400 prose-code:text-purple-700 prose-code:bg-stone-200 prose-pre:bg-stone-100 prose-pre:text-stone-800",
    };

    return (
        <div className={cn(
            "min-h-screen transition-colors duration-300",
            theme.bg,
            isFullscreen && "fixed inset-0 z-50"
        )}>
            <div className={cn(
                "mx-auto transition-all duration-300",
                isFullscreen ? "max-w-6xl px-4 py-4" : "max-w-4xl px-4 py-8"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <FileText className={cn("w-8 h-8", isDarkMode ? "text-purple-400" : "text-purple-600")} />
                        <div>
                            <h1 className={cn("text-2xl font-bold", theme.text)}>
                                Novel Editor
                            </h1>
                            <p className={cn("text-sm", theme.textMuted)}>
                                Viết nên câu chuyện của riêng bạn
                            </p>
                        </div>
                    </div>
                    
                    {/* Mode & Action Buttons */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsFullscreen(!isFullscreen)}
                            title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                            className={cn(
                                "p-2.5 rounded-xl transition-all duration-200",
                                isDarkMode 
                                    ? "bg-stone-800 text-stone-300 hover:bg-stone-700" 
                                    : "bg-white text-stone-600 hover:bg-stone-100",
                                "shadow-sm"
                            )}
                        >
                            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                        </button>
                        
                        <button
                            onClick={() => setIsDarkMode(!isDarkMode)}
                            title={isDarkMode ? "Chế độ sáng" : "Chế độ tối"}
                            className={cn(
                                "p-2.5 rounded-xl transition-all duration-200",
                                isDarkMode 
                                    ? "bg-stone-800 text-amber-400 hover:bg-stone-700" 
                                    : "bg-white text-stone-600 hover:bg-stone-100",
                                "shadow-sm"
                            )}
                        >
                            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                        </button>
                        
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={cn(
                                "px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium",
                                "bg-gradient-to-r from-purple-500 to-pink-500 text-white",
                                "hover:from-purple-600 hover:to-pink-600",
                                "shadow-lg shadow-purple-500/25",
                                isSaving && "opacity-70"
                            )}
                        >
                            <Save className={cn("w-4 h-4", isSaving && "animate-spin")} />
                            {isSaving ? "Đang lưu..." : "Lưu"}
                        </button>
                    </div>
                </div>

                {/* Toolbar */}
                {editor && (
                    <div className={cn(
                        "mb-4 p-3 rounded-2xl backdrop-blur-sm border shadow-lg",
                        theme.toolbarBg,
                        theme.editorBorder
                    )}>
                        <div className="flex flex-wrap items-center gap-1">
                            {/* Undo/Redo */}
                            <ToolbarButton
                                onClick={() => editor.chain().focus().undo().run()}
                                disabled={!editor.can().undo()}
                                title="Hoàn tác (Ctrl+Z)"
                                isDark={isDarkMode}
                            >
                                <Undo className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().redo().run()}
                                disabled={!editor.can().redo()}
                                title="Làm lại (Ctrl+Y)"
                                isDark={isDarkMode}
                            >
                                <Redo className="w-4 h-4" />
                            </ToolbarButton>

                            <ToolbarDivider isDark={isDarkMode} />

                            {/* Text Formatting */}
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleBold().run()}
                                isActive={editor.isActive('bold')}
                                title="Đậm (Ctrl+B)"
                                isDark={isDarkMode}
                            >
                                <Bold className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleItalic().run()}
                                isActive={editor.isActive('italic')}
                                title="Nghiêng (Ctrl+I)"
                                isDark={isDarkMode}
                            >
                                <Italic className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleUnderline().run()}
                                isActive={editor.isActive('underline')}
                                title="Gạch chân (Ctrl+U)"
                                isDark={isDarkMode}
                            >
                                <UnderlineIcon className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleStrike().run()}
                                isActive={editor.isActive('strike')}
                                title="Gạch ngang"
                                isDark={isDarkMode}
                            >
                                <Strikethrough className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleHighlight().run()}
                                isActive={editor.isActive('highlight')}
                                title="Đánh dấu"
                                isDark={isDarkMode}
                            >
                                <Highlighter className="w-4 h-4" />
                            </ToolbarButton>

                            <ToolbarDivider isDark={isDarkMode} />

                            {/* Headings */}
                            <ToolbarButton
                                onClick={() => editor.chain().focus().setParagraph().run()}
                                isActive={editor.isActive('paragraph')}
                                title="Đoạn văn"
                                isDark={isDarkMode}
                            >
                                <Pilcrow className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                                isActive={editor.isActive('heading', { level: 1 })}
                                title="Tiêu đề 1"
                                isDark={isDarkMode}
                            >
                                <Heading1 className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                                isActive={editor.isActive('heading', { level: 2 })}
                                title="Tiêu đề 2"
                                isDark={isDarkMode}
                            >
                                <Heading2 className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                                isActive={editor.isActive('heading', { level: 3 })}
                                title="Tiêu đề 3"
                                isDark={isDarkMode}
                            >
                                <Heading3 className="w-4 h-4" />
                            </ToolbarButton>

                            <ToolbarDivider isDark={isDarkMode} />

                            {/* Alignment */}
                            <ToolbarButton
                                onClick={() => editor.chain().focus().setTextAlign('left').run()}
                                isActive={editor.isActive({ textAlign: 'left' })}
                                title="Căn trái"
                                isDark={isDarkMode}
                            >
                                <AlignLeft className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().setTextAlign('center').run()}
                                isActive={editor.isActive({ textAlign: 'center' })}
                                title="Căn giữa"
                                isDark={isDarkMode}
                            >
                                <AlignCenter className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().setTextAlign('right').run()}
                                isActive={editor.isActive({ textAlign: 'right' })}
                                title="Căn phải"
                                isDark={isDarkMode}
                            >
                                <AlignRight className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().setTextAlign('justify').run()}
                                isActive={editor.isActive({ textAlign: 'justify' })}
                                title="Căn đều"
                                isDark={isDarkMode}
                            >
                                <AlignJustify className="w-4 h-4" />
                            </ToolbarButton>

                            <ToolbarDivider isDark={isDarkMode} />

                            {/* Lists & Blocks */}
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleBulletList().run()}
                                isActive={editor.isActive('bulletList')}
                                title="Danh sách"
                                isDark={isDarkMode}
                            >
                                <List className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                                isActive={editor.isActive('orderedList')}
                                title="Danh sách số"
                                isDark={isDarkMode}
                            >
                                <ListOrdered className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleBlockquote().run()}
                                isActive={editor.isActive('blockquote')}
                                title="Trích dẫn"
                                isDark={isDarkMode}
                            >
                                <Quote className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                                isActive={editor.isActive('codeBlock')}
                                title="Khối code"
                                isDark={isDarkMode}
                            >
                                <Code className="w-4 h-4" />
                            </ToolbarButton>
                            <ToolbarButton
                                onClick={() => editor.chain().focus().setHorizontalRule().run()}
                                title="Đường kẻ ngang"
                                isDark={isDarkMode}
                            >
                                <Minus className="w-4 h-4" />
                            </ToolbarButton>

                            <ToolbarDivider isDark={isDarkMode} />

                            {/* Preview Toggle */}
                            <ToolbarButton
                                onClick={() => setIsPreview(!isPreview)}
                                isActive={isPreview}
                                title={isPreview ? "Chế độ chỉnh sửa" : "Xem trước"}
                                isDark={isDarkMode}
                            >
                                {isPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </ToolbarButton>
                        </div>
                    </div>
                )}

                {/* Editor */}
                <div className={cn(
                    "rounded-2xl border shadow-xl overflow-hidden transition-all duration-300",
                    theme.editorBg,
                    theme.editorBorder,
                    isPreview && "pointer-events-none"
                )}>
                    <div className={cn(theme.prose)}>
                        <EditorContent 
                            editor={editor} 
                            className={cn(
                                "transition-colors duration-300",
                                isDarkMode ? "[&_.ProseMirror]:text-stone-300" : "[&_.ProseMirror]:text-stone-700",
                                "[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
                                "[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left",
                                "[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none",
                                "[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0",
                                isDarkMode 
                                    ? "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-stone-600"
                                    : "[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-stone-400"
                            )}
                        />
                    </div>
                </div>

                {/* Footer Stats */}
                <div className={cn(
                    "mt-4 px-4 py-3 rounded-xl flex items-center justify-between",
                    theme.toolbarBg,
                    "border",
                    theme.editorBorder
                )}>
                    <div className="flex items-center gap-6">
                        <div className={cn("flex items-center gap-2", theme.textMuted)}>
                            <Type className="w-4 h-4" />
                            <span className="text-sm">
                                <span className={theme.text}>{charCount.toLocaleString()}</span> ký tự
                            </span>
                        </div>
                        <div className={cn("flex items-center gap-2", theme.textMuted)}>
                            <FileText className="w-4 h-4" />
                            <span className="text-sm">
                                <span className={theme.text}>{wordCount.toLocaleString()}</span> từ
                            </span>
                        </div>
                    </div>
                    <div className={cn("text-sm", theme.textMuted)}>
                        {isDarkMode ? "🌙 Chế độ tối" : "☀️ Chế độ sáng"}
                    </div>
                </div>
            </div>
        </div>
    );
};

const createNovel = () => {
    return (
        <div>
            Create Novel Component
        </div>
    )
}
export default WriteNovel;
