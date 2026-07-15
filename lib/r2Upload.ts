import axios from "@/setup/axios";

/**
 * Convert 1 file ẢNH sang WebP ngay trên trình duyệt (canvas) để nhẹ hơn + tốt SEO.
 * - Bỏ qua nếu không phải ảnh, hoặc đã là webp, hoặc là gif (giữ animation).
 * - Nếu trình duyệt không hỗ trợ encode webp -> trả file gốc.
 */
export async function fileToWebp(file: File, quality = 0.85): Promise<File> {
    if (
        !file.type.startsWith("image/") ||
        file.type === "image/webp" ||
        file.type === "image/gif"
    ) {
        return file;
    }
    try {
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return file;
        ctx.drawImage(bitmap, 0, 0);
        bitmap.close?.();

        const blob: Blob | null = await new Promise((resolve) =>
            canvas.toBlob(resolve, "image/webp", quality)
        );
        if (!blob || blob.type !== "image/webp") return file;

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
