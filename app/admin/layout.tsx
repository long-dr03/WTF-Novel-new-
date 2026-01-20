"use client";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 h-full overflow-y-auto p-8 relative">
            <div className="max-w-7xl mx-auto space-y-8">
                {children}
            </div>
        </main>
    </div>
  );
}
