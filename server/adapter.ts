import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promises as fsp } from 'fs';
import { connectDB } from './db';
import { verifyToken } from './variables/jwt';
import User from './models/User';
import Chapter from './models/Chapter';
import type { ShimRequest, ShimResponse } from './types';

type Handler = (req: ShimRequest, res: ShimResponse) => any | Promise<any>;

interface HandleOpts {
    /** Params động từ Next (đã await ctx.params), có thể đổi tên key cho khớp controller */
    params?: Record<string, any>;
    /** Bắt buộc đăng nhập (tương đương middleware `protect`) */
    auth?: boolean;
    /** Bắt buộc quyền admin (tương đương `protect` + `admin`) */
    admin?: boolean;
}

/* ------------------------------------------------------------------ */
/*  Scheduler: tự động đăng chương hẹn giờ (thay cho setInterval cũ)   */
/* ------------------------------------------------------------------ */
let lastScheduledRun = 0;

async function runScheduledPublishThrottled(): Promise<void> {
    const now = Date.now();
    if (now - lastScheduledRun < 60_000) return; // tối đa 1 lần / phút
    lastScheduledRun = now;
    try {
        const result = await Chapter.updateMany(
            { status: 'scheduled', scheduledAt: { $lte: new Date() } },
            { $set: { status: 'published', publishedAt: new Date() } }
        );
        if (result.modifiedCount > 0) {
            console.log(`⏰ [Scheduler] Đã tự động đăng tải ${result.modifiedCount} chương truyện hẹn giờ.`);
        }
    } catch (err) {
        console.error('⏰ [Scheduler] Lỗi khi đăng chương hẹn giờ:', err);
    }
}

/* ------------------------------------------------------------------ */
/*  Lưu file upload (multipart) vào public/uploads để Next phục vụ tĩnh */
/* ------------------------------------------------------------------ */
async function saveUploadedFile(file: File, fieldname: string, params: Record<string, any>) {
    const subdir = fieldname === 'audio' ? path.join('uploads', 'audio') : 'uploads';
    const dir = path.join(process.cwd(), 'public', subdir);
    await fsp.mkdir(dir, { recursive: true });

    const ext = path.extname(file.name) || '';
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const chapterPart = params.chapterId ? `${params.chapterId}-` : '';
    const filename = `${fieldname}-${chapterPart}${uniqueSuffix}${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await fsp.writeFile(path.join(dir, filename), buffer);

    return {
        fieldname,
        originalname: file.name,
        filename,
        mimetype: file.type,
        size: buffer.length,
        path: path.join(dir, filename),
    };
}

/* ------------------------------------------------------------------ */
/*  Build ShimRequest từ NextRequest                                   */
/* ------------------------------------------------------------------ */
async function buildReq(request: NextRequest, params: Record<string, any>): Promise<ShimRequest> {
    const url = new URL(request.url);
    const query: Record<string, any> = {};
    url.searchParams.forEach((v, k) => {
        query[k] = v;
    });

    const headers: Record<string, any> = {};
    request.headers.forEach((v, k) => {
        headers[k.toLowerCase()] = v;
    });

    let body: any = {};
    let file: any;
    const method = request.method.toUpperCase();

    if (method !== 'GET' && method !== 'HEAD') {
        const ct = headers['content-type'] || '';
        try {
            if (ct.includes('multipart/form-data')) {
                const form = await request.formData();
                for (const [k, val] of form.entries()) {
                    if (val && typeof val === 'object' && 'arrayBuffer' in val) {
                        file = await saveUploadedFile(val as File, k, params);
                    } else {
                        body[k] = val;
                    }
                }
            } else if (ct.includes('application/x-www-form-urlencoded')) {
                const form = await request.formData();
                for (const [k, val] of form.entries()) body[k] = val;
            } else {
                const text = await request.text();
                if (text) {
                    try {
                        body = JSON.parse(text);
                    } catch {
                        body = {};
                    }
                }
            }
        } catch (err) {
            console.error('Lỗi parse request body:', err);
        }
    }

    const cookies: Record<string, string> = {};
    request.cookies.getAll().forEach((c) => {
        cookies[c.name] = c.value;
    });

    return { params, query, body, file, headers, cookies };
}

/* ------------------------------------------------------------------ */
/*  ShimResponse + chuyển thành NextResponse                           */
/* ------------------------------------------------------------------ */
function createRes(): ShimResponse {
    const res: any = {
        statusCode: 200,
        _json: undefined,
        _text: undefined,
        _ended: false,
        _headers: {} as Record<string, string>,
        status(code: number) {
            this.statusCode = code;
            return this;
        },
        json(payload: any) {
            this._json = payload;
            this._ended = true;
            return this;
        },
        send(payload: any) {
            this._text = payload;
            this._ended = true;
            return this;
        },
        setHeader(key: string, value: string) {
            this._headers[key] = value;
            return this;
        },
    };
    return res as ShimResponse;
}

function finalize(res: any): NextResponse {
    const headers: Record<string, string> = res._headers || {};
    if (res._json !== undefined) {
        return NextResponse.json(res._json, { status: res.statusCode, headers });
    }
    if (res._text !== undefined) {
        const payload = typeof res._text === 'string' ? res._text : JSON.stringify(res._text);
        return new NextResponse(payload, { status: res.statusCode, headers });
    }
    return new NextResponse(null, { status: res.statusCode, headers });
}

function getBearerToken(req: ShimRequest): string | undefined {
    const auth = req.headers?.authorization;
    if (auth && typeof auth === 'string' && auth.startsWith('Bearer')) {
        return auth.split(' ')[1];
    }
    return undefined;
}

/* ------------------------------------------------------------------ */
/*  Runner chính: thay cho Express route + middleware                  */
/* ------------------------------------------------------------------ */
export async function handle(
    request: NextRequest,
    controller: Handler,
    opts: HandleOpts = {}
): Promise<NextResponse> {
    try {
        await connectDB();
    } catch {
        return NextResponse.json({ message: 'Lỗi kết nối cơ sở dữ liệu' }, { status: 500 });
    }

    // Chạy scheduler đăng chương hẹn giờ (throttle 1 phút/lần)
    void runScheduledPublishThrottled();

    const res = createRes();
    const req = await buildReq(request, opts.params || {});

    // --- Xác thực (tương đương middleware protect/admin) ---
    const token = getBearerToken(req);
    if (token) {
        try {
            const decoded = verifyToken(token);
            req.userId = decoded.userId as string;
            // Gắn cả _id và id để tương thích mọi controller cũ.
            req.user = { _id: decoded.userId, id: decoded.userId };
        } catch {
            if (opts.auth || opts.admin) {
                res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
                return finalize(res);
            }
        }
    }

    if ((opts.auth || opts.admin) && !req.userId) {
        res.status(401).json({ message: 'Không có quyền truy cập. Vui lòng đăng nhập.' });
        return finalize(res);
    }

    if (opts.admin) {
        const user = await User.findById(req.userId);
        if (!user || user.role !== 'admin') {
            res.status(403).json({ message: 'Bạn không có quyền truy cập vào tài nguyên này.' });
            return finalize(res);
        }
    }

    try {
        await controller(req, res);
    } catch (err) {
        console.error('API handler error:', err);
        if (!res._ended) {
            res.status(500).json({ message: 'Lỗi server. Vui lòng thử lại sau.' });
        }
    }

    return finalize(res);
}
