import axios from '../setup/axios';

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


// Helper function to extract API data
const extractApiData = <T>(response: any): T | null => {
    if (response?.data?.success !== undefined) {
        return response.data.success ? response.data.data : null;
    }
    return response?.data ?? response ?? null;
};

/** PUT file thẳng lên R2 qua presigned URL, có callback tiến trình %. */
function putToR2(
    url: string,
    file: File,
    contentType: string,
    onProgress?: (percent: number) => void
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', url, true);
        // Content-Type PHẢI khớp giá trị đã ký ở server, nếu không R2 trả 403.
        xhr.setRequestHeader('Content-Type', contentType);
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`R2 PUT thất bại: ${xhr.status}`));
        };
        xhr.onerror = () => reject(new Error('Lỗi mạng khi tải lên R2'));
        xhr.send(file);
    });
}

/**
 * Upload 1 file audio lên Cloudflare R2:
 *  1) xin presigned URL từ server (/audio/r2-presign)
 *  2) PUT file thẳng lên R2 (không đi qua server)
 * @returns publicUrl để lưu vào chương, hoặc null nếu lỗi
 */
export const uploadChapterAudioToR2 = async (
    file: File,
    onProgress?: (percent: number) => void
): Promise<string | null> => {
    try {
        const contentType = file.type || 'audio/mpeg';
        const presign: any = await axios.post('/audio/r2-presign', {
            filename: file.name,
            contentType,
        });
        const data = extractApiData<{
            uploadUrl: string;
            publicUrl: string;
            key: string;
            contentType: string;
        }>(presign);
        if (!data?.uploadUrl || !data?.publicUrl) return null;

        await putToR2(data.uploadUrl, file, data.contentType || contentType, onProgress);
        return data.publicUrl;
    } catch (error) {
        console.error('Error uploading audio to R2:', error);
        return null;
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
