import axios from 'axios';

const api = axios.create({
    baseURL: 'https://appliedly.onrender.com', // Adjust if backend port differs
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
