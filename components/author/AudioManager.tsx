"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Upload,
    Trash2,
    Play,
    Pause,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    FileAudio,
    Headphones,
} from "lucide-react"
import {
    getNovelAudioList,
    updateChapterAudioUrl,
    deleteChapterAudio,
    uploadChapterAudioToR2,
    formatDuration,
    formatDurationText,
    type AudioInfo,
    type NovelAudioList,
} from "@/services/audioService"
import { toast } from "sonner"

// Giới hạn kích thước file audio khi upload lên Cloudflare R2
const MAX_AUDIO_MB = 200

interface Chapter {
    _id?: string;
    id?: string;
    chapterNumber: number;
    title: string;
    content?: string;
    wordCount?: number;
    status?: string;
}

interface AudioManagerProps {
    novelId: string;
    chapters: Chapter[];
    isDarkMode?: boolean;
    onClose?: () => void;
    isOpen: boolean;
}

const AudioManager = ({ novelId, chapters, isDarkMode = true, onClose, isOpen }: AudioManagerProps) => {
    const [audioList, setAudioList] = useState<NovelAudioList | null>(null)
    const [loading, setLoading] = useState(false)

    // Single chapter processing
    const [uploadingChapter, setUploadingChapter] = useState<string | null>(null)
    const [uploadProgress, setUploadProgress] = useState(0)

    // Audio player
    const [playingAudio, setPlayingAudio] = useState<string | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // File input ref
    const fileInputRef = useRef<HTMLInputElement>(null)
    const [uploadTargetChapter, setUploadTargetChapter] = useState<string | null>(null)

    // Theme
    const theme = {
        bg: isDarkMode ? "bg-stone-900" : "bg-white",
        card: isDarkMode ? "bg-stone-800/50" : "bg-stone-50",
        border: isDarkMode ? "border-stone-700" : "border-stone-200",
        text: isDarkMode ? "text-stone-200" : "text-stone-800",
        textMuted: isDarkMode ? "text-stone-400" : "text-stone-500",
    }

    // Load audio list
    const loadAudioList = useCallback(async () => {
        if (!novelId) return
        setLoading(true)
        try {
            const data = await getNovelAudioList(novelId)
            setAudioList(data)
        } catch (error) {
            console.error('Error loading audio list:', error)
        } finally {
            setLoading(false)
        }
    }, [novelId])

    useEffect(() => {
        if (isOpen) {
            loadAudioList()
        }
    }, [isOpen, loadAudioList])

    // Handle audio upload
    const handleUploadClick = (chapterId: string) => {
        setUploadTargetChapter(chapterId)
        fileInputRef.current?.click()
    }

    // Upload audio lên Cloudflare R2 (presigned PUT trực tiếp, không qua server)
    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !uploadTargetChapter) return

        const chapterId = uploadTargetChapter

        // Kiểm tra kích thước phía client để báo lỗi rõ ràng thay vì thất bại âm thầm
        if (file.size > MAX_AUDIO_MB * 1024 * 1024) {
            toast.error(`File quá lớn (${(file.size / 1024 / 1024).toFixed(1)}MB). Tối đa ${MAX_AUDIO_MB}MB.`)
            setUploadTargetChapter(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }
        if (!file.type.startsWith('audio/')) {
            toast.error('Vui lòng chọn đúng file audio (mp3, m4a, wav...).')
            setUploadTargetChapter(null)
            if (fileInputRef.current) fileInputRef.current.value = ''
            return
        }

        setUploadingChapter(chapterId)
        setUploadProgress(0)
        try {
            const publicUrl = await uploadChapterAudioToR2(file, (p) => setUploadProgress(p))
            if (!publicUrl) {
                toast.error('Tải audio lên thất bại. Vui lòng thử lại.')
                return
            }
            const result = await updateChapterAudioUrl(chapterId, publicUrl, 0)
            if (result) {
                await loadAudioList()
                toast.success('Tải audio lên thành công!')
            } else {
                toast.error('Đã tải lên nhưng không lưu được vào chương. Vui lòng thử lại.')
            }
        } catch (error: any) {
            console.error('Error uploading audio:', error)
            toast.error(`Tải audio thất bại: ${error?.message || 'Lỗi không xác định'}`)
        } finally {
            setUploadingChapter(null)
            setUploadTargetChapter(null)
            setUploadProgress(0)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    // Handle delete audio
    const handleDeleteAudio = async (chapterId: string) => {
        if (!confirm('Bạn có chắc muốn xóa audio này?')) return

        try {
            const success = await deleteChapterAudio(chapterId)
            if (success) {
                await loadAudioList()
            }
        } catch (error) {
            console.error('Error deleting audio:', error)
        }
    }

    // Handle play/pause audio
    const handlePlayAudio = async (audioUrl: string) => {
        if (playingAudio === audioUrl) {
            audioRef.current?.pause();
            setPlayingAudio(null);
        } else {
            if (audioRef.current) {
                const fullUrl = audioUrl.startsWith('http')
                    ? audioUrl
                    : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${audioUrl}`;

                try {
                    audioRef.current.pause(); // Stop any current playback first
                    audioRef.current.src = fullUrl;
                    await audioRef.current.play();
                    setPlayingAudio(audioUrl);
                } catch (error: any) {
                    // Ignore AbortError - happens when play() is interrupted
                    if (error.name !== 'AbortError') {
                        console.error('Audio playback error:', error);
                    }
                }
            }
        }
    }

    // Get status icon
    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle2 className="w-4 h-4 text-green-500" />
            case 'processing':
                return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-500" />
            default:
                return <Clock className="w-4 h-4 text-stone-400" />
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose?.()}>
            <DialogContent className={cn(
                "max-w-4xl max-h-[90vh] overflow-hidden flex flex-col",
                theme.bg, theme.border
            )}>
                <DialogHeader>
                    <DialogTitle className={cn("flex items-center gap-2", theme.text)}>
                        <Headphones className="w-5 h-5 text-purple-500" />
                        Quản lý Audio
                    </DialogTitle>
                    <DialogDescription className={theme.textMuted}>
                        Upload audio thủ công cho các chương truyện
                    </DialogDescription>
                </DialogHeader>

                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    accept="audio/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                {/* Hidden audio element */}
                <audio
                    ref={audioRef}
                    onEnded={() => setPlayingAudio(null)}
                />

                {/* Stats */}
                {audioList?.stats && (
                    <div className={cn(
                        "grid grid-cols-3 gap-2 p-3 rounded-lg",
                        theme.card
                    )}>
                        <div className="text-center">
                            <div className={cn("text-2xl font-bold", theme.text)}>
                                {audioList.stats.total}
                            </div>
                            <div className={cn("text-xs", theme.textMuted)}>Tổng chương</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-500">
                                {audioList.stats.withAudio}
                            </div>
                            <div className={cn("text-xs", theme.textMuted)}>Có audio</div>
                        </div>
                        <div className="text-center">
                            <div className={cn("text-2xl font-bold", theme.text)}>
                                {formatDurationText(audioList.stats.totalDuration)}
                            </div>
                            <div className={cn("text-xs", theme.textMuted)}>Tổng thời gian</div>
                        </div>
                    </div>
                )}

                {/* Chapter List */}
                <div className={cn(
                    "flex-1 overflow-y-auto rounded-lg border",
                    theme.border
                )}>
                    <div className="divide-y divide-stone-700/50">
                        {loading ? (
                            <div className="p-8 text-center">
                                <Loader2 className={cn("w-8 h-8 mx-auto animate-spin", theme.textMuted)} />
                                <p className={cn("mt-2", theme.textMuted)}>Đang tải...</p>
                            </div>
                        ) : chapters.length === 0 ? (
                            <div className="p-8 text-center">
                                <FileAudio className={cn("w-12 h-12 mx-auto mb-3", theme.textMuted)} />
                                <p className={theme.textMuted}>Chưa có chương nào</p>
                            </div>
                        ) : (
                            chapters.map((chapter) => {
                                const chapterId = chapter._id || chapter.id || ''
                                const audio = audioList?.chapters.find(a =>
                                    a.chapterNumber === chapter.chapterNumber
                                )
                                const isUploading = uploadingChapter === chapterId

                                return (
                                    <div
                                        key={chapterId}
                                        className="flex items-center gap-4 p-3 hover:bg-stone-800/30 transition-colors"
                                    >
                                        {/* Chapter info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={cn(
                                                    "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium",
                                                    isDarkMode ? "bg-stone-700" : "bg-stone-200"
                                                )}>
                                                    {chapter.chapterNumber}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <p className={cn("font-medium truncate", theme.text)}>
                                                        {chapter.title || `Chương ${chapter.chapterNumber}`}
                                                    </p>
                                                    <p className={cn("text-xs", theme.textMuted)}>
                                                        {chapter.wordCount ? `${chapter.wordCount} từ` : 'Chưa có nội dung'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Audio status */}
                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(audio?.audioStatus || 'none')}
                                            <span className={cn("text-sm w-16", theme.textMuted)}>
                                                {formatDuration(audio?.audioDuration || null)}
                                            </span>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1">
                                            {/* Play button if has audio */}
                                            {audio?.audioStatus === 'completed' && audio.audioUrl && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => handlePlayAudio(audio.audioUrl!)}
                                                    title="Nghe thử"
                                                >
                                                    {playingAudio === audio.audioUrl ? (
                                                        <Pause className="w-4 h-4 text-green-500" />
                                                    ) : (
                                                        <Play className="w-4 h-4" />
                                                    )}
                                                </Button>
                                            )}

                                            {/* Upload button */}
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => handleUploadClick(chapterId)}
                                                disabled={isUploading}
                                                title="Upload audio"
                                            >
                                                {isUploading ? (
                                                    uploadProgress > 0 && uploadProgress < 100 ? (
                                                        <span className="text-[10px] font-bold tabular-nums">{uploadProgress}%</span>
                                                    ) : (
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                    )
                                                ) : (
                                                    <Upload className="w-4 h-4" />
                                                )}
                                            </Button>

                                            {/* Delete button if has audio */}
                                            {audio?.audioStatus === 'completed' && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon-sm"
                                                    onClick={() => handleDeleteAudio(chapterId)}
                                                    title="Xóa audio"
                                                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-2 pt-2">
                    <Button
                        variant="outline"
                        onClick={() => loadAudioList()}
                        disabled={loading}
                        className={isDarkMode ? "border-stone-700" : ""}
                    >
                        <RefreshCw className={cn("w-4 h-4 mr-2", loading && "animate-spin")} />
                        Làm mới
                    </Button>
                    <Button variant="outline" onClick={onClose} className={isDarkMode ? "border-stone-700" : ""}>
                        Đóng
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}

export default AudioManager
