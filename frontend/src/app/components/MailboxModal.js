"use client";

import { useState, useEffect, useCallback } from "react";
import { useUserInteraction } from "../context/UserInteractionProvider";
import { useAuth } from "../context/AuthProvider";
import apiClient from "@/lib/api";

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Enter') onConfirm();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onConfirm]);

    return (
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[50]">
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
    const { showMailboxModal, setShowMailboxModal, openDmModal, showAlert } = useUserInteraction();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('inbox');
    const [messages, setMessages] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [messageToDelete, setMessageToDelete] = useState(null);

    const fetchMessages = useCallback(async () => {
        if (!showMailboxModal || !user) {
            setMessages([]);
            return;
        }
        setIsLoading(true);
        try {
            const endpoint = activeTab === 'inbox' ? '/messages/inbox' : '/messages/sent';
            const response = await apiClient.get(endpoint);
            setMessages(response.data);
        } catch (error) {
            console.error("쪽지 목록 로딩 오류:", error);
            setMessages([]);
        } finally {
            setIsLoading(false);
        }
    }, [showMailboxModal, user, activeTab]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    const handleReply = (msg) => {
        const targetUser = {
            id: msg.sender.id,
            nickname: msg.sender.nickname,
            displayName: msg.sender.nickname,
        };
        openDmModal(targetUser, null);
    };

    const handleDeleteMessage = async (messageId) => {
        try {
            await apiClient.delete(`/messages/${messageId}`);
            setMessages(prev => prev.filter(msg => msg.id !== messageId));
            showAlert("쪽지를 삭제했습니다.");
        } catch (error) {
            console.error("쪽지 삭제 오류:", error);
            showAlert("쪽지 삭제 중 오류가 발생했습니다.");
        } finally {
            setMessageToDelete(null);
        }
    };

    const executeClearMailbox = async () => {
        if (!user || messages.length === 0) return;
        setShowConfirm(false);
        
        try {
            await apiClient.post('/messages/clear-mailbox', { type: activeTab });
            setMessages([]);
            showAlert("쪽지함을 비웠습니다.");
        } catch (error) {
            console.error("쪽지함 비우기 오류:", error);
            showAlert("쪽지함을 비우는 중 오류가 발생했습니다.");
        }
    };

    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "";
    };

    if (!showMailboxModal) return null;

    return (
        <>
            <div className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="modal-content bg-white rounded-xl shadow-lg p-6 w-full max-w-2xl h-[70vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-bold">쪽지함</h3>
                        <button onClick={setShowMailboxModal} className="text-gray-400 hover:text-gray-600">&times;</button>
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
                                {messages.map(msg => {
                                    const partner = activeTab === 'inbox' ? msg.sender : msg.recipient;
                                    const partnerIsAdmin = partner?.role === 'super_admin' || partner?.role === 'sub_admin';
                                    
                                    let recipientNickname = partner?.nickname || '(알수없음)';
                                    if (activeTab === 'sent' && msg.isRecipientAnonymous) {
                                        recipientNickname = '익명';
                                    }

                                    return (
                                        <li key={msg.id} className="p-3 group hover:bg-gray-50">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-800">
                                                        {activeTab === 'inbox' ? 
                                                            `${partner?.nickname || '(알수없음)'} 님으로부터` : 
                                                            `${recipientNickname} 님에게`
                                                        }
                                                    </p>
                                                    {msg.sourcePostTitle && (<p className="text-xs text-gray-500 mt-1">(게시글: {msg.sourcePostTitle})</p>)}
                                                </div>
                                                <p className="text-xs text-gray-500 flex-shrink-0 ml-2">{formatDate(msg.createdAt)}</p>
                                            </div>
                                            <p className="mt-2 text-sm text-gray-600">{msg.content}</p>
                                            
                                            <div className="text-right mt-2 h-5">
                                                <div className="flex justify-end gap-3 opacity-0 group-hover:opacity-100 transition">
                                                    {activeTab === 'inbox' && !partnerIsAdmin && (
                                                        <button onClick={() => handleReply(msg)} className="text-xs text-blue-500 font-semibold hover:underline">답장하기</button>
                                                    )}
                                                    <button onClick={() => setMessageToDelete(msg)} className="text-xs text-red-500 font-semibold hover:underline">삭제</button>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                    <div className="pt-4 mt-auto flex justify-between items-center">
                        <p className="text-xs text-gray-400"><i className="fa-solid fa-database mr-1.5"></i>모든 쪽지는 30일 후 자동 삭제됩니다.</p>
                        <button onClick={() => setShowConfirm(true)} className="text-sm text-red-500 hover:underline">
                            {activeTab === 'inbox' ? '받은 쪽지함 비우기' : '보낸 쪽지함 비우기'}
                        </button>
                    </div>
                </div>
            </div>
            {showConfirm && (<ConfirmModal message={`정말로 '${activeTab === 'inbox' ? '받은' : '보낸'}' 쪽지함을 모두 비우시겠습니까?`} onConfirm={executeClearMailbox} onCancel={() => setShowConfirm(false)} />)}
            {messageToDelete && (<ConfirmModal message="이 쪽지를 삭제하시겠습니까?" onConfirm={() => handleDeleteMessage(messageToDelete.id)} onCancel={() => setMessageToDelete(null)} />)}
        </>
    );
}

