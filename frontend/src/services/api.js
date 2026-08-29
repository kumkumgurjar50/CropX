import axios from 'axios';
import store from '../store/store';
import { updateTokens, logout } from '../store/slices/authSlice';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

const refreshAccessToken = async () => {
  const state = store.getState();
  const refreshToken =
    state.auth.refreshToken ||
    localStorage.getItem('refreshToken') ||
    sessionStorage.getItem('refreshToken');

  if (!refreshToken) {
    throw new Error('Missing refresh token');
  }

  const response = await api.post('/auth/refresh/', { refresh: refreshToken });
  const { access: nextAccessToken, refresh: nextRefreshToken } = response.data;

  // Dispatch Redux action which also handles localStorage update
  store.dispatch(updateTokens({ access: nextAccessToken, refresh: nextRefreshToken }));

  return nextAccessToken;
};

api.interceptors.request.use((config) => {
  const isPublicAuthUrl =
    config.url?.includes('/auth/login/') ||
    config.url?.includes('/auth/register/') ||
    config.url?.includes('/auth/forgot-password/') ||
    config.url?.includes('/auth/reset-password/') ||
    config.url?.includes('/auth/verify-email/');

  if (isPublicAuthUrl) {
    delete config.headers.Authorization;
    return config;
  }

  const state = store.getState();
  const token =
    state.auth.accessToken ||
    localStorage.getItem('accessToken') ||
    sessionStorage.getItem('accessToken');

  if (token && !config.url?.includes('/auth/refresh/')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isPublicAuthUrl =
      originalRequest?.url?.includes('/auth/login/') ||
      originalRequest?.url?.includes('/auth/register/') ||
      originalRequest?.url?.includes('/auth/refresh/');

    if (error.response?.status === 401 && !originalRequest._retry && !isPublicAuthUrl) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((queueError) => Promise.reject(queueError));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        store.dispatch(logout()); // Clear Redux and local storage cleanly
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
