"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Loader2, Database, Upload, Download, AlertTriangle, CheckCircle } from "lucide-react"
import axios from "@/setup/axios"
import { toast } from "sonner"

export default function BackupPage() {
    // --- Backup States ---
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

    // --- Restore States ---
    const [restoreFile, setRestoreFile] = useState<File | null>(null)
    const [parsedBackupData, setParsedBackupData] = useState<any>(null)
    const [restoreCollections, setRestoreCollections] = useState<Record<string, boolean>>({})
    const [restoring, setRestoring] = useState(false)
    const [isConfirmOpen, setIsConfirmOpen] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    // Helper to escape XML for Excel
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

    // Convert backup JSON to Excel Multi-sheet format
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

    // Export Backup API Handler
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

    // File Selection Handler for Restore
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setRestoreFile(file)
        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string)
                
                // Backup could be wrapped in { message, timestamp, data } or direct JSON
                const backupPayload = json?.data || json
                
                if (typeof backupPayload !== 'object' || backupPayload === null) {
                    toast.error("File sao lưu không đúng cấu trúc (phải là đối tượng JSON)")
                    return
                }

                setParsedBackupData(backupPayload)

                // Initialize checkboxes based on collections present in the file
                const initialRestoreCols: Record<string, boolean> = {}
                Object.keys(backupPayload).forEach(key => {
                    initialRestoreCols[key] = true
                })
                setRestoreCollections(initialRestoreCols)
                toast.success("Đọc file sao lưu thành công! Hãy kiểm tra thông tin bên dưới.")
            } catch (err) {
                toast.error("File không hợp lệ hoặc không phải định dạng JSON chuẩn")
                setRestoreFile(null)
                setParsedBackupData(null)
            }
        }
        reader.readAsText(file)
    }

    // Restore API Handler
    const handleRestore = async () => {
        if (!parsedBackupData) return

        const selectedCols = Object.keys(restoreCollections).filter(k => restoreCollections[k])
        if (selectedCols.length === 0) {
            toast.error("Vui lòng chọn ít nhất một danh mục cần khôi phục")
            return
        }

        setIsConfirmOpen(false)
        setRestoring(true)
        try {
            // Build filtered restore data containing only selected collections
            const filteredRestoreData: any = {}
            selectedCols.forEach(col => {
                filteredRestoreData[col] = parsedBackupData[col]
            })

            const res = await axios.post('/admin/restore', { backupData: filteredRestoreData }) as any
            toast.success(`Khôi phục thành công! Danh mục: ${res?.restoredCollections?.join(', ') || selectedCols.join(', ')}`)
            
            // Clear restore state
            setRestoreFile(null)
            setParsedBackupData(null)
            setRestoreCollections({})
            if (fileInputRef.current) fileInputRef.current.value = ""
        } catch (error) {
            toast.error("Lỗi trong quá trình khôi phục cơ sở dữ liệu")
        } finally {
            setRestoring(false)
        }
    }

    // Mapping for user friendly names
    const getColLabel = (key: string) => {
        const labels: Record<string, string> = {
            users: "Người dùng",
            novels: "Truyện",
            genres: "Thể loại",
            chapters: "Chương truyện",
            libraries: "Thư viện & Lịch sử",
            musics: "Nhạc nền & Giọng đọc",
            reports: "Báo cáo lỗi",
            settings: "Cài đặt hệ thống",
            comments: "Bình luận"
        }
        return labels[key] || key
    }

    return (
        <div className="space-y-6 pb-20">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Sao lưu & Khôi phục dữ liệu</h2>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">Quản lý sao lưu cơ sở dữ liệu hệ thống (JSON / Excel) và phục hồi từ tệp tin sao lưu cũ.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Export Card */}
                <Card className="h-fit">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-green-500/10 rounded-lg text-green-600 dark:text-green-400">
                                <Download className="w-5 h-5"/>
                            </div>
                            <div>
                                <CardTitle>Sao lưu dữ liệu (Export)</CardTitle>
                                <CardDescription>Xuất dữ liệu hệ thống thành tệp tin JSON hoặc Excel.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="grid gap-2">
                                <Label>Từ ngày (Bắt đầu)</Label>
                                <Input 
                                    type="date" 
                                    value={fromDate} 
                                    onChange={(e) => setFromDate(e.target.value)} 
                                />
                                <p className="text-[11px] text-muted-foreground">Chỉ lọc bản ghi tạo sau ngày này (trừ Thể loại & Cài đặt).</p>
                            </div>
                            <div className="grid gap-2">
                                <Label>Đến ngày (Kết thúc)</Label>
                                <Input 
                                    type="date" 
                                    value={toDate} 
                                    onChange={(e) => setToDate(e.target.value)} 
                                />
                                <p className="text-[11px] text-muted-foreground">Chỉ lọc bản ghi tạo trước ngày này (trừ Thể loại & Cài đặt).</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center">
                                <Label className="text-sm font-semibold">Chọn danh mục sao lưu</Label>
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

                            <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-muted/20">
                                {Object.keys(backupCollections).map((key) => (
                                    <div key={key} className="flex items-center gap-2">
                                        <Switch 
                                            id={`backup-switch-${key}`}
                                            checked={backupCollections[key]} 
                                            onCheckedChange={(checked) => setBackupCollections(prev => ({
                                                ...prev,
                                                [key]: checked
                                            }))} 
                                        />
                                        <Label htmlFor={`backup-switch-${key}`} className="cursor-pointer text-xs sm:text-sm font-medium">
                                            {getColLabel(key)}
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
                                className="bg-green-600 hover:bg-green-700 text-white cursor-pointer w-full sm:w-auto"
                            >
                                {backingUp ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo JSON...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" /> Tải về JSON (.json)
                                    </>
                                )}
                            </Button>
                            <Button 
                                type="button" 
                                disabled={backingUp} 
                                onClick={() => handleBackup('excel')}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer w-full sm:w-auto"
                            >
                                {backingUp ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang tạo Excel...
                                    </>
                                ) : (
                                    <>
                                        <Download className="mr-2 h-4 w-4" /> Tải về Excel (.xls)
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Import Card */}
                <Card className="h-fit">
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                                <Upload className="w-5 h-5"/>
                            </div>
                            <div>
                                <CardTitle>Khôi phục dữ liệu (Import)</CardTitle>
                                <CardDescription>Nhập dữ liệu sao lưu cũ để phục hồi cơ sở dữ liệu.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="restore-file-input" className="font-medium text-sm">Chọn file sao lưu (.json)</Label>
                            <Input 
                                id="restore-file-input" 
                                type="file" 
                                accept=".json" 
                                onChange={handleFileChange}
                                ref={fileInputRef}
                                className="cursor-pointer"
                            />
                        </div>

                        {/* File Preview Content */}
                        {parsedBackupData && (
                            <div className="space-y-4 border rounded-lg p-4 bg-muted/10 animate-in fade-in duration-200">
                                <div className="flex items-center gap-2 text-sm text-green-600 font-semibold dark:text-green-400">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>Tệp tin hợp lệ. Các bảng dữ liệu tìm thấy:</span>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {Object.keys(parsedBackupData).map(key => {
                                        const count = Array.isArray(parsedBackupData[key]) ? parsedBackupData[key].length : 0
                                        return (
                                            <div key={key} className="flex justify-between items-center bg-muted/40 p-2 rounded-md border">
                                                <span className="font-semibold text-muted-foreground">{getColLabel(key)}:</span>
                                                <span className="font-mono bg-background border px-1.5 py-0.5 rounded text-primary">{count} bản ghi</span>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Custom Select for Restore */}
                                <div className="space-y-2 border-t pt-3">
                                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Chọn bảng dữ liệu cần khôi phục</Label>
                                    <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border bg-background">
                                        {Object.keys(restoreCollections).map((key) => (
                                            <div key={key} className="flex items-center gap-2">
                                                <Switch 
                                                    id={`restore-switch-${key}`}
                                                    checked={restoreCollections[key]} 
                                                    onCheckedChange={(checked) => setRestoreCollections(prev => ({
                                                        ...prev,
                                                        [key]: checked
                                                    }))} 
                                                />
                                                <Label htmlFor={`restore-switch-${key}`} className="cursor-pointer text-xs font-semibold">
                                                    {getColLabel(key)}
                                                </Label>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Warning Block */}
                                <div className="flex gap-2 p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 text-yellow-600 dark:text-yellow-400 text-xs">
                                    <AlertTriangle className="w-5 h-5 shrink-0" />
                                    <div>
                                        <p className="font-bold">CẢNH BÁO QUAN TRỌNG:</p>
                                        <p className="mt-0.5">Việc khôi phục sẽ **xóa hoàn toàn** toàn bộ dữ liệu hiện tại trong cơ sở dữ liệu của các bảng đã chọn trước khi nạp dữ liệu cũ vào. Vui lòng cân nhắc kỹ!</p>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
                                        <DialogTrigger asChild>
                                            <Button 
                                                type="button" 
                                                disabled={restoring || Object.values(restoreCollections).every(v => !v)}
                                                className="bg-red-600 hover:bg-red-700 text-white cursor-pointer w-full"
                                            >
                                                <AlertTriangle className="mr-2 h-4 w-4" /> Tiến hành khôi phục cơ sở dữ liệu
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="sm:max-w-[425px]">
                                            <DialogHeader>
                                                <DialogTitle className="flex items-center gap-2 text-red-600">
                                                    <AlertTriangle className="w-6 h-6" /> Xác nhận khôi phục?
                                                </DialogTitle>
                                                <DialogDescription className="pt-2 space-y-2 text-sm text-foreground">
                                                    <p>Hành động này **KHÔNG THỂ HOÀN TÁC**.</p>
                                                    <p>Bạn sắp xóa dữ liệu hiện tại và khôi phục lại các bảng:</p>
                                                    <div className="flex flex-wrap gap-1.5 py-1">
                                                        {Object.keys(restoreCollections).filter(k => restoreCollections[k]).map(k => (
                                                            <span key={k} className="text-xs bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-semibold px-2 py-0.5 rounded border border-red-200">
                                                                {getColLabel(k)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                    <p className="text-xs text-muted-foreground mt-2">Dữ liệu hiện có của các bảng này trên hệ thống sẽ bị xóa hoàn toàn.</p>
                                                </DialogDescription>
                                            </DialogHeader>
                                            <DialogFooter className="gap-2 sm:gap-0">
                                                <Button variant="ghost" onClick={() => setIsConfirmOpen(false)} disabled={restoring}>Hủy</Button>
                                                <Button onClick={handleRestore} disabled={restoring} className="bg-red-600 hover:bg-red-700 text-white">
                                                    {restoring ? (
                                                        <>
                                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Đang khôi phục...
                                                        </>
                                                    ) : (
                                                        "Tôi đồng ý, khôi phục ngay"
                                                    )}
                                                </Button>
                                            </DialogFooter>
                                        </DialogContent>
                                    </Dialog>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
