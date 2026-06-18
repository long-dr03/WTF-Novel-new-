import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getChapterContent } from '@/server/controllers/getNovel';

type Ctx = { params: Promise<{ id: string; chapterNumber: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
    const { id, chapterNumber } = await ctx.params;
    return handle(req, getChapterContent, { params: { novelId: id, chapterNumber } });
}
