"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2, Search, Filter, Check, ChevronsUpDown, X } from "lucide-react"
import axios from "@/setup/axios"
import Image from "next/image"
import Link from "next/link"
import { getPublicGenresService } from "@/services/novelService"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

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
    // Parse initial genres from URL (comma separated)
    const initialGenres = searchParams.get('genre') ? searchParams.get('genre')!.split(',') : []
    const [selectedGenres, setSelectedGenres] = useState<string[]>(initialGenres)
    const [sort, setSort] = useState('newest')
    
    const [openGenre, setOpenGenre] = useState(false)

    const fetchGenres = async () => {
        try {
            const res = await getPublicGenresService()
            if (res) setGenres(res as Genre[])
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
            if (selectedGenres.length > 0) {
                params.genre = selectedGenres.join(',')
            }

            // Call public endpoint
            const res = await axios.get('/novels', { params })
            const data: any = res;
            setNovels(data?.novels || [])
            // Note: backend response structure: { novels: [], total... } or just [] depending on endpoint?
            // getPublicNovels returns { novels, total, page, pages }
            // client code was: setNovels(data?.novels || []) -> Correct.
        } catch (error) {
            console.error("Search error", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchGenres()
    }, [])

    useEffect(() => {
        // Debounce search
        const timer = setTimeout(() => {
            fetchNovels()
        }, 500)
        return () => clearTimeout(timer)
    }, [query, selectedGenres, sort])

    const handleSearch = () => {
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        if (selectedGenres.length > 0) params.set('genre', selectedGenres.join(','))
        router.push(`/search?${params.toString()}`)
    }

    const toggleGenre = (genreId: string) => {
        setSelectedGenres(prev => 
            prev.includes(genreId) ? prev.filter(id => id !== genreId) : [...prev, genreId]
        )
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
                <div className="w-full md:w-[300px] space-y-2">
                    <label className="text-sm font-medium">Thể loại</label>
                    <Popover open={openGenre} onOpenChange={setOpenGenre}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openGenre}
                                className="w-full justify-between"
                            >
                                {selectedGenres.length > 0
                                    ? `${selectedGenres.length} thể loại`
                                    : "Chọn thể loại"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[300px] p-0">
                            <Command>
                                <CommandInput placeholder="Tìm thể loại..." />
                                <CommandList>
                                    <CommandEmpty>Không tìm thấy.</CommandEmpty>
                                    <CommandGroup>
                                        {genres.map((genre) => (
                                            <CommandItem
                                                key={genre._id}
                                                value={genre.name}
                                                onSelect={() => toggleGenre(genre._id)}
                                            >
                                                <Check
                                                    className={cn(
                                                        "mr-2 h-4 w-4",
                                                        selectedGenres.includes(genre._id) ? "opacity-100" : "opacity-0"
                                                    )}
                                                />
                                                {genre.name}
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
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
            
            {/* Selected Genres Badges */}
            {selectedGenres.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                    {selectedGenres.map(id => {
                        const g = genres.find(item => item._id === id);
                        return g ? (
                            <Badge key={id} variant="secondary" className="pl-2 pr-1 h-7">
                                {g.name}
                                <button 
                                    className="ml-1 hover:bg-muted rounded-full p-0.5"
                                    onClick={() => toggleGenre(id)}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </Badge>
                        ) : null;
                    })}
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedGenres([])}>
                        Xóa hết
                    </Button>
                </div>
            )}

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
                                        src={novel.image ? novel.image : "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                                        alt={novel.title || "Novel Image"}
                                        fill
                                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
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
