import { create } from 'zustand'
import { User } from '../types/auth.types'


interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;

    setAuth: (data: { user: User; token: string }) => void;
    logout: () => void;
}


export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,

    setAuth: ({ user, token }) => set({ user, token, isAuthenticated: true }),
    logout: () => set({ user: null, token: null, isAuthenticated: false }),
}));