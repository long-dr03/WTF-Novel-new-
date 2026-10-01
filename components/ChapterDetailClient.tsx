"use client"

import { useState, useEffect, useRef, type CSSProperties } from "react"
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
    X,
    Headphones
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getChapterContentService, getChapterPageService, getNovelByIdService, addToLibraryService, createReportService } from "@/services/novelService"
import { useAudioControls } from "@/components/providers/AudioPlayerContext"
import { CommentSection } from "@/components/CommentSection"
import { useAuth } from "@/components/providers/AuthProvider"
import { useNovelAd } from "@/components/providers/NovelAdProvider"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { InlineAd } from "@/components/ads/InlineAd"
import { useTheme } from "next-themes"
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider"
import axios from "@/setup/axios"

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
    navigation?: { previous: number | null; next: number | null }
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

export default function ChapterDetailClient({ initialChapter, initialNovel }: { initialChapter?: any; initialNovel?: any }) {
    const params = useParams()
    const router = useRouter()
    const { user, isLoading: authLoading } = useAuth()
    const { setNovelAd } = useNovelAd()
    const novelId = params.novelId as string
    const chapterNumber = parseInt(params.chapterNumber as string)

    const [chapter, setChapter] = useState<Chapter | null>(initialChapter || null)
    const [novel, setNovel] = useState<Novel | null>(initialNovel || null)
    const [chapterPage, setChapterPage] = useState(0)
    const [hasMoreChapters, setHasMoreChapters] = useState(true)
    const [loadingChapters, setLoadingChapters] = useState(false)
    const chapterScopeRef = useRef(novelId)
    chapterScopeRef.current = novelId
    const [chapters, setChapters] = useState<ChapterInfo[]>([])
    const [loading, setLoading] = useState(!initialChapter)
    const [fontSize, setFontSize] = useState(18)
    const [lineHeight, setLineHeight] = useState(1.8)
    const [fontFamily, setFontFamily] = useState("serif")

    const rootRef = useRef<HTMLDivElement>(null)
    const fontSizeLabelRef = useRef<HTMLSpanElement>(null)
    const lineHeightLabelRef = useRef<HTMLSpanElement>(null)
    const setReadingVar = (name: string, value: string) => {
        rootRef.current?.style.setProperty(name, value)
    }
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
    const player = useAudioControls()
    const { ads, popup } = useSiteSettings()

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
        if (!chapter?._id || authLoading) return;
        let sessionId = sessionStorage.getItem('read-session');
        if (!sessionId) {
            sessionId = crypto.randomUUID();
            sessionStorage.setItem('read-session', sessionId);
        }
        // The server deduplicates a chapter per reader per Vietnam calendar day.
        axios.post('/track/read', { chapterId: chapter._id, sessionId }).catch(() => {});
    }, [chapter?._id, user?.id, authLoading]);

    useEffect(() => {
        if (user && chapter && chapter._id && novel && novel._id) {
             addToLibraryService(novel._id, 'history', chapter._id).catch(err => console.error("Failed to save history", err))
        }
    }, [user?.id, chapter?._id, novel?._id])

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

    const [autoScrollSpeed, setAutoScrollSpeed] = useState<number>(0)
    const [isScrollPanelOpen, setIsScrollPanelOpen] = useState(false)

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

    useEffect(() => {
        if (autoScrollSpeed === 0) return;
        
        let lastTime = performance.now();
        let frameId: number;
        
        const scroll = (time: number) => {
            const delta = time - lastTime;
            lastTime = time;
            
            const pixelsToScroll = autoScrollSpeed * 0.03 * delta;
            window.scrollBy(0, pixelsToScroll);
            
            if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
                setAutoScrollSpeed(0);
                return;
            }
            
            frameId = requestAnimationFrame(scroll);
        };
        
        frameId = requestAnimationFrame(scroll);
        return () => cancelAnimationFrame(frameId);
    }, [autoScrollSpeed]);

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
                const [chapterResponse, novelResponse] = await Promise.all([
                    initialChapter ? Promise.resolve(initialChapter) : getChapterContentService(novelId, chapterNumber),
                    initialNovel ? Promise.resolve(initialNovel) : getNovelByIdService(novelId)
                ])
                const chapterData = chapterResponse as unknown as Chapter
                if (chapterData && chapterData._id) {
                    setChapter(chapterData)
                }
                
                const novelData = novelResponse as unknown as Novel
                if (novelData && novelData._id) {
                    setNovel(novelData)
                }
                
            } catch (error) {
                console.error("Error fetching chapter:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [novelId, chapterNumber, initialChapter, initialNovel])

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

    const previousChapter = chapter?.navigation?.previous ?? null
    const nextChapter = chapter?.navigation?.next ?? null
    const hasPrevChapter = previousChapter !== null
    const hasNextChapter = nextChapter !== null
    const goToPrevChapter = () => {
        if (previousChapter !== null) router.push(`/novel/${novelId}/chapter/${previousChapter}`)
    }
    const goToNextChapter = () => {
        if (nextChapter !== null) router.push(`/novel/${novelId}/chapter/${nextChapter}`)
    }
    useEffect(() => {
        setChapters([]); setChapterPage(0); setHasMoreChapters(true)
    }, [novelId])
    const loadChapterPage = async () => {
        if (loadingChapters || !hasMoreChapters) return
        const scope = novelId
        setLoadingChapters(true)
        try {
            const data = await getChapterPageService(novelId, chapterPage + 1)
            if (chapterScopeRef.current === scope) {
                setChapters(previous => {
                    const ids = new Set(previous.map(c => c._id))
                    return [...previous, ...data.chapters.filter(c => c._id && !ids.has(c._id)) as ChapterInfo[]]
                })
                setChapterPage(previous => previous + 1)
                setHasMoreChapters(data.hasMore)
            }
        } catch { toast.error('Không thể tải danh sách chương') }
        finally { setLoadingChapters(false) }
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
            coverUrl: novel?.image || novel?.coverImage || "",
            novelId: novelId,
            chapterNumber: chapter.chapterNumber,
            hasNext: hasNextChapter,
                nextChapterNumber: nextChapter,
            hasPrev: hasPrevChapter,
                previousChapterNumber: previousChapter,
            isLocked: false
        })
    }

    const handleAdClick = () => {
        if (adLink) {
            window.open(adLink, '_blank', 'noopener,noreferrer');
        }
        setIsAdUnlocked(true)
        if (typeof window !== "undefined") {
            sessionStorage.setItem(`ad-unlocked-${novelId}-${chapterNumber}`, "true")
        }
        axios.post('/track/ad-click', { novelId, chapterNumber }).catch(() => {})
    }

    useEffect(() => {
        if (chapter && player.audioUrl) {
            player.loadAudio(isActuallyUnlocked ? (chapter.audioUrl || null) : null, {
                title: `Chương ${chapter.chapterNumber}: ${chapter.title}`,
                novelTitle: novel?.title || "",
                coverUrl: novel?.image || novel?.coverImage || "",
                novelId: novelId,
                chapterNumber: chapter.chapterNumber,
                hasNext: hasNextChapter,
                nextChapterNumber: nextChapter,
                hasPrev: hasPrevChapter,
                previousChapterNumber: previousChapter,
                isLocked: !isActuallyUnlocked
            })
        }
    }, [chapterNumber, isActuallyUnlocked, chapter, novel, hasNextChapter, hasPrevChapter, nextChapter, previousChapter])

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
            if (e.key === "F12" || e.keyCode === 123) {
                e.preventDefault()
                toast.error("Chức năng này đã bị khóa!")
                return false
            }
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.keyCode === 73 || e.keyCode === 74 || e.keyCode === 67 || e.key === "I" || e.key === "i" || e.key === "J" || e.key === "j" || e.key === "C" || e.key === "c")) {
                e.preventDefault()
                toast.error("Chức năng này đã bị khóa!")
                return false
            }
            if ((e.ctrlKey || e.metaKey) && (e.keyCode === 85 || e.key === "U" || e.key === "u")) {
                e.preventDefault()
                toast.error("Chức năng này đã bị khóa!")
                return false
            }
            if ((e.ctrlKey || e.metaKey) && (e.keyCode === 83 || e.key === "S" || e.key === "s")) {
                e.preventDefault()
                toast.error("Chức năng này đã bị khóa!")
                return false
            }
            if ((e.ctrlKey || e.metaKey) && (e.keyCode === 80 || e.key === "P" || e.key === "p")) {
                e.preventDefault()
                toast.error("Chức năng này đã bị khóa!")
                return false
            }
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

        document.addEventListener("contextmenu", handleContextMenu)
        document.addEventListener("copy", handleCopy)
        document.addEventListener("cut", handleCut)
        document.addEventListener("selectstart", handleSelectStart)
        window.addEventListener("keydown", handleKeyDown, true)

        let intervalId: ReturnType<typeof setInterval>
        const devtoolsProtection = () => {
            try {
                const check = function() {
                    const start = new Date().getTime();
                    debugger;
                    const end = new Date().getTime();
                    if (end - start > 100) {}
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
        <div
            ref={rootRef}
            style={{
                ['--r-fs' as any]: `${fontSize}px`,
                ['--r-lh' as any]: lineHeight,
                ['--r-ff' as any]: fontFamily,
            } as CSSProperties}
            className={cn(
            "min-h-screen transition-colors duration-300",
            currentTheme.bg
        )}>
            <header className={cn(
                "sticky top-0 z-40 border-b transition-colors duration-300 w-full lg:pr-[280px]",
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

                            <DropdownMenu modal={false} onOpenChange={open => { if (open && chapterPage === 0) void loadChapterPage() }}>
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
                                    {hasMoreChapters && <DropdownMenuItem disabled={loadingChapters}
                                        onSelect={event => { event.preventDefault(); void loadChapterPage() }}>
                                        {loadingChapters ? 'Đang tải...' : 'Xem thêm chương'}
                                    </DropdownMenuItem>}
                                </DropdownMenuContent>
                            </DropdownMenu>

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
                                        <div>
                                            <label className="text-sm font-medium">Cỡ chữ: <span ref={fontSizeLabelRef}>{fontSize}</span>px</label>
                                            <input
                                                type="range"
                                                min="14"
                                                max="28"
                                                defaultValue={fontSize}
                                                onChange={(e) => {
                                                    const v = Number(e.target.value)
                                                    setReadingVar('--r-fs', `${v}px`)
                                                    if (fontSizeLabelRef.current) fontSizeLabelRef.current.textContent = String(v)
                                                }}
                                                onPointerUp={(e) => setFontSize(Number((e.target as HTMLInputElement).value))}
                                                onKeyUp={(e) => setFontSize(Number((e.target as HTMLInputElement).value))}
                                                className="w-full mt-1"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-sm font-medium">Khoảng cách dòng: <span ref={lineHeightLabelRef}>{lineHeight}</span></label>
                                            <input
                                                type="range"
                                                min="1.2"
                                                max="2.5"
                                                step="0.1"
                                                defaultValue={lineHeight}
                                                onChange={(e) => {
                                                    const v = Number(e.target.value)
                                                    setReadingVar('--r-lh', String(v))
                                                    if (lineHeightLabelRef.current) lineHeightLabelRef.current.textContent = String(v)
                                                }}
                                                onPointerUp={(e) => setLineHeight(Number((e.target as HTMLInputElement).value))}
                                                onKeyUp={(e) => setLineHeight(Number((e.target as HTMLInputElement).value))}
                                                className="w-full mt-1"
                                            />
                                        </div>
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

                            <Button 
                                onClick={handlePlayAudio}
                                className={cn(
                                    "h-8 px-2.5 rounded-full text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 cursor-pointer border-0",
                                    chapter?.audioUrl 
                                        ? "bg-gradient-to-r from-rose-500 via-pink-500 to-primary text-white shadow-pink-500/25 hover:opacity-95 active:scale-95" 
                                        : "bg-muted text-muted-foreground opacity-60 hover:opacity-80"
                                )}
                                title={chapter?.audioUrl ? "Phát audio chương này" : "Chương chưa có audio"}
                            >
                                <Headphones className={cn("h-3.5 w-3.5", player.audioUrl === chapter?.audioUrl && player.isPlaying && "animate-bounce")} />
                                <span className="font-extrabold tracking-wide">
                                    {player.audioUrl === chapter?.audioUrl && player.isPlaying ? "Đang phát" : "Phát Audio"}
                                </span>
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
                "w-full px-4 pt-8 pb-8 transition-colors duration-300",
                player.audioUrl && "pb-[calc(140px+env(safe-area-inset-bottom))] md:pb-[96px]"
            )}>
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className={cn(
                        "rounded-2xl p-4 sm:p-8 shadow-sm transition-colors border",
                        currentTheme.contentBg, 
                        currentTheme.border,
                        currentTheme.text
                    )}>
                    <div className="text-center mb-8 pb-6 border-b border-current/10 select-none">
                        <h1 className={`text-2xl sm:text-3xl font-bold mb-3 ${currentTheme.text}`}>
                            Chương {chapter.chapterNumber}: {chapter.title}
                        </h1>
                        <p className="text-sm opacity-60">
                            {chapter.wordCount?.toLocaleString() || 0} từ • {chapter.views?.toLocaleString() || 0} lượt xem
                        </p>

                        <div className="mt-5 pt-4 border-t border-current/10 flex flex-col sm:flex-row items-center justify-between gap-3 bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-primary/10 p-4 rounded-xl border border-pink-500/20">
                            <div className="flex items-center gap-3 text-left">
                                <div className="p-3 rounded-full bg-gradient-to-tr from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20 shrink-0">
                                    <Headphones className={cn("w-5 h-5 sm:w-6 sm:h-6", player.audioUrl === chapter?.audioUrl && player.isPlaying && "animate-bounce")} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-1.5 font-extrabold text-xs text-primary uppercase tracking-wide">
                                        <span>Giọng đọc Audio</span>
                                        {chapter.audioUrl ? (
                                            <span className="bg-pink-500 text-white text-[9px] px-1.5 py-0.2 rounded-full font-extrabold animate-pulse">Có sẵn</span>
                                        ) : (
                                            <span className="bg-muted text-muted-foreground text-[9px] px-1.5 py-0.2 rounded-full font-medium">Chưa có</span>
                                        )}
                                    </div>
                                    <p className="text-xs sm:text-sm font-semibold opacity-90 mt-0.5">
                                        {chapter.audioUrl 
                                            ? (player.audioUrl === chapter?.audioUrl && player.isPlaying ? "Đang phát giọng đọc chương này..." : "Bấm nút bên cạnh để nghe giọng đọc audio chương này") 
                                            : "Chương này chưa được cập nhật giọng đọc audio"}
                                    </p>
                                </div>
                            </div>
                            
                            {chapter.audioUrl && (
                                <Button
                                    onClick={handlePlayAudio}
                                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-500 via-pink-500 to-primary hover:opacity-95 text-white font-extrabold text-xs shadow-md shadow-pink-500/25 active:scale-95 transition-all shrink-0 cursor-pointer border-0"
                                >
                                    {player.audioUrl === chapter?.audioUrl && player.isPlaying ? (
                                        <>
                                            <Pause className="w-4 h-4 mr-1.5 fill-current" />
                                            Tạm dừng Audio
                                        </>
                                    ) : (
                                        <>
                                            <Play className="w-4 h-4 mr-1.5 fill-current ml-0.5" />
                                            Phát Audio Ngay
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>
                    </div>

                    {!isActuallyUnlocked ? (
                        <div className="flex flex-col items-center justify-center p-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/80 dark:bg-zinc-900/50 my-6 text-center max-w-md mx-auto space-y-4">
                            <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                                Nhấn nút bên dưới để mở khóa đọc toàn bộ chương truyện
                            </p>
                            <Button 
                                onClick={handleAdClick}
                                className="bg-gradient-to-r from-rose-500 to-primary hover:opacity-95 text-white font-extrabold rounded-xl px-8 py-3 text-sm cursor-pointer shadow-lg active:scale-95 transition-all"
                            >
                                Mở khóa đọc chương ngay
                            </Button>
                        </div>
                    ) : (
                        <article
                            className={`prose prose-lg max-w-none select-none reading-content ${currentTheme.text}`}
                            style={{
                                fontSize: 'var(--r-fs)',
                                lineHeight: 'var(--r-lh)',
                                fontFamily: 'var(--r-ff)',
                                color: readingTheme === 'light' ? '#1c1917' : readingTheme === 'sepia' ? '#5f4b32' : '#e0e0e0'
                            }}
                            dangerouslySetInnerHTML={{ __html: chapter.content }}
                        />
                    )}
                </div>

                <div>
                    <InlineAd />
                </div>

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

                {(novel as any)?.commentsEnabled !== false && (
                <div>
                     <CommentSection theme={readingTheme} novelId={novelId} chapterId={chapter._id} />
                </div>
                )}
            </div>
        </main>

            <div className={cn(
                "fixed right-6 z-45 flex flex-col items-end gap-3 select-none",
                player.audioUrl ? "bottom-[calc(124px+env(safe-area-inset-bottom))] md:bottom-24" : "bottom-24"
            )}>
                {isScrollPanelOpen && (
                    <div className={cn(
                        "rounded-full p-2 shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-5 duration-200 border text-xs font-semibold backdrop-blur-md",
                        readingTheme === 'light'
                            ? "bg-white/95 border-stone-200 text-stone-850"
                            : readingTheme === 'sepia'
                                ? "bg-[#faf8f3]/95 border-[#e8dcc8] text-[#5f4b32]"
                                : "bg-[#2d2d2d]/95 border-[#404040] text-stone-300"
                    )}>
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
                                    setAutoScrollSpeed(4);
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
        </div>
    )
}
