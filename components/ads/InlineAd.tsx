"use client";

import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { AdMedia } from "@/components/ads/AdMedia";

export function InlineAd() {
    const { popup } = useSiteSettings();

    // Nếu popup tắt hoặc không cấu hình ảnh thì không hiển thị banner
    if (!popup?.enabled || !popup.imageUrl) return null;

    const bannerContent = (
        <div className="relative w-full overflow-hidden rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-900/40 p-4 backdrop-blur transition-all hover:border-primary/30 flex flex-col md:flex-row gap-4 items-center group">
            <span className="absolute left-2 top-2 z-10 rounded bg-black/75 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary border border-primary/25 leading-none">
                Tài trợ
            </span>
            
            <div className="relative w-full md:w-48 h-28 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
                <AdMedia
                    src={popup.imageUrl}
                    alt={popup.title || "Quảng cáo"}
                    className="absolute inset-0 h-full w-full object-cover group-hover:scale-[1.03] transition-all duration-300"
                />
            </div>
            
            <div className="flex-1 text-center md:text-left space-y-1 py-1">
                {popup.title && (
                    <h3 className="font-bold text-base md:text-lg text-zinc-900 dark:text-white group-hover:text-primary transition-colors">
                        {popup.title}
                    </h3>
                )}
                {popup.description && (
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-2xl">
                        {popup.description}
                    </p>
                )}
                {popup.link && (
                    <div className="text-xs text-primary font-semibold hover:underline flex items-center justify-center md:justify-start gap-1 mt-2">
                        Xem ngay
                    </div>
                )}
            </div>
        </div>
    );

    if (popup.link) {
        return (
            <a href={popup.link} target="_blank" rel="nofollow sponsored noopener noreferrer" className="block w-full">
                {bannerContent}
            </a>
        );
    }

    return bannerContent;
}
