"use client"
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Loader2, Check, ChevronsUpDown } from "lucide-react"
import { CoverImageUpload } from "@/components/ui/CoverImageUpload"
import { updateNovelService, getPublicGenresService } from "@/services/novelService"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

const updateNovelSchema = z.object({
    title: z.string().min(1, "Tiêu đề không được để trống").max(200, "Tiêu đề tối đa 200 ký tự"),
    description: z.string().min(10, "Mô tả ít nhất 10 ký tự").max(2000, "Mô tả tối đa 2000 ký tự"),
    image: z.string().optional(),
    status: z.enum(["Đang viết", "Hoàn thành", "Tạm dừng"]),
    genres: z.array(z.string()).min(1, "Chọn ít nhất 1 thể loại"),
})

type UpdateNovelFormValues = z.infer<typeof updateNovelSchema>

interface NovelEditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    novel: {
        _id?: string
        id?: string
        title: string
        description: string
        image?: string
        coverImage?: string
        status?: string
        genres?: any[] // strings or objects
    } | null
    onSuccess: () => void
}

export function NovelEditDialog({ open, onOpenChange, novel, onSuccess }: NovelEditDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [imageError, setImageError] = useState<string>("")
    const [availableGenres, setAvailableGenres] = useState<any[]>([])
    const [openCombobox, setOpenCombobox] = useState(false)

    // Fetch genres
    useEffect(() => {
        const fetchGenres = async () => {
             const res = await getPublicGenresService();
             if (res) setAvailableGenres(res);
        }
        fetchGenres();
    }, []);

    const form = useForm<UpdateNovelFormValues>({
        resolver: zodResolver(updateNovelSchema),
        defaultValues: {
            title: novel?.title || "",
            description: novel?.description || "",
            image: novel?.image || novel?.coverImage || "",
            status: (novel?.status as "Đang viết" | "Hoàn thành" | "Tạm dừng") || "Đang viết",
            genres: novel?.genres ? novel.genres.map(g => typeof g === 'string' ? g : g._id) : [],
        },
        values: {
            title: novel?.title || "",
            description: novel?.description || "",
            image: novel?.image || novel?.coverImage || "",
            status: (novel?.status as "Đang viết" | "Hoàn thành" | "Tạm dừng") || "Đang viết",
            genres: novel?.genres ? novel.genres.map(g => typeof g === 'string' ? g : g._id) : [],
        }
    })

    const handleSubmit = async (values: UpdateNovelFormValues) => {
        if (!novel) return;
        setIsSubmitting(true);
        try {
            const novelId = novel._id || novel.id;
            
            if (!novelId) throw new Error("Novel ID is missing");

            await updateNovelService(novelId, {
                title: values.title,
                description: values.description,
                image: values.image,
                status: values.status,
                genres: values.genres
            });

            onSuccess();
            onOpenChange(false);

        } catch (error) {
            console.error("Error updating novel:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa thông tin truyện</DialogTitle>
                    <DialogDescription>
                        Cập nhật thông tin chi tiết cho tác phẩm của bạn
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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
                            name="genres"
                            render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel>Thể loại *</FormLabel>
                                    <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button
                                                    variant="outline"
                                                    role="combobox"
                                                    aria-expanded={openCombobox}
                                                    className={cn(
                                                        "w-full justify-between",
                                                        !field.value?.length && "text-muted-foreground"
                                                    )}
                                                >
                                                    {(field.value?.length || 0) > 0
                                                        ? `${field.value?.length} thể loại đã chọn`
                                                        : "Chọn thể loại"}
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[400px] p-0">
                                            <Command>
                                                <CommandInput placeholder="Tìm thể loại..." />
                                                <CommandList>
                                                    <CommandEmpty>Không tìm thấy thể loại.</CommandEmpty>
                                                    <CommandGroup>
                                                         {availableGenres.map((genre) => (
                                                            <CommandItem
                                                                value={genre.name} // Filter by name
                                                                key={genre._id}
                                                                onSelect={() => {
                                                                    const current = field.value || [] // ensure array
                                                                    const isSelected = current.includes(genre._id)
                                                                    if (isSelected) {
                                                                        field.onChange(current.filter((id) => id !== genre._id))
                                                                    } else {
                                                                        field.onChange([...current, genre._id])
                                                                    }
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        (field.value || []).includes(genre._id)
                                                                            ? "opacity-100"
                                                                            : "opacity-0"
                                                                    )}
                                                                />
                                                                {genre.name}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {(field.value || []).map((genreId) => {
                                            const genre = availableGenres.find(g => g._id === genreId)
                                            return genre ? (
                                                <Badge variant="secondary" key={genreId}>
                                                    {genre.name}
                                                </Badge>
                                            ) : null
                                        })}
                                    </div>
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
                                onClick={() => onOpenChange(false)}
                            >
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Lưu thay đổi
                            </Button>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
