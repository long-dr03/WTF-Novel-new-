import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/**
 * Cloudflare R2 (S3-compatible) — dùng để lưu file audio thay cho UploadThing.
 * Ưu điểm cho tình huống ĐỌC NHIỀU: egress miễn phí, không có quota tải/file như Google Drive.
 *
 * Env cần có (.env):
 *   R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_PUBLIC_BASE_URL
 */

const accountId = process.env.R2_ACCOUNT_ID;
const bucket = process.env.R2_BUCKET;
const publicBase = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/+$/, '');

let _client: S3Client | null = null;

function client(): S3Client {
    if (!accountId || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
        throw new Error('R2 chưa được cấu hình (thiếu R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY).');
    }
    if (!_client) {
        _client = new S3Client({
            region: 'auto',
            endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: process.env.R2_ACCESS_KEY_ID,
                secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
            },
        });
    }
    return _client;
}

/** Đã cấu hình đủ để dùng R2 chưa? */
export function r2Configured(): boolean {
    return Boolean(
        accountId &&
        process.env.R2_ACCESS_KEY_ID &&
        process.env.R2_SECRET_ACCESS_KEY &&
        bucket &&
        publicBase
    );
}

/** Chuẩn hoá tên file -> key an toàn (bỏ dấu, ký tự lạ). */
function safeName(name: string): string {
    const base = (name || 'audio')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-zA-Z0-9._-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
    return base.slice(-80) || 'audio';
}

/**
 * Tạo URL upload trực tiếp (presigned PUT) cho một file bất kỳ.
 * Client sẽ PUT thẳng file lên R2 với ĐÚNG Content-Type đã ký (nếu lệch -> 403).
 * @param folder Thư mục (prefix) trên bucket, vd 'chapter-audio' | 'images' | 'media'
 */
export async function createUploadUrl(filename: string, contentType: string, folder = 'uploads') {
    if (!bucket) throw new Error('R2_BUCKET chưa được cấu hình.');
    if (!publicBase) throw new Error('R2_PUBLIC_BASE_URL chưa được cấu hình.');

    const ct = contentType || 'application/octet-stream';
    const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, '') || 'uploads';
    const key = `${safeFolder}/${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName(filename)}`;

    const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: ct });
    const uploadUrl = await getSignedUrl(client(), cmd, { expiresIn: 600 }); // 10 phút

    return { uploadUrl, publicUrl: `${publicBase}/${key}`, key, contentType: ct };
}

/** Tương thích ngược cho luồng audio. */
export function createAudioUploadUrl(filename: string, contentType: string) {
    return createUploadUrl(filename, contentType, 'chapter-audio');
}

/** Xoá 1 object trên R2 theo key (dùng khi xoá audio của chương). */
export async function deleteAudioObject(key: string): Promise<void> {
    if (!bucket || !key) return;
    await client().send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

/** Suy ra key R2 từ public URL (để xoá). Trả null nếu URL không thuộc R2 base. */
export function keyFromPublicUrl(url: string): string | null {
    if (!url || !publicBase || !url.startsWith(publicBase + '/')) return null;
    return url.slice(publicBase.length + 1);
}
