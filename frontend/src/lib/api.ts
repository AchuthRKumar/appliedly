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

// Request interceptor to log requests
api.interceptors.request.use(
    (config) => {
        console.log('API Request:', {
            url: config.url,
            baseURL: config.baseURL,
            withCredentials: config.withCredentials,
            cookies: document.cookie
        });
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => {
        console.log('API Response:', {
            url: response.config.url,
            status: response.status,
            cookies: response.headers['set-cookie']
        });
        return response;
    },
    (error) => {
        // Handle global errors like 401 Unauthorized
        if (error.response?.status === 401) {
            console.error('401 Unauthorized - Details:', {
                url: error.config?.url,
                status: error.response?.status,
                cookies: document.cookie,
                responseHeaders: error.response?.headers
            });
            // Redirect to login or handle session expiry
            console.warn('Unauthorized, redirecting to login...');
            // window.location.href = '/login'; // Optional: force redirect
        }
        return Promise.reject(error);
    }
);

export default api;
