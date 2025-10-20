// 파일 전체 경로: src/app/context/RestaurantProvider.js

"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';

const RestaurantContext = createContext();

export const RestaurantProvider = ({ children }) => {
    const { user } = useAuth();
    const [restaurants, setRestaurants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let unsubscribe = () => {};

        if (user && user.uid && user.university) {
            setIsLoading(true);
            const restaurantColRef = collection(db, "newUniversities", user.university, "newRestaurants");
            const q = query(restaurantColRef);
            
            unsubscribe = onSnapshot(q, (snapshot) => {
                const restaurantList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setRestaurants(restaurantList);
                setIsLoading(false);
            }, (error) => {
                console.error("맛집 데이터 구독 오류:", error);
                setRestaurants([]);
                setIsLoading(false);
            });

        } else {
            // 조건에 맞지 않으면(NestJS 로그인 등) 즉시 로딩을 멈추고 빈 배열을 반환합니다.
            setRestaurants([]);
            setIsLoading(false);
        }

        return () => unsubscribe();
    }, [user]);

    const value = { restaurants, isLoading };

    return (
        <RestaurantContext.Provider value={value}>
            {children}
        </RestaurantContext.Provider>
    );
};

export const useRestaurants = () => useContext(RestaurantContext);