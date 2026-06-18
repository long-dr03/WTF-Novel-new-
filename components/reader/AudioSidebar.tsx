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
        let isMounted = true;
        const playAudio = async () => {
            if (audioRef.current && audioUrl && autoNext) {
                try {
                    await audioRef.current.play();
                    if (isMounted) setIsPlaying(true);
                } catch (err: any) {
                    if (err.name !== 'AbortError') {
                        console.error(err);
                    }
                }
            }
        };

        if (audioRef.current) {
            audioRef.current.pause();
            setIsPlaying(false);
            setCurrentTime(0);
            
            if (audioUrl) {
                audioRef.current.load();
                playAudio();
            }
        }
        return () => { isMounted = false; };
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
                <div className="fixed inset-0 bg-black/25 backdrop-blur-[2px] z-[45] lg:hidden" onClick={onClose} />
            )}
            
            <div className={cn(
                "fixed right-0 w-[325px] sm:w-[340px] shadow-2xl transition-all duration-300 ease-in-out transform flex flex-col font-sans border-l",
                // Top position: always top-0 on mobile, top-16 on desktop to sit below header. Height: h-full on mobile, h-[calc(100vh-4rem)] on desktop.
                "top-0 h-full lg:top-16 lg:h-[calc(100vh-4rem)]",
                isOpen ? "translate-x-0 z-[60]" : "translate-x-full z-45",
                isDark 
                    ? "bg-zinc-950/95 border-zinc-800/80 text-zinc-100 backdrop-blur-md" 
                    : "bg-white/95 border-pink-100/60 text-zinc-900 backdrop-blur-md"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-pink-50/50 dark:border-zinc-850/60">
                    <h2 className="font-bold text-base flex items-center gap-2 tracking-tight">
                        <Headphones className="w-4.5 h-4.5 text-primary" /> Trình phát
                    </h2>
                    {/* Close button */}
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={onClose} 
                        className="rounded-full h-8 w-8 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-hidden flex flex-col">
                    {/* Top Section: Player Controls - Shrink to fit content */}
                    <div className="shrink-0 p-4 border-b border-pink-50/50 dark:border-zinc-850/60">
                        <div className="space-y-4">


                            {/* Info */}
                            <div className="text-center space-y-1 px-1">
                                <h3 className="font-bold text-zinc-800 dark:text-zinc-100 text-sm tracking-tight leading-snug line-clamp-2" title={title}>
                                    {title || "Chương truyện"}
                                </h3>
                                <p className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 tracking-wide line-clamp-1">
                                    {novelTitle || "WTF Novel"}
                                </p>
                            </div>

                            {/* Main Controls */}
                            {audioUrl ? (
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <Slider
                                            value={[currentTime]}
                                            max={duration || 100}
                                            step={1}
                                            onValueChange={handleSeek}
                                            className="cursor-pointer"
                                        />
                                        <div className="flex justify-between text-[10px] font-mono text-zinc-400 dark:text-zinc-500">
                                            <span>{formatTime(currentTime)}</span>
                                            <span>{formatTime(duration)}</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-6">
                                        <Button variant="ghost" size="icon" disabled={!hasPrev} onClick={onPrev} className="h-8 w-8 rounded-full text-zinc-655 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">
                                            <SkipBack className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                            size="icon" 
                                            className="h-10 w-10 rounded-full shadow-md bg-primary text-primary-foreground hover:bg-primary/95 shadow-primary/20 hover:shadow-primary/30 transition-all duration-200 active:scale-95"
                                            onClick={togglePlay}
                                        >
                                            {isPlaying ? <Pause className="w-4.5 h-4.5" /> : <Play className="w-4.5 h-4.5 ml-0.5" />}
                                        </Button>
                                        <Button variant="ghost" size="icon" disabled={!hasNext} onClick={onNext} className="h-8 w-8 rounded-full text-zinc-655 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">
                                            <SkipForward className="w-4 h-4" />
                                        </Button>
                                    </div>

                                    {/* Speed & Volume Row */}
                                    <div className="flex items-center justify-between gap-2 pt-1">
                                         <Button variant="ghost" size="sm" 
                                            className="h-7 text-[10px] font-semibold font-mono border border-pink-100/80 hover:border-pink-200 dark:border-zinc-800 dark:hover:bg-zinc-850 rounded-full px-2.5 min-w-[3rem] text-zinc-650 dark:text-zinc-300 hover:bg-pink-50/40 dark:hover:text-zinc-100 transition-all"
                                            onClick={() => {
                                                const rates = [0.75, 1, 1.25, 1.5, 2];
                                                const idx = rates.indexOf(playbackRate);
                                                setPlaybackRate(rates[(idx + 1) % rates.length]);
                                            }}
                                         >
                                            {playbackRate}x
                                         </Button>
                                         <div className="flex items-center gap-2 flex-1 justify-end max-w-[110px]">
                                             <Volume2 className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0"/>
                                             <Slider value={[volume]} max={1} step={0.05} onValueChange={(v) => {
                                                 setVolume(v[0]);
                                                 if (audioRef.current) audioRef.current.volume = v[0];
                                             }} className="h-1.5 cursor-pointer" />
                                         </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center py-6 px-4 rounded-2xl bg-primary/5 dark:bg-zinc-900/40 border border-primary/20 dark:border-zinc-800/80 shadow-sm transition-all duration-300">
                                    <VolumeX className="w-8 h-8 mx-auto mb-2.5 text-primary opacity-80 animate-pulse" />
                                    <p className="text-xs font-bold text-zinc-800 dark:text-zinc-250">Chương này chưa có giọng đọc</p>
                                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1.5 leading-normal">
                                        Bật nhạc nền ở tab bên dưới để thưởng thức âm thanh khi đọc nhé!
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bottom Section: Tabs - Expand to fill remaining space */}
                    <div className="flex-1 min-h-0 bg-zinc-50/30 dark:bg-zinc-900/10 backdrop-blur-sm">
                        <Tabs defaultValue="music" className="h-full flex flex-col">
                            <TabsList className="w-full justify-start rounded-none bg-transparent border-b border-pink-50/50 dark:border-zinc-850/60 h-10 px-0 shrink-0">
                                <TabsTrigger 
                                    value="music" 
                                    className="flex-1 text-xs font-semibold h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-pink-50/10 dark:data-[state=active]:bg-zinc-900/20 data-[state=active]:shadow-none transition-all"
                                >
                                    <ListMusic className="w-3.5 h-3.5 mr-2"/> Nhạc nền
                                </TabsTrigger>
                                <TabsTrigger 
                                    value="settings" 
                                    className="flex-1 text-xs font-semibold h-10 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-pink-50/10 dark:data-[state=active]:bg-zinc-900/20 data-[state=active]:shadow-none transition-all"
                                >
                                    <Settings2 className="w-3.5 h-3.5 mr-2"/> Cài đặt
                                </TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="music" className="flex-1 p-0 m-0 overflow-hidden relative flex flex-col min-h-0">
                                <ScrollArea className="flex-1 h-full w-full">
                                    <div className="p-3 space-y-2 pb-20">
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
                                                className="w-full h-8.5 text-xs gap-1.5 bg-zinc-100 hover:bg-pink-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-300 hover:text-primary dark:hover:text-primary border border-zinc-200/60 dark:border-zinc-800/80 transition-all duration-200"
                                                variant="secondary"
                                            >
                                                {isUploading ? (
                                                    <>
                                                        <Loader2 className="w-3 h-3 animate-spin" />
                                                        <span className="text-[10px] sm:text-xs">Đang tải... {Math.round(uploadProgress)}%</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <UploadCloud className="w-3.5 h-3.5" />
                                                        <span className="text-[10px] sm:text-xs font-semibold">Tải nhạc cá nhân</span>
                                                    </>
                                                )}
                                            </Button>
                                            {isUploading && (
                                                <div className="w-full bg-zinc-200 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                                                    <div 
                                                        className="bg-primary h-full transition-all duration-300 ease-out"
                                                        style={{ width: `${uploadProgress}%` }}
                                                    />
                                                </div>
                                            )}
                                        </div>

                                        {/* Music List */}
                                        {bgMusicList.length === 0 ? (
                                            <p className="text-[10px] text-center text-zinc-400 dark:text-zinc-500 py-6">Chưa có nhạc nền</p>
                                        ) : (
                                            bgMusicList.map(music => (
                                                <div 
                                                    key={music._id}
                                                    onClick={() => selectBgMusic(music)}
                                                    className={cn(
                                                        "group flex items-center justify-between p-2.5 rounded-lg border border-transparent hover:bg-pink-50/45 dark:hover:bg-zinc-900/40 hover:border-pink-100/30 dark:hover:border-zinc-800/40 cursor-pointer text-xs transition-all duration-200",
                                                        currentBgMusic?._id === music._id && "bg-primary/5 text-primary border-primary/20 dark:bg-primary/10 dark:border-primary/30"
                                                    )}
                                                >   
                                                    <div className="flex items-center gap-2.5 overflow-hidden">
                                                        {currentBgMusic?._id === music._id && isBgPlaying ? (
                                                            <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
                                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                                                            </span>
                                                        ) : (
                                                            <Music className={cn("w-3.5 h-3.5 shrink-0", currentBgMusic?._id === music._id ? "text-primary" : "text-zinc-400 dark:text-zinc-500")} />
                                                        )}
                                                        <span className="truncate font-semibold tracking-tight">{music.name}</span>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" size="icon" 
                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/20 shrink-0"
                                                        onClick={(e) => handleDeleteMusic(e, music._id)}
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5"/>
                                                    </Button>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                                {/* Bg Volume Stick */}
                                <div className="absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md p-3 border-t border-pink-50/50 dark:border-zinc-850/60 flex items-center gap-3 z-10">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 whitespace-nowrap">Nhạc nền</span>
                                    <Volume2 className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 shrink-0" />
                                    <Slider 
                                        value={[bgVolume]} 
                                        max={1} 
                                        step={0.05} 
                                        onValueChange={(v) => setBgVolume(v[0])} 
                                        className="flex-1 cursor-pointer"
                                    />
                                </div>
                            </TabsContent>

                            <TabsContent value="settings" className="p-4 m-0 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Tự động chuyển chương</Label>
                                        <p className="text-xs text-zinc-450 dark:text-zinc-500">Phát chương tiếp khi hết bài</p>
                                    </div>
                                    <Switch checked={autoNext} onCheckedChange={onAutoNextChange} className="data-[state=checked]:bg-primary" />
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
