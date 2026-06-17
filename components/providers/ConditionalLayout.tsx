"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import ClickSpark from "@/components/ui/ClickSpark/ClickSpark";
import { SiteSettingsProvider } from "@/components/providers/SiteSettingsProvider";
import SideAds from "@/components/ads/SideAds";
import WelcomePopup from "@/components/ads/WelcomePopup";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRequest = pathname?.startsWith("/admin");

  if (isAdminRequest) {
    return <>{children}</>;
  }

  return (
    <SiteSettingsProvider>
      <Header />
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
      <Footer />
      <SideAds />
      <WelcomePopup />
    </SiteSettingsProvider>
  );
}
