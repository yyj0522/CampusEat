"use client";

import { createContext, useContext, useState, useEffect, useMemo } from 'react'; // useMemo 추가
import { onSnapshot, collection, query, where, Timestamp } from 'firebase/firestore';
import { useAuth } from './AuthProvider';
import { db } from '../../firebase';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [activeMeetings, setActiveMeetings] = useState([]);
    const [openChatId, setOpenChatId] = useState(null);

    useEffect(() => {
        if (!user) {
            setActiveMeetings([]);
            return;
        }

        const q = query(
            collection(db, "meetings"),
            where("participantIds", "array-contains", user.uid),
            where("datetime", ">", Timestamp.now())
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const meetings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setActiveMeetings(meetings);
        });

        return () => unsubscribe();
    }, [user]);

    // useMemo를 사용해 activeMeetings가 바뀔 때만 재계산
    const participationStatus = useMemo(() => {
        return {
            isInMeeting: activeMeetings.some(m => m.type === 'meeting'),
            isInCarpool: activeMeetings.some(m => m.type === 'carpool'),
        };
    }, [activeMeetings]);

    const value = {
        activeMeetings,
        openChatId,
        setOpenChatId,
        // 수정: 참여 상태를 value에 추가
        isInMeeting: participationStatus.isInMeeting,
        isInCarpool: participationStatus.isInCarpool,
    };

    return (
        <ChatContext.Provider value={value}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => useContext(ChatContext);