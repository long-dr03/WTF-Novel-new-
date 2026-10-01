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
    adLink?: string;
    adImage?: string;
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

const getNovelsByAuthor = (authorId: string, preview = false) => {
    return axios.get(`/author/${authorId}/novels`, { params: preview ? { preview: "true" } : {} });
};

const getNovelById = (novelId: string, preview = false) => {
    return axios.get(`/novel/${novelId}`, { params: preview ? { preview: "true" } : {} });
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

const getChaptersByNovel = (novelId: string, preview = false) => {
    return axios.get(`/novel/${novelId}/chapters`, { params: preview ? { preview: "true" } : {} });
};

const getChapterPage = (novelId: string, page = 1, order: 'asc' | 'desc' = 'asc') => {
    return axios.get(`/novel/${novelId}/chapters`, { params: { page, order, limit: 100 } });
};

const getChapterContent = (novelId: string, chapterNumber: number, preview = false) => {
    return axios.get(`/novel/${novelId}/chapter/${chapterNumber}`, { params: preview ? { preview: "true" } : {} });
};

const updateChapterStatus = (chapterId: string, status: 'draft' | 'published' | 'scheduled', scheduledAt?: Date) => {
    return axios.put(`/chapter/${chapterId}/status`, { status, scheduledAt });
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

const removeFromLibrary = (novelId: string, type: 'history' | 'favorite') => {
    return axios.delete(`/library/${novelId}`, { params: { type } });
};

const createReport = (novelId?: string, chapterId?: string, reason?: string, description?: string) => {
    return axios.post('/reports', { novelId, chapterId, reason, description });
};

const getReports = () => {
    return axios.get('/admin/reports');
};

const updateReportStatus = (reportId: string, status: 'resolved' | 'dismissed') => {
    return axios.put(`/admin/reports/${reportId}`, { status });
};

const getAuthorStats = () => {
    return axios.get('/author/stats');
};

const getComments = (novelId: string, chapterId?: string, page = 1) => {
    return axios.get('/comments', { params: { novelId, chapterId, page } });
};

const createComment = (novelId: string, content: string, chapterId?: string, parentId?: string) => {
    return axios.post('/comments', { novelId, content, chapterId, parentId });
};

const likeComment = (commentId: string) => {
    return axios.post(`/comments/${commentId}/like`);
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
    getChapterPage,
    getChapterContent,
    updateChapterStatus,
    updateNovelStatus,
    updateNovel,
    addToLibrary,
    getLibrary,
    checkLibraryStatus,
    removeFromLibrary,
    createReport,
    getReports,
    updateReportStatus,
    getAuthorStats,
    getComments,
    createComment,
    likeComment
};