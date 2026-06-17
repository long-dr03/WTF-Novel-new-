"use client"

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Banner_carousel } from "@/components/carousel";
import CardNovel from "@/components/cardNovel";
import GooeyNav from "@/components/GooeyNav/GooeyNav";
import { getPopularNovelsService, getPublicNovelsService, getLibraryService, createReportService, Novel } from "@/services/novelService";
import { useAuth } from "@/components/providers/AuthProvider";
import { Loader2, Clock, ChevronRight, Headphones, Volume2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { InlineAd } from "@/components/ads/InlineAd";

// Các tab danh mục
const categoryTabs = [
  { label: "Tất cả", href: "#all", slug: "" },
  { label: "Tiên Hiệp", href: "#tienhiep", slug: "tien-hiep" },
  { label: "Kiếm Hiệp", href: "#kiemhiep", slug: "kiem-hiep" },
  { label: "Ngôn Tình", href: "#ngontinh", slug: "ngon-tinh" },
  { label: "Hệ Thống", href: "#hethong", slug: "he-thong" },
  { label: "Huyền Huyễn", href: "#huyenhuyen", slug: "huyen-huyen" },
];

// Các tab xếp hạng
const rankingTabs = [
  { label: "Đọc nhiều", href: "#docnhieu", sort: "popular" },
  { label: "Mới cập nhật", href: "#moicapnhat", sort: "updated" },
  { label: "Truyện mới", href: "#truyenmoi", sort: "newest" },
];

// Các tab thể loại hot
const hotGenreTabs = [
  { label: "Tiên Hiệp", href: "#tienhiep", slug: "tien-hiep" },
  { label: "Kiếm Hiệp", href: "#kiemhiep", slug: "kiem-hiep" },
  { label: "Ngôn Tình", href: "#ngontinh", slug: "ngon-tinh" },
  { label: "Huyền Huyễn", href: "#huyenhuyen", slug: "huyen-huyen" },
  { label: "Hệ Thống", href: "#hethong", slug: "he-thong" },
];

export default function Home() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeRanking, setActiveRanking] = useState(0);
  const [activeHotGenre, setActiveHotGenre] = useState(0);
  
  // State cho dữ liệu truyện
  const [latestNovels, setLatestNovels] = useState<Novel[]>([]);
  const [popularNovels, setPopularNovels] = useState<Novel[]>([]);
  const [hotGenreNovels, setHotGenreNovels] = useState<Novel[]>([]);
  const [featuredNovels, setFeaturedNovels] = useState<Novel[]>([]);
  const [recentlyUpdatedNovels, setRecentlyUpdatedNovels] = useState<Novel[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [audioNovels, setAudioNovels] = useState<Novel[]>([]);
  
  const [loadingCategory, setLoadingCategory] = useState(false);
  const [loadingRanking, setLoadingRanking] = useState(false);
  const [loadingHotGenre, setLoadingHotGenre] = useState(false);
  const [loading, setLoading] = useState(true);

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

  // Fetch Category Novels
  const fetchCategoryNovels = async (slug: string) => {
    setLoadingCategory(true);
    try {
      const res = await getPublicNovelsService({ limit: 8, sort: 'newest', genre: slug || undefined });
      if (res?.novels) setLatestNovels(res.novels);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingCategory(false);
    }
  };

  // Fetch Ranking Novels
  const fetchRankingNovels = async (sort: string) => {
    setLoadingRanking(true);
    try {
      const res = await getPublicNovelsService({ limit: 4, sort });
      if (res?.novels) setPopularNovels(res.novels);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingRanking(false);
    }
  };

  // Fetch Hot Genre Novels
  const fetchHotGenreNovels = async (slug: string) => {
    setLoadingHotGenre(true);
    try {
      const res = await getPublicNovelsService({ limit: 8, sort: 'popular', genre: slug });
      if (res?.novels) setHotGenreNovels(res.novels);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHotGenre(false);
    }
  };

  // Fetch data khi component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Featured Novels for Carousel
        const featuredRes = await getPublicNovelsService({ isFeatured: true, limit: 5 });
        if (featuredRes?.novels) {
            setFeaturedNovels(featuredRes.novels);
        }

        // Initial latest novels (All category)
        const latestRes = await getPublicNovelsService({ limit: 8, sort: 'newest' });
        if (latestRes?.novels) setLatestNovels(latestRes.novels);

        // Initial ranking novels (Đọc nhiều)
        const popularRes = await getPublicNovelsService({ limit: 4, sort: 'popular' });
        if (popularRes?.novels) setPopularNovels(popularRes.novels);

        // Initial hot genre (Tiên hiệp)
        const hotRes = await getPublicNovelsService({ limit: 8, sort: 'popular', genre: 'tien-hiep' });
        if (hotRes?.novels) setHotGenreNovels(hotRes.novels);

        // Recently Updated Novels
        const updatedRes = await getPublicNovelsService({ limit: 4, sort: 'updated' });
        if (updatedRes?.novels) setRecentlyUpdatedNovels(updatedRes.novels);

        // Audio Novels for showcase (most popular novels with audio simulation)
        const audioRes = await getPublicNovelsService({ limit: 5, sort: 'popular' });
        if (audioRes?.novels) setAudioNovels(audioRes.novels);

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
          setHistory(res.slice(0, 4));
        }
      }).catch(err => console.error("Failed to fetch history", err));
    } else {
      setHistory([]);
    }
  }, [user]);

  // Helper function để chuyển đổi genres từ string[] sang format cần thiết
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
        }; // Update url to search page
    });
  };

  return (
    <div className="w-full flex flex-col items-center">
      <section className="w-full max-w-[1300px] py-8 px-4">
        <Banner_carousel novels={featuredNovels} />
      </section>

      {/* Lịch sử đọc gần đây */}
      {history.length > 0 && (
        <section className="w-full max-w-[1300px] px-4 py-6">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary animate-pulse" />
              Đọc tiếp gần đây
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {history.map((item) => (
                <div key={item._id} className="flex gap-3 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/30 hover:border-primary/30 transition-all hover:scale-[1.02] group">
                  <div className="relative w-12 h-18 rounded overflow-hidden flex-shrink-0 bg-muted">
                    <Image
                      src={item.novel?.image || "/ANIMENETFLIX-FA.webp"}
                      alt={item.novel?.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                    <div>
                      <h3 className="font-semibold text-sm truncate group-hover:text-primary transition-colors" title={item.novel?.title}>
                        {item.novel?.title}
                      </h3>
                      <p className="text-[10px] text-muted-foreground truncate">
                        Chương {item.lastReadChapter?.chapterNumber || 1}: {item.lastReadChapter?.title || "Bắt đầu đọc"}
                      </p>
                    </div>
                    <Link
                      href={`/novel/${item.novel?._id}/chapter/${item.lastReadChapter?.chapterNumber || 1}`}
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

      {/* Section Danh mục với GooeyNav */}
      <section className="w-full max-w-[1300px] px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h2 className="text-3xl font-bold">Truyện mới nhất</h2>

          <GooeyNav
            items={categoryTabs}
            animationTime={600}
            particleCount={15}
            particleDistances={[90, 10]}
            particleR={100}
            timeVariance={300}
            colors={[1, 2, 3]}
            initialActiveIndex={activeCategory}
            onChange={(idx) => {
              setActiveCategory(idx);
              fetchCategoryNovels(categoryTabs[idx].slug);
            }}
          />

        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loadingCategory ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : latestNovels.length > 0 ? (
            latestNovels.map((novel) => (
              <CardNovel 
                key={novel._id || novel.id}
                novelId={novel._id || novel.id}
                coverImage={novel.image || novel.coverImage || "/ANIMENETFLIX-FA.webp"} 
                title={novel.title} 
                genres={formatGenres(novel.genres)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Chưa có truyện nào
            </div>
          )}
        </div>
      </section>

      {/* Section Xếp hạng với GooeyNav */}
      <section className="w-full max-w-[1300px] px-4 py-12 bg-gradient-to-b from-transparent via-slate-900/50 to-transparent">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h2 className="text-3xl font-bold">Bảng xếp hạng</h2>

          <GooeyNav
            items={rankingTabs}
            animationTime={500}
            particleCount={20}
            particleDistances={[80, 15]}
            particleR={80}
            timeVariance={250}
            colors={[2, 3, 4, 2, 3, 4, 2, 1]}
            initialActiveIndex={activeRanking}
            onChange={(idx) => {
              setActiveRanking(idx);
              fetchRankingNovels(rankingTabs[idx].sort);
            }}
          />

        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loadingRanking ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : popularNovels.length > 0 ? (
            popularNovels.map((novel) => (
              <CardNovel 
                key={novel._id || novel.id}
                novelId={novel._id || novel.id}
                coverImage={novel.image || novel.coverImage || "/ANIMENETFLIX-FA.webp"} 
                title={novel.title} 
                genres={formatGenres(novel.genres)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Chưa có truyện nào
            </div>
          )}
        </div>
      </section>

      {/* Section Thể loại hot */}
      <section className="w-full max-w-[1300px] px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h2 className="text-3xl font-bold">Thể loại hot</h2>

          <GooeyNav
            items={hotGenreTabs}
            animationTime={550}
            particleCount={18}
            particleDistances={[85, 12]}
            particleR={90}
            timeVariance={280}
            colors={[3, 1, 4, 3, 1, 4, 3, 2]}
            initialActiveIndex={activeHotGenre}
            onChange={(idx) => {
              setActiveHotGenre(idx);
              fetchHotGenreNovels(hotGenreTabs[idx].slug);
            }}
          />

        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loadingHotGenre ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : hotGenreNovels.length > 0 ? (
            hotGenreNovels.map((novel) => (
              <CardNovel 
                key={novel._id || novel.id}
                novelId={novel._id || novel.id}
                coverImage={novel.image || novel.coverImage || "/ANIMENETFLIX-FA.webp"} 
                title={novel.title} 
                genres={formatGenres(novel.genres)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Chưa có truyện nào
            </div>
          )}
        </div>
      </section>

      {/* Section Thế giới Audio */}
      {audioNovels.length > 0 && (
        <section className="w-full max-w-[1300px] px-4 py-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2.5 bg-primary/10 rounded-xl text-primary animate-pulse border border-primary/20">
              <Headphones className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl font-bold flex items-center gap-2">
                Thế giới Audio
                <span className="text-[10px] bg-red-600 text-white font-bold px-2 py-0.5 rounded-full uppercase tracking-wider animate-bounce">Hot</span>
              </h2>
              <p className="text-sm text-muted-foreground mt-1">Nghe truyện Audio chất lượng cao, giọng đọc truyền cảm tự nhiên.</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {audioNovels.map((novel) => (
              <Link href={`/novel/${novel._id || novel.id}`} key={novel._id || novel.id} className="group">
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl overflow-hidden p-3 hover:border-primary/40 transition-all hover:scale-[1.02] shadow-xl">
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
                    <h3 className="font-semibold text-sm leading-tight truncate group-hover:text-primary transition-colors" title={novel.title}>
                      {novel.title}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">{novel.author && typeof novel.author === 'object' ? (novel.author as any).username : 'Ẩn danh'}</p>
                    <div className="flex items-center gap-1.5 text-[10px] text-primary/80 bg-primary/5 border border-primary/10 rounded px-1.5 py-0.5 mt-2 w-max">
                      <Headphones className="w-3 h-3" />
                      Nghe ngay
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quảng cáo tài trợ */}
      <section className="w-full max-w-[1300px] px-4 py-4">
        <InlineAd />
      </section>
      
      {/* Section Mới cập nhật (using existing API for now) */}
       <section className="w-full max-w-[1300px] px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h2 className="text-3xl font-bold">Mới cập nhật</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
             <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recentlyUpdatedNovels.length > 0 ? (
            recentlyUpdatedNovels.slice(0, 4).map((novel) => (
              <CardNovel 
                key={novel._id || novel.id}
                novelId={novel._id || novel.id}
                coverImage={novel.image || novel.coverImage || "/ANIMENETFLIX-FA.webp"} 
                title={novel.title} 
                genres={formatGenres(novel.genres)}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-12 text-muted-foreground">
              Chưa có truyện nào
            </div>
          )}
        </div>
      </section>

      {/* Section Góp ý / Báo lỗi */}
      <section className="w-full bg-muted/30 py-16 mt-8">
          <div className="max-w-[1300px] mx-auto px-4 text-center">
              <h2 className="text-3xl font-bold mb-4">Bạn có ý kiến đóng góp?</h2>
              <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
                  Chúng tôi luôn lắng nghe ý kiến của bạn để cải thiện trải nghiệm đọc truyện. 
                  Nếu bạn gặp lỗi hoặc có đề xuất tính năng mới, hãy cho chúng tôi biết nhé!
              </p>
              <div className="flex justify-center gap-4">
                  <Button 
                      onClick={() => setIsFeedbackOpen(true)}
                      className="rounded-full bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 cursor-pointer font-medium"
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
                  <Button variant="ghost" onClick={() => setIsFeedbackOpen(false)} disabled={feedbackLoading}>Hủy</Button>
                  <Button onClick={handleFeedbackSubmit} disabled={feedbackLoading} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      {feedbackLoading ? "Đang gửi..." : "Gửi góp ý"}
                  </Button>
              </DialogFooter>
          </DialogContent>
      </Dialog>

    </div>
  );
}
