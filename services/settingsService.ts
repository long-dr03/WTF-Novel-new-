import axios from "../setup/axios";

export interface AdSlot {
    enabled: boolean;
    imageUrl: string;
    link: string;
}

export interface PublicSettings {
    siteName?: string;
    siteDescription?: string;
    ads: {
        enabled: boolean;
        left: AdSlot;
        right: AdSlot;
    };
    popup: {
        enabled: boolean;
        title: string;
        description: string;
        imageUrl: string;
        link: string;
    };
}

export const emptyAdSlot: AdSlot = { enabled: false, imageUrl: "", link: "" };

/** Nhận diện URL có phải video không (để render <video> thay vì <img>). GIF vẫn coi là ảnh. */
export const isVideoUrl = (url?: string): boolean => {
    if (!url) return false;
    return /\.(mp4|webm|ogg|ogv|mov|m4v)(\?.*)?$/i.test(url.trim());
};

export const defaultPublicSettings: PublicSettings = {
    ads: {
        enabled: false,
        left: { ...emptyAdSlot },
        right: { ...emptyAdSlot },
    },
    popup: {
        enabled: false,
        title: "",
        description: "",
        imageUrl: "",
        link: "",
    },
};

/**
 * Lấy cấu hình công khai (quảng cáo + popup) để hiển thị cho người dùng.
 */
export const getPublicSettingsService = async (): Promise<PublicSettings> => {
    try {
        const res = (await axios.get("/public-settings")) as Partial<PublicSettings>;
        return {
            ...defaultPublicSettings,
            ...res,
            ads: { ...defaultPublicSettings.ads, ...res?.ads },
            popup: { ...defaultPublicSettings.popup, ...res?.popup },
        };
    } catch {
        return defaultPublicSettings;
    }
};
