"use client"

import React, { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAudioPlayer } from "@/components/providers/AudioPlayerContext"
import { Play, Pause, SkipForward, SkipBack, X, Volume2, VolumeX } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTheme } from "next-themes"

export function GlobalAudioPlayer() {
    const router = useRouter()
    const { theme } = useTheme()
    const {
        audioUrl,
        isPlaying,
        currentTime,
        duration,
        volume,
        playbackRate,
        title,
        novelTitle,
        novelId,
        chapterNumber,
        hasNext,
        hasPrev,
        isLocked,
        togglePlay,
        seek,
        setVolume,
        setPlaybackRate,
        playNext,
        playPrev,
        closePlayer
    } = useAudioPlayer()

    const [isMuted, setIsMuted] = useState(false)
    const [prevVolume, setPrevVolume] = useState(1)

    // Sync muted state
    const handleMuteToggle = () => {
        if (isMuted) {
            setVolume(prevVolume)
            setIsMuted(false)
        } else {
            setPrevVolume(volume)
            setVolume(0)
            setIsMuted(true)
        }
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    }

    if (!audioUrl) return null

    const isDark = theme === "dark"

    const handleTitleClick = () => {
        if (novelId && chapterNumber) {
            router.push(`/novel/${novelId}/chapter/${chapterNumber}`)
        }
    }

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 h-[72px] border-t z-[60] flex items-center justify-between px-4 sm:px-6 gap-3 sm:gap-4 backdrop-blur-md shadow-[0_-8px_30px_rgb(0,0,0,0.08)] font-sans transition-all duration-300",
            isDark 
                ? "bg-zinc-950/95 border-zinc-800/80 text-zinc-100" 
                : "bg-white/95 border-pink-100/60 text-zinc-900"
        )}>
            {/* Top edge progress bar */}
            <div 
                className="absolute top-0 left-0 right-0 h-1 bg-zinc-100 dark:bg-zinc-800 cursor-pointer group"
                onClick={(e) => {
                    if (!duration) return
                    const rect = e.currentTarget.getBoundingClientRect()
                    const clickX = e.clientX - rect.left
                    const width = rect.width
                    const newTime = (clickX / width) * duration
                    seek(newTime)
                }}
            >
                <div className="h-full bg-primary transition-all duration-100" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                {/* Time tooltip on hover */}
                <div className="absolute top-[-20px] left-1/2 transform -translate-x-1/2 hidden group-hover:block bg-zinc-800 text-white text-[10px] px-1 rounded">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>

            {/* Left side: Info */}
            <div 
                onClick={handleTitleClick}
                className="flex flex-col min-w-0 max-w-[150px] sm:max-w-[240px] pr-1 cursor-pointer select-none group"
            >
                <span className="text-xs sm:text-sm font-bold truncate leading-normal group-hover:text-primary transition-colors" title={title}>
                    {title || "Chương truyện"}
                </span>
                <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 truncate mt-0.5 group-hover:underline">
                    {novelTitle || "gocaudio"}
                </span>
            </div>

            {/* Middle: Controls */}
            <div className="flex items-center gap-2.5 sm:gap-4">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={!hasPrev} 
                    onClick={playPrev} 
                    className="h-8 w-8 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    title="Chương trước"
                >
                    <SkipBack className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </Button>
                <Button 
                    size="icon" 
                    disabled={isLocked}
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full shadow-md bg-primary text-primary-foreground hover:bg-primary/95 shadow-primary/10 hover:shadow-primary/20 transition-all duration-200 active:scale-95"
                    onClick={togglePlay}
                    title={isPlaying ? "Tạm dừng" : "Phát"}
                >
                    {isPlaying ? <Pause className="w-4 h-4 sm:w-4.5 sm:h-4.5" /> : <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 ml-0.5" />}
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    disabled={!hasNext} 
                    onClick={playNext} 
                    className="h-8 w-8 rounded-full text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
                    title="Chương sau"
                >
                    <SkipForward className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                </Button>
            </div>

            {/* Right side: Time, Speed, Volume, and Close */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                {/* Time Display */}
                <div className="hidden md:block text-xs font-mono text-zinc-400 dark:text-zinc-500 select-none">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                {/* Speed Button */}
                {!isLocked && (
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6.5 text-[10px] font-semibold font-mono border border-pink-100/60 hover:border-pink-200 dark:border-zinc-800 dark:hover:bg-zinc-850 rounded-full px-2 text-zinc-650 dark:text-zinc-300 hover:bg-pink-50/30 dark:hover:text-zinc-100 transition-all"
                        onClick={() => {
                            const rates = [0.75, 1, 1.25, 1.5, 2]
                            const idx = rates.indexOf(playbackRate)
                            setPlaybackRate(rates[(idx + 1) % rates.length])
                        }}
                        title="Tốc độ phát"
                    >
                        {playbackRate}x
                    </Button>
                )}

                {/* Volume Slider */}
                <div className="hidden sm:flex items-center gap-1.5 w-[70px] sm:w-[90px]">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 text-zinc-400 dark:text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200"
                        onClick={handleMuteToggle}
                    >
                        {isMuted || volume === 0 ? <VolumeX className="w-3.5 h-3.5"/> : <Volume2 className="w-3.5 h-3.5"/>}
                    </Button>
                    <Slider 
                        value={[isMuted ? 0 : volume]} 
                        max={1} 
                        step={0.05} 
                        onValueChange={(v) => {
                            setVolume(v[0])
                            if (v[0] > 0) setIsMuted(false)
                        }} 
                        className="h-1 cursor-pointer" 
                    />
                </div>

                {/* Close Button */}
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={closePlayer} 
                    className="rounded-full h-8 w-8 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
                    title="Đóng trình phát"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </div>
    )
}
