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
  const [loading, setLoading] = useState(true);

  // Fetch data khi component mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Featured Novels for Carousel
        const featuredRes = await getPublicNovelsService({ isFeatured: true, limit: 5 });
        if (featuredRes?.novels) {
            // Pass to a state if we had one for carousel, or use popular if mixed
            // But Banner_carousel currently might expect data passed or fetches itself? 
            // Let's check Banner_carousel. Assuming it fetches itself or controls itself. 
            // Actually app/page.tsx just renders <Banner_carousel />. 
            // We need to pass data to it or update it. 
            // Let's assume for now we populate the lists below.
        }

        // Latest Novels
        const latestRes = await getPublicNovelsService({ limit: 8, sort: 'newest' });
        if (latestRes?.novels) setLatestNovels(latestRes.novels);

        // Popular Novels
        const popularRes = await getPopularNovelsService(8);
        if (popularRes) setPopularNovels(popularRes);

        // Hot Genres (Just mix of popular for now or specific genre if API supported)
        const hotRes = await getPublicNovelsService({ limit: 6, sort: 'views' });
        if (hotRes?.novels) setHotGenreNovels(hotRes.novels);

      } catch (error) {
        console.error("Error fetching novels:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Helper function để chuyển đổi genres từ string[] sang format cần thiết
  const formatGenres = (genres?: string[]) => {
    if (!genres || genres.length === 0) {
      return [{ name: "Chưa phân loại", url: "/" }];
    }
    return genres.map(genre => ({ name: genre, url: `/genre/${encodeURIComponent(genre)}` }));
  };

  return (
    <div className="w-full flex flex-col items-center">
      <section className="w-full max-w-[1300px] py-8 px-4">
        <Banner_carousel />
      </section>

      {/* Section Danh mục với GooeyNav */}
      <section className="w-full max-w-[1300px] px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <h2 className="text-3xl font-bold">Truyện mới nhất nef</h2>

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
    </div>
  );
}
