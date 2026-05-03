import axios from 'axios';

export const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://20.197.13.253:3000/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('guardian_auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});
