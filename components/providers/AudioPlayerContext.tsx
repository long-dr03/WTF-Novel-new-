"use client"

import React, { createContext, useContext, useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"

interface AudioPlayerContextType {
    audioUrl: string | null
    isPlaying: boolean
    currentTime: number
    duration: number
    volume: number
    playbackRate: number
    autoNext: boolean
    title: string
    novelTitle: string
    novelId: string
    chapterNumber: number | null
    hasNext: boolean
    hasPrev: boolean
    isLocked: boolean
    loadAudio: (url: string | null, info: { title: string; novelTitle: string; novelId: string; chapterNumber: number; hasNext: boolean; hasPrev: boolean; isLocked: boolean }) => void
    togglePlay: () => void
    seek: (time: number) => void
    setVolume: (vol: number) => void
    setPlaybackRate: (rate: number) => void
    setAutoNext: (val: boolean) => void
    playNext: () => void
    playPrev: () => void
    closePlayer: () => void
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined)

export function AudioPlayerProvider({ children }: { children: React.ReactNode }) {
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const router = useRouter()

    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [volume, setVolumeState] = useState(1)
    const [playbackRate, setPlaybackRateState] = useState(1)
    const [autoNext, setAutoNext] = useState(true)

    const [title, setTitle] = useState("")
    const [novelTitle, setNovelTitle] = useState("")
    const [novelId, setNovelId] = useState("")
    const [chapterNumber, setChapterNumber] = useState<number | null>(null)
    const [hasNext, setHasNext] = useState(false)
    const [hasPrev, setHasPrev] = useState(false)
    const [isLocked, setIsLocked] = useState(false)

    const stateRef = useRef({ autoNext, hasNext, novelId, chapterNumber })

    // Keep stateRef in sync
    useEffect(() => {
        stateRef.current = { autoNext, hasNext, novelId, chapterNumber }
    }, [autoNext, hasNext, novelId, chapterNumber])

    // Create audio element on client mount
    useEffect(() => {
        const audio = new Audio()
        audioRef.current = audio

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime)
            localStorage.setItem("audio-last-time", String(audio.currentTime))
        }
        const handleDurationChange = () => setDuration(audio.duration || 0)
        const handleEnded = () => {
            setIsPlaying(false)
            const { autoNext, hasNext, novelId, chapterNumber } = stateRef.current
            if (autoNext && hasNext && novelId && chapterNumber !== null) {
                router.push(`/novel/${novelId}/chapter/${chapterNumber + 1}`)
            }
        }

        audio.addEventListener("timeupdate", handleTimeUpdate)
        audio.addEventListener("durationchange", handleDurationChange)
        audio.addEventListener("ended", handleEnded)

        // Load saved volume/speed
        if (typeof window !== "undefined") {
            const savedVol = localStorage.getItem("audio-volume")
            if (savedVol) {
                const vol = parseFloat(savedVol)
                setVolumeState(vol)
                audio.volume = vol
            }
            const savedRate = localStorage.getItem("audio-speed")
            if (savedRate) {
                const rate = parseFloat(savedRate)
                setPlaybackRateState(rate)
                audio.playbackRate = rate
            }

            const savedTrack = localStorage.getItem("audio-last-track")
            const savedTime = localStorage.getItem("audio-last-time")
            if (savedTrack) {
                try {
                    const track = JSON.parse(savedTrack)
                    setAudioUrl(track.url)
                    setTitle(track.title)
                    setNovelTitle(track.novelTitle)
                    setNovelId(track.novelId)
                    setChapterNumber(track.chapterNumber)
                    setHasNext(track.hasNext)
                    setHasPrev(track.hasPrev)
                    setIsLocked(track.isLocked || false)

                    if (track.url) {
                        audio.src = track.url
                        audio.load()
                        if (savedTime) {
                            const time = parseFloat(savedTime)
                            audio.currentTime = time
                            setCurrentTime(time)
                        }
                    }
                } catch (e) {
                    console.error("Failed to parse saved track", e)
                }
            }
        }

        return () => {
            audio.pause()
            audio.removeEventListener("timeupdate", handleTimeUpdate)
            audio.removeEventListener("durationchange", handleDurationChange)
            audio.removeEventListener("ended", handleEnded)
        }
    }, [])

    const loadAudio = (
        url: string | null,
        info: { title: string; novelTitle: string; novelId: string; chapterNumber: number; hasNext: boolean; hasPrev: boolean; isLocked: boolean }
    ) => {
        setTitle(info.title)
        setNovelTitle(info.novelTitle)
        setNovelId(info.novelId)
        setChapterNumber(info.chapterNumber)
        setHasNext(info.hasNext)
        setHasPrev(info.hasPrev)
        setIsLocked(info.isLocked)

        if (audioUrl === url) return

        setAudioUrl(url)
        setCurrentTime(0)
        setDuration(0)

        // Save track to localStorage
        if (url) {
            localStorage.setItem("audio-last-track", JSON.stringify({
                url,
                title: info.title,
                novelTitle: info.novelTitle,
                novelId: info.novelId,
                chapterNumber: info.chapterNumber,
                hasNext: info.hasNext,
                hasPrev: info.hasPrev,
                isLocked: info.isLocked
            }))
        } else {
            localStorage.removeItem("audio-last-track")
            localStorage.removeItem("audio-last-time")
        }

        if (audioRef.current) {
            if (url && !info.isLocked) {
                audioRef.current.src = url
                audioRef.current.load()
                audioRef.current.playbackRate = playbackRate
                audioRef.current.play()
                    .then(() => setIsPlaying(true))
                    .catch((err) => {
                        if (err.name !== "AbortError") console.error(err)
                    })
            } else {
                audioRef.current.pause()
                audioRef.current.src = ""
                setIsPlaying(false)
            }
        }
    }

    const togglePlay = () => {
        if (!audioRef.current || !audioUrl || isLocked) return

        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            audioRef.current.play()
                .then(() => setIsPlaying(true))
                .catch(console.error)
        }
    }

    const seek = (time: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = time
            setCurrentTime(time)
        }
    }

    const setVolume = (vol: number) => {
        setVolumeState(vol)
        if (audioRef.current) audioRef.current.volume = vol
        localStorage.setItem("audio-volume", String(vol))
    }

    const setPlaybackRate = (rate: number) => {
        setPlaybackRateState(rate)
        if (audioRef.current) audioRef.current.playbackRate = rate
        localStorage.setItem("audio-speed", String(rate))
    }

    const playNext = () => {
        if (hasNext && novelId && chapterNumber !== null) {
            router.push(`/novel/${novelId}/chapter/${chapterNumber + 1}`)
        }
    }

    const playPrev = () => {
        if (hasPrev && novelId && chapterNumber !== null) {
            router.push(`/novel/${novelId}/chapter/${chapterNumber - 1}`)
        }
    }

    const closePlayer = () => {
        if (audioRef.current) {
            audioRef.current.pause()
            audioRef.current.src = ""
        }
        setAudioUrl(null)
        setIsPlaying(false)
        setCurrentTime(0)
        setDuration(0)
    }

    return (
        <AudioPlayerContext.Provider
            value={{
                audioUrl,
                isPlaying,
                currentTime,
                duration,
                volume,
                playbackRate,
                autoNext,
                title,
                novelTitle,
                novelId,
                chapterNumber,
                hasNext,
                hasPrev,
                isLocked,
                loadAudio,
                togglePlay,
                seek,
                setVolume,
                setPlaybackRate,
                setAutoNext,
                playNext,
                playPrev,
                closePlayer,
            }}
        >
            {children}
        </AudioPlayerContext.Provider>
    )
}

export function useAudioPlayer() {
    const context = useContext(AudioPlayerContext)
    if (context === undefined) {
        throw new Error("useAudioPlayer must be used within an AudioPlayerProvider")
    }
    return context
}
