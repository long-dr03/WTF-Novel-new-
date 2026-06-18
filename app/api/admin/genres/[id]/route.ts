import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { updateGenre, deleteGenre } from '@/server/controllers/adminController';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
    const { id } = await ctx.params;
    return handle(req, updateGenre, { params: { id }, admin: true });
}

export async function DELETE(req: NextRequest, ctx: Ctx) {
    const { id } = await ctx.params;
    return handle(req, deleteGenre, { params: { id }, admin: true });
}
