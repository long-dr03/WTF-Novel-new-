import Novel from "../models/Novel";
import Genre from "../models/Genre";
import Chapter from "../models/Chapter";
import mongoose from "mongoose";
import type { Request, Response } from "../types";
import ApiResponse from "../utils/apiResponse";
import { accessibleNovel, publishedChapters, canManageNovel } from "../queries/novelAccess";
import { boundedInteger, literalSearch } from "../utils/queryParams";

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

        const preview = req.query.preview === 'true';
        res.setHeader('Cache-Control', preview ? 'private, no-store' : LIST_CACHE);
        const filter = mongoose.Types.ObjectId.isValid(novelId) ? { _id: novelId } : { slug: novelId };
        // Keep the publication condition in the actual read, not a separate preflight query.
        const novel = await Novel.findOne({ ...filter, ...(preview ? {} : { publishStatus: 'published' }) })
            .populate('author', 'username avatar')
            .populate('genres', 'name slug').lean();
        if (novel && preview && !await canManageNovel(req, (novel.author as unknown as { _id: unknown })._id)) {
            return ApiResponse.notFound(res, 'Không tìm thấy truyện');
        }
        if (!novel) {
            return ApiResponse.notFound(res, 'Không tìm thấy truyện');
        }
        res.setHeader('Cache-Control', preview ? 'private, no-store' : LIST_CACHE);
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
        const preview = req.query.preview === 'true';
        if (preview && req.userId !== authorId && !await canManageNovel(req, authorId)) {
            return ApiResponse.forbidden(res);
        }
        res.setHeader('Cache-Control', preview ? 'private, no-store' : LIST_CACHE);
        const novels = await Novel.find({ author: authorId, ...(preview ? {} : { publishStatus: 'published' }) })
            .sort({ createdAt: -1 }).lean();
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
        const limit = boundedInteger(req.query.limit, 10, 100);
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
        const page = boundedInteger(req.query.page, 1, 10000);
        const limit = boundedInteger(req.query.limit, 12, 100);
        const search = literalSearch(req.query.search);
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
            const genreList = genre.split(',').map(g => g.trim()).filter(Boolean).slice(0, 20);
            const slugs = genreList.filter(g => !mongoose.Types.ObjectId.isValid(g));
            const matched = slugs.length ? await Genre.find({ slug: { $in: slugs } }).select('_id').lean() : [];
            const genreIds = [...genreList.filter(g => mongoose.Types.ObjectId.isValid(g)), ...matched.map(g => g._id)];

            if (genreIds.length > 0) {
                query.genres = { $in: genreIds };
            } else if (genreList.length > 0) {
                return ApiResponse.success(res, { novels: [], total: 0, page, pages: 0 }, 'Genre not found');
            }
        }

        if (isFeatured) {
            query.isFeatured = true;
        }

        const sortObj: Record<string, -1> = { isFeatured: -1 };
        if (sort === 'popular') {
            sortObj.views = -1;
        } else if (sort === 'updated') {
            sortObj.updatedAt = -1;
        } else {
            sortObj.createdAt = -1;
        }

        // Chạy song song find + count để tiết kiệm 1 vòng round-trip tới DB
        const includeTotal = req.query.includeTotal !== 'false';
        const [novels, total] = await Promise.all([
            Novel.find(query)
                .select(NOVEL_LIST_FIELDS)
                .populate('author', 'username avatar')
                .populate('genres', 'name slug')
                .sort(sortObj)
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            includeTotal ? Novel.countDocuments(query) : Promise.resolve(null),
        ]);

        res.setHeader('Cache-Control', LIST_CACHE);
        return ApiResponse.success(res, {
            novels,
            total,
            page,
            pages: total === null ? null : Math.ceil(total / limit)
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

        const access = await accessibleNovel(req, novelId);
        if (!access) return ApiResponse.notFound(res, 'Không tìm thấy truyện');
        const actualNovelId = access.novel._id;

        const filter = { novelId: actualNovelId, ...(access.preview ? {} : publishedChapters()) };
        const page = boundedInteger(req.query.page, 1, 10000);
        const limit = boundedInteger(req.query.limit, 100, 100);
        const direction = req.query.order === 'desc' ? -1 : 1;
        const paginated = !access.preview || req.query.page !== undefined;
        const query = Chapter.find(filter)
            .select('chapterNumber title status scheduledAt publishedAt createdAt views wordCount')
            .sort({ chapterNumber: direction });
        if (paginated) query.skip((page - 1) * limit).limit(limit + 1);
        const chapters = await query.lean();
        const hasMore = paginated && chapters.length > limit;
        res.setHeader('Cache-Control', access.preview ? 'private, no-store' : LIST_CACHE);
        return ApiResponse.success(res, paginated ? chapters.slice(0, limit) : chapters,
            'Lấy danh sách chương thành công', 200, { page, limit, hasMore });
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

        const number = Number(chapterNumber);
        if (!Number.isSafeInteger(number) || number < 1) return ApiResponse.badRequest(res, 'Số chương không hợp lệ');
        const access = await accessibleNovel(req, novelId);
        if (!access) return ApiResponse.notFound(res, 'Không tìm thấy truyện');
        const actualNovelId = access.novel._id;

        const chapter = await Chapter.findOne({
            novelId: actualNovelId,
            chapterNumber: number,
            ...(access.preview ? {} : publishedChapters())
        }).lean();
        if (!chapter) {
            return ApiResponse.notFound(res, 'Không tìm thấy chương');
        }

        const filter = { novelId: actualNovelId, ...(access.preview ? {} : publishedChapters()) };
        const [previous, next] = await Promise.all([
            Chapter.findOne({ ...filter, chapterNumber: { $lt: number } }).sort({ chapterNumber: -1 }).select('chapterNumber').lean(),
            Chapter.findOne({ ...filter, chapterNumber: { $gt: number } }).sort({ chapterNumber: 1 }).select('chapterNumber').lean(),
        ]);
        if (!access.preview) delete chapter.contentJson;
        res.setHeader('Cache-Control', access.preview ? 'private, no-store' : LIST_CACHE);
        return ApiResponse.success(res, { ...chapter, navigation: { previous: previous?.chapterNumber ?? null, next: next?.chapterNumber ?? null } }, 'Lấy nội dung chương thành công');
    } catch (error) {
        console.error('Get chapter content error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi lấy nội dung chương');
    }
}

export async function getChapterSummary(req: Request, res: Response) {
    try {
        const access = await accessibleNovel(req, req.params.novelId);
        if (!access) return ApiResponse.notFound(res);
        const [summary] = await Chapter.aggregate([
            { $match: { novelId: access.novel._id, ...(access.preview ? {} : publishedChapters()) } },
            { $group: { _id: null, total: { $sum: 1 }, totalWords: { $sum: '$wordCount' },
                totalViews: { $sum: '$views' }, first: { $min: '$chapterNumber' }, last: { $max: '$chapterNumber' } } },
        ]);
        res.setHeader('Cache-Control', access.preview ? 'private, no-store' : LIST_CACHE);
        return ApiResponse.success(res, summary || { total: 0, totalWords: 0, totalViews: 0, first: null, last: null });
    } catch (error) {
        console.error('Chapter summary error:', error);
        return ApiResponse.serverError(res);
    }
}
