"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Globe, Bell, Shield, Save, Megaphone, Sparkles } from "lucide-react"
import axios from "@/setup/axios"
import { toast } from "sonner"
import { MediaUpload } from "@/components/ui/MediaUpload"

type AdSlot = { enabled: boolean; imageUrl: string; link: string }

type SettingsState = {
    siteName: string
    siteDescription: string
    maintenanceMode: boolean
    emailNotification: boolean
    autoApproveNovels: boolean
    minWordsPerChapter: number
    ads: {
        enabled: boolean
        left: AdSlot
        right: AdSlot
    }
    popup: {
        enabled: boolean
        title: string
        description: string
        imageUrl: string
        link: string
    }
}

const defaultSettings: SettingsState = {
    siteName: '',
    siteDescription: '',
    maintenanceMode: false,
    emailNotification: true,
    autoApproveNovels: false,
    minWordsPerChapter: 1000,
    ads: {
        enabled: false,
        left: { enabled: false, imageUrl: '', link: '' },
        right: { enabled: false, imageUrl: '', link: '' },
    },
    popup: {
        enabled: false,
        title: '',
        description: '',
        imageUrl: '',
        link: '',
    },
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<SettingsState>(defaultSettings)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get('/admin/settings') as any
                // Merge với giá trị mặc định để các object lồng nhau luôn tồn tại
                setSettings({
                    ...defaultSettings,
                    ...res,
                    ads: {
                        ...defaultSettings.ads,
                        ...res?.ads,
                        left: { ...defaultSettings.ads.left, ...res?.ads?.left },
                        right: { ...defaultSettings.ads.right, ...res?.ads?.right },
                    },
                    popup: { ...defaultSettings.popup, ...res?.popup },
                })
            } catch (error) {
                toast.error("Không thể tải cài đặt")
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

    const updateAdSlot = (side: 'left' | 'right', patch: Partial<AdSlot>) => {
        setSettings((s) => ({
            ...s,
            ads: { ...s.ads, [side]: { ...s.ads[side], ...patch } },
        }))
    }

    const handleSave = async () => {
        try {
            await axios.put('/admin/settings', settings)
            toast.success("Đã lưu thay đổi")
        } catch (error) {
            toast.error("Lỗi khi lưu cài đặt")
        }
    }

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Cài đặt hệ thống</h2>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">Quản lý cấu hình và tùy chọn hệ thống.</p>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                         <div className="p-2 bg-primary/10 rounded-lg text-primary"><Globe className="w-5 h-5"/></div>
                         <CardTitle>Cài đặt chung</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-2">
                        <Label>Tên website</Label>
                        <Input value={settings.siteName} onChange={(e) => setSettings({...settings, siteName: e.target.value})} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Mô tả website</Label>
                        <Input value={settings.siteDescription} onChange={(e) => setSettings({...settings, siteDescription: e.target.value})} />
                    </div>
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Chế độ bảo trì</Label>
                            <p className="text-sm text-muted-foreground">Khi bật, người dùng sẽ thấy trang bảo trì</p>
                        </div>
                        <Switch checked={settings.maintenanceMode} onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})} />
                    </div>
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <div className="flex items-center gap-2">
                         <div className="p-2 bg-primary/10 rounded-lg text-primary"><Bell className="w-5 h-5"/></div>
                         <CardTitle>Thông báo</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Thông báo email</Label>
                            <p className="text-sm text-muted-foreground">Gửi thông báo qua email cho admin</p>
                        </div>
                        <Switch checked={settings.emailNotification} onCheckedChange={(checked) => setSettings({...settings, emailNotification: checked})} />
                    </div>
                </CardContent>
            </Card>

             <Card>
                 <CardHeader>
                    <div className="flex items-center gap-2">
                         <div className="p-2 bg-primary/10 rounded-lg text-primary"><Shield className="w-5 h-5"/></div>
                         <CardTitle>Bảo mật & Nội dung</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Tự động duyệt truyện</Label>
                            <p className="text-sm text-muted-foreground">Tự động duyệt truyện mới từ tác giả uy tín</p>
                        </div>
                        <Switch checked={settings.autoApproveNovels} onCheckedChange={(checked) => setSettings({...settings, autoApproveNovels: checked})} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Số từ tối thiểu/chương</Label>
                        <Input type="number" value={settings.minWordsPerChapter} onChange={(e) => setSettings({...settings, minWordsPerChapter: Number(e.target.value)})} />
                        <p className="text-xs text-muted-foreground">Yêu cầu số từ tối thiểu cho mỗi chương</p>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Megaphone className="w-5 h-5"/></div>
                        <div>
                            <CardTitle>Quảng cáo 2 bên</CardTitle>
                            <CardDescription>Banner hiển thị cố định ở lề trái và phải (chỉ hiện trên màn hình rộng).</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    {(['left', 'right'] as const).map((side) => (
                        <div key={side} className="space-y-3 rounded-lg border p-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base">Banner {side === 'left' ? 'bên trái' : 'bên phải'}</Label>
                                <Switch checked={settings.ads[side].enabled} onCheckedChange={(checked) => updateAdSlot(side, { enabled: checked })} />
                            </div>
                            <div className="grid gap-2">
                                <Label>Ảnh / GIF / Video quảng cáo</Label>
                                <MediaUpload value={settings.ads[side].imageUrl} onChange={(url) => updateAdSlot(side, { imageUrl: url })} previewClassName="aspect-[3/4]" />
                            </div>
                            <div className="grid gap-2">
                                <Label>Link đích khi click (tracking link Shopee)</Label>
                                <Input placeholder="https://..." value={settings.ads[side].link} onChange={(e) => updateAdSlot(side, { link: e.target.value })} />
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Sparkles className="w-5 h-5"/></div>
                        <div>
                            <CardTitle>Popup chào mừng</CardTitle>
                            <CardDescription>Hiện ngay khi người dùng vào web (1 lần mỗi phiên), có nút tắt.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                            <Label className="text-base">Bật popup</Label>
                            <p className="text-sm text-muted-foreground">Hiển thị popup khi truy cập trang</p>
                        </div>
                        <Switch checked={settings.popup.enabled} onCheckedChange={(checked) => setSettings({...settings, popup: {...settings.popup, enabled: checked}})} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Tiêu đề</Label>
                        <Input value={settings.popup.title} onChange={(e) => setSettings({...settings, popup: {...settings.popup, title: e.target.value}})} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Mô tả</Label>
                        <Input value={settings.popup.description} onChange={(e) => setSettings({...settings, popup: {...settings.popup, description: e.target.value}})} />
                    </div>
                    <div className="grid gap-2">
                        <Label>Ảnh / GIF / Video popup</Label>
                        <MediaUpload value={settings.popup.imageUrl} onChange={(url) => setSettings({...settings, popup: {...settings.popup, imageUrl: url}})} previewClassName="aspect-video" />
                    </div>
                    <div className="grid gap-2">
                        <Label>Link đích khi click (tracking link Shopee)</Label>
                        <Input placeholder="https://..." value={settings.popup.link} onChange={(e) => setSettings({...settings, popup: {...settings.popup, link: e.target.value}})} />
                    </div>
                </CardContent>
            </Card>

            <div className="fixed bottom-6 right-6">
                <Button size="lg" className="shadow-lg" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
                </Button>
            </div>
        </div>
    )
}
