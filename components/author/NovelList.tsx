"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Heart, Edit, Trash2, Plus, BookOpen } from "lucide-react"

export interface Novel {
    id: string
    title: string
    coverImage?: string
    status: "Đang viết" | "Hoàn thành" | "Tạm dừng"
    chapters: number
    views: number
    likes: number
    lastUpdated: string
    genre?: string
}

interface NovelCardProps {
    novel: Novel
    onEdit?: (id: string) => void
    onDelete?: (id: string) => void
}

const NovelCard = ({ novel, onEdit, onDelete }: NovelCardProps) => {
    const getStatusColor = (status: Novel["status"]) => {
        switch (status) {
            case "Đang viết":
                return "bg-blue-500/10 text-blue-500 border-blue-500/20"
            case "Hoàn thành":
                return "bg-green-500/10 text-green-500 border-green-500/20"
            case "Tạm dừng":
                return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
        }
    }

    return (
        <Card className="group overflow-hidden border-border/40 bg-card/50 backdrop-blur hover:border-primary/50 hover:shadow-lg transition-all duration-300">
            <div className="aspect-[2/3] relative overflow-hidden bg-muted">
                {novel.coverImage ? (
                    <img
                        src={novel.coverImage}
                        alt={novel.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                        <BookOpen className="h-20 w-20 text-muted-foreground/30" />
                    </div>
                )}
            </div>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2 flex-1">
                        {novel.title}
                    </CardTitle>
                    <Badge className={getStatusColor(novel.status)} variant="outline">
                        {novel.status}
                    </Badge>
                </div>
                <CardDescription className="text-xs">
                    {novel.chapters} chương • {novel.lastUpdated}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{novel.views.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{novel.likes.toLocaleString()}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 gap-2"
                        onClick={() => onEdit?.(novel.id)}
                    >
                        <Edit className="h-4 w-4" />
                        Sửa
                    </Button>
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete?.(novel.id)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

interface NovelListProps {
    novels?: Novel[]
    isLoading?: boolean
    onCreateNew?: () => void
}

export const NovelList = ({ 
    novels: externalNovels, 
    isLoading = false,
    onCreateNew 
}: NovelListProps) => {
    // Dữ liệu mẫu - sẽ được thay thế bằng props từ API
    const [mockNovels] = useState<Novel[]>([
        {
            id: "1",
            title: "Kiếm Thần Vô Song",
            coverImage: "https://picsum.photos/seed/novel1/200/300",
            status: "Đang viết",
            chapters: 45,
            views: 12500,
            likes: 890,
            lastUpdated: "2 giờ trước",
            genre: "Huyền huyễn"
        },
        {
            id: "2",
            title: "Ma Đạo Tổ Sư",
            coverImage: "https://picsum.photos/seed/novel2/200/300",
            status: "Hoàn thành",
            chapters: 113,
            views: 45000,
            likes: 3200,
            lastUpdated: "1 tuần trước",
            genre: "Đam mỹ"
        },
        {
            id: "3",
            title: "Phàm Nhân Tu Tiên",
            coverImage: "https://picsum.photos/seed/novel3/200/300",
            status: "Đang viết",
            chapters: 78,
            views: 28000,
            likes: 1500,
            lastUpdated: "1 ngày trước",
            genre: "Tiên hiệp"
        }
    ])

    const novels = externalNovels || mockNovels

    const handleEdit = (id: string) => {
        console.log('Edit novel:', id)
        // TODO: Navigate to edit page or open modal
    }

    const handleDelete = (id: string) => {
        console.log('Delete novel:', id)
        // TODO: Show confirmation dialog and call delete API
    }

    const handleCreateNew = () => {
        if (onCreateNew) {
            onCreateNew()
        } else {
            console.log('Create new novel')
            // TODO: Navigate to create page or open modal
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Danh sách truyện</h2>
                        <p className="text-muted-foreground mt-2">
                            Quản lý các tác phẩm của bạn
                        </p>
                    </div>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map((i) => (
                        <Card key={i} className="overflow-hidden border-border/40 bg-card/50 animate-pulse">
                            <div className="aspect-[2/3] bg-muted" />
                            <CardHeader className="pb-3">
                                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                                <div className="h-4 bg-muted rounded w-1/2" />
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="h-4 bg-muted rounded w-20" />
                                    <div className="h-4 bg-muted rounded w-20" />
                                </div>
                                <div className="flex gap-2">
                                    <div className="h-9 bg-muted rounded flex-1" />
                                    <div className="h-9 bg-muted rounded w-9" />
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6 p-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Danh sách truyện</h2>
                    <p className="text-muted-foreground mt-2">
                        {novels.length > 0 
                            ? `Quản lý ${novels.length} tác phẩm của bạn`
                            : "Bạn chưa có tác phẩm nào"
                        }
                    </p>
                </div>
                <Button className="gap-2" onClick={handleCreateNew}>
                    <Plus className="h-4 w-4" />
                    Tạo truyện mới
                </Button>
            </div>

            {novels.length === 0 ? (
                <Card className="p-12 text-center border-dashed">
                    <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                    <h3 className="text-xl font-semibold mb-2">Chưa có truyện nào</h3>
                    <p className="text-muted-foreground mb-6">
                        Bắt đầu sáng tác tác phẩm đầu tiên của bạn
                    </p>
                    <Button onClick={handleCreateNew} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Tạo truyện mới
                    </Button>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {novels.map((novel) => (
                        <NovelCard
                            key={novel.id}
                            novel={novel}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
