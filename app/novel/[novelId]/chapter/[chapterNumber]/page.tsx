import { cache } from "react";
import type { Metadata, ResolvingMetadata } from "next";
import ChapterDetailClient from "@/components/ChapterDetailClient";
import { callController } from "@/server/callController";
import { getChapterContent, getNovelById } from "@/server/controllers/getNovel";

interface PageProps {
  params: Promise<{ novelId: string; chapterNumber: string }>;
}

const fetchChapterAndNovelData = cache(async function (novelId: string, chapterNumberStr: string) {
  try {
    const chapterNumber = parseInt(chapterNumberStr, 10);
    const [novelRes, chapterRes] = await Promise.all([
      callController(getNovelById, { params: { id: novelId } }),
      callController(getChapterContent, { params: { novelId, chapterNumber } }),
    ]);

    const novel = novelRes?.success ? novelRes.data : null;
    const chapter = chapterRes?.success ? chapterRes.data : null;

    return { novel, chapter };
  } catch (error) {
    console.error("Error fetching chapter data on server:", error);
    return { novel: null, chapter: null };
  }
});

export async function generateMetadata(
  { params }: PageProps,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { novelId, chapterNumber } = await params;
  const { novel, chapter } = await fetchChapterAndNovelData(novelId, chapterNumber);

  if (!novel || !chapter) {
    return {
      title: `Chương ${chapterNumber} | Góc Truyện`,
      description: `Đọc chương ${chapterNumber} online tại Góc Truyện.`,
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://goctruyen.wtfdev.qzz.io";
  const chapterTitleStr = chapter.title ? `: ${chapter.title}` : "";
  const title = `Chương ${chapter.chapterNumber}${chapterTitleStr} - ${novel.title}`;
  const description = `Đọc chương ${chapter.chapterNumber}${chapterTitleStr} của truyện ${novel.title} online miễn phí, cập nhật mới nhất tại Góc Truyện.`;
  const canonicalUrl = `${siteUrl}/novel/${novel.slug || novel._id}/chapter/${chapter.chapterNumber}`;
  const coverImage = novel.image || `${siteUrl}/logo.jpg`;

  return {
    title,
    description,
    keywords: [
      novel.title,
      `Chương ${chapter.chapterNumber} ${novel.title}`,
      `đọc chương ${chapter.chapterNumber} ${novel.title}`,
      "đọc truyện online",
      "Góc Truyện"
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${title} - Góc Truyện`,
      description,
      url: canonicalUrl,
      siteName: "Góc Truyện",
      locale: "vi_VN",
      type: "article",
      images: [
        {
          url: coverImage,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} - Góc Truyện`,
      description,
      images: [coverImage],
    },
  };
}

export default async function ReadChapterPage({ params }: PageProps) {
  const { novelId, chapterNumber } = await params;
  const { novel, chapter } = await fetchChapterAndNovelData(novelId, chapterNumber);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://goctruyen.wtfdev.qzz.io";

  const breadcrumbJsonLd = novel && chapter
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
          {
            "@type": "ListItem",
            "position": 3,
            "name": `Chương ${chapter.chapterNumber}${chapter.title ? `: ${chapter.title}` : ""}`,
            "item": `${siteUrl}/novel/${novel.slug || novel._id}/chapter/${chapter.chapterNumber}`,
          },
        ],
      }
    : null;

  return (
    <>
      {breadcrumbJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
        />
      )}
      <ChapterDetailClient initialChapter={chapter} initialNovel={novel} />
    </>
  );
}
