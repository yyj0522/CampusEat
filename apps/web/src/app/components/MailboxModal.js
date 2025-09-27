"use client";

import { useState, useEffect } from "react";
import { useUserInteraction } from "../context/UserInteractionProvider";
import { useAuth } from "../context/AuthProvider";
import { db } from "../../firebase";
import { collection, query, where, orderBy, getDocs, writeBatch, doc } from "firebase/firestore";

const AlertModal = ({ message, onClose }) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
            <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-sm">
                <p className="text-lg mb-6">{message}</p>
                <button onClick={onClose} className="bg-blue-600 text-white px-8 py-2 rounded-lg w-full">확인</button>
            </div>
        </div>
    );
};

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') onConfirm();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onConfirm]);

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60]">
            <div className="modal-content bg-white rounded-xl shadow-lg p-8 text-center w-full max-w-sm">
                <p className="text-lg mb-8">{message}</p>
                <div className="flex gap-4">
                    <button onClick={onCancel} className="bg-gray-200 text-gray-800 py-2 rounded-lg w-full">취소</button>
                    <button onClick={onConfirm} className="bg-red-500 text-white py-2 rounded-lg w-full">확인</button>
                </div>
            </div>
        </div>
    );
};

export default function MailboxModal() {
    const { showMailboxModal, setShowMailboxModal, openDmModal } = useUserInteraction();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('inbox');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [alert, setAlert] = useState({ show: false, message: "" });

    useEffect(() => {
        if (!showMailboxModal || !user) {
            setMessages([]);
            return;
        }

        const fetchMessages = async () => {
            setIsLoading(true);
            try {
                const messagesRef = collection(db, "messages");
                const targetField = activeTab === 'inbox' ? "recipientId" : "senderId";
                const q = query(messagesRef, where(targetField, "==", user.uid), orderBy("createdAt", "desc"));
                const snapshot = await getDocs(q);
                const fetchedMessages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setMessages(fetchedMessages);
            } catch (error) {
                console.error("쪽지 목록 로딩 오류:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchMessages();
    }, [showMailboxModal, user, activeTab]);

    const handleReply = (msg) => {
        const targetUser = { id: msg.senderId, nickname: msg.senderNickname };
        openDmModal(targetUser);
    };

    const executeClearMailbox = async () => {
        if (!user || messages.length === 0) return;
        setShowConfirm(false);
        
        try {
            const batch = writeBatch(db);
            messages.forEach(msg => {
                batch.delete(doc(db, "messages", msg.id));
            });
            await batch.commit();
            setMessages([]);
            setAlert({ show: true, message: "쪽지함을 비웠습니다." });
        } catch (error) {
            console.error("쪽지함 비우기 오류:", error);
            setAlert({ show: true, message: "쪽지함을 비우는 중 오류가 발생했습니다." });
        }
    };

    const formatDate = (timestamp) => {
        return timestamp ? timestamp.toDate().toLocaleString('ko-KR') : "";
    };

    if (!showMailboxModal) return null;

    return (
        <>
            <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="modal-content bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl h-[70vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">쪽지함</h3>
                        <button onClick={() => setShowMailboxModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                    </div>
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                            <button onClick={() => setActiveTab('inbox')} className={`${activeTab === 'inbox' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>받은 쪽지함</button>
                            <button onClick={() => setActiveTab('sent')} className={`${activeTab === 'sent' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm`}>보낸 쪽지함</button>
                        </nav>
                    </div>
                    <div className="flex-1 overflow-y-auto mt-4">
                        {isLoading ? <p className="text-center pt-10">로딩 중...</p> : messages.length === 0 ? <p className="text-center text-gray-500 pt-10">쪽지가 없습니다.</p> : (
                            <ul className="divide-y divide-gray-200">
                                {messages.map(msg => (
                                    <li key={msg.id} className="p-3 group">
                                        <div className="flex justify-between">
                                            <p className="text-sm font-medium text-gray-800">
                                                {activeTab === 'inbox' ? `${msg.senderNickname} 님으로부터` : `${msg.recipientNickname} 님에게`}
                                            </p>
                                            <p className="text-xs text-gray-500">{formatDate(msg.createdAt)}</p>
                                        </div>
                                        <p className="mt-1 text-sm text-gray-600">{msg.content}</p>
                                        
                                        {activeTab === 'inbox' && msg.senderId !== 'system' && (
                                            <div className="text-right mt-2 opacity-0 group-hover:opacity-100 transition">
                                                <button onClick={() => handleReply(msg)} className="text-xs text-blue-500 font-semibold hover:underline">답장하기</button>
                                            </div>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    <div className="pt-4 mt-auto">
                        <button onClick={() => setShowConfirm(true)} className="text-sm text-red-500 hover:underline">
                            {activeTab === 'inbox' ? '받은 쪽지함 비우기' : '보낸 쪽지함 비우기'}
                        </button>
                    </div>
                </div>
            </div>
            {showConfirm && (
                <ConfirmModal
                    message={`정말로 '${activeTab === 'inbox' ? '받은' : '보낸'}' 쪽지함을 모두 비우시겠습니까?`}
                    onConfirm={executeClearMailbox}
                    onCancel={() => setShowConfirm(false)}
                />
            )}
            {alert.show && (
                <AlertModal message={alert.message} onClose={() => setAlert({ show: false, message: "" })} />
            )}
        </>
    );
}