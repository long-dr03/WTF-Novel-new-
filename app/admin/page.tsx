"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Tags, Eye, Loader2, Activity, MousePointerClick } from "lucide-react"
import axios from "@/setup/axios"

interface DailyRow {
  date: string
  reads: number
  visits: number
  adClicks: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNovels: 0,
    totalGenres: 0,
    totalViews: 0,
    realViews: 0
  })
  const [analytics, setAnalytics] = useState<{
    totals: { reads: number; visits: number; adClicks: number }
    daily: DailyRow[]
  }>({ totals: { reads: 0, visits: 0, adClicks: 0 }, daily: [] })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [statsRes, analyticsRes] = await Promise.all([
          axios.get('/admin/stats'),
          axios.get('/admin/analytics', { params: { days: 14 } }),
        ])
        setStats(statsRes as any)
        // analytics đi qua ApiResponse => { success, data }
        const a: any = analyticsRes
        if (a?.data) setAnalytics(a.data)
        else if (a?.totals) setAnalytics(a)
      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  const fmt = (n: number) => (n ?? 0).toLocaleString('vi-VN')
  // Giá trị lớn nhất trong chuỗi ngày để vẽ thanh tỉ lệ
  const maxDaily = Math.max(
    1,
    ...analytics.daily.map((d) => Math.max(d.reads, d.visits, d.adClicks))
  )

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-sm sm:text-base text-muted-foreground">Tổng quan hệ thống quản trị.</p>
      </div>

      {/* Hàng 1: các chỉ số hệ thống */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(stats.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">Đang hoạt động</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng truyện</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(stats.totalNovels)}</div>
            <p className="text-xs text-muted-foreground">Đang hoạt động</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lượt xem truyện (Info)</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(stats.totalViews)}</div>
            <p className="text-xs text-muted-foreground">Lượt xem chi tiết truyện</p>
          </CardContent>
        </Card>
        <Card className="border-green-500/20 bg-green-500/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold text-green-700 dark:text-green-400">Lượt xem thật (Chương)</CardTitle>
            <Eye className="h-4 w-4 text-green-600 dark:text-green-400 animate-pulse" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-green-700 dark:text-green-400">{fmt(stats.realViews)}</div>
            <p className="text-xs text-green-600/80 dark:text-green-400/80 font-medium">Tổng lượt đọc chương thực tế</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thể loại</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmt(stats.totalGenres)}</div>
            <p className="text-xs text-muted-foreground">Đang hoạt động</p>
          </CardContent>
        </Card>
      </div>

      {/* Hàng 2: analytics theo user đã đăng nhập */}
      <div>
        <h3 className="text-lg font-semibold mb-1">Thống kê người dùng (đã đăng nhập)</h3>
        <p className="text-xs text-muted-foreground mb-4">Chỉ ghi nhận hoạt động của tài khoản đã đăng nhập.</p>
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-blue-500/20 bg-blue-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-blue-700 dark:text-blue-400">Tổng lượt đọc</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-blue-700 dark:text-blue-400">{fmt(analytics.totals.reads)}</div>
              <p className="text-xs text-blue-600/80 dark:text-blue-400/80 font-medium">Lượt đọc chương theo user</p>
            </CardContent>
          </Card>
          <Card className="border-violet-500/20 bg-violet-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-violet-700 dark:text-violet-400">Tổng lượt truy cập</CardTitle>
              <Activity className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-violet-700 dark:text-violet-400">{fmt(analytics.totals.visits)}</div>
              <p className="text-xs text-violet-600/80 dark:text-violet-400/80 font-medium">Phiên truy cập của user</p>
            </CardContent>
          </Card>
          <Card className="border-amber-500/20 bg-amber-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-amber-700 dark:text-amber-400">Tổng click quảng cáo</CardTitle>
              <MousePointerClick className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-black text-amber-700 dark:text-amber-400">{fmt(analytics.totals.adClicks)}</div>
              <p className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium">Lượt mở khóa quảng cáo</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Hàng 3: bảng theo ngày (14 ngày gần nhất) */}
      <Card>
        <CardHeader>
          <CardTitle>Thống kê theo ngày (14 ngày gần nhất)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Ngày</th>
                  <th className="py-2 px-4 font-medium text-right">Lượt đọc</th>
                  <th className="py-2 px-4 font-medium text-right">Truy cập</th>
                  <th className="py-2 pl-4 font-medium text-right">Click QC</th>
                </tr>
              </thead>
              <tbody>
                {analytics.daily.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-muted-foreground">
                      Chưa có dữ liệu.
                    </td>
                  </tr>
                ) : (
                  [...analytics.daily].reverse().map((d) => (
                    <tr key={d.date} className="border-b last:border-0 hover:bg-muted/40">
                      <td className="py-2 pr-4 font-medium whitespace-nowrap">{d.date}</td>
                      <td className="py-2 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="tabular-nums">{fmt(d.reads)}</span>
                          <span className="hidden sm:block h-1.5 rounded-full bg-blue-500/60" style={{ width: `${(d.reads / maxDaily) * 60}px` }} />
                        </div>
                      </td>
                      <td className="py-2 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="tabular-nums">{fmt(d.visits)}</span>
                          <span className="hidden sm:block h-1.5 rounded-full bg-violet-500/60" style={{ width: `${(d.visits / maxDaily) * 60}px` }} />
                        </div>
                      </td>
                      <td className="py-2 pl-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="tabular-nums">{fmt(d.adClicks)}</span>
                          <span className="hidden sm:block h-1.5 rounded-full bg-amber-500/60" style={{ width: `${(d.adClicks / maxDaily) * 60}px` }} />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
