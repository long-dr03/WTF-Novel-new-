"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { 
    ChevronLeft, 
    ChevronRight, 
    Home, 
    List,
    Settings,
    BookOpen,
    ArrowLeft,
    Sun,
    Moon
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getChapterContentService, getChaptersByNovelService, getNovelByIdService, addToLibraryService } from "@/services/novelService"
import { AudioSidebar } from "@/components/reader/AudioSidebar"
import { Headphones } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"

interface Chapter {
    _id: string
    novelId: string
    chapterNumber: number
    title: string
    content: string
    wordCount: number
    charCount: number
    views: number
    status: string
    audioUrl?: string | null
}

interface Novel {
    _id: string
    title: string
    coverImage?: string
}

interface ChapterInfo {
    _id: string
    chapterNumber: number
    title: string
}

export default function ReadChapterPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const novelId = params.novelId as string
    const chapterNumber = parseInt(params.chapterNumber as string)

    const [chapter, setChapter] = useState<Chapter | null>(null)
    const [novel, setNovel] = useState<Novel | null>(null)
    const [chapters, setChapters] = useState<ChapterInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [fontSize, setFontSize] = useState(18)
    const [lineHeight, setLineHeight] = useState(1.8)
    const [fontFamily, setFontFamily] = useState("serif")
    const [readingTheme, setReadingTheme] = useState<'light' | 'sepia' | 'dark'>('light')
    const [autoNext, setAutoNext] = useState(true)
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
useEffect(() => {
        if (user && chapter && chapter._id) {
             addToLibraryService(novelId, 'history', chapter._id).catch(err => console.error("Failed to save history", err))
        }
    }, [user, chapter, novelId])

    
    const updateTheme = (theme: 'light' | 'sepia' | 'dark') => {
        setReadingTheme(theme)
    }
    useEffect(() => {
        const fetchData = async () => {
            if (!novelId || !chapterNumber) return
            try {
                const [chapterResponse, novelResponse, chaptersResponse] = await Promise.all([
                    getChapterContentService(novelId, chapterNumber),
                    getNovelByIdService(novelId),
                    getChaptersByNovelService(novelId)
                ])
                // Xử lý chapter data
                const chapterData = chapterResponse as unknown as Chapter
                if (chapterData && chapterData._id) {
                    setChapter(chapterData)
                }
                
                // Xử lý novel data
                const novelData = novelResponse as unknown as Novel
                if (novelData && novelData._id) {
                    setNovel(novelData)
                }
                
                // Xử lý chapters list
                const chaptersData = chaptersResponse as unknown as ChapterInfo[]
                if (Array.isArray(chaptersData)) {
                    setChapters(chaptersData)
                } else {
                    setChapters([])
                }
            } catch (error) {
                console.error("Error fetching chapter:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [novelId, chapterNumber])

    // Theme colors - màu dịu mắt
    const themeStyles = {
        light: {
            bg: 'bg-stone-50',
            contentBg: 'bg-white',
            text: 'text-stone-800',
            border: 'border-stone-200',
            header: 'bg-white/95'
        },
        sepia: {
            bg: 'bg-[#f4f1ea]',
            contentBg: 'bg-[#faf8f3]',
            text: 'text-[#5f4b32]',
            border: 'border-[#e8dcc8]',
            header: 'bg-[#faf8f3]/95'
        },
        dark: {
            bg: 'bg-[#1a1a1a]',
            contentBg: 'bg-[#2d2d2d]',
            text: 'text-[#e0e0e0]',
            border: 'border-[#404040]',
            header: 'bg-[#2d2d2d]/95'
        }
    }

    const currentTheme = themeStyles[readingTheme]

    const hasPrevChapter = chapterNumber > 1
    const hasNextChapter = chapters.length > 0 && chapterNumber < Math.max(...chapters.map(c => c.chapterNumber))

    const goToPrevChapter = () => {
        if (hasPrevChapter) {
            router.push(`/novel/${novelId}/chapter/${chapterNumber - 1}`)
        }
    }

    const goToNextChapter = () => {
        if (hasNextChapter) {
            router.push(`/novel/${novelId}/chapter/${chapterNumber + 1}`)
        }
    }
    if (loading) {
        return (
            <div className={`min-h-screen ${currentTheme.bg}`}>
                <div className="container max-w-4xl mx-auto px-4 py-8">
                    <Skeleton className="h-8 w-3/4 mb-4" />
                    <Skeleton className="h-6 w-1/4 mb-8" />
                    <div className="space-y-4">
                        {[...Array(10)].map((_, i) => (
                            <Skeleton key={i} className="h-4 w-full" />
                        ))}
                    </div>
                </div>
            </div>
        )
    }
    if (!chapter) {
        return (
            <div className={`min-h-screen ${currentTheme.bg}`}>
                <div className="container max-w-4xl mx-auto px-4 py-8">
                    <Card className={`p-8 text-center ${currentTheme.contentBg}`}>
                        <BookOpen className="h-16 w-16 mx-auto opacity-30 mb-4" />
                        <h2 className={`text-xl font-bold mb-2 ${currentTheme.text}`}>Không tìm thấy chương</h2>
                        <p className="opacity-60 mb-4">Chương này không tồn tại hoặc đã bị xóa</p>
                        <Button onClick={() => router.push(`/novel/${novelId}`)}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại truyện
                        </Button>
                    </Card>
                </div>
            </div>
        )
    }
    
    return (
        <div className={cn(
            "min-h-screen transition-all duration-300", 
            currentTheme.bg
        )}>
            {/* Fixed Header */}
            <header className={`sticky top-0 z-50 backdrop-blur border-b transition-colors ${currentTheme.header} ${currentTheme.border}`}>
                <div className="container max-w-4xl mx-auto px-4">
                    <div className="flex items-center justify-between h-14">
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" asChild>
                                <Link href={`/novel/${novelId}`}>
                                    <ArrowLeft className="h-4 w-4" />
                                </Link>
                            </Button>
                            <div className="hidden sm:block">
                                <p className="text-sm font-medium truncate max-w-[200px]">
                                    {novel?.title}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Theme Selector */}
                            <div className="flex items-center gap-1 mr-2 p-1 rounded-lg bg-muted/30">
                                <button
                                    onClick={() => updateTheme('light')}
                                    className={cn(
                                        "p-2 rounded transition-all",
                                        readingTheme === 'light' 
                                            ? 'bg-white shadow-sm text-stone-800' 
                                            : 'hover:bg-white/50 text-stone-600 hover:text-stone-800'
                                    )}
                                    title="Sáng"
                                >
                                    <Sun className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => updateTheme('sepia')}
                                    className={cn(
                                        "p-2 rounded transition-all",
                                        readingTheme === 'sepia' 
                                            ? 'bg-[#faf8f3] shadow-sm text-[#5f4b32]' 
                                            : 'hover:bg-[#faf8f3]/50 text-stone-600 hover:text-[#5f4b32]'
                                    )}
                                    title="Sepia"
                                >
                                    <BookOpen className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={() => updateTheme('dark')}
                                    className={cn(
                                        "p-2 rounded transition-all",
                                        readingTheme === 'dark' 
                                            ? 'bg-[#2d2d2d] shadow-sm text-stone-300' 
                                            : 'hover:bg-[#2d2d2d]/50 text-stone-600 hover:text-stone-300'
                                    )}
                                    title="Tối"
                                >
                                    <Moon className="h-4 w-4" />
                                </button>
                            </div>

                            {/* Chapter List Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <List className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-72 max-h-96 overflow-y-auto">
                                    <DropdownMenuLabel>Danh sách chương</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {chapters.map((ch) => (
                                        <DropdownMenuItem
                                            key={ch._id}
                                            className={ch.chapterNumber === chapterNumber ? "bg-accent" : ""}
                                            onClick={() => router.push(`/novel/${novelId}/chapter/${ch.chapterNumber}`)}
                                        >
                                            Chương {ch.chapterNumber}: {ch.title}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            {/* Settings Dropdown */}
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuLabel>Cài đặt đọc</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <div className="p-2 space-y-4">
                                        {/* Font Size */}
                                        <div>
                                            <label className="text-sm font-medium">Cỡ chữ: {fontSize}px</label>
                                            <input
                                                type="range"
                                                min="14"
                                                max="28"
                                                value={fontSize}
                                                onChange={(e) => setFontSize(Number(e.target.value))}
                                                className="w-full mt-1"
                                            />
                                        </div>
                                        {/* Line Height */}
                                        <div>
                                            <label className="text-sm font-medium">Khoảng cách dòng: {lineHeight}</label>
                                            <input
                                                type="range"
                                                min="1.2"
                                                max="2.5"
                                                step="0.1"
                                                value={lineHeight}
                                                onChange={(e) => setLineHeight(Number(e.target.value))}
                                                className="w-full mt-1"
                                            />
                                        </div>
                                        {/* Font Family */}
                                        <div>
                                            <label className="text-sm font-medium">Font chữ</label>
                                            <select
                                                value={fontFamily}
                                                onChange={(e) => setFontFamily(e.target.value)}
                                                className="w-full mt-1 p-2 rounded border bg-background"
                                            >
                                                <option value="serif">Serif</option>
                                                <option value="sans-serif">Sans-serif</option>
                                                <option value="monospace">Monospace</option>
                                            </select>
                                        </div>
                                    </div>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <Button variant="ghost" size="icon" asChild>
                                <Link href="/">
                                    <Home className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Chapter Content */}
            <main className={cn(
                "container max-w-4xl mx-auto px-4 py-8 transition-all duration-300",
                // Add right padding on desktop if audio exists
                chapter.audioUrl && "lg:pr-[320px] lg:max-w-[none]" 
            )}>
                <div className={cn(
                    "rounded-2xl p-8 shadow-sm transition-colors border max-w-4xl mx-auto", // Keep content centered within available space
                    currentTheme.contentBg, 
                    currentTheme.border
                )}>
                    {/* Chapter Title */}
                    <div className="text-center mb-8 pb-6 border-b border-current/10">
                        <h1 className={`text-2xl sm:text-3xl font-bold mb-3 ${currentTheme.text}`}>
                            Chương {chapter.chapterNumber}: {chapter.title}
                        </h1>
                        <p className="text-sm opacity-60">
                            {chapter.wordCount?.toLocaleString() || 0} từ • {chapter.views?.toLocaleString() || 0} lượt xem
                        </p>
                    </div>

                    {/* Content */}
                    <article 
                        className={`prose prose-lg max-w-none transition-all ${currentTheme.text}`}
                        style={{
                            fontSize: `${fontSize}px`,
                            lineHeight: lineHeight,
                            fontFamily: fontFamily,
                            color: readingTheme === 'light' ? '#1c1917' : readingTheme === 'sepia' ? '#5f4b32' : '#e0e0e0'
                        }}
                        dangerouslySetInnerHTML={{ __html: chapter.content }}
                    />
                </div>

                {/* Navigation */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mt-8">
                    <Button
                        variant="outline"
                        disabled={!hasPrevChapter}
                        onClick={goToPrevChapter}
                        className="w-full sm:w-auto"
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Chương trước
                    </Button>

                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <Link href={`/novel/${novelId}`}>
                            <List className="h-4 w-4 mr-2" />
                            Mục lục
                        </Link>
                    </Button>

                    <Button
                        variant="outline"
                        disabled={!hasNextChapter}
                        onClick={goToNextChapter}
                        className="w-full sm:w-auto"
                    >
                        Chương sau
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </main>


            {/* Audio Toggle FAB - Mobile Only */}
            {chapter.audioUrl && (
                <Button
                    onClick={() => setIsSidebarOpen(true)}
                    className="fixed bottom-8 right-6 h-12 w-12 rounded-full shadow-xl z-40 bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-95 lg:hidden"
                    size="icon"
                >
                    <Headphones className="w-5 h-5" />
                </Button>
            )}

            {/* Audio Sidebar */}
            {chapter.audioUrl && (
                <AudioSidebar
                    isOpen={isSidebarOpen}
                    onClose={() => setIsSidebarOpen(false)}
                    audioUrl={chapter.audioUrl}
                    title={`Chương ${chapter.chapterNumber}: ${chapter.title}`}
                    novelTitle={novel?.title}
                    coverUrl={novel?.coverImage}
                    onNext={goToNextChapter}
                    onPrev={goToPrevChapter}
                    hasNext={hasNextChapter}
                    hasPrev={hasPrevChapter}
                    autoNext={autoNext}
                    onAutoNextChange={setAutoNext}
                    isDark={readingTheme === 'dark'}
                />
            )}
        </div>
    )
}
