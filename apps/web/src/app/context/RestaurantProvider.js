"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from './AuthProvider';

const RestaurantContext = createContext();

export const RestaurantProvider = ({ children }) => {
    const { user } = useAuth();
    const [restaurants, setRestaurants] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // 1. 사용자가 없으면(로그아웃 상태) 데이터를 비우고 로딩을 멈춘 후, 함수를 즉시 종료합니다.
        if (!user) {
            setRestaurants([]);
            setIsLoading(false);
            return;
        }

        // 2. 사용자가 있으면 데이터 로딩을 시작합니다.
        setIsLoading(true);
        
        let unsubscribe = () => {}; // 구독 해제 함수를 담을 변수

        const fetchData = async () => {
            try {
                // 사용자의 대학교 정보 가져오기
                const userDocRef = doc(db, "users", user.uid);
                const userSnap = await getDoc(userDocRef);

                if (userSnap.exists()) {
                    const university = userSnap.data().university;
                    if (university) {
                        console.log(`${university}의 음식점 데이터를 실시간으로 구독합니다...`);
                        const restaurantColRef = collection(db, "newUniversities", university, "newRestaurants");
                        
                        // onSnapshot으로 실시간 구독 시작
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

        // 3. useEffect의 cleanup 함수: 사용자가 바뀌거나 로그아웃하면 이전 구독을 반드시 해제합니다.
        return () => {
            console.log("맛집 데이터 구독을 해제합니다.");
            unsubscribe();
        };
    }, [user]); // useEffect는 오직 user 객체의 변경에만 반응합니다.

    const value = { restaurants, isLoading };

    return (
        <RestaurantContext.Provider value={value}>
            {children}
        </RestaurantContext.Provider>
    );
};

export const useRestaurants = () => useContext(RestaurantContext);