import { cache } from "react";
import type { Metadata, ResolvingMetadata } from "next";
import NovelDetailClient from "@/components/NovelDetailClient";
import { callController } from "@/server/callController";
import { getNovelById } from "@/server/controllers/getNovel";

interface PageProps {
  params: Promise<{ novelId: string }>;
}

const fetchNovelData = cache(async function (novelId: string) {
  try {
    const res = await callController(getNovelById, { params: { id: novelId } });
    if (res?.success && res.data) {
      return res.data;
    }
  } catch (error) {
    console.error("Error fetching novel data on server:", error);
  }
  return null;
});

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { novelId } = await params;
  const novel = await fetchNovelData(novelId);

  if (!novel) {
    return {
      title: "Không tìm thấy truyện | Góc Truyện",
      description: "Truyện này không tồn tại hoặc đã bị xóa.",
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://goctruyen.wtfdev.qzz.io";
  const authorName = typeof novel.author === "string" ? novel.author : novel.author?.username || "Nhiều tác giả";
  const rawDesc = novel.description || "";
  const cleanDescription = rawDesc.length > 160 ? rawDesc.slice(0, 157) + "..." : rawDesc;
  const coverImage = novel.image || `${siteUrl}/logo.jpg`;
  const canonicalUrl = `${siteUrl}/novel/${novel.slug || novel._id}`;

  return {
    title: `${novel.title} - Đọc & Nghe Truyện Online`,
    description: cleanDescription || `Đọc truyện ${novel.title} của tác giả ${authorName} online miễn phí, cập nhật chương mới nhất nhanh chóng tại Góc Truyện.`,
    keywords: [
      novel.title,
      `đọc truyện ${novel.title}`,
      `nghe truyện ${novel.title}`,
      `tác giả ${authorName}`,
      "đọc truyện online",
      "Góc Truyện"
    ],
    authors: [{ name: authorName }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${novel.title} - Góc Truyện`,
      description: cleanDescription,
      url: canonicalUrl,
      siteName: "Góc Truyện",
      locale: "vi_VN",
      type: "article",
      images: [
        {
          url: coverImage,
          alt: novel.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${novel.title} - Góc Truyện`,
      description: cleanDescription,
      images: [coverImage],
    },
  };
}

export default async function NovelDetailPage({ params }: PageProps) {
  const { novelId } = await params;
  const novel = await fetchNovelData(novelId);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://goctruyen.wtfdev.qzz.io";

  const authorName = novel ? (typeof novel.author === "string" ? novel.author : novel.author?.username || "Nhiều tác giả") : "Góc Truyện";

  const bookJsonLd = novel
    ? {
        "@context": "https://schema.org",
        "@type": "Book",
        "name": novel.title,
        "description": novel.description,
        "image": novel.image || `${siteUrl}/logo.jpg`,
        "url": `${siteUrl}/novel/${novel.slug || novel._id}`,
        "author": {
          "@type": "Person",
          "name": authorName,
        },
        "publisher": {
          "@type": "Organization",
          "name": "Góc Truyện",
          "url": siteUrl,
        },
        "genre": Array.isArray(novel.genres)
          ? novel.genres.map((g: any) => (typeof g === "string" ? g : g.name))
          : [],
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": Math.max(5, Math.floor((novel.views || 0) / 50) + 1).toString(),
        },
      }
    : null;

  const breadcrumbJsonLd = novel
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Trang chủ",
            "item": siteUrl,
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": novel.title,
            "item": `${siteUrl}/novel/${novel.slug || novel._id}`,
          },
        ],
      }
    : null;

  return (
    <>
      {bookJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(bookJsonLd) }}
        />
      )}
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      <NovelDetailClient initialNovel={novel} />
    </>
  );
}
