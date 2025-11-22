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
        <div className="modal-overlay fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-[60]">
            <div className="modal-content bg-white rounded-2xl shadow-2xl p-8 text-center w-full max-w-sm transform transition-all scale-100">
                <p className="text-gray-800 font-medium text-lg mb-8">{message}</p>
                <div className="flex gap-3">
                    <button onClick={onCancel} className="flex-1 bg-gray-100 text-gray-600 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition">취소</button>
                    <button onClick={onConfirm} className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-600 transition">확인</button>
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
            console.error(error);
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
            console.error(error);
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
            console.error(error);
            showAlert("쪽지함을 비우는 중 오류가 발생했습니다.");
        }
    };

    const formatDate = (dateString) => {
        return dateString ? new Date(dateString).toLocaleString('ko-KR', { year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : "";
    };

    if (!showMailboxModal) return null;

    return (
        <>
            <div 
                className="modal-overlay fixed inset-0 flex items-center justify-center z-50 p-4"
                onClick={setShowMailboxModal}
            >
                <div 
                    className="modal-content bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col overflow-hidden border border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-white">
                        <h3 className="text-2xl font-extrabold text-gray-900">쪽지함</h3>
                        <button onClick={setShowMailboxModal} className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition">
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div className="px-6 pt-4 bg-white">
                        <div className="flex p-1 bg-gray-100 rounded-xl">
                            <button 
                                onClick={() => setActiveTab('inbox')} 
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'inbox' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                받은 쪽지함
                            </button>
                            <button 
                                onClick={() => setActiveTab('sent')} 
                                className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === 'sent' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                보낸 쪽지함
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-3">
                        {isLoading ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                                <div className="w-8 h-8 border-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
                                <p className="text-sm">로딩 중...</p>
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-3">
                                <i className="far fa-envelope-open text-4xl opacity-50"></i>
                                <p className="text-sm">쪽지가 없습니다.</p>
                            </div>
                        ) : (
                            messages.map(msg => {
                                const partner = activeTab === 'inbox' ? msg.sender : msg.recipient;
                                const partnerIsAdmin = partner?.role === 'super_admin' || partner?.role === 'sub_admin';
                                
                                let recipientNickname = partner?.nickname || '(알수없음)';
                                if (activeTab === 'sent' && msg.isRecipientAnonymous) {
                                    recipientNickname = '익명';
                                }

                                return (
                                    <div key={msg.id} className="group bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${activeTab === 'inbox' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                                                    <i className={`fas fa-${activeTab === 'inbox' ? 'arrow-down' : 'arrow-up'}`}></i>
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-900 text-sm">
                                                            {activeTab === 'inbox' ? `${partner?.nickname || '(알수없음)'}` : `${recipientNickname}`}
                                                        </span>
                                                        <span className="text-xs text-gray-400 font-normal">
                                                            {activeTab === 'inbox' ? '에게서 받음' : '에게 보냄'}
                                                        </span>
                                                    </div>
                                                    {msg.sourcePostTitle && (
                                                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                            <i className="far fa-file-alt"></i> {msg.sourcePostTitle}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-xs text-gray-400 font-medium whitespace-nowrap ml-2 bg-gray-50 px-2 py-1 rounded-md">
                                                {formatDate(msg.createdAt)}
                                            </span>
                                        </div>
                                        
                                        <div className="pl-10">
                                            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            
                                            <div className="flex justify-end gap-3 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {activeTab === 'inbox' && !partnerIsAdmin && (
                                                    <button 
                                                        onClick={() => handleReply(msg)} 
                                                        className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition"
                                                    >
                                                        <i className="fas fa-reply mr-1"></i> 답장
                                                    </button>
                                                )}
                                                <button 
                                                    onClick={() => setMessageToDelete(msg)} 
                                                    className="text-xs font-bold text-red-500 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
                                                >
                                                    <i className="far fa-trash-alt mr-1"></i> 삭제
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    <div className="p-4 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
                        <div className="flex items-center text-gray-400 bg-gray-50 px-3 py-2 rounded-lg w-full sm:w-auto justify-center sm:justify-start">
                            <i className="fas fa-info-circle mr-2"></i>
                            <span>모든 쪽지는 30일 후 자동 삭제됩니다.</span>
                        </div>
                        {messages.length > 0 && (
                            <button 
                                onClick={() => setShowConfirm(true)} 
                                className="text-red-500 hover:text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 w-full sm:w-auto justify-center"
                            >
                                <i className="fas fa-trash"></i>
                                <span>{activeTab === 'inbox' ? '받은 쪽지함 비우기' : '보낸 쪽지함 비우기'}</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
            
            {showConfirm && (<ConfirmModal message={`정말로 '${activeTab === 'inbox' ? '받은' : '보낸'}' 쪽지함을 모두 비우시겠습니까?`} onConfirm={executeClearMailbox} onCancel={() => setShowConfirm(false)} />)}
            {messageToDelete && (<ConfirmModal message="이 쪽지를 삭제하시겠습니까?" onConfirm={() => handleDeleteMessage(messageToDelete.id)} onCancel={() => setMessageToDelete(null)} />)}
        </>
    );
}