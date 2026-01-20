"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, BookOpen, Tags, Eye, Loader2 } from "lucide-react"
import axios from "@/setup/axios"
import { useAuth } from "@/components/providers/AuthProvider" // Assuming we have this

export default function AdminDashboard() {
  // const { token } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNovels: 0,
    totalGenres: 0,
    totalViews: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
        try {
            // axios interceptor handles token and base URL
            const res = await axios.get('/admin/stats');
            setStats(res as any) // res.data is returned by interceptor, so res IS the data
        } catch (error) {
            console.error("Failed to fetch stats", error)
        } finally {
            setLoading(false)
        }
    }

    // if (token) { // Interceptor handles checking token existence usually, but safest to wait for client hydration
        fetchStats()
    // }
  }, [])

  if (loading) {
      return (
          <div className="flex items-center justify-center h-full">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
      )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Tổng quan hệ thống quản trị.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +12% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng truyện</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNovels}</div>
            <p className="text-xs text-muted-foreground">
              +8% so với tháng trước
            </p>
          </CardContent>
        </Card>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tổng lượt xem</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{stats.totalViews}</div>
                <p className="text-xs text-muted-foreground">
                +23% so với hôm qua
                </p>
            </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Thể loại</CardTitle>
            <Tags className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGenres}</div>
            <p className="text-xs text-muted-foreground">
              Đang hoạt động
            </p>
          </CardContent>
        </Card>
      </div>
      
      {/* Placeholder for Chart or Recent Activity could go here */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
            <CardHeader>
                <CardTitle>Hoạt động gần đây</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-8">
                    {/* Mock data for visual completeness until backend supports activity log */}
                    <div className="flex items-center">
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">Nguyen Van A</p>
                            <p className="text-sm text-muted-foreground">Đã đăng truyện mới "Kiếm Lai"</p>
                        </div>
                        <div className="ml-auto font-medium">5 phút trước</div>
                    </div>
                    <div className="flex items-center">
                        <div className="ml-4 space-y-1">
                            <p className="text-sm font-medium leading-none">Tran Thi B</p>
                            <p className="text-sm text-muted-foreground">Đã đăng ký tài khoản</p>
                        </div>
                        <div className="ml-auto font-medium">15 phút trước</div>
                    </div>
                </div>
            </CardContent>
        </Card>
        <Card className="col-span-3">
             <CardHeader>
                <CardTitle>Thao tác nhanh</CardTitle>
            </CardHeader>
             <CardContent>
                <div className="space-y-4">
                    <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-md font-medium">Duyệt truyện mới</button>
                    <button className="w-full border border-input bg-transparent hover:bg-accent hover:text-accent-foreground py-2 rounded-md font-medium">Quản lý tác giả</button>
                </div>
             </CardContent>
        </Card>
      </div>
    </div>
  )
}
