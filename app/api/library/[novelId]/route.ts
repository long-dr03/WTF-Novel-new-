import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { removeFromLibrary } from '@/server/controllers/library.controller';

type Ctx = { params: Promise<{ novelId: string }> };

export async function DELETE(req: NextRequest, ctx: Ctx) {
    const { novelId } = await ctx.params;
    return handle(req, removeFromLibrary, { params: { novelId }, auth: true });
}
