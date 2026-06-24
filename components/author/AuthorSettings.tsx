"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/providers/AuthProvider"
import { ProfileUpdateForm } from "@/components/forms"
import { updateProfileService } from "@/services/profileService"
import { updateNovelService, updateNovelStatusService } from "@/services/novelService"
import { getAuthorPrefs, setAuthorPrefs, type AuthorPrefs } from "@/lib/authorPrefs"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, PenTool, BookOpen, MessageSquare, Flag, Megaphone } from "lucide-react"
import { toast } from "sonner"

interface NovelLike {
    _id?: string
    id?: string
    title: string
    status?: string
    commentsEnabled?: boolean
    reportsEnabled?: boolean
    adImage?: string
    adLink?: string
}

export function AuthorSettings({ novels = [] }: { novels?: NovelLike[] }) {
    const { user, updateUser } = useAuth()

    /* ----------------------------- Editor prefs ----------------------------- */
    const [prefs, setPrefs] = useState<AuthorPrefs>(getAuthorPrefs())
    useEffect(() => { setPrefs(getAuthorPrefs()) }, [])

    const savePrefs = () => {
        setAuthorPrefs(prefs)
        toast.success("Đã lưu tùy chọn soạn thảo")
    }

    /* --------------------------- Account submit ----------------------------- */
    const handleProfileSubmit = async (data: any) => {
        const payload: any = {
            username: data.username,
            email: data.email,
        }
        if (typeof data.avatar === "string" && data.avatar.startsWith("http")) payload.avatar = data.avatar
        if (data.oldPassword && data.newPassword) {
            payload.oldPassword = data.oldPassword
            payload.newPassword = data.newPassword
        }
        const updated = await updateProfileService(payload)
        if (updated) {
            updateUser({ username: updated.username, email: updated.email, avatar: updated.avatar })
            toast.success("Đã cập nhật hồ sơ")
        } else {
            toast.error("Cập nhật hồ sơ thất bại")
        }
    }

    /* ------------------------- Per-novel management ------------------------- */
    const novelOptions = novels.filter(n => n._id || n.id)
    const [selectedId, setSelectedId] = useState<string>(novelOptions[0]?._id || novelOptions[0]?.id || "")
    const selectedNovel = novelOptions.find(n => (n._id || n.id) === selectedId)

    const [novelStatus, setNovelStatus] = useState<string>("ongoing")
    const [commentsEnabled, setCommentsEnabled] = useState(true)
    const [reportsEnabled, setReportsEnabled] = useState(true)
    const [adImage, setAdImage] = useState("")
    const [adLink, setAdLink] = useState("")
    const [savingAd, setSavingAd] = useState(false)

    useEffect(() => {
        if (selectedNovel) {
            setNovelStatus(selectedNovel.status || "ongoing")
            setCommentsEnabled(selectedNovel.commentsEnabled !== false)
            setReportsEnabled(selectedNovel.reportsEnabled !== false)
            setAdImage(selectedNovel.adImage || "")
            setAdLink(selectedNovel.adLink || "")
        }
    }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

    const saveAd = async () => {
        if (!selectedId) return
        setSavingAd(true)
        const res = await updateNovelService(selectedId, { adImage: adImage.trim(), adLink: adLink.trim() } as any)
        if (selectedNovel) { selectedNovel.adImage = adImage.trim(); selectedNovel.adLink = adLink.trim() }
        setSavingAd(false)
        toast[res ? "success" : "error"](res ? "Đã lưu quảng cáo riêng cho truyện" : "Lưu quảng cáo thất bại")
    }

    const changeNovelStatus = async (status: string) => {
        if (!selectedId) return
        setNovelStatus(status)
        const res = await updateNovelStatusService(selectedId, status as any)
        if (selectedNovel) selectedNovel.status = status
        toast[res ? "success" : "error"](res ? "Đã đổi trạng thái truyện" : "Đổi trạng thái thất bại")
    }

    const toggleFlag = async (key: "commentsEnabled" | "reportsEnabled", value: boolean) => {
        if (!selectedId) return
        if (key === "commentsEnabled") setCommentsEnabled(value); else setReportsEnabled(value)
        const res = await updateNovelService(selectedId, { [key]: value } as any)
        if (selectedNovel) (selectedNovel as any)[key] = value
        toast[res ? "success" : "error"](res ? "Đã lưu" : "Lưu thất bại")
    }

    return (
        <div className="p-4 sm:p-6 space-y-6 max-w-3xl">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Cài đặt</h2>
                <p className="text-muted-foreground mt-1 text-sm">Quản lý tài khoản, tùy chọn viết và truyện của bạn.</p>
            </div>

            {/* 1. Tài khoản */}
            <Card className="p-5 sm:p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                    <User className="w-5 h-5 text-primary" /> Tài khoản
                </h3>
                <ProfileUpdateForm
                    defaultValues={{ username: user?.username, email: user?.email, avatar: user?.avatar }}
                    onSubmit={handleProfileSubmit}
                />
            </Card>

            {/* 2. Tùy chọn soạn thảo */}
            <Card className="p-5 sm:p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                    <PenTool className="w-5 h-5 text-primary" /> Tùy chọn soạn thảo
                </h3>
                <div className="space-y-5">
                    <div className="space-y-2">
                        <Label>Trạng thái đăng mặc định</Label>
                        <Select value={prefs.defaultChapterStatus} onValueChange={(v) => setPrefs(p => ({ ...p, defaultChapterStatus: v as any }))}>
                            <SelectTrigger className="w-full sm:w-60"><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="draft">Bản nháp</SelectItem>
                                <SelectItem value="published">Công khai</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">Áp dụng khi bạn tạo chương mới trong trình soạn thảo.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Cảnh báo số từ tối thiểu / chương</Label>
                        <Input
                            type="number"
                            min={0}
                            className="w-full sm:w-60"
                            value={prefs.minWords}
                            onChange={(e) => setPrefs(p => ({ ...p, minWords: Math.max(0, parseInt(e.target.value) || 0) }))}
                        />
                        <p className="text-xs text-muted-foreground">Nhắc nhở khi lưu chương ngắn hơn số từ này. Đặt 0 để tắt.</p>
                    </div>

                    <div className="space-y-2">
                        <Label>Lời tác giả mặc định</Label>
                        <Textarea
                            placeholder="VD: Cảm ơn các bạn đã đọc, nhớ vote ủng hộ mình nhé!"
                            value={prefs.defaultAuthorNote}
                            onChange={(e) => setPrefs(p => ({ ...p, defaultAuthorNote: e.target.value }))}
                            className="min-h-[80px]"
                        />
                        <p className="text-xs text-muted-foreground">Tự gắn vào chương mới khi lưu (có thể sửa lại trước khi đăng).</p>
                    </div>

                    <Button onClick={savePrefs}>Lưu tùy chọn</Button>
                </div>
            </Card>

            {/* 3. Quản lý truyện */}
            <Card className="p-5 sm:p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold mb-4">
                    <BookOpen className="w-5 h-5 text-primary" /> Quản lý truyện
                </h3>

                {novelOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Bạn chưa có truyện nào.</p>
                ) : (
                    <div className="space-y-5">
                        <div className="space-y-2">
                            <Label>Chọn truyện</Label>
                            <Select value={selectedId} onValueChange={setSelectedId}>
                                <SelectTrigger className="w-full"><SelectValue placeholder="Chọn truyện" /></SelectTrigger>
                                <SelectContent>
                                    {novelOptions.map(n => (
                                        <SelectItem key={n._id || n.id} value={(n._id || n.id) as string}>{n.title}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Trạng thái truyện</Label>
                            <Select value={novelStatus} onValueChange={changeNovelStatus}>
                                <SelectTrigger className="w-full sm:w-60"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ongoing">Đang viết</SelectItem>
                                    <SelectItem value="completed">Hoàn thành</SelectItem>
                                    <SelectItem value="hiatus">Tạm dừng</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Cho phép bình luận</p>
                                    <p className="text-xs text-muted-foreground">Độc giả có thể bình luận trong truyện này.</p>
                                </div>
                            </div>
                            <Switch checked={commentsEnabled} onCheckedChange={(v) => toggleFlag("commentsEnabled", v)} />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <div className="flex items-center gap-2">
                                <Flag className="w-4 h-4 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">Cho phép báo cáo vi phạm</p>
                                    <p className="text-xs text-muted-foreground">Hiện nút báo cáo cho truyện này.</p>
                                </div>
                            </div>
                            <Switch checked={reportsEnabled} onCheckedChange={(v) => toggleFlag("reportsEnabled", v)} />
                        </div>

                        {/* Quảng cáo riêng của truyện */}
                        <div className="rounded-lg border p-4 space-y-3">
                            <div className="flex items-center gap-2">
                                <Megaphone className="w-4 h-4 text-primary" />
                                <p className="text-sm font-medium">Quảng cáo riêng của truyện</p>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Khi độc giả đọc truyện này, banner quảng cáo 2 bên sẽ trỏ tới link của bạn.
                                Bỏ trống <b>Ảnh</b> để dùng ảnh quảng cáo chung của trang.
                            </p>
                            <div className="space-y-2">
                                <Label>Link quảng cáo</Label>
                                <Input
                                    placeholder="https://..."
                                    value={adLink}
                                    onChange={(e) => setAdLink(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Ảnh quảng cáo (URL, tùy chọn)</Label>
                                <Input
                                    placeholder="https://.../banner.jpg"
                                    value={adImage}
                                    onChange={(e) => setAdImage(e.target.value)}
                                />
                                {adImage.trim() && (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={adImage} alt="Xem trước quảng cáo" className="mt-1 h-24 w-auto rounded-md border object-cover" />
                                )}
                            </div>
                            <Button onClick={saveAd} disabled={savingAd}>
                                {savingAd ? "Đang lưu..." : "Lưu quảng cáo"}
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    )
}
