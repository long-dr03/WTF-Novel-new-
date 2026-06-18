import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { updateChapterStatus } from '@/server/controllers/uploadNovel';

type Ctx = { params: Promise<{ chapterId: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
    const { chapterId } = await ctx.params;
    return handle(req, updateChapterStatus, { params: { chapterId } });
}
