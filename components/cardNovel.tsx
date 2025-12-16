"use client"

import { useState } from 'react'
import SpotlightCard from '../components/ui/SpotlightCard/SpotlightCard'
import { Badge } from "@/components/ui/badge"
import Image from 'next/image'
import Link from "next/link"
import { BookOpen } from 'lucide-react'

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
    const [imageError, setImageError] = useState(false)

    const handleImageError = () => {
        setImageError(true)
    }

    const novelLink = novelId ? `/novel/${novelId}` : '#';

    const CardContent = (
        <SpotlightCard
            className={`custom-spotlight-card w-full flex flex-col gap-4 ${className}`}
            spotlightColor="rgba(0, 229, 255, 0.2)"
        >
            <div className="img_container w-full aspect-[2/3] rounded-xl overflow-hidden bg-muted relative">
                {coverImage && !imageError ? (
                    <Image
                        src={coverImage}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className='object-cover'
                        onError={handleImageError}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <BookOpen className="h-16 w-16 text-muted-foreground/30" />
                    </div>
                )}
            </div>
            <div className="text_container flex flex-col gap-4">
                <h3 className="text-xl font-bold line-clamp-2">{title}</h3>
                <div className="bage_ctn flex gap-2 flex-wrap">
                    {genres.map((genre, index) => (
                        <Badge key={index} variant="outline" className='w-[30%]'>
                            {genre.name}
                        </Badge>
                    ))}
                </div>
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