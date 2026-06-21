"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { useSiteSettings } from "@/components/providers/SiteSettingsProvider";
import { AdMedia } from "@/components/ads/AdMedia";

// Hoãn nhẹ trước khi hiện (tránh "intrusive interstitial" mà Google phạt SEO
// khi popup che nội dung ngay lúc vừa vào trang trên mobile).
const SHOW_DELAY_MS = 1500;

export default function WelcomePopup() {
    const { popup } = useSiteSettings();
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    // Hiện ở trang chủ ("/") và trang chi tiết truyện / đọc chương ("/novel/*")
    const isPopupPage = pathname === "/" || Boolean(pathname?.startsWith("/novel/"));

    useEffect(() => {
        // Rời khỏi các trang trên thì đóng popup
        if (!popup?.enabled || !isPopupPage) {
            setOpen(false);
            return;
        }
        // Chỉ hiện 1 lần duy nhất trong phiên truy cập (Session Storage)
        if (typeof window !== "undefined") {
            const hasShown = sessionStorage.getItem("hasShownWelcomePopup");
            if (hasShown) {
                return;
            }
        }
        const timer = setTimeout(() => {
            setOpen(true);
            if (typeof window !== "undefined") {
                sessionStorage.setItem("hasShownWelcomePopup", "true");
            }
        }, SHOW_DELAY_MS);
        return () => clearTimeout(timer);
    }, [popup?.enabled, isPopupPage, pathname]);

    if (!popup?.enabled) return null;

    const hasImage = Boolean(popup.imageUrl);
    const hasText = Boolean(popup.title || popup.description);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                aria-describedby={undefined}
                className="overflow-hidden p-0 sm:max-w-md"
                onPointerDownOutside={(e) => {
                    if (popup.link) {
                        e.preventDefault();
                        window.open(popup.link, "_blank", "nofollow sponsored noopener noreferrer");
                        setOpen(false);
                    }
                }}
            >
                <span className="absolute left-2 top-2 z-10 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-medium leading-none text-white">
                    Quảng cáo
                </span>

                {/* DialogTitle luôn tồn tại (ẩn nếu trống) để đảm bảo accessibility */}
                <DialogHeader className={hasText ? "px-5 pt-8 sm:px-6" : "sr-only"}>
                    <DialogTitle className={popup.title ? "" : "sr-only"}>
                        {popup.title || "Quảng cáo"}
                    </DialogTitle>
                    {popup.description && (
                        <DialogDescription>{popup.description}</DialogDescription>
                    )}
                </DialogHeader>

                {hasImage &&
                    (popup.link ? (
                        <a
                            href={popup.link}
                            target="_blank"
                            rel="nofollow sponsored noopener noreferrer"
                            onClick={() => setOpen(false)}
                            className="block"
                        >
                            <div className="relative h-56 w-full sm:h-72">
                                <AdMedia
                                    src={popup.imageUrl}
                                    alt={popup.title || "Khuyến mãi"}
                                    className="absolute inset-0 h-full w-full object-cover"
                                />
                            </div>
                        </a>
                    ) : (
                        <div className="relative h-56 w-full sm:h-72">
                            <AdMedia
                                src={popup.imageUrl}
                                alt={popup.title || "Khuyến mãi"}
                                className="absolute inset-0 h-full w-full object-cover"
                            />
                        </div>
                    ))}

                {/* Trường hợp không có ảnh nhưng có link -> hiển thị nút hành động */}
                {!hasImage && popup.link && (
                    <div className="px-5 pb-6 sm:px-6">
                        <a
                            href={popup.link}
                            target="_blank"
                            rel="nofollow sponsored noopener noreferrer"
                            onClick={() => setOpen(false)}
                            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Xem ngay
                        </a>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
