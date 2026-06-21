"use client"

import React, { useState, useRef, useEffect } from "react"
import { Play, Pause, SkipForward, SkipBack, X, Volume2, VolumeX, Lock } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface AudioSidebarProps {
    isOpen: boolean
    onClose: () => void
    audioUrl: string | null
    title?: string
    novelTitle?: string
    coverUrl?: string // Left in prop signature to prevent compile errors, but unused.
    onNext?: () => void
    onPrev?: () => void
    hasNext?: boolean
    hasPrev?: boolean
    autoNext?: boolean
    onAutoNextChange?: (val: boolean) => void
    isDark?: boolean
    isLocked?: boolean
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
    isDark = false,
    isLocked = false
}: AudioSidebarProps) {
    // --- Main Audio State ---
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [playbackRate, setPlaybackRate] = useState(1)

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

    return (
        <>
            {/* Desktop Sidebar - Always visible, sits on the right */}
            <div className={cn(
                "fixed right-0 top-16 w-[280px] h-[calc(100vh-4rem)] border-l z-40 hidden lg:flex flex-col font-sans transition-all duration-300",
                isDark 
                    ? "bg-zinc-950 border-zinc-800/80 text-zinc-100" 
                    : "bg-white border-pink-100/60 text-zinc-900"
            )}>
                {/* Header */}
                <div className="flex items-center justify-between p-3.5 border-b border-pink-50/50 dark:border-zinc-850/60 shrink-0">
                    <h2 className="font-bold text-sm flex items-center gap-1.5 tracking-tight">
                        <Headphones className="w-4 h-4 text-primary" /> Trình phát
                    </h2>
                </div>

                <div className="flex-1 flex flex-col justify-between p-4 space-y-4 overflow-y-auto">
                    {/* Top Section: Player Controls */}
                    <div className="space-y-4">
                        {/* Info */}
                        <div className="text-center space-y-1">
                            <h3 className="font-bold text-zinc-800 dark:text-zinc-100 text-xs tracking-tight leading-snug line-clamp-2" title={title}>
                                {title || "Chương truyện"}
                            </h3>
                            <p className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 tracking-wide line-clamp-1">
                                {novelTitle || "Audio By MEO MEO"}
                            </p>
                        </div>

                        {/* Main Controls */}
                        {audioUrl ? (
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <Slider
                                        value={[currentTime]}
                                        max={duration || 100}
                                        step={1}
                                        onValueChange={handleSeek}
                                        className="cursor-pointer"
                                    />
                                    <div className="flex justify-between text-[9px] font-mono text-zinc-400 dark:text-zinc-500">
                                        <span>{formatTime(currentTime)}</span>
                                        <span>{formatTime(duration)}</span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-4">
                                    <Button variant="ghost" size="icon" disabled={!hasPrev} onClick={onPrev} className="h-7 w-7 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">
                                        <SkipBack className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button 
                                        size="icon" 
                                        className="h-8.5 w-8.5 rounded-full shadow-md bg-primary text-primary-foreground hover:bg-primary/95 shadow-primary/10 hover:shadow-primary/20 transition-all duration-200 active:scale-95"
                                        onClick={togglePlay}
                                    >
                                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                                    </Button>
                                    <Button variant="ghost" size="icon" disabled={!hasNext} onClick={onNext} className="h-7 w-7 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200">
                                        <SkipForward className="w-3.5 h-3.5" />
                                    </Button>
                                </div>

                                {/* Speed & Volume Row */}
                                <div className="flex items-center justify-between gap-2 pt-1">
                                     <Button variant="ghost" size="sm" 
                                        className="h-6.5 text-[9px] font-semibold font-mono border border-pink-100/60 hover:border-pink-200 dark:border-zinc-800 dark:hover:bg-zinc-850 rounded-full px-2 text-zinc-655 dark:text-zinc-300 hover:bg-pink-50/30 dark:hover:text-zinc-100 transition-all"
                                        onClick={() => {
                                            const rates = [0.75, 1, 1.25, 1.5, 2];
                                            const idx = rates.indexOf(playbackRate);
                                            setPlaybackRate(rates[(idx + 1) % rates.length]);
                                        }}
                                     >
                                        {playbackRate}x
                                     </Button>
                                     <div className="flex items-center gap-1.5 flex-1 justify-end max-w-[95px]">
                                         <Volume2 className="w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0"/>
                                         <Slider value={[volume]} max={1} step={0.05} onValueChange={(v) => {
                                             setVolume(v[0]);
                                             if (audioRef.current) audioRef.current.volume = v[0];
                                         }} className="h-1 cursor-pointer" />
                                     </div>
                                </div>
                            </div>
                        ) : isLocked ? (
                            <div className="text-center py-6 px-3 rounded-xl bg-primary/5 dark:bg-zinc-900/40 border border-primary/20 dark:border-zinc-800/80 shadow-sm">
                                <Lock className="w-7 h-7 mx-auto mb-2 text-primary opacity-80 animate-pulse" />
                                <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-250">Chương truyện đang khóa</p>
                                <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
                                    Vui lòng click quảng cáo ở nội dung chương để mở khóa nghe audio.
                                </p>
                            </div>
                        ) : (
                            <div className="text-center py-6 px-3 rounded-xl bg-primary/5 dark:bg-zinc-900/40 border border-primary/20 dark:border-zinc-800/80 shadow-sm">
                                <VolumeX className="w-7 h-7 mx-auto mb-2 text-primary opacity-80 animate-pulse" />
                                <p className="text-[11px] font-bold text-zinc-800 dark:text-zinc-250">Chương này chưa có giọng đọc</p>
                                <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">
                                    Giọng đọc tự động cho chương truyện này hiện đang được xử lý.
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Bottom Section: Settings */}
                    <div className="pt-3.5 border-t border-pink-50/50 dark:border-zinc-850/60 shrink-0">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">Tự động chuyển chương</Label>
                                <p className="text-[9px] text-zinc-400 dark:text-zinc-500">Phát chương tiếp khi hết bài</p>
                            </div>
                            <Switch checked={autoNext} onCheckedChange={onAutoNextChange} className="data-[state=checked]:bg-primary scale-90" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Bottom Bar - Sticky bottom, visible when isOpen is true */}
            {isOpen && (
                <div className={cn(
                    "fixed bottom-0 left-0 right-0 h-[68px] border-t z-[60] lg:hidden flex items-center justify-between px-3 gap-2 backdrop-blur-md shadow-2xl font-sans",
                    isDark 
                        ? "bg-zinc-950/95 border-zinc-800/80 text-zinc-100" 
                        : "bg-white/95 border-pink-100/60 text-zinc-900"
                )}>
                    {/* Top edge progress bar */}
                    <div 
                        className="absolute top-0 left-0 right-0 h-0.75 bg-zinc-100 dark:bg-zinc-800 cursor-pointer"
                        onClick={(e) => {
                            if (!audioRef.current || !duration) return
                            const rect = e.currentTarget.getBoundingClientRect()
                            const clickX = e.clientX - rect.left
                            const width = rect.width
                            const newTime = (clickX / width) * duration
                            audioRef.current.currentTime = newTime
                            setCurrentTime(newTime)
                        }}
                    >
                        <div className="h-full bg-primary" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                    </div>

                    {/* Left side: Info */}
                    <div className="flex flex-col min-w-0 max-w-[130px] pr-1 select-none">
                        <span className="text-xs font-bold truncate leading-normal" title={title}>
                            {title || "Chương truyện"}
                        </span>
                        <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 truncate mt-0.5">
                            {novelTitle || "Audio By MEO MEO"}
                        </span>
                    </div>

                    {/* Middle: Controls */}
                    {audioUrl ? (
                        <div className="flex items-center gap-3.5">
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                disabled={!hasPrev} 
                                onClick={onPrev} 
                                className="h-7 w-7 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                            >
                                <SkipBack className="w-4 h-4" />
                            </Button>
                            <Button 
                                size="icon" 
                                className="h-9.5 w-9.5 rounded-full shadow-md bg-primary text-primary-foreground hover:bg-primary/95 shadow-primary/10 hover:shadow-primary/20 transition-all duration-200 active:scale-95"
                                onClick={togglePlay}
                            >
                                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                            </Button>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                disabled={!hasNext} 
                                onClick={onNext} 
                                className="h-7 w-7 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                            >
                                <SkipForward className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <div className="flex-1 text-center py-1 select-none text-[10px] text-zinc-450 dark:text-zinc-500 font-medium">
                            Chương này chưa có giọng đọc
                        </div>
                    )}

                    {/* Right side: Speed and Close */}
                    <div className="flex items-center gap-2">
                        {audioUrl && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-[9px] font-semibold font-mono border border-pink-100/60 hover:border-pink-200 dark:border-zinc-800 dark:hover:bg-zinc-850 rounded-full px-2 text-zinc-650 dark:text-zinc-300 hover:bg-pink-50/30 dark:hover:text-zinc-100 transition-all"
                                onClick={() => {
                                    const rates = [0.75, 1, 1.25, 1.5, 2];
                                    const idx = rates.indexOf(playbackRate);
                                    setPlaybackRate(rates[(idx + 1) % rates.length]);
                                }}
                            >
                                {playbackRate}x
                            </Button>
                        )}
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={onClose} 
                            className="rounded-full h-7 w-7 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                            title="Đóng trình phát"
                        >
                            <X className="w-3.5 h-3.5" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Hidden Audio Elements */}
            <audio 
                ref={audioRef}
                src={audioUrl || undefined}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />
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
