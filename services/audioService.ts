import axios from '../setup/axios';

const API_BASE = process.env.BACKEND_URL || 'http://localhost:6969';

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
 * Kiểm tra trạng thái hoạt động của TTS Service
 * @returns Promise<boolean> trả về true nếu service hoạt động tốt
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
 * @param chapterId ID của chapter cần lấy thông tin
 * @returns Promise<AudioInfo | null> thông tin audio hoặc null nếu lỗi
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
 * Upload file audio cho một chapter lên server (không phải gen bằng AI)
 * @param chapterId ID của chapter
 * @param audioFile File audio cần upload
 * @param duration Thời lượng audio (giây)
 * @returns Promise<AudioInfo | null> thông tin audio sau khi upload
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
 * Cập nhật đường dẫn audio cho chapter (thường dùng sau khi upload lên UploadThing)
 * @param chapterId ID của chapter
 * @param audioUrl URL của audio file
 * @param duration Thời lượng audio (giây)
 * @returns Promise<AudioInfo | null> thông tin audio sau thống nhất
 */
export const updateChapterAudioUrl = async (
    chapterId: string,
    audioUrl: string,
    duration?: number
): Promise<AudioInfo | null> => {
    try {
        const response: any = await axios.post(`/audio/chapter/${chapterId}/audio/url`, {
            audioUrl,
            duration
        });
        return extractApiData<AudioInfo>(response);
    } catch (error) {
        console.error('Error updating chapter audio URL:', error);
        return null;
    }
};

/**
 * Yêu cầu TTS AI tạo audio cho nội dung text của chapter
 * @param chapterId ID của chapter cần tạo audio
 * @returns Promise<AudioInfo | null> thông tin task tạo audio
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
 * Xóa dữ liệu audio của một chapter
 * @param chapterId ID của chapter cần xóa audio
 * @returns Promise<boolean> trả về true nếu xóa thành công
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
 * Lấy danh sách thông tin audio của toàn bộ chapter trong một tiểu thuyết
 * @param novelId ID của tiểu thuyết
 * @returns Promise<NovelAudioList | null> danh sách audio và thống kê
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
 * Kích hoạt tạo audio hàng loạt cho danh sách chapter
 * @param novelId ID của tiểu thuyết
 * @param options Các tùy chọn lọc (chapterIds, fromChapter, toChapter)
 * @returns Promise chứa job_id để theo dõi tiến độ
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
 * Kiểm tra trạng thái tiến độ của một job tạo audio hàng loạt
 * @param jobId ID của job cần kiểm tra
 * @returns Promise<BatchJobStatus | null> thông tin trạng thái job
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
 * Định dạng thời gian từ giây sang chuỗi MM:SS
 * @param seconds Số giây
 * @returns Chuỗi thời gian định dạng MM:SS
 */
export const formatDuration = (seconds: number | null): string => {
    if (!seconds) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Định dạng thời gian từ giây sang chuỗi văn bản đọc được (ví dụ: 1h 30m)
 * @param seconds Số giây
 * @returns Chuỗi mô tả thời gian
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
