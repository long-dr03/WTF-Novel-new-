import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { checkLibraryStatus } from '@/server/controllers/library.controller';

type Ctx = { params: Promise<{ novelId: string }> };

export async function GET(req: NextRequest, ctx: Ctx) {
    const { novelId } = await ctx.params;
    return handle(req, checkLibraryStatus, { params: { novelId }, auth: true });
}
