"use client"

import React, { useEffect, useState } from "react"
import { StatCard } from "@/components/cards/StatCard"
import { Card } from "@/components/ui/card"
import { BookOpen, Eye, Heart, TrendingUp, FileText, Loader2 } from "lucide-react"
import { getAuthorStatsService } from "@/services/novelService"

export const DashboardStats = () => {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await getAuthorStatsService()
                if (res) {
                    setData(res)
                }
            } catch (e) {
                console.error("Failed to fetch author stats:", e)
            } finally {
                setLoading(false)
            }
        }
        fetchStats()
    }, [])

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    const summary = data?.summary || {
        totalNovels: 0,
        totalViews: 0,
        totalChapters: 0,
        totalWords: 0,
        totalLikes: 0,
        averageChaptersPerNovel: 0,
        growthRate: "0%"
    }

    const stats = [
        {
            title: "Tổng truyện",
            value: summary.totalNovels,
            description: "Số tác phẩm của bạn",
            icon: <BookOpen className="h-4 w-4 text-violet-500" />
        },
        {
            title: "Tổng lượt xem",
            value: summary.totalViews.toLocaleString(),
            description: `Tăng trưởng ${summary.growthRate}`,
            icon: <Eye className="h-4 w-4 text-emerald-500" />
        },
        {
            title: "Lượt yêu thích",
            value: summary.totalLikes.toLocaleString(),
            description: "Số người yêu thích truyện",
            icon: <Heart className="h-4 w-4 text-rose-500" />
        },
        {
            title: "Tổng chương",
            value: summary.totalChapters,
            description: `Trung bình ${summary.averageChaptersPerNovel} chương/truyện`,
            icon: <FileText className="h-4 w-4 text-blue-500" />
        },
        {
            title: "Tổng số từ",
            value: summary.totalWords.toLocaleString(),
            description: "Số lượng từ đã viết",
            icon: <TrendingUp className="h-4 w-4 text-amber-500" />
        }
    ]

    // SVG Chart configuration
    const trend = data?.trend || []
    const width = 600
    const height = 250
    const paddingLeft = 50
    const paddingRight = 20
    const paddingTop = 30
    const paddingBottom = 40
    
    const chartWidth = width - paddingLeft - paddingRight
    const chartHeight = height - paddingTop - paddingBottom
    
    const maxViews = Math.max(...trend.map((t: any) => t.views), 10)
    
    // Generate points
    const points = trend.map((t: any, idx: number) => {
        const x = paddingLeft + (idx * (chartWidth / (trend.length - 1 || 1)))
        const y = paddingTop + chartHeight - (t.views / maxViews) * chartHeight
        return { x, y, label: t.label, views: t.views }
    })
    
    // Create Line Path
    const linePath = points.reduce((path: string, p: any, idx: number) => {
        return path + `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    }, '')
    
    // Create Fill Path (area under the line)
    const fillPath = points.length > 0 
        ? `${linePath} L ${points[points.length - 1].x} ${paddingTop + chartHeight} L ${points[0].x} ${paddingTop + chartHeight} Z`
        : ''

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

            {/* SVG Trend Chart */}
            <Card className="p-6 border-zinc-200 dark:border-zinc-800 bg-card text-card-foreground shadow-sm">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="text-lg font-semibold">Xu hướng lượt xem</h3>
                        <p className="text-sm text-muted-foreground">Thống kê 7 ngày gần nhất</p>
                    </div>
                </div>
                <div className="relative w-full overflow-x-auto">
                    <div className="min-w-[600px] relative">
                        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                            <defs>
                                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="oklch(0.68 0.17 12)" stopOpacity="0.4" />
                                    <stop offset="100%" stopColor="oklch(0.68 0.17 12)" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            
                            {/* Grid Lines */}
                            {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                                const y = paddingTop + chartHeight * ratio
                                const val = Math.round(maxViews * (1 - ratio))
                                return (
                                    <g key={idx}>
                                        <line 
                                            x1={paddingLeft} 
                                            y1={y} 
                                            x2={width - paddingRight} 
                                            y2={y} 
                                            className="stroke-zinc-100 dark:stroke-zinc-800/40" 
                                            strokeDasharray="4 4" 
                                        />
                                        <text 
                                            x={paddingLeft - 10} 
                                            y={y + 4} 
                                            className="text-[10px] fill-muted-foreground/75 font-medium text-right"
                                            textAnchor="end"
                                        >
                                            {val >= 1000 ? `${(val/1000).toFixed(1)}k` : val}
                                        </text>
                                    </g>
                                )
                            })}
                            
                            {/* Filled Area */}
                            {fillPath && (
                                <path d={fillPath} fill="url(#chartGrad)" />
                            )}
                            
                            {/* Main Line */}
                            {linePath && (
                                <path 
                                    d={linePath} 
                                    fill="none" 
                                    stroke="oklch(0.68 0.17 12)" 
                                    strokeWidth="3" 
                                    strokeLinecap="round" 
                                    strokeLinejoin="round"
                                />
                            )}
                            
                            {/* Points / Circles */}
                            {points.map((p: any, idx: number) => (
                                <g key={idx}>
                                    <circle 
                                        cx={p.x} 
                                        cy={p.y} 
                                        r="5" 
                                        className="fill-white dark:fill-zinc-950 stroke-primary stroke-2 cursor-pointer transition-all hover:r-7"
                                        stroke="oklch(0.68 0.17 12)"
                                        onMouseEnter={() => setHoveredPoint(idx)}
                                        onMouseLeave={() => setHoveredPoint(null)}
                                    />
                                    <text 
                                        x={p.x} 
                                        y={paddingTop + chartHeight + 20} 
                                        className="text-xs fill-muted-foreground/80 font-medium"
                                        textAnchor="middle"
                                    >
                                        {p.label}
                                    </text>
                                </g>
                            ))}
                        </svg>
                        
                        {/* Interactive Tooltip */}
                        {hoveredPoint !== null && points[hoveredPoint] && (
                            <div 
                                className="absolute bg-popover text-popover-foreground border border-border rounded-lg p-2 shadow-xl text-xs z-10 pointer-events-none transition-all duration-150"
                                style={{ 
                                    left: `${points[hoveredPoint].x + 10}px`, 
                                    top: `${points[hoveredPoint].y - 40}px` 
                                }}
                            >
                                <p className="font-semibold text-muted-foreground">{points[hoveredPoint].label}</p>
                                <p className="font-bold text-primary">{points[hoveredPoint].views.toLocaleString()} lượt xem</p>
                            </div>
                        )}
                    </div>
                </div>
            </Card>
        </div>
    )
}
