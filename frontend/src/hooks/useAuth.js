import { useDispatch, useSelector } from 'react-redux';
import { loginStart, loginSuccess, loginFailure, logout as logoutAction } from '../store/slices/authSlice';
import api from '../services/api';
import { parseApiError } from '../utils/errorParser';
import store from '../store/store';

export function useAuth() {
    const dispatch = useDispatch();
    const { user, loading, isAuthenticated } = useSelector((state) => state.auth);

    const login = async (emailOrPayload, password, remember = true) => {
        dispatch(loginStart());
        try {
            const payload =
                typeof emailOrPayload === 'string'
                    ? { email: emailOrPayload, password }
                    : emailOrPayload;

            const response = await api.post('/auth/login/', payload);
            // When "remember me" is off, persist tokens to sessionStorage only so
            // they are cleared automatically when the browser tab is closed.
            if (!remember) {
                const { access, refresh, user: userData } = response.data;
                sessionStorage.setItem('accessToken', access);
                if (refresh) sessionStorage.setItem('refreshToken', refresh);
                if (userData) sessionStorage.setItem('user', JSON.stringify(userData));
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
            }
            dispatch(loginSuccess(response.data));
            return response.data;
        } catch (error) {
            dispatch(loginFailure(parseApiError(error)));
            throw error;
        }
    };

    const register = async (payload) => {
        dispatch(loginStart());
        try {
            const response = await api.post('/auth/register/', payload);
            const { access, refresh, user: userData } = response.data;
            if (access && refresh && userData) {
                dispatch(loginSuccess(response.data));
            } else {
                dispatch(loginFailure('Registration failed'));
            }
            return response.data;
        } catch (error) {
            dispatch(loginFailure(parseApiError(error)));
            throw error;
        }
    };

    const logout = async () => {
        const state = store.getState?.();
        const refreshToken =
            state?.auth?.refreshToken ||
            localStorage.getItem('refreshToken') ||
            sessionStorage.getItem('refreshToken');

        // Immediately clear local state & storage so UI is instantly logged out
        dispatch(logoutAction());

        if (refreshToken) {
            try {
                await api.post('/auth/logout/', { refresh: refreshToken });
            } catch {
                // Ignore — local logout has already completed cleanly
            }
        }
    };

    return { user, loading, isAuthenticated, login, register, logout };
}
