"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen } from "lucide-react"
import Image from "next/image"

interface FavoriteCardProps {
    title: string
    coverImage: string
    genres: string[]
    onClick?: () => void
}

export const FavoriteCard = ({
    title,
    coverImage,
    genres,
    onClick
}: FavoriteCardProps) => {
    const [imageError, setImageError] = useState(false)

    return (
        <Card
            className="overflow-hidden border-border/40 bg-background/95 backdrop-blur hover:border-primary/50 transition-all cursor-pointer"
            onClick={onClick}
        >
            <div className="relative aspect-[2/3] w-full bg-muted">
                {coverImage && !imageError ? (
                    <Image
                        src={coverImage}
                        alt={title}
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <BookOpen className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                )}
            </div>
            <CardHeader className="p-4">
                <CardTitle className="text-base line-clamp-2">
                    {title}
                </CardTitle>
                <div className="flex gap-1 mt-2 flex-wrap">
                    {genres.map((genre, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                            {genre}
                        </Badge>
                    ))}
                </div>
            </CardHeader>
        </Card>
    )
}
