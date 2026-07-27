import axios from "@/setup/axios";

/**
 * Thu nhỏ canvas nếu cạnh dài vượt maxDim (giữ đúng tỉ lệ). Trả canvas mới hoặc chính nó.
 * Dùng bởi các uploader có sẵn canvas (bìa/avatar) để giới hạn kích thước ảnh lưu.
 */
export function downscaleCanvas(canvas: HTMLCanvasElement, maxDim: number): HTMLCanvasElement {
    const longest = Math.max(canvas.width, canvas.height);
    if (longest <= maxDim) return canvas;
    const f = maxDim / longest;
    const out = document.createElement("canvas");
    out.width = Math.max(1, Math.round(canvas.width * f));
    out.height = Math.max(1, Math.round(canvas.height * f));
    const ctx = out.getContext("2d");
    if (!ctx) return canvas;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(canvas, 0, 0, out.width, out.height);
    return out;
}

/**
 * Convert 1 file ẢNH sang WebP trên trình duyệt: downscale nếu quá lớn rồi encode WebP.
 * - Bỏ qua gif (giữ animation).
 * - Ảnh webp sẵn: chỉ re-encode nếu quá lớn HOẶC ra file nhỏ hơn; nếu không thì giữ gốc.
 * - Trình duyệt không encode được webp -> trả file gốc.
 */
export async function fileToWebp(
    file: File,
    opts: { maxDimension?: number; quality?: number } = {}
): Promise<File> {
    const { maxDimension = 1600, quality = 0.8 } = opts;
    if (!file.type.startsWith("image/") || file.type === "image/gif") {
        return file;
    }
    try {
        const bitmap = await createImageBitmap(file);
        let w = bitmap.width;
        let h = bitmap.height;
        const longest = Math.max(w, h);
        const oversized = longest > maxDimension;
        if (oversized) {
            const f = maxDimension / longest;
            w = Math.round(w * f);
            h = Math.round(h * f);
        }

        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return file;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(bitmap, 0, 0, w, h);
        bitmap.close?.();

        const blob: Blob | null = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/webp", quality)
        );
        if (!blob || blob.type !== "image/webp") return file;

        // Ảnh webp gốc, không bị thu nhỏ, mà re-encode không nhẹ hơn -> giữ nguyên gốc
        if (file.type === "image/webp" && !oversized && blob.size >= file.size) return file;

        const name = file.name.replace(/\.[^.]+$/, "") + ".webp";
        return new File([blob], name, { type: "image/webp" });
    } catch {
        return file;
    }
}

/** PUT file thẳng lên R2 qua presigned URL (Content-Type phải khớp giá trị đã ký). */
function putToR2(
    url: string,
    file: File,
    contentType: string,
    onProgress?: (percent: number) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url, true);
        xhr.setRequestHeader("Content-Type", contentType);
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () =>
            xhr.status >= 200 && xhr.status < 300
                ? resolve()
                : reject(new Error(`R2 PUT thất bại: ${xhr.status}`));
        xhr.onerror = () => reject(new Error("Lỗi mạng khi tải lên R2"));
        xhr.send(file);
    });
}

/**
 * Upload 1 ảnh/video lên Cloudflare R2. Ảnh sẽ tự convert sang WebP trước.
 * @returns publicUrl để lưu, hoặc null nếu lỗi.
 */
export async function uploadMediaToR2(
    inputFile: File,
    opts: { webp?: boolean; onProgress?: (percent: number) => void } = {}
): Promise<string | null> {
    try {
        const file = opts.webp === false ? inputFile : await fileToWebp(inputFile);
        const contentType = file.type || "application/octet-stream";

        const presign: any = await axios.post("/upload/presign", {
            filename: file.name,
            contentType,
        });
        const data =
            presign?.data?.success !== undefined
                ? presign.data.data
                : presign?.data ?? presign;
        if (!data?.uploadUrl || !data?.publicUrl) return null;

        await putToR2(data.uploadUrl, file, data.contentType || contentType, opts.onProgress);
        return data.publicUrl as string;
    } catch (error) {
        console.error("Error uploading media to R2:", error);
        return null;
    }
}
