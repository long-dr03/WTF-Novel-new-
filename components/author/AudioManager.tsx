"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { cn } from "@/lib/utils"
import { useUploadThing } from "@/lib/uploadthing"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Volume2,
    Upload,
    Wand2,
    Trash2,
    Play,
    Pause,
    RefreshCw,
    CheckCircle2,
    XCircle,
    Clock,
    Loader2,
    FileAudio,
    AlertCircle,
    Music,
    Headphones,
} from "lucide-react"
import {
    getNovelAudioList,
    updateChapterAudioUrl,
    generateChapterAudio,
    deleteChapterAudio,
    batchGenerateAudio,
    getBatchStatus,
    checkTTSHealth,
    formatDuration,
    formatDurationText,
    type AudioInfo,
    type NovelAudioList,
    type BatchJobStatus,
} from "@/services/audioService"

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
    const [ttsHealthy, setTtsHealthy] = useState<boolean | null>(null)

    // Batch processing state
    const [batchMode, setBatchMode] = useState<'all' | 'range' | 'selected'>('all')
    const [fromChapter, setFromChapter] = useState(1)
    const [toChapter, setToChapter] = useState(1)
    const [selectedChapters, setSelectedChapters] = useState<string[]>([])
    const [batchJob, setBatchJob] = useState<BatchJobStatus | null>(null)
    const [isBatchProcessing, setIsBatchProcessing] = useState(false)

    // Single chapter processing
    const [processingChapter, setProcessingChapter] = useState<string | null>(null)
    const [uploadingChapter, setUploadingChapter] = useState<string | null>(null)

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

            // Set default range
            if (chapters.length > 0) {
                setToChapter(chapters.length)
            }
        } catch (error) {
            console.error('Error loading audio list:', error)
        } finally {
            setLoading(false)
        }
    }, [novelId, chapters.length])

    // Check TTS health
    useEffect(() => {
        const checkHealth = async () => {
            const healthy = await checkTTSHealth()
            setTtsHealthy(healthy)
        }
        if (isOpen) {
            checkHealth()
            loadAudioList()
        }
    }, [isOpen, loadAudioList])

    // Poll batch job status
    useEffect(() => {
        if (!batchJob || !['queued', 'processing'].includes(batchJob.status)) return

        const pollInterval = setInterval(async () => {
            const status = await getBatchStatus(batchJob.job_id)
            if (status) {
                setBatchJob(status)

                if (status.status === 'completed' || status.status === 'failed') {
                    setIsBatchProcessing(false)
                    loadAudioList() // Reload audio list
                }
            }
        }, 2000)

        return () => clearInterval(pollInterval)
    }, [batchJob, loadAudioList])

    // Get audio status for a chapter
    const getChapterAudio = (chapterId: string): AudioInfo | undefined => {
        return audioList?.chapters.find(ch => ch.chapterId === chapterId)
    }

    // Handle single chapter TTS generate
    const handleGenerateAudio = async (chapterId: string) => {
        setProcessingChapter(chapterId)
        try {
            const result = await generateChapterAudio(chapterId)
            if (result) {
                await loadAudioList()
            }
        } catch (error) {
            console.error('Error generating audio:', error)
        } finally {
            setProcessingChapter(null)
        }
    }

    // Handle audio upload
    const handleUploadClick = (chapterId: string) => {
        setUploadTargetChapter(chapterId)
        fileInputRef.current?.click()
    }

    // UploadThing hook
    const { startUpload } = useUploadThing("chapterAudio", {
        onClientUploadComplete: async (res) => {
            if (res && res[0] && uploadTargetChapter) {
                try {
                    const uploadedUrl = res[0].ufsUrl || res[0].url
                    const result = await updateChapterAudioUrl(uploadTargetChapter, uploadedUrl, 0) // Duration 0 as placeholder
                    if (result) {
                        await loadAudioList()
                    }
                } catch (error) {
                    console.error('Error updating audio URL:', error)
                } finally {
                    setUploadingChapter(null)
                    setUploadTargetChapter(null)
                    if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                    }
                }
            }
        },
        onUploadError: (error) => {
            console.error('UploadThing error:', error)
            setUploadingChapter(null)
            setUploadTargetChapter(null)
        }
    })

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file || !uploadTargetChapter) return

        setUploadingChapter(uploadTargetChapter)
        try {
            await startUpload([file])
        } catch (error) {
            console.error('Error starting upload:', error)
            setUploadingChapter(null)
            setUploadTargetChapter(null)
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

    // Handle batch generate
    const handleBatchGenerate = async () => {
        if (!novelId) return

        setIsBatchProcessing(true)
        try {
            let options: any = {}

            if (batchMode === 'range') {
                options = { fromChapter, toChapter }
            } else if (batchMode === 'selected' && selectedChapters.length > 0) {
                options = { chapterIds: selectedChapters }
            }
            // 'all' mode sends empty options

            const result = await batchGenerateAudio(novelId, options)
            if (result) {
                setBatchJob({
                    job_id: result.job_id,
                    status: 'queued',
                    total: result.total_chapters,
                    current: 0,
                    progress: 0,
                })
            } else {
                setIsBatchProcessing(false)
            }
        } catch (error) {
            console.error('Error starting batch:', error)
            setIsBatchProcessing(false)
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

    // Toggle chapter selection
    const toggleChapterSelection = (chapterId: string) => {
        setSelectedChapters(prev =>
            prev.includes(chapterId)
                ? prev.filter(id => id !== chapterId)
                : [...prev, chapterId]
        )
    }

    // Select all chapters without audio
    const selectAllWithoutAudio = () => {
        const withoutAudio = chapters
            .filter(ch => {
                const audio = getChapterAudio(ch._id || ch.id || '')
                return !audio || audio.audioStatus === 'none' || audio.audioStatus === 'failed'
            })
            .map(ch => ch._id || ch.id || '')
        setSelectedChapters(withoutAudio)
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
                        Quản lý Audio - Text to Speech
                    </DialogTitle>
                    <DialogDescription className={theme.textMuted}>
                        Upload audio thủ công hoặc tạo tự động bằng AI cho các chương truyện
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

                {/* TTS Service Status */}
                <div className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
                    ttsHealthy === null
                        ? "bg-stone-500/10 text-stone-400"
                        : ttsHealthy
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                )}>
                    {ttsHealthy === null ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : ttsHealthy ? (
                        <CheckCircle2 className="w-4 h-4" />
                    ) : (
                        <AlertCircle className="w-4 h-4" />
                    )}
                    <span>
                        TTS Service: {ttsHealthy === null ? 'Đang kiểm tra...' : ttsHealthy ? 'Hoạt động' : 'Không khả dụng'}
                    </span>
                </div>

                {/* Stats */}
                {audioList?.stats && (
                    <div className={cn(
                        "grid grid-cols-5 gap-2 p-3 rounded-lg",
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
                            <div className="text-2xl font-bold text-blue-500">
                                {audioList.stats.processing}
                            </div>
                            <div className={cn("text-xs", theme.textMuted)}>Đang xử lý</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-500">
                                {audioList.stats.failed}
                            </div>
                            <div className={cn("text-xs", theme.textMuted)}>Thất bại</div>
                        </div>
                        <div className="text-center">
                            <div className={cn("text-2xl font-bold", theme.text)}>
                                {formatDurationText(audioList.stats.totalDuration)}
                            </div>
                            <div className={cn("text-xs", theme.textMuted)}>Tổng thời gian</div>
                        </div>
                    </div>
                )}

                {/* Batch Processing Section */}
                <div className={cn(
                    "p-4 rounded-lg border",
                    theme.card, theme.border
                )}>
                    <h3 className={cn("font-medium mb-3 flex items-center gap-2", theme.text)}>
                        <Wand2 className="w-4 h-4 text-purple-500" />
                        Tạo Audio hàng loạt (AI TTS)
                    </h3>

                    <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                            <Select value={batchMode} onValueChange={(v: any) => setBatchMode(v)}>
                                <SelectTrigger className={cn("w-48", isDarkMode && "bg-stone-800 border-stone-700")}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tất cả chương chưa có audio</SelectItem>
                                    <SelectItem value="range">Theo khoảng chương</SelectItem>
                                    <SelectItem value="selected">Chọn thủ công</SelectItem>
                                </SelectContent>
                            </Select>

                            {batchMode === 'range' && (
                                <div className="flex items-center gap-2">
                                    <span className={theme.textMuted}>Từ</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={chapters.length}
                                        value={fromChapter}
                                        onChange={(e) => setFromChapter(parseInt(e.target.value) || 1)}
                                        className={cn(
                                            "w-20 h-9 px-3 rounded-md border",
                                            isDarkMode && "bg-stone-800 border-stone-700 text-stone-200"
                                        )}
                                    />
                                    <span className={theme.textMuted}>đến</span>
                                    <input
                                        type="number"
                                        min={1}
                                        max={chapters.length}
                                        value={toChapter}
                                        onChange={(e) => setToChapter(parseInt(e.target.value) || 1)}
                                        className={cn(
                                            "w-20 h-9 px-3 rounded-md border",
                                            isDarkMode && "bg-stone-800 border-stone-700 text-stone-200"
                                        )}
                                    />
                                </div>
                            )}

                            {batchMode === 'selected' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={selectAllWithoutAudio}
                                    className={isDarkMode ? "border-stone-700" : ""}
                                >
                                    Chọn tất cả chưa có audio
                                </Button>
                            )}
                        </div>

                        {batchMode === 'selected' && selectedChapters.length > 0 && (
                            <div className={cn("text-sm", theme.textMuted)}>
                                Đã chọn: {selectedChapters.length} chương
                            </div>
                        )}

                        <Button
                            onClick={handleBatchGenerate}
                            disabled={isBatchProcessing || !ttsHealthy || (batchMode === 'selected' && selectedChapters.length === 0)}
                            className="w-fit bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                            {isBatchProcessing ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang xử lý...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4 mr-2" />
                                    Bắt đầu tạo Audio
                                </>
                            )}
                        </Button>

                        {/* Batch progress */}
                        {batchJob && ['queued', 'processing'].includes(batchJob.status) && (
                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className={theme.textMuted}>
                                        {batchJob.status === 'queued' ? 'Đang chờ...' : `Đang xử lý ${batchJob.current}/${batchJob.total}`}
                                    </span>
                                    <span className={theme.text}>{batchJob.progress}%</span>
                                </div>
                                <Progress value={batchJob.progress} className="h-2" />
                            </div>
                        )}

                        {batchJob?.status === 'completed' && (
                            <div className="flex items-center gap-2 text-green-500 text-sm">
                                <CheckCircle2 className="w-4 h-4" />
                                Hoàn thành tạo audio cho {batchJob.total} chương!
                            </div>
                        )}
                    </div>
                </div>

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
                                const isProcessing = processingChapter === chapterId
                                const isUploading = uploadingChapter === chapterId
                                const isSelected = selectedChapters.includes(chapterId)

                                return (
                                    <div
                                        key={chapterId}
                                        className={cn(
                                            "flex items-center gap-4 p-3 hover:bg-stone-800/30 transition-colors",
                                            isSelected && "bg-purple-500/10"
                                        )}
                                    >
                                        {/* Checkbox for selection mode */}
                                        {batchMode === 'selected' && (
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleChapterSelection(chapterId)}
                                                className="w-4 h-4 rounded border-stone-600"
                                            />
                                        )}

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
                                                disabled={isUploading || isProcessing}
                                                title="Upload audio"
                                            >
                                                {isUploading ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Upload className="w-4 h-4" />
                                                )}
                                            </Button>

                                            {/* Generate TTS button */}
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() => handleGenerateAudio(chapterId)}
                                                disabled={isProcessing || isUploading || !ttsHealthy}
                                                title="Tạo audio bằng AI"
                                            >
                                                {isProcessing ? (
                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                ) : (
                                                    <Wand2 className="w-4 h-4" />
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
