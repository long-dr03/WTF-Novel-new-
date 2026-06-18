import type { Response } from '../types';
import Music from '../models/Music';
import { AuthRequest } from '../middlewares/auth.middleware';

/**
 * Upload thông tin metadata của nhạc (file đã được upload lên cloud trước đó)
 */
export const uploadMusic = async (req: AuthRequest, res: Response) => {
    try {
        const { name, url, duration, type } = req.body;
        const userId = req.user ? req.user._id : null;

        if (!name || !url) {
            return res.status(400).json({ message: 'Missing name or url' });
        }

        const musicData: any = {
            name,
            url,
            duration: duration || 0,
            type: type || 'user'
        };

        if (type === 'user' || type === 'author') {
            if (!userId) {
                return res.status(401).json({ message: 'Unauthorized' });
            }
            musicData.owner = userId;
        } else if (type === 'system') {

        }

        const music = new Music(musicData);
        await music.save();

        res.status(201).json(music);
    } catch (error) {
        console.error('Upload music error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Lấy danh sách nhạc theo loại (system, user, author)
 */
export const getMusicLibrary = async (req: AuthRequest, res: Response) => {
    try {
        const { type } = req.query;
        const userId = req.user ? req.user._id : null;

        let query: any = {};

        if (type === 'system') {
            query.type = 'system';
        } else if (type === 'user') {
            if (!userId) return res.status(401).json({ message: 'Unauthorized' });
            query = { type: 'user', owner: userId };
        } else if (type === 'author') {
            if (req.query.authorId) {
                query = { type: 'author', owner: req.query.authorId };
            } else {
                if (!userId) return res.status(401).json({ message: 'Unauthorized' });
                query = { type: 'author', owner: userId };
            }
        } else {
            if (userId) {
                query = {
                    $or: [
                        { type: 'system' },
                        { owner: userId }
                    ]
                };
            } else {
                query = { type: 'system' };
            }
        }

        const music = await Music.find(query).sort({ createdAt: -1 });
        res.json(music);
    } catch (error) {
        console.error('Get music error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Xóa nhạc khỏi thư viện
 */
export const deleteMusic = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user ? req.user._id : null;

        const music = await Music.findById(id);
        if (!music) {
            return res.status(404).json({ message: 'Music not found' });
        }

        if (music.type !== 'system' && music.owner?.toString() !== userId?.toString()) {
            return res.status(403).json({ message: 'Forbidden' });
        }

        await Music.findByIdAndDelete(id);

        res.json({ message: 'Music deleted successfully' });
    } catch (error) {
        console.error('Delete music error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/**
 * Lấy danh sách nhạc của người dùng hiện tại
 */
export const getMyMusic = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user ? req.user._id : null;
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });

        const music = await Music.find({ owner: userId }).sort({ createdAt: -1 });
        res.json(music);
    } catch (error) {
        console.error('Get my music error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};
