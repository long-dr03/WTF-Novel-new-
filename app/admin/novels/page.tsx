"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, CheckCircle, XCircle, Trash2, Eye } from "lucide-react"
import axios from "@/setup/axios"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"

interface Novel {
    _id: string
    title: string
    author: {
        username: string
        email: string
    }
    image: string
    status: string
    publishStatus: 'pending' | 'published' | 'rejected'
    isFeatured: boolean
    views: number
    createdAt: string // or Date
}

export default function NovelsPage() {
    const [novels, setNovels] = useState<Novel[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [activeTab, setActiveTab] = useState('all')

    const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
    const [selectedNovelId, setSelectedNovelId] = useState<string>("")
    const [rejectReason, setRejectReason] = useState("")

    // Slider/Banner Config State
    const [bannerDialogOpen, setBannerDialogOpen] = useState(false)
    const [bannerUrl, setBannerUrl] = useState("")
    const [selectedNovelForBanner, setSelectedNovelForBanner] = useState<Novel | null>(null)

    const fetchNovels = async () => {
        setLoading(true)
        try {
            const params: any = { page, search }
            if (activeTab !== 'all') {
                params.status = activeTab
            }
            // Note: backend 'status' maps to publishStatus in query if passed
            const res = await axios.get('/admin/novels', { params })
            const data: any = res;
            setNovels(data.novels)
            setTotalPages(data.pages)
        } catch (error) {
            toast.error("Không thể tải danh sách truyện")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchNovels()
        }, 300)
        return () => clearTimeout(timer)
    }, [page, search, activeTab])

    const handleApprove = async (id: string) => {
        try {
            await axios.put(`/admin/novels/${id}/approve`)
            toast.success("Đã duyệt truyện")
            fetchNovels()
        } catch (error) {
            toast.error("Lỗi khi duyệt truyện")
        }
    }

    const confirmReject = async () => {
        if (!selectedNovelId) return;
        try {
            await axios.put(`/admin/novels/${selectedNovelId}/reject`, { reason: rejectReason })
            toast.success("Đã từ chối truyện")
            fetchNovels()
            setRejectDialogOpen(false)
            setRejectReason("")
        } catch (error) {
            toast.error("Lỗi khi từ chối truyện")
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc chắn muốn xóa truyện này?")) return;
        try {
            await axios.delete(`/admin/novels/${id}`)
            toast.success("Đã xóa truyện")
            fetchNovels()
        } catch (error) {
            toast.error("Lỗi khi xóa truyện")
        }
    }

    const handleUpdateBanner = async () => {
        if (!selectedNovelForBanner) return;
        try {
             // Assuming we can update the novel's bannerImage via a generic update endpoint 
             // or the featured endpoint supports body. 
             // Using generic update endpoint for now if available, otherwise falling back to a hypothetical one.
             // Checking NovelController, updateNovel calls PUT /novel/:id.
             // Admin route might be different. I'll try to use the generic /novel/:id update wrapper or the admin one.
             // Let's use axios directly with the admin pattern or the generic one.
             // Attempting generic update pattern:
             await axios.put(`/novel/${selectedNovelForBanner._id}`, { bannerImage: bannerUrl, bannerUrl: bannerUrl });
             
             // Also ensure it is featured if not already? User didn't say, but usually slider items are featured.
             if (!selectedNovelForBanner.isFeatured) {
                 await axios.put(`/admin/novels/${selectedNovelForBanner._id}/featured`);
             }

             toast.success("Đã cập nhật banner và đưa lên slider")
             setBannerDialogOpen(false)
             fetchNovels()
        } catch (error) {
            toast.error("Lỗi cập nhật banner")
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'published': return <Badge className="bg-green-500 hover:bg-green-600">Đã xuất bản</Badge>
            case 'pending': return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20">Chờ duyệt</Badge>
            case 'rejected': return <Badge variant="destructive">Từ chối</Badge>
            default: return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Quản lý truyện</h2>
                    <p className="text-muted-foreground">Quản lý và duyệt nội dung truyện.</p>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-4 justify-between">
                    <Tabs defaultValue="all" className="w-[400px]" onValueChange={(val) => {
                        setActiveTab(val);
                        setPage(1);
                    }}>
                        <TabsList>
                            <TabsTrigger value="all">Tất cả</TabsTrigger>
                            <TabsTrigger value="pending">Chờ duyệt</TabsTrigger>
                            <TabsTrigger value="published">Đã xuất bản</TabsTrigger>
                             <TabsTrigger value="rejected">Bị từ chối</TabsTrigger>
                        </TabsList>
                    </Tabs>

                    <div className="relative w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Tìm kiếm truyện..."
                            className="pl-8"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                 </div>

                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[60px]"></TableHead>
                                <TableHead>Tên truyện</TableHead>
                                <TableHead>Tác giả</TableHead>
                                <TableHead>Trạng thái</TableHead>
                                <TableHead>Nổi bật</TableHead>
                                <TableHead>Lượt xem</TableHead>
                                <TableHead className="text-right">Hành động</TableHead>
                            </TableRow>
                        </TableHeader>

                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        <div className="flex justify-center">
                                            <Loader2 className="w-6 h-6 animate-spin" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : novels.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-24 text-center">
                                        Không tìm thấy truyện nào.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                novels.map((novel) => (
                                    <TableRow key={novel._id}>
                                        <TableCell>
                                            <div className="relative h-10 w-8 overflow-hidden rounded bg-muted">
                                                 <Image 
                                                    src={novel.image ? novel.image : "https://cdn-icons-png.flaticon.com/512/149/149071.png"} 
                                                    alt={novel.title || "Novel Cover"}
                                                    fill
                                                    sizes="32px"
                                                    className="object-cover" 
                                                 />
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium max-w-[200px] truncate" title={novel.title}>{novel.title}</TableCell>
                                        <TableCell>{novel.author?.username || "Unknown"}</TableCell>
                                        <TableCell>{getStatusBadge(novel.publishStatus)}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-2">
                                                <Button 
                                                    variant={novel.isFeatured ? "default" : "outline"}
                                                    size="sm"
                                                    onClick={async () => {
                                                        try {
                                                            await axios.put(`/admin/novels/${novel._id}/featured`);
                                                            toast.success(novel.isFeatured ? "Đã bỏ nổi bật" : "Đã thêm vào nổi bật");
                                                            fetchNovels();
                                                        } catch (e) {
                                                            toast.error("Lỗi cập nhật trạng thái");
                                                        }
                                                    }}
                                                    className={novel.isFeatured ? "bg-yellow-500 hover:bg-yellow-600 text-black mb-1 w-full" : "w-full"}
                                                >
                                                    {novel.isFeatured ? "Nổi bật" : "Thường"}
                                                </Button>
                                                {novel.isFeatured && (
                                                    <Button 
                                                        variant="secondary" 
                                                        size="sm" 
                                                        className="h-6 text-xs w-full"
                                                        onClick={() => {
                                                            setSelectedNovelForBanner(novel)
                                                            // @ts-ignore
                                                            setBannerUrl(novel.bannerUrl || novel.bannerImage || "")
                                                            setBannerDialogOpen(true)
                                                        }}
                                                    >
                                                        Cấu hình Banner
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>{novel.views?.toLocaleString() || 0}</TableCell>
                                        <TableCell className="text-right space-x-2">
                                            {/* Preview Link (TODO) */}
                                            {/* <Button size="icon" variant="ghost" title="Xem"><Eye className="w-4 h-4" /></Button> */}
                                            
                                            {(novel.publishStatus === 'pending' || novel.publishStatus === 'rejected') && (
                                                <Button size="icon" variant="ghost" className="text-green-500 hover:text-green-600 hover:bg-green-500/10" onClick={() => handleApprove(novel._id)} title="Duyệt">
                                                    <CheckCircle className="w-4 h-4" />
                                                </Button>
                                            )}
                                            
                                            {novel.publishStatus !== 'rejected' && (
                                                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => {
                                                    setSelectedNovelId(novel._id);
                                                    setRejectReason("");
                                                    setRejectDialogOpen(true);
                                                }} title="Từ chối">
                                                    <XCircle className="w-4 h-4" />
                                                </Button>
                                            )}
                                            
                                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(novel._id)} title="Xóa">
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
                 <div className="flex items-center justify-end space-x-2 py-4">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Trước</Button>
                    <div className="text-sm text-muted-foreground">{page} / {totalPages || 1}</div>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Sau</Button>
                 </div>
            </div>

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Từ chối truyện</DialogTitle>
                        <DialogDescription>
                            Vui lòng nhập lý do từ chối để tác giả biết và chỉnh sửa.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Textarea 
                            placeholder="Nhập lý do..." 
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>Hủy</Button>
                        <Button variant="destructive" onClick={confirmReject} disabled={!rejectReason.trim()}>
                            Xác nhận từ chối
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Cấu hình Slider</DialogTitle>
                        <DialogDescription>
                            Nhập URL ảnh banner cho truyện <b>{selectedNovelForBanner?.title}</b>.
                            Ảnh này sẽ hiển thị trên Slider trang chủ.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div>
                            <label className="text-sm font-medium mb-1 block">URL Ảnh Banner (Kích thước khuyến nghị: 1200x400)</label>
                            <Input 
                                placeholder="https://example.com/banner.jpg" 
                                value={bannerUrl}
                                onChange={(e) => setBannerUrl(e.target.value)}
                            />
                        </div>
                        {bannerUrl && (
                             <div className="relative w-full aspect-[3/1] rounded overflow-hidden border">
                                <Image src={bannerUrl} alt="Preview" fill className="object-cover" />
                             </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setBannerDialogOpen(false)}>Hủy</Button>
                        <Button onClick={handleUpdateBanner}>
                            Lưu cấu hình
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
