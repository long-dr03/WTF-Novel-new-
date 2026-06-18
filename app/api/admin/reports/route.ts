import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { getReports } from '@/server/controllers/report.controller';

export const GET = (req: NextRequest) => handle(req, getReports, { admin: true });
