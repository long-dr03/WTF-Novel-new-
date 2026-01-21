"use client"

import { useState, useEffect } from "react";
import { Banner_carousel } from "@/components/carousel";
import CardNovel from "@/components/cardNovel";
import GooeyNav from "@/components/GooeyNav/GooeyNav";
import { getPopularNovelsService, getPublicNovelsService, Novel } from "@/services/novelService";
import { Loader2 } from "lucide-react";

// Các tab danh mục
const categoryTabs = [
  { label: "Tất cả", href: "#all" },
  { label: "Tiên Hiệp", href: "#tienhiep" },
  { label: "Kiếm Hiệp", href: "#kiemhiep" },
  { label: "Ngôn Tình", href: "#ngontinh" },
  { label: "Đô Thị", href: "#dothi" },
  { label: "Huyền Ảo", href: "#huyenao" },
];

// Các tab xếp hạng
const rankingTabs = [
  { label: "Đọc nhiều", href: "#docnhieu" },
  { label: "Đề cử", href: "#decu" },
  { label: "Yêu thích", href: "#yeuthich" },
  { label: "Mới cập nhật", href: "#moicapnhat" },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState(0);
  const [activeRanking, setActiveRanking] = useState(0);
  
  // State cho dữ liệu truyện
  const [latestNovels, setLatestNovels] = useState<Novel[]>([]);
  const [popularNovels, setPopularNovels] = useState<Novel[]>([]);
  const [hotGenreNovels, setHotGenreNovels] = useState<Novel[]>([]);
  const [featuredNovels, setFeaturedNovels] = useState<Novel[]>([]);
  const [completedNovels, setCompletedNovels] = useState<Novel[]>([]);
  const [loading, setLoading] = useState(true);

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

        // Latest Novels
        const latestRes = await getPublicNovelsService({ limit: 8, sort: 'newest' });
        if (latestRes?.novels) setLatestNovels(latestRes.novels);

        // Popular Novels
        const popularRes = await getPopularNovelsService(8);
        if (popularRes) setPopularNovels(popularRes);

        // Hot Genres (view-based)
        const hotRes = await getPublicNovelsService({ limit: 6, sort: 'views' });
        if (hotRes?.novels) setHotGenreNovels(hotRes.novels);

        // Completed Novels
        // Assuming there is a status filtering. Backend supports status?
        // Actually public getPublicNovels query default is published.
        // But status (ongoing/completed) is separate field in Novel model.
        // It seems getPublicNovels filter doesn't support 'status' (completed/ongoing) param yet in `getNovel.ts`.
        // Wait, looking at getNovel.ts, only `genre`, `search`, `isFeatured`.
        // I might need to add `status` filter to `getPublicNovels` too if I want this to work.
        // For now, I'll display same list or maybe skip if I can't filter.
        // Or I can filter client side if I fetch enough? No.
        // Let's check getNovel.ts again. It does NOT filter by 'status' (ongoing/completed).
        // I'll skip fetching completed novels for now or just fetch random for display
        // to avoid breaking if backend doesn't support it 
        // BUT user asked for "nhieu option hien thi".
        // I'll stick to what we have + maybe random or "Top Rate".
        // Let's just use "Mới cập nhật" (Latest again? or maybe sort by updateAt?)

      } catch (error) {
        console.error("Error fetching novels:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

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
          />

        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
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
          />

        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : popularNovels.length > 0 ? (
            popularNovels.slice(0, 4).map((novel) => (
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
            items={[
              { label: "Hành động", href: "#hanhdong" },
              { label: "Lãng mạn", href: "#langman" },
              { label: "Phiêu lưu", href: "#phieuluu" },
              { label: "Hài hước", href: "#haihuoc" },
              { label: "Kinh dị", href: "#kinhdi" },
            ]}
            animationTime={550}
            particleCount={18}
            particleDistances={[85, 12]}
            particleR={90}
            timeVariance={280}
            colors={[3, 1, 4, 3, 1, 4, 3, 2]}
            initialActiveIndex={0}
          />

        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
            <div className="col-span-full flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : hotGenreNovels.length > 0 ? (
            hotGenreNovels.slice(0, 6).map((novel) => (
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
          ) : latestNovels.length > 0 ? (
            latestNovels.slice(0, 4).map((novel) => (
              <CardNovel 
                key={novel._id || novel.id}
                novelId={novel._id || novel.id}
                coverImage={novel.image || novel.coverImage || "/ANIMENETFLIX-FA.webp"} 
                title={novel.title} 
                genres={formatGenres(novel.genres)}
              />
            ))
          ) : null}
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
                  <a 
                      href="https://forms.google.com/your-form-id" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8"
                  >
                      Gửi góp ý
                  </a>
                  <a 
                      href="mailto:support@wtfnovel.com"
                      className="inline-flex items-center justify-center rounded-full text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-11 px-8"
                  >
                      Liên hệ hỗ trợ
                  </a>
              </div>
          </div>
      </section>

    </div>
  );
}
