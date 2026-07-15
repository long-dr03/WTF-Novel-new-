import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { trackAdClick } from '@/server/controllers/tracking.controller';

export const POST = (req: NextRequest) => handle(req, trackAdClick);
