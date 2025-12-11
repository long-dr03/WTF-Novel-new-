"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { 
    ChevronLeft, 
    ChevronRight, 
    Home, 
    List,
    Settings,
    BookOpen,
    ArrowLeft
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { getChapterContentService, getChaptersByNovelService, getNovelByIdService } from "@/services/novelService"

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
}

interface Novel {
    _id: string
    title: string
}

interface ChapterInfo {
    _id: string
    chapterNumber: number
    title: string
}

export default function ReadChapterPage() {
    const params = useParams()
    const router = useRouter()
    const novelId = params.novelId as string
    const chapterNumber = parseInt(params.chapterNumber as string)

    const [chapter, setChapter] = useState<Chapter | null>(null)
    const [novel, setNovel] = useState<Novel | null>(null)
    const [chapters, setChapters] = useState<ChapterInfo[]>([])
    const [loading, setLoading] = useState(true)
    const [fontSize, setFontSize] = useState(18)
    const [lineHeight, setLineHeight] = useState(1.8)
    const [fontFamily, setFontFamily] = useState("serif")

    useEffect(() => {
        const fetchData = async () => {
            if (!novelId || !chapterNumber) return
            try {
                const [chapterData, novelData, chaptersData] = await Promise.all([
                    getChapterContentService(novelId, chapterNumber),
                    getNovelByIdService(novelId),
                    getChaptersByNovelService(novelId)
                ])
                setChapter(chapterData)
                setNovel(novelData)
                setChapters(chaptersData || [])
            } catch (error) {
                console.error("Error fetching chapter:", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [novelId, chapterNumber])

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
            <div className="container max-w-4xl mx-auto px-4 py-8">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-6 w-1/4 mb-8" />
                <div className="space-y-4">
                    {[...Array(10)].map((_, i) => (
                        <Skeleton key={i} className="h-4 w-full" />
                    ))}
                </div>
            </div>
        )
    }
    if (!chapter) {
        return (
            <div className="container max-w-4xl mx-auto px-4 py-8">
                <Card className="p-8 text-center">
                    <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Không tìm thấy chương</h2>
                    <p className="text-muted-foreground mb-4">Chương này không tồn tại hoặc đã bị xóa</p>
                    <Button onClick={() => router.push(`/novel/${novelId}`)}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Quay lại truyện
                    </Button>
                </Card>
            </div>
        )
    }
    
    return (
        <div className="min-h-screen bg-background">
            {/* Fixed Header */}
            <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
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
            <main className="container max-w-4xl mx-auto px-4 py-8">
                {/* Chapter Title */}
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold mb-2">
                        Chương {chapter.chapterNumber}: {chapter.title}
                    </h1>
                    <p className="text-sm text-muted-foreground">
                        {chapter.wordCount?.toLocaleString() || 0} từ • {chapter.views?.toLocaleString() || 0} lượt xem
                    </p>
                </div>

                {/* Content */}
                <article 
                    className="prose prose-lg dark:prose-invert max-w-none"
                    style={{
                        fontSize: `${fontSize}px`,
                        lineHeight: lineHeight,
                        fontFamily: fontFamily,
                    }}
                    dangerouslySetInnerHTML={{ __html: chapter.content }}
                />

                {/* Navigation */}
                <div className="flex justify-between items-center mt-12 pt-8 border-t">
                    <Button
                        variant="outline"
                        disabled={!hasPrevChapter}
                        onClick={goToPrevChapter}
                    >
                        <ChevronLeft className="h-4 w-4 mr-2" />
                        Chương trước
                    </Button>

                    <Button variant="outline" asChild>
                        <Link href={`/novel/${novelId}`}>
                            <List className="h-4 w-4 mr-2" />
                            Mục lục
                        </Link>
                    </Button>

                    <Button
                        variant="outline"
                        disabled={!hasNextChapter}
                        onClick={goToNextChapter}
                    >
                        Chương sau
                        <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                </div>
            </main>
        </div>
    )
}
