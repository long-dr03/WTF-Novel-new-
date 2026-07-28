import type { Metadata } from "next";
import SearchClient from "@/components/SearchClient";

export const metadata: Metadata = {
  title: "Tìm Kiếm Truyện Online | Góc Truyện",
  description: "Tìm kiếm truyện online theo tên truyện, tác giả, thể loại ngôn tình, tiên hiệp, kiếm hiệp, đô thị...",
  alternates: {
    canonical: "/search",
  },
  openGraph: {
    title: "Tìm Kiếm Truyện Online | Góc Truyện",
    description: "Tìm kiếm truyện online theo tên truyện, tác giả, thể loại...",
    url: "https://goctruyen.wtfdev.qzz.io/search",
    siteName: "Góc Truyện",
    type: "website",
  },
};

export default function SearchPage() {
  return <SearchClient />;
}
