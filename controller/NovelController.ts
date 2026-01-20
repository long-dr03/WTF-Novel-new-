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
    status: 'draft' | 'published' | 'scheduled'
    chapterId?: string; // Optional - for updating existing chapters
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

const getAllNovels = (page: number = 1, limit: number = 12, genre?: string) => {
    let url = `/novels?page=${page}&limit=${limit}`;
    if (genre) {
        url += `&genre=${genre}`;
    }
    return axios.get(url);
};

const getPublicGenres = () => {
    return axios.get('/genres');
};

const getPublicNovels = (params: any) => {
    return axios.get('/novels', { params });
};

const getLatestNovels = (limit: number = 8) => {
    return axios.get(`/novels/latest?limit=${limit}`);
};

const getChaptersByNovel = (novelId: string) => {
    return axios.get(`/novel/${novelId}/chapters`);
};

const getChapterContent = (novelId: string, chapterNumber: number) => {
    return axios.get(`/novel/${novelId}/chapter/${chapterNumber}`);
};

const updateChapterStatus = (chapterId: string, status: 'draft' | 'published' | 'scheduled') => {
    return axios.put(`/chapter/${chapterId}/status`, { status });
};

const updateNovelStatus = (novelId: string, status: 'ongoing' | 'completed' | 'hiatus') => {
    return axios.put(`/novel/${novelId}/status`, { status });
};

const updateNovel = (novelId: string, data: Partial<NovelData>) => {
    return axios.put(`/novel/${novelId}`, data);
};

// Library / History
const addToLibrary = (novelId: string, type: 'history' | 'favorite', lastReadChapter?: string) => {
    return axios.post('/library', { novelId, type, lastReadChapter });
};

const getLibrary = (type: 'history' | 'favorite') => {
    return axios.get('/library', { params: { type } });
};

const checkLibraryStatus = (novelId: string) => {
    return axios.get(`/library/check/${novelId}`);
};


export {
    createNovel,
    uploadChapter,
    getNovelById,
    getNovelsByAuthor,
    getPopularNovels,
    getAllNovels,
    getPublicNovels,
    getPublicGenres,
    getLatestNovels,
    getChaptersByNovel,
    getChapterContent,
    updateChapterStatus,
    updateNovelStatus,
    updateNovel,
    addToLibrary,
    getLibrary,
    checkLibraryStatus
};