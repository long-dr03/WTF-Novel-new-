import type { MetadataRoute } from 'next';
import { callController } from '@/server/callController';
import { getPublicNovels, getPublicGenres } from '@/server/controllers/getNovel';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://goctruyen.wtfdev.qzz.io';

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/search`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ];

  let novelRoutes: MetadataRoute.Sitemap = [];
  let genreRoutes: MetadataRoute.Sitemap = [];

  try {
    const [novelsRes, genresRes] = await Promise.all([
      callController(getPublicNovels, { query: { limit: 500, sort: 'updated' } }),
      callController(getPublicGenres),
    ]);

    if (novelsRes?.success && Array.isArray(novelsRes.data?.novels)) {
      novelRoutes = novelsRes.data.novels.map((novel: any) => ({
        url: `${siteUrl}/novel/${novel.slug || novel._id}`,
        lastModified: novel.updatedAt ? new Date(novel.updatedAt) : new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }));
    }

    if (genresRes?.success && Array.isArray(genresRes.data)) {
      genreRoutes = genresRes.data.map((genre: any) => ({
        url: `${siteUrl}/genre/${genre.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch (error) {
    console.error('Error generating dynamic sitemap:', error);
  }

  return [...staticRoutes, ...genreRoutes, ...novelRoutes];
}
