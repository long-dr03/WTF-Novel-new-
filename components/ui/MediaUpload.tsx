"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useUploadThing } from "@/lib/uploadthing";
import { Loader2, UploadCloud, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { isVideoUrl } from "@/services/settingsService";
import { toast } from "sonner";

interface MediaUploadProps {
    value: string;
    onChange: (url: string) => void;
    /** Tỷ lệ khung xem trước, mặc định cao (banner dọc). VD: "aspect-[3/4]" | "aspect-video" */
    previewClassName?: string;
}

export function MediaUpload({ value, onChange, previewClassName = "aspect-[3/4]" }: MediaUploadProps) {
    const [uploading, setUploading] = useState(false);

    const { startUpload } = useUploadThing("adMedia", {
        onClientUploadComplete: (res) => {
            const url = res?.[0]?.ufsUrl || (res?.[0] as any)?.url;
            if (url) {
                onChange(url);
                toast.success("Đã tải lên thành công");
            }
            setUploading(false);
        },
        onUploadError: (error) => {
            toast.error(error.message || "Lỗi khi tải lên");
            setUploading(false);
        },
    });

    const handleFiles = useCallback(
        async (files: File[]) => {
            const file = files?.[0];
            if (!file) return;
            if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
                toast.error("Chỉ hỗ trợ ảnh, GIF hoặc video");
                return;
            }
            setUploading(true);
            try {
                await startUpload([file]);
            } catch {
                setUploading(false);
                toast.error("Lỗi khi tải lên");
            }
        },
        [startUpload]
    );

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: handleFiles,
        accept: { "image/*": [], "video/*": [] },
        maxFiles: 1,
        multiple: false,
        noKeyboard: true,
    });

    // Dán ảnh/video trực tiếp từ clipboard (Ctrl+V) khi đang focus vùng upload
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (const item of items) {
            if (item.type.startsWith("image/") || item.type.startsWith("video/")) {
                const file = item.getAsFile();
                if (file) {
                    e.preventDefault();
                    handleFiles([file]);
                    return;
                }
            }
        }
    };

    return (
        <div className="space-y-2">
            <div
                {...getRootProps()}
                onPaste={handlePaste}
                tabIndex={0}
                className={`relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-4 text-center transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                    isDragActive ? "border-primary bg-primary/5" : "border-input hover:border-primary/50"
                }`}
            >
                <input {...getInputProps()} />

                {value ? (
                    <div className="relative w-full">
                        <div className={`relative w-full overflow-hidden rounded-md bg-muted ${previewClassName}`}>
                            {isVideoUrl(value) ? (
                                <video src={value} className="absolute inset-0 h-full w-full object-contain" muted loop autoPlay playsInline />
                            ) : (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={value} alt="preview" className="absolute inset-0 h-full w-full object-contain" />
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange("");
                            }}
                            className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                            aria-label="Xóa media"
                        >
                            <X className="h-4 w-4" />
                        </button>
                        <p className="mt-2 text-xs text-muted-foreground">Nhấp / kéo thả để thay media khác</p>
                    </div>
                ) : uploading ? (
                    <div className="flex flex-col items-center gap-2 py-4 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin" />
                        <span className="text-sm">Đang tải lên...</span>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-1 py-4 text-muted-foreground">
                        <UploadCloud className="h-7 w-7" />
                        <p className="text-sm font-medium">Kéo thả, dán (Ctrl+V) hoặc nhấp để chọn</p>
                        <p className="text-xs">Ảnh, GIF hoặc Video (ảnh ≤16MB, video ≤64MB)</p>
                    </div>
                )}
            </div>

            <Input
                placeholder="...hoặc dán link ảnh/video trực tiếp"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}
