import mongoose from 'mongoose';
import Novel from '../models/Novel';
import User from '../models/User';
import type { Request } from '../types';

export const publishedChapters = () => ({
    $or: [
        { status: 'published' as const },
        // Visibility does not depend on a worker having run at the exact deadline.
        { status: 'scheduled' as const, scheduledAt: { $type: 'date' as const, $lte: new Date() } },
    ],
});

export async function canManageNovel(req: Request, author: unknown): Promise<boolean> {
    if (!req.userId) return false;
    if (String(author) === req.userId) return true;
    return Boolean(await User.exists({ _id: req.userId, role: 'admin', isBanned: { $ne: true } }));
}

export async function accessibleNovel(req: Request, id: string) {
    const preview = req.query.preview === 'true';
    const filter = mongoose.Types.ObjectId.isValid(id) ? { _id: id } : { slug: id };
    const novel = await Novel.findOne({ ...filter, ...(preview ? {} : { publishStatus: 'published' }) })
        .select('_id author publishStatus').lean();
    if (!novel || (preview && !await canManageNovel(req, novel.author))) return null;
    return { novel, preview };
}
