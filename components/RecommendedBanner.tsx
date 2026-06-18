"use client"

import React, { useState, useEffect, useCallback } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight, Star, BookOpen } from "lucide-react"
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel"
import { Button } from "@/components/ui/button"

import { type Novel } from "@/services/novelService"

interface RecommendedBannerProps {
    novels: Novel[]
}

const formatDate = (dateStr?: string) => {
    if (!dateStr) return "05/05/2026"
    try {
        return new Date(dateStr).toLocaleDateString('vi-VN')
    } catch (e) {
        return "05/05/2026"
    }
}

export function RecommendedBanner({ novels }: RecommendedBannerProps) {
    const [api, setApi] = useState<CarouselApi>()
    const [canScrollPrev, setCanScrollPrev] = useState(false)
    const [canScrollNext, setCanScrollNext] = useState(false)

    const onSelect = useCallback((api: CarouselApi) => {
        if (!api) return
        setCanScrollPrev(api.canScrollPrev())
        setCanScrollNext(api.canScrollNext())
    }, [])

    useEffect(() => {
        if (!api) return
        onSelect(api)
        api.on("select", onSelect)
        api.on("reInit", onSelect)
    }, [api, onSelect])

    const handlePrev = useCallback(() => {
        api?.scrollPrev()
    }, [api])

    const handleNext = useCallback(() => {
        api?.scrollNext()
    }, [api])

    if (!novels || novels.length === 0) return null

    return (
        <div className="relative w-full overflow-hidden rounded-2xl border border-pink-200/20 dark:border-zinc-800/40 p-6 md:p-8 shadow-sm recommended-banner-bg dark:bg-gradient-to-r dark:from-pink-950/20 dark:via-zinc-900/40 dark:to-pink-950/20">
            {/* Cherry Blossom SVG Left */}
            <svg className="absolute -left-2 -top-2 w-32 h-32 md:w-44 md:h-44 opacity-40 dark:opacity-20 pointer-events-none select-none hidden dark:block" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 0 C 25 15, 45 10, 75 25 C 82 28, 90 25, 100 32 C 105 35, 110 32, 115 38" stroke="#7c5f58" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M 25 12 C 35 20, 40 30, 55 35" stroke="#7c5f58" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M 45 14 C 50 8, 60 5, 70 3" stroke="#7c5f58" strokeWidth="1.2" strokeLinecap="round"/>
                <path d="M 75 25 C 80 35, 85 45, 95 50" stroke="#7c5f58" strokeWidth="1.2" strokeLinecap="round"/>

                <circle cx="25" cy="12" r="4" fill="#ffaec1" />
                <circle cx="25" cy="12" r="2" fill="#ff7395" />
                <circle cx="35" cy="20" r="3" fill="#ffaec1" />
                <circle cx="55" cy="35" r="5" fill="#ff85a2" />
                <circle cx="55" cy="35" r="2.5" fill="#ff7395" />
                <circle cx="45" cy="14" r="4" fill="#ffaec1" />
                <circle cx="70" cy="3" r="3" fill="#ffb7c5" />
                <circle cx="75" cy="25" r="5" fill="#ff85a2" />
                <circle cx="75" cy="25" r="2.5" fill="#ff7395" />
                <circle cx="95" cy="50" r="4" fill="#ffb7c5" />
                <circle cx="100" cy="32" r="6" fill="#ff7395" />
                <circle cx="100" cy="32" r="2.5" fill="#ffffff" />
                <circle cx="115" cy="38" r="4" fill="#ffaec1" />
            </svg>

            {/* Cherry Blossom SVG Right */}
            <svg className="absolute -right-2 -bottom-2 w-32 h-32 md:w-44 md:h-44 opacity-40 dark:opacity-20 pointer-events-none select-none transform rotate-180 hidden dark:block" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 0 C 25 15, 45 10, 75 25 C 82 28, 90 25, 100 32 C 105 35, 110 32, 115 38" stroke="#7c5f58" strokeWidth="2.5" strokeLinecap="round"/>
                <path d="M 25 12 C 35 20, 40 30, 55 35" stroke="#7c5f58" strokeWidth="1.5" strokeLinecap="round"/>
                <path d="M 45 14 C 50 8, 60 5, 70 3" stroke="#7c5f58" strokeWidth="1.2" strokeLinecap="round"/>

                <circle cx="25" cy="12" r="4" fill="#ffaec1" />
                <circle cx="25" cy="12" r="2" fill="#ff7395" />
                <circle cx="35" cy="20" r="3" fill="#ffaec1" />
                <circle cx="55" cy="35" r="5" fill="#ff85a2" />
                <circle cx="55" cy="35" r="2.5" fill="#ff7395" />
                <circle cx="45" cy="14" r="4" fill="#ffaec1" />
                <circle cx="70" cy="3" r="3" fill="#ffb7c5" />
                <circle cx="75" cy="25" r="5" fill="#ff85a2" />
                <circle cx="100" cy="32" r="6" fill="#ff7395" />
                <circle cx="115" cy="38" r="4" fill="#ffaec1" />
            </svg>

            {/* Header section inside banner */}
            <div className="relative z-10 flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <span className="inline-block w-2.5 h-6 bg-primary rounded-full" />
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 tracking-tight">Truyện đề cử</h2>
                </div>
                
                {/* Carousel Controls */}
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePrev}
                        disabled={!canScrollPrev}
                        className="h-8 w-8 rounded-full border-pink-200/40 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors duration-200 cursor-pointer shadow-sm disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNext}
                        disabled={!canScrollNext}
                        className="h-8 w-8 rounded-full border-pink-200/40 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 hover:bg-primary hover:text-white dark:hover:bg-primary dark:hover:text-white transition-colors duration-200 cursor-pointer shadow-sm disabled:opacity-50 disabled:pointer-events-none"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Carousel Slider */}
            <div className="relative z-10 w-full">
                <Carousel
                    setApi={setApi}
                    opts={{
                        align: "start",
                        loop: false,
                    }}
                    className="w-full"
                >
                    <CarouselContent className="-ml-4">
                        {novels.map((novel) => {
                            const novelIdStr = novel._id || novel.id || ""
                            const chaptersCount = novel.chapters || 0
                            return (
                                <CarouselItem key={novelIdStr} className="pl-4 basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                                    <div className="flex gap-4 p-3.5 bg-white/95 dark:bg-zinc-950/60 border border-pink-200/10 dark:border-zinc-800 rounded-2xl shadow-sm hover:shadow hover:border-primary/20 dark:hover:border-primary/30 transition-all duration-300 group h-full">
                                        {/* Cover on Left */}
                                        <Link href={`/novel/${novelIdStr}`} className="relative w-18 h-26 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/40 dark:border-zinc-800/40 shadow-sm">
                                            {novel.image || novel.coverImage ? (
                                                <Image
                                                    src={novel.image || novel.coverImage || ""}
                                                    alt={novel.title}
                                                    fill
                                                    sizes="72px"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                                                    <BookOpen className="h-8 w-8 text-primary/30" />
                                                </div>
                                            )}
                                        </Link>

                                        {/* Info on Right */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                                            <div>
                                                <Link href={`/novel/${novelIdStr}`}>
                                                    <h3 className="font-bold text-sm text-zinc-800 dark:text-zinc-200 line-clamp-2 leading-tight hover:text-primary dark:hover:text-primary transition-colors mb-1" title={novel.title}>
                                                        {novel.title}
                                                    </h3>
                                                </Link>
                                                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-medium">
                                                    {formatDate(novel.updatedAt || novel.createdAt)}
                                                </span>
                                            </div>

                                            {/* Latest Chapters Link */}
                                            <div className="flex flex-col gap-1 mt-2">
                                                {chaptersCount > 0 ? (
                                                    <>
                                                        <Link 
                                                            href={`/novel/${novelIdStr}/chapter/${chaptersCount}`}
                                                            className="inline-flex max-w-max items-center justify-center text-[10px] font-semibold text-zinc-600 dark:text-zinc-300 hover:text-primary dark:hover:text-primary bg-zinc-100/80 dark:bg-zinc-900/80 hover:bg-primary/5 dark:hover:bg-primary/10 px-2 py-1 rounded-lg border border-zinc-200/30 dark:border-zinc-800/50 transition-all"
                                                        >
                                                            Chương {chaptersCount}
                                                        </Link>
                                                        {chaptersCount > 1 && (
                                                            <Link 
                                                                href={`/novel/${novelIdStr}/chapter/${chaptersCount - 1}`}
                                                                className="inline-flex max-w-max items-center justify-center text-[10px] font-medium text-zinc-500 dark:text-zinc-400 hover:text-primary dark:hover:text-primary bg-zinc-100/50 dark:bg-zinc-900/40 px-2 py-0.5 rounded-lg border border-zinc-200/10 dark:border-zinc-800/20 transition-all"
                                                            >
                                                                Chương {chaptersCount - 1}
                                                            </Link>
                                                        )}
                                                    </>
                                                ) : (
                                                    <Link 
                                                        href={`/novel/${novelIdStr}`}
                                                        className="inline-flex max-w-max items-center justify-center text-[10px] font-semibold text-primary dark:text-primary hover:underline bg-primary/5 px-2 py-1 rounded-lg transition-all"
                                                    >
                                                        Bắt đầu đọc
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CarouselItem>
                            )
                        })}
                    </CarouselContent>
                </Carousel>
            </div>
        </div>
    )
}
