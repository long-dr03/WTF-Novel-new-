"use client"

import { useState, useCallback, useEffect } from "react";
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
    Pilcrow,
    Plus,
    Edit3,
    RefreshCw,
    Send,
    Clock,
    FileEdit,
    PencilLine
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { uploadChapterService, getNovelsByAuthorService, getChaptersByNovelService, getChapterContentService, updateChapterStatusService } from "@/services/novelService";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
// Toolbar Divider
const ToolbarDivider = ({ isDark }: { isDark: boolean }) => (
    <div className={cn(
        "w-px h-6 mx-1",
        isDark ? "bg-stone-700" : "bg-stone-300"
    )} />
);

interface Novel {
    _id?: string;
    id?: string;
    title: string;
    coverImage?: string;
}

interface Chapter {
    _id?: string;
    id?: string;
    chapterNumber: number;
    title: string;
    content?: string;
    contentJson?: any;
    wordCount?: number;
    status?: string;
    publishedAt?: string;
    updatedAt?: string;
}

interface WriteNovelProps {
    novels?: Novel[];
    selectedNovelId?: string | null;
    onNovelChange?: (novelId: string | null) => void;
}

const WriteNovel = ({ novels = [], selectedNovelId = null, onNovelChange }: WriteNovelProps) => {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isPreview, setIsPreview] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [chapterTitle, setChapterTitle] = useState("");
    const [chapterNumber, setChapterNumber] = useState(1);
    const [chapterStatus, setChapterStatus] = useState<'draft' | 'published' | 'scheduled'>('draft');

    // State cho danh sách chương và chế độ sửa
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [isLoadingChapters, setIsLoadingChapters] = useState(false);
    const [editMode, setEditMode] = useState<'new' | 'edit'>('new');
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    // Lấy truyện được chọn
    const selectedNovel = novels.find(n => (n._id || n.id) === selectedNovelId);

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

    // Load danh sách chương khi chọn truyện
    useEffect(() => {
        const loadChapters = async () => {
            if (!selectedNovelId) {
                setChapters([]);
                setEditMode('new');
                setSelectedChapterId(null);
                return;
            }

            setIsLoadingChapters(true);
            try {
                const response = await getChaptersByNovelService(selectedNovelId);
                if (response) {
                    // Sắp xếp theo số chương
                    setChapters(response);

                    // Tự động set số chương tiếp theo
                    if (response.length > 0) {
                        const maxChapter = Math.max(...response.map((c: Chapter) => c.chapterNumber));
                        setChapterNumber(maxChapter);
                    } else {
                        setChapterNumber(1);
                    }
                } else {
                    setChapters([]);
                    setChapterNumber(1);
                }
            } catch (error) {
                console.error('Lỗi khi load danh sách chương:', error);
                setChapters([]);
            } finally {
                setIsLoadingChapters(false);
            }
        };

        loadChapters();
    }, [selectedNovelId]);

    // Load nội dung chương khi chọn chương để sửa
    const handleSelectChapterToEdit = async (chapter: Chapter) => {
        if (!selectedNovelId || !editor) return;

        setIsLoadingContent(true);
        setSelectedChapterId(chapter._id || chapter.id || null);

        try {
            const chapterData = await getChapterContentService(selectedNovelId, chapter.chapterNumber);
            console.log('📖 Chapter data loaded:', chapterData);

            if (chapterData) {
                setChapterNumber(chapterData.chapterNumber);
                setChapterTitle(chapterData.title || '');
                setChapterStatus(chapterData.status || 'draft');

                // Set content vào editor
                if (chapterData.contentJson) {
                    editor.commands.setContent(chapterData.contentJson);
                } else if (chapterData.content) {
                    editor.commands.setContent(chapterData.content);
                }

                setEditMode('edit');
            } else {
                alert('Không tìm thấy dữ liệu chương!');
            }
        } catch (error) {
            console.error('Lỗi khi load nội dung chương:', error);
            alert('Không thể load nội dung chương!');
        } finally {
            setIsLoadingContent(false);
        }
    };

    // Reset về chế độ viết mới
    const handleNewChapter = () => {
        if (!editor) return;

        setEditMode('new');
        setSelectedChapterId(null);
        setChapterTitle('');
        setChapterStatus('draft');
        editor.commands.clearContent();

        // Set số chương tiếp theo
        if (chapters.length > 0) {
            const maxChapter = Math.max(...chapters.map(c => c.chapterNumber));
            setChapterNumber(maxChapter + 1);
        } else {
            setChapterNumber(1);
        }
    };

    // Đăng chương (thay đổi status từ draft -> published)
    const handlePublish = async () => {
        if (!selectedChapterId) {
            alert('Vui lòng lưu chương trước khi đăng!');
            return;
        }

        if (!confirm('Bạn có chắc muốn đăng chương này?')) return;

        setIsPublishing(true);
        try {
            const result = await updateChapterStatusService(selectedChapterId, 'published');
            if (result) {
                setChapterStatus('published');
                alert('Đăng chương thành công!');

                // Reload danh sách chương
                if (selectedNovelId) {
                    const chaptersData = await getChaptersByNovelService(selectedNovelId);
                    if (chaptersData && Array.isArray(chaptersData)) {
                        const sortedChapters = chaptersData.sort((a: Chapter, b: Chapter) => a.chapterNumber - b.chapterNumber);
                        setChapters(sortedChapters);
                    }
                }
            } else {
                alert('Không thể đăng chương!');
            }
        } catch (error) {
            console.error('Lỗi khi đăng chương:', error);
            alert('Có lỗi xảy ra khi đăng chương!');
        } finally {
            setIsPublishing(false);
        }
    };

    // Thay đổi status chương
    const handleStatusChange = async (newStatus: 'draft' | 'published' | 'scheduled') => {
        if (editMode === 'new') {
            // Chỉ cập nhật local state nếu đang ở chế độ viết mới
            setChapterStatus(newStatus);
            return;
        }

        if (!selectedChapterId) return;

        try {
            const result = await updateChapterStatusService(selectedChapterId, newStatus);
            if (result) {
                setChapterStatus(newStatus);

                // Reload danh sách chương
                if (selectedNovelId) {
                    const chaptersData = await getChaptersByNovelService(selectedNovelId);
                    if (chaptersData && Array.isArray(chaptersData)) {
                        const sortedChapters = chaptersData.sort((a: Chapter, b: Chapter) => a.chapterNumber - b.chapterNumber);
                        setChapters(sortedChapters);
                    }
                }
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái:', error);
        }
    };

    const handleSave = useCallback(async () => {
        if (!editor) return;

        // Kiểm tra đã chọn truyện chưa
        if (!selectedNovelId) {
            alert('Vui lòng chọn truyện trước khi lưu chương!');
            return;
        }

        setIsSaving(true);

        // Lấy nội dung theo nhiều định dạng
        const htmlContent = editor.getHTML();      // Định dạng HTML
        const jsonContent = editor.getJSON();      // Định dạng JSON (ProseMirror)

        // Lấy word/char count trực tiếp từ editor
        const words = editor.storage.characterCount?.words() || 0;
        const chars = editor.storage.characterCount?.characters() || 0;

        // Data để gửi lên server
        const chapterData = {
            novelId: selectedNovelId,
            chapterNumber: chapterNumber,
            title: chapterTitle || `Chương ${chapterNumber}`,
            content: htmlContent,
            contentJson: jsonContent,
            wordCount: words,
            charCount: chars,
            status: chapterStatus,
            ...(editMode === 'edit' && selectedChapterId && { chapterId: selectedChapterId }),
        };

        try {
            const result = await uploadChapterService(chapterData);
            console.log('📝 Upload result:', result);

            if (result) {
                console.log('✅ Lưu chương thành công:', result);
                alert(editMode === 'edit' ? 'Cập nhật chương thành công!' : 'Lưu chương mới thành công!');

                // Reload danh sách chương - API trả về array trực tiếp
                const chaptersData = await getChaptersByNovelService(selectedNovelId);
                if (chaptersData && Array.isArray(chaptersData)) {
                    const sortedChapters = chaptersData.sort((a: Chapter, b: Chapter) => a.chapterNumber - b.chapterNumber);
                    setChapters(sortedChapters);
                }

                // Nếu là tạo mới, reset form
                if (editMode === 'new') {
                    const maxChapter = Math.max(...chapters.map(c => c.chapterNumber), chapterNumber);
                    setChapterNumber(maxChapter + 1);
                    setChapterTitle('');
                    editor.commands.clearContent();
                }
            } else {
                alert('Không nhận được phản hồi từ server!');
            }
        } catch (error) {
            console.error('❌ Lỗi khi lưu chương:', error);
            alert('Có lỗi xảy ra khi lưu chương!');
        } finally {
            setIsSaving(false);
        }
    }, [editor, selectedNovelId, chapterNumber, chapterTitle, editMode, selectedChapterId, chapters, chapterStatus]);

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
                {/* Novel Selection */}
                <div className={cn(
                    "mb-6 p-4 rounded-2xl border",
                    theme.toolbarBg,
                    theme.editorBorder
                )}>
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                            <label className={cn("block text-sm font-medium mb-2", theme.text)}>
                                Chọn truyện
                            </label>

                            <Select
                                value={selectedNovelId || ""}
                                onValueChange={(value) => onNovelChange?.(value || null)}
                            >
                                <SelectTrigger className={cn(
                                    "w-full h-12 px-4 rounded-xl border transition-all duration-200 shadow-sm",
                                    isDarkMode
                                        ? "bg-stone-800 border-stone-700 text-stone-200 hover:border-stone-600"
                                        : "bg-white border-stone-300 text-stone-800 hover:border-stone-400",
                                    "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                                )}>
                                    <SelectValue placeholder="Chọn truyện..." className="text-stone-500" />
                                </SelectTrigger>
                                <SelectContent className={cn(
                                    "rounded-xl border shadow-xl",
                                    isDarkMode
                                        ? "bg-stone-800 border-stone-700"
                                        : "bg-white border-stone-200"
                                )}>
                                    {novels.map((novel) => (
                                        <SelectItem 
                                            key={novel._id || novel.id || ""} 
                                            value={(novel._id || novel.id || "")}
                                            className={cn(
                                                "rounded-lg cursor-pointer transition-colors my-1",
                                                isDarkMode
                                                    ? "text-stone-200 focus:bg-purple-500/20 focus:text-purple-300"
                                                    : "text-stone-800 focus:bg-purple-100 focus:text-purple-700"
                                            )}
                                        >
                                            {novel.title}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {selectedNovel && (
                            <>
                                <div className="flex-1">
                                    <label className={cn("block text-sm font-medium mb-2", theme.text)}>
                                        Số chương
                                    </label>
                                    <input
                                        type="number"
                                        min={1}
                                        value={chapterNumber}
                                        onChange={(e) => setChapterNumber(Number(e.target.value))}
                                        className={cn(
                                            "w-full h-10 px-4 rounded-xl border transition-all duration-200 shadow-sm appearance-none",
                                            isDarkMode
                                                ? "!bg-stone-800 border-stone-700 text-stone-200 hover:border-stone-600"
                                                : "!bg-white border-stone-300 text-stone-800 hover:border-stone-400",
                                            "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                                        )}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className={cn("block text-sm font-medium mb-2", theme.text)}>
                                        Tiêu đề chương
                                    </label>
                                    <input
                                        type="text"
                                        value={chapterTitle}
                                        onChange={(e) => setChapterTitle(e.target.value)}
                                        placeholder="Nhập tiêu đề chương..."
                                        className={cn(
                                            "w-full h-10 px-4 rounded-xl border transition-all duration-200 shadow-sm",
                                            isDarkMode
                                                ? "!bg-stone-800 border-stone-700 text-stone-200 hover:border-stone-600 placeholder:text-stone-500"
                                                : "!bg-white border-stone-300 text-stone-800 hover:border-stone-400 placeholder:text-stone-400",
                                            "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                                        )}
                                    />
                                </div>
                                <div className="w-44">
                                    <label className={cn("block text-sm font-medium mb-2", theme.text)}>
                                        Trạng thái
                                    </label>
                                    <Select value={chapterStatus}
                                        onValueChange={(value) => handleStatusChange(value as 'draft' | 'published' | 'scheduled')}>
                                        <SelectTrigger className={cn(
                                            "w-full h-12 px-4 rounded-xl border transition-all duration-200 shadow-sm",
                                            isDarkMode
                                                ? "bg-stone-800 border-stone-700 text-stone-200 hover:border-stone-600"
                                                : "bg-white border-stone-300 text-stone-800 hover:border-stone-400",
                                            "focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500"
                                        )}>
                                            <div className="flex items-center gap-2">
                                                {chapterStatus === 'draft' && <FileEdit className="w-4 h-4 text-amber-400" />}
                                                {chapterStatus === 'published' && <Send className="w-4 h-4 text-green-400" />}
                                                {chapterStatus === 'scheduled' && <Clock className="w-4 h-4 text-blue-400" />}
                                                <SelectValue placeholder="Trạng thái" />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className={cn(
                                            "rounded-xl border shadow-xl",
                                            isDarkMode
                                                ? "bg-stone-800 border-stone-700"
                                                : "bg-white border-stone-200"
                                        )}>
                                            <SelectItem 
                                                value="draft"
                                                className={cn(
                                                    "rounded-lg cursor-pointer transition-colors my-1",
                                                    isDarkMode
                                                        ? "text-stone-200 focus:bg-amber-500/20 focus:text-amber-300"
                                                        : "text-stone-800 focus:bg-amber-100 focus:text-amber-700"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <FileEdit className="w-4 h-4 text-amber-400" />
                                                    Bản nháp
                                                </div>
                                            </SelectItem>
                                            <SelectItem 
                                                value="published"
                                                className={cn(
                                                    "rounded-lg cursor-pointer transition-colors my-1",
                                                    isDarkMode
                                                        ? "text-stone-200 focus:bg-green-500/20 focus:text-green-300"
                                                        : "text-stone-800 focus:bg-green-100 focus:text-green-700"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Send className="w-4 h-4 text-green-400" />
                                                    Đã đăng
                                                </div>
                                            </SelectItem>
                                            <SelectItem 
                                                value="scheduled"
                                                className={cn(
                                                    "rounded-lg cursor-pointer transition-colors my-1",
                                                    isDarkMode
                                                        ? "text-stone-200 focus:bg-blue-500/20 focus:text-blue-300"
                                                        : "text-stone-800 focus:bg-blue-100 focus:text-blue-700"
                                                )}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-4 h-4 text-blue-400" />
                                                    Hẹn giờ
                                                </div>
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Chương đã đăng - Dropdown chọn chương để sửa */}
                    {selectedNovel && (
                        <div className={cn(
                            "mt-4 pt-4 border-t",
                            isDarkMode ? "border-stone-700" : "border-stone-300"
                        )}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className={cn("text-sm font-medium flex items-center gap-2", theme.text)}>
                                    <FileText className="w-4 h-4" />
                                    Các chương đã đăng ({chapters.length} chương)
                                </h3>
                                <div className="flex items-center gap-2">
                                    {isLoadingChapters && (
                                        <RefreshCw className={cn("w-4 h-4 animate-spin", theme.textMuted)} />
                                    )}
                                    <button
                                        onClick={handleNewChapter}
                                        disabled={editMode === 'new'}
                                        className={cn(
                                            "px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition-all",
                                            editMode === 'new'
                                                ? isDarkMode
                                                    ? "bg-green-500/20 text-green-400 cursor-default"
                                                    : "bg-green-100 text-green-700 cursor-default"
                                                : isDarkMode
                                                    ? "bg-stone-700 text-stone-300 hover:bg-green-500/20 hover:text-green-400"
                                                    : "bg-stone-200 text-stone-600 hover:bg-green-100 hover:text-green-700"
                                        )}
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        Viết chương mới
                                    </button>
                                </div>
                            </div>

                            {chapters.length > 0 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {chapters.map((chapter) => {
                                        const isSelected = (chapter._id || chapter.id) === selectedChapterId;
                                        return (
                                            <button
                                                key={chapter._id || chapter.id}
                                                onClick={() => handleSelectChapterToEdit(chapter)}
                                                disabled={isLoadingContent}
                                                className={cn(
                                                    "w-full p-3 rounded-xl border text-left transition-all duration-200 flex items-center justify-between group",
                                                    isSelected
                                                        ? isDarkMode
                                                            ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                                                            : "bg-purple-100 border-purple-300 text-purple-700"
                                                        : isDarkMode
                                                            ? "bg-stone-800/50 border-stone-700 text-stone-300 hover:bg-stone-700/50 hover:border-stone-600"
                                                            : "bg-white border-stone-300 text-stone-700 hover:bg-stone-50 hover:border-stone-400",
                                                    isLoadingContent && "opacity-50 cursor-wait"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={cn(
                                                        "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium",
                                                        isSelected
                                                            ? isDarkMode ? "bg-purple-500/30" : "bg-purple-200"
                                                            : isDarkMode ? "bg-stone-700" : "bg-stone-200"
                                                    )}>
                                                        {chapter.chapterNumber}
                                                    </span>
                                                    <div>
                                                        <p className="font-medium text-sm">
                                                            {chapter.title || `Chương ${chapter.chapterNumber}`}
                                                        </p>
                                                        <p className={cn("text-xs", theme.textMuted)}>
                                                            {chapter.wordCount ? `${chapter.wordCount} từ` : 'Chưa có nội dung'}
                                                            {chapter.status && (
                                                                <span className={cn(
                                                                    "ml-2 px-1.5 py-0.5 rounded text-xs",
                                                                    chapter.status === 'published'
                                                                        ? "bg-green-500/20 text-green-400"
                                                                        : "bg-amber-500/20 text-amber-400"
                                                                )}>
                                                                    {chapter.status === 'published' ? 'Đã đăng' : 'Bản nháp'}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Edit3 className={cn(
                                                    "w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity",
                                                    isSelected && "opacity-100"
                                                )} />
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className={cn("text-sm py-4 text-center", theme.textMuted)}>
                                    Chưa có chương nào được đăng cho truyện này.
                                </p>
                            )}

                            {/* Indicator chế độ hiện tại */}
                            {editMode === 'edit' && selectedChapterId && (
                                <div className={cn(
                                    "mt-3 p-2 rounded-lg text-sm flex items-center gap-2",
                                    isDarkMode ? "bg-amber-500/10 text-amber-400" : "bg-amber-100 text-amber-700"
                                )}>
                                    <Edit3 className="w-4 h-4" />
                                    Đang chỉnh sửa chương {chapterNumber}
                                </div>
                            )}
                        </div>
                    )}

                    {selectedNovel && (
                        <div className={cn("mt-3 text-2xl", theme.textMuted)}>
                            Đang viết cho:{" "}
                            <span
                                className={cn(
                                    "font-medium bg-gradient-to-r from-[#FFAA00] to-[#FF5500] bg-clip-text text-transparent"
                                )}
                            >
                                {selectedNovel.title}
                            </span>
                        </div>
                    )}
                    {!selectedNovel && novels.length === 0 && (
                        <div className={cn("mt-3 text-sm text-amber-500")}>
                            Bạn chưa có truyện nào. Vui lòng tạo truyện mới trước khi viết chương.
                        </div>
                    )}

                </div>

                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <FileText className={cn("w-8 h-8", isDarkMode ? "text-purple-400" : "text-purple-600")} />
                        <div>
                            <h1 className={cn("text-2xl font-bold", theme.text)}>
                                {editMode === 'edit'
                                    ? `Sửa chương ${chapterNumber}`
                                    : selectedNovel
                                        ? `Viết chương ${chapterNumber}`
                                        : "Novel Editor"
                                }
                            </h1>
                            <p className={cn("text-sm", theme.textMuted)}>
                                {selectedNovel ? chapterTitle || "Chưa có tiêu đề" : "Viết nên câu chuyện của riêng bạn"}
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

                        {/* Nút Đăng chương - chỉ hiện khi đang edit và chưa publish */}
                        {editMode === 'edit' && chapterStatus !== 'published' && (
                            <button
                                onClick={handlePublish}
                                disabled={isPublishing}
                                className={cn(
                                    "px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 font-medium",
                                    "bg-gradient-to-r from-green-500 to-emerald-500 text-white",
                                    "hover:from-green-600 hover:to-emerald-600",
                                    "shadow-lg shadow-green-500/25",
                                    isPublishing && "opacity-70"
                                )}
                            >
                                <Send className={cn("w-4 h-4", isPublishing && "animate-spin")} />
                                {isPublishing ? "Đang đăng..." : "Đăng"}
                            </button>
                        )}

                        {/* Badge trạng thái */}
                        {editMode === 'edit' && (
                            <div className={cn(
                                "px-3 py-2 rounded-xl text-sm flex items-center gap-1.5",
                                chapterStatus === 'published'
                                    ? isDarkMode ? "bg-green-500/20 text-green-400" : "bg-green-100 text-green-700"
                                    : chapterStatus === 'scheduled'
                                        ? isDarkMode ? "bg-blue-500/20 text-blue-400" : "bg-blue-100 text-blue-700"
                                        : isDarkMode ? "bg-amber-500/20 text-amber-400" : "bg-amber-100 text-amber-700"
                            )}>
                                {chapterStatus === 'published' && <><Eye className="w-3.5 h-3.5" /> Đã đăng</>}
                                {chapterStatus === 'scheduled' && <><Clock className="w-3.5 h-3.5" /> Hẹn giờ</>}
                                {chapterStatus === 'draft' && <><FileEdit className="w-3.5 h-3.5" /> Bản nháp</>}
                            </div>
                        )}
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
