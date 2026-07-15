import mongoose, { Schema, Document, Model } from 'mongoose';

/**
 * Thống kê hoạt động theo NGÀY cho từng USER (daily rollup).
 * Mỗi document = 1 user trong 1 ngày, cộng dồn các bộ đếm.
 * - Tính tổng theo user  => $group by user
 * - Tính time-series ngày => $group by date
 * Chỉ ghi nhận cho user ĐÃ ĐĂNG NHẬP (mọi bản ghi đều có `user`).
 */
export interface IAnalytics extends Document {
    user: mongoose.Types.ObjectId;
    date: string; // 'YYYY-MM-DD' theo giờ Việt Nam (UTC+7)
    reads: number;
    visits: number;
    adClicks: number;
}

const AnalyticsSchema: Schema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        date: {
            type: String,
            required: true,
        },
        reads: { type: Number, default: 0 },
        visits: { type: Number, default: 0 },
        adClicks: { type: Number, default: 0 },
    },
    { timestamps: true }
);

// 1 bản ghi duy nhất cho mỗi (user, ngày)
AnalyticsSchema.index({ user: 1, date: 1 }, { unique: true });
// Phục vụ tổng hợp time-series theo ngày
AnalyticsSchema.index({ date: 1 });

const Analytics =
    (mongoose.models.Analytics as Model<IAnalytics>) ||
    mongoose.model<IAnalytics>('Analytics', AnalyticsSchema);

export default Analytics;

/** Trả về chuỗi ngày 'YYYY-MM-DD' theo múi giờ Việt Nam (UTC+7). */
export function dayKey(d: Date = new Date()): string {
    const vn = new Date(d.getTime() + 7 * 60 * 60 * 1000);
    return vn.toISOString().slice(0, 10);
}

type ActivityField = 'reads' | 'visits' | 'adClicks';

/**
 * Cộng dồn một sự kiện hoạt động cho user trong ngày hôm nay.
 * Fire-and-forget: chỉ dùng cho tracking, KHÔNG chặn request chính.
 */
export async function recordActivity(
    userId: string | mongoose.Types.ObjectId,
    field: ActivityField,
    inc: number = 1
): Promise<void> {
    if (!userId) return;
    const date = dayKey();
    try {
        await Analytics.updateOne(
            { user: userId, date },
            { $inc: { [field]: inc } },
            { upsert: true }
        );
    } catch (err: any) {
        // Hiếm gặp: 2 upsert đồng thời cho cùng (user,date) -> E11000. Thử lại 1 lần bằng update thuần.
        if (err?.code === 11000) {
            try {
                await Analytics.updateOne({ user: userId, date }, { $inc: { [field]: inc } });
            } catch (e) {
                console.error('recordActivity retry error:', e);
            }
        } else {
            console.error('recordActivity error:', err);
        }
    }
}
