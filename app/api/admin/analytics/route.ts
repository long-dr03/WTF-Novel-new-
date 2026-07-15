import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getAnalyticsOverview } from '@/server/controllers/tracking.controller';

export const GET = (req: NextRequest) => handle(req, getAnalyticsOverview, { admin: true });
