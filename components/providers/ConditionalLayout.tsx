"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import ClickSpark from "@/components/ui/ClickSpark/ClickSpark";
import { SiteSettingsProvider } from "@/components/providers/SiteSettingsProvider";
import { NovelAdProvider } from "@/components/providers/NovelAdProvider";
import SideAds from "@/components/ads/SideAds";
import WelcomePopup from "@/components/ads/WelcomePopup";
import { useAudioPlayer } from "@/components/providers/AudioPlayerContext";
import { GlobalAudioPlayer } from "@/components/reader/GlobalAudioPlayer";
import { MobileQuickAudioButton } from "@/components/reader/MobileQuickAudioButton";

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
      <NovelAdProvider>
        {!isReaderPage && <Header />}
        <ClickSpark
          sparkColor='#fff'
          sparkSize={10}
          sparkRadius={15}
          sparkCount={8}
          duration={400}
        >
          <main className="flex-1 z-10 w-full">
            {children}
          </main>
        </ClickSpark>
        {!isReaderPage && <Footer />}
        {audioUrl && !isReaderPage && (
          <div aria-hidden="true" className="h-[calc(132px+env(safe-area-inset-bottom))] shrink-0 md:h-[72px]" />
        )}
        {!isAuthorPage && <SideAds />}
        {!isAuthorPage && <WelcomePopup />}
        {!isReaderPage && <MobileQuickAudioButton />}
        <GlobalAudioPlayer />
      </NovelAdProvider>
    </SiteSettingsProvider>
  );
}
