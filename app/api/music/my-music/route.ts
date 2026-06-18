import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getMyMusic } from '@/server/controllers/music.controller';

export const GET = (req: NextRequest) => handle(req, getMyMusic, { auth: true });
