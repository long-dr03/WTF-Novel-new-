"use client";

import { isVideoUrl } from "@/services/settingsService";

/**
 * Hiển thị media quảng cáo: tự render <video> nếu là video, ngược lại <img>
 * (ảnh tĩnh hoặc GIF động đều dùng <img>). Dùng <img>/<video> thuần thay vì
 * next/image để chạy với mọi URL bất kỳ và hỗ trợ video/GIF.
 */
export function AdMedia({
    src,
    className = "",
    alt = "Quảng cáo",
}: {
    src: string;
    className?: string;
    alt?: string;
}) {
    if (!src) return null;

    if (isVideoUrl(src)) {
        return (
            <video
                src={src}
                className={className}
                autoPlay
                loop
                muted
                playsInline
            />
        );
    }

    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={alt} className={className} loading="lazy" />;
}
