import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Music, Trash2, Play, Pause, Plus, UploadCloud, CheckCircle2, XCircle } from "lucide-react"
import { useUploadThing } from "@/lib/uploadthing"
import { getMyMusic, createMusicMetadata, deleteMusic, type Music as MusicType } from "@/services/musicService"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface BackgroundMusicManagerProps {
    isOpen: boolean
    onClose: () => void
    isDarkMode?: boolean
}

export function BackgroundMusicContent({ 
    className,
    onPlayRequest 
}: { 
    className?: string
    onPlayRequest?: (url: string) => void
}) {
    const [musics, setMusics] = useState<MusicType[]>([])
    const [loading, setLoading] = useState(false)
    const [playingId, setPlayingId] = useState<string | null>(null)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadProgress, setUploadProgress] = useState(0)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const fileInputRef = useRef<HTMLInputElement | null>(null)

    const { startUpload, isUploading: uploadThingUploading } = useUploadThing("backgroundMusic", {
        onUploadProgress: (progress) => {
            setUploadProgress(progress)
        },
        onClientUploadComplete: async (res) => {
            if (res && res[0]) {
                try {
                    await createMusicMetadata({
                        name: res[0].name,
                        url: res[0].url,
                        duration: 0,
                        type: 'author'
                    })
                    await loadMusic()
                    toast.success("Tải nhạc thành công!", {
                        description: `${res[0].name} đã được thêm vào thư viện.`,
                        icon: <CheckCircle2 className="w-4 h-4" />
                    })
                } catch (e) {
                    console.error("Failed to save metadata", e)
                    toast.error("Lỗi lưu metadata", {
                        description: "File đã upload nhưng không thể lưu thông tin.",
                        icon: <XCircle className="w-4 h-4" />
                    })
                }
            }
            setIsUploading(false)
            setUploadProgress(0)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        },
        onUploadError: (error) => {
            console.error("Upload error:", error)
            toast.error("Lỗi tải file!", {
                description: error.message || "Vui lòng thử lại.",
                icon: <XCircle className="w-4 h-4" />
            })
            setIsUploading(false)
            setUploadProgress(0)
            if (fileInputRef.current) {
                fileInputRef.current.value = ''
            }
        },
    })

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) return

        setIsUploading(true)
        toast.loading("Đang tải nhạc lên...", {
            description: `${files[0].name}`,
            id: 'upload-toast'
        })

        try {
            await startUpload(Array.from(files))
            toast.dismiss('upload-toast')
        } catch (err) {
            toast.dismiss('upload-toast')
            console.error("Upload failed:", err)
        }
    }

    const theme = {
        bg: "bg-background",
        border: "border-border",
        text: "text-foreground",
        muted: "text-muted-foreground",
        hover: "hover:bg-accent",
    }

    const loadMusic = async () => {
        setLoading(true)
        try {
            const res = await getMyMusic()
            console.log("loadMusic response:", res)
            if (res) {
                 // Check if data is directly in res, in res.data, or even res.data.data
                 let list: MusicType[] = [];
                 if (Array.isArray(res)) {
                    list = res;
                 } else if (res.data && Array.isArray(res.data)) {
                    list = res.data;
                 } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
                    list = res.data.data;
                 }
                 
                 console.log("Parsed music list:", list)
                 setMusics(list)
            }
        } catch (error) {
            console.error("Failed to load music", error)
            toast.error("Lỗi tải danh sách nhạc")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadMusic()
    }, [])

    const handleDelete = async (id: string) => {
        if (!confirm("Bạn có chắc muốn xóa bài nhạc này?")) return
        try {
            await deleteMusic(id)
            setMusics(prev => prev.filter(m => m._id !== id))
        } catch (error) {
            console.error("Failed to delete music", error)
        }
    }

    const handlePlay = (music: MusicType) => {
        if (onPlayRequest) {
            onPlayRequest(music.url)
            return
        }

        if (playingId === music._id) {
            audioRef.current?.pause()
            setPlayingId(null)
        } else {
            if (audioRef.current) {
                audioRef.current.src = music.url
                audioRef.current.play()
                setPlayingId(music._id)
            }
        }
    }

    return (
        <div className={cn("flex flex-col h-full", className)}>
            <div className="flex justify-between items-center py-4 border-b">
                <div>
                    <h3 className="font-medium text-lg">Kho nhạc của bạn</h3>
                    <p className="text-sm text-muted-foreground">Quản lý nhạc nền cho các tác phẩm</p>
                </div>
                <div className="flex flex-col gap-2">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        multiple
                        className="hidden"
                        onChange={handleFileSelect}
                        disabled={isUploading}
                    />
                    <Button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="gap-2"
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Đang tải... {Math.round(uploadProgress)}%
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-4 h-4" />
                                Tải nhạc lên
                            </>
                        )}
                    </Button>
                    {isUploading && (
                        <div className="w-full bg-secondary rounded-full h-1.5 overflow-hidden">
                            <div 
                                className="bg-primary h-full transition-all duration-300 ease-out"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 min-h-[300px]">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                ) : musics.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                        <Music className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>Chưa có bài nhạc nào.</p>
                        <p className="text-sm">Tải lên nhạc nền để sử dụng cho truyện của bạn.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {musics.map((music) => (
                            <div 
                                key={music._id} 
                                className={cn(
                                    "flex items-center justify-between p-3 rounded-lg border transition-all group hover:shadow-md", 
                                    theme.bg, theme.border,
                                    playingId === music._id ? "ring-2 ring-primary border-transparent" : ""
                                )}
                            >
                                <div className="flex items-center gap-3 overflow-hidden flex-1">
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        className={cn("h-10 w-10 shrink-0 rounded-full", playingId === music._id && "bg-primary text-primary-foreground hover:bg-primary/90")}
                                        onClick={() => handlePlay(music)}
                                    >
                                        {playingId === music._id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                    </Button>
                                    <div className="truncate flex-1 min-w-0">
                                        <p className="font-medium truncate text-sm" title={music.name}>{music.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                             {new Date(music.createdAt || Date.now()).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => handleDelete(music._id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
            
            <audio ref={audioRef} onEnded={() => setPlayingId(null)} className="hidden" />
        </div>
    )
}

export function BackgroundMusicManager({ isOpen, onClose, isDarkMode = false }: BackgroundMusicManagerProps) {
    const theme = {
        bg: isDarkMode ? "bg-stone-900" : "bg-white",
        border: isDarkMode ? "border-stone-700" : "border-stone-200",
        text: isDarkMode ? "text-stone-200" : "text-stone-800",
        muted: isDarkMode ? "text-stone-400" : "text-stone-500",
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className={cn("max-w-3xl h-[80vh] flex flex-col", theme.bg, theme.border, theme.text)}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Music className="w-5 h-5" />
                        Quản lý Nhạc nền
                    </DialogTitle>
                    <DialogDescription className={theme.muted}>
                        Tải lên và quản lý nhạc nền cho các tác phẩm của bạn.
                    </DialogDescription>
                </DialogHeader>
                <BackgroundMusicContent />
            </DialogContent>
        </Dialog>
    )
}
