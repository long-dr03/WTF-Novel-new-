import type { Request, Response } from '../types';
import Novel from '../models/Novel';
import Chapter from '../models/Chapter';
import User from '../models/User';
import mongoose from 'mongoose';
import ApiResponse from '../utils/apiResponse';
import { canManageNovel } from '../queries/novelAccess';

function scheduleDate(status: string, value: unknown) {
    if (status !== 'scheduled') return null;
    const date = new Date(String(value || ''));
    if (!Number.isFinite(date.getTime()) || date.getTime() <= Date.now()) throw new Error('INVALID_SCHEDULE');
    return date;
}

const mapStatus = (status: string): 'ongoing' | 'completed' | 'hiatus' => {
    const statusMap: Record<string, 'ongoing' | 'completed' | 'hiatus'> = {
        'Đang viết': 'ongoing',
        'Hoàn thành': 'completed',
        'Tạm dừng': 'hiatus',
        'ongoing': 'ongoing',
        'completed': 'completed',
        'hiatus': 'hiatus'
    };
    return statusMap[status] || 'ongoing';
};

/**
 * Tạo mới một đầu truyện (Novel)
 */
export const createNovel = async (req: Request, res: Response) => {
    try {
        const data = req.body.data;
        if (!req.userId) return ApiResponse.unauthorized(res);

        if (!data || !data.title || !data.description) {
            return ApiResponse.badRequest(res, 'Thiếu thông tin bắt buộc: title, description');
        }

        const validGenres = (data.genres || [])
            .filter((g: string) => g && g.trim() !== '')
            .filter((g: string) => mongoose.Types.ObjectId.isValid(g));

        let imageUrl = data.image;
        if (!imageUrl || imageUrl.startsWith('blob:')) {
            imageUrl = 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
        }

        // Check if the author is an admin to bypass approval process
        let isAuthorAdmin = false;
        if (req.userId) {
            const currentUser = await User.findById(req.userId);
            if (currentUser && currentUser.role === 'admin') {
                isAuthorAdmin = true;
            }
        }

        const novelData = {
            title: data.title,
            description: data.description,
            author: req.userId,
            genres: validGenres,
            image: imageUrl,
            status: mapStatus(data.status),
            views: data.views || 0,
            likes: data.likes || 0,
            publishStatus: isAuthorAdmin ? 'published' : 'pending',
            adLink: data.adLink || '',
            adImage: data.adImage || ''
        };

        const novel = new Novel(novelData);
        await novel.save();

        return ApiResponse.created(res, {
            novelId: novel._id,
            title: novel.title,
            description: novel.description,
            image: novel.image,
            status: novel.status
        }, 'Tạo truyện thành công');

    } catch (error) {
        console.error('Create novel error:', error);
        return ApiResponse.serverError(res);
    }
};

/**
 * Tạo mới hoặc cập nhật một chương (Chapter) của truyện
 */
export const uploadChapter = async (req: Request, res: Response) => {
    try {
        const data = req.body.data;
        let chapter;

        if (!data || !data.novelId) {
            return ApiResponse.badRequest(res, 'Thiếu thông tin novelId');
        }

        const novel = await Novel.findById(new mongoose.Types.ObjectId(data.novelId));
        if (!novel) {
            return ApiResponse.notFound(res, 'Không tìm thấy truyện');
        }

        if (!await canManageNovel(req, novel.author)) return ApiResponse.forbidden(res);
        const scheduledAt = scheduleDate(data.status || 'draft', data.scheduledAt);

        let existingChapter = null;

        if (data.chapterId) {
            existingChapter = await Chapter.findById(data.chapterId);
        } else {
            existingChapter = await Chapter.findOne({
                novelId: new mongoose.Types.ObjectId(data.novelId),
                chapterNumber: data.chapterNumber
            });
        }

        if (existingChapter) {
            if (String(existingChapter.novelId) !== String(novel._id)) return ApiResponse.badRequest(res, 'Chương không thuộc truyện');
            existingChapter.scheduledAt = scheduledAt || undefined;
            existingChapter.title = data.title;
            existingChapter.content = data.content;
            existingChapter.contentJson = data.contentJson;
            existingChapter.wordCount = data.wordCount;
            existingChapter.charCount = data.charCount;
            existingChapter.status = data.status || existingChapter.status;

            await existingChapter.save();
            chapter = existingChapter;

            return ApiResponse.updated(res, {
                chapterId: chapter._id,
                novelId: data.novelId,
                chapterNumber: chapter.chapterNumber,
                isUpdate: true
            }, 'Cập nhật chương thành công');
        } else {
            chapter = new Chapter({
                novelId: new mongoose.Types.ObjectId(data.novelId),
                chapterNumber: data.chapterNumber,
                title: data.title,
                content: data.content,
                contentJson: data.contentJson,
                wordCount: data.wordCount,
                charCount: data.charCount,
                scheduledAt,
                status: data.status || 'draft'
            });
            await chapter.save();

            return ApiResponse.created(res, {
                chapterId: chapter._id,
                novelId: data.novelId,
                chapterNumber: chapter.chapterNumber,
                isUpdate: false
            }, 'Tạo chương thành công');
        }

    } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_SCHEDULE') return ApiResponse.badRequest(res, 'Chọn thời gian đăng trong tương lai');
        console.error('Upload chapter error:', error);
        return ApiResponse.serverError(res);
    }
};

/**
 * Cập nhật trạng thái của một chương (draft, published, scheduled)
 */
export const updateChapterStatus = async (req: Request, res: Response) => {
    try {
        const { chapterId } = req.params;
        const { status } = req.body;

        if (!chapterId || !mongoose.Types.ObjectId.isValid(chapterId)) {
            return ApiResponse.badRequest(res, 'ID chương không hợp lệ');
        }

        if (!status || !['draft', 'published', 'scheduled'].includes(status)) {
            return ApiResponse.badRequest(res, 'Trạng thái không hợp lệ. Các trạng thái hợp lệ: draft, published, scheduled');
        }

        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return ApiResponse.notFound(res, 'Không tìm thấy chương');
        }

        const novel = await Novel.findById(chapter.novelId).select('author');
        if (!novel || !await canManageNovel(req, novel.author)) return ApiResponse.forbidden(res);
        chapter.scheduledAt = scheduleDate(status, req.body.scheduledAt) || undefined;
        chapter.status = status;
        if (status === 'published' && !chapter.publishedAt) {
            chapter.publishedAt = new Date();
        }
        await chapter.save();

        return ApiResponse.updated(res, {
            chapterId: chapter._id,
            status: chapter.status,
            publishedAt: chapter.publishedAt
        }, 'Cập nhật trạng thái chương thành công');
    } catch (error) {
        if (error instanceof Error && error.message === 'INVALID_SCHEDULE') return ApiResponse.badRequest(res, 'Chọn thời gian đăng trong tương lai');
        console.error('Update chapter status error:', error);
        return ApiResponse.serverError(res);
    }
};

/**
 * Cập nhật trạng thái của truyện (ongoing, completed, hiatus)
 */
export const updateNovelStatus = async (req: Request, res: Response) => {
    try {
        const { novelId } = req.params;
        const { status } = req.body;

        if (!novelId || !mongoose.Types.ObjectId.isValid(novelId)) {
            return ApiResponse.badRequest(res, 'ID truyện không hợp lệ');
        }

        if (!status || !['ongoing', 'completed', 'hiatus'].includes(status)) {
            return ApiResponse.badRequest(res, 'Trạng thái không hợp lệ. Các trạng thái hợp lệ: ongoing, completed, hiatus');
        }

        const novel = await Novel.findById(novelId);
        if (!novel) {
            return ApiResponse.notFound(res, 'Không tìm thấy truyện');
        }

        if (!await canManageNovel(req, novel.author)) return ApiResponse.forbidden(res);
        novel.status = status;
        await novel.save();

        return ApiResponse.updated(res, {
            novelId: novel._id,
            status: novel.status
        }, 'Cập nhật trạng thái truyện thành công');
    } catch (error) {
        console.error('Update novel status error:', error);
        return ApiResponse.serverError(res);
    }
};

/**
 * Cập nhật thông tin truyện (title, description, image, genres, status)
 */
export const updateNovel = async (req: Request, res: Response) => {
    try {
        const { novelId } = req.params;
        const { title, description, image, genres, status, commentsEnabled, reportsEnabled, adImage, adLink } = req.body;

        if (!novelId || !mongoose.Types.ObjectId.isValid(novelId)) {
            return ApiResponse.badRequest(res, 'ID truyện không hợp lệ');
        }

        const novel = await Novel.findById(novelId);
        if (!novel) {
            return ApiResponse.notFound(res, 'Không tìm thấy truyện');
        }

        if (!await canManageNovel(req, novel.author)) return ApiResponse.forbidden(res);
        if (title) novel.title = title;
        if (description) novel.description = description;
        if (image) novel.image = image;
        if (genres) {
            const validGenres = genres.filter((g: string) => mongoose.Types.ObjectId.isValid(g));
            novel.genres = validGenres;
        }
        if (status) {
            novel.status = mapStatus(status);
        }
        if (typeof commentsEnabled === 'boolean') novel.commentsEnabled = commentsEnabled;
        if (typeof reportsEnabled === 'boolean') novel.reportsEnabled = reportsEnabled;
        if (typeof adImage === 'string') novel.adImage = adImage;
        if (typeof adLink === 'string') novel.adLink = adLink;

        await novel.save();

        return ApiResponse.updated(res, {
            novelId: novel._id,
            title: novel.title,
            description: novel.description,
            image: novel.image,
            genres: novel.genres,
            status: novel.status
        }, 'Cập nhật truyện thành công');
    } catch (error) {
        console.error('Update novel error:', error);
        return ApiResponse.serverError(res);
    }
};
