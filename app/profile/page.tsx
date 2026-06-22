"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Loader2, Upload, User, Settings, LogOut, Calendar, Mail, Shield, BookOpen } from "lucide-react"
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
            if (res) setNovels(res as any[])
            setLoading(false)
        }
        fetchLibrary()
    }, [type])

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>

    if (novels.length === 0) return (
         <div className="text-center py-12 text-muted-foreground border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            {type === 'history' ? 'Chưa có lịch sử đọc.' : 'Chưa có truyện yêu thích.'}
        </div>
    )

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {novels.map((item: any) => {
                const novel = item.novel
                if (!novel) return null;
                return (
                    <CardNovel
                        key={item._id}
                        novelId={novel._id}
                        coverImage={novel.image || novel.coverImage || "/ANIMENETFLIX-FA.webp"}
                        title={novel.title}
                        genres={[]}
                    />
                )
            })}
        </div>
    )
}

export default function ProfilePage() {
    const { user, logout } = useAuth()

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
                <p className="text-zinc-650 dark:text-zinc-400 font-medium">Vui lòng đăng nhập để xem hồ sơ</p>
                <Link href="/login"><Button className="bg-primary hover:bg-primary/95 text-white rounded-xl px-6">Đăng nhập</Button></Link>
            </div>
        )
    }

    return (
        <div className="container mx-auto py-8 px-4 sm:px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Sidebar / Info Card */}
                <Card className="md:col-span-1 h-fit overflow-hidden border-none shadow-md bg-white dark:bg-zinc-950 rounded-2xl">
                    <div className="h-28 bg-gradient-to-br from-pink-200 via-pink-100 to-rose-200 dark:from-primary/20 dark:to-rose-950/20 relative" />
                    <div className="px-6 pb-6 text-center relative -mt-14">
                        <Avatar className="w-24 h-24 mx-auto border-4 border-white dark:border-zinc-950 shadow-xl mb-4">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-xl bg-primary text-white font-bold">{user.username[0].toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <h2 className="text-lg font-bold text-zinc-900 dark:text-foreground truncate" title={user.username}>{user.username}</h2>
                        <div className="flex justify-center mt-2">
                             <Badge className="bg-primary/10 text-primary border border-primary/25 hover:bg-primary/20 capitalize font-semibold text-xs px-2.5 py-0.5 rounded-full">{user.role}</Badge>
                        </div>
                        <p className="text-xs text-zinc-500 dark:text-muted-foreground mt-3 truncate" title={user.email}>{user.email}</p>
                        
                        <div className="border-t border-zinc-100 dark:border-zinc-900/60 my-6" />
                        
                        <div className="space-y-2">
                            {user.role === 'admin' && (
                                 <Link href="/admin" className="block w-full">
                                    <Button variant="outline" className="w-full justify-start rounded-xl h-10 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-xs font-semibold">
                                        <Settings className="mr-2.5 h-4 w-4 text-primary" /> Trang quản trị
                                    </Button>
                                </Link>
                            )}
                            <Button variant="ghost" className="w-full justify-start rounded-xl h-10 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-semibold" onClick={logout}>
                                 <LogOut className="mr-2.5 h-4 w-4" /> Đăng xuất
                            </Button>
                        </div>
                    </div>
                </Card>

                {/* Main Content */}
                <div className="md:col-span-3">
                    <Tabs defaultValue="info">
                        <TabsList className="bg-zinc-100/80 dark:bg-zinc-900/60 p-1 rounded-2xl w-full sm:w-auto flex flex-row overflow-x-auto justify-start border border-zinc-200/20 dark:border-zinc-800/30 gap-1">
                            <TabsTrigger value="info" className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 shadow-none">Thông tin</TabsTrigger>
                            <TabsTrigger value="favorites" className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 shadow-none">Yêu thích</TabsTrigger>
                            <TabsTrigger value="history" className="rounded-xl px-5 py-2.5 text-xs sm:text-sm font-semibold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-950 shadow-none">Lịch sử</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="info" className="mt-6 animate-in fade-in-50 duration-200">
                            <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-zinc-950">
                                <CardHeader className="border-b border-zinc-100 dark:border-zinc-900 pb-4">
                                    <CardTitle className="text-base font-bold flex items-center gap-2">
                                        <User className="w-5 h-5 text-primary" /> Thông tin tài khoản
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="pt-6">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-900 flex items-start gap-3">
                                            <div className="p-2 bg-primary/10 rounded-xl text-primary mt-0.5">
                                                <User className="w-4 h-4" />
                                            </div>
                                            <div className="space-y-0.5 min-w-0">
                                                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Mã định danh (UID)</span>
                                                <p className="font-mono text-xs text-zinc-800 dark:text-zinc-300 select-all truncate">{user._id}</p>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-900 flex items-start gap-3">
                                            <div className="p-2 bg-primary/10 rounded-xl text-primary mt-0.5">
                                                <Shield className="w-4 h-4" />
                                            </div>
                                            <div className="space-y-0.5 min-w-0">
                                                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Vai trò quản trị</span>
                                                <p className="font-semibold text-xs text-primary capitalize">{user.role}</p>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-900 flex items-start gap-3">
                                            <div className="p-2 bg-primary/10 rounded-xl text-primary mt-0.5">
                                                <Mail className="w-4 h-4" />
                                            </div>
                                            <div className="space-y-0.5 min-w-0">
                                                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Thư điện tử</span>
                                                <p className="font-medium text-xs text-zinc-800 dark:text-zinc-350 truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-100 dark:border-zinc-900 flex items-start gap-3">
                                            <div className="p-2 bg-primary/10 rounded-xl text-primary mt-0.5">
                                                <Calendar className="w-4 h-4" />
                                            </div>
                                            <div className="space-y-0.5 min-w-0">
                                                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Ngày gia nhập</span>
                                                <p className="font-medium text-xs text-zinc-800 dark:text-zinc-350">{new Date(user.createdAt || Date.now()).toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                            </div>
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
