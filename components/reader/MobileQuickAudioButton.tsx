"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useAudioPlayer } from "@/components/providers/AudioPlayerContext"
import { Headphones, Play, Pause, Sparkles, BookOpen, ChevronRight, X, Flame } from "lucide-react"
import { getPublicNovelsService, type Novel } from "@/services/novelService"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function MobileQuickAudioButton() {
    const router = useRouter()
    const { audioUrl, isPlaying, togglePlay, title, novelTitle, novelId, chapterNumber } = useAudioPlayer()
    
    const [isOpen, setIsOpen] = useState(false)
    const [popularNovels, setPopularNovels] = useState<Novel[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (!isOpen) return
        const fetchPopular = async () => {
            setLoading(true)
            try {
                const res = await getPublicNovelsService({ limit: 6, sort: 'popular' })
                if (res?.novels) {
                    setPopularNovels(res.novels)
                }
            } catch (err) {
                console.error("Failed to fetch popular audio novels", err)
            } finally {
                setLoading(false)
            }
        }
        fetchPopular()
    }, [isOpen])

    const handlePlayNovel = (novel: Novel) => {
        const targetId = novel.slug || novel._id || novel.id
        if (targetId) {
            setIsOpen(false)
            router.push(`/novel/${targetId}/chapter/1`)
        }
    }

    return (
        <>
            {/* Floating Mobile Quick Audio Button */}
            <div className={cn(
                "fixed right-3 md:hidden z-[45] transition-all duration-300",
                audioUrl ? "bottom-[calc(124px+env(safe-area-inset-bottom))]" : "bottom-6"
            )}>
                <button
                    onClick={() => setIsOpen(true)}
                    className="group relative flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-rose-500 via-pink-500 to-primary text-white font-bold text-xs shadow-lg shadow-pink-500/30 hover:shadow-pink-500/50 active:scale-95 transition-all duration-200 cursor-pointer border border-white/20 overflow-hidden"
                    title="Phát audio nhanh"
                >
                    {/* Animated shine effect */}
                    <span className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    
                    <span className="relative flex items-center justify-center">
                        <Headphones className={cn("w-4 h-4 text-white", isPlaying && "animate-bounce")} />
                        {isPlaying && (
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                            </span>
                        )}
                    </span>

                    <span className="relative tracking-wide font-extrabold drop-shadow-sm">
                        {isPlaying ? "Đang phát..." : "Phát Audio"}
                    </span>
                </button>
            </div>

            {/* Quick Audio Dialog Modal */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="w-[92vw] max-w-md p-5 rounded-2xl sm:rounded-2xl border-pink-100/60 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl">
                    <DialogHeader className="text-left space-y-1.5 pb-2 border-b border-zinc-100 dark:border-zinc-900">
                        <DialogTitle className="flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">
                            <span className="p-2 rounded-xl bg-pink-500/10 text-primary">
                                <Headphones className="w-5 h-5" />
                            </span>
                            Nghe Audio Truyện Nhanh
                        </DialogTitle>
                        <DialogDescription className="text-xs text-zinc-500 dark:text-zinc-400">
                            Chọn truyện hay để bắt đầu nghe giọng đọc mượt mà ngay lập tức
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2 max-h-[65vh] overflow-y-auto pr-1">
                        {/* Currently playing or last track */}
                        {audioUrl && (
                            <div className="p-3 rounded-xl bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-transparent border border-pink-500/20 flex items-center justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-primary mb-0.5">
                                        <Sparkles className="w-3.5 h-3.5" />
                                        <span>ĐANG NGHE DỞ</span>
                                    </div>
                                    <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                        {title || "Chương truyện"}
                                    </h4>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                                        {novelTitle}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        togglePlay()
                                        if (novelId && chapterNumber) {
                                            router.push(`/novel/${novelId}/chapter/${chapterNumber}`)
                                            setIsOpen(false)
                                        }
                                    }}
                                    className="h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-bold shrink-0 shadow-sm"
                                >
                                    {isPlaying ? <Pause className="w-3.5 h-3.5 mr-1" /> : <Play className="w-3.5 h-3.5 mr-1 fill-current" />}
                                    {isPlaying ? "Tạm dừng" : "Tiếp tục"}
                                </Button>
                            </div>
                        )}

                        {/* Popular Audio Stories Section */}
                        <div className="space-y-2.5">
                            <div className="flex items-center justify-between text-xs font-bold text-zinc-700 dark:text-zinc-300">
                                <span className="flex items-center gap-1.5">
                                    <Flame className="w-4 h-4 text-rose-500" />
                                    Truyện Hay Nghe Nhiều
                                </span>
                                <span className="text-[10px] font-normal text-zinc-400">Audio chất lượng cao</span>
                            </div>

                            {loading ? (
                                <div className="py-8 text-center text-xs text-zinc-400 animate-pulse">
                                    Đang tải danh sách audio...
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2.5">
                                    {popularNovels.map((novel) => {
                                        const novelIdStr = novel.slug || novel._id || novel.id || ""
                                        return (
                                            <div
                                                key={novelIdStr}
                                                onClick={() => handlePlayNovel(novel)}
                                                className="group flex items-center justify-between p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 hover:bg-pink-50/50 dark:hover:bg-zinc-850/60 hover:border-pink-200 dark:hover:border-pink-950 transition-all cursor-pointer"
                                            >
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="relative w-10 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-zinc-200 dark:bg-zinc-800 border border-zinc-200/40">
                                                        {novel.image || novel.coverImage ? (
                                                            <Image
                                                                src={novel.image || novel.coverImage || ""}
                                                                alt={novel.title}
                                                                fill
                                                                sizes="40px"
                                                                className="object-cover group-hover:scale-105 transition-transform"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center">
                                                                <BookOpen className="w-5 h-5 text-zinc-400" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h5 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate group-hover:text-primary transition-colors">
                                                            {novel.title}
                                                        </h5>
                                                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate">
                                                            {novel.views?.toLocaleString() || 0} lượt xem • {novel.chapters || 1} chương
                                                        </p>
                                                    </div>
                                                </div>

                                                <Button
                                                    size="sm"
                                                    variant="secondary"
                                                    className="h-7 px-2.5 rounded-lg text-[11px] font-bold text-primary bg-pink-100/60 dark:bg-pink-950/40 group-hover:bg-primary group-hover:text-white transition-all shrink-0 ml-2"
                                                >
                                                    <Play className="w-3 h-3 mr-1 fill-current" />
                                                    Phát
                                                </Button>
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
