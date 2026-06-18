import { NextRequest } from 'next/server';
import { handle } from '@/server/adapter';
import { register } from '@/server/controllers/authendication';

export const POST = (req: NextRequest) => handle(req, register);
