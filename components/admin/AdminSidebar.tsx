"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Tags,
  Settings,
  Flag,
  LogOut,
  PenLine
} from "lucide-react"

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard // No quotes, passing component
    },
    {
        title: "Người dùng",
        href: "/admin/users",
        icon: Users
    },
    {
        title: "Truyện",
        href: "/admin/novels",
        icon: BookOpen
    },
    {
        title: "Thể loại",
        href: "/admin/genres",
        icon: Tags
    },
    {
        title: "Báo cáo",
        href: "/admin/reports",
        icon: Flag
    },
    {
        title: "Cài đặt",
        href: "/admin/settings",
        icon: Settings
    },
    {
        title: "Viết truyện",
        href: "/author",
        icon: PenLine
    }
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-row md:flex-col h-auto md:h-full w-full md:w-64 bg-card border-b md:border-b-0 md:border-r border-border overflow-x-auto md:overflow-x-visible shrink-0 scrollbar-hidden">
      <div className="hidden md:block p-6 border-b border-border">
        <Link href="/" className="hover:opacity-80 transition-opacity block">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            Novel Admin
          </h1>
        </Link>
      </div>
      
      <div className="flex-1 py-2 md:py-6 flex flex-row md:flex-col gap-1 md:gap-2 px-3 overflow-x-auto scrollbar-hidden w-full md:w-auto">
        {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "flex items-center gap-2 md:gap-3 px-4 py-2 md:py-3 rounded-lg transition-all duration-200 whitespace-nowrap text-sm md:text-base",
                        isActive 
                            ? "bg-primary/20 text-primary hover:bg-primary/30 font-medium" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <Icon className="w-4 h-4 md:w-5 md:h-5" />
                    <span>{item.title}</span>
                </Link>
            )
        })}
      </div>

      <div className="hidden md:block p-4 border-t border-border">
            <button className="flex items-center gap-3 w-full px-4 py-3 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Đăng xuất</span>
            </button>
      </div>
    </div>
  )
}
