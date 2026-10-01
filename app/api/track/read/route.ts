import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { trackRead } from '@/server/controllers/read.controller';

export const POST = (request: NextRequest) => handle(request, trackRead);
