import axios from 'axios';

const apiBaseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
console.log('API Base URL:', apiBaseURL); // Debug log

const api = axios.create({
    baseURL: apiBaseURL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle global errors like 401 Unauthorized
        if (error.response?.status === 401) {
            // Redirect to login or handle session expiry
            console.warn('Unauthorized, redirecting to login...');
            // window.location.href = '/login'; // Optional: force redirect
        }
        return Promise.reject(error);
    }
);

export default api;
