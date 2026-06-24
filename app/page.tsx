"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { RecommendedBanner } from "@/components/RecommendedBanner";
import CardNovel from "@/components/cardNovel";
import { 
  getPublicNovelsService, 
  getLibraryService, 
  createReportService, 
  getPublicGenresService, 
  Novel 
} from "@/services/novelService";
import { useAuth } from "@/components/providers/AuthProvider";
import { 
  Loader2, 
  Clock, 
  ChevronRight, 
  Headphones, 
  Volume2, 
  Search, 
  Star, 
  BookOpen, 
  TrendingUp, 
  Award,
  ChevronLeft
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { InlineAd } from "@/components/ads/InlineAd";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user } = useAuth();
  const router = useRouter();
  
  // State variables for novels
  const [featuredNovels, setFeaturedNovels] = useState<Novel[]>([]);
  const [updatedNovels, setUpdatedNovels] = useState<Novel[]>([]);
  const [completedNovels, setCompletedNovels] = useState<Novel[]>([]);
  const [popularNovels, setPopularNovels] = useState<Novel[]>([]);
  const [audioNovels, setAudioNovels] = useState<Novel[]>([]);
  const [genres, setGenres] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  
  // Pagination and Loading States
  const [updatePage, setUpdatePage] = useState(1);
  const [updateTotalPages, setUpdateTotalPages] = useState(1);
  const [loadingUpdated, setLoadingUpdated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Sidebar search input
  const [searchQuery, setSearchQuery] = useState("");

  // Feedback Modal State
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackReason, setFeedbackReason] = useState("Góp ý hệ thống");
  const [feedbackDescription, setFeedbackDescription] = useState("");
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  const handleFeedbackSubmit = async () => {
    if (!feedbackDescription.trim()) {
      toast.error("Vui lòng nhập nội dung ý kiến đóng góp");
      return;
    }
    setFeedbackLoading(true);
    try {
      const res = await createReportService(undefined, undefined, feedbackReason, feedbackDescription);
      if (res) {
        toast.success("Góp ý của bạn đã được gửi thành công! Cảm ơn bạn.");
        setIsFeedbackOpen(false);
        setFeedbackDescription("");
      } else {
        toast.error("Vui lòng đăng nhập để gửi góp ý");
      }
    } catch (e) {
      toast.error("Có lỗi xảy ra khi gửi ý kiến đóng góp");
    } finally {
      setFeedbackLoading(false);
    }
  };

  // Helper: Stable Rating generator based on ID/Title
  const getNovelRating = (novel: Novel) => {
    let hash = 0;
    const str = novel._id || novel.title || "";
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const score = 3.8 + (Math.abs(hash) % 13) / 10;
    return Math.min(5, score).toFixed(1);
  };

  // Helper: Format Date to vi-VN
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "05/05/2026";
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN');
    } catch (e) {
      return "05/05/2026";
    }
  };

  // Fetch paginated "Mới cập nhật" novels
  const fetchUpdatedNovels = async (page: number) => {
    setLoadingUpdated(true);
    try {
      const res = await getPublicNovelsService({ page, limit: 10, sort: 'updated' });
      if (res?.novels) {
        setUpdatedNovels(res.novels);
        setUpdateTotalPages(res.totalPages || 1);
      }
    } catch (e) {
      console.error("Failed to fetch updated novels", e);
    } finally {
      setLoadingUpdated(false);
    }
  };

  // Initial Data Fetching
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch primary resources concurrently to eliminate waterfalls
        const [
          featuredRes,
          completedRes,
          popularRes,
          genresRes,
          updatedRes,
          newestRes
        ] = await Promise.all([
          getPublicNovelsService({ isFeatured: true, limit: 10 }),
          getPublicNovelsService({ status: 'completed', limit: 6 }),
          getPublicNovelsService({ limit: 10, sort: 'popular' }),
          getPublicGenresService(),
          getPublicNovelsService({ page: 1, limit: 10, sort: 'updated' }),
          getPublicNovelsService({ limit: 6, sort: 'newest' })
        ]);

        // 1. Featured Novels for Recommended Banner
        if (featuredRes?.novels && featuredRes.novels.length > 0) {
          setFeaturedNovels(featuredRes.novels);
        } else if (popularRes?.novels) {
          setFeaturedNovels(popularRes.novels);
        }

        // 2. Initial page of Mới Cập Nhật
        if (updatedRes?.novels) {
          setUpdatedNovels(updatedRes.novels);
          setUpdateTotalPages(updatedRes.totalPages || 1);
        }

        // 3. Completed Novels ("Truyện Hoàn")
        if (completedRes?.novels && completedRes.novels.length > 0) {
          setCompletedNovels(completedRes.novels);
        } else if (newestRes?.novels) {
          setCompletedNovels(newestRes.novels);
        }

        // 4. Popular Novels for Sidebar Trending
        if (popularRes?.novels) {
          setPopularNovels(popularRes.novels.slice(0, 5));
        }

        // 5. Public Genres for Tag Cloud
        if (Array.isArray(genresRes)) {
          setGenres(genresRes.slice(0, 12));
        }

        // 6. Audio Novels for bottom showcase (reuse popular list to avoid redundant API request)
        if (popularRes?.novels) {
          setAudioNovels(popularRes.novels.slice(0, 5));
        }

      } catch (error) {
        console.error("Error fetching novels:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch history when user auth changes
  useEffect(() => {
    if (user) {
      getLibraryService('history').then(res => {
        if (Array.isArray(res)) {
          // Bỏ qua mục lịch sử trỏ tới truyện đã bị xóa (novel = null sau populate)
          setHistory(res.filter((item: any) => item?.novel).slice(0, 4));
        }
      }).catch(err => console.error("Failed to fetch history", err));
    } else {
      setHistory([]);
    }
  }, [user]);

  // Handle sidebar search submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Helper for Genres formatting
  const formatGenres = (genres?: any[]) => {
    if (!genres || genres.length === 0) {
      return [{ name: "Chưa phân loại", url: "/" }];
    }
    return genres.map(genre => {
        const name = typeof genre === 'string' ? genre : genre.name;
        const slug = typeof genre === 'string' ? genre : (genre.slug || genre.name);
        return { 
            name: name, 
            url: `/search?genre=${encodeURIComponent(slug)}` 
        };
    });
  };

  // Render Stars Helper
  const renderStars = (ratingStr: string) => {
    const rating = parseFloat(ratingStr);
    const fullStars = Math.round(rating);
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-3.5 h-3.5 ${
              i < fullStars 
                ? "fill-amber-400 text-amber-400" 
                : "text-zinc-200 dark:text-zinc-800"
            }`} 
          />
        ))}
      </div>
    );
  };

  // Page selection logic for Mới cập nhật pagination
  const handlePageChange = (pageNum: number) => {
    if (pageNum < 1 || pageNum > updateTotalPages) return;
    setUpdatePage(pageNum);
    fetchUpdatedNovels(pageNum);
  };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    let start = Math.max(1, updatePage - Math.floor(maxVisible / 2));
    let end = Math.min(updateTotalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="w-full flex flex-col items-center bg-background text-foreground transition-colors duration-300">
      
      {/* 1. Recommended Banner Section */}
      <section className="container mx-auto py-8 px-4">
        {loading ? (
          <div className="w-full h-48 bg-pink-100/30 dark:bg-zinc-900/40 rounded-2xl animate-pulse flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <RecommendedBanner novels={featuredNovels} />
        )}
      </section>

      {/* 2. Reading History Section */}
      {history.length > 0 && (
        <section className="container mx-auto px-4 pb-6">
          <div className="bg-pink-50/20 border border-pink-100/10 dark:bg-zinc-900/40 dark:border-zinc-800/80 rounded-2xl p-6 backdrop-blur shadow-sm">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
              <Clock className="w-5 h-5 text-primary animate-pulse" />
              Đọc tiếp gần đây
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {history.map((item) => (
                <div key={item._id} className="flex gap-3 bg-white/95 dark:bg-zinc-950/40 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/30 hover:border-primary/30 transition-all hover:scale-[1.02] group">
                  <div className="relative w-12 h-18 rounded overflow-hidden flex-shrink-0 bg-muted border border-zinc-200/20">
                    <Image
                      src={item.novel?.image || "/ANIMENETFLIX-FA.webp"}
                      alt={item.novel?.title || "Truyện"}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h3 className="font-semibold text-sm text-zinc-800 dark:text-zinc-200 truncate group-hover:text-primary transition-colors" title={item.novel?.title}>
                        {item.novel?.title}
                      </h3>
                      <p className="text-[10px] text-muted-foreground truncate">
                        Chương {item.lastReadChapter?.chapterNumber || 1}: {item.lastReadChapter?.title || "Bắt đầu đọc"}
                      </p>
                    </div>
                    <Link
                      href={`/novel/${item.novel?.slug || item.novel?._id}/chapter/${item.lastReadChapter?.chapterNumber || 1}`}
                      className="text-xs text-primary font-medium flex items-center gap-1 hover:underline mt-1"
                    >
                      Đọc tiếp
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 3. Main Two-Column Content Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Main lists (70-75%) */}
          <div className="lg:col-span-8 flex flex-col gap-12">
            
            {/* MỚI CẬP NHẬT */}
            <div className="w-full">
              <div className="flex items-center gap-2 mb-6 border-b border-zinc-200/40 dark:border-zinc-800 pb-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
                  <Award className="w-4 h-4" />
                </span>
                <h2 className="text-xl font-bold uppercase text-zinc-800 dark:text-zinc-200 tracking-tight">Mới cập nhật</h2>
              </div>

              {loadingUpdated ? (
                <div className="flex justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : updatedNovels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {updatedNovels.map((novel) => {
                    const novelId = novel.slug || novel._id || novel.id || "";
                    const rating = getNovelRating(novel);
                    const chaptersCount = novel.chapters || 0;
                    return (
                      <div key={novelId} className="flex gap-4 p-4 bg-white/95 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/30 rounded-2xl shadow-sm hover:shadow hover:border-primary/25 dark:hover:border-primary/35 transition-all duration-300 group">
                        {/* Cover image */}
                        <Link href={`/novel/${novelId}`} className="relative w-20 h-28 rounded-xl overflow-hidden flex-shrink-0 bg-muted border border-zinc-200/20">
                          {novel.image || novel.coverImage ? (
                            <Image
                              src={novel.image || novel.coverImage || ""}
                              alt={novel.title}
                              fill
                              sizes="80px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/5">
                              <BookOpen className="h-8 w-8 text-primary/30" />
                            </div>
                          )}
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                          <div className="space-y-1">
                            {/* Author */}
                            <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500">
                              <span className="w-4 h-4 rounded-full bg-primary/10 flex items-center justify-center text-[9px] text-primary font-bold">
                                {novel.author && typeof novel.author === 'object' ? (novel.author as any).username?.charAt(0).toUpperCase() : 'A'}
                              </span>
                              <span className="text-xs truncate font-medium">
                                {novel.author && typeof novel.author === 'object' ? (novel.author as any).username : 'Ẩn danh'}
                              </span>
                            </div>
                            
                            {/* Title */}
                            <Link href={`/novel/${novelId}`}>
                              <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-tight hover:text-primary dark:hover:text-primary transition-colors cursor-pointer" title={novel.title}>
                                {novel.title}
                              </h3>
                            </Link>

                            {/* Stars */}
                            <div className="flex items-center gap-2 pt-0.5">
                              {renderStars(rating)}
                              <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">{rating}</span>
                            </div>
                          </div>

                          {/* Latest two chapters */}
                          <div className="flex flex-col gap-1 mt-2.5">
                            {chaptersCount > 0 ? (
                              <>
                                <div className="flex items-center justify-between text-[11px]">
                                  <Link 
                                    href={`/novel/${novelId}/chapter/${chaptersCount}`}
                                    className="font-semibold text-zinc-600 dark:text-zinc-300 hover:text-primary dark:hover:text-primary transition-colors bg-zinc-100/50 dark:bg-zinc-900/60 px-2 py-0.5 rounded border border-zinc-200/10"
                                  >
                                    Chương {chaptersCount}
                                  </Link>
                                  <span className="text-zinc-400 dark:text-zinc-500 font-medium">{formatDate(novel.updatedAt)}</span>
                                </div>
                                {chaptersCount > 1 && (
                                  <div className="flex items-center justify-between text-[11px]">
                                    <Link 
                                      href={`/novel/${novelId}/chapter/${chaptersCount - 1}`}
                                      className="text-zinc-500 dark:text-zinc-400 hover:text-primary dark:hover:text-primary transition-colors bg-zinc-100/20 dark:bg-zinc-900/20 px-2 py-0.5 rounded"
                                    >
                                      Chương {chaptersCount - 1}
                                    </Link>
                                    <span className="text-zinc-400/70 dark:text-zinc-500/70 font-medium">{formatDate(novel.createdAt)}</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <Link 
                                href={`/novel/${novelId}`}
                                className="text-[11px] font-semibold text-primary dark:text-primary hover:underline bg-primary/5 px-2 py-1 rounded w-max"
                              >
                                Bắt đầu đọc
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  Chưa có truyện cập nhật mới
                </div>
              )}

              {/* PAGINATION */}
              {updateTotalPages > 1 && (
                <div className="flex justify-center items-center gap-1.5 mt-8 pt-4 border-t border-zinc-200/20 dark:border-zinc-800">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(updatePage - 1)}
                    disabled={updatePage === 1}
                    className="h-8 w-8 rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  {getPageNumbers().map((pageNum) => (
                    <Button
                      key={pageNum}
                      variant={pageNum === updatePage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className={`h-8 w-8 rounded-lg cursor-pointer ${
                        pageNum === updatePage
                          ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm font-bold"
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-foreground"
                      }`}
                    >
                      {pageNum}
                    </Button>
                  ))}
                  
                  {updateTotalPages > 5 && updatePage < updateTotalPages - 2 && (
                    <>
                      <span className="text-zinc-400 dark:text-zinc-600 px-1">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageChange(updateTotalPages)}
                        className="h-8 w-8 rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer text-zinc-700 dark:text-foreground"
                      >
                        {updateTotalPages}
                      </Button>
                    </>
                  )}

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(updatePage + 1)}
                    disabled={updatePage === updateTotalPages}
                    className="h-8 w-8 rounded-lg border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* TRUYỆN HOÀN */}
            <div className="w-full">
              <div className="flex items-center gap-2 mb-6 border-b border-zinc-200/40 dark:border-zinc-800 pb-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-primary/10 text-primary">
                  <Award className="w-4 h-4" />
                </span>
                <h2 className="text-xl font-bold uppercase text-zinc-800 dark:text-zinc-200 tracking-tight">Truyện Hoàn</h2>
              </div>

              {completedNovels.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedNovels.map((novel) => {
                    const novelId = novel.slug || novel._id || novel.id || "";
                    const rating = getNovelRating(novel);
                    return (
                      <div key={novelId} className="flex gap-4 p-3.5 bg-white/95 dark:bg-zinc-950/40 border border-zinc-200/60 dark:border-zinc-800/30 rounded-2xl shadow-sm hover:shadow hover:border-primary/20 dark:hover:border-primary/30 transition-all duration-300 group">
                        {/* Cover image */}
                        <Link href={`/novel/${novelId}`} className="relative w-16 h-22 rounded-xl overflow-hidden flex-shrink-0 bg-muted border border-zinc-200/20">
                          {novel.image || novel.coverImage ? (
                            <Image
                              src={novel.image || novel.coverImage || ""}
                              alt={novel.title}
                              fill
                              sizes="64px"
                              className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-primary/5">
                              <BookOpen className="h-6 w-6 text-primary/30" />
                            </div>
                          )}
                        </Link>

                        {/* Details */}
                        <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5 py-0.5">
                          <Link href={`/novel/${novelId}`}>
                            <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-tight hover:text-primary dark:hover:text-primary transition-colors cursor-pointer" title={novel.title}>
                              {novel.title}
                            </h3>
                          </Link>

                          {/* Stars */}
                          <div className="flex items-center gap-2">
                            {renderStars(rating)}
                            <span className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400">{rating}</span>
                          </div>
                          
                          <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                            Đã hoàn thành • {novel.chapters || 0} chương
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
                  Chưa có dữ liệu truyện hoàn thành
                </div>
              )}
            </div>

          </div>
          
          {/* RIGHT COLUMN: Sidebar widgets (25-30%) */}
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
                    const novelId = novel.slug || novel._id || novel.id || "";
                    const rank = index + 1;
                    return (
                      <div key={novelId} className="flex items-center gap-3 group">
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
                        <Link href={`/novel/${novelId}`} className="flex-1 min-w-0">
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
      </section>

      {/* 4. Audio Novels Showcase Section */}
      {audioNovels.length > 0 && (
        <section className="container mx-auto px-4 py-12 border-t border-zinc-200/20 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary animate-pulse border border-primary/20">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2 text-zinc-800 dark:text-zinc-100">
                Thế giới Audio
                <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-bounce">Hot</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Nghe truyện Audio chất lượng cao, giọng đọc truyền cảm tự nhiên.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {audioNovels.map((novel) => {
              const novelId = novel.slug || novel._id || novel.id || "";
              return (
                <Link href={`/novel/${novelId}`} key={novelId} className="group">
                  <div className="bg-zinc-50 border border-zinc-200 dark:bg-zinc-900/40 dark:border-zinc-800/80 rounded-xl overflow-hidden p-3 hover:border-primary/40 transition-all hover:scale-[1.02] shadow-sm hover:shadow-md h-full flex flex-col justify-between">
                    <div>
                      <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-3">
                        <Image
                          src={novel.image || novel.coverImage || "/ANIMENETFLIX-FA.webp"}
                          alt={novel.title}
                          fill
                          sizes="(max-width: 768px) 50vw, 20vw"
                          className="object-cover group-hover:brightness-110 transition-all"
                        />
                        {/* Glowing Audio Tag */}
                        <div className="absolute top-2 right-2 bg-black/80 backdrop-blur text-primary text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 border border-primary/30 shadow-lg">
                          <Volume2 className="w-3 h-3 animate-pulse" />
                          AUDIO
                        </div>
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-semibold text-sm leading-tight text-zinc-800 dark:text-zinc-250 truncate group-hover:text-primary transition-colors" title={novel.title}>
                          {novel.title}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">{novel.author && typeof novel.author === 'object' ? (novel.author as any).username : 'Ẩn danh'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-primary/80 bg-primary/5 border border-primary/10 rounded px-1.5 py-0.5 mt-3 w-max">
                      <Headphones className="w-3 h-3" />
                      Nghe ngay
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {/* 5. Sponsor Advertisement */}
      <section className="container mx-auto px-4 py-4">
        <InlineAd />
      </section>
      
      {/* 6. Feedback Banner Section */}
      <section className="w-full bg-muted/30 py-16 mt-8 border-t border-zinc-200/20 dark:border-zinc-800">
          <div className="container mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-4 text-zinc-800 dark:text-zinc-200">Bạn có ý kiến đóng góp?</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Chúng tôi luôn lắng nghe ý kiến của bạn để cải thiện trải nghiệm đọc truyện. 
                  Nếu bạn gặp lỗi hoặc có đề xuất tính năng mới, hãy cho chúng tôi biết nhé!
              </p>
              <div className="flex justify-center gap-4">
                  <Button 
                      onClick={() => setIsFeedbackOpen(true)}
                      className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 cursor-pointer font-medium shadow"
                  >
                      Gửi góp ý trực tiếp
                  </Button>
                  <a 
                      href="mailto:support@wtfnovel.com"
                      className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-11 px-8"
                  >
                      Liên hệ hỗ trợ
                  </a>
              </div>
          </div>
      </section>

      {/* System Feedback Dialog Modal */}
      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
          <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                      <Volume2 className="h-5 w-5 text-primary" />
                      Gửi ý kiến đóng góp
                  </DialogTitle>
                  <DialogDescription>
                      Ý kiến của bạn sẽ được gửi trực tiếp đến ban quản trị để hoàn thiện hệ thống tốt hơn.
                  </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                      <label className="text-sm font-medium">Chủ đề đóng góp</label>
                      <Select value={feedbackReason} onValueChange={setFeedbackReason}>
                          <SelectTrigger>
                              <SelectValue placeholder="Chọn chủ đề" />
                          </SelectTrigger>
                          <SelectContent>
                              <SelectItem value="Góp ý hệ thống">Góp ý tính năng / Giao diện</SelectItem>
                              <SelectItem value="Lỗi kỹ thuật">Báo lỗi hệ thống / Lỗi load chậm</SelectItem>
                              <SelectItem value="Đề xuất nội dung">Yêu cầu thêm truyện / Bản dịch</SelectItem>
                              <SelectItem value="Hợp tác / Khác">Chủ đề khác</SelectItem>
                          </SelectContent>
                      </Select>
                  </div>
                  <div className="space-y-2">
                      <label className="text-sm font-medium">Nội dung chi tiết</label>
                      <Textarea 
                          placeholder="Hãy nhập ý kiến đóng góp chi tiết của bạn tại đây..." 
                          value={feedbackDescription}
                          onChange={(e) => setFeedbackDescription(e.target.value)}
                          className="min-h-[120px]"
                      />
                  </div>
              </div>
              <DialogFooter>
                  <Button variant="ghost" onClick={() => setIsFeedbackOpen(false)} disabled={feedbackLoading} className="cursor-pointer">Hủy</Button>
                  <Button onClick={handleFeedbackSubmit} disabled={feedbackLoading} className="bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer">
                      {feedbackLoading ? "Đang gửi..." : "Gửi góp ý"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

    </div>
  );
}
