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