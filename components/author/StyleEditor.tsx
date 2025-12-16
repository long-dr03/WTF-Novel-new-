"use client"

import { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Wand2,
    Loader2,
    Check,
    X,
    AlertTriangle,
    RefreshCw,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    XCircle,
    Clock,
    Zap,
    StopCircle,
    Save,
} from 'lucide-react';
import { 
    adjustStyleService, 
    batchAdjustStyleService,
    StyleMode, 
    BatchStyleAdjustResult,
    BatchConfig,
    requestBatchStop,
    resetBatchStop 
} from '@/services/styleService';

interface Chapter {
    _id?: string;
    id?: string;
    chapterNumber: number;
    title: string;
    content?: string;
    contentJson?: any;
}

interface StyleEditorProps {
    isOpen: boolean;
    onClose: () => void;
    isDark: boolean;
    // Single chapter mode
    currentContent?: string;
    onApply?: (adjustedContent: string) => void;
    // Batch mode
    chapters?: Chapter[];
    novelId?: string;
    onBatchComplete?: (results: BatchStyleAdjustResult[]) => void;
    getChapterContent?: (novelId: string, chapterNumber: number) => Promise<any>;
}

export default function StyleEditor({
    isOpen,
    onClose,
    isDark,
    currentContent,
    onApply,
    chapters = [],
    novelId,
    onBatchComplete,
    getChapterContent,
}: StyleEditorProps) {
    // Mode: single hoặc batch
    const [mode, setMode] = useState<'single' | 'batch'>('single');
    const [styleMode, setStyleMode] = useState<StyleMode>('moderate');
    
    // Single mode state
    const [isProcessing, setIsProcessing] = useState(false);
    const [originalContent, setOriginalContent] = useState('');
    const [adjustedContent, setAdjustedContent] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [showComparison, setShowComparison] = useState(false);

    // Batch mode state
    const [selectedChapters, setSelectedChapters] = useState<number[]>([]);
    const [batchResults, setBatchResults] = useState<BatchStyleAdjustResult[]>([]);
    const [isBatchProcessing, setIsBatchProcessing] = useState(false);
    const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0, phase: 0, totalPhases: 0 });
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [rateLimitWait, setRateLimitWait] = useState(0);
    const [phaseWait, setPhaseWait] = useState(0);
    const [reviewIndex, setReviewIndex] = useState(0);
    const [batchStopped, setBatchStopped] = useState(false);
    const [stopReason, setStopReason] = useState<string>('');
    const [stopOnError, setStopOnError] = useState(true);
    
    // Batch config
    const [chaptersPerPhase, setChaptersPerPhase] = useState(3);

    // Theme
    const theme = {
        bg: isDark ? 'bg-stone-900' : 'bg-white',
        text: isDark ? 'text-stone-200' : 'text-stone-800',
        textMuted: isDark ? 'text-stone-400' : 'text-stone-500',
        border: isDark ? 'border-stone-700' : 'border-stone-300',
        cardBg: isDark ? 'bg-stone-800' : 'bg-stone-50',
        highlight: isDark ? 'bg-purple-500/20' : 'bg-purple-100',
    };

    // Reset state khi mở dialog
    const handleOpenChange = (open: boolean) => {
        if (!open) {
            onClose();
            // Reset state
            setAdjustedContent('');
            setError(null);
            setShowComparison(false);
            setBatchResults([]);
            setSelectedChapters([]);
            setIsBatchProcessing(false);
            setIsRateLimited(false);
            setRateLimitWait(0);
            setPhaseWait(0);
            setBatchStopped(false);
            setStopReason('');
            resetBatchStop();
        }
    };

    // Yêu cầu dừng batch process
    const handleStopBatch = () => {
        requestBatchStop();
        setBatchStopped(true);
        setStopReason('Đang dừng...');
    };

    // Điều chỉnh single chapter
    const handleAdjustSingle = async () => {
        if (!currentContent) return;

        setIsProcessing(true);
        setError(null);
        setOriginalContent(currentContent);

        try {
            const result = await adjustStyleService(currentContent, styleMode);

            if (result.success && result.adjusted) {
                setAdjustedContent(result.adjusted);
                setShowComparison(true);
            } else {
                setError(result.error || 'Có lỗi xảy ra');
                if (result.isRateLimit) {
                    setIsRateLimited(true);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Có lỗi xảy ra');
        } finally {
            setIsProcessing(false);
        }
    };

    // Áp dụng nội dung đã điều chỉnh
    const handleApply = () => {
        if (adjustedContent && onApply) {
            onApply(adjustedContent);
            handleOpenChange(false);
        }
    };

    // Toggle chọn chương cho batch
    const toggleChapterSelection = (chapterNum: number) => {
        setSelectedChapters(prev => 
            prev.includes(chapterNum) 
                ? prev.filter(n => n !== chapterNum)
                : [...prev, chapterNum].sort((a, b) => a - b)
        );
    };

    // Chọn tất cả chương
    const selectAllChapters = () => {
        setSelectedChapters(chapters.map(c => c.chapterNumber));
    };

    // Bỏ chọn tất cả
    const deselectAllChapters = () => {
        setSelectedChapters([]);
    };

    // Xử lý batch
    const handleBatchProcess = async () => {
        if (!novelId || !getChapterContent || selectedChapters.length === 0) return;

        setIsBatchProcessing(true);
        setIsRateLimited(false);
        setRateLimitWait(0);
        setPhaseWait(0);
        setBatchResults([]);
        setBatchStopped(false);
        setStopReason('');
        resetBatchStop();
        setBatchProgress({ current: 0, total: selectedChapters.length, phase: 0, totalPhases: Math.ceil(selectedChapters.length / chaptersPerPhase) });

        // Load nội dung các chương được chọn
        const chaptersToProcess: Array<{
            chapterNumber: number;
            chapterTitle: string;
            content: string;
        }> = [];

        for (const chapterNum of selectedChapters) {
            const chapter = chapters.find(c => c.chapterNumber === chapterNum);
            if (chapter) {
                try {
                    const chapterData = await getChapterContent(novelId, chapterNum);
                    if (chapterData?.content) {
                        chaptersToProcess.push({
                            chapterNumber: chapterNum,
                            chapterTitle: chapter.title || `Chương ${chapterNum}`,
                            content: chapterData.content,
                        });
                    }
                } catch (err) {
                    console.error(`Error loading chapter ${chapterNum}:`, err);
                }
            }
        }

        // Cấu hình batch
        const config: Partial<BatchConfig> = {
            chaptersPerPhase: chaptersPerPhase,
            delayBetweenRequests: 5000,  // 5 giây giữa mỗi request
            delayBetweenPhases: 30000,   // 30 giây giữa mỗi phase
            maxRetries: 2,
            stopOnError: stopOnError,
        };

        // Xử lý batch với callbacks mới
        const results = await batchAdjustStyleService(
            chaptersToProcess,
            styleMode,
            // onProgress
            (result, index, total, phase, totalPhases) => {
                setBatchProgress({ current: index + 1, total, phase, totalPhases });
                setBatchResults(prev => {
                    const existing = prev.findIndex(r => r.chapterNumber === result.chapterNumber);
                    if (existing >= 0) {
                        const updated = [...prev];
                        updated[existing] = result;
                        return updated;
                    }
                    return [...prev, result];
                });
            },
            // onRateLimit
            (waitTime) => {
                setIsRateLimited(true);
                setRateLimitWait(waitTime);
                // Countdown
                const interval = setInterval(() => {
                    setRateLimitWait(prev => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            setIsRateLimited(false);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            },
            // onPhaseComplete
            (phase, totalPhases, nextPhaseIn) => {
                setPhaseWait(nextPhaseIn);
                // Countdown
                const interval = setInterval(() => {
                    setPhaseWait(prev => {
                        if (prev <= 1) {
                            clearInterval(interval);
                            return 0;
                        }
                        return prev - 1;
                    });
                }, 1000);
            },
            config,
            // onStopped
            (stoppedResults, reason) => {
                setBatchStopped(true);
                setStopReason(reason);
                console.log('Batch stopped:', reason, 'Results:', stoppedResults.length);
            }
        );

        setIsBatchProcessing(false);
        
        if (onBatchComplete) {
            onBatchComplete(results.filter(r => r.status === 'completed'));
        }
    };

    // Review navigation
    const completedResults = batchResults.filter(r => r.status === 'completed');
    const currentReview = completedResults[reviewIndex];

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className={cn(
                "max-w-5xl max-h-[90vh] overflow-hidden flex flex-col",
                theme.bg, theme.text
            )}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-purple-500" />
                        Điều chỉnh văn phong AI
                    </DialogTitle>
                    <DialogDescription className={theme.textMuted}>
                        Sử dụng AI để điều chỉnh văn phong truyện dịch cho phù hợp với cách đọc của người Việt
                    </DialogDescription>
                </DialogHeader>

                {/* Mode Tabs */}
                <div className="flex gap-2 mb-4">
                    <Button
                        variant={mode === 'single' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMode('single')}
                        disabled={isBatchProcessing}
                    >
                        Chỉnh sửa đơn lẻ
                    </Button>
                    <Button
                        variant={mode === 'batch' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setMode('batch')}
                        disabled={isProcessing || chapters.length === 0}
                    >
                        Chỉnh sửa hàng loạt ({chapters.length} chương)
                    </Button>
                </div>

                {/* Style Mode Selector */}
                <div className="flex items-center gap-4 mb-4">
                    <label className={cn("text-sm font-medium", theme.text)}>
                        Mức độ điều chỉnh:
                    </label>
                    <Select value={styleMode} onValueChange={(v) => setStyleMode(v as StyleMode)}>
                        <SelectTrigger className={cn("w-48", theme.border)}>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="light">
                                <span className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-green-500" />
                                    Nhẹ nhàng
                                </span>
                            </SelectItem>
                            <SelectItem value="moderate">
                                <span className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-yellow-500" />
                                    Vừa phải
                                </span>
                            </SelectItem>
                            <SelectItem value="aggressive">
                                <span className="flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-red-500" />
                                    Mạnh mẽ
                                </span>
                            </SelectItem>
                        </SelectContent>
                    </Select>
                    <span className={cn("text-xs", theme.textMuted)}>
                        {styleMode === 'light' && 'Chỉ sửa lỗi ngữ pháp rõ ràng'}
                        {styleMode === 'moderate' && 'Cân bằng giữa giữ nguyên và chỉnh sửa'}
                        {styleMode === 'aggressive' && 'Viết lại câu để đọc mượt hơn'}
                    </span>
                </div>

                {/* Rate Limit Warning */}
                {isRateLimited && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 mb-4">
                        <AlertTriangle className="h-5 w-5" />
                        <span>Đã đạt giới hạn API. Đang đợi {rateLimitWait}s...</span>
                    </div>
                )}

                {/* Phase Wait Info */}
                {phaseWait > 0 && !isRateLimited && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 mb-4">
                        <Clock className="h-5 w-5" />
                        <span>Đợi {phaseWait}s trước khi xử lý phase tiếp theo...</span>
                    </div>
                )}

                {/* Batch Stopped Warning */}
                {batchStopped && stopReason && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/20 text-orange-600 dark:text-orange-400 mb-4">
                        <StopCircle className="h-5 w-5" />
                        <span>{stopReason}</span>
                    </div>
                )}

                {/* Single Mode Content */}
                {mode === 'single' && (
                    <div className="flex-1 overflow-auto">
                        {!showComparison ? (
                            <div className="space-y-4">
                                <div className={cn(
                                    "p-4 rounded-lg border min-h-[200px] max-h-[400px] overflow-auto",
                                    theme.cardBg, theme.border
                                )}>
                                    <h4 className="text-sm font-medium mb-2">Nội dung hiện tại:</h4>
                                    <div 
                                        className="prose prose-sm max-w-none"
                                        dangerouslySetInnerHTML={{ __html: currentContent || '<p class="text-muted">Không có nội dung</p>' }}
                                    />
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/20 text-red-600 dark:text-red-400">
                                        <XCircle className="h-5 w-5" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <Button 
                                    onClick={handleAdjustSingle}
                                    disabled={isProcessing || !currentContent}
                                    className="w-full"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                            Đang xử lý...
                                        </>
                                    ) : (
                                        <>
                                            <Wand2 className="h-4 w-4 mr-2" />
                                            Điều chỉnh văn phong
                                        </>
                                    )}
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Original */}
                                    <div className={cn(
                                        "p-4 rounded-lg border max-h-[350px] overflow-auto",
                                        theme.cardBg, theme.border
                                    )}>
                                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-stone-500" />
                                            Bản gốc
                                        </h4>
                                        <div 
                                            className="prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: originalContent }}
                                        />
                                    </div>

                                    {/* Adjusted */}
                                    <div className={cn(
                                        "p-4 rounded-lg border max-h-[350px] overflow-auto",
                                        theme.highlight, theme.border
                                    )}>
                                        <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                                            <span className="h-2 w-2 rounded-full bg-purple-500" />
                                            Đã điều chỉnh
                                        </h4>
                                        <div 
                                            className="prose prose-sm max-w-none"
                                            dangerouslySetInnerHTML={{ __html: adjustedContent }}
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-end">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => {
                                            setShowComparison(false);
                                            setAdjustedContent('');
                                        }}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Thử lại
                                    </Button>
                                    <Button onClick={handleApply}>
                                        <Check className="h-4 w-4 mr-2" />
                                        Áp dụng thay đổi
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Batch Mode Content */}
                {mode === 'batch' && (
                    <div className="flex-1 overflow-auto space-y-4">
                        {!isBatchProcessing && batchResults.length === 0 ? (
                            <>
                                {/* Chapter Selection */}
                                <div className="flex items-center justify-between">
                                    <span className={cn("text-sm", theme.textMuted)}>
                                        Đã chọn {selectedChapters.length}/{chapters.length} chương
                                    </span>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" onClick={selectAllChapters}>
                                            Chọn tất cả
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={deselectAllChapters}>
                                            Bỏ chọn
                                        </Button>
                                    </div>
                                </div>

                                <div className={cn(
                                    "grid grid-cols-4 gap-2 max-h-[300px] overflow-auto p-2 rounded-lg border",
                                    theme.border
                                )}>
                                    {chapters.map(chapter => (
                                        <button
                                            key={chapter.chapterNumber}
                                            onClick={() => toggleChapterSelection(chapter.chapterNumber)}
                                            className={cn(
                                                "p-2 rounded-lg text-left text-sm transition-all",
                                                selectedChapters.includes(chapter.chapterNumber)
                                                    ? "bg-purple-500/30 border-purple-500"
                                                    : theme.cardBg,
                                                "border hover:border-purple-400"
                                            )}
                                        >
                                            <div className="font-medium">Chương {chapter.chapterNumber}</div>
                                            <div className={cn("text-xs truncate", theme.textMuted)}>
                                                {chapter.title || 'Không tiêu đề'}
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {/* Phase Config */}
                                <div className="flex items-center gap-4 p-3 rounded-lg border bg-stone-100 dark:bg-stone-800">
                                    <label className={cn("text-sm font-medium whitespace-nowrap", theme.text)}>
                                        Số chương mỗi phase:
                                    </label>
                                    <Select value={String(chaptersPerPhase)} onValueChange={(v) => setChaptersPerPhase(Number(v))}>
                                        <SelectTrigger className={cn("w-24", theme.border)}>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="1">1</SelectItem>
                                            <SelectItem value="2">2</SelectItem>
                                            <SelectItem value="3">3</SelectItem>
                                            <SelectItem value="5">5</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <span className={cn("text-xs", theme.textMuted)}>
                                        ({Math.ceil(selectedChapters.length / chaptersPerPhase)} phases, ~{Math.ceil(selectedChapters.length / chaptersPerPhase) * 0.5} phút)
                                    </span>
                                </div>

                                {/* Stop on Error Option */}
                                <div className="flex items-center gap-4 p-3 rounded-lg border bg-stone-100 dark:bg-stone-800">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={stopOnError}
                                            onChange={(e) => setStopOnError(e.target.checked)}
                                            className="w-4 h-4 rounded border-stone-300 text-purple-500 focus:ring-purple-500"
                                        />
                                        <span className={cn("text-sm font-medium", theme.text)}>
                                            Dừng khi gặp lỗi/rate limit
                                        </span>
                                    </label>
                                    <span className={cn("text-xs", theme.textMuted)}>
                                        (Cho phép lưu các chương đã xử lý xong khi gặp lỗi)
                                    </span>
                                </div>

                                <Button 
                                    onClick={handleBatchProcess}
                                    disabled={selectedChapters.length === 0}
                                    className="w-full"
                                >
                                    <Zap className="h-4 w-4 mr-2" />
                                    Bắt đầu điều chỉnh {selectedChapters.length} chương ({Math.ceil(selectedChapters.length / chaptersPerPhase)} phases)
                                </Button>
                            </>
                        ) : isBatchProcessing ? (
                            /* Processing View */
                            <div className="space-y-4">
                                <div className="text-center py-6">
                                    <Loader2 className="h-12 w-12 mx-auto mb-4 animate-spin text-purple-500" />
                                    <h3 className="text-lg font-medium mb-2">
                                        Phase {batchProgress.phase}/{batchProgress.totalPhases} - Chương {batchProgress.current}/{batchProgress.total}
                                    </h3>
                                    <p className={theme.textMuted}>
                                        {isRateLimited 
                                            ? `Đang đợi rate limit... (${rateLimitWait}s)`
                                            : phaseWait > 0 
                                                ? `Đợi ${phaseWait}s trước phase tiếp theo...`
                                                : 'Đang xử lý...'}
                                    </p>
                                    
                                    {/* Progress bar */}
                                    <div className="mt-4 w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2">
                                        <div 
                                            className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
                                        />
                                    </div>

                                    {/* Stop Button */}
                                    <div className="mt-4">
                                        <Button 
                                            variant="destructive" 
                                            onClick={handleStopBatch}
                                            disabled={batchStopped}
                                            className="gap-2"
                                        >
                                            <StopCircle className="h-4 w-4" />
                                            {batchStopped ? 'Đang dừng...' : 'Dừng và lưu kết quả'}
                                        </Button>
                                        <p className={cn("text-xs mt-2", theme.textMuted)}>
                                            {completedResults.length > 0 
                                                ? `Đã hoàn thành ${completedResults.length} chương - có thể lưu khi dừng`
                                                : 'Chưa có chương nào hoàn thành'}
                                        </p>
                                    </div>
                                </div>

                                {/* Progress List */}
                                <div className={cn(
                                    "max-h-[200px] overflow-auto rounded-lg border p-2",
                                    theme.border
                                )}>
                                    {batchResults.map(result => (
                                        <div 
                                            key={result.chapterNumber}
                                            className={cn(
                                                "flex items-center gap-2 p-2 rounded text-sm",
                                                result.status === 'completed' && "text-green-600",
                                                result.status === 'processing' && "text-yellow-600",
                                                result.status === 'error' && "text-red-600",
                                                result.status === 'rate-limited' && "text-orange-600",
                                                result.status === 'waiting' && "text-blue-600"
                                            )}
                                        >
                                            {result.status === 'completed' && <CheckCircle2 className="h-4 w-4 flex-shrink-0" />}
                                            {result.status === 'processing' && <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />}
                                            {result.status === 'error' && <XCircle className="h-4 w-4 flex-shrink-0" />}
                                            {result.status === 'rate-limited' && <AlertTriangle className="h-4 w-4 flex-shrink-0" />}
                                            {result.status === 'waiting' && <Clock className="h-4 w-4 flex-shrink-0" />}
                                            <span className="truncate">Chương {result.chapterNumber}: {result.chapterTitle}</span>
                                            {result.error && <span className="text-xs ml-auto">- {result.error}</span>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            /* Review View */
                            <div className="space-y-4">
                                {/* Status Summary */}
                                {batchStopped && stopReason && (
                                    <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/20 text-orange-600 dark:text-orange-400">
                                        <StopCircle className="h-5 w-5 flex-shrink-0" />
                                        <div>
                                            <span className="font-medium">Đã dừng: </span>
                                            <span>{stopReason}</span>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-center justify-between">
                                    <h3 className="font-medium">
                                        Xem lại kết quả ({completedResults.length} chương đã hoàn thành
                                        {batchResults.filter(r => r.status === 'error').length > 0 && 
                                            `, ${batchResults.filter(r => r.status === 'error').length} lỗi`}
                                        {batchStopped && `, ${selectedChapters.length - batchProgress.current} chương chưa xử lý`})
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
                                            disabled={reviewIndex === 0}
                                        >
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className={cn("text-sm", theme.textMuted)}>
                                            {completedResults.length > 0 ? `${reviewIndex + 1} / ${completedResults.length}` : '0 / 0'}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setReviewIndex(Math.min(completedResults.length - 1, reviewIndex + 1))}
                                            disabled={reviewIndex >= completedResults.length - 1}
                                        >
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {currentReview && (
                                    <>
                                        <div className="text-sm font-medium">
                                            Chương {currentReview.chapterNumber}: {currentReview.chapterTitle}
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className={cn(
                                                "p-4 rounded-lg border max-h-[300px] overflow-auto",
                                                theme.cardBg, theme.border
                                            )}>
                                                <h4 className="text-sm font-medium mb-2">Bản gốc</h4>
                                                <div 
                                                    className="prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: currentReview.original }}
                                                />
                                            </div>
                                            <div className={cn(
                                                "p-4 rounded-lg border max-h-[300px] overflow-auto",
                                                theme.highlight, theme.border
                                            )}>
                                                <h4 className="text-sm font-medium mb-2">Đã điều chỉnh</h4>
                                                <div 
                                                    className="prose prose-sm max-w-none"
                                                    dangerouslySetInnerHTML={{ __html: currentReview.adjusted }}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-2 justify-between">
                                    <Button 
                                        variant="outline" 
                                        onClick={() => {
                                            setBatchResults([]);
                                            setSelectedChapters([]);
                                            setBatchStopped(false);
                                            setStopReason('');
                                            resetBatchStop();
                                        }}
                                    >
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Chỉnh sửa lại
                                    </Button>
                                    <div className="flex gap-2">
                                        {completedResults.length > 0 && (
                                            <Button 
                                                variant="secondary"
                                                onClick={() => {
                                                    if (onBatchComplete) {
                                                        onBatchComplete(completedResults);
                                                    }
                                                    handleOpenChange(false);
                                                }}
                                            >
                                                <Save className="h-4 w-4 mr-2" />
                                                Lưu {completedResults.length} chương đã xong
                                            </Button>
                                        )}
                                        {!batchStopped && (
                                            <Button 
                                                onClick={() => {
                                                    if (onBatchComplete) {
                                                        onBatchComplete(completedResults);
                                                    }
                                                    handleOpenChange(false);
                                                }}
                                            >
                                                <Check className="h-4 w-4 mr-2" />
                                                Hoàn tất ({completedResults.length} chương)
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
