"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Loader2, Globe, Bell, Shield, Save, Megaphone, Sparkles, Database } from "lucide-react"
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

    // Backup state
    const [backupCollections, setBackupCollections] = useState<Record<string, boolean>>({
        users: true,
        novels: true,
        genres: true,
        chapters: true,
        libraries: true,
        musics: true,
        reports: true,
        settings: true,
        comments: true
    })
    const [fromDate, setFromDate] = useState("")
    const [toDate, setToDate] = useState("")
    const [backingUp, setBackingUp] = useState(false)

    const escapeXml = (unsafe: string) => {
        if (!unsafe) return "";
        return unsafe.toString().replace(/[<>&'"]/g, (c) => {
            switch (c) {
                case '<': return '&lt;';
                case '>': return '&gt;';
                case '&': return '&amp;';
                case '\'': return '&apos;';
                case '"': return '&quot;';
                default: return c;
            }
        });
    }

    const convertToExcelXML = (backupData: any) => {
        let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
`;

        Object.keys(backupData).forEach(colName => {
            const rows = backupData[colName];
            if (!Array.isArray(rows) || rows.length === 0) return;

            const headersSet = new Set<string>();
            rows.forEach(row => {
                Object.keys(row).forEach(key => {
                    headersSet.add(key);
                });
            });
            const headers = Array.from(headersSet);
            const sheetName = colName.substring(0, 30);

            xml += ` <Worksheet ss:Name="${sheetName}">\n  <Table>\n`;
            
            xml += `   <Row>\n`;
            headers.forEach(header => {
                xml += `    <Cell><Data ss:Type="String">${escapeXml(header)}</Data></Cell>\n`;
            });
            xml += `   </Row>\n`;

            rows.forEach(row => {
                xml += `   <Row>\n`;
                headers.forEach(header => {
                    let val = row[header];
                    if (val === undefined || val === null) {
                        val = "";
                    } else if (typeof val === 'object') {
                        val = JSON.stringify(val);
                    } else {
                        val = String(val);
                    }
                    xml += `    <Cell><Data ss:Type="String">${escapeXml(val)}</Data></Cell>\n`;
                });
                xml += `   </Row>\n`;
            });

            xml += `  </Table>\n </Worksheet>\n`;
        });

        xml += `</Workbook>`;
        return xml;
    }

    const handleBackup = async (format: 'json' | 'excel') => {
        const selectedCols = Object.keys(backupCollections).filter(k => backupCollections[k])
        if (selectedCols.length === 0) {
            toast.error("Vui lòng chọn ít nhất một danh mục để sao lưu")
            return
        }

        setBackingUp(true)
        try {
            const payload: any = {
                collections: selectedCols
            }
            if (fromDate) payload.fromDate = new Date(fromDate).toISOString()
            if (toDate) payload.toDate = new Date(toDate).toISOString()

            const res = await axios.post('/admin/backup', payload) as any
            
            const dateStr = new Date().toISOString().split('T')[0]
            const backupPayload = res?.data || res

            if (format === 'json') {
                const blob = new Blob([JSON.stringify(res, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const downloadAnchor = document.createElement('a')
                downloadAnchor.href = url
                downloadAnchor.download = `backup_novel_${dateStr}.json`
                document.body.appendChild(downloadAnchor)
                downloadAnchor.click()
                downloadAnchor.remove()
                URL.revokeObjectURL(url)
            } else {
                const xmlContent = convertToExcelXML(backupPayload)
                const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' })
                const url = URL.createObjectURL(blob)
                const downloadAnchor = document.createElement('a')
                downloadAnchor.href = url
                downloadAnchor.download = `backup_novel_${dateStr}.xls`
                document.body.appendChild(downloadAnchor)
                downloadAnchor.click()
                downloadAnchor.remove()
                URL.revokeObjectURL(url)
            }

            toast.success("Tải xuống bản sao lưu thành công!")
        } catch (error) {
            toast.error("Lỗi khi tạo bản sao lưu dữ liệu")
        } finally {
            setBackingUp(false)
        }
    }

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

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary"><Database className="w-5 h-5"/></div>
                        <div>
                            <CardTitle>Sao lưu dữ liệu (Backup)</CardTitle>
                            <CardDescription>Sao lưu dữ liệu cơ sở dữ liệu dưới dạng file JSON.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                            <Label>Từ ngày (Bắt đầu)</Label>
                            <Input 
                                type="date" 
                                value={fromDate} 
                                onChange={(e) => setFromDate(e.target.value)} 
                            />
                            <p className="text-xs text-muted-foreground">Chỉ sao lưu các bản ghi tạo ra sau ngày này (không áp dụng cho Thể loại & Cài đặt).</p>
                        </div>
                        <div className="grid gap-2">
                            <Label>Đến ngày (Kết thúc)</Label>
                            <Input 
                                type="date" 
                                value={toDate} 
                                onChange={(e) => setToDate(e.target.value)} 
                            />
                            <p className="text-xs text-muted-foreground">Chỉ sao lưu các bản ghi tạo ra trước ngày này (không áp dụng cho Thể loại & Cài đặt).</p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label className="text-sm font-semibold">Chọn danh mục cần sao lưu</Label>
                            <div className="flex gap-3 text-xs text-primary font-medium">
                                <button 
                                    type="button" 
                                    onClick={() => setBackupCollections({
                                        users: true, novels: true, genres: true, chapters: true,
                                        libraries: true, musics: true, reports: true, settings: true, comments: true
                                    })}
                                    className="hover:underline cursor-pointer"
                                >
                                    Chọn tất cả
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setBackupCollections({
                                        users: false, novels: false, genres: false, chapters: false,
                                        libraries: false, musics: false, reports: false, settings: false, comments: false
                                    })}
                                    className="hover:underline cursor-pointer"
                                >
                                    Bỏ chọn tất cả
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg border bg-muted/20">
                            {[
                                { key: "users", label: "Người dùng" },
                                { key: "novels", label: "Truyện" },
                                { key: "genres", label: "Thể loại" },
                                { key: "chapters", label: "Chương truyện" },
                                { key: "libraries", label: "Thư viện & Lịch sử" },
                                { key: "musics", label: "Nhạc nền & Giọng đọc" },
                                { key: "reports", label: "Báo cáo lỗi" },
                                { key: "settings", label: "Cài đặt hệ thống" },
                                { key: "comments", label: "Bình luận" }
                            ].map((col) => (
                                <div key={col.key} className="flex items-center gap-2">
                                    <Switch 
                                        id={`backup-col-${col.key}`}
                                        checked={backupCollections[col.key]} 
                                        onCheckedChange={(checked) => setBackupCollections(prev => ({
                                            ...prev,
                                            [col.key]: checked
                                        }))} 
                                    />
                                    <Label htmlFor={`backup-col-${col.key}`} className="cursor-pointer text-xs font-medium sm:text-sm">
                                        {col.label}
                                    </Label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-3">
                        <Button 
                            type="button" 
                            disabled={backingUp} 
                            onClick={() => handleBackup('json')}
                            className="bg-green-600 hover:bg-green-700 text-white cursor-pointer"
                        >
                            {backingUp ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo JSON...
                                </>
                            ) : (
                                <>
                                    <Database className="mr-2 h-4 w-4" /> Xuất file JSON
                                </>
                            )}
                        </Button>
                        <Button 
                            type="button" 
                            disabled={backingUp} 
                            onClick={() => handleBackup('excel')}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer"
                        >
                            {backingUp ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo Excel...
                                </>
                            ) : (
                                <>
                                    <Database className="mr-2 h-4 w-4" /> Xuất file Excel (.xls)
                                </>
                            )}
                        </Button>
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
