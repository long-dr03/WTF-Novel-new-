"use client"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/components/providers/AuthProvider"
import { DashboardStats } from "@/components/author/DashboardStats"
import { NovelList } from "@/components/author/NovelList"
import  WriteNovel  from "@/components/author/WriteNovel"
import { LayoutDashboard, BookOpen, PenTool, Settings, LogOut, Music } from "lucide-react"
import { cn } from "@/lib/utils"
import { getNovelsByAuthorService } from "@/services/novelService"
import { BackgroundMusicContent } from "@/components/author/BackgroundMusicManager"

type TabType = "dashboard" | "novels" | "write" | "settings" | "music"

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
            id: "music" as TabType,
            label: "Kho nhạc",
            icon: Music
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
            case "music":
                return (
                    <div className="p-6 h-full flex flex-col">
                        <BackgroundMusicContent className="flex-1" />
                    </div>
                )
            case "settings":
                return (
                    <div className="p-6">
                        <h2 className="text-3xl font-bold tracking-tight">Cài đặt</h2>
                        <p className="text-muted-foreground mt-2">Đang phát triển...</p>
                    </div>
                )
        }
    }

    return (
        <div className="author-layout my-8 flex gap-6 min-h-[600px] container mx-auto px-4">
            <div className="author-sidebar rounded-2xl w-64 shrink-0 flex flex-col gap-2 bg-card border shadow-sm h-fit">
                <div className="author-sidebar-header p-4 flex items-center gap-3 border-b">
                    <Avatar className="author-avatar w-10 h-10 rounded-full overflow-hidden">
                        <AvatarImage src={user.avatar || "https://github.com/shadcn.png"} />
                        <AvatarFallback>{user.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="author-info overflow-hidden">
                        <h3 className="font-semibold text-sm truncate">{user.username}</h3>
                        <p className="text-xs text-muted-foreground">Tác giả</p>
                    </div>
                </div>

                <nav className="author-nav flex-1 p-2 space-y-1">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={cn(
                                    "author-nav-item w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                    activeTab === item.id 
                                        ? "bg-primary text-primary-foreground shadow-sm" 
                                        : "hover:bg-accent text-muted-foreground hover:text-foreground"
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </button>
                        )
                    })}
                </nav>

                <div className="author-sidebar-footer p-2 border-t">
                    <button className="author-nav-item logout w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors">
                        <LogOut className="h-4 w-4" />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </div>

            <div className="author-content flex-1 bg-card rounded-2xl border shadow-sm overflow-hidden min-h-[500px]">
                {renderContent()}
            </div>
        </div>
    )
}

export default Page