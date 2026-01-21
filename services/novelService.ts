import { createNovel, uploadChapter, getNovelById, getPopularNovels, getAllNovels, getLatestNovels, getNovelsByAuthor, getChaptersByNovel, getChapterContent, updateChapterStatus, updateNovelStatus, updateNovel, getPublicNovels, getPublicGenres, addToLibrary, getLibrary, checkLibraryStatus, removeFromLibrary } from '../controller/NovelController';

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
    chapterId?: string;
    scheduledAt?: Date;
    publishedAt?: Date;
    views?: number;
    authorNote?: string;
}

/**
 * Trích xuất dữ liệu từ API response
 * @param response Phản hồi từ API
 */
const extractApiData = <T>(response: any): T | null => {
    if (response?.data?.success !== undefined) {
        return response.data.success ? response.data.data : null;
    }
    return response?.data ?? response ?? null;
};

/**
 * Upload một chương mới (hoặc cập nhật)
 * @param dataChapter Dữ liệu chương
 */
const uploadChapterService = async (dataChapter: ChapterData): Promise<any> => {
    try {
        const response = await uploadChapter(dataChapter);
        return extractApiData(response);
    } catch (error) {
        console.error("Error uploading chapter:", error);
        return null;
    }
}

/**
 * Tạo mới một tiểu thuyết
 * @param novelData Dữ liệu tiểu thuyết
 */
const createNovelService = async (novelData: NovelData): Promise<any> => {
    try {
        const response = await createNovel(novelData);
        return extractApiData(response);
    } catch (error) {
        console.error("Error creating novel:", error);
        return null;
    }
};

/**
 * Lấy danh sách tiểu thuyết của một tác giả
 * @param authorId ID tác giả
 */
const getNovelsByAuthorService = async (authorId: string): Promise<Novel[] | null> => {
    try {
        const response = await getNovelsByAuthor(authorId);
        return extractApiData<Novel[]>(response);
    } catch (error) {
        console.error("Error fetching novels by author:", error);
        return null;
    }
}

/**
 * Lấy thông tin chi tiết tiểu thuyết theo ID
 * @param novelId ID tiểu thuyết
 */
const getNovelByIdService = async (novelId: string): Promise<Novel | null> => {
    try {
        const response = await getNovelById(novelId);
        return extractApiData<Novel>(response);
    } catch (error) {
        console.error("Error fetching novel:", error);
        return null;
    }
}

/**
 * Lấy danh sách tiểu thuyết phổ biến
 * @param limit Số lượng hiển thị (mặc định 10)
 */
const getPopularNovelsService = async (limit: number = 10): Promise<Novel[] | null> => {
    try {
        const response = await getPopularNovels(limit);
        return extractApiData<Novel[]>(response);
    } catch (error) {
        console.error("Error fetching popular novels:", error);
        return null;
    }
}

/**
 * Lấy danh sách tất cả tiểu thuyết có phân trang và lọc theo thể loại
 * @param page Trang hiện tại (mặc định 1)
 * @param limit Số lượng mỗi trang (mặc định 12)
 * @param genre Thể loại lọc (tùy chọn)
 */
const getAllNovelsService = async (page: number = 1, limit: number = 12, genre?: string): Promise<{ novels: Novel[], total: number, page: number, totalPages: number } | null> => {
    try {
        const response = await getAllNovels(page, limit, genre);
        return extractApiData(response);
    } catch (error) {
        console.error("Error fetching all novels:", error);
        return null;
    }
}

/**
 * Lấy danh sách tiểu thuyết mới nhất
 * @param limit Số lượng hiển thị (mặc định 8)
 */
const getLatestNovelsService = async (limit: number = 8): Promise<Novel[] | null> => {
    try {
        const response = await getLatestNovels(limit);
        return extractApiData<Novel[]>(response);
    } catch (error) {
        console.error("Error fetching latest novels:", error);
        return null;
    }
}

/**
 * Lấy danh sách chương của một tiểu thuyết
 * @param novelId ID tiểu thuyết
 */
const getChaptersByNovelService = async (novelId: string): Promise<Chapter[] | null> => {
    try {
        const response = await getChaptersByNovel(novelId);
        return extractApiData<Chapter[]>(response);
    } catch (error) {
        console.error("Error fetching chapters:", error);
        return null;
    }
}

/**
 * Lấy nội dung chi tiết của một chương
 * @param novelId ID tiểu thuyết
 * @param chapterNumber Số thứ tự chương
 */
const getChapterContentService = async (novelId: string, chapterNumber: number): Promise<Chapter | null> => {
    try {
        const response = await getChapterContent(novelId, chapterNumber);
        return extractApiData<Chapter>(response);
    } catch (error) {
        console.error("Error fetching chapter content:", error);
        return null;
    }
}

/**
 * Cập nhật trạng thái của chương
 * @param chapterId ID chương
 * @param status Trạng thái mới (draft, published, scheduled)
 */
const updateChapterStatusService = async (chapterId: string, status: 'draft' | 'published' | 'scheduled'): Promise<any> => {
    try {
        const response = await updateChapterStatus(chapterId, status);
        return extractApiData(response);
    } catch (error) {
        console.error("Error updating chapter status:", error);
        return null;
    }
}

/**
 * Cập nhật trạng thái của tiểu thuyết
 * @param novelId ID tiểu thuyết
 * @param status Trạng thái mới (ongoing, completed, hiatus)
 */
const updateNovelStatusService = async (novelId: string, status: 'ongoing' | 'completed' | 'hiatus'): Promise<any> => {
    try {
        const response = await updateNovelStatus(novelId, status);
        return extractApiData(response);
    } catch (error) {
        console.error("Error updating novel status:", error);
        return null;
    }
}

/**
 * Cập nhật thông tin tiểu thuyết (tên, mô tả, ảnh bìa...)
 * @param novelId ID tiểu thuyết
 * @param data Dữ liệu cập nhật
 */
export const updateNovelService = async (novelId: string, data: Partial<NovelData>): Promise<any> => {
    try {
        const response = await updateNovel(novelId, data);
        return extractApiData(response);
    } catch (error) {
        console.error("Error updating novel:", error);
        return null;
    }
}



/**
 * Lấy danh sách tiểu thuyết công khai (có lọc, sort, search)
 * @param params Filters
 */
const getPublicNovelsService = async (params: any): Promise<{ novels: Novel[], total: number, page: number, totalPages: number } | null> => {
    try {
        const response = await getPublicNovels(params);
        return extractApiData(response);
    } catch (error) {
        console.error("Error fetching public novels:", error);
        return null;
    }
}


const getPublicGenresService = async (): Promise<any[]> => {
    try {
        const response = await getPublicGenres();
        return extractApiData<any[]>(response) || [];
    } catch (error) {
        return [];
    }
}

const addToLibraryService = async (novelId: string, type: 'history' | 'favorite', lastReadChapter?: string) => {
    try {
        const response = await addToLibrary(novelId, type, lastReadChapter);
        return extractApiData(response);
    } catch (error) {
        return null;
    }
}

const getLibraryService = async (type: 'history' | 'favorite') => {
    try {
        const response = await getLibrary(type);
        // Library endpoints usually return array directly or wrapped.
        // Backend controller: res.status(200).json(library); -> array.
        // check extractApiData logic: if response.data.success undefined, return response.data ?? response
        // if response is array, response.data is undefined? axios response.data is the body.
        // extractApiData handles (response) which is axios response object.
        // response.data is the body.
        return extractApiData(response);
    } catch (error) {
        return [];
    }
}

const checkLibraryStatusService = async (novelId: string) => {
    try {
        const response = await checkLibraryStatus(novelId);
        return extractApiData(response);
    } catch (error) {
        return { inHistory: false, isFavorite: false };
    }
}

const removeFromLibraryService = async (novelId: string, type: 'history' | 'favorite') => {
    try {
        const response = await removeFromLibrary(novelId, type);
        return extractApiData(response);
    } catch (error) {
        return null;
    }
}

export {
    createNovelService,
    uploadChapterService,
    getNovelByIdService,
    getNovelsByAuthorService,
    getPopularNovelsService,
    getPublicNovelsService,
    getAllNovelsService,
    getLatestNovelsService,
    getChaptersByNovelService,
    getChapterContentService,
    updateChapterStatusService,
    updateNovelStatusService,
    getPublicGenresService,
    addToLibraryService,
    getLibraryService,
    checkLibraryStatusService,
    removeFromLibraryService
}

export type { Novel, Chapter, ChapterData, NovelData }
