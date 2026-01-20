"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Music, Upload, User, Settings, LogOut } from "lucide-react"
import axios from "@/setup/axios"
import Link from "next/link"
import { toast } from "sonner"
import { getLibraryService } from "@/services/novelService"
import CardNovel from "@/components/cardNovel"

const LibraryTab = ({ type }: { type: 'history' | 'favorite' }) => {
    const [novels, setNovels] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchLibrary = async () => {
            setLoading(true)
            const res = await getLibraryService(type)
            if (res) setNovels(res)
            setLoading(false)
        }
        fetchLibrary()
    }, [type])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    if (novels.length === 0) return (
         <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
            {type === 'history' ? 'Chưa có lịch sử đọc.' : 'Chưa có truyện yêu thích.'}
        </div>
    )

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {novels.map((item: any) => {
                const novel = item.novel
                if (!novel) return null;
                return (
                    <CardNovel
                        key={item._id}
                        novelId={novel._id}
                        coverImage={novel.image || novel.coverImage || "/ANIMENETFLIX-FA.webp"}
                        title={novel.title}
                        genres={[]} // Genres usually not populated deeply here or we format if populated
                    />
                )
            })}
        </div>
    )
}

export default function ProfilePage() {
    const { user, logout } = useAuth()
    const [loading, setLoading] = useState(false)
    const [musicList, setMusicList] = useState<any[]>([])
    const [stats, setStats] = useState({
        novels: 0,
        views: 0
    })

    const fetchMyMusic = async () => {
        try {
            const res = await axios.get('/music/my-music')
            setMusicList(res as any)
        } catch (error) {
            console.error("Failed to fetch music")
        }
    }

    useEffect(() => {
        if (user) {
            fetchMyMusic()
            // Could fetch novel stats too if relevant
        }
    }, [user])

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <p>Vui lòng đăng nhập để xem hồ sơ</p>
                <Link href="/login"><Button>Đăng nhập</Button></Link>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar / Info Card */}
                <Card className="md:col-span-1 h-fit">
                    <CardHeader className="text-center">
                        <Avatar className="w-24 h-24 mx-auto mb-4">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.username[0]}</AvatarFallback>
                        </Avatar>
                        <CardTitle>{user.username}</CardTitle>
                        <div className="flex justify-center mt-2">
                             <Badge>{user.role}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">{user.email}</p>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {user.role === 'admin' && (
                             <Link href="/admin">
                                <Button variant="outline" className="w-full justify-start">
                                    <Settings className="mr-2 h-4 w-4" /> Trang quản trị
                                </Button>
                            </Link>
                        )}
                        <Button variant="ghost" className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10" onClick={logout}>
                            <LogOut className="mr-2 h-4 w-4" /> Đăng xuất
                        </Button>
                    </CardContent>
                </Card>

                {/* Main Content */}
                <div className="md:col-span-3">
                    <Tabs defaultValue="music">
                        <TabsList>
                            <TabsTrigger value="music">Nhạc của tôi</TabsTrigger>
                            <TabsTrigger value="info">Thông tin</TabsTrigger>
                            <TabsTrigger value="favorites">Yêu thích</TabsTrigger>
                            <TabsTrigger value="history">Lịch sử</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="music" className="mt-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-medium">Danh sách nhạc tải lên</h3>
                                {/* Upload button could go here or link to upload page */}
                            </div>
                            
                            <div className="grid gap-4">
                                {musicList.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                                        Chưa có bài nhạc nào được tải lên.
                                    </div>
                                ) : (
                                    musicList.map((music) => (
                                        <div key={music._id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-primary/10 rounded-full text-primary">
                                                    <Music className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{music.name}</p>
                                                    <p className="text-xs text-muted-foreground">{music.type}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                 <audio controls src={music.url} className="h-8 w-40" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </TabsContent>

                        <TabsContent value="info" className="mt-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Thông tin cá nhân</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">ID</label>
                                            <p>{user._id}</p>
                                        </div>
                                         <div>
                                            <label className="text-sm font-medium text-muted-foreground">Tham gia</label>
                                            <p>{new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="history" className="mt-6">
                            <LibraryTab type="history" />
                        </TabsContent>

                        <TabsContent value="favorites" className="mt-6">
                            <LibraryTab type="favorite" />
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
