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
                const userDocRef = doc(db, 'users', user.uid);
                const userDocSnap = await getDoc(userDocRef);
                const idTokenResult = await user.getIdTokenResult();
                const role = idTokenResult.claims.role || 'user';
                const isAdmin = role === 'super_admin' || role === 'sub_admin';

                if (userDocSnap.exists()) {
                    setUserInfo({
                        uid: user.uid,
                        email: user.email,
                        ...userDocSnap.data(),
                        role,
                        isAdmin
                    });
                } else {
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