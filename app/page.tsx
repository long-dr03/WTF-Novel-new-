import type { Metadata } from "next";
import HomeClient, { HomeInitialData } from "@/components/HomeClient";
import { callController } from "@/server/callController";
import { getPublicNovels, getPublicGenres } from "@/server/controllers/getNovel";

export const metadata: Metadata = {
  title: "Góc Truyện - Nền tảng đọc & nghe truyện online miễn phí",
  description: "Đọc truyện online, nghe truyện audio mới nhất với kho truyện ngôn tình, tiên hiệp, kiếm hiệp, đô thị phong phú. Cập nhật liên tục 24/7.",
  alternates: {
    canonical: "/",
  },
};

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

// Gọi controller getPublicNovels TRỰC TIẾP (không qua HTTP) và lấy phần data.
async function fetchNovels(query: Record<string, any>) {
  const r = await callController(getPublicNovels, { query: { includeTotal: "false", ...query } });
  return r?.success ? r.data : null; // { novels, total, page, pages }
}

/**
 * Lấy toàn bộ dữ liệu trang chủ ở phía server bằng cách gọi thẳng controller
 * (không self-fetch qua localhost -> hết ECONNREFUSED, nhanh hơn).
 * Nếu có lỗi -> trả EMPTY để HomeClient tự fetch phía client (degrade an toàn).
 */
async function loadHomeData(): Promise<HomeInitialData> {
  try {
    const [featuredRes, completedRes, popularRes, genresRes, updatedRes, newestRes] =
      await Promise.all([
        fetchNovels({ isFeatured: "true", limit: "10" }),
        fetchNovels({ status: "completed", limit: "6" }),
        fetchNovels({ limit: "10", sort: "popular" }),
        callController(getPublicGenres).then((r) => (r?.success ? r.data : [])),
        fetchNovels({ page: "1", limit: "10", sort: "updated", includeTotal: "true" }),
        fetchNovels({ limit: "6", sort: "newest" }),
      ]);

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
      updateTotalPages: updatedRes?.pages ?? 1,
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
