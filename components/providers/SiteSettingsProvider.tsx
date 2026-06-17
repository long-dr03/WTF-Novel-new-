"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
    PublicSettings,
    defaultPublicSettings,
    getPublicSettingsService,
} from "@/services/settingsService";

const SiteSettingsContext = createContext<PublicSettings>(defaultPublicSettings);

export function useSiteSettings() {
    return useContext(SiteSettingsContext);
}

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<PublicSettings>(defaultPublicSettings);

    useEffect(() => {
        let mounted = true;
        getPublicSettingsService().then((data) => {
            if (mounted) setSettings(data);
        });
        return () => {
            mounted = false;
        };
    }, []);

    return (
        <SiteSettingsContext.Provider value={settings}>
            {children}
        </SiteSettingsContext.Provider>
    );
}
