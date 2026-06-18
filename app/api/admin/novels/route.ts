import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getNovels } from '@/server/controllers/adminController';

export const GET = (req: NextRequest) => handle(req, getNovels, { admin: true });
