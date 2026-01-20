"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getPublicNovelsService } from "@/services/novelService" 
// Note: base_url might not be exported. Using direct logic or check exports.
// Assuming getPublicNovelsService works.
import CardNovel from "@/components/cardNovel"
import { Loader2 } from "lucide-react"

interface Novel {
    _id: string
    id?: string
    title: string
    image: string
    coverImage?: string
    author: { username: string }
    genres: string[] // formatted or raw? API returns populated genres usually { name, slug }[] or ids.
    // getPublicNovels backend returns populated 'genres' ('name slug')
    // So genres is array of objects.
    // CardNovel expects format.
}

export default function GenrePage() {
    const params = useParams()
    const slug = params.slug as string
    
    const [novels, setNovels] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(false)

    useEffect(() => {
        const fetchNovels = async () => {
             setLoading(true)
             try {
                 const res = await getPublicNovelsService({ genre: slug, page, limit: 12 })
                 if (res) {
                     setNovels(res.novels)
                     setHasMore(page < res.totalPages)
                 }
             } catch (error) {
                 console.error("Failed to fetch genre novels", error)
             } finally {
                 setLoading(false)
             }
        }
        if (slug) fetchNovels()
    }, [slug, page])

    const formatGenres = (genres: any[]) => {
        if (!genres || genres.length === 0) return []
        // Backend 'genres' is populated with 'name slug'
        // So genre is { _id, name, slug }
        return genres.map(g => ({ name: g.name, url: `/genre/${g.slug}` }))
    }

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8 capitalize">Thể loại: {slug.replace(/-/g, ' ')}</h1>
            
            {loading ? (
                <div className="flex justify-center p-12">
                     <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : novels.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {novels.map(novel => (
                         <CardNovel 
                            key={novel._id}
                            novelId={novel._id}
                            coverImage={novel.image || novel.coverImage || "/ANIMENETFLIX-FA.webp"} 
                            title={novel.title} 
                            genres={formatGenres(novel.genres)}
                        />
                    ))}
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">
                    Không có truyện nào thuộc thể loại này.
                </div>
            )}
        </div>
    )
}
