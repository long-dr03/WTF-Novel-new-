import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getChapterSummary } from '@/server/controllers/getNovel';

type Ctx = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, ctx: Ctx) {
    const { id } = await ctx.params;
    return handle(request, getChapterSummary, { params: { novelId: id } });
}
