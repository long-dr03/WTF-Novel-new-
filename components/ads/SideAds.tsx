"use client";

import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { AdMedia } from "@/components/ads/AdMedia";
import type { AdSlot } from "@/services/settingsService";

function AdBanner({ slot, side }: { slot: AdSlot; side: "left" | "right" }) {
    if (!slot?.enabled || !slot.imageUrl) return null;

    const sideClass = side === "left" ? "left-1" : "right-1";

    const banner = (
        <div className="relative h-[70vh] max-h-[600px] w-[110px] overflow-hidden rounded-lg border border-border bg-muted/30 shadow-lg min-[1700px]:w-40">
            <span className="absolute left-1 top-1 z-10 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">
                Quảng cáo
            </span>
            <AdMedia
                src={slot.imageUrl}
                className="absolute inset-0 h-full w-full object-cover"
            />
        </div>
    );

    return (
        <aside
            className={`fixed top-1/2 ${sideClass} z-30 hidden -translate-y-1/2 2xl:block`}
            aria-label="Quảng cáo"
        >
            {slot.link ? (
                <a href={slot.link} target="_blank" rel="nofollow sponsored noopener noreferrer">
                    {banner}
                </a>
            ) : (
                banner
            )}
        </aside>
    );
}

export default function SideAds() {
    const { ads } = useSiteSettings();

    if (!ads?.enabled) return null;

    return (
        <>
            <AdBanner slot={ads.left} side="left" />
            <AdBanner slot={ads.right} side="right" />
        </>
    );
}
