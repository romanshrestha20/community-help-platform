// src/features/auth/hooks/auth.hook.ts
import { useState } from "react";
import { changePassword, loginUser, logoutUser, registerUser } from "../service/auth.service";
import { LoginDto, RegisterDto } from "../types/auth.types";
import { useAuthStore } from "../store/auth.store";

export const useAuth = () => {
    const setAuth = useAuthStore(state => state.setAuth);
    const logoutStore = useAuthStore(state => state.logout);

    const [loadingLogin, setLoadingLogin] = useState(false);
    const [loadingLogout, setLoadingLogout] = useState(false);
    const [loadingRegister, setLoadingRegister] = useState(false);
    const [loadingChangePassword, setLoadingChangePassword] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (credentials: LoginDto) => {
        setLoadingLogin(true);
        setError(null);
        try {
            const result = await loginUser(credentials);
            if (result.success && result.user && result.token) {
                setAuth({ user: result.user, token: result.token });
            } else {
                setError(result.message || "Login failed");
            }
            return result;
        } catch (err: any) {
            setError(err?.message || "Login failed");
            return { success: false, message: err?.message };
        } finally {
            setLoadingLogin(false);
        }
    };

    const handleRegister = async (credentials: RegisterDto) => {
        setLoadingRegister(true);
        setError(null);
        try {
            const result = await registerUser(credentials);
            if (result.success && result.user && result.token) {
                setAuth({ user: result.user, token: result.token });
            } else {
                setError(result.message || "Registration failed");
            }
            return result;
        } catch (err: any) {
            setError(err?.message || "Registration failed");
            return { success: false, message: err?.message };
        } finally {
            setLoadingRegister(false);
        }
    };

    const handleLogout = async () => {
        setLoadingLogout(true);
        try {
            await logoutUser();
            logoutStore(); // clear global auth
        } catch (err: any) {
            console.error("Logout failed", err);
        } finally {
            setLoadingLogout(false);
        }
    };

    const handleChangePassword = async (currentPassword: string, newPassword: string) => {
        setLoadingChangePassword(true);
        setError(null);
        try {
            const result = await changePassword(currentPassword, newPassword);
            if (!result.success) setError(result.message || "Password change failed");
            return result;
        } catch (err: any) {
            setError(err?.message || "Password change failed");
            return { success: false, message: err?.message };
        } finally {
            setLoadingChangePassword(false);
        }
    };

    return {
        loadingLogin,
        loadingLogout,
        loadingRegister,
        loadingChangePassword,
        error,
        handleLogin,
        handleLogout,
        handleRegister,
        handleChangePassword,
    };
};