'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface Hospital {
    id: string;
    name: string;
    email: string;
    registrationNumber: string;
    address?: string;
    phone?: string;
}

interface AuthContextType {
    isAuthenticated: boolean;
    isLoading: boolean;
    hospital: Hospital | null;
    token: string | null;
    login: (token: string, hospital: Hospital) => void;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [hospital, setHospital] = useState<Hospital | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        // Check for existing auth on mount
        const storedToken = localStorage.getItem('cyno_token');
        const storedHospital = localStorage.getItem('cyno_hospital');

        if (storedToken && storedHospital) {
            try {
                const parsedHospital = JSON.parse(storedHospital);
                setToken(storedToken);
                setHospital(parsedHospital);
                setIsAuthenticated(true);
            } catch {
                // Invalid stored data, clear it
                localStorage.removeItem('cyno_token');
                localStorage.removeItem('cyno_hospital');
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, newHospital: Hospital) => {
        localStorage.setItem('cyno_token', newToken);
        localStorage.setItem('cyno_hospital', JSON.stringify(newHospital));
        setToken(newToken);
        setHospital(newHospital);
        setIsAuthenticated(true);
    };

    const logout = () => {
        localStorage.removeItem('cyno_token');
        localStorage.removeItem('cyno_hospital');
        setToken(null);
        setHospital(null);
        setIsAuthenticated(false);
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, isLoading, hospital, token, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

interface AuthGuardProps {
    children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoading && !isAuthenticated) {
            // Redirect to signin with return URL
            router.push(`/hospital/signin?returnUrl=${encodeURIComponent(pathname)}`);
        }
    }, [isAuthenticated, isLoading, router, pathname]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return null;
    }

    return <>{children}</>;
}
