import { createHash } from 'crypto';
import mongoose from 'mongoose';
import Chapter from '../models/Chapter';
import Novel from '../models/Novel';
import ReadEvent from '../models/ReadEvent';
import { dayKey, recordActivity } from '../models/Analytics';
import { publishedChapters } from '../queries/novelAccess';
import ApiResponse from '../utils/apiResponse';
import type { Request, Response } from '../types';

export async function trackRead(req: Request, res: Response) {
    res.setHeader('Cache-Control', 'private, no-store');
    const { chapterId, sessionId } = req.body;
    if (!mongoose.Types.ObjectId.isValid(chapterId || '') ||
        typeof sessionId !== 'string' || !/^[a-f0-9-]{36}$/i.test(sessionId)) {
        return ApiResponse.badRequest(res);
    }
    const chapter = await Chapter.findOne({ _id: chapterId, ...publishedChapters() }).select('novelId').lean();
    if (!chapter || !await Novel.exists({ _id: chapter.novelId, publishStatus: 'published' })) {
        return ApiResponse.notFound(res);
    }
    const viewer = createHash('sha256').update(req.userId ? `user:${req.userId}` : `session:${sessionId}`).digest('hex');
    try {
        // The unique index arbitrates concurrent submissions from tabs/renders.
        await ReadEvent.create({
            viewer, chapterId, novelId: chapter.novelId, user: req.userId || null,
            date: dayKey(), expiresAt: new Date(Date.now() + 90 * 86400_000),
        });
    } catch (error: unknown) {
        if ((error as { code?: number }).code === 11000) return ApiResponse.success(res, { counted: false });
        throw error;
    }
    await Promise.all([
        Chapter.updateOne({ _id: chapterId }, { $inc: { views: 1 } }),
        Novel.updateOne({ _id: chapter.novelId }, { $inc: { views: 1 } }, { timestamps: false }),
        req.userId ? recordActivity(req.userId, 'reads') : Promise.resolve(),
    ]);
    return ApiResponse.success(res, { counted: true });
}
