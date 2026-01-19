import axios from "@/setup/axios";

export interface Music {
    _id: string;
    name: string;
    url: string;
    duration: number;
    type: 'system' | 'author' | 'user';
    owner?: string;
    createdAt?: string;
}

/**
 * Upload nhạc mới (gửi metadata về backend)
 * @param file File nhạc
 * @param name Tên bài nhạc
 * @param duration Thời lượng
 */
export const uploadMusic = async (file: File, name: string, duration: number) => {
    return axios.post("/music", {
        name,
        url: "",
        duration
    });
}

/**
 * Tạo metadata cho nhạc
 * @param data Dữ liệu nhạc (tên, url, thời lượng)
 */
export const createMusicMetadata = async (data: { name: string, url: string, duration: number, type?: string }) => {
    return axios.post("/music", data);
}

/**
 * Lấy danh sách nhạc của tôi
 */
export const getMyMusic = async () => {
    return axios.get("/music/my-music");
}

/**
 * Lấy danh sách nhạc hệ thống
 */
export const getSystemMusic = async () => {
    return axios.get("/music/system");
}

/**
 * Xóa nhạc theo ID
 * @param musicId ID bài nhạc
 */
export const deleteMusic = async (musicId: string) => {
    return axios.delete(`/music/${musicId}`);
}
