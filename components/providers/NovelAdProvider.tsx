"use client";

import { createContext, useContext, useState } from "react";

export interface NovelAd {
    adImage?: string;
    adLink?: string;
}

interface NovelAdContextType {
    novelAd: NovelAd | null;
    setNovelAd: (ad: NovelAd | null) => void;
}

const NovelAdContext = createContext<NovelAdContextType>({
    novelAd: null,
    setNovelAd: () => { },
});

export function useNovelAd() {
    return useContext(NovelAdContext);
}

/**
 * Giữ quảng cáo riêng của truyện đang đọc. Các trang truyện/chương set giá trị
 * này khi tải truyện; SideAds đọc để ghi đè link/ảnh quảng cáo chung.
 */
export function NovelAdProvider({ children }: { children: React.ReactNode }) {
    const [novelAd, setNovelAd] = useState<NovelAd | null>(null);
    return (
        <NovelAdContext.Provider value={{ novelAd, setNovelAd }}>
            {children}
        </NovelAdContext.Provider>
    );
}
