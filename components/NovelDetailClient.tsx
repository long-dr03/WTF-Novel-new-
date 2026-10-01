"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
    BookOpen,
    ArrowLeft,
    SortAsc,
    SortDesc,
    Flag,
    Search,
    Star,
    Headphones,
    Heart
} from "lucide-react"
import { 
    getNovelByIdService, 
    getChapterPageService,
    getChapterSummaryService,
    type ChapterSummary,
    checkLibraryStatusService, 
    addToLibraryService, 
    removeFromLibraryService, 
    createReportService,
    getPublicNovelsService,
    getPublicGenresService
} from "@/services/novelService"
import { useAuth } from "@/components/providers/AuthProvider"
import { useNovelAd } from "@/components/providers/NovelAdProvider"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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
    genres: any[]
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

export default function NovelDetailClient({ initialNovel }: { initialNovel?: any }) {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()
    const { setNovelAd } = useNovelAd()
    const novelId = params.novelId as string

    const [novel, setNovel] = useState<Novel | null>(initialNovel || null)
    const [chapterSummary, setChapterSummary] = useState<ChapterSummary | null>(null)
    const [chapterPage, setChapterPage] = useState(1)
    const [hasMoreChapters, setHasMoreChapters] = useState(false)
    const [loadingChapters, setLoadingChapters] = useState(false)
    const listScope = useRef('')
    const [chapters, setChapters] = useState<Chapter[]>([])
    const [loading, setLoading] = useState(!initialNovel)
    const [imageError, setImageError] = useState(false)
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
    const [isFavorite, setIsFavorite] = useState(false)
    const [libLoading, setLibLoading] = useState(false)

    // Sidebar states
    const [popularNovels, setPopularNovels] = useState<any[]>([])
    const [genres, setGenres] = useState<any[]>([])
    const [searchQuery, setSearchQuery] = useState("")
    const [relatedNovels, setRelatedNovels] = useState<any[]>([])
    const [isDescExpanded, setIsDescExpanded] = useState(false)

    useEffect(() => {
        const fetchSidebarData = async () => {
            try {
                const [popularRes, genresRes] = await Promise.all([
                    getPublicNovelsService({ limit: 5, sort: 'popular' }),
                    getPublicGenresService()
                ])
                if (popularRes?.novels) setPopularNovels(popularRes.novels)
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
            const res = await createReportService(novel?._id, undefined, reportReason, reportDescription)
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
                const [novelData, summary] = await Promise.all([
                    initialNovel ? Promise.resolve(initialNovel) : getNovelByIdService(novelId),
                    getChapterSummaryService(novelId)
                ])
                if (novelData) {
                    setNovel(novelData as Novel)
                    if (novelData.genres && novelData.genres.length > 0) {
                        const firstGenre = novelData.genres[0] as any
                        const genreVal = typeof firstGenre === 'string' ? firstGenre : (firstGenre.slug || firstGenre._id || firstGenre.name)
                        getPublicNovelsService({ limit: 5, genre: genreVal }).then(res => {
                            if (res?.novels) {
                                setRelatedNovels(res.novels.filter((n: any) => (n._id || n.id) !== novelId).slice(0, 4))
                            }
                        }).catch(e => console.error("Error fetching related novels", e))
                    }
                }
                setChapterSummary(summary)
            } catch (error) {
                console.error("Error fetching novel:", error)
            } finally {
                setLoading(false)
            }
        }
        
        fetchData()
    }, [novelId, initialNovel])

    useEffect(() => {
        if (novel) setNovelAd({ adImage: (novel as any).adImage, adLink: (novel as any).adLink })
        return () => setNovelAd(null)
    }, [novel]) // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (novel && user) {
             checkLibraryStatusService(novel._id).then(res => {
                 if (res && (res as any).isFavorite) setIsFavorite(true)
             })
        }
    }, [novel, user])

    const toggleFavorite = async () => {
        if (!user) {
            toast.error("Vui lòng đăng nhập để thêm vào yêu thích")
            return
        }
        if (!novel) return
        setLibLoading(true)
        try {
            if (isFavorite) {
                await removeFromLibraryService(novel._id, 'favorite')
                setIsFavorite(false)
                toast.success("Đã xóa khỏi danh sách yêu thích")
            } else {
                await addToLibraryService(novel._id, 'favorite')
                setIsFavorite(true)
                toast.success("Đã thêm vào danh sách yêu thích")
            }
        } catch (e) {
            toast.error("Có lỗi xảy ra")
        } finally {
            setLibLoading(false)
        }
    }

    const stats = { latestChapter: chapterSummary?.last != null ? { chapterNumber: chapterSummary.last } : null }
    listScope.current = `${novelId}:${sortOrder}`
    useEffect(() => {
        let active = true
        setChapters([]); setChapterPage(1); setHasMoreChapters(false); setLoadingChapters(true)
        getChapterPageService(novelId, 1, sortOrder).then(data => {
            if (active) { setChapters(data.chapters as Chapter[]); setHasMoreChapters(data.hasMore) }
        }).catch(() => { if (active) toast.error('Không thể tải danh sách chương') })
            .finally(() => { if (active) setLoadingChapters(false) })
        return () => { active = false }
    }, [novelId, sortOrder])
    const loadMoreChapters = async () => {
        if (loadingChapters) return
        const scope = listScope.current
        setLoadingChapters(true)
        try {
            const data = await getChapterPageService(novelId, chapterPage + 1, sortOrder)
            if (listScope.current === scope) {
                setChapters(previous => {
                    const ids = new Set(previous.map(c => c._id))
                    return [...previous, ...data.chapters.filter(c => !ids.has(c._id as string)) as Chapter[]]
                })
                setChapterPage(previous => previous + 1); setHasMoreChapters(data.hasMore)
            }
        } catch { toast.error('Không thể tải thêm chương') }
        finally { if (listScope.current === scope) setLoadingChapters(false) }
    }

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

    const formatDateLocal = (dateStr?: string) => {
        if (!dateStr) return "";
        try {
            return new Date(dateStr).toLocaleDateString('vi-VN');
        } catch (e) {
            return "";
        }
    };

    const ratingScore = 4.8;
    const ratingCount = Math.max(2, Math.floor((novel.views || 0) / 100) + (novel.likes || 0));

    return (
        <div className="container mx-auto px-4 py-8 space-y-8 max-w-7xl">
            {/* Back button */}
            <Button variant="ghost" className="mb-2 hover:bg-primary/5 hover:text-primary transition-all duration-200" onClick={() => router.back()}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Quay lại
            </Button>

            {/* TOP SECTION: Novel Info Overview */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-800/40 p-6 rounded-2xl shadow-sm">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                    
                    {/* Column 1: Cover Image */}
                    <div className="col-span-1 md:col-span-3 lg:col-span-2.5 mx-auto md:mx-0 w-full max-w-[180px]">
                        <div className="aspect-[2/3] relative rounded-xl overflow-hidden bg-muted border border-zinc-200/20 shadow-md hover:scale-[1.01] transition-transform duration-300">
                            {novel.image && !imageError ? (
                                <Image
                                    src={novel.image}
                                    alt={novel.title}
                                    fill
                                    priority
                                    className="object-cover"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                                    <BookOpen className="h-12 w-12 text-primary/30" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Column 2: Rating, Meta details */}
                    <div className="col-span-1 md:col-span-6 lg:col-span-6.5 flex flex-col gap-5">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                    <Star 
                                        key={i} 
                                        className="w-5 h-5 fill-amber-400 text-amber-400" 
                                    />
                                ))}
                            </div>
                            <span className="text-xl font-bold text-zinc-800 dark:text-zinc-200">{ratingScore}</span>
                        </div>

                        <div className="grid grid-cols-[100px_1fr] gap-x-4 gap-y-2.5 text-sm border-t border-zinc-100 dark:border-zinc-900 pt-4">
                            <span className="text-zinc-400 dark:text-zinc-500 font-semibold">Đánh giá</span>
                            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                                {ratingScore} / 5 từ <span className="text-primary hover:underline cursor-pointer">{ratingCount} đánh giá</span>
                            </span>

                            <span className="text-zinc-400 dark:text-zinc-500 font-semibold">Xếp hạng</span>
                            <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                                {novel.views?.toLocaleString() || 0} lượt xem
                            </span>

                            <span className="text-zinc-400 dark:text-zinc-500 font-semibold">Tác giả</span>
                            <span className="text-zinc-700 dark:text-zinc-300 font-medium hover:text-primary transition-colors cursor-pointer">
                                {getAuthorName()}
                            </span>

                            <span className="text-zinc-400 dark:text-zinc-500 font-semibold">Thể loại</span>
                            <span className="text-zinc-700 dark:text-zinc-300">
                                {novel.genres && novel.genres.length > 0 ? (
                                    novel.genres.filter(g => g).map((genre: any, index) => {
                                        const genreName = typeof genre === 'string' ? genre : genre.name;
                                        const genreSlug = typeof genre === 'string'
                                            ? genre.toLowerCase().replace(/\s+/g, '-')
                                            : genre.slug;

                                        return (
                                            <span key={index}>
                                                <Link
                                                    href={`/genre/${genreSlug}`}
                                                    className="font-semibold text-zinc-700 dark:text-zinc-300 hover:text-primary transition-colors hover:underline"
                                                >
                                                    {genreName}
                                                </Link>
                                                {index < novel.genres.filter(g => g).length - 1 && ", "}
                                            </span>
                                        );
                                    })
                                ) : (
                                    "Chưa phân loại"
                                )}
                            </span>
                        </div>

                        {/* Action buttons */}
                        <div className="flex flex-wrap gap-3 mt-2">
                            {chapters.length > 0 && (
                                <Button asChild className="bg-gradient-to-r from-rose-500 via-pink-500 to-primary hover:opacity-95 text-white font-bold rounded-xl px-5 py-2 text-xs shadow-md cursor-pointer border-0">
                                    <Link href={`/novel/${novelId}/chapter/${chapterSummary?.first ?? 1}`}>
                                        <Headphones className="w-4 h-4 mr-1.5" />
                                        Nghe Audio
                                    </Link>
                                </Button>
                            )}
                            {chapters.length > 0 && (
                                <Button asChild variant="outline" className="font-bold rounded-xl px-5 py-2 text-xs cursor-pointer">
                                    <Link href={`/novel/${novelId}/chapter/${chapterSummary?.first ?? 1}`}>
                                        Chương đầu
                                    </Link>
                                </Button>
                            )}
                            {stats.latestChapter && (
                                <Button asChild variant="outline" className="font-bold rounded-xl px-5 py-2 text-xs cursor-pointer">
                                    <Link href={`/novel/${novelId}/chapter/${stats.latestChapter.chapterNumber}`}>
                                        Chương cuối
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </div>

                    {/* Column 3: Release, Status, Bookmarks */}
                    <div className="col-span-1 md:col-span-3 lg:col-span-3 border-t md:border-t-0 md:border-l border-zinc-150 dark:border-zinc-900 pt-6 md:pt-0 md:pl-8 flex flex-col gap-5 text-sm">
                        <div className="flex justify-between items-center md:flex-col md:items-start md:gap-1.5">
                            <span className="text-zinc-400 dark:text-zinc-500 font-semibold">Phát hành</span>
                            <span className="text-zinc-800 dark:text-zinc-200 font-bold">{new Date(novel.createdAt).getFullYear()}</span>
                        </div>

                        <div className="flex justify-between items-center md:flex-col md:items-start md:gap-1.5">
                            <span className="text-zinc-400 dark:text-zinc-500 font-semibold">Tình trạng</span>
                            <span className="text-zinc-800 dark:text-zinc-200 font-bold capitalize">{statusInfo.label}</span>
                        </div>

                        <div className="flex items-center gap-3 pt-2 md:pt-4 border-t border-zinc-100 dark:border-zinc-900 mt-2">
                            <button 
                                onClick={toggleFavorite} 
                                disabled={libLoading}
                                className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                                    isFavorite 
                                        ? "bg-primary/10 border-primary/30 text-primary" 
                                        : "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-850 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600"
                                }`}
                                title={isFavorite ? "Bỏ yêu thích" : "Yêu thích"}
                            >
                                <Heart className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} />
                            </button>
                            <div className="flex flex-col">
                                <span className="text-xs text-zinc-700 dark:text-zinc-300 font-bold">
                                    {novel.likes || 0} người thích
                                </span>
                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
                                    Thêm vào kệ sách
                                </span>
                            </div>
                        </div>

                        {(novel as any).reportsEnabled !== false && (
                        <Button
                            variant="outline"
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/5 border-red-500/20 text-xs font-semibold rounded-xl mt-2 cursor-pointer h-9 shadow-sm"
                            onClick={() => setIsReportOpen(true)}
                        >
                            <Flag className="h-4 w-4 mr-2" />
                            Báo cáo vi phạm
                        </Button>
                        )}
                    </div>

                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-8 flex flex-col gap-10">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-zinc-200/60 dark:border-zinc-900 pb-2.5">
                            <Star className="w-4.5 h-4.5 fill-primary text-primary" />
                            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Giới thiệu truyện</h2>
                        </div>
                        
                        <div className="space-y-3">
                            <h3 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                                {novel.title}
                            </h3>
                            <div className="relative">
                                <div className={`text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed transition-all duration-300 ${
                                    isDescExpanded ? "" : "line-clamp-5"
                                }`}>
                                    {novel.description}
                                </div>
                                
                                {novel.description && novel.description.length > 280 && (
                                    <button 
                                        onClick={() => setIsDescExpanded(!isDescExpanded)}
                                        className="text-xs font-bold text-primary hover:underline mt-2.5 flex items-center gap-1 cursor-pointer"
                                    >
                                        {isDescExpanded ? "Thu gọn ▲" : "Xem thêm ▼"}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div>
                        <InlineAd />
                    </div>

                    {/* Chapters List */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between border-b border-zinc-200/60 dark:border-zinc-900 pb-2.5">
                            <div className="flex items-center gap-2">
                                <Star className="w-4.5 h-4.5 fill-primary text-primary" />
                                <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Chương truyện</h2>
                            </div>
                            
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="h-8 text-xs font-semibold text-zinc-500 hover:text-primary flex items-center gap-1 cursor-pointer rounded-lg px-2 hover:bg-primary/5"
                            >
                                {sortOrder === 'asc' ? <SortAsc className="h-3.5 w-3.5" /> : <SortDesc className="h-3.5 w-3.5" />}
                                {sortOrder === 'asc' ? 'Cũ nhất' : 'Mới nhất'}
                            </Button>
                        </div>

                        {loadingChapters && chapters.length === 0 ? <p>Đang tải danh sách chương...</p> : chapters.length === 0 ? (
                            <div className="text-center py-12 text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl bg-zinc-50/30 dark:bg-transparent">
                                <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
                                <p className="text-sm">Truyện chưa có chương nào</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-900 border border-zinc-200/50 dark:border-zinc-900 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950/20 shadow-sm max-h-[500px] overflow-y-auto pr-0.5 custom-scrollbar">
                                {sortedChapters.map((chapter) => (
                                    <Link
                                        key={chapter._id}
                                        href={`/novel/${novelId}/chapter/${chapter.chapterNumber}`}
                                        className="flex items-center justify-between px-5 py-4 hover:bg-zinc-50/55 dark:hover:bg-zinc-900/20 transition-colors group"
                                    >
                                        <span className="font-semibold text-sm text-zinc-700 dark:text-zinc-300 group-hover:text-primary transition-colors truncate pr-4">
                                            Chương {chapter.chapterNumber}{chapter.title ? `: ${chapter.title}` : ""}
                                        </span>
                                        <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium flex-shrink-0">
                                            {formatDateLocal(chapter.createdAt || chapter.publishedAt)}
                                        </span>
                                    </Link>
                                ))}
                            </div>
                        )}
                        {hasMoreChapters && <Button variant="outline" disabled={loadingChapters} onClick={loadMoreChapters}>
                            {loadingChapters ? 'Đang tải...' : 'Xem thêm chương'}
                        </Button>}
                    </div>

                    {/* Related Novels */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 border-b border-zinc-200/60 dark:border-zinc-900 pb-2.5">
                            <Star className="w-4.5 h-4.5 fill-primary text-primary" />
                            <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Bạn cũng có thể thích</h2>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {relatedNovels.length > 0 ? (
                                relatedNovels.map((n) => {
                                    const rId = n.slug || n._id || n.id || "";
                                    return (
                                        <Link 
                                            key={rId} 
                                            href={`/novel/${rId}`} 
                                            className="flex gap-3 p-2 bg-zinc-50/50 hover:bg-zinc-100/60 dark:bg-zinc-900/10 dark:hover:bg-zinc-900/40 rounded-xl border border-zinc-200/10 hover:border-primary/10 transition-all hover:scale-[1.01] group"
                                        >
                                            <div className="relative w-12 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-zinc-200/20 shadow-sm">
                                                <Image
                                                    src={n.image || n.coverImage || "/ANIMENETFLIX-FA.webp"}
                                                    alt={n.title}
                                                    fill
                                                    sizes="48px"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </div>
                                            <div className="flex flex-col justify-center min-w-0">
                                                <h4 className="font-semibold text-xs text-zinc-700 dark:text-zinc-300 group-hover:text-primary transition-colors line-clamp-2 leading-snug" title={n.title}>
                                                    {n.title}
                                                </h4>
                                                <span className="text-[9px] text-zinc-400 dark:text-zinc-500 mt-1 font-semibold uppercase tracking-wider">
                                                    {formatDateLocal(n.updatedAt || n.createdAt)}
                                                </span>
                                            </div>
                                        </Link>
                                    )
                                })
                            ) : (
                                <div className="text-center py-6 text-xs text-zinc-400 dark:text-zinc-500 col-span-full">
                                    Đang tìm kiếm truyện tương đồng...
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 flex flex-col gap-8">
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

                    <div className="bg-white/95 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
                        <div className="relative border-b border-zinc-200/20 dark:border-zinc-900 px-5 py-4">
                            <span className="text-[11px] font-bold text-white bg-primary uppercase tracking-wider px-3.5 py-1.5 rounded-lg shadow-sm">
                                Phổ biến
                            </span>
                        </div>
                        
                        <div className="p-5 flex flex-col gap-4">
                            {popularNovels.length > 0 ? (
                                popularNovels.map((novel) => {
                                    const popularNovelId = novel.slug || novel._id || novel.id || "";
                                    const totalChapters = novel.chapters || 0;
                                    return (
                                        <div key={popularNovelId} className="flex gap-4 pb-4 border-b border-zinc-100 dark:border-zinc-900 last:border-b-0 last:pb-0 group">
                                            <Link href={`/novel/${popularNovelId}`} className="relative w-14 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-zinc-200/20 shadow-sm">
                                                <Image
                                                    src={novel.image || novel.coverImage || "/ANIMENETFLIX-FA.webp"}
                                                    alt={novel.title}
                                                    fill
                                                    sizes="56px"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            </Link>
                                            
                                            <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                                <Link href={`/novel/${popularNovelId}`}>
                                                    <h4 className="text-sm font-bold text-zinc-700 dark:text-zinc-350 line-clamp-1 group-hover:text-primary transition-colors leading-tight" title={novel.title}>
                                                        {novel.title}
                                                    </h4>
                                                </Link>
                                                
                                                <div className="flex flex-col gap-1.5 mt-2">
                                                    {totalChapters > 0 ? (
                                                        <div className="flex items-center gap-2">
                                                            <Link 
                                                                href={`/novel/${popularNovelId}/chapter/${totalChapters}`}
                                                                className="text-[10px] font-bold px-2 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                                                            >
                                                                Chương {totalChapters}
                                                            </Link>
                                                            <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                                                                {formatDateLocal(novel.updatedAt)}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">Chưa có chương</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center py-6 text-xs text-muted-foreground">
                                    Đang tải danh sách phổ biến...
                                </div>
                            )}

                            <Button 
                                asChild
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl text-xs h-9 cursor-pointer mt-2 shadow-sm"
                            >
                                <Link href="/search?sort=popular">Xem toàn bộ</Link>
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white/95 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-primary/5 border-b border-zinc-200/20 dark:border-zinc-900 px-5 py-4 flex items-center justify-between">
                            <span className="text-[11px] font-bold text-primary uppercase tracking-wider bg-primary/10 px-2.5 py-1 rounded-md">
                                Thể loại truyện
                            </span>
                        </div>
                        
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
        </div>
    )
}
