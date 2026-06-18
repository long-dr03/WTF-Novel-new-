import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { createReport } from '@/server/controllers/report.controller';

export const POST = (req: NextRequest) => handle(req, createReport, { auth: true });
