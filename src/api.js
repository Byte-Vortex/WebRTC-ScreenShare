// api.js
import axios from 'axios';
import { createBrowserHistory } from 'history';

const history = createBrowserHistory();

// Create an Axios instance
const api = axios.create({
    baseURL: 'http://localhost:5000/api',
});

// Request interceptor for adding token to headers
api.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor for handling expired tokens
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 401) {
            // Token expired, navigate to login
            history.push('/login');
            localStorage.removeItem('token');
        }
        return Promise.reject(error);
    }
);

export default api;
