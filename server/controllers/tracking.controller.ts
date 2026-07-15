import type { Request, Response } from '../types';
import Analytics, { recordActivity, dayKey } from '../models/Analytics';
import ApiResponse from '../utils/apiResponse';

/**
 * Ghi nhận 1 lượt truy cập cho user đã đăng nhập.
 * Khách vãng lai (không có req.userId) -> bỏ qua, vẫn trả 200 để client không báo lỗi.
 */
export const trackVisit = async (req: Request, res: Response) => {
    if (req.userId) {
        recordActivity(req.userId, 'visits').catch(() => {});
    }
    return ApiResponse.success(res, null, 'ok');
};

/**
 * Ghi nhận 1 lượt click mở khóa quảng cáo cho user đã đăng nhập.
 */
export const trackAdClick = async (req: Request, res: Response) => {
    if (req.userId) {
        recordActivity(req.userId, 'adClicks').catch(() => {});
    }
    return ApiResponse.success(res, null, 'ok');
};

/**
 * Tổng quan analytics cho admin: tổng tích luỹ + chuỗi số liệu theo ngày.
 * Query: ?days=14 (mặc định 14, tối đa 90)
 */
export const getAnalyticsOverview = async (req: Request, res: Response) => {
    try {
        const days = Math.min(90, Math.max(1, parseInt(req.query.days as string) || 14));

        // Mốc ngày bắt đầu (chuỗi 'YYYY-MM-DD') theo giờ VN
        const start = new Date();
        start.setDate(start.getDate() - (days - 1));
        const startKey = dayKey(start);

        const [totalsAgg, dailyAgg] = await Promise.all([
            Analytics.aggregate([
                {
                    $group: {
                        _id: null,
                        reads: { $sum: '$reads' },
                        visits: { $sum: '$visits' },
                        adClicks: { $sum: '$adClicks' },
                    },
                },
            ]),
            Analytics.aggregate([
                { $match: { date: { $gte: startKey } } },
                {
                    $group: {
                        _id: '$date',
                        reads: { $sum: '$reads' },
                        visits: { $sum: '$visits' },
                        adClicks: { $sum: '$adClicks' },
                    },
                },
                { $sort: { _id: 1 } },
            ]),
        ]);

        const totals = totalsAgg[0] || { reads: 0, visits: 0, adClicks: 0 };

        // Điền đủ mọi ngày trong khoảng (kể cả ngày không có dữ liệu = 0)
        const map = new Map<string, any>(dailyAgg.map((d) => [d._id, d]));
        const daily: Array<{ date: string; reads: number; visits: number; adClicks: number }> = [];
        for (let i = 0; i < days; i++) {
            const d = new Date(start);
            d.setDate(start.getDate() + i);
            const key = dayKey(d);
            const row = map.get(key);
            daily.push({
                date: key,
                reads: row?.reads || 0,
                visits: row?.visits || 0,
                adClicks: row?.adClicks || 0,
            });
        }

        return ApiResponse.success(
            res,
            {
                totals: {
                    reads: totals.reads || 0,
                    visits: totals.visits || 0,
                    adClicks: totals.adClicks || 0,
                },
                daily,
            },
            'Lấy thống kê analytics thành công'
        );
    } catch (error) {
        console.error('getAnalyticsOverview error:', error);
        return ApiResponse.serverError(res, 'Lỗi khi lấy thống kê analytics');
    }
};
