import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/server/db';
import Chapter from '@/server/models/Chapter';

export async function POST(request: NextRequest) {
    const secret = process.env.CRON_SECRET;
    if (!secret) return NextResponse.json({ message: 'CRON_SECRET chưa được cấu hình' }, { status: 503 });
    if (request.headers.get('authorization') !== `Bearer ${secret}`) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    try {
        await connectDB();
        const result = await Chapter.updateMany(
            { status: 'scheduled', scheduledAt: { $type: 'date', $lte: new Date() } },
            [{ $set: { status: 'published', publishedAt: '$scheduledAt', updatedAt: '$$NOW' } }],
        );
        return NextResponse.json({ published: result.modifiedCount }, {
            headers: { 'Cache-Control': 'private, no-store' },
        });
    } catch (error) {
        console.error('Publish job failed:', error);
        return NextResponse.json({ message: 'Publish job failed' }, { status: 500 });
    }
}
