"use client"

import { StatCard } from "@/components/cards/StatCard"
import { BookOpen, Eye, Heart, TrendingUp, Users, FileText } from "lucide-react"

export const DashboardStats = () => {
    // Dữ liệu mẫu - sau này sẽ lấy từ API
    const stats = [
        {
            title: "Tổng truyện",
            value: 12,
            description: "+2 tháng này",
            icon: <BookOpen className="h-4 w-4" />
        },
        {
            title: "Tổng lượt xem",
            value: "45.2K",
            description: "+12.5% so với tháng trước",
            icon: <Eye className="h-4 w-4" />
        },
        {
            title: "Lượt yêu thích",
            value: "3.2K",
            description: "+8% so với tháng trước",
            icon: <Heart className="h-4 w-4" />
        },
        {
            title: "Người theo dõi",
            value: "1.5K",
            description: "+156 tuần này",
            icon: <Users className="h-4 w-4" />
        },
        {
            title: "Tổng chương",
            value: 248,
            description: "Trung bình 20.6 chương/truyện",
            icon: <FileText className="h-4 w-4" />
        },
        {
            title: "Tăng trưởng",
            value: "+15.3%",
            description: "Tỉ lệ tăng độc giả",
            icon: <TrendingUp className="h-4 w-4" />
        }
    ]

    return (
        <div className="space-y-6 p-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Thống kê</h2>
                <p className="text-muted-foreground mt-2">
                    Tổng quan về các chỉ số của bạn
                </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.map((stat, index) => (
                    <StatCard key={index} {...stat} />
                ))}
            </div>
        </div>
    )
}
