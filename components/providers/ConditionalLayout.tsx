"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import ClickSpark from "@/components/ui/ClickSpark/ClickSpark";
import { SiteSettingsProvider } from "@/components/providers/SiteSettingsProvider";
import SideAds from "@/components/ads/SideAds";
import WelcomePopup from "@/components/ads/WelcomePopup";
import { useAudioPlayer } from "@/components/providers/AudioPlayerContext";
import { GlobalAudioPlayer } from "@/components/reader/GlobalAudioPlayer";
import { cn } from "@/lib/utils";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { audioUrl } = useAudioPlayer();
  const isAdminRequest = pathname?.startsWith("/admin");
  const isAuthorPage = pathname?.startsWith("/author");
  const isReaderPage = pathname?.includes("/chapter/");

  if (isAdminRequest) {
    return <>{children}</>;
  }

  return (
    <SiteSettingsProvider>
      {!isReaderPage && <Header />}
      <ClickSpark
        sparkColor='#fff'
        sparkSize={10}
        sparkRadius={15}
        sparkCount={8}
        duration={400}
      >
        <main className={cn("flex-1 z-10 w-full", audioUrl && "pb-[72px]")}>
          {children}
        </main>
      </ClickSpark>
      {!isReaderPage && <Footer />}
      {!isAuthorPage && <SideAds />}
      {!isAuthorPage && <WelcomePopup />}
      <GlobalAudioPlayer />
    </SiteSettingsProvider>
  );
}
