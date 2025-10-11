"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import '../styles/style.css';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userInfo, setUserInfo] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // Firestore와 Auth Custom Claims에서 모든 사용자 정보를 가져옵니다.
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                const idTokenResult = await user.getIdTokenResult();
                const role = idTokenResult.claims.role || 'user';
                const isAdmin = role === 'super_admin' || role === 'sub_admin';

                if (userDocSnap.exists()) {
                    // 모든 정보를 하나의 userInfo 객체로 통합합니다.
                    setUserInfo({
                        uid: user.uid,
                        email: user.email,
                        ...userDocSnap.data(),
                        role,
                        isAdmin
                    });
                } else {
                    // Firestore에 사용자 문서가 없는 예외적인 경우
                    setUserInfo({
                        uid: user.uid,
                        email: user.email,
                        nickname: "사용자",
                        university: "미인증",
                        role,
                        isAdmin
                    });
                }
            } else {
                setUserInfo(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ userInfo, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);