"use client";

import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot, doc, writeBatch } from 'firebase/firestore';

const UserInteractionContext = createContext();

export const UserInteractionProvider = ({ children }) => {
    const { user } = useAuth();
    
    const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, targetUser: null, context: null });
    const [showReportModal, setShowReportModal] = useState(false);
    const [showDmModal, setShowDmModal] = useState(false);
    const [dmTarget, setDmTarget] = useState(null);
    const [showMailboxModal, setShowMailboxModal] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState([]);

    useEffect(() => {
        if (!user) {
            setUnreadMessages([]);
            return;
        }
        const messagesRef = collection(db, "messages");
        const q = query(messagesRef, where("recipientId", "==", user.uid), where("isRead", "==", false));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const unread = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setUnreadMessages(unread);
        });

        return () => unsubscribe();
    }, [user]);

    const openContextMenu = (e, targetUser, context) => {
        e.preventDefault();
        setContextMenu({ show: true, x: e.clientX, y: e.clientY, targetUser, context });
    };

    const closeContextMenu = () => setContextMenu({ ...contextMenu, show: false });

    const openDmModal = (target) => {
        setDmTarget(target);
        setShowDmModal(true);
    };

    const handleOpenMailbox = async () => {
        setShowMailboxModal(true);
        if (unreadMessages.length > 0) {
            const batch = writeBatch(db);
            unreadMessages.forEach(msg => {
                const msgRef = doc(db, "messages", msg.id);
                batch.update(msgRef, { isRead: true });
            });
            await batch.commit();
        }
    };

    const value = {
        contextMenu,
        openContextMenu,
        closeContextMenu,
        
        showReportModal,
        setShowReportModal,
        showDmModal,
        setShowDmModal,
        dmTarget,
        openDmModal,
        
        showMailboxModal,
        setShowMailboxModal,
        handleOpenMailbox,
        
        unreadCount: unreadMessages.length,
    };

    return (
        <UserInteractionContext.Provider value={value}>
            {children}
        </UserInteractionContext.Provider>
    );
};

export const useUserInteraction = () => useContext(UserInteractionContext);