import axios from "axios";

const instance = axios.create({
    baseURL: 'http://localhost:6969', // Replace with your API base URL
    withCredentials: true
});


instance.defaults.withCredentials = true;

// Add a request interceptor
instance.interceptors.request.use(function (config) {
    // Add authorization token from localStorage (only on client side)
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('jwt');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
    return config;
}, function (error) {
    // Do something with request error
    return Promise.reject(error);
});
// Add a response interceptor
instance.interceptors.response.use(function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    // Do something with response data
    return response.data;
}, function (error) {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    const status = error.response?.status || 500;
    // we can handle global errors here
    switch (status) {
        // authentication (token related issues)
        case 401: {
            if (typeof window !== 'undefined' && window.location.pathname !== '/' && window.location.pathname !== '/login' && window.location.pathname !== '/register') {
                // toast.error('Not authenticated the user')
            }
            return error.response.data;
        }

        // forbidden (permission related issues)
        case 403: {
            return Promise.reject(error);
        }

        // bad request
        case 400: {
            return Promise.reject(error);
        }

        // not found
        case 404: {
            return Promise.reject(error);
        }

        // conflict
        case 409: {
            return Promise.reject(error);
        }

        // unprocessable
        case 422: {
            return Promise.reject(error);
        }

        // generic api error (server related) unexpected
        default: {
            return error;
        }
    }
    // return Promise.reject(error);
});

export default instance;