import type { Metadata, ResolvingMetadata } from "next";
import GenreClient from "@/components/GenreClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { slug } = await params;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://goctruyen.wtfdev.qzz.io";
  const genreName = slug ? slug.replace(/-/g, " ") : "thể loại";
  const formattedName = genreName.charAt(0).toUpperCase() + genreName.slice(1);

  const title = `Truyện ${formattedName} Hay Nhất - Đọc Online | Góc Truyện`;
  const description = `Danh sách truyện thuộc thể loại ${genreName} chọn lọc hay nhất, đọc truyện online miễn phí chất lượng cao tại Góc Truyện.`;
  const canonicalUrl = `${siteUrl}/genre/${slug}`;

  return {
    title,
    description,
    keywords: [
      `truyện ${genreName}`,
      `thể loại ${genreName}`,
      `đọc truyện ${genreName}`,
      "đọc truyện online",
      "Góc Truyện"
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Góc Truyện",
      locale: "vi_VN",
      type: "website",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
  };
}

export default async function GenrePage() {
  return <GenreClient />;
}
