import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';

interface User {
    id: string;
    email: string;
    fullName?: string;
}

interface AuthContextType {
    session: string | null;
    user: User | null;
    loading: boolean;
    signIn: (token: string, userData: User) => void;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const TOKEN_KEY = 'guardian_auth_token';
const USER_KEY = 'guardian_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<string | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for existing session token
        const token = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (token && storedUser) {
            try {
                setSession(token);
                setUser(JSON.parse(storedUser));
            } catch {
                localStorage.removeItem(TOKEN_KEY);
                localStorage.removeItem(USER_KEY);
            }
        }

        setLoading(false);
    }, []);

    const signIn = (token: string, userData: User) => {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(userData));
        setSession(token);
        setUser(userData);
    };

    const signOut = async () => {
        try {
            // Optional: Call logout endpoint if your backend supports revoking logic.
            await api.post('/auth/logout');
        } catch {
            // Ignore errors on logout
        } finally {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setSession(null);
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ session, user, loading, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
