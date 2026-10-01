import type { Response } from '../types';
import Novel from '../models/Novel';
import Chapter from '../models/Chapter';
import ReadEvent from '../models/ReadEvent';
import { dayKey } from '../models/Analytics';
import ApiResponse from '../utils/apiResponse';
import { AuthRequest } from './report.controller';

export const getAuthorStats = async (req: AuthRequest, res: Response) => {
    try {
        const authorId = req.user?.id;
        if (!authorId) return ApiResponse.unauthorized(res);
        const novels = await Novel.find({ author: authorId }).select('_id views likes').lean();
        const novelIds = novels.map(n => n._id);
        const firstDay = dayKey(new Date(Date.now() - 13 * 86400_000));
        const [chapterSummary, dailyReads] = await Promise.all([
            Chapter.aggregate([
                { $match: { novelId: { $in: novelIds } } },
                { $group: { _id: null, count: { $sum: 1 }, words: { $sum: '$wordCount' } } },
            ]),
            ReadEvent.aggregate([
                { $match: { novelId: { $in: novelIds }, date: { $gte: firstDay } } },
                { $group: { _id: '$date', views: { $sum: 1 } } },
            ]),
        ]);
        const daily = new Map<string, number>(dailyReads.map(d => [d._id, d.views]));
        const days = Array.from({ length: 14 }, (_, i) => {
            const date = dayKey(new Date(Date.now() - (13 - i) * 86400_000));
            return { label: date.slice(5), views: daily.get(date) || 0 };
        });
        const previous = days.slice(0, 7).reduce((n, d) => n + d.views, 0);
        const current = days.slice(7).reduce((n, d) => n + d.views, 0);
        const growthRate = previous ? `${((current - previous) / previous * 100).toFixed(1)}%` : null;
        const count = chapterSummary[0]?.count || 0;
        res.setHeader('Cache-Control', 'private, no-store');
        return ApiResponse.success(res, {
            summary: {
                totalNovels: novels.length,
                totalViews: novels.reduce((sum, n) => sum + (n.views || 0), 0),
                totalLikes: novels.reduce((sum, n) => sum + (n.likes || 0), 0),
                totalChapters: count,
                totalWords: chapterSummary[0]?.words || 0,
                averageChaptersPerNovel: novels.length ? Number((count / novels.length).toFixed(1)) : 0,
                growthRate,
            },
            trend: days.slice(7),
        }, 'Lấy thống kê tác giả thành công');
    } catch (error) {
        console.error('Get author stats error:', error);
        return ApiResponse.serverError(res);
    }
};
