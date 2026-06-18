import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getChaptersByNovel } from '@/server/controllers/getNovel';

type Ctx = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
    const { id } = await ctx.params;
    return handle(req, getChaptersByNovel, { params: { novelId: id } });
}
