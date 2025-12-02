import { registerUser, loginUser, logoutUser } from '../controller/Authentication';
const getRegister = async (email: string, password: string, username: string) => {
    try {
        const data = await registerUser(email, password, username)
        return data
    } catch (error) {
        console.error("Error register:", error);
        return null;
    }
};
const getLogin = async (valueLogin: string, password: string, checkRemember: boolean) => {
    try {
        const data = await loginUser(valueLogin, password, checkRemember)
        return data
    } catch (error) {
        console.log("Error login:", error);
        return null;
    }
};
const getLogout = async () => {
    try {
        const data = await logoutUser()
        return data
    } catch (error) {
        console.log("Error login:", error);
        return null;
    }
};

export {
    getRegister,
    getLogin,
    getLogout
}