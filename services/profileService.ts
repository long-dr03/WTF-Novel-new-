import axios from "../setup/axios";

export interface UpdateProfilePayload {
    username?: string;
    email?: string;
    avatar?: string; // URL (đã upload sẵn, vd UploadThing)
    oldPassword?: string;
    newPassword?: string;
}

/**
 * Cập nhật hồ sơ người dùng (tên, email, avatar, đổi mật khẩu).
 * Gọi PUT /me (controller updateProfile). Trả về user mới hoặc null.
 */
export const updateProfileService = async (payload: UpdateProfilePayload) => {
    try {
        const res: any = await axios.put('/me', payload);
        return res?.data?.user ?? res?.user ?? null;
    } catch (error) {
        console.error('Update profile error:', error);
        return null;
    }
};
