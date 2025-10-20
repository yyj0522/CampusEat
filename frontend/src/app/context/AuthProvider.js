// 파일 전체 경로: src/context/AuthProvider.js

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
                    console.error("자동 로그인 실패:", error);
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
        
        // --- ▼▼▼▼▼ 여기가 핵심 수정 부분입니다 ▼▼▼▼▼ ---
        // 로그인 성공 후 받아온 user 객체를 반환해줍니다.
        return userResponse.data;
        // --- ▲▲▲▲▲ 여기가 핵심 수정 부분입니다 ▲▲▲▲▲ ---
    };
    
    const logout = () => {
        setUser(null);
        localStorage.removeItem('accessToken');
        delete apiClient.defaults.headers.common['Authorization'];
        window.location.href = '/login';
    };

    const value = { user, loading, login, logout };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);