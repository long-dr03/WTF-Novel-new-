import Novel from "../models/Novel";
import Genre from "../models/Genre";
import Chapter from "../models/Chapter";
import mongoose from "mongoose";
import type { Request, Response } from "../types";
import ApiResponse from "../utils/apiResponse";

/**
 * Lấy thông tin chi tiết của một cuốn truyện theo ID
 */
export const getNovelById = async (req: Request, res: Response) => {
    try {
        const novelId = req.params.id;

        if (!novelId || !mongoose.Types.ObjectId.isValid(novelId)) {
            return ApiResponse.badRequest(res, 'ID truyện không hợp lệ');
        }

        const novel = await Novel.findById(novelId)
            .populate('author', 'username avatar')
            .populate('genres', 'name slug');
        if (!novel) {
            return ApiResponse.notFound(res, 'Không tìm thấy truyện');
        }
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
            .sort({ views: -1 })
            .limit(limit)
            .populate('author', 'username avatar');
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

        const novels = await Novel.find(query)
            .populate('author', 'username avatar')
            .populate('genres', 'name slug')
            .sort(sortObj)
            .skip((page - 1) * limit)
            .limit(limit);

        const total = await Novel.countDocuments(query);

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
        const genres = await Genre.find().sort({ name: 1 });
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
        if (!novelId || !mongoose.Types.ObjectId.isValid(novelId)) {
            return ApiResponse.badRequest(res, 'ID truyện không hợp lệ');
        }
        const chapters = await Chapter.find({ novelId: novelId })
            .select('chapterNumber title status publishedAt createdAt views wordCount')
            .sort({ chapterNumber: 1 });
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
        if (!novelId || !mongoose.Types.ObjectId.isValid(novelId)) {
            return ApiResponse.badRequest(res, 'ID truyện không hợp lệ');
        }
        const chapter = await Chapter.findOne({
            novelId: novelId,
            chapterNumber: parseInt(chapterNumber)
        });
        if (!chapter) {
            return ApiResponse.notFound(res, 'Không tìm thấy chương');
        }

        chapter.views = (chapter.views || 0) + 1;
        await chapter.save();
        return ApiResponse.success(res, chapter, 'Lấy nội dung chương thành công');
    } catch (error) {
        console.error('Get chapter content error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi lấy nội dung chương');
    }
}
