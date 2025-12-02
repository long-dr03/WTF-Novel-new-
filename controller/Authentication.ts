// controller/SongController.js
import axios from "../setup/axios";

const registerUser = (email: string, password: string, username: string) => {
    return axios.post("/register", {
        email,
        password,
        username,
    });
};

const loginUser = (valueLogin: string, password: string, checkRemember: boolean) => {
    return axios.post("/login", {
        valueLogin,
        password,
        checkRemember
    });
};

const logoutUser = () => {
    return axios.post("/logout");
};
const loginGG = (id: string) => {
    return axios.post("/login-gg-success", { id });
};

export { registerUser, loginUser, logoutUser, loginGG };
