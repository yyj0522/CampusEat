"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '@/lib/api'; 
import '../styles/style.css';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUserLoggedIn = async () => {
            const accessToken = localStorage.getItem('accessToken');
            if (accessToken) {
                apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                try {
                    const response = await apiClient.get('/auth/profile');
                    setUser(response.data);
                } catch (error) {
                    if (error.response && error.response.status !== 401) {
                        console.error("자동 로그인 확인 중 오류:", error);
                    }

                    setUser(null);
                    localStorage.removeItem('accessToken');
                    delete apiClient.defaults.headers.common['Authorization'];
                    
                }
            }
            setLoading(false);
        };
        checkUserLoggedIn();
    }, []);

    const login = async (email, password) => {
        const response = await apiClient.post('/auth/signin', { email, password });
        const { accessToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

        const userResponse = await apiClient.get('/auth/profile');
        setUser(userResponse.data);

        return userResponse.data;
    };
    
    const logout = () => {
        setUser(null);
        localStorage.removeItem('accessToken');
        delete apiClient.defaults.headers.common['Authorization'];
        window.location.href = '/';
    };

    const value = { user, loading, login, logout };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);