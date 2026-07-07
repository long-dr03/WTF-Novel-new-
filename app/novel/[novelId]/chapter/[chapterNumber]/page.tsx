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
    Moon,
    Flag,
    ArrowDown,
    Play,
    Pause,
    Plus,
    Minus,
    X
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getChapterContentService, getChaptersByNovelService, getNovelByIdService, addToLibraryService, createReportService } from "@/services/novelService"
import { useAudioPlayer } from "@/components/providers/AudioPlayerContext"
import { CommentSection } from "@/components/CommentSection"
import { Headphones } from "lucide-react"
import { useAuth } from "@/components/providers/AuthProvider"
import { useNovelAd } from "@/components/providers/NovelAdProvider"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { InlineAd } from "@/components/ads/InlineAd"
import { useTheme } from "next-themes"
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider"

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
    publishedAt?: string
    createdAt?: string
}

interface Novel {
    _id: string
    title: string
    image?: string
    coverImage?: string
    adLink?: string
    adImage?: string
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
    const { setNovelAd } = useNovelAd()
    const novelId = params.novelId as string
    const chapterNumber = parseInt(params.chapterNumber as string)

    const [chapter, setChapter] = useState<Chapter | null>(null)
    const [novel, setNovel] = useState<Novel | null>(null)
    const [chapters, setChapters] = useState<ChapterInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [fontSize, setFontSize] = useState(18)
    const [lineHeight, setLineHeight] = useState(1.8)
    const [fontFamily, setFontFamily] = useState("serif")
    const { theme: globalTheme, setTheme: setGlobalTheme } = useTheme()
    const [readingTheme, setReadingTheme] = useState<'light' | 'sepia' | 'dark'>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem('reading-theme') as 'light' | 'sepia' | 'dark'
            return saved || 'light'
        }
        return 'light'
    })
    const [isAdUnlocked, setIsAdUnlocked] = useState(() => {
        if (typeof window !== "undefined") {
            return sessionStorage.getItem(`ad-unlocked-${novelId}-${chapterNumber}`) === "true"
        }
        return false
    })
    const player = useAudioPlayer()
    const { ads, popup } = useSiteSettings()

    // Quảng cáo riêng của truyện -> SideAds dùng link/ảnh này khi đang đọc
    useEffect(() => {
        if (novel) setNovelAd({ adImage: (novel as any).adImage, adLink: (novel as any).adLink })
        return () => setNovelAd(null)
    }, [novel]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (typeof window !== "undefined") {
            const unlocked = sessionStorage.getItem(`ad-unlocked-${novelId}-${chapterNumber}`) === "true"
            setIsAdUnlocked(unlocked)
        }
    }, [novelId, chapterNumber])
    useEffect(() => {
        if (user && chapter && chapter._id && novel && novel._id) {
             addToLibraryService(novel._id, 'history', chapter._id).catch(err => console.error("Failed to save history", err))
        }
    }, [user, chapter, novel])
    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem('reading-theme') as 'light' | 'sepia' | 'dark'
            if (saved) {
                setReadingTheme(saved)
                setGlobalTheme(saved === 'dark' ? 'dark' : 'light')
            } else {
                setGlobalTheme('light')
            }
        }
    }, [setGlobalTheme])

    const updateTheme = (theme: 'light' | 'sepia' | 'dark') => {
        setReadingTheme(theme)
        if (typeof window !== "undefined") {
            localStorage.setItem('reading-theme', theme)
        }
        if (theme === 'dark') {
            setGlobalTheme('dark')
        } else {
            setGlobalTheme('light')
        }
    }

    // Auto Scroll State
    const [autoScrollSpeed, setAutoScrollSpeed] = useState<number>(0) // 0 is stopped, 1-10 speed
    const [isScrollPanelOpen, setIsScrollPanelOpen] = useState(false)

    // Report State
    const [reportReason, setReportReason] = useState("Lỗi chính tả")
    const [reportDescription, setReportDescription] = useState("")
    const [isReportOpen, setIsReportOpen] = useState(false)
    const [reportLoading, setReportLoading] = useState(false)

    const handleReportSubmit = async () => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để gửi báo cáo")
            return
        }
        if (!reportDescription.trim()) {
            toast.error("Vui lòng nhập mô tả chi tiết lỗi/vi phạm")
            return
        }
        setReportLoading(true)
        try {
            const res = await createReportService(novel?._id || novelId, chapter?._id, reportReason, reportDescription)
            if (res) {
                toast.success("Báo cáo lỗi chương đã được gửi thành công")
                setIsReportOpen(false)
                setReportDescription("")
            } else {
                toast.error("Không thể gửi báo cáo")
            }
        } catch (e) {
            toast.error("Có lỗi xảy ra khi gửi báo cáo")
        } finally {
            setReportLoading(false)
        }
    }

    // Auto Scroll Logic
    useEffect(() => {
        if (autoScrollSpeed === 0) return;
        
        let lastTime = performance.now();
        let frameId: number;
        
        const scroll = (time: number) => {
            const delta = time - lastTime;
            lastTime = time;
            
            // Speed formula: speed * factor (e.g. 0.03 pixels per millisecond)
            const pixelsToScroll = autoScrollSpeed * 0.03 * delta;
            window.scrollBy(0, pixelsToScroll);
            
            // Stop if we hit the bottom of the page
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
                setAutoScrollSpeed(0);
                return;
            }
            
            frameId = requestAnimationFrame(scroll);
        };
        
        frameId = requestAnimationFrame(scroll);
        return () => cancelAnimationFrame(frameId);
    }, [autoScrollSpeed]);

    // Pause Auto Scroll on user interactions
    useEffect(() => {
        if (autoScrollSpeed === 0) return;
        
        const handleUserInteraction = () => {
            setAutoScrollSpeed(0);
        };
        
        window.addEventListener('wheel', handleUserInteraction, { passive: true });
        window.addEventListener('touchmove', handleUserInteraction, { passive: true });
        window.addEventListener('keydown', handleUserInteraction, { passive: true });
        
        return () => {
            window.removeEventListener('wheel', handleUserInteraction);
            window.removeEventListener('touchmove', handleUserInteraction);
            window.removeEventListener('keydown', handleUserInteraction);
        };
    }, [autoScrollSpeed]);
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
    const globalAdLink = ads?.left?.link || ads?.right?.link || popup?.link
    const isGlobalAdEnabled = ads?.enabled
    const adLink = novel?.adLink || (isGlobalAdEnabled ? (globalAdLink || "https://s.shopee.vn/5L5nAgyTop") : "")
    const isActuallyUnlocked = isAdUnlocked || !adLink

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

    const handlePlayAudio = () => {
        if (!isActuallyUnlocked) {
            toast.error("Vui lòng mở khóa chương truyện để nghe audio")
            return
        }
        if (!chapter?.audioUrl) {
            toast.error("Chương này chưa có giọng đọc")
            return
        }
        player.loadAudio(chapter.audioUrl, {
            title: `Chương ${chapter.chapterNumber}: ${chapter.title}`,
            novelTitle: novel?.title || "",
            novelId: novelId,
            chapterNumber: chapter.chapterNumber,
            hasNext: hasNextChapter,
            hasPrev: hasPrevChapter,
            isLocked: false
        })
    }

    const handleAdClick = () => {
        setIsAdUnlocked(true)
        if (typeof window !== "undefined") {
            sessionStorage.setItem(`ad-unlocked-${novelId}-${chapterNumber}`, "true")
        }
    }

    // Sync active player with new chapter data on navigation
    useEffect(() => {
        if (chapter && player.audioUrl) {
            player.loadAudio(isActuallyUnlocked ? (chapter.audioUrl || null) : null, {
                title: `Chương ${chapter.chapterNumber}: ${chapter.title}`,
                novelTitle: novel?.title || "",
                novelId: novelId,
                chapterNumber: chapter.chapterNumber,
                hasNext: hasNextChapter,
                hasPrev: hasPrevChapter,
                isLocked: !isActuallyUnlocked
            })
        }
    }, [chapterNumber, isActuallyUnlocked, chapter, novel, hasNextChapter, hasPrevChapter])

    // Ngăn chặn copy, select, right click, F12, inspect element và xem HTML
    useEffect(() => {
        const handleContextMenu = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return true
            }
            e.preventDefault()
            toast.error("Nội dung truyện đã được bảo vệ bản quyền!")
            return false
        }

        const handleCopy = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return true
            }
            e.preventDefault()
            toast.error("Vui lòng không sao chép nội dung truyện!")
            return false
        }

        const handleCut = (e: ClipboardEvent) => {
            const target = e.target as HTMLElement
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return true
            }
            e.preventDefault()
            return false
        }

        const handleSelectStart = (e: Event) => {
            const target = e.target as HTMLElement
            if (
                target.tagName === "INPUT" ||
                target.tagName === "TEXTAREA" ||
                target.isContentEditable
            ) {
                return true
            }
            e.preventDefault()
            return false
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            // F12
            if (e.key === "F12" || e.keyCode === 123) {
                e.preventDefault()
                toast.error("Chức năng này đã bị khóa!")
                return false
            }
            // Ctrl+Shift+I / J / C (DevTools shortcuts)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67 || e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) {
                e.preventDefault()
                toast.error("Chức năng này đã bị khóa!")
                return false
            }
            // Ctrl+U (View source)
            if ((e.ctrlKey || e.metaKey) && (e.keyCode === 85 || e.key === "U" || e.key === "u")) {
                e.preventDefault()
                toast.error("Chức năng này đã bị khóa!")
                return false
            }
            // Ctrl+S (Save page)
            if ((e.ctrlKey || e.metaKey) && (e.keyCode === 83 || e.key === "S" || e.key === "s")) {
                e.preventDefault()
                toast.error("Chức năng này đã bị khóa!")
                return false
            }
            // Ctrl+P (Print)
            if ((e.ctrlKey || e.metaKey) && (e.keyCode === 80 || e.key === "P" || e.key === "p")) {
                e.preventDefault()
                toast.error("Chức năng này đã bị khóa!")
                return false
            }
            // Ctrl+C (Copy)
            if ((e.ctrlKey || e.metaKey) && (e.keyCode === 67 || e.key === "C" || e.key === "c")) {
                const target = e.target as HTMLElement
                if (
                    target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable
                ) {
                    return true
                }
                e.preventDefault()
                toast.error("Vui lòng không sao chép nội dung truyện!")
                return false
            }
            // Ctrl+X (Cut)
            if ((e.ctrlKey || e.metaKey) && (e.keyCode === 88 || e.key === "X" || e.key === "x")) {
                const target = e.target as HTMLElement
                if (
                    target.tagName === "INPUT" ||
                    target.tagName === "TEXTAREA" ||
                    target.isContentEditable
                ) {
                    return true
                }
                e.preventDefault()
                return false
            }
        }

        // Đăng ký sự kiện
        document.addEventListener("contextmenu", handleContextMenu)
        document.addEventListener("copy", handleCopy)
        document.addEventListener("cut", handleCut)
        document.addEventListener("selectstart", handleSelectStart)
        window.addEventListener("keydown", handleKeyDown, true)

        // Debugger loop để gây khó khăn cho việc dùng DevTools xem cấu trúc HTML
        let intervalId: ReturnType<typeof setInterval>
        const devtoolsProtection = () => {
            try {
                const check = function() {
                    const start = new Date().getTime();
                    debugger;
                    const end = new Date().getTime();
                    if (end - start > 100) {
                        // DevTools đang mở
                    }
                }
                check();
            } catch (err) {}
        }
        
        devtoolsProtection()
        intervalId = setInterval(devtoolsProtection, 1000)

        return () => {
            document.removeEventListener("contextmenu", handleContextMenu)
            document.removeEventListener("copy", handleCopy)
            document.removeEventListener("cut", handleCut)
            document.removeEventListener("selectstart", handleSelectStart)
            window.removeEventListener("keydown", handleKeyDown, true)
            if (intervalId) clearInterval(intervalId)
        }
    }, [])

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
            <header className={cn(
                "sticky top-0 z-40 backdrop-blur border-b transition-all duration-300 w-full lg:pr-[280px]",
                currentTheme.header,
                currentTheme.border,
                currentTheme.text
            )}>
                <div className="max-w-4xl mx-auto px-4">
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

                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Theme Selector */}
                            <div className="hidden md:flex items-center gap-1 mr-2 p-1 rounded-lg bg-muted/30">
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
                            <DropdownMenu modal={false}>
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
                            <DropdownMenu modal={false}>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon">
                                        <Settings className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                    <DropdownMenuLabel>Cài đặt đọc</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <div className="p-2 space-y-4">
                                        {/* Mobile Theme Selector */}
                                        <div className="block md:hidden">
                                            <label className="text-xs font-semibold opacity-70 mb-1.5 block">Giao diện</label>
                                            <div className="grid grid-cols-3 gap-1 p-0.5 rounded-md bg-muted/40">
                                                <button
                                                    onClick={() => updateTheme('light')}
                                                    className={cn(
                                                        "py-1 rounded text-[10px] font-medium transition-all",
                                                        readingTheme === 'light' 
                                                            ? 'bg-white shadow-sm text-stone-850 font-bold' 
                                                            : 'text-stone-600 hover:text-stone-850'
                                                    )}
                                                >
                                                    Sáng
                                                </button>
                                                <button
                                                    onClick={() => updateTheme('sepia')}
                                                    className={cn(
                                                        "py-1 rounded text-[10px] font-medium transition-all",
                                                        readingTheme === 'sepia' 
                                                            ? 'bg-[#faf8f3] shadow-sm text-[#5f4b32] font-bold' 
                                                            : 'text-[#8c7457] hover:text-[#5f4b32]'
                                                    )}
                                                >
                                                    Sepia
                                                </button>
                                                <button
                                                    onClick={() => updateTheme('dark')}
                                                    className={cn(
                                                        "py-1 rounded text-[10px] font-medium transition-all",
                                                        readingTheme === 'dark' 
                                                            ? 'bg-[#2d2d2d] shadow-sm text-stone-300 font-bold' 
                                                            : 'text-stone-550 hover:text-stone-300'
                                                    )}
                                                >
                                                    Tối
                                                </button>
                                            </div>
                                        </div>
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

                            {/* Report Chapter Button */}
                            {(novel as any)?.reportsEnabled !== false && (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                onClick={() => setIsReportOpen(true)}
                                title="Báo lỗi chương"
                            >
                                <Flag className="h-4 w-4" />
                            </Button>
                            )}

                            {/* Audio Player Toggle Button */}
                            <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={handlePlayAudio}
                                className={cn(
                                    "transition-colors",
                                    player.audioUrl === chapter?.audioUrl && player.isPlaying && "text-primary animate-pulse"
                                )}
                                title="Trình phát nhạc / giọng đọc"
                            >
                                <Headphones className="h-4 w-4" />
                            </Button>

                            <Button variant="ghost" size="icon" asChild>
                                <Link href="/">
                                    <Home className="h-4 w-4" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className={cn(
                "w-full px-4 pt-8 pb-8 transition-all duration-300",
                player.audioUrl && "pb-[96px]"
            )}>
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className={cn(
                        "rounded-2xl p-4 sm:p-8 shadow-sm transition-colors border",
                        currentTheme.contentBg, 
                        currentTheme.border,
                        currentTheme.text
                    )}>
                    {/* Chapter Title */}
                    <div className="text-center mb-8 pb-6 border-b border-current/10 select-none">
                        <h1 className={`text-2xl sm:text-3xl font-bold mb-3 ${currentTheme.text}`}>
                            Chương {chapter.chapterNumber}: {chapter.title}
                        </h1>
                        <p className="text-sm opacity-60">
                            {chapter.wordCount?.toLocaleString() || 0} từ • {chapter.views?.toLocaleString() || 0} lượt xem
                        </p>
                    </div>

                    {/* Content */}
                    {!isActuallyUnlocked ? (
                        <div className="flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed border-primary/40 rounded-xl bg-primary/5 my-6 text-center">
                            <p className="text-sm font-medium opacity-80 mb-2">
                                Mời Quý độc giả <span className="font-bold text-primary">CLICK vào ẢNH</span> bên dưới
                            </p>
                            <p className="text-sm sm:text-base font-bold text-primary mb-6 uppercase tracking-wider animate-pulse">
                                MỞ ỨNG DỤNG SHOPEE, sau đó quay trở lại để tiếp tục đọc toàn bộ chương truyện!
                            </p>

                            <a 
                                href={adLink}
                                target="_blank"
                                rel="nofollow sponsored noopener noreferrer"
                                onClick={handleAdClick}
                                className="group relative block w-full max-w-sm rounded-2xl bg-gradient-to-br from-pink-400 via-primary to-rose-600 p-1 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                
                                <div className="flex w-full flex-col items-center justify-center rounded-xl bg-white p-5 sm:p-6 text-center shadow-inner relative min-h-[210px] sm:min-h-[240px]">
                                    <span className="text-primary text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-1">ẤN VÀO ĐÂY</span>
                                    <span className="text-slate-900 text-lg sm:text-xl font-extrabold uppercase leading-tight mb-2">
                                        ĐỂ ĐỌC TOÀN BỘ<br />CHƯƠNG TRUYỆN
                                    </span>
                                    <div className="w-12 h-0.5 bg-pink-200 my-1" />
                                    <span className="text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-wide font-medium mt-1">
                                        HÀNH ĐỘNG NÀY CHỈ THỰC HIỆN MỘT LẦN.
                                    </span>
                                    <span className="text-slate-500 text-[9px] sm:text-[10px] uppercase tracking-wide font-medium">
                                        MONG QUÝ ĐỘC GIẢ ỦNG HỘ.
                                    </span>

                                    <div className="absolute bottom-2 right-4 transform group-hover:scale-110 transition-transform duration-300">
                                        <svg className="w-6 h-6 sm:w-8 sm:h-8 text-primary drop-shadow-md fill-current" viewBox="0 0 24 24">
                                            <path d="M12 2a1 1 0 0 1 .993.883L13 3v4.618l.824-.275a2.03 2.03 0 0 1 2.457 1.058l.123.275 1.5 5a2 2 0 0 1-.36 1.831l-.14.169-3.5 3.5a1 1 0 0 1-.607.284L13.7 19.5h-5.2a3 3 0 0 1-2.993-2.824L5.5 16.5v-6a2 2 0 0 1 1.85-1.995L7.5 8.5h2v-3.5a3 3 0 0 1 5.824-.883L15 4.5l.001 2.382a2 2 0 0 1-.502 1.29l-.117.118-2.382 2.382v-6.672a1 1 0 0 1 .883-.993L12 2zm1 11v-1.586l-2.707 2.707a1 1 0 0 1-1.32.083l-.094-.083a1 1 0 0 1 0-1.414L12.586 10H11v-1.5h2a2.5 2.5 0 0 0 2.492-2.336L15.5 6V4.5a1.5 1.5 0 0 0-2.993-.145L12.5 4.5V13h.5zm-5-3h-1.5a.5.5 0 0 0-.492.41L7 10.5v6c0 .773.57 1.414 1.318 1.493L8.5 18H13c.277 0 .543-.112.738-.31l.09-.1.97-.97-2.298-2.299v-2.321h-.5a1 1 0 0 1-.993-.883L11 11V9.5H8v1z" />
                                        </svg>
                                    </div>
                                </div>
                            </a>
                            
                            <p className="text-xs mt-6 font-medium opacity-60">
                                gocaudio và đội ngũ Editor xin chân thành cảm ơn!
                            </p>
                        </div>
                    ) : (
                        <article 
                            className={`prose prose-lg max-w-none transition-all select-none ${currentTheme.text}`}
                            style={{
                                fontSize: `${fontSize}px`,
                                lineHeight: lineHeight,
                                fontFamily: fontFamily,
                                color: readingTheme === 'light' ? '#1c1917' : readingTheme === 'sepia' ? '#5f4b32' : '#e0e0e0'
                            }}
                            dangerouslySetInnerHTML={{ __html: chapter.content }}
                        />
                    )}
                </div>

                {/* Quảng cáo tài trợ */}
                <div>
                    <InlineAd />
                </div>

                {/* Navigation */}
                <div className="flex flex-col sm:flex-row justify-center items-center gap-3 sm:gap-4 mt-8">
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

                {/* Comment Section */}
                {(novel as any)?.commentsEnabled !== false && (
                <div>
                     <CommentSection theme={readingTheme} novelId={novelId} chapterId={chapter._id} />
                </div>
                )}
            </div>
        </main>



            {/* Auto-Scroll Float Panel */}
            <div className="fixed bottom-24 right-6 z-45 flex flex-col items-end gap-3 select-none">
                {isScrollPanelOpen && (
                    <div className={cn(
                        "rounded-full p-2 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 border text-xs font-semibold backdrop-blur-md",
                        readingTheme === 'light'
                            ? "bg-white/95 border-stone-200 text-stone-850"
                            : readingTheme === 'sepia'
                                ? "bg-[#faf8f3]/95 border-[#e8dcc8] text-[#5f4b32]"
                                : "bg-[#2d2d2d]/95 border-[#404040] text-stone-300"
                    )}>
                        {/* Play/Pause Button */}
                        <Button
                            size="icon"
                            variant="ghost"
                            className={cn(
                                "h-8 w-8 rounded-full transition-all active:scale-90 cursor-pointer",
                                autoScrollSpeed > 0 
                                    ? "bg-primary/10 text-primary hover:bg-primary/20" 
                                    : readingTheme === 'light'
                                        ? "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                                        : readingTheme === 'sepia'
                                            ? "text-[#5f4b32] hover:bg-[#e8dcc8]/50 hover:text-[#5f4b32]"
                                            : "text-stone-300 hover:bg-stone-800 hover:text-white"
                            )}
                            onClick={() => {
                                if (autoScrollSpeed > 0) {
                                    setAutoScrollSpeed(0);
                                } else {
                                    setAutoScrollSpeed(4); // Default speed
                                }
                            }}
                            title={autoScrollSpeed > 0 ? "Tạm dừng cuộn" : "Bắt đầu cuộn"}
                        >
                            {autoScrollSpeed > 0 ? (
                                <Pause className="h-4 w-4" />
                            ) : (
                                <Play className="h-4 w-4 fill-current" />
                            )}
                        </Button>

                        <div className={cn("h-4 w-[1px]", readingTheme === 'light' ? "bg-stone-200" : readingTheme === 'sepia' ? "bg-[#e8dcc8]" : "bg-zinc-800")} />

                        {/* Speed Adjuster */}
                        <div className="flex items-center gap-2">
                            <Button
                                size="icon"
                                variant="ghost"
                                className={cn(
                                    "h-7 w-7 rounded-full transition-all active:scale-90 cursor-pointer",
                                    readingTheme === 'light'
                                        ? "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                                        : readingTheme === 'sepia'
                                            ? "text-[#5f4b32] hover:bg-[#e8dcc8]/50 hover:text-[#5f4b32]"
                                            : "text-stone-300 hover:bg-stone-800 hover:text-white"
                                )}
                                disabled={autoScrollSpeed <= 0}
                                onClick={() => setAutoScrollSpeed(prev => Math.max(1, prev - 1))}
                            >
                                <Minus className="h-3.5 w-3.5" />
                            </Button>
                            
                            <span className="text-xs font-bold font-mono min-w-[50px] text-center">
                                V{autoScrollSpeed}
                            </span>

                            <Button
                                size="icon"
                                variant="ghost"
                                className={cn(
                                    "h-7 w-7 rounded-full transition-all active:scale-90 cursor-pointer",
                                    readingTheme === 'light'
                                        ? "text-stone-700 hover:bg-stone-100 hover:text-stone-900"
                                        : readingTheme === 'sepia'
                                            ? "text-[#5f4b32] hover:bg-[#e8dcc8]/50 hover:text-[#5f4b32]"
                                            : "text-stone-300 hover:bg-stone-800 hover:text-white"
                                )}
                                disabled={autoScrollSpeed >= 10}
                                onClick={() => setAutoScrollSpeed(prev => {
                                    if (prev === 0) return 4;
                                    return Math.min(10, prev + 1);
                                })}
                            >
                                <Plus className="h-3.5 w-3.5" />
                            </Button>
                        </div>

                        <div className={cn("h-4 w-[1px]", readingTheme === 'light' ? "bg-stone-200" : readingTheme === 'sepia' ? "bg-[#e8dcc8]" : "bg-zinc-800")} />

                        {/* Close button (stops scroll and closes panel) */}
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-full text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all active:scale-90 cursor-pointer"
                            onClick={() => {
                                setAutoScrollSpeed(0);
                                setIsScrollPanelOpen(false);
                            }}
                            title="Tắt cuộn tự động"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                )}
                <Button
                    onClick={() => setIsScrollPanelOpen(!isScrollPanelOpen)}
                    className={cn(
                        "h-12 w-12 rounded-full shadow-xl transition-all active:scale-95 cursor-pointer z-50",
                        readingTheme === 'light'
                            ? "bg-white border border-stone-200 text-stone-800 hover:bg-stone-100"
                            : readingTheme === 'sepia'
                                ? "bg-[#faf8f3] border border-[#e8dcc8] text-[#5f4b32] hover:bg-[#e8dcc8]/30"
                                : "bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800",
                        autoScrollSpeed > 0 && "animate-pulse border-primary text-primary"
                    )}
                    size="icon"
                    title="Tự động cuộn"
                >
                    <ArrowDown className={cn("w-5 h-5 transition-transform duration-300", autoScrollSpeed > 0 && "animate-bounce")} />
                </Button>
            </div>

            {/* Report Dialog Modal */}
            <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Flag className="h-5 w-5 text-red-500" />
                            Báo lỗi chương
                        </DialogTitle>
                        <DialogDescription>
                            Giúp tác giả sửa lỗi dịch thuật, lỗi chính tả hoặc lỗi hiển thị của chương này.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Lỗi gặp phải</label>
                            <Select value={reportReason} onValueChange={setReportReason}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn lỗi" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Lỗi chính tả">Lỗi chính tả / Lặp từ</SelectItem>
                                    <SelectItem value="Lỗi dịch thuật">Lỗi dịch thuật / Khó hiểu</SelectItem>
                                    <SelectItem value="Lỗi hiển thị / Định dạng">Lỗi hiển thị / Định dạng</SelectItem>
                                    <SelectItem value="Chương trống / Trùng chương">Chương trống / Trùng chương</SelectItem>
                                    <SelectItem value="Khác">Lý do khác</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mô tả chi tiết</label>
                            <Textarea 
                                placeholder="Hãy mô tả chi tiết lỗi để tác giả dễ dàng sửa đổi..." 
                                value={reportDescription}
                                onChange={(e) => setReportDescription(e.target.value)}
                                className="min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsReportOpen(false)} disabled={reportLoading}>Hủy</Button>
                        <Button onClick={handleReportSubmit} disabled={reportLoading} className="bg-red-600 hover:bg-red-700 text-white">
                            {reportLoading ? "Đang gửi..." : "Gửi báo cáo"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* SEO JSON-LD Article/BlogPosting Schema Markup */}
            {chapter && novel && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "BlogPosting",
                            "headline": `Chương ${chapter.chapterNumber}: ${chapter.title} - ${novel.title}`,
                            "description": `Đọc truyện ${novel.title} chương ${chapter.chapterNumber} bản dịch mới nhất, mượt mà nhất.`,
                            "articleBody": chapter.content.replace(/<[^>]*>/g, '').substring(0, 150),
                            "wordCount": chapter.wordCount,
                            "datePublished": chapter.publishedAt || chapter.createdAt || new Date().toISOString(),
                            "author": {
                                "@type": "Person",
                                "name": "gocaudio"
                            },
                            "publisher": {
                                "@type": "Organization",
                                "name": "gocaudio",
                                "logo": {
                                    "@type": "ImageObject",
                                    "url": "/favicon.ico"
                                }
                            },
                            "isPartOf": {
                                "@type": "Book",
                                "name": novel.title,
                                "url": `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/novel/${novelId}`
                            }
                        })
                    }}
                />
            )}
        </div>
    )
}
