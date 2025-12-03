"use client"
import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import Fade from "embla-carousel-fade"
import Image from "next/image"
import { useCallback, useEffect, useState } from "react"
import { type EmblaCarouselType } from "embla-carousel"

import { Card, CardContent } from "@/components/ui/card"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
    type CarouselApi,
} from "@/components/ui/carousel"
import { cn } from "@/lib/utils"

// Dữ liệu banner mẫu với thông tin chi tiết
const bannerData = [
    {
        src: "https://picsum.photos/1200/400?random=1",
        title: "Khám Phá Thế Giới Tiểu Thuyết",
        subtitle: "Hàng ngàn truyện hay đang chờ bạn",
        badge: "Hot",
    },
    {
        src: "https://picsum.photos/1200/400?random=2",
        title: "Truyện Mới Cập Nhật",
        subtitle: "Cập nhật liên tục mỗi ngày",
        badge: "New",
    },
    {
        src: "https://picsum.photos/1200/400?random=3",
        title: "Tiên Hiệp Huyền Ảo",
        subtitle: "Thế giới tu tiên kỳ ảo",
        badge: "Trending",
    },
    {
        src: "https://picsum.photos/1200/400?random=4",
        title: "Ngôn Tình Lãng Mạn",
        subtitle: "Những câu chuyện tình yêu đẹp",
        badge: "Popular",
    },
    {
        src: "https://picsum.photos/1200/400?random=5",
        title: "Đô Thị Hiện Đại",
        subtitle: "Cuộc sống đô thị sôi động",
        badge: "Featured",
    },
]

export function Banner_carousel() {
    const [api, setApi] = useState<CarouselApi>()
    const [current, setCurrent] = useState(0)
    const [count, setCount] = useState(0)
    const [progress, setProgress] = useState(0)
    const [isHovered, setIsHovered] = useState(false)

    const plugin = React.useRef(
        Autoplay({ delay: 5000, stopOnInteraction: false })
    )
    const fadePlugin = React.useRef(Fade())

    // Cập nhật progress bar
    useEffect(() => {
        if (isHovered) return

        const interval = setInterval(() => {
            setProgress((prev) => {
                if (prev >= 100) return 0
                return prev + 2
            })
        }, 100)

        return () => clearInterval(interval)
    }, [current, isHovered])

    // Reset progress khi slide thay đổi
    useEffect(() => {
        setProgress(0)
    }, [current])

    useEffect(() => {
        if (!api) return

        setCount(api.scrollSnapList().length)
        setCurrent(api.selectedScrollSnap())

        api.on("select", () => {
            setCurrent(api.selectedScrollSnap())
        })
    }, [api])

    const scrollTo = useCallback(
        (index: number) => {
            api?.scrollTo(index)
        },
        [api]
    )

    return (
        <div 
            className="relative group"
            onMouseEnter={() => {
                setIsHovered(true)
                plugin.current.stop()
            }}
            onMouseLeave={() => {
                setIsHovered(false)
                plugin.current.reset()
            }}
        >
            <Carousel
                setApi={setApi}
                plugins={[plugin.current, fadePlugin.current]}
                className="w-full"
                opts={{
                    loop: true,
                }}
            >
                <CarouselContent>
                    {bannerData.map((banner, index) => (
                        <CarouselItem key={index}>
                            <div className="p-1">
                                <Card className="border-0 shadow-none bg-transparent">
                                    <CardContent className="flex aspect-[3/1] items-center justify-center p-0 relative overflow-hidden rounded-2xl group/card cursor-pointer">
                                        {/* Background Image với hiệu ứng zoom khi hover */}
                                        <Image
                                            src={banner.src}
                                            alt={`Banner ${index + 1}`}
                                            fill
                                            className={cn(
                                                "object-cover transition-all duration-700 ease-out",
                                                current === index ? "scale-105" : "scale-100",
                                                "group-hover/card:scale-110"
                                            )}
                                            priority={index === 0}
                                        />
                                        
                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                                        
                                        {/* Content với animation */}
                                        <div className={cn(
                                            "absolute left-8 md:left-16 bottom-1/2 translate-y-1/2 z-10 max-w-xl",
                                            "transition-all duration-700 ease-out",
                                            current === index 
                                                ? "opacity-100 translate-x-0" 
                                                : "opacity-0 -translate-x-10"
                                        )}>
                                            {/* Badge */}
                                            <span className={cn(
                                                "inline-block px-3 py-1 mb-3 text-xs font-semibold rounded-full",
                                                "bg-gradient-to-r from-pink-500 to-violet-500 text-white",
                                                "animate-pulse shadow-lg shadow-pink-500/25"
                                            )}>
                                                {banner.badge}
                                            </span>
                                            
                                            {/* Title */}
                                            <h2 className={cn(
                                                "text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-2",
                                                "drop-shadow-2xl",
                                                "transition-all duration-700 delay-100",
                                                current === index 
                                                    ? "opacity-100 translate-y-0" 
                                                    : "opacity-0 translate-y-4"
                                            )}>
                                                {banner.title}
                                            </h2>
                                            
                                            {/* Subtitle */}
                                            <p className={cn(
                                                "text-sm md:text-lg text-gray-200 mb-4",
                                                "transition-all duration-700 delay-200",
                                                current === index 
                                                    ? "opacity-100 translate-y-0" 
                                                    : "opacity-0 translate-y-4"
                                            )}>
                                                {banner.subtitle}
                                            </p>
                                            
                                            {/* CTA Button */}
                                            <button className={cn(
                                                "px-6 py-2.5 rounded-full font-medium",
                                                "bg-white/20 backdrop-blur-sm text-white",
                                                "border border-white/30",
                                                "hover:bg-white hover:text-black",
                                                "transition-all duration-300",
                                                "transform hover:scale-105",
                                                "delay-300",
                                                current === index 
                                                    ? "opacity-100 translate-y-0" 
                                                    : "opacity-0 translate-y-4"
                                            )}>
                                                Khám phá ngay →
                                            </button>
                                        </div>

                                        {/* Decorative Elements */}
                                        <div className="absolute top-4 right-4 md:top-8 md:right-8">
                                            <div className={cn(
                                                "w-20 h-20 md:w-32 md:h-32 rounded-full",
                                                "bg-gradient-to-br from-pink-500/30 to-violet-500/30",
                                                "blur-2xl",
                                                "animate-pulse"
                                            )} />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                
                {/* Custom Navigation Buttons */}
                <CarouselPrevious className={cn(
                    "left-4 h-12 w-12",
                    "bg-white/10 backdrop-blur-md border-white/20",
                    "text-white hover:bg-white hover:text-black",
                    "transition-all duration-300",
                    "opacity-0 group-hover:opacity-100",
                    "-translate-x-4 group-hover:translate-x-0"
                )} />
                <CarouselNext className={cn(
                    "right-4 h-12 w-12",
                    "bg-white/10 backdrop-blur-md border-white/20",
                    "text-white hover:bg-white hover:text-black",
                    "transition-all duration-300",
                    "opacity-0 group-hover:opacity-100",
                    "translate-x-4 group-hover:translate-x-0"
                )} />
            </Carousel>

            {/* Progress Dots với Animation */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
                {bannerData.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => scrollTo(index)}
                        className={cn(
                            "relative h-2 rounded-full transition-all duration-300 overflow-hidden",
                            current === index ? "w-8 bg-white/30" : "w-2 bg-white/40 hover:bg-white/60"
                        )}
                    >
                        {current === index && (
                            <div 
                                className="absolute inset-y-0 left-0 bg-white rounded-full transition-all duration-100"
                                style={{ width: `${progress}%` }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Slide Counter */}
            <div className={cn(
                "absolute bottom-6 right-8 z-20",
                "text-white/70 text-sm font-medium",
                "transition-all duration-300",
                "opacity-0 group-hover:opacity-100"
            )}>
                <span className="text-white text-lg">{String(current + 1).padStart(2, '0')}</span>
                <span className="mx-1">/</span>
                <span>{String(count).padStart(2, '0')}</span>
            </div>
        </div>
    )
}
