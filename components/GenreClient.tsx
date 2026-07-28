"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { getPublicNovelsService } from "@/services/novelService" 
import CardNovel from "@/components/cardNovel"
import { Loader2 } from "lucide-react"

export default function GenreClient() {
    const params = useParams()
    const slug = (params.slug as string) || ""
    
    const [novels, setNovels] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)

    useEffect(() => {
        const fetchNovels = async () => {
             setLoading(true)
             try {
                 const res = await getPublicNovelsService({ genre: slug, page, limit: 12 })
                 if (res) {
                     setNovels(res.novels)
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
        return genres.map(g => ({ name: typeof g === 'string' ? g : g.name, url: `/genre/${typeof g === 'string' ? g : g.slug}` }))
    }

    const genreTitleName = slug ? slug.replace(/-/g, ' ') : "Tất cả"

    return (
        <div className="container mx-auto py-8 px-4">
            <h1 className="text-3xl font-bold mb-8 capitalize">Thể loại: {genreTitleName}</h1>
            
            {loading ? (
                <div className="flex justify-center p-12">
                     <Loader2 className="w-8 h-8 animate-spin" />
                </div>
            ) : novels.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {novels.map(novel => (
                         <CardNovel 
                            key={novel._id}
                            novelId={novel.slug || novel._id}
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
