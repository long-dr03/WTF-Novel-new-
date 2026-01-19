"use client"

import React, { useState, useRef, useEffect } from "react"
import { Play, Pause, SkipForward, SkipBack, X, Volume2, VolumeX, Settings2, Music, Disc, UploadCloud, ListMusic, Trash2, Loader2 } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
// Music imports
import { getMyMusic, createMusicMetadata, deleteMusic, type Music as MusicType } from "@/services/musicService"
import { useUploadThing } from "@/lib/uploadthing"
import { toast } from "sonner"

interface AudioSidebarProps {
    isOpen: boolean
    onClose: () => void
    audioUrl: string | null
    title?: string
    novelTitle?: string
    coverUrl?: string
    onNext?: () => void
    onPrev?: () => void
    hasNext?: boolean
    hasPrev?: boolean
    autoNext?: boolean
    onAutoNextChange?: (val: boolean) => void
    isDark?: boolean
}

export function AudioSidebar({
    isOpen,
    onClose,
    audioUrl,
    title,
    novelTitle,
    coverUrl,
    onNext,
    onPrev,
    hasNext = false,
    hasPrev = false,
    autoNext = true,
    onAutoNextChange,
    isDark = false
}: AudioSidebarProps) {
    // --- Main Audio State ---
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [isMuted, setIsMuted] = useState(false)

    // --- Background Music State ---
    const bgMusicRef = useRef<HTMLAudioElement>(null)
    const [bgMusicList, setBgMusicList] = useState<MusicType[]>([])
    const [currentBgMusic, setCurrentBgMusic] = useState<MusicType | null>(null)
    const [isBgPlaying, setIsBgPlaying] = useState(false)
    const [bgVolume, setBgVolume] = useState(0.5)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    // Upload hook
    const { startUpload } = useUploadThing("backgroundMusic", {
        onUploadProgress: (progress) => {
            setUploadProgress(progress)
        },
        onClientUploadComplete: async (res) => {
            if (res && res[0]) {
                try {
                    await createMusicMetadata({
                        name: res[0].name,
                        url: res[0].url,
                        duration: 0,
                        type: 'user' 
                    })
                    await loadBgMusic()
                    toast.success("Tải nhạc thành công!", {
                        description: `${res[0].name} đã được thêm vào thư viện.`
                    })
                } catch (e) {
                    console.error("Failed to save metadata", e)
                    toast.error("Lỗi lưu metadata", {
                        description: "File đã upload nhưng không thể lưu thông tin."
                    })
                }
            }
            setIsUploading(false)
            setUploadProgress(0)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        },
        onUploadError: (error) => {
            console.error("Upload error:", error)
            toast.error("Lỗi tải file!", {
                description: error.message || "Vui lòng thử lại."
            })
            setIsUploading(false)
            setUploadProgress(0)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        },
    })

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploading(true)
        toast.loading("Đang tải nhạc lên...", {
            description: `${files[0].name}`,
            id: 'upload-toast-reader'
        })

        try {
            await startUpload(Array.from(files))
            toast.dismiss('upload-toast-reader')
        } catch (err) {
            toast.dismiss('upload-toast-reader')
            console.error("Upload failed:", err)
        }
    }

    // --- Main Audio Effects ---
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            setIsPlaying(false)
            setCurrentTime(0)
            
            if (audioUrl) {
                audioRef.current.load()
                if (autoNext) {
                    audioRef.current.play().then(() => setIsPlaying(true)).catch(console.error)
                }
            }
        }
    }, [audioUrl])

    useEffect(() => {
        if (audioRef.current) audioRef.current.playbackRate = playbackRate
    }, [playbackRate])

    // --- Background Music Effects ---
    useEffect(() => {
        loadBgMusic()
    }, [])

    const loadBgMusic = async () => {
        try {
            const res = await getMyMusic()
            console.log("AudioSidebar loadBgMusic response:", res)
            if (res) {
                 let list: MusicType[] = [];
                 if (Array.isArray(res)) {
                    list = res;
                 } else if (res.data && Array.isArray(res.data)) {
                    list = res.data;
                 } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
                    list = res.data.data;
                 }
                
                console.log("AudioSidebar parsed music list:", list)
                setBgMusicList(list)
            }
        } catch (error) {
            console.error("Failed to load bg music", error)
        }
    }

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
                setIsPlaying(false)
            } else {
                const playPromise = audioRef.current.play()
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        setIsPlaying(true)
                    }).catch(console.error)
                }
            }
        }
    }

    const handleTimeUpdate = () => {
        if (audioRef.current) setCurrentTime(audioRef.current.currentTime)
    }

    const handleLoadedMetadata = () => {
        if (audioRef.current) setDuration(audioRef.current.duration)
    }

    const handleSeek = (value: number[]) => {
        if (audioRef.current) {
            audioRef.current.currentTime = value[0]
            setCurrentTime(value[0])
        }
    }

    const handleEnded = () => {
        setIsPlaying(false)
        if (autoNext && hasNext && onNext) onNext()
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    }

    // --- Bg Music Handlers ---
    const toggleBgPlay = () => {
        if (bgMusicRef.current) {
            if (isBgPlaying) bgMusicRef.current.pause()
            else bgMusicRef.current.play()
            setIsBgPlaying(!isBgPlaying)
        } else if (currentBgMusic) {
            // First play
        }
    }

    const selectBgMusic = (music: MusicType) => {
        if (currentBgMusic?._id === music._id) {
            toggleBgPlay()
        } else {
            setCurrentBgMusic(music)
            if (bgMusicRef.current) {
                bgMusicRef.current.src = music.url
                bgMusicRef.current.loop = true
                bgMusicRef.current.volume = bgVolume
                bgMusicRef.current.play()
                setIsBgPlaying(true)
            }
        }
    }
    
    // Auto play bg music when selected
    useEffect(() => {
        if (currentBgMusic && bgMusicRef.current) {
            bgMusicRef.current.src = currentBgMusic.url
            const playPromise = bgMusicRef.current.play()
            
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    setIsBgPlaying(true)
                }).catch(error => {
                    console.log("Bg music playback interrupted:", error)
                    setIsBgPlaying(false)
                })
            }
        }
    }, [currentBgMusic])

    useEffect(() => {
        if (bgMusicRef.current) bgMusicRef.current.volume = bgVolume
    }, [bgVolume])

    const handleDeleteMusic = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation()
        if (!confirm("Xóa bài nhạc này?")) return
        try {
            await deleteMusic(id)
            setBgMusicList(prev => prev.filter(m => m._id !== id))
            if (currentBgMusic?._id === id) {
                setCurrentBgMusic(null)
                setIsBgPlaying(false)
                if (bgMusicRef.current) { 
                    bgMusicRef.current.pause(); 
                    bgMusicRef.current.src = ""; 
                }
            }
        } catch(e) { console.error(e) }
    }

    return (
        <>
            {/* Overlay - Only on mobile/tablet when open */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[45] lg:hidden" onClick={onClose} />
            )}
            
            <div className={cn(
                "fixed right-0 w-[320px] shadow-2xl transition-transform duration-300 ease-in-out transform flex flex-col font-sans z-40",
                // Mobile: full height top-0, controlled by open. Desktop: top-14 below header, always visible
                isOpen ? "translate-x-0 top-0 h-full z-[60]" : "translate-x-full lg:translate-x-0 lg:top-14 lg:h-[calc(100vh-3.5rem)]",
                isDark ? "bg-stone-950 border-stone-800 text-stone-100" : "bg-white border-stone-200 text-stone-900",
                "border-l"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-stone-100 dark:border-stone-800">
                    <h2 className="font-semibold text-lg flex items-center gap-2">
                        <Headphones className="w-5 h-5" /> Trình phát
                    </h2>
                    {/* Close button - visible only on mobile/tablet */}
                    <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full lg:hidden">
                        <X className="w-5 h-5" />
                    </Button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Top Section: Player Controls - Shrink to fit content */}
                    <div className="shrink-0 p-4 border-b border-stone-100 dark:border-stone-800">
                        <div className="space-y-4">
                            {/* Banner/Cover Visualization - Smaller */}
                            <div className="flex flex-col items-center">
                                <div className={cn(
                                    "relative w-full aspect-[2/3] max-w-[120px] rounded-lg shadow-xl overflow-hidden border border-stone-200 dark:border-stone-800",
                                    "group"
                                )}>
                                    {coverUrl ? (
                                        <img 
                                            src={coverUrl} 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                            alt="Cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-stone-100 dark:bg-stone-900 flex items-center justify-center">
                                            <Music className="w-10 h-10 text-muted-foreground opacity-20" />
                                        </div>
                                    )}
                                    {/* Equalizer overlay */}
                                    {isPlaying && (
                                        <div className="absolute inset-0 bg-black/10 flex items-end justify-center pb-2 gap-0.5">
                                            {[...Array(4)].map((_, i) => (
                                                <div 
                                                    key={i} 
                                                    className="w-0.5 bg-white/80 rounded-full animate-music-bar"
                                                    style={{ animationDelay: `${i * 0.1}s` }}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="text-center space-y-1 px-1">
                                <h3 className="font-bold text-sm leading-tight line-clamp-2" title={title}>{title || "Chương truyện"}</h3>
                                <p className="text-xs text-muted-foreground line-clamp-1">{novelTitle || "WTF Novel"}</p>
                            </div>

                            {/* Main Controls */}
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <Slider
                                        value={[currentTime]}
                                        max={duration || 100}
                                        step={1}
                                        onValueChange={handleSeek}
                                        className="cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{formatTime(duration)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-6">
                                    <Button variant="ghost" size="icon" disabled={!hasPrev} onClick={onPrev} className="h-8 w-8">
                                        <SkipBack className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                        size="icon" 
                                        className="h-10 w-10 rounded-full shadow-md bg-primary text-primary-foreground hover:bg-primary/90"
                                        onClick={togglePlay}
                                    >
                                        {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" disabled={!hasNext} onClick={onNext} className="h-8 w-8">
                                        <SkipForward className="w-4 h-4" />
                                    </Button>
                                </div>

                                {/* Speed & Volume Row */}
                                <div className="flex items-center justify-between gap-2">
                                     <Button variant="ghost" size="sm" 
                                        className="h-7 text-[10px] font-mono border rounded-full px-2 min-w-[3rem]"
                                        onClick={() => {
                                            const rates = [0.75, 1, 1.25, 1.5, 2];
                                            const idx = rates.indexOf(playbackRate);
                                            setPlaybackRate(rates[(idx + 1) % rates.length]);
                                        }}
                                     >
                                        {playbackRate}x
                                     </Button>
                                     <div className="flex items-center gap-2 flex-1 justify-end max-w-[100px]">
                                         <Volume2 className="w-3.5 h-3.5 text-muted-foreground shrink-0"/>
                                         <Slider value={[volume]} max={1} step={0.1} onValueChange={(v) => {
                                             setVolume(v[0]);
                                             if (audioRef.current) audioRef.current.volume = v[0];
                                         }} />
                                     </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Tabs - Expand to fill remaining space */}
                    <div className="flex-1 min-h-0 bg-stone-50/50 dark:bg-stone-900/50 backdrop-blur-sm">
                        <Tabs defaultValue="music" className="h-full flex flex-col">
                            <TabsList className="w-full justify-start rounded-none bg-transparent border-b h-9 px-0 shrink-0">
                                <TabsTrigger value="music" className="flex-1 text-xs h-9 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
                                    <ListMusic className="w-3.5 h-3.5 mr-2"/> Nhạc nền
                                </TabsTrigger>
                                <TabsTrigger value="settings" className="flex-1 text-xs h-9 rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none">
                                    <Settings2 className="w-3.5 h-3.5 mr-2"/> Cài đặt
                                </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="music" className="flex-1 p-0 m-0 overflow-hidden relative flex flex-col min-h-0">
                                <ScrollArea className="flex-1 h-full w-full">
                                    <div className="p-3 space-y-2 pb-10">
                                        {/* Upload Btn */}
                                        <div className="mb-2 space-y-1.5">
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept="audio/*"
                                                multiple
                                                className="hidden"
                                                onChange={handleFileSelect}
                                                disabled={isUploading}
                                            />
                                            <Button
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={isUploading}
                                                className="w-full h-8 text-xs gap-1.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700"
                                                variant="secondary"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        <span className="text-[10px] sm:text-xs">Đang tải... {Math.round(uploadProgress)}%</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <UploadCloud className="w-3 h-3" />
                                                        <span className="text-[10px] sm:text-xs">Tải nhạc cá nhân</span>
                                                    </>
                                                )}
                                            </Button>
                                            {isUploading && (
                                                <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-1 overflow-hidden">
                                                    <div 
                                                        className="bg-primary h-full transition-all duration-300 ease-out"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Music List */}
                                        {bgMusicList.length === 0 ? (
                                            <p className="text-[10px] text-center text-muted-foreground py-4">Chưa có nhạc nền</p>
                                        ) : (
                                            bgMusicList.map(music => (
                                                <div 
                                                    key={music._id}
                                                    onClick={() => selectBgMusic(music)}
                                                    className={cn(
                                                        "group flex items-center justify-between p-2 rounded-md hover:bg-stone-100 dark:hover:bg-stone-800 cursor-pointer text-xs transition-colors",
                                                        currentBgMusic?._id === music._id && "bg-primary/10 text-primary border border-primary/20"
                                                    )}
                                                >   
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        {currentBgMusic?._id === music._id && isBgPlaying ? (
                                                            <span className="relative flex h-2 w-2 shrink-0">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                            </span>
                                                        ) : (
                                                            <Music className="w-3 h-3 text-muted-foreground shrink-0" />
                                                        )}
                                                        <span className="truncate font-medium">{music.name}</span>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" size="icon" 
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive shrink-0"
                                                        onClick={(e) => handleDeleteMusic(e, music._id)}
                                                    >
                                                        <Trash2 className="w-3 h-3"/>
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                                {/* Bg Volume Stick */}
                                <div className="absolute bottom-0 left-0 right-0 bg-background/90 backdrop-blur p-2 border-t flex items-center gap-2 z-10">
                                    <span className="text-[10px] whitespace-nowrap text-muted-foreground">Nhạc nền</span>
                                    <Slider 
                                        value={[bgVolume]} 
                                        max={1} 
                                        step={0.1} 
                                        onValueChange={(v) => setBgVolume(v[0])} 
                                        className="h-1.5"
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="settings" className="p-4 m-0 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm">Tự động chuyển chương</Label>
                                        <p className="text-xs text-muted-foreground">Phát chương tiếp khi hết bài</p>
                                    </div>
                                    <Switch checked={autoNext} onCheckedChange={onAutoNextChange} />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>

                    {/* Hidden Audio Elements */}
                    <audio 
                        ref={audioRef}
                        src={audioUrl || undefined}
                        onTimeUpdate={handleTimeUpdate}
                        onLoadedMetadata={handleLoadedMetadata}
                        onEnded={handleEnded}
                    />
                    <audio ref={bgMusicRef} loop />
                </div>
            </div>
        </>
    )
}

function Headphones({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="M3 14v-3a9 9 0 0 1 18 0v3" />
            <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
        </svg>
    )
}
