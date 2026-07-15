import type { Request, Response } from '../types';
import ApiResponse from '../utils/apiResponse';
import { createAudioUploadUrl, r2Configured } from '../utils/r2';

/**
 * Cấp URL upload trực tiếp (presigned PUT) cho file audio chương truyện lên Cloudflare R2.
 * Client sau đó PUT file thẳng lên R2 (không đi qua server) rồi gọi
 * updateChapterAudioUrl để lưu publicUrl vào chương.
 */
export const presignChapterAudio = async (req: Request, res: Response) => {
    try {
        if (!r2Configured()) {
            return ApiResponse.serverError(res, 'Lưu trữ R2 chưa được cấu hình trên server.');
        }

        const { filename, contentType } = req.body || {};
        const ct = String(contentType || '');
        if (!ct.startsWith('audio/')) {
            return ApiResponse.badRequest(res, 'Chỉ chấp nhận file audio.');
        }

        const result = await createAudioUploadUrl(String(filename || 'audio'), ct);
        return ApiResponse.success(res, result, 'Tạo URL upload thành công');
    } catch (error: any) {
        console.error('presignChapterAudio error:', error);
        return ApiResponse.serverError(res, error?.message || 'Lỗi khi tạo URL upload');
    }
};
