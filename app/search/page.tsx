"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Search, Filter } from "lucide-react"
import axios from "@/setup/axios"
import Image from "next/image"
import Link from "next/link"
import { getPublicGenresService } from "@/services/novelService"

interface Novel {
    _id: string
    title: string
    image: string
    author: { username: string }
    genres: { _id: string, name: string }[]
    views: number
    isFeatured: boolean
}

interface Genre {
    _id: string
    name: string
}

export default function SearchPage() {
    const searchParams = useSearchParams()
    const router = useRouter()

    const [novels, setNovels] = useState<Novel[]>([])
    const [genres, setGenres] = useState<Genre[]>([])
    const [loading, setLoading] = useState(true)

    // Filters
    const [query, setQuery] = useState(searchParams.get('q') || '')
    const [selectedGenre, setSelectedGenre] = useState(searchParams.get('genre') || 'all')
    const [sort, setSort] = useState('newest')

    const fetchGenres = async () => {
        try {
            const res = await getPublicGenresService()
            if (res) setGenres(res)
        } catch (e) {
            console.error("Failed filters", e)
        }
    }

    const fetchNovels = async () => {
        setLoading(true)
        try {
            const params: any = {
                search: query,
                limit: 20
            }
            if (selectedGenre !== 'all') params.genre = selectedGenre

            // Call public endpoint
            const res = await axios.get('/novels', { params })
            const data: any = res;
            setNovels(data?.novels || [])
        } catch (error) {
            console.error("Search error", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        // Fetch genre list once
        // If /admin/genres is protected, we must make a public one.
        // Let's assume for now.
        fetchGenres()
    }, [])

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchNovels()
        }, 500)
        return () => clearTimeout(timer)
    }, [query, selectedGenre, sort])

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        if (selectedGenre !== 'all') params.set('genre', selectedGenre)
        router.push(`/search?${params.toString()}`)
    }

    return (
        <div className="container mx-auto py-8 min-h-screen">
            <div className="flex flex-col md:flex-row gap-4 mb-8 items-end">
                <div className="flex-1 space-y-2 w-full">
                    <label className="text-sm font-medium">Tìm kiếm</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tên truyện..."
                            className="pl-9"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                    </div>
                </div>
                <div className="w-full md:w-[200px] space-y-2">
                    <label className="text-sm font-medium">Thể loại</label>
                    <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                        <SelectTrigger>
                            <SelectValue placeholder="Tất cả" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Tất cả</SelectItem>
                            {genres.map(g => (
                                <SelectItem key={g._id} value={g._id}>{g.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-full md:w-[200px] space-y-2">
                    <label className="text-sm font-medium">Sắp xếp</label>
                    <Select value={sort} onValueChange={setSort}>
                        <SelectTrigger>
                            <SelectValue placeholder="Mới nhất" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="newest">Mới nhất</SelectItem>
                            <SelectItem value="views">Lượt xem</SelectItem>
                            <SelectItem value="featured">Nổi bật</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <Button onClick={handleSearch} className="mb-[2px]">Lọc</Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : novels?.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {novels.map(novel => (
                        <Link href={`/reader/${novel._id}`} key={novel._id} className="group">
                            <Card className="overflow-hidden border-none bg-transparent shadow-none hover:scale-[1.02] transition-transform">
                                <div className="relative aspect-[2/3] rounded-lg overflow-hidden bg-muted mb-3">
                                    <Image
                                        src={novel.image}
                                        alt={novel.title}
                                        fill
                                        className="object-cover group-hover:brightness-110 transition-all"
                                    />
                                    {novel.isFeatured && (
                                        <div className="absolute top-2 left-2 bg-yellow-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                                            Nổi bật
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <h3 className="font-semibold leading-tight group-hover:text-primary truncate" title={novel.title}>{novel.title}</h3>
                                    <p className="text-xs text-muted-foreground">{novel.author?.username}</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {novel.genres?.slice(0, 2).map(g => (
                                            <span key={g._id} className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">
                                                {g.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    Không tìm thấy truyện nào phù hợp.
                </div>
            )}
        </div>
    )
}
