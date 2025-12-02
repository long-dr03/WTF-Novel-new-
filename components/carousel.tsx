"use client"
import * as React from "react"
import Autoplay from "embla-carousel-autoplay"
import Fade from "embla-carousel-fade"
import Image from "next/image"

import { Card, CardContent } from "@/components/ui/card"
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel"

export function Banner_carousel() {
    const plugin = React.useRef(
        Autoplay({ delay: 4000, stopOnInteraction: true })
    )
    const fadePlugin = React.useRef(Fade())

    const images = [
        "https://picsum.photos/1200/400?random=1",
        "https://picsum.photos/1200/400?random=2",
        "https://picsum.photos/1200/400?random=3",
        "https://picsum.photos/1200/400?random=4",
        "https://picsum.photos/1200/400?random=5",
    ]

    return (
        <Carousel
            plugins={[plugin.current, fadePlugin.current]}
            className="w-full"
            onMouseEnter={plugin.current.stop}
            onMouseLeave={plugin.current.reset}
        >
            <CarouselContent>
                {images.map((src, index) => (
                    <CarouselItem key={index}>
                        <div className="p-1">
                            <Card className="border-0 shadow-none bg-transparent">
                                <CardContent className="flex aspect-[3/1] items-center justify-center p-0 relative overflow-hidden rounded-xl">
                                    <Image
                                        src={src}
                                        alt={`Banner ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        priority={index === 0}
                                    />
                                </CardContent>
                            </Card>
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious className="left-4" />
            <CarouselNext className="right-4" />
        </Carousel>
    )
}
