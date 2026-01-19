"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Heart, Edit, Trash2, Plus, BookOpen, Loader2, ExternalLink, Headphones } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "../ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { createNovelService, updateNovelStatusService } from "@/services/novelService"
import { useAuth } from "@/components/providers/AuthProvider"
import { CoverImageUpload } from "@/components/ui/CoverImageUpload"

const createNovelSchema = z.object({
    title: z.string().min(1, "Tiêu đề không được để trống").max(200, "Tiêu đề tối đa 200 ký tự"),
    description: z.string().min(10, "Mô tả ít nhất 10 ký tự").max(2000, "Mô tả tối đa 2000 ký tự"),
    image: z.string().optional(), // URL string from UploadThing
    status: z.enum(["Đang viết", "Hoàn thành", "Tạm dừng"]),
})

type CreateNovelFormValues = z.infer<typeof createNovelSchema>

export interface Novel {
    id?: string
    _id?: string
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
    onStatusChange?: (id: string, status: 'ongoing' | 'completed' | 'hiatus') => void
}

// Map status tiếng Việt sang tiếng Anh cho backend
const statusMapToBackend: Record<string, 'ongoing' | 'completed' | 'hiatus'> = {
    "Đang viết": "ongoing",
    "Hoàn thành": "completed",
    "Tạm dừng": "hiatus"
}

// Map status tiếng Anh sang tiếng Việt cho frontend
const statusMapToFrontend: Record<string, "Đang viết" | "Hoàn thành" | "Tạm dừng"> = {
    "ongoing": "Đang viết",
    "completed": "Hoàn thành",
    "hiatus": "Tạm dừng"
}

const NovelCard = ({ novel, onEdit, onDelete, onStatusChange }: NovelCardProps) => {
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
    
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

    const handleStatusChange = async (newStatus: string) => {
        const backendStatus = statusMapToBackend[newStatus]
        if (!backendStatus) return
        
        setIsUpdatingStatus(true)
        try {
            const novelId = novel._id || novel.id
            if (novelId) {
                const result = await updateNovelStatusService(novelId, backendStatus)
                if (result) {
                    onStatusChange?.(novelId, backendStatus)
                }
            }
        } catch (error) {
            console.error('Lỗi khi cập nhật trạng thái:', error)
        } finally {
            setIsUpdatingStatus(false)
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
                    <select
                        value={novel.status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={isUpdatingStatus}
                        className={`text-xs px-2 py-1 rounded-md border cursor-pointer transition-all ${getStatusColor(novel.status)} ${isUpdatingStatus ? 'opacity-50' : ''}`}
                    >
                        <option value="Đang viết">Đang viết</option>
                        <option value="Hoàn thành">Hoàn thành</option>
                        <option value="Tạm dừng">Tạm dừng</option>
                    </select>
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
                        variant="default"
                        size="sm"
                        className="flex-1 gap-2"
                        asChild
                    >
                        <Link href={`/novel/${novel._id || novel.id}`}>
                            <ExternalLink className="h-4 w-4" />
                            Xem
                        </Link>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2"
                        onClick={() => onEdit?.(novel._id || novel.id || '')}
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => onDelete?.(novel._id || novel.id || '')}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                     <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 text-primary hover:text-primary hover:bg-primary/10"
                        asChild
                    >
                         <Link href={`/novel/${novel._id || novel.id}/chapter/1`}>
                             <Headphones className="h-4 w-4" />
                         </Link>
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}

interface NovelListProps {
    novels?: any[]
    isLoading?: boolean
    onCreateNew?: () => void
    onEditNovel?: (novelId: string) => void
    onNovelsUpdate?: () => void
}

export const NovelList = ({
    novels: externalNovels,
    isLoading = false,
    onCreateNew,
    onEditNovel,
    onNovelsUpdate
}: NovelListProps) => {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const { user } = useAuth();
    const [imageError, setImageError] = useState<string>("")

    // Handler khi status novel thay đổi
    const handleNovelStatusChange = (novelId: string, newStatus: 'ongoing' | 'completed' | 'hiatus') => {
        console.log(`Novel ${novelId} status changed to ${newStatus}`)
        // Trigger reload novels từ parent
        onNovelsUpdate?.()
    }

    const form = useForm<CreateNovelFormValues>({
        resolver: zodResolver(createNovelSchema),
        defaultValues: {
            title: "",
            description: "",
            image: undefined,
            status: "Đang viết",
        },
    })

    const onSubmit = async (values: CreateNovelFormValues) => {
        setIsSubmitting(true)
        try {
            // values.image is now a URL string from UploadThing
            const imageUrl = values.image || ""
            
            const novelData = {
                title: values.title,
                description: values.description,
                author: user?.id || "Unknown",
                genres: [""],
                image: imageUrl,
                status: values.status,
                views: 0,
                likes: 0,
            }
            const result = await createNovelService(novelData)
            if (result) {
                console.log("Novel created successfully:", result)
                form.reset()
                setImageError("")
                setIsDialogOpen(false)
            }
        } catch (error) {
            console.error("Error creating novel:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    interface novel {
        _id: string;
        id?: string;
        title: string;
        coverImage?: string;
        image?: string; // Backend trả về field này
        description: string;
        genres: string[];
        createdAt: string;
        updatedAt: string;
        views: number;
        likes: number;
        status?: "Đang viết" | "Hoàn thành" | "Tạm dừng";
        chapters?: number;
        lastUpdated?: string;
    }
    const novels: novel[] = externalNovels as novel[] || [];
    const handleEdit = (id: string) => {
        console.log('Edit novel:', id)
        // Gọi callback để chuyển qua tab viết truyện
        if (onEditNovel) {
            onEditNovel(id)
        }
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
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger className="flex items-center gap-2 bg-amber-50 text-black p-2 rounded-xl"> <Plus className="h-4 w-4" /> Tạo truyện mới</DialogTrigger>
                    <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Tạo truyện mới</DialogTitle>
                            <DialogDescription>
                                Điền thông tin để tạo truyện mới của bạn
                            </DialogDescription>
                        </DialogHeader>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Tiêu đề truyện *</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Nhập tiêu đề truyện..." {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Mô tả *</FormLabel>
                                            <FormControl>
                                                <Textarea 
                                                    placeholder="Mô tả ngắn về truyện của bạn..." 
                                                    className="min-h-[100px]"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="image"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Ảnh bìa</FormLabel>
                                            <FormControl>
                                                <CoverImageUpload
                                                    value={field.value}
                                                    onChange={(url) => {
                                                        field.onChange(url)
                                                        setImageError("")
                                                    }}
                                                    onError={(error) => setImageError(error)}
                                                />
                                            </FormControl>
                                            {imageError && (
                                                <p className="text-sm text-destructive">{imageError}</p>
                                            )}
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Trạng thái</FormLabel>
                                            <FormControl>
                                                <select
                                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                                    {...field}
                                                >
                                                    <option value="Đang viết">Đang viết</option>
                                                    <option value="Hoàn thành">Hoàn thành</option>
                                                    <option value="Tạm dừng">Tạm dừng</option>
                                                </select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button 
                                        type="button" 
                                        variant="outline" 
                                        onClick={() => setIsDialogOpen(false)}
                                    >
                                        Hủy
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Tạo truyện
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
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
                    {novels.map((novel, index) => {
                        // Convert backend data to NovelCard format
                        const novelStatus = novel.status ? (statusMapToFrontend[novel.status] || novel.status) : "Đang viết";
                        const novelCardData: Novel = {
                            _id: novel._id,
                            id: novel.id,
                            title: novel.title,
                            coverImage: novel.coverImage || novel.image, // Mapping từ backend field 'image'
                            status: novelStatus as Novel["status"],
                            chapters: novel.chapters || 0,
                            views: novel.views || 0,
                            likes: novel.likes || 0,
                            lastUpdated: novel.lastUpdated || novel.updatedAt || novel.createdAt,
                        };
                        return (
                            <NovelCard
                                key={novel._id || novel.id || index}
                                novel={novelCardData}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                                onStatusChange={handleNovelStatusChange}
                            />
                        );
                    })}
                </div>
            )}
        </div>
    )
}
