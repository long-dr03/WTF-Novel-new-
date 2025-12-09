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

export { createNovel, uploadChapter };