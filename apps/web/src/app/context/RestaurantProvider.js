"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, doc, getDoc, onSnapshot } from 'firebase/firestore'; // onSnapshot 추가
import { db } from '../../firebase';
import { useAuth } from './AuthProvider';

const RestaurantContext = createContext();

export const RestaurantProvider = ({ children }) => {
    const { user } = useAuth();
    const [restaurants, setRestaurants] = useState([]);
    const [university, setUniversity] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUserUniversity = async () => {
            if (user && !university) {
                const userDocRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userDocRef);
                if (userSnap.exists()) {
                    setUniversity(userSnap.data().university);
                }
            } else if (!user) {
                // 로그아웃 시 데이터 초기화
                setUniversity(null);
                setRestaurants([]);
            }
        };
        fetchUserUniversity();
    }, [user]);

    useEffect(() => {
        if (!university) {
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        console.log(`${university}의 음식점 데이터를 실시간으로 구독합니다...`);
        
        const restaurantColRef = collection(db, "newUniversities", university, "newRestaurants");
        // getDocs를 onSnapshot으로 변경하여 실시간 업데이트 수신
        const unsubscribe = onSnapshot(restaurantColRef, (snapshot) => {
            const restaurantList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setRestaurants(restaurantList);
            setIsLoading(false);
        }, (error) => {
            console.error("실시간 맛집 데이터 구독 중 오류:", error);
            setIsLoading(false);
        });

        // 컴포넌트가 사라지거나 university가 바뀔 때 구독을 해제합니다.
        return () => unsubscribe();

    }, [university]);

    const value = { restaurants, isLoading };

    return (
        <RestaurantContext.Provider value={value}>
            {children}
        </RestaurantContext.Provider>
    );
};

export const useRestaurants = () => useContext(RestaurantContext);