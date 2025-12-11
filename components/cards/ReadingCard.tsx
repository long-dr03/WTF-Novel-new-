"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import Image from "next/image"

interface ReadingCardProps {
    title: string
    coverImage: string
    currentChapter: number
    totalChapters: number
    lastUpdate: string
    onClick?: () => void
}

export const ReadingCard = ({
    title,
    coverImage,
    currentChapter,
    totalChapters,
    lastUpdate,
    onClick
}: ReadingCardProps) => {
    const [imageError, setImageError] = useState(false)

    return (
        <Card className="overflow-hidden border-border/40 bg-background/95 backdrop-blur hover:border-primary/50 transition-all">
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
                <Badge className="absolute top-2 right-2" variant="secondary">
                    Chương {currentChapter}/{totalChapters}
                </Badge>
            </div>
            <CardHeader className="p-4">
                <CardTitle className="text-base line-clamp-2">
                    {title}
                </CardTitle>
                <CardDescription className="text-xs">
                    Cập nhật: {lastUpdate}
                </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <Button className="w-full" size="sm" onClick={onClick}>
                    Đọc tiếp
                </Button>
            </CardContent>
        </Card>
    )
}
