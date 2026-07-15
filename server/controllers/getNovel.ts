import Novel from "../models/Novel";
import Genre from "../models/Genre";
import Chapter from "../models/Chapter";
import mongoose from "mongoose";
import type { Request, Response } from "../types";
import ApiResponse from "../utils/apiResponse";
import { recordActivity } from "../models/Analytics";

/**
 * Cache-Control cho các endpoint đọc công khai (không phụ thuộc user).
 * - s-maxage: CDN/Edge cache (Vercel) phục vụ trong N giây.
 * - stale-while-revalidate: phục vụ bản cũ trong khi làm mới nền → không có "cold" request.
 * - max-age nhỏ: cho phép trình duyệt cache ngắn khi điều hướng nội bộ.
 */
const LIST_CACHE = 'public, max-age=30, s-maxage=60, stale-while-revalidate=300';
const GENRE_CACHE = 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400';

// Chỉ lấy các trường danh sách cần hiển thị (loại bỏ description dài & field admin)
const NOVEL_LIST_FIELDS = 'title slug image status publishStatus isFeatured views likes author genres createdAt updatedAt';

/**
 * Lấy thông tin chi tiết của một cuốn truyện theo ID
 */
export const getNovelById = async (req: Request, res: Response) => {
    try {
        const novelId = req.params.id;

        if (!novelId) {
            return ApiResponse.badRequest(res, 'ID hoặc Slug truyện không hợp lệ');
        }

        let query;
        if (mongoose.Types.ObjectId.isValid(novelId)) {
            query = Novel.findById(novelId);
        } else {
            query = Novel.findOne({ slug: novelId });
        }

        const novel = await query
            .populate('author', 'username avatar')
            .populate('genres', 'name slug')
            .lean();
        if (!novel) {
            return ApiResponse.notFound(res, 'Không tìm thấy truyện');
        }
        res.setHeader('Cache-Control', LIST_CACHE);
        return ApiResponse.success(res, novel, 'Lấy thông tin truyện thành công');
    } catch (error) {
        console.error('Get novel error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi lấy thông tin truyện');
    }
}

/**
 * Lấy danh sách truyện của một tác giả
 */
export const getNovelsByAuthor = async (req: Request, res: Response) => {
    try {
        const authorId = req.params.authorId;
        if (!authorId || !mongoose.Types.ObjectId.isValid(authorId)) {
            return ApiResponse.badRequest(res, 'ID tác giả không hợp lệ');
        }
        const novels = await Novel.find({ author: authorId })
            .sort({ createdAt: -1 });
        return ApiResponse.success(res, novels, 'Lấy danh sách truyện thành công');
    } catch (error) {
        console.error('Get novels by author error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi lấy danh sách truyện của tác giả');
    }
}

/**
 * Lấy danh sách truyện phổ biến (dựa trên lượt xem) - Chỉ lấy truyện đã xuất bản
 */
export const getPopularNovels = async (req: Request, res: Response) => {
    try {
        const limit = parseInt(req.query.limit as string) || 10;
        const novels = await Novel.find({ publishStatus: 'published' })
            .select(NOVEL_LIST_FIELDS)
            .sort({ views: -1 })
            .limit(limit)
            .populate('author', 'username avatar')
            .lean();
        res.setHeader('Cache-Control', LIST_CACHE);
        return ApiResponse.success(res, novels, 'Lấy danh sách truyện phổ biến thành công');
    } catch (error) {
        console.error('Get popular novels error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi lấy danh sách truyện phổ biến');
    }
}

/**
 * Lấy danh sách truyện công khai (Hỗ trợ lọc, tìm kiếm, phân trang)
 */
export const getPublicNovels = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 12;
        const search = req.query.search as string;
        const genre = req.query.genre as string;
        const isFeatured = req.query.isFeatured === 'true';
        const sort = req.query.sort as string;
        const status = req.query.status as string;

        const query: any = { publishStatus: 'published' };

        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }

        if (status) {
            query.status = status;
        }

        if (genre) {
            const genreList = genre.split(',').filter(g => g.trim() !== '');
            const genreIds = [];

            for (const g of genreList) {
                if (mongoose.Types.ObjectId.isValid(g)) {
                    genreIds.push(g);
                } else {
                    const genreDoc = await Genre.findOne({ slug: g });
                    if (genreDoc) {
                        genreIds.push(genreDoc._id);
                    }
                }
            }

            if (genreIds.length > 0) {
                query.genres = { $in: genreIds };
            } else if (genreList.length > 0) {
                return ApiResponse.success(res, { novels: [], total: 0, page, pages: 0 }, 'Genre not found');
            }
        }

        if (isFeatured) {
            query.isFeatured = true;
        }

        let sortObj: any = { isFeatured: -1 };
        if (sort === 'popular') {
            sortObj.views = -1;
        } else if (sort === 'updated') {
            sortObj.updatedAt = -1;
        } else {
            sortObj.createdAt = -1;
        }

        // Chạy song song find + count để tiết kiệm 1 vòng round-trip tới DB
        const [novels, total] = await Promise.all([
            Novel.find(query)
                .select(NOVEL_LIST_FIELDS)
                .populate('author', 'username avatar')
                .populate('genres', 'name slug')
                .sort(sortObj)
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            Novel.countDocuments(query),
        ]);

        res.setHeader('Cache-Control', LIST_CACHE);
        return ApiResponse.success(res, {
            novels,
            total,
            page,
            pages: Math.ceil(total / limit)
        }, 'Lấy danh sách truyện thành công');
    } catch (error) {
        console.error('Get public novels error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi lấy danh sách truyện');
    }
}

/**
 * Lấy danh sách tất cả thể loại (Public)
 */
export const getPublicGenres = async (req: Request, res: Response) => {
    try {
        const genres = await Genre.find().sort({ name: 1 }).lean();
        res.setHeader('Cache-Control', GENRE_CACHE);
        return ApiResponse.success(res, genres, 'Lấy danh sách thể loại thành công');
    } catch (error) {
        console.error('Get genres error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi lấy danh sách thể loại');
    }
}

/**
 * Lấy danh sách các chương của một truyện
 */
export const getChaptersByNovel = async (req: Request, res: Response) => {
    try {
        const novelId = req.params.novelId;
        if (!novelId) {
            return ApiResponse.badRequest(res, 'ID hoặc Slug truyện không hợp lệ');
        }

        let actualNovelId = novelId;
        if (!mongoose.Types.ObjectId.isValid(novelId)) {
            const novelDoc = await Novel.findOne({ slug: novelId }).select('_id');
            if (!novelDoc) {
                return ApiResponse.notFound(res, 'Không tìm thấy truyện');
            }
            actualNovelId = novelDoc._id.toString();
        }

        const chapters = await Chapter.find({ novelId: actualNovelId })
            .select('chapterNumber title status publishedAt createdAt views wordCount')
            .sort({ chapterNumber: 1 })
            .lean();
        res.setHeader('Cache-Control', LIST_CACHE);
        return ApiResponse.success(res, chapters, 'Lấy danh sách chương thành công');
    } catch (error) {
        console.error('Get chapters error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi lấy danh sách chương');
    }
}

/**
 * Lấy nội dung chi tiết của một chương
 */
export const getChapterContent = async (req: Request, res: Response) => {
    try {
        const { novelId, chapterNumber } = req.params;
        if (!novelId) {
            return ApiResponse.badRequest(res, 'ID hoặc Slug truyện không hợp lệ');
        }

        let actualNovelId = novelId;
        if (!mongoose.Types.ObjectId.isValid(novelId)) {
            const novelDoc = await Novel.findOne({ slug: novelId }).select('_id');
            if (!novelDoc) {
                return ApiResponse.notFound(res, 'Không tìm thấy truyện');
            }
            actualNovelId = novelDoc._id.toString();
        }

        const chapter = await Chapter.findOne({
            novelId: actualNovelId,
            chapterNumber: parseInt(chapterNumber)
        }).lean();
        if (!chapter) {
            return ApiResponse.notFound(res, 'Không tìm thấy chương');
        }

        // Increment views asynchronously in the background to avoid blocking on writing large document contents
        Chapter.updateOne({ _id: chapter._id }, { $inc: { views: 1 } }).catch(e => console.error('Increment views error:', e));

        // Ghi nhận "lượt đọc theo user" (chỉ khi đã đăng nhập) — fire-and-forget
        if (req.userId) {
            recordActivity(req.userId, 'reads').catch(e => console.error('Track read error:', e));
        }

        chapter.views = (chapter.views || 0) + 1;
        return ApiResponse.success(res, chapter, 'Lấy nội dung chương thành công');
    } catch (error) {
        console.error('Get chapter content error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi lấy nội dung chương');
    }
}
