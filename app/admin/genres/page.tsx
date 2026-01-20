"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Loader2, Plus, Pencil, Trash2, Search, Book } from "lucide-react"
import axios from "@/setup/axios"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"

interface Genre {
    _id: string
    name: string
    slug: string
    description: string
    image?: string
}

export default function GenresPage() {
    const [genres, setGenres] = useState<Genre[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    
    // Dialog State
    const [isOpen, setIsOpen] = useState(false)
    const [editingGenre, setEditingGenre] = useState<Genre | null>(null)
    const [formData, setFormData] = useState({ name: '', slug: '', description: '', image: '' })

    const fetchGenres = async () => {
        setLoading(true)
        try {
            const res = await axios.get('/admin/genres')
            const data: any = res;
            setGenres(data)
        } catch (error) {
            toast.error("Không thể tải danh sách thể loại")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchGenres()
    }, [])

    const handleSave = async () => {
        try {
            if (editingGenre) {
                await axios.put(`/admin/genres/${editingGenre._id}`, formData)
                toast.success("Cập nhật thể loại thành công")
            } else {
                await axios.post('/admin/genres', formData)
                toast.success("Thêm thể loại thành công")
            }
            setIsOpen(false)
            fetchGenres()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Lỗi khi lưu thể loại")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa thể loại này?")) return;
        try {
            await axios.delete(`/admin/genres/${id}`)
            toast.success("Đã xóa thể loại")
            fetchGenres()
        } catch (error) {
            toast.error("Lỗi khi xóa thể loại")
        }
    }

    const openCreate = () => {
        setEditingGenre(null)
        setFormData({ name: '', slug: '', description: '', image: '' })
        setIsOpen(true)
    }

    const openEdit = (genre: Genre) => {
        setEditingGenre(genre)
        setFormData({ 
            name: genre.name, 
            slug: genre.slug, 
            description: genre.description, 
            image: genre.image || '' 
        })
        setIsOpen(true)
    }

    const filteredGenres = genres.filter(g => g.name.toLowerCase().includes(search.toLowerCase()))

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Quản lý thể loại</h2>
                    <p className="text-muted-foreground">Quản lý các thể loại truyện.</p>
                </div>
                <Button onClick={openCreate} className="bg-primary hover:bg-primary/90">
                    <Plus className="mr-2 h-4 w-4" /> Thêm thể loại
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Tìm kiếm thể loại..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredGenres.map(genre => (
                        <Card key={genre._id} className="relative group overflow-hidden border-border/50 bg-gradient-to-br from-card to-card/50 hover:border-primary/50 transition-colors">
                            <CardHeader>
                                <div className="flex justify-between items-start">
                                    <div className="p-2 bg-primary/10 rounded-lg text-primary mb-2 overflow-hidden w-10 h-10 flex items-center justify-center p-0">
                                        {genre.image ? (
                                            <img src={genre.image} alt={genre.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <Book className="w-6 h-6 m-2" />
                                        )}
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-primary" onClick={() => openEdit(genre)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:text-destructive" onClick={() => handleDelete(genre._id)}>
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                                <CardTitle>{genre.name}</CardTitle>
                                <CardDescription className="line-clamp-2" title={genre.description}>{genre.description}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-xs text-muted-foreground">Slug: {genre.slug}</div>
                                {genre.image && <div className="hidden">{genre.image}</div>} {/* Hidden image URL for reference */}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingGenre ? 'Chỉnh sửa thể loại' : 'Thêm thể loại mới'}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="name">Tên thể loại</Label>
                            <Input 
                                id="name" 
                                value={formData.name} 
                                onChange={(e) => {
                                    const name = e.target.value
                                    // Auto generate slug if creating
                                    if (!editingGenre) {
                                        const slug = name.toLowerCase()
                                            .replace(/á|à|ả|ạ|ã|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/gi, 'a')
                                            .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/gi, 'e')
                                            .replace(/i|í|ì|ỉ|ĩ|ị/gi, 'i')
                                            .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/gi, 'o')
                                            .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/gi, 'u')
                                            .replace(/ý|ỳ|ỷ|ỹ|ỵ/gi, 'y')
                                            .replace(/đ/gi, 'd')
                                            .replace(/[^a-z0-9 -]/g, '')
                                            .replace(/\s+/g, '-')
                                            .replace(/-+/g, '-');
                                        setFormData(prev => ({ ...prev, name, slug }))
                                    } else {
                                        setFormData(prev => ({ ...prev, name }))
                                    }
                                }} 
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="slug">Slug</Label>
                            <Input id="slug" value={formData.slug} onChange={(e) => setFormData({...formData, slug: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="desc">Mô tả</Label>
                            <Textarea id="desc" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="image">Link ảnh minh họa</Label>
                            <Input id="image" value={formData.image} onChange={(e) => setFormData({...formData, image: e.target.value})} placeholder="https://..." />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
                        <Button onClick={handleSave}>Lưu</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
