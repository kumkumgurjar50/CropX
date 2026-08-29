import { createSlice } from '@reduxjs/toolkit';

// Tokens can live in localStorage (remember me) or sessionStorage (session only).
// Check localStorage first, fall back to sessionStorage.
const storedToken =
    localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
const storedRefresh =
    localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
const storedUser = (() => {
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
})();

const initialState = {
    user: storedUser,
    accessToken: storedToken || null,
    refreshToken: storedRefresh || null,
    isAuthenticated: !!storedToken,
    // Only block the UI while loading when we actually have a token to validate.
    loading: !!storedToken,
    error: null,
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.loading = true;
            state.error = null;
        },
        initStart: (state) => {
            state.loading = true;
        },
        initComplete: (state) => {
            state.loading = false;
        },
        // loginSuccess does NOT touch storage here — the useAuth.login function
        // handles persistence (localStorage vs sessionStorage) before dispatching
        // this action so there's a single, explicit place that decision lives.
        loginSuccess: (state, action) => {
            state.loading = false;
            state.isAuthenticated = true;
            state.user = action.payload.user;
            state.accessToken = action.payload.access;
            state.refreshToken = action.payload.refresh;

            // Only write to localStorage if the token isn't already in sessionStorage
            // (i.e. "remember me" was checked or this is a register flow).
            const inSession = sessionStorage.getItem('accessToken') === action.payload.access;
            if (!inSession) {
                localStorage.setItem('accessToken', action.payload.access);
                if (action.payload.refresh) {
                    localStorage.setItem('refreshToken', action.payload.refresh);
                }
                if (action.payload.user) {
                    localStorage.setItem('user', JSON.stringify(action.payload.user));
                }
            }
        },
        loginFailure: (state, action) => {
            state.loading = false;
            state.error = action.payload;
        },
        logout: (state) => {
            state.user = null;
            state.accessToken = null;
            state.refreshToken = null;
            state.isAuthenticated = false;
            state.loading = false;
            state.error = null;
            // Clear both storages on logout
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            sessionStorage.removeItem('accessToken');
            sessionStorage.removeItem('refreshToken');
            sessionStorage.removeItem('user');
        },
        updateUser: (state, action) => {
            state.user = { ...state.user, ...action.payload };
            // Mirror to whichever storage currently holds the session
            const target = sessionStorage.getItem('accessToken') ? sessionStorage : localStorage;
            target.setItem('user', JSON.stringify(state.user));
        },
        updateTokens: (state, action) => {
            state.accessToken = action.payload.access;
            // Mirror refresh to whichever storage holds the session
            const target = sessionStorage.getItem('accessToken') ? sessionStorage : localStorage;
            target.setItem('accessToken', action.payload.access);
            if (action.payload.refresh) {
                state.refreshToken = action.payload.refresh;
                target.setItem('refreshToken', action.payload.refresh);
            }
        },
    },
});

export const {
    loginStart,
    initStart,
    initComplete,
    loginSuccess,
    loginFailure,
    logout,
    updateUser,
    updateTokens,
} = authSlice.actions;

export default authSlice.reducer;
