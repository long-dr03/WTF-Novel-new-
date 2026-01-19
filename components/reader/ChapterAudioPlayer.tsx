"use client"

import React, { useState, useRef, useEffect } from "react"
import { Play, Pause, SkipForward, Volume2, VolumeX, Settings2 } from "lucide-react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface ChapterAudioPlayerProps {
    audioUrl: string | null
    title?: string
    onNext?: () => void
    hasNext?: boolean
    autoNext?: boolean
    onAutoNextChange?: (val: boolean) => void
    isDark?: boolean
}

export function ChapterAudioPlayer({
    audioUrl,
    title,
    onNext,
    hasNext = false,
    autoNext = true,
    onAutoNextChange,
    isDark = false
}: ChapterAudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolume] = useState(1)
    const [playbackRate, setPlaybackRate] = useState(1)
    const [isMuted, setIsMuted] = useState(false)

    // Nếu audioUrl thay đổi (chuyển chương), reset state và auto play nếu có autoNext
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.pause()
            setIsPlaying(false)
            setCurrentTime(0)
            
            // Reload audio source
            if (audioUrl) {
                audioRef.current.load()
                // Nếu muốn auto play khi chuyển chương:
                 if (autoNext) {
                    const playPromise = audioRef.current.play()
                    if (playPromise !== undefined) {
                        playPromise.catch(error => {
                            console.log("Auto-play prevented:", error)
                        }).then(() => {
                            setIsPlaying(true)
                        })
                    }
                 }
            }
        }
    }, [audioUrl])

    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = playbackRate
        }
    }, [playbackRate])

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime)
        }
    }

    const handleLoadedMetadata = () => {
        if (audioRef.current) {
            setDuration(audioRef.current.duration)
        }
    }

    const handleSeek = (value: number[]) => {
        if (audioRef.current) {
            audioRef.current.currentTime = value[0]
            setCurrentTime(value[0])
        }
    }

    const handleEnded = () => {
        setIsPlaying(false)
        if (autoNext && hasNext && onNext) {
            onNext()
        }
    }

    const toggleMute = () => {
        if (audioRef.current) {
            audioRef.current.muted = !isMuted
            setIsMuted(!isMuted)
        }
    }

    const handleVolumeChange = (value: number[]) => {
        const newVolume = value[0]
        setVolume(newVolume)
        if (audioRef.current) {
            audioRef.current.volume = newVolume
            setIsMuted(newVolume === 0)
        }
    }

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`
    }

    if (!audioUrl) return null

    return (
        <div className={cn(
            "fixed bottom-0 left-0 right-0 p-4 border-t backdrop-blur-lg z-50 transition-all duration-300 transform",
            isDark ? "bg-black/80 border-white/10 text-white" : "bg-white/80 border-stone-200 text-stone-800"
        )}>
            <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onEnded={handleEnded}
            />
            
            <div className="container max-w-4xl mx-auto flex flex-col gap-2">
                {/* Progress Bar */}
                <div className="flex items-center gap-3 w-full">
                    <span className="text-xs font-mono w-10 text-right">{formatTime(currentTime)}</span>
                    <Slider
                        value={[currentTime]}
                        max={duration || 100}
                        step={1}
                        onValueChange={handleSeek}
                        className="flex-1 cursor-pointer"
                    />
                    <span className="text-xs font-mono w-10">{formatTime(duration)}</span>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-xs truncate max-w-[200px] font-medium opacity-80">
                            {title || "Đang phát..."}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                         {/* Playback Rate */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 text-xs font-mono">
                                    {playbackRate}x
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-20 p-1" side="top">
                                <div className="flex flex-col gap-1">
                                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(rate => (
                                        <Button 
                                            key={rate} 
                                            variant={playbackRate === rate ? "secondary" : "ghost"} 
                                            size="sm"
                                            className="h-7 text-xs justify-center"
                                            onClick={() => setPlaybackRate(rate)}
                                        >
                                            {rate}x
                                        </Button>
                                    ))}
                                </div>
                            </PopoverContent>
                        </Popover>

                        {/* Play/Pause */}
                        <Button
                            onClick={togglePlay}
                            size="icon"
                            className="h-10 w-10 rounded-full shadow-lg"
                        >
                            {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-1" />}
                        </Button>

                        {/* Next Chapter */}
                        <Button
                            variant="ghost"
                            size="icon"
                            disabled={!hasNext}
                            onClick={onNext}
                            className={cn(!hasNext && "opacity-30")}
                            title="Chương kế tiếp"
                        >
                            <SkipForward className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                         {/* Volume */}
                         <div className="hidden sm:flex items-center gap-2 group">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleMute}>
                                {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                            </Button>
                            <div className="w-0 overflow-hidden group-hover:w-20 transition-all duration-300">
                                <Slider
                                    value={[isMuted ? 0 : volume]}
                                    max={1}
                                    step={0.1}
                                    onValueChange={handleVolumeChange}
                                    className="w-20"
                                />
                            </div>
                        </div>

                         {/* Settings / Auto Next Toggle */}
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Settings2 className="h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-48 p-3" side="top" align="end">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm">Tự động chuyển chương</span>
                                    <input 
                                        type="checkbox" 
                                        checked={autoNext} 
                                        onChange={(e) => onAutoNextChange?.(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                </div>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>
            </div>
        </div>
    )
}
