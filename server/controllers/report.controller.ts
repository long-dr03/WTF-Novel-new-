import type { Request, Response } from '../types';
import Report from '../models/Report';
import Novel from '../models/Novel';
import Chapter from '../models/Chapter';
import mongoose from 'mongoose';
import ApiResponse from '../utils/apiResponse';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        role: string;
    };
}

/**
 * Gửi báo cáo vi phạm mới (truyện hoặc chương)
 */
export const createReport = async (req: AuthRequest, res: Response) => {
    try {
        const { novelId, chapterId, reason, description } = req.body;
        const reporterId = req.user?.id;

        if (!reporterId) {
            return ApiResponse.unauthorized(res, 'Bạn cần đăng nhập để gửi báo cáo');
        }

        if (!reason || !description) {
            return ApiResponse.badRequest(res, 'Vui lòng cung cấp lý do và nội dung chi tiết báo cáo');
        }

        const reportData: any = {
            reporter: reporterId,
            reason,
            description
        };

        if (novelId) {
            if (!mongoose.Types.ObjectId.isValid(novelId)) {
                return ApiResponse.badRequest(res, 'ID truyện không hợp lệ');
            }
            const novelExists = await Novel.findById(novelId);
            if (!novelExists) {
                return ApiResponse.notFound(res, 'Không tìm thấy truyện được báo cáo');
            }
            reportData.novel = novelId;
        }

        if (chapterId) {
            if (!mongoose.Types.ObjectId.isValid(chapterId)) {
                return ApiResponse.badRequest(res, 'ID chương không hợp lệ');
            }
            const chapterExists = await Chapter.findById(chapterId);
            if (!chapterExists) {
                return ApiResponse.notFound(res, 'Không tìm thấy chương được báo cáo');
            }
            reportData.chapter = chapterId;
        }

        const report = new Report(reportData);
        await report.save();

        return ApiResponse.success(res, report, 'Gửi báo cáo thành công. Ban quản trị sẽ sớm xem xét báo cáo của bạn.');
    } catch (error) {
        console.error('Create report error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi gửi báo cáo vi phạm');
    }
};

/**
 * Lấy danh sách báo cáo vi phạm (Dành cho Admin)
 */
export const getReports = async (req: Request, res: Response) => {
    try {
        const reports = await Report.find()
            .populate('reporter', 'username email')
            .populate('novel', 'title image')
            .populate('chapter', 'chapterNumber title')
            .sort({ createdAt: -1 });

        return ApiResponse.success(res, reports, 'Lấy danh sách báo cáo thành công');
    } catch (error) {
        console.error('Get reports error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi lấy danh sách báo cáo');
    }
};

/**
 * Cập nhật trạng thái xử lý báo cáo (Dành cho Admin)
 */
export const updateReportStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return ApiResponse.badRequest(res, 'ID báo cáo không hợp lệ');
        }

        if (!status || !['resolved', 'dismissed'].includes(status)) {
            return ApiResponse.badRequest(res, 'Trạng thái xử lý không hợp lệ');
        }

        const report = await Report.findById(id);
        if (!report) {
            return ApiResponse.notFound(res, 'Không tìm thấy báo cáo');
        }

        report.status = status;
        await report.save();

        return ApiResponse.success(res, report, `Đã cập nhật trạng thái báo cáo thành: ${status === 'resolved' ? 'Đã xử lý' : 'Bỏ qua'}`);
    } catch (error) {
        console.error('Update report status error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi cập nhật trạng thái báo cáo');
    }
};
