import { useState } from "react";
import { changePassword, loginUser, logoutUser, registerUser } from "../service/auth.service";
import { LoginDto, RegisterDto } from "../types/auth.types";

export const useAuth = () => {
    const [loadingLogin, setLoadingLogin] = useState(false);
    const [loadingLogout, setLoadingLogout] = useState(false);
    const [loadingRegister, setLoadingRegister] = useState(false); // for registration
    const [error, setError] = useState<string | null>(null);
    const [loadingChangePassword, setLoadingChangePassword] = useState(false);

    const handleLogin = async (credentials: LoginDto) => {
        setLoadingLogin(true);
        setError(null);

        const result = await loginUser(credentials);
        if (!result.success) {
            setError(result.message || "Login failed");
        }
        setLoadingLogin(false);
        return result; // screen can navigate or show toast

    };
    const handleLogout = async () => {
        setLoadingLogout(true);
        const result = await logoutUser();
        setLoadingLogout(false);
        return result;
    };

    const handleRegister = async (credentials: RegisterDto) => {
        setLoadingRegister(true);
        setError(null);

        const result = await registerUser(credentials);

        if (!result.success) setError(result.message || "Registration failed");

        setLoadingRegister(false);
        return result; // screen can navigate or show toast
    };

    const handleChangePassword = async (currentPassword: string, newPassword: string) => {
        setLoadingChangePassword(true);
        setError(null);

        const result = await changePassword(currentPassword, newPassword);

        if (!result.success) setError(result.message || "Password change failed");
        if (result.success) setError(null);
        setLoadingChangePassword(false);
        return result;
    }
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