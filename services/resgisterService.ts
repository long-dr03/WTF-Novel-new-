import { registerUser, loginUser, logoutUser } from '../controller/Authentication';

/**
 * Trích xuất dữ liệu từ API response
 * @param response Phản hồi từ API
 */
const extractApiData = <T>(response: any): T | null => {
    if (response?.data?.success !== undefined) {
        return response.data.success ? response.data.data : null;
    }
    return response?.data ?? response ?? null;
};

/**
 * Đăng ký tài khoản mới
 * @param email Email người dùng
 * @param password Mật khẩu
 * @param username Tên đăng nhập
 */
const getRegister = async (email: string, password: string, username: string) => {
    try {
        const response = await registerUser(email, password, username);
        return extractApiData(response);
    } catch (error) {
        console.error("Error register:", error);
        return null;
    }
};

/**
 * Đăng nhập
 * @param valueLogin Email hoặc username
 * @param password Mật khẩu
 * @param checkRemember Ghi nhớ đăng nhập
 */
const getLogin = async (valueLogin: string, password: string, checkRemember: boolean) => {
    try {
        const response = await loginUser(valueLogin, password, checkRemember);
        return extractApiData(response);
    } catch (error) {
        console.log("Error login:", error);
        return null;
    }
};

/**
 * Đăng xuất
 */
const getLogout = async () => {
    try {
        const response = await logoutUser();
        return extractApiData(response);
    } catch (error) {
        console.log("Error logout:", error);
        return null;
    }
};

export {
    getRegister,
    getLogin,
    getLogout
}