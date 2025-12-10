// controller/SongController.js
import axios from "../setup/axios";
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

const uploadChapter = (data: ChapterData) => {
    return axios.post("/upload-chapter", {
        data
    });
};

const createNovel = (data: NovelData) => {
    return axios.post("/create-novel", {
        data
    });
};

const getNovelsByAuthor = (authorId: string) => {
    return axios.get(`/author/${authorId}/novels`);
};

const getNovelById = (novelId: string) => {
    return axios.get(`/novel/${novelId}`);
};
const getPopularNovels = (limit: number = 10) => {
    return axios.get(`/novels/popular?limit=${limit}`);
};

export { createNovel, uploadChapter, getNovelById, getNovelsByAuthor, getPopularNovels };