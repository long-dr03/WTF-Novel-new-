import { createNovel, uploadChapter, getNovelById , getPopularNovels, getNovelsByAuthor, getChaptersByNovel, getChapterContent, updateChapterStatus, updateNovelStatus } from '../controller/NovelController';
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
const uploadChapterService = async (dataChapter: ChapterData) => {
    try {
        const data = await uploadChapter(dataChapter)
        return data
    } catch (error) {
        console.error("Error register:", error);
        return null;
    }
}
const createNovelService = async (novelData: NovelData) => {
    try {
        const data = await createNovel(novelData)  
        return data
    } catch (error) {
        console.error("Error register:", error);
        return null;
    }
};
const getNovelsByAuthorService = async (authorId: string) => {
    const response = await getNovelsByAuthor(authorId);
    return response?.data;
}
const getNovelByIdService = async(novelId: string) => {
    const response = await getNovelById(novelId);
    return response?.data;
}
const getPopularNovelsService = async(limit: number = 10) => {
    const response = await getPopularNovels(limit);
    return response?.data;
}
const getChaptersByNovelService = async(novelId: string) => {
    const response = await getChaptersByNovel(novelId);
    return response?.data;
}
const getChapterContentService = async(novelId: string, chapterNumber: number) => {
    const response = await getChapterContent(novelId, chapterNumber);
    return response?.data;
}

const updateChapterStatusService = async(chapterId: string, status: 'draft' | 'published' | 'scheduled') => {
    try {
        const response = await updateChapterStatus(chapterId, status);
        return response?.data;
    } catch (error) {
        console.error("Error updating chapter status:", error);
        return null;
    }
}

const updateNovelStatusService = async(novelId: string, status: 'ongoing' | 'completed' | 'hiatus') => {
    try {
        const response = await updateNovelStatus(novelId, status);
        return response?.data;
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
    getChaptersByNovelService,
    getChapterContentService,
    updateChapterStatusService,
    updateNovelStatusService
}