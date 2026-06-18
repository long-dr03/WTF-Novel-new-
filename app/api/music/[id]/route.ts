import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { deleteMusic } from '@/server/controllers/music.controller';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, ctx: Ctx) {
    const { id } = await ctx.params;
    return handle(req, deleteMusic, { params: { id }, auth: true });
}
