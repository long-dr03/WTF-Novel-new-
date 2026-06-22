import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { toggleLikeComment } from '@/server/controllers/comment.controller';

type Ctx = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, ctx: Ctx) {
    const { id } = await ctx.params;
    return handle(req, toggleLikeComment, { params: { id }, auth: true });
}
