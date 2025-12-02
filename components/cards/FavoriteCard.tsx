"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
    return (
        <Card
            className="overflow-hidden border-border/40 bg-background/95 backdrop-blur hover:border-primary/50 transition-all cursor-pointer"
            onClick={onClick}
        >
            <div className="relative h-48 w-full">
                <Image
                    src={coverImage}
                    alt={title}
                    fill
                    className="object-cover"
                />
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
