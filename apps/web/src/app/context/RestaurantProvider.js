"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from './AuthProvider';

const RestaurantContext = createContext();

export const RestaurantProvider = ({ children }) => {
    const { user } = useAuth();
    const [restaurants, setRestaurants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setRestaurants([]);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        
        let unsubscribe = () => {}; 

        const fetchData = async () => {
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userDocRef);

                if (userSnap.exists()) {
                    const university = userSnap.data().university;
                    if (university) {
                        console.log(`${university}의 음식점 데이터를 실시간으로 구독합니다...`);
                        const restaurantColRef = collection(db, "newUniversities", university, "newRestaurants");
                        
                        unsubscribe = onSnapshot(restaurantColRef, (snapshot) => {
                            const restaurantList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                            setRestaurants(restaurantList);
                            setIsLoading(false);
                        }, (error) => {
                            console.error("실시간 맛집 데이터 구독 중 오류:", error);
                            setIsLoading(false);
                        });
                    } else {
                        setIsLoading(false);
                    }
                } else {
                    setIsLoading(false);
                }
            } catch (error) {
                console.error("Provider에서 데이터 로딩 오류:", error);
                setIsLoading(false);
            }
        };

        fetchData();

        return () => {
            console.log("맛집 데이터 구독을 해제합니다.");
            unsubscribe();
        };
    }, [user]); 

    const value = { restaurants, isLoading };

    return (
        <RestaurantContext.Provider value={value}>
            {children}
        </RestaurantContext.Provider>
    );
};

export const useRestaurants = () => useContext(RestaurantContext);