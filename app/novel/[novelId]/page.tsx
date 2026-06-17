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
    Flag
} from "lucide-react"
import { getNovelByIdService, getChaptersByNovelService, checkLibraryStatusService, addToLibraryService, removeFromLibraryService, createReportService } from "@/services/novelService"
import { useAuth } from "@/components/providers/AuthProvider"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


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

            {/* Novel Info Section */}
            <div className="flex flex-col md:flex-row gap-8 mb-8">
                {/* Cover Image */}
                <div className="w-full md:w-[200px] flex-shrink-0">
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
                <div className="flex-1 bg-zinc-900 p-4 rounded-xl">
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
                    <div className="flex gap-3">
                        {chapters.length > 0 && (
                            <Button asChild>
                                <Link href={`/novel/${novelId}/chapter/1`}>
                                    <BookOpen className="h-4 w-4 mr-2" />
                                    Đọc từ đầu
                                </Link>
                            </Button>
                        )}
                        {stats.latestChapter && stats.latestChapter.chapterNumber > 1 && (
                            <Button variant="secondary" asChild>
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
                        >
                            <Heart className={`h-4 w-4 mr-2 ${isFavorite ? "fill-current" : ""}`} />
                            {isFavorite ? "Đã yêu thích" : "Yêu thích"}
                        </Button>
                        <Button 
                            variant="outline" 
                            className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/30"
                            onClick={() => setIsReportOpen(true)}
                        >
                            <Flag className="h-4 w-4 mr-2" />
                            Báo cáo
                        </Button>
                    </div>
                </div>
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
