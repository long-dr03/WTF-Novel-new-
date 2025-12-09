import { createNovel, uploadChapter } from '../controller/NovelController';
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
    status: 'draft'
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

export {
    createNovelService,
    uploadChapterService
}