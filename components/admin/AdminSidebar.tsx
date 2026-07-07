"use client"

import { useState } from "react"
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
  PenLine,
  Menu,
  X,
  Database
} from "lucide-react"

const sidebarItems = [
    {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard
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
        title: "Sao lưu",
        href: "/admin/backup",
        icon: Database
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
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="flex md:hidden items-center justify-between w-full px-4 h-16 bg-card border-b border-border sticky top-0 z-50">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <h1 className="text-xl font-black bg-gradient-to-r from-primary to-rose-400 bg-clip-text text-transparent tracking-tight">
            gocaudio Admin
          </h1>
        </Link>
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 hover:bg-muted rounded-lg text-muted-foreground transition-colors"
          aria-label="Toggle menu"
        >
          {isOpen ? <X className="w-6 h-6 text-primary" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay Drawer */}
      {isOpen && (
        <div className="fixed inset-0 top-16 bg-background/95 backdrop-blur-md z-45 md:hidden flex flex-col justify-between animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex-1 py-4 px-4 overflow-y-auto space-y-1">
            {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                            "flex items-center gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-200 text-sm font-medium",
                            isActive 
                                ? "bg-primary/10 text-primary border border-primary/20" 
                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <Icon className="w-5 h-5" />
                        <span>{item.title}</span>
                    </Link>
                )
            })}
          </div>
          <div className="p-4 border-t border-border bg-card">
                <button className="flex items-center gap-3 w-full px-4 py-3.5 text-destructive hover:bg-destructive/10 rounded-xl transition-colors font-medium text-sm">
                    <LogOut className="w-5 h-5" />
                    <span>Đăng xuất</span>
                </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Fixed Left) */}
      <div className="hidden md:flex flex-col h-full w-64 bg-card border-r border-border shrink-0">
        <div className="p-6 border-b border-border">
          <Link href="/" className="hover:opacity-80 transition-opacity block">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
              gocaudio Admin
            </h1>
          </Link>
        </div>
        
        <div className="flex-1 py-6 flex flex-col gap-2 px-3 overflow-y-auto w-auto">
          {sidebarItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              
              return (
                  <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                          "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-base",
                          isActive 
                              ? "bg-primary/20 text-primary hover:bg-primary/30 font-medium" 
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                  >
                      <Icon className="w-5 h-5" />
                      <span>{item.title}</span>
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
    </>
  )
}
