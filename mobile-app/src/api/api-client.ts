import axios from 'axios';
import { getToken } from '../utils/token'
import { showToast } from '../utils/toast';

const apiClient = axios.create({
    baseURL: 'http://localhost:5001/api', // Replace with your backend URL
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(async (config) => {
    try {
        const token = await getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
    } catch (error) {
        // Continue request without auth header if token lookup fails.
        console.warn("Skipping auth header; token lookup failed:", error);
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            const message =
                data?.message ||
                data?.error?.message ||
                error.message ||
                "Something went wrong";

            if (status === 401) {
                console.warn("Unauthorized: please login again.");
            }

            showToast(message);
            console.error("API Error:", message);
        } else if (error.request) {
            showToast("No response from server, network error");
            console.error("No response from server, network error");
        } else {
            console.error("Request setup error:", error.message);
        }

        return Promise.reject(error);
    }
)

export default apiClient;