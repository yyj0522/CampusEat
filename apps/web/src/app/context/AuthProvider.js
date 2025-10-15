"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import '../styles/style.css';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (authUser) => {
            try {
                if (authUser) {
                    const userDocRef = doc(db, 'users', authUser.uid);
                    const userDocSnap = await getDoc(userDocRef);
                    const idTokenResult = await authUser.getIdTokenResult();
                    const role = idTokenResult.claims.role || 'user';
                    const isAdmin = role === 'super_admin' || role === 'sub_admin';

                    if (userDocSnap.exists()) {
                        setUser({
                            uid: authUser.uid,
                            email: authUser.email,
                            ...userDocSnap.data(),
                            role,
                            isAdmin
                        });
                    } else {
                        setUser({
                            uid: authUser.uid,
                            email: authUser.email,
                            nickname: "사용자",
                            university: "미인증",
                            role,
                            isAdmin
                        });
                    }
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error("AuthProvider에서 오류 발생:", error);
                setUser(null);
            } finally {
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);