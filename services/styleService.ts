// Service để gọi Gemini API điều chỉnh văn phong

export type StyleMode = 'light' | 'moderate' | 'aggressive';

export interface StyleAdjustResult {
    success: boolean;
    original?: string;
    adjusted?: string;
    error?: string;
    isRateLimit?: boolean;
    retryAfter?: number; // Thời gian chờ (giây) trước khi retry
}

export interface BatchStyleAdjustResult {
    chapterNumber: number;
    chapterTitle: string;
    original: string;
    adjusted: string;
    status: 'pending' | 'processing' | 'completed' | 'error' | 'rate-limited' | 'waiting' | 'stopped';
    error?: string;
}

export interface BatchConfig {
    chaptersPerPhase: number;      // Số chương mỗi phase (mặc định 3)
    delayBetweenRequests: number;  // Delay giữa các request trong phase (ms)
    delayBetweenPhases: number;    // Delay giữa các phase (ms)
    maxRetries: number;            // Số lần retry khi gặp lỗi
    stopOnError?: boolean;         // Dừng khi gặp lỗi
}

const DEFAULT_BATCH_CONFIG: BatchConfig = {
    chaptersPerPhase: 3,           // 3 chương mỗi phase
    delayBetweenRequests: 5000,    // 5 giây giữa mỗi request
    delayBetweenPhases: 30000,     // 30 giây giữa mỗi phase
    maxRetries: 2,                 // Retry 2 lần
    stopOnError: false,            // Mặc định không dừng khi lỗi
};

// Controller để dừng batch process
let batchStopRequested = false;

export const requestBatchStop = () => {
    batchStopRequested = true;
};

export const resetBatchStop = () => {
    batchStopRequested = false;
};

export const isBatchStopRequested = () => batchStopRequested;

/**
 * Điều chỉnh văn phong cho một đoạn nội dung với retry
 */
export const adjustStyleService = async (
    content: string,
    mode: StyleMode = 'moderate',
    retryCount: number = 0,
    maxRetries: number = 2
): Promise<StyleAdjustResult> => {
    try {
        const response = await fetch('/api/groq', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ content, mode }),
        });

        const data = await response.json();

        if (!response.ok) {
            // Nếu rate limit và còn retry
            if (data.isRateLimit && retryCount < maxRetries) {
                const retryAfter = data.retryAfter || 30;
                console.log(`Rate limited, waiting ${retryAfter}s before retry ${retryCount + 1}/${maxRetries}`);
                await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
                return adjustStyleService(content, mode, retryCount + 1, maxRetries);
            }

            return {
                success: false,
                error: data.error || 'Có lỗi xảy ra',
                isRateLimit: data.isRateLimit || false,
                retryAfter: data.retryAfter,
            };
        }

        return {
            success: true,
            original: data.data.original,
            adjusted: data.data.adjusted,
        };
    } catch (error: any) {
        console.error('Error adjusting style:', error);
        return {
            success: false,
            error: error.message || 'Không thể kết nối đến server',
        };
    }
};

/**
 * Điều chỉnh văn phong hàng loạt theo từng phase
 */
export const batchAdjustStyleService = async (
    chapters: Array<{
        chapterNumber: number;
        chapterTitle: string;
        content: string;
    }>,
    mode: StyleMode,
    onProgress: (result: BatchStyleAdjustResult, index: number, total: number, phase: number, totalPhases: number) => void,
    onRateLimit: (waitTime: number) => void,
    onPhaseComplete: (phase: number, totalPhases: number, nextPhaseIn: number) => void,
    config: Partial<BatchConfig> = {},
    onStopped?: (results: BatchStyleAdjustResult[], reason: string) => void
): Promise<BatchStyleAdjustResult[]> => {
    const finalConfig = { ...DEFAULT_BATCH_CONFIG, ...config };
    const results: BatchStyleAdjustResult[] = [];

    // Reset stop flag
    resetBatchStop();

    // Chia chapters thành các phase
    const totalPhases = Math.ceil(chapters.length / finalConfig.chaptersPerPhase);

    for (let phase = 0; phase < totalPhases; phase++) {
        // Kiểm tra nếu đã yêu cầu dừng
        if (batchStopRequested) {
            console.log('🛑 Batch process stopped by user');
            if (onStopped) {
                onStopped(results, 'Đã dừng theo yêu cầu');
            }
            return results;
        }

        const startIdx = phase * finalConfig.chaptersPerPhase;
        const endIdx = Math.min(startIdx + finalConfig.chaptersPerPhase, chapters.length);
        const phaseChapters = chapters.slice(startIdx, endIdx);

        console.log(`📚 Phase ${phase + 1}/${totalPhases}: Processing chapters ${startIdx + 1} to ${endIdx}`);

        for (let i = 0; i < phaseChapters.length; i++) {
            // Kiểm tra nếu đã yêu cầu dừng
            if (batchStopRequested) {
                console.log('🛑 Batch process stopped by user');
                if (onStopped) {
                    onStopped(results, 'Đã dừng theo yêu cầu');
                }
                return results;
            }

            const globalIndex = startIdx + i;
            const chapter = phaseChapters[i];

            // Báo trạng thái đang xử lý
            const processingResult: BatchStyleAdjustResult = {
                chapterNumber: chapter.chapterNumber,
                chapterTitle: chapter.chapterTitle,
                original: chapter.content,
                adjusted: '',
                status: 'processing',
            };
            onProgress(processingResult, globalIndex, chapters.length, phase + 1, totalPhases);

            try {
                const result = await adjustStyleService(
                    chapter.content,
                    mode,
                    0,
                    finalConfig.maxRetries
                );

                if (result.isRateLimit) {
                    // Gặp rate limit sau khi đã retry - dừng nếu config yêu cầu
                    const waitTime = result.retryAfter || 60;
                    const rateLimitResult: BatchStyleAdjustResult = {
                        ...processingResult,
                        status: 'rate-limited',
                        error: `Đã đạt giới hạn API. Đợi ${waitTime}s...`,
                    };
                    results.push(rateLimitResult);
                    onProgress(rateLimitResult, globalIndex, chapters.length, phase + 1, totalPhases);
                    onRateLimit(waitTime);

                    // Nếu config yêu cầu dừng khi lỗi, cho phép dừng và lưu kết quả
                    if (finalConfig.stopOnError) {
                        console.log('🛑 Stopping batch due to rate limit (stopOnError=true)');
                        if (onStopped) {
                            onStopped(results, `Đã đạt giới hạn API tại chương ${chapter.chapterNumber}`);
                        }
                        return results;
                    }

                    // Đợi và tiếp tục
                    await new Promise(resolve => setTimeout(resolve, waitTime * 1000));

                    // Kiểm tra nếu đã yêu cầu dừng trong thời gian đợi
                    if (batchStopRequested) {
                        console.log('🛑 Batch process stopped by user during rate limit wait');
                        if (onStopped) {
                            onStopped(results, 'Đã dừng theo yêu cầu trong thời gian đợi');
                        }
                        return results;
                    }

                    // Retry chapter này
                    const retryResult = await adjustStyleService(chapter.content, mode, 0, 1);
                    if (retryResult.success && retryResult.adjusted) {
                        const completedResult: BatchStyleAdjustResult = {
                            chapterNumber: chapter.chapterNumber,
                            chapterTitle: chapter.chapterTitle,
                            original: retryResult.original || chapter.content,
                            adjusted: retryResult.adjusted,
                            status: 'completed',
                        };
                        // Cập nhật result
                        results[results.length - 1] = completedResult;
                        onProgress(completedResult, globalIndex, chapters.length, phase + 1, totalPhases);
                    } else if (finalConfig.stopOnError) {
                        // Retry thất bại và stopOnError = true
                        console.log('🛑 Stopping batch due to retry failure (stopOnError=true)');
                        if (onStopped) {
                            onStopped(results, `Không thể xử lý chương ${chapter.chapterNumber} sau khi retry`);
                        }
                        return results;
                    }
                } else if (result.success && result.adjusted) {
                    const completedResult: BatchStyleAdjustResult = {
                        chapterNumber: chapter.chapterNumber,
                        chapterTitle: chapter.chapterTitle,
                        original: result.original || chapter.content,
                        adjusted: result.adjusted,
                        status: 'completed',
                    };
                    results.push(completedResult);
                    onProgress(completedResult, globalIndex, chapters.length, phase + 1, totalPhases);
                } else {
                    const errorResult: BatchStyleAdjustResult = {
                        ...processingResult,
                        status: 'error',
                        error: result.error || 'Có lỗi xảy ra',
                    };
                    results.push(errorResult);
                    onProgress(errorResult, globalIndex, chapters.length, phase + 1, totalPhases);

                    // Nếu config yêu cầu dừng khi lỗi
                    if (finalConfig.stopOnError) {
                        console.log('🛑 Stopping batch due to error (stopOnError=true)');
                        if (onStopped) {
                            onStopped(results, `Lỗi tại chương ${chapter.chapterNumber}: ${result.error}`);
                        }
                        return results;
                    }
                }

                // Delay giữa các request trong phase
                if (i < phaseChapters.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, finalConfig.delayBetweenRequests));
                }

            } catch (error: any) {
                const errorResult: BatchStyleAdjustResult = {
                    ...processingResult,
                    status: 'error',
                    error: error.message || 'Có lỗi xảy ra',
                };
                results.push(errorResult);
                onProgress(errorResult, globalIndex, chapters.length, phase + 1, totalPhases);

                // Nếu config yêu cầu dừng khi lỗi
                if (finalConfig.stopOnError) {
                    console.log('🛑 Stopping batch due to exception (stopOnError=true)');
                    if (onStopped) {
                        onStopped(results, `Lỗi tại chương ${chapter.chapterNumber}: ${error.message}`);
                    }
                    return results;
                }
            }
        }

        // Delay giữa các phase (trừ phase cuối)
        if (phase < totalPhases - 1) {
            onPhaseComplete(phase + 1, totalPhases, finalConfig.delayBetweenPhases / 1000);
            console.log(`⏳ Phase ${phase + 1} complete. Waiting ${finalConfig.delayBetweenPhases / 1000}s before next phase...`);
            await new Promise(resolve => setTimeout(resolve, finalConfig.delayBetweenPhases));
        }
    }

    return results;
};