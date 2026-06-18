import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getNovelsByAuthor } from '@/server/controllers/getNovel';

type Ctx = { params: Promise<{ authorId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
    const { authorId } = await ctx.params;
    return handle(req, getNovelsByAuthor, { params: { authorId } });
}
