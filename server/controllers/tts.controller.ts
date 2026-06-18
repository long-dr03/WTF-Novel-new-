import type { Request, Response } from '../types';
import Chapter from '../models/Chapter';
import mongoose from 'mongoose';
import ApiResponse from '../utils/apiResponse';
import fs from 'fs';
import path from 'path';

// Thư mục gốc chứa file upload (Next phục vụ tĩnh từ public/uploads).
const UPLOADS_ROOT = path.join(process.cwd(), 'public', 'uploads');

/**
 * Upload audio file thủ công cho một chapter
 */
export const uploadChapterAudio = async (req: Request, res: Response) => {
    try {
        const { chapterId } = req.params;

        if (!chapterId || !mongoose.Types.ObjectId.isValid(chapterId)) {
            return ApiResponse.badRequest(res, 'ID chapter không hợp lệ');
        }

        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return ApiResponse.notFound(res, 'Không tìm thấy chapter');
        }

        if (!req.file) {
            return ApiResponse.badRequest(res, 'Vui lòng upload file audio');
        }

        if (chapter.audioUrl) {
            const oldFilePath = path.join(UPLOADS_ROOT, chapter.audioUrl.replace('/uploads/', ''));
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }

        const audioUrl = `/uploads/audio/${req.file.filename}`;

        chapter.audioUrl = audioUrl;
        chapter.audioStatus = 'completed';
        chapter.audioSource = 'upload';
        chapter.audioGeneratedAt = new Date();

        if (req.body.duration) {
            chapter.audioDuration = parseFloat(req.body.duration);
        }

        await chapter.save();

        return ApiResponse.success(res, {
            audioUrl: chapter.audioUrl,
            audioStatus: chapter.audioStatus,
            audioDuration: chapter.audioDuration
        }, 'Upload audio thành công');

    } catch (error) {
        console.error('Upload audio error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi upload audio');
    }
};

/**
 * Xóa file audio của một chương
 */
export const deleteChapterAudio = async (req: Request, res: Response) => {
    try {
        const { chapterId } = req.params;

        if (!chapterId || !mongoose.Types.ObjectId.isValid(chapterId)) {
            return ApiResponse.badRequest(res, 'ID chapter không hợp lệ');
        }

        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return ApiResponse.notFound(res, 'Không tìm thấy chapter');
        }

        if (!chapter.audioUrl) {
            return ApiResponse.badRequest(res, 'Chapter chưa có audio');
        }

        // Chỉ xóa file vật lý nếu là file lưu nội bộ (/uploads/...). URL ngoài (UploadThing) bỏ qua.
        if (chapter.audioUrl.startsWith('/uploads/')) {
            const filePath = path.join(UPLOADS_ROOT, chapter.audioUrl.replace('/uploads/', ''));
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        chapter.audioUrl = undefined;
        chapter.audioStatus = 'none';
        chapter.audioDuration = undefined;
        chapter.audioGeneratedAt = undefined;
        chapter.audioSource = undefined;

        await chapter.save();

        return ApiResponse.success(res, null, 'Xóa audio thành công');

    } catch (error) {
        console.error('Delete audio error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi xóa audio');
    }
};

/**
 * Lấy thông tin audio chi tiết của một chương
 */
export const getChapterAudioInfo = async (req: Request, res: Response) => {
    try {
        const { chapterId } = req.params;

        if (!chapterId || !mongoose.Types.ObjectId.isValid(chapterId)) {
            return ApiResponse.badRequest(res, 'ID chapter không hợp lệ');
        }

        const chapter = await Chapter.findById(chapterId)
            .select('audioUrl audioStatus audioDuration audioGeneratedAt audioSource chapterNumber title');

        if (!chapter) {
            return ApiResponse.notFound(res, 'Không tìm thấy chapter');
        }

        return ApiResponse.success(res, {
            chapterId: chapter._id,
            chapterNumber: chapter.chapterNumber,
            title: chapter.title,
            audioUrl: chapter.audioUrl,
            audioStatus: chapter.audioStatus,
            audioDuration: chapter.audioDuration,
            audioGeneratedAt: chapter.audioGeneratedAt,
            audioSource: chapter.audioSource
        }, 'Lấy thông tin audio thành công');

    } catch (error) {
        console.error('Get audio info error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi lấy thông tin audio');
    }
};

/**
 * Lấy danh sách thống kê audio của toàn bộ chương trong tiểu thuyết
 */
export const getNovelAudioList = async (req: Request, res: Response) => {
    try {
        const { novelId } = req.params;

        if (!novelId || !mongoose.Types.ObjectId.isValid(novelId)) {
            return ApiResponse.badRequest(res, 'ID novel không hợp lệ');
        }

        const chapters = await Chapter.find({ novelId })
            .select('chapterNumber title audioUrl audioStatus audioDuration audioSource')
            .sort({ chapterNumber: 1 });

        const stats = {
            total: chapters.length,
            withAudio: chapters.filter(ch => ch.audioStatus === 'completed').length,
            processing: chapters.filter(ch => ch.audioStatus === 'processing').length,
            failed: chapters.filter(ch => ch.audioStatus === 'failed').length,
            none: chapters.filter(ch => ch.audioStatus === 'none').length,
            totalDuration: chapters.reduce((sum, ch) => sum + (ch.audioDuration || 0), 0)
        };

        return ApiResponse.success(res, {
            chapters,
            stats
        }, 'Lấy danh sách audio thành công');

    } catch (error) {
        console.error('Get novel audio list error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi lấy danh sách audio');
    }
};

/**
 * Cập nhật URL audio cho chương (thường dùng cho callback hoặc manual update)
 */
export const updateChapterAudioUrl = async (req: Request, res: Response) => {
    try {
        const { chapterId } = req.params;
        const { audioUrl, duration } = req.body;

        if (!chapterId || !mongoose.Types.ObjectId.isValid(chapterId)) {
            return ApiResponse.badRequest(res, 'ID chapter không hợp lệ');
        }

        if (!audioUrl) {
            return ApiResponse.badRequest(res, 'Vui lòng cung cấp audio URL');
        }

        const chapter = await Chapter.findById(chapterId);
        if (!chapter) {
            return ApiResponse.notFound(res, 'Không tìm thấy chapter');
        }

        chapter.audioUrl = audioUrl;
        chapter.audioStatus = 'completed';
        chapter.audioSource = 'uploadthing';
        chapter.audioGeneratedAt = new Date();

        if (duration) {
            chapter.audioDuration = duration;
        }

        await chapter.save();

        return ApiResponse.success(res, {
            audioUrl: chapter.audioUrl,
            audioStatus: chapter.audioStatus,
            audioDuration: chapter.audioDuration
        }, 'Cập nhật audio URL thành công');

    } catch (error) {
        console.error('Update audio URL error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi cập nhật audio URL');
    }
};
