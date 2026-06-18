import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getAuthorStats } from '@/server/controllers/analytics.controller';

export const GET = (req: NextRequest) => handle(req, getAuthorStats, { auth: true });
