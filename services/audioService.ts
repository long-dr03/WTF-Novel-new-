import axios from '../setup/axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface AudioInfo {
    chapterId: string;
    chapterNumber: number;
    title: string;
    audioUrl: string | null;
    audioStatus: 'none' | 'processing' | 'completed' | 'failed';
    audioDuration: number | null;
    audioGeneratedAt: string | null;
    audioSource: 'upload' | 'tts' | null;
}

export interface NovelAudioList {
    chapters: AudioInfo[];
    stats: {
        total: number;
        withAudio: number;
        processing: number;
        failed: number;
        none: number;
        totalDuration: number;
    };
}

export interface BatchJobStatus {
    job_id: string;
    status: 'queued' | 'processing' | 'completed' | 'failed' | 'cancelled';
    total: number;
    current: number;
    progress: number;
    current_chapter?: string;
    results?: Array<{
        chapter_id: string;
        success: boolean;
        output_file?: string;
        duration?: number;
        error?: string;
    }>;
}

// Helper function to extract API data
const extractApiData = <T>(response: any): T | null => {
    if (response?.data?.success !== undefined) {
        return response.data.success ? response.data.data : null;
    }
    return response?.data ?? response ?? null;
};

/**
 * Kiểm tra TTS Service health
 */
export const checkTTSHealth = async (): Promise<boolean> => {
    try {
        const response: any = await axios.get('/audio/health');
        return response?.success ?? false;
    } catch (error) {
        console.error('TTS Health check failed:', error);
        return false;
    }
};

/**
 * Lấy thông tin audio của một chapter
 */
export const getChapterAudioInfo = async (chapterId: string): Promise<AudioInfo | null> => {
    try {
        const response: any = await axios.get(`/audio/chapter/${chapterId}/audio`);
        return extractApiData<AudioInfo>(response);
    } catch (error) {
        console.error('Error fetching chapter audio info:', error);
        return null;
    }
};

/**
 * Upload audio file cho chapter
 */
export const uploadChapterAudio = async (
    chapterId: string,
    audioFile: File,
    duration?: number
): Promise<AudioInfo | null> => {
    try {
        const formData = new FormData();
        formData.append('audio', audioFile);
        if (duration) {
            formData.append('duration', duration.toString());
        }

        const response: any = await axios.post(
            `/audio/chapter/${chapterId}/audio/upload`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );
        return extractApiData<AudioInfo>(response);
    } catch (error) {
        console.error('Error uploading chapter audio:', error);
        return null;
    }
};

/**
 * Generate audio cho chapter bằng TTS AI
 */
export const generateChapterAudio = async (chapterId: string): Promise<AudioInfo | null> => {
    try {
        const response: any = await axios.post(`/audio/chapter/${chapterId}/audio/generate`);
        return extractApiData<AudioInfo>(response);
    } catch (error) {
        console.error('Error generating chapter audio:', error);
        return null;
    }
};

/**
 * Xóa audio của chapter
 */
export const deleteChapterAudio = async (chapterId: string): Promise<boolean> => {
    try {
        const response: any = await axios.delete(`/audio/chapter/${chapterId}/audio`);
        return response?.success ?? false;
    } catch (error) {
        console.error('Error deleting chapter audio:', error);
        return false;
    }
};

/**
 * Lấy danh sách audio của tất cả chapters trong novel
 */
export const getNovelAudioList = async (novelId: string): Promise<NovelAudioList | null> => {
    try {
        const response: any = await axios.get(`/audio/novel/${novelId}/audio`);
        return extractApiData<NovelAudioList>(response);
    } catch (error) {
        console.error('Error fetching novel audio list:', error);
        return null;
    }
};

/**
 * Generate audio hàng loạt cho nhiều chapters
 */
export const batchGenerateAudio = async (
    novelId: string,
    options?: {
        chapterIds?: string[];
        fromChapter?: number;
        toChapter?: number;
    }
): Promise<{ job_id: string; total_chapters: number } | null> => {
    try {
        const response: any = await axios.post(`/audio/novel/${novelId}/audio/batch-generate`, options || {});
        return extractApiData(response);
    } catch (error) {
        console.error('Error starting batch audio generation:', error);
        return null;
    }
};

/**
 * Kiểm tra trạng thái batch job
 */
export const getBatchStatus = async (jobId: string): Promise<BatchJobStatus | null> => {
    try {
        const response: any = await axios.get(`/audio/batch-status/${jobId}`);
        return extractApiData<BatchJobStatus>(response);
    } catch (error) {
        console.error('Error fetching batch status:', error);
        return null;
    }
};

/**
 * Format duration từ seconds sang MM:SS
 */
export const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Format duration từ seconds sang readable text
 */
export const formatDurationText = (seconds: number | null): string => {
    if (!seconds) return 'Chưa có';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins} phút`;
};
