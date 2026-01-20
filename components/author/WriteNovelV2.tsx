"use client"

import { useState, useCallback, useEffect, useMemo } from "react";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import {
    Bold, Italic, Underline as UnderlineIcon, Strikethrough,
    Heading1, Heading2, Heading3, List, ListOrdered, Quote, Code, Minus,
    Undo, Redo, AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Highlighter, Sun, Moon, Save, FileText, Eye, EyeOff, Music,
    Maximize2, Minimize2, Type, Pilcrow, Plus, Edit3, RefreshCw,
    Send, Clock, FileEdit, Upload, ChevronLeft, ChevronRight,
    ChevronsLeft, ChevronsRight, Search, Wand2, Headphones, CheckCircle2, Circle
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { uploadChapterService, getChaptersByNovelService, getChapterContentService, updateChapterStatusService } from "@/services/novelService";
import WordUploader from "./WordUploader";
import StyleEditor from "./StyleEditor";
import AudioManager from "./AudioManager";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NovelEditDialog } from "./NovelEditDialog";
import { BackgroundMusicManager } from "./BackgroundMusicManager";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Toolbar Button Component
const ToolbarButton = ({
    onClick, isActive = false, disabled = false, children, title, isDark
}: {
    onClick: () => void; isActive?: boolean; disabled?: boolean; children: React.ReactNode; title: string; isDark: boolean;
}) => (
    <button
        type="button"
        onMouseDown={(e) => e.preventDefault()}
        onClick={(e) => { e.preventDefault(); onClick(); }}
        disabled={disabled}
        title={title}
        className={cn(
            "p-2 rounded-md transition-all duration-200 flex items-center justify-center flex-shrink-0",
            disabled && "opacity-40 cursor-not-allowed",
            isActive
                ? isDark ? "bg-stone-700 text-stone-200" : "bg-stone-200 text-stone-900"
                : isDark ? "text-stone-400 hover:bg-stone-800 hover:text-stone-200" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
        )}
    >
        {children}
    </button>
);

// Toolbar Divider
const ToolbarDivider = ({ isDark }: { isDark: boolean }) => (
    <div className={cn("w-px h-5 mx-1 flex-shrink-0 self-center", isDark ? "bg-stone-700" : "bg-stone-300")} />
);

interface Novel {
    _id?: string; id?: string; title: string; coverImage?: string;
}

interface Chapter {
    _id?: string; id?: string; chapterNumber: number; title: string;
    content?: string; contentJson?: any; wordCount?: number;
    status?: string; publishedAt?: string; updatedAt?: string;
}

interface WriteNovelProps {
    novels?: Novel[];
    selectedNovelId?: string | null;
    onNovelChange?: (novelId: string | null) => void;
}

const WriteNovelV2 = ({ novels = [], selectedNovelId = null, onNovelChange }: WriteNovelProps) => {
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isPreview, setIsPreview] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [chapterTitle, setChapterTitle] = useState("");
    const [chapterNumber, setChapterNumber] = useState(1);
    const [chapterStatus, setChapterStatus] = useState<'draft' | 'published' | 'scheduled'>('draft');

    // State
    const [chapters, setChapters] = useState<Chapter[]>([]);
    const [isLoadingChapters, setIsLoadingChapters] = useState(false);
    const [editMode, setEditMode] = useState<'new' | 'edit'>('new');
    const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
    const [isLoadingContent, setIsLoadingContent] = useState(false);
    const [isPublishing, setIsPublishing] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [chaptersPerPage] = useState(10);
    const [searchQuery, setSearchQuery] = useState("");

    // Modals
    const [showWordUploader, setShowWordUploader] = useState(false);
    const [showStyleEditor, setShowStyleEditor] = useState(false);
    const [showAudioManager, setShowAudioManager] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showMusicManager, setShowMusicManager] = useState(false);

    const selectedNovel = novels.find(n => (n._id || n.id) === selectedNovelId);

    const filteredChapters = useMemo(() => {
        if (!searchQuery.trim()) return chapters;
        const query = searchQuery.toLowerCase();
        return chapters.filter(ch => 
            ch.title?.toLowerCase().includes(query) || 
            ch.chapterNumber.toString().includes(query)
        );
    }, [chapters, searchQuery]);

    const totalPages = Math.ceil(filteredChapters.length / chaptersPerPage);
    const paginatedChapters = useMemo(() => {
        const startIndex = (currentPage - 1) * chaptersPerPage;
        return filteredChapters.slice(startIndex, startIndex + chaptersPerPage);
    }, [filteredChapters, currentPage, chaptersPerPage]);

    useEffect(() => { setCurrentPage(1); }, [searchQuery]);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
            Underline,
            TextAlign.configure({ types: ['heading', 'paragraph'] }),
            Highlight.configure({ multicolor: true }),
            Placeholder.configure({ placeholder: 'Bắt đầu viết...' }),
            CharacterCount,
        ],
        content: '',
        editorProps: {
            attributes: {
                class: cn(
                    'prose prose-lg max-w-none focus:outline-none min-h-[calc(100vh-300px)] py-8 px-12 md:px-20',
                    'prose-headings:font-bold prose-headings:tracking-tight',
                    'prose-p:leading-loose prose-p:my-4',
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

    const loadChapters = async (novelId: string) => {
        if (!novelId) {
            setChapters([]); setEditMode('new'); setSelectedChapterId(null); return;
        }
        setIsLoadingChapters(true);
        try {
            const response = await getChaptersByNovelService(novelId);
            if (response && Array.isArray(response)) {
                setChapters(response);
                if (response.length > 0) {
                    const maxChapter = Math.max(...response.map((c: Chapter) => c.chapterNumber));
                    setChapterNumber(maxChapter + 1); // Default to next chapter for new
                } else {
                    setChapterNumber(1);
                }
            } else {
                setChapters([]); setChapterNumber(1);
            }
        } catch (error) {
            console.error('Error loading chapters:', error); setChapters([]);
        } finally {
            setIsLoadingChapters(false);
        }
    };

    useEffect(() => {
        if (selectedNovelId) loadChapters(selectedNovelId);
        else { setChapters([]); setEditMode('new'); setSelectedChapterId(null); }
    }, [selectedNovelId]);

    const handleSelectChapterToEdit = async (chapter: Chapter) => {
        if (!selectedNovelId || !editor) return;
        setIsLoadingContent(true);
        setSelectedChapterId(chapter._id || chapter.id || null);
        try {
            const chapterData = await getChapterContentService(selectedNovelId, chapter.chapterNumber);
            if (chapterData) {
                setChapterNumber(chapterData.chapterNumber);
                setChapterTitle(chapterData.title || '');
                setChapterStatus(chapterData.status || 'draft');
                if (chapterData.contentJson) editor.commands.setContent(chapterData.contentJson);
                else if (chapterData.content) editor.commands.setContent(chapterData.content);
                setEditMode('edit');
            } else { alert('Không tìm thấy dữ liệu!'); }
        } catch (error) { console.error(error); alert('Lỗi load nội dung!'); }
        finally { setIsLoadingContent(false); }
    };

    const handleNewChapter = () => {
        if (!editor) return;
        setEditMode('new'); setSelectedChapterId(null); setChapterTitle(''); setChapterStatus('draft');
        editor.commands.clearContent();
        if (chapters.length > 0) {
            const maxChapter = Math.max(...chapters.map(c => c.chapterNumber));
            setChapterNumber(maxChapter + 1);
        } else { setChapterNumber(1); }
    };

    const handlePublish = async () => {
        if (!selectedChapterId) {
            alert('Lưu trước khi đăng!'); return;
        }
        if (!confirm('Đăng chương này?')) return;
        setIsPublishing(true);
        try {
            const result = await updateChapterStatusService(selectedChapterId, 'published');
            if (result) {
                setChapterStatus('published');
                alert('Đã đăng!');
                if (selectedNovelId) loadChapters(selectedNovelId);
            }
        } catch (e) { alert('Lỗi đăng chương!'); }
        finally { setIsPublishing(false); }
    };

    const handleStatusChange = async (newStatus: 'draft' | 'published' | 'scheduled') => {
        if (editMode === 'new') { setChapterStatus(newStatus); return; }
        if (!selectedChapterId) return;
        try {
            const result = await updateChapterStatusService(selectedChapterId, newStatus);
            if (result) {
                setChapterStatus(newStatus);
                if (selectedNovelId) loadChapters(selectedNovelId);
            }
        } catch (e) { console.error(e); }
    };

    const handleSave = useCallback(async () => {
        if (!editor || !selectedNovelId) { alert('Chọn truyện trước!'); return; }
        setIsSaving(true);
        const htmlContent = editor.getHTML();
        const jsonContent = editor.getJSON();
        const words = editor.storage.characterCount?.words() || 0;
        const chars = editor.storage.characterCount?.characters() || 0;

        const chapterData = {
            novelId: selectedNovelId,
            chapterNumber: chapterNumber,
            title: chapterTitle || `Chương ${chapterNumber}`,
            content: htmlContent, contentJson: jsonContent,
            wordCount: words, charCount: chars, status: chapterStatus,
            ...(editMode === 'edit' && selectedChapterId && { chapterId: selectedChapterId }),
        };

        try {
            const result = await uploadChapterService(chapterData);
            if (result) {
                alert(editMode === 'edit' ? 'Đã cập nhật!' : 'Đã lưu!');
                if (selectedNovelId) await loadChapters(selectedNovelId);
                if (editMode === 'new') {
                   // Stay in new mode or switch? Usually user wants to continue writing next one or edit this one.
                   // The original implementation reset to next chapter.
                   const maxChapter = Math.max(...chapters.map(c => c.chapterNumber), chapterNumber);
                   setChapterNumber(maxChapter + 1);
                   setChapterTitle('');
                   editor.commands.clearContent();
                }
            } else { alert('Lỗi server!'); }
        } catch (e) { console.error(e); alert('Lỗi lưu!'); }
        finally { setIsSaving(false); }
    }, [editor, selectedNovelId, chapterNumber, chapterTitle, editMode, selectedChapterId, chapters, chapterStatus]);

    const theme = {
        bg: isDarkMode ? "bg-[#191919]" : "bg-white",
        sidebarBg: isDarkMode ? "bg-[#1e1e1e]" : "bg-stone-50",
        editorBg: isDarkMode ? "bg-[#191919]" : "bg-white",
        toolbarBg: isDarkMode ? "bg-[#1e1e1e]" : "bg-white",
        border: isDarkMode ? "border-[#333]" : "border-stone-200",
        text: isDarkMode ? "text-stone-300" : "text-stone-800",
        textMuted: isDarkMode ? "text-[#888]" : "text-stone-500",
        inputBg: isDarkMode ? "bg-[#252525]" : "bg-stone-100",
        prose: isDarkMode ? "prose-invert" : "",
    };

    return (
        <div className={cn(
            "flex h-full w-full overflow-hidden rounded-xl border shadow-xl transition-all duration-300 font-sans",
            theme.bg, theme.border, theme.text,
            isFullscreen && "fixed inset-0 h-screen z-50 rounded-none border-0"
        )}>
            {/* LEFT SIDEBAR - NAVIGATION */}
            <div className={cn(
                "w-72 flex-shrink-0 flex flex-col border-r h-full relative z-10",
                theme.sidebarBg, theme.border
            )}>
                {/* Header: Novel Selection */}
                <div className="p-4 border-b space-y-3 flex-none border-dashed" style={{borderColor: isDarkMode ? '#333' : '#e5e7eb'}}>
                     <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider opacity-70">
                            QUẢN LÝ
                        </span>
                         {selectedNovel && (
                             <Button variant="ghost" size="icon" onClick={() => setShowEditDialog(true)} className="h-6 w-6 opacity-60 hover:opacity-100">
                                <Edit3 className="w-3.5 h-3.5" />
                            </Button>
                        )}
                     </div>
                     
                    <Select value={selectedNovelId || ""} onValueChange={(value) => onNovelChange?.(value || null)}>
                        <SelectTrigger className={cn("w-full h-9 text-sm border-0 focus:ring-1", theme.inputBg)}>
                            <SelectValue placeholder="Chọn truyện..." />
                        </SelectTrigger>
                        <SelectContent className={isDarkMode ? "bg-[#252525] text-stone-300 border-[#333]" : ""}>
                            {novels.map((novel) => (
                                <SelectItem key={novel._id || novel.id || "temp"} value={(novel._id || novel.id || "")}>{novel.title}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Search */}
                    <div className="relative">
                        <Search className={cn("absolute left-2.5 top-2.5 w-3.5 h-3.5 opacity-50")} />
                        <Input
                            placeholder="Tìm kiếm chương..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                            className={cn("pl-8 h-9 text-sm border-0 focus-visible:ring-1", theme.inputBg)}
                        />
                    </div>
                </div>

                {/* Chapter List */}
                <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-stone-700/20">
                    {isLoadingChapters ? (
                        <div className="flex flex-col items-center justify-center h-48 opacity-50 gap-2">
                             <RefreshCw className="animate-spin w-5 h-5" />
                             <span className="text-xs">Đang tải...</span>
                        </div>
                    ) : filteredChapters.length > 0 ? (
                        <div className="space-y-1">
                             {paginatedChapters.map((chapter) => {
                                const isSelected = (chapter._id || chapter.id) === selectedChapterId;
                                return (
                                    <button
                                        key={chapter._id || chapter.id}
                                        onClick={() => handleSelectChapterToEdit(chapter)}
                                        className={cn(
                                            "w-full px-3 py-2.5 rounded-lg text-left text-sm transition-all flex flex-col gap-1 group relative",
                                            isSelected 
                                                ? isDarkMode ? "bg-purple-500/10 text-purple-300" : "bg-purple-50 text-purple-900"
                                                : "hover:bg-black/5 dark:hover:bg-white/5 opacity-80 hover:opacity-100"
                                        )}
                                    >
                                        <div className="flex justify-between items-start w-full">
                                            <span className={cn("font-medium truncate pr-2 flex-1", isSelected && "font-bold")}>
                                                <span className="opacity-50 text-xs mr-2">#{chapter.chapterNumber}</span>
                                                {chapter.title || "Chưa đặt tên"}
                                            </span>
                                            {chapter.status === 'published' && <CheckCircle2 className="w-3 h-3 text-green-600 mt-1 flex-shrink-0" />}
                                            {chapter.status === 'draft' && <Circle className="w-3 h-3 text-amber-600 mt-1 flex-shrink-0" />}
                                        </div>
                                        <div className="flex justify-between text-[10px] opacity-60 pl-6 w-full">
                                            <span>{chapter.wordCount?.toLocaleString() || 0} từ</span>
                                            {chapter.status !== 'published' && (
                                                <span className="text-amber-500 uppercase tracking-wide">Nháp</span>
                                            )}
                                        </div>
                                    </button>
                                )
                             })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-48 opacity-40 px-6 text-center">
                            <FileText className="w-10 h-10 mb-2 opacity-50" />
                            <p className="text-sm">{selectedNovel ? "Chưa có chương nào" : "Chọn một truyện để bắt đầu viết"}</p>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                 <div className={cn("p-3 border-t space-y-2 flex-none", theme.border)}>
                    <Button 
                        onClick={handleNewChapter} disabled={!selectedNovelId}
                        className="w-full justify-center bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Chương mới
                    </Button>
                    <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" onClick={() => setShowWordUploader(true)} title="Upload Word" className="text-xs h-8">
                            <Upload className="w-3 h-3 mr-2 opacity-70" /> Import Word
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setShowAudioManager(true)} title="Audio TTS" className="text-xs h-8">
                            <Headphones className="w-3 h-3 mr-2 opacity-70" /> Audio
                        </Button>
                    </div>
                 </div>
            </div>

            {/* MAIN CONTENT - EDITOR */}
            <div className={cn("flex-1 flex flex-col h-full min-w-0 relative", theme.bg)}>
                
                {/* 1. TOP METADATA BAR */}
                <div className={cn("flex-none p-4 md:px-8 pt-6 pb-2 flex flex-col gap-4", theme.bg)}>
                     <div className="flex items-center justify-between gap-4">
                        {/* Title Input Area */}
                         <div className="flex-1 flex gap-3 items-center">
                             <div className="w-20 flex-shrink-0 flex flex-col">
                                 <span className="text-[10px] uppercase font-bold tracking-wide opacity-50 mb-0.5 ml-1">Chương</span>
                                 <Input 
                                     type="number" 
                                     value={chapterNumber} 
                                     onChange={e => setChapterNumber(Number(e.target.value))} 
                                     className={cn("h-10 text-center font-mono text-lg font-bold border-transparent hover:border-stone-700 focus:border-purple-500 transition-colors bg-transparent shadow-none px-0 rounded-none border-b", isDarkMode ? "text-white placeholder:text-stone-600" : "text-black")} 
                                 />
                             </div>
                             
                             <div className="flex-1 flex flex-col">
                                 <span className="text-[10px] uppercase font-bold tracking-wide opacity-50 mb-0.5 ml-1">Tiêu đề</span>
                                 <Input 
                                    type="text" 
                                    value={chapterTitle} 
                                    onChange={e => setChapterTitle(e.target.value)} 
                                    placeholder="Nhập tiêu đề chương..." 
                                    className={cn("h-10 text-xl font-bold border-transparent hover:border-stone-700 focus:border-purple-500 transition-colors bg-transparent shadow-none px-2 rounded-none border-b placeholder:font-normal", isDarkMode ? "text-white placeholder:text-stone-700" : "text-black")} 
                                />
                             </div>
                         </div>
                         
                         {/* Action Buttons */}
                         <div className="flex items-center gap-2 pl-4 border-l border-stone-800">
                             <div className="flex items-center bg-stone-800/50 rounded-lg p-0.5 border border-stone-700/50 mr-2">
                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-white" onClick={() => setIsDarkMode(!isDarkMode)}>
                                     {isDarkMode ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                                 </Button>
                                 <Button variant="ghost" size="icon" className="h-8 w-8 text-stone-400 hover:text-white" onClick={() => setIsFullscreen(!isFullscreen)}>
                                     {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                                 </Button>
                             </div>

                             {editMode === 'edit' && chapterStatus !== 'published' && (
                                <Select value={chapterStatus} onValueChange={(v: any) => handleStatusChange(v)}>
                                    <SelectTrigger className="w-[110px] h-9 bg-transparent border-stone-700 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="draft">Bản nháp</SelectItem>
                                        <SelectItem value="published">Đã đăng</SelectItem>
                                        <SelectItem value="scheduled">Hẹn giờ</SelectItem>
                                    </SelectContent>
                                </Select>
                             )}
                             
                             <Button onClick={handleSave} disabled={isSaving} className="h-9 px-5 bg-white text-black hover:bg-stone-200 font-medium min-w-[90px]">
                                 {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Lưu"}
                             </Button>
                             
                             {editMode === 'edit' && chapterStatus !== 'published' && (
                                <Button onClick={handlePublish} disabled={isPublishing} className="h-9 w-9 p-0 bg-green-600 hover:bg-green-700 text-white" title="Đăng ngay">
                                    <Send className="w-4 h-4" />
                                </Button>
                             )}
                         </div>
                     </div>
                </div>

                {/* 2. RICH TEXT TOOLBAR */}
                {editor && (
                    <div className={cn("flex-none mx-4 md:mx-8 mb-4 px-2 py-1.5 rounded-lg border flex flex-wrap items-center gap-1 shadow-sm", 
                        isDarkMode ? "bg-[#202020] border-[#333]" : "bg-white border-stone-200"
                    )}>
                        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo" isDark={isDarkMode}><Undo className="w-4 h-4"/></ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo" isDark={isDarkMode}><Redo className="w-4 h-4"/></ToolbarButton>
                        <ToolbarDivider isDark={isDarkMode} />
                        
                        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} title="Bold (Ctrl+B)" isDark={isDarkMode}><Bold className="w-4 h-4"/></ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} title="Italic (Ctrl+I)" isDark={isDarkMode}><Italic className="w-4 h-4"/></ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} title="Underline (Ctrl+U)" isDark={isDarkMode}><UnderlineIcon className="w-4 h-4"/></ToolbarButton>
                        <ToolbarDivider isDark={isDarkMode} />
                        
                        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({level:2}).run()} isActive={editor.isActive('heading', {level:2})} title="Heading 2" isDark={isDarkMode}><Heading2 className="w-4 h-4"/></ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({level:3}).run()} isActive={editor.isActive('heading', {level:3})} title="Heading 3" isDark={isDarkMode}><Heading3 className="w-4 h-4"/></ToolbarButton>
                        <ToolbarDivider isDark={isDarkMode} />
                        
                        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({textAlign:'left'})} title="Align Left" isDark={isDarkMode}><AlignLeft className="w-4 h-4"/></ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({textAlign:'center'})} title="Align Center" isDark={isDarkMode}><AlignCenter className="w-4 h-4"/></ToolbarButton>
                        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({textAlign:'justify'})} title="Justify" isDark={isDarkMode}><AlignJustify className="w-4 h-4"/></ToolbarButton>
                        
                        <div className="flex-1" />
                        
                        <ToolbarButton onClick={() => setShowStyleEditor(true)} title="AI Style" isDark={isDarkMode}><Wand2 className="w-4 h-4 text-purple-400"/></ToolbarButton>
                        <ToolbarButton onClick={() => setShowMusicManager(true)} title="Ambient Music" isDark={isDarkMode}><Music className="w-4 h-4"/></ToolbarButton>
                    </div>
                )}

                {/* 3. EDITOR AREA */}
                <div className={cn("flex-1 overflow-y-auto relative no-scrollbar", theme.editorBg)} onClick={() => editor?.chain().focus()}>
                    <div className={cn("max-w-4xl mx-auto min-h-full shadow-sm", theme.prose)}>
                        <EditorContent editor={editor} />
                    </div>
                </div>

                {/* 4. FOOTER STATUS BAR */}
                <div className={cn("flex-none border-t px-6 py-2 flex justify-between items-center text-[10px] font-mono tracking-wide uppercase opacity-70", theme.border, theme.bg)}>
                    <div className="flex gap-6">
                        <span>Words: <span className="font-bold">{wordCount.toLocaleString()}</span></span>
                        <span>Chars: <span className="font-bold">{charCount.toLocaleString()}</span></span>
                    </div>
                    <div>
                        {isSaving ? <span className="text-amber-500 animate-pulse">SAVING...</span> : <span className="text-green-600">SAVED</span>}
                    </div>
                </div>
            </div>

            {/* Dialogs */}
            {showWordUploader && selectedNovelId && (
                <WordUploader
                    isDark={isDarkMode}
                    novelId={selectedNovelId}
                    currentMaxChapter={Math.max(...chapters.map(c => c.chapterNumber), 0)}
                    onUploadComplete={async () => { await loadChapters(selectedNovelId); setShowWordUploader(false); }}
                    onClose={() => setShowWordUploader(false)}
                    uploadChapterFn={uploadChapterService}
                />
            )}
            <StyleEditor
                isOpen={showStyleEditor} onClose={() => setShowStyleEditor(false)} isDark={isDarkMode}
                currentContent={editor?.getHTML() || ''}
                onApply={(c) => editor && editor.commands.setContent(c)}
                chapters={chapters} novelId={selectedNovelId || undefined}
                getChapterContent={getChapterContentService}
                onBatchComplete={async () => selectedNovelId && await loadChapters(selectedNovelId)}
            />
            {selectedNovelId && (
                <AudioManager
                    novelId={selectedNovelId} chapters={chapters} isDarkMode={isDarkMode}
                    isOpen={showAudioManager} onClose={() => setShowAudioManager(false)}
                />
            )}
            {selectedNovel && (
                <NovelEditDialog
                    open={showEditDialog} onOpenChange={setShowEditDialog}
                    novel={selectedNovel as any} onSuccess={() => window.location.reload()}
                />
            )}
            <BackgroundMusicManager
                isOpen={showMusicManager} onClose={() => setShowMusicManager(false)} isDarkMode={isDarkMode}
            />
        </div>
    );
};

export default WriteNovelV2;
