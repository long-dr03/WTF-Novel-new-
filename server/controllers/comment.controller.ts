import type { Request, Response } from '../types';
import Comment from '../models/Comment';
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
 * Lấy danh sách bình luận của truyện hoặc chương
 */
export const getComments = async (req: Request, res: Response) => {
    try {
        const { novelId, chapterId } = req.query;

        if (!novelId && !chapterId) {
            return ApiResponse.badRequest(res, 'Vui lòng cung cấp novelId hoặc chapterId');
        }

        const filter: any = {};
        if (chapterId) {
            if (!mongoose.Types.ObjectId.isValid(chapterId)) {
                return ApiResponse.badRequest(res, 'chapterId không hợp lệ');
            }
            filter.chapterId = chapterId;
        } else if (novelId) {
            if (!mongoose.Types.ObjectId.isValid(novelId)) {
                return ApiResponse.badRequest(res, 'novelId không hợp lệ');
            }
            filter.novelId = novelId;
        }

        const comments = await Comment.find(filter)
            .populate('userId', 'username avatar')
            .sort({ createdAt: -1 });

        // Phân loại top-level comments và replies
        const topLevelComments = comments.filter(c => !c.parentId);
        const replies = comments.filter(c => c.parentId);

        const commentTree = topLevelComments.map(c => {
            const commentObj = c.toObject() as any;
            commentObj.replies = replies
                .filter(r => r.parentId && r.parentId.toString() === c._id.toString())
                .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); // Trả lời cũ trước
            return commentObj;
        });

        return ApiResponse.success(res, commentTree, 'Lấy danh sách bình luận thành công');
    } catch (error) {
        console.error('Get comments error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi lấy danh sách bình luận');
    }
};

/**
 * Gửi bình luận hoặc phản hồi mới
 */
export const createComment = async (req: AuthRequest, res: Response) => {
    try {
        const { novelId, chapterId, content, parentId } = req.body;
        const userId = req.user?.id;

        if (!userId) {
            return ApiResponse.unauthorized(res, 'Bạn cần đăng nhập để gửi bình luận');
        }

        if (!content || !content.trim()) {
            return ApiResponse.badRequest(res, 'Nội dung bình luận không được để trống');
        }

        if (!novelId || !mongoose.Types.ObjectId.isValid(novelId)) {
            return ApiResponse.badRequest(res, 'novelId không hợp lệ');
        }

        const novelExists = await Novel.findById(novelId);
        if (!novelExists) {
            return ApiResponse.notFound(res, 'Không tìm thấy truyện');
        }

        const commentData: any = {
            novelId,
            userId,
            content: content.trim()
        };

        if (chapterId) {
            if (!mongoose.Types.ObjectId.isValid(chapterId)) {
                return ApiResponse.badRequest(res, 'chapterId không hợp lệ');
            }
            const chapterExists = await Chapter.findById(chapterId);
            if (!chapterExists) {
                return ApiResponse.notFound(res, 'Không tìm thấy chương');
            }
            commentData.chapterId = chapterId;
        }

        if (parentId) {
            if (!mongoose.Types.ObjectId.isValid(parentId)) {
                return ApiResponse.badRequest(res, 'parentId không hợp lệ');
            }
            const parentComment = await Comment.findById(parentId);
            if (!parentComment) {
                return ApiResponse.notFound(res, 'Không tìm thấy bình luận gốc để phản hồi');
            }
            commentData.parentId = parentId;
        }

        const comment = new Comment(commentData);
        await comment.save();

        const populatedComment = await Comment.findById(comment._id).populate('userId', 'username avatar');

        return ApiResponse.created(res, populatedComment, 'Gửi bình luận thành công');
    } catch (error) {
        console.error('Create comment error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi gửi bình luận');
    }
};

/**
 * Thích hoặc bỏ thích bình luận
 */
export const toggleLikeComment = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            return ApiResponse.unauthorized(res, 'Bạn cần đăng nhập để thực hiện hành động này');
        }

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return ApiResponse.badRequest(res, 'ID bình luận không hợp lệ');
        }

        const comment = await Comment.findById(id);
        if (!comment) {
            return ApiResponse.notFound(res, 'Không tìm thấy bình luận');
        }

        const userObjectId = new mongoose.Types.ObjectId(userId);
        const index = comment.likes.indexOf(userObjectId);

        if (index > -1) {
            comment.likes.splice(index, 1);
        } else {
            comment.likes.push(userObjectId);
        }

        await comment.save();

        const populatedComment = await Comment.findById(comment._id).populate('userId', 'username avatar');
        return ApiResponse.success(res, populatedComment, 'Cập nhật lượt thích thành công');
    } catch (error) {
        console.error('Toggle like comment error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi thích bình luận');
    }
};
