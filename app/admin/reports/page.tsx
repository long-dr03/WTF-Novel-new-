"use client"

import { useState, useEffect } from "react"
import { getReportsService, updateReportStatusService } from "@/services/novelService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Flag, CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface Report {
    _id: string
    reporter?: {
        _id: string
        username: string
        email?: string
    }
    novel?: {
        _id: string
        title: string
    }
    chapter?: {
        _id: string
        chapterNumber: number
        title: string
    }
    reason: string
    description: string
    status: 'pending' | 'resolved' | 'dismissed'
    createdAt: string
    updatedAt: string
}

export default function ReportsPage() {
    const [reports, setReports] = useState<Report[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState<string>("pending")

    const fetchReports = async () => {
        setLoading(true)
        try {
            const res = await getReportsService()
            if (res) {
                setReports(res as Report[])
            }
        } catch (e) {
            console.error("Failed to fetch reports:", e)
            toast.error("Không thể tải danh sách báo cáo")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchReports()
    }, [])

    const handleUpdateStatus = async (id: string, newStatus: 'resolved' | 'dismissed') => {
        try {
            const res = await updateReportStatusService(id, newStatus)
            if (res) {
                toast.success(newStatus === 'resolved' ? "Đã duyệt báo cáo vi phạm" : "Đã bỏ qua báo cáo")
                // Cập nhật state nội bộ
                setReports(prev => prev.map(rep => rep._id === id ? { ...rep, status: newStatus } : rep))
            } else {
                toast.error("Không thể cập nhật trạng thái báo cáo")
            }
        } catch (e) {
            toast.error("Có lỗi xảy ra")
        }
    }

    // Lọc báo cáo theo tab hiện tại
    const filteredReports = reports.filter(r => r.status === activeTab)

    const getReasonBadge = (reason: string) => {
        switch (reason) {
            case "Vi phạm bản quyền / Đạo văn":
                return <Badge className="bg-red-500/10 text-red-500 border-red-500/20" variant="outline">{reason}</Badge>
            case "Truyện chứa nội dung nhạy cảm":
                return <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20" variant="outline">{reason}</Badge>
            case "Bản dịch lỗi / Văn phong kém":
            case "Lỗi dịch thuật":
                return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20" variant="outline">{reason}</Badge>
            default:
                return <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20" variant="outline">{reason}</Badge>
        }
    }

    return (
        <div className="space-y-6 p-4 sm:p-6">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Báo cáo vi phạm</h2>
                <p className="text-sm sm:text-base text-muted-foreground mt-1">Quản lý và giải quyết các báo cáo vi phạm, lỗi chương từ người đọc.</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-3">
                    <TabsTrigger value="pending" className="relative">
                        Chờ duyệt
                        {reports.filter(r => r.status === 'pending').length > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                                {reports.filter(r => r.status === 'pending').length}
                            </span>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="resolved">Đã duyệt</TabsTrigger>
                    <TabsTrigger value="dismissed">Đã bỏ qua</TabsTrigger>
                </TabsList>

                {loading ? (
                    <div className="flex justify-center items-center py-12">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : filteredReports.length === 0 ? (
                    <Card className="mt-6">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-4">
                                <Flag className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-medium">Không có báo cáo nào</h3>
                            <p className="text-sm text-muted-foreground max-w-sm mt-1">
                                Danh sách trống. Chưa có phản hồi/báo cáo nào thuộc danh mục này.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <Card className="mt-6 dark:bg-zinc-900/40 dark:border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-lg font-medium flex items-center gap-2">
                                <Flag className="w-5 h-5 text-red-500" />
                                Danh sách báo cáo ({filteredReports.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 overflow-hidden">
                            <Table className="min-w-[800px]">
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent dark:border-zinc-800">
                                        <TableHead className="w-[120px]">Người gửi</TableHead>
                                        <TableHead className="w-[180px]">Mục tiêu báo cáo</TableHead>
                                        <TableHead className="w-[180px]">Loại lỗi</TableHead>
                                        <TableHead>Mô tả chi tiết</TableHead>
                                        <TableHead className="w-[100px]">Ngày gửi</TableHead>
                                        {activeTab === 'pending' && <TableHead className="w-[160px] text-right">Thao tác</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredReports.map((report) => (
                                        <TableRow key={report._id} className="dark:border-zinc-800 hover:bg-muted/50">
                                            <TableCell className="font-medium">
                                                {report.reporter?.username || "Ẩn danh"}
                                            </TableCell>
                                            <TableCell>
                                                {report.novel ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        <Link 
                                                            href={`/novel/${report.novel._id}`} 
                                                            target="_blank" 
                                                            className="text-primary hover:underline font-semibold flex items-center gap-1 text-xs"
                                                        >
                                                            {report.novel.title}
                                                            <ExternalLink className="w-3 h-3 inline" />
                                                        </Link>
                                                        {report.chapter && (
                                                            <Link 
                                                                href={`/novel/${report.novel._id}/chapter/${report.chapter.chapterNumber}`} 
                                                                target="_blank" 
                                                                className="text-muted-foreground hover:underline text-[10px]"
                                                            >
                                                                Chương {report.chapter.chapterNumber}: {report.chapter.title}
                                                            </Link>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">Không xác định</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {getReasonBadge(report.reason)}
                                            </TableCell>
                                            <TableCell className="max-w-[300px]">
                                                <p className="text-xs whitespace-pre-wrap leading-relaxed">
                                                    {report.description}
                                                </p>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(report.createdAt).toLocaleDateString('vi-VN')}
                                            </TableCell>
                                            {activeTab === 'pending' && (
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button 
                                                            size="icon" 
                                                            variant="ghost" 
                                                            className="h-8 w-8 text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10"
                                                            onClick={() => handleUpdateStatus(report._id, 'resolved')}
                                                            title="Duyệt / Xử lý xong"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            size="icon" 
                                                            variant="ghost" 
                                                            className="h-8 w-8 text-zinc-500 hover:text-zinc-400 hover:bg-zinc-500/10"
                                                            onClick={() => handleUpdateStatus(report._id, 'dismissed')}
                                                            title="Bỏ qua"
                                                        >
                                                            <XCircle className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                )}
            </Tabs>
        </div>
    )
}
