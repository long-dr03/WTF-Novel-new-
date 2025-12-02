"use client"

import { Button } from "@/components/ui/button"
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
    return (
        <div className="flex gap-4 items-center p-3 rounded-lg hover:bg-accent/50 transition-colors">
            <div className="relative h-16 w-12 rounded overflow-hidden flex-shrink-0">
                <Image
                    src={coverImage}
                    alt={title}
                    fill
                    className="object-cover"
                />
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
