"use client"

import * as React from "react"
import { BookOpen, Loader2, Search, Settings, User } from "lucide-react"
import { useRouter } from "next/navigation"

import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { getPublicNovelsService } from "@/services/novelService"

interface SearchResult {
    _id: string;
    title: string;
    author?: { username: string };
    image?: string;
}

export function HeaderSearch() {
    const router = useRouter()
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [data, setData] = React.useState<SearchResult[]>([])
    const [isLoading, setIsLoading] = React.useState(false)

    // Search API call
    const searchAPI = async (searchQuery: string): Promise<SearchResult[]> => {
        if (!searchQuery || searchQuery.length < 2) return []

        try {
            const result = await getPublicNovelsService({
                search: searchQuery,
                limit: 6
            })
            return (result?.novels || []).map((novel: any) => ({ ...novel, _id: novel._id || novel.id || '' }))
        } catch (error) {
            console.error("Search error:", error)
            return []
        }
    }

    // Debounced search
    React.useEffect(() => {
        if (query.length < 2) {
            setData([])
            return
        }

        setIsLoading(true)
        const timer = setTimeout(async () => {
            const results = await searchAPI(query)
            setData(results)
            setIsLoading(false)
        }, 400)

        return () => clearTimeout(timer)
    }, [query])

    return (
        <div className="flex items-center">
            <Popover open={open} onOpenChange={setOpen}>
                {/* Trigger */}
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[300px] justify-between text-muted-foreground"
                    >
                        <span className="truncate">
                            {query ? query : "Tìm kiếm truyện..."}
                        </span>
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>

                {/* Content */}
                <PopoverContent className="w-[300px] p-0" align="start">
                    <Command shouldFilter={false}>
                        <CommandInput
                            placeholder="Nhập tên truyện..."
                            value={query}
                            onValueChange={setQuery}
                        />
                        <CommandList>
                            {/* Loading */}
                            {isLoading && (
                                <div className="flex cursor-default select-none items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang tìm kiếm...
                                </div>
                            )}

                            {/* No results */}
                            {!isLoading && query.length >= 2 && data.length === 0 && (
                                <CommandEmpty>Không tìm thấy truyện.</CommandEmpty>
                            )}

                            {/* Results */}
                            {!isLoading && data.length > 0 && (
                                <CommandGroup heading="Kết quả tìm kiếm">
                                    {data.map((novel) => (
                                        <CommandItem
                                            key={novel._id}
                                            value={novel.title}
                                            onSelect={() => {
                                                router.push(`/novel/${novel._id}`)
                                                setOpen(false)
                                                setQuery("")
                                            }}
                                            className="cursor-pointer"
                                        >
                                            <BookOpen className="mr-2 h-4 w-4 text-primary" />
                                            <div className="flex-1 truncate">
                                                <span className="font-medium">{novel.title}</span>
                                                {novel.author?.username && (
                                                    <span className="ml-2 text-xs text-muted-foreground">
                                                        - {novel.author.username}
                                                    </span>
                                                )}
                                            </div>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            <CommandSeparator />

                            {/* Quick access */}
                            <CommandGroup heading="Truy cập nhanh">
                                <CommandItem onSelect={() => { router.push('/search'); setOpen(false); }}>
                                    <Search className="mr-2 h-4 w-4" />
                                    <span>Tìm kiếm nâng cao</span>
                                </CommandItem>
                                <CommandItem onSelect={() => { router.push('/profile'); setOpen(false); }}>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Trang cá nhân</span>
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}