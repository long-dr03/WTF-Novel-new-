import type { Response } from '../types';
import Library from '../models/Library';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Thêm truyện vào thư viện (Lịch sử hoặc Yêu thích)
 */
export const addToLibrary = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { novelId, type, lastReadChapter } = req.body;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (!novelId || !type) return res.status(400).json({ message: 'Missing novelId or type' });

        const updateData: any = {
            updatedAt: new Date()
        };
        if (lastReadChapter) updateData.lastReadChapter = lastReadChapter;

        const libraryItem = await Library.findOneAndUpdate(
            { user: userId, novel: novelId, type },
            updateData,
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        res.status(200).json({ message: 'Added to library', libraryItem });
    } catch (error) {
        console.error('Add to library error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Lấy danh sách truyện trong thư viện theo loại
 */
export const getLibrary = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { type } = req.query;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        if (!type) return res.status(400).json({ message: 'Missing type' });

        const library = await Library.find({ user: userId, type })
            .populate({
                path: 'novel',
                select: 'title image coverImage author status isFeatured',
                populate: { path: 'author', select: 'username' }
            })
            .populate('lastReadChapter', 'chapterNumber title')
            .sort({ updatedAt: -1 });

        res.status(200).json(library);
    } catch (error) {
        console.error('Get library error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Xóa truyện khỏi thư viện
 * DELETE /library/:novelId?type=...
 */
export const removeFromLibrary = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { novelId } = req.params;
        const { type } = req.query;

        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        await Library.findOneAndDelete({ user: userId, novel: novelId, type });

        res.status(200).json({ message: 'Removed from library' });
    } catch (error) {
        console.error('Remove from library error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Kiểm tra truyện có trong thư viện không (helper cho nút bấm frontend)
 */
export const checkLibraryStatus = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?._id;
        const { novelId } = req.params;

        if (!userId) return res.status(200).json({ inHistory: false, isFavorite: false });

        const history = await Library.exists({ user: userId, novel: novelId, type: 'history' });
        const favorite = await Library.exists({ user: userId, novel: novelId, type: 'favorite' });

        res.status(200).json({ inHistory: !!history, isFavorite: !!favorite });
    } catch (error) {
        console.error('Check library status error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
