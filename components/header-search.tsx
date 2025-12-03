"use client"

import * as React from "react"
import { Calculator, Calendar, CreditCard, Loader2, Search, Settings, Smile, User } from "lucide-react"

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
export function HeaderSearch() {
    const [open, setOpen] = React.useState(false)
    const [query, setQuery] = React.useState("")
    const [data, setData] = React.useState<any[]>([])
    const [isLoading, setIsLoading] = React.useState(false)
    // Dữ liệu giả
    const FAKE_DATA = [
        { id: "1", title: "Trọng sinh đô thị tu tiên", type: "Course" },
        { id: "2", title: "Địa ngục à ta hay ngủ ở đó", type: "Article" },
        { id: "3", title: "Lạng nha kỳ duyên", type: "Article" },
        { id: "4", title: "Kẻ khủng bố", type: "Course" },
        { id: "5", title: "Nhất phẩm bố y", type: "Setting" },
        { id: "6", title: "Quái vật 18", type: "Article" },
    ]

    // Hàm giả lập gọi API (delay 500ms)
    const searchAPI = async (query: string) => {
        await new Promise((resolve) => setTimeout(resolve, 500))
        if (!query) return []

        return FAKE_DATA.filter((item) =>
            item.title.toLowerCase().includes(query.toLowerCase())
        )
    }
    // Xử lý việc gọi API khi user nhập liệu (Debounce đơn giản)
    React.useEffect(() => {
        if (query.length === 0) {
            setData([])
            return
        }

        setIsLoading(true)
        const timer = setTimeout(async () => {
            const results = await searchAPI(query)
            setData(results)
            setIsLoading(false)
        }, 500) // Delay 0.5s để giả lập mạng

        return () => clearTimeout(timer)
    }, [query])

    return (
        <div className="flex items-center">
            <Popover open={open} onOpenChange={setOpen}>
                {/* Trigger: Nút bấm nhìn giống Input */}
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-[300px] justify-between text-muted-foreground"
                    >
                        <span className="truncate">
                            {query ? query : "Tìm kiếm bài viết, khóa học..."}
                        </span>
                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>

                {/* Content: Phần nhập liệu và kết quả */}
                <PopoverContent className="w-[300px] p-0" align="start">
                    <Command shouldFilter={false}> {/* QUAN TRỌNG: Tắt lọc mặc định */}
                        <CommandInput
                            placeholder="Nhập từ khóa..."
                            value={query}
                            onValueChange={setQuery}
                        />
                        <CommandList>
                            {/* Hiển thị Loading */}
                            {isLoading && (
                                <div className="flex cursor-default select-none items-center justify-center gap-2 p-4 text-sm text-muted-foreground">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Đang tìm kiếm...
                                </div>
                            )}

                            {/* Hiển thị khi không có kết quả */}
                            {!isLoading && query && data.length === 0 && (
                                <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
                            )}

                            {/* Hiển thị kết quả từ API */}
                            {!isLoading && data.length > 0 && (
                                <CommandGroup heading="Kết quả tìm kiếm">
                                    {data.map((item) => (
                                        <CommandItem
                                            key={item.id}
                                            value={item.title}
                                            onSelect={() => {
                                                console.log("Đã chọn:", item)
                                                setOpen(false)
                                            }}
                                        >
                                            {item.type === "Course" ? <Calculator className="mr-2 h-4 w-4" /> : <Smile className="mr-2 h-4 w-4" />}
                                            <span>{item.title}</span>
                                            <span className="ml-auto text-xs text-muted-foreground">{item.type}</span>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}

                            <CommandSeparator />

                            {/* Các gợi ý tĩnh (luôn hiện) */}
                            <CommandGroup heading="Truy cập nhanh">
                                <CommandItem>
                                    <User className="mr-2 h-4 w-4" />
                                    <span>Profile</span>
                                </CommandItem>
                                <CommandItem>
                                    <Settings className="mr-2 h-4 w-4" />
                                    <span>Settings</span>
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}