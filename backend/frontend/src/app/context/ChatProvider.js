"use client";

import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthProvider';

const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
    const { user } = useAuth();
    const [activeMeetings, setActiveMeetings] = useState([]);
    const [openChatId, setOpenChatId] = useState(null);

    useEffect(() => {
        if (!user || !user.uid) {
            setActiveMeetings([]);
            setOpenChatId(null);
            return;
        }

        const q = query(
            collection(db, "meetings"),
            where("participantIds", "array-contains", user.uid),
            where("status", "==", "active")
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const now = new Date();
            const meetings = snapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .filter(meeting => meeting.datetime && meeting.datetime.toDate() > now);

            meetings.sort((a, b) => a.datetime.toDate() - b.datetime.toDate());
            
            setActiveMeetings(meetings);

            if (openChatId && !meetings.some(m => m.id === openChatId)) {
                setOpenChatId(null);
            }
        }, (error) => {
            console.error("Active meetings 구독 오류:", error);
            setActiveMeetings([]);
            setOpenChatId(null);
        });

        return () => unsubscribe();
    }, [user, openChatId]);

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