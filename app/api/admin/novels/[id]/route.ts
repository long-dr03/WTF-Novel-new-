import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { deleteNovel } from '@/server/controllers/adminController';

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(req: NextRequest, ctx: Ctx) {
    const { id } = await ctx.params;
    return handle(req, deleteNovel, { params: { id }, admin: true });
}
