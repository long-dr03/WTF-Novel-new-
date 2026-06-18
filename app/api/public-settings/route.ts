import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getPublicSettings } from '@/server/controllers/home.controller';

export const GET = (req: NextRequest) => handle(req, getPublicSettings);
