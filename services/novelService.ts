import { createNovel, uploadChapter, getNovelById , getPopularNovels, getAllNovels, getLatestNovels, getNovelsByAuthor, getChaptersByNovel, getChapterContent, updateChapterStatus, updateNovelStatus } from '../controller/NovelController';

interface NovelData {
    title: string;
    description: string;
    image: string;
    author: string;
    genres: string[];
    status: string;
    views: number;
    likes: number;
}

interface Novel {
    _id?: string;
    id?: string;
    title: string;
    description?: string;
    image?: string;
    coverImage?: string;
    author?: any;
    genres?: string[];
    status?: string;
    views?: number;
    likes?: number;
    chapters?: number;
    createdAt?: string;
    updatedAt?: string;
}

interface Chapter {
    _id?: string;
    id?: string;
    novelId: string;
    chapterNumber: number;
    title: string;
    content?: string;
    contentJson?: any;
    wordCount?: number;
    charCount?: number;
    status?: 'draft' | 'published' | 'scheduled';
    publishedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    views?: number;
}

interface ChapterData {
    novelId: string;
    chapterNumber: number;
    title: string;
    content: string
    contentJson: any
    wordCount: number
    charCount: number
    status: 'draft' | 'published' | 'scheduled'
    chapterId?: string; // Optional - for updating existing chapters
    scheduledAt?: Date;
    publishedAt?: Date;
    views?: number;
    authorNote?: string;
}

// Helper function to extract data from API response
const extractApiData = <T>(response: any): T | null => {
    // Check if response has the new format { success, message, data }
    if (response?.data?.success !== undefined) {
        return response.data.success ? response.data.data : null;
    }
    // Fallback for old format or direct data
    return response?.data ?? response ?? null;
};

const uploadChapterService = async (dataChapter: ChapterData): Promise<any> => {
    try {
        const response = await uploadChapter(dataChapter);
        return extractApiData(response);
    } catch (error) {
        console.error("Error uploading chapter:", error);
        return null;
    }
}

const createNovelService = async (novelData: NovelData): Promise<any> => {
    try {
        const response = await createNovel(novelData);
        return extractApiData(response);
    } catch (error) {
        console.error("Error creating novel:", error);
        return null;
    }
};

const getNovelsByAuthorService = async (authorId: string): Promise<Novel[] | null> => {
    try {
        const response = await getNovelsByAuthor(authorId);
        return extractApiData<Novel[]>(response);
    } catch (error) {
        console.error("Error fetching novels by author:", error);
        return null;
    }
}

const getNovelByIdService = async(novelId: string): Promise<Novel | null> => {
    try {
        const response = await getNovelById(novelId);
        return extractApiData<Novel>(response);
    } catch (error) {
        console.error("Error fetching novel:", error);
        return null;
    }
}

const getPopularNovelsService = async(limit: number = 10): Promise<Novel[] | null> => {
    try {
        const response = await getPopularNovels(limit);
        return extractApiData<Novel[]>(response);
    } catch (error) {
        console.error("Error fetching popular novels:", error);
        return null;
    }
}

const getAllNovelsService = async(page: number = 1, limit: number = 12, genre?: string): Promise<{ novels: Novel[], total: number, page: number, totalPages: number } | null> => {
    try {
        const response = await getAllNovels(page, limit, genre);
        return extractApiData(response);
    } catch (error) {
        console.error("Error fetching all novels:", error);
        return null;
    }
}

const getLatestNovelsService = async(limit: number = 8): Promise<Novel[] | null> => {
    try {
        const response = await getLatestNovels(limit);
        return extractApiData<Novel[]>(response);
    } catch (error) {
        console.error("Error fetching latest novels:", error);
        return null;
    }
}

const getChaptersByNovelService = async(novelId: string): Promise<Chapter[] | null> => {
    try {
        const response = await getChaptersByNovel(novelId);
        return extractApiData<Chapter[]>(response);
    } catch (error) {
        console.error("Error fetching chapters:", error);
        return null;
    }
}

const getChapterContentService = async(novelId: string, chapterNumber: number): Promise<Chapter | null> => {
    try {
        const response = await getChapterContent(novelId, chapterNumber);
        return extractApiData<Chapter>(response);
    } catch (error) {
        console.error("Error fetching chapter content:", error);
        return null;
    }
}

const updateChapterStatusService = async(chapterId: string, status: 'draft' | 'published' | 'scheduled'): Promise<any> => {
    try {
        const response = await updateChapterStatus(chapterId, status);
        return extractApiData(response);
    } catch (error) {
        console.error("Error updating chapter status:", error);
        return null;
    }
}

const updateNovelStatusService = async(novelId: string, status: 'ongoing' | 'completed' | 'hiatus'): Promise<any> => {
    try {
        const response = await updateNovelStatus(novelId, status);
        return extractApiData(response);
    } catch (error) {
        console.error("Error updating novel status:", error);
        return null;
    }
}

export {
    createNovelService,
    uploadChapterService,
    getNovelByIdService,
    getNovelsByAuthorService,
    getPopularNovelsService,
    getAllNovelsService,
    getLatestNovelsService,
    getChaptersByNovelService,
    getChapterContentService,
    updateChapterStatusService,
    updateNovelStatusService
}

export type { Novel, Chapter, ChapterData, NovelData }