"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { BookOpen } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

interface HistoryItemProps {
    title: string
    coverImage: string
    chapterNumber: number
    chapterTitle: string
    timeAgo: string
    novelUrl: string
}

export const HistoryItem = ({
    title,
    coverImage,
    chapterNumber,
    chapterTitle,
    timeAgo,
    novelUrl
}: HistoryItemProps) => {
    const [imageError, setImageError] = useState(false)

    return (
        <div className="flex gap-4 items-center p-3 rounded-lg hover:bg-accent/50 transition-colors">
            <div className="relative w-12 aspect-[2/3] rounded overflow-hidden flex-shrink-0 bg-muted">
                {coverImage && !imageError ? (
                    <Image
                        src={coverImage}
                        alt={title}
                        fill
                        className="object-cover"
                        onError={() => setImageError(true)}
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <BookOpen className="h-4 w-4 text-muted-foreground/30" />
                    </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <h4 className="font-semibold truncate">{title}</h4>
                <p className="text-sm text-muted-foreground">
                    Chương {chapterNumber} - {chapterTitle}
                </p>
                <p className="text-xs text-muted-foreground">
                    Đọc lúc: {timeAgo}
                </p>
            </div>
            <Button variant="ghost" size="sm" asChild>
                <Link href={novelUrl}>Xem</Link>
            </Button>
        </div>
    )
}
