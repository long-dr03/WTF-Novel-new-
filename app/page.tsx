import HomeClient, { HomeInitialData } from "@/components/HomeClient";
import { getPublicNovelsService, getPublicGenresService } from "@/services/novelService";

// ISR: dữ liệu trang chủ là công khai nên tái tạo tĩnh tối đa mỗi 60s.
// => TTFB/LCP nhanh (HTML có sẵn nội dung), không còn 6 request client sau hydrate.
export const revalidate = 60;

const EMPTY: HomeInitialData = {
  featuredNovels: [],
  updatedNovels: [],
  completedNovels: [],
  popularNovels: [],
  audioNovels: [],
  genres: [],
  updateTotalPages: 1,
  hydratedFromServer: false,
};

/**
 * Lấy toàn bộ dữ liệu trang chủ ở phía server (mirror logic fetchData cũ ở client).
 * Nếu không gọi được API (vd. lúc build khi server chưa chạy) -> trả về EMPTY để
 * HomeClient tự fetch lại phía client (degrade an toàn, giữ nguyên hành vi cũ).
 */
async function loadHomeData(): Promise<HomeInitialData> {
  try {
    const [featuredRes, completedRes, popularRes, genresRes, updatedRes, newestRes] =
      await Promise.all([
        getPublicNovelsService({ isFeatured: true, limit: 10 }),
        getPublicNovelsService({ status: "completed", limit: 6 }),
        getPublicNovelsService({ limit: 10, sort: "popular" }),
        getPublicGenresService(),
        getPublicNovelsService({ page: 1, limit: 10, sort: "updated" }),
        getPublicNovelsService({ limit: 6, sort: "newest" }),
      ]);

    // Không nhận được phản hồi nào (server không gọi được chính API của nó) -> fallback client
    if (!updatedRes && !popularRes && !featuredRes) {
      return EMPTY;
    }

    const popular = popularRes?.novels ?? [];
    const featured =
      featuredRes?.novels && featuredRes.novels.length > 0 ? featuredRes.novels : popular;
    const completed =
      completedRes?.novels && completedRes.novels.length > 0
        ? completedRes.novels
        : newestRes?.novels ?? [];

    return {
      featuredNovels: featured,
      updatedNovels: updatedRes?.novels ?? [],
      completedNovels: completed,
      popularNovels: popular.slice(0, 5),
      audioNovels: popular.slice(0, 5),
      genres: Array.isArray(genresRes) ? genresRes.slice(0, 12) : [],
      updateTotalPages: updatedRes?.totalPages ?? 1,
      hydratedFromServer: true,
    };
  } catch (e) {
    console.error("Home SSR data load failed, falling back to client fetch:", e);
    return EMPTY;
  }
}

export default async function Home() {
  const initial = await loadHomeData();
  return <HomeClient initial={initial} />;
}
