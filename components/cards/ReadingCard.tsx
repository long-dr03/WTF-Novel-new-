"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
    return (
        <Card className="overflow-hidden border-border/40 bg-background/95 backdrop-blur hover:border-primary/50 transition-all">
            <div className="relative h-48 w-full">
                <Image
                    src={coverImage}
                    alt={title}
                    fill
                    className="object-cover"
                />
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
