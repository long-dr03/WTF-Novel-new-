"use client"
import { useState, useEffect } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@radix-ui/react-avatar"
import { useAuth } from "@/components/providers/AuthProvider"
import { DashboardStats } from "@/components/author/DashboardStats"
import { NovelList } from "@/components/author/NovelList"
import  WriteNovel  from "@/components/author/WriteNovel"
import { LayoutDashboard, BookOpen, PenTool, Settings, LogOut } from "lucide-react"
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
    useEffect(() => {
        const fetchNovels = async () => {
            if (user?.id) {
                try {
                    const response = await getNovelsByAuthorService(user.id)
                    setAuthorNovels(response.data)
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
                return (
                    <div className="p-6">
                        <h2 className="text-3xl font-bold tracking-tight">Cài đặt</h2>
                        <p className="text-muted-foreground mt-2">Đang phát triển...</p>
                    </div>
                )
        }
    }

    return (
        <div className="author-layout my-8 flex gap-6">
            <div className="author-sidebar rounded-2xl">
                <div className="author-sidebar-header">
                    <Avatar className="author-avatar">
                        <AvatarImage src={user.avatar || "https://github.com/shadcn.png"} />
                        <AvatarFallback>{user.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                    </Avatar>
                    <div className="author-info">
                        <h3 className="font-semibold text-lg">{user.username}</h3>
                        <p className="text-sm text-muted-foreground">Tác giả</p>
                    </div>
                </div>

                <nav className="author-nav">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                className={cn(
                                    "author-nav-item",
                                    activeTab === item.id && "active"
                                )}
                            >
                                <Icon className="h-5 w-5" />
                                <span>{item.label}</span>
                            </button>
                        )
                    })}
                </nav>

                <div className="author-sidebar-footer">
                    <button className="author-nav-item logout">
                        <LogOut className="h-5 w-5" />
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </div>

            <div className="author-content rounded-2xl">
                {renderContent()}
            </div>
        </div>
    )
}

export default Page