import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getPopularNovels } from '@/server/controllers/getNovel';

export const GET = (req: NextRequest) => handle(req, getPopularNovels);
