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
  LogOut
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
    }
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <div className="flex flex-col h-full w-64 bg-card border-r border-border">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
          Novel Admin
        </h1>
      </div>
      
      <div className="flex-1 py-6 flex flex-col gap-2 px-3">
        {sidebarItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href
            
            return (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                        isActive 
                            ? "bg-primary/20 text-primary hover:bg-primary/30" 
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.title}</span>
                </Link>
            )
        })}
      </div>

      <div className="p-4 border-t border-border">
            <button className="flex items-center gap-3 w-full px-4 py-3 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Đăng xuất</span>
            </button>
      </div>
    </div>
  )
}
