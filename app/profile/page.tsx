"use client"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReadingCard, FavoriteCard, HistoryItem, StatCard } from "@/components/cards"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ProfileUpdateForm } from "@/components/forms"
import { useAuth } from "@/components/providers/AuthProvider"
import { ProfileUpdateFormData } from "@/lib/validations/auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import axios from "@/setup/axios"

// Mock data - in real app, this would come from API/database
const readingNovels = [
    {
        id: 1,
        title: "Chàng trai mang trong mình ma công 1",
        coverImage: "/ANIMENETFLIX-FA.webp",
        currentChapter: 45,
        totalChapters: 120,
        lastUpdate: "2 giờ trước"
    },
    {
        id: 2,
        title: "Chàng trai mang trong mình ma công 2",
        coverImage: "/ANIMENETFLIX-FA.webp",
        currentChapter: 67,
        totalChapters: 200,
        lastUpdate: "5 giờ trước"
    },
    {
        id: 3,
        title: "Chàng trai mang trong mình ma công 3",
        coverImage: "/ANIMENETFLIX-FA.webp",
        currentChapter: 12,
        totalChapters: 80,
        lastUpdate: "1 ngày trước"
    },
    {
        id: 4,
        title: "Chàng trai mang trong mình ma công 4",
        coverImage: "/ANIMENETFLIX-FA.webp",
        currentChapter: 89,
        totalChapters: 150,
        lastUpdate: "3 giờ trước"
    }
]

const favoriteNovels = [
    {
        id: 1,
        title: "Truyện yêu thích số 1",
        coverImage: "/ANIMENETFLIX-FA.webp",
        genres: ["Huyền huyễn", "Tu tiên"]
    },
    {
        id: 2,
        title: "Truyện yêu thích số 2",
        coverImage: "/ANIMENETFLIX-FA.webp",
        genres: ["Kiếm hiệp", "Võ hiệp"]
    },
    {
        id: 3,
        title: "Truyện yêu thích số 3",
        coverImage: "/ANIMENETFLIX-FA.webp",
        genres: ["Đô thị", "Hiện đại"]
    },
    {
        id: 4,
        title: "Truyện yêu thích số 4",
        coverImage: "/ANIMENETFLIX-FA.webp",
        genres: ["Huyền huyễn", "Dị giới"]
    },
    {
        id: 5,
        title: "Truyện yêu thích số 5",
        coverImage: "/ANIMENETFLIX-FA.webp",
        genres: ["Tu tiên", "Tiên hiệp"]
    },
    {
        id: 6,
        title: "Truyện yêu thích số 6",
        coverImage: "/ANIMENETFLIX-FA.webp",
        genres: ["Huyền huyễn", "Phương Đông"]
    }
]

const historyItems = [
    {
        id: 1,
        title: "Tên truyện số 1",
        coverImage: "/ANIMENETFLIX-FA.webp",
        chapterNumber: 23,
        chapterTitle: "Trận chiến cuối cùng",
        timeAgo: "1 giờ trước",
        novelUrl: "/"
    },
    {
        id: 2,
        title: "Tên truyện số 2",
        coverImage: "/ANIMENETFLIX-FA.webp",
        chapterNumber: 45,
        chapterTitle: "Sự trở về của anh hùng",
        timeAgo: "2 giờ trước",
        novelUrl: "/"
    },
    {
        id: 3,
        title: "Tên truyện số 3",
        coverImage: "/ANIMENETFLIX-FA.webp",
        chapterNumber: 67,
        chapterTitle: "Bí mật được tiết lộ",
        timeAgo: "3 giờ trước",
        novelUrl: "/"
    },
    {
        id: 4,
        title: "Tên truyện số 4",
        coverImage: "/ANIMENETFLIX-FA.webp",
        chapterNumber: 12,
        chapterTitle: "Khởi đầu mới",
        timeAgo: "4 giờ trước",
        novelUrl: "/"
    },
    {
        id: 5,
        title: "Tên truyện số 5",
        coverImage: "/ANIMENETFLIX-FA.webp",
        chapterNumber: 89,
        chapterTitle: "Cuộc đối đầu định mệnh",
        timeAgo: "5 giờ trước",
        novelUrl: "/"
    }
]

export default function ProfilePage() {
    const { user, isLoading, isAuthenticated } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            router.push('/login')
        }
    }, [isLoading, isAuthenticated, router])

    const handleProfileUpdate = async (data: ProfileUpdateFormData) => {
        try {
            const formData = new FormData();
            formData.append('username', data.username);
            formData.append('email', data.email);

            if (data.avatar) {
                formData.append('avatar', data.avatar);
            }

            if (data.oldPassword) formData.append('oldPassword', data.oldPassword);
            if (data.newPassword) formData.append('newPassword', data.newPassword);

            await axios.put('/me', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });

            // Refresh page to show new data
            window.location.reload();
        } catch (error) {
            console.error("Failed to update profile:", error);
            alert("Cập nhật thất bại. Vui lòng thử lại.");
        }
    }

    if (isLoading) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>
    }

    if (!user) {
        return null // Will redirect in useEffect
    }

    return (
        <div className="w-full flex flex-col items-center py-8">
            <div className="w-full max-w-[1300px] px-4">
                {/* Profile Header */}
                <Card className="mb-8 overflow-hidden border-border/40 bg-background/95 backdrop-blur">
                    <div className="h-32 bg-gradient-to-r from-blue-500/20 to-purple-500/20" />
                    <CardContent className="relative pt-0 pb-6 gap-6 flex flex-col">
                        <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
                            <Avatar className="h-32 w-32 -mt-16 border-4 border-background">
                                <AvatarImage src={user.avatar || "https://github.com/shadcn.png"} />
                                <AvatarFallback>{user.username?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                            </Avatar>

                            <div className="flex-1 space-y-2">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h1 className="text-3xl font-bold">{user.username}</h1>
                                        <p className="text-muted-foreground">{user.email}</p>
                                    </div>
                                </div>

                                <div className="flex flex-wrap gap-4 text-sm">
                                    <div className="flex items-center gap-1">
                                        <span className="font-semibold">156</span>
                                        <span className="text-muted-foreground">Truyện đã đọc</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-semibold">23</span>
                                        <span className="text-muted-foreground">Đang theo dõi</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <span className="font-semibold">1.2k</span>
                                        <span className="text-muted-foreground">Thích</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Collapsible>
                            <CollapsibleTrigger className="flex items-center gap-2 p-3 bg-background/95 backdrop-blur border border-border/40 rounded-md hover:bg-blue-500 transition-colors">Chỉnh sửa Profile</CollapsibleTrigger>
                            <CollapsibleContent>
                                <div className="edit_profile p-6">
                                    <ProfileUpdateForm
                                        onSubmit={handleProfileUpdate}
                                        defaultValues={{
                                            username: user.username,
                                            email: user.email,
                                            avatar: user.avatar || ""
                                        }}
                                    />
                                </div>
                            </CollapsibleContent>
                        </Collapsible>
                    </CardContent>
                </Card>

                {/* Tabs Section */}
                <Tabs defaultValue="reading" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="reading">Đang đọc</TabsTrigger>
                        <TabsTrigger value="favorites">Yêu thích</TabsTrigger>
                        <TabsTrigger value="history">Lịch sử</TabsTrigger>
                    </TabsList>

                    {/* Reading Tab */}
                    <TabsContent value="reading" className="mt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {readingNovels.map((novel) => (
                                <ReadingCard
                                    key={novel.id}
                                    title={novel.title}
                                    coverImage={novel.coverImage}
                                    currentChapter={novel.currentChapter}
                                    totalChapters={novel.totalChapters}
                                    lastUpdate={novel.lastUpdate}
                                    onClick={() => console.log(`Continue reading: ${novel.title}`)}
                                />
                            ))}
                        </div>
                    </TabsContent>

                    {/* Favorites Tab */}
                    <TabsContent value="favorites" className="mt-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {favoriteNovels.map((novel) => (
                                <FavoriteCard
                                    key={novel.id}
                                    title={novel.title}
                                    coverImage={novel.coverImage}
                                    genres={novel.genres}
                                    onClick={() => console.log(`View novel: ${novel.title}`)}
                                />
                            ))}
                        </div>
                    </TabsContent>

                    {/* History Tab */}
                    <TabsContent value="history" className="mt-6">
                        <Card className="border-border/40 bg-background/95 backdrop-blur">
                            <CardHeader>
                                <CardTitle>Lịch sử đọc gần đây</CardTitle>
                                <CardDescription>7 ngày qua</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {historyItems.map((item) => (
                                        <HistoryItem
                                            key={item.id}
                                            title={item.title}
                                            coverImage={item.coverImage}
                                            chapterNumber={item.chapterNumber}
                                            chapterTitle={item.chapterTitle}
                                            timeAgo={item.timeAgo}
                                            novelUrl={item.novelUrl}
                                        />
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Statistics Section */}
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <StatCard
                        title="Tổng thời gian đọc"
                        value="247 giờ"
                        description="Tháng này: +12 giờ"
                    />
                    <StatCard
                        title="Chương đã đọc"
                        value="3,842"
                        description="Tuần này: +87 chương"
                    />
                    <StatCard
                        title="Thể loại yêu thích"
                        value="Huyền huyễn"
                        description="72% tổng số truyện đã đọc"
                    />
                </div>
            </div>
        </div>
    )
}
