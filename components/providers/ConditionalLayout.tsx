"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import ClickSpark from "@/components/ui/ClickSpark/ClickSpark";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRequest = pathname?.startsWith("/admin");

  if (isAdminRequest) {
    return <>{children}</>;
  }

  return (
    <>
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
    </>
  );
}
