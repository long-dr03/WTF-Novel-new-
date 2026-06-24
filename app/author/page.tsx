"use client"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/providers/AuthProvider"
import { DashboardStats } from "@/components/author/DashboardStats"
import { NovelList } from "@/components/author/NovelList"
import  WriteNovel  from "@/components/author/WriteNovelV2"
import { AuthorSettings } from "@/components/author/AuthorSettings"
import { LayoutDashboard, BookOpen, PenTool, Settings, LogOut, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { getNovelsByAuthorService } from "@/services/novelService"

type TabType = "dashboard" | "novels" | "write" | "settings"

interface Novel {
    _id: string;
    title: string;
    description: string;
    image: string;
    status: string;
}
const Page = () => {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState<TabType>("dashboard")
    const [authorNovels, setAuthorNovels] = useState<Novel[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedNovelId, setSelectedNovelId] = useState<string | null>(null)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

    useEffect(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("author-sidebar-collapsed");
            if (saved === "true") {
                setIsSidebarCollapsed(true);
            }
        }
    }, []);

    const toggleSidebar = () => {
        setIsSidebarCollapsed(prev => {
            const next = !prev;
            if (typeof window !== "undefined") {
                localStorage.setItem("author-sidebar-collapsed", String(next));
            }
            return next;
        });
    };
    useEffect(() => {
        const fetchNovels = async () => {
            if (user?.id) {
                try {
                    const response = await getNovelsByAuthorService(user.id)
                    if (response) {
                        setAuthorNovels(response as Novel[])
                    }
                    console.log("Fetched novels:", response)
                } catch (error) {
                    console.error("Error fetching novels:", error)
                } finally {
                    setLoading(false)
                }
            }
        }
        fetchNovels()
    }, [user?.id])

    // Callback khi nhấn "Sửa" từ NovelList
    const handleEditNovel = (novelId: string) => {
        setSelectedNovelId(novelId)
        setActiveTab("write")
    }

    if (!user) {
        return null
    }

    const menuItems = [
        {
            id: "dashboard" as TabType,
            label: "Thống kê",
            icon: LayoutDashboard
        },
        {
            id: "novels" as TabType,
            label: "Danh sách truyện",
            icon: BookOpen
        },
        {
            id: "write" as TabType,
            label: "Viết truyện",
            icon: PenTool
        },
        {
            id: "settings" as TabType,
            label: "Cài đặt",
            icon: Settings
        }
    ]

    const renderContent = () => {
        if (loading && activeTab === "novels") {
            return <div className="p-6">Đang tải...</div>
        }
        switch (activeTab) {
            case "dashboard":
                return <DashboardStats />
            case "novels":
                return <NovelList novels={authorNovels} onEditNovel={handleEditNovel} />
            case "write":
                return <WriteNovel novels={authorNovels} selectedNovelId={selectedNovelId} onNovelChange={setSelectedNovelId} />
            case "settings":
                return <AuthorSettings novels={authorNovels} />
        }
    }

    return (
        <div className={cn(
            "my-4 sm:my-8 flex flex-col lg:flex-row gap-4 lg:gap-6 min-h-[600px] mx-auto px-3 sm:px-4 transition-all duration-300",
            activeTab === "write" ? "max-w-[98%] w-full" : "container"
        )}>
            <div className={cn(
                "rounded-2xl w-full shrink-0 flex flex-col gap-2 bg-card border shadow-sm h-fit lg:sticky lg:top-20 transition-all duration-300",
                isSidebarCollapsed ? "lg:w-16" : "lg:w-64"
            )}>
                <div className={cn("hidden lg:flex p-4 items-center gap-3 border-b", isSidebarCollapsed && "justify-center px-2")}>
                    <Avatar className="w-10 h-10 rounded-full overflow-hidden">
                        <AvatarImage src={user.avatar || "https://github.com/shadcn.png"} />
                        <AvatarFallback>{user.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    {!isSidebarCollapsed && (
                        <div className="overflow-hidden">
                            <h3 className="font-semibold text-sm truncate">{user.username}</h3>
                            <p className="text-xs text-muted-foreground">Tác giả</p>
                        </div>
                    )}
                </div>

                <nav className="flex-1 p-2 flex flex-row lg:flex-col gap-1 overflow-x-auto scrollbar-hidden w-full">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={cn(
                                    "w-auto lg:w-full flex items-center gap-2 lg:gap-3 px-3 py-2 rounded-lg text-sm transition-colors whitespace-nowrap shrink-0",
                                    isSidebarCollapsed && "lg:justify-center lg:px-2",
                                    activeTab === item.id 
                                        ? "bg-primary text-white shadow-sm font-semibold" 
                                        : "text-zinc-650 dark:text-zinc-400 hover:text-primary dark:hover:text-primary hover:bg-primary/10 dark:hover:bg-zinc-800/40 font-medium"
                                )}
                                title={isSidebarCollapsed ? item.label : undefined}
                            >
                                <Icon className="h-4 w-4 flex-shrink-0" />
                                {!isSidebarCollapsed && <span>{item.label}</span>}
                            </button>
                        )
                    })}
                </nav>

                <div className="hidden lg:flex flex-col gap-1 p-2 border-t">
                    <button
                        onClick={toggleSidebar}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 transition-colors"
                        title={isSidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
                    >
                        {isSidebarCollapsed ? <ChevronRight className="h-4 w-4 flex-shrink-0" /> : <ChevronLeft className="h-4 w-4 flex-shrink-0" />}
                        {!isSidebarCollapsed && <span>Thu gọn</span>}
                    </button>
                    <button className={cn("w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors", isSidebarCollapsed && "justify-center px-2")}>
                        <LogOut className="h-4 w-4 flex-shrink-0" />
                        {!isSidebarCollapsed && <span>Đăng xuất</span>}
                    </button>
                </div>
            </div>

            <div className="flex-1 min-w-0 bg-card rounded-2xl border shadow-sm overflow-hidden min-h-[500px]">
                {renderContent()}
            </div>
        </div>
    )
}

export default Page