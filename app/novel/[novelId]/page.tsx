"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    BookOpen,
    Eye,
    Heart,
    Clock,
    User,
    ChevronRight,
    ArrowLeft,
    List,
    FileText,
    SortAsc,
    SortDesc,
    Flag,
    TrendingUp,
    Search
} from "lucide-react"
import { 
    getNovelByIdService, 
    getChaptersByNovelService, 
    checkLibraryStatusService, 
    addToLibraryService, 
    removeFromLibraryService, 
    createReportService,
    getPublicNovelsService,
    getPublicGenresService
} from "@/services/novelService"
import { useAuth } from "@/components/providers/AuthProvider"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { InlineAd } from "@/components/ads/InlineAd"
import { Input } from "@/components/ui/input"


interface Novel {
    _id: string
    title: string
    description: string
    image?: string
    author: {
        _id: string
        username: string
        avatar?: string
    } | string
    genres: string[]
    status: string
    views: number
    likes: number
    createdAt: string
    updatedAt: string
}

interface Chapter {
    _id: string
    chapterNumber: number
    title: string
    status: string
    publishedAt?: string
    createdAt?: string
    views: number
    wordCount: number
}

export default function NovelDetailPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const novelId = params.novelId as string

    const [novel, setNovel] = useState<Novel | null>(null)
    const [chapters, setChapters] = useState<Chapter[]>([])
    const [loading, setLoading] = useState(true)
    const [imageError, setImageError] = useState(false)
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
    const [isFavorite, setIsFavorite] = useState(false)
    const [libLoading, setLibLoading] = useState(false)

    // Sidebar states
    const [popularNovels, setPopularNovels] = useState<any[]>([])
    const [genres, setGenres] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchSidebarData = async () => {
            try {
                const popularRes = await getPublicNovelsService({ limit: 5, sort: 'popular' })
                if (popularRes?.novels) setPopularNovels(popularRes.novels)

                const genresRes = await getPublicGenresService()
                if (Array.isArray(genresRes)) setGenres(genresRes.slice(0, 12))
            } catch (error) {
                console.error("Error fetching sidebar data:", error)
            }
        }
        fetchSidebarData()
    }, [])

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
        }
    }

    // Report State
    const [reportReason, setReportReason] = useState("Nội dung vi phạm")
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
            const res = await createReportService(novelId, undefined, reportReason, reportDescription)
            if (res) {
                toast.success("Báo cáo vi phạm đã được gửi đi thành công")
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
        const fetchData = async () => {
            if (!novelId) return
            try {
                const [novelData, chaptersData] = await Promise.all([
                    getNovelByIdService(novelId),
                    getChaptersByNovelService(novelId)
                ])
                if (novelData) {
                    setNovel(novelData as Novel)
                }
                if (chaptersData) {
                    setChapters(chaptersData as Chapter[])
                }
            } catch (error) {
                console.error("Error fetching novel:", error)
            } finally {
                setLoading(false)
            }
        }
        
        fetchData()
    }, [novelId])

    useEffect(() => {
        if (novelId && user) {
             checkLibraryStatusService(novelId).then(res => {
                 // checkLibraryStatus returns { inHistory: boolean, isFavorite: boolean }
                 if (res && (res as any).isFavorite) setIsFavorite(true)
             })
        }
    }, [novelId, user])

    const toggleFavorite = async () => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để thêm vào yêu thích")
            return
        }
        setLibLoading(true)
        try {
            if (isFavorite) {
                await removeFromLibraryService(novelId, 'favorite')
                setIsFavorite(false)
                toast.success("Đã xóa khỏi danh sách yêu thích")
            } else {
                await addToLibraryService(novelId, 'favorite')
                setIsFavorite(true)
                toast.success("Đã thêm vào danh sách yêu thích")
            }
        } catch (e) {
            toast.error("Có lỗi xảy ra")
        } finally {
            setLibLoading(false)
        }
    }

    // Tính toán thống kê
    const stats = useMemo(() => {
        const totalWords = chapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0)
        const totalViews = chapters.reduce((sum, ch) => sum + (ch.views || 0), 0)
        const latestChapter = chapters.length > 0
            ? chapters.reduce((latest, ch) => ch.chapterNumber > latest.chapterNumber ? ch : latest)
            : null
        return { totalWords, totalViews, latestChapter }
    }, [chapters])

    // Sắp xếp chapters
    const sortedChapters = useMemo(() => {
        return [...chapters].sort((a, b) =>
            sortOrder === "asc"
                ? a.chapterNumber - b.chapterNumber
                : b.chapterNumber - a.chapterNumber
        )
    }, [chapters, sortOrder])

    const getStatusBadge = (status: string) => {
        const statusMap: Record<string, { label: string; className: string }> = {
            ongoing: { label: "Đang viết", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
            completed: { label: "Hoàn thành", className: "bg-green-500/10 text-green-500 border-green-500/20" },
            hiatus: { label: "Tạm dừng", className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
        }
        return statusMap[status] || statusMap.ongoing
    }

    const getAuthorName = () => {
        if (!novel) return "Unknown"
        if (typeof novel.author === "string") return novel.author
        return novel.author.username || "Unknown"
    }

    if (loading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex gap-8">
                    <Skeleton className="w-[200px] h-[300px] rounded-xl" />
                    <div className="flex-1 space-y-4">
                        <Skeleton className="h-10 w-3/4" />
                        <Skeleton className="h-6 w-1/4" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                </div>
            </div>
        )
    }

    if (!novel) {
        return (
            <div className="container mx-auto px-4 py-8">
                <Card className="p-8 text-center">
                    <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Không tìm thấy truyện</h2>
                    <p className="text-muted-foreground mb-4">Truyện này không tồn tại hoặc đã bị xóa</p>
                    <Button onClick={() => router.push("/")}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Về trang chủ
                    </Button>
                </Card>
            </div>
        )
    }

    const statusInfo = getStatusBadge(novel.status)

    return (
        <div className="container mx-auto px-4 py-8">
            {/* Back button */}
            <Button variant="ghost" className="mb-6" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
            </Button>

            {/* Main two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LEFT COLUMN: Main detail content */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {/* Novel Info Section */}
                    <div className="flex flex-col md:flex-row gap-8 mb-8">
                        {/* Cover Image */}
                        <div className="w-full max-w-[200px] mx-auto md:w-[200px] md:mx-0 flex-shrink-0">
                            <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-muted">
                                {novel.image && !imageError ? (
                                    <Image
                                        src={novel.image}
                                        alt={novel.title}
                                        fill
                                        className="object-cover"
                                        onError={() => setImageError(true)}
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                                        <BookOpen className="h-16 w-16 text-muted-foreground/30" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Novel Details */}
                        <div className="flex-1 bg-zinc-100/60 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/40 p-5 rounded-xl">
                            <h1 className="text-3xl font-bold mb-3">{novel.title}</h1>

                            <div className="flex flex-wrap items-center gap-4 mb-4">
                                <Badge className={statusInfo.className} variant="outline">
                                    {statusInfo.label}
                                </Badge>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                    <User className="h-4 w-4" />
                                    <span>{getAuthorName()}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-6 mb-4 text-sm text-muted-foreground">
                                <div className="flex items-center gap-1">
                                    <Eye className="h-4 w-4" />
                                    <span>{novel.views?.toLocaleString() || 0} lượt xem</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Heart className="h-4 w-4" />
                                    <span>{novel.likes?.toLocaleString() || 0} lượt thích</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <List className="h-4 w-4" />
                                    <span>{chapters.length} chương</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <FileText className="h-4 w-4" />
                                    <span>{stats.totalWords.toLocaleString()} từ</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4" />
                                    <span>Cập nhật: {new Date(novel.updatedAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                            </div>

                            {/* Genres */}
                            {novel.genres && novel.genres.length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {novel.genres.filter(g => g).map((genre: any, index) => {
                                        // Handle both string and object formats
                                        const genreName = typeof genre === 'string' ? genre : genre.name;
                                        const genreSlug = typeof genre === 'string'
                                            ? genre.toLowerCase().replace(/\s+/g, '-')
                                            : genre.slug;

                                        return (
                                            <Link
                                                key={index}
                                                href={`/genre/${genreSlug}`}
                                                className="hover:scale-105 transition-transform"
                                            >
                                                <Badge
                                                    variant="secondary"
                                                    className="cursor-pointer hover:bg-primary/20"
                                                >
                                                    {genreName}
                                                </Badge>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Description */}
                            <p className="text-muted-foreground leading-relaxed mb-6">
                                {novel.description}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex flex-wrap gap-3 w-full justify-center md:justify-start">
                                {chapters.length > 0 && (
                                    <Button asChild className="flex-1 sm:flex-none justify-center">
                                        <Link href={`/novel/${novelId}/chapter/1`}>
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            Đọc từ đầu
                                        </Link>
                                    </Button>
                                )}
                                {stats.latestChapter && stats.latestChapter.chapterNumber > 1 && (
                                    <Button variant="secondary" asChild className="flex-1 sm:flex-none justify-center">
                                        <Link href={`/novel/${novelId}/chapter/${stats.latestChapter.chapterNumber}`}>
                                            <BookOpen className="h-4 w-4 mr-2" />
                                            Chương mới nhất
                                        </Link>
                                    </Button>
                                )}
                                <Button 
                                    variant={isFavorite ? "default" : "outline"} 
                                    onClick={toggleFavorite}
                                    disabled={libLoading}
                                    className="flex-1 sm:flex-none justify-center"
                                >
                                    <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
                                    {isFavorite ? "Đã yêu thích" : "Yêu thích"}
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30 flex-1 sm:flex-none justify-center"
                                    onClick={() => setIsReportOpen(true)}
                                >
                                    <Flag className="h-4 w-4 mr-2" />
                                    Báo cáo
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Quảng cáo tài trợ */}
                    <div className="mb-6">
                        <InlineAd />
                    </div>

                    {/* Latest Chapter Info */}
                    {stats.latestChapter && (
                        <Card className="mb-6 border-primary/20 bg-primary/5">
                            <CardContent className="py-4">
                                <div className="flex items-center justify-between flex-wrap gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Chương mới nhất</p>
                                        <Link
                                            href={`/novel/${novelId}/chapter/${stats.latestChapter.chapterNumber}`}
                                            className="font-medium hover:text-primary transition-colors"
                                        >
                                            Chương {stats.latestChapter.chapterNumber}: {stats.latestChapter.title}
                                        </Link>
                                    </div>
                                    <Button size="sm" asChild>
                                        <Link href={`/novel/${novelId}/chapter/${stats.latestChapter.chapterNumber}`}>
                                            Đọc ngay
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Chapters List */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <CardTitle className="flex items-center gap-2">
                                    <List className="h-5 w-5" />
                                    Danh sách chương ({chapters.length})
                                </CardTitle>
                                <Tabs value={sortOrder} onValueChange={(v) => setSortOrder(v as "asc" | "desc")}>
                                    <TabsList className="h-9">
                                        <TabsTrigger value="asc" className="gap-1 text-xs">
                                            <SortAsc className="h-3 w-3" />
                                            Cũ nhất
                                        </TabsTrigger>
                                        <TabsTrigger value="desc" className="gap-1 text-xs">
                                            <SortDesc className="h-3 w-3" />
                                            Mới nhất
                                        </TabsTrigger>
                                    </TabsList>
                                </Tabs>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {chapters.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                    <p>Truyện chưa có chương nào</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2">
                                    {sortedChapters.map((chapter) => (
                                        <Link
                                            key={chapter._id}
                                            href={`/novel/${novelId}/chapter/${chapter.chapterNumber}`}
                                            className="flex items-center justify-between p-3 rounded-lg hover:bg-accent/50 transition-colors group border border-transparent hover:border-border"
                                        >
                                            <div className="flex-1">
                                                <div className="font-medium group-hover:text-primary transition-colors">
                                                    Chương {chapter.chapterNumber}: {chapter.title}
                                                </div>
                                                <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                                    <span>{chapter.wordCount?.toLocaleString() || 0} từ</span>
                                                    <span>{chapter.views?.toLocaleString() || 0} lượt xem</span>
                                                    {chapter.createdAt && (
                                                        <span>{new Date(chapter.createdAt).toLocaleDateString('vi-VN')}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* RIGHT COLUMN: Sidebar widgets */}
                <div className="lg:col-span-4 flex flex-col gap-8">
                    {/* WIDGET 1: Search Box */}
                    <div className="bg-white/95 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl p-5 shadow-sm">
                        <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                            <Input
                                type="text"
                                placeholder="Tìm kiếm..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pr-10 rounded-xl border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 focus:border-primary focus:ring-1 focus:ring-primary/50 text-sm h-10 bg-zinc-100/20 dark:bg-zinc-900/10"
                            />
                            <Button 
                                type="submit" 
                                size="icon"
                                variant="ghost" 
                                className="absolute right-0 top-0 h-10 w-10 text-zinc-400 hover:text-primary dark:hover:text-foreground cursor-pointer rounded-r-xl"
                            >
                                <Search className="h-4.5 w-4.5" />
                            </Button>
                        </form>
                    </div>

                    {/* WIDGET 2: Xu Hướng (Trending) */}
                    <div className="bg-white/95 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm font-semibold">
                        {/* Header */}
                        <div className="bg-primary/5 border-b border-zinc-200/20 dark:border-zinc-900 px-5 py-4 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-md flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5" />
                                Xu Hướng
                            </span>
                        </div>
                        
                        {/* List */}
                        <div className="p-5 flex flex-col gap-3.5">
                            {popularNovels.length > 0 ? (
                                popularNovels.map((novel, index) => {
                                    const popularNovelId = novel._id || novel.id || "";
                                    const rank = index + 1;
                                    return (
                                        <div key={popularNovelId} className="flex items-center gap-3 group">
                                            {/* Rank index */}
                                            <span className={`w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold ${
                                                rank === 1 
                                                    ? "bg-primary text-primary-foreground shadow" 
                                                    : rank === 2 
                                                    ? "bg-primary/20 text-primary"
                                                    : rank === 3
                                                    ? "bg-primary/10 text-primary"
                                                    : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500"
                                            }`}>
                                                {rank}
                                            </span>
                                            
                                            {/* Novel Title */}
                                            <Link href={`/novel/${popularNovelId}`} className="flex-1 min-w-0">
                                                <h4 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 truncate group-hover:text-primary transition-colors" title={novel.title}>
                                                    {novel.title}
                                                </h4>
                                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                                                    {novel.views || 0} lượt đọc
                                                </span>
                                            </Link>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-6 text-xs text-muted-foreground">
                                    Đang tải danh sách xu hướng...
                                </div>
                            )}

                            {/* Show All Button */}
                            <Button 
                                asChild
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-xs h-9 cursor-pointer mt-2 shadow"
                            >
                                <Link href="/search?sort=popular">Xem tất cả</Link>
                            </Button>
                        </div>
                    </div>

                    {/* WIDGET 3: Thể loại truyện (Genres) */}
                    <div className="bg-white/95 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
                        {/* Header */}
                        <div className="bg-primary/5 border-b border-zinc-200/20 dark:border-zinc-900 px-5 py-4 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-md">
                                Thể loại truyện
                            </span>
                        </div>
                        
                        {/* Genre Pills */}
                        <div className="p-5">
                            {genres.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {genres.map((genre) => (
                                        <Link 
                                            key={genre._id} 
                                            href={`/genre/${genre.slug}`}
                                            className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-zinc-100 hover:bg-primary/10 hover:text-primary text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-400 dark:hover:bg-primary/20 dark:hover:text-primary transition-all duration-200"
                                        >
                                            {genre.name}
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-xs text-muted-foreground">
                                    Đang tải danh sách thể loại...
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            {/* Reports Modal */}
            <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Flag className="h-5 w-5 text-red-500" />
                            Báo cáo truyện vi phạm
                        </DialogTitle>
                        <DialogDescription>
                            Giúp chúng tôi cải thiện cộng đồng bằng cách báo cáo nội dung không phù hợp hoặc lỗi dịch thuật.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Lý do báo cáo</label>
                            <Select value={reportReason} onValueChange={setReportReason}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Chọn lý do" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Bản dịch lỗi / Văn phong kém">Bản dịch lỗi / Văn phong kém</SelectItem>
                                    <SelectItem value="Truyện chứa nội dung nhạy cảm">Truyện chứa nội dung nhạy cảm</SelectItem>
                                    <SelectItem value="Vi phạm bản quyền / Đạo văn">Vi phạm bản quyền / Đạo văn</SelectItem>
                                    <SelectItem value="Lỗi tải ảnh / Lỗi hiển thị">Lỗi tải ảnh / Lỗi hiển thị</SelectItem>
                                    <SelectItem value="Khác">Lý do khác</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Mô tả chi tiết</label>
                            <Textarea 
                                placeholder="Hãy mô tả chi tiết lỗi hoặc vấn đề bạn gặp phải..." 
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

            {/* SEO JSON-LD Schema Markup */}
            {novel && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{
                        __html: JSON.stringify({
                            "@context": "https://schema.org",
                            "@type": "Book",
                            "name": novel.title,
                            "description": novel.description,
                            "image": novel.image || "https://cdn-icons-png.flaticon.com/512/149/149071.png",
                            "author": {
                                "@type": "Person",
                                "name": getAuthorName()
                            },
                            "genre": novel.genres ? novel.genres.map((g: any) => typeof g === 'string' ? g : g.name) : [],
                            "aggregateRating": {
                                "@type": "AggregateRating",
                                "ratingValue": "4.8",
                                "reviewCount": "120"
                            }
                        })
                    }}
                />
            )}
        </div>
    )
}
