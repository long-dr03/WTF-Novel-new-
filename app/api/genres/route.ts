import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getPublicGenres } from '@/server/controllers/getNovel';

export const GET = (req: NextRequest) => handle(req, getPublicGenres);
