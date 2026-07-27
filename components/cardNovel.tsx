"use client"

import { useState } from 'react'
import SpotlightCard from '../components/ui/SpotlightCard/SpotlightCard'
import { Badge } from "@/components/ui/badge"
import Image from 'next/image'
import Link from "next/link"
import { useRouter } from "next/navigation"
import { BookOpen, Headphones } from 'lucide-react'

interface NovelCardProps {
    novelId?: string
    title: string
    coverImage: string
    genres: Array<{ name: string; url: string }>
    className?: string
}

const CardNovel = ({
    novelId,
    title = "Chàng trai mang trong mình ma công che giấu tu vi thoát khỏi xiềng nữ đế và cuộc tranh đoạt vương vị",
    coverImage = "",
    genres = [
        { name: "Huyền huyễn", url: "/" },
        { name: "Tu tiên", url: "/" },
        { name: "Tiên hiệp", url: "/" }
    ],
    className = ""
}: NovelCardProps) => {
    const router = useRouter()
    const [imageError, setImageError] = useState(false)

    const handleImageError = () => {
        setImageError(true)
    }

    const handleQuickAudioPlay = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        if (novelId) {
            router.push(`/novel/${novelId}/chapter/1`)
        }
    }

    const novelLink = novelId ? `/novel/${novelId}` : '#';

    const CardContent = (
        <SpotlightCard
            className={`custom-spotlight-card w-full h-full flex flex-col justify-between gap-3 bg-zinc-50 border border-zinc-200/80 text-zinc-900 dark:bg-zinc-950/40 dark:border-zinc-800/30 dark:text-zinc-50 transition-all hover:shadow-md ${className}`}
            spotlightColor="rgba(255, 133, 162, 0.12)"
        >
            <div className="flex flex-col gap-3">
                <div className="img_container w-full aspect-[2/3] overflow-hidden bg-muted relative group/img">
                    {coverImage && !imageError ? (
                        <Image
                            src={coverImage}
                            alt={title}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className='object-cover transition-transform duration-300 group-hover:scale-105'
                            onError={handleImageError}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                            <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                    )}

                    {/* Quick Audio Badge Button */}
                    {novelId && (
                        <button
                            onClick={handleQuickAudioPlay}
                            className="absolute top-2 right-2 flex items-center gap-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-md hover:scale-105 active:scale-95 transition-all z-10 border border-white/20"
                            title="Nghe Audio Nhanh"
                        >
                            <Headphones className="w-3 h-3" />
                            <span>Audio</span>
                        </button>
                    )}
                </div>
                <div className="text_container flex flex-col gap-1.5 px-3.5">
                    <h3 className="text-base font-bold line-clamp-2 leading-tight min-h-[2.5rem]" title={title}>{title}</h3>
                </div>
            </div>
            <div className="bage_ctn flex gap-1 flex-wrap content-end px-3.5 pb-3.5 pt-1">
                {genres.slice(0, 3).map((genre, index) => (
                    <Badge key={index} variant="secondary" className='text-[10px] px-1.5 h-5 truncate max-w-full font-medium'>
                        {genre.name}
                    </Badge>
                ))}
            </div>
        </SpotlightCard>
    );

    // Nếu có novelId thì wrap trong Link, không thì chỉ render card
    if (novelId) {
        return (
            <Link href={novelLink} className="block">
                {CardContent}
            </Link>
        );
    }

    return CardContent;
}

export default CardNovel