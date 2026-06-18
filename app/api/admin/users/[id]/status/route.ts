import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { updateUserStatus } from '@/server/controllers/adminController';

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(req: NextRequest, ctx: Ctx) {
    const { id } = await ctx.params;
    return handle(req, updateUserStatus, { params: { id }, admin: true });
}
