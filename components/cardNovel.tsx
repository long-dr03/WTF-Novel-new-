"use client"

import SpotlightCard from '../components/ui/SpotlightCard/SpotlightCard'
import { Badge } from "@/components/ui/badge"
import Image from 'next/image'
import Link from "next/link"

interface NovelCardProps {
    title: string
    coverImage: string
    genres: Array<{ name: string; url: string }>
    className?: string
}

const CardNovel = ({
    title = "Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị",
    coverImage = "/ANIMENETFLIX-FA.webp",
    genres = [
        { name: "Huyền huyễn", url: "/" },
        { name: "Tu tiên", url: "/" },
        { name: "Tiên hiệp", url: "/" }
    ],
    className = ""
}: NovelCardProps) => {
    return (
        <SpotlightCard
            className={`custom-spotlight-card w-[100%] flex flex-col gap-4 ${className}`}
            spotlightColor="rgba(0, 229, 255, 0.2)"
        >
            <div className="img_container w-full h-48 rounded-xl overflow-hidden">
                <Image
                    src={coverImage}
                    alt={title}
                    width={1920}
                    height={1080}
                    className='w-full h-full object-cover'
                />
            </div>
            <div className="text_container flex flex-col gap-4">
                <h3 className="text-xl font-bold line-clamp-2">{title}</h3>
                <div className="bage_ctn flex gap-2 flex-wrap">
                    {genres.map((genre, index) => (
                        <Badge key={index} variant="outline" className='w-[30%]' asChild>
                            <Link href={genre.url}>{genre.name}</Link>
                        </Badge>
                    ))}
                </div>
            </div>
        </SpotlightCard>
    )
}

export default CardNovel