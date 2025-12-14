import { registerUser, loginUser, logoutUser } from '../controller/Authentication';

// Helper function to extract data from API response
const extractApiData = <T>(response: any): T | null => {
    // Check if response has the new format { success, message, data }
    if (response?.data?.success !== undefined) {
        return response.data.success ? response.data.data : null;
    }
    // Fallback for old format or direct data
    return response?.data ?? response ?? null;
};

const getRegister = async (email: string, password: string, username: string) => {
    try {
        const response = await registerUser(email, password, username);
        return extractApiData(response);
    } catch (error) {
        console.error("Error register:", error);
        return null;
    }
};

const getLogin = async (valueLogin: string, password: string, checkRemember: boolean) => {
    try {
        const response = await loginUser(valueLogin, password, checkRemember);
        return extractApiData(response);
    } catch (error) {
        console.log("Error login:", error);
        return null;
    }
};

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