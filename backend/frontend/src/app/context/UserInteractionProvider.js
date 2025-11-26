"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import apiClient from "@/lib/api";
import { useAuth } from "./AuthProvider";

const UserInteractionContext = createContext();

export const UserInteractionProvider = ({ children }) => {
    const { user } = useAuth();
    const [contextMenu, setContextMenu] = useState({ show: false, x: 0, y: 0, targetUser: null, context: null });
    const [dmModal, setDmModal] = useState({ show: false, targetUser: null, context: null, replyContext: null });
    const [reportModal, setReportModal] = useState({ show: false, targetUser: null, context: null });
    const [showMailboxModal, setShowMailboxModal] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const [alert, setAlert] = useState({ show: false, message: "" });

    const fetchUnreadCount = useCallback(async () => {
        if (!user) {
            setUnreadCount(0);
            return;
        }
        try {
            const response = await apiClient.get('/messages/inbox');
            const unreadMessages = response.data.filter(msg => !msg.isRead);
            setUnreadCount(unreadMessages.length);
        } catch (error) {
            console.error("Failed to fetch unread messages count:", error);
            setUnreadCount(0);
        }
    }, [user]);

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, [fetchUnreadCount]);

    const openContextMenu = (e, targetUser, context) => {
        e.preventDefault();
        e.stopPropagation();
        setContextMenu({ show: true, x: e.clientX, y: e.clientY, targetUser, context });
    };
    const closeContextMenu = () => setContextMenu({ show: false });

    const openDmModal = (targetUser, context, replyContext = null) => {
        closeContextMenu();
        setDmModal({ show: true, targetUser, context, replyContext });
    };
    const closeDmModal = () => setDmModal({ show: false });

    const openReportModal = (targetUser, context) => {
        closeContextMenu();
        setReportModal({ show: true, targetUser, context });
    };
    const closeReportModal = () => setReportModal({ show: false });

    const handleOpenMailbox = async () => {
        setShowMailboxModal(true);
        if (unreadCount > 0) {
            setUnreadCount(0); 
            try {
                await apiClient.post('/messages/read');
            } catch (error) {
                console.error("Failed to mark messages as read:", error);
            }
        }
    };
    const handleCloseMailbox = () => setShowMailboxModal(false);

    const showAlert = (message) => setAlert({ show: true, message });
    const closeAlert = () => setAlert({ show: false, message: "" });

    const value = {
        contextMenu,
        dmModal,
        reportModal,
        showMailboxModal,
        unreadCount,
        openContextMenu,
        closeContextMenu,
        openDmModal,
        closeDmModal,
        openReportModal,
        closeReportModal,
        handleOpenMailbox,
        setShowMailboxModal: handleCloseMailbox,
        showAlert,
    };

    return (
        <UserInteractionContext.Provider value={value}>
            {children}
            {alert.show && <AlertModal message={alert.message} onClose={closeAlert} />}
        </UserInteractionContext.Provider>
    );
};

const AlertModal = ({ message, onClose }) => {
    if (!message) return null;
    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[110]">
            <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-sm">
                <p className="text-lg mb-6">{message}</p>
                <button onClick={onClose} className="bg-blue-600 text-white px-8 py-2 rounded-lg w-full">확인</button>
            </div>
        </div>
    );
};

export const useUserInteraction = () => useContext(UserInteractionContext);

