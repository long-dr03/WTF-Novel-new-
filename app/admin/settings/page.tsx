"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Globe, Bell, Shield, Book, Save } from "lucide-react"
import axios from "@/setup/axios"
import { toast } from "sonner"

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        siteName: '',
        siteDescription: '',
        maintenanceMode: false,
        emailNotification: true,
        autoApproveNovels: false,
        minWordsPerChapter: 1000
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await axios.get('/admin/settings')
                setSettings(res as any)
            } catch (error) {
                toast.error("Không thể tải cài đặt")
            } finally {
                setLoading(false)
            }
        }
        fetchSettings()
    }, [])

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
                <h2 className="text-3xl font-bold tracking-tight">Cài đặt hệ thống</h2>
                <p className="text-muted-foreground">Quản lý cấu hình và tùy chọn hệ thống.</p>
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

            <div className="fixed bottom-6 right-6">
                <Button size="lg" className="shadow-lg" onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" /> Lưu thay đổi
                </Button>
            </div>
        </div>
    )
}
